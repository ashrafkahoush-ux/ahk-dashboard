# 🚀 Emma Voice v2 — Quick Test Guide

**5-Minute Validation** | Test the new strategic executive voice assistant

---

## ⚡ Quick Start

1. **Launch Dashboard:**
   ```powershell
   npm run dev
   ```
   Open: http://localhost:3002

2. **Open Emma Voice Console:**
   - Click Emma avatar (bottom-right)
   - Console opens + mic starts automatically

3. **Say Test Commands:**

### English Tests
```
"Emma, read report"          → Hears clean summary (no HTML)
"Emma, start analysis"       → Triggers analysis
"What do I do now?"          → Lists next actions only
"Repeat"                     → Re-speaks last summary
"Stop"                       → Console closes immediately
```

### Arabic Tests (اختبارات عربية)
```
"ابدئي التحليل"             → Start analysis in Arabic
"اقرئي التقرير"             → Read report with Hoda voice
"ما الخطوة التالية؟"        → Next actions in Arabic
"أعيدي"                     → Repeat in Arabic
"توقفي"                     → Stop
```

---

## 🎯 What to Verify

### ✅ Clean Summary (NO HTML)
**Before v2:**
> "Opening div class equals report-container. Paragraph. Strong. Revenue..."

**After v2:**
> "Executive Summary. Revenue increased 15%. Client retention 92%. Next: Close Germex deal."

**Test:** Say "Emma, read report" → Should hear bullets/actions/risks ONLY, no tags

---

### ✅ Language Auto-Switch
**Test Sequence:**
1. Say: "Emma, read report" (EN) → Hears English (Zira voice)
2. Say: "اقرئي التقرير" (AR) → Hears Arabic (Hoda voice)
3. Verify: Voice switches automatically, no manual toggle

---

### ✅ Executive Tone (No Hedging)
**Old Emma:**
> "I think we should maybe consider closing the Germex deal..."

**New Emma:**
> "We will close the Germex deal by November 15."

**Test:** Listen for decisive language (no "maybe", "perhaps", "could")

---

### ✅ Natural Pauses
**Test:** Long summary with multiple sections
**Expected:**
- 350ms pause between bullet points
- 600ms pause between sections (Summary → Actions → Risks)

---

### ✅ Stop/Repeat Controls

**Stop Test:**
1. Say: "Emma, read report" (long summary)
2. While speaking, click **"Stop ⏹️"** button
3. **Expected:** Speech stops immediately, console closes

**Repeat Test:**
1. Say: "Emma, read report"
2. Wait for speech to finish
3. Click **"Repeat 🔁"** button
4. **Expected:** Same summary re-spoken with same voice

**Read Report Button:**
1. Click **"Read Report 📄"** button (no voice needed)
2. **Expected:** Reads report without voice command

---

### ✅ Watchdog Timer (No Stuck States)
**Test:**
1. Open voice console
2. Don't speak for 15 seconds
3. **Expected:** Console auto-resets to "Ready", mic stops

---

## 🐛 Common Issues & Fixes

### Issue: Male Voice Still Playing
**Fix:** Clear cache
```powershell
Remove-Item node_modules\.vite -Recurse -Force
npm run dev
```

### Issue: Arabic Voice Not Available (Hoda)
**Fix:** Install Arabic voices (Windows)
1. Settings → Time & Language → Speech
2. Add "Arabic (Saudi Arabia)" voice pack
3. Restart browser

### Issue: "No report available"
**Fix:** Generate a report first
1. Go to AI Co-Pilot tab
2. Click "Generate Report"
3. Then test voice console

### Issue: Console Doesn't Respond
**Fix:** Check browser console (F12)
- Look for SpeechRecognition errors
- Verify microphone permissions granted
- Test in Chrome/Edge (Firefox not supported)

---

## 📊 Test Results Template

Copy this to track your testing:

```
EMMA VOICE V2 TEST RESULTS
Date: _______________
Tester: _______________
Browser: _______________

✅ / ❌  Clean Summary (no HTML)
✅ / ❌  Language Auto-Switch (EN → AR)
✅ / ❌  Executive Tone (no hedging)
✅ / ❌  Natural Pauses (350-600ms)
✅ / ❌  Stop Button Works
✅ / ❌  Repeat Button Works
✅ / ❌  Read Report Button Works
✅ / ❌  Watchdog Timer (15s reset)
✅ / ❌  Female Voice Only (Zira/Hoda)
✅ / ❌  Intent Recognition (natural phrases)

Notes:
_______________________________________
_______________________________________
_______________________________________

Overall: PASS / FAIL
```

---

## 🎤 Sample Test Phrases (Copy-Paste)

### English
```
Emma, start analysis
Emma, read the report
What do I do now?
Give me the insights
What are the next steps?
Brief me on the report
Repeat that
Stop
Cancel
```

### Arabic
```
إيمّا، ابدئي التحليل
اقرئي التقرير
ما الخطوة التالية؟
أعطيني الخلاصة
أعيدي
توقفي
بس
كفاية
```

---

## 📈 Success Criteria

Emma Voice v2 is **READY FOR PRODUCTION** if:

1. ✅ Zero HTML tags spoken aloud
2. ✅ Language switches automatically (no manual toggle)
3. ✅ Tone is crisp and decisive (no hedging words)
4. ✅ Stop/Repeat buttons work instantly (<500ms)
5. ✅ Console never stuck in listening state
6. ✅ Natural pauses between sections
7. ✅ Female voice only (Zira for EN, Hoda for AR)

---

**Need Help?**
- See full test plan: `VOICE_PIPELINE_TESTPLAN.md`
- See implementation report: `EMMA_VOICE_V2_COMPLETION_REPORT.md`
- Check voice architecture: `VOICE_ARCHITECTURE_AUDIT.md`

**Report Issues:**
Open VS Code terminal, paste error logs, and describe the bug.

---

**Status:** 🟢 Ready for Testing  
**Time to Test:** ~5 minutes  
**Next Step:** Run tests above, check all ✅, deploy to production
