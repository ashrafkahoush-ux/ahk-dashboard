// src/ai/voice.js
import { LANGS, detectLangFromToggle } from './lang';

let currentLang = 'EN';

export function setVoiceLanguage(flag) {
  currentLang = flag === 'AR' ? 'AR' : 'EN';
}

export function getVoiceLanguage() {
  return currentLang;
}

export function createVoiceAgent({ onCommand, onStatus, onTranscript }) {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null;
  let active = false;

  function speak(text) {
    try {
      // Cancel any ongoing speech first
      window.speechSynthesis.cancel();
      
      const lang = detectLangFromToggle(currentLang);
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang.tts;
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
    const lang = detectLangFromToggle(currentLang);
    rec.lang = lang.code;
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
    console.log('🛑 Voice agent stop() called');
    
    // Stop speech synthesis
    window.speechSynthesis.cancel();
    
    // Stop recognition
    if (rec && active) {
      rec.stop();
      active = false;
    }
  }

  return { start, stop, speak, isActive: () => active };
}
