# File Maintenance Plan for LCN Video Comparison

This document outlines a plan for cleaning up the codebase to maintain a sustainable and manageable project.

## Files to Archive

These files are no longer actively used but might be needed for reference:

1. **Legacy Google Drive Scripts**:
   - `scripts/google-drive-fetcher.js` - No longer needed as we've migrated to YouTube
   - `scripts/create-thumbnail.js` - One-time use script for thumbnail generation
   - `scripts/list-drive-folders.js` - Exploratory script for Google Drive
   - `scripts/setup.js` - Setup script that may no longer be needed

2. **Unused Components**:
   - `src/components/SyncedVideoPlayer.js` - Has been replaced by YouTubeVideoPlayer
   - `src/components/VideoComparisonTool.js` - Older version of the tool

3. **Legacy Utilities**:
   - `src/utils/googleDriveUtils.js` - No longer needed after migration to YouTube

4. **Duplicate Data Files**:
   - `src/data/video-library.json` - Replaced by `public/youtube_videos.json`

## Archiving Process

1. Create an `archived` folder in the project root
2. Create subfolders for each category: `scripts`, `components`, `utils`, `data`
3. Move the files to their respective archived folders
4. Update import statements in any remaining files to point to new locations if needed

## Files to Keep

1. **Core Application Files**:
   - `src/App.js` and `src/index.js` - Main application entry points
   - `src/index.css` and `src/App.css` - Main styles

2. **Active Components**:
   - `src/components/YouTubeVideoPlayer.js` - Current video player implementation
   - `src/components/VideoComparisonContainer.js` - Current main container

3. **Active Utilities**:
   - `src/utils/youtubeUtils.js` - YouTube integration utilities

4. **Configuration Files**:
   - `package.json` and `package-lock.json` - NPM configuration
   - `.env` - Environment variables
   - `tailwind.config.js` and `postcss.config.js` - Styling configuration

5. **Data Files**:
   - `public/youtube_videos.json` - Current video data

6. **Documentation**:
   - `README.md` - Main project documentation
   - This maintenance plan

## Specific Actions Required

1. Create the archive directory structure:
   ```
   mkdir -p archived/scripts archived/components archived/utils archived/data
   ```

2. Move files to archive (suggested PowerShell commands):
   ```powershell
   # Scripts
   Move-Item -Path "scripts/google-drive-fetcher.js" -Destination "archived/scripts/"
   Move-Item -Path "scripts/create-thumbnail.js" -Destination "archived/scripts/"
   Move-Item -Path "scripts/list-drive-folders.js" -Destination "archived/scripts/"
   Move-Item -Path "scripts/setup.js" -Destination "archived/scripts/"
   
   # Components
   Move-Item -Path "src/components/SyncedVideoPlayer.js" -Destination "archived/components/"
   Move-Item -Path "src/components/VideoComparisonTool.js" -Destination "archived/components/"
   
   # Utils
   Move-Item -Path "src/utils/googleDriveUtils.js" -Destination "archived/utils/"
   
   # Data
   Move-Item -Path "src/data/video-library.json" -Destination "archived/data/"
   ```

3. Update any import statements in active code (if needed)

4. Remove empty directories after archiving:
   ```powershell
   # Only remove if empty after archiving
   if ((Get-ChildItem -Path "scripts" -Force | Measure-Object).Count -eq 0) {
       Remove-Item -Path "scripts" -Force
   }
   
   if ((Get-ChildItem -Path "src/data" -Force | Measure-Object).Count -eq 0) {
       Remove-Item -Path "src/data" -Force
   }
   ```

5. Update `.gitignore` to exclude the archived folder (optional)

## Benefit of This Approach

- **Preserves History**: Files are kept for reference but moved out of active development
- **Cleaner Workspace**: Developers can focus on actively used files
- **Reduced Confusion**: Clear separation between active and legacy code
- **Simplified Maintenance**: Fewer files to manage and update
- **Easy Rollback**: If needed, archived files can be retrieved 