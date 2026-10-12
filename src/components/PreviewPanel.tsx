import React, { useRef, useState, useEffect } from 'react';
import {
  Maximize2,
  Minimize2,
  Grid,
  Crosshair,
  Shield,
  Eye,
  Layers,
  ZoomIn,
  ZoomOut,
  Palette,
} from 'lucide-react';
import { AnimationConfig } from '../engine/motionRuntime.ts';

interface PreviewPanelProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  config: AnimationConfig;
  currentFrame: number;
  actualFps: number;
}

export type GuideMode = 'none' | 'safe' | 'thirds' | 'crosshair';
export type BgMode = 'dark' | 'black' | 'light' | 'checker';

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  canvasRef,
  config,
  currentFrame,
  actualFps,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomMode, setZoomMode] = useState<'fit' | '50' | '100' | '200'>('fit');
  const [guideMode, setGuideMode] = useState<GuideMode>('none');
  const [bgMode, setBgMode] = useState<BgMode>('dark');
  const [scaleFactor, setScaleFactor] = useState(1);

  // Compute scale factor to fit within container
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const padding = 32;
      const availW = Math.max(100, rect.width - padding);
      const availH = Math.max(100, rect.height - padding);

      if (zoomMode === 'fit') {
        const scaleW = availW / config.width;
        const scaleH = availH / config.height;
        setScaleFactor(Math.min(scaleW, scaleH));
      } else if (zoomMode === '50') {
        setScaleFactor(0.5);
      } else if (zoomMode === '100') {
        setScaleFactor(1.0);
      } else if (zoomMode === '200') {
        setScaleFactor(2.0);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [config.width, config.height, zoomMode]);

  const displayWidth = Math.round(config.width * scaleFactor);
  const displayHeight = Math.round(config.height * scaleFactor);

  const getBgStyle = () => {
    if (bgMode === 'black') return 'bg-black';
    if (bgMode === 'light') return 'bg-white';
    if (bgMode === 'checker') {
      return 'bg-[linear-gradient(45deg,#18181b_25%,transparent_25%),linear-gradient(-45deg,#18181b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#18181b_75%),linear-gradient(-45deg,transparent_75%,#18181b_75%)] bg-[size:20px_20px] bg-zinc-900';
    }
    return 'bg-zinc-950';
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 overflow-hidden select-none">
      {/* Top Preview Toolbar */}
      <div className="h-10 border-b border-zinc-800/80 px-3 flex items-center justify-between bg-zinc-900/50 text-xs">
        {/* Left: Resolution & Stats */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-300">Pratinjau</span>
          <span className="text-zinc-600">•</span>
          <span className="font-mono text-[11px] text-zinc-400">
            {config.width}x{config.height} ({Math.round(scaleFactor * 100)}%)
          </span>
          <span className="text-zinc-600">•</span>
          <span className="font-mono text-[11px] text-emerald-400">
            {actualFps.toFixed(0)} FPS
          </span>
        </div>

        {/* Right: Controls for Guides, Background, Zoom */}
        <div className="flex items-center gap-1.5">
          {/* Guide Selector */}
          <div className="flex items-center bg-zinc-900 rounded border border-zinc-800 p-0.5">
            <button
              onClick={() => setGuideMode('none')}
              className={`p-1 rounded ${guideMode === 'none' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
              title="Tanpa Panduan"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setGuideMode('safe')}
              className={`p-1 rounded ${guideMode === 'safe' ? 'bg-zinc-800 text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'}`}
              title="Panduan Safe Area (Title & Action)"
            >
              <Shield className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setGuideMode('thirds')}
              className={`p-1 rounded ${guideMode === 'thirds' ? 'bg-zinc-800 text-sky-400' : 'text-zinc-400 hover:text-zinc-200'}`}
              title="Grid Rule of Thirds (3x3)"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setGuideMode('crosshair')}
              className={`p-1 rounded ${guideMode === 'crosshair' ? 'bg-zinc-800 text-amber-400' : 'text-zinc-400 hover:text-zinc-200'}`}
              title="Garis Pusat (Center Crosshair)"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Background Toggle */}
          <div className="flex items-center bg-zinc-900 rounded border border-zinc-800 p-0.5">
            <button
              onClick={() => setBgMode('dark')}
              className={`px-1.5 py-0.5 text-[10px] rounded ${bgMode === 'dark' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
              title="Latar Gelap Studio"
            >
              Gelap
            </button>
            <button
              onClick={() => setBgMode('checker')}
              className={`px-1.5 py-0.5 text-[10px] rounded ${bgMode === 'checker' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
              title="Latar Transparan (Pola Catur)"
            >
              Alpha
            </button>
          </div>

          {/* Zoom Selector */}
          <div className="flex items-center bg-zinc-900 rounded border border-zinc-800 p-0.5 text-[10px] font-mono">
            <button
              onClick={() => setZoomMode('fit')}
              className={`px-2 py-0.5 rounded ${zoomMode === 'fit' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Fit
            </button>
            <button
              onClick={() => setZoomMode('50')}
              className={`px-1.5 py-0.5 rounded ${zoomMode === '50' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              50%
            </button>
            <button
              onClick={() => setZoomMode('100')}
              className={`px-1.5 py-0.5 rounded ${zoomMode === '100' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              100%
            </button>
          </div>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div
        ref={containerRef}
        className={`flex-1 relative flex items-center justify-center overflow-auto p-4 ${getBgStyle()}`}
      >
        {/* Render Canvas Wrapper with Shadow & Guide Overlays */}
        <div
          className="relative shadow-2xl rounded border border-zinc-800/80 overflow-hidden flex items-center justify-center transition-all duration-100"
          style={{
            width: displayWidth,
            height: displayHeight,
          }}
        >
          {/* Internal Canvas Element */}
          <canvas
            ref={canvasRef as any}
            width={config.width}
            height={config.height}
            className="w-full h-full block object-contain pointer-events-none"
          />

          {/* Safe Area Guides Overlay */}
          {guideMode === 'safe' && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Action Safe (90%) */}
              <div className="absolute inset-[5%] border border-amber-500/40">
                <span className="absolute top-1 left-1.5 text-[9px] font-mono text-amber-500/70">
                  ACTION SAFE (90%)
                </span>
              </div>
              {/* Title Safe (80%) */}
              <div className="absolute inset-[10%] border border-sky-400/50 border-dashed">
                <span className="absolute top-1 left-1.5 text-[9px] font-mono text-sky-400/80">
                  TITLE SAFE (80%)
                </span>
              </div>
            </div>
          )}

          {/* Rule of Thirds Overlay */}
          {guideMode === 'thirds' && (
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-indigo-500/30">
              <div className="border-r border-b border-indigo-400/30" />
              <div className="border-r border-b border-indigo-400/30" />
              <div className="border-b border-indigo-400/30" />
              <div className="border-r border-b border-indigo-400/30" />
              <div className="border-r border-b border-indigo-400/30" />
              <div className="border-b border-indigo-400/30" />
              <div className="border-r border-indigo-400/30" />
              <div className="border-r border-indigo-400/30" />
              <div />
            </div>
          )}

          {/* Crosshairs Overlay */}
          {guideMode === 'crosshair' && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-rose-500/40 -translate-x-1/2" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-rose-500/40 -translate-y-1/2" />
              <div className="absolute left-1/2 top-1/2 w-8 h-8 rounded-full border border-rose-500/60 -translate-x-1/2 -translate-y-1/2" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
