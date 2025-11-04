# Emma Maintenance & Archive System

## 🎯 Overview

Automated system for archiving chat history, optimizing Emma's memory, and maintaining the AHK Dashboard project.

---

## 📦 Components

### 1. Archive System (`archive_project.js`)

**Purpose:** Preserve project history with timestamped snapshots

**What Gets Archived:**
- Chat history and documentation files
- Emma memory references (localStorage keys)
- Sync logs and Git commit history
- Comprehensive markdown summary

**Location:** `.archive/`
```
.archive/
├── chat_history/
│   └── chat_2025-11-04T08-23-51.json
├── emma_memory/
│   └── memory_2025-11-04T08-23-51.json
├── logs/
│   └── logs_2025-11-04T08-23-51.json
└── ARCHIVE_2025-11-04T08-23-51.md
```

**Run Manually:**
```powershell
node src/scripts/archive_project.js
```

---

### 2. Cleanup System (`cleanup_old_data.js`)

**Purpose:** Remove outdated data and optimize storage

**What Gets Cleaned:**
- Archives older than retention policy (keeps last 12)
- Old summary files
- Sync logs older than 30 days
- Temporary files (*.tmp, *.temp, .DS_Store, Thumbs.db)

**Configuration:**
```javascript
const config = {
  maxArchives: 12,  // Keep last 12 archives (3 months weekly)
  maxLogAge: 30,    // Remove logs older than 30 days
  dryRun: false     // Set to true to preview without deleting
}
```

**Run Manually:**
```powershell
node src/scripts/cleanup_old_data.js
```

**Dry Run Mode:**
Edit `src/scripts/cleanup_old_data.js` and set `dryRun: true` to preview changes without deleting files.

---

### 3. Memory Refresh System (`refresh_agent_memory.js`)

**Purpose:** Optimize Emma's memory and clear residual data

**What Gets Refreshed:**
- Server-side sync cache (backed up before clearing)
- Log file rotation (>1MB files)
- Temporary file cleanup
- Browser localStorage optimization script

**Run Manually:**
```powershell
node src/scripts/refresh_agent_memory.js
```

**Browser-Side Memory Refresh:**
1. Open dashboard: http://localhost:3000
2. Press `F12` to open DevTools
3. Go to Console tab
4. Paste script from: `src/scripts/refresh_emma_memory_browser.js`
5. Run: `showEmmaMemorySize()` to check current usage
6. Run: `refreshEmmaMemory()` to optimize (keeps core memory)
7. Run: `archiveAndClearEmmaMemory()` to backup then clear (SAFE)
8. Run: `clearAllEmmaMemory()` to clear everything (DESTRUCTIVE)

---

### 4. Smart Desktop Shortcut

**Purpose:** One-click access to dashboard with auto-start

**Features:**
- ✅ Checks if dev server is already running
- ✅ Auto-starts dev server if not running
- ✅ Waits for server to be ready (up to 30 seconds)
- ✅ Opens http://localhost:3000 in default browser

**Create/Update Shortcut:**
```powershell
powershell -ExecutionPolicy Bypass -File .\create_smart_shortcut.ps1
```

**Location:** `C:\Users\ashra\Desktop\AHK Dashboard.lnk`

**How It Works:**
1. Double-click shortcut
2. Script checks `http://localhost:3000`
3. If server responds → Opens browser immediately
4. If server down → Starts `npm run dev` in new window
5. Waits for server to be ready
6. Opens browser when ready

---

## 🔄 Automation

### VS Code Tasks

**Run from Command Palette** (`Ctrl+Shift+P` → `Tasks: Run Task`):

| Task Name | Description |
|-----------|-------------|
| **Archive Project (Weekly)** | Create timestamped archive |
| **Cleanup Old Data** | Remove outdated files |
| **Refresh Emma Memory** | Optimize memory and cache |
| **Full Maintenance** | Runs all 3 in sequence |

**Manual Execution:**
```powershell
# Archive
Ctrl+Shift+P → Tasks: Run Task → Archive Project (Weekly)

# Cleanup
Ctrl+Shift+P → Tasks: Run Task → Cleanup Old Data

# Refresh
Ctrl+Shift+P → Tasks: Run Task → Refresh Emma Memory

# Full Maintenance
Ctrl+Shift+P → Tasks: Run Task → Full Maintenance (Archive + Cleanup + Refresh)
```

---

### Windows Task Scheduler (Weekly Auto-Run)

