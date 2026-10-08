import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Repeat,
  Music4,
  FileAudio,
  Sparkles,
  Download,
} from 'lucide-react';
import { GeneratedVoiceRecord } from '../types/tts';
import { playScriptAloud } from '../utils/audioEngine';

interface AudioPlayerProps {
  currentVoice: GeneratedVoiceRecord | null;
  playTrigger?: number;
  onDownloadWav: () => void;
  onDownloadMp3: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  currentVoice,
  playTrigger = 0,
  onDownloadWav,
  onDownloadMp3,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechHandleRef = useRef<{ stop: () => void } | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);

  // Sync with audio playback whenever currentVoice or playTrigger changes
  useEffect(() => {
    if (!currentVoice) return;

    // Stop any ongoing speech
    if (speechHandleRef.current) {
      speechHandleRef.current.stop();
      speechHandleRef.current = null;
    }

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    setCurrentTime(0);
    setDuration(currentVoice.durationSec || 0);

    if (currentVoice.audioUrl) {
      if (audio) {
        if (audio.src !== currentVoice.audioUrl) {
          audio.src = currentVoice.audioUrl;
          audio.load();
        }
        // Audio file is already pre-rendered with exact pace time-stretching; play at normal 1.0x rate
        audio.playbackRate = 1.0;
        setPlaybackRate(1.0);
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    } else {
      // Emergency fallback only if no audioUrl
      setIsPlaying(true);
      speechHandleRef.current = playScriptAloud(
        currentVoice.script,
        currentVoice.voice,
        currentVoice.emotion,
        currentVoice.language,
        currentVoice.pace,
        currentVoice.pitch,
        (time, totalSec) => {
          setCurrentTime(time);
          if (totalSec > 0) setDuration(totalSec);
        },
        () => {
          setIsPlaying(false);
          setCurrentTime(0);
        }
      );
    }

    return () => {
      if (speechHandleRef.current) {
        speechHandleRef.current.stop();
        speechHandleRef.current = null;
      }
      if (audio) {
        audio.pause();
      }
    };
  }, [currentVoice, playTrigger]);

  // Handle HTML audio events for Gemini source
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onTimeUpdate = () => {
      if (currentVoice?.source === 'gemini') {
        setCurrentTime(audio.currentTime);
      }
    };

    const onEnded = () => {
      if (currentVoice?.source === 'gemini' && !audio.loop) {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentVoice]);

  // Spacebar toggle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'INPUT'
      ) {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentVoice]);

  const togglePlay = () => {
    if (!currentVoice) return;

    if (isPlaying) {
      if (speechHandleRef.current) {
        speechHandleRef.current.stop();
        speechHandleRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (currentVoice.audioUrl) {
        const audio = audioRef.current;
        if (audio) {
          if (audio.currentTime >= (audio.duration || duration) && !audio.loop) {
            audio.currentTime = 0;
          }
          audio
            .play()
            .then(() => setIsPlaying(true))
            .catch(console.error);
        }
      } else {
        setIsPlaying(true);
        speechHandleRef.current = playScriptAloud(
          currentVoice.script,
          currentVoice.voice,
          currentVoice.emotion,
          currentVoice.language,
          currentVoice.pace,
          currentVoice.pitch,
          (time, totalSec) => {
            setCurrentTime(time);
            if (totalSec > 0) setDuration(totalSec);
          },
          () => {
            setIsPlaying(false);
            setCurrentTime(0);
          }
        );
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    const audio = audioRef.current;
    if (audio && currentVoice?.source === 'gemini') {
      audio.currentTime = time;
    }
    setCurrentTime(time);
  };

  const skipTime = (seconds: number) => {
    if (currentVoice?.source === 'gemini') {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = Math.max(0, Math.min(audio.duration || duration, audio.currentTime + seconds));
    }
  };

  const handleSpeedChange = (rate: number) => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    const val = parseFloat(e.target.value);
    if (audio) audio.volume = val;
    setVolume(val);
    if (val === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleLoop = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = !isLooping;
    setIsLooping(!isLooping);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!currentVoice) {
    return (
      <div className="preview-empty">
        <Music4 className="h-8 w-8 text-indigo-400 mb-2 opacity-60" />
        <span className="font-syne font-bold text-sm text-[var(--ink)]">No Audio Generated Yet</span>
        <p className="mt-1 text-xs text-[var(--ink-muted)] max-w-sm">
          Select your voice persona, delivery style and tempo, then click <span className="text-indigo-400 font-semibold">Generate Voice</span> to synthesize.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[4px] border border-[var(--ink-faint)] bg-[#0d0f14] p-4 sm:p-5 shadow-2xl">
      <audio ref={audioRef} />

      {/* Header Info Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ink-faint)] pb-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="voice-avatar shrink-0">
            {currentVoice.voice.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white text-base tracking-tight">{currentVoice.voice}</span>
              <span className="font-mono-code text-[0.62rem] uppercase tracking-wider px-1.5 py-0.5 bg-[var(--ink-faint)] text-[var(--ink-muted)] rounded-[2px]">
                {currentVoice.emotion}
              </span>
              <span className="font-mono-code text-[0.62rem] px-1.5 py-0.5 bg-indigo-500/15 text-indigo-300 rounded-[2px]">
                {currentVoice.language}
              </span>
            </div>
            <p className="font-mono-code text-[0.65rem] text-[var(--ink-muted)] mt-0.5">
              Pace: {Math.round(currentVoice.pace * 100)}% ({currentVoice.pace.toFixed(2)}x) · Pitch: {currentVoice.pitch}
            </p>
          </div>
        </div>

        <div className="text-right">
          {currentVoice.source === 'gemini' ? (
            <span className="font-mono-code text-[0.65rem] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-[2px] inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              Gemini 24kHz Audio
            </span>
          ) : (
            <span className="font-mono-code text-[0.65rem] text-indigo-300 bg-indigo-950/40 border border-indigo-500/30 px-2 py-0.5 rounded-[2px] inline-flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-indigo-400" />
              {currentVoice.voice} Take
            </span>
          )}
        </div>
      </div>

      {/* Spoken Script Text Excerpt */}
      <div className="mb-3.5 p-2.5 rounded-[3px] bg-black/40 border border-[var(--ink-faint)]">
        <span className="label mb-1">
          Script Spoken:
        </span>
        <p className="text-xs text-[var(--ink)] line-clamp-2 italic leading-relaxed">
          "{currentVoice.script}"
        </p>
      </div>

      {/* Waveform Visualization & Scrubbing Bar */}
      <div className="mb-4">
        {/* Interactive Waveform Bar Visualizer */}
        <div
          className="relative h-14 w-full cursor-pointer rounded-[3px] bg-black/50 border border-[var(--ink-faint)] p-2 flex items-center justify-between gap-[2px] overflow-hidden group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = Math.max(0, Math.min(1, clickX / rect.width));
            if (audioRef.current && currentVoice.source === 'gemini') {
              const target = pct * (duration || 1);
              audioRef.current.currentTime = target;
              setCurrentTime(target);
            }
          }}
        >
          {/* Progress Overlay */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-indigo-500/20 pointer-events-none transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Playhead marker */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-indigo-400 shadow-[0_0_8px_#818cf8] pointer-events-none transition-all duration-75 z-10"
            style={{ left: `${progressPercent}%` }}
          />

          {/* 48 Amplitude Waveform Bars */}
          {Array.from({ length: 48 }).map((_, i) => {
            const barProgress = (i / 48) * 100;
            const isPlayed = barProgress <= progressPercent;
            const seed = (i * 17 + currentVoice.voice.charCodeAt(0)) % 100;
            const heightPct = Math.max(18, Math.min(95, 25 + Math.sin(i * 0.4) * 35 + (seed % 35)));

            return (
              <div
                key={i}
                className={`w-full rounded-[1px] transition-all duration-100 ${
                  isPlayed
                    ? 'bg-gradient-to-t from-indigo-500 to-indigo-300'
                    : 'bg-slate-800 group-hover:bg-slate-700'
                }`}
                style={{ height: `${heightPct}%` }}
              />
            );
          })}
        </div>

        {/* Time Progress slider & Readout */}
        <div className="mt-2 flex items-center justify-between text-xs font-mono-code text-[var(--ink-muted)]">
          <span className="text-indigo-300 font-semibold">{formatTime(currentTime)}</span>
          <div className="flex-1 mx-3 relative flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.01}
              value={currentTime}
              onChange={handleSeek}
            />
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Playback Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Play / Skip Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => skipTime(-5)}
            title="Rewind 5s"
            className="btn btn-secondary p-2 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="btn btn-primary py-2 px-4 text-xs w-auto"
            title={isPlaying ? 'Pause (Space)' : 'Play / Replay (Space)'}
          >
            {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            type="button"
            onClick={() => skipTime(5)}
            title="Skip forward 5s"
            className="btn btn-secondary p-2 text-xs"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleLoop}
            className={`btn btn-secondary p-2 text-xs ${
              isLooping ? 'active' : ''
            }`}
            title="Toggle Loop"
          >
            <Repeat className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Speed multipliers */}
        <div className="flex items-center gap-1">
          {[0.8, 1.0, 1.2].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => handleSpeedChange(rate)}
              className={`btn btn-secondary py-1 px-2 text-[0.62rem] font-mono-code ${
                playbackRate === rate ? 'active' : ''
              }`}
            >
              {rate.toFixed(1)}x
            </button>
          ))}
        </div>

        {/* Volume slider */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className="text-[var(--ink-muted)] hover:text-white transition"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 h-1.5"
          />
        </div>
      </div>

      {/* Prominent Dual Download Options (WAV & MP3) */}
      <div className="mt-4 pt-3.5 border-t border-[var(--ink-faint)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="font-mono-code text-[0.65rem] text-[var(--ink-muted)] truncate max-w-xs">
          <span>{currentVoice.fileName}</span>
          <span className="mx-1.5">·</span>
          <span>{((currentVoice.fileSizeBytes || currentVoice.wavBlob.size) / (1024 * 1024)).toFixed(2)} MB</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Download MP3 button */}
          <button
            type="button"
            onClick={onDownloadMp3}
            className="btn btn-secondary flex-1 sm:flex-none text-amber-300 hover:text-white hover:border-amber-400 py-2 px-3 text-xs"
            title="Download compressed MP3 audio (192 kbps) for YouTube Shorts & Reels"
          >
            <FileAudio className="h-4 w-4" />
            <span>Download MP3</span>
          </button>

          {/* Download WAV button */}
          <button
            type="button"
            onClick={onDownloadWav}
            className="btn btn-secondary flex-1 sm:flex-none text-emerald-300 hover:text-white hover:border-emerald-400 py-2 px-3 text-xs"
            title="Download uncompressed 24kHz Studio WAV audio"
          >
            <Download className="h-4 w-4" />
            <span>Download WAV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
