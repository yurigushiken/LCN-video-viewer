const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const readline = require('readline');

// Path to client secret file
const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials', 'client_secret_992130532278-7ohaffmihohg0p5d2i1bho3hb6kkt9gl.apps.googleusercontent.com.json');
const TOKEN_PATH = path.join(__dirname, '..', 'credentials', 'token.json');

// If modifying these scopes, delete token.json.
// Using readonly scope - this CANNOT modify, delete, or create files in your Drive
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, folderId) {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback, folderId);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client, folderId);
  });
}

/**
 * Get and store new token after prompting for user authorization.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback, folderId) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('=================================================');
  console.log('AUTHORIZATION REQUIRED - READ-ONLY ACCESS');
  console.log('=================================================');
  console.log('This script only requests READ-ONLY access to your Google Drive.');
  console.log('It CANNOT modify, delete, or create files in your Drive.');
  console.log('\nPlease authorize by visiting this url:');
  console.log(authUrl);
  console.log('\nAfter authorization, copy the code from the browser and paste it below.');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('\nEnter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client, folderId);
    });
  });
}

/**
 * Lists files in a specific folder from Google Drive.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 * @param {string} folderId The ID of the folder to list files from.
 */
function listFiles(auth, folderId) {
  const drive = google.drive({ version: 'v3', auth });
  let query = "";
  
  if (folderId) {
    // Use parents query to get files in a specific folder
    query = `'${folderId}' in parents`;
    console.log(`\nSearching for files in folder with ID: ${folderId}`);
  } else {
    console.log('No folder ID specified. Will search across all accessible files.');
  }
  
  console.log('Attempting to access files (this might take a moment)...');
  
  // Include supportsAllDrives and includeItemsFromAllDrives options for shared drives
  drive.files.list({
    q: query,
    pageSize: 100,
    fields: 'nextPageToken, files(id, name, mimeType)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    corpora: 'allDrives'  // Added to ensure all drives are searched
  }, (err, res) => {
    if (err) {
      console.log('The API returned an error: ' + err);
      console.log('\nDetails:');
      console.log(JSON.stringify(err, null, 2));
      return;
    }
    
    const files = res.data.files;
    
    if (files.length) {
      console.log(`\nFound ${files.length} files in total`);
      
      // Print all files found for debugging
      console.log('\nAll files found in folder:');
      console.log('=================================================');
      console.log('ID                                     | MIME TYPE                | NAME');
      console.log('-------------------------------------------------');
      files.forEach((file) => {
        console.log(`${file.id.padEnd(38)} | ${file.mimeType.padEnd(24)} | ${file.name}`);
      });
      
      // Filter for video files
      const videoFiles = files.filter(file => 
        file.mimeType.includes('video') || 
        file.name.toLowerCase().includes('movie') || 
        file.name.toLowerCase().endsWith('.mp4') ||
        file.name.toLowerCase().endsWith('.mov') ||
        file.name.toLowerCase().endsWith('.avi')
      );
      
      if (videoFiles.length) {
        console.log(`\nFound ${videoFiles.length} video files:`);
        
        // Create an output structure that can be directly used in the React component
        const videoLibrary = videoFiles.map((file, index) => ({
          id: index + 1,
          label: file.name.replace(/\.\w+$/, ''), // Remove file extension
          url: `https://drive.google.com/file/d/${file.id}/view`,
          embedUrl: `https://drive.google.com/file/d/${file.id}/preview`,
          directStreamUrl: `https://docs.google.com/uc?export=download&id=${file.id}`,
          driveFileId: file.id,
          // Use a more reliable thumbnail URL format that works better with CORS
          thumbnail: `https://lh3.googleusercontent.com/d/${file.id}=w300-h200-p-k-nu`,
          mimeType: file.mimeType
        }));
        
        // First, check if src/data exists, and create it if it doesn't
        const dataDir = path.join(__dirname, '..', 'src', 'data');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
          console.log(`Created directory: ${dataDir}`);
        }
        
        const outputPath = path.join(dataDir, 'video-library.json');
        
        // Save the file
        fs.writeFileSync(outputPath, JSON.stringify(videoLibrary, null, 2));
        console.log(`\nVideo library saved to ${outputPath}`);
        
        // Also save to public/data for proper React access
        const publicDataDir = path.join(__dirname, '..', 'public', 'data');
        if (!fs.existsSync(publicDataDir)) {
          fs.mkdirSync(publicDataDir, { recursive: true });
          console.log(`Created directory: ${publicDataDir}`);
        }
        
        const publicOutputPath = path.join(publicDataDir, 'video-library.json');
        fs.writeFileSync(publicOutputPath, JSON.stringify(videoLibrary, null, 2));
        console.log(`Video library also saved to ${publicOutputPath} for React access`);
        
        // Print details for reference
        console.log('\nVideo files found:');
        console.log('=================================================');
        console.log('ID                                     | NAME');
        console.log('-------------------------------------------------');
        videoFiles.forEach((file) => {
          console.log(`${file.id.padEnd(38)} | ${file.name}`);
        });
        
        console.log('\n=================================================');
        console.log('NEXT STEPS:');
        console.log('=================================================');
        console.log('1. Restart your React app (if running)');
        console.log('2. The videos should now be available in the app');
        console.log('3. If the app is already running, you may need to refresh the browser');
        
      } else {
        console.log('\nNo video files found in the specified folder.');
        console.log('Make sure the folder contains video files or check the folder ID.');
      }
    } else {
      console.log('No files found in the specified folder.');
      console.log('The folder might be empty or you might not have access to it.');
    }
  });
}

// Load client secrets from a local file.
console.log('Looking for Google API credentials...');
fs.readFile(CREDENTIALS_PATH, (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  
  // Get folder ID from command line arguments
  const folderId = process.argv[2] || '';
  if (!folderId) {
    console.log('\nPlease provide a folder ID as a command-line argument');
    console.log('Usage: node google-drive-fetcher.js FOLDER_ID');
    console.log('\nTip: To find folder IDs, run the list-drive-folders.js script first:');
    console.log('node scripts/list-drive-folders.js');
    return;
  }
  
  console.log('Credentials loaded successfully!');
  console.log(`\nFetching videos from Google Drive folder ID: ${folderId}`);
  authorize(JSON.parse(content), listFiles, folderId);
}); 