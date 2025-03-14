/**
 * Utility functions for working with YouTube videos
 */

/**
 * Extracts a YouTube video ID from various URL formats
 * @param {string} url - The YouTube URL (can be full URL, shortened, or embed URL)
 * @returns {string|null} The YouTube video ID or null if not a valid YouTube URL
 */
export const extractYouTubeVideoId = (url) => {
  if (!url) return null;
  
  // Handle various YouTube URL formats
  const patterns = [
    // Standard YouTube URL: https://www.youtube.com/watch?v=VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
    // Short URL: https://youtu.be/VIDEO_ID
    /(?:https?:\/\/)?youtu\.be\/([^?]+)/,
    // Embed URL: https://www.youtube.com/embed/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
    // Plain video ID (already extracted)
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

/**
 * Builds a YouTube embed URL from a video ID
 * @param {string} videoId - The YouTube video ID
 * @param {Object} options - Options for the embed URL
 * @param {number} options.startTime - Start time in seconds
 * @param {boolean} options.autoplay - Whether to autoplay the video
 * @param {boolean} options.controls - Whether to show video controls
 * @param {boolean} options.modestBranding - Whether to use modest branding
 * @returns {string} The YouTube embed URL
 */
export const buildYouTubeEmbedUrl = (videoId, options = {}) => {
  if (!videoId) return '';
  
  const {
    startTime = 0,
    autoplay = 0,
    controls = 1,
    modestBranding = 1,
    rel = 0, // Related videos at the end
    fs = 1,  // Allow fullscreen
  } = options;
  
  let url = `https://www.youtube.com/embed/${videoId}?`;
  const params = [];
  
  if (startTime > 0) {
    params.push(`start=${Math.floor(startTime)}`);
  }
  
  params.push(`autoplay=${autoplay ? 1 : 0}`);
  params.push(`controls=${controls ? 1 : 0}`);
  params.push(`modestbranding=${modestBranding ? 1 : 0}`);
  params.push(`rel=${rel ? 1 : 0}`);
  params.push(`fs=${fs ? 1 : 0}`);
  
  return url + params.join('&');
};

/**
 * Loads video data from JSON file containing YouTube video information
 * @returns {Promise<Array>} Array of video objects with id, title, etc.
 */
export const loadYouTubeVideos = async () => {
  try {
    // Get the base URL from the running app
    const baseUrl = process.env.PUBLIC_URL || '';
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    console.log('Environment detection for video loading:', { 
      baseUrl, 
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      isGitHubPages
    });
    
    // Hard-coded GitHub Pages URLs for better reliability
    const repoName = 'LCN-video-viewer';
    const githubPagesUrl = `https://yurigushiken.github.io/${repoName}/youtube_videos.json`;
    
    // Define possible URL paths to try in order
    const possibleUrls = [
      // For GitHub Pages, try the absolute URL first
      isGitHubPages ? githubPagesUrl : null,
      // Try with the PUBLIC_URL which should work in most environments
      `${baseUrl}/youtube_videos.json`,
      // Try at root of repository on GitHub Pages
      isGitHubPages ? `/${repoName}/youtube_videos.json` : null,
      // Try in the same directory as the current page
      'youtube_videos.json',
      // Backup relative paths
      './youtube_videos.json',
      '../youtube_videos.json'
    ].filter(Boolean); // Remove null entries
    
    console.log('Will try to load videos from these URLs in order:', possibleUrls);
    
    let videos = [];
    let lastError = null;
    let lastUrl = null;
    
    // Try each URL until one works
    for (const url of possibleUrls) {
      try {
        console.log(`Attempting to fetch YouTube videos from: ${url}`);
        lastUrl = url;
        
        // Add a timestamp to avoid browser caching
        const timestamp = Date.now();
        const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}_t=${timestamp}`;
        
        const response = await fetch(fetchUrl, {
          cache: 'no-store', // Skip cache to ensure fresh data
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          // Add specific options for cross-origin requests
          mode: 'cors',
          credentials: 'same-origin'
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.warn(`Response from ${url} is not JSON (${contentType}). Will try to parse anyway.`);
          }
          
          videos = await response.json();
          
          // Validate the response - make sure it's an array with expected fields
          if (Array.isArray(videos) && videos.length > 0) {
            console.log(`Successfully loaded ${videos.length} YouTube videos from ${url}`);
            
            // Log the first item to help debugging
            if (videos[0]) {
              console.log('First video object:', JSON.stringify(videos[0]).substring(0, 200) + '...');
            }
            
            return videos;
          } else {
            console.warn(`Response from ${url} is not a valid video array. Response:`, 
              JSON.stringify(videos).substring(0, 300) + '...');
          }
        } else {
          console.warn(`Could not load YouTube videos from ${url}. Status: ${response.status} ${response.statusText}`);
        }
      } catch (err) {
        lastError = err;
        console.warn(`Error fetching from ${url}:`, err.message);
      }
    }
    
    // Last resort: try to load embedded sample data
    console.warn('All URLs failed, attempting to load sample data from window object');
    if (window.sampleYouTubeVideos && Array.isArray(window.sampleYouTubeVideos)) {
      console.log('Found sample data in window object:', window.sampleYouTubeVideos.length, 'videos');
      return window.sampleYouTubeVideos;
    }
    
    // If we got here, all attempts failed
    throw new Error(
      `Failed to load YouTube videos from all possible locations. Last attempt: ${lastUrl}. Error: ${lastError?.message || 'Unknown error'}`
    );
  } catch (error) {
    console.error('Error loading YouTube videos:', error);
    
    // As a last resort, fallback to the embedded sample data
    if (window.sampleYouTubeVideos && Array.isArray(window.sampleYouTubeVideos)) {
      console.log('Error occurred, falling back to sample data in window object:', 
        window.sampleYouTubeVideos.length, 'videos');
      return window.sampleYouTubeVideos;
    }
    
    throw error;
  }
};

/**
 * Creates direct links to YouTube videos
 * @param {string} videoId - The YouTube video ID
 * @param {number} startTime - Start time in seconds
 * @returns {string} Direct link to YouTube
 */
export const getYouTubeDirectLink = (videoId, startTime = 0) => {
  if (!videoId) return '';
  
  let url = `https://www.youtube.com/watch?v=${videoId}`;
  
  if (startTime > 0) {
    url += `&t=${Math.floor(startTime)}s`;
  }
  
  return url;
};

/**
 * Gets a thumbnail URL for a YouTube video
 * @param {string} videoId - The YouTube video ID
 * @param {string} quality - Thumbnail quality: default, medium, high, standard, maxres
 * @returns {string} URL to the video thumbnail
 */
export const getYouTubeThumbnail = (videoId, quality = 'medium') => {
  if (!videoId) return '';
  
  // Available qualities: default, medium, high, standard, maxres
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    standard: 'sddefault',
    maxres: 'maxresdefault'
  };
  
  const qualitySuffix = qualityMap[quality] || 'mqdefault';
  return `https://img.youtube.com/vi/${videoId}/${qualitySuffix}.jpg`;
};

/**
 * Formats time in seconds to a human-readable format (MM:SS or HH:MM:SS)
 * @param {number} timeInSeconds - Time in seconds
 * @returns {string} Formatted time string
 */
export const formatTime = (timeInSeconds) => {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
  
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}; 