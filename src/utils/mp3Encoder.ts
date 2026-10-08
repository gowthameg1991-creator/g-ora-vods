import { Mp3Encoder } from '@breezystack/lamejs';

/**
 * Converts a standard WAV Blob or ArrayBuffer into an MP3 Blob at 192kbps.
 * Uses Web Audio API AudioContext to decode audio frames, then encodes with Lame MP3 encoder.
 */
export async function wavBlobToMp3Blob(
  wavBlob: Blob | ArrayBuffer,
  kbps: number = 192
): Promise<Blob> {
  const arrayBuffer = wavBlob instanceof Blob ? await wavBlob.arrayBuffer() : wavBlob;

  // Use AudioContext to decode WAV into AudioBuffer
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtx();

  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));

    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;

    // Get channel data
    const leftChannel = audioBuffer.getChannelData(0);
    const rightChannel = numChannels > 1 ? audioBuffer.getChannelData(1) : undefined;

    // Convert Float32Array (-1.0 to 1.0) to Int16Array (-32768 to 32767)
    const leftInt16 = new Int16Array(length);
    for (let i = 0; i < length; i++) {
      const s = Math.max(-1, Math.min(1, leftChannel[i]));
      leftInt16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    let rightInt16: Int16Array | undefined;
    if (rightChannel) {
      rightInt16 = new Int16Array(length);
      for (let i = 0; i < length; i++) {
        const s = Math.max(-1, Math.min(1, rightChannel[i]));
        rightInt16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
    }

    // Initialize MP3 Encoder
    const encoder = new Mp3Encoder(numChannels, sampleRate, kbps);
    const sampleBlockSize = 1152;
    const mp3Chunks: Uint8Array[] = [];

    for (let i = 0; i < length; i += sampleBlockSize) {
      const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
      const rightChunk = rightInt16 ? rightInt16.subarray(i, i + sampleBlockSize) : undefined;
      const mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
      if (mp3buf && mp3buf.length > 0) {
        mp3Chunks.push(mp3buf);
      }
    }

    const flushBuf = encoder.flush();
    if (flushBuf && flushBuf.length > 0) {
      mp3Chunks.push(flushBuf);
    }

    return new Blob(mp3Chunks as unknown as BlobPart[], { type: 'audio/mp3' });
  } finally {
    audioCtx.close().catch(() => {});
  }
}
