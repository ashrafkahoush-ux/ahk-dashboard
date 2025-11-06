# Emma Google Drive Folder Setup - Simple Version
# Creates required folder structure

Write-Host "`n=== Emma Google Drive Folder Setup ===" -ForegroundColor Cyan
Write-Host "Profile: ashraf.kahoush@gmail.com" -ForegroundColor Yellow
Write-Host "Root: /AHK Profile/Emma/`n" -ForegroundColor Yellow

Write-Host "Manual Setup Instructions:`n" -ForegroundColor Green

Write-Host "1. Open Google Drive:" -ForegroundColor White
Write-Host "   https://drive.google.com/drive/u/0/my-drive`n"

Write-Host "2. Verify you are signed in as:" -ForegroundColor White
Write-Host "   ashraf.kahoush@gmail.com`n" -ForegroundColor Yellow

Write-Host "3. Create this folder structure:" -ForegroundColor White
Write-Host "   My Drive" -ForegroundColor Gray
Write-Host "   └── AHK Profile" -ForegroundColor Gray
Write-Host "       └── Emma" -ForegroundColor Gray
Write-Host "           ├── KnowledgeBase" -ForegroundColor Cyan
Write-Host "           ├── Logs" -ForegroundColor Cyan
Write-Host "           ├── Dictionaries" -ForegroundColor Cyan
Write-Host "           ├── Archives" -ForegroundColor Cyan
Write-Host "           └── Outputs (PRIMARY)" -ForegroundColor Yellow
Write-Host ""

Write-Host "4. Steps to create:" -ForegroundColor White
Write-Host "   a) Right-click in My Drive > New Folder > Name it 'AHK Profile'" -ForegroundColor Gray
Write-Host "   b) Open 'AHK Profile' folder" -ForegroundColor Gray
Write-Host "   c) Create new folder named 'Emma'" -ForegroundColor Gray
Write-Host "   d) Open 'Emma' folder" -ForegroundColor Gray
Write-Host "   e) Create these 5 folders inside Emma:" -ForegroundColor Gray
Write-Host "      - KnowledgeBase" -ForegroundColor Cyan
Write-Host "      - Logs" -ForegroundColor Cyan
Write-Host "      - Dictionaries" -ForegroundColor Cyan
Write-Host "      - Archives" -ForegroundColor Cyan
Write-Host "      - Outputs" -ForegroundColor Cyan
Write-Host ""

Write-Host "5. Test upload:" -ForegroundColor White
Write-Host "   - Navigate to Emma/Outputs/" -ForegroundColor Gray
Write-Host "   - Click 'New' > 'File upload'" -ForegroundColor Gray
Write-Host "   - Upload any test file" -ForegroundColor Gray
Write-Host "   - Verify upload completes successfully`n" -ForegroundColor Gray

Write-Host "=== After creating folders ===" -ForegroundColor Cyan
Write-Host "Run these commands:`n" -ForegroundColor White
Write-Host "   node test_emma_drive_upload.js" -ForegroundColor Yellow
Write-Host "   (Tests connection and uploads a test file)`n" -ForegroundColor Gray

Write-Host "Press any key to continue..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
