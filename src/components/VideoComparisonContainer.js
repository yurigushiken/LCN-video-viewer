import React, { useState, useEffect, useRef } from 'react';
// import SyncedVideoPlayer from './SyncedVideoPlayer'; // Unused import
import YouTubeVideoPlayer from './YouTubeVideoPlayer';
import { loadYouTubeVideos, formatTime } from '../utils/youtubeUtils';

// Get API key from environment
// const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || ''; // Unused variable

const VideoComparisonContainer = ({ 
  videoLibrary = [],
  initialLayout = '2x2',
  onLayoutChange = () => {}
}) => {
  const [leaderIndex, setLeaderIndex] = useState(0);
  const [syncTime, setSyncTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState(initialLayout);
  const [notification, setNotification] = useState(null);
  const [viewerSlots, setViewerSlots] = useState(Array(4).fill(null));
  const [globalStartTime] = useState(0); // Removed unused setGlobalStartTime
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const playerRefs = useRef([]);
  // const syncIntervalRef = useRef(null); // Unused ref
  const firstVideoIndexRef = useRef(0);
  const lastSyncActionRef = useRef(Date.now());
  
  // Load YouTube videos
  useEffect(() => {
    const fetchYouTubeVideos = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        console.log('Starting to load YouTube videos');
        
        const videos = await loadYouTubeVideos();
        console.log('YouTube videos loaded:', videos);
        
        if (videos && videos.length > 0) {
          setYoutubeVideos(videos);
          console.log('Set YouTube videos state with', videos.length, 'videos');
        } else {
          console.error('No YouTube videos found or empty array returned');
          setLoadError('No YouTube videos found. Please check network tab for details.');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading YouTube videos:', error);
        setLoadError(`Failed to load YouTube videos: ${error.message}`);
        setLoading(false);
      }
    };
    
    fetchYouTubeVideos();
  }, []);
  
  // Debug player references
  useEffect(() => {
    console.log("Player references updated:", 
      playerRefs.current.map((ref, i) => ({
        slot: i,
        hasRef: !!ref,
        isReady: ref?.isReady || false
      }))
    );
  }, [viewerSlots]);
  
  // Calculate grid layout based on view mode
  const getGridLayout = () => {
    switch(viewMode) {
      case '1x1': return 'grid-cols-1';
      case '1x2': return 'grid-cols-1 md:grid-cols-2';
      case '2x1': return 'grid-cols-1 md:grid-cols-2';
      case '2x2': return 'grid-cols-1 md:grid-cols-2';
      case '2x3': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case '3x2': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      default: return 'grid-cols-1 md:grid-cols-2';
    }
  };
  
  // Get number of visible slots based on view mode
  const getVisibleSlots = () => {
    switch(viewMode) {
      case '1x1': return 1;
      case '1x2': return 2;
      case '2x1': return 2;
      case '2x2': return 4;
      case '2x3': return 6;
      case '3x2': return 6;
      default: return 4;
    }
  };
  
  // Show notification temporarily
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  
  // Handle drag start
  const handleDragStart = (e, video) => {
    e.dataTransfer.setData('videoId', video.id.toString());
  };
  
  // Handle drop
  const handleDrop = (e, slotIndex) => {
    e.preventDefault();
    const videoId = e.dataTransfer.getData('videoId');
    const video = youtubeVideos.find(v => v.id.toString() === videoId);
    
    if (video) {
      const newViewerSlots = [...viewerSlots];
      newViewerSlots[slotIndex] = video;
      setViewerSlots(newViewerSlots);
      showNotification(`Added ${video.title || video.id} to slot ${slotIndex + 1}`, 'success');
    }
  };
  
  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  // Handle removing a video from a slot
  const handleRemoveVideo = (slotIndex) => {
    if (viewerSlots[slotIndex]) {
      const newViewerSlots = [...viewerSlots];
      newViewerSlots[slotIndex] = null;
      setViewerSlots(newViewerSlots);
      
      // If we removed the leader, set a new leader
      if (slotIndex === leaderIndex) {
        for (let i = 0; i < newViewerSlots.length; i++) {
          if (newViewerSlots[i]) {
            setLeaderIndex(i);
            showNotification(`Set slot ${i + 1} as new leader`, 'info');
            break;
          }
        }
      }
    }
  };
  
  // Handle layout change
  const handleLayoutChange = (newLayout) => {
    setViewMode(newLayout);
    onLayoutChange(newLayout);
  };
  
  // Set a new leader
  const setAsLeader = (slotIndex) => {
    if (viewerSlots[slotIndex]) {
      setLeaderIndex(slotIndex);
      showNotification(`Set slot ${slotIndex + 1} as leader`, 'success');
    }
  };
  
  // Time update handler from leader video
  const handleTimeUpdate = (time) => {
    // Only update syncTime if it's significantly different
    // This prevents constant small updates
    const timeDiff = Math.abs(time - syncTime);
    if (timeDiff > 1.5) {
      console.log(`Updated sync time to ${time}s (diff: ${timeDiff})`);
      setSyncTime(time);
      lastSyncActionRef.current = Date.now();
    }
  };
  
  // Sync all videos to a specific time
  const syncAllToTime = (targetTime) => {
    const visibleSlotsCount = getVisibleSlots();
    let syncedCount = 0;
    
    console.log(`Syncing all videos to time: ${targetTime}s`);
    
    // Apply sync to all videos
    for (let i = 0; i < visibleSlotsCount; i++) {
      if (viewerSlots[i] && playerRefs.current[i] && playerRefs.current[i].isReady) {
        try {
          playerRefs.current[i].seekTo(targetTime);
          syncedCount++;
        } catch (err) {
          console.error(`Error syncing video ${i}:`, err);
        }
      }
    }
    
    setSyncTime(targetTime);
    showNotification(`Synchronized ${syncedCount} videos to ${formatTime(targetTime)}`, 'success');
    lastSyncActionRef.current = Date.now();
  };
  
  // Sync all videos to the current leader's time
  const syncAllToLeader = () => {
    if (!viewerSlots[leaderIndex] || !playerRefs.current[leaderIndex]) {
      showNotification('Leader video not available', 'error');
      return;
    }
    
    const leaderTime = playerRefs.current[leaderIndex].getCurrentTime() || 0;
    syncAllToTime(leaderTime);
  };
  
  // Play all videos
  const playAll = () => {
    const visibleSlotsCount = getVisibleSlots();
    let playedCount = 0;
    
    for (let i = 0; i < visibleSlotsCount; i++) {
      if (viewerSlots[i] && playerRefs.current[i] && playerRefs.current[i].isReady) {
        try {
          playerRefs.current[i].play();
          playedCount++;
        } catch (err) {
          console.error(`Error playing video ${i}:`, err);
        }
      }
    }
    
    setIsPlaying(true);
    showNotification(`Playing ${playedCount} videos`, 'success');
  };
  
  // Pause all videos
  const pauseAll = () => {
    const visibleSlotsCount = getVisibleSlots();
    let pausedCount = 0;
    
    for (let i = 0; i < visibleSlotsCount; i++) {
      if (viewerSlots[i] && playerRefs.current[i] && playerRefs.current[i].isReady) {
        try {
          playerRefs.current[i].pause();
          pausedCount++;
        } catch (err) {
          console.error(`Error pausing video ${i}:`, err);
        }
      }
    }
    
    setIsPlaying(false);
    showNotification(`Paused ${pausedCount} videos`, 'info');
  };
  
  // Handle master scrub control
  const handleMasterScrub = (e) => {
    const scrubValue = parseFloat(e.target.value);
    syncAllToTime(scrubValue);
  };
  
  // Get maximum duration from all videos
  const getMaxDuration = () => {
    let maxDuration = 0;
    
    for (let i = 0; i < viewerSlots.length; i++) {
      if (viewerSlots[i] && playerRefs.current[i] && playerRefs.current[i].isReady) {
        try {
          const duration = playerRefs.current[i].getDuration() || 0;
          if (duration > maxDuration) {
            maxDuration = duration;
          }
        } catch (err) {
          console.error(`Error getting duration for video ${i}:`, err);
        }
      }
    }
    
    return maxDuration;
  };
  
  // Update leader index when viewer slots change
  useEffect(() => {
    // If the current leader slot is empty, find the first non-empty slot to be the leader
    if (!viewerSlots[leaderIndex]) {
      for (let i = 0; i < viewerSlots.length; i++) {
        if (viewerSlots[i]) {
          setLeaderIndex(i);
          break;
        }
      }
    }
  }, [viewerSlots, leaderIndex]);
  
  // Reset all videos to 0
  const resetAll = () => {
    syncAllToTime(0);
    showNotification('Reset all videos to beginning', 'info');
  };
  
  // Handle video selection from dropdown
  const handleVideoSelect = (slotIndex, videoId) => {
    if (!videoId) {
      // If empty option selected, remove video from slot
      handleRemoveVideo(slotIndex);
      return;
    }
    
    const video = youtubeVideos.find(v => v.id.toString() === videoId.toString());
    if (video) {
      console.log(`Selected video for slot ${slotIndex}:`, video);
      
      // Check if video has a valid YouTube videoId
      if (!video.videoId) {
        console.error(`No YouTube videoId found for selected video: ${video.title || video.id}`);
        showNotification(`Error: No YouTube ID for selected video. Please check data.`, 'error');
        return;
      }
      
      // Update viewer slots
      const newViewerSlots = [...viewerSlots];
      newViewerSlots[slotIndex] = video;
      setViewerSlots(newViewerSlots);
      showNotification(`Added ${video.title || video.id} to slot ${slotIndex + 1}`, 'success');
      
      console.log(`Updated viewer slots:`, newViewerSlots);
    } else {
      console.error(`No video found with ID: ${videoId}`);
      showNotification('Video not found', 'error');
    }
  };
  
  // Toggle between play and pause
  const togglePlayPause = () => {
    if (isPlaying) {
      pauseAll();
    } else {
      playAll();
    }
  };
  
  // Frame-by-frame navigation
  const stepFrame = (forward = true) => {
    const visibleSlotsCount = getVisibleSlots();
    const frameTime = 1/30; // Assuming 30fps
    let frameSteppedCount = 0;
    
    // First ensure all videos are paused
    pauseAll();
    
    // Then move each video forward/backward by one frame
    for (let i = 0; i < visibleSlotsCount; i++) {
      if (viewerSlots[i] && playerRefs.current[i] && playerRefs.current[i].isReady) {
        try {
          const currentTime = playerRefs.current[i].getCurrentTime();
          const newTime = forward ? currentTime + frameTime : Math.max(0, currentTime - frameTime);
          playerRefs.current[i].seekTo(newTime);
          frameSteppedCount++;
        } catch (err) {
          console.error(`Error stepping frame for video ${i}:`, err);
        }
      }
    }
    
    // Update the sync time
    const leaderTime = playerRefs.current[leaderIndex]?.getCurrentTime() || 0;
    setSyncTime(leaderTime);
    
    showNotification(`Stepped ${forward ? 'forward' : 'backward'} one frame for ${frameSteppedCount} videos`, 'info');
  };
  
  // Jump to a specific frame
  const jumpToFrame = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const frameNumber = parseInt(formData.get('frameNumber') || 0);
    
    if (isNaN(frameNumber) || frameNumber < 0) {
      showNotification('Please enter a valid frame number', 'error');
      return;
    }
    
    const frameTime = 1/30; // Assuming 30fps
    const targetTime = frameNumber * frameTime;
    
    // First ensure all videos are paused
    pauseAll();
    
    // Then sync to the specific frame time
    syncAllToTime(targetTime);
    showNotification(`Jumped to frame ${frameNumber}`, 'success');
    
    e.target.reset();
  };
  
  // Controls and layout for time control panel
  const timeControlPanel = (
    <div className="time-control-panel mb-4 p-3 bg-gray-100 rounded-lg shadow">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center mb-3 md:mb-0">
            <div className="text-sm font-medium mr-4">Leader: {viewerSlots[leaderIndex]?.title || 'None'}</div>
            <div className="text-sm">Current Time: {formatTime(syncTime)}</div>
          </div>
        </div>

        {/* Master controls section */}
        <div className="border-t pt-3 mt-2">
          <h3 className="font-medium text-sm mb-2">Master Controls</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center space-x-2">
              <button
                className={`${isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white px-5 py-2 rounded text-sm`}
                onClick={togglePlayPause}
              >
                {isPlaying ? 'Pause All' : 'Play All'}
              </button>
              
              <button
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm"
                onClick={() => stepFrame(false)}
                title="Step backward one frame"
              >
                ⏮ Frame
              </button>
              
              <button
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm"
                onClick={() => stepFrame(true)}
                title="Step forward one frame"
              >
                Frame ⏭
              </button>
              
              <button 
                className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm"
                onClick={syncAllToLeader}
              >
                Sync Now
              </button>
              
              <button 
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm"
                onClick={resetAll}
              >
                Reset All
              </button>
            </div>
            
            <div className="flex-1 flex items-center px-2">
              <span className="text-xs mr-2 whitespace-nowrap">Scrub All: </span>
              <input
                type="range"
                min="0"
                max={getMaxDuration() * 30} // Multiply by frame rate (30fps)
                value={syncTime * 30} // Convert time to frames
                onChange={(e) => {
                  const frameValue = parseFloat(e.target.value);
                  const timeValue = frameValue / 30; // Convert frames back to time
                  syncAllToTime(timeValue);
                }}
                className="w-full"
                step="1" // Step by 1 frame
              />
              <span className="text-xs ml-2">{formatTime(syncTime)} (Frame: {Math.round(syncTime * 30)})</span>
            </div>
            
            <div className="w-full mt-2">
              <form 
                onSubmit={jumpToFrame}
                className="flex items-center"
              >
                <div className="flex items-center">
                  <span className="text-xs mr-2">Jump To Frame:</span>
                  <input 
                    type="number" 
                    name="frameNumber" 
                    min="0" 
                    className="w-20 px-2 py-1 border rounded mr-2 text-sm" 
                    placeholder="frame #"
                  />
                  <button 
                    type="submit" 
                    className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm"
                  >
                    Jump
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Just before the return statement, add this debug section
  const debugSection = (
    <div className="mb-8 p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-2">Debug Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium">YouTube Videos:</h4>
          <p>Count: {youtubeVideos.length}</p>
          <p>Loading: {loading ? 'Yes' : 'No'}</p>
          {loadError && <p className="text-red-500">Error: {loadError}</p>}
          <p>Public URL: {process.env.PUBLIC_URL || '(not set)'}</p>
        </div>
        <div>
          <h4 className="font-medium">First 3 Videos:</h4>
          <ul className="text-xs">
            {youtubeVideos.slice(0, 3).map(video => (
              <li key={video.id} className="mb-1">
                ID: {video.id}, VideoId: {video.videoId}, Title: {video.title}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="video-comparison-container p-4 max-w-full overflow-y-auto" style={{ maxHeight: '100vh', overflowY: 'auto' }}>
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
      
      {/* Debug section */}
      {debugSection}
      
      {/* Time control panel */}
      {timeControlPanel}
      
      {/* Layout controls */}
      <div className="mb-4 flex flex-col md:flex-row space-y-2 md:space-y-0 md:justify-between md:items-center">
        <div className="flex space-x-2">
          <button 
            className={`px-3 py-1 rounded ${viewMode === '1x1' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => handleLayoutChange('1x1')}
          >
            1×1
          </button>
          <button 
            className={`px-3 py-1 rounded ${viewMode === '1x2' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => handleLayoutChange('1x2')}
          >
            1×2
          </button>
          <button 
            className={`px-3 py-1 rounded ${viewMode === '2x2' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => handleLayoutChange('2x2')}
          >
            2×2
          </button>
          <button 
            className={`px-3 py-1 rounded ${viewMode === '2x3' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => handleLayoutChange('2x3')}
          >
            2×3
          </button>
        </div>
        
        <div className="text-xs bg-gray-100 p-2 rounded">
          <span className="font-bold mr-1">Debug:</span>
          First Video Index: {firstVideoIndexRef.current},
          Leader Index: {leaderIndex}
        </div>
      </div>
      
      {/* Video selection dropdowns */}
      <div className={`mb-4 grid ${getGridLayout()} gap-2`}>
        {Array(getVisibleSlots()).fill(null).map((_, slotIndex) => (
          <div key={`selector-${slotIndex}`} className="flex items-center bg-gray-100 p-2 rounded">
            <label className="text-sm font-medium mr-2">Slot {slotIndex + 1}:</label>
            <select 
              className="flex-1 p-1 border rounded text-sm"
              value={viewerSlots[slotIndex] ? viewerSlots[slotIndex].id : ""}
              onChange={(e) => handleVideoSelect(slotIndex, e.target.value)}
            >
              <option value="">-- Select a video --</option>
              {youtubeVideos.map(video => (
                <option key={video.id} value={video.id}>
                  {video.title}
                </option>
              ))}
            </select>
            {viewerSlots[slotIndex] && (
              <button
                className="ml-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded px-2 py-1"
                onClick={() => setAsLeader(slotIndex)}
                disabled={slotIndex === leaderIndex}
              >
                {slotIndex === leaderIndex ? 'Leader' : 'Set as Leader'}
              </button>
            )}
          </div>
        ))}
      </div>
      
      {/* Video grid */}
      <div className={`grid ${getGridLayout()} gap-4 mb-6`}>
        {Array(getVisibleSlots()).fill(null).map((_, slotIndex) => (
          <div 
            key={slotIndex}
            className="video-slot border rounded-lg overflow-hidden shadow-md bg-white"
            onDrop={(e) => handleDrop(e, slotIndex)}
            onDragOver={handleDragOver}
          >
            {viewerSlots[slotIndex] ? (
              <div className="video-container flex flex-col h-full">
                <div className="flex-grow relative" style={{ paddingBottom: '56.25%' }}>
                  <YouTubeVideoPlayer
                    videoId={viewerSlots[slotIndex].videoId}
                    label={viewerSlots[slotIndex].title || `Video ${slotIndex + 1}`}
                    isLeader={slotIndex === leaderIndex}
                    onTimeUpdate={slotIndex === leaderIndex ? handleTimeUpdate : undefined}
                    syncTime={slotIndex !== leaderIndex ? syncTime : null}
                    startTime={globalStartTime}
                    ref={el => {
                      // Store reference to player component
                      playerRefs.current[slotIndex] = el;
                    }}
                  />
                </div>
                
                <div className="video-controls p-2 bg-gray-100 flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-2 truncate max-w-[150px]">
                      {slotIndex === leaderIndex ? '👑 ' : ''}{viewerSlots[slotIndex].title || `Video ${slotIndex + 1}`}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    {slotIndex !== leaderIndex && (
                      <button
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs whitespace-nowrap"
                        onClick={() => setAsLeader(slotIndex)}
                      >
                        Set as Leader
                      </button>
                    )}
                    
                    <a 
                      href={`https://www.youtube.com/watch?v=${viewerSlots[slotIndex].videoId}&t=${Math.floor(syncTime)}s`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs whitespace-nowrap"
                    >
                      Open in Tab
                    </a>
                    
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs whitespace-nowrap"
                      onClick={() => handleRemoveVideo(slotIndex)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-slot flex flex-col items-center justify-center p-8 bg-gray-50 h-full">
                <p className="text-gray-500 mb-4">Drag a video here</p>
                <p className="text-gray-400 text-sm">Slot {slotIndex + 1}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoComparisonContainer; 