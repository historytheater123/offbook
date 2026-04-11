import { useScript } from '../contexts/ScriptContext';

export function Splash() {
  const { setCurrentStep } = useScript();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '0 24px', background: 'var(--color-bg)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 48 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M8 6h16v4H8z" fill="#fff" opacity="0.3"/>
            <path d="M8 12h16v2H8z" fill="#fff" opacity="0.5"/>
            <path d="M8 16h12v2H8z" fill="#fff" opacity="0.7"/>
            <path d="M8 20h14v2H8z" fill="#fff"/>
            <path d="M8 24h10v2H8z" fill="#fff" opacity="0.5"/>
            <circle cx="24" cy="24" r="5" fill="#FAEEDA" stroke="#fff" strokeWidth="1.5"/>
            <path d="M22.5 23.5l2 1.5-2 1.5" stroke="#854F0B" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 28, color: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ display: 'inline-block', transform: 'rotate(-8deg)', transformOrigin: 'center', marginRight: 1 }}>O</span>ffBook
          </div>
          <div style={{ fontSize: 13, color: '#9B9B9B', textAlign: 'center', marginTop: 4 }}>Your scene partner, always ready</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
        <button onClick={() => setCurrentStep('upload')} style={{ background: '#1A1A1A', color: '#fff', borderRadius: 8, padding: '12px 0', fontWeight: 500, border: 'none', fontSize: 14, width: '100%', cursor: 'pointer' }}>
          Get started
        </button>
        <button onClick={() => setCurrentStep('upload')} style={{ background: 'transparent', color: '#1A1A1A', borderRadius: 8, padding: '12px 0', fontWeight: 500, border: '1px solid #E5E4E0', fontSize: 14, width: '100%', cursor: 'pointer' }}>
          I have a script
        </button>
      </div>
    </div>
  );
}
