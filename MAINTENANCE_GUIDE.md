# LCN Video Viewer Maintenance Guide

This guide provides instructions for maintaining the LCN Video Viewer application, including how to add new videos, update existing videos, and manage the codebase.

## Project Structure

The project follows a standard React application structure:

- `/public`: Static assets and data
  - `youtube_videos.json`: Contains metadata for all YouTube videos
  - `/thumbnails`: Contains thumbnail images
  - `/data`: Contains additional data files
- `/src`: Source code
  - `/components`: React components
  - `/utils`: Utility functions
  - `App.js`: Main application component

## Adding New Videos

### 1. Upload Videos to YouTube

1. Log in to the YouTube account used for hosting the videos
2. Upload the new video(s)
3. Make sure the videos are set to "Unlisted" for privacy
4. Copy the video ID from the YouTube URL (e.g., `dQw4w9WgXcQ` from `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)

### 2. Update the YouTube Videos JSON File

1. Open `public/youtube_videos.json`
2. Add a new entry for each video in the following format:

```json
{
  "id": [next_available_id],
  "videoId": "[youtube_video_id]",
  "title": "[descriptive_title]",
  "description": "Video for synchronized playback in LCN Video Viewer application. File: [file_name]",
  "thumbnailUrl": "https://img.youtube.com/vi/[youtube_video_id]/mqdefault.jpg",
  "uploadDate": "[upload_date]",
  "channelId": "[channel_id]",
  "channelTitle": "[channel_title]"
}
```

3. Save the file

### 3. Rebuild and Deploy

After updating the JSON file, rebuild and deploy the application:

```powershell
npm run build
npm run deploy
```

## Updating Existing Videos

### Changing Video Titles

1. Open `public/youtube_videos.json`
2. Find the entry for the video you want to update
3. Modify the `title` field
4. Save the file
5. Rebuild and deploy the application

### Replacing Videos

If you need to replace a video with a new version:

1. Upload the new video to YouTube
2. Open `public/youtube_videos.json`
3. Find the entry for the video you want to replace
4. Update the `videoId` field with the new YouTube video ID
5. Update the `thumbnailUrl` field to match the new video ID
6. Save the file
7. Rebuild and deploy the application

## Troubleshooting

### Videos Not Loading

1. Check that the video ID in `youtube_videos.json` matches the actual YouTube video ID
2. Verify that the YouTube video is accessible (not private or deleted)
3. Check the browser console for any errors

### Synchronization Issues

If videos are not synchronizing properly:

1. Check that all videos have similar frame rates
2. Ensure the leader video is properly set
3. Try resetting all videos and synchronizing again

## Backup Procedures

### Creating Backups

Before making significant changes, create a backup of the `youtube_videos.json` file:

```powershell
Copy-Item -Path public/youtube_videos.json -Destination public/youtube_videos_backup.json
```

### Restoring from Backup

If needed, restore from a backup:

```powershell
Copy-Item -Path public/youtube_videos_backup.json -Destination public/youtube_videos.json -Force
```

## Contact Information

For technical support or questions about the application, contact:

- Yuri Gushiken (mkg2145@tc.columbia.edu)
- Yuexin Li (yl4964@columbia.edu) 