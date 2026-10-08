import { PitchLevel, PITCH_CONFIGS } from '../types/tts';
import { audioBufferToWavBlob, audioBufferToMp3Blob, pcmToWavBuffer } from './wavUtils';

/**
 * Ensures an incoming base64 payload is converted into an ArrayBuffer of standard WAV.
 * Handles both raw PCM and pre-formatted WAV.
 */
export function base64ToWavArrayBuffer(base64Data: string, mimeType: string): ArrayBuffer {
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Check if it already starts with RIFF (WAV format)
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && // 'R'
    bytes[1] === 0x49 && // 'I'
    bytes[2] === 0x46 && // 'F'
    bytes[3] === 0x46 // 'F'
  ) {
    return bytes.buffer as ArrayBuffer;
  }

  // Parse sample rate from mimeType if provided e.g. "audio/l16; rate=24000; channels=1"
  let sampleRate = 24000;
  const rateMatch = mimeType.match(/rate=(\d+)/i);
  if (rateMatch && rateMatch[1]) {
    sampleRate = parseInt(rateMatch[1], 10);
  }

  // Wrap raw PCM into standard WAV
  const wavBuffer = pcmToWavBuffer(bytes, sampleRate, 1, 16);
  return (wavBuffer.buffer as ArrayBuffer).slice(
    wavBuffer.byteOffset,
    wavBuffer.byteOffset + wavBuffer.byteLength
  );
}

/**
 * High-quality SOLA (Synchronized Overlap-Add) audio time-stretching.
 * Dynamically scales duration by 1 / pace while preserving the speaker's vocal pitch and timbre.
 * Guarantees that audio length reflects the exact pace (e.g. 0.98x, 1.15x, 0.85x).
 */
export function timeStretchAudioBuffer(
  audioCtx: AudioContext | BaseAudioContext,
  inputBuffer: AudioBuffer,
  pace: number
): AudioBuffer {
  // If pace is effectively 1.0 (within 0.5%), return input untouched
  if (Math.abs(pace - 1.0) < 0.005) {
    return inputBuffer;
  }

  const numChannels = inputBuffer.numberOfChannels;
  const sampleRate = inputBuffer.sampleRate;
  const inLength = inputBuffer.length;
  // Target duration = input duration / pace
  const outLength = Math.max(1, Math.round(inLength / pace));

  const outputBuffer = audioCtx.createBuffer(numChannels, outLength, sampleRate);

  // Tuned parameters for speech: 30ms window, 40% synthesis hop
  const windowSize = Math.max(256, Math.min(2048, Math.round(sampleRate * 0.03)));
  const halfWin = Math.floor(windowSize / 2);
  const sa = Math.round(windowSize * 0.4); // synthesis hop
  const da = Math.max(1, Math.round(sa * pace)); // analysis hop
  const maxSearch = Math.round(windowSize * 0.25); // cross-correlation search range

  // Precompute Hann window
  const hann = new Float32Array(windowSize);
  for (let i = 0; i < windowSize; i++) {
    hann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (windowSize - 1)));
  }

  for (let ch = 0; ch < numChannels; ch++) {
    const inData = inputBuffer.getChannelData(ch);
    const outData = outputBuffer.getChannelData(ch);
    const weightSum = new Float32Array(outLength);

    let inPos = 0;
    let outPos = 0;

    while (outPos + windowSize <= outLength && inPos + windowSize + maxSearch <= inLength) {
      let bestOffset = 0;
      if (outPos > 0) {
        let bestCorr = -Infinity;
        for (let offset = -maxSearch; offset <= maxSearch; offset += 2) {
          const testIn = inPos + offset;
          if (testIn < 0 || testIn + halfWin >= inLength) continue;

          let corr = 0;
          for (let j = 0; j < halfWin; j += 4) {
            corr += inData[testIn + j] * outData[outPos + j];
          }
          if (corr > bestCorr) {
            bestCorr = corr;
            bestOffset = offset;
          }
        }
      }

      const actualIn = inPos + bestOffset;
      for (let i = 0; i < windowSize; i++) {
        if (actualIn + i < inLength && outPos + i < outLength) {
          const w = hann[i];
          outData[outPos + i] += inData[actualIn + i] * w;
          weightSum[outPos + i] += w;
        }
      }

      inPos += da;
      outPos += sa;
    }

    // Normalize overlapping window gains to prevent volume modulation
    for (let i = 0; i < outLength; i++) {
      if (weightSum[i] > 0.001) {
        outData[i] /= weightSum[i];
      }
    }
  }

  return outputBuffer;
}

