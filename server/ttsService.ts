import { GoogleGenAI } from '@google/genai';
import { pcmToWavBuffer } from '../src/utils/wavUtils';

export interface GenerateVoiceRequest {
  script: string;
  voice?: string;
  language?: string;
  emotion?: string;
  pace?: number;
  pitch?: string;
}

export interface GenerateVoiceResponse {
  success: boolean;
  audioBase64?: string;
  mimeType?: string;
  sampleRate?: number;
  modelUsed?: string;
  durationSec?: number;
  error?: string;
  retryAfterSec?: number;
}

// Ordered list of Gemini TTS models (primary proven fast TTS endpoint)
const PRIMARY_TTS_MODELS = [
  'gemini-2.5-flash-preview-tts',
  'gemini-2.5-pro-preview-tts',
  'gemini-3.8-flash-tts',
  'gemini-3.8-flash-lite-tts',
];

/**
 * Valid Gemini TTS Voice Names:
 * Puck, Charon, Kore, Fenrir, Aoede, Zephyr, Vindemiatrix, Leda, Sulafat, Algieba, Achird, Iapetus
 */
const VALID_VOICES = new Set([
  'Puck',
  'Charon',
  'Kore',
  'Fenrir',
  'Aoede',
  'Zephyr',
  'Vindemiatrix',
  'Leda',
  'Sulafat',
  'Algieba',
  'Achird',
  'Iapetus',
]);

export const EMOTION_INSTRUCTIONS: Record<string, string> = {
  friendly: 'Speak in a warm, friendly, approachable, and bright conversational explainer voice with clear pacing and a welcoming tone.',
  cheerful: 'Speak in a warm, cheerful, lively, and bright voice with a clear smile in the tone.',
  serious: 'Speak with serious authority, deep gravitas, and formal documentary precision.',
  mysterious: 'Speak in an atmospheric, mysterious, quiet, and suspenseful tone with soft undertones and subtle tension.',
  curious: 'Speak with genuine curiosity, wonder, and an inquisitive, questioning cadence.',
  playful: 'Speak in a playful, lively, witty, and teasing tone with upbeat inflection.',
  suspicious: 'Speak in a guarded, suspicious, wary, and cautious tone, keeping the voice low and tense.',
  uneasy: 'Speak in an uneasy, chilling, and unsettling tone with a sense of creeping dread.',
  tense: 'Speak in a tense, gripping, urgent, and suspenseful cadence with sharp anticipation.',
  fearful: 'Speak in a fearful, breathless, and urgent tone.',
  excited: 'Speak with energetic enthusiasm, high excitement, and vibrant projection.',
  hopeful: 'Speak with an uplifting, hopeful, inspiring, and optimistic cadence.',
  empathetic: 'Speak in a compassionate, empathetic, gentle, and understanding tone.',
  somber: 'Speak in a solemn, sorrowful, quiet, and reflective tone with slow pacing.',
  sad: 'Speak in a somber, melancholic, quiet, and emotionally reflective voice.',
  angry: 'Speak with firm intensity, sharp emphasis, and controlled urgency.',
  whispering: 'Speak in a close-mic, intimate, gentle whisper.',
  dramatic: 'Speak with intense theatricality, dramatic pauses, and cinematic presence.',
  inspirational: 'Speak with uplifting confidence, motivating passion, and warm conviction.',
  calm: 'Speak in a calm, soothing, gentle, and relaxing tempo.',
  default: 'Speak in a natural, clear, engaging conversational delivery with balanced articulation.',
};

// In-memory cache for synthesized voice clips
const voiceCache = new Map<string, GenerateVoiceResponse>();

function getCacheKey(
  script: string,
  voice: string,
  language: string,
  emotion: string,
  pace = 1.0,
  pitch = 'Default'
): string {
  const roundedPace = Number(pace || 1.0).toFixed(2);
  const normalizedPitch = String(pitch || 'Default').toLowerCase();
  return `${voice.toLowerCase()}_${language.toLowerCase()}_${emotion.toLowerCase()}_${roundedPace}_${normalizedPitch}_${script.trim()}`;
}

/**
 * Prepares the script and delivery conditioning for Gemini TTS.
 * Preserves the authentic native voice characteristics (e.g. Charon's signature warm,
 * deep baritone matching the reference voice file) without intrusive prompt-stuffing.
 */
