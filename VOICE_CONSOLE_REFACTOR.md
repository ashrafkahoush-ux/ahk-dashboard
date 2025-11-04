# Emma Voice Console - State Machine Refactor

## 🎯 What Was Implemented

### 1. **useVoiceConsole.js Hook** (`src/hooks/useVoiceConsole.js`)

A self-contained React hook that manages the complete voice lifecycle with a deterministic state machine:

**States:**
- `idle` → Ready to start
- `listening` → Microphone active, speech recognition running
- `processing` → Handling command/intent
- `speaking` → Emma responding with speech synthesis
- `error` → Something went wrong

**Key Features:**
- ✅ **VAD (Voice Activity Detection):** Auto-stops after 2 seconds of silence
- ✅ **Wake Phrase Gate:** "Emma, start analysis" required before commands
- ✅ **Female Voice Selection:** Searches for female/UK voices (Sara, Zira, etc.)
- ✅ **60-Second Inactivity Timeout:** Auto-stops if no speech detected
- ✅ **Push-to-Talk Support:** Optional PTT mode
- ✅ **Proper Audio Cleanup:** MediaStream tracks properly closed
- ✅ **Browser Compatibility:** Handles Chrome/Edge SpeechRecognition

### 2. **intentRouter.js** (`src/lib/intentRouter.js`)

Clean intent mapping and command execution:

**Supported Commands:**
- `"Emma, start analysis"` → Wake phrase (opens console)
- `"run sync"` / `"synchronize"` → Triggers `/api/emma-sync`
- `"help"` → Lists available commands
- `"stop"` → Stops listening

**Easy to Extend:**
```javascript
case "openStrategy":
  navigate('/strategy');
  return "Opening strategy dashboard.";
```

### 3. **VoiceConsoleNew.jsx** (`src/components/VoiceConsoleNew.jsx`)

Clean, modern UI with three-button control:

```
┌─────────────────────────────────┐
│ AI Voice Console      [Ready]   │
├─────────────────────────────────┤
│ Say "Emma, start analysis",     │
│ then "run sync".                 │
├─────────────────────────────────┤
│ [🎙️ Start] [⏹️ Stop] [🔇 Cancel] │
└─────────────────────────────────┘
```

**Buttons:**
- **Start** (🎙️): Begin listening
- **Stop** (⏹️): End session and close mic
- **Cancel** (🔇): Stop Emma from speaking

## 🔧 How It Works

### Flow Diagram

```
User Clicks "Start"
    ↓
Request Mic Permission
    ↓
Start VAD (Voice Activity Detection)
    ↓
Start SpeechRecognition
    ↓
STATE: listening
    ↓
User says: "Emma, start analysis"
    ↓
Wake Phrase Detected → Speak confirmation
    ↓
User says: "run sync"
    ↓
Intent Detected: runSync
    ↓
STATE: processing
    ↓
Fetch /api/emma-sync
    ↓
STATE: speaking
    ↓
Speak: "Synchronization complete, Ash."
    ↓
STATE: idle
```

### VAD (Voice Activity Detection)

```javascript
// Auto-stops after 2 seconds of silence
const analyser = ctx.createAnalyser();
analyser.fftSize = 2048;

// Calculate RMS energy
const rms = Math.sqrt(sum / data.length);

if (rms < 0.015) {  // silence threshold
  silentFrames++;
  if (silentFrames > 120) {  // ~2 seconds at 60fps
    stop();  // Auto-stop
  }
}
```

### Female Voice Selection

```javascript
const voices = window.speechSynthesis.getVoices();

// Search for female voices
const femaleVoice = voices.find(v => 
  /female|sara|en-gb|uk|ar-xa|ze|laila|maya/i.test(`${v.name} ${v.voiceURI}`)
);

if (femaleVoice) {
  utterance.voice = femaleVoice;
  utterance.pitch = 1.02;  // Slightly higher for feminine tone
}
```

## 📦 File Structure

```
src/
├── hooks/
│   └── useVoiceConsole.js       # State machine hook
├── lib/
│   └── intentRouter.js          # Command mapping
├── components/
│   └── VoiceConsoleNew.jsx      # UI component
└── App.jsx                       # Import VoiceConsoleNew
```

## 🚀 Usage

### Basic Setup (Already Done)

```jsx
// src/App.jsx
import VoiceConsoleNew from './components/VoiceConsoleNew'

function App() {
  return (
    <Layout>
      {/* ...routes... */}
      <VoiceConsoleNew />
    </Layout>
  )
}
```

### Test Commands

1. **Click "🎙️ Start"** → Mic activates, status: "Listening..."
2. **Say: "Emma, start analysis"** → Hears confirmation
3. **Say: "run sync"** → Triggers sync, hears: "Synchronization complete, Ash."
4. **Say: "help"** → Lists available commands
5. **Click "⏹️ Stop"** → Mic closes, status: "Ready"

## 🎯 Improvements Over Old System

