import { useEffect, useState } from 'react';
import { supabase, type DbRunAttempt, type DbScript } from '../lib/supabase';
import { useScript } from '../contexts/ScriptContext';
import { parseScript } from '../lib/scriptParser';

type Stats = {
  totalRuns: number;
  avgAccuracy: number;
  scriptsCount: number;
  bestAccuracy: number;
};

export function Dashboard() {
  const { user, setCurrentStep, uploadScript, setUser } = useScript();
  const [scripts, setScripts] = useState<DbScript[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const email = user?.email || '';
  const displayName = email.split('@')[0];

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      try {
        const [{ data: scriptRows }, { data: runRows }] = await Promise.all([
          supabase.from('scripts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('run_attempts').select('*').eq('user_id', user.id),
        ]);
        const runs = (runRows || []) as DbRunAttempt[];
        setScripts((scriptRows || []) as DbScript[]);
        const totalRuns = runs.length;
        const avgAccuracy = totalRuns > 0
          ? Math.round(runs.reduce((s, r) => s + r.accuracy, 0) / totalRuns)
          : 0;
        const bestAccuracy = totalRuns > 0 ? Math.max(...runs.map(r => r.accuracy)) : 0;
        const scriptsCount = (scriptRows || []).length;
        setStats({ totalRuns, avgAccuracy, scriptsCount, bestAccuracy });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentStep('landing');
  };

  const handleContinueScript = (script: DbScript) => {
    const parsed = parseScript(script.raw_text);
    uploadScript(script.raw_text, parsed);
  };

  const accuracyColor = (a: number) => a >= 90 ? '#3B6D11' : a >= 70 ? '#854F0B' : '#993C1D';
  const accuracyBg = (a: number) => a >= 90 ? '#EAF3DE' : a >= 70 ? '#FAEEDA' : '#FAECE7';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#FAFAF8' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #E5E4E0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 700, fontSize: 20, color: '#1A1A1A' }}>
            <span style={{ display: 'inline-block', transform: 'rotate(-8deg)', transformOrigin: 'center' }}>O</span>ffBook
          </div>
          <div style={{ fontSize: 12, color: '#9B9B9B', marginTop: 1 }}>Hey, {displayName} 👋</div>
        </div>
        <button
          onClick={handleSignOut}
          style={{ fontSize: 12, color: '#9B9B9B', background: 'none', border: '1px solid #E5E4E0', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}
        >
          Sign out
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

        {/* New script CTA */}
        <button
          onClick={() => setCurrentStep('upload')}
          style={{ width: '100%', padding: '16px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24, fontFamily: "'DM Sans', sans-serif" }}
        >
          <span style={{ fontSize: 18 }}>+</span> New rehearsal
        </button>

        {/* Stats */}
        {!loading && stats && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Your stats</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Total runs', value: stats.totalRuns },
                { label: 'Scripts saved', value: stats.scriptsCount },
                { label: 'Avg accuracy', value: stats.avgAccuracy > 0 ? `${stats.avgAccuracy}%` : '—', color: stats.avgAccuracy > 0 ? accuracyColor(stats.avgAccuracy) : undefined, bg: stats.avgAccuracy > 0 ? accuracyBg(stats.avgAccuracy) : undefined },
                { label: 'Best run', value: stats.bestAccuracy > 0 ? `${stats.bestAccuracy}%` : '—', color: stats.bestAccuracy > 0 ? accuracyColor(stats.bestAccuracy) : undefined, bg: stats.bestAccuracy > 0 ? accuracyBg(stats.bestAccuracy) : undefined },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg || '#fff', border: '1px solid #E5E4E0', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color || '#1A1A1A', fontFamily: "'Source Serif 4', serif" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: s.color || '#9B9B9B', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: '#9B9B9B' }}>Loading…</div>
        )}

        {/* Scripts */}
        {!loading && scripts.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Your scripts</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {scripts.map(script => (
                <button
                  key={script.id}
                  onClick={() => handleContinueScript(script)}
                  style={{ background: '#fff', border: '1px solid #E5E4E0', borderRadius: 10, padding: '14px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {script.title || 'Untitled script'}
                    </div>
                    <div style={{ fontSize: 11, color: '#9B9B9B', marginTop: 2 }}>
                      {new Date(script.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: '#534AB7', fontWeight: 500, flexShrink: 0 }}>Rehearse →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && scripts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 20px', background: '#fff', borderRadius: 12, border: '1px dashed #D0CFC9' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🎭</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A', marginBottom: 6 }}>No scripts yet</div>
            <div style={{ fontSize: 12, color: '#9B9B9B' }}>Tap "New rehearsal" to add your first script</div>
          </div>
        )}
      </div>
    </div>
  );
}
