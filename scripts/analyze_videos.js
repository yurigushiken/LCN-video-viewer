// Script to analyze video categories
const fs = require('fs');
const path = require('path');

// Read the YouTube videos JSON file
const jsonPath = path.join(__dirname, '..', 'public', 'youtube_videos.json');
const videos = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Function to extract the base category from a video title
function extractCategory(title) {
  // Extract the prefix (like "gw_", "hw_", etc.)
  const match = title.match(/^([a-z]+)_/);
  return match ? match[1] : 'unknown';
}

// Count videos per category
const categories = {};
videos.forEach(video => {
  const category = extractCategory(video.title);
  if (!categories[category]) {
    categories[category] = [];
  }
  categories[category].push(video.title);
});

// Output the results
console.log('=== Video Categories Analysis ===');
Object.keys(categories).sort().forEach(category => {
  console.log(`\n${category}: ${categories[category].length} videos`);
  // Sort titles by age (adult first, then numeric)
  const sortedTitles = categories[category].sort((a, b) => {
    // Put adult at the beginning
    if (a.includes('adult')) return -1;
    if (b.includes('adult')) return 1;
    
    // Extract numbers for comparison
    const numA = parseInt(a.match(/(\d+)/)?.[1] || 0);
    const numB = parseInt(b.match(/(\d+)/)?.[1] || 0);
    
    return numA - numB;
  });
  
  console.log(sortedTitles.join('\n'));
}); 