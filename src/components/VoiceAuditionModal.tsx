import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  Check,
  Radio,
  Star,
  Loader2,
  Sliders,
} from 'lucide-react';
import { GEMINI_VOICES, VoiceOption, EmotionOption, PitchLevel, LanguageOption } from '../types/tts';
import { base64ToWavArrayBuffer, processAudio } from '../utils/audioEngine';

interface VoiceAuditionModalProps {
  isOpen: boolean;
  selectedVoiceId: string;
  onClose: () => void;
  onSelectVoice: (voice: VoiceOption) => void;
  favoriteVoices?: string[];
  onToggleFavorite?: (voiceId: string) => void;
  currentEmotion?: EmotionOption;
  pace?: number;
  pitch?: PitchLevel;
  customApiKey?: string;
  currentLanguage?: LanguageOption;
}

// Client-side cache for dynamically generated audition samples
const modalSampleCache = new Map<string, string>();

export const VoiceAuditionModal: React.FC<VoiceAuditionModalProps> = ({
  isOpen,
  selectedVoiceId,
  onClose,
  onSelectVoice,
  favoriteVoices = [],
  onToggleFavorite,
  currentEmotion,
  pace = 1.0,
  pitch = 'Default',
  customApiKey,
  currentLanguage,
}) => {
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'recommended' | 'all' | 'favorites'>('recommended');
  const [genderFilter, setGenderFilter] = useState<'all' | 'Male' | 'Female'>('all');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const recommendedVoiceIds = currentLanguage?.recommendedVoices || [];

  const displayedVoices = GEMINI_VOICES.filter((v) => {
    if (genderFilter !== 'all' && v.gender !== genderFilter) {
      return false;
    }
    if (filterMode === 'recommended' && recommendedVoiceIds.length > 0) {
      return recommendedVoiceIds.includes(v.id);
    }
    if (filterMode === 'favorites') {
      return favoriteVoices.includes(v.id);
    }
    return true;
  });

  const handlePlay = async (voice: VoiceOption) => {
    if (playingVoiceId === voice.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingVoiceId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const emotionName = currentEmotion?.name || 'Natural';
    const emotionId = currentEmotion?.id || 'default';
    const cacheKey = `${voice.id}_${emotionId}_${Math.round(pace * 100)}_${pitch}`;

    const startPlayback = (audioUrl: string) => {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      if (pace) {
        audio.playbackRate = pace;
      }

      audio.onended = () => {
        setPlayingVoiceId(null);
      };

      audio.onerror = () => {
        setPlayingVoiceId(null);
      };

      audio
        .play()
        .then(() => setPlayingVoiceId(voice.id))
        .catch((e) => {
          console.warn('Playback error:', e);
          setPlayingVoiceId(null);
        });
    };

    if (modalSampleCache.has(cacheKey)) {
      startPlayback(modalSampleCache.get(cacheKey)!);
      return;
    }

    setLoadingVoiceId(voice.id);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (customApiKey) {
        headers['x-gemini-api-key'] = customApiKey;
      }

      const res = await fetch('/api/generate-voice', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          script: voice.sampleText,
          voice: voice.id,
          emotion: emotionName,
          pace,
          pitch,
        }),
      });

      const data = await res.json();

      if (data.success && data.audioBase64) {
        const wavBuffer = base64ToWavArrayBuffer(data.audioBase64, data.mimeType);
        const processed = await processAudio(wavBuffer, pace, pitch);
        const url = URL.createObjectURL(processed.wavBlob);
        modalSampleCache.set(cacheKey, url);
        startPlayback(url);
      } else {
        startPlayback(voice.sampleAudioUrl);
      }
    } catch (err) {
      console.warn('Dynamic sample preview error, falling back to static:', err);
      startPlayback(voice.sampleAudioUrl);
    } finally {
      setLoadingVoiceId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-4xl rounded-[4px] border border-[var(--ink-faint)] bg-[#0d0f15] shadow-2xl p-5 sm:p-6 max-h-[90vh] flex flex-col overflow-hidden text-[var(--ink)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--ink-faint)] pb-3 mb-4 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="voice-avatar shrink-0">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-syne text-base font-extrabold text-white flex items-center gap-2 flex-wrap">
                <span>Audition Gemini Voices</span>
                <span className="font-mono-code text-[0.62rem] text-indigo-300 bg-indigo-500/15 px-1.5 py-0.2 rounded-[2px]">
                  {GEMINI_VOICES.length} Personas
                </span>
                {currentLanguage && (
                  <span className="font-mono-code text-[0.62rem] text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded-[2px]">
                    {currentLanguage.name}
                  </span>
                )}
              </h2>
              <p className="font-mono-code text-[0.65rem] text-[var(--ink-muted)]">
                Dynamic audition: <span className="text-white">{currentEmotion?.name || 'Natural'}</span> · <span className="text-white">{Math.round(pace * 100)}% pace</span> · <span className="text-white">{pitch} pitch</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Toggle */}
            <div className="flex items-center gap-1 flex-wrap">
              {recommendedVoiceIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterMode('recommended')}
                  className={`btn btn-secondary py-1 px-2.5 text-[0.62rem] ${
                    filterMode === 'recommended' ? 'active' : ''
                  }`}
                  title={`Top recommended voices for ${currentLanguage?.name || 'selected language'}`}
                >
                  ⭐ For {currentLanguage?.name} ({recommendedVoiceIds.length})
                </button>
              )}
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`btn btn-secondary py-1 px-2.5 text-[0.62rem] ${
                  filterMode === 'all' ? 'active' : ''
                }`}
              >
                All ({GEMINI_VOICES.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('favorites')}
                className={`btn btn-secondary py-1 px-2.5 text-[0.62rem] ${
                  filterMode === 'favorites' ? 'active' : ''
                }`}
              >
                <Star className="h-3 w-3 fill-current" />
                <span>Favs ({favoriteVoices.length})</span>
              </button>
            </div>

            {/* Gender Toggle */}
            <div className="flex items-center gap-1 border-l border-[var(--ink-faint)] pl-2">
              <button
                type="button"
                onClick={() => setGenderFilter('all')}
                className={`btn btn-secondary py-1 px-2 text-[0.62rem] ${
                  genderFilter === 'all' ? 'active' : ''
                }`}
              >
                Any
              </button>
              <button
                type="button"
                onClick={() => setGenderFilter('Male')}
                className={`btn btn-secondary py-1 px-2 text-[0.62rem] ${
                  genderFilter === 'Male' ? 'active' : ''
                }`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => setGenderFilter('Female')}
                className={`btn btn-secondary py-1 px-2 text-[0.62rem] ${
                  genderFilter === 'Female' ? 'active' : ''
                }`}
              >
                Female
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-[2px] text-[var(--ink-muted)] hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Voice Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {displayedVoices.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Star className="h-8 w-8 text-amber-400/40 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No favorite voices yet</p>
              <p className="text-xs text-slate-500">
                Click the star icon on any voice to add it to your favorites list.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pb-2">
              {displayedVoices.map((voice) => {
                const isSelected = voice.id.toLowerCase() === selectedVoiceId.toLowerCase();
                const isPlaying = playingVoiceId === voice.id;
                const isLoading = loadingVoiceId === voice.id;
                const isFav = favoriteVoices.includes(voice.id);

                return (
                  <div
                    key={voice.id}
                    className={`rounded-2xl border p-4 transition flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/30 ring-1 ring-indigo-500/40'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Top Row */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${voice.avatarColor} text-white font-bold text-xs shadow-md relative`}
                          >
                            {voice.name.slice(0, 2)}
                            {isFav && (
                              <div className="absolute -top-1 -right-1 bg-slate-900 rounded-full p-0.5 border border-slate-700">
                                <Star className="h-2 w-2 text-amber-400 fill-amber-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm flex items-center gap-1">
                                {voice.name}
                                {isFav && (
                                  <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
                                )}
                              </span>
                              <span className="text-[10px] rounded px-1.5 py-0.2 bg-slate-800 text-slate-400">
                                {voice.gender}
                              </span>
                              {currentLanguage?.voiceSuitability?.[voice.id] ? (
                                <span className="text-[10px] rounded px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                                  {currentLanguage.voiceSuitability[voice.id]}
                                </span>
                              ) : voice.kannadaBadge ? (
                                <span className="text-[10px] rounded px-1.5 py-0.2 bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                                  {voice.kannadaBadge}
                                </span>
                              ) : (
                                <span className="text-[10px] rounded px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 font-medium">
                                  {voice.character}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {onToggleFavorite && (
                            <button
                              type="button"
                              onClick={() => onToggleFavorite(voice.id)}
                              className={`p-1.5 rounded-lg transition hover:bg-slate-800 ${
                                isFav
                                  ? 'text-amber-400'
                                  : 'text-slate-600 hover:text-amber-400'
                              }`}
                              title={isFav ? 'Remove from favorites' : 'Star as favorite'}
                            >
                              <Star className={`h-4 w-4 ${isFav ? 'fill-amber-400' : ''}`} />
                            </button>
                          )}

                          {isSelected && (
                            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1">
                              <Check className="h-3 w-3" /> Active
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Best for use case */}
                      <p className="text-xs text-indigo-300/90 font-medium mb-1.5">
                        {voice.bestFor}
                      </p>

                      {/* Sample text quote */}
                      <p className="text-xs text-slate-400 italic line-clamp-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                        "{voice.sampleText}"
                      </p>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--ink-faint)] mt-1">
                      <button
                        type="button"
                        onClick={() => handlePlay(voice)}
                        disabled={isLoading}
                        className={`btn btn-secondary py-1 px-2.5 text-[0.65rem] ${
                          isPlaying ? 'active' : ''
                        }`}
                        title={`Audition ${voice.name} with ${currentEmotion?.name || 'Natural'} emotion at ${Math.round(pace * 100)}% pace`}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Calibrating...</span>
                          </>
                        ) : isPlaying ? (
                          <>
                            <Pause className="h-3.5 w-3.5 fill-current" />
                            <span>Playing Audio</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                            <span>Hear Sample</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectVoice(voice);
                          onClose();
                        }}
                        className={`btn text-xs py-1 px-3 ${
                          isSelected
                            ? 'btn-secondary opacity-60 cursor-default'
                            : 'btn-primary w-auto'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Use this Voice'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--ink-faint)] pt-3 mt-3 flex items-center justify-between text-xs font-mono-code text-[var(--ink-muted)]">
          <span>Samples rendered with {currentEmotion?.name || 'Natural'} · {Math.round(pace * 100)}% pace · {pitch} pitch</span>
          <button
            onClick={onClose}
            className="btn btn-secondary text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
