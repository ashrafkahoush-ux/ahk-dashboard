// server/voice/intentMap.cjs
module.exports = function detectIntentFromText(raw) {
  const text = (raw || "").toLowerCase().trim();

  // Wake words removed earlier in UI, but keep a safeguard
  const wake = /^(emma|e?mma|ايما|يا ايما|اما)\s*/i;
  const cleaned = text.replace(wake, "").trim();

  // Basic intents
  const rules = [
    { intent: "START_ANALYSIS",  test: /(start|run|begin).*(analysis|analyze)|ابدأ.*تحليل|شغّل.*تحليل/ },
    { intent: "READ_REPORT",     test: /(read|play|speak).*(report|brief)|اقرأ.*التقرير|اقري.*التقرير/ },
    { intent: "STOP",            test: /(stop|cancel|be quiet|enough)|قف|توقف|بس/ },
    { intent: "NAV_DASHBOARD",   test: /(go|open|navigate).*(dashboard)|اذهب.*لوحة|افتح.*لوحة/ },
    { intent: "NAV_STRATEGY",    test: /(go|open|navigate).*(strategy)|اذهب.*الاستراتيجية|افتح.*الاستراتيجية/ },
    { intent: "NAV_REPORTS",     test: /(go|open|navigate).*(reports?)|اذهب.*التقارير|افتح.*التقارير/ },
    { intent: "GENERATE_REPORT", test: /(generate|create|build).*(report)|انشئ.*تقرير|ولّدي.*تقرير/ },
  ];

  for (const r of rules) {
    if (r.test.test(cleaned)) return { intent: r.intent, text: cleaned };
  }

  // Fallback: if user only said "emma?"
  if (!cleaned) return { intent: "WAKE_ACK", text: "" };

  return { intent: "UNKNOWN", text: cleaned };
};
