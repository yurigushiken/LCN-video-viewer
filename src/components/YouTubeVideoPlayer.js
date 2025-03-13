import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

// Load YouTube API script if it doesn't exist yet
const loadYouTubeAPI = () => {
  return new Promise((resolve) => {
    if (window.YT) {
      resolve(window.YT);
      return;
    }
    
    // Create script tag if it doesn't exist
    if (!document.getElementById('youtube-api')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.id = 'youtube-api';
      
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
    
    // Wait for API to load
    window.onYouTubeIframeAPIReady = () => {
      resolve(window.YT);
    };
  });
};

// YouTubeVideoPlayer component with ref forwarding for controlling playback
const YouTubeVideoPlayer = forwardRef(({
  videoId,
  label = 'Video',
  isLeader = false,
  syncTime = null,
  onTimeUpdate = () => {},
  onPlay = () => {},
  onPause = () => {},
  startTime = 0,
  width = '100%',
  height = 'auto',
}, ref) => {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [isVisible, setIsVisible] = useState(false);
  
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const observerRef = useRef(null);
  const timeUpdateIntervalRef = useRef(null);
  
  // Initialize YouTube player when API is ready
  useEffect(() => {
    let isMounted = true;
    
    const initPlayer = async () => {
      try {
        console.log(`Initializing YouTube player for video ID: ${videoId}`);
        setLoading(true);
        
        // Create a DOM element to host the player
        if (!playerRef.current) {
          playerRef.current = document.createElement('div');
          playerRef.current.id = `youtube-player-${videoId}`;
          if (containerRef.current) {
            containerRef.current.appendChild(playerRef.current);
          }
        }
        
        // Clean up any existing player
        if (playerInstanceRef.current && playerInstanceRef.current.destroy) {
          playerInstanceRef.current.destroy();
          playerInstanceRef.current = null;
        }
        
        const YT = await loadYouTubeAPI();
        
        if (!isMounted) return;
        
        console.log(`YouTube API loaded, creating player for ${videoId}`);
        
        // Create the player instance
        playerInstanceRef.current = new YT.Player(playerRef.current, {
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            rel: 0,
            fs: 1,
            modestbranding: 1,
            start: Math.floor(startTime)
          },
          events: {
            onReady: () => {
              if (isMounted) {
                console.log(`YouTube player ready for ${label} (ID: ${videoId})`);
                setIsReady(true);
                setLoading(false);
                
                // Seek to start time if provided
                if (startTime > 0) {
                  playerInstanceRef.current.seekTo(startTime, true);
                }
              }
            },
            onStateChange: (event) => {
              if (!isMounted) return;
              
              // Update playing state
              setIsPlaying(event.data === YT.PlayerState.PLAYING);
              
              if (isLeader) {
                if (event.data === YT.PlayerState.PLAYING) {
                  onPlay();
                } else if (event.data === YT.PlayerState.PAUSED) {
                  onPause();
                }
              }
            },
            onError: (event) => {
              if (isMounted) {
                console.error(`YouTube player error for ${label}:`, event.data);
                setError(`Error playing video: ${event.data}`);
                setLoading(false);
              }
            }
          }
        });
      } catch (err) {
        if (isMounted) {
          console.error(`Error initializing YouTube player for ${label}:`, err);
          setError(`Failed to initialize player: ${err.message}`);
          setLoading(false);
        }
      }
    };
    
    initPlayer();
    
    return () => {
      isMounted = false;
      
      // Clean up player instance
      if (playerInstanceRef.current && playerInstanceRef.current.destroy) {
        playerInstanceRef.current.destroy();
      }
    };
  }, [videoId, label, isLeader, startTime]);
  
  // Setup intersection observer for visibility tracking
  useEffect(() => {
    if (containerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          setIsVisible(entry.isIntersecting);
        },
        { threshold: 0.5 } // Consider visible when 50% in view
      );
      
      observerRef.current.observe(containerRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);
  
  // Set up interval for leader to broadcast time updates
  useEffect(() => {
    if (isLeader && isReady && isPlaying && playerInstanceRef.current) {
      // Clear any existing interval
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
      
      // Set up new interval for time updates
      timeUpdateIntervalRef.current = setInterval(() => {
        try {
          const currentTime = playerInstanceRef.current.getCurrentTime();
          setCurrentTime(currentTime);
          onTimeUpdate(currentTime);
        } catch (err) {
          console.error(`Error getting current time for ${label}:`, err);
        }
      }, 1000);
    } else {
      // Clear interval if not leader or not playing
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    }
    
    // Clean up on unmount
    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, [isLeader, isReady, isPlaying, label, onTimeUpdate]);
  
  // Handle sync time changes for follower videos
  useEffect(() => {
    if (!isLeader && isReady && syncTime !== null && 
        playerInstanceRef.current && playerInstanceRef.current.seekTo) {
      const playerTime = playerInstanceRef.current.getCurrentTime();
      const timeDiff = Math.abs(playerTime - syncTime);
      
      // Only sync if time difference is significant (> 2 seconds)
      if (timeDiff > 2) {
        console.log(`Syncing ${label} to ${syncTime}s (current: ${playerTime}s, diff: ${timeDiff.toFixed(2)}s)`);
        playerInstanceRef.current.seekTo(syncTime, true);
        setCurrentTime(syncTime);
      }
    }
  }, [syncTime, isLeader, isReady, label]);
  
  // Expose player methods via ref
  useImperativeHandle(ref, () => ({
    play: () => {
      if (isReady && playerInstanceRef.current && playerInstanceRef.current.playVideo) {
        console.log(`Playing ${label}`);
        playerInstanceRef.current.playVideo();
        return Promise.resolve();
      }
      return Promise.reject(new Error('Player not ready'));
    },
    pause: () => {
      if (isReady && playerInstanceRef.current && playerInstanceRef.current.pauseVideo) {
        console.log(`Pausing ${label}`);
        playerInstanceRef.current.pauseVideo();
      }
    },
    seekTo: (time) => {
      if (isReady && playerInstanceRef.current && playerInstanceRef.current.seekTo) {
        console.log(`Seeking ${label} to ${time}s`);
        playerInstanceRef.current.seekTo(time, true);
        setCurrentTime(time);
      }
    },
    getCurrentTime: () => {
      if (isReady && playerInstanceRef.current && playerInstanceRef.current.getCurrentTime) {
        try {
          return playerInstanceRef.current.getCurrentTime();
        } catch (err) {
          console.error(`Error getting current time for ${label}:`, err);
          return currentTime;
        }
      }
      return currentTime;
    },
    getDuration: () => {
      if (isReady && playerInstanceRef.current && playerInstanceRef.current.getDuration) {
        try {
          return playerInstanceRef.current.getDuration();
        } catch (err) {
          console.error(`Error getting duration for ${label}:`, err);
          return 0;
        }
      }
      return 0;
    },
    isPlaying: () => isPlaying,
    isReady: isReady,
    isVisible: isVisible,
    label: label,
    // Method to sync with a timestamp
    syncWith: (timestamp) => {
      if (isReady && playerInstanceRef.current && playerInstanceRef.current.seekTo) {
        console.log(`Syncing ${label} to ${timestamp}s`);
        playerInstanceRef.current.seekTo(timestamp, true);
        setCurrentTime(timestamp);
      }
    }
  }), [isReady, isPlaying, isVisible, label, currentTime]);
  
  return (
    <div 
      className={`youtube-player relative w-full h-full ${isLeader ? 'border-2 border-yellow-500' : ''}`} 
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
    >
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
      
      <div className="video-info absolute bottom-0 left-0 right-0 p-1 bg-black bg-opacity-50 text-white z-10">
        <div className="text-xs">{formatTime(currentTime)}</div>
      </div>
    </div>
  );
});

// Add the helper function at the bottom of the file
const formatTime = (timeInSeconds) => {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
  
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default YouTubeVideoPlayer; 