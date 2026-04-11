import { useState, useEffect, useRef, useCallback } from 'react';
import { useScript } from '../contexts/ScriptContext';
import { compareLine } from '../lib/lineCompare';
import type { LineComparison } from '../types/index';
import { MicButton } from '../components/MicButton';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { ModesSettings } from './ModesSettings';
import type { Tab } from './ModesSettings';

export function Rehearsal() {
  const {
    selectedScene, selectedCharacter, currentLineIndex, setCurrentLineIndex,
    rehearsalMode, enableTTS, autoAdvance, loopTroubleLines,
    setCurrentStep, saveLineAccuracy, saveRunStats,
  } = useScript();

  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<LineComparison | null>(null);
  const [tab, setTab] = useState<Tab>('script');
  const [startTime] = useState(Date.now());
  const [troubleLoopCount, setTroubleLoopCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { speak } = useTextToSpeech();

  const lines = selectedScene?.lines || [];
  const currentLine = lines[currentLineIndex];
  const isMyLine = currentLine?.character === selectedCharacter;
  const totalLines = lines.length;

  const submitLine = useCallback((input?: string) => {
    const text = (input ?? userInput).trim();
    if (!text || !currentLine || !isMyLine) return;
    const result = compareLine(text, currentLine.text);
    setFeedback(result);
    saveLineAccuracy(currentLine.id, result.accuracy);
  }, [userInput, currentLine, isMyLine, saveLineAccuracy]);

  const handleFinalSpeech = useCallback((text: string) => {
    setUserInput(text);
    submitLine(text);
  }, [submitLine]);

  const { interimTranscript, isListening, isSupported, start: startListening, stop: stopListening, reset: resetSpeech } = useSpeechRecognition(handleFinalSpeech);

  useEffect(() => {
    if (!isMyLine && currentLine && enableTTS) {
      speak(`${currentLine.character}: ${currentLine.text}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLineIndex]);

  const nextLine = useCallback(() => {
    if (loopTroubleLines && feedback && feedback.accuracy < 70 && troubleLoopCount < 2) {
      setTroubleLoopCount(c => c + 1);
      setFeedback(null); setUserInput(''); resetSpeech();
      return;
    }
    setTroubleLoopCount(0);
    setFeedback(null); setUserInput(''); resetSpeech();
    if (currentLineIndex + 1 >= totalLines) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      saveRunStats(feedback?.accuracy || 0, elapsed);
      setCurrentStep('stats');
    } else {
      setCurrentLineIndex(currentLineIndex + 1);
    }
  }, [currentLineIndex, totalLines, feedback, loopTroubleLines, troubleLoopCount, startTime, saveRunStats, setCurrentStep, setCurrentLineIndex, resetSpeech]);

  useEffect(() => {
    if (feedback && feedback.accuracy >= 80 && autoAdvance) {
      const timer = setTimeout(nextLine, 1800);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback]);

  useEffect(() => {
    if (currentLine && !isMyLine) {
      const timer = setTimeout(() => {
        if (currentLineIndex + 1 < totalLines) setCurrentLineIndex(currentLineIndex + 1);
      }, enableTTS ? 2500 : 600);
      return () => clearTimeout(timer);
    }
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

  // Build visible lines for script area
  const getVisibleLines = () => {
    if (rehearsalMode === 'full-blackout') return [];
    if (rehearsalMode === 'cue-only') return lines.slice(Math.max(0, currentLineIndex - 1), currentLineIndex);
    return lines.slice(Math.max(0, currentLineIndex - 2), Math.min(lines.length, currentLineIndex + 3));
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

  // Find the cue line (last non-player line before current player line)
  const cueLine = (() => {
    for (let i = currentLineIndex - 1; i >= 0; i--) {
      if (lines[i].character !== selectedCharacter) return lines[i];
    }
    return null;
  })();

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
            {visibleLines.filter(l => l.lineNumber < (currentLine?.lineNumber || 0)).map(line => (
              <div key={line.id} style={{ marginBottom: 10, opacity: 0.4 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#1A1A1A', letterSpacing: '0.03em', marginBottom: 2 }}>{line.character}</div>
                <div style={{ fontSize: 12, color: '#6B6B6B', lineHeight: 1.6 }}>{renderLineText(line)}</div>
              </div>
            ))}

            {/* Current cue line (the other character's line we're responding to) */}
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

            {/* Cue-only mode: just show the previous line */}
            {rehearsalMode === 'cue-only' && visibleLines.map(line => (
              <div key={line.id} style={{ marginBottom: 10, opacity: 0.4 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#1A1A1A', letterSpacing: '0.03em', marginBottom: 2 }}>{line.character}</div>
                <div style={{ fontSize: 12, color: '#6B6B6B', lineHeight: 1.6 }}>{line.text}</div>
              </div>
            ))}

            {/* Your line prompt */}
            {isMyLine && !feedback && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#0F6E56', letterSpacing: '0.03em', marginBottom: 2 }}>YOUR LINE ({selectedCharacter})</div>
                {rehearsalMode === 'hidden-lines' ? (
                  <div style={{ fontSize: 12, color: '#D4D4D4', fontStyle: 'italic', lineHeight: 1.6, filter: 'blur(3px)', userSelect: 'none' }}>{currentLine?.text}</div>
                ) : (
                  <div style={{ fontSize: 12, color: '#D4D4D4', fontStyle: 'italic', lineHeight: 1.6 }}>Tap mic or type your line...</div>
                )}
              </div>
            )}
          </>
        )}

        {/* Feedback inline */}
        {feedback && (
          <div>
            <div style={{ textAlign: 'center', padding: '16px 0 12px' }}>
              <div style={{ fontSize: 24, fontWeight: 500, color: '#1A1A1A' }}>{feedback.accuracy}%</div>
              <div style={{ fontSize: 13, color: '#6B6B6B', marginTop: 2 }}>{feedback.feedback}</div>
            </div>
            <div style={{ background: '#F7F6F3', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#9B9B9B', marginBottom: 6 }}>Expected</div>
              <div style={{ fontSize: 13, color: '#1A1A1A', lineHeight: 1.6 }}>{currentLine?.text}</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #E5E4E0', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#9B9B9B', marginBottom: 6 }}>You said</div>
              <div style={{ fontSize: 13, color: '#1A1A1A', lineHeight: 1.6 }}>{userInput || '(nothing)'}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {[
                { label: 'Correct', value: feedback.correct.length, color: '#3B6D11' },
                { label: 'Missed', value: feedback.missed.length, color: '#993C1D' },
                { label: 'Extra', value: feedback.extra.length, color: '#9B9B9B' },
              ].map(stat => (
                <div key={stat.label} style={{ flex: 1, background: '#F7F6F3', borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#9B9B9B' }}>{stat.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 500, color: stat.color, marginTop: 4 }}>{stat.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setFeedback(null); setUserInput(''); resetSpeech(); }} style={{ flex: 1, padding: '10px 0', border: '1px solid #E5E4E0', borderRadius: 8, background: 'transparent', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Retry line</button>
              <button onClick={nextLine} style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 8, background: '#1A1A1A', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Next line</button>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      {!feedback && isMyLine && (
        <div style={{ padding: '10px 14px', background: '#fff', borderTop: '1px solid #E5E4E0', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            ref={inputRef}
            value={interimTranscript || userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitLine(); }}
            placeholder="Type your line..."
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

      {/* Tab bar with dots */}
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
