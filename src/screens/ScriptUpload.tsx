import { useState, useEffect } from 'react';
import { useScript } from '../contexts/ScriptContext';
import { validateScript } from '../lib/scriptParser';
import { scriptLibrary } from '../lib/scriptLibrary';

export function ScriptUpload() {
  const { uploadScript, parsedScript } = useScript();
  const [text, setText] = useState(parsedScript?.rawText || '');
  const [validation, setValidation] = useState<{ valid: boolean; error?: string; lineCount?: number; characterCount?: number } | null>(null);

  useEffect(() => {
    if (text.trim().length > 20) {
      const result = validateScript(text);
      setValidation(result);
    } else {
      setValidation(null);
    }
  }, [text]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '32px 20px 16px', gap: 20 }}>
        <div style={{ fontSize: 24, fontFamily: "'Source Serif 4', serif", fontWeight: 600 }}>
          Add your script
        </div>

        <div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`Paste your script here.\n\nFormat:\nCHARACTER: Their dialogue here\nOTHER CHARACTER: Their line here\n\n---\n\nNew scenes separated by --- or ACT/SCENE headers.`}
            style={{
              width: '100%', minHeight: 220,
              border: '1px solid var(--color-border)',
              borderRadius: 8, padding: '10px 12px',
              fontSize: 13, background: '#fff',
              color: 'var(--color-text-primary)',
              resize: 'vertical', lineHeight: 1.6,
            }}
          />
          {validation && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {validation.valid ? (
                <>
                  <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 4, background: 'var(--tag-success-bg)', color: 'var(--tag-success-text)' }}>
                    {validation.characterCount} characters
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 4, background: 'var(--tag-info-bg)', color: 'var(--tag-info-text)' }}>
                    {validation.lineCount} lines
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 4, background: 'var(--tag-expert-bg)', color: 'var(--tag-expert-text)' }}>
                  {validation.error}
                </span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => validation?.valid && uploadScript(text)}
          disabled={!validation?.valid}
          style={{
            background: validation?.valid ? 'var(--color-btn-primary)' : '#E5E4E0',
            color: validation?.valid ? '#fff' : 'var(--color-text-muted)',
            borderRadius: 8, padding: '13px 12px', fontWeight: 500,
            border: 'none', fontSize: 15, width: '100%',
          }}
        >
          Continue
        </button>

        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Or try an example
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {scriptLibrary.map(script => (
              <button
                key={script.id}
                onClick={() => setText(script.rawText)}
                style={{
                  background: '#fff', border: '1px solid var(--color-border)',
                  borderRadius: 10, padding: '14px 16px', textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--color-text-primary)' }}>{script.title}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{script.description}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{script.characterCount} characters</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
