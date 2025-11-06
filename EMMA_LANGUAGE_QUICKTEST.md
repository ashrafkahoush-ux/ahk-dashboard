# 🚀 Emma Language Engine — Quick Test Guide

**30-Second Validation** | Test natural language understanding

---

## ⚡ Quick Start

1. **Server is already running:**
   ```
   http://localhost:3002
   ```

2. **Open Emma Voice Console:**
   - Click Emma avatar (bottom-right)
   - Console opens + mic starts

3. **Try Natural Language Commands:**

---

## 🗣️ Test These Phrases

### ✅ **Natural English (All Work Now)**

```
"Emma, can you go ahead and read the report for me?"
"Let's review what we discovered yesterday"
"Brief me on the findings"
"Give me the insights"
"Show me what's in the report"
"Go through the summary when you're ready"
"What do I do now?"
"Tell me the next steps"
"What should I do next?"
"Say that again"
"One more time please"
```

### ✅ **Arabic Natural Language**

```
"ممكن اقرئي التقرير لو سمحتي"
"أعطيني الخلاصة"
"ما الخطوة التالية يا إيما"
"ابدئي التحليل لو سمحتي"
"أعيدي الكلام مرة تانية"
```

### ✅ **Typo Tolerance**

```
"red the repor"          → Still matches "READ_REPORT"
"strt analisis"          → Still matches "START_ANALYSIS"
"whats nxt"              → Still matches "NEXT_ACTIONS"
```

---

## 🧪 What to Check

### 1. **Console Logs** (F12)
Look for these logs in browser console:

```
🧠 Language Engine → Intent: READ_REPORT
📊 Confidence: 87.3%
🌍 Language: en
😊 Sentiment: neutral
🎭 Tone: strategic
```

### 2. **Intent Recognition**
All these should trigger the same action:
- "read the report"
- "brief me"
- "give me the findings"
- "show me what we discovered"
→ All should speak the clean summary

### 3. **Fallback Response**
Try gibberish:
```
"blah blah random stuff"
```
Should respond:
> "I didn't fully catch that, Ash. Try saying it in another way — or tell me the goal, and I'll interpret."

### 4. **Language Switching**
```
1. Say: "read the report" (EN) → Hears English
2. Say: "اقرئي التقرير" (AR) → Switches to Arabic
3. Say: "what's next" (EN) → Switches back to English
```

---

## 📊 Expected Console Output

When you say: **"Emma, can you go ahead and read the report for me?"**

```
🎤 Raw input: Emma, can you go ahead and read the report for me?
🧹 Cleaned: emma can go ahead read report
🌍 Language: en
✂️ Without fillers: emma can go ahead read report
📖 Expanded: emma can go ahead read report document summary
🎯 Intent: READ_REPORT
😊 Sentiment: 0 (neutral)
🎭 Tone: strategic

🧠 Language Engine → Intent: READ_REPORT
📊 Confidence: 87.3%
🌍 Language: en
😊 Sentiment: neutral
🎭 Tone: strategic
```

---

## 🎯 Success Criteria

Emma Language Engine is **WORKING** if:

1. ✅ Natural phrases like "brief me" trigger READ_REPORT
2. ✅ Console shows "Language Engine → Intent: [INTENT_NAME]"
3. ✅ Confidence score appears (0-100%)
4. ✅ Language auto-detected (en/ar)
5. ✅ Sentiment analyzed (positive/negative/neutral)
6. ✅ Tone selected (strategic/calm_supportive/etc.)
7. ✅ Typos still work ("red report" → READ_REPORT)
8. ✅ Fallback response for unknown phrases

---

## 🧠 Behind the Scenes

### 8-Stage NLU Pipeline

```
Your Voice: "Emma, can you brief me on the report?"
    ↓
Stage 1: Clean → "emma can brief report"
Stage 2: Detect Language → "en"
Stage 3: Remove Fillers → "emma can brief report"
Stage 4: Expand Synonyms → "emma can brief report summary document"
Stage 5: Extract Intent → "READ_REPORT" (confidence: 0.85)
Stage 6: Analyze Sentiment → neutral (score: 0)
Stage 7: Select Tone → "strategic"
Stage 8: Build Context → { hasHistory: true, timeOfDay: "afternoon" }
    ↓
Emma Responds: Reads clean summary in strategic tone
```

---

## 📈 Compare Before/After

### Before Language Engine
```
Input: "brief me"
Result: ❌ "I didn't catch that"
Reason: Exact phrase matching only
```

### After Language Engine
```
Input: "brief me"
Pipeline:
  ├─ Synonym expansion: "brief" → "read", "report"
  ├─ TF-IDF match: READ_REPORT (score: 0.82)
  ├─ Confidence: 82%
  └─ Intent: READ_REPORT
Result: ✅ Reads report summary
```

---

## 🔧 Troubleshooting

### Issue: Console shows "UNKNOWN" intent
**Fix:** Check confidence score
- If <30%: Phrase too vague, try more specific words
- If 30-50%: Phrase recognized but low confidence
- If >50%: Should work (check keyword matching)

### Issue: Wrong intent detected
**Fix:** Check console logs
```
🎯 Intent: WRONG_INTENT (should be: CORRECT_INTENT)
```
→ Add phrase to `intent_phrases.json` → Restart dev server

### Issue: Language engine not initializing
**Fix:** Check browser console for errors
```
🧠 Emma Language Engine v1.0 initialized  ← Should see this
📚 Loaded 15 intent categories
🎭 Available tones: strategic, calm_supportive, ...
```

If missing → Check imports in `SmartVoiceConsole.jsx`

---

## 📚 Documentation

- **Full integration guide:** `EMMA_LANGUAGE_ENGINE_INTEGRATION.md`
- **Dictionary (2100+ synonyms):** `src/emma_language/dictionary_core.json`
- **Intent phrases (220+):** `src/emma_language/intent_phrases.json`
- **Tone profiles (4):** `src/emma_language/tone_profiles.json`
- **Engine code (550 lines):** `src/emma_language/languageEngine.js`

---

## ✅ Test Checklist

Copy this to track testing:

```
EMMA LANGUAGE ENGINE TEST
Date: _______________
Tester: _______________

✅ / ❌  Natural English phrases work ("brief me")
✅ / ❌  Console shows "Language Engine → Intent"
✅ / ❌  Confidence score displayed (0-100%)
✅ / ❌  Language auto-detection (EN/AR)
✅ / ❌  Sentiment analysis working
✅ / ❌  Tone profiles selectable
✅ / ❌  Typo tolerance ("red report")
✅ / ❌  Fallback for unknown phrases
✅ / ❌  Arabic natural language
✅ / ❌  Synonym expansion (2100+ terms)

Overall: PASS / FAIL
```

---

**Status:** 🟢 Ready for Testing  
**Time to Test:** ~5 minutes  
**Next Step:** Try natural language phrases, verify console logs

**Need Help?** Open browser console (F12) and check for logs
