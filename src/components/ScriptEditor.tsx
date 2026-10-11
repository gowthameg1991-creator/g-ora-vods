import React, { useRef } from 'react';
import { FileText, Clipboard, Trash2, Wand2, Clock, Sparkles, Timer, Plus, Upload, Download } from 'lucide-react';
import * as mammoth from 'mammoth';
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleDownloadSample = () => {
    const sampleContent = `##Intro\nIn this video, I’ll show you how to apply for a PAN card for a minor online, step by step, including the documents you’ll need and how to complete the application.\n\n##Before applying for a PAN card\nBefore applying for a PAN card for a minor, there are a couple of important documents you should have ready.\nThe First one is the Birth Certificate.`;
    const blob = new Blob([sampleContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Sample.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        onChange(result.value);
      } else {
        const text = await file.text();
        onChange(text);
      }
    } catch (err) {
      console.error('Failed to read uploaded file:', err);
    } finally {
      e.target.value = '';
    }
  };

  const handleClean = () => {
    const cleaned = cleanScriptDirections(script);
    onChange(cleaned);
  };

  // Insert a [PAUSE X] tag right at the cursor position or at end
  const handleInsertPause = (seconds: number) => {
    const tag = ` [PAUSE ${seconds}] `;
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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.md,.docx,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
          />
          <button
            type="button"
            onClick={handleDownloadSample}
            className="btn btn-secondary py-1 px-2.5 text-[0.62rem]"
            title="Download sample script file (.md)"
          >
            <Download className="h-3 w-3 text-emerald-400" />
            <span>Sample.md</span>
          </button>

          <button
            type="button"
            onClick={handleFileUploadClick}
            className="btn btn-secondary py-1 px-2.5 text-[0.62rem]"
            title="Upload script file (.txt, .md, .docx)"
          >
            <Upload className="h-3 w-3 text-indigo-400" />
            <span>Upload File</span>
          </button>

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
          placeholder="Paste your script here... (Use ## or # to separate multiple voice-overs)"
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
      <div className="pt-2 border-t border-[var(--ink-faint)]/40 mt-4">
        <div className="label mb-2">
          <Timer className="h-3.5 w-3.5 text-amber-400" />
          <span>Insert Timed Silence</span>
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {[0.2, 0.4, 1, 2, 3, 5].map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => handleInsertPause(sec)}
              className="btn btn-secondary py-1.5 px-1 justify-center text-[0.6rem] text-center"
              title={`Insert [PAUSE ${sec}s] silence at cursor`}
            >
              [{sec}s]
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
