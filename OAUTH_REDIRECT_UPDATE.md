# ✅ OAuth Redirect URI Update - Complete Checklist

## Status: ✅ CONFIGURATION UPDATED

### Changes Made

**1. Updated Redirect URI in Configuration**
- ✅ File: `src/config/googleDriveConfig.js`
- ✅ Changed: `redirect_uri` → `redirectUri`
- ✅ New value: `http://localhost:3000/auth/google/callback`

**2. Updated .env.local**
- ✅ Added `GOOGLE_DRIVE_CLIENT_ID`
- ✅ Added `GOOGLE_DRIVE_CLIENT_SECRET`
- ✅ Added `GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/auth/google/callback`
- ✅ Added `EMMA_DRIVE_ACTIVE_USER=ashraf.kahoush@gmail.com`
- ✅ Updated `GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback`
- ✅ Disabled work account (commented out)

**3. Updated googleDriveLinker.js**
- ✅ Changed `OAUTH_CONFIG.redirect_uri` → `OAUTH_CONFIG.redirectUri`
- ✅ Removed work account from `linkDrives()`
- ✅ Removed work account from `syncEmmaKnowledge()`
- ✅ Updated `getDriveStatus()` to show email
- ✅ Added console log: "Connected to Google Drive as: ashraf.kahoush@gmail.com"

**4. Cleaned OAuth Cache**
- ✅ Ran `clean_oauth_cache.js`
- ✅ No old tokens found (clean slate)
- ✅ No cached credentials to remove

---

## 🚀 Next Steps (MANUAL ACTION REQUIRED)

### Step 1: Stop and Restart Dev Server
```bash
# In terminal where dev server is running:
Ctrl + C   # Stop the server

# Force clean restart:
npm install --force
npm run dev -- --force
```

**Expected Output:**
```
VITE v5.4.21  ready in XXXX ms
➜  Local:   http://localhost:3000/
```

Note: Port changed from 3001 → 3000 to match redirect URI

---

### Step 2: Open Dashboard
1. Open browser: http://localhost:3000
2. Open DevTools (F12) → Console tab
3. Look for these logs:

**Success indicators:**
```
✅ Connected to Google Drive as: ashraf.kahoush@gmail.com
🔗 Linking Personal Drive (ashraf.kahoush@gmail.com)...
✅ Personal Drive linked successfully
```

**If you see errors:**
- Check console for OAuth errors
- Proceed to Step 3 for fresh authorization

---

### Step 3: Perform Fresh OAuth Authorization

**In Dashboard:**
1. Navigate to: **Emma Learning** → **Google Drive Integration**
   (Or wherever the sync button is located)

2. Click: **"Sync Now"** or **"Connect Drive"**

3. **Google OAuth Window Opens:**
   - You'll see Google login screen
   - **IMPORTANT**: Choose **ashraf.kahoush@gmail.com**
   - Do NOT choose ashraf@ahkstrategies.net

4. **Grant Permissions:**
   - Click: **"Allow"**
   - Grant access to Google Drive
   - Click: **"Continue"**

5. **Verify Success:**
   - Dashboard should show: ✅ Connected
   - Console should show: "Connected to Google Drive as: ashraf.kahoush@gmail.com"

---

### Step 4: Test Upload to Emma Outputs

```bash
node test_emma_drive_upload.js
```

**Expected Output:**
```
✅ Connected as: ashraf.kahoush@gmail.com
✅ Found: AHK Profile/
✅ Found: Emma/
✅ Found: Outputs/
✅ Upload successful!
```

---

### Step 5: Verify in Google Drive Web Interface

1. Open: https://drive.google.com/drive/u/0/my-drive
2. Verify signed in as: **ashraf.kahoush@gmail.com**
3. Navigate to: **AHK Profile** → **Emma** → **Outputs**
4. Look for test file: `Emma_Test_[timestamp].txt`
5. Verify file content shows correct timestamp

