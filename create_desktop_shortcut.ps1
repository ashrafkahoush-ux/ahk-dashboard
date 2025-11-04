# Create AHK Dashboard Desktop Shortcut
# This script creates a shortcut on your desktop that opens the dashboard in your default browser

$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "AHK Dashboard.lnk"
$iconPath = Join-Path $PSScriptRoot "public\favicon.ico"
$projectPath = $PSScriptRoot

# Create WScript Shell object
$WScriptShell = New-Object -ComObject WScript.Shell

# Create shortcut
$shortcut = $WScriptShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "http://localhost:3001"
$shortcut.Description = "AHK Strategies Dashboard - Your Command Center"
$shortcut.WorkingDirectory = $projectPath

# Set icon (if favicon exists)
if (Test-Path $iconPath) {
    $shortcut.IconLocation = $iconPath
} else {
    # Use default browser icon
    $shortcut.IconLocation = "explorer.exe,0"
}

# Save the shortcut
$shortcut.Save()

Write-Host "Desktop shortcut created successfully!" -ForegroundColor Green
Write-Host "Location: $shortcutPath" -ForegroundColor Cyan
Write-Host "URL: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Make sure your dev server is running (npm run dev) before clicking the shortcut!" -ForegroundColor Yellow
