const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const readline = require('readline');

// Path to client secret file
const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials', 'client_secret_992130532278-7ohaffmihohg0p5d2i1bho3hb6kkt9gl.apps.googleusercontent.com.json');
const TOKEN_PATH = path.join(__dirname, '..', 'credentials', 'token.json');

// Using readonly scope - this CANNOT modify, delete, or create files in your Drive
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
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
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists all accessible shared drives and folders.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listDrives(auth) {
  const drive = google.drive({ version: 'v3', auth });
  
  console.log('\n=================================================');
  console.log('CHECKING FOR SHARED DRIVES');
  console.log('=================================================');
  
  // First, list available shared drives
  drive.drives.list({
    pageSize: 50,
    fields: 'drives(id, name)'
  }, (err, res) => {
    if (err) {
      console.log('Error fetching shared drives:', err);
      // Continue with listing folders even if shared drives fetch fails
      listRootFolders(drive);
      return;
    }
    
    const drives = res.data.drives || [];
    
    if (drives.length) {
      console.log(`\nFound ${drives.length} shared drives:`);
      console.log('=================================================');
      console.log('ID                                     | NAME');
      console.log('-------------------------------------------------');
      drives.forEach(drive => {
        console.log(`${drive.id.padEnd(38)} | ${drive.name}`);
      });
      
      console.log('\nTo access folders in a shared drive, run:');
      console.log('node scripts/google-drive-fetcher.js FOLDER_ID');
      
      // Now list folders in each shared drive
      console.log('\n=================================================');
      console.log('LISTING TOP-LEVEL FOLDERS IN EACH SHARED DRIVE');
      console.log('=================================================');
      
      let processedDrives = 0;
      
      drives.forEach(sharedDrive => {
        console.log(`\nListing folders in shared drive: ${sharedDrive.name} (${sharedDrive.id})`);
        
        drive.files.list({
          q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
          driveId: sharedDrive.id,
          corpora: 'drive',
          includeItemsFromAllDrives: true,
          supportsAllDrives: true,
          pageSize: 50,
          fields: 'files(id, name, parents)'
        }, (err, res) => {
          processedDrives++;
          
          if (err) {
            console.log(`Error listing folders in drive ${sharedDrive.name}:`, err);
            if (processedDrives === drives.length) {
              // After processing all drives, list folders in My Drive
              listRootFolders(drive);
            }
            return;
          }
          
          const folders = res.data.files || [];
          
          if (folders.length) {
            console.log(`Found ${folders.length} folders in ${sharedDrive.name}:`);
            console.log('ID                                     | NAME');
            console.log('-------------------------------------------------');
            folders.forEach(folder => {
              console.log(`${folder.id.padEnd(38)} | ${folder.name}`);
            });
          } else {
            console.log(`No folders found in shared drive: ${sharedDrive.name}`);
          }
          
          if (processedDrives === drives.length) {
            // After processing all drives, list folders in My Drive
            listRootFolders(drive);
          }
        });
      });
    } else {
      console.log('No shared drives found.');
      // If no shared drives, list folders in My Drive
      listRootFolders(drive);
    }
  });
}

/**
 * Lists folders in the user's My Drive.
 * @param {google.drive} drive The Google Drive API client.
 */
function listRootFolders(drive) {
  console.log('\n=================================================');
  console.log('LISTING FOLDERS IN MY DRIVE');
  console.log('=================================================');
  
  drive.files.list({
    q: "mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false",
    pageSize: 50,
    fields: 'files(id, name)'
  }, (err, res) => {
    if (err) {
      console.log('Error listing folders in My Drive:', err);
      console.log('\nDetails:');
      console.log(JSON.stringify(err, null, 2));
      return;
    }
    
    const folders = res.data.files || [];
    
    if (folders.length) {
      console.log(`\nFound ${folders.length} folders in My Drive:`);
      console.log('=================================================');
      console.log('ID                                     | NAME');
      console.log('-------------------------------------------------');
      folders.forEach(folder => {
        console.log(`${folder.id.padEnd(38)} | ${folder.name}`);
      });
      
      console.log('\n=================================================');
      console.log('NEXT STEPS:');
      console.log('=================================================');
      console.log('1. Choose a folder ID from the list above');
      console.log('2. Run the video fetcher script with the folder ID:');
      console.log('   node scripts/google-drive-fetcher.js FOLDER_ID');
      console.log('\nThis will generate the video library file needed by the app.');
    } else {
      console.log('No folders found in My Drive.');
    }
  });
}

// Load client secrets from a local file.
console.log('Looking for Google API credentials...');
fs.readFile(CREDENTIALS_PATH, (err, content) => {
  if (err) {
    console.log('Error loading client secret file:', err);
    console.log('\nMake sure you have created a credentials folder with your Google API credentials.');
    console.log('Follow the instructions in GOOGLE_DRIVE_SETUP.md to set up your credentials.');
    return;
  }
  
  console.log('Credentials loaded successfully!');
  console.log('\nListing all accessible drives and folders...');
  authorize(JSON.parse(content), listDrives);
}); 