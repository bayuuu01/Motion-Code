import React from 'react';
import {
  Film,
  FolderOpen,
  LayoutGrid,
  FileCode,
  Image,
  BookOpen,
  Sparkles,
  Play,
  RotateCcw,
  Download,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { AnimationConfig } from '../engine/motionRuntime.ts';

interface HeaderProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  config: AnimationConfig;
  onOpenTemplates: () => void;
  onOpenProjects: () => void;
  onOpenAssets: () => void;
  onOpenDocs: () => void;
  onOpenRender: () => void;
  onRunCode: () => void;
  onResetCode: () => void;
  isCompiling?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  projectName,
  onProjectNameChange,
  config,
  onOpenTemplates,
  onOpenProjects,
  onOpenAssets,
  onOpenDocs,
  onOpenRender,
  onRunCode,
  onResetCode,
  isCompiling,
}) => {
  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur px-4 flex items-center justify-between select-none z-30">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Film className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white font-['Space_Grotesk']">
                Xibay08
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Motion Studio
              </span>
            </div>
          </div>
        </div>

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        {/* Project Name editable */}
        <input
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          placeholder="Nama Proyek"
          className="bg-transparent hover:bg-zinc-900 focus:bg-zinc-900 border border-transparent focus:border-zinc-700 px-2 py-1 rounded text-xs font-medium text-zinc-200 outline-none w-48 transition-colors"
        />

        {/* Resolution & FPS Badge */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-800">
          <Sliders className="w-3 h-3 text-zinc-500" />
          <span>{config.width}x{config.height}</span>
          <span className="text-zinc-600">•</span>
          <span>{config.fps} FPS</span>
          <span className="text-zinc-600">•</span>
          <span>{config.duration}s</span>
        </div>
      </div>

      {/* Center Quick Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onRunCode}
          title="Jalankan Kode (Ctrl+Enter)"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Jalankan</span>
          <kbd className="hidden sm:inline-block ml-1 text-[10px] px-1 py-0.2 bg-emerald-700/60 rounded text-emerald-200">
            Ctrl+↵
          </kbd>
        </button>

        <button
          onClick={onResetCode}
          title="Reset ke Template Awal"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Right Navigation & Render Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Template</span>
        </button>

        <button
          onClick={onOpenProjects}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Proyek</span>
        </button>

        <button
          onClick={onOpenAssets}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          <Image className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden md:inline">Aset</span>
        </button>

        <button
          onClick={onOpenDocs}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">API Docs</span>
        </button>

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        {/* Primary Glowing Render Button */}
        <button
          onClick={onOpenRender}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Render & Ekspor</span>
        </button>
      </div>
    </header>
  );
};
