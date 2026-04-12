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

let currentAudio: HTMLAudioElement | null = null;

export function cancelElevenLabs() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
}

export async function speakWithElevenLabs(
  text: string,
  apiKey: string,
  voiceId = DEFAULT_VOICE_ID,
): Promise<void> {
  // Cancel any ongoing playback
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

  const blob = await response.blob();
  const audioUrl = URL.createObjectURL(blob);

  return new Promise((resolve) => {
    const audio = new Audio(audioUrl);
    currentAudio = audio;
    audio.onended = () => { URL.revokeObjectURL(audioUrl); currentAudio = null; resolve(); };
    audio.onerror = () => { URL.revokeObjectURL(audioUrl); currentAudio = null; resolve(); };
    audio.play().catch(() => resolve());
  });
}
