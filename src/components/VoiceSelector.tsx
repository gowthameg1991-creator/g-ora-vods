import React, { useState, useRef, useEffect } from 'react';
import {
  Mic2,
  Check,
  ChevronDown,
  Play,
  Pause,
  Star,
  Loader2,
  Sliders,
  Volume2,
} from 'lucide-react';
import { GEMINI_VOICES, VoiceOption, EmotionOption, PitchLevel, LanguageOption } from '../types/tts';
import { base64ToWavArrayBuffer, processAudio } from '../utils/audioEngine';

interface VoiceSelectorProps {
  selectedVoice: string;
  onChange: (voice: VoiceOption) => void;
  favoriteVoices?: string[];
  onToggleFavorite?: (voiceId: string) => void;
  currentEmotion?: EmotionOption;
  pace?: number;
  pitch?: PitchLevel;
  customApiKey?: string;
  currentLanguage?: LanguageOption;
}

// Client-side cache for dynamically generated audition samples
const auditionSampleCache = new Map<string, string>();

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onChange,
  favoriteVoices = [],
  onToggleFavorite,
  currentEmotion,
  pace = 1.0,
  pitch = 'Default',
  customApiKey,
  currentLanguage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'recommended' | 'all' | 'favorites'>('recommended');
  const [genderFilter, setGenderFilter] = useState<'all' | 'Male' | 'Female'>('all');
  const sampleAudioRef = useRef<HTMLAudioElement | null>(null);

  const current =
    GEMINI_VOICES.find((v) => v.id.toLowerCase() === selectedVoice.toLowerCase()) || GEMINI_VOICES[0];

  const isCurrentFavorited = favoriteVoices.includes(current.id);

  // Check if current voice is recommended for active language
  const isCurrentRecommended =
    !currentLanguage ||
    !currentLanguage.recommendedVoices ||
    currentLanguage.recommendedVoices.length === 0 ||
    currentLanguage.recommendedVoices.includes(current.id);

  const activeSuitabilityBadge = currentLanguage?.voiceSuitability?.[current.id];

  // Stop sample playback on unmount or voice switch
  useEffect(() => {
    return () => {
      if (sampleAudioRef.current) {
        sampleAudioRef.current.pause();
        sampleAudioRef.current = null;
      }
    };
  }, []);

  const handlePlaySample = async (voice: VoiceOption, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    if (playingVoiceId === voice.id) {
      if (sampleAudioRef.current) {
        sampleAudioRef.current.pause();
      }
      setPlayingVoiceId(null);
      return;
    }

    if (sampleAudioRef.current) {
      sampleAudioRef.current.pause();
    }

    const emotionName = currentEmotion?.name || 'Natural';
    const emotionId = currentEmotion?.id || 'default';
    const cacheKey = `${voice.id}_${emotionId}_${Math.round(pace * 100)}_${pitch}`;

    // Helper to start playback on an audio element
    const startPlayback = (audioUrl: string) => {
      const audio = new Audio(audioUrl);
      sampleAudioRef.current = audio;
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
        .then(() => {
          setPlayingVoiceId(voice.id);
        })
        .catch((err) => {
          console.warn('Audio play error:', err);
          setPlayingVoiceId(null);
        });
    };

    // 1. If already cached for this exact emotion/pace/pitch, play immediately!
    if (auditionSampleCache.has(cacheKey)) {
      startPlayback(auditionSampleCache.get(cacheKey)!);
      return;
    }

    // 2. Fetch live sample calibrated to the chosen emotion & pitch
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
        auditionSampleCache.set(cacheKey, url);
        startPlayback(url);
      } else {
        // Fallback to static sample if quota cooling down
        startPlayback(voice.sampleAudioUrl);
      }
    } catch (err) {
      console.warn('Dynamic sample preview error, falling back to static:', err);
      startPlayback(voice.sampleAudioUrl);
    } finally {
      setLoadingVoiceId(null);
    }
  };

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

  return (
    <div className="relative">
      <div className="label justify-between mb-1.5">
        <span className="flex items-center gap-1.5">
          <Mic2 className="h-3.5 w-3.5 text-indigo-400" />
          Voice Persona
        </span>
        <span className="font-mono-code text-[0.62rem] text-[var(--ink-muted)]">
          {currentLanguage ? `${currentLanguage.name} · ` : ''}
          {favoriteVoices.length > 0
            ? `${favoriteVoices.length} Fav · ${GEMINI_VOICES.length} Voices`
            : `${GEMINI_VOICES.length} Voices`}
        </span>
      </div>

      {/* Main Selected Voice Card (Variation 2 Style) */}
      <div className="border border-[var(--ink-faint)] bg-[#0d0f14] rounded-[4px] transition hover:border-[rgba(226,232,240,0.25)]">
        {/* Top Clickable Trigger Row */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 cursor-pointer flex items-center justify-between gap-3 select-none"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="voice-avatar shrink-0">
              {current.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-[var(--ink)]">
                  {current.name}
                </span>
                <span className="font-mono-code text-[0.62rem] uppercase tracking-wider px-1.5 py-0.5 bg-[var(--ink-faint)] text-[var(--ink-muted)] rounded-[2px]">
                  {current.gender}
                </span>
                {activeSuitabilityBadge && (
                  <span className="font-mono-code text-[0.62rem] px-1.5 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-[2px] truncate max-w-[200px]" title={activeSuitabilityBadge}>
                    {activeSuitabilityBadge}
                  </span>
                )}
                {!activeSuitabilityBadge && current.kannadaBadge && (
                  <span className="font-mono-code text-[0.62rem] px-1.5 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-[2px]">
                    {current.kannadaBadge}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--ink-muted)] truncate mt-0.5">
                {current.character}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(current.id);
                }}
                className={`p-1.5 rounded-[2px] transition hover:bg-white/5 ${
                  isCurrentFavorited
                    ? 'text-amber-400'
                    : 'text-slate-500 hover:text-amber-400'
                }`}
                title={isCurrentFavorited ? 'Remove from favorites' : 'Add to favorite voices'}
              >
                <Star className={`h-3.5 w-3.5 ${isCurrentFavorited ? 'fill-amber-400' : ''}`} />
              </button>
            )}
            <ChevronDown
              className={`h-4 w-4 text-[var(--ink-muted)] transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {/* Audition Sample Sub-bar */}
        <div className="border-t border-[var(--ink-faint)] bg-black/20 px-3 py-2 flex items-center justify-between gap-2">
          <span className="font-mono-code text-[0.65rem] text-indigo-300 flex items-center gap-1.5 truncate">
            <Volume2 className="h-3 w-3 text-indigo-400 shrink-0" />
            Audition: {currentEmotion?.name || 'Natural'} · {Math.round(pace * 100)}%
          </span>

          <button
            type="button"
            onClick={(e) => handlePlaySample(current, e)}
            disabled={loadingVoiceId === current.id}
            className={`btn btn-secondary py-1 px-2.5 text-[0.65rem] ${
              playingVoiceId === current.id ? 'active' : ''
            }`}
            title={`Hear sample of ${current.name} with ${currentEmotion?.name || 'Natural'} emotion at ${Math.round(pace * 100)}% pace`}
          >
            {loadingVoiceId === current.id ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Calibrating...</span>
              </>
            ) : playingVoiceId === current.id ? (
              <>
                <Pause className="h-3 w-3 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 fill-current ml-0.5" />
                <span>Play Sample</span>
              </>
            )}
          </button>
        </div>

        {/* Smooth Expandable Voice List - Never overlaps below because it expands inline! */}
        {isOpen && (
          <div className="border-t border-[var(--ink-faint)] bg-[#0b0c10] p-2 space-y-1.5 animate-in fade-in duration-150">
            {/* Filter Tabs */}
            <div className="px-1 py-1.5 flex items-center justify-between gap-2 border-b border-[var(--ink-faint)] pb-2 mb-1 flex-wrap">
              <span className="font-mono-code text-[0.65rem] uppercase text-[var(--ink-muted)]">
                {currentLanguage ? `${currentLanguage.name} Cast` : 'Select Persona'}
              </span>

              <div className="flex items-center gap-1 shrink-0 flex-wrap">
                {recommendedVoiceIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterMode('recommended')}
                    className={`btn btn-secondary py-0.5 px-2 text-[0.62rem] ${
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
                  className={`btn btn-secondary py-0.5 px-2 text-[0.62rem] ${
                    filterMode === 'all' ? 'active' : ''
                  }`}
                >
                  All ({GEMINI_VOICES.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('favorites')}
                  className={`btn btn-secondary py-0.5 px-2 text-[0.62rem] ${
                    filterMode === 'favorites' ? 'active' : ''
                  }`}
                >
                  <Star className="h-2.5 w-2.5 fill-current" />
                  <span>Favs ({favoriteVoices.length})</span>
                </button>

                <div className="flex items-center gap-1 border-l border-[var(--ink-faint)] pl-1.5 ml-0.5">
                  <button
                    type="button"
                    onClick={() => setGenderFilter(genderFilter === 'Male' ? 'all' : 'Male')}
                    className={`btn btn-secondary py-0.5 px-1.5 text-[0.62rem] ${
                      genderFilter === 'Male' ? 'active' : ''
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenderFilter(genderFilter === 'Female' ? 'all' : 'Female')}
                    className={`btn btn-secondary py-0.5 px-1.5 text-[0.62rem] ${
                      genderFilter === 'Female' ? 'active' : ''
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>
            </div>

            {displayedVoices.length === 0 ? (
              <div className="p-4 text-center text-xs text-[var(--ink-muted)]">
                {filterMode === 'favorites'
                  ? 'No favorite voices yet. Click the star icon to add favorites.'
                  : 'No matching voices in this filter. Switch to All.'}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                {displayedVoices.map((v) => {
                  const isSelected = v.id.toLowerCase() === current.id.toLowerCase();
                  const isPlaying = playingVoiceId === v.id;
                  const isLoading = loadingVoiceId === v.id;
                  const isFav = favoriteVoices.includes(v.id);
                  const voiceSuitability = currentLanguage?.voiceSuitability?.[v.id];

                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        onChange(v);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left rounded-[4px] p-2.5 transition flex items-center justify-between gap-2.5 cursor-pointer border ${
                        isSelected
                          ? 'bg-indigo-600/15 border-indigo-500/60'
                          : 'border-transparent bg-white/[0.02] hover:border-[var(--ink-faint)] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-8 h-8 rounded-[3px] flex items-center justify-center font-syne font-extrabold text-xs text-white shrink-0 ${
                            isSelected ? 'bg-indigo-600' : 'bg-slate-800'
                          }`}
                        >
                          {v.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-xs text-white">
                              {v.name}
                            </span>
                            <span className="font-mono-code text-[0.6rem] px-1 py-0.2 bg-white/5 text-[var(--ink-muted)] rounded-[2px]">
                              {v.gender}
                            </span>
                            {voiceSuitability && (
                              <span
                                className="font-mono-code text-[0.6rem] px-1.5 py-0.2 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-[2px] truncate max-w-[190px]"
                                title={voiceSuitability}
                              >
                                {voiceSuitability}
                              </span>
                            )}
                            {!voiceSuitability && v.kannadaBadge && (
                              <span className="font-mono-code text-[0.6rem] px-1.5 py-0.2 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-[2px] truncate max-w-[120px]">
                                {v.kannadaBadge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[var(--ink-muted)] truncate mt-0.5">
                            {v.character}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        {onToggleFavorite && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(v.id);
                            }}
                            className={`p-1.5 rounded-[2px] transition hover:bg-white/5 ${
                              isFav ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400'
                            }`}
                            title={isFav ? 'Remove from favorites' : 'Star as favorite'}
                          >
                            <Star className={`h-3.5 w-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handlePlaySample(v, e)}
                          disabled={isLoading}
                          className={`btn btn-secondary py-1 px-2 text-[0.62rem] ${
                            isPlaying ? 'active' : ''
                          }`}
                          title={`Audition ${v.name}`}
                        >
                          {isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />
                          ) : isPlaying ? (
                            <Pause className="h-3 w-3 fill-current" />
                          ) : (
                            <Play className="h-3 w-3 fill-current ml-0.5" />
                          )}
                          <span>Sample</span>
                        </button>

                        {isSelected && (
                          <Check className="h-4 w-4 text-indigo-400 shrink-0 ml-1" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

