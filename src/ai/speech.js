// src/ai/speech.js
let speaking = false;

export function stopSpeak() {
  try {
    window.speechSynthesis?.cancel();
  } catch {}
  speaking = false;
}

export function speak(text, { lang = "en-US", pitch = 1, rate = 1, volume = 1 } = {}) {
  try {
    stopSpeak(); // cancel anything ongoing
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.pitch = pitch;
    utter.rate = rate;
    utter.volume = volume;
    utter.onstart = () => { speaking = true; };
    utter.onend = () => { speaking = false; };
    window.speechSynthesis.speak(utter);
  } catch (e) {
    console.warn("TTS unavailable:", e);
  }
}

export function pickLang(code) {
  // Normalize app locales to Web Speech tags
  if (!code) return "en-US";
  const c = code.toLowerCase();
  if (c.startsWith("ar")) return "ar-EG"; // Arabic (Egypt) – smooth default
  return "en-US";
}

export function isSpeaking() {
  return speaking;
}
