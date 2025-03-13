/**
 * Utility functions for Google Drive API access and CORS handling
 */

// Extract API key and client info from environment variables
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || '';
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

// Hardcoded token for development purpose (not ideal for production)
// In production, this should be handled by a proper auth flow
const ACCESS_TOKEN = "ya29.a0AeXRPp7POXD-HxZfGD3gb6xjppXu_5DrKY5yBFIe81ategPLVYJOHvzfrlT4ZU3fsyE8iz2_Fokwn9La-X9q89BiPdwYIWaxpmcqd9Aabpr5iw-PnA1XlMOPpLyrsqfUcF26fnpNyYCBikcXZ46XUsNh16of6QMnFdpG_fPAaCgYKAdkSARESFQHGX2MirNgMtXpaQL04yJysk-K_3Q0175";

/**
 * Get direct access URL for a Google Drive file
 * 
 * @param {string} fileId - The Google Drive file ID
 * @param {string} apiKey - The Google API key (optional)
 * @param {boolean} useAuth - Whether to use authentication (token)
 * @returns {string} Direct URL for the file
 */
export const getDirectMediaUrl = (fileId, apiKey = API_KEY, useAuth = false) => {
  if (!fileId) return null;
  
  // For public access with API key
  if (!useAuth) {
    return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
  }
  
  // For authenticated access with token
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
};

/**
 * Fetch video content with proper CORS handling
 * 
 * @param {string} url - The video URL to fetch
 * @param {boolean} useAuth - Whether to use authentication
 * @returns {Promise<Response>} - Fetch response
 */
export const fetchVideoWithCors = (url, useAuth = false) => {
  const headers = {
    'Accept': 'video/*' // Accept video content
  };
  
  // Add authorization header if using authentication
  if (useAuth && ACCESS_TOKEN) {
    headers['Authorization'] = `Bearer ${ACCESS_TOKEN}`;
  }
  
  return fetch(url, {
    method: 'GET',
    mode: 'cors', // Explicitly request CORS mode
    headers
  });
};

/**
 * Check if CORS is properly configured for a URL
 * 
 * @param {string} url - URL to check
 * @param {boolean} useAuth - Whether to use authentication
 * @returns {Promise<boolean>} - True if CORS is properly configured
 */
export const checkCorsConfiguration = async (url, useAuth = false) => {
  const headers = {};
  
  // Add authorization header if using authentication
  if (useAuth && ACCESS_TOKEN) {
    headers['Authorization'] = `Bearer ${ACCESS_TOKEN}`;
  }
  
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'cors',
      headers
    });
    
    return response.ok;
  } catch (error) {
    console.error('CORS check failed:', error);
    return false;
  }
};

/**
 * Create an embedded iframe URL for Google Drive
 * 
 * @param {string} fileId - Google Drive file ID
 * @returns {string} - Embed URL
 */
export const getEmbedUrl = (fileId) => {
  return `https://drive.google.com/file/d/${fileId}/preview`;
};

/**
 * Generate a thumbnail URL for a Google Drive file
 * 
 * @param {string} fileId - Google Drive file ID
 * @returns {string} - Thumbnail URL
 */
export const getThumbnailUrl = (fileId) => {
  return `https://lh3.googleusercontent.com/d/${fileId}=w300-h200-p-k-nu`;
};

/**
 * Try different methods to access a video until one works
 * 
 * @param {string} fileId - Google Drive file ID 
 * @returns {Promise<{url: string, method: string}>} - Working URL and access method
 */
export const getWorkingVideoUrl = async (fileId) => {
  // Try public access with API key first
  const publicUrl = getDirectMediaUrl(fileId, API_KEY, false);
  try {
    const publicCheck = await fetch(publicUrl, { method: 'HEAD', mode: 'cors' });
    if (publicCheck.ok) {
      return { url: publicUrl, method: 'public' };
    }
  } catch (err) {
    console.log('Public access failed, trying authenticated access...');
  }
  
  // Try authenticated access
  const authUrl = getDirectMediaUrl(fileId, null, true);
  try {
    const authCheck = await fetch(authUrl, { 
      method: 'HEAD', 
      mode: 'cors',
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    });
    if (authCheck.ok) {
      return { url: authUrl, method: 'authenticated' };
    }
  } catch (err) {
    console.log('Authenticated access failed, trying embed URL...');
  }
  
  // If all else fails, return the embed URL
  return { url: getEmbedUrl(fileId), method: 'embed' };
};

