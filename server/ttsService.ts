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
  'gemini-3.8-flash-lite-tts',
  'gemini-3.8-flash-tts',
  'gemini-2.5-flash-preview-tts',
  'gemini-2.5-pro-preview-tts',
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

/**
 * Resolves BCP-47 language tag for Gemini TTS speechConfig.
 * Passing explicit languageCode (e.g. 'en-IN') ensures authentic regional
 * phonetics, cadence, and pronunciation rather than default US English.
 */
export function getBcp47LanguageCode(language?: string): string {
  if (!language) return 'en-IN';
  const norm = language.toLowerCase().trim();
  if (
    norm === 'en-in' ||
    norm === 'en_in' ||
    norm === 'indian_en' ||
    norm.includes('india') ||
    norm.includes('indian') ||
    norm === 'indian_universal' ||
    norm === 'universal_indian' ||
    norm === 'multilingual_indian'
  ) {
    return 'en-IN';
  }
  if (norm === 'kanglish' || norm === 'kn-en') {
    return 'en-IN';
  }
  if (norm === 'hinglish' || norm === 'hi-en') {
    return 'en-IN';
  }
  if (norm === 'tamil_en' || norm === 'ta-en') {
    return 'en-IN';
  }
  if (norm === 'telugu_en' || norm === 'te-en') {
    return 'en-IN';
  }
  if (norm === 'malayalam_en' || norm === 'ml-en' || norm.includes('manglish')) {
    return 'en-IN';
  }
  if (norm === 'kn' || norm === 'kannada') {
    return 'kn-IN';
  }
  if (norm === 'hi' || norm === 'hindi') {
    return 'hi-IN';
  }
  if (norm === 'ta' || norm === 'tamil') {
    return 'ta-IN';
  }
  if (norm === 'te' || norm === 'telugu') {
    return 'te-IN';
  }
  if (norm === 'ml' || norm === 'malayalam') {
    return 'ml-IN';
  }
  if (norm === 'en' || norm === 'en-us' || norm === 'english' || norm.includes('us')) {
    return 'en-US';
  }
  if (norm === 'en-gb' || norm.includes('uk') || norm.includes('british')) {
    return 'en-GB';
  }
  return 'en-IN';
}

// In-memory cache for synthesized voice clips
const voiceCache = new Map<string, GenerateVoiceResponse>();

function getCacheKey(
  script: string,
  voice: string,
  languageCode: string,
  emotion: string,
  pace = 1.0,
  pitch = 'Default'
): string {
  const roundedPace = Number(pace || 1.0).toFixed(2);
  const normalizedPitch = String(pitch || 'Default').toLowerCase();
  return `v5_${voice.toLowerCase()}_${languageCode.toLowerCase()}_${emotion.toLowerCase()}_${roundedPace}_${normalizedPitch}_${script.trim()}`;
}

/**
 * Prepares the script for Gemini TTS.
 * Converts [PAUSE x] timing tags into natural speech pauses (commas/ellipses)
 * and strips any bracketed annotations so the voice engine NEVER reads
 * stage directions aloud as spoken text.
 */
function prepareScriptForTTS(script: string): string {
  let processed = script.replace(/\[\s*PAUSE\s*(\d+(?:\.\d+)?)\s*(?:s|sec|seconds)?\s*\]/gi, (_, sec) => {
    const s = parseFloat(sec);
    if (s >= 3.0) return ' ... ... ... ';
    if (s >= 1.5) return ' ... ... ';
    if (s >= 0.5) return ' ... ';
    return ', ';
  });

  // Strip all bracketed tags so the TTS model treats the text strictly as verbatim transcript
  processed = processed.replace(/\[[^\]]*\]/g, ' ').replace(/[ \t]{2,}/g, ' ').trim();
  return processed;
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

  // Determine accurate BCP-47 locale (e.g. en-IN for Indian English)
  const targetLanguageCode = getBcp47LanguageCode(language);

  // Check cache first (includes language code, pace, pitch, and voice to prevent stale reuse)
  const cacheKey = getCacheKey(script, matchedVoice, targetLanguageCode, emotion, pace, pitch);
  if (voiceCache.has(cacheKey)) {
    return { ...voiceCache.get(cacheKey)! };
  }

  const ttsText = prepareScriptForTTS(script);
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
              languageCode: targetLanguageCode,
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
