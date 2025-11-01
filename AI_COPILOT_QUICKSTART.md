# AI Co-Pilot Quick Start Guide

## 🤖 What is the AI Co-Pilot?

The AI Co-Pilot is your intelligent assistant that analyzes your portfolio in real-time and provides:
- **Investor-ready briefings** (2-3 sentence summaries)
- **Prioritized action items** (what to do next)
- **Risk assessments** (categorized HIGH/MEDIUM/LOW)

---

## 🖱️ Using the Visual Interface

### Step 1: Find the Co-Pilot Button
Look for the **purple 🤖 button** in the bottom-right corner of your dashboard:

```
┌─────────────────────────────────────┐
│                                     │
│         Dashboard Content           │
│                                     │
│                                     │
│                            ┌────┐  │
│                            │ 🤖 │  │ ← Co-Pilot button
│                            └────┘  │
│                         ┌────┐     │
│                         │ 🎙️ │     │ ← Voice button
│                         └────┘     │
└─────────────────────────────────────┘
```

### Step 2: Click to Expand
Click the 🤖 button to open the Co-Pilot panel:

```
┌──────────────────────────────────┐
│ 🤖 AI Co-Pilot     [▶️ Analyze] │
│ Last run: 2:30 PM               │
├──────────────────────────────────┤
│ 📊 Investor Brief               │
│ ┌────────────────────────────┐ │
│ │ Portfolio shows strong     │ │
│ │ momentum with 3 active     │ │
│ │ projects averaging 52%...  │ │
│ └────────────────────────────┘ │
│                                  │
│ ⚡ Next 3 Actions               │
│ ┌─────────────────────┬──────┐ │
│ │ Complete T-0001...  │+ Add │ │
│ ├─────────────────────┼──────┤ │
│ │ Review WOW e-Scoot..│+ Add │ │
│ ├─────────────────────┼──────┤ │
│ │ Prepare Q-VAN deck  │+ Add │ │
│ └─────────────────────┴──────┘ │
│                                  │
│ 🚨 Risk Map                     │
│ HIGH                             │
│ • 2 overdue tasks...             │
│ MEDIUM                           │
│ • Budget allocation review...    │
│ LOW                              │
│ • Minor documentation updates    │
└──────────────────────────────────┘
         ▼ (Arrow points to button)
```

### Step 3: Run Analysis
1. Click **"▶️ Analyze"** button
2. Wait for analysis (shows "🔄 Running...")
3. Review the three sections that appear:
   - 📊 Investor Brief
   - ⚡ Next 3 Actions
   - 🚨 Risk Map

### Step 4: Take Action
- Click **"+ Add"** next to any action to add it to your roadmap
- Results are automatically saved and reload on next visit
- Click 🤖 button again to collapse the panel

---

## 🎤 Using Voice Commands

