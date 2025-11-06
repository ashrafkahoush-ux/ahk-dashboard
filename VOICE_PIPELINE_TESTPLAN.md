# 🧪 Emma Voice v2 - Test Plan & Validation

**Version:** 2.0  
**Date:** November 4, 2025  
**Scope:** Strategic Executive + Clean Summary + Auto-Language

---

## 📋 Test Categories

### 1. ✅ **Clean Summary Pipeline** (NO HTML MARKUP)

**Test 1.1: Strip HTML Tags**
- **Action:** Generate report with HTML tags
- **Command:** "Emma, read report"
- **Expected:** Clean text only, no `<div>`, `<p>`, `<span>` spoken
- **Status:** ⏸️ PENDING

**Test 1.2: Extract Insights (Bullets)**
- **Action:** Read complex report
- **Command:** "Emma, give me the insights"
- **Expected:** 3-5 bullet points, crisp facts only
- **Status:** ⏸️ PENDING

**Test 1.3: Extract Next Actions**
- **Action:** Report contains action items
- **Command:** "Emma, what do I do now?"
- **Expected:** Lists actionable next steps (→ format)
- **Status:** ⏸️ PENDING

**Test 1.4: Extract Risks**
- **Action:** Report mentions risks/blockers
- **Command:** "Emma, read report"
- **Expected:** Risk section with ! markers
- **Status:** ⏸️ PENDING

---

### 2. 🌍 **Language Auto-Switch (AR/EN)**

**Test 2.1: English Detection**
- **Action:** Open voice console
- **Command:** "Emma, start analysis" (EN)
- **Expected:** Emma responds in English, Zira/Sara voice
- **Status:** ⏸️ PENDING

**Test 2.2: Arabic Detection**
- **Action:** Open voice console
- **Command:** "ابدئي التحليل" (AR)
- **Expected:** Emma responds in Arabic, Hoda voice
- **Status:** ⏸️ PENDING

**Test 2.3: Language Switching (EN → AR)**
- **Action:** Start in English
- **Command 1:** "start analysis" (EN)
- **Command 2:** "اقرئي التقرير" (AR)
- **Expected:** First response EN, second response AR
- **Status:** ⏸️ PENDING

**Test 2.4: Language Switching (AR → EN)**
- **Action:** Start in Arabic
- **Command 1:** "ابدئي التحليل" (AR)
- **Command 2:** "read report" (EN)
- **Expected:** First response AR, second response EN
- **Status:** ⏸️ PENDING

**Test 2.5: Mixed Session**
- **Action:** Alternate languages
- **Commands:** EN, AR, EN, AR
- **Expected:** Emma switches seamlessly each time
- **Status:** ⏸️ PENDING

---

### 3. 🎤 **Executive Persona (Tone & Rhythm)**

**Test 3.1: Executive Tone (No Hedging)**
- **Action:** Listen to response content
- **Command:** "Emma, read report"
- **Expected:** No "maybe", "perhaps", "I think" phrases
- **Status:** ⏸️ PENDING

**Test 3.2: Speech Rate**
- **Action:** Listen to pace
- **Command:** Any command
- **Expected:** Rate 0.98 (calm, deliberate, not rushed)
- **Status:** ⏸️ PENDING

**Test 3.3: Speech Pitch**
- **Action:** Listen to voice tone
- **Command:** Any command
- **Expected:** Pitch 0.95 (grounded, authoritative)
- **Status:** ⏸️ PENDING

**Test 3.4: Natural Pauses**
- **Action:** Multi-section summary
- **Command:** "Emma, read report"
- **Expected:** 350ms pause between bullets, 600ms between sections
- **Status:** ⏸️ PENDING

**Test 3.5: Executive Preface**
- **Action:** First command of session
- **Command:** "Emma, start analysis"
- **Expected:** Opens with "These are the decisive points" or Arabic equivalent
- **Status:** ⏸️ PENDING

---

### 4. 🗣️ **Intent Recognition (AR/EN Synonyms)**