/**
 * Gets a URL for a Google Drive file optimized for streaming
 * This method prioritizes streaming over direct downloads
 * 
 * @param {string} fileId - The ID of the file in Google Drive
 * @param {boolean} forceDirectDownload - Whether to force a direct download URL (not recommended)
 * @returns {Promise<string>} URL for the file
 */
export const getVideoUrl = async (fileId, forceDirectDownload = false) => {
  if (!fileId) {
    throw new Error('File ID is required');
  }
  
  console.log(`Getting streaming URL for video file: ${fileId}`);
  
  try {
    // For streaming approach - this is the preferred method
    // Using Google Drive's preview/embed URL which streams content rather than downloading
    if (!forceDirectDownload) {
      const streamingUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      console.log(`Using streaming embedded URL: ${streamingUrl}`);
      return streamingUrl;
    }
    
    // Only use direct download as fallback if explicitly requested
    // This is NOT recommended for normal use as it forces download
    const directDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    console.log(`Using direct download URL (not recommended): ${directDownloadUrl}`);
    return directDownloadUrl;
  } catch (error) {
    console.error('Error generating video URL:', error);
    throw new Error(`Failed to get URL for file: ${error.message}`);
  }
};

/**
 * Gets an authenticated URL for a file, using the API key if available
 * This is an alternative method that is not currently being used
 * 
 * @param {string} fileId - The ID of the file in Google Drive
 * @param {string} apiKey - Google API key
 * @returns {Promise<string>} API URL for the file
 */
export const getAuthenticatedUrl = async (fileId, apiKey) => {
  if (!fileId) {
    throw new Error('File ID is required');
  }
  
  if (!apiKey) {
    console.warn('No API key provided, falling back to direct URL');
    return getVideoUrl(fileId, true);
  }
  
  try {
    // This format uses the API key for authentication
    // May provide better access to restricted files but requires valid API key
    const apiUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
    console.log(`Using authenticated API URL with key`);
    return apiUrl;
  } catch (error) {
    console.error('Error generating authenticated URL:', error);
    throw new Error(`Failed to get authenticated URL: ${error.message}`);
  }
};

/**
 * Retrieves video metadata from Google Drive API
 * This is for future enhancement to get video details
 * 
 * @param {string} fileId - The ID of the file in Google Drive
 * @param {string} apiKey - Google API key
 * @returns {Promise<Object>} Video metadata
 */
export const getVideoMetadata = async (fileId, apiKey) => {
  if (!fileId) {
    throw new Error('File ID is required');
  }
  
  if (!apiKey) {
    throw new Error('API key is required for metadata retrieval');
  }
  
  try {
    // Get metadata via API
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,mimeType,thumbnailLink,size&key=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    throw new Error(`Failed to get video metadata: ${error.message}`);
  }
};

/**
 * Tests if a video URL is playable in HTML5 video element
 * This is for future enhancement to detect compatibility issues
 * 
 * @param {string} url - The video URL to test
 * @returns {Promise<boolean>} Whether the video is playable
 */
export const testVideoPlayability = async (url) => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    
    video.oncanplay = () => {
      // Video can play, clean up and resolve
      video.onerror = null;
      video.oncanplay = null;
      resolve(true);
    };
    
    video.onerror = () => {
      // Video cannot play, clean up and resolve with false
      video.onerror = null;
      video.oncanplay = null;
      resolve(false);
    };
    
    // Set timeout to avoid hanging
    setTimeout(() => {
      video.onerror = null;
      video.oncanplay = null;
      resolve(false);
    }, 5000);
    
    // Try to load the video
    video.src = url;
    video.load();
  });
};

export default {
  API_KEY,
  CLIENT_ID,
  ACCESS_TOKEN,
  getDirectMediaUrl,
  fetchVideoWithCors,
  checkCorsConfiguration,
  getEmbedUrl,
  getThumbnailUrl,
  getWorkingVideoUrl,
  getVideoUrl,
  getAuthenticatedUrl,
  getVideoMetadata,
  testVideoPlayability
}; 