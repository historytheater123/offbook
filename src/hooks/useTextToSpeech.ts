import { useCallback, useRef } from 'react';

export function useTextToSpeech() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
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
