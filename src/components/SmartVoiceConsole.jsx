import React, { useEffect, useRef, useState } from "react";
import { speak, stopSpeak, pickLang } from "../ai/speech";
import { enhanceResponse, getGreeting, getConfirmation } from "../ai/responseEnhancer";
import EmmaAvatar from "./EmmaAvatar";
import emmaMemory from "../ai/emmaMemory";

export default function SmartVoiceConsole({ onCommand, uiLang = "en" }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("Idle");
  const [isOpen, setIsOpen] = useState(false);
  const [emmaState, setEmmaState] = useState("idle"); // idle, listening, thinking, speaking
  const [showParticles, setShowParticles] = useState(false);
  const recRef = useRef(null);
  const timeoutRef = useRef(null);
  const lang = pickLang(uiLang);
  const hasGreeted = useRef(false);

  // Greet user when opening console first time
  useEffect(() => {
    if (isOpen && !hasGreeted.current) {
      emmaMemory.recordCheckIn(); // Track user interaction
      
      // Check for proactive suggestions
      const suggestions = emmaMemory.getProactiveSuggestions();
      if (suggestions.length > 0 && Math.random() > 0.5) {
        // Show suggestion 50% of the time to avoid being annoying
        const suggestion = suggestions[0];
        speak(enhanceResponse(suggestion.message), { lang, gender: "female" });
      } else {
        const greeting = getGreeting("Ashraf");
        speak(enhanceResponse(greeting), { lang, gender: "female" });
      }
      hasGreeted.current = true;
    }
  }, [isOpen]);

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      const errorMsg = uiLang === "ar" ? "التعرّف الصوتي غير مدعوم" : "Voice recognition not supported";
      speak(enhanceResponse(errorMsg), { lang, gender: "female" });
      return;
    }
    const rec = new SR();
    recRef.current = rec;
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = true;

    rec.onstart = () => {
      setIsListening(true);
      setEmmaState("listening");
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
        setEmmaState("thinking");
        const msg = uiLang === "ar" ? "جارٍ تشغيل التحليل" : "Starting analysis";
        speak(enhanceResponse(msg, { addPersonality: true }), { lang, gender: "female" });
        emmaMemory.recordCommand("run-analysis"); // Track command
        stopListening();
        onCommand?.("run-analysis");
      } 
      // Daily report request
      else if (/daily report/i.test(text) || /التقرير اليومي/i.test(text)) {
        setEmmaState("speaking");
        const msg = uiLang === "ar" ? "هل ترغب بعرضه أم إرساله بالبريد؟" : "Would you like it displayed or emailed?";
        speak(enhanceResponse(msg), { lang, gender: "female" });
        emmaMemory.recordCommand("daily-report-request"); // Track command
        setStatus("Awaiting choice");
      } 
      // Display choice
      else if (/display/i.test(text) || /عرض/i.test(text)) {
        const confirm = getConfirmation();
        speak(enhanceResponse(confirm), { lang, gender: "female" });
        setEmmaState("working");
        emmaMemory.recordCommand("display-report"); // Track command
        emmaMemory.recordReportGeneration(); // Track report generation
        setPreference('reportDelivery', 'display'); // Learn preference
        onCommand?.("display-report");
        // Show celebration after command completes
        setTimeout(() => {
          setEmmaState("happy");
          setShowParticles(true);
          setTimeout(() => {
            setShowParticles(false);
            setEmmaState("idle");
          }, 2000);
        }, 1500);
        stopListening();
      } 
      // Email choice
      else if (/email/i.test(text) || /بريد/i.test(text)) {
        const confirm = getConfirmation();
        speak(enhanceResponse(confirm), { lang, gender: "female" });
        setEmmaState("working");
        emmaMemory.recordCommand("email-report"); // Track command
        emmaMemory.recordReportGeneration(); // Track report generation
        emmaMemory.setPreference('reportDelivery', 'email'); // Learn preference
        onCommand?.("email-report");
        // Show celebration after command completes
        setTimeout(() => {
          setEmmaState("happy");
          setShowParticles(true);
          setTimeout(() => {
            setShowParticles(false);
            setEmmaState("idle");
          }, 2000);
        }, 1500);
        stopListening();
      } 
      // Risk analysis
      else if (/risk/i.test(text) || /المخاطر/i.test(text)) {
        setEmmaState("thinking");
        const msg = uiLang === "ar" ? "جارٍ تحليل المخاطر" : "Running risk analysis";
        speak(enhanceResponse(msg), { lang, gender: "female" });
        onCommand?.("risk-analysis");
        stopListening();
      } 
      // Read report
      else if (/read( the)? report/i.test(text) || /اقرئي التقرير/i.test(text)) {
        setEmmaState("speaking");
        const msg = uiLang === "ar" ? "جارٍ قراءة التقرير" : "Reading the report now";
        speak(enhanceResponse(msg), { lang, gender: "female" });
        onCommand?.("read-report");
        stopListening();
      }
      // Show reports archive
      else if (/show reports|view archive/i.test(text) || /أظهر التقارير/i.test(text)) {
        const msg = uiLang === "ar" ? "فتح أرشيف التقارير" : "Opening reports archive";
        speak(enhanceResponse(msg), { lang, gender: "female" });
        emmaMemory.recordCommand("show-reports"); // Track command
        onCommand?.("show-reports");
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
    setEmmaState("idle");
    if (reason) console.log("🎤 Voice stopped:", reason);
  };

  const resetTimer = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      stopListening("Silence timeout");
      const msg = uiLang === "ar" ? "سأكون هنا إذا احتجتني" : "I'll be here if you need me";
      speak(enhanceResponse(msg), { lang, gender: "female" });
    }, 60000);
  };

  const closeConsole = () => {
    stopSpeak();
    stopListening("Manual close");
    setIsOpen(false);
    setEmmaState("idle");
  };

  useEffect(() => () => stopListening("Unmount"), []);

  // Emma state indicator styles
  const getEmmaIndicator = () => {
    switch (emmaState) {
      case "listening":
        return { color: "#10b981", icon: "🎤", label: "Listening" };
      case "thinking":
        return { color: "#f59e0b", icon: "🧠", label: "Thinking" };
      case "speaking":
        return { color: "#8b5cf6", icon: "💬", label: "Speaking" };
      default:
        return { color: "#6b7280", icon: "😊", label: "Ready" };
    }
  };

  const indicator = getEmmaIndicator();

  return (
    <>
      {/* Emma Bot Button with Avatar */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-50 hover:scale-110 transition-transform"
        title="Emma Voice Console"
      >
        <EmmaAvatar mood={emmaState} showParticles={showParticles} />
      </button>

      {/* Voice Console Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] p-4 rounded-2xl shadow-2xl bg-gradient-to-br from-[#0b1020] via-[#1e1b4b] to-[#0b1020] text-white border border-purple-500/30">
          {/* Header with Emma Status */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div 
                className="h-3 w-3 rounded-full animate-pulse" 
                style={{ backgroundColor: indicator.color }}
              />
              <span className="font-semibold text-lg">Emma</span>
              <span className="text-xs opacity-60">{indicator.icon} {indicator.label}</span>
            </div>
            <div className="space-x-2">
              <button
                onClick={isListening ? () => stopListening("Manual stop") : startListening}
                className={`px-3 py-1 rounded text-sm transition-all ${isListening ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
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
