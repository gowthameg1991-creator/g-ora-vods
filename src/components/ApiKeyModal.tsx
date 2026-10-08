import React, { useState } from 'react';
import { Key, ExternalLink, Check, X, Shield, Sparkles, AlertCircle } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKey: string;
  onSaveKey: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  currentKey,
  onSaveKey,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(currentKey);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKey(apiKeyInput.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  const handleClear = () => {
    setApiKeyInput('');
    onSaveKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-[4px] border border-[var(--ink-faint)] bg-[#0d0f15] p-6 shadow-2xl text-[var(--ink)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-[2px] p-1.5 text-[var(--ink-muted)] hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="voice-avatar shrink-0">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-syne text-base font-extrabold text-white">Gemini API Key Settings</h2>
            <p className="text-xs text-[var(--ink-muted)]">
              Get unlimited authentic Gemini TTS voice generations
            </p>
          </div>
        </div>

        {/* Why use custom key info box */}
        <div className="mb-4 rounded-[3px] border border-indigo-500/30 bg-indigo-950/30 p-3 text-xs text-indigo-200 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-indigo-300">
            <Sparkles className="h-4 w-4" />
            <span>Why add your own Gemini API Key?</span>
          </div>
          <p className="text-[11px] text-indigo-200/90 leading-relaxed">
            The shared free tier has rate limits. Adding your personal free Google AI Studio API key enables 100% authentic Gemini TTS voice synthesis (<code className="text-indigo-300">Puck</code>, <code className="text-indigo-300">Charon</code>, etc.) with zero waiting.
          </p>
          <div className="pt-1">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-indigo-400 hover:text-indigo-200 underline text-[11px]"
            >
              <span>Get a Free API Key from Google AI Studio</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label mb-1">
              Your Gemini API Key:
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="glass-input font-mono-code text-xs py-2.5"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[var(--ink-muted)] font-mono-code">
            <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Stored securely in your local browser storage only.</span>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-[var(--ink-faint)]">
            {currentKey ? (
              <button
                type="button"
                onClick={handleClear}
                className="font-mono-code text-[0.65rem] text-rose-400 hover:underline py-1"
              >
                Remove Custom Key
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary w-auto text-xs py-2 px-4"
              >
                {isSaved ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Key</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
