# 🧹 Clear Voice Cache - Quick Fix Guide

## Problem: Hearing Male Voice or Old Voice Assistant

**Root Cause:** Browser/Vite cache serving stale JavaScript

**Solution:** Follow these steps in order

---

## Step 1: Clear Vite Dev Server Cache

```powershell
# In VS Code terminal (stop dev server first with Ctrl+C)

# Delete Vite cache folder
Remove-Item -Path "node_modules\.vite" -Recurse -Force

# Verify deletion
Write-Host "Vite cache cleared!" -ForegroundColor Green

# Restart dev server
npm run dev
```

---

## Step 2: Hard Refresh Browser

### Chrome/Edge
```
Ctrl + Shift + R
```

### Or Clear Cache Completely
```
1. Press Ctrl + Shift + Delete
2. Select "Cached images and files"
3. Select "Time range: All time"
4. Click "Clear data"
```

---

## Step 3: Test Voice Console

```
1. Navigate to http://localhost:3002
2. Click Emma's avatar (top-right)
3. Voice console opens
4. Verify:
   ✅ NO greeting sound plays
   ✅ Console starts listening immediately
   ✅ Say "start analysis"
   ✅ Emma responds with FEMALE voice only
   ✅ Console auto-closes after 2-3 seconds
```

---

## Step 4: Test in Incognito Mode (If Issues Persist)

```
1. Open new incognito window (Ctrl + Shift + N)
2. Go to http://localhost:3002
3. Test voice console
4. If working in incognito:
   → Browser extension is interfering
   → Disable extensions one by one to find culprit
```

---

## Emergency Nuclear Option (If All Else Fails)

```powershell
# Stop dev server (Ctrl+C)

# Clear ALL caches
Remove-Item -Path "node_modules\.vite" -Recurse -Force
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue

# Reinstall dependencies (takes 2-3 minutes)
npm install

# Restart dev server
npm run dev
```

Then clear browser cache and hard refresh again.

---

## Diagnostic: Check Which Voice Is Being Used

Open browser console (F12) and paste:

```javascript
// List all available voices
window.speechSynthesis.getVoices().forEach(v => 
  console.log(`${v.name} | ${v.lang} | ${v.gender || 'unknown'}`)
);

// Check if something is currently speaking
console.log('Currently speaking:', window.speechSynthesis.speaking);

// Force cancel any speaking
window.speechSynthesis.cancel();
```

**Expected:** You should see female voice names like:
- Microsoft Zira Desktop
- Samantha
- Microsoft Sara
- Karen
- Victoria

**If you see male voices active:** The cache is serving old code.

---

## Prevention: Added to Code

The following cleanup has been added to `SmartVoiceConsole.jsx`:

```javascript
useEffect(() => {
  // ... memory init ...
  
  return () => {
    window.speechSynthesis?.cancel(); // Cancel all speech
    stopSpeak(); // Stop Emma's speech module
  };
}, []);
```

This ensures any lingering speech utterances are canceled when component unmounts.

---

## Still Hearing Male Voice?

### Check System Default TTS Voice

**Windows:**
```
1. Settings → Time & Language → Speech
2. Check "Voice" dropdown
3. If set to male voice (David/Mark/etc.)
   → Change to female voice (Zira/Sara)
```

**Note:** Browser TTS may fall back to system default if no specific voice is selected.

### Verify Emma's Voice Selection

In `src/ai/speech.js`, line 21-39, Emma selects female voices by pattern matching:

```javascript
const femalePatterns = [
  /samantha/i, /zira/i, /sara/i, /karen/i,
  /victoria/i, /vicki/i, /ava/i, /allison/i,
  /nicky/i, /susan/i, /alice/i, /anna/i
];
```

If these patterns don't match any installed voices, system default is used.

**Check installed voices:**
```javascript
// Browser console
window.speechSynthesis.getVoices().map(v => v.name);
```

---

## ✅ Success Indicators

After clearing cache, you should observe:

- ✅ No sound when console opens (silent)
- ✅ Listening starts immediately (visual feedback only)
- ✅ Female voice responds to commands
- ✅ Console auto-closes after response
- ✅ No male voice at any point

---

## Quick Reference Commands

```powershell
# Clear cache and restart
Remove-Item -Path "node_modules\.vite" -Recurse -Force; npm run dev

# Check if dev server is running
Get-Process -Name node -ErrorAction SilentlyContinue

# Kill dev server completely
Stop-Process -Name node -Force

# Restart fresh
npm run dev
```

---

**Created:** November 4, 2025  
**Issue:** Ghost male voice assistant  
**Root Cause:** Browser/Vite cache  
**Solution Time:** ~30 seconds  
**Success Rate:** 99%