**Setup Weekly Automation:**
```powershell
powershell -ExecutionPolicy Bypass -File .\setup_weekly_maintenance.ps1
```

**What It Creates:**
- **Task Name:** Emma Weekly Maintenance
- **Schedule:** Every Sunday at 2:00 AM
- **Actions:** Archive → Cleanup → Refresh (in sequence)
- **Log File:** `.archive/maintenance.log`

**Manual Control:**
```powershell
# Run task now
Start-ScheduledTask -TaskName "Emma Weekly Maintenance"

# View task details
Get-ScheduledTask -TaskName "Emma Weekly Maintenance"

# Disable task
Disable-ScheduledTask -TaskName "Emma Weekly Maintenance"

# Enable task
Enable-ScheduledTask -TaskName "Emma Weekly Maintenance"

# Remove task
Unregister-ScheduledTask -TaskName "Emma Weekly Maintenance" -Confirm:$false
```

**Check Logs:**
```powershell
Get-Content .archive/maintenance.log
```

---

## 📊 Workflow

### Weekly Automatic Maintenance

```
Sunday 2:00 AM
    ↓
1. Archive Project
    - Create timestamped snapshots
    - Save Git history
    - Document changes
    ↓
2. Cleanup Old Data
    - Remove archives older than 3 months
    - Delete old sync logs
    - Clean temporary files
    ↓
3. Refresh Memory
    - Back up sync cache
    - Rotate large log files
    - Generate browser refresh script
    ↓
✅ Done - Log saved to .archive/maintenance.log
```

### Manual Maintenance (Anytime)

**Option 1: VS Code Task (Recommended)**
```
Ctrl+Shift+P → Tasks: Run Task → Full Maintenance
```

**Option 2: Individual Scripts**
```powershell
node src/scripts/archive_project.js
node src/scripts/cleanup_old_data.js
node src/scripts/refresh_agent_memory.js
```

**Option 3: PowerShell Scheduled Task**
```powershell
Start-ScheduledTask -TaskName "Emma Weekly Maintenance"
```

---

## 🗂️ Archive Structure

```
.archive/
├── chat_history/
│   ├── chat_2025-11-04T08-23-51.json
│   ├── chat_2025-11-11T08-23-51.json
│   └── ... (up to 12 files)
├── emma_memory/
│   ├── memory_2025-11-04T08-23-51.json
│   ├── memory_2025-11-11T08-23-51.json
│   └── ... (up to 12 files)
├── logs/
│   ├── logs_2025-11-04T08-23-51.json
│   ├── sync_backup_1762244686033.json
│   └── ... (up to 12 files)
├── ARCHIVE_2025-11-04T08-23-51.md
├── ARCHIVE_2025-11-11T08-23-51.md
├── ... (up to 12 summaries)
├── last_cleanup.json
├── last_refresh.json
└── maintenance.log
```

---

## 🔍 Retrieval & Recovery

### View Archive Summary
```powershell
Get-Content .archive/ARCHIVE_2025-11-04T08-23-51.md
```

### Restore Specific Archive
```powershell
# View chat history from specific date
Get-Content .archive/chat_history/chat_2025-11-04T08-23-51.json | ConvertFrom-Json

# View Emma memory snapshot
Get-Content .archive/emma_memory/memory_2025-11-04T08-23-51.json | ConvertFrom-Json

# View sync logs
Get-Content .archive/logs/logs_2025-11-04T08-23-51.json | ConvertFrom-Json
```

### List All Archives
```powershell
# List all archive summaries
Get-ChildItem .archive/*.md | Select-Object Name, LastWriteTime, Length

# List all chat archives
Get-ChildItem .archive/chat_history/*.json | Select-Object Name, LastWriteTime, Length

# Count total archives
(Get-ChildItem .archive/chat_history/*.json).Count
```

---

## 🛠️ Troubleshooting

### Issue: Archive script fails
```powershell
# Check if .archive directory exists
Test-Path .archive

# Create if missing
New-Item -ItemType Directory -Path .archive -Force
New-Item -ItemType Directory -Path .archive/chat_history -Force
New-Item -ItemType Directory -Path .archive/emma_memory -Force
New-Item -ItemType Directory -Path .archive/logs -Force
```

### Issue: Scheduled task not running
```powershell
# Check task status
Get-ScheduledTask -TaskName "Emma Weekly Maintenance"

# View task history
Get-ScheduledTask -TaskName "Emma Weekly Maintenance" | Get-ScheduledTaskInfo

# Re-run setup
powershell -ExecutionPolicy Bypass -File .\setup_weekly_maintenance.ps1
```

