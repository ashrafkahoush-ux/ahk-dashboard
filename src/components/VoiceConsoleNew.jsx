// /components/VoiceConsoleNew.jsx
import { useEffect } from "react";
import { useVoiceConsole } from "../hooks/useVoiceConsole";
import { handleIntent } from "../lib/intentRouter";

export default function VoiceConsoleNew() {
  const voice = useVoiceConsole({
    wakePhrase: "emma, start analysis",
    inactivityMs: 60_000,
    pushToTalk: false,             // set true if you prefer hold-to-talk
    locale: "en-US",
    vadThreshold: 0.015,
    onIntent: async (intent, text) => handleIntent(intent, text),
  });

  useEffect(() => {
    // Optional: auto-announce readiness on page load (polite, waits for user gesture on Safari)
    // void voice.speak("Voice console is ready.");
  }, []);

  const indicator = {
    idle: "Ready",
    listening: "Listening…",
    processing: "Processing…",
    speaking: "Speaking…",
    paused: "Paused",
    error: "Mic error",
  }[voice.state];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="rounded-2xl shadow-xl bg-black/70 backdrop-blur text-white p-4 w-[320px]">
        <div className="flex items-center justify-between">
          <div className="text-sm opacity-80">AI Voice Console</div>
          <div className="text-xs px-2 py-1 rounded bg-white/10">{indicator}</div>
        </div>

        <div className="mt-3 min-h-[44px] text-sm">
          {voice.interim ? <div className="opacity-70">{voice.interim}</div> : <div className="opacity-50">Say "Emma, start analysis", then "run sync".</div>}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => voice.start()}
            className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm"
            disabled={!voice.isSupported || voice.state === "listening"}
            aria-label="Start listening"
          >
            🎙️ Start
          </button>

          <button
            onClick={() => voice.stop()}
            className="px-3 py-2 rounded-xl bg-zinc-600 hover:bg-zinc-700 text-white text-sm"
            aria-label="Stop listening"
          >
            ⏹️ Stop
          </button>

          <button
            onClick={() => voice.cancelSpeech()}
            className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm"
            aria-label="Stop speaking"
          >
            🔇 Cancel
          </button>
        </div>

        {!voice.isSupported && (
          <div className="mt-3 text-xs text-amber-300">
            Your browser doesn't support speech recognition. Use Chrome or Edge.
          </div>
        )}
        {voice.lastError && (
          <div className="mt-2 text-xs text-red-300">Error: {voice.lastError}</div>
        )}
      </div>
    </div>
  );
}
