import { useScript } from '../contexts/ScriptContext';

export function Landing() {
  const { setCurrentStep, setAuthMode } = useScript();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#FAFAF8' }}>

      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 28px 32px' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 700, fontSize: 42, color: '#1A1A1A', lineHeight: 1.1, marginBottom: 16 }}>
            <span style={{ display: 'inline-block', transform: 'rotate(-8deg)', transformOrigin: 'center' }}>O</span>ffBook
          </div>
          <div style={{ fontSize: 18, color: '#4A4A4A', lineHeight: 1.5, fontFamily: "'Source Serif 4', serif", fontStyle: 'italic' }}>
            Learn your lines.<br />Own the stage.
          </div>
        </div>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 48 }}>
          {[
            { icon: '🎭', text: 'Upload any script and rehearse your role' },
            { icon: '🔊', text: 'AI voices read the other characters\' lines' },
            { icon: '🎯', text: 'Track accuracy and spot where you stumble' },
          ].map(f => (
            <div key={f.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>{f.icon}</span>
              <span style={{ fontSize: 14, color: '#4A4A4A', lineHeight: 1.5 }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => { setAuthMode('signup'); setCurrentStep('auth'); }}
            style={{ width: '100%', padding: '14px 0', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
          >
            Get started — it's free
          </button>
          <button
            onClick={() => { setAuthMode('login'); setCurrentStep('auth'); }}
            style={{ width: '100%', padding: '14px 0', background: 'transparent', color: '#1A1A1A', border: '1px solid #D0CFC9', borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
          >
            Log in
          </button>
        </div>
      </div>

      <div style={{ padding: '16px 28px', textAlign: 'center', fontSize: 11, color: '#B0AFA9' }}>
        Your progress saves automatically to your account
      </div>
    </div>
  );
}
