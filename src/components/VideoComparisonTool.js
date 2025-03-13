import React, { useState, useRef, useEffect } from 'react';

// Add a way to check if running in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Default aspect ratio (16:9) if we don't know the actual video dimensions
const DEFAULT_ASPECT_RATIO = 0.5625; // 9/16

const VideoComparisonTool = () => {
  // State for video library, initialized as empty and loaded from JSON if available
  const [videoLibrary, setVideoLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Track active iframe players
  const [iframePlayers, setIframePlayers] = useState({});
  // Track which player is controlling synchronization
  const [leadPlayer, setLeadPlayer] = useState(null);
  // Track play state for each video
  const [playStates, setPlayStates] = useState({});
  // Track aspect ratios
  const [aspectRatios, setAspectRatios] = useState({});
  // Enable/disable synchronization
  const [syncEnabled, setSyncEnabled] = useState(true);
  // Saved configurations
  const [savedConfigs, setSavedConfigs] = useState([]);
  // Current configuration name
  const [configName, setConfigName] = useState('');
  // Notification message
  const [notification, setNotification] = useState(null);
  
  // Load video library and saved configurations from JSON file
  useEffect(() => {
    setLoading(true);
    
    // Try different approaches to load the JSON file
    const loadData = async () => {
      try {
        // First attempt - use direct import if available
        if (isDevelopment) {
          try {
            // In development, try to dynamically import the file
            const data = await import('../data/video-library.json')
              .then(module => module.default)
              .catch(() => null);
            
            if (data) {
              console.log('Successfully loaded video library via import:', data.length, 'videos');
              setVideoLibrary(data);
              setLoading(false);
              return;
            }
          } catch (err) {
            console.log('Could not import directly, falling back to fetch...', err);
          }
        }
        
        // Second attempt - standard fetch with absolute URL
        const response = await fetch(`${window.location.origin}/data/video-library.json`);
        
        if (!response.ok) {
          throw new Error('Video library not found. Run the Google Drive fetcher script first.');
        }
        
        const data = await response.json();
        console.log('Successfully loaded video library via fetch:', data.length, 'videos');
        console.log('First video data:', data[0]);
        setVideoLibrary(data);
        setLoading(false);
        
        // Try to load saved configurations from localStorage
        try {
          const savedConfigsData = localStorage.getItem('videoConfigurations');
          if (savedConfigsData) {
            const configs = JSON.parse(savedConfigsData);
            setSavedConfigs(configs);
            console.log('Loaded saved configurations:', configs.length);
          }
        } catch (e) {
          console.error('Error loading saved configurations:', e);
        }
      } catch (err) {
        console.error('Error loading video library:', err);
        setError(err.message);
        setLoading(false);
        
        // Fall back to empty library if file not found
        setVideoLibrary([]);
      }
    };
    
    loadData();
  }, []);

  // Save configurations to localStorage when they change
  useEffect(() => {
    if (savedConfigs.length > 0) {
      localStorage.setItem('videoConfigurations', JSON.stringify(savedConfigs));
      console.log('Saved configurations to localStorage');
    }
  }, [savedConfigs]);

  // Save current configuration
  const saveCurrentConfig = () => {
    if (!configName.trim()) {
      alert('Please enter a name for this configuration');
      return;
    }
    
    // Create configuration object with current settings
    const config = {
      id: Date.now(), // Use timestamp as unique ID
      name: configName,
      viewMode,
      slots: viewerSlots.map(video => video ? video.id : null)
    };
    
    // Add to saved configurations
    setSavedConfigs([...savedConfigs, config]);
    setConfigName(''); // Clear input field
  };
  
  // Load a saved configuration
  const loadConfiguration = (config) => {
    // Set view mode
    setViewMode(config.viewMode);
    
    // Load videos into slots
    const newViewerSlots = Array(4).fill(null);
    config.slots.forEach((videoId, index) => {
      if (videoId !== null) {
        const video = videoLibrary.find(v => v.id === videoId);
        if (video) {
          newViewerSlots[index] = video;
        }
      }
    });
    
    setViewerSlots(newViewerSlots);
  };
  
  // Delete a saved configuration
  const deleteConfiguration = (configId) => {
    const newConfigs = savedConfigs.filter(config => config.id !== configId);
    setSavedConfigs(newConfigs);
  };
  
  // View configuration - 1x1, 2x1, 2x2
  const [viewMode, setViewMode] = useState('2x1'); // Default to side-by-side comparison
  
  // Videos currently being displayed in the viewer slots
  const [viewerSlots, setViewerSlots] = useState(Array(4).fill(null));
  
  // Reference for the drop area
  const dropAreaRef = useRef(null);
  
  // Handle drag start
  const handleDragStart = (e, video) => {
    e.dataTransfer.setData('videoId', video.id);
  };
  
  // Handle drop into a slot
  const handleDrop = (e, slotIndex) => {
    e.preventDefault();
    const videoId = parseInt(e.dataTransfer.getData('videoId'));
    const video = videoLibrary.find(v => v.id === videoId);
    
    if (video) {
      const newViewerSlots = [...viewerSlots];
      newViewerSlots[slotIndex] = video;
      setViewerSlots(newViewerSlots);
    }
  };
  
  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  // Remove video from slot
  const handleRemoveVideo = (slotIndex) => {
    const newViewerSlots = [...viewerSlots];
    newViewerSlots[slotIndex] = null;
    setViewerSlots(newViewerSlots);
  };
  
  // Get grid layout based on view mode
  const getGridLayout = () => {
    switch(viewMode) {
      case '1x1': return 'grid-cols-1';
      case '2x1': return 'grid-cols-2';
      case '2x2': return 'grid-cols-2 grid-rows-2';
      default: return 'grid-cols-2';
    }
  };
  
  // Get number of visible slots based on view mode
  const getVisibleSlots = () => {
    switch(viewMode) {
      case '1x1': return 1;
      case '2x1': return 2;
      case '2x2': return 4;
      default: return 2;
    }
  };
  
  // Show notification temporarily
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  
  // Function to play all videos simultaneously
  const playAllVideos = () => {
    const visibleSlots = getVisibleSlots();
    
    // Use a simpler, more direct approach that works with Google Drive
    for (let i = 0; i < visibleSlots; i++) {
      if (!viewerSlots[i]) continue;
      
      const videoFrame = document.getElementById(`video-${i}`);
      if (videoFrame) {
        try {
          // Instead of changing autoplay parameter, completely reload with a different URL format
          // This works better with Google Drive's player
          const video = viewerSlots[i];
          // Use a more reliable URL format for Google Drive
          const directPlayUrl = `https://drive.google.com/file/d/${video.driveFileId}/preview`;
          
          // Log for debugging
          console.log(`Attempting to play video ${i+1} using: ${directPlayUrl}`);
          
          // Replace the iframe src completely
          videoFrame.src = directPlayUrl;
          
          // Also try to focus the iframe to help with autoplay permissions
          try {
            videoFrame.focus();
          } catch (e) {
            console.log('Could not focus iframe:', e);
          }
        } catch (e) {
          console.error(`Error playing video ${i+1}:`, e);
          showNotification(`Error playing video ${i+1}`, 'error');
        }
      }
    }
    
    showNotification('Attempting to play all videos', 'info');
    
    // After a short delay, check if we need to use the direct play method
    setTimeout(() => {
      // If browser autoplay restrictions are preventing playback, show a notification
      showNotification('If videos are not playing, try clicking directly on each video', 'warning');
    }, 3000);
  };
  
  // Function to pause all videos
  const pauseAllVideos = () => {
    const visibleSlots = getVisibleSlots();
    
    for (let i = 0; i < visibleSlots; i++) {
      if (!viewerSlots[i]) continue;
      
      const videoFrame = document.getElementById(`video-${i}`);
      if (videoFrame) {
        try {
          // For Google Drive videos, the most reliable way to "pause" is to reload the iframe
          // without any additional parameters
          const video = viewerSlots[i];
          const pauseUrl = `https://drive.google.com/file/d/${video.driveFileId}/preview`;
          
          // Only reload if necessary
          if (videoFrame.src !== pauseUrl) {
            console.log(`Pausing video ${i+1}`);
            videoFrame.src = pauseUrl;
          }
        } catch (e) {
          console.error(`Error pausing video ${i+1}:`, e);
        }
      }
    }
    
    showNotification('Videos paused', 'info');
  };
  
  // Function to explicitly sync all videos to the selected leader
  const syncAllVideos = (leaderIndex) => {
    if (!syncEnabled) {
      showNotification('Synchronization is disabled. Enable it first.', 'warning');
      return;
    }
    
    if (!viewerSlots[leaderIndex]) {
      showNotification('Cannot sync to empty video slot', 'error');
      return;
    }
    
    setLeadPlayer(leaderIndex);
    showNotification(`Syncing all videos to video ${leaderIndex + 1}`, 'success');
    
    // First, reload all iframes to a known state
    const visibleSlots = getVisibleSlots();
    
    // Show help message first
    showNotification('Click on each video after sync to start playback', 'info');
    
    // Build URLs for synchronization
    const videos = [];
    for (let i = 0; i < visibleSlots; i++) {
      if (!viewerSlots[i]) continue;
      
      const video = viewerSlots[i];
      const videoFrame = document.getElementById(`video-${i}`);
      
      if (videoFrame) {
        try {
          // Reset all frames first
          const baseUrl = `https://drive.google.com/file/d/${video.driveFileId}/preview`;
          videoFrame.src = baseUrl;
          
          if (i === leaderIndex) {
            // Mark this as lead video visually
            videos.push({
              index: i,
              frame: videoFrame,
              isLeader: true
            });
          } else {
            videos.push({
              index: i,
              frame: videoFrame,
              isLeader: false
            });
          }
        } catch (e) {
          console.error(`Error preparing video ${i+1} for sync:`, e);
        }
      }
    }
    
    // After frames are reloaded
    setTimeout(() => {
      showNotification('Videos reset - click on each video to start', 'success');
    }, 1000);
  };
  
  // Function to select a video for a specific slot via dropdown
  const handleVideoSelect = (slotIndex, videoId) => {
    if (videoId === "") {
      // If empty selection, clear the slot
      const newViewerSlots = [...viewerSlots];
      newViewerSlots[slotIndex] = null;
      setViewerSlots(newViewerSlots);
      return;
    }
    
    const video = videoLibrary.find(v => v.id === parseInt(videoId));
    if (video) {
      const newViewerSlots = [...viewerSlots];
      newViewerSlots[slotIndex] = video;
      setViewerSlots(newViewerSlots);
    }
  };
  
  // Handle message events from iframe players
  useEffect(() => {
    const handleMessage = (event) => {
      // Only process messages from Google Drive
      if (!event.origin.includes('drive.google.com')) return;
      
      try {
        // Try to parse the message data
        const data = JSON.parse(event.data);
        
        // Identify which slot this message is from
        let slotIndex = null;
        for (let i = 0; i < 4; i++) {
          const iframe = document.getElementById(`video-${i}`);
          if (iframe && iframe.contentWindow === event.source) {
            slotIndex = i;
            break;
          }
        }
        
        if (slotIndex !== null) {
          console.log(`Message from video-${slotIndex}:`, data);
          
          // Handle play state changes
          if (data.event === 'onStateChange') {
            // Google Drive player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering)
            const newPlayStates = {...playStates};
            newPlayStates[slotIndex] = data.info;
            setPlayStates(newPlayStates);
            
            // If this is the lead player, synchronize others
            if (leadPlayer === slotIndex || leadPlayer === null) {
              setLeadPlayer(slotIndex);
              synchronizeVideos(slotIndex, data.info);
            }
          }
          
          // Handle player ready events
          if (data.event === 'infoDelivery' && data.info && data.info.videoData) {
            // Store the player instance
            const newIframePlayers = {...iframePlayers};
            newIframePlayers[slotIndex] = event.source;
            setIframePlayers(newIframePlayers);
            
            // Get video dimensions if available
            if (data.info.videoData.width && data.info.videoData.height) {
              const ratio = data.info.videoData.height / data.info.videoData.width;
              const newAspectRatios = {...aspectRatios};
              newAspectRatios[slotIndex] = ratio;
              setAspectRatios(newAspectRatios);
            }
          }
        }
      } catch (e) {
        // If we can't parse the message, just ignore it
        console.log('Could not parse iframe message:', e);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [iframePlayers, leadPlayer, playStates, aspectRatios]);
  
  // Function to synchronize all videos with the lead player
  const synchronizeVideos = (leadIndex, state) => {
    if (!syncEnabled) return;
    
    // Get all visible slots
    const visibleSlots = getVisibleSlots();
    
    // Loop through all slots
    for (let i = 0; i < visibleSlots; i++) {
      // Skip the lead player
      if (i === leadIndex) continue;
      
      // Get the iframe player
      const player = iframePlayers[i];
      if (!player) continue;
      
      // Sync play state
      if (state === 1 && playStates[i] !== 1) {
        // If lead is playing but this one isn't, play it
        player.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      } else if (state === 2 && playStates[i] !== 2) {
        // If lead is paused but this one isn't, pause it
        player.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Notification */}
      {notification && (
        <div 
          className={`fixed top-4 right-4 p-3 rounded shadow-lg z-50 ${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'warning' ? 'bg-yellow-500' :
            notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
          } text-white`}
        >
          {notification.message}
        </div>
      )}
      
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Heat Map Video Comparison Tool</h1>
        <div className="flex space-x-2">
          <button 
            className={`px-3 py-1 rounded ${viewMode === '1x1' ? 'bg-white text-blue-600' : 'bg-blue-700'}`}
            onClick={() => setViewMode('1x1')}
          >
            Single View
          </button>
          <button 
            className={`px-3 py-1 rounded ${viewMode === '2x1' ? 'bg-white text-blue-600' : 'bg-blue-700'}`}
            onClick={() => setViewMode('2x1')}
          >
            Side by Side
          </button>
          <button 
            className={`px-3 py-1 rounded ${viewMode === '2x2' ? 'bg-white text-blue-600' : 'bg-blue-700'}`}
            onClick={() => setViewMode('2x2')}
          >
            4-Way View
          </button>
        </div>
      </div>
      
      {/* Saved Configurations */}
      <div className="bg-blue-100 p-2 border-b border-blue-300">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex items-center">
            <input
              type="text"
              placeholder="Configuration name..."
              className="p-1 border rounded mr-2 flex-1 max-w-md"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
            />
            <button 
              className="bg-green-500 text-white rounded px-3 py-1 text-sm"
              onClick={saveCurrentConfig}
            >
              Save Current Layout
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-end">
            <label className="text-sm mr-2">Saved Configurations:</label>
            <select 
              className="p-1 border rounded mr-2"
              onChange={(e) => {
                if (e.target.value) {
                  const config = savedConfigs.find(c => c.id === parseInt(e.target.value));
                  if (config) loadConfiguration(config);
                }
              }}
              value=""
            >
              <option value="">-- Select Configuration --</option>
              {savedConfigs.map(config => (
                <option key={config.id} value={config.id}>{config.name}</option>
              ))}
            </select>
            {savedConfigs.length > 0 && (
              <button 
                className="bg-red-500 text-white rounded px-2 py-1 text-xs"
                onClick={() => {
                  if (window.confirm('Delete all saved configurations?')) {
                    setSavedConfigs([]);
                    localStorage.removeItem('videoConfigurations');
                  }
                }}
              >
                Clear All
              </button>
            )}
          </div>
        </div>
        
        {savedConfigs.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {savedConfigs.map(config => (
              <div key={config.id} className="bg-white rounded border px-2 py-1 flex items-center text-sm">
                <span className="mr-2">{config.name}</span>
                <button 
                  className="bg-blue-500 text-white rounded-sm px-1 text-xs mr-1"
                  onClick={() => loadConfiguration(config)}
                >
                  Load
                </button>
                <button 
                  className="bg-red-500 text-white rounded-sm px-1 text-xs"
                  onClick={() => deleteConfiguration(config.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Playback controls */}
      <div className="bg-gray-300 p-2 flex items-center justify-center space-x-4">
        <div className="flex items-center">
          <button 
            className="bg-blue-500 text-white rounded px-4 py-1 mr-2"
            onClick={playAllVideos}
          >
            Play All
          </button>
          <button 
            className="bg-blue-500 text-white rounded px-4 py-1"
            onClick={pauseAllVideos}
          >
            Pause All
          </button>
        </div>
        
        <div className="flex items-center">
          <label className="mr-2 text-sm">Sync Videos:</label>
          <input 
            type="checkbox" 
            checked={syncEnabled} 
            onChange={() => setSyncEnabled(!syncEnabled)}
            className="mr-1"
          />
          <span className={`text-xs font-medium ${syncEnabled ? 'text-green-600' : 'text-red-600'}`}>
            {syncEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>
      
      {/* Video selector dropdowns */}
      <div className="bg-gray-200 p-2 grid grid-cols-2 gap-2">
        {viewerSlots.slice(0, getVisibleSlots()).map((video, index) => (
          <div key={`selector-${index}`} className="flex items-center">
            <label className="text-sm font-medium mr-2">Video {index + 1}:</label>
            <select 
              className="flex-1 p-1 border rounded"
              value={video ? video.id : ""}
              onChange={(e) => handleVideoSelect(index, e.target.value)}
            >
              <option value="">-- Select a video --</option>
              {videoLibrary.map(v => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
            {video && (
              <button 
                className="ml-2 bg-blue-500 text-white text-xs rounded px-2 py-1"
                onClick={() => syncAllVideos(index)}
              >
                Sync to this
              </button>
            )}
          </div>
        ))}
      </div>
      
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video library panel */}
        <div className="w-72 bg-gray-200 p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Video Library</h2>
          
          {loading ? (
            <div className="text-center py-4">
              <p>Loading video library...</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p className="font-bold">Error</p>
              <p className="text-sm">{error}</p>
              <p className="text-sm mt-2">Run the Google Drive fetcher script:</p>
              <code className="block bg-gray-100 p-2 mt-1 text-xs">
                node scripts/google-drive-fetcher.js YOUR_FOLDER_ID
              </code>
            </div>
          ) : videoLibrary.length === 0 ? (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
              <p className="font-bold">No Videos Found</p>
              <p className="text-sm">No videos were found in the library. Run the Google Drive fetcher script with a valid folder ID to populate the library.</p>
              <code className="block bg-gray-100 p-2 mt-1 text-xs">
                node scripts/google-drive-fetcher.js YOUR_FOLDER_ID
              </code>
            </div>
          ) : (
            <>
              <p className="text-sm mb-4">Drag videos to viewing area</p>
              <div className="space-y-4">
                {videoLibrary.map(video => (
                  <div 
                    key={video.id}
                    className="bg-white p-2 rounded shadow cursor-move"
                    draggable
                    onDragStart={(e) => handleDragStart(e, video)}
                  >
                    <div className="bg-gray-300 h-24 mb-2 flex items-center justify-center relative thumbnail-container">
                      <img 
                        src={video.thumbnail} 
                        alt={video.label} 
                        className="w-full h-full object-cover" 
                        style={{ backgroundColor: "#2c3e50" }}
                        onLoad={(e) => {
                          // Remove error class if previously set
                          e.target.parentNode.classList.remove('error');
                          console.log(`Successfully loaded thumbnail for ${video.label}`);
                        }}
                        onError={(e) => {
                          console.error(`Failed to load thumbnail for ${video.label}`, e);
                          // Add error class to parent container
                          e.target.parentNode.classList.add('error');
                          // Only fallback to default thumbnail once to prevent loops
                          if (!e.target.src.includes('video-thumbnail.svg')) {
                            e.target.onerror = null;
                            e.target.src = '/thumbnails/video-thumbnail.svg';
                          }
                        }}
                      />
                      <div className="text-sm font-medium text-center bg-black bg-opacity-75 text-white p-1 absolute bottom-0 left-0 right-0">
                        {video.label}
                      </div>
                    </div>
                    <p className="text-sm font-medium truncate">{video.label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        
        {/* Video viewing area */}
        <div className="flex-1 p-4 overflow-auto" ref={dropAreaRef}>
          <div className={`grid ${getGridLayout()} gap-4 h-full`}>
            {viewerSlots.slice(0, getVisibleSlots()).map((video, index) => (
              <div 
                key={index}
                className="bg-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden"
                onDrop={(e) => handleDrop(e, index)}
                onDragOver={handleDragOver}
              >
                {video ? (
                  <div className="w-full h-full p-2">
                    <div 
                      className="relative w-full h-full video-container"
                      style={{ 
                        aspectRatio: aspectRatios[index] ? `1 / ${aspectRatios[index]}` : '16 / 9',
                        maxHeight: '100%'
                      }}
                    >
                      {/* Using iframe for Google Drive embedding which is more reliable */}
                      <iframe
                        id={`video-${index}`}
                        className="w-full h-full bg-black"
                        src={`https://drive.google.com/file/d/${video.driveFileId}/preview`}
                        allowFullScreen
                        allow="autoplay; encrypted-media"
                        frameBorder="0"
                        onLoad={() => {
                          console.log(`Video ${index+1} loaded: ${video.label}`);
                        }}
                        onError={(e) => {
                          console.error(`Failed to load video ${video.label}`, e);
                          showNotification(`Failed to load video: ${video.label}`, 'error');
                        }}
                      ></iframe>
                      
                      {/* Leader indicator if this is the lead player */}
                      {leadPlayer === index && syncEnabled && (
                        <div className="absolute top-4 right-4 z-10 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                          Lead Player
                        </div>
                      )}
                      
                      <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                        {/* Add alternative video links for fallback */}
                        <a href={`https://drive.google.com/file/d/${video.driveFileId}/view`} target="_blank" rel="noopener noreferrer" className="underline mr-2">
                          Open in Drive
                        </a>
                      </div>
                      
                      <div className="absolute top-2 right-2 flex space-x-2">
                        <button 
                          className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
                          onClick={() => handleRemoveVideo(index)}
                        >
                          ×
                        </button>
                      </div>
                      
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded">
                        <span className="font-bold mr-1">{index + 1}:</span> {video.label}
                      </div>
                      
                      {/* Manual play button for direct user interaction */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button 
                          className="bg-blue-500 bg-opacity-70 text-white rounded-full w-16 h-16 flex items-center justify-center"
                          title="Click to play this video"
                          onClick={() => {
                            // Trigger a direct user interaction with this video
                            const videoFrame = document.getElementById(`video-${index}`);
                            if (videoFrame) {
                              try {
                                // Display a click trap that simulates a click in the iframe
                                showNotification(`Click inside the video to play`, 'info');
                                
                                // Just reload the iframe - the user will need to click manually
                                // This is more reliable than trying to automate playback
                                const reloadUrl = `https://drive.google.com/file/d/${video.driveFileId}/preview`;
                                if (videoFrame.src !== reloadUrl) {
                                  videoFrame.src = reloadUrl;
                                }
                                
                                // Try to focus the iframe to help with user interaction
                                try {
                                  videoFrame.focus();
                                } catch (e) {
                                  console.log('Could not focus iframe:', e);
                                }
                              } catch (e) {
                                console.error(`Error with direct play for video ${index+1}:`, e);
                              }
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400 text-center p-4">
                    <p className="mb-2">Video {index + 1}</p>
                    <p>Drop video here or use selector above</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Instructions footer */}
      <div className="bg-gray-200 p-2 text-sm text-center border-t">
        <p>Use dropdowns to select videos • Drag videos from library • Toggle sync for synchronized playback • "Sync to this" makes a video the leader</p>
      </div>
    </div>
  );
};

export default VideoComparisonTool; 