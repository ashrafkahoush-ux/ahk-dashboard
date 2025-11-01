# AI Integration Guide – AHK Dashboard

**Version:** 0.1  
**Date:** 2025  
**Author:** Ashraf Kahoush  
**Mission:** #5 – AI Intelligence & Automation Layer

---

## 1. Overview

This guide explains how AHK Dashboard integrates AI-powered strategic analysis to provide automated insights about project health, roadmap status, and investment opportunities.

### Current Capabilities
- **Roadmap Analysis**: Counts overdue tasks, high-priority pending items, completion rates
- **Project Summarization**: Calculates average progress, identifies lagging/leading projects
- **Automated Reports**: 24-hour recurring AI insights (when Auto-Sync enabled)
- **Manual Analysis**: Dashboard button triggers instant AI report generation

### Technology Stack
- **Local Analysis**: Browser-based JavaScript functions (no API calls yet)
- **Future Integration**: Google Gemini 2.5 Pro API for advanced reasoning
- **Fallback Options**: Grok (xAI), ChatGPT for cross-validation

---

## 2. Architecture

### Folder Structure
```
src/
├── ai/
│   ├── autoAgent.js           # Node.js version (server-side, writes files)
│   └── autoAgent.browser.js   # Browser version (client-side, in-memory)
├── utils/
│   └── scheduler.js            # Auto-Sync: 24-hour recurring job
├── api/
│   └── ai-hook.js              # Mock endpoint for future Gemini API
└── pages/
    └── Dashboard.jsx           # "Run AI Analysis" button
```

### Data Flow
```
User clicks "Run AI Analysis"
  ↓
Dashboard.handleAIAnalysis()
  ↓
autoAgent.browser.preparePrompt()
  ↓
analyzeRoadmap() + summarizeProjects()
  ↓
JSON imports (projects, roadmap, sources)
  ↓
Formatted report → Browser alert + Console log
```

### Auto-Sync Flow
```
localStorage.aiAutoSync === 'true'
  ↓
main.jsx checks on app load
  ↓
scheduler.autoSyncInsights()
  ↓
setInterval(preparePrompt, 24 hours)
  ↓
Runs every day at same time
```

---

## 3. AI Functions Explained

### 3.1 `analyzeRoadmap()`
**Purpose:** Analyze task statuses, deadlines, priorities

**Returns:**
```
ROADMAP INSIGHTS:
───────────────────
• Total Tasks: 10
• Completed: 3
• Overdue: 2
• High Priority (Pending): 1
```

**Logic:**
- Counts total tasks in `roadmap.json`
- Filters `status === "done"` for completed
- Compares `due < today` for overdue
- Checks `priority === "high" && status !== "done"` for urgent pending

### 3.2 `summarizeProjects()`
**Purpose:** Calculate project health metrics

**Returns:**
```
PROJECT SUMMARY:
────────────────
• Active Projects: 3
• Average Progress: 52%
• Lagging Projects (<30%): 0
• Leading Projects (>60%): 2
```

**Logic:**
- Imports `projects.json`
- Calculates `sum(progress) / count`
- Identifies `progress < 30` as lagging
- Identifies `progress > 60` as leading

### 3.3 `preparePrompt()`
**Purpose:** Combine analysis into strategic report

**Returns:**
```
===========================================
AHK STRATEGIC DASHBOARD – AI CONTEXT
Generated: 2025-01-21T14:30:00.000Z
===========================================

[ROADMAP INSIGHTS]
...

[PROJECT SUMMARY]
...

[STRATEGIC CONTEXT]
This data represents Ashraf Kahoush's venture portfolio...
Recommend strategic pivots based on overdue tasks and lagging projects.
```

**Usage:**
- Called by Dashboard button click
- Called by Auto-Sync scheduler every 24 hours
- Future: Sent to Gemini API as prompt context

---

## 4. Connecting Gemini API (Future)

### Step 1: Get API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create new project "AHK Dashboard AI"
3. Generate API key
4. Store in `.env.local`:
   ```
   VITE_GEMINI_API_KEY=your_key_here
   ```

### Step 2: Update `ai-hook.js`
```javascript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

export async function handler(prompt) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })
  const result = await model.generateContent(prompt)
  const response = await result.response
  return response.text()
}
```

