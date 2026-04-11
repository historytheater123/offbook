import { useState } from 'react';
import { useScript } from '../contexts/ScriptContext';
import { copyShareUrl } from '../lib/shareUrl';

export function RunStats() {
  const { selectedScene, selectedCharacter, parsedScript, getSceneProgress, setCurrentStep, setCurrentLineIndex } = useScript();
  const [copied, setCopied] = useState(false);

  if (!selectedScene || !selectedCharacter || !parsedScript) return null;

  const progress = getSceneProgress(selectedScene.id);
  const accuracy = progress?.bestAccuracy || 0;
  const runCount = progress?.runCount || 0;
  const lineAccuracies = progress?.lineAccuracies || {};

  const myLines = selectedScene.lines.filter(l => l.character === selectedCharacter);
  const perfect = myLines.filter(l => { const a = lineAccuracies[l.id] || []; return a.length > 0 && a[a.length - 1] === 100; }).length;
  const needsWork = myLines.filter(l => { const a = lineAccuracies[l.id] || []; return a.length > 0 && a[a.length - 1] < 70; });

  // Calculate improvement delta
  const allRuns = myLines.flatMap(l => lineAccuracies[l.id] || []);
  const prevRuns = allRuns.slice(0, -myLines.length);
  const prevAccuracy = prevRuns.length > 0 ? Math.round(prevRuns.reduce((a, b) => a + b, 0) / prevRuns.length) : null;
  const delta = prevAccuracy !== null ? accuracy - prevAccuracy : null;

  // suppress unused warning
  void runCount;

  const handleShare = async () => {
    const ok = await copyShareUrl(parsedScript.rawText);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--color-bg)', padding: '24px 20px' }}>
      <button onClick={() => setCurrentStep('scene-select')} style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', alignSelf: 'flex-start', marginBottom: 20 }}>
        <span style={{ display: 'inline-block', width: 16, height: 16, position: 'relative', flexShrink: 0 }}>
          <span style={{ position: 'absolute', top: 3, left: 2, width: 9, height: 9, borderLeft: '2px solid #1A1A1A', borderBottom: '2px solid #1A1A1A', transform: 'rotate(45deg)', display: 'block' }} />
        </span>
        <span style={{ fontSize: 12, color: '#1A1A1A' }}>Back</span>
      </button>

      <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 20, color: '#1A1A1A', marginBottom: 4 }}>Run-through complete</div>
      <div style={{ fontSize: 13, color: '#6B6B6B', marginBottom: 16 }}>{selectedScene.title}</div>

      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <div style={{ fontSize: 48, fontWeight: 500, color: '#1A1A1A' }}>{accuracy}%</div>
        <div style={{ fontSize: 13, color: '#6B6B6B' }}>Overall accuracy</div>
        {delta !== null && (
          <span style={{ fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 4, background: '#FAEEDA', color: '#854F0B', display: 'inline-block', marginTop: 8 }}>
            {delta >= 0 ? '+' : ''}{delta}% from last time
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Perfect lines', value: perfect, color: '#3B6D11' },
          { label: 'Needs work', value: needsWork.length, color: '#993C1D' },
          { label: 'Time', value: `${Math.floor((progress?.bestTime || 0) / 60)}:${String((progress?.bestTime || 0) % 60).padStart(2, '0')}`, color: '#1A1A1A' },
        ].map(stat => (
          <div key={stat.label} style={{ flex: 1, background: '#F7F6F3', borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#9B9B9B' }}>{stat.label}</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: stat.color, marginTop: 4 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {needsWork.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 500, fontSize: 16, color: '#1A1A1A', marginBottom: 10 }}>Trouble spots</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {needsWork.map(line => {
              const accs = lineAccuracies[line.id] || [];
              const last = accs[accs.length - 1] || 0;
              return (
                <div key={line.id} style={{ background: '#fff', border: '1px solid #E5E4E0', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 16, fontWeight: 500, color: '#993C1D', flexShrink: 0 }}>{last}%</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: '#9B9B9B' }}>Line {line.lineNumber}</div>
                    <div style={{ fontSize: 12, color: '#1A1A1A', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{line.text}"</div>
                  </div>
                  <button
                    onClick={() => { setCurrentLineIndex(selectedScene.lines.indexOf(line)); setCurrentStep('rehearsal'); }}
                    style={{ fontSize: 11, fontWeight: 500, padding: '6px 12px', borderRadius: 6, border: '1px solid #E5E4E0', background: 'transparent', cursor: 'pointer', flexShrink: 0 }}
                  >
                    Practice
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
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
