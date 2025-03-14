# Setting Up Google Drive Videos for the LCN Video Viewer

This guide will help you set up and use the Google Drive integration with the LCN Heat Map Video Comparison Tool.

## Prerequisites

1. You need a Google account with access to the videos you want to display
2. Node.js installed on your computer
3. The Google API credentials file (provided separately)

## Step 1: Setting Up Google API Credentials

1. Create a `credentials` folder in the project root if it doesn't exist already:
   ```
   mkdir -p credentials
   ```

2. Place the provided Google API credentials file in the `credentials` folder. It should be named something like:
   ```
   client_secret_992130532278-7ohaffmihohg0p5d2i1bho3hb6kkt9gl.apps.googleusercontent.com.json
   ```

## Step 2: Finding Your Google Drive Folder ID

1. Run the folder listing script:
   ```
   node scripts/list-drive-folders.js
   ```

2. The first time you run this, you'll need to authorize the application:
   - The script will provide a URL to visit in your browser
   - Sign in with your Google account and grant the requested permissions
   - Copy the authorization code shown in the browser
   - Paste the code back into the terminal when prompted

3. The script will list all accessible shared drives and folders, showing their IDs:
   ```
   ID                                     | NAME
   -------------------------------------------------
   1f6NcN1hPg5t0YtgezKH8RpZj0Z2URLot     | Lab Videos
   ```

4. Note the ID of the folder containing your videos (e.g., `1f6NcN1hPg5t0YtgezKH8RpZj0Z2URLot`)

## Step 3: Fetching Videos from Google Drive

1. Run the Google Drive fetcher script with your folder ID:
   ```
   node scripts/google-drive-fetcher.js YOUR_FOLDER_ID
   ```
   Replace `YOUR_FOLDER_ID` with the ID you found in Step 2.

2. The script will:
   - Find all video files in the specified folder
   - Create a JSON file with the video information
   - Save it to both `src/data/video-library.json` and `public/data/video-library.json`

3. You should see output confirming the videos found and saved.

## Step 4: Running the Application

1. If this is your first time, install dependencies:
   ```
   npm install
   ```

2. Start the React application:
   ```
   npm start
   ```

3. The application will open in your browser, showing the video library
   - Drag videos from the library panel to the viewing area
   - Use the buttons at the top to switch between viewing modes

## Important Notes

- The application only requests READ-ONLY access to your Google Drive
- Videos must be viewable by "Anyone with the link" in your Google Drive settings
- The `preview` URL format is used for better video streaming performance
- Synchronization features ensure all videos play and pause together

## Troubleshooting

If videos don't appear:

1. Make sure you have run the `google-drive-fetcher.js` script with the correct folder ID
2. Check that the videos have the correct sharing permissions in Google Drive
3. Verify that the `public/data/video-library.json` file exists and contains valid data
4. If you still have issues, check the browser console for any errors

## Updating the Video Library

If you add new videos to your Google Drive folder, simply run the fetcher script again:

```
node scripts/google-drive-fetcher.js YOUR_FOLDER_ID
```

Then refresh your browser to see the updated library. 