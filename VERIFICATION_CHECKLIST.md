# LCN Video Viewer Verification Checklist

Use this checklist to verify that the application is working properly after any changes or maintenance.

## Development Environment Verification

- [ ] Run `npm install` to ensure all dependencies are installed
- [ ] Run `npm start` to start the development server
- [ ] Verify that the application loads in the browser at http://localhost:3000
- [ ] Check that the video grid appears with dropdown menus for video selection
- [ ] Select different videos and verify they load properly
- [ ] Test the synchronization features:
  - [ ] Play/pause all
  - [ ] Set leader video
  - [ ] Sync now
  - [ ] Reset all
- [ ] Test different layouts (1×1, 1×2, 2×2)
- [ ] Try filtering videos by preset/category

## Build Verification

- [ ] Run `npm run build` to create a production build
- [ ] Verify that the build completes without errors
- [ ] Check that the `build` directory contains all necessary files:
  - [ ] index.html
  - [ ] JS and CSS bundles
  - [ ] youtube_videos.json
  - [ ] thumbnails directory
  - [ ] data directory

## Deployment Verification

- [ ] Run `npm run deploy` to deploy to GitHub Pages
- [ ] Wait for the deployment to complete (usually a few minutes)
- [ ] Visit the live site at https://yurigushiken.github.io/LCN-video-viewer
- [ ] Verify that all functionality works on the live site:
  - [ ] Video loading
  - [ ] Video selection
  - [ ] Synchronization
  - [ ] Layouts
  - [ ] Presets/categories

## Script Verification

- [ ] Test the Add-Video.ps1 script with a sample video
  ```powershell
  .\scripts\Add-Video.ps1 -VideoId "SAMPLE_ID" -Title "test_video"
  ```
- [ ] Verify that the video was added to youtube_videos.json
- [ ] Test the Update-VideoTitle.ps1 script
  ```powershell
  .\scripts\Update-VideoTitle.ps1 -VideoId "SAMPLE_ID" -NewTitle "test_video_updated"
  ```
- [ ] Verify that the video title was updated in youtube_videos.json
- [ ] Remove the test video from youtube_videos.json

## Data Integrity Verification

- [ ] Check that all video IDs in youtube_videos.json are valid
- [ ] Verify that all thumbnail URLs are correct
- [ ] Ensure that all video titles follow the naming convention (e.g., gw_adult, hw_11)

## Final Verification

- [ ] Rebuild and redeploy the application
- [ ] Visit the live site and verify all functionality again
- [ ] Check for any console errors
- [ ] Test on different browsers (Chrome, Firefox, Edge)
- [ ] Test on different devices if possible (desktop, tablet, mobile) 