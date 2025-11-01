// src/ai/voice.js
export function createVoiceAgent({ onCommand, onStatus, onTranscript }) {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null;
  let active = false;

  function speak(text) {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.02;
      u.pitch = 1.0;
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.error('TTS error:', e);
    }
  }

  function start() {
    if (!SpeechRec) {
      onStatus?.('Speech not supported. Type commands instead.');
      speak('Speech recognition not supported on this browser.');
      return;
    }
    if (active) return;
    rec = new SpeechRec();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onstart = () => {
      active = true;
      onStatus?.('listening');
    };
    rec.onerror = (e) => {
      onStatus?.(`error: ${e.error}`);
      active = false;
    };
    rec.onend = () => {
      active = false;
      onStatus?.('idle');
    };

    let finalText = '';
    rec.onresult = (evt) => {
      let interim = '';
      for (let i = evt.resultIndex; i < evt.results.length; i++) {
        const chunk = evt.results[i][0].transcript;
        if (evt.results[i].isFinal) finalText += chunk + ' ';
        else interim += chunk;
      }
      onTranscript?.(finalText || interim);
      // When user pauses, treat finalText as a command
      if (finalText.trim().length > 0) {
        const cmd = finalText.trim();
        finalText = '';
        onCommand?.(cmd, { speak });
      }
    };
    rec.start();
  }

  function stop() {
    if (rec && active) rec.stop();
  }

  return { start, stop, speak, isActive: () => active };
}
