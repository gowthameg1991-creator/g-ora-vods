import React, { useState } from 'react';
import { Upload, Mic, Play, Sparkles, CheckCircle2, AlertCircle, ArrowRight, FileAudio, Clock } from 'lucide-react';

interface VoiceMatchSectionProps {
  customApiKey: string | null;
  onApplySettings: (settings: { voice: string; emotion: string; pace: number; language: string; pitch: string }) => void;
  onGenerateMatchedScript: (script: string, settings: { voice: string; emotion: string; pace: number; language: string; pitch: string }) => void;
  allVoices: Array<{ id: string; name: string }>;
  isCoolingDown?: boolean;
  cooldownSeconds?: number;
  sessionQuota?: number;
}

export const VoiceMatchSection: React.FC<VoiceMatchSectionProps> = ({
  customApiKey,
  onApplySettings,
  onGenerateMatchedScript,
  allVoices,
  isCoolingDown = false,
  cooldownSeconds = 0,
  sessionQuota = 100,
}) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBase64, setAudioBase64] = useState<string>('');
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    transcript?: string;
    estimatedVoice?: string;
    estimatedEmotion?: string;
    estimatedPace?: number;
    estimatedLanguage?: string;
    estimatedPitch?: string;
    summary?: string;
  } | null>(null);

  const [overrideVoice, setOverrideVoice] = useState<string>('Charon');
  const [overrideEmotion, setOverrideEmotion] = useState<string>('friendly');
  const [overridePace, setOverridePace] = useState<number>(98);
  const [overrideLanguage, setOverrideLanguage] = useState<string>('en-in');
  const [overridePitch, setOverridePitch] = useState<string>('Default');

  const [additionalScript, setAdditionalScript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFile(file);
    setError(null);
    setAnalysisResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAudioBase64(result);
      setAudioPreviewUrl(URL.createObjectURL(file));
    };
    reader.onerror = () => {
      setError('Failed to read audio file.');
    };
    reader.readAsDataURL(file);
  };

  const normalizeLanguage = (lang?: string): string => {
    if (!lang) return 'en-in';
    const lower = lang.toLowerCase().trim();
    if (lower.includes('in') || lower.includes('india') || lower === 'en-in' || lower === 'indian_en') return 'en-in';
    if (lower.includes('kanglish') || lower.includes('kannada') || lower === 'kn-en') return 'kanglish';
    if (lower.includes('hinglish') || lower.includes('hindi') || lower === 'hi-en') return 'hinglish';
    if (lower.includes('tamil') || lower === 'tamil_en' || lower === 'ta-en') return 'tamil_en';
    if (lower.includes('telugu') || lower === 'telugu_en' || lower === 'te-en') return 'telugu_en';
    if (lower.includes('malayalam') || lower.includes('manglish') || lower === 'ml-en') return 'malayalam_en';
    return 'en';
  };

  const handleAnalyze = async () => {
    if (!audioBase64) {
      setError('Please upload an audio recording clip first.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (customApiKey) {
        headers['x-gemini-api-key'] = customApiKey;
      }

      const res = await fetch('/api/match-voice-clip', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          audioBase64,
          mimeType: audioFile?.type || 'audio/mp3',
          fileName: audioFile?.name || '',
        }),
      });

      const responseText = await res.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(`Server returned invalid response (${res.status}): ${responseText.substring(0, 150) || res.statusText}`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze voice clip.');
      }

      const detectedLang = normalizeLanguage(data.estimatedLanguage);

      setAnalysisResult({
        transcript: data.transcript,
        estimatedVoice: data.estimatedVoice,
        estimatedEmotion: data.estimatedEmotion,
        estimatedPace: data.estimatedPace,
        estimatedLanguage: detectedLang,
        estimatedPitch: data.estimatedPitch,
        summary: data.summary,
      });

      setOverrideVoice(data.estimatedVoice || 'Charon');
      setOverrideEmotion(data.estimatedEmotion || 'friendly');
      setOverridePace(Number(data.estimatedPace) || 98);
      setOverrideLanguage(detectedLang);
      setOverridePitch(data.estimatedPitch || 'Default');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMatchedSettings = () => {
    const foundVoice = allVoices.find(
      (v) => v.name.toLowerCase() === overrideVoice.toLowerCase()
    ) || allVoices[0];

    return {
      voice: foundVoice.name,
      emotion: overrideEmotion,
      pace: overridePace / 100,
      language: normalizeLanguage(overrideLanguage),
      pitch: overridePitch,
    };
  };

  const handleApply = () => {
    const settings = getMatchedSettings();
    if (settings) {
      onApplySettings(settings);
    }
  };

  const handleGenerate = () => {
    if (isCoolingDown || sessionQuota <= 0) return;
    const settings = getMatchedSettings();
    if (settings && additionalScript.trim()) {
      onGenerateMatchedScript(additionalScript, settings);
    }
  };

  return (
    <div className="card space-y-4 p-5 bg-[#0d0f15]/90 border border-indigo-500/30 rounded-lg shadow-md">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-indigo-500/20 text-indigo-300">
            <Mic className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Voice Match & Clip Analysis</h3>
            <p className="text-[11px] text-[var(--ink-muted)]">Upload past recordings to detect voice settings & generate matching voice-overs</p>
          </div>
        </div>
        <span className="font-mono-code text-[0.62rem] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
          AI Voice Cloning Match
        </span>
      </div>

      <div className="space-y-3">
        <div className="border-2 border-dashed border-white/15 rounded-lg p-4 text-center hover:border-indigo-500/50 transition bg-black/20">
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
            id="voice-clip-upload"
          />
          <label htmlFor="voice-clip-upload" className="cursor-pointer flex flex-col items-center gap-2">
            <Upload className="h-6 w-6 text-indigo-400" />
            <span className="text-xs font-medium text-white">
              {audioFile ? audioFile.name : 'Click to upload audio recording clip (.mp3, .wav, .m4a)'}
            </span>
            <span className="text-[10px] text-[var(--ink-muted)]">
              Gemini AI will analyze timbre, accent, pitch, and emotion automatically
            </span>
          </label>
        </div>

        {audioPreviewUrl && (
          <div className="flex items-center justify-between bg-black/40 p-2.5 rounded border border-white/10">
            <div className="flex items-center gap-2">
              <FileAudio className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-white truncate max-w-[200px]">{audioFile?.name}</span>
            </div>
            <audio controls src={audioPreviewUrl} className="h-8 max-w-[220px]" />
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          disabled={!audioBase64 || isAnalyzing}
          onClick={handleAnalyze}
          className="btn btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <span>Analyzing Audio Timbre & Voice Settings with Gemini...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>Analyze Clip & Match Voice Settings</span>
            </>
          )}
        </button>

        {analysisResult && (
          <div className="mt-4 p-4 rounded-lg bg-indigo-950/30 border border-indigo-500/40 space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs border-b border-indigo-500/30 pb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Voice Match Analysis Results</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
              <div className="bg-black/30 p-2.5 rounded border border-white/10 space-y-1">
                <label className="text-[var(--ink-muted)] block font-medium">Voice Persona:</label>
                <select
                  value={overrideVoice}
                  onChange={(e) => setOverrideVoice(e.target.value)}
                  className="w-full bg-black/50 text-white font-bold p-1 rounded border border-white/20 text-xs focus:outline-none focus:border-indigo-500"
                >
                  {allVoices.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-black/30 p-2.5 rounded border border-white/10 space-y-1">
                <label className="text-[var(--ink-muted)] block font-medium">Emotion / Tone:</label>
                <select
                  value={overrideEmotion}
                  onChange={(e) => setOverrideEmotion(e.target.value)}
                  className="w-full bg-black/50 text-emerald-300 font-bold p-1 rounded border border-white/20 text-xs focus:outline-none focus:border-indigo-500"
                >
                  {['friendly', 'cheerful', 'serious', 'calm', 'dramatic', 'professional', 'excited', 'empathetic', 'somber', 'curious', 'default'].map((em) => (
                    <option key={em} value={em}>
                      {em.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-black/30 p-2.5 rounded border border-white/10 space-y-1">
                <label className="text-[var(--ink-muted)] block font-medium">Pace Speed ({overridePace}%):</label>
                <input
                  type="range"
                  min="70"
                  max="140"
                  step="2"
                  value={overridePace}
                  onChange={(e) => setOverridePace(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer mt-1.5"
                />
              </div>

              <div className="bg-black/30 p-2.5 rounded border border-white/10 space-y-1">
                <label className="text-[var(--ink-muted)] block font-medium">Language/Accent:</label>
                <select
                  value={overrideLanguage}
                  onChange={(e) => setOverrideLanguage(e.target.value)}
                  className="w-full bg-black/50 text-amber-300 font-bold p-1 rounded border border-white/20 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="en-in">English (India) - Indian Accent & Cadence</option>
                  <option value="kanglish">Kanglish (Bengaluru Kannada + English)</option>
                  <option value="hinglish">Hinglish (Hindi + English)</option>
                  <option value="tamil_en">Tamil + English (Tanglish)</option>
                  <option value="telugu_en">Telugu + English (Tenglish)</option>
                  <option value="malayalam_en">Malayalam + English (Manglish)</option>
                  <option value="en">English (US/UK - Standard)</option>
                </select>
              </div>
            </div>

            {analysisResult.transcript && (
              <div className="text-[11px] text-slate-300 bg-black/40 p-2.5 rounded border border-white/10">
                <span className="font-semibold text-white block mb-1">Detected Clip Transcript:</span>
                <p className="italic">"{analysisResult.transcript}"</p>
              </div>
            )}

            {analysisResult.summary && (
              <p className="text-[11px] text-indigo-200/90">{analysisResult.summary}</p>
            )}

            <div className="space-y-2 pt-2 border-t border-indigo-500/30">
              <label className="text-[11px] font-semibold text-white block">
                Additional Script to Generate with Matched Voice:
              </label>
              <textarea
                value={additionalScript}
                onChange={(e) => setAdditionalScript(e.target.value)}
                placeholder="Type additional script to generate voice-over with these exact matched settings..."
                className="w-full h-20 p-2.5 text-xs bg-black/50 border border-white/15 rounded text-white focus:border-indigo-500 focus:outline-none"
              />

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleApply}
                  className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <ArrowRight className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Apply Settings to Studio</span>
                </button>

                <button
                  type="button"
                  disabled={!additionalScript.trim() || isCoolingDown || sessionQuota <= 0}
                  onClick={handleGenerate}
                  className={`btn text-xs py-1.5 px-3 flex items-center gap-1.5 ${
                    isCoolingDown || sessionQuota <= 0
                      ? 'bg-neutral-800 text-neutral-400 border border-neutral-700 cursor-not-allowed opacity-80'
                      : 'btn-primary bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                  title={
                    isCoolingDown || sessionQuota <= 0
                      ? `Quota cooling down (${cooldownSeconds}s remaining). Generation blocked until cooldown finishes.`
                      : 'Generate voice-over with these matched voice settings'
                  }
                >
                  {isCoolingDown || sessionQuota <= 0 ? (
                    <>
                      <Clock className="h-3.5 w-3.5 animate-spin text-amber-400" />
                      <span>Cooling Down ({cooldownSeconds}s) • 0% Quota</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Generate Voice-Over with Matched Settings</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
