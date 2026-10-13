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
  Globe2,
  Mic2,
  Gauge,
  SlidersHorizontal,
  FileText,
  Trash2,
  CheckSquare,
  Square,
  Archive,
  CheckCircle2,
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
import { VoiceMatchSection } from './components/VoiceMatchSection';
import {
  base64ToWavArrayBuffer,
  processAudio,
  cleanScriptDirections,
  parseScriptSections,
} from './utils/audioEngine';
import { wavBlobToMp3Blob } from './utils/wavUtils';
import { auth, googleProvider } from './lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import JSZip from 'jszip';

export default function App() {
  // State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedTakeIds, setSelectedTakeIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign-in error:', error);
      alert('Sign-in failed. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  const toggleSelectAllTakes = () => {
    if (selectedTakeIds.size === history.length) {
      setSelectedTakeIds(new Set());
    } else {
      setSelectedTakeIds(new Set(history.map((t) => t.id)));
    }
  };

  const toggleSelectTake = (id: string) => {
    setSelectedTakeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteTake = (id: string) => {
    setHistory((prev) => prev.filter((t) => t.id !== id));
    setSelectedTakeIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (currentTake?.id === id) {
      setCurrentTake(history.find((t) => t.id !== id) || null);
    }
  };

  const handleDownloadSelectedZip = async () => {
    const selectedTakes = history.filter((t) => selectedTakeIds.has(t.id));
    if (selectedTakes.length === 0) return;

    try {
      const zip = new JSZip();
      for (const take of selectedTakes) {
        const filename = take.fileName || `vox_${take.voice}_take.wav`;
        zip.file(filename, take.wavBlob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gowthamora_vods_bundle_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('ZIP download error:', e);
      alert('Failed to generate ZIP bundle.');
    }
  };

  const [script, setScript] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(
    GEMINI_VOICES.find((v) => v.id === 'Iapetus') || GEMINI_VOICES[0]
  );
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(
    LANGUAGES.find((l) => l.code === 'en-in') || LANGUAGES[0]
  );
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionOption>(
    EMOTIONS.find((e) => e.id === 'friendly') || EMOTIONS[0]
  );
  const [pace, setPace] = useState<number>(0.98); // 98%
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
        setSessionQuota(100);
        setCooldownSeconds(0);
        setCooldownReadyNotification(false);
        setIsCooldownBannerDismissed(false);
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
  const [sessionQuota, setSessionQuota] = useState<number>(100);
  const [cooldownReadyNotification, setCooldownReadyNotification] = useState<boolean>(false);
  const [isCooldownBannerDismissed, setIsCooldownBannerDismissed] = useState<boolean>(false);
  const [currentTake, setCurrentTake] = useState<GeneratedVoiceRecord | null>(null);
  const [history, setHistory] = useState<GeneratedVoiceRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [playTrigger, setPlayTrigger] = useState<number>(0);

  // Emotion change handler - preserves user's chosen voice, pace, and language
  const handleEmotionChange = (emotion: EmotionOption) => {
    setSelectedEmotion(emotion);
  };

  // Language switch handler - preserves user's chosen voice
  const handleLanguageChange = (lang: LanguageOption) => {
    setSelectedLanguage(lang);
  };

  const resolveMatchedLanguage = (langStr?: string): LanguageOption => {
    if (!langStr) return LANGUAGES.find((item) => item.code === 'en-in') || LANGUAGES[0];
    const norm = langStr.toLowerCase().trim();

    const matched = LANGUAGES.find((item) => {
      const code = item.code.toLowerCase();
      const name = item.name.toLowerCase();
      if (code === norm || name === norm) return true;
      if (norm === 'en-in' && code === 'en-in') return true;
      if (norm.includes('india') && (code === 'en-in' || name.includes('india') || name.includes('indian'))) return true;
      if (norm.includes('kanglish') || norm.includes('kannada')) return code === 'kanglish';
      if (norm.includes('hinglish') || norm.includes('hindi')) return code === 'hinglish';
      if (norm.includes('tamil')) return code === 'tamil_en';
      if (norm.includes('telugu')) return code === 'telugu_en';
      if (norm.includes('malayalam') || norm.includes('manglish')) return code === 'malayalam_en';
      return false;
    });

    return matched || LANGUAGES.find((item) => item.code === 'en-in') || LANGUAGES[0];
  };

  const handleApplyMatchedSettings = (settings: { voice: string; emotion: string; pace: number; language: string; pitch: string }) => {
    const v = GEMINI_VOICES.find(item => item.name.toLowerCase() === settings.voice.toLowerCase()) || GEMINI_VOICES[0];
    setSelectedVoice(v);
    const e = EMOTIONS.find(item => item.name.toLowerCase() === settings.emotion.toLowerCase()) || EMOTIONS[0];
    setSelectedEmotion(e);
    setPace(settings.pace);
    setPitch(settings.pitch as PitchLevel);
    const l = resolveMatchedLanguage(settings.language);
    setSelectedLanguage(l);
    setErrorMessage(null);
    return { v, e, l };
  };

  const handleGenerateMatchedScript = async (matchScript: string, settings: { voice: string; emotion: string; pace: number; language: string; pitch: string }) => {
    const { v, e, l } = handleApplyMatchedSettings(settings);
    setScript(matchScript);
    await handleGenerateVoice({
      script: matchScript,
      voice: v,
      language: l,
      emotion: e,
      pace: settings.pace,
      pitch: settings.pitch as PitchLevel,
      title: 'Matched Voice-Over',
    });
  };

  // Preset apply handler - applies Emotion, Pace, and Pitch styling without clobbering chosen Voice or Language
  const handleApplyPreset = (preset: StudioPreset) => {
    const foundEmotion = EMOTIONS.find(
      (e) => e.id.toLowerCase() === preset.emotionId.toLowerCase()
    );
    if (foundEmotion) {
      setSelectedEmotion(foundEmotion);
    }

    setPace(preset.pace);
    setPitch(preset.pitch);

    // If custom user-created preset explicitly specified a voice, apply it
    if (!preset.isSystem && preset.voiceId) {
      const foundVoice = GEMINI_VOICES.find(
        (v) => v.id.toLowerCase() === preset.voiceId.toLowerCase()
      );
      if (foundVoice) {
        setSelectedVoice(foundVoice);
      }
    }

    // Only switch language if preset is an explicit regional language preset (e.g. Kanglish, Hinglish)
    if (preset.languageCode && preset.languageCode !== 'en') {
      const foundLang = LANGUAGES.find((l) => l.code === preset.languageCode);
      if (foundLang) {
        setSelectedLanguage(foundLang);
      }
    }
  };

  // Main voice synthesis handler - guarantees authentic Gemini AI Voice
  const handleGenerateVoice = async (overrideParams?: {
    script?: string;
    voice?: VoiceOption;
    language?: LanguageOption;
    emotion?: EmotionOption;
    pace?: number;
    pitch?: PitchLevel;
    title?: string;
  }) => {
    const targetScript = overrideParams?.script !== undefined ? overrideParams.script : script;
    const targetVoice = overrideParams?.voice || selectedVoice;
    const targetLanguage = overrideParams?.language || selectedLanguage;
    const targetEmotion = overrideParams?.emotion || selectedEmotion;
    const targetPace = overrideParams?.pace !== undefined ? overrideParams.pace : pace;
    const targetPitch = overrideParams?.pitch || pitch;

    if (!targetScript.trim()) {
      setErrorMessage('Please enter or paste a script to generate voice-over.');
      return;
    }

    if (cooldownSeconds > 0 || (!customApiKey && sessionQuota <= 0)) {
      setErrorMessage(
        `Session quota is currently cooling down (${cooldownSeconds}s remaining). Please wait until the cooldown period finishes.`
      );
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setCooldownReadyNotification(false);

    try {
      const sections = parseScriptSections(targetScript);
      if (sections.length === 0) {
        throw new Error('Please enter or paste a script to generate voice-over.');
      }

      const newTakes: GeneratedVoiceRecord[] = [];

      for (const section of sections) {
        const sanitizedScript = cleanScriptDirections(section.content);
        if (!sanitizedScript) continue;

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
            voice: targetVoice.id,
            language: targetLanguage.code,
            emotion: targetEmotion.name,
            pace: targetPace,
            pitch: targetPitch,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success || !data.audioBase64) {
          if (response.status === 429 || data.error?.includes('cooling down') || data.retryAfterSec) {
            const waitTime = data.retryAfterSec || 30;
            setCooldownSeconds(waitTime);
            setSessionQuota(0); // Quota strictly locks to 0% during cooldown
            setIsCooldownBannerDismissed(false);
            return;
          }
          throw new Error(data.error || 'Voice synthesis failed. Please try again.');
        }

        // Successful audio generation for this section
        setCooldownSeconds(0);
        setCooldownReadyNotification(false);
        setIsCooldownBannerDismissed(false);
        if (!customApiKey) {
          setSessionQuota((prev) => {
            const next = Math.max(0, prev - 20);
            if (next === 0) {
              setCooldownSeconds(30);
              setIsCooldownBannerDismissed(false);
            }
            return next;
          });
        }
        const wavArrayBuffer = base64ToWavArrayBuffer(data.audioBase64, data.mimeType);
        const processed = await processAudio(wavArrayBuffer, targetPace, targetPitch);
        const audioUrl = URL.createObjectURL(processed.wavBlob);
        const safeVoice = targetVoice.id.toLowerCase();
        const safeEmotion = targetEmotion.id.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const safeLang = targetLanguage.code;
        const takeTitle = overrideParams?.title || section.title;
        const safeTitle = takeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `vox_${safeVoice}_${safeTitle}_${safeLang}_${Math.round(targetPace * 100)}pct.wav`;

        const createdRecord: GeneratedVoiceRecord = {
          id: `take_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: Date.now(),
          script: sanitizedScript,
          voice: targetVoice.id,
          language: targetLanguage.name,
          emotion: targetEmotion.name,
          pace: targetPace,
          pitch: targetPitch,
          audioUrl,
          wavBlob: processed.wavBlob,
          mp3Blob: processed.mp3Blob,
          durationSec: Number(processed.durationSec.toFixed(1)),
          sampleRate: data.sampleRate || 24000,
          fileSizeBytes: processed.wavBlob.size,
          fileName,
          source: 'gemini',
          title: takeTitle,
        };

        newTakes.push(createdRecord);
      }

      if (newTakes.length > 0) {
        setCurrentTake(newTakes[0]);
        setPlayTrigger(Date.now());
        setHistory((prev) => [...newTakes, ...prev].slice(0, 20));
      }
    } catch (err: unknown) {
      console.error('Generation error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred during voice generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Timer countdown without erratic auto-retry loops
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Cooldown finished: cleanly restore quota to 100% and notify user
          setSessionQuota(100);
          setCooldownReadyNotification(true);
          setIsCooldownBannerDismissed(false);
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
        <div className="brand-h font-syne tracking-tight text-white">
          GOWTHAMORA<span className="text-indigo-400 font-bold">-</span>VODS <span className="badge">AI STUDIO</span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* User Auth Section */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-700/60 px-3 py-1.5 rounded-md">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[0.65rem] font-bold">
                  {currentUser.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="text-xs text-neutral-200 font-medium hidden sm:inline">{currentUser.displayName || currentUser.email}</span>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs text-neutral-400 hover:text-white ml-2 underline cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSignIn}
              className="btn bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3 py-1.5 text-xs flex items-center gap-1.5 rounded-[4px] transition-colors"
            >
              <span>Sign In / Sign Up</span>
            </button>
          )}

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

          {/* Session Quota Meter (0-100% scale) */}
          <div
            className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-700/60 px-3 py-1.5 rounded-md"
            title={
              customApiKey
                ? 'Custom Gemini API Key Active — Unlimited Session Generations'
                : cooldownSeconds > 0 || sessionQuota <= 0
                ? `Session quota is 0% (Cooling down: ${cooldownSeconds}s remaining). Generation is blocked until ready.`
                : `Session quota remaining: ${sessionQuota}%`
            }
          >
            <span className="text-[11px] text-neutral-300 font-medium hidden sm:inline">Session Quota:</span>
            <div className="w-20 bg-neutral-800 h-2 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full transition-all duration-300 ${
                  customApiKey
                    ? 'bg-emerald-500'
                    : cooldownSeconds > 0 || sessionQuota <= 0
                    ? 'bg-rose-500 animate-pulse'
                    : sessionQuota > 50
                    ? 'bg-emerald-500'
                    : sessionQuota > 20
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{
                  width: `${customApiKey ? 100 : cooldownSeconds > 0 || sessionQuota <= 0 ? 0 : sessionQuota}%`,
                }}
              />
            </div>
            <span
              className={`font-mono-code text-[0.65rem] font-bold ${
                cooldownSeconds > 0 || sessionQuota <= 0 ? 'text-rose-400' : 'text-neutral-200'
              }`}
            >
              {customApiKey
                ? '100%'
                : cooldownSeconds > 0 || sessionQuota <= 0
                ? `0% (${cooldownSeconds}s)`
                : `${sessionQuota}%`}
            </span>
          </div>

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
      <main className="grid grid-cols-1 lg:grid-cols-[60%_40%] flex-1 border-b-2 border-[var(--ink-faint)] overflow-hidden">
        {/* Left Pane: Script Editor & Production Output */}
        <section className="editor-pane p-5 sm:p-8 lg:border-r-2 lg:border-[var(--ink-faint)] overflow-y-auto space-y-6">
          {/* Active Cooling Down Banner */}
          {cooldownSeconds > 0 && !isCooldownBannerDismissed && (
            <div className="rounded-[4px] border border-amber-500/40 bg-amber-950/40 p-4 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 animate-spin text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs">
                        Session Quota Cooling Down (0% Available)
                      </span>
                      <span className="font-mono-code text-[0.62rem] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded-[2px]">
                        Restoring in {cooldownSeconds}s
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-amber-200/80">
                      Audio generation is temporarily paused while quota recovers. You will be notified the instant quota is restored. Or enter your own free Gemini key for unlimited generation.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsApiKeyModalOpen(true)}
                    className="btn btn-primary text-xs py-1.5 px-3 w-auto bg-amber-600 hover:bg-amber-500 text-white"
                  >
                    Enter Free API Key
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCooldownBannerDismissed(true)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                    title="Dismiss cooldown banner"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notification: Cooldown Finished & Quota Restored */}
          {cooldownReadyNotification && cooldownSeconds === 0 && (
            <div className="rounded-[4px] border border-emerald-500/50 bg-emerald-950/50 p-4 backdrop-blur-md animate-fade-in shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs">
                        Cooldown Complete — Session Quota Restored to 100%!
                      </span>
                      <span className="font-mono-code text-[0.62rem] text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded-[2px]">
                        Ready to Generate
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-emerald-200/90">
                      The cooling down period has ended. You can now safely generate your voice-over audio.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setCooldownReadyNotification(false);
                      handleGenerateVoice();
                    }}
                    className="btn bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-1.5 px-3 flex items-center gap-1.5 font-medium shadow-sm transition"
                  >
                    <Mic className="h-3.5 w-3.5" />
                    <span>Generate Audio Now</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCooldownReadyNotification(false)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                    title="Dismiss notification"
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

          {/* 1. Script Studio & Editor Card */}
          <div className="card space-y-3 p-4 bg-[#0d0f15]/80 border border-white/10 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              <FileText className="h-4 w-4 text-indigo-400" />
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Script Studio & Editor</h3>
                <p className="text-[11px] text-[var(--ink-muted)]">Compose voice-over script, clean directions, & insert pauses</p>
              </div>
            </div>
            <ScriptEditor
              script={script}
              pace={pace}
              currentLanguage={selectedLanguage}
              onChange={setScript}
              onSelectSample={(sample) => setScript(sample)}
            />
          </div>

          {/* 2. Script Templates & Code-Switching Card */}
          <div className="card space-y-3 p-4 bg-[#0d0f15]/80 border border-white/10 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Script Templates & Code-Switching Samples</h3>
                <p className="text-[11px] text-[var(--ink-muted)]">Quick-start samples tailored for {selectedLanguage.name}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {selectedLanguage.sampleScripts.map((sample) => (
                <button
                  key={sample.title}
                  type="button"
                  onClick={() => setScript(sample.text)}
                  className="btn btn-secondary text-[0.68rem] py-1.5 px-3 flex items-center gap-1.5"
                >
                  <Sparkles className="h-3 w-3 text-indigo-400" />
                  <span>{sample.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Match & Clip Analysis Card */}
          <VoiceMatchSection
            customApiKey={customApiKey}
            onApplySettings={handleApplyMatchedSettings}
            onGenerateMatchedScript={handleGenerateMatchedScript}
            allVoices={GEMINI_VOICES}
            isCoolingDown={cooldownSeconds > 0 || (!customApiKey && sessionQuota <= 0)}
            cooldownSeconds={cooldownSeconds}
            sessionQuota={customApiKey ? 100 : sessionQuota}
          />

          {/* 3. Audio Preview & Export Card */}
          <div className="card space-y-3 p-4 bg-[#0d0f15]/80 border border-white/10 rounded-lg shadow-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-emerald-400" />
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Audio Preview & Export</h3>
                  <p className="text-[11px] text-[var(--ink-muted)]">Play generated take or export in WAV & MP3 format</p>
                </div>
              </div>
              {currentTake && (
                <span className="font-mono-code text-[0.65rem] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
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

          {/* 4. Production History Card (if any) */}
          {history.length > 0 && (
            <div className="card space-y-3 p-4 bg-[#0d0f15]/80 border border-white/10 rounded-lg shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-indigo-400" />
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Production History & Takes ({history.length})</h3>
                    <p className="text-[11px] text-[var(--ink-muted)]">Select multiple takes to download as ZIP or delete rows</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAllTakes}
                    className="btn btn-secondary py-1 px-2.5 text-[0.65rem] flex items-center gap-1"
                  >
                    {selectedTakeIds.size === history.length ? (
                      <CheckSquare className="h-3.5 w-3.5 text-indigo-400" />
                    ) : (
                      <Square className="h-3.5 w-3.5" />
                    )}
                    <span>{selectedTakeIds.size === history.length ? 'Deselect All' : 'Select All'}</span>
                  </button>

                  {selectedTakeIds.size > 0 && (
                    <button
                      type="button"
                      onClick={handleDownloadSelectedZip}
                      className="btn btn-primary py-1 px-2.5 text-[0.65rem] flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white"
                      title="Download selected takes as a ZIP archive"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      <span>Download ZIP ({selectedTakeIds.size})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setHistory([]);
                      setSelectedTakeIds(new Set());
                    }}
                    className="font-mono-code text-[0.62rem] text-[var(--ink-muted)] hover:text-rose-400 transition"
                  >
                    Clear all
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {history.map((take) => {
                  const isSelected = currentTake?.id === take.id;
                  const isChecked = selectedTakeIds.has(take.id);
                  return (
                    <div
                      key={take.id}
                      className={`p-2.5 rounded-[3px] border transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-indigo-600/15 border-indigo-500/50'
                          : 'bg-black/30 border-[var(--ink-faint)] hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSelectTake(take.id)}
                          className="text-slate-400 hover:text-white"
                          title="Select take for ZIP bundle"
                        >
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4 text-indigo-400" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-500" />
                          )}
                        </button>
                      </div>

                      <div
                        className="min-w-0 flex-1 cursor-pointer"
                        onClick={() => handlePlayTake(take)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-white">{take.title || take.voice}</span>
                          {take.title && (
                            <span className="font-mono-code text-[0.6rem] px-1.5 py-0.2 rounded-[2px] bg-indigo-500/20 text-indigo-300">
                              {take.voice}
                            </span>
                          )}
                          <span className="font-mono-code text-[0.6rem] px-1.5 py-0.2 rounded-[2px] bg-slate-800 text-slate-300">
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
                        <button
                          type="button"
                          onClick={() => handleDeleteTake(take.id)}
                          className="btn btn-secondary py-1 px-1.5 text-[0.62rem] text-rose-400 hover:text-rose-200 hover:border-rose-800"
                          title="Delete row from preview & history"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
        <section className="config-pane p-5 sm:p-8 bg-white/[0.015] overflow-y-auto space-y-6">
          {/* 1. Studio Presets Card */}
          <div className="card space-y-3 p-4 bg-[#0d0f15]/80 border border-white/10 rounded-lg shadow-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-indigo-400" />
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Studio Presets</h3>
                  <p className="text-[11px] text-[var(--ink-muted)]">Quick configurations & presets</p>
                </div>
              </div>
              <span className="font-mono-code text-[0.62rem] text-[var(--ink-muted)]">Quick Config</span>
            </div>
            <PresetManager
              currentVoice={selectedVoice}
              currentEmotion={selectedEmotion}
              pace={pace}
              pitch={pitch}
              currentLanguage={selectedLanguage}
              onApplyPreset={handleApplyPreset}
            />
          </div>

          {/* 2. Language & Accent Card */}
          <div className="card space-y-3 p-4 bg-[#0d0f15]/80 border border-white/10 rounded-lg shadow-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-indigo-400" />
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Language & Accent</h3>
                  <p className="text-[11px] text-[var(--ink-muted)]">Language-switching & Indian accents</p>
                </div>
              </div>
              <span className="font-mono-code text-[0.62rem] text-indigo-300">Language-Switching</span>
            </div>
            <LanguageSelector
              selectedLanguage={selectedLanguage.code}
              onChange={handleLanguageChange}
            />
          </div>

          {/* 3. Voice Persona Card */}
          <div className="card space-y-3 p-4 bg-[#0d0f15]/80 border border-white/10 rounded-lg shadow-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Mic2 className="h-4 w-4 text-indigo-400" />
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Voice Persona</h3>
                  <p className="text-[11px] text-[var(--ink-muted)]">Gemini native voices & custom voices</p>
                </div>
              </div>
              <span className="font-mono-code text-[0.62rem] text-amber-300">Native Voices</span>
            </div>
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

          {/* 4. Emotion & Delivery Style Card */}
          <div className="card space-y-3 p-4 bg-[#0d0f15]/80 border border-white/10 rounded-lg shadow-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Emotion & Delivery Style</h3>
                  <p className="text-[11px] text-[var(--ink-muted)]">Tone conditioning & emotion presets</p>
                </div>
              </div>
              <span className="font-mono-code text-[0.62rem] text-[var(--ink-muted)]">Tone Conditioning</span>
            </div>
            <EmotionSelector
              selectedEmotion={selectedEmotion.name}
              onChange={handleEmotionChange}
              favoriteEmotions={favoriteEmotions}
              onToggleFavorite={toggleFavoriteEmotion}
            />
          </div>

          {/* 5. Speaking Pace Card */}
          <div className="card space-y-3 p-4 bg-[#0d0f15]/80 border border-white/10 rounded-lg shadow-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-indigo-400" />
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Speaking Pace</h3>
                  <p className="text-[11px] text-[var(--ink-muted)]">Adjustable speed pacing</p>
                </div>
              </div>
              <span className="font-mono-code text-[0.62rem] text-indigo-400 font-bold">{Math.round(pace * 100)}% Speed</span>
            </div>
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
            disabled={isGenerating || cooldownSeconds > 0 || (!customApiKey && sessionQuota <= 0)}
            onClick={() => handleGenerateVoice()}
            className={`btn font-syne font-extrabold text-sm tracking-wider ${
              isGenerating || cooldownSeconds > 0 || (!customApiKey && sessionQuota <= 0)
                ? 'bg-neutral-800 text-neutral-400 border border-neutral-700 cursor-not-allowed opacity-80'
                : 'btn-primary'
            }`}
            title={
              cooldownSeconds > 0 || (!customApiKey && sessionQuota <= 0)
                ? `Session quota is cooling down (${cooldownSeconds}s remaining). Generation is blocked until ready.`
                : 'Generate audio with selected voice and settings'
            }
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                <span>SYNTHESIZING {selectedVoice.name.toUpperCase()}...</span>
              </>
            ) : cooldownSeconds > 0 || (!customApiKey && sessionQuota <= 0) ? (
              <>
                <Clock className="h-4 w-4 animate-spin text-amber-300" />
                <span>COOLING DOWN ({cooldownSeconds}S) • 0% QUOTA</span>
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
        <div>GOWTHAMORA-VODS • GEMINI TTS 24KHZ ENGINE • MP3 & WAV</div>
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
