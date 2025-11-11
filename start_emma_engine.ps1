#!/usr/bin/env pwsh
# Emma Engine Startup Script
# Starts the Emma Engine intelligence core on port 7070

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "🧠 ═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   EMMA ENGINE LAUNCHER" -ForegroundColor Cyan
Write-Host "   ═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Navigate to Emma_Engine directory
Set-Location -Path "$PSScriptRoot\Emma_Engine"

Write-Host "   📂 Location: $(Get-Location)" -ForegroundColor Yellow
Write-Host "   🚀 Starting Emma Engine on port 7070..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   ═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Start Emma Engine
npm run dev
