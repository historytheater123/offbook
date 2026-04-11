import { useState } from 'react';
import { useScript } from '../contexts/ScriptContext';

export function CharacterSelect() {
  const { parsedScript, setCurrentStep, selectCharacter } = useScript();
  const [selected, setSelected] = useState<string | null>(null);

  if (!parsedScript) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '24px 20px 16px', gap: 20 }}>
        <button onClick={() => setCurrentStep('upload')} style={{ background: 'none', border: 'none', padding: '8px 0', color: 'var(--color-text-secondary)', fontSize: 14, textAlign: 'left' }}>
          ← Back
        </button>
        <div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>{parsedScript.title}</div>
          <div style={{ fontSize: 22, fontFamily: "'Source Serif 4', serif", fontWeight: 600 }}>Choose your character</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {parsedScript.characters.map(char => (
            <button
              key={char.name}
              onClick={() => setSelected(char.name)}
              style={{
                background: '#fff',
                border: selected === char.name ? '2px solid #1A1A1A' : '1px solid var(--color-border)',
                borderRadius: 10, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                textAlign: 'left', cursor: 'pointer',
                boxShadow: selected === char.name ? '0 0 0 1px #1A1A1A' : 'none',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: char.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 600, fontSize: 16, color: '#1A1A1A', flexShrink: 0,
              }}>
                {char.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 15 }}>{char.name}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 1 }}>{char.lineCount} lines</div>
              </div>
              {selected === char.name && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="10" fill="#1A1A1A"/>
                  <path d="M6 10l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <button
            onClick={() => selected && selectCharacter(selected)}
            disabled={!selected}
            style={{
              background: selected ? 'var(--color-btn-primary)' : '#E5E4E0',
              color: selected ? '#fff' : 'var(--color-text-muted)',
              borderRadius: 8, padding: '13px 12px', fontWeight: 500,
              border: 'none', fontSize: 15, width: '100%',
            }}
          >
            {selected ? `Continue as ${selected}` : 'Select a character'}
          </button>
        </div>
      </div>
    </div>
  );
}
