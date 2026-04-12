import { useState } from 'react';
import { useScript } from '../contexts/ScriptContext';
import { copyShareUrl } from '../lib/shareUrl';

export function RunStats() {
  const { selectedScene, selectedCharacter, parsedScript, getSceneProgress, setCurrentStep, setCurrentLineIndex, runAttempts } = useScript();
  const [copied, setCopied] = useState(false);

  if (!selectedScene || !selectedCharacter || !parsedScript) return null;

  const progress = getSceneProgress(selectedScene.id);
  const runCount = progress?.runCount || 0;
  const lineAccuracies = progress?.lineAccuracies || {};

  const myLines = selectedScene.lines.filter(l => l.character === selectedCharacter);

  // Use this run's attempts for display; fall back to persisted last accuracy
  const getLastAccuracy = (lineId: string) => {
    if (runAttempts[lineId]) return runAttempts[lineId].accuracy;
    const accs = lineAccuracies[lineId] || [];
    return accs.length > 0 ? accs[accs.length - 1] : null;
  };

  // Compute this run's overall accuracy from runAttempts (most accurate for current run)
  const attemptValues = myLines.map(l => getLastAccuracy(l.id)).filter((a): a is number => a !== null);
  const runAccuracy = attemptValues.length
    ? Math.round(attemptValues.reduce((a, b) => a + b, 0) / attemptValues.length)
    : (progress?.bestAccuracy || 0);

  const perfectLines = myLines.filter(l => getLastAccuracy(l.id) === 100).length;
  const stumbleLines = myLines.filter(l => {
    const a = getLastAccuracy(l.id);
    return a !== null && a < 80;
  });

  // Improvement delta vs previous best (before this run)
  const bestAccuracy = progress?.bestAccuracy || 0;
  const prevBest = runCount > 1 ? bestAccuracy : null;
  const delta = prevBest !== null ? runAccuracy - prevBest : null;

  void runCount;

  const handleShare = async () => {
    const ok = await copyShareUrl(parsedScript.rawText);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const accuracyColor = runAccuracy >= 90 ? '#3B6D11' : runAccuracy >= 70 ? '#854F0B' : '#993C1D';
  const accuracyBg = runAccuracy >= 90 ? '#EAF3DE' : runAccuracy >= 70 ? '#FAEEDA' : '#FAECE7';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--color-bg)', padding: '24px 20px' }}>
      {/* Back */}
      <button onClick={() => setCurrentStep('scene-select')} style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', alignSelf: 'flex-start', marginBottom: 24 }}>
        <span style={{ display: 'inline-block', width: 16, height: 16, position: 'relative', flexShrink: 0 }}>
          <span style={{ position: 'absolute', top: 3, left: 2, width: 9, height: 9, borderLeft: '2px solid #1A1A1A', borderBottom: '2px solid #1A1A1A', transform: 'rotate(45deg)', display: 'block' }} />
        </span>
        <span style={{ fontSize: 12, color: '#1A1A1A' }}>Back</span>
      </button>

      {/* Title */}
      <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 22, color: '#1A1A1A', marginBottom: 2 }}>Run-through complete</div>
      <div style={{ fontSize: 13, color: '#6B6B6B', marginBottom: 24 }}>{selectedScene.title} · {selectedCharacter}</div>

      {/* Big accuracy number */}
      <div style={{ textAlign: 'center', padding: '20px 0 24px', background: '#fff', borderRadius: 12, border: '1px solid #E5E4E0', marginBottom: 16 }}>
        <div style={{ fontSize: 64, fontWeight: 600, color: accuracyColor, lineHeight: 1 }}>{runAccuracy}%</div>
        <div style={{ fontSize: 14, color: '#6B6B6B', marginTop: 6 }}>Overall accuracy this run</div>
        {delta !== null && (
          <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 4, background: accuracyBg, color: accuracyColor, display: 'inline-block', marginTop: 10 }}>
            {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}% vs personal best
          </span>
        )}
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { label: 'Perfect lines', value: perfectLines, color: '#3B6D11', bg: '#EAF3DE' },
          { label: 'Stumbles', value: stumbleLines.length, color: '#993C1D', bg: '#FAECE7' },
          { label: 'Best time', value: progress?.bestTime ? `${Math.floor(progress.bestTime / 60)}:${String(progress.bestTime % 60).padStart(2, '0')}` : '—', color: '#1A1A1A', bg: '#F7F6F3' },
        ].map(stat => (
          <div key={stat.label} style={{ flex: 1, background: stat.bg, borderRadius: 10, padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: stat.color, fontWeight: 500, marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Stumble lines detail */}
      {stumbleLines.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 17, color: '#1A1A1A', marginBottom: 12 }}>Where you stumbled</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stumbleLines.map(line => {
              const acc = getLastAccuracy(line.id) ?? 0;
              const said = runAttempts[line.id]?.said;
              return (
                <div key={line.id} style={{ background: '#fff', border: '1px solid #E5E4E0', borderRadius: 12, padding: '14px 16px' }}>
                  {/* Accuracy badge + line number */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 10, color: '#9B9B9B' }}>Line {line.lineNumber}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: acc < 50 ? '#FCEBEB' : '#FAECE7', color: acc < 50 ? '#A32D2D' : '#993C1D' }}>
                      {acc}%
                    </span>
                  </div>
                  {/* Expected */}
                  <div style={{ marginBottom: said ? 8 : 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 500, color: '#9B9B9B', marginBottom: 3 }}>EXPECTED</div>
                    <div style={{ fontSize: 13, color: '#1A1A1A', lineHeight: 1.6 }}>"{line.text}"</div>
                  </div>
                  {/* What was said */}
                  {said && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #F0EFEB' }}>
                      <div style={{ fontSize: 10, fontWeight: 500, color: '#9B9B9B', marginBottom: 3 }}>YOU SAID</div>
                      <div style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.6, fontStyle: 'italic' }}>"{said}"</div>
                    </div>
                  )}
                  {/* Practice button */}
                  <button
                    onClick={() => { setCurrentLineIndex(selectedScene.lines.indexOf(line)); setCurrentStep('rehearsal'); }}
                    style={{ marginTop: 12, width: '100%', fontSize: 12, fontWeight: 500, padding: '8px 0', borderRadius: 8, border: '1px solid #E5E4E0', background: 'transparent', cursor: 'pointer', color: '#1A1A1A' }}
                  >
                    Practice this line
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All-perfect message */}
      {stumbleLines.length === 0 && myLines.length > 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#3B6D11', fontSize: 14, fontWeight: 500 }}>
          ✦ Perfect run! Every line nailed.
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 12 }}>
        <button onClick={handleShare} style={{ flex: 1, padding: '12px 0', border: '1px solid #E5E4E0', borderRadius: 8, background: 'transparent', fontWeight: 500, fontSize: 14, cursor: 'pointer' }}>
          {copied ? 'Copied!' : 'Share script'}
        </button>
        <button onClick={() => { setCurrentLineIndex(0); setCurrentStep('rehearsal'); }} style={{ flex: 1, padding: '12px 0', border: 'none', borderRadius: 8, background: '#1A1A1A', color: '#fff', fontWeight: 500, fontSize: 14, cursor: 'pointer' }}>
          Run again
        </button>
      </div>
    </div>
  );
}
