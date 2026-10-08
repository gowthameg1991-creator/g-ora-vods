import React from 'react';
import { Gauge, SlidersVertical, ChevronRight } from 'lucide-react';
import { PitchLevel, PITCH_CONFIGS } from '../types/tts';

interface PaceAndPitchControlsProps {
  pace: number; // e.g. 1.0 (80% to 120%)
  pitch: PitchLevel;
  onPaceChange: (pace: number) => void;
  onPitchChange: (pitch: PitchLevel) => void;
}

export const PaceAndPitchControls: React.FC<PaceAndPitchControlsProps> = ({
  pace,
  pitch,
  onPaceChange,
  onPitchChange,
}) => {
  const pacePercentage = Math.round(pace * 100);

  const getPaceDescription = (p: number) => {
    if (p <= 0.82) return '0.80x • Calm, reflective & suspense storytelling';
    if (p <= 0.87) return '0.85x • Deliberate documentary narration';
    if (p <= 0.92) return '0.90x • Clear, articulate long-form audio';
    if (p <= 0.97) return '0.95x • Natural measured speech cadence';
    if (p <= 1.02) return '1.00x • Standard studio conversational tempo';
    if (p <= 1.07) return '1.05x • Crisp, upbeat presentation pace';
    if (p <= 1.12) return '1.10x • High-retention YouTube video tempo';
    if (p <= 1.17) return '1.15x • Fast & energetic Instagram Reels pace';
    return '1.20x • Snappy viral YouTube Shorts hook tempo';
  };

  // 0.05x granular pace buttons as requested: 0.80, 0.85, 0.90, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2
  const pacePresets = [
    { label: '0.80', value: 0.8, pct: '80%' },
    { label: '0.85', value: 0.85, pct: '85%' },
    { label: '0.90', value: 0.9, pct: '90%' },
    { label: '0.95', value: 0.95, pct: '95%' },
    { label: '1.00', value: 1.0, pct: '100%' },
    { label: '1.05', value: 1.05, pct: '105%' },
    { label: '1.10', value: 1.1, pct: '110%' },
    { label: '1.15', value: 1.15, pct: '115%' },
    { label: '1.20', value: 1.2, pct: '120%' },
  ];

  // Find index of current pitch in PITCH_CONFIGS
  const currentPitchIndex = PITCH_CONFIGS.findIndex((p) => p.id === pitch);
  const activePitchConfig = PITCH_CONFIGS[currentPitchIndex !== -1 ? currentPitchIndex : 3];

  const handlePitchSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value, 10);
    const selected = PITCH_CONFIGS[index] || PITCH_CONFIGS[3];
    onPitchChange(selected.id);
  };

  return (
    <div className="space-y-4 rounded-[4px] border border-[var(--ink-faint)] bg-[#0d0f14] p-3.5 sm:p-4">
      {/* 1. Speaking Pace Controls (0.80x to 1.20x in 0.05 increments) */}
      <div className="range-wrap">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-[var(--ink)] flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-indigo-400" />
            Speaking Pace
          </span>
          <span className="font-mono-code text-[0.72rem] text-indigo-400 font-bold">
            {pace.toFixed(2)}x ({pacePercentage}%)
          </span>
        </div>

        {/* Pace Slider */}
        <div className="relative flex items-center mb-2">
          <input
            type="range"
            min={0.8}
            max={1.2}
            step={0.01}
            value={pace}
            onChange={(e) => onPaceChange(parseFloat(e.target.value))}
          />
        </div>

        <p className="text-[11px] text-[var(--ink-muted)] mb-2.5">{getPaceDescription(pace)}</p>

        {/* Granular 0.05 Pace Preset Buttons */}
        <div>
          <span className="label mb-1">
            Presets:
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-9 gap-1">
            {pacePresets.map((preset) => {
              const isSelected = Math.abs(pace - preset.value) < 0.015;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onPaceChange(preset.value)}
                  className={`btn btn-secondary py-1 px-0.5 text-[0.62rem] rounded-[2px] justify-center transition text-center ${
                    isSelected ? 'active' : ''
                  }`}
                >
                  <span>{preset.label}x</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--ink-faint)]" />

      {/* 2. Vocal Pitch Control with Slider & Types Display */}
      <div className="range-wrap">
        {/* Header with selected pitch badge */}
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-[var(--ink)] flex items-center gap-1.5">
            <SlidersVertical className="h-3.5 w-3.5 text-indigo-400" />
            Pitch Shift
          </span>

          <span className="font-mono-code text-[0.72rem] text-indigo-400 font-bold">
            {activePitchConfig.label} ({activePitchConfig.semitones > 0 ? `+${activePitchConfig.semitones}st` : `${activePitchConfig.semitones}st`})
          </span>
        </div>

        {/* Vocal Pitch Interactive Slider */}
        <div className="relative mb-2">
          <input
            type="range"
            min={0}
            max={PITCH_CONFIGS.length - 1}
            step={1}
            value={currentPitchIndex !== -1 ? currentPitchIndex : 3}
            onChange={handlePitchSliderChange}
          />
        </div>

        {/* Stepped Scale Visual Marks below Slider */}
        <div className="flex justify-between px-1 mb-2 text-[10px] text-[var(--ink-muted)] font-mono-code">
          {PITCH_CONFIGS.map((cfg) => (
            <span
              key={cfg.id}
              onClick={() => onPitchChange(cfg.id)}
              className={`cursor-pointer transition hover:text-white ${
                cfg.id === pitch ? 'text-indigo-400 font-bold' : ''
              }`}
            >
              {cfg.semitones > 0 ? `+${cfg.semitones}` : cfg.semitones}
            </span>
          ))}
        </div>

        {/* Selected Pitch Type Detail Card */}
        <div className="rounded-[3px] border border-[var(--ink-faint)] bg-black/30 p-2.5 mb-2.5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-semibold text-white">
              {activePitchConfig.register}
            </span>
            <span className="font-mono-code text-[0.62rem] text-indigo-300">
              {activePitchConfig.semitones > 0
                ? `+${activePitchConfig.semitones} semitones`
                : activePitchConfig.semitones === 0
                ? 'Original pitch (0st)'
                : `${activePitchConfig.semitones} semitones`}
            </span>
          </div>
          <p className="text-[11px] text-[var(--ink-muted)]">{activePitchConfig.description}</p>
        </div>

        {/* Display All 6 Pitch Types as Clickable Chips */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
          {PITCH_CONFIGS.map((cfg) => {
            const isSelected = cfg.id === pitch;
            return (
              <button
                key={cfg.id}
                type="button"
                onClick={() => onPitchChange(cfg.id)}
                className={`btn btn-secondary py-1 px-1 text-[0.6rem] rounded-[2px] justify-center transition text-center ${
                  isSelected ? 'active' : ''
                }`}
              >
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
