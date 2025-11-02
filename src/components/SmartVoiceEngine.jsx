// src/components/SmartVoiceEngine.jsx
import React, { useEffect, useRef, useState } from "react";
import { speak, stopSpeak, pickLang } from "../ai/speech";

const WAKE_PHRASES = {
  en: [/^emma[, ]*\s*(start|run)\s*(analysis|fusion)?/i, /^(run|start)\s*(analysis|fusion)/i],
  ar: [/^ي?إمّا[, ]*\s*(ابدئي|ابدأ|تشغيل)\s*(التحليل|الاندماج)?/i, /(ابدئي|ابدأ)\s*(التحليل|الاندماج)/i],
};

export default function SmartVoiceEngine({
  onCommand,          // (commandText) => Promise<void> | void
  uiLang = "en",      // "en" | "ar"
  autoCloseMs = 4000, // auto close window after speaking
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [hint, setHint] = useState("Say: \"Emma, start analysis\"");
  const [error, setError] = useState("");

  const recRef = useRef(null);
  const silenceTimer = useRef(null);
  const closeTimer = useRef(null);

  const speechLang = pickLang(uiLang);

  const resetTimers = () => {
    clearTimeout(silenceTimer.current);
    clearTimeout(closeTimer.current);
  };

  const startSilenceCountdown = () => {
    resetTimers();
    silenceTimer.current = setTimeout(() => {
      safeStop("Auto-stop after 60s silence");
    }, 60000);
  };

  const safeStop = (reason = "") => {
    try {
      recRef.current?.stop?.();
    } catch {}
    recRef.current = null;
    setIsListening(false);
    if (reason) console.log("🔇 Stopped:", reason);
  };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError("This browser doesn't support Speech Recognition.");
      speak(uiLang === "ar" ? "التعرّف الصوتي غير مدعوم." : "Voice recognition is not supported.", { lang: speechLang });
      return;
    }
    setError("");
    const rec = new SR();
    recRef.current = rec;
    rec.lang = speechLang;
    rec.interimResults = true;
    rec.continuous = true;

    rec.onstart = () => {
      setIsListening(true);
      setTranscript("");
      startSilenceCountdown();
      setHint(uiLang === "ar" ? "تحدّث الآن..." : "Listening...");
    };

    rec.onresult = (e) => {
      const chunk = Array.from(e.results).map(r => r[0].transcript).join(" ");
      setTranscript(chunk);

      const bank = uiLang === "ar" ? WAKE_PHRASES.ar : WAKE_PHRASES.en;
      if (bank.some(rx => rx.test(chunk))) {
        // Minimal parsing to map to commands
        const isFusion = /(fusion|الاندماج)/i.test(chunk);
        const cmd = isFusion ? "fusion analysis" : "start analysis";
        onCommand?.(cmd);
        setHint(uiLang === "ar" ? "جارٍ التنفيذ..." : "Executing…");
        safeStop("Wake phrase executed");
      }
      startSilenceCountdown();
    };

    rec.onerror = (e) => {
      setError(String(e.error || e.message || e));
      safeStop("Recognition error");
    };

    rec.onend = () => {
      setIsListening(false);
      recRef.current = null;
    };

    try {
      rec.start();
    } catch (e) {
      setError("Microphone blocked or already in use.");
    }
  };

  const stopAll = () => {
    stopSpeak();
    safeStop("Manual stop");
  };

  // Auto-close panel after TTS or after fixed delay
  const scheduleAutoClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setIsOpen(false), autoCloseMs);
  };

  // Public helpers
  const openAndListen = () => {
    setIsOpen(true);
    setTimeout(startListening, 100);
  };

  useEffect(() => () => { resetTimers(); safeStop("Unmount"); }, []);

  return (
    <>
      {/* Floating mic button */}
      <button
        onClick={() => (isOpen ? (isListening ? stopAll() : setIsOpen(false)) : openAndListen())}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full group"
        aria-label={isListening ? "Stop voice" : "Start voice"}
        style={{ background: "transparent" }}
      >
        <div className={`relative h-full w-full rounded-full shadow-xl ring-2 ${isListening ? "ring-lime-400" : "ring-slate-300"} animate-pulse`}>
          <div className={`absolute inset-0 rounded-full ${isListening ? "mic-glow-on" : "mic-glow-off"}`} />
          <div className="absolute inset-0 flex items-center justify-center text-white text-2xl">
            🎤
          </div>
        </div>
      </button>

      {/* Dock panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[340px] rounded-2xl shadow-2xl p-4 bg-[#0b1020] text-white border border-white/10">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Voice Assistant</div>
            <div className="space-x-2">
              <button onClick={stopAll} className="px-3 py-1 text-sm rounded bg-rose-600 hover:bg-rose-700">Stop</button>
              <button
                onClick={() => { setIsOpen(false); stopAll(); }}
                className="px-3 py-1 text-sm rounded bg-slate-700 hover:bg-slate-600"
              >Close</button>
            </div>
          </div>

          <div className="mt-3 text-xs opacity-70">{hint}</div>

          {transcript && (
            <div className="mt-2 p-2 rounded bg-white/5 max-h-28 overflow-y-auto text-sm">
              {transcript}
            </div>
          )}

          {error && <div className="mt-2 text-rose-400 text-xs">⚠ {error}</div>}
        </div>
      )}
    </>
  );
}
