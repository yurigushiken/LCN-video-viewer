import os
import pickle
import time
import json
import glob
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

# This scope allows uploading videos to YouTube.
SCOPES = ['https://www.googleapis.com/auth/youtube.upload']

# Path to the NEW YouTube client secrets file and token storage.
# Using the dedicated YouTube credentials instead of the general one
CLIENT_SECRETS_FILE = os.path.join('credentials', 'youtube', 'client_secret_661140052004-m7tshu43ns8d6bg7t3uc8ja3unik6krq.apps.googleusercontent.com.json')
# Store the token in the YouTube directory to avoid conflicting with other tokens
TOKEN_PICKLE_FILE = os.path.join('credentials', 'youtube', 'token.pickle')

# Instead of hardcoded paths, we'll use the videos in the heatmap_videos directory
VIDEO_DIRECTORY = "heatmap_videos"

# The email associated with the new YouTube account
YOUTUBE_EMAIL = "mischagushiken@gmail.com"

def get_authenticated_service():
    credentials = None
    
    # Ensure token directory exists
    os.makedirs(os.path.dirname(TOKEN_PICKLE_FILE), exist_ok=True)
    
    # Delete any existing token.pickle to force new authentication with new account
    if os.path.exists(TOKEN_PICKLE_FILE):
        try:
            os.remove(TOKEN_PICKLE_FILE)
            print(f"Removed existing token file to force new authentication")
        except Exception as e:
            print(f"Could not remove token file: {e}")
    
    # If there are no (valid) credentials, let the user log in.
    if not credentials or not credentials.valid:
        if credentials and credentials.expired and credentials.refresh_token:
            print("Refreshing expired credentials")
            credentials.refresh(Request())
        else:
            print("No valid credentials found. Starting the authorization flow.")
            # Ensure the client secrets file exists
            if not os.path.exists(CLIENT_SECRETS_FILE):
                print(f"ERROR: Client secrets file not found at {CLIENT_SECRETS_FILE}")
                print("Please check the README for instructions on obtaining OAuth credentials.")
                return None
                
            flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRETS_FILE, SCOPES)
            credentials = flow.run_local_server(port=0)
            
            # Save the credentials for the next run
            with open(TOKEN_PICKLE_FILE, 'wb') as token:
                print(f"Saving credentials to {TOKEN_PICKLE_FILE}")
                pickle.dump(credentials, token)
    
    # Build the YouTube API client
    return build('youtube', 'v3', credentials=credentials)

def upload_video(youtube, file_path, title, description, tags, category_id, privacy_status):
    print(f"Uploading {os.path.basename(file_path)}")
    
    # Call the API's videos.insert method to create and upload the video.
    insert_request = youtube.videos().insert(
        part="snippet,status",
        body={
            "snippet": {
                "title": title,
                "description": description,
                "tags": tags,
                "categoryId": category_id
            },
            "status": {
                "privacyStatus": privacy_status
            }
        },
        media_body=MediaFileUpload(file_path, chunksize=1024*1024, resumable=True)
    )
    
    response = None
    error = None
    retry = 0
    
    while response is None:
        try:
            print("Uploading file...")
            status, response = insert_request.next_chunk()
            if status:
                print(f"Uploaded {int(status.progress() * 100)}%")
        except HttpError as e:
            error = f"An HTTP error {e.resp.status} occurred:\n{e.content}"
            if error:
                print(error)
                retry += 1
                if retry > 3:
                    raise
                time.sleep(5)
        except Exception as e:
            print(f"A non-HTTP error occurred: {e}")
            retry += 1
            if retry > 3:
                raise
            time.sleep(5)
    
    return response

def extract_video_name(file_path):
    # Extract just the filename without path and extension
    base_name = os.path.basename(file_path)
    return os.path.splitext(base_name)[0]

def get_video_thumbnail_url(video_id):
    # YouTube provides several thumbnail options - we'll use the medium quality one
    return f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg"

def get_video_paths():
    """Get all MP4 video paths from the heatmap_videos directory."""
    video_paths = glob.glob(os.path.join(VIDEO_DIRECTORY, "*.mp4"))
    
    if not video_paths:
        print(f"No MP4 videos found in {VIDEO_DIRECTORY}")
        return []
    
    # Sort the video paths alphabetically to ensure a consistent order
    video_paths.sort()
    
    for path in video_paths:
        print(f"Found video: {path}")
    
    return video_paths

def main():
    print("=" * 80)
    print("YouTube Video Uploader for LCN Video Viewer")
    print("=" * 80)
    print("This script will upload videos to YouTube using the dedicated YouTube credentials.")
    print(f"IMPORTANT: When the authentication window opens, please sign in with {YOUTUBE_EMAIL}")
    print("=" * 80)
    
    # Get all video paths from the heatmap_videos directory
    video_paths = get_video_paths()
    
    if not video_paths:
        print("No valid video paths found. Please check that videos exist in the heatmap_videos directory.")
        return
    
    print(f"\nFound {len(video_paths)} valid videos to upload.")
    
    # Ask for confirmation before proceeding
    confirmation = input(f"Do you want to upload {len(video_paths)} videos to YouTube using {YOUTUBE_EMAIL}? (y/n): ")
    if confirmation.lower() != 'y':
        print("Upload canceled.")
        return
    
    youtube = get_authenticated_service()
    if not youtube:
        print("Failed to authenticate with YouTube API. Please check your credentials.")
        return
        
    uploaded_videos = []
    
    for index, video_path in enumerate(video_paths, start=1):
        try:
            # Extract video name for the title
            video_name = extract_video_name(video_path)
            
            # Set up upload parameters
            title = f"LCN Video Viewer - {video_name}"
            description = f"Video for synchronized playback in LCN Video Viewer application. File: {video_name}"
            tags = ["LCN", "synchronized", "video", "viewer"]
            category_id = "22"  # 22 corresponds to People & Blogs
            privacy_status = "unlisted"  # Videos are accessible by link but not public
            
            # Upload the video
            response = upload_video(youtube, video_path, title, description, tags, category_id, privacy_status)
            
            # Get the video ID and other information
            video_id = response.get("id")
            
            # Create a video entry in our format
            video_entry = {
                "id": index,
                "videoId": video_id,
                "title": video_name,
                "description": description,
                "thumbnailUrl": get_video_thumbnail_url(video_id),
                "uploadDate": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "channelId": response.get("snippet", {}).get("channelId", ""),
                "channelTitle": response.get("snippet", {}).get("channelTitle", "")
            }
            
            uploaded_videos.append(video_entry)
            
            print(f"Video uploaded successfully. Video ID: {video_id}")
            print(f"Video URL: https://www.youtube.com/watch?v={video_id}")
            print("-" * 50)
            
            # Add a small delay between uploads to avoid rate limits
            time.sleep(2)
            
        except HttpError as e:
            print(f"An HTTP error occurred while uploading {video_path}:", e)
        except Exception as e:
            print(f"An error occurred while uploading {video_path}:", e)
    
    # Save the uploaded video IDs to a JSON file for later use
    output_path_app = "public/youtube_videos.json"
    
    # Ensure the directory exists
    os.makedirs(os.path.dirname(output_path_app), exist_ok=True)
    
    with open(output_path_app, "w") as f:
        json.dump(uploaded_videos, f, indent=2)
    
    print(f"\nCompleted uploading {len(uploaded_videos)} videos.")
    print(f"Video details saved to {output_path_app}")
    print("\nYou can now start or restart your React application to see the videos:")
    print("npm start")

if __name__ == '__main__':
    main() 