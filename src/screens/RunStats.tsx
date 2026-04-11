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
  const perfect = myLines.filter(l => {
    const accs = lineAccuracies[l.id] || [];
    return accs.length > 0 && accs[accs.length - 1] === 100;
  }).length;
  const needsWork = myLines.filter(l => {
    const accs = lineAccuracies[l.id] || [];
    return accs.length > 0 && accs[accs.length - 1] < 70;
  });

  const handleShare = async () => {
    const ok = await copyShareUrl(parsedScript.rawText);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--color-bg)', padding: '24px 20px' }}>
      <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 4 }}>{selectedScene.title}</div>
      <div style={{ fontSize: 64, fontWeight: 700, color: '#1A1A1A', lineHeight: 1 }}>{accuracy}%</div>
      <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 24 }}>Run {runCount} complete</div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, background: 'var(--tag-success-bg)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--tag-success-text)' }}>{perfect}</div>
          <div style={{ fontSize: 12, color: 'var(--tag-success-text)', marginTop: 2 }}>Perfect</div>
        </div>
        <div style={{ flex: 1, background: 'var(--tag-expert-bg)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--tag-expert-text)' }}>{needsWork.length}</div>
          <div style={{ fontSize: 12, color: 'var(--tag-expert-text)', marginTop: 2 }}>Needs Work</div>
        </div>
      </div>

      {needsWork.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Trouble spots</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {needsWork.map(line => {
              const accs = lineAccuracies[line.id] || [];
              const last = accs[accs.length - 1] || 0;
              return (
                <div key={line.id} style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {line.text}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--tag-expert-text)', marginTop: 2 }}>{last}% accuracy</div>
                  </div>
                  <button
                    onClick={() => { setCurrentLineIndex(selectedScene.lines.indexOf(line)); setCurrentStep('rehearsal'); }}
                    style={{ fontSize: 12, fontWeight: 500, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', flexShrink: 0 }}
                  >
                    Practice
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto' }}>
        <button
          onClick={handleShare}
          style={{ padding: '13px', border: '1px solid var(--color-border)', borderRadius: 8, background: 'transparent', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}
        >
          {copied ? 'Copied!' : 'Share script'}
        </button>
        <button
          onClick={() => { setCurrentLineIndex(0); setCurrentStep('rehearsal'); }}
          style={{ padding: '13px', border: 'none', borderRadius: 8, background: '#1A1A1A', color: '#fff', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}
        >
          Run again
        </button>
        <button
          onClick={() => setCurrentStep('scene-select')}
          style={{ padding: '13px', border: 'none', borderRadius: 8, background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 14, cursor: 'pointer' }}
        >
          Choose different scene
        </button>
      </div>
    </div>
  );
}
