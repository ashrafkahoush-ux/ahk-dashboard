import React, { useEffect, useRef, useState } from "react";
import { speak, stopSpeak, pickLang } from "../ai/speech";

export default function SmartVoiceConsole({ onCommand, uiLang = "en" }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("Idle");
  const [isOpen, setIsOpen] = useState(false);
  const recRef = useRef(null);
  const timeoutRef = useRef(null);
  const lang = pickLang(uiLang);

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      speak(uiLang === "ar" ? "التعرّف الصوتي غير مدعوم" : "Voice recognition not supported", { lang });
      return;
    }
    const rec = new SR();
    recRef.current = rec;
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = true;

    rec.onstart = () => {
      setIsListening(true);
      setStatus(uiLang === "ar" ? "جارٍ الاستماع..." : "Listening...");
      setTranscript("");
      resetTimer();
    };

    rec.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join(" ");
      setTranscript(text);
      resetTimer();

      // Emma start analysis
      if (/emma[, ]*\s*start analysis/i.test(text) || /إمّا[, ]*\s*(ابدئي|ابدأ)\s*التحليل/i.test(text)) {
        speak(uiLang === "ar" ? "جارٍ تشغيل التحليل" : "Starting analysis", { lang, gender: "female" });
        stopListening();
        onCommand?.("run-analysis");
      } 
      // Daily report request
      else if (/daily report/i.test(text) || /التقرير اليومي/i.test(text)) {
        speak(uiLang === "ar" ? "هل ترغب بعرضه أم إرساله بالبريد؟" : "Would you like it displayed or emailed?", { lang, gender: "female" });
        setStatus("Awaiting choice");
      } 
      // Display choice
      else if (/display/i.test(text) || /عرض/i.test(text)) {
        onCommand?.("display-report");
        stopListening();
      } 
      // Email choice
      else if (/email/i.test(text) || /بريد/i.test(text)) {
        onCommand?.("email-report");
        stopListening();
      } 
      // Risk analysis
      else if (/risk/i.test(text) || /المخاطر/i.test(text)) {
        onCommand?.("risk-analysis");
        stopListening();
      } 
      // Read report - NEW in v4
      else if (/read( the)? report/i.test(text) || /اقرئي التقرير/i.test(text)) {
        onCommand?.("read-report");
        speak(uiLang === "ar" ? "جارٍ قراءة التقرير" : "Reading the report", { lang, gender: "female" });
        stopListening();
      }
    };

    rec.onerror = (e) => {
      setStatus(`Error: ${e.error}`);
      stopListening();
    };

    rec.onend = () => {
      setIsListening(false);
      recRef.current = null;
    };

    rec.start();
  };

  const stopListening = (reason = "") => {
    clearTimeout(timeoutRef.current);
    try { recRef.current?.stop(); } catch {}
    recRef.current = null;
    setIsListening(false);
    if (reason) console.log("🎤 Voice stopped:", reason);
  };

  const resetTimer = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => stopListening("Silence timeout"), 60000);
  };

  const closeConsole = () => {
    stopSpeak();
    stopListening("Manual close");
    setIsOpen(false);
  };

  useEffect(() => () => stopListening("Unmount"), []);

  return (
    <>
      {/* Emma Bot Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full flex items-center justify-center bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-lg text-white hover:scale-110 transition-transform"
        title="Emma Voice Console"
      >
        🤖
      </button>

      {/* Voice Console Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] p-4 rounded-2xl shadow-2xl bg-[#0b1020] text-white border border-white/10">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-lg">Emma Voice Console</span>
            <div className="space-x-2">
              <button
                onClick={isListening ? () => stopListening("Manual stop") : startListening}
                className={`px-3 py-1 rounded text-sm ${isListening ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
              >
                {isListening ? (uiLang === "ar" ? "إيقاف" : "Stop") : (uiLang === "ar" ? "تحدث" : "Speak")}
              </button>
              <button
                onClick={closeConsole}
                className="px-3 py-1 rounded text-sm bg-slate-700 hover:bg-slate-600"
              >
                {uiLang === "ar" ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>

          <div className="text-xs opacity-70 mb-1">{status}</div>
          <div className="bg-white/5 rounded-lg p-2 h-24 overflow-y-auto text-sm font-mono">{transcript || "..."}</div>
          
          <div className="mt-3 text-xs text-gray-400">
            💡 {uiLang === "ar" 
              ? 'جرب: "إمّا، ابدئي التحليل" أو "اقرئي التقرير"'
              : 'Try: "Emma, start analysis" or "read the report"'}
          </div>
        </div>
      )}
    </>
  );
}
