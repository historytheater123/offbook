import { useScript } from '../contexts/ScriptContext';
import type { RehearsalMode } from '../types';

export type Tab = 'script' | 'modes' | 'settings';

interface ModesSettingsProps {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
}

const MODES: { id: RehearsalMode; label: string; description: string; difficulty: string; diffBg: string; diffText: string }[] = [
  { id: 'prompter', label: 'Prompter', description: 'Full script visible with context', difficulty: 'Easy', diffBg: 'var(--tag-easy-bg)', diffText: 'var(--tag-easy-text)' },
  { id: 'highlight', label: 'Highlight', description: 'Only key words shown for your lines', difficulty: 'Medium', diffBg: 'var(--tag-medium-bg)', diffText: 'var(--tag-medium-text)' },
  { id: 'hidden-lines', label: 'Hidden Lines', description: 'Your lines are blurred', difficulty: 'Hard', diffBg: 'var(--tag-hard-bg)', diffText: 'var(--tag-hard-text)' },
  { id: 'cue-only', label: 'Cue Only', description: 'Only the previous line shown', difficulty: 'Hard', diffBg: 'var(--tag-hard-bg)', diffText: 'var(--tag-hard-text)' },
  { id: 'full-blackout', label: 'Full Blackout', description: 'No script shown at all', difficulty: 'Expert', diffBg: 'var(--tag-expert-bg)', diffText: 'var(--tag-expert-text)' },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 26, borderRadius: 13, border: 'none',
        background: value ? '#1A1A1A' : '#E5E4E0',
        position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: value ? 21 : 3,
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', display: 'block',
      }} />
    </button>
  );
}

export function ModesSettings({ tab, onTabChange }: ModesSettingsProps) {
  const { rehearsalMode, setRehearsalMode, enableTTS, setEnableTTS, autoAdvance, setAutoAdvance, loopTroubleLines, setLoopTroubleLines } = useScript();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
        {tab === 'modes' && (
          <>
            <div style={{ fontSize: 18, fontFamily: "'Source Serif 4', serif", fontWeight: 600, marginBottom: 16 }}>Rehearsal Modes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {MODES.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => { setRehearsalMode(mode.id); onTabChange('script'); }}
                  style={{
                    background: '#fff',
                    border: rehearsalMode === mode.id ? '2px solid #1A1A1A' : '1px solid var(--color-border)',
                    borderRadius: 10, padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
                    boxShadow: rehearsalMode === mode.id ? '0 0 0 1px #1A1A1A' : 'none',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{mode.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{mode.description}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 4, background: mode.diffBg, color: mode.diffText, flexShrink: 0 }}>
                    {mode.difficulty}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
        {tab === 'settings' && (
          <>
            <div style={{ fontSize: 18, fontFamily: "'Source Serif 4', serif", fontWeight: 600, marginBottom: 16 }}>Settings</div>
            <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
              {[
                { label: 'Read other lines aloud', desc: 'Uses text-to-speech for other characters', value: enableTTS, onChange: setEnableTTS },
                { label: 'Auto-advance on 80%+', desc: 'Moves to next line automatically on high accuracy', value: autoAdvance, onChange: setAutoAdvance },
                { label: 'Loop trouble lines', desc: 'Repeats lines under 70% accuracy 3 times', value: loopTroubleLines, onChange: setLoopTroubleLines },
              ].map((setting, i, arr) => (
                <div key={setting.label} style={{ padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{setting.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 1 }}>{setting.desc}</div>
                  </div>
                  <Toggle value={setting.value} onChange={setting.onChange} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', borderTop: '1px solid var(--color-border)', background: '#fff' }}>
        {(['script', 'modes', 'settings'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => onTabChange(t)}
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
