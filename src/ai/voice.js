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
      
      // 🎤 Set female voice (matches Emma's tone from ChatGPT)
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => 
        (v.name.includes('Female') || 
         v.name.includes('Samantha') || 
         v.name.includes('Karen') ||
         v.name.includes('Victoria') ||
         v.name.includes('Zira') ||
         v.lang.startsWith('en')) && 
        v.name.includes('Female')
      ) || voices.find(v => v.lang.startsWith('en') && !v.name.includes('Male'));
      
      if (femaleVoice) {
        u.voice = femaleVoice;
        console.log('🎙️ Using female voice:', femaleVoice.name);
      }
      
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
    
    // Stop any existing instance first
    if (rec) {
      try {
        rec.stop();
      } catch (e) {
        console.log('Previous recognition cleanup:', e.message);
      }
    }
    
    // Create fresh recognition instance
    rec = new SpeechRec();
    const lang = detectLangFromToggle(currentLang);
    rec.lang = lang.code;
    rec.continuous = false; // Changed to false for better control
    rec.interimResults = true;
    
    rec.onstart = () => {
      active = true;
      onStatus?.('listening');
      console.log('🎤 Voice recognition started');
    };
    
    rec.onerror = (e) => {
      console.error('Voice recognition error:', e.error);
      onStatus?.(`error: ${e.error}`);
      active = false;
    };
    
    rec.onend = () => {
      console.log('🎧 Voice recognition stopped');
      active = false;
      onStatus?.('idle');
    };

    let finalText = '';
    rec.onresult = (evt) => {
      let interim = '';
      for (let i = evt.resultIndex; i < evt.results.length; i++) {
        const chunk = evt.results[i][0].transcript;
        if (evt.results[i].isFinal) {
          finalText += chunk + ' ';
        } else {
          interim += chunk;
        }
      }
      onTranscript?.(finalText || interim);
      
      // When final result is received, check for wake phrase or process command
      if (finalText.trim().length > 0) {
        const cmd = finalText.trim().toLowerCase();
        
        // 🎤 Wake phrase detection: "Emma, start analysis"
        if (cmd.includes('emma') && (cmd.includes('start analysis') || cmd.includes('analyze'))) {
          console.log('🎯 Wake phrase detected:', cmd);
          speak('Synchronization complete, Ash. Ready for analysis.');
          finalText = '';
          return;
        }
        
        console.log('🎤 Command received:', finalText.trim());
        const commandText = finalText.trim();
        finalText = '';
        onCommand?.(commandText, { speak });
      }
    };
    
    try {
      rec.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
      onStatus?.('Failed to start. Please try again.');
    }
  }

  function stop() {
    console.log('🛑 Voice agent stop() called');
    
    // Stop speech synthesis
    window.speechSynthesis.cancel();
    
    // Stop and cleanup recognition
    if (rec) {
      try {
        rec.stop();
      } catch (e) {
        console.log('Recognition stop error (ignored):', e.message);
      }
      rec = null; // 🔑 Fully reset the instance
    }
    
    active = false;
    onStatus?.('idle');
  }

  return { start, stop, speak, isActive: () => active };
}
