# LCN Video Comparison

A React application for comparing and synchronizing multiple videos side by side, with precise frame-by-frame navigation capabilities.

## Project Overview

The LCN Video Comparison allows users to:

- Load and play multiple videos simultaneously in a synchronized manner
- Navigate videos frame-by-frame with high precision
- View videos in customizable grid layouts (1×1, 1×2, 2×2, 2×3)
- Synchronize playback across all videos
- Jump to specific frames in all videos at once
- Select a leader video, which other videos will follow

## Core Features

### Enhanced Video Navigation

- **Frame-by-Frame Navigation**: Step forward or backward one frame at a time across all videos
- **Frame Jump**: Jump directly to a specific frame number
- **Frame-Sensitive Scrubber**: The time scrubber operates at the frame level (assumes 30fps)

### Comprehensive Controls

- **Play/Pause All**: Single button toggles between playing and pausing all videos
- **Sync Now**: Synchronizes all videos to the current timestamp of the leader video
- **Reset All**: Returns all videos to the beginning (frame 0)
- **Master Controls Section**: All controls are consolidated in one intuitive panel

### Improved UI/UX

- **Matching Layout**: Video selection dropdowns match the same grid layout as the video display
- **Responsive Design**: Works across different screen sizes
- **Clear Leader Indication**: Leader videos are clearly marked with a crown icon

## Project Structure

### Core Components

- `src/components/YouTubeVideoPlayer.js`: The YouTube video player component with synchronization capabilities
- `src/components/VideoComparisonContainer.js`: Main container component for the video comparison interface
- `src/utils/youtubeUtils.js`: Utility functions for working with YouTube videos and URLs

### Other Important Files

- `public/youtube_videos.json`: JSON file containing metadata about uploaded YouTube videos

## Getting Started

### Prerequisites

- Node.js 14+ and npm
- Google API credentials for YouTube

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```
4. Access the application at [http://localhost:3000](http://localhost:3000)

## Usage Instructions

### Video Grid Management

1. **Selecting Videos**: Use the dropdown menus to select videos for each slot
2. **Choosing a Layout**: Use the buttons at the top (1×1, 1×2, 2×2, 2×3) to change the grid layout
3. **Setting a Leader**: Click "Set as Leader" on any video to make it the one others follow

### Video Controls

1. **Play/Pause All**: Toggle between playing and pausing all videos
2. **Frame Navigation**: Use the ⏮ Frame and Frame ⏭ buttons to move one frame at a time
3. **Sync Now**: Synchronizes all videos to the current timestamp of the leader video
4. **Reset All**: Returns all videos to the beginning (frame 0)
5. **Jump To Frame**: Enter a specific frame number to jump all videos to that position
6. **Frame Scrubber**: Use the slider to precisely position all videos by frame

## Development Notes

- The application assumes a standard frame rate of 30fps for all videos
- The YouTube Player API requires internet access to function
- The application manages state through React useState and useRef hooks
- Synchronization happens through the seekTo() method provided by the YouTube iframe API
- Time tracking is maintained by the leader video, which broadcasts its time to followers

## Credits

Developed for Language and Cognition Lab at Columbia University.

## License

All rights reserved. 