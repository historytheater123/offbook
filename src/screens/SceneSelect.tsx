import { useScript } from '../contexts/ScriptContext';
import type { Scene } from '../types/index';

export function SceneSelect() {
  const { parsedScript, selectedCharacter, setCurrentStep, selectScene, getSceneProgress } = useScript();

  if (!parsedScript || !selectedCharacter) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '24px 20px 20px', gap: 20 }}>
        <button onClick={() => setCurrentStep('character-select')} style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', alignSelf: 'flex-start' }}>
          <span style={{ display: 'inline-block', width: 16, height: 16, position: 'relative', flexShrink: 0 }}>
            <span style={{ position: 'absolute', top: 3, left: 2, width: 9, height: 9, borderLeft: '2px solid #1A1A1A', borderBottom: '2px solid #1A1A1A', transform: 'rotate(45deg)', display: 'block' }} />
          </span>
          <span style={{ fontSize: 12, color: '#1A1A1A' }}>Back</span>
        </button>

        <div>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 20, color: '#1A1A1A', marginBottom: 4 }}>Pick a scene</div>
          <div style={{ fontSize: 13, color: '#6B6B6B' }}>Playing as <strong style={{ color: '#1A1A1A' }}>{selectedCharacter}</strong></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {parsedScript.scenes.map((scene: Scene) => {
            const progress = getSceneProgress(scene.id);
            const myLineCount = scene.lines.filter(l => l.character === selectedCharacter).length;
            const hasMyLines = myLineCount > 0;
            return (
              <button
                key={scene.id}
                onClick={() => hasMyLines && selectScene(scene)}
                style={{ background: hasMyLines ? '#fff' : '#FAFAF8', border: `1px solid ${hasMyLines ? '#E5E4E0' : '#EBEBEB'}`, borderRadius: 10, padding: '14px 16px', textAlign: 'left', cursor: hasMyLines ? 'pointer' : 'default', opacity: hasMyLines ? 1 : 0.6 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A' }}>{scene.title}</div>
                    <div style={{ fontSize: 11, color: '#9B9B9B', marginTop: 2 }}>{scene.characters.join(', ')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 8, flexDirection: 'column', alignItems: 'flex-end' }}>
                    {hasMyLines ? (
                      <span style={{ fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 4, background: '#EEEDFE', color: '#534AB7' }}>
                        {myLineCount} your lines
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 4, background: '#F7F6F3', color: '#9B9B9B' }}>
                        Not in scene
                      </span>
                    )}
                  </div>
                </div>
                {hasMyLines && (
                  <>
                    <div style={{ height: 4, background: '#E5E4E0', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progress?.bestAccuracy || 0}%`, background: '#1A1A1A', borderRadius: 2, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#9B9B9B', marginTop: 4 }}>
                      {progress && progress.runCount > 0 ? `Best: ${progress.bestAccuracy}% — ${progress.runCount} run-through${progress.runCount !== 1 ? 's' : ''}` : 'Not yet practiced'}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <button
            onClick={() => {
              const first = parsedScript.scenes.find(s => s.lines.some(l => l.character === selectedCharacter));
              if (first) selectScene(first);
            }}
            style={{ background: '#1A1A1A', color: '#fff', borderRadius: 8, padding: '12px 0', fontWeight: 500, border: 'none', fontSize: 14, width: '100%', cursor: 'pointer' }}
          >
            Start rehearsal
          </button>
        </div>
      </div>
    </div>
  );
}
