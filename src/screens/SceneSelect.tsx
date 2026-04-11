import { useScript } from '../contexts/ScriptContext';
import type { Scene } from '../types';
import { ProgressBar } from '../components/ProgressBar';

export function SceneSelect() {
  const { parsedScript, selectedCharacter, setCurrentStep, selectScene, getSceneProgress } = useScript();

  if (!parsedScript || !selectedCharacter) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '24px 20px 16px', gap: 20 }}>
        <button onClick={() => setCurrentStep('character-select')} style={{ background: 'none', border: 'none', padding: '8px 0', color: 'var(--color-text-secondary)', fontSize: 14, textAlign: 'left' }}>
          ← Back
        </button>

        <div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Playing as {selectedCharacter}</div>
          <div style={{ fontSize: 22, fontFamily: "'Source Serif 4', serif", fontWeight: 600 }}>Choose a scene</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {parsedScript.scenes.map((scene: Scene) => {
            const progress = getSceneProgress(scene.id);
            const myLines = scene.lines.filter(l => l.character === selectedCharacter).length;
            return (
              <button
                key={scene.id}
                onClick={() => selectScene(scene)}
                style={{
                  background: '#fff', border: '1px solid var(--color-border)',
                  borderRadius: 10, padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 500, fontSize: 15, color: 'var(--color-text-primary)' }}>{scene.title}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  {scene.characters.join(', ')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 4, background: 'var(--tag-info-bg)', color: 'var(--tag-info-text)' }}>
                    {scene.lineCount} lines
                  </span>
                  {myLines > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 4, background: 'var(--tag-success-bg)', color: 'var(--tag-success-text)' }}>
                      {myLines} your lines
                    </span>
                  )}
                  {progress && progress.runCount > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Best: {progress.bestAccuracy}%
                    </span>
                  )}
                </div>
                {progress && progress.runCount > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <ProgressBar value={progress.bestAccuracy} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