**Test 4.1: Analyze (English Variations)**
- **Commands:**
  - "start analysis"
  - "begin analysis"
  - "run analysis"
  - "analyze"
- **Expected:** All trigger START_ANALYSIS
- **Status:** ⏸️ PENDING

**Test 4.2: Analyze (Arabic Variations)**
- **Commands:**
  - "ابدئي التحليل"
  - "شغلي التحليل"
  - "إيما ابدئي التحليل"
- **Expected:** All trigger START_ANALYSIS
- **Status:** ⏸️ PENDING

**Test 4.3: Read Report (English)**
- **Commands:**
  - "read report"
  - "give me insights"
  - "summarize report"
  - "brief me"
- **Expected:** All trigger READ_REPORT
- **Status:** ⏸️ PENDING

**Test 4.4: Read Report (Arabic)**
- **Commands:**
  - "اقرئي التقرير"
  - "أعطيني الخلاصة"
  - "ملخص"
- **Expected:** All trigger READ_REPORT
- **Status:** ⏸️ PENDING

**Test 4.5: Next Actions (English)**
- **Commands:**
  - "what do I do now"
  - "next steps"
  - "what's next"
- **Expected:** All trigger NEXT_ACTIONS
- **Status:** ⏸️ PENDING

**Test 4.6: Next Actions (Arabic)**
- **Commands:**
  - "ما الخطوة التالية"
  - "ايه اللي لازم اعمله"
- **Expected:** All trigger NEXT_ACTIONS
- **Status:** ⏸️ PENDING

**Test 4.7: Stop (English)**
- **Commands:**
  - "stop"
  - "cancel"
  - "enough"
- **Expected:** All trigger STOP, console closes
- **Status:** ⏸️ PENDING

**Test 4.8: Stop (Arabic)**
- **Commands:**
  - "توقفي"
  - "بس"
  - "كفاية"
- **Expected:** All trigger STOP, console closes
- **Status:** ⏸️ PENDING

**Test 4.9: Repeat (English)**
- **Commands:**
  - "repeat"
  - "say again"
  - "one more time"
- **Expected:** All trigger REPEAT, last summary re-spoken
- **Status:** ⏸️ PENDING

**Test 4.10: Repeat (Arabic)**
- **Commands:**
  - "أعيدي"
  - "كرري"
  - "مرة تانية"
- **Expected:** All trigger REPEAT, last summary re-spoken
- **Status:** ⏸️ PENDING

---

### 5. 🔄 **Session Loop & Controls**

**Test 5.1: Finite State Machine**
- **Action:** Monitor state transitions
- **Flow:** idle → listening → processing → speaking → idle
- **Expected:** Clean transitions, no stuck states
- **Status:** ⏸️ PENDING

**Test 5.2: Stop Button (Immediate Abort)**
- **Action:** While Emma is speaking
- **Command:** Click "Stop" button or say "stop"
- **Expected:** TTS stops immediately, mic closes, returns to idle
- **Status:** ⏸️ PENDING

**Test 5.3: Repeat Button**
- **Action:** After Emma speaks summary
- **Command:** Click "Repeat" button or say "repeat"
- **Expected:** Last summary re-spoken with same voice/language
- **Status:** ⏸️ PENDING

**Test 5.4: Read Report Button (Manual Trigger)**
- **Action:** Click "Read Report" button
- **Expected:** Reads current report without voice command
- **Status:** ⏸️ PENDING

**Test 5.5: Watchdog Timer (15s Timeout)**
- **Action:** Leave console in processing/speaking state
- **Wait:** 15 seconds without action
- **Expected:** Auto-reset to idle, shows "Ready"
- **Status:** ⏸️ PENDING

**Test 5.6: Inactivity Timeout (60s)**
- **Action:** Open console, don't speak
- **Wait:** 60 seconds
- **Expected:** Console closes, returns to idle
- **Status:** ⏸️ PENDING

**Test 5.7: No Stuck Loops**
- **Action:** Rapid commands (5+ in succession)
- **Expected:** Console handles all, no crash, no infinite loop
- **Status:** ⏸️ PENDING

