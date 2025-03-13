import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { getVideoUrl } from '../utils/googleDriveUtils';

// SyncedVideoPlayer component with ref forwarding
const SyncedVideoPlayer = forwardRef(({
  fileId,
  label = 'Video',
  isLeader = false,
  syncTime = null,
  onTimeUpdate = () => {},
  onPlay = () => {},
  onPause = () => {},
  startTime = 0,
}, ref) => {
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef(null);
  const iframeRef = useRef(null);
  const observerRef = useRef(null);
  const lastSyncTime = useRef(startTime);
  const playerLoadedPromise = useRef(null);
  const messageIdCounter = useRef(0);
  
  // Create a promise to track when the player is ready
  useEffect(() => {
    playerLoadedPromise.current = new Promise((resolve) => {
      // Store the resolve function to call when ready
      playerLoadedPromise.resolver = resolve;
    });
    
    return () => {
      // Reset the promise on unmount
      playerLoadedPromise.current = null;
    };
  }, [fileId]);
  
  // Setup intersection observer for visibility tracking
  useEffect(() => {
    if (iframeRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          setIsVisible(entry.isIntersecting);
        },
        { threshold: 0.5 } // Consider visible when 50% in view
      );
      
      observerRef.current.observe(iframeRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isReady]);
  
  // Expose methods and properties to parent via ref
  useImperativeHandle(ref, () => ({
    play: () => {
      console.log(`Play request received for ${label}`);
      // Try to send play command via postMessage
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          sendPlayerCommand('playVideo');
          lastSyncTime.current = Date.now() / 1000; // Mark the time when play was requested
          return Promise.resolve();
        } catch (e) {
          console.warn(`Failed to send play command to ${label}:`, e);
        }
      }
      return Promise.resolve(); // Always resolve for consistent behavior
    },
    pause: () => {
      console.log(`Pause request received for ${label}`);
      // Try to send pause command via postMessage
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          sendPlayerCommand('pauseVideo');
        } catch (e) {
          console.warn(`Failed to send pause command to ${label}:`, e);
        }
      }
    },
    seekTo: (time) => {
      console.log(`Seek request received for ${label} to ${time}s`);
      lastSyncTime.current = time;
      
      // Try to send seek command via postMessage
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          const queryParams = new URLSearchParams(videoUrl.split('?')[1] || '');
          // Update the URL with the start parameter
          const baseUrl = videoUrl.split('?')[0];
          queryParams.set('start', Math.floor(time));
          
          // Reload iframe with the new URL
          const newUrl = `${baseUrl}?${queryParams.toString()}`;
          iframeRef.current.src = newUrl;
          
          // After reload we need to reset ready state
          setIsReady(false);
          setTimeout(() => setIsReady(true), 1000);
        } catch (e) {
          console.warn(`Failed to seek ${label}:`, e);
        }
      }
    },
    getCurrentTime: () => {
      console.log(`Current time request for ${label}`);
      return lastSyncTime.current || 0;
    },
    getDuration: () => {
      return 0; // We can't get duration from iframe players
    },
    isPlaying: () => {
      return false; // We can't determine play state from iframe players
    },
    // Note for embedded players, many operations are not possible directly
    isVideoElement: false,
    isReady: isReady,
    isVisible: isVisible,
    // Method to wait until player is ready
    waitUntilReady: () => playerLoadedPromise.current,
    // Label for better debugging
    label: label,
    // Method to sync with a timestamp
    syncWith: (timestamp) => {
      if (iframeRef.current) {
        const currentParams = new URLSearchParams(iframeRef.current.src.split('?')[1] || '');
        const baseUrl = iframeRef.current.src.split('?')[0];
        currentParams.set('start', Math.floor(timestamp));
        iframeRef.current.src = `${baseUrl}?${currentParams.toString()}`;
        lastSyncTime.current = timestamp;
        console.log(`Synced ${label} to ${timestamp}s`);
      }
    }
  }), [isReady, label, isVisible, videoUrl]);
  
  // Helper function to send commands to the iframe
  const sendPlayerCommand = (command, params = {}) => {
    const messageId = messageIdCounter.current++;
    const message = {
      command,
      messageId,
      params,
      target: 'drive-player'
    };
    
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify(message), '*');
      console.log(`Sent ${command} to ${label} (msg ID: ${messageId})`);
    }
  };
  
  // Load video URL when fileId changes
  useEffect(() => {
    if (!fileId) {
      setLoading(false);
      setVideoUrl(null);
      setError(null);
      return;
    }
    
    setLoading(true);
    setIsReady(false);
    setError(null);
    
    // Get streaming URL with optional start time
    getVideoUrl(fileId, false)
      .then(url => {
        console.log(`Streaming URL retrieved for ${label}:`, url);
        
        // Add start time parameter if provided
        if (startTime > 0) {
          const urlObj = new URL(url);
          urlObj.searchParams.set('start', Math.floor(startTime));
          url = urlObj.toString();
          lastSyncTime.current = startTime;
        }
        
        setVideoUrl(url);
        setLoading(false);
        
        // Mark as ready soon after URL is set
        setTimeout(() => {
          setIsReady(true);
          if (playerLoadedPromise.resolver) {
            playerLoadedPromise.resolver(true);
          }
        }, 1500);
      })
      .catch(err => {
        console.error(`Error loading video ${label}:`, err);
        setError(`Failed to load video: ${err.message}`);
        setLoading(false);
      });
  }, [fileId, label, startTime]);
  
  // Monitor syncTime changes
  useEffect(() => {
    if (syncTime !== null && syncTime !== lastSyncTime.current && !isLeader && isReady) {
      console.log(`${label} received sync time: ${syncTime}`);
      
      // Only apply sync if difference is significant (>2 seconds)
      // This prevents constant reloading
      if (Math.abs(syncTime - lastSyncTime.current) > 2) {
        // Update our iframe with the new start time
        const baseUrl = videoUrl?.split('?')[0];
        if (baseUrl) {
          const params = new URLSearchParams();
          params.set('start', Math.floor(syncTime));
          const newUrl = `${baseUrl}?${params.toString()}`;
          
          if (iframeRef.current) {
            console.log(`Reloading ${label} iframe with sync time: ${syncTime}s`);
            iframeRef.current.src = newUrl;
            lastSyncTime.current = syncTime;
          }
        }
      }
    }
  }, [syncTime, isLeader, isReady, label, videoUrl]);
  
  // Handle iframe load event
  const handleIframeLoad = () => {
    console.log(`Iframe for ${label} loaded`);
    setIsReady(true);
    lastSyncTime.current = startTime > 0 ? startTime : 0;
    
    if (playerLoadedPromise.resolver) {
      playerLoadedPromise.resolver(true);
    }
  };
  
  // Send periodic heartbeat to leader if this is leader
  useEffect(() => {
    let heartbeatInterval = null;
    
    if (isLeader && isReady && isVisible) {
      heartbeatInterval = setInterval(() => {
        // As leader, we increment our estimated time and broadcast it
        const estimatedTime = lastSyncTime.current + 1; // Increment by 1 second
        lastSyncTime.current = estimatedTime;
        onTimeUpdate(estimatedTime);
        console.log(`Leader heartbeat: ${estimatedTime}s`);
      }, 1000);
    }
    
    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    };
  }, [isLeader, isReady, isVisible, onTimeUpdate]);
  
  // Render the component - using iframe for streaming
  return (
    <div className={`video-player relative ${isLeader ? 'border-2 border-yellow-500' : ''}`}>
      {loading && (
        <div className="loading-overlay absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-75 z-10">
          <div className="text-center">
            <div className="spinner mb-2 w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p>Loading video...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="error-overlay absolute inset-0 flex items-center justify-center bg-red-100 p-4 z-10">
          <div className="text-center text-red-600">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}
      
      <div className="video-container relative">
        {!loading && !error && videoUrl && (
          <iframe
            ref={iframeRef}
            src={videoUrl}
            className="w-full aspect-video"
            title={label}
            frameBorder="0"
            allowFullScreen
            onLoad={handleIframeLoad}
          />
        )}
      </div>
      
      <div className="video-info bg-gray-100 p-2">
        <div className="flex justify-between items-center">
          <div className="video-label font-medium text-gray-800 truncate">{label}</div>
          <div className="video-status flex items-center">
            {isLeader && (
              <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded mr-2">
                Leader
              </span>
            )}
            {isVisible && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded mr-2">
                Visible
              </span>
            )}
            {isReady && (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                Ready
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="player-note text-xs text-gray-500 text-center mt-1">
        Streaming via Google Drive
      </div>
    </div>
  );
});

export default SyncedVideoPlayer; 