| Issue | Old System | New System |
|-------|-----------|-----------|
| **State Management** | Ad-hoc flags (`isStopped`, `isListening`) | Deterministic state machine |
| **Duplicate Code** | Two `stop()` functions | Single comprehensive `stop()` |
| **Voice Selection** | Basic, didn't wait for voices | Proper loading + female search |
| **Auto-Stop** | Manual only | VAD + 60s inactivity |
| **Wake Phrase** | Missing | Required: "Emma, start analysis" |
| **Command Routing** | Scattered in component | Centralized `intentRouter.js` |
| **Error Handling** | Minimal | Proper mic denial, recognition errors |
| **Audio Cleanup** | Incomplete | MediaStream tracks properly closed |

## 🔒 Browser Compatibility

- ✅ **Chrome 25+** (webkitSpeechRecognition)
- ✅ **Edge 79+** (Chromium-based)
- ✅ **Safari 14.1+** (limited, requires user gesture)
- ❌ **Firefox** (No SpeechRecognition support)

**Detection:**
```javascript
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSupported = !!(Recognition && window.speechSynthesis);
```

## 📝 Adding New Commands

### Step 1: Update Intent Router

```javascript
// src/lib/intentRouter.js

export async function handleIntent(intent, text) {
  switch (intent) {
    // ... existing cases ...
    
    case "openStrategy":
      window.location.href = "/strategy";
      return "Opening strategy dashboard, Ash.";
      
    case "generateReport":
      const res = await fetch("/api/generate-report", { method: "POST" });
      return "Report generated successfully.";
      
    default:
      return "I didn't catch that command.";
  }
}
```

### Step 2: Update Local Intent Mapper (Optional)

```javascript
// src/hooks/useVoiceConsole.js

const localIntent = useCallback((text) => {
  const t = text.toLowerCase().trim();
  
  if (t.includes("open strategy")) return "openStrategy";
  if (t.includes("generate report")) return "generateReport";
  
  // ... existing intents ...
}, []);
```

## 🐛 Debugging

### Enable Console Logging

```javascript
// src/hooks/useVoiceConsole.js

rec.onresult = async (e) => {
  console.log('🎙️ Speech result:', e.results);
  // ... existing code ...
};

speak.onend = () => {
  console.log('🔊 Speech ended');
  // ... existing code ...
};
```

### Check Voice List

Open browser console:
```javascript
window.speechSynthesis.getVoices().forEach(v => 
  console.log(v.name, v.lang, v.gender)
);
```

### Test VAD Threshold

Adjust silence detection sensitivity:
```javascript
const voice = useVoiceConsole({
  vadThreshold: 0.020,  // Higher = more sensitive to silence
  // ...
});
```

## 🎨 Customization

### Change Wake Phrase

```javascript
const voice = useVoiceConsole({
  wakePhrase: "hey emma",  // New wake phrase
  // ...
});
```

### Adjust Inactivity Timeout

```javascript
const voice = useVoiceConsole({
  inactivityMs: 120_000,  // 2 minutes instead of 60 seconds
  // ...
});
```

### Enable Push-to-Talk

```javascript
const voice = useVoiceConsole({
  pushToTalk: true,  // Hold button to talk
  // ...
});

// In component:
<button 
  onMouseDown={() => voice.pttDown()}
  onMouseUp={() => voice.pttUp()}
>
  Hold to Talk
</button>
```

### Change Voice Locale

```javascript
const voice = useVoiceConsole({
  locale: "en-GB",  // British English
  // locale: "ar-XA",  // Arabic
  // ...
});
```

## 📊 Commit

```
commit d536f4a
Author: Ashraf Kahoush
Date: November 4, 2025

refactor: voice console with state machine architecture

- Add useVoiceConsole.js hook with deterministic state machine
- Implement VAD (Voice Activity Detection) for auto-silence detection
- Add wake phrase gate: 'Emma, start analysis'
- Implement female voice selection with proper voice loading
- Add intentRouter.js for clean command mapping
- Create VoiceConsoleNew.jsx with Start/Stop/Cancel controls
- Support 60s inactivity timeout and PTT mode
- Integrate runSync command to /api/emma-sync endpoint

Fixes:
- Removes duplicate stop() function issue
- Proper female voice selection with fallback
- Deterministic lifecycle: idle → listening → processing → speaking → idle
- Browser compatibility handling for mic permissions
```

## ✅ Testing Checklist

- [ ] Click "🎙️ Start" → Status changes to "Listening…"
- [ ] Say "Emma, start analysis" → Hear female voice confirmation
- [ ] Say "run sync" → Hear "Synchronization complete, Ash."
- [ ] Say "help" → Hear list of commands
- [ ] Stay silent for 2 seconds → Auto-stops (VAD)
- [ ] Wait 60 seconds → Auto-stops (inactivity timeout)
- [ ] Click "⏹️ Stop" → Mic closes immediately
- [ ] Click "🔇 Cancel" while Emma speaking → Speech stops
- [ ] Check console for female voice selection log
- [ ] Test on Chrome/Edge (should work)
- [ ] Test on Firefox (should show "not supported" message)

---

**Status:** ✅ Ready for testing  
**Branch:** main  
**Commit:** d536f4a  
**Dev Server:** http://localhost:3000
