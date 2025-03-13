const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=================================================');
console.log('LCN Video Viewer - Setup Script');
console.log('=================================================');

// 1. Create necessary directories
console.log('\n1. Creating necessary directories...');
const directories = [
  path.join(__dirname, '..', 'credentials'),
  path.join(__dirname, '..', 'src', 'data'),
  path.join(__dirname, '..', 'public', 'data'),
  path.join(__dirname, '..', 'public', 'thumbnails')
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`   Created: ${dir}`);
  } else {
    console.log(`   Already exists: ${dir}`);
  }
});

// 2. Create a thumbnail
console.log('\n2. Creating video thumbnail...');
try {
  require('./create-thumbnail');
  console.log('   Thumbnail created successfully.');
} catch (error) {
  console.error('   Error creating thumbnail:', error.message);
}

// 3. Check for credentials
console.log('\n3. Checking for Google API credentials...');
const credentialsPath = path.join(__dirname, '..', 'credentials');
const credentialsFiles = fs.readdirSync(credentialsPath);
const hasCredentials = credentialsFiles.some(file => file.includes('client_secret') && file.endsWith('.json'));

if (hasCredentials) {
  console.log('   ✓ Google API credentials found.');
} else {
  console.log('   ✗ Google API credentials not found.');
  console.log('   Please add your Google API credentials file to the credentials directory.');
  console.log('   See GOOGLE_DRIVE_SETUP.md for more information.');
}

// 4. Next steps
console.log('\n=================================================');
console.log('SETUP COMPLETE - NEXT STEPS');
console.log('=================================================');
console.log('1. Make sure you have Google API credentials in the credentials folder');
console.log('2. Run the folder listing script to find your folder ID:');
console.log('   node scripts/list-drive-folders.js');
console.log('3. Run the fetcher script with your folder ID:');
console.log('   node scripts/google-drive-fetcher.js YOUR_FOLDER_ID');
console.log('4. Start the application:');
console.log('   npm start');
console.log('================================================='); 