const fs = require('fs');
const path = require('path');

// Create a simple placeholder image for video thumbnails
function createThumbnail() {
  const thumbnailDir = path.join(__dirname, '..', 'public', 'thumbnails');
  const thumbnailPath = path.join(thumbnailDir, 'video-thumbnail.jpg');
  
  // Check if thumbnails directory exists, create if not
  if (!fs.existsSync(thumbnailDir)) {
    fs.mkdirSync(thumbnailDir, { recursive: true });
    console.log(`Created thumbnails directory: ${thumbnailDir}`);
  }
  
  // Check if the thumbnail already exists and has content
  if (fs.existsSync(thumbnailPath)) {
    const stats = fs.statSync(thumbnailPath);
    if (stats.size > 100) {
      console.log('Thumbnail already exists with proper content.');
      return;
    }
  }
  
  // Generate a simple video thumbnail file
  // This should be replaced with a proper image in a production environment
  const svgContent = `<svg width="400" height="225" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="225" fill="#333"/>
    <circle cx="200" cy="112.5" r="50" fill="#666"/>
    <polygon points="185,85 185,140 230,112.5" fill="#fff"/>
    <text x="200" y="195" font-family="Arial" font-size="16" text-anchor="middle" fill="#fff">Video Preview</text>
  </svg>`;
  
  // Save as SVG (as a placeholder - in a real app you'd want a JPG/PNG)
  const svgPath = path.join(thumbnailDir, 'video-thumbnail.svg');
  fs.writeFileSync(svgPath, svgContent);
  console.log(`Created SVG thumbnail: ${svgPath}`);
  
  // For compatibility with the existing code, create a small JPG file
  // In a real app, you would convert the SVG to JPG using a library
  // For now, we're just creating a placeholder file
  fs.writeFileSync(thumbnailPath, 'PLACEHOLDER');
  console.log(`Created placeholder JPG thumbnail: ${thumbnailPath}`);
  console.log(`Note: In a production app, replace this with a real image.`);
}

// Run the function
createThumbnail(); 