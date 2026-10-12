import React, { useRef, useEffect, useState } from 'react';
import {
  Code,
  Copy,
  Check,
  AlertCircle,
  Wand2,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onRun: () => void;
  error?: string | null;
  errorLine?: number | null;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  onRun,
  error,
  errorLine,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Sync scrolling between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Keyboard shortcuts (Ctrl+Enter to Run, Tab support)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      onChange(newCode);

      // Restore cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Insert code snippet at cursor
  const insertSnippet = (snippet: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const newCode = code.substring(0, start) + snippet + code.substring(end);
    onChange(newCode);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + snippet.length;
      }
    }, 0);
  };

  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-r border-zinc-800">
      {/* Editor Header & Snippets Bar */}
      <div className="h-10 border-b border-zinc-800/80 px-3 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
            <Code className="w-3.5 h-3.5 text-indigo-400" />
            <span>script.js</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">({lineCount} baris)</span>
        </div>

        {/* Quick Snippet Chips */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => insertSnippet(`  const s = api.spring({ stiffness: 120, damping: 10, start: 0, target: 1 });\n`)}
            className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition-colors"
            title="Sisipkan Spring Physics"
          >
            +spring
          </button>
          <button
            onClick={() => insertSnippet(`  const val = api.keyframes([[0, 0], [2, 100, api.ease.outCubic]]);\n`)}
            className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition-colors"
            title="Sisipkan Keyframes"
          >
            +keyframes
          </button>
          <button
            onClick={() => insertSnippet(`  api.particles({ count: 120, speedMin: 40, speedMax: 120 });\n`)}
            className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition-colors"
            title="Sisipkan Partikel"
          >
            +particles
          </button>
          <button
            onClick={() => insertSnippet(`  const n = api.noise(x * 0.005, y * 0.005, api.time * 0.5);\n`)}
            className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition-colors"
            title="Sisipkan Simplex Noise"
          >
            +noise
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Salin Kode"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 relative flex overflow-hidden font-mono text-[13px] leading-relaxed">
        {/* Line Numbers */}
        <div
          ref={lineNumbersRef}
          className="w-12 py-3 bg-zinc-950/80 border-r border-zinc-900 select-none overflow-hidden text-right pr-3 font-mono text-zinc-600 shrink-0"
        >
          {lineNumbers.map((num) => (
            <div
              key={num}
              className={`h-6 ${
                errorLine === num ? 'text-rose-400 font-bold bg-rose-500/10' : ''
              }`}
            >
              {num}
            </div>
          ))}
        </div>

        {/* Textarea Code Input */}
        <div className="flex-1 relative h-full">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className="w-full h-full py-3 px-4 bg-transparent text-zinc-100 resize-none outline-none font-mono text-[13px] leading-6 selection:bg-indigo-500/30 whitespace-pre overflow-auto"
            placeholder="// Tulis kode animasi JavaScript Anda di sini..."
          />
        </div>
      </div>

      {/* Inline Error Banner */}
      {error && (
        <div className="border-t border-rose-500/30 bg-rose-950/40 p-3 flex items-start gap-2.5 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-rose-200 flex items-center gap-2">
              <span>Kesalahan Kode</span>
              {errorLine && (
                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px]">
                  Baris {errorLine}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-rose-300/90 font-mono text-[11px] break-all">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};
