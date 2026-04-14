export interface Character {
  name: string;
  lineCount: number;
  color: string;
}

export interface ScriptLine {
  id: string;
  character: string;
  text: string;
  sceneId: string;
  lineNumber: number;
}

export interface Scene {
  id: string;
  title: string;
  characters: string[];
  lines: ScriptLine[];
  lineCount: number;
}

export interface ParsedScript {
  title: string;
  rawText: string;
  characters: Character[];
  scenes: Scene[];
  lines: ScriptLine[];
}

export interface LineComparison {
  accuracy: number;
  correct: string[];
  missed: string[];
  extra: string[];
  feedback: string;
}

export interface SceneProgress {
  bestAccuracy: number;
  runCount: number;
  lastRunDate: string;
  lineAccuracies: { [lineId: string]: number[] };
  bestTime: number;
}

export interface PersistedData {
  scripts: {
    [scriptHash: string]: {
      title: string;
      rawText: string;
      lastCharacter: string;
      lastScene: string;
      scenes: { [sceneId: string]: SceneProgress };
    };
  };
  settings: {
    enableTTS: boolean;
    autoAdvance: boolean;
    loopTroubleLines: boolean;
    defaultMode: string;
    elevenLabsKey?: string;
    elevenLabsVoice?: string;
  };
}

export type RehearsalMode = 'prompter' | 'highlight' | 'hidden-lines' | 'cue-only' | 'full-blackout';

export type AppStep = 'landing' | 'auth' | 'dashboard' | 'upload' | 'character-select' | 'scene-select' | 'rehearsal' | 'stats';

export interface RehearsalState {
  currentStep: AppStep;
  parsedScript: ParsedScript | null;
  selectedCharacter: string | null;
  selectedScene: Scene | null;
  currentLineIndex: number;
  rehearsalMode: RehearsalMode;
  enableTTS: boolean;
  autoAdvance: boolean;
  loopTroubleLines: boolean;
}
