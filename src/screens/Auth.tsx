import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useScript } from '../contexts/ScriptContext';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export function Auth() {
  const { authMode, setAuthMode, setCurrentStep, setUser } = useScript();
  const isSignUp = authMode === 'signup';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
    // On success, browser redirects to Google then back — onAuthStateChange in
    // ScriptContext picks up the session automatically and routes to dashboard.
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        if (data.user && !data.session) {
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
        <div style={{ fontSize: 13, color: '#6B6B6B', marginBottom: 28 }}>
          {isSignUp ? 'Start rehearsing in seconds' : 'Log in to your OffBook account'}
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          style={{ width: '100%', padding: '12px 0', background: '#fff', color: '#1A1A1A', border: '1px solid #D0CFC9', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: googleLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}
        >
          {googleLoading ? '…' : <><GoogleIcon /> Continue with Google</>}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#E5E4E0' }} />
          <span style={{ fontSize: 12, color: '#B0AFA9' }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#E5E4E0' }} />
        </div>

        {/* Email / password form */}
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