---

### 6. 🔊 **TTS Voices & Quality**

**Test 6.1: English Female Voice (Zira)**
- **Action:** Speak English command
- **Expected:** Microsoft Zira or similar female EN voice
- **Actual Voice:** _______________
- **Status:** ⏸️ PENDING

**Test 6.2: Arabic Female Voice (Hoda)**
- **Action:** Speak Arabic command
- **Expected:** Microsoft Hoda or similar female AR voice
- **Actual Voice:** _______________
- **Status:** ⏸️ PENDING

**Test 6.3: Voice Consistency (Single Language)**
- **Action:** Multiple EN commands in same session
- **Expected:** Same voice for all responses
- **Status:** ⏸️ PENDING

**Test 6.4: Voice Switching (Mixed Language)**
- **Action:** Switch between EN/AR
- **Expected:** Correct voice for each language
- **Status:** ⏸️ PENDING

**Test 6.5: No Voice Overlap**
- **Action:** Interrupt speaking with new command
- **Expected:** First speech stops, second begins cleanly
- **Status:** ⏸️ PENDING

---

### 7. ⚡ **Resilience & Error Handling**

**Test 7.1: Empty Report**
- **Action:** No report available
- **Command:** "Emma, read report"
- **Expected:** "No report available" or similar fallback
- **Status:** ⏸️ PENDING

**Test 7.2: Unrecognized Command**
- **Action:** Speak gibberish or unknown phrase
- **Command:** "blah blah blah"
- **Expected:** "I didn't catch that, try rephrasing"
- **Status:** ⏸️ PENDING

**Test 7.3: Microphone Permission Denied**
- **Action:** Block mic permissions
- **Expected:** Clear error message, graceful fallback
- **Status:** ⏸️ PENDING

**Test 7.4: Browser Tab Inactive**
- **Action:** Switch to another tab while Emma speaking
- **Expected:** Speech continues or pauses gracefully
- **Status:** ⏸️ PENDING

**Test 7.5: Network Offline**
- **Action:** Disconnect network during command
- **Expected:** Local TTS continues, no crash
- **Status:** ⏸️ PENDING

---

## 🎯 Acceptance Criteria

| Criterion | Status | Notes |
|-----------|--------|-------|
| Emma never reads raw HTML | ⏸️ | Must strip all tags |
| All summaries are bullets + actions + risks only | ⏸️ | Max 3-5 bullets |
| Language switches to match speech | ⏸️ | EN/AR auto-detect |
| Tone is crisp, decisive, executive | ⏸️ | No hedging words |
| Stop/Repeat work instantly | ⏸️ | <500ms response |
| No "stuck listening" loops | ⏸️ | 15s watchdog active |
| Executive preface spoken once per session | ⏸️ | First message only |
| Natural pauses between sections | ⏸️ | 350-600ms |
| Female voices only (Zira/Hoda) | ⏸️ | No male voices |
| State machine is finite and stable | ⏸️ | No infinite states |

---

## 📝 Test Execution Log

### Session 1: [Date/Time]
**Tester:** _______________  
**Browser:** _______________  
**OS:** _______________

**Tests Passed:** 0 / 40  
**Tests Failed:** 0 / 40  
**Tests Skipped:** 40 / 40

**Notes:**


---

### Session 2: [Date/Time]
**Tester:** _______________  
**Browser:** _______________  
**OS:** _______________

**Tests Passed:** ___ / 40  
**Tests Failed:** ___ / 40  
**Tests Skipped:** ___ / 40

**Notes:**


---

## 🐛 Known Issues

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| _None yet_ | - | - | - |

---

## ✅ Sign-Off

**Lead Developer:** _______________ Date: _______________  
**QA Tester:** _______________ Date: _______________  
**Product Owner:** _______________ Date: _______________

---

**Test Plan Version:** 1.0  
**Last Updated:** November 4, 2025  
**Status:** 🟡 READY FOR TESTING
