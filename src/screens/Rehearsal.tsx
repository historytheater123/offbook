import { useState, useEffect, useRef, useCallback } from 'react';
import { useScript } from '../contexts/ScriptContext';
import { compareLine } from '../lib/lineCompare';
import type { LineComparison } from '../types';
import { MicButton } from '../components/MicButton';
import { ProgressBar } from '../components/ProgressBar';
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
      setFeedback(null);
      setUserInput('');
      resetSpeech();
      return;
    }

    setTroubleLoopCount(0);
    setFeedback(null);
    setUserInput('');
    resetSpeech();

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
        if (currentLineIndex + 1 < totalLines) {
          setCurrentLineIndex(currentLineIndex + 1);
        }
      }, enableTTS ? 2500 : 600);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLineIndex]);

  if (!selectedScene || !selectedCharacter) return null;
  if (tab !== 'script') return <ModesSettings tab={tab} onTabChange={setTab} />;

  const modeLabels: Record<string, { label: string; color: string; textColor: string }> = {
    'prompter': { label: 'Prompter', color: 'var(--tag-easy-bg)', textColor: 'var(--tag-easy-text)' },
    'highlight': { label: 'Highlight', color: 'var(--tag-medium-bg)', textColor: 'var(--tag-medium-text)' },
    'hidden-lines': { label: 'Hidden', color: 'var(--tag-hard-bg)', textColor: 'var(--tag-hard-text)' },
    'cue-only': { label: 'Cue Only', color: 'var(--tag-hard-bg)', textColor: 'var(--tag-hard-text)' },
    'full-blackout': { label: 'Blackout', color: 'var(--tag-expert-bg)', textColor: 'var(--tag-expert-text)' },
  };
  const modeInfo = modeLabels[rehearsalMode];

  const renderScriptLines = () => {
    if (rehearsalMode === 'full-blackout') return (
      <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '24px 0', fontSize: 13 }}>
        Full blackout — no script visible
      </div>
    );

    let visibleLines = lines;
    if (rehearsalMode === 'cue-only') {
      visibleLines = lines.slice(Math.max(0, currentLineIndex - 1), currentLineIndex);
    } else {
      const contextStart = Math.max(0, currentLineIndex - 2);
      const contextEnd = Math.min(lines.length, currentLineIndex + 3);
      visibleLines = lines.slice(contextStart, contextEnd);
    }

    return visibleLines.map((line) => {
      const isPlayer = line.character === selectedCharacter;

      let displayText = line.text;
      if (isPlayer && rehearsalMode === 'highlight') {
        const words = line.text.split(' ');
        const keep = new Set([0, words.length - 1]);
        words.forEach((w, wi) => { if (w.length > 5) keep.add(wi); });
        displayText = words.map((w, wi) => keep.has(wi) ? w : '___').join(' ');
      }

      return (
        <div key={line.id} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
            {line.character}
          </div>
          <div
            style={{
              fontSize: 14, lineHeight: 1.6,
              color: isPlayer ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              filter: isPlayer && rehearsalMode === 'hidden-lines' ? 'blur(4px)' : 'none',
              userSelect: isPlayer && rehearsalMode === 'hidden-lines' ? 'none' : 'auto',
            }}
          >
            {displayText}
          </div>
        </div>
      );
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setCurrentStep('scene-select')} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: 13, padding: '4px 0', cursor: 'pointer' }}>
            ← Back
          </button>
          <div style={{ fontSize: 13, fontWeight: 500, flex: 1, textAlign: 'center' }}>{selectedScene.title}</div>
          <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 4, background: modeInfo.color, color: modeInfo.textColor }}>
            {modeInfo.label}
          </span>
        </div>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ProgressBar value={(currentLineIndex / totalLines) * 100} />
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
            {currentLineIndex + 1}/{totalLines}
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {renderScriptLines()}
      </div>

      {feedback && (
        <div style={{ padding: '16px', background: '#fff', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: feedback.accuracy >= 80 ? 'var(--tag-success-text)' : feedback.accuracy >= 60 ? 'var(--tag-medium-text)' : 'var(--tag-expert-text)', marginBottom: 4 }}>
            {feedback.accuracy}%
          </div>
          <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 10 }}>{feedback.feedback}</div>
          {feedback.missed.length > 0 && (
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              Missed: <span style={{ color: 'var(--tag-expert-text)' }}>{feedback.missed.join(', ')}</span>
            </div>
          )}
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>Expected: "{currentLine?.text}"</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setFeedback(null); setUserInput(''); resetSpeech(); }}
              style={{ flex: 1, padding: '10px', border: '1px solid var(--color-border)', borderRadius: 8, background: 'transparent', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            >
              Retry
            </button>
            <button
              onClick={nextLine}
              style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: '#1A1A1A', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {!feedback && isMyLine && (
        <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            ref={inputRef}
            value={interimTranscript || userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitLine(); }}
            placeholder="Tap mic or type your line..."
            style={{ flex: 1, border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 12px', fontSize: 13, background: '#fff', outline: 'none' }}
          />
          {userInput.trim() && !isListening && (
            <button
              onClick={() => submitLine()}
              style={{ padding: '10px 14px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            >
              ✓
            </button>
          )}
          {isSupported && (
            <MicButton
              isListening={isListening}
              onToggle={isListening ? stopListening : startListening}
            />
          )}
        </div>
      )}

      <div style={{ display: 'flex', borderTop: '1px solid var(--color-border)', background: '#fff' }}>
        {(['script', 'modes', 'settings'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '10px 0', border: 'none', background: 'transparent',
              fontSize: 12, fontWeight: tab === t ? 600 : 400,
              color: tab === t ? '#1A1A1A' : 'var(--color-text-muted)',
              borderTop: tab === t ? '2px solid #1A1A1A' : '2px solid transparent',
              textTransform: 'capitalize',
              cursor: 'pointer',
            }}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
