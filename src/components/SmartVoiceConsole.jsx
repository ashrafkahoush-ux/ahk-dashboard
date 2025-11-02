import React, { useState, useRef, useEffect } from "react";
import { speak, stopSpeak, pickLang } from "../ai/speech";

export default function SmartVoiceConsole({ onCommand, uiLang = "en" }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("Idle");
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
      setListening(true);
      setStatus(uiLang === "ar" ? "جارٍ الاستماع..." : "Listening...");
      setTranscript("");
      resetTimer();
    };

    rec.onresult = (e) => {
      const txt = Array.from(e.results).map(r => r[0].transcript).join(" ");
      setTranscript(txt);
      resetTimer();

      // Wake phrase detection
      if (/emma[, ]*\s*start analysis/i.test(txt) || /إمّا[, ]*\s*(ابدئي|ابدأ)\s*التحليل/i.test(txt)) {
        speak(uiLang === "ar" ? "جارٍ تشغيل التحليل" : "Starting analysis", { lang });
        stopListening();
        onCommand?.("run-analysis");
      } 
      // Daily report request
      else if (/daily report/i.test(txt) || /التقرير اليومي/i.test(txt)) {
        speak(uiLang === "ar" ? "هل ترغب بعرضه أم إرساله بالبريد؟" : "Would you like it displayed or emailed?", { lang });
        setStatus(uiLang === "ar" ? "في انتظار اختيارك" : "Awaiting choice");
      } 
      // Display choice
      else if (/display/i.test(txt) || /عرض/i.test(txt)) {
        speak(uiLang === "ar" ? "جارٍ عرض التقرير" : "Displaying report", { lang });
        stopListening();
        onCommand?.("display-report");
      } 
      // Email choice
      else if (/email/i.test(txt) || /بريد/i.test(txt)) {
        speak(uiLang === "ar" ? "جارٍ إرسال التقرير بالبريد" : "Sending report via email", { lang });
        stopListening();
        onCommand?.("email-report");
      } 
      // Risk analysis
      else if (/risk/i.test(txt) || /المخاطر/i.test(txt)) {
        speak(uiLang === "ar" ? "جارٍ تحليل المخاطر" : "Running risk analysis", { lang });
        stopListening();
        onCommand?.("risk-analysis");
      }
      // Q-VAN analysis
      else if (/q[\s-]?van/i.test(txt) || /كيو فان/i.test(txt)) {
        speak(uiLang === "ar" ? "جارٍ تحليل Q-VAN" : "Analyzing Q-VAN", { lang });
        stopListening();
        onCommand?.("qvan-analysis");
      }
    };

    rec.onerror = e => { 
      setStatus(`Error: ${e.error}`); 
      stopListening(); 
    };
    
    rec.onend = () => { 
      setListening(false); 
      recRef.current = null; 
      setStatus(uiLang === "ar" ? "متوقف" : "Stopped"); 
    };
    
    rec.start();
  };

  const stopListening = (reason = "") => {
    clearTimeout(timeoutRef.current);
    recRef.current?.stop?.();
    recRef.current = null;
    setListening(false);
    if (reason) console.log("🎤 Voice stopped:", reason);
  };

  const resetTimer = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      stopListening("Silence timeout");
      setStatus(uiLang === "ar" ? "انتهى الوقت (60 ثانية)" : "Timed out (60s silence)");
    }, 60000);
  };

  useEffect(() => () => stopListening("Unmount"), []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Mic Button */}
      <button
        onClick={() => (listening ? stopListening("Manual") : startListening())}
        className={`h-14 w-14 rounded-full shadow-xl flex items-center justify-center text-2xl transition-all duration-200 ${
          listening ? "bg-red-600 hover:bg-red-700 animate-pulse" : "bg-green-600 hover:bg-green-700"
        }`}
        title={listening ? "Stop Emma" : "Start Emma"}
      >
        🎤
      </button>
      
      {/* Status Panel */}
      {listening && (
        <div className="w-80 p-4 rounded-xl bg-[#0b1020] text-white shadow-2xl border border-purple-500/30 animate-fadeIn">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-xs font-medium text-purple-300">{status}</p>
          </div>
          <div className="mt-2 p-2 rounded bg-black/30 max-h-24 overflow-y-auto">
            <p className="text-sm text-gray-200 font-mono">{transcript || "..."}</p>
          </div>
          <div className="mt-3 text-xs text-gray-400 flex items-center gap-2">
            <span>💡</span>
            <span>
              {uiLang === "ar" 
                ? 'قل: "إمّا، ابدئي التحليل" أو "التقرير اليومي"' 
                : 'Say: "Emma, start analysis" or "daily report"'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
