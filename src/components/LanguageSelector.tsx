import React, { useState } from 'react';
import { Globe2, Check, ChevronDown } from 'lucide-react';
import { LANGUAGES, LanguageOption } from '../types/tts';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onChange: (language: LanguageOption) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const current =
    LANGUAGES.find(
      (l) => l.code === selectedLanguage || l.name.toLowerCase() === selectedLanguage.toLowerCase()
    ) || LANGUAGES[0];

  return (
    <div className="relative">
      <div className="label justify-between mb-1.5">
        <span className="flex items-center gap-1.5">
          <Globe2 className="h-3.5 w-3.5 text-indigo-400" />
          Language
        </span>
        <span className="font-mono-code text-[0.62rem] text-[var(--ink-muted)]">
          {LANGUAGES.length} Languages & Hybrid Mixes
        </span>
      </div>

      {/* Main Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left rounded-[4px] border border-[var(--ink-faint)] bg-[#0d0f14] hover:border-[rgba(226,232,240,0.25)] p-3 transition flex items-center justify-between gap-3 focus:outline-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl shrink-0">{current.flag}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--ink)] text-sm">{current.name}</span>
              <span className="text-xs text-indigo-300 font-medium">({current.nativeName})</span>
            </div>
            <p className="text-xs text-[var(--ink-muted)] truncate mt-0.5">{current.badge}</p>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-[var(--ink-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-[4px] border border-[var(--ink-faint)] bg-[#0d0f15] shadow-2xl p-2 space-y-1 backdrop-blur-xl max-h-[380px] overflow-y-auto">
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === current.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    onChange(lang);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left rounded-[4px] p-2.5 transition flex items-center justify-between gap-3 border ${
                    isSelected
                      ? 'bg-indigo-600/15 border-indigo-500/50 text-white'
                      : 'border-transparent hover:border-[var(--ink-faint)] hover:bg-white/5 text-[var(--ink)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{lang.name}</span>
                        <span className="text-xs text-indigo-300">({lang.nativeName})</span>
                      </div>
                      <p className="text-xs text-[var(--ink-muted)] mt-0.5">{lang.badge}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-indigo-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
