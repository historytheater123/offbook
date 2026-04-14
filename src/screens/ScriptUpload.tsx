import { useState, useEffect } from 'react';
import { useScript } from '../contexts/ScriptContext';
import { validateScript } from '../lib/scriptParser';
import { scriptLibrary } from '../lib/scriptLibrary';

const AVATAR_COLORS = ['#EEEDFE', '#FAECE7', '#FAEEDA', '#EAF3DE'];
const AVATAR_TEXT = ['#534AB7', '#993C1D', '#854F0B', '#3B6D11'];

function getInitials(title: string) {
  return title.split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('');
}

export function ScriptUpload() {
  const { uploadScript, parsedScript, setCurrentStep } = useScript();
  const [text, setText] = useState(parsedScript?.rawText || '');
  const [validation, setValidation] = useState<{ valid: boolean; error?: string; lineCount?: number; characterCount?: number } | null>(null);
  const [exampleSelected, setExampleSelected] = useState(false);

  useEffect(() => {
    if (text.trim().length > 20) {
      setValidation(validateScript(text));
    } else {
      setValidation(null);
    }
  }, [text]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '24px 20px 20px', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 18, color: '#1A1A1A', display: 'flex', alignItems: 'center' }}>
            <span style={{ display: 'inline-block', transform: 'rotate(-8deg)', transformOrigin: 'center', marginRight: 1 }}>O</span>ffBook
          </div>
          <button onClick={() => setCurrentStep('dashboard')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12, color: '#9B9B9B', display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Dashboard
          </button>
        </div>

        <div>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 20, color: '#1A1A1A', marginBottom: 4 }}>Add your script</div>
          <div style={{ fontSize: 13, color: '#6B6B6B' }}>Paste your script below in CHARACTER: dialogue format</div>
        </div>

        <div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`CHARACTER: Their dialogue here\nOTHER CHARACTER: Their line here\n\n---\n\nNew scenes separated by --- or ACT/SCENE headers.`}
            style={{ width: '100%', minHeight: 160, border: '1px solid #E5E4E0', borderRadius: 8, padding: '10px 12px', fontSize: 12, background: '#fff', color: text ? '#1A1A1A' : '#9B9B9B', resize: 'vertical', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}
          />
          {validation && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {validation.valid ? (
                <>
                  <span style={{ fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 4, background: '#E1F5EE', color: '#0F6E56' }}>{validation.characterCount} characters found</span>
                  <span style={{ fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 4, background: '#FAEEDA', color: '#854F0B' }}>{validation.lineCount} lines</span>
                </>
              ) : (
                <span style={{ fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 4, background: '#FCEBEB', color: '#A32D2D' }}>{validation.error}</span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => validation?.valid && uploadScript(text)}
          disabled={!validation?.valid}
          style={{ background: validation?.valid ? '#1A1A1A' : '#E5E4E0', color: validation?.valid ? '#fff' : '#9B9B9B', borderRadius: 8, padding: '12px 0', fontWeight: 500, border: 'none', fontSize: 14, width: '100%', cursor: validation?.valid ? 'pointer' : 'default' }}
        >
          Continue
        </button>

        <hr style={{ border: 'none', borderTop: '1px solid #E5E4E0', margin: '4px 0' }} />

        {exampleSelected ? (
          <button
            onClick={() => { setText(''); setExampleSelected(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#6B6B6B', fontSize: 13 }}
          >
            <span style={{ display: 'inline-block', width: 16, height: 16, position: 'relative', flexShrink: 0 }}>
              <span style={{ position: 'absolute', top: 3, left: 2, width: 9, height: 9, borderLeft: '2px solid #6B6B6B', borderBottom: '2px solid #6B6B6B', transform: 'rotate(45deg)', display: 'block' }} />
            </span>
            Back to examples
          </button>
        ) : (
          <div>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 500, fontSize: 16, color: '#1A1A1A', marginBottom: 10 }}>Or try an example</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {scriptLibrary.map((script, i) => (
                <button
                  key={script.id}
                  onClick={() => { setText(script.rawText); setExampleSelected(true); }}
                  style={{ background: '#fff', border: '1px solid #E5E4E0', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer' }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: AVATAR_TEXT[i % AVATAR_TEXT.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
                    {getInitials(script.title)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A' }}>{script.title}</div>
                    <div style={{ fontSize: 11, color: '#9B9B9B', marginTop: 1 }}>{script.author} — {script.characterCount} characters</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
