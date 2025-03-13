// Filter videos script
// This script filters out 12-month-old videos from the YouTube videos list

const fs = require('fs');
const path = require('path');

// Path to the source JSON file
const sourcePath = path.join(__dirname, '..', 'public', 'youtube_videos.json');
// Path to save the filtered JSON file
const outputPath = path.join(__dirname, '..', 'public', 'youtube_videos_filtered.json');

// Read the source file
console.log(`Reading videos from ${sourcePath}`);
const videos = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

console.log(`Found ${videos.length} total videos`);

// Filter out videos with "twelve" in the title
const filteredVideos = videos.filter(video => !video.title.toLowerCase().includes('twelve'));

console.log(`Filtered to ${filteredVideos.length} videos (removed ${videos.length - filteredVideos.length} 12-month-old videos)`);

// Reassign IDs to be sequential
filteredVideos.forEach((video, index) => {
  video.id = index + 1;
});

// Write the filtered videos to a new file
fs.writeFileSync(outputPath, JSON.stringify(filteredVideos, null, 2));
console.log(`Filtered videos saved to ${outputPath}`);

// Also create a backup of the original file with all videos
const backupPath = path.join(__dirname, '..', 'public', 'youtube_videos_all.json');
fs.copyFileSync(sourcePath, backupPath);
console.log(`Backup of all videos saved to ${backupPath}`);

// Replace the original file with the filtered version
fs.copyFileSync(outputPath, sourcePath);
console.log(`Updated ${sourcePath} with filtered videos`);

console.log('Done!'); 