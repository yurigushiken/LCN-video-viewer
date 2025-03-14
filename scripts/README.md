# LCN Video Viewer Scripts

This directory contains utility scripts to help maintain the LCN Video Viewer application.

## Available Scripts

### Add-Video.ps1

A PowerShell script to add a new video to the YouTube videos JSON file.

**Usage:**
```powershell
.\Add-Video.ps1 -VideoId "YOUTUBE_ID" -Title "VIDEO_TITLE" [-File "ORIGINAL_FILENAME"]
```

**Example:**
```powershell
.\Add-Video.ps1 -VideoId "dQw4w9WgXcQ" -Title "gw_adult" -File "gw_adult"
```

### Update-VideoTitle.ps1

A PowerShell script to update the title of an existing video in the YouTube videos JSON file.

**Usage:**
```powershell
.\Update-VideoTitle.ps1 -VideoId "YOUTUBE_ID" -NewTitle "NEW_TITLE"
```

**Example:**
```powershell
.\Update-VideoTitle.ps1 -VideoId "dQw4w9WgXcQ" -NewTitle "gw_adult_updated"
```

### add-video.js

A Node.js script to add a new video to the YouTube videos JSON file. Provides the same functionality as Add-Video.ps1 but can be used on any platform that supports Node.js.

**Usage:**
```bash
node add-video.js --videoId=YOUTUBE_ID --title=VIDEO_TITLE [--file=ORIGINAL_FILENAME]
```

**Example:**
```bash
node add-video.js --videoId=dQw4w9WgXcQ --title=gw_adult --file=gw_adult
```

## Important Notes

1. After running any of these scripts, you need to rebuild and deploy the application:
   ```powershell
   npm run build
   npm run deploy
   ```

2. All scripts automatically create a backup of the `youtube_videos.json` file before making any changes.

3. The YouTube video IDs can be found in the URL of the video on YouTube:
   ```
   https://www.youtube.com/watch?v=dQw4w9WgXcQ
                                    ^^^^^^^^^^^
                                    This is the video ID
   ``` 