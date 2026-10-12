import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Film,
  Download,
  AlertTriangle,
  StopCircle,
  CheckCircle,
  FileArchive,
  Layers,
  Clock,
  Zap,
} from 'lucide-react';
import { AnimationConfig, CompiledMotionScript } from '../engine/motionRuntime.ts';
import { RenderOptions, RenderProgressState } from '../export/exporter.ts';

interface RenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AnimationConfig;
  projectName: string;
  isRendering: boolean;
  renderState: RenderProgressState | null;
  onStartRender: (options: RenderOptions) => void;
  onCancelRender: () => void;
}

export const RenderModal: React.FC<RenderModalProps> = ({
  isOpen,
  onClose,
  config,
  projectName,
  isRendering,
  renderState,
  onStartRender,
  onCancelRender,
}) => {
  if (!isOpen) return null;

  // Render form parameters
  const [resolutionPreset, setResolutionPreset] = useState<'720p' | '1080p' | '1440p' | '4k' | 'custom'>('1080p');
  const [customWidth, setCustomWidth] = useState(config.width);
  const [customHeight, setCustomHeight] = useState(config.height);
  const [fps, setFps] = useState<number>(config.fps || 30);
  const [duration, setDuration] = useState<number>(config.duration || 10);
  const [crf, setCrf] = useState<number>(18);
  const [format, setFormat] = useState<'mp4' | 'webm' | 'zip-png'>('mp4');
  const [transparentBg, setTransparentBg] = useState(false);
  const [rangeMode, setRangeMode] = useState<'all' | 'custom'>('all');
  const [startFrame, setStartFrame] = useState(0);
  const [endFrame, setEndFrame] = useState(Math.max(1, Math.round(fps * duration) - 1));

  // Determine width and height based on preset
  let targetWidth = config.width;
  let targetHeight = config.height;
  if (resolutionPreset === '720p') {
    targetWidth = 1280;
    targetHeight = 720;
  } else if (resolutionPreset === '1080p') {
    targetWidth = 1920;
    targetHeight = 1080;
  } else if (resolutionPreset === '1440p') {
    targetWidth = 2560;
    targetHeight = 1440;
  } else if (resolutionPreset === '4k') {
    targetWidth = 3840;
    targetHeight = 2160;
  } else if (resolutionPreset === 'custom') {
    targetWidth = customWidth;
    targetHeight = customHeight;
  }

  const totalFrames = Math.max(1, Math.round(fps * duration));

  const handleStart = () => {
    const options: RenderOptions = {
      projectName,
      width: targetWidth,
      height: targetHeight,
      fps,
      duration,
      format,
      crf,
      backgroundColor: transparentBg ? 'transparent' : config.backgroundColor,
      startFrame: rangeMode === 'custom' ? startFrame : 0,
      endFrame: rangeMode === 'custom' ? endFrame : totalFrames - 1,
    };
    onStartRender(options);
  };

  const handleDownload = () => {
    if (!renderState?.downloadBlob && !renderState?.downloadUrl) return;

    if (renderState.downloadBlob) {
      const url = URL.createObjectURL(renderState.downloadBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = renderState.downloadFilename || 'output.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } else if (renderState.downloadUrl) {
      window.open(renderState.downloadUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Space_Grotesk']">
                Konfigurasi Render & Ekspor Video
              </h2>
              <p className="text-xs text-zinc-400">
                Render deterministik frame-demi-frame tanpa membebani browser
              </p>
            </div>
          </div>

          {!isRendering && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {isRendering || renderState?.stage === 'selesai' || renderState?.stage === 'gagal' || renderState?.stage === 'dibatalkan' ? (
            /* Render Progress View */
            <div className="space-y-6">
              {/* Stage Status Card */}
              <div
                className={`p-5 rounded-xl border flex items-center gap-4 ${
                  renderState?.stage === 'selesai'
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : renderState?.stage === 'gagal' || renderState?.stage === 'dibatalkan'
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-indigo-950/20 border-indigo-500/30'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    renderState?.stage === 'selesai'
                      ? 'bg-emerald-500 text-white'
                      : renderState?.stage === 'gagal' || renderState?.stage === 'dibatalkan'
                      ? 'bg-rose-500 text-white'
                      : 'bg-indigo-600 text-white animate-pulse'
                  }`}
                >
                  {renderState?.stage === 'selesai' ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : renderState?.stage === 'gagal' || renderState?.stage === 'dibatalkan' ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <Zap className="w-6 h-6" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-zinc-100">
                      {renderState?.stageLabel || 'Memproses Render...'}
                    </h3>
                    <span className="font-mono font-bold text-base text-indigo-400">
                      {renderState?.progressPercent || 0}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-zinc-800 rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-200"
                      style={{ width: `${renderState?.progressPercent || 0}%` }}
                    />
                  </div>

                  {/* Metrics: Frame count, Speed, ETA */}
                  <div className="flex items-center justify-between mt-3 text-xs text-zinc-400 font-mono">
                    <span>
                      Frame: {renderState?.currentFrame || 0} / {renderState?.totalFrames || totalFrames}
                    </span>
                    <span>Kecepatan: {renderState?.fpsSpeed || 0} FPS</span>
                    <span>
                      ETA: {renderState?.etaSeconds ? `${renderState.etaSeconds}s` : 'Menghitung...'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Video Player Preview if completed */}
              {renderState?.stage === 'selesai' && renderState?.downloadBlob && (
                <div className="rounded-xl overflow-hidden border border-zinc-800 bg-black flex flex-col items-center">
                  <video
                    src={URL.createObjectURL(renderState.downloadBlob)}
                    controls
                    autoPlay
                    loop
                    className="max-h-64 w-full object-contain"
                  />
                  <div className="p-3 text-xs text-zinc-400 text-center w-full bg-zinc-950">
                    File: <span className="text-zinc-200 font-mono">{renderState.downloadFilename}</span>
                  </div>
                </div>
              )}

              {/* Error Message if failed */}
              {renderState?.error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
                  {renderState.error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {isRendering ? (
                  <button
                    onClick={onCancelRender}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/20"
                  >
                    <StopCircle className="w-4 h-4" />
                    <span>Batalkan Render (&lt;5 detik)</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      Tutup
                    </button>
                    {renderState?.stage === 'selesai' && (
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 active:scale-95"
                      >
                        <Download className="w-4 h-4" />
                        <span>Unduh Hasil Render</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Render Configuration Form */
            <div className="space-y-5 text-xs">
              {/* 1. Resolusi Presets */}
              <div>
                <label className="block font-semibold text-zinc-200 mb-2">
                  Resolusi Output
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: '720p', label: '720p HD', sub: '1280x720' },
                    { id: '1080p', label: '1080p FHD', sub: '1920x1080 (Standar)' },
                    { id: '1440p', label: '1440p 2K', sub: '2560x1440' },
                    { id: '4k', label: '4K UHD', sub: '3840x2160' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setResolutionPreset(item.id as any)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        resolutionPreset === item.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <div className="font-bold text-xs">{item.label}</div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{item.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Format & Codec */}
              <div>
                <label className="block font-semibold text-zinc-200 mb-2">
                  Format / Kontainer Video
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat('mp4')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      format === 'mp4'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="font-bold">MP4 Video (H.264)</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">Kompatibilitas Luas</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('webm')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      format === 'webm'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="font-bold">WebM Video (VP9)</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">Dukungan Alpha / Web</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('zip-png')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      format === 'zip-png'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="font-bold">PNG Sequence (ZIP)</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">Lossless Frame Archive</div>
                  </button>
                </div>
              </div>

              {/* 3. Frame Rate & Kualitas CRF */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-200 mb-1.5">
                    Frame Rate (FPS)
                  </label>
                  <div className="flex gap-2">
                    {[24, 30, 60].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFps(val)}
                        className={`flex-1 py-2 rounded-lg border font-mono font-bold transition-all ${
                          fps === val
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {val} FPS
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-200 mb-1.5">
                    Kualitas Kompresi CRF: {crf} {crf <= 14 ? '(Tinggi)' : crf <= 18 ? '(Optimal)' : '(Ringan)'}
                  </label>
                  <input
                    type="range"
                    min="14"
                    max="28"
                    step="1"
                    value={crf}
                    onChange={(e) => setCrf(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-500 cursor-pointer mt-2"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                    <span>14 (Visual Lossless)</span>
                    <span>18 (Standar)</span>
                    <span>28 (Ukuran Kecil)</span>
                  </div>
                </div>
              </div>

              {/* 4. Durasi & Rentang Frame */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-200 mb-1.5">
                    Durasi (Detik)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={duration}
                    onChange={(e) => setDuration(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 font-mono outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-200 mb-1.5">
                    Opsi Latar Belakang
                  </label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={transparentBg}
                      onChange={(e) => setTransparentBg(e.target.checked)}
                      className="accent-indigo-500 w-4 h-4 rounded"
                    />
                    <span className="text-zinc-300">
                      Transparan (Alpha channel untuk PNG / WebM)
                    </span>
                  </label>
                </div>
              </div>

              {/* Summary Info */}
              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-zinc-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>
                    Total Frame yang akan di-render: <strong className="text-zinc-200 font-mono">{totalFrames} frames</strong>
                  </span>
                </div>
                <span className="font-mono text-zinc-500">
                  {targetWidth}x{targetHeight} • {fps} FPS
                </span>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleStart}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white font-bold shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Mulai Render Sekarang</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