### Step 3: Install Dependencies
```bash
npm install @google/generative-ai
```

### Step 4: Update Dashboard Handler
```javascript
const handleAIAnalysis = async () => {
  const prompt = preparePrompt()
  const aiResponse = await handler(prompt)
  alert('✅ AI Analysis Complete!')
  console.log('🤖 GEMINI RESPONSE:\n', aiResponse)
}
```

---

## 5. Sample Prompt Structure

When sent to Gemini, the prompt will include:

### Context Section
```
You are a strategic advisor for Ashraf Kahoush, founder of AHK Holdings.
Analyze the following portfolio data and provide:
1. Risk assessment for overdue tasks
2. Resource allocation recommendations
3. Strategic pivots based on project performance
```

### Data Section
```
[ROADMAP INSIGHTS]
• Total Tasks: 10
• Overdue: 2 (T-0001, T-0004)

[PROJECT SUMMARY]
• Lagging: PRJ-WOW (20% progress)
• Leading: PRJ-QVAN (80% progress)
```

### Action Request
```
Provide 3-5 actionable recommendations with priority levels.
Format output as:
🔴 HIGH: [recommendation]
🟡 MEDIUM: [recommendation]
🟢 LOW: [recommendation]
```

---

## 6. Future Enhancements

### Phase 2: Advanced Analysis
- **Sentiment Analysis**: Parse task notes (Arabic + English)
- **Budget Forecasting**: Predict burn rate based on progress
- **Risk Scoring**: Calculate project failure probability

### Phase 3: Multi-AI Validation
- **Gemini**: Primary strategic reasoning
- **Grok**: Cross-validate with xAI's real-time data
- **ChatGPT**: Secondary opinion for consensus building

### Phase 4: Automated Actions
- **Email Alerts**: Send reports to investors automatically
- **Task Auto-Assignment**: AI suggests who should handle overdue tasks
- **Budget Reallocation**: AI proposes fund redistribution

### Phase 5: Voice Integration
- **Ask AI**: Natural language queries ("What's my biggest risk?")
- **Voice Commands**: "Run weekly analysis"
- **Meeting Summaries**: Transcribe strategy calls, extract action items

---

## 7. Troubleshooting

### Issue: "Run AI Analysis" button does nothing
**Solution:** Check browser console for errors. Verify `autoAgent.browser.js` exports correctly.

### Issue: Auto-Sync not triggering
**Solution:** Open DevTools Console, run:
```javascript
localStorage.setItem('aiAutoSync', 'true')
location.reload()
```

### Issue: Gemini API quota exceeded
**Solution:** Switch to free tier Grok API or use local Ollama model (Llama 3.1).

---

## 8. Security Considerations

### Data Privacy
- **Source Documents**: Contain confidential investor names (use Public Mask Mode)
- **API Keys**: Never commit `.env.local` to Git
- **Client Data**: Anonymize before sending to external AI APIs

### API Safety
- **Rate Limiting**: Max 10 AI calls per hour (prevent abuse)
- **Input Validation**: Sanitize prompt content before API calls
- **Output Filtering**: Strip sensitive data from AI responses

---

## 9. Testing Checklist

Before production deployment:
- [ ] Click "Run AI Analysis" → Alert shows success
- [ ] Browser console logs full formatted report
- [ ] Auto-Sync triggers after 24 hours (set shorter interval for testing)
- [ ] Gemini API returns valid JSON response
- [ ] Error handling works (try invalid API key)
- [ ] Public Mask Mode hides client names in AI prompts

---

## 10. References

- **Gemini API Docs**: https://ai.google.dev/docs
- **Mission #4 Source Tracking**: `docs/Data_Sources.md`
- **Project Roadmap**: `src/data/roadmap.json`
- **Source Documents**: `docs/sources/` (Strategic Roadmap, Assets Status, etc.)

---

**Next Steps:**
1. Test AI Analysis button in browser
2. Verify console output matches expected format
3. Enable Auto-Sync with `localStorage.setItem('aiAutoSync', 'true')`
4. Monitor 24-hour scheduler execution
5. Integrate Gemini API key when ready

---

**Contact:** Ashraf Kahoush  
**Version History:**
- v0.1 (2025-01-21): Initial AI layer with local analysis functions
