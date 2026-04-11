import { useScript } from '../contexts/ScriptContext';
import type { RehearsalMode } from '../types/index';

export type Tab = 'script' | 'modes' | 'settings';

interface ModesSettingsProps {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
}

const MODES: { id: RehearsalMode; label: string; description: string; difficulty: string; diffBg: string; diffText: string }[] = [
  { id: 'prompter', label: 'Prompter', description: 'Full script visible with context', difficulty: 'Easy', diffBg: '#EAF3DE', diffText: '#3B6D11' },
  { id: 'highlight', label: 'Highlight', description: 'Only cue words shown', difficulty: 'Medium', diffBg: '#FAEEDA', diffText: '#854F0B' },
  { id: 'hidden-lines', label: 'Hidden lines', description: 'Your lines are blurred', difficulty: 'Hard', diffBg: '#FAECE7', diffText: '#993C1D' },
  { id: 'cue-only', label: 'Cue only', description: 'Only the previous line shown', difficulty: 'Hard', diffBg: '#FAECE7', diffText: '#993C1D' },
  { id: 'full-blackout', label: 'Full blackout', description: 'No script at all — pure memory', difficulty: 'Expert', diffBg: '#FCEBEB', diffText: '#A32D2D' },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{ width: 36, height: 20, borderRadius: 10, border: 'none', background: value ? '#1A1A1A' : '#E5E4E0', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}
    >
      <span style={{ position: 'absolute', top: 2, left: value ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', display: 'block' }} />
    </button>
  );
}

export function ModesSettings({ tab, onTabChange }: ModesSettingsProps) {
  const { rehearsalMode, setRehearsalMode, enableTTS, setEnableTTS, autoAdvance, setAutoAdvance, loopTroubleLines, setLoopTroubleLines } = useScript();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 20px' }}>
        <button onClick={() => onTabChange('script')} style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 20 }}>
          <span style={{ display: 'inline-block', width: 16, height: 16, position: 'relative', flexShrink: 0 }}>
            <span style={{ position: 'absolute', top: 3, left: 2, width: 9, height: 9, borderLeft: '2px solid #1A1A1A', borderBottom: '2px solid #1A1A1A', transform: 'rotate(45deg)', display: 'block' }} />
          </span>
          <span style={{ fontSize: 12, color: '#1A1A1A' }}>Back to rehearsal</span>
        </button>

        <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 20, color: '#1A1A1A', marginBottom: 4 }}>Rehearsal modes</div>
        <div style={{ fontSize: 13, color: '#6B6B6B', marginBottom: 16 }}>Choose your difficulty level</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => { setRehearsalMode(mode.id); onTabChange('script'); }}
              style={{
                background: '#fff',
                border: rehearsalMode === mode.id ? '1px solid #1A1A1A' : '1px solid #E5E4E0',
                boxShadow: rehearsalMode === mode.id ? '0 0 0 1px #1A1A1A' : 'none',
                borderRadius: 10, padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A' }}>{mode.label}</div>
                <div style={{ fontSize: 11, color: '#9B9B9B', marginTop: 2 }}>{mode.description}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 4, background: mode.diffBg, color: mode.diffText, flexShrink: 0 }}>
                {mode.difficulty}
              </span>
            </button>
          ))}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #E5E4E0', margin: '20px 0' }} />

        <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 500, fontSize: 16, color: '#1A1A1A', marginBottom: 12 }}>Settings</div>

        {[
          { label: 'Read other lines aloud', desc: 'Text-to-speech for scene partners', value: enableTTS, onChange: setEnableTTS },
          { label: 'Auto-advance on 80%+', desc: 'Skip to next line when accurate', value: autoAdvance, onChange: setAutoAdvance },
          { label: 'Loop trouble lines', desc: 'Auto-repeat lines under 70%', value: loopTroubleLines, onChange: setLoopTroubleLines },
        ].map((s, i, arr) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #E5E4E0' : 'none', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, color: '#1A1A1A' }}>{s.label}</div>
              <div style={{ fontSize: 11, color: '#9B9B9B' }}>{s.desc}</div>
            </div>
            <Toggle value={s.value} onChange={s.onChange} />
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderTop: '1px solid #E5E4E0', background: '#fff', paddingBottom: 4 }}>
        {(['script', 'modes', 'settings'] as Tab[]).map(t => (
          <button key={t} onClick={() => onTabChange(t)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 0 4px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, background: tab === t ? '#1A1A1A' : '#E5E4E0' }} />
            <span style={{ fontSize: 10, fontWeight: tab === t ? 600 : 400, color: tab === t ? '#1A1A1A' : '#9B9B9B', textTransform: 'capitalize' }}>{t}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
