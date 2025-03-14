# LCN Video Viewer

A React-based web application for comparing heatmap videos side by side. This tool allows researchers to synchronously play and analyze multiple videos for the Infant Event Representations study.

## Features

- **Multiple Video Comparison**: View up to 4 videos simultaneously in a synchronized grid
- **YouTube Integration**: Videos are hosted on YouTube for better performance and reliability
- **Synchronized Playback**: All videos play, pause, and seek in sync
- **Video Categorization**: Filter videos by category/preset (e.g., gw, hw, uhw)
- **Responsive Layout**: Works on various screen sizes with different grid layouts

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm 7.x or higher

### Installation

1. Clone the repository:
   ```powershell
   git clone https://github.com/yurigushiken/LCN-video-viewer.git
   cd LCN-video-viewer
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start the development server:
   ```powershell
   npm start
   ```

### Building for Production

```powershell
npm run build
```

### Deployment

The site is currently deployed on GitHub Pages. To deploy new changes:

```powershell
npm run deploy
```

## Project Structure

- `/public`: Static assets and data
  - `youtube_videos.json`: Contains metadata for all YouTube videos
  - `/thumbnails`: Contains thumbnail images
- `/src`: Source code
  - `/components`: React components
  - `/utils`: Utility functions
  - `App.js`: Main application component

## Adding New Videos

1. Upload videos to YouTube
2. Add video metadata to `public/youtube_videos.json`
3. Rebuild and redeploy the application

## Maintenance

### Editing Video Titles

To edit video titles:
1. Update the corresponding entry in `public/youtube_videos.json`
2. Rebuild and redeploy the application

## License

This project is licensed under the MIT License.

## Contributors

- Yuri Gushiken (mkg2145@tc.columbia.edu)
- Yuexin Li (yl4964@columbia.edu) 