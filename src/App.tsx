/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Sparkles,
  Download,
  AlertCircle,
  Clock,
  History,
  Radio,
  Sliders,
  Headphones,
  Star,
  Play,
  FileAudio,
  Volume2,
  RefreshCw,
  Video,
  Instagram,
  Youtube,
  Key,
  ExternalLink,
  X,
} from 'lucide-react';
import {
  VoiceOption,
  GEMINI_VOICES,
  EMOTIONS,
  EmotionOption,
  PitchLevel,
  LANGUAGES,
  LanguageOption,
  GeneratedVoiceRecord,
  StudioPreset,
} from './types/tts';
import { VoiceSelector } from './components/VoiceSelector';
import { EmotionSelector } from './components/EmotionSelector';
import { LanguageSelector } from './components/LanguageSelector';
import { PaceAndPitchControls } from './components/PaceAndPitchControls';
import { ScriptEditor } from './components/ScriptEditor';
import { AudioPlayer } from './components/AudioPlayer';
import { VoiceAuditionModal } from './components/VoiceAuditionModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { PresetManager } from './components/PresetManager';
import {
  base64ToWavArrayBuffer,
  processAudio,
  cleanScriptDirections,
} from './utils/audioEngine';
import { wavBlobToMp3Blob } from './utils/wavUtils';

