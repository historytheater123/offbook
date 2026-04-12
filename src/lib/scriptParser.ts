import type { ParsedScript, Character, Scene, ScriptLine } from '../types';

const AVATAR_COLORS = [
  '#E8D5C4', '#C4D5E8', '#C4E8D5', '#E8C4D5',
  '#D5C4E8', '#E8E8C4', '#C4E8E8', '#E8D5D5',
];

export function hashScript(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function isSceneBreak(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed === '---') return true;
  if (/^ACT\s+/i.test(trimmed)) return true;
  if (/^SCENE\s+/i.test(trimmed)) return true;
  return false;
}

function getSceneTitle(line: string): string {
  const trimmed = line.trim();
  if (trimmed === '---') return '';
  return trimmed;
}

function cleanText(text: string): string {
  return text
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .trim();
}

export function parseScript(rawText: string): ParsedScript {
  const lines = rawText.split('\n');
  const scriptLines: ScriptLine[] = [];
  const characterMap: Map<string, number> = new Map();
  const scenes: Scene[] = [];

  let currentSceneTitle = 'Scene 1';
  let currentSceneLines: ScriptLine[] = [];
  let sceneIndex = 0;
  let lineNumber = 0;

  const flushScene = () => {
    if (currentSceneLines.length > 0) {
      const sceneId = `scene-${sceneIndex}`;
      const chars = [...new Set(currentSceneLines.map(l => l.character))];
      scenes.push({
        id: sceneId,
        title: currentSceneTitle || `Scene ${sceneIndex + 1}`,
        characters: chars,
        lines: currentSceneLines,
        lineCount: currentSceneLines.length,
      });
      sceneIndex++;
      currentSceneLines = [];
    }
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    if (isSceneBreak(trimmed)) {
      flushScene();
      currentSceneTitle = getSceneTitle(trimmed) || `Scene ${sceneIndex + 1}`;
      continue;
    }

    const match = trimmed.match(/^([A-Za-z][A-Za-z0-9 _'-]*):\s*(.+)/);
    if (!match) continue;

    const character = match[1].trim().toUpperCase();
    const rawDialogue = match[2];
    const text = cleanText(rawDialogue);

    if (!text) continue;

    lineNumber++;

    const sceneId = `scene-${sceneIndex}`;
    const lineObj: ScriptLine = {
      id: `line-${lineNumber}`,
      character,
      text,
      sceneId,
      lineNumber,
    };

    currentSceneLines.push(lineObj);
    scriptLines.push(lineObj);
    characterMap.set(character, (characterMap.get(character) || 0) + 1);
  }

  flushScene();

  if (scenes.length === 0 && scriptLines.length > 0) {
    scenes.push({
      id: 'scene-0',
      title: 'Full Script',
      characters: [...characterMap.keys()],
      lines: scriptLines,
      lineCount: scriptLines.length,
    });
    scriptLines.forEach(l => { l.sceneId = 'scene-0'; });
  }

  const colorKeys = [...characterMap.keys()];
  const characters: Character[] = colorKeys.map((name, i) => ({
    name,
    lineCount: characterMap.get(name) || 0,
    color: AVATAR_COLORS[i % AVATAR_COLORS.length],
  }));

  const title = rawText.split('\n').find(l => {
    const t = l.trim();
    return t && !t.match(/^[A-Z][A-Z0-9 _'-]*:/) && !isSceneBreak(t);
  })?.trim() || 'Untitled Script';

  return {
    title,
    rawText,
    characters,
    scenes,
    lines: scriptLines,
  };
}

export function validateScript(rawText: string): { valid: boolean; error?: string; lineCount?: number; characterCount?: number } {
  if (!rawText.trim()) return { valid: false, error: 'Script is empty' };

  const lines = rawText.split('\n');
  let lineCount = 0;
  const chars = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^([A-Za-z][A-Za-z0-9 _'-]*):\s*(.+)/);
    if (match) {
      const text = cleanText(match[2]);
      if (text) {
        lineCount++;
        chars.add(match[1].trim());
      }
    }
  }

  if (lineCount === 0) return { valid: false, error: 'No valid lines found. Use FORMAT: CHARACTER: dialogue' };
  if (lineCount > 500) return { valid: false, error: `Script is too long (${lineCount} lines). Maximum is 500 lines.` };

  return { valid: true, lineCount, characterCount: chars.size };
}
