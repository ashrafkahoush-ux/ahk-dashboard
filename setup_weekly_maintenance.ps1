# setup_weekly_maintenance.ps1
# Sets up Windows Task Scheduler for weekly Emma maintenance

$ErrorActionPreference = "Stop"

Write-Host "🔧 Setting up Weekly Emma Maintenance Task..." -ForegroundColor Cyan
Write-Host ""

# Configuration
$taskName = "Emma Weekly Maintenance"
$projectPath = "C:\Users\ashra\OneDrive\Desktop\AHK_Dashboard_v1"
$scriptPath = Join-Path $projectPath "src\scripts\run_maintenance.ps1"

# Create the maintenance runner script
$maintenanceScript = @"
# run_maintenance.ps1
# Runs weekly maintenance: Archive -> Cleanup -> Refresh

`$ErrorActionPreference = "Stop"
`$projectPath = "$projectPath"

Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Emma Weekly Maintenance" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Started: `$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
Write-Host ""

# Change to project directory
Set-Location `$projectPath

# Step 1: Archive
Write-Host "📦 Step 1: Archiving project data..." -ForegroundColor Green
node src/scripts/archive_project.js
if (`$LASTEXITCODE -ne 0) {
    Write-Host "❌ Archive failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🧹 Step 2: Cleaning up old data..." -ForegroundColor Green
node src/scripts/cleanup_old_data.js
if (`$LASTEXITCODE -ne 0) {
    Write-Host "❌ Cleanup failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔄 Step 3: Refreshing Emma memory..." -ForegroundColor Green
node src/scripts/refresh_agent_memory.js
if (`$LASTEXITCODE -ne 0) {
    Write-Host "❌ Refresh failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Weekly Maintenance Complete!" -ForegroundColor Green
Write-Host "Completed: `$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan

# Log to file
`$logFile = Join-Path `$projectPath ".archive" "maintenance.log"
"[`$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Weekly maintenance completed successfully" | Out-File -Append `$logFile

exit 0
"@

# Save the maintenance script
$scriptDir = Join-Path $projectPath "src\scripts"
if (-not (Test-Path $scriptDir)) {
    New-Item -ItemType Directory -Path $scriptDir -Force | Out-Null
}
Set-Content -Path $scriptPath -Value $maintenanceScript
Write-Host "✅ Created maintenance script: src\scripts\run_maintenance.ps1" -ForegroundColor Green
Write-Host ""

# Create the scheduled task
Write-Host "📅 Creating Windows Scheduled Task..." -ForegroundColor Cyan

# Task action: Run PowerShell script
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`"" `
    -WorkingDirectory $projectPath

# Task trigger: Weekly on Sunday at 2:00 AM
$trigger = New-ScheduledTaskTrigger `
    -Weekly `
    -DaysOfWeek Sunday `
    -At 2:00AM

# Task settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false

# Task principal (run as current user)
$principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType S4U `
    -RunLevel Limited

# Register the task
try {
    # Remove existing task if it exists
    $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($existingTask) {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Host "⚠️  Removed existing task" -ForegroundColor Yellow
    }
    
    # Create new task
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description "Weekly maintenance for Emma AI: Archive, Cleanup, and Memory Refresh" | Out-Null
    
    Write-Host "✅ Scheduled task created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Task Details:" -ForegroundColor Cyan
    Write-Host "   Name: $taskName" -ForegroundColor White
    Write-Host "   Schedule: Every Sunday at 2:00 AM" -ForegroundColor White
    Write-Host "   Script: $scriptPath" -ForegroundColor White
    Write-Host ""
    
    # Test the task
    Write-Host "🧪 Would you like to run the maintenance now to test it? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    
    if ($response -eq 'Y' -or $response -eq 'y') {
        Write-Host ""
        Write-Host "🚀 Running maintenance task..." -ForegroundColor Cyan
        Write-Host ""
        Start-ScheduledTask -TaskName $taskName
        Write-Host ""
        Write-Host "✅ Task started! Check Task Scheduler for status." -ForegroundColor Green
        Write-Host "📊 View logs: .archive\maintenance.log" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "✅ Setup complete! Task will run automatically every Sunday at 2:00 AM." -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Failed to create scheduled task:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Manual setup:" -ForegroundColor Yellow
    Write-Host "   1. Open Task Scheduler (taskschd.msc)" -ForegroundColor White
    Write-Host "   2. Create Basic Task" -ForegroundColor White
    Write-Host "   3. Name: $taskName" -ForegroundColor White
    Write-Host "   4. Trigger: Weekly, Sunday, 2:00 AM" -ForegroundColor White
    Write-Host "   5. Action: Start a program" -ForegroundColor White
    Write-Host "   6. Program: powershell.exe" -ForegroundColor White
    Write-Host "   7. Arguments: -NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`"" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📌 Next Steps:" -ForegroundColor Yellow
Write-Host "   • Task runs automatically every Sunday at 2:00 AM" -ForegroundColor White
Write-Host "   • Manually run: Start-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
Write-Host "   • View task: Get-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
Write-Host "   • Check logs: .archive\maintenance.log" -ForegroundColor White
Write-Host ""
