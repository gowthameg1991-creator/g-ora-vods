import React, { useRef } from 'react';
import { FileText, Clipboard, Trash2, Wand2, Clock, Sparkles, Timer, Plus } from 'lucide-react';
import { cleanScriptDirections, countScriptPauses } from '../utils/audioEngine';
import { LanguageOption } from '../types/tts';

interface ScriptEditorProps {
  script: string;
  pace: number;
  currentLanguage: LanguageOption;
  onChange: (text: string) => void;
  onSelectSample: (text: string) => void;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  script,
  pace,
  currentLanguage,
  onChange,
  onSelectSample,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Calculate statistics
  const trimmed = script.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const charCount = script.length;

  // Detect and sum [PAUSE X] tags
  const { count: pauseCount, totalSeconds: pauseTotalSeconds } = countScriptPauses(script);

  // Average reading speed: ~150 words per minute at 1.0x pace + exact pause duration
  const wordsPerMinute = 150 * pace;
  const speechSeconds = wordCount > 0 ? Math.ceil((wordCount / wordsPerMinute) * 60) : 0;
  const estimatedSeconds = speechSeconds + pauseTotalSeconds;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChange(text);
      }
    } catch {
      // Fallback
    }
  };

  const handleClean = () => {
    const cleaned = cleanScriptDirections(script);
    onChange(cleaned);
  };

  // Insert a [PAUSE X] tag right at the cursor position or at end
  const handleInsertPause = (seconds: number) => {
    const tag = `\n\n[PAUSE ${seconds}]\n\n`;
    const textarea = textareaRef.current;

    if (!textarea) {
      onChange(script ? `${script.trim()}${tag}` : `[PAUSE ${seconds}]`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = script.substring(0, start);
    const after = script.substring(end);

    const updated = `${before}${tag}${after}`;
    onChange(updated);

    // Reposition cursor right after inserted tag
    setTimeout(() => {
      textarea.focus();
      const newPos = start + tag.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 50);
  };

  return (
    <div className="space-y-4">
      {/* Label and Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="label">
          <FileText className="h-3.5 w-3.5 text-indigo-400" />
          <span>Script Editor</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePaste}
            className="btn btn-secondary py-1 px-2.5 text-[0.62rem]"
            title="Paste from clipboard"
          >
            <Clipboard className="h-3 w-3 text-indigo-400" />
            <span>Paste</span>
          </button>

          {script && (
            <>
              <button
                type="button"
                onClick={handleClean}
                className="btn btn-secondary py-1 px-2.5 text-[0.62rem]"
                title="Remove stage directions e.g. [Cheerful], (whispering) while preserving [PAUSE 2] and [PAUSE 3]"
              >
                <Wand2 className="h-3 w-3 text-indigo-400" />
                <span>Clean Directions</span>
              </button>

              <button
                type="button"
                onClick={() => onChange('')}
                className="btn btn-secondary py-1 px-2.5 text-[0.62rem] hover:text-rose-400"
                title="Clear script"
              >
                <Trash2 className="h-3 w-3" />
                <span>Clear</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Glass Textarea */}
      <div>
        <textarea
          ref={textareaRef}
          rows={9}
          value={script}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Quinn found a note...\n\nwritten in her own handwriting.\n\n[PAUSE 2]\n\nIt said:\n\n"Do NOT look under the table."\n\n[PAUSE 3]`}
          className="glass-input font-sans min-h-[200px]"
        />
      </div>

      {/* Stat Grid (Variation 2 Style) */}
      <div className="stat-grid">
        <div className="stat-item">
          <span className="stat-val">{wordCount}</span>
          <span className="stat-lab">Words</span>
        </div>
        <div className="stat-item">
          <span className="stat-val">{charCount}</span>
          <span className="stat-lab">Chars</span>
        </div>
        <div className="stat-item">
          <span className="stat-val">~{estimatedSeconds}s</span>
          <span className="stat-lab">
            {pauseCount > 0 ? `Est. Dur (${pauseCount}P)` : 'Est. Duration'}
          </span>
        </div>
      </div>

      {/* Insert Timed Silence Section */}
      <div className="pt-2">
        <div className="label mb-2">
          <Timer className="h-3.5 w-3.5 text-amber-400" />
          <span>Insert Timed Silence</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[0.2, 0.4, 1, 2, 3, 5].map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => handleInsertPause(sec)}
              className="btn btn-secondary py-1.5 justify-center text-[0.65rem] text-center"
              title={`Insert [PAUSE ${sec}s] silence at cursor`}
            >
              [PAUSE {sec}s]
            </button>
          ))}
        </div>
      </div>

      {/* Templates Section */}
      <div className="pt-2">
        <div className="label mb-2">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>{currentLanguage.name} Templates</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {currentLanguage.sampleScripts.map((sample) => (
            <button
              key={sample.title}
              type="button"
              onClick={() => onSelectSample(sample.text)}
              className="btn btn-secondary text-[0.65rem] py-1 px-2.5"
            >
              <span>{sample.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
