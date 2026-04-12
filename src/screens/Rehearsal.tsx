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
          <span key={i} style={isMatch ? { background: '#FEF08A', borderRadius: 2, padding: '0 1px' } : undefined}>
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
    rehearsalMode, enableTTS, loopTroubleLines,
    setCurrentStep, saveLineAccuracy, saveRunStats,
    updateRunAttempt, clearRunAttempts,
  } = useScript();

  const [userInput, setUserInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [tab, setTab] = useState<Tab>('script');

  const startTimeRef = useRef(Date.now());
  const lineScoresRef = useRef<Record<string, number>>({});
  const troubleLoopCountRef = useRef(0);
  const submitLineRef = useRef<((input?: string) => void) | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { speak, cancel } = useTextToSpeech();

  const lines = selectedScene?.lines || [];
  const currentLine = lines[currentLineIndex];
  const isMyLine = currentLine?.character === selectedCharacter;
  const totalLines = lines.length;

  // Reset run state on mount
  useEffect(() => {
    clearRunAttempts();
    startTimeRef.current = Date.now();
    lineScoresRef.current = {};
    troubleLoopCountRef.current = 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    // Loop trouble lines if enabled
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

  // Keep a stable ref so handleFinalSpeech doesn't recreate on every render
  submitLineRef.current = submitLine;

  const handleFinalSpeech = useCallback((text: string) => {
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

    let cancelled = false;

    const doNext = () => {
      if (cancelled) return;
      if (currentLineIndex + 1 >= totalLines) {
        doEndScene();
      } else {
        setCurrentLineIndex(currentLineIndex + 1);
      }
    };

    if (enableTTS) {
      // Always wait at least 1s even if TTS errors/resolves instantly
      const minPause = new Promise<void>(r => setTimeout(r, 1000));
      Promise.all([speak(currentLine.text), minPause]).then(doNext);
    } else {
      const timer = setTimeout(doNext, 1200);
      return () => { cancelled = true; clearTimeout(timer); };
    }

    return () => {
      cancelled = true;
      cancel();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLineIndex]);

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

  const getVisibleLines = () => {
    if (rehearsalMode === 'full-blackout') return [];
    if (rehearsalMode === 'cue-only') return lines.slice(Math.max(0, currentLineIndex - 1), currentLineIndex);
    return lines.slice(Math.max(0, currentLineIndex - 2), currentLineIndex);
  };

  const visibleLines = getVisibleLines();

  const renderLineText = (line: typeof lines[0]) => {
    const isPlayer = line.character === selectedCharacter;
    if (isPlayer && rehearsalMode === 'highlight') {
      const words = line.text.split(' ');
      const keep = new Set([0, words.length - 1]);
      words.forEach((w, wi) => { if (w.length > 5) keep.add(wi); });
      return words.map((w, wi) => keep.has(wi) ? w : '___').join(' ');
    }
    return line.text;
  };

  const cueLine = (() => {
    for (let i = currentLineIndex - 1; i >= 0; i--) {
      if (lines[i].character !== selectedCharacter) return lines[i];
    }
    return null;
  })();

  // What's been spoken so far (interim during speech, or typed text)
  const spokenSoFar = interimTranscript || userInput;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--color-bg)' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E4E0', background: '#fff' }}>
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

      {/* Script area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {rehearsalMode === 'full-blackout' ? (
          <div style={{ textAlign: 'center', color: '#9B9B9B', padding: '24px 0', fontSize: 13 }}>Full blackout — no script visible</div>
        ) : (
          <>
            {/* Previous context lines */}
            {visibleLines.map(line => (
              <div key={line.id} style={{ marginBottom: 10, opacity: 0.4 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#1A1A1A', letterSpacing: '0.03em', marginBottom: 2 }}>{line.character}</div>
                <div style={{ fontSize: 12, color: '#6B6B6B', lineHeight: 1.6 }}>{renderLineText(line)}</div>
              </div>
            ))}

            {/* Cue line box (the other character's last line before mine) */}
            {isMyLine && cueLine && rehearsalMode !== 'cue-only' && (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid #E5E4E0', margin: '10px 0' }} />
                <div style={{ background: '#F7F6F3', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#534AB7', letterSpacing: '0.03em', marginBottom: 2 }}>{cueLine.character}</div>
                  <div style={{ fontSize: 12, color: '#1A1A1A', fontWeight: 500, lineHeight: 1.6 }}>{cueLine.text}</div>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid #E5E4E0', margin: '10px 0' }} />
              </>
            )}

            {/* Cue-only mode: show previous line */}
            {rehearsalMode === 'cue-only' && visibleLines.map(line => (
              <div key={`cue-${line.id}`} style={{ marginBottom: 10, opacity: 0.4 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#1A1A1A', letterSpacing: '0.03em', marginBottom: 2 }}>{line.character}</div>
                <div style={{ fontSize: 12, color: '#6B6B6B', lineHeight: 1.6 }}>{line.text}</div>
              </div>
            ))}

            {/* Other character's line currently being read */}
            {!isMyLine && currentLine && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#534AB7', letterSpacing: '0.03em', marginBottom: 2 }}>{currentLine.character}</div>
                <div style={{ fontSize: 13, color: '#1A1A1A', lineHeight: 1.6 }}>{currentLine.text}</div>
                {enableTTS && (
                  <div style={{ fontSize: 11, color: '#9B9B9B', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#534AB7', animation: 'pulse 1s ease-in-out infinite' }} />
                    Reading aloud…
                  </div>
                )}
              </div>
            )}

            {/* My line prompt with yellow word highlighting */}
            {isMyLine && !submitted && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#0F6E56', letterSpacing: '0.03em', marginBottom: 4 }}>YOUR LINE ({selectedCharacter})</div>
                {rehearsalMode === 'hidden-lines' ? (
                  <div style={{ fontSize: 13, color: '#1A1A1A', lineHeight: 1.7, filter: 'blur(4px)', userSelect: 'none' }}>
                    {currentLine?.text}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#1A1A1A', lineHeight: 1.7 }}>
                    {spokenSoFar ? (
                      <WordHighlight expected={currentLine?.text || ''} spoken={spokenSoFar} />
                    ) : (
                      <span style={{ color: '#C4C4C4' }}>
                        {renderLineText(currentLine)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Brief submitted indicator */}
            {submitted && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0F6E56', fontSize: 12, fontWeight: 500, padding: '8px 0' }}>
                <span style={{ fontSize: 16 }}>✓</span> Got it — next up…
              </div>
            )}
          </>
        )}
      </div>

      {/* Input bar — only show when it's my line and not yet submitted */}
      {isMyLine && !submitted && (
        <div style={{ padding: '10px 14px', background: '#fff', borderTop: '1px solid #E5E4E0', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            ref={inputRef}
            value={interimTranscript || userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitLine(); }}
            placeholder="Type your line…"
            style={{ flex: 1, border: '1px solid #E5E4E0', borderRadius: 8, padding: '10px 12px', fontSize: 13, background: '#fff', outline: 'none', fontFamily: "'DM Sans', sans-serif" }}
          />
          {userInput.trim() && !isListening && (
            <button onClick={() => submitLine()} style={{ padding: '10px 14px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>✓</button>
          )}
          {isSupported && (
            <MicButton isListening={isListening} onToggle={isListening ? stopListening : startListening} />
          )}
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: 'flex', borderTop: '1px solid #E5E4E0', background: '#fff', paddingBottom: 4 }}>
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
