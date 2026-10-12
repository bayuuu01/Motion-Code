import React, { useState } from 'react';
import {
  Terminal,
  X,
  Trash2,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
} from 'lucide-react';
import { RuntimeLogItem } from '../engine/motionRuntime.ts';

interface ConsoleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: RuntimeLogItem[];
  onClear: () => void;
  executionTimeMs: number;
}

export const ConsoleDrawer: React.FC<ConsoleDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onClear,
  executionTimeMs,
}) => {
  if (!isOpen) return null;

  const [filter, setFilter] = useState<'all' | 'log' | 'warn' | 'error'>('all');

  const filteredLogs = logs.filter((item) => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  return (
    <div className="h-48 border-t border-zinc-800 bg-zinc-950 flex flex-col z-30 font-mono text-xs select-none">
      {/* Console Header */}
      <div className="h-8 border-b border-zinc-800/80 px-3 flex items-center justify-between bg-zinc-900/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-zinc-300">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Konsol Output & Diagnostik</span>
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded ${
                filter === 'all' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Semua ({logs.length})
            </button>
            <button
              onClick={() => setFilter('log')}
              className={`px-2 py-0.5 rounded ${
                filter === 'log' ? 'bg-zinc-800 text-sky-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Log ({logs.filter((l) => l.type === 'log').length})
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-2 py-0.5 rounded ${
                filter === 'error' ? 'bg-rose-950 text-rose-300 font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Error ({logs.filter((l) => l.type === 'error').length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Frame render benchmark */}
          <div className="flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>Frame Render: </span>
            <span className="text-emerald-400 font-bold">{executionTimeMs.toFixed(2)} ms</span>
          </div>

          <button
            onClick={onClear}
            className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Bersihkan Log"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Tutup Panel Konsol"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-zinc-950/80">
        {filteredLogs.length === 0 ? (
          <div className="py-6 text-center text-zinc-600 text-[11px]">
            Konsol kosong. Gunakan <code className="text-zinc-400">console.log(...)</code> di dalam fungsi draw() untuk memeriksa data.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`flex items-start gap-2 py-1 px-2 rounded text-[11px] leading-relaxed ${
                log.type === 'error'
                  ? 'bg-rose-950/30 text-rose-300 border-l-2 border-rose-500'
                  : log.type === 'warn'
                  ? 'bg-amber-950/30 text-amber-300 border-l-2 border-amber-500'
                  : 'text-zinc-300 hover:bg-zinc-900/50'
              }`}
            >
              {log.type === 'error' ? (
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              ) : log.type === 'warn' ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
              )}

              {log.frame !== undefined && (
                <span className="text-[10px] text-zinc-500 shrink-0">
                  [F{log.frame}]
                </span>
              )}

              <span className="flex-1 break-all">{log.message}</span>

              <span className="text-[9px] text-zinc-600 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
