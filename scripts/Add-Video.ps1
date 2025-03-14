# Add-Video.ps1
# This PowerShell script helps add new videos to the youtube_videos.json file.
#
# Usage:
#   .\Add-Video.ps1 -VideoId "YOUTUBE_ID" -Title "VIDEO_TITLE" [-File "ORIGINAL_FILENAME"]
#
# Example:
#   .\Add-Video.ps1 -VideoId "dQw4w9WgXcQ" -Title "gw_adult" -File "gw_adult"

param(
    [Parameter(Mandatory = $true)]
    [string]$VideoId,
    
    [Parameter(Mandatory = $true)]
    [string]$Title,
    
    [Parameter(Mandatory = $false)]
    [string]$File
)

# If File is not provided, use Title
if (-not $File) {
    $File = $Title
}

# Set default values
$Now = Get-Date
# Set date two years in the future to avoid expiration concerns
$FutureDate = $Now.AddYears(2)
$FormattedDate = $FutureDate.ToString("yyyy-MM-ddTHH:mm:ssZ")

# Create video data object
$VideoData = @{
    videoId = $VideoId
    title = $Title
    description = "Video for synchronized playback in LCN Video Viewer application. File: $File"
    thumbnailUrl = "https://img.youtube.com/vi/$VideoId/mqdefault.jpg"
    uploadDate = $FormattedDate
    channelId = "UCZRtuakSlPupskaTcu3km4A"
    channelTitle = "mischa gushiken"
}

# Path to the JSON file
$JsonFilePath = Join-Path $PSScriptRoot "..\public\youtube_videos.json"

try {
    # Create backup
    $BackupPath = Join-Path $PSScriptRoot "..\public\youtube_videos_backup.json"
    Copy-Item -Path $JsonFilePath -Destination $BackupPath -Force
    Write-Host "Backup created at $BackupPath"

    # Read existing data
    $JsonData = Get-Content -Path $JsonFilePath -Raw
    $Videos = $JsonData | ConvertFrom-Json
    
    # Find the highest ID
    $HighestId = 0
    foreach ($Video in $Videos) {
        if ($Video.id -gt $HighestId) {
            $HighestId = $Video.id
        }
    }
    
    # Add new video with next ID
    $VideoData["id"] = $HighestId + 1
    $Videos += [PSCustomObject]$VideoData
    
    # Write updated data back to the file
    $Videos | ConvertTo-Json -Depth 10 | Set-Content -Path $JsonFilePath
    
    Write-Host "Success: Added new video '$($VideoData.title)' with ID $($VideoData.id)" -ForegroundColor Green
    Write-Host "Remember to rebuild and deploy the app with:" -ForegroundColor Yellow
    Write-Host "  npm run build" -ForegroundColor Yellow
    Write-Host "  npm run deploy" -ForegroundColor Yellow
    
} catch {
    Write-Host "Error updating YouTube videos file: $_" -ForegroundColor Red
    exit 1
} 