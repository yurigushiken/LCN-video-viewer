# YouTube Video Uploader for LCN Video Viewer

This guide explains how to upload videos to YouTube for use with the LCN Video Viewer application.

## Prerequisites

Before you begin, make sure you have:

1. Python 3.6 or later installed
2. Required Python packages installed
3. A Google account with access to YouTube
4. OAuth 2.0 credentials for the YouTube API

## Setting Up OAuth 2.0 Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the YouTube Data API v3
4. Create OAuth 2.0 credentials:
   - Go to "Credentials" in the left sidebar
   - Click "Create Credentials" and select "OAuth client ID"
   - Choose "Desktop app" as the application type
   - Name your client and click "Create"
5. Download the credentials JSON file
6. Rename it to `client_secret.json` and place it in the same directory as the script

## Installing Dependencies

Install the required Python packages with pip:

```
pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib
```

## Configuring the Script

1. Open `youtube_uploader.py` in a text editor
2. Update the `VIDEO_PATHS` list with the paths to your video files
3. You can customize the video titles, descriptions, and tags if needed

## Running the Script

1. Open a command prompt or PowerShell window
2. Navigate to the directory containing the script
3. Run the script:

```
python youtube_uploader.py
```

4. The first time you run the script, a browser window will open asking you to authorize the application
5. After authorization, the script will begin uploading videos
6. The script will save video details to `public/youtube_videos.json`

## Monitoring Progress

- The script will display upload progress for each video
- After each successful upload, the video ID and URL will be displayed
- When all uploads are complete, a summary will be shown

## After Uploading

Once all videos are uploaded:

1. The video details are automatically saved to `public/youtube_videos.json`
2. Start the app with `npm start` to see your videos in the LCN Video Viewer
3. Your videos will be set as "unlisted" on YouTube, meaning they're only accessible via direct link

## Troubleshooting

- If you encounter authorization errors, delete the `token.pickle` file and run the script again
- If uploads fail, check your internet connection and try again
- For quota limit errors, wait an hour before trying again (YouTube API has daily limits) 