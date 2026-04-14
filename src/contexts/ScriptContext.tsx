import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import type { ParsedScript, Scene, AppStep, RehearsalMode, PersistedData } from '../types';
import { parseScript, hashScript } from '../lib/scriptParser';
import { decodeScriptFromUrl } from '../lib/shareUrl';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'offbook_data';

function loadPersistedData(): PersistedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as PersistedData;
      if (!data.settings) {
        data.settings = { enableTTS: true, autoAdvance: true, loopTroubleLines: false, defaultMode: 'prompter' };
      } else {
        data.settings.enableTTS = true;
      }
      return data;
    }
  } catch { /* ignore */ }
  return {
    scripts: {},
    settings: { enableTTS: true, autoAdvance: true, loopTroubleLines: false, defaultMode: 'prompter' },
  };
}

function savePersistedData(data: PersistedData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export interface RunAttempt { said: string; accuracy: number; }

interface ScriptContextValue {
  // Auth
  user: User | null;
  authMode: 'signup' | 'login';
  setUser: (u: User | null) => void;
  setAuthMode: (m: 'signup' | 'login') => void;
  // Navigation
  currentStep: AppStep;
  setCurrentStep: (step: AppStep) => void;
  // Script
  parsedScript: ParsedScript | null;
  selectedCharacter: string | null;
  selectedScene: Scene | null;
  currentLineIndex: number;
  // Rehearsal settings
  rehearsalMode: RehearsalMode;
  enableTTS: boolean;
  autoAdvance: boolean;
  loopTroubleLines: boolean;
  elevenLabsKey: string;
  elevenLabsVoice: string;
  // Persisted
  persistedData: PersistedData;
  runAttempts: Record<string, RunAttempt>;
  // Actions
  uploadScript: (rawText: string, parsed?: ParsedScript) => void;
  selectCharacter: (name: string) => void;
  selectScene: (scene: Scene) => void;
  setRehearsalMode: (mode: RehearsalMode) => void;
  setCurrentLineIndex: (index: number) => void;
  setEnableTTS: (v: boolean) => void;
  setAutoAdvance: (v: boolean) => void;
  setLoopTroubleLines: (v: boolean) => void;
  setElevenLabsKey: (key: string) => void;
  setElevenLabsVoice: (voiceId: string) => void;
  saveLineAccuracy: (lineId: string, accuracy: number) => void;
  saveRunStats: (accuracy: number, time: number) => void;
  getSceneProgress: (sceneId: string) => PersistedData['scripts'][string]['scenes'][string] | null;
  updateRunAttempt: (lineId: string, said: string, accuracy: number) => void;
  clearRunAttempts: () => void;
}

const ScriptContext = createContext<ScriptContextValue | null>(null);

export function ScriptProvider({ children }: { children: React.ReactNode }) {
  const [persisted, setPersisted] = useState<PersistedData>(loadPersistedData);
  const [user, setUserState] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [currentStep, setCurrentStep] = useState<AppStep>('landing');
  const [parsedScript, setParsedScript] = useState<ParsedScript | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [rehearsalMode, setRehearsalMode] = useState<RehearsalMode>(
    (persisted.settings.defaultMode as RehearsalMode) || 'prompter'
  );
  const [enableTTS, setEnableTTSState] = useState(persisted.settings.enableTTS);
  const [autoAdvance, setAutoAdvanceState] = useState(persisted.settings.autoAdvance);
  const [loopTroubleLines, setLoopTroubleLinesState] = useState(persisted.settings.loopTroubleLines);
  const [elevenLabsKey, setElevenLabsKeyState] = useState(persisted.settings.elevenLabsKey || '');
  const [elevenLabsVoice, setElevenLabsVoiceState] = useState(persisted.settings.elevenLabsVoice || '');
  const [runAttempts, setRunAttempts] = useState<Record<string, RunAttempt>>({});

  // Check for existing session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserState(session.user);
        setCurrentStep('dashboard');
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserState(session.user);
      } else {
        setUserState(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Handle deep-linked scripts
  useEffect(() => {
    const decoded = decodeScriptFromUrl();
    if (decoded) {
      try {
        const parsed = parseScript(decoded);
        setParsedScript(parsed);
        setCurrentStep('character-select');
        history.replaceState(null, '', window.location.pathname);
      } catch { /* ignore */ }
    }
  }, []);

  const setUser = useCallback((u: User | null) => setUserState(u), []);

  const savePersisted = useCallback((data: PersistedData) => {
    setPersisted(data);
    savePersistedData(data);
  }, []);

  const uploadScript = useCallback((rawText: string, alreadyParsed?: ParsedScript) => {
    const parsed = alreadyParsed || parseScript(rawText);
    setParsedScript(parsed);

    // Save to Supabase in the background (fire and forget)
    if (user) {
      supabase.from('scripts').insert({
        user_id: user.id,
        title: parsed.title || 'Untitled',
        raw_text: rawText,
      }).then(({ error }) => { if (error) console.warn('Script save error:', error.message); });
    }
    setCurrentStep('character-select');
  }, [user]);

  const selectCharacter = useCallback((name: string) => {
    setSelectedCharacter(name);
    setCurrentStep('scene-select');
  }, []);

  const selectScene = useCallback((scene: Scene) => {
    setSelectedScene(scene);
    setCurrentLineIndex(0);
    setCurrentStep('rehearsal');
  }, []);

  const setEnableTTS = useCallback((v: boolean) => {
    setEnableTTSState(v);
    savePersisted({ ...persisted, settings: { ...persisted.settings, enableTTS: v } });
  }, [persisted, savePersisted]);

  const setAutoAdvance = useCallback((v: boolean) => {
    setAutoAdvanceState(v);
    savePersisted({ ...persisted, settings: { ...persisted.settings, autoAdvance: v } });
  }, [persisted, savePersisted]);

  const setLoopTroubleLines = useCallback((v: boolean) => {
    setLoopTroubleLinesState(v);
    savePersisted({ ...persisted, settings: { ...persisted.settings, loopTroubleLines: v } });
  }, [persisted, savePersisted]);

  const setElevenLabsKey = useCallback((key: string) => {
    setElevenLabsKeyState(key);
    savePersisted({ ...persisted, settings: { ...persisted.settings, elevenLabsKey: key } });
  }, [persisted, savePersisted]);

  const setElevenLabsVoice = useCallback((voiceId: string) => {
    setElevenLabsVoiceState(voiceId);
    savePersisted({ ...persisted, settings: { ...persisted.settings, elevenLabsVoice: voiceId } });
  }, [persisted, savePersisted]);

  const getScriptKey = useCallback(() => {
    if (!parsedScript) return null;
    return hashScript(parsedScript.rawText);
  }, [parsedScript]);

  const saveLineAccuracy = useCallback((lineId: string, accuracy: number) => {
    if (!parsedScript || !selectedScene) return;
    const key = hashScript(parsedScript.rawText);
    const updated = { ...persisted };
    if (!updated.scripts[key]) {
      updated.scripts[key] = { title: parsedScript.title, rawText: parsedScript.rawText, lastCharacter: selectedCharacter || '', lastScene: selectedScene.id, scenes: {} };
    }
    if (!updated.scripts[key].scenes[selectedScene.id]) {
      updated.scripts[key].scenes[selectedScene.id] = { bestAccuracy: 0, runCount: 0, lastRunDate: '', lineAccuracies: {}, bestTime: 0 };
    }
    const sceneData = updated.scripts[key].scenes[selectedScene.id];
    if (!sceneData.lineAccuracies[lineId]) sceneData.lineAccuracies[lineId] = [];
    sceneData.lineAccuracies[lineId].push(accuracy);
    savePersisted(updated);
  }, [parsedScript, selectedScene, selectedCharacter, persisted, savePersisted]);

  const saveRunStats = useCallback((accuracy: number, time: number) => {
    if (!parsedScript || !selectedScene) return;
    const key = hashScript(parsedScript.rawText);
    const updated = { ...persisted };
    if (!updated.scripts[key]) {
      updated.scripts[key] = { title: parsedScript.title, rawText: parsedScript.rawText, lastCharacter: selectedCharacter || '', lastScene: selectedScene.id, scenes: {} };
    }
    if (!updated.scripts[key].scenes[selectedScene.id]) {
      updated.scripts[key].scenes[selectedScene.id] = { bestAccuracy: 0, runCount: 0, lastRunDate: '', lineAccuracies: {}, bestTime: 0 };
    }
    const sceneData = updated.scripts[key].scenes[selectedScene.id];
    sceneData.runCount++;
    sceneData.lastRunDate = new Date().toISOString();
    if (accuracy > sceneData.bestAccuracy) sceneData.bestAccuracy = accuracy;
    if (time > 0 && (sceneData.bestTime === 0 || time < sceneData.bestTime)) sceneData.bestTime = time;
    savePersisted(updated);

    // Save to Supabase in the background
    if (user) {
      supabase.from('run_attempts').insert({
        user_id: user.id,
        scene_name: selectedScene.title,
        character_name: selectedCharacter || '',
        accuracy,
        duration_seconds: time,
      }).then(({ error }) => { if (error) console.warn('Run save error:', error.message); });
    }
  }, [parsedScript, selectedScene, selectedCharacter, persisted, savePersisted, user]);

  const getSceneProgress = useCallback((sceneId: string) => {
    const key = getScriptKey();
    if (!key) return null;
    return persisted.scripts[key]?.scenes[sceneId] || null;
  }, [persisted, getScriptKey]);

  const updateRunAttempt = useCallback((lineId: string, said: string, accuracy: number) => {
    setRunAttempts(prev => ({ ...prev, [lineId]: { said, accuracy } }));
  }, []);

  const clearRunAttempts = useCallback(() => setRunAttempts({}), []);

  return (
    <ScriptContext.Provider value={{
      user, authMode, setUser, setAuthMode,
      currentStep, setCurrentStep,
      parsedScript, selectedCharacter, selectedScene, currentLineIndex,
      rehearsalMode, enableTTS, autoAdvance, loopTroubleLines, elevenLabsKey, elevenLabsVoice,
      persistedData: persisted, runAttempts,
      uploadScript, selectCharacter, selectScene,
      setRehearsalMode, setCurrentLineIndex,
      setEnableTTS, setAutoAdvance, setLoopTroubleLines,
      setElevenLabsKey, setElevenLabsVoice,
      saveLineAccuracy, saveRunStats, getSceneProgress,
      updateRunAttempt, clearRunAttempts,
    }}>
      {children}
    </ScriptContext.Provider>
  );
}

export function useScript() {
  const ctx = useContext(ScriptContext);
  if (!ctx) throw new Error('useScript must be used within ScriptProvider');
  return ctx;
}
