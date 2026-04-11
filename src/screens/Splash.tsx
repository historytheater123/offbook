import { useScript } from '../contexts/ScriptContext';

export function Splash() {
  const { setCurrentStep } = useScript();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '0 24px', background: 'var(--color-bg)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 48 }}>
        <div style={{ fontSize: 48, fontFamily: "'Source Serif 4', serif", fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-1px', display: 'flex', alignItems: 'center' }}>
          <span style={{ display: 'inline-block', transform: 'rotate(-8deg)', transformOrigin: 'center' }}>O</span>
          <span>ffBook</span>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 15, textAlign: 'center', margin: 0 }}>
          Your scene partner, always ready.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
        <button
          onClick={() => setCurrentStep('upload')}
          style={{
            background: 'var(--color-btn-primary)', color: '#fff',
            borderRadius: 8, padding: '13px 12px', fontWeight: 500,
            border: 'none', fontSize: 15, width: '100%',
          }}
        >
          Get started
        </button>
        <button
          onClick={() => setCurrentStep('upload')}
          style={{
            background: 'transparent', color: 'var(--color-text-primary)',
            borderRadius: 8, padding: '13px 12px', fontWeight: 500,
            border: '1px solid var(--color-border)', fontSize: 15, width: '100%',
          }}
        >
          I have a script
        </button>
      </div>
    </div>
  );
}
