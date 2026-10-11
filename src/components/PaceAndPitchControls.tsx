import React from 'react';
import { Gauge } from 'lucide-react';
import { PitchLevel } from '../types/tts';

interface PaceAndPitchControlsProps {
  pace: number; // e.g. 1.0 (80% to 120%)
  pitch: PitchLevel;
  onPaceChange: (pace: number) => void;
  onPitchChange: (pitch: PitchLevel) => void;
}

export const PaceAndPitchControls: React.FC<PaceAndPitchControlsProps> = ({
  pace,
  onPaceChange,
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

  return (
    <div className="rounded-[4px] border border-[var(--ink-faint)] bg-[#0d0f14] p-3.5 sm:p-4">
      {/* Speaking Pace Controls (0.80x to 1.20x) */}
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

        <p className="text-[11px] text-[var(--ink-muted)]">{getPaceDescription(pace)}</p>
      </div>
    </div>
  );
};
