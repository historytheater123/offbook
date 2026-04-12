import { useCallback, useRef } from 'react';
import { speakWithElevenLabs, cancelElevenLabs, DEFAULT_VOICE_ID } from '../lib/elevenlabs';

function pickSystemVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() || [];
  if (!voices.length) return null;
  const en = voices.filter(v => v.lang.startsWith('en'));
  if (!en.length) return voices[0];

  const score = (v: SpeechSynthesisVoice) => {
    let s = 0;
    const n = v.name.toLowerCase();
    if (n.includes('enhanced')) s += 100;
    if (n.includes('premium'))  s += 90;
    if (n.includes('samantha')) s += 80;
    if (n.includes('alex'))     s += 75;
    if (n.includes('ava'))      s += 70;
    if (n.includes('allison'))  s += 70;
    if (n.includes('google'))   s += 60;
    if (n.includes('karen'))    s += 55;
    if (n.includes('daniel'))   s += 55;
    if (v.localService)         s += 20;
    if (v.lang === 'en-US')     s += 10;
    else if (v.lang === 'en-GB') s += 5;
    return s;
  };

  return [...en].sort((a, b) => score(b) - score(a))[0];
}

export function useTextToSpeech(elevenLabsKey?: string, voiceId?: string) {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string): Promise<void> => {
    // Use ElevenLabs if a key is configured
    if (elevenLabsKey?.trim()) {
      return speakWithElevenLabs(text, elevenLabsKey.trim(), voiceId || DEFAULT_VOICE_ID);
    }

    // Fallback: Web Speech API
    return new Promise((resolve) => {
      if (!window.speechSynthesis) { resolve(); return; }

      const doSpeak = () => {
        window.speechSynthesis.resume();
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.92;
        utterance.pitch = 1;
        utterance.volume = 1;
        const voice = pickSystemVoice();
        if (voice) utterance.voice = voice;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      };

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        doSpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          doSpeak();
        };
        setTimeout(() => {
          if (utteranceRef.current === null) {
            window.speechSynthesis.onvoiceschanged = null;
            doSpeak();
          }
        }, 500);
      }
    });
  }, [elevenLabsKey, voiceId]);

  const cancel = useCallback(() => {
    cancelElevenLabs();
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
