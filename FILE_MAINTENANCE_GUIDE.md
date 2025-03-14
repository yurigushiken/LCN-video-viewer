# LCN Video Viewer - File Maintenance Guide

This document provides guidance on which files can be safely removed or archived, and which ones must be kept to maintain the functionality of the LCN Video Viewer application now that we've migrated from Google Drive to YouTube.

## Critical Files (MUST KEEP)

### Core Application Files

- `src/App.js` - Main application component
- `src/index.js` - Application entry point
- `src/index.css` - Core styling
- `src/App.css` - Application styles

### YouTube Player Components and Utilities

- `src/components/YouTubeVideoPlayer.js` - YouTube video player with synchronization support
- `src/components/VideoComparisonContainer.js` - Main container for video comparison
- `src/utils/youtubeUtils.js` - Utility functions for YouTube videos

### YouTube Integration

- `public/youtube_videos.json` - YouTube video metadata
- `youtube_uploader.py` - Script for uploading videos to YouTube
- `README-youtube-upload.md` - Documentation for YouTube upload process

### Configuration Files

- `package.json` and `package-lock.json` - NPM package configuration
- `.env` - Environment variables
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `public/index.html` - Main HTML template
- `public/manifest.json` - Web app manifest

### Credentials

- `credentials/youtube/client_secret_*.json` - YouTube API credentials
- `credentials/youtube/token.pickle` - YouTube authentication token

## Files That Can Be Safely Removed or Archived

### Google Drive Related Files (If Fully Migrated to YouTube)

- `scripts/google-drive-fetcher.js` - Script to fetch videos from Google Drive
- `scripts/list-drive-folders.js` - Script to list Google Drive folders
- `scripts/create-thumbnail.js` - One-time use script for creating thumbnails
- `scripts/setup.js` - Initial setup script

- `src/utils/googleDriveUtils.js` - Google Drive utility functions
- `GOOGLE_DRIVE_SETUP.md` - Documentation for Google Drive setup

- `credentials/client_secret_*.json` - Google Drive API credentials (if no longer needed)
- `credentials/token.json` - Google Drive authentication token (if no longer needed)

### Legacy Components

- `src/components/SyncedVideoPlayer.js` - The Google Drive version of the video player
- `src/components/VideoComparisonTool.js` - Older version of the comparison tool (if no longer used)

### Duplicate Data Files

- `src/data/video-library.json` - Duplicate of public/data/video-library.json
- `public/data/video-library.json` - Google Drive video library (if fully migrated to YouTube)

## File Archiving Recommendations

Instead of immediately deleting files, consider the following approaches:

1. **Create an Archive Folder**: Move deprecated files to an `archived` folder with a date stamp
   ```
   mkdir -p archived/google-drive-$(date +%Y%m%d)
   ```

2. **Document Before Archiving**: Add a comment at the top of each archived file explaining:
   - When it was archived
   - Why it was archived
   - What replaced it
   - Any dependencies it had

3. **Update .gitignore**: If you want to keep archives locally but not in the repository:
   ```
   # Add to .gitignore
   archived/
   ```

## Safe Deletion Checklist

Before deleting any file, verify that:

- [ ] The functionality has been fully migrated to YouTube
- [ ] No other parts of the application reference this file
- [ ] You have a backup or the file is versioned in Git
- [ ] You have tested the application without this file
- [ ] The deletion won't affect any other services or dependencies

## Migration Process Documentation

When migrating from one approach to another (like Google Drive to YouTube), it's important to:

1. **Create New Files First**: Develop new functionality before removing old
2. **Test Thoroughly**: Make sure the new approach works correctly
3. **Archive Old Files**: Move them to an archive folder rather than deleting immediately
4. **Update Documentation**: Make sure READMEs and comments reflect the current state

## Additional Notes

- The application currently supports both YouTube and potentially Google Drive videos
- If you need to revert to Google Drive for any reason, the archived files can be restored
- Always test the application after making any significant changes to the file structure
- Keep the credentials separate and secure, especially if they have different access permissions 