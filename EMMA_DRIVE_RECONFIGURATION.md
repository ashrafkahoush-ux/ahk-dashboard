# Emma Drive Sync Reconfiguration Complete

## ✅ What Was Done

### 1. Disconnected Previous Connections
- Cleared all cached credentials and OAuth tokens
- Removed work account configuration (ashraf@ahkstrategies.net)
- Reset to single-profile mode

### 2. Updated Configuration Files
**Modified**: `src/config/googleDriveConfig.js`
- Profile: **ashraf.kahoush@gmail.com ONLY**
- Root path: `/GoogleDrive/MyDrive/AHK Profile/Emma/`
- Removed work account references
- Added Outputs folder as PRIMARY output location

**Modified**: `.env.local`
- Disabled work account OAuth token
- Added single profile mode header
- Maintained personal account credentials

### 3. New Folder Structure
```
/GoogleDrive/MyDrive/AHK Profile/
└── Emma/
    ├── KnowledgeBase/     (Daily sync - Core knowledge)
    ├── Logs/              (Hourly sync - Activity tracking)
    ├── Dictionaries/      (Realtime sync - Language data)
    ├── Archives/          (Weekly sync - Historical data)
    └── Outputs/           ⭐ PRIMARY OUTPUT FOLDER (Realtime sync)
```

### 4. Created Helper Scripts
1. **reconfigure_emma_drive.js** - Main reconfiguration script
2. **create_emma_folders.ps1** - Folder creation guide
3. **test_emma_drive_upload.js** - Connection & upload test
4. **EMMA_DRIVE_STRUCTURE.md** - Full documentation

---

## 🚀 Next Steps

### Step 1: Create Folders in Google Drive (MANUAL)
1. Open: https://drive.google.com/drive/u/0/my-drive
2. Verify signed in as: **ashraf.kahoush@gmail.com**
3. Create folder structure:
   ```
   My Drive → New Folder "AHK Profile"
   AHK Profile → New Folder "Emma"
   Emma → Create 5 folders:
     - KnowledgeBase
     - Logs
     - Dictionaries
     - Archives
     - Outputs
   ```

### Step 2: Test Connection
```bash
node test_emma_drive_upload.js
```

**Expected Output:**
```
✅ Connected as: ashraf.kahoush@gmail.com
✅ Found: AHK Profile/
✅ Found: Emma/
✅ Found: Outputs/
✅ Test file uploaded successfully
```

### Step 3: Restart Dev Server with Cache Clear
```bash
# Stop current server (Ctrl+C in terminal)
npm run dev -- --force
```

### Step 4: Verify in Dashboard
1. Open dashboard: http://localhost:3001
2. Look for Google Drive sync status indicator
3. Verify connection shows: ashraf.kahoush@gmail.com
4. Check sync logs for activity

---

## 📋 Configuration Summary

### Profile Details
- **Email**: ashraf.kahoush@gmail.com
- **Root Path**: /AHK Profile/Emma/
- **Primary Output**: /AHK Profile/Emma/Outputs/
- **Permissions**: Read + Write (all folders)

### OAuth Configuration
- **Client ID**: Configured in .env.local
- **Client Secret**: Configured in .env.local
- **Refresh Token**: GOOGLE_PERSONAL_REFRESH_TOKEN
- **Redirect URI**: http://localhost:3333/oauth2callback
- **Scopes**: drive, drive.file, drive.metadata.readonly

### Sync Settings
- **Auto-sync**: Enabled
- **Interval**: 24 hours
- **Max file size**: 50MB
- **Allowed types**: PDF, Docs, Sheets, TXT, MD, JSON

---

## 🧪 Testing Checklist

- [ ] Folders created in Google Drive
- [ ] Signed in as ashraf.kahoush@gmail.com
- [ ] test_emma_drive_upload.js passes all tests
- [ ] Test file visible in Outputs/ folder
- [ ] Dev server restarted with --force flag
- [ ] Dashboard shows Drive sync status
- [ ] No OAuth errors in console
- [ ] Emma can write to Outputs/ folder

---

## 📁 Files Modified

1. ✅ `src/config/googleDriveConfig.js` - Single profile configuration
2. ✅ `.env.local` - Work account disabled
3. ✅ `reconfigure_emma_drive.js` - Reconfiguration script (NEW)
4. ✅ `create_emma_folders.ps1` - Folder setup guide (NEW)
5. ✅ `test_emma_drive_upload.js` - Upload test script (NEW)
6. ✅ `EMMA_DRIVE_STRUCTURE.md` - Documentation (NEW)
7. ✅ `EMMA_DRIVE_RECONFIGURATION.md` - This file (NEW)

---

## 🔍 Troubleshooting

### Issue: "Connection failed"
**Solution**: 
```bash
node setup_emma_oauth.js
# Follow prompts to re-authorize ashraf.kahoush@gmail.com
```

### Issue: "Emma folder structure not found"
**Solution**: 
```bash
powershell -ExecutionPolicy Bypass -File create_emma_folders.ps1
# Follow manual instructions to create folders
```

### Issue: "Upload failed - Permission denied"
**Solution**:
1. Verify folder ownership in Google Drive
2. Right-click Emma folder → Share → Verify ashraf.kahoush@gmail.com is owner
3. Check folder is not in Trash

### Issue: "Wrong account connected"
**Solution**:
```bash
# Clear credentials
rm -rf server/integrations/google/credentials.json
rm -rf server/tmp/oauth/*

# Re-run OAuth setup
node setup_emma_oauth.js
# IMPORTANT: Select ashraf.kahoush@gmail.com in browser
```

---

## 📞 Support Commands

```bash
# Check OAuth status
node setup_emma_oauth.js

# Test connection
node test_emma_drive_upload.js

# View config
cat src/config/googleDriveConfig.js

# View env vars
cat .env.local | grep GOOGLE

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev -- --force
```

---

## ✅ Success Criteria

When setup is complete, you should see:

1. **In Google Drive**:
   - AHK Profile/Emma/ folder exists
   - All 5 subfolders present
   - Test file in Outputs/ folder

2. **In Terminal**:
   ```
   ✅ All Tests Passed!
   ✅ Connected to ashraf.kahoush@gmail.com
   ✅ Emma folder structure found
   ✅ Test file uploaded successfully
   ```

3. **In Dashboard**:
   - Google Drive sync indicator green
   - Profile shows: ashraf.kahoush@gmail.com
   - Last sync timestamp recent
   - No error notifications

---

## 📖 Additional Documentation

- **Full folder spec**: `EMMA_DRIVE_STRUCTURE.md`
- **OAuth setup**: `setup_emma_oauth.js`
- **Sync configuration**: `src/config/googleDriveConfig.js`
- **Integration code**: `src/integrations/googleDriveLinker.js`

---

**Status**: ✅ Reconfiguration Complete - Ready for Testing  
**Date**: $(date)  
**Profile**: ashraf.kahoush@gmail.com  
**Root**: /AHK Profile/Emma/  
