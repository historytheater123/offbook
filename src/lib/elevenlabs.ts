export interface ElevenLabsVoice {
  id: string;
  name: string;
  description: string;
}

// Curated selection of free pre-made ElevenLabs voices
export const ELEVENLABS_VOICES: ElevenLabsVoice[] = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel',  description: 'American female · calm, natural' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh',    description: 'American male · deep, warm' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella',   description: 'American female · soft, expressive' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold',  description: 'American male · confident, strong' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam',    description: 'American male · authoritative' },
  { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam',     description: 'American male · raspy, dynamic' },
];

export const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel

// Persistent AudioContext — unlocked once via user gesture, usable forever after.
// iOS Safari blocks HTMLAudioElement.play() when not in a gesture frame, but
// AudioContext.createBufferSource().start() works as long as the context is running.
let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

/**
 * Call this synchronously inside a user-gesture handler (e.g. mic button tap).
 * Creates + resumes an AudioContext so all subsequent TTS playback works on iOS.
 */
export function unlockAudio(): void {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    // Play a silent 1-frame buffer — fully activates the context on iOS
    const buf = audioCtx.createBuffer(1, 1, 22050);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(audioCtx.destination);
    src.start(0);
  } catch { /* ignore */ }
}

export function cancelElevenLabs(): void {
  try { currentSource?.stop(); } catch { /* ignore */ }
  currentSource = null;
}

export async function speakWithElevenLabs(
  text: string,
  apiKey: string,
  voiceId = DEFAULT_VOICE_ID,
): Promise<void> {
  cancelElevenLabs();

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.80,
          style: 0.10,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs ${response.status}: ${await response.text()}`);
  }

  const arrayBuffer = await response.arrayBuffer();

  // --- AudioContext path (iOS-safe) ---
  if (audioCtx && audioCtx.state === 'running') {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    return new Promise((resolve) => {
      const safetyMs = Math.max(5000, text.length * 80);
      let resolved = false;
      const done = () => { if (!resolved) { resolved = true; resolve(); } };

      const src = audioCtx!.createBufferSource();
      src.buffer = audioBuffer;
      src.connect(audioCtx!.destination);
      src.onended = done;
      src.start(0);
      currentSource = src;
      setTimeout(done, safetyMs);
    });
  }

  // --- Fallback: HTMLAudioElement (desktop / Android) ---
  const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
  const audioUrl = URL.createObjectURL(blob);

  return new Promise((resolve) => {
    const audio = new Audio(audioUrl);
    let resolved = false;
    const done = () => {
      if (!resolved) {
        resolved = true;
        URL.revokeObjectURL(audioUrl);
        resolve();
      }
    };
    audio.onended = done;
    audio.onerror = done;
    audio.play().catch(done);
    setTimeout(done, Math.max(5000, text.length * 80));
  });
}
