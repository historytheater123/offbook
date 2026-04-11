import { useState } from 'react';
import { useScript } from '../contexts/ScriptContext';

export function CharacterSelect() {
  const { parsedScript, setCurrentStep, selectCharacter } = useScript();
  const [selected, setSelected] = useState<string | null>(null);

  if (!parsedScript) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '24px 20px 20px', gap: 20 }}>
        <button onClick={() => setCurrentStep('upload')} style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', alignSelf: 'flex-start' }}>
          <span style={{ display: 'inline-block', width: 16, height: 16, position: 'relative', flexShrink: 0 }}>
            <span style={{ position: 'absolute', top: 3, left: 2, width: 9, height: 9, borderLeft: '2px solid #1A1A1A', borderBottom: '2px solid #1A1A1A', transform: 'rotate(45deg)', display: 'block' }} />
          </span>
          <span style={{ fontSize: 12, color: '#1A1A1A' }}>Back</span>
        </button>

        <div>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 20, color: '#1A1A1A', marginBottom: 4 }}>Choose your character</div>
          <div style={{ fontSize: 13, color: '#6B6B6B' }}>{parsedScript.title}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {parsedScript.characters.map(char => (
            <button
              key={char.name}
              onClick={() => setSelected(char.name)}
              style={{
                background: '#fff',
                border: selected === char.name ? '1px solid #1A1A1A' : '1px solid #E5E4E0',
                boxShadow: selected === char.name ? '0 0 0 1px #1A1A1A' : 'none',
                borderRadius: 10, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                textAlign: 'left', cursor: 'pointer',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: selected === char.name ? '#1A1A1A' : char.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 14, color: selected === char.name ? '#fff' : '#1A1A1A', flexShrink: 0 }}>
                {char.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A' }}>{char.name}</div>
                <div style={{ fontSize: 11, color: '#9B9B9B', marginTop: 1 }}>{char.lineCount} lines</div>
              </div>
              {selected === char.name ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" fill="#1A1A1A"/>
                  <path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" fill="none" stroke="#E5E4E0" strokeWidth="1.5"/>
                </svg>
              )}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <button
            onClick={() => selected && selectCharacter(selected)}
            disabled={!selected}
            style={{ background: selected ? '#1A1A1A' : '#E5E4E0', color: selected ? '#fff' : '#9B9B9B', borderRadius: 8, padding: '12px 0', fontWeight: 500, border: 'none', fontSize: 14, width: '100%', cursor: selected ? 'pointer' : 'default' }}
          >
            {selected ? `Continue as ${selected}` : 'Select a character'}
          </button>
        </div>
      </div>
    </div>
  );
}
