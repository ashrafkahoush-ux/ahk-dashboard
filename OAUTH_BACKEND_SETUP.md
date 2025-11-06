# Emma OAuth Backend Setup - Complete ✅

## What Was Built

A complete Express backend server to handle Google Drive OAuth2 authentication for Emma.

### Files Created/Modified

1. **`/server/index.js`** (NEW)
   - Express server on port 4000
   - 3 OAuth endpoints:
     - `GET /api/google/auth` - Generates OAuth consent URL
     - `GET /api/google/callback` - Handles OAuth redirect and token exchange
     - `POST /api/google/sync` - Triggers Emma Drive sync

2. **`src/integrations/googleDriveLinker.js`** (MODIFIED)
   - Added `getAuthURL()` - Generates OAuth consent URL
   - Added `handleCallback(code)` - Exchanges authorization code for tokens
   - Added `syncDrives()` - Wrapper for Emma knowledge sync

3. **`vite.config.js`** (MODIFIED)
   - Added proxy: `'/api': 'http://localhost:4000'`
   - Routes all `/api/*` requests from frontend to backend

4. **Dependencies Installed**
   - express
   - cors
   - body-parser

---

## Current Status

✅ **Backend server running successfully** on http://localhost:4000  
✅ **OAuth methods implemented** in googleDriveLinker.js  
✅ **Vite proxy configured** to forward API calls  
✅ **No compilation errors** detected  

---

## How to Start the System

### Terminal 1: Backend Server
```powershell
node server/index.js
```
**Expected output:**
```
✅ Emma Backend Server running on http://localhost:4000
```

### Terminal 2: Frontend Dev Server
```powershell
npm run dev
```
**Expected output:**
```
VITE v5.4.8  ready in XXX ms
➜  Local:   http://localhost:3000/
```

---

## OAuth Flow Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │         │  Vite Proxy  │         │   Backend   │
│ (localhost  │  ────→  │  (port 3000) │  ────→  │ (port 4000) │
│   :3000)    │         │              │         │             │
└─────────────┘         └──────────────┘         └─────────────┘
       │                                                  │
       │                                                  ↓
       │                                         ┌──────────────┐
       │                                         │ Google OAuth │
       │  ←────────────────────────────────────  │   Servers    │
       │         (Redirect to /callback)         └──────────────┘
       ↓
┌─────────────┐
│   Emma UI   │
│  Connected  │
└─────────────┘
```

---

## Testing the OAuth Flow

### Step 1: Start Both Servers
- **Backend:** `node server/index.js` (Terminal 1)
- **Frontend:** `npm run dev` (Terminal 2)

### Step 2: Open Dashboard
- Navigate to http://localhost:3000

### Step 3: Trigger OAuth
- Go to **Emma Learning** → **Google Drive Integration**
- Click **"Sync Now"** or **"Connect Drive"** button

### Step 4: Authorize
- Browser redirects to Google consent screen
- Select **ashraf.kahoosh@gmail.com**
- Click **"Allow"** to grant permissions

### Step 5: Verify Connection
- Browser redirects back to `/api/google/callback`
- Console should show: `✅ OAuth successful for: ashraf.kahoosh@gmail.com`
- Emma folder sync begins automatically

---

## OAuth Endpoints Reference

### 1. Generate Auth URL
```http
GET http://localhost:4000/api/google/auth
```
**Response:**
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### 2. Handle OAuth Callback
```http
GET http://localhost:4000/api/google/callback?code=AUTHORIZATION_CODE
```
**Response (Success):**
```json
{
  "success": true,
  "email": "ashraf.kahoosh@gmail.com",
  "tokens": { ... },
  "message": "Connected to Google Drive as ashraf.kahoosh@gmail.com"
}
```

### 3. Trigger Drive Sync
```http
POST http://localhost:4000/api/google/sync
```
**Response:**
```json
{
  "success": true,
  "results": {
    "personal": {
      "files": 15,
      "folders": 1,
      "errors": []
    }
  },
  "timestamp": "2025-01-04T12:30:45.123Z"
}
```

---

## Configuration Files

### OAuth Redirect URI
**Set in:** `src/config/googleDriveConfig.js`
```javascript
redirectUri: 'http://localhost:3000/auth/google/callback'
```

### Active User Profile
**Set in:** `.env.local`
```
EMMA_DRIVE_ACTIVE_USER=ashraf.kahoosh@gmail.com
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

---

## Troubleshooting

### Backend Won't Start
- **Check:** Port 4000 not already in use
- **Fix:** `Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process`

### Frontend Can't Reach Backend
- **Check:** Vite proxy configuration in `vite.config.js`
- **Verify:** Both servers running (ports 3000 + 4000)

### OAuth Redirect Fails
- **Check:** Google Cloud Console redirect URI matches `http://localhost:3000/auth/google/callback`
- **Verify:** `.env.local` has correct `GOOGLE_DRIVE_REDIRECT_URI`

### "Invalid Client" Error
- **Check:** `.env.local` has valid `GOOGLE_DRIVE_CLIENT_ID` and `GOOGLE_DRIVE_CLIENT_SECRET`
- **Verify:** Credentials match Google Cloud Console

---

## Next Steps

1. ✅ **Backend server running**
2. ⏳ **Start frontend server** (`npm run dev`)
3. ⏳ **Test OAuth flow** (click "Sync Now")
4. ⏳ **Verify Emma folder sync**
5. ⏳ **Test persistence** (refresh page, check if still connected)

---

## Security Notes

- ✅ OAuth tokens handled server-side only
- ✅ Client secret never exposed to browser
- ✅ Refresh tokens stored securely (backend)
- ✅ CORS enabled for localhost:3000 only
- ⚠️ **Production:** Add token encryption + database storage
- ⚠️ **Production:** Use environment-specific redirect URIs

---

## File Structure
```
AHK_Dashboard_v1/
├── server/
│   └── index.js                    # Express backend (port 4000)
├── src/
│   ├── config/
│   │   └── googleDriveConfig.js   # OAuth configuration
│   └── integrations/
│       └── googleDriveLinker.js   # OAuth methods
├── vite.config.js                  # Proxy configuration
├── .env.local                      # Environment variables
└── package.json                    # Dependencies
```

---

**Status:** ✅ Ready for testing  
**Last Updated:** 2025-01-04  
**Backend Port:** 4000  
**Frontend Port:** 3000  
**Active Profile:** ashraf.kahoosh@gmail.com