### Activate Voice
1. Click the **gold 🎙️ button** (or press `` ` `` key on keyboard)
2. Wait for microphone icon to turn gold (listening)
3. Speak your command clearly

### Co-Pilot Voice Commands

| Say This | What Happens |
|----------|--------------|
| **"run copilot"** | Triggers analysis and opens Co-Pilot panel |
| **"investor brief"** | Reads the executive summary out loud |
| **"show next actions"** | Lists your top 3 priorities via voice |
| **"risk report"** | Summarizes how many HIGH/MEDIUM/LOW risks you have |
| **"help"** | Lists all available commands |

### Example Voice Session

```
YOU: "run copilot"
AI: "Running Co-Pilot analysis. Check the floating robot button for strategic insights."
[Co-Pilot panel opens and shows results]

YOU: "investor brief"
AI: "Portfolio health: 3 active projects with 52 percent average progress. 
     2 tasks overdue. Strong momentum in localization track."

YOU: "show next actions"
AI: "Here are your top 3 actions: Complete T dash zero zero one DVM base 
     consolidation by December 5. Next, Review WOW e-Scooter supply chain SLA. 
     Next, Prepare Q VAN investor alignment deck."
```

---

## 📱 Mobile & Tablet Access

### Desktop View
- Co-Pilot button: **56px** diameter, bottom-right corner
- Panel: **380px** wide, smooth animations

### Mobile View (Auto-adjusts)
- Button remains accessible in bottom-right
- Panel adjusts height to **70% of screen** (scrollable)
- Touch-friendly "▶️ Analyze" and "+ Add" buttons

---

## 🎨 Understanding the Colors

### Risk Map Color System

| Color | Level | Meaning | Action Needed |
|-------|-------|---------|---------------|
| 🔴 **Red** | HIGH | Urgent issues requiring immediate attention | Address today/tomorrow |
| 🟡 **Yellow** | MEDIUM | Important items needing review soon | Address this week |
| 🟢 **Green** | LOW | Routine tasks, no immediate concern | Address when convenient |

### Button Colors

- **Purple Gradient (🤖)**: Co-Pilot button - click for strategic insights
- **Gold Gradient (🎙️)**: Voice button - click to speak commands
- **Gold Pulse**: Voice is actively listening
- **Blue Gradient**: "▶️ Analyze" button in Co-Pilot panel

---

## 💡 Pro Tips

1. **Run Analysis Regularly**
   - Click "▶️ Analyze" at start of each day for fresh insights
   - Results save automatically in your browser

2. **Use Voice When Multitasking**
   - Say "investor brief" to get quick updates while working on other tabs
   - Say "show next actions" to hear priorities without looking at screen

3. **Add Actions Quickly**
   - Click "+ Add" next to suggested actions to instantly create roadmap tasks
   - Auto-generates task ID (T-XXXX) and due date (+7 days)

4. **Check Risk Map First**
   - RED items = drop everything and handle now
   - YELLOW items = schedule time this week
   - GREEN items = nice-to-haves

5. **Keyboard Shortcut**
   - Press `` ` `` (backtick key) to toggle voice without clicking

---

## 🔧 Troubleshooting

### "No analysis available yet"
- **Solution:** Click "▶️ Analyze" button first to generate insights

### Voice command not recognized
- **Check:** Is microphone icon gold? (listening state)
- **Check:** Chrome browser recommended for best voice recognition
- **Try:** Speaking more clearly or using alternate command phrases

### "+ Add" button doesn't work
- **Check:** Dev server running? (`npm run dev`)
- **Check:** API middleware configured in `vite.config.js`
- **Solution:** Check browser console for errors

### Co-Pilot button not visible
- **Check:** Are you on the Dashboard page? (`/dashboard`)
- **Check:** Scroll down if content overlaps button
- **Solution:** Look in bottom-right corner, above voice button

---

## 📊 What Gets Analyzed?

The Co-Pilot looks at:
- ✅ **Active Projects:** Progress %, stage, budget, milestones
- ✅ **Roadmap Tasks:** Status, priority, due dates, assignments
- ✅ **Metrics:** Completion rates, overdue items, trends
- ✅ **Risk Factors:** Delays, budget concerns, resource gaps

It generates:
- 📈 **Portfolio Health Score:** Overall momentum assessment
- 🎯 **Action Priorities:** What matters most right now
- ⚠️ **Risk Categories:** Issues ranked by urgency
- 💡 **Strategic Recommendations:** AI-powered suggestions

---

## 🚀 Next Steps

Once you're comfortable with the Co-Pilot:
1. Use it to prepare for investor meetings (Investor Brief section)
2. Share Next Actions with your team via email/Slack
3. Review Risk Map weekly in planning sessions
4. Integrate findings into your strategy presentations

---

## ❓ Questions?

**Need help?** Check the full documentation:
- 📖 `MISSION_8_FOUNDATION.md` - Complete technical reference
- 💻 Browser console (F12) - Detailed logs and structured data
- 🎙️ Voice command: "help" - List of all available commands

**Want more features?** See "Future Enhancements" in main documentation for roadmap.

---

**Built for Ashraf Kahoush, AHK Strategies**  
*Making strategic decisions easier, one insight at a time* 🚀