function prepareScriptForTTS(
  script: string,
  emotion = 'Default',
  language = 'en',
  voice = 'Charon',
  pace = 1.0,
  pitch = 'Default'
): string {
  let processed = script.replace(/\[\s*PAUSE\s*(\d+(?:\.\d+)?)\s*(?:s|sec|seconds)?\s*\]/gi, (_, sec) => {
    const s = parseFloat(sec);
    if (s >= 3.0) return ' ... ... ... ';
    if (s >= 1.5) return ' ... ... ';
    if (s >= 0.5) return ' ... ';
    return ', ';
  });

  processed = processed.replace(/\[[^\]]*\]/g, ' ').replace(/[ \t]{2,}/g, ' ').trim();

  const isCharon = voice.toLowerCase() === 'charon';
  const langKey = language.toLowerCase();
  const emotionKey = emotion.toLowerCase().replace(/[^a-z]/g, '');
  const isDefaultEmotion = !emotionKey || emotionKey === 'default' || emotionKey === 'neutral';
  const isEnglish = !langKey || langKey === 'en' || langKey === 'english';

  // If this is default English narration (especially Charon), return pure text to preserve
  // 100% of the prebuilt voice's native tone and timbre matching the reference audio.
  if (isDefaultEmotion && isEnglish && Math.abs(pace - 1.0) < 0.05 && (!pitch || pitch === 'Default')) {
    return processed;
  }

  const promptParts: string[] = [];

  // Language & Accent Directives only when non-standard English is chosen
  if (langKey === 'kanglish' || langKey === 'kn-en') {
    promptParts.push('Language: Kanglish (natural conversational blend of Kannada and English). Speak with fluent Indian English cadence and smooth colloquial code-switching.');
  } else if (langKey === 'hinglish' || langKey === 'hi-en') {
    promptParts.push('Language: Hinglish (natural conversational blend of Hindi and English). Speak with relatable Indian cadence and authentic code-switching.');
  } else if (langKey === 'tamil_en' || langKey === 'ta-en') {
    promptParts.push('Language: Tanglish (Tamil and English blend). Speak with natural South Indian cadence and engaging Tamil-English code-switching.');
  } else if (langKey === 'telugu_en' || langKey === 'te-en') {
    promptParts.push('Language: Tenglish (Telugu and English blend). Speak with energetic Indian cadence and Telugu-English code-switching.');
  } else if (langKey === 'malayalam_en' || langKey === 'ml-en') {
    promptParts.push('Language: Manglish (Malayalam and English blend). Speak with natural Kerala cadence and smooth Malayalam-English code-switching.');
  } else if (langKey === 'en-in' || langKey === 'en_in' || langKey === 'indian_en') {
    promptParts.push('Language & Accent: Indian English. Speak with a natural, authentic Indian English accent, clear pronunciation, and conversational rhythm.');
    if (isCharon) {
      promptParts.push('Persona: Warm, authoritative Indian male explainer and tutorial narrator.');
    } else if (voice.toLowerCase() === 'iapetus') {
      promptParts.push('Persona: Friendly, grounded Indian male conversationalist with everyday relatable cadence.');
    }
  } else if (langKey === 'kn' || langKey === 'kannada') {
    promptParts.push('Language: Kannada. Speak with clear, authentic native Kannada articulation.');
  }

  // Emotion / Tone instruction
  if (!isDefaultEmotion) {
    const matchedKey = Object.keys(EMOTION_INSTRUCTIONS).find((k) => emotionKey.includes(k));
    if (matchedKey && EMOTION_INSTRUCTIONS[matchedKey]) {
      promptParts.push(`Tone: ${EMOTION_INSTRUCTIONS[matchedKey]}`);
    }
  } else if (isCharon) {
    // Keep Charon grounded in its signature calm, warm baritone
    promptParts.push('Tone: Calm, warm, and natural conversational storytelling with clear, grounded cadence.');
  }

  // Pace directive
  if (pace && Math.abs(pace - 1.0) >= 0.04) {
    if (pace < 0.95) {
      promptParts.push(`Pacing: Speak in a measured, deliberate tempo taking steady pauses.`);
    } else if (pace > 1.05) {
      promptParts.push(`Pacing: Speak with brisk, upbeat energy and quick conversational flow.`);
    }
  }

  // Pitch directive
  if (pitch && pitch !== 'Default') {
    promptParts.push(`Pitch: Deliver in a ${pitch.toLowerCase()} vocal register.`);
  }

  if (promptParts.length === 0) {
    return processed;
  }

  return `[Style Directives: ${promptParts.join(' ')}]\n\n${processed}`;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function synthesizeVoice(
  reqBody: GenerateVoiceRequest,
  apiKey?: string
): Promise<GenerateVoiceResponse> {
  const geminiApiKey = apiKey || process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return {
      success: false,
      error: 'GEMINI_API_KEY is not configured on the server.',
    };
  }

  let {
    script,
    voice = 'Charon',
    emotion = 'Default',
    language = 'en',
    pace = 1.0,
    pitch = 'Default',
  } = reqBody;

  if (!script || typeof script !== 'string' || script.trim().length === 0) {
    return {
      success: false,
      error: 'Script text is required and cannot be empty.',
    };
  }

  // Normalize voice name (handles font visual similarity where 'l' (lowercase L) is typed for 'I' (capital i))
  const cleanVoiceInput = voice.trim().toLowerCase();
  const targetVoice = cleanVoiceInput === 'lapetus' ? 'iapetus' : cleanVoiceInput;
  const matchedVoice = Array.from(VALID_VOICES).find(
    (v) => v.toLowerCase() === targetVoice
  ) || 'Charon';

  // Check cache first (includes exact pace and pitch to prevent stale reuse)
  const cacheKey = getCacheKey(script, matchedVoice, language, emotion, pace, pitch);
  if (voiceCache.has(cacheKey)) {
    return { ...voiceCache.get(cacheKey)! };
  }

  const ttsText = prepareScriptForTTS(script, emotion, language, matchedVoice, pace, pitch);
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  let lastError: unknown = null;
  let retryAfterSeconds: number | undefined;

  for (let attempt = 0; attempt < 2; attempt++) {
    for (const model of PRIMARY_TTS_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: ttsText,
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: matchedVoice,
                },
              },
            },
            seed: 42,
          },
        });

        const candidate = response.candidates?.[0];
        const part = candidate?.content?.parts?.[0];

        if (!part || !part.inlineData || !part.inlineData.data) {
          throw new Error(`Model ${model} returned empty audio output.`);
        }

        const rawBase64 = part.inlineData.data;
        const rawMimeType = part.inlineData.mimeType || 'audio/l16; rate=24000; channels=1';

        let sampleRate = 24000;
        const rateMatch = rawMimeType.match(/rate=(\d+)/i);
        if (rateMatch && rateMatch[1]) {
          sampleRate = parseInt(rateMatch[1], 10);
        }

        const pcmBytes = Buffer.from(rawBase64, 'base64');
        let finalWavBuffer: Buffer;

        if (
          pcmBytes.length >= 12 &&
          pcmBytes.toString('utf8', 0, 4) === 'RIFF' &&
          pcmBytes.toString('utf8', 8, 12) === 'WAVE'
        ) {
          finalWavBuffer = pcmBytes;
        } else {
          finalWavBuffer = pcmToWavBuffer(pcmBytes, sampleRate, 1, 16);
        }

        const pcmDataLength = finalWavBuffer.length - 44;
        const durationSec = Math.max(0.1, pcmDataLength / (sampleRate * 2));

        const result: GenerateVoiceResponse = {
          success: true,
          audioBase64: finalWavBuffer.toString('base64'),
          mimeType: 'audio/wav',
          sampleRate,
          modelUsed: model,
          durationSec: Number(durationSec.toFixed(2)),
        };

        if (voiceCache.size > 80) {
          const firstKey = voiceCache.keys().next().value;
          if (firstKey) voiceCache.delete(firstKey);
        }
        voiceCache.set(cacheKey, result);

        return result;
      } catch (err: unknown) {
        lastError = err;
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
          const retryMatch = errMsg.match(/retry(?:Delay| in):?\s*(\d+(?:\.\d+)?)/i);
          if (retryMatch && retryMatch[1]) {
            retryAfterSeconds = Math.ceil(parseFloat(retryMatch[1]));
          }
        }
        continue;
      }
    }

    if (attempt === 0 && retryAfterSeconds && retryAfterSeconds <= 8) {
      await sleep(retryAfterSeconds * 1000 + 500);
      retryAfterSeconds = undefined;
    } else {
      break;
    }
  }

  const detailedMsg = lastError instanceof Error ? lastError.message : String(lastError);
  let userFriendlyError = 'Voice synthesis failed. Please try again.';

  if (detailedMsg.includes('429') || detailedMsg.includes('RESOURCE_EXHAUSTED')) {
    userFriendlyError = `Gemini TTS free-tier quota reached on the shared key${
      retryAfterSeconds ? ` (~${retryAfterSeconds}s)` : ''
    }. Please add your own free Gemini API key using the 'Gemini API Key' button in the header for unlimited instant generations.`;
  } else if (detailedMsg) {
    userFriendlyError = detailedMsg;
  }

  return {
    success: false,
    error: userFriendlyError,
    retryAfterSec: retryAfterSeconds || 25,
  };
}
