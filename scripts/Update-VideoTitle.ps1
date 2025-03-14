# Update-VideoTitle.ps1
# This PowerShell script helps update video titles in the youtube_videos.json file.
#
# Usage:
#   .\Update-VideoTitle.ps1 -VideoId "YOUTUBE_ID" -NewTitle "NEW_TITLE"
#
# Example:
#   .\Update-VideoTitle.ps1 -VideoId "dQw4w9WgXcQ" -NewTitle "gw_adult_updated"

param(
    [Parameter(Mandatory = $true)]
    [string]$VideoId,
    
    [Parameter(Mandatory = $true)]
    [string]$NewTitle
)

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
    
    # Find the video by ID
    $Found = $false
    $OldTitle = ""
    
    for ($i = 0; $i -lt $Videos.Length; $i++) {
        if ($Videos[$i].videoId -eq $VideoId) {
            $OldTitle = $Videos[$i].title
            $Videos[$i].title = $NewTitle
            
            # Also update description if it contains the old title
            if ($Videos[$i].description -match "File: $OldTitle") {
                $Videos[$i].description = $Videos[$i].description -replace "File: $OldTitle", "File: $NewTitle"
            }
            
            $Found = $true
            break
        }
    }
    
    if (-not $Found) {
        Write-Host "Error: No video found with ID '$VideoId'" -ForegroundColor Red
        exit 1
    }
    
    # Write updated data back to the file
    $Videos | ConvertTo-Json -Depth 10 | Set-Content -Path $JsonFilePath
    
    Write-Host "Success: Updated video title from '$OldTitle' to '$NewTitle'" -ForegroundColor Green
    Write-Host "Remember to rebuild and deploy the app with:" -ForegroundColor Yellow
    Write-Host "  npm run build" -ForegroundColor Yellow
    Write-Host "  npm run deploy" -ForegroundColor Yellow
    
} catch {
    Write-Host "Error updating YouTube videos file: $_" -ForegroundColor Red
    exit 1
} 