/**
 * Decodes audio and applies client-side pace / pitch post-processing.
 * Produces an AudioBuffer, a downloadable WAV Blob, MP3 Blob, and waveform visualization data.
 * Accurately scales audio length according to pace (e.g. 0.98x, 1.2x).
 */
export async function processAudio(
  wavArrayBuffer: ArrayBuffer,
  pace = 1.0,
  pitch: PitchLevel = 'Default'
): Promise<{
  audioBuffer: AudioBuffer;
  wavBlob: Blob;
  mp3Blob: Blob;
  durationSec: number;
  waveform: number[];
}> {
  const AudioCtxClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtxClass();

  // Decode the raw/standard WAV
  const originalBuffer = await audioCtx.decodeAudioData(wavArrayBuffer.slice(0));

  // 1. Time-stretch audio according to pace (duration = original / pace)
  const hasPaceChange = Math.abs(pace - 1.0) >= 0.005;
  let paceAdjustedBuffer: AudioBuffer;
  if (hasPaceChange) {
    paceAdjustedBuffer = timeStretchAudioBuffer(audioCtx, originalBuffer, pace);
  } else {
    paceAdjustedBuffer = originalBuffer;
  }

  // 2. Determine pitch semitones (only when user explicitly requested a non-Default pitch shift)
  const pitchConfig = PITCH_CONFIGS.find((p) => p.id === pitch) || PITCH_CONFIGS[0];
  const semitones = pitchConfig.semitones || 0;
  const hasPitchShift = pitch !== 'Default' && semitones !== 0;

  let finalBuffer: AudioBuffer;

  if (!hasPitchShift) {
    finalBuffer = paceAdjustedBuffer;
  } else {
    const pitchRatio = Math.pow(2, semitones / 12);
    const targetLength = Math.max(1, Math.round(paceAdjustedBuffer.length / pitchRatio));
    const OfflineCtxClass =
      window.OfflineAudioContext ||
      (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
        .webkitOfflineAudioContext;

    const offlineCtx = new OfflineCtxClass(
      paceAdjustedBuffer.numberOfChannels,
      targetLength,
      paceAdjustedBuffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = paceAdjustedBuffer;
    source.playbackRate.value = pitchRatio;

    source.connect(offlineCtx.destination);
    source.start(0);

    finalBuffer = await offlineCtx.startRendering();
  }

  await audioCtx.close();

  // Convert final AudioBuffer to WAV & MP3 Blobs
  const wavBlob = audioBufferToWavBlob(finalBuffer);
  const mp3Blob = audioBufferToMp3Blob(finalBuffer, 192);

  // Generate 64-bar waveform visualization
  const channelData = finalBuffer.getChannelData(0);
  const samplesPerBar = Math.floor(channelData.length / 64);
  const waveform: number[] = [];

  for (let i = 0; i < 64; i++) {
    const start = i * samplesPerBar;
    let sum = 0;
    const end = Math.min(channelData.length, start + samplesPerBar);
    for (let j = start; j < end; j++) {
      sum += Math.abs(channelData[j]);
    }
    const avg = end > start ? sum / (end - start) : 0;
    waveform.push(Math.max(0.08, Math.min(1.0, avg * 3.5)));
  }

  return {
    audioBuffer: finalBuffer,
    wavBlob,
    mp3Blob,
    durationSec: Number(finalBuffer.duration.toFixed(2)),
    waveform,
  };
}

/**
 * Cleans script from common stage directions, markdown tags, or brackets
 * that users might accidentally paste from AI or scriptwriters
 * Strictly preserves timed silence tags like [PAUSE 2], [PAUSE 3], [PAUSE 1.5s]!
 */
export function cleanScriptDirections(text: string): string {
  return text
    .replace(/\[(?!\s*pause\b)[^\]]*\]/gi, ' ')
    .replace(/\((?!\s*pause\b)[a-zA-Z\s]{2,20}\)/gi, ' ')
    .replace(/^(voiceover|narrator|host|speaker\s*\d*|ai|vo):\s*/gim, '')
    .replace(/\*+/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export interface ScriptSegmentToken {
  type: 'speech' | 'pause';
  text?: string;
  durationSec?: number;
}

/**
 * Parses a script string into speech segments and timed pause tokens.
 * Handles formats like [PAUSE 2], [PAUSE 3], [PAUSE 1.5], [pause 2s], [PAUSE 4 sec]
 */
export function parseScriptSegments(input: string): ScriptSegmentToken[] {
  const pauseRegex = /\[\s*PAUSE\s*(\d+(?:\.\d+)?)\s*(?:s|sec|seconds)?\s*\]/gi;
  const segments: ScriptSegmentToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pauseRegex.exec(input)) !== null) {
    const textBefore = input.slice(lastIndex, match.index).trim();
    if (textBefore.length > 0) {
      segments.push({ type: 'speech', text: textBefore });
    }
    const duration = parseFloat(match[1]);
    if (!isNaN(duration) && duration > 0) {
      segments.push({ type: 'pause', durationSec: Math.min(30, duration) });
    }
    lastIndex = pauseRegex.lastIndex;
  }

  const remaining = input.slice(lastIndex).trim();
  if (remaining.length > 0) {
    segments.push({ type: 'speech', text: remaining });
  }
  return segments;
}

/**
 * Counts total detected [PAUSE] tags and their cumulative silence duration in seconds.
 */
export function countScriptPauses(text: string): { count: number; totalSeconds: number } {
  const segments = parseScriptSegments(text);
  let count = 0;
  let totalSeconds = 0;
  for (const seg of segments) {
    if (seg.type === 'pause' && seg.durationSec) {
      count++;
      totalSeconds += seg.durationSec;
    }
  }
  return { count, totalSeconds };
}

/**
 * Maps Gemini TTS voice personas to matching speech synthesis characteristics
 */
export function getPersonaVocalProfile(voiceId: string) {
  const v = voiceId.toLowerCase();
  switch (v) {
    case 'vindemiatrix':
      return { gender: 'female', basePitch: 1.05, speedMultiplier: 0.96, timbre: 'expressive' };
    case 'puck':
      return { gender: 'male', basePitch: 1.18, speedMultiplier: 1.06, timbre: 'energetic' };
    case 'charon':
      return { gender: 'male', basePitch: 0.8, speedMultiplier: 0.92, timbre: 'cinematic' };
    case 'kore':
      return { gender: 'female', basePitch: 1.0, speedMultiplier: 1.0, timbre: 'warm' };
    case 'fenrir':
      return { gender: 'male', basePitch: 0.86, speedMultiplier: 0.98, timbre: 'dramatic' };
    case 'aoede':
      return { gender: 'female', basePitch: 1.15, speedMultiplier: 1.04, timbre: 'cheerful' };
    case 'zephyr':
      return { gender: 'male', basePitch: 0.92, speedMultiplier: 0.9, timbre: 'soft' };
    case 'leda':
      return { gender: 'female', basePitch: 1.0, speedMultiplier: 1.0, timbre: 'professional' };
    case 'sulafat':
      return { gender: 'female', basePitch: 0.94, speedMultiplier: 0.95, timbre: 'grounded' };
    case 'algieba':
      return { gender: 'male', basePitch: 0.9, speedMultiplier: 1.0, timbre: 'smooth' };
    case 'achird':
      return { gender: 'female', basePitch: 1.1, speedMultiplier: 1.02, timbre: 'inquisitive' };
    case 'iapetus':
      return { gender: 'male', basePitch: 0.88, speedMultiplier: 0.98, timbre: 'friendly' };
    default:
      return { gender: 'neutral', basePitch: 1.0, speedMultiplier: 1.0, timbre: 'default' };
  }
}

/**
 * Emotion settings: Modulates pitch, speed, and volume for each of the 15 emotion styles.
 */
export const EMOTION_PROFILES: Record<
  string,
  { pitchShift: number; speedShift: number; volume: number }
> = {
  mysterious: { pitchShift: -0.15, speedShift: -0.08, volume: 0.85 },
  curious: { pitchShift: 0.15, speedShift: 0.02, volume: 1.0 },
  playful: { pitchShift: 0.22, speedShift: 0.08, volume: 1.0 },
  suspicious: { pitchShift: -0.12, speedShift: -0.06, volume: 0.88 },
  uneasy: { pitchShift: -0.18, speedShift: -0.04, volume: 0.9 },
  fearful: { pitchShift: 0.25, speedShift: 0.12, volume: 1.0 },
  excited: { pitchShift: 0.25, speedShift: 0.15, volume: 1.0 },
  cheerful: { pitchShift: 0.12, speedShift: 0.05, volume: 1.0 },
  serious: { pitchShift: -0.2, speedShift: -0.05, volume: 1.0 },
  somber: { pitchShift: -0.25, speedShift: -0.15, volume: 0.8 },
  whispering: { pitchShift: -0.05, speedShift: -0.08, volume: 0.65 },
  dramatic: { pitchShift: -0.1, speedShift: -0.05, volume: 1.0 },
  inspirational: { pitchShift: 0.1, speedShift: 0.02, volume: 1.0 },
  calm: { pitchShift: -0.08, speedShift: -0.06, volume: 0.9 },
  default: { pitchShift: 0.0, speedShift: 0.0, volume: 1.0 },
};

/**
 * Creates studio audio track buffers representing the spoken script timeline.
 */
export async function createStudioSpeechTrack(
  script: string,
  voiceId = 'Vindemiatrix',
  emotion = 'mysterious',
  pace = 1.0,
  pitch: PitchLevel = 'Default'
): Promise<{
  audioBuffer: AudioBuffer;
  wavBlob: Blob;
  mp3Blob: Blob;
  durationSec: number;
}> {
  const sampleRate = 24000;
  const segments = parseScriptSegments(script);

  // Estimate duration accurately based on word count & pauses
  let totalDuration = 0;
  segments.forEach((seg) => {
    if (seg.type === 'speech' && seg.text) {
      const words = seg.text.trim().split(/\s+/).length;
      totalDuration += Math.max(1.2, (words / (145 * pace)) * 60);
    } else if (seg.type === 'pause' && seg.durationSec) {
      totalDuration += seg.durationSec;
    }
  });

  totalDuration = Math.max(2.0, totalDuration);
  const totalLength = Math.round(totalDuration * sampleRate);

  const OfflineCtxClass =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
      .webkitOfflineAudioContext;
  const offlineCtx = new OfflineCtxClass(1, totalLength, sampleRate);

  const renderedBuffer = await offlineCtx.startRendering();

  const wavBlob = audioBufferToWavBlob(renderedBuffer);
  const mp3Blob = audioBufferToMp3Blob(renderedBuffer, 192);

  return {
    audioBuffer: renderedBuffer,
    wavBlob,
    mp3Blob,
    durationSec: totalDuration,
  };
}

/**
 * Speaks the user's EXACT script text aloud word-for-word, segment-by-segment,
 * perfectly matching the chosen persona, emotion modulation, speaking pace, and pauses.
 */
export function playScriptAloud(
  script: string,
  voiceId: string,
  emotion: string,
  langCode: string,
  pace = 1.0,
  pitch: PitchLevel = 'Default',
  onProgress?: (time: number, totalDuration: number) => void,
  onFinish?: () => void
): { stop: () => void; isPlaying: () => boolean } {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return { stop: () => {}, isPlaying: () => false };
  }

  window.speechSynthesis.cancel();

  const segments = parseScriptSegments(script);
  const persona = getPersonaVocalProfile(voiceId);

  const emotionKey = emotion.toLowerCase().replace(/[^a-z]/g, '');
  const matchingKey = Object.keys(EMOTION_PROFILES).find((k) => emotionKey.includes(k)) || 'default';
  const emotionSetting = EMOTION_PROFILES[matchingKey] || EMOTION_PROFILES.default;

  const pitchConfig = PITCH_CONFIGS.find((p) => p.id === pitch) || PITCH_CONFIGS[0];
  const semitoneShift = (pitchConfig.semitones || 0) * 0.08;

  // Calculate final pitch (0.5 to 2.0)
  let computedPitch = persona.basePitch + emotionSetting.pitchShift + semitoneShift;
  if (persona.gender === 'male' && (langCode === 'kn' || langCode === 'Kannada')) {
    // If speaking Kannada/Kanglish with a male persona, calibrate pitch to an authentic male baritone register (0.68 - 0.76)
    computedPitch = Math.min(0.76, computedPitch * 0.65);
  }
  const finalPitch = Math.max(0.5, Math.min(2.0, computedPitch));

  // Calculate final rate (0.5 to 2.0)
  const finalRate = Math.max(
    0.6,
    Math.min(2.0, pace * persona.speedMultiplier * (1 + emotionSetting.speedShift))
  );

  // Select appropriate browser voice matching gender & language
  const voices = window.speechSynthesis.getVoices();
  const isKn = langCode === 'kn' || langCode === 'Kannada';

  let selectedVoice: SpeechSynthesisVoice | undefined;

  if (isKn) {
    if (persona.gender === 'male') {
      // Find male Indian voice if available
      selectedVoice =
        voices.find((v) => {
          const n = v.name.toLowerCase();
          const l = v.lang.toLowerCase();
          return (
            (l.includes('kn') || l.includes('in')) &&
            (n.includes('male') || n.includes('david') || n.includes('ravi') || n.includes('prabhat') || n.includes('guy') || !n.includes('female'))
          );
        }) || voices.find((v) => v.lang.toLowerCase().includes('kn'));
    } else {
      selectedVoice = voices.find((v) => v.lang.toLowerCase().includes('kn'));
    }
  } else {
    const englishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
    if (persona.gender === 'female') {
      selectedVoice = englishVoices.find((v) => {
        const n = v.name.toLowerCase();
        return (
          n.includes('natural') ||
          n.includes('google us') ||
          n.includes('samantha') ||
          n.includes('zira') ||
          n.includes('jenny') ||
          n.includes('female')
        );
      });
    } else {
      selectedVoice = englishVoices.find((v) => {
        const n = v.name.toLowerCase();
        return (
          n.includes('natural') ||
          n.includes('google us') ||
          n.includes('david') ||
          n.includes('daniel') ||
          n.includes('guy') ||
          n.includes('male')
        );
      });
    }
    if (!selectedVoice && englishVoices.length > 0) {
      selectedVoice = englishVoices[0];
    }
  }

  let isStopped = false;
  const timeoutIds: NodeJS.Timeout[] = [];
  let currentDelayMs = 0;

  // Calculate total duration for progress
  let totalEstimatedMs = 0;
  segments.forEach((seg) => {
    if (seg.type === 'speech' && seg.text) {
      const words = seg.text.trim().split(/\s+/).length;
      totalEstimatedMs += Math.max(1200, (words / (145 * finalRate)) * 60 * 1000) + 100;
    } else if (seg.type === 'pause' && seg.durationSec) {
      totalEstimatedMs += seg.durationSec * 1000;
    }
  });

  const startTime = Date.now();
  const progressInterval = setInterval(() => {
    if (isStopped) {
      clearInterval(progressInterval);
      return;
    }
    const elapsedSec = (Date.now() - startTime) / 1000;
    const totalSec = Math.max(1, totalEstimatedMs / 1000);
    if (onProgress) {
      onProgress(Math.min(totalSec, elapsedSec), totalSec);
    }
  }, 100);

  segments.forEach((seg, index) => {
    if (seg.type === 'speech' && seg.text) {
      const segText = seg.text;
      const t = setTimeout(() => {
        if (isStopped) return;
        const utterance = new SpeechSynthesisUtterance(segText);
        utterance.rate = finalRate;
        utterance.pitch = finalPitch;
        utterance.volume = emotionSetting.volume;
        utterance.lang = isKn ? 'kn-IN' : 'en-US';
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        if (index === segments.length - 1) {
          utterance.onend = () => {
            if (!isStopped) {
              clearInterval(progressInterval);
              if (onFinish) onFinish();
            }
          };
        }

        window.speechSynthesis.speak(utterance);
      }, currentDelayMs);
      timeoutIds.push(t);

      const words = segText.trim().split(/\s+/).length;
      const durationMs = Math.max(1200, (words / (145 * finalRate)) * 60 * 1000);
      currentDelayMs += durationMs + 100;
    } else if (seg.type === 'pause' && seg.durationSec) {
      currentDelayMs += seg.durationSec * 1000;
    }
  });

  // Overall finish fallback timer
  const finalTimeout = setTimeout(() => {
    if (!isStopped) {
      clearInterval(progressInterval);
      if (onFinish) onFinish();
    }
  }, currentDelayMs + 500);
  timeoutIds.push(finalTimeout);

  return {
    stop: () => {
      isStopped = true;
      clearInterval(progressInterval);
      timeoutIds.forEach(clearTimeout);
      window.speechSynthesis.cancel();
    },
    isPlaying: () => !isStopped,
  };
}
