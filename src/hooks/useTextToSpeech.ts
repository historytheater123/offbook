import { useCallback, useRef } from 'react';

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() || [];
  // Prefer a local English voice (sounds better, works offline)
  return voices.find(v => v.localService && v.lang.startsWith('en'))
    || voices.find(v => v.lang.startsWith('en'))
    || voices[0]
    || null;
}

export function useTextToSpeech() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) { resolve(); return; }

      const doSpeak = () => {
        // Resume in case Chrome suspended synthesis
        window.speechSynthesis.resume();
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        const voice = pickVoice();
        if (voice) utterance.voice = voice;

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      };

      // Voices may not be loaded yet (especially on first call)
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        doSpeak();
      } else {
        const handler = () => {
          window.speechSynthesis.onvoiceschanged = null;
          doSpeak();
        };
        window.speechSynthesis.onvoiceschanged = handler;
        // Safety fallback if event never fires
        setTimeout(() => {
          if (utteranceRef.current === null) {
            window.speechSynthesis.onvoiceschanged = null;
            doSpeak();
          }
        }, 500);
      }
    });
  }, []);

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  const repeat = useCallback(() => {
    if (utteranceRef.current) {
      window.speechSynthesis?.cancel();
      window.speechSynthesis?.speak(utteranceRef.current);
    }
  }, []);

  return { speak, cancel, repeat };
}