### Issue: Desktop shortcut doesn't work
```powershell
# Recreate shortcut
powershell -ExecutionPolicy Bypass -File .\create_smart_shortcut.ps1

# Test launcher directly
powershell -ExecutionPolicy Bypass -File .\launch_dashboard.ps1
```

### Issue: Cleanup script deletes too much
```powershell
# Edit src/scripts/cleanup_old_data.js
# Set: dryRun: true
# Run to preview without deleting
node src/scripts/cleanup_old_data.js

# Adjust retention policy
# Set: maxArchives: 24 (keep 6 months instead of 3)
```

---

## 📝 Configuration

### Change Archive Retention Period

Edit `src/scripts/cleanup_old_data.js`:
```javascript
const config = {
  maxArchives: 24,  // Keep last 24 instead of 12 (6 months weekly)
  maxLogAge: 60,    // Keep logs for 60 days instead of 30
  dryRun: false
}
```

### Change Scheduled Task Time

```powershell
# Edit setup_weekly_maintenance.ps1, line 64:
$trigger = New-ScheduledTaskTrigger `
    -Weekly `
    -DaysOfWeek Friday `      # Change from Sunday
    -At 6:00PM               # Change from 2:00AM

# Re-run setup
powershell -ExecutionPolicy Bypass -File .\setup_weekly_maintenance.ps1
```

### Add More Documentation Files to Archive

Edit `src/scripts/archive_project.js`:
```javascript
const docsToArchive = [
  'EMMA_ENHANCEMENT_SUMMARY.md',
  'VOICE_CONSOLE_REFACTOR.md',
  'YOUR_NEW_DOC.md',           // Add here
  'README.md'
];
```

---

## ✅ Verification Checklist

### After Setup:
- [ ] `.archive/` directory created with subdirectories
- [ ] Archive script runs successfully: `node src/scripts/archive_project.js`
- [ ] Cleanup script runs successfully: `node src/scripts/cleanup_old_data.js`
- [ ] Refresh script runs successfully: `node src/scripts/refresh_agent_memory.js`
- [ ] Desktop shortcut created: `C:\Users\ashra\Desktop\AHK Dashboard.lnk`
- [ ] Desktop shortcut launches dashboard correctly
- [ ] VS Code tasks available in Command Palette
- [ ] Windows scheduled task created: `Get-ScheduledTask -TaskName "Emma Weekly Maintenance"`
- [ ] Archive files created in `.archive/` with timestamps
- [ ] Maintenance log created: `.archive/maintenance.log`

### Weekly Verification:
- [ ] Check archive was created automatically (every Sunday)
- [ ] Verify maintenance log updated: `Get-Content .archive/maintenance.log`
- [ ] Confirm old archives deleted (only last 12 kept)
- [ ] Test desktop shortcut still works
- [ ] Check dashboard loads at http://localhost:3000

---

## 🎓 Best Practices

1. **Run Full Maintenance** before major project milestones
2. **Check maintenance log** weekly to ensure automation is working
3. **Test desktop shortcut** after Windows updates
4. **Keep archives** for at least 3 months (12 weekly snapshots)
5. **Run browser memory refresh** monthly for optimal performance
6. **Backup `.archive/` folder** to external drive or cloud storage monthly

---

## 📞 Quick Reference

| Action | Command |
|--------|---------|
| **Archive Now** | `node src/scripts/archive_project.js` |
| **Cleanup Now** | `node src/scripts/cleanup_old_data.js` |
| **Refresh Now** | `node src/scripts/refresh_agent_memory.js` |
| **Full Maintenance** | VS Code → Tasks → Full Maintenance |
| **Create Shortcut** | `powershell -ExecutionPolicy Bypass -File .\create_smart_shortcut.ps1` |
| **Setup Weekly Task** | `powershell -ExecutionPolicy Bypass -File .\setup_weekly_maintenance.ps1` |
| **Run Task Now** | `Start-ScheduledTask -TaskName "Emma Weekly Maintenance"` |
| **View Archives** | `Get-ChildItem .archive/*.md` |
| **Check Last Run** | `Get-Content .archive/maintenance.log` |

---

**Status:** ✅ Fully Operational  
**Next Archive:** Automatic (Every Sunday 2:00 AM)  
**Retention Policy:** 12 archives (3 months)  
**Version:** 1.0.0
