import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useScript } from '../contexts/ScriptContext';

export function Auth() {
  const { authMode, setAuthMode, setCurrentStep, setUser } = useScript();
  const isSignUp = authMode === 'signup';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        if (data.user && !data.session) {
          // Email confirmation required
          setConfirm(true);
        } else if (data.user) {
          setUser(data.user);
          setCurrentStep('dashboard');
        }
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        if (data.user) {
          setUser(data.user);
          setCurrentStep('dashboard');
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (confirm) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#FAFAF8', padding: '48px 28px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 16 }}>
          <div style={{ fontSize: 48 }}>📬</div>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 22, color: '#1A1A1A' }}>Check your email</div>
          <div style={{ fontSize: 14, color: '#6B6B6B', lineHeight: 1.6, maxWidth: 280 }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back and log in.
          </div>
          <button
            onClick={() => { setAuthMode('login'); setConfirm(false); }}
            style={{ marginTop: 16, padding: '12px 28px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
          >
            Go to log in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#FAFAF8' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '48px 28px 32px' }}>

        {/* Back */}
        <button
          onClick={() => setCurrentStep('landing')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#6B6B6B', fontSize: 13, marginBottom: 40, alignSelf: 'flex-start' }}
        >
          <span style={{ display: 'inline-block', width: 16, height: 16, position: 'relative' }}>
            <span style={{ position: 'absolute', top: 3, left: 2, width: 9, height: 9, borderLeft: '2px solid #6B6B6B', borderBottom: '2px solid #6B6B6B', transform: 'rotate(45deg)', display: 'block' }} />
          </span>
          Back
        </button>

        <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 26, color: '#1A1A1A', marginBottom: 6 }}>
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </div>
        <div style={{ fontSize: 13, color: '#6B6B6B', marginBottom: 36 }}>
          {isSignUp ? 'Start rehearsing in seconds' : 'Log in to your OffBook account'}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#4A4A4A', display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              style={{ width: '100%', border: '1px solid #E5E4E0', borderRadius: 8, padding: '11px 12px', fontSize: 14, outline: 'none', fontFamily: "'DM Sans', sans-serif", background: '#fff', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#4A4A4A', display: 'block', marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={isSignUp ? 'At least 6 characters' : '••••••••'}
              required
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              style={{ width: '100%', border: '1px solid #E5E4E0', borderRadius: 8, padding: '11px 12px', fontSize: 14, outline: 'none', fontFamily: "'DM Sans', sans-serif", background: '#fff', boxSizing: 'border-box' }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: '#993C1D', background: '#FAECE7', borderRadius: 8, padding: '8px 12px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{ padding: '13px 0', background: loading || !email || !password ? '#E5E4E0' : '#1A1A1A', color: loading || !email || !password ? '#9B9B9B' : '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: loading || !email || !password ? 'default' : 'pointer', marginTop: 4 }}
          >
            {loading ? '…' : isSignUp ? 'Create account' : 'Log in'}
          </button>
        </form>

        <div style={{ marginTop: 28, textAlign: 'center', fontSize: 13, color: '#6B6B6B' }}>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button
            onClick={() => { setAuthMode(isSignUp ? 'login' : 'signup'); setError(''); }}
            style={{ background: 'none', border: 'none', color: '#534AB7', fontWeight: 500, cursor: 'pointer', fontSize: 13, padding: 0 }}
          >
            {isSignUp ? 'Log in' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  );
}