export default function App() {
  // State
  const [script, setScript] = useState<string>(
    `Quinn found a note...\n\nwritten in her own handwriting.\n\n[PAUSE 2]\n\nIt said:\n\n"Do NOT look under the table."\n\n[PAUSE 3]`
  );
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(
    GEMINI_VOICES.find((v) => v.id === 'Vindemiatrix') || GEMINI_VOICES[0]
  );
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(LANGUAGES[0]); // English
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionOption>(
    EMOTIONS.find((e) => e.id === 'mysterious') || EMOTIONS[1]
  );
  const [pace, setPace] = useState<number>(1.0); // 100%
  const [pitch, setPitch] = useState<PitchLevel>('Default');
  const [isAuditionModalOpen, setIsAuditionModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Custom Gemini API Key stored in localStorage
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('vox_gemini_api_key_v1') || '';
    } catch (e) {
      return '';
    }
  });

  const handleSaveApiKey = (key: string) => {
    setCustomApiKey(key);
    try {
      if (key) {
        localStorage.setItem('vox_gemini_api_key_v1', key);
      } else {
        localStorage.removeItem('vox_gemini_api_key_v1');
      }
    } catch (e) {}
  };

  // Favorite Voices (persisted in localStorage)
  const [favoriteVoices, setFavoriteVoices] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vox_fav_voices_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load favorite voices', e);
    }
    return ['Vindemiatrix', 'Puck', 'Charon'];
  });

  // Favorite Emotions (persisted in localStorage)
  const [favoriteEmotions, setFavoriteEmotions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vox_fav_emotions_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load favorite emotions', e);
    }
    return ['mysterious', 'curious', 'playful', 'tense'];
  });

  const toggleFavoriteVoice = (voiceId: string) => {
    setFavoriteVoices((prev) => {
      const next = prev.includes(voiceId) ? prev.filter((id) => id !== voiceId) : [...prev, voiceId];
      try {
        localStorage.setItem('vox_fav_voices_v1', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const toggleFavoriteEmotion = (emotionId: string) => {
    setFavoriteEmotions((prev) => {
      const next = prev.includes(emotionId) ? prev.filter((id) => id !== emotionId) : [...prev, emotionId];
      try {
        localStorage.setItem('vox_fav_emotions_v1', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Audio generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [currentTake, setCurrentTake] = useState<GeneratedVoiceRecord | null>(null);
  const [history, setHistory] = useState<GeneratedVoiceRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [playTrigger, setPlayTrigger] = useState<number>(0);

  // Auto-sync emotion recommendations
  const handleEmotionChange = (emotion: EmotionOption) => {
    setSelectedEmotion(emotion);
    const recommended = GEMINI_VOICES.find(
      (v) => v.id.toLowerCase() === emotion.recommendedVoice.toLowerCase()
    );
    if (recommended && emotion.id !== 'default') {
      setPace(emotion.suggestedPace);
    }
  };

  // Language switch handler
  const handleLanguageChange = (lang: LanguageOption) => {
    setSelectedLanguage(lang);
    if (lang.sampleScripts.length > 0) {
      setScript(lang.sampleScripts[0].text);
    }
    // Auto-select #1 recommended voice if current voice is not recommended for this language
    if (lang.recommendedVoices && lang.recommendedVoices.length > 0) {
      if (!lang.recommendedVoices.includes(selectedVoice.id)) {
        const topVoice = GEMINI_VOICES.find((v) => v.id === lang.recommendedVoices[0]);
        if (topVoice) {
          setSelectedVoice(topVoice);
        }
      }
    }
  };

  // Preset apply handler - sets Voice, Emotion, Pace, and Pitch together in 1 click
  const handleApplyPreset = (preset: StudioPreset) => {
    const foundVoice = GEMINI_VOICES.find(
      (v) => v.id.toLowerCase() === preset.voiceId.toLowerCase()
    );
    if (foundVoice) {
      setSelectedVoice(foundVoice);
    }

    const foundEmotion = EMOTIONS.find(
      (e) => e.id.toLowerCase() === preset.emotionId.toLowerCase()
    );
    if (foundEmotion) {
      setSelectedEmotion(foundEmotion);
    }

    setPace(preset.pace);
    setPitch(preset.pitch);

    if (preset.languageCode) {
      const foundLang = LANGUAGES.find((l) => l.code === preset.languageCode);
      if (foundLang) {
        setSelectedLanguage(foundLang);
      }
    }
  };

  // Main voice synthesis handler - guarantees authentic Gemini AI Voice
  const handleGenerateVoice = async () => {
    if (!script.trim()) {
      setErrorMessage('Please enter or paste a script to generate voice-over.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const sanitizedScript = cleanScriptDirections(script);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (customApiKey) {
        headers['x-gemini-api-key'] = customApiKey;
      }

      const response = await fetch('/api/generate-voice', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          script: sanitizedScript,
          voice: selectedVoice.id,
          language: selectedLanguage.code,
          emotion: selectedEmotion.name,
          pace,
          pitch,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.audioBase64) {
        if (response.status === 429 || data.error?.includes('cooling down') || data.retryAfterSec) {
          const waitTime = data.retryAfterSec || 25;
          setCooldownSeconds(waitTime);
          return;
        }
        throw new Error(data.error || 'Voice synthesis failed. Please try again.');
      }

      // Successful audio generation
      setCooldownSeconds(0);
      const wavArrayBuffer = base64ToWavArrayBuffer(data.audioBase64, data.mimeType);
      const processed = await processAudio(wavArrayBuffer, pace, pitch);
      const audioUrl = URL.createObjectURL(processed.wavBlob);
      const safeVoice = selectedVoice.id.toLowerCase();
      const safeEmotion = selectedEmotion.id.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const safeLang = selectedLanguage.code;
      const fileName = `vox_${safeVoice}_${safeEmotion}_${safeLang}_${Math.round(pace * 100)}pct.wav`;

      const createdRecord: GeneratedVoiceRecord = {
        id: `take_${Date.now()}`,
        timestamp: Date.now(),
        script: sanitizedScript,
        voice: selectedVoice.id,
        language: selectedLanguage.name,
        emotion: selectedEmotion.name,
        pace,
        pitch,
        audioUrl,
        wavBlob: processed.wavBlob,
        mp3Blob: processed.mp3Blob,
        durationSec: Number(processed.durationSec.toFixed(1)),
        sampleRate: data.sampleRate || 24000,
        fileSizeBytes: processed.wavBlob.size,
        fileName,
        source: 'gemini',
      };

      setCurrentTake(createdRecord);
      setPlayTrigger(Date.now());
      setHistory((prev) => [createdRecord, ...prev.slice(0, 9)]);
    } catch (err: unknown) {
      console.error('Generation error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred during voice generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Timer countdown and automated retry execution
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Automatically trigger retry when cooldown hits 0
          handleGenerateVoice();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Replay a take under recent takes - always restarts from 0:00
  const handlePlayTake = (take: GeneratedVoiceRecord) => {
    setCurrentTake(take);
    setPlayTrigger(Date.now());
  };

  // Download WAV file
  const handleDownloadWav = (record?: GeneratedVoiceRecord) => {
    const target = record || currentTake;
    if (!target) return;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(target.wavBlob);
    link.download = target.fileName.endsWith('.wav') ? target.fileName : `${target.fileName}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download MP3 file
  const handleDownloadMp3 = async (record?: GeneratedVoiceRecord) => {
    const target = record || currentTake;
    if (!target) return;

    try {
      let mp3Blob = target.mp3Blob;
      if (!mp3Blob) {
        mp3Blob = await wavBlobToMp3Blob(target.wavBlob, 192);
      }

      const mp3FileName = target.fileName.replace(/\.wav$/i, '.mp3');
      const link = document.createElement('a');
      link.href = URL.createObjectURL(mp3Blob);
      link.download = mp3FileName.endsWith('.mp3') ? mp3FileName : `${mp3FileName}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('MP3 download error:', e);
      handleDownloadWav(target);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Variation 2 Studio Header */}
      <header className="px-5 sm:px-8 py-4 border-b-2 border-[var(--ink-faint)] flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-[#0e1015] to-[#0b0c0f]">
        <div className="brand-h">
          G-ORA-VODS <span className="badge">AI STUDIO</span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Custom API Key Button */}
          <button
            type="button"
            onClick={() => setIsApiKeyModalOpen(true)}
            className={`btn btn-secondary ${customApiKey ? 'active' : ''}`}
            title="Configure your free Google AI Studio API Key for unlimited TTS generations"
          >
            <Key className="h-3.5 w-3.5" />
            <span>{customApiKey ? 'Custom Key Active' : 'API Key'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAuditionModalOpen(true)}
            className="btn btn-secondary"
          >
            <Headphones className="h-3.5 w-3.5" />
            <span>Audition Voices</span>
          </button>

          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className={`btn btn-secondary ${showHistory ? 'active' : ''}`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Takes ({history.length})</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Studio Body - Two-Pane Studio Architecture */}
      <main className="grid grid-cols-1 lg:grid-cols-[1fr_420px] flex-1 border-b-2 border-[var(--ink-faint)] overflow-hidden">
        {/* Left Pane: Script Editor & Production Output */}
        <section className="editor-pane p-5 sm:p-8 lg:border-r-2 lg:border-[var(--ink-faint)] overflow-y-auto space-y-6">
          {/* Active Automated Quota Cooldown Banner */}
          {cooldownSeconds > 0 && (
            <div className="rounded-[4px] border border-indigo-500/40 bg-indigo-950/40 p-4 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 animate-spin text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs">
                        Gemini TTS Quota Cooling Down
                      </span>
                      <span className="font-mono-code text-[0.62rem] text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded-[2px]">
                        Retrying in {cooldownSeconds}s
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-indigo-200/80">
                      Shared quota resets automatically, or enter your own free Gemini key for instant synthesis.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsApiKeyModalOpen(true)}
                    className="btn btn-primary text-xs py-1.5 px-3 w-auto"
                  >
                    Enter Free API Key
                  </button>
                  <button
                    type="button"
                    onClick={() => setCooldownSeconds(0)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Generic Error Alert */}
          {errorMessage && cooldownSeconds === 0 && (
            <div className="rounded-[4px] border border-rose-800/60 bg-rose-950/40 p-3 text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-semibold text-rose-300">Voice Synthesis Notice</p>
                <p className="mt-0.5 text-rose-200/90">{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-400 hover:text-rose-200 text-xs"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 1. Script Editor Card */}
          <div className="card">
            <ScriptEditor
              script={script}
              pace={pace}
              currentLanguage={selectedLanguage}
              onChange={setScript}
              onSelectSample={(sample) => setScript(sample)}
            />
          </div>

          {/* 2. Output Audio Player Card */}
          <div>
            <div className="label justify-between mb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                Audio Preview & Download
              </span>
              {currentTake && (
                <span className="font-mono-code text-[0.62rem] text-[var(--ink-muted)]">
                  {currentTake.durationSec}s duration
                </span>
              )}
            </div>

            <AudioPlayer
              currentVoice={currentTake}
              playTrigger={playTrigger}
              onDownloadWav={() => handleDownloadWav(currentTake || undefined)}
              onDownloadMp3={() => handleDownloadMp3(currentTake || undefined)}
            />
          </div>

          {/* 3. Takes History Card (if any) */}
          {history.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-3 border-b border-[var(--ink-faint)] pb-2">
                <div className="label mb-0">
                  <History className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Recent Takes ({history.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="font-mono-code text-[0.62rem] text-[var(--ink-muted)] hover:text-rose-400 transition"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {history.map((take) => {
                  const isSelected = currentTake?.id === take.id;
                  return (
                    <div
                      key={take.id}
                      className={`p-2.5 rounded-[3px] border transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-indigo-600/15 border-indigo-500/50'
                          : 'bg-black/30 border-[var(--ink-faint)] hover:border-slate-700'
                      }`}
                    >
                      <div
                        className="min-w-0 flex-1 cursor-pointer"
                        onClick={() => handlePlayTake(take)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-white">{take.voice}</span>
                          <span className="font-mono-code text-[0.6rem] px-1.5 py-0.2 rounded-[2px] bg-indigo-500/20 text-indigo-300">
                            {take.emotion}
                          </span>
                          <span className="font-mono-code text-[0.6rem] text-[var(--ink-muted)]">
                            {Math.round(take.pace * 100)}%
                          </span>
                          {isSelected && (
                            <span className="flex items-center gap-1 font-mono-code text-[0.6rem] text-emerald-400">
                              <Volume2 className="h-3 w-3 animate-pulse" />
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--ink-muted)] truncate mt-0.5">{take.script}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handlePlayTake(take)}
                          className="btn btn-secondary py-1 px-2 text-[0.62rem]"
                          title="Play take"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Play</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadMp3(take)}
                          className="btn btn-secondary py-1 px-2 text-[0.62rem] text-amber-300 hover:text-white"
                          title="Download MP3"
                        >
                          <FileAudio className="h-3 w-3" />
                          <span>MP3</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadWav(take)}
                          className="btn btn-secondary py-1 px-2 text-[0.62rem] text-emerald-300 hover:text-white"
                          title="Download WAV"
                        >
                          <Download className="h-3 w-3" />
                          <span>WAV</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Right Pane: Voice Parameters & Synthesis */}
        <section className="config-pane p-5 sm:p-8 bg-white/[0.015] overflow-y-auto space-y-5">
          {/* Studio Presets Bar */}
          <PresetManager
            currentVoice={selectedVoice}
            currentEmotion={selectedEmotion}
            pace={pace}
            pitch={pitch}
            currentLanguage={selectedLanguage}
            onApplyPreset={handleApplyPreset}
          />

          {/* Language Selection (placed first so recommended voices adapt) */}
          <div className="control-row">
            <LanguageSelector
              selectedLanguage={selectedLanguage.code}
              onChange={handleLanguageChange}
            />
          </div>

          {/* Voice Persona Selection (clean and never overlapping) */}
          <div className="control-row">
            <VoiceSelector
              selectedVoice={selectedVoice.id}
              onChange={(v) => setSelectedVoice(v)}
              favoriteVoices={favoriteVoices}
              onToggleFavorite={toggleFavoriteVoice}
              currentEmotion={selectedEmotion}
              pace={pace}
              pitch={pitch}
              customApiKey={customApiKey}
              currentLanguage={selectedLanguage}
            />
          </div>

          {/* Emotion & Style Delivery */}
          <div className="control-row">
            <EmotionSelector
              selectedEmotion={selectedEmotion.name}
              onChange={handleEmotionChange}
              favoriteEmotions={favoriteEmotions}
              onToggleFavorite={toggleFavoriteEmotion}
            />
          </div>

          {/* Pace & Pitch Controls */}
          <div className="control-row">
            <PaceAndPitchControls
              pace={pace}
              pitch={pitch}
              onPaceChange={setPace}
              onPitchChange={setPitch}
            />
          </div>

          {/* Big Primary Generate Action Button */}
          <button
            type="button"
            disabled={isGenerating || cooldownSeconds > 0}
            onClick={handleGenerateVoice}
            className="btn btn-primary font-syne font-extrabold text-sm tracking-wider"
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                <span>SYNTHESIZING {selectedVoice.name.toUpperCase()}...</span>
              </>
            ) : cooldownSeconds > 0 ? (
              <>
                <Clock className="h-4 w-4 animate-spin text-indigo-200" />
                <span>AUTO-RETRY IN {cooldownSeconds}S...</span>
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                <span>GENERATE VOICE ({selectedVoice.name.toUpperCase()})</span>
              </>
            )}
          </button>

          {/* Recommended Voices for Selected Language */}
          <div className="rounded-[4px] border border-[var(--ink-faint)] bg-[#0d0f14] p-3.5 space-y-2">
            <div className="label justify-between mb-2">
              <span className="flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5 text-indigo-400" />
                Top Voices for {selectedLanguage.name}
              </span>
              <span className="font-mono-code text-[0.62rem] text-amber-300">
                {selectedLanguage.recommendedVoices?.length || 0} Recommended
              </span>
            </div>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-0.5">
              {(selectedLanguage.recommendedVoices || ['Puck', 'Charon', 'Kore']).slice(0, 4).map((recVoiceId) => {
                const recVoice = GEMINI_VOICES.find((v) => v.id === recVoiceId);
                if (!recVoice) return null;
                const isSelected = selectedVoice.id === recVoice.id;
                const suitability = selectedLanguage.voiceSuitability?.[recVoice.id] || recVoice.character;

                return (
                  <div
                    key={recVoice.id}
                    onClick={() => setSelectedVoice(recVoice)}
                    className={`p-2.5 rounded-[3px] border cursor-pointer transition flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-600/15'
                        : 'border-[var(--ink-faint)] hover:border-slate-600 bg-black/30 hover:bg-white/5'
                    }`}
                    title={`Click to switch to ${recVoice.name}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-xs ${isSelected ? 'text-indigo-300' : 'text-white'}`}>
                          {recVoice.name} ({recVoice.gender})
                        </span>
                        {isSelected && (
                          <span className="font-mono-code text-[0.58rem] bg-indigo-500/20 text-indigo-300 px-1 py-0.2 rounded-[2px]">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--ink-muted)] truncate mt-0.5">
                        {suitability}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Variation 2 Footer */}
      <footer className="px-6 py-3 border-t border-[var(--ink-faint)] font-mono-code text-[0.65rem] text-[var(--ink-muted)] flex flex-wrap items-center justify-between gap-2 bg-[#090a0d]">
        <div>VOXSTUDIO • GEMINI TTS 24KHZ ENGINE • MP3 & WAV</div>
        <div>GLOBAL & INDIAN HYBRID LANGUAGES • KANGLISH · HINGLISH · TANGLISH · TENGLISH · MANGLISH</div>
      </footer>

      {/* Voice Audition Modal */}
      <VoiceAuditionModal
        isOpen={isAuditionModalOpen}
        selectedVoiceId={selectedVoice.id}
        onClose={() => setIsAuditionModalOpen(false)}
        onSelectVoice={(v) => setSelectedVoice(v)}
        favoriteVoices={favoriteVoices}
        onToggleFavorite={toggleFavoriteVoice}
        currentEmotion={selectedEmotion}
        pace={pace}
        pitch={pitch}
        customApiKey={customApiKey}
        currentLanguage={selectedLanguage}
      />

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        currentKey={customApiKey}
        onSaveKey={handleSaveApiKey}
      />
    </div>
  );
}
