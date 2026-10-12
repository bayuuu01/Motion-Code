import React, { useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Repeat,
  Camera,
  Terminal,
  Gauge,
} from 'lucide-react';
import { AnimationConfig } from '../engine/motionRuntime.ts';

interface TimelineControlsProps {
  config: AnimationConfig;
  currentFrame: number;
  isPlaying: boolean;
  isLooping: boolean;
  playbackSpeed: number;
  onPlayPause: () => void;
  onStop: () => void;
  onStepBackward: () => void;
  onStepForward: () => void;
  onScrub: (frame: number) => void;
  onToggleLoop: () => void;
  onChangeSpeed: (speed: number) => void;
  onSnapshotStill: () => void;
  onToggleConsole: () => void;
  logCount: number;
  hasErrors: boolean;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  config,
  currentFrame,
  isPlaying,
  isLooping,
  playbackSpeed,
  onPlayPause,
  onStop,
  onStepBackward,
  onStepForward,
  onScrub,
  onToggleLoop,
  onChangeSpeed,
  onSnapshotStill,
  onToggleConsole,
  logCount,
  hasErrors,
}) => {
  const scrubberRef = useRef<HTMLDivElement>(null);
  const totalFrames = Math.max(1, Math.round(config.fps * config.duration));
  const safeFrame = Math.min(Math.max(currentFrame, 0), totalFrames - 1);
  const currentTime = safeFrame / config.fps;
  const progressRatio = totalFrames > 1 ? safeFrame / (totalFrames - 1) : 0;

  // Format SMPTE Timecode (HH:MM:SS:FF)
  const formatTimecode = (frame: number, fps: number) => {
    const totalSeconds = Math.floor(frame / fps);
    const ff = frame % fps;
    const ss = totalSeconds % 60;
    const mm = Math.floor(totalSeconds / 60) % 60;
    const hh = Math.floor(totalSeconds / 3600);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(hh)}:${pad(mm)}:${pad(ss)}:${pad(ff)}`;
  };

  // Scrubber drag / click handling
  const handleScrubPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubberRef.current) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const ratio = rect.width > 0 ? x / rect.width : 0;
    const targetFrame = Math.round(ratio * (totalFrames - 1));
    onScrub(targetFrame);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    handleScrubPointer(e);
  };

  return (
    <div className="h-20 border-t border-zinc-800 bg-zinc-950 flex flex-col justify-between px-4 py-2 select-none z-20">
      {/* 1. Scrubber Track */}
      <div className="relative w-full pt-1 pb-1">
        <div
          ref={scrubberRef}
          onPointerDown={handlePointerDown}
          onPointerMove={(e) => {
            if (e.buttons === 1) handleScrubPointer(e);
          }}
          className="relative h-6 w-full flex items-center cursor-pointer group"
        >
          {/* Background rail */}
          <div className="w-full h-2 rounded-full bg-zinc-800 group-hover:bg-zinc-700 transition-colors relative overflow-hidden">
            {/* Played progress fill */}
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full"
              style={{ width: `${progressRatio * 100}%` }}
            />
          </div>

          {/* Frame ticks markers along rail (e.g. every 1 second) */}
          <div className="absolute inset-0 pointer-events-none flex justify-between items-center px-1">
            {Array.from({ length: Math.min(Math.floor(config.duration) + 1, 30) }, (_, i) => (
              <div
                key={i}
                className="w-0.5 h-1.5 bg-zinc-600/50 rounded-full"
                title={`${i}s`}
              />
            ))}
          </div>

          {/* Draggable Playhead Scrubber */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-indigo-600 shadow-md shadow-indigo-500/40 cursor-grab active:cursor-grabbing transition-transform group-hover:scale-125"
            style={{ left: `${progressRatio * 100}%` }}
          />
        </div>
      </div>

      {/* 2. Playback Controls & Metrics Bar */}
      <div className="flex items-center justify-between text-xs">
        {/* Left: Playback Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onStop}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Berhenti & Kembali ke Awal"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>

          <button
            onClick={onStepBackward}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Mundur 1 Frame (Panah Kiri)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={onPlayPause}
            className={`p-2 rounded-lg font-bold transition-all shadow-sm ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
            title="Putar / Jeda (Spasi)"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={onStepForward}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Maju 1 Frame (Panah Kanan)"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleLoop}
            className={`p-1.5 rounded transition-colors ${
              isLooping
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
            }`}
            title={isLooping ? 'Looping Aktif' : 'Looping Nonaktif'}
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="ml-2 flex items-center bg-zinc-900 rounded border border-zinc-800 p-0.5 text-[10px] font-mono">
            <Gauge className="w-3 h-3 text-zinc-500 ml-1.5 mr-0.5" />
            {[0.5, 1, 2].map((spd) => (
              <button
                key={spd}
                onClick={() => onChangeSpeed(spd)}
                className={`px-1.5 py-0.5 rounded ${
                  playbackSpeed === spd
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Center: Frame and Time Readout */}
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <div className="bg-zinc-900/90 px-2.5 py-1 rounded border border-zinc-800 flex items-center gap-2">
            <span className="text-zinc-500">FRAME</span>
            <span className="text-zinc-200 font-bold">
              {safeFrame}
              <span className="text-zinc-600 font-normal"> / {totalFrames - 1}</span>
            </span>
          </div>

          <div className="bg-zinc-900/90 px-2.5 py-1 rounded border border-zinc-800 flex items-center gap-2">
            <span className="text-zinc-500">WAKTU</span>
            <span className="text-zinc-200 font-bold">
              {currentTime.toFixed(2)}s
              <span className="text-zinc-600 font-normal"> / {config.duration.toFixed(2)}s</span>
            </span>
          </div>

          <div className="hidden lg:flex bg-zinc-900/90 px-2.5 py-1 rounded border border-zinc-800 items-center gap-2 text-indigo-400 font-bold">
            <span className="text-zinc-500 font-normal">TIMECODE</span>
            <span>{formatTimecode(safeFrame, config.fps)}</span>
          </div>
        </div>

        {/* Right: Snapshot Still & Console Drawer Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSnapshotStill}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors text-xs"
            title="Ambil Tangkapan Gambar Frame Ini (PNG Still)"
          >
            <Camera className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Still PNG</span>
          </button>

          <button
            onClick={onToggleConsole}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs transition-colors ${
              hasErrors
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Buka / Tutup Panel Konsol"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Konsol</span>
            {logCount > 0 && (
              <span
                className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
                  hasErrors ? 'bg-rose-500 text-white font-bold' : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {logCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
