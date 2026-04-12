import { useState, useEffect, useRef, useCallback } from 'react';
import { useScript } from '../contexts/ScriptContext';
import { compareLine } from '../lib/lineCompare';
import { MicButton } from '../components/MicButton';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { ModesSettings } from './ModesSettings';
import type { Tab } from './ModesSettings';

// Highlights words in the expected line that match words spoken so far
function WordHighlight({ expected, spoken }: { expected: string; spoken: string }) {
  const tokens = expected.split(/(\s+)/);
  const spokenWords = spoken.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  let si = 0;
  return (
    <>
      {tokens.map((token, i) => {
        if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
        const clean = token.toLowerCase().replace(/[^a-z0-9]/g, '');
        const isMatch = si < spokenWords.length && clean === spokenWords[si];
        if (isMatch) si++;
        return (
          <span key={i} style={isMatch ? { background: '#FACC15', borderRadius: 2, padding: '0 1px' } : undefined}>
            {token}
          </span>
        );
      })}
    </>
  );
}

export function Rehearsal() {
  const {
    selectedScene, selectedCharacter, currentLineIndex, setCurrentLineIndex,
    rehearsalMode, loopTroubleLines,
    elevenLabsKey, elevenLabsVoice,
    setCurrentStep, saveLineAccuracy, saveRunStats,
    updateRunAttempt, clearRunAttempts,
  } = useScript();

  const [userInput, setUserInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [tab, setTab] = useState<Tab>('script');
  // sessionActive: user pressed mic once; keeps listening through all their lines
  const [sessionActive, setSessionActive] = useState(false);

  const startTimeRef = useRef(Date.now());
  const lineScoresRef = useRef<Record<string, number>>({});
  const troubleLoopCountRef = useRef(0);
  const submitLineRef = useRef<((input?: string) => void) | null>(null);
  const isMyLineRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lineRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { speak, cancel } = useTextToSpeech(elevenLabsKey, elevenLabsVoice);

  const lines = selectedScene?.lines || [];
  const currentLine = lines[currentLineIndex];
  const isMyLine = currentLine?.character === selectedCharacter;
  const totalLines = lines.length;

  // Keep a ref so speech callbacks can check without stale closures
  isMyLineRef.current = isMyLine;

  // Reset run state on mount + unlock TTS on iOS (needs to be called within a user gesture frame)
  useEffect(() => {
    clearRunAttempts();
    startTimeRef.current = Date.now();
    lineScoresRef.current = {};
    troubleLoopCountRef.current = 0;
    // Unlock speech synthesis on iOS by speaking a silent utterance
    if (window.speechSynthesis) {
      const unlock = new SpeechSynthesisUtterance(' ');
      unlock.volume = 0;
      window.speechSynthesis.speak(unlock);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to current line
  useEffect(() => {
    const el = lineRefs.current[currentLine?.id || ''];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentLineIndex, currentLine?.id]);

  const doEndScene = useCallback(() => {
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    const scores = Object.values(lineScoresRef.current);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    saveRunStats(avg, elapsed);
    setCurrentStep('stats');
  }, [saveRunStats, setCurrentStep]);

  const doAdvanceLine = useCallback(() => {
    setSubmitted(false);
    setUserInput('');
    if (currentLineIndex + 1 >= totalLines) {
      doEndScene();
    } else {
      setCurrentLineIndex(currentLineIndex + 1);
    }
  }, [currentLineIndex, totalLines, doEndScene, setCurrentLineIndex]);

  const submitLine = useCallback((input?: string) => {
    const text = (input ?? userInput).trim();
    if (!text || !currentLine || !isMyLine || submitted) return;

    const result = compareLine(text, currentLine.text);
    saveLineAccuracy(currentLine.id, result.accuracy);
    updateRunAttempt(currentLine.id, text, result.accuracy);
    lineScoresRef.current[currentLine.id] = result.accuracy;

    if (loopTroubleLines && result.accuracy < 70 && troubleLoopCountRef.current < 2) {
      troubleLoopCountRef.current++;
      setUserInput('');
      resetSpeech();
      return;
    }
    troubleLoopCountRef.current = 0;
    setSubmitted(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInput, currentLine, isMyLine, submitted, saveLineAccuracy, updateRunAttempt, loopTroubleLines]);

  submitLineRef.current = submitLine;

  const handleFinalSpeech = useCallback((text: string) => {
    // Only submit when it's the player's line
    if (!isMyLineRef.current) return;
    setUserInput(text);
    submitLineRef.current?.(text);
  }, []);

  const { interimTranscript, isListening, isSupported, start: startListening, stop: stopListening, reset: resetSpeech } = useSpeechRecognition(handleFinalSpeech);

  // Auto-advance 900ms after submission
  useEffect(() => {
    if (!submitted) return;
    const timer = setTimeout(doAdvanceLine, 900);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, currentLineIndex]);

  // Handle other character's lines: speak then advance
  useEffect(() => {
    if (!currentLine || isMyLine) return;

    // Stop recognition while other character is speaking
    if (isListening) { stopListening(); resetSpeech(); }

    let cancelled = false;
    const doNext = () => {
      if (cancelled) return;
      if (currentLineIndex + 1 >= totalLines) doEndScene();
      else setCurrentLineIndex(currentLineIndex + 1);
    };

    // Always read other characters' lines aloud
    const minPause = new Promise<void>(r => setTimeout(r, 800));
    Promise.all([speak(currentLine.text), minPause]).then(doNext);

    return () => { cancelled = true; cancel(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLineIndex]);

  // Continuous session: auto-(re)start recognition when it's the player's turn
  useEffect(() => {
    if (!sessionActive || !isMyLine || submitted || isListening) return;
    // Small delay so state settles after TTS / line advancement
    const t = setTimeout(() => { if (sessionActive) startListening(); }, 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionActive, isMyLine, currentLineIndex, submitted, isListening]);

  if (!selectedScene || !selectedCharacter) return null;
  if (tab !== 'script') return <ModesSettings tab={tab} onTabChange={setTab} />;

  const modeLabels: Record<string, { label: string; bg: string; text: string }> = {
    'prompter': { label: 'Prompter', bg: '#FAEEDA', text: '#854F0B' },
    'highlight': { label: 'Highlight', bg: '#FAEEDA', text: '#854F0B' },
    'hidden-lines': { label: 'Hidden', bg: '#FAECE7', text: '#993C1D' },
    'cue-only': { label: 'Cue Only', bg: '#FAECE7', text: '#993C1D' },
    'full-blackout': { label: 'Blackout', bg: '#FCEBEB', text: '#A32D2D' },
  };
  const modeInfo = modeLabels[rehearsalMode];
  const spokenSoFar = interimTranscript || userInput;

  const cueOnlyLines = rehearsalMode === 'cue-only'
    ? lines.slice(Math.max(0, currentLineIndex - 1), currentLineIndex + 1)
    : [];

  const getLineText = (line: typeof lines[0], idx: number) => {
    const isPlayer = line.character === selectedCharacter;
    const isCurrent = idx === currentLineIndex;
    if (isPlayer && rehearsalMode === 'highlight') {
      const words = line.text.split(' ');
      const keep = new Set([0, words.length - 1]);
      words.forEach((w, wi) => { if (w.length > 5) keep.add(wi); });
      return words.map((w, wi) => keep.has(wi) ? w : '___').join(' ');
    }
    if (isPlayer && rehearsalMode === 'hidden-lines' && idx >= currentLineIndex) {
      return <span style={{ filter: isCurrent ? 'blur(4px)' : 'blur(3px)', userSelect: 'none' }}>{line.text}</span>;
    }
    if (isCurrent && isPlayer && spokenSoFar) {
      return <WordHighlight expected={line.text} spoken={spokenSoFar} />;
    }
    return line.text;
  };

  const handleMicToggle = () => {
    if (sessionActive) {
      setSessionActive(false);
      stopListening();
      resetSpeech();
    } else {
      setSessionActive(true);
      // Effect will auto-start if isMyLine; if not, it waits
    }
  };

  return (
    // height: 100dvh keeps header + bottom bar always on screen
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: 'var(--color-bg)' }}>

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E4E0', background: '#fff', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setCurrentStep('scene-select')} style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <span style={{ display: 'inline-block', width: 16, height: 16, position: 'relative', flexShrink: 0 }}>
              <span style={{ position: 'absolute', top: 3, left: 2, width: 9, height: 9, borderLeft: '2px solid #9B9B9B', borderBottom: '2px solid #9B9B9B', transform: 'rotate(45deg)', display: 'block' }} />
            </span>
            <span style={{ fontSize: 12, color: '#9B9B9B' }}>Back</span>
          </button>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A' }}>{selectedScene.title}</div>
          <span style={{ fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 4, background: modeInfo.bg, color: modeInfo.text }}>{modeInfo.label}</span>
        </div>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 4, background: '#E5E4E0', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(currentLineIndex / totalLines) * 100}%`, background: '#1A1A1A', borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: 11, color: '#9B9B9B', whiteSpace: 'nowrap' }}>Line {currentLineIndex + 1} of {totalLines}</span>
        </div>
      </div>

      {/* Script area — scrolls internally */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>

        {rehearsalMode === 'full-blackout' && (
          <div style={{ textAlign: 'center', color: '#9B9B9B', padding: '40px 0', fontSize: 13 }}>
            Full blackout — no script visible
          </div>
        )}

        {rehearsalMode === 'cue-only' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cueOnlyLines.map((line) => {
              const isPlayer = line.character === selectedCharacter;
              const isCurrent = lines.indexOf(line) === currentLineIndex;
              const isPast = lines.indexOf(line) < currentLineIndex;
              return (
                <div key={line.id} ref={el => { lineRefs.current[line.id] = el; }}
                  style={{
                    padding: '10px 12px', borderRadius: 8,
                    background: isPlayer ? (isCurrent ? '#FEF08A' : '#FEFCE8') : (isCurrent ? '#F7F6F3' : 'transparent'),
                    opacity: isPast ? 0.4 : 1,
                    border: isCurrent ? '1px solid #E5E4E0' : '1px solid transparent',
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 600, color: isPlayer ? '#854F0B' : '#534AB7', letterSpacing: '0.05em', marginBottom: 3 }}>
                    {line.character}{isCurrent && isPlayer ? ' — YOUR LINE' : ''}
                  </div>
                  <div style={{ fontSize: 13, color: '#1A1A1A', lineHeight: 1.7 }}>
                    {getLineText(line, lines.indexOf(line))}
                  </div>
                  {isCurrent && !isPlayer && (
                    <div style={{ fontSize: 10, color: '#9B9B9B', marginTop: 4 }}>♪ reading aloud…</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {rehearsalMode !== 'full-blackout' && rehearsalMode !== 'cue-only' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {lines.map((line, idx) => {
              const isPlayer = line.character === selectedCharacter;
              const isCurrent = idx === currentLineIndex;
              const isPast = idx < currentLineIndex;
              let bg = 'transparent';
              if (isPlayer && !isPast) bg = isCurrent ? '#FEF08A' : '#FEFCE8';
              if (!isPlayer && isCurrent) bg = '#F0EFEB';
              return (
                <div
                  key={line.id}
                  ref={el => { lineRefs.current[line.id] = el; }}
                  style={{
                    padding: '9px 10px', borderRadius: 8, background: bg,
                    opacity: isPast ? 0.38 : 1,
                    transition: 'opacity 0.4s, background 0.2s',
                    borderLeft: isCurrent ? `3px solid ${isPlayer ? '#EAB308' : '#534AB7'}` : '3px solid transparent',
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 3, color: isPlayer ? '#854F0B' : '#534AB7' }}>
                    {line.character}
                    {isCurrent && isPlayer && <span style={{ marginLeft: 6, fontWeight: 500, color: '#0F6E56' }}>— YOUR LINE</span>}
                    {isCurrent && !isPlayer && <span style={{ marginLeft: 6, fontWeight: 400, color: '#9B9B9B' }}>♪</span>}
                  </div>
                  <div style={{ fontSize: 13, color: isPast ? '#6B6B6B' : '#1A1A1A', lineHeight: 1.75 }}>
                    {getLineText(line, idx)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ height: 16 }} />
      </div>

      {/* Input bar — sticky at bottom, always visible */}
      {isMyLine && !submitted && (
        <div style={{ padding: '10px 14px', background: '#fff', borderTop: '1px solid #E5E4E0', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <input
            ref={inputRef}
            value={interimTranscript || userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitLine(); }}
            placeholder={sessionActive && isListening ? '🎙 Listening…' : 'Type your line…'}
            style={{ flex: 1, border: `1px solid ${isListening ? '#EAB308' : '#E5E4E0'}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, background: isListening ? '#FEFCE8' : '#fff', outline: 'none', fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.2s, background 0.2s' }}
          />
          {userInput.trim() && !isListening && (
            <button onClick={() => submitLine()} style={{ padding: '10px 14px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>✓</button>
          )}
          {isSupported && (
            <MicButton
              isListening={sessionActive}
              onToggle={handleMicToggle}
            />
          )}
        </div>
      )}

      {/* Tab bar — sticky at bottom */}
      <div style={{ display: 'flex', borderTop: '1px solid #E5E4E0', background: '#fff', paddingBottom: 4, flexShrink: 0 }}>
        {(['script', 'modes', 'settings'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 0 4px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, background: tab === t ? '#1A1A1A' : '#E5E4E0' }} />
            <span style={{ fontSize: 10, fontWeight: tab === t ? 600 : 400, color: tab === t ? '#1A1A1A' : '#9B9B9B', textTransform: 'capitalize' }}>{t}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
