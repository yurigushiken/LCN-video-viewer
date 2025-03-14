/**
 * Add Video Utility Script
 * 
 * This script helps add new videos to the youtube_videos.json file.
 * It takes command line arguments for video details and appends a new entry.
 * 
 * Usage:
 *   node add-video.js --videoId=YOUTUBE_ID --title=VIDEO_TITLE --file=ORIGINAL_FILENAME
 * 
 * Example:
 *   node add-video.js --videoId=dQw4w9WgXcQ --title=gw_adult --file=gw_adult
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value;
  }
  return acc;
}, {});

// Validate required arguments
const requiredArgs = ['videoId', 'title'];
const missingArgs = requiredArgs.filter(arg => !args[arg]);

if (missingArgs.length > 0) {
  console.error(`Error: Missing required arguments: ${missingArgs.join(', ')}`);
  console.log(`Usage: node add-video.js --videoId=YOUTUBE_ID --title=VIDEO_TITLE [--file=ORIGINAL_FILENAME]`);
  process.exit(1);
}

// Set default values
const now = new Date();
// Set date one year in the future to avoid expiration concerns
const futureDate = new Date(now);
futureDate.setFullYear(futureDate.getFullYear() + 2);
const formattedDate = futureDate.toISOString();

const videoData = {
  videoId: args.videoId,
  title: args.title,
  description: `Video for synchronized playback in LCN Video Viewer application. File: ${args.file || args.title}`,
  thumbnailUrl: `https://img.youtube.com/vi/${args.videoId}/mqdefault.jpg`,
  uploadDate: formattedDate,
  channelId: "UCZRtuakSlPupskaTcu3km4A",
  channelTitle: "mischa gushiken"
};

// Load existing videos
const jsonFilePath = path.resolve(__dirname, '../public/youtube_videos.json');

try {
  // Create backup
  const backupPath = path.resolve(__dirname, '../public/youtube_videos_backup.json');
  fs.copyFileSync(jsonFilePath, backupPath);
  console.log(`Backup created at ${backupPath}`);

  // Read existing data
  const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
  const videos = JSON.parse(jsonData);
  
  // Find the highest ID
  const highestId = videos.reduce((max, video) => Math.max(max, video.id || 0), 0);
  
  // Add new video with next ID
  const newVideo = {
    id: highestId + 1,
    ...videoData
  };
  
  videos.push(newVideo);
  
  // Write updated data back to the file
  fs.writeFileSync(jsonFilePath, JSON.stringify(videos, null, 2), 'utf8');
  
  console.log(`Success: Added new video "${newVideo.title}" with ID ${newVideo.id}`);
  console.log('Remember to rebuild and deploy the app with:');
  console.log('  npm run build');
  console.log('  npm run deploy');
  
} catch (error) {
  console.error('Error updating YouTube videos file:', error.message);
  process.exit(1);
} 