---

## 📋 Configuration Summary

| Setting | Old Value | New Value |
|---------|-----------|-----------|
| **Redirect URI** | `http://localhost:3333/oauth2callback` | `http://localhost:3000/auth/google/callback` |
| **Dev Server Port** | 3001 (3000 in use) | 3000 |
| **Active User** | Both accounts | ashraf.kahoush@gmail.com ONLY |
| **Work Account** | Enabled | Disabled (commented out) |
| **OAuth Config Property** | `redirect_uri` | `redirectUri` |

---

## 🔍 Troubleshooting

### Issue: "Redirect URI mismatch"
**Cause:** Google Cloud Console has different redirect URI configured

**Solution:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find: OAuth 2.0 Client "AHK command centre"
3. Click: Edit
4. Under "Authorized redirect URIs", add:
   - `http://localhost:3000/auth/google/callback`
5. Click: Save
6. Wait 5 minutes for changes to propagate
7. Retry authorization

---

### Issue: "Wrong account shows up"
**Cause:** Browser cached previous Google account

**Solution:**
1. Open: https://accounts.google.com
2. Sign out of all accounts
3. Sign in ONLY as: ashraf.kahoush@gmail.com
4. Return to dashboard and retry sync

---

### Issue: "Port 3000 is in use"
**Cause:** Another process using port 3000

**Solution:**
```bash
# Find process using port 3000 (Windows):
netstat -ano | findstr :3000

# Kill the process:
taskkill /PID [PID_NUMBER] /F

# Restart dev server:
npm run dev
```

---

### Issue: "Emma folder not found"
**Cause:** Folder structure not created in Google Drive

**Solution:**
```bash
# Run folder setup:
powershell -ExecutionPolicy Bypass -File create_emma_folders.ps1

# Or create manually in Google Drive:
# My Drive → AHK Profile → Emma → [5 subfolders]
```

---

## ✅ Success Criteria

When setup is complete, verify:

- [ ] Dev server running on http://localhost:3000 (not 3001)
- [ ] No OAuth errors in browser console
- [ ] Console shows: "Connected to Google Drive as: ashraf.kahoush@gmail.com"
- [ ] Dashboard shows green sync indicator
- [ ] test_emma_drive_upload.js completes successfully
- [ ] Test file visible in Google Drive → AHK Profile → Emma → Outputs
- [ ] Voice engine functional (Emma responds to commands)

---

## 📁 Files Modified

1. ✅ `src/config/googleDriveConfig.js` - Redirect URI updated
2. ✅ `.env.local` - New redirect URI + active user
3. ✅ `src/integrations/googleDriveLinker.js` - Single account mode
4. ✅ `clean_oauth_cache.js` - OAuth cleanup script (NEW)
5. ✅ `OAUTH_REDIRECT_UPDATE.md` - This checklist (NEW)

---

## 🎯 Current Configuration

```javascript
// src/config/googleDriveConfig.js
export const OAUTH_CONFIG = {
  scopes: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.metadata.readonly'
  ],
  redirectUri: 'http://localhost:3000/auth/google/callback'
};
```

```bash
# .env.local
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/auth/google/callback
EMMA_DRIVE_ACTIVE_USER=ashraf.kahoush@gmail.com
```

---

## 📞 Quick Commands

```bash
# Clean OAuth cache
node clean_oauth_cache.js

# Test connection
node test_emma_drive_upload.js

# Force restart dev server
npm run dev -- --force

# View current config
cat src/config/googleDriveConfig.js | grep redirectUri
cat .env.local | grep REDIRECT

# Check port usage
netstat -ano | findstr :3000
```

---

**Status**: ✅ Configuration Complete - Ready for OAuth Flow  
**Date**: November 5, 2025  
**Profile**: ashraf.kahoush@gmail.com  
**Redirect URI**: http://localhost:3000/auth/google/callback
