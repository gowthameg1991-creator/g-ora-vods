import React, { useState, useEffect, useRef } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Plus,
  Trash2,
  Sparkles,
  Check,
  SlidersHorizontal,
  ChevronDown,
  Pin,
  PinOff,
  Search,
  X,
} from 'lucide-react';
import {
  VoiceOption,
  EmotionOption,
  PitchLevel,
  LanguageOption,
  StudioPreset,
  DEFAULT_PRESETS,
  GEMINI_VOICES,
  EMOTIONS,
} from '../types/tts';

interface PresetManagerProps {
  currentVoice: VoiceOption;
  currentEmotion: EmotionOption;
  pace: number;
  pitch: PitchLevel;
  currentLanguage: LanguageOption;
  onApplyPreset: (preset: StudioPreset) => void;
}

const STORAGE_KEY = 'vox_user_presets_v2';
const PINNED_STORAGE_KEY = 'vox_pinned_presets_v2';

// Sensible default pinned presets for quick 1-click on-screen access
const DEFAULT_PINNED_IDS = [
  'preset_charon_friendly_98',
  'preset_puck_kanglish_tech',
  'preset_iapetus_casual_vlog',
  'preset_charon_cinematic_documentary',
];

export const PresetManager: React.FC<PresetManagerProps> = ({
  currentVoice,
  currentEmotion,
  pace,
  pitch,
  currentLanguage,
  onApplyPreset,
}) => {
  // All presets (system presets + user custom presets)
  const [presets, setPresets] = useState<StudioPreset[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const userCustom = Array.isArray(parsed) ? parsed.filter((p) => !p.isSystem) : [];
        return [...DEFAULT_PRESETS, ...userCustom];
      }
    } catch (e) {
      console.warn('Failed to load presets from localStorage', e);
    }
    return DEFAULT_PRESETS;
  });

  // Pinned preset IDs that appear on screen
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(PINNED_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load pinned presets from localStorage', e);
    }
    return DEFAULT_PINNED_IDS;
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Sync custom presets to localStorage
  const saveCustomPresetsToStorage = (updatedList: StudioPreset[]) => {
    try {
      const customOnly = updatedList.filter((p) => !p.isSystem);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customOnly));
    } catch (e) {
      console.warn('Failed to save presets to localStorage', e);
    }
  };

  // Sync pinned preset IDs to localStorage
  const savePinnedIdsToStorage = (updatedIds: string[]) => {
    try {
      localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(updatedIds));
    } catch (e) {
      console.warn('Failed to save pinned presets to localStorage', e);
    }
  };

  const togglePin = (presetId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPinnedIds((prev) => {
      const updated = prev.includes(presetId)
        ? prev.filter((id) => id !== presetId)
        : [...prev, presetId];
      savePinnedIdsToStorage(updated);
      return updated;
    });
  };

  // Find if current settings match an existing preset
  const matchingPreset = presets.find(
    (p) =>
      p.voiceId.toLowerCase() === currentVoice.id.toLowerCase() &&
      p.emotionId.toLowerCase() === currentEmotion.id.toLowerCase() &&
      Math.abs(p.pace - pace) < 0.01 &&
      p.pitch === pitch
  );

  const handleOpenSaveModal = () => {
    const defaultName = `${currentVoice.name} ${currentEmotion.name} (${Math.round(pace * 100)}%)`;
    setNewPresetName(defaultName);
    setNewPresetDesc(
      `${currentVoice.name} with ${currentEmotion.name} delivery at ${Math.round(pace * 100)}% pace`
    );
    setIsSaveModalOpen(true);
  };

  const handleConfirmSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const newPresetId = `preset_custom_${Date.now()}`;
    const newPreset: StudioPreset = {
      id: newPresetId,
      name: newPresetName.trim(),
      description: newPresetDesc.trim() || undefined,
      voiceId: currentVoice.id,
      emotionId: currentEmotion.id,
      pace: Number(pace.toFixed(2)),
      pitch,
      languageCode: currentLanguage.code,
      isSystem: false,
      createdAt: Date.now(),
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    saveCustomPresetsToStorage(updated);

    // Auto-pin newly created custom preset to screen
    const updatedPinned = [...pinnedIds, newPresetId];
    setPinnedIds(updatedPinned);
    savePinnedIdsToStorage(updatedPinned);

    setIsSaveModalOpen(false);
    setSavedSuccessMsg(`Saved and pinned "${newPreset.name}"!`);
    setTimeout(() => setSavedSuccessMsg(null), 3500);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    saveCustomPresetsToStorage(updated);

    const updatedPinned = pinnedIds.filter((pid) => pid !== id);
    setPinnedIds(updatedPinned);
    savePinnedIdsToStorage(updatedPinned);
  };

  // Filter presets for search in dropdown
  const filteredPresets = presets.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      p.voiceId.toLowerCase().includes(q) ||
      p.emotionId.toLowerCase().includes(q) ||
      (p.languageCode && p.languageCode.toLowerCase().includes(q))
    );
  });

  // Presets currently pinned to screen
  const pinnedPresets = presets.filter((p) => pinnedIds.includes(p.id));

  return (
    <div className="rounded-[4px] border border-[var(--ink-faint)] bg-[#0d0f14] p-3 space-y-3">
      {/* Top Header Row with Dropdown Trigger and Save Action */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <SlidersHorizontal className="h-3 w-3" />
          </div>
          <div>
            <div className="label mb-0 flex items-center gap-1.5">
              <span>Studio Presets</span>
              {matchingPreset ? (
                <span className="font-mono-code text-[0.6rem] text-emerald-300 flex items-center gap-1 lowercase">
                  <Check className="h-2.5 w-2.5" />
                  ({matchingPreset.name})
                </span>
              ) : (
                <span className="font-mono-code text-[0.6rem] text-[var(--ink-muted)]">
                  (Custom settings)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action: Save Current Button */}
        <div className="flex items-center gap-1.5">
          {savedSuccessMsg && (
            <span className="font-mono-code text-[0.62rem] text-emerald-400 flex items-center gap-1 animate-fade-in">
              <Check className="h-3 w-3" />
              {savedSuccessMsg}
            </span>
          )}

          <button
            type="button"
            onClick={handleOpenSaveModal}
            className="btn btn-secondary py-1 px-2.5 text-[0.62rem]"
            title="Save current Voice + Emotion + Pace + Pitch as a reusable preset"
          >
            <Bookmark className="h-3 w-3 text-indigo-400" />
            <span>Save Preset</span>
          </button>
        </div>
      </div>

      {/* 1. Main Presets Dropdown Selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`w-full flex items-center justify-between p-2.5 rounded-[3px] border text-left transition ${
            isDropdownOpen
              ? 'border-indigo-500 bg-indigo-950/20'
              : 'border-[var(--ink-faint)] bg-black/40 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <BookmarkCheck className="h-4 w-4 text-indigo-400 shrink-0" />
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate flex items-center gap-2">
                <span>{matchingPreset ? matchingPreset.name : 'Select or browse presets...'}</span>
                {matchingPreset && (
                  <span className="text-[10px] font-mono-code px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                    Active
                  </span>
                )}
              </div>
              <div className="text-[10px] text-[var(--ink-muted)] truncate mt-0.5">
                {matchingPreset?.description ||
                  `${presets.length} presets available • ${pinnedPresets.length} pinned to screen`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className="font-mono-code text-[0.6rem] text-[var(--ink-muted)] px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
              📌 {pinnedPresets.length} Pinned
            </span>
            <ChevronDown
              className={`h-4 w-4 text-[var(--ink-muted)] transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-white' : ''
              }`}
            />
          </div>
        </button>

        {/* Dropdown Popover Menu */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 z-40 rounded-[4px] border border-[var(--ink-faint)] bg-[#0d0f16] shadow-2xl backdrop-blur-md overflow-hidden animate-fade-in">
            {/* Search Input Bar */}
            <div className="p-2 border-b border-[var(--ink-faint)] bg-black/50 flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search presets by voice, language, tempo..."
                className="w-full bg-transparent text-xs text-white placeholder-[var(--ink-muted)] focus:outline-none"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[var(--ink-muted)] hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Presets List */}
            <div className="max-h-[320px] overflow-y-auto divide-y divide-white/5 p-1">
              {filteredPresets.length === 0 ? (
                <div className="p-4 text-center text-xs text-[var(--ink-muted)]">
                  No presets match "{searchQuery}"
                </div>
              ) : (
                filteredPresets.map((preset) => {
                  const isActive = matchingPreset?.id === preset.id;
                  const isPinned = pinnedIds.includes(preset.id);

                  return (
                    <div
                      key={preset.id}
                      onClick={() => {
                        onApplyPreset(preset);
                        setIsDropdownOpen(false);
                      }}
                      className={`group flex items-center justify-between p-2 rounded-[3px] cursor-pointer transition ${
                        isActive
                          ? 'bg-indigo-600/20 border-l-2 border-indigo-400 text-white'
                          : 'hover:bg-white/5 text-[var(--ink-muted)] hover:text-white'
                      }`}
                    >
                      {/* Left: Info & Badges */}
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-slate-200'}`}>
                            {preset.name}
                          </span>
                          {isActive && (
                            <span className="font-mono-code text-[9px] text-emerald-400 bg-emerald-950/40 px-1 rounded flex items-center gap-0.5">
                              <Check className="h-2.5 w-2.5" />
                              Active
                            </span>
                          )}
                          {preset.isSystem ? (
                            <span className="font-mono-code text-[9px] text-indigo-300 bg-indigo-900/30 px-1 rounded">
                              System
                            </span>
                          ) : (
                            <span className="font-mono-code text-[9px] text-amber-300 bg-amber-900/30 px-1 rounded">
                              Custom
                            </span>
                          )}
                        </div>

                        {preset.description && (
                          <p className="text-[11px] text-[var(--ink-muted)] truncate mt-0.5">
                            {preset.description}
                          </p>
                        )}

                        {/* Attribute pills */}
                        <div className="flex items-center gap-1.5 mt-1 font-mono-code text-[9px] text-[var(--ink-muted)]">
                          <span className="bg-white/5 px-1.5 py-0.2 rounded text-slate-300">
                            {preset.voiceId}
                          </span>
                          <span>•</span>
                          <span className="bg-white/5 px-1.5 py-0.2 rounded text-indigo-300">
                            {preset.emotionId}
                          </span>
                          <span>•</span>
                          <span className="bg-white/5 px-1.5 py-0.2 rounded text-emerald-300">
                            {Math.round(preset.pace * 100)}% pace
                          </span>
                          {preset.languageCode && (
                            <>
                              <span>•</span>
                              <span className="bg-white/5 px-1.5 py-0.2 rounded text-amber-300">
                                {preset.languageCode.toUpperCase()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions (Pin to screen + Delete if custom) */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => togglePin(preset.id, e)}
                          title={isPinned ? 'Unpin from screen' : 'Pin to screen'}
                          className={`p-1.5 rounded transition ${
                            isPinned
                              ? 'bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50'
                              : 'text-slate-500 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Pin className={`h-3.5 w-3.5 ${isPinned ? 'fill-current' : ''}`} />
                        </button>

                        {!preset.isSystem && (
                          <button
                            type="button"
                            onClick={(e) => handleDeletePreset(preset.id, e)}
                            title="Delete custom preset"
                            className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 transition"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Dropdown Footer Tip */}
            <div className="p-2 bg-black/70 border-t border-[var(--ink-faint)] flex items-center justify-between text-[10px] text-[var(--ink-muted)] font-mono-code">
              <span className="flex items-center gap-1">
                <Pin className="h-3 w-3 text-indigo-400" />
                Click 📌 on any preset to pin it directly onto the screen
              </span>
              <span>{presets.length} Total</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Pinned Presets Displayed Directly on Screen */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[0.62rem] font-mono-code text-[var(--ink-muted)] uppercase tracking-wider flex items-center gap-1">
            <Pin className="h-2.5 w-2.5 text-indigo-400" />
            <span>Pinned to Screen ({pinnedPresets.length})</span>
          </span>
          {pinnedPresets.length > 0 && (
            <span className="text-[0.58rem] font-mono-code text-[var(--ink-muted)]">
              Click to activate • Hover to unpin
            </span>
          )}
        </div>

        {pinnedPresets.length === 0 ? (
          <div className="p-2.5 rounded-[3px] border border-dashed border-[var(--ink-faint)] bg-black/20 text-center">
            <p className="text-xs text-[var(--ink-muted)]">
              No presets pinned yet. Open the dropdown above and click{' '}
              <span className="text-indigo-400 font-semibold">📌</span> to pin your favorite presets here.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {pinnedPresets.map((preset) => {
              const isActive = matchingPreset?.id === preset.id;

              return (
                <div
                  key={preset.id}
                  onClick={() => onApplyPreset(preset)}
                  className={`group relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[2px] text-xs font-medium cursor-pointer transition border select-none ${
                    isActive
                      ? 'bg-indigo-600/25 text-white border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                      : 'bg-black/40 hover:bg-white/5 text-[var(--ink-muted)] hover:text-white border-[var(--ink-faint)]'
                  }`}
                  title={`${preset.name}: ${preset.voiceId} • ${preset.emotionId} • ${Math.round(
                    preset.pace * 100
                  )}% pace`}
                >
                  {isActive ? (
                    <BookmarkCheck className="h-3 w-3 text-indigo-400 shrink-0" />
                  ) : (
                    <Bookmark className="h-3 w-3 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                  )}

                  <span className="truncate max-w-[150px] text-[0.72rem]">{preset.name}</span>

                  {/* Pace indicator pill */}
                  <span
                    className={`font-mono-code text-[9px] px-1 py-0.2 rounded-[2px] ${
                      isActive ? 'bg-indigo-500/40 text-indigo-200' : 'bg-white/5 text-[var(--ink-muted)]'
                    }`}
                  >
                    {Math.round(preset.pace * 100)}%
                  </span>

                  {/* Unpin button */}
                  <button
                    type="button"
                    onClick={(e) => togglePin(preset.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-indigo-300 transition -mr-1"
                    title="Unpin from screen"
                  >
                    <PinOff className="h-2.5 w-2.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save Preset Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-[4px] border border-[var(--ink-faint)] bg-[#0d0f15] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--ink-faint)] pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-indigo-400" />
                <h3 className="font-syne font-bold text-sm text-white">Save Studio Preset</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1 rounded text-[var(--ink-muted)] hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Current Snapshot Summary */}
            <div className="p-3 rounded-[3px] bg-black/40 border border-[var(--ink-faint)] text-xs space-y-1 font-mono-code">
              <span className="label mb-1">Current Settings:</span>
              <div className="grid grid-cols-2 gap-2 text-[var(--ink-muted)] text-[0.75rem]">
                <div>
                  Voice: <span className="text-white">{currentVoice.name}</span>
                </div>
                <div>
                  Emotion: <span className="text-white">{currentEmotion.name}</span>
                </div>
                <div>
                  Pace: <span className="text-white">{Math.round(pace * 100)}%</span>
                </div>
                <div>
                  Pitch: <span className="text-white">{pitch}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmSavePreset} className="space-y-3">
              <div>
                <label className="label mb-1">Preset Name</label>
                <input
                  type="text"
                  required
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="e.g. Charon Documentary 95%"
                  className="glass-input text-xs py-2"
                  autoFocus
                />
              </div>

              <div>
                <label className="label mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newPresetDesc}
                  onChange={(e) => setNewPresetDesc(e.target.value)}
                  placeholder="e.g. Best setting for Kannada mysteries"
                  className="glass-input text-xs py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--ink-faint)]">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary w-auto text-xs py-2 px-4">
                  <BookmarkCheck className="h-3.5 w-3.5" />
                  <span>Save & Pin Preset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
