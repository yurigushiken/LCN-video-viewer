// Rename YouTube Videos Script
// This script renames YouTube videos to ensure proper sorting in dropdown menus
// It converts names like "gw_eight" to "gw_08" and "adult_uhw" to "uhw_adult"

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const readline = require('readline');
const { OAuth2Client } = require('google-auth-library');

// Path to YouTube videos JSON file
const videosJsonPath = path.join(__dirname, '..', 'public', 'youtube_videos.json');
// Path to credentials directory
const credentialsPath = path.join(__dirname, '..', 'credentials', 'youtube');
// Client secrets file
const clientSecretsFile = path.join(credentialsPath, 'client_secret_661140052004-m7tshu43ns8d6bg7t3uc8ja3unik6krq.apps.googleusercontent.com.json');
// Token file
const tokenPath = path.join(credentialsPath, 'token.pickle');

// YouTube API scope for updating videos
const SCOPES = ['https://www.googleapis.com/auth/youtube'];

// Function to convert number words to digits
function convertNumberWordToDigit(word) {
  const numberMap = {
    'one': '01',
    'two': '02',
    'three': '03',
    'four': '04',
    'five': '05',
    'six': '06',
    'seven': '07',
    'eight': '08',
    'nine': '09',
    'ten': '10',
    'eleven': '11',
    'twelve': '12'
  };

  return numberMap[word.toLowerCase()] || word;
}

// Function to normalize video titles for better sorting
function normalizeTitle(title) {
  // Special case for "adult_uhw" -> "uhw_adult"
  if (title === 'adult_uhw') {
    return 'uhw_adult';
  }

  // Break down the title into parts
  const parts = title.split('_');
  
  // Check if the last part is a number word
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1];
    const digitVersion = convertNumberWordToDigit(lastPart);
    
    if (digitVersion !== lastPart) {
      // Replace the number word with its digit version
      parts[parts.length - 1] = digitVersion;
      return parts.join('_');
    }
  }
  
  return title;
}

// Function to get authenticated YouTube service
async function getYouTubeService() {
  let client = null;
  let credentials = null;
  
  try {
    // Read client secrets
    const content = fs.readFileSync(clientSecretsFile);
    credentials = JSON.parse(content);
  } catch (err) {
    console.error('Error loading client secret file:', err);
    return null;
  }

  const { client_secret, client_id, redirect_uris } = credentials.installed;
  client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token
  let token = null;
  try {
    if (fs.existsSync(tokenPath)) {
      const content = fs.readFileSync(tokenPath);
      token = JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading token file:', err);
  }

  if (token) {
    client.setCredentials(token);
  } else {
    // No token, need to get a new one
    token = await getNewToken(client);
    client.setCredentials(token);
  }

  return google.youtube({
    version: 'v3',
    auth: client
  });
}

// Function to get a new OAuth token
async function getNewToken(client) {
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });

  console.log('Authorize this app by visiting this URL:', authUrl);
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve, reject) => {
    rl.question('Enter the code from that page here: ', async (code) => {
      rl.close();
      try {
        const { tokens } = await client.getToken(code);
        // Store the token for future use
        fs.writeFileSync(tokenPath, JSON.stringify(tokens));
        console.log('Token stored to', tokenPath);
        resolve(tokens);
      } catch (err) {
        console.error('Error retrieving access token:', err);
        reject(err);
      }
    });
  });
}

// Function to update a video title on YouTube
async function updateVideoTitle(youtube, videoId, newTitle, originalTitle) {
  try {
    const response = await youtube.videos.update({
      part: 'snippet',
      requestBody: {
        id: videoId,
        snippet: {
          title: `LCN Video Viewer - ${newTitle}`,
          categoryId: '22' // People & Blogs
        }
      }
    });
    
    console.log(`Updated video title from "${originalTitle}" to "${newTitle}" (Video ID: ${videoId})`);
    return response.data;
  } catch (error) {
    console.error(`Error updating video ${videoId}:`, error.message);
    return null;
  }
}

// Main function
async function main() {
  console.log('YouTube Video Title Renaming Tool');
  console.log('=================================');
  
  // Load videos from JSON
  let videos;
  try {
    const data = fs.readFileSync(videosJsonPath, 'utf8');
    videos = JSON.parse(data);
    console.log(`Loaded ${videos.length} videos from ${videosJsonPath}`);
  } catch (error) {
    console.error('Error loading videos JSON:', error);
    return;
  }
  
  // Preview changes
  const changes = [];
  for (const video of videos) {
    const normalizedTitle = normalizeTitle(video.title);
    if (normalizedTitle !== video.title) {
      changes.push({
        videoId: video.videoId,
        oldTitle: video.title,
        newTitle: normalizedTitle
      });
    }
  }
  
  console.log(`\nFound ${changes.length} videos that need to be renamed:`);
  changes.forEach((change, index) => {
    console.log(`${index + 1}. "${change.oldTitle}" -> "${change.newTitle}" (ID: ${change.videoId})`);
  });
  
  if (changes.length === 0) {
    console.log('No changes needed. All video titles are already in the correct format.');
    return;
  }
  
  // Ask for confirmation
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\nDo you want to proceed with these renames? (y/n): ', async (answer) => {
    if (answer.toLowerCase() !== 'y') {
      console.log('Operation cancelled.');
      rl.close();
      return;
    }
    
    // Get YouTube service
    console.log('\nAuthorizing with YouTube...');
    const youtube = await getYouTubeService();
    if (!youtube) {
      console.error('Failed to authorize with YouTube API.');
      rl.close();
      return;
    }
    
    console.log('Authorization successful.');
    
    // Perform the updates
    console.log('\nUpdating video titles...');
    const updatedVideos = [...videos];
    
    for (const change of changes) {
      const result = await updateVideoTitle(youtube, change.videoId, change.newTitle, change.oldTitle);
      if (result) {
        // Update the title in our local copy
        const index = updatedVideos.findIndex(v => v.videoId === change.videoId);
        if (index !== -1) {
          updatedVideos[index].title = change.newTitle;
          updatedVideos[index].description = `Video for synchronized playback in LCN Video Viewer application. File: ${change.newTitle}`;
        }
      }
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Save the updated JSON
    fs.writeFileSync(videosJsonPath, JSON.stringify(updatedVideos, null, 2));
    console.log(`\nUpdated ${videosJsonPath} with new video titles.`);
    
    // Create a backup copy of the JSON file
    const backupPath = path.join(__dirname, '..', 'public', 'youtube_videos_before_rename.json');
    fs.copyFileSync(videosJsonPath, backupPath);
    console.log(`Created backup at ${backupPath}`);
    
    console.log('\nAll done!');
    rl.close();
  });
}

// Run the main function
main().catch(console.error); 