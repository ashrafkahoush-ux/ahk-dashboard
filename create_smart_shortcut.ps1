# create_smart_shortcut.ps1
# Creates a smart desktop shortcut that checks if dev server is running

$ErrorActionPreference = "Stop"

Write-Host "Creating Smart Dashboard Shortcut..." -ForegroundColor Cyan
Write-Host ""

$desktopPath = [Environment]::GetFolderPath("Desktop")
$projectPath = "C:\Users\ashra\OneDrive\Desktop\AHK_Dashboard_v1"
$shortcutPath = Join-Path $desktopPath "AHK Dashboard.lnk"

# Create the launcher script
$launcherScript = @"
# launch_dashboard.ps1
# Smart launcher that ensures dev server is running

`$ErrorActionPreference = "SilentlyContinue"
`$projectPath = "$projectPath"
`$url = "http://localhost:3000"

Write-Host "🚀 Launching AHK Dashboard..." -ForegroundColor Cyan

# Check if dev server is running
try {
    `$response = Invoke-WebRequest -Uri `$url -UseBasicParsing -TimeoutSec 2
    if (`$response.StatusCode -eq 200) {
        Write-Host "✅ Dashboard is already running!" -ForegroundColor Green
        Start-Process `$url
        exit 0
    }
} catch {
    Write-Host "⚠️  Dashboard not running. Starting dev server..." -ForegroundColor Yellow
}

# Start the dev server in a new window
Write-Host "🔧 Starting development server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectPath'; npm run dev" -WindowStyle Normal

# Wait for server to start (max 30 seconds)
Write-Host "⏳ Waiting for server to start..." -ForegroundColor Yellow
`$maxAttempts = 30
`$attempt = 0
`$serverReady = `$false

while (`$attempt -lt `$maxAttempts -and -not `$serverReady) {
    Start-Sleep -Seconds 1
    try {
        `$response = Invoke-WebRequest -Uri `$url -UseBasicParsing -TimeoutSec 1
        if (`$response.StatusCode -eq 200) {
            `$serverReady = `$true
            Write-Host "✅ Server is ready!" -ForegroundColor Green
        }
    } catch {
        `$attempt++
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}

if (`$serverReady) {
    Write-Host ""
    Write-Host "🌐 Opening dashboard in browser..." -ForegroundColor Green
    Start-Sleep -Seconds 1
    Start-Process `$url
    Write-Host "✅ Dashboard launched successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "Server failed to start within 30 seconds" -ForegroundColor Red
    Write-Host "Try running manually in project directory" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}
"@

# Save the launcher script
$launcherPath = Join-Path $projectPath "launch_dashboard.ps1"
Set-Content -Path $launcherPath -Value $launcherScript
Write-Host "Created launcher script: launch_dashboard.ps1" -ForegroundColor Green

# Create the shortcut
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)

# Set shortcut properties
$shortcut.TargetPath = "powershell.exe"
$shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$launcherPath`""
$shortcut.WorkingDirectory = $projectPath
$shortcut.Description = "AHK Dashboard - Smart Launcher (Auto-starts dev server)"
$shortcut.IconLocation = "shell32.dll,13"  # Globe icon

# Save shortcut
$shortcut.Save()

Write-Host "Smart shortcut created!" -ForegroundColor Green
Write-Host ""
Write-Host "Location: $shortcutPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Features:" -ForegroundColor Yellow
Write-Host "   - Checks if dashboard is already running" -ForegroundColor White
Write-Host "   - Automatically starts dev server if needed" -ForegroundColor White
Write-Host "   - Waits for server to be ready before opening browser" -ForegroundColor White
Write-Host "   - Opens http://localhost:3000 in default browser" -ForegroundColor White
Write-Host ""
Write-Host "Double-click the shortcut to test it!" -ForegroundColor Green
Write-Host ""
