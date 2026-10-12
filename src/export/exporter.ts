/**
 * Export and Video Render Engine for Xibay08 Motion Studio
 * Supports deterministic frame-by-frame rendering into WebM/MP4,
 * PNG Sequence ZIP archive (JSZip), Single Still PNG, and Server Render Pipeline.
 */

import JSZip from 'jszip';
import { MotionRuntime, CompiledMotionScript } from '../engine/motionRuntime.ts';

export interface RenderOptions {
  projectName: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  startFrame?: number;
  endFrame?: number;
  format: 'mp4' | 'webm' | 'zip-png' | 'still-png';
  crf?: number;
  backgroundColor?: string;
}

export type RenderStage =
  | 'idle'
  | 'menyiapkan'
  | 'menangkap_frame'
  | 'encoding'
  | 'selesai'
  | 'gagal'
  | 'dibatalkan';

export interface RenderProgressState {
  stage: RenderStage;
  stageLabel: string;
  progressPercent: number; // 0 to 100
  currentFrame: number;
  totalFrames: number;
  fpsSpeed: number;
  etaSeconds: number;
  downloadUrl?: string;
  downloadBlob?: Blob;
  downloadFilename?: string;
  jobId?: string;
  error?: string;
}

export class MotionExporter {
  private runtime: MotionRuntime;
  private abortController: AbortController | null = null;

  constructor(runtime: MotionRuntime) {
    this.runtime = runtime;
  }

  public cancel() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Captures a single still PNG of the specified frame at full target resolution
   */
  public async exportStillFrame(
    script: CompiledMotionScript,
    frame: number,
    options: RenderOptions
  ): Promise<{ blob: Blob; filename: string }> {
    const canvas = document.createElement('canvas');
    canvas.width = options.width;
    canvas.height = options.height;

    const renderConfig = {
      ...script.config,
      width: options.width,
      height: options.height,
      fps: options.fps,
      duration: options.duration,
      backgroundColor: options.backgroundColor ?? script.config.backgroundColor,
    };

    const runScript: CompiledMotionScript = {
      ...script,
      config: renderConfig,
    };

    const result = this.runtime.renderFrame(runScript, frame, canvas);
    if (!result.success) {
      throw new Error(result.error || 'Gagal merender frame still');
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Gagal menghasilkan blob gambar'));
      }, 'image/png');
    });

    const safeName = (options.projectName || 'still').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeName}_frame_${String(frame).padStart(4, '0')}.png`;
    return { blob, filename };
  }

  /**
   * Deterministically renders a PNG Sequence ZIP archive
   */
  public async exportPngSequence(
    script: CompiledMotionScript,
    options: RenderOptions,
    onProgress: (state: RenderProgressState) => void
  ): Promise<{ blob: Blob; filename: string }> {
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const totalDurationFrames = Math.max(1, Math.round(options.fps * options.duration));
    const startFrame = Math.max(0, options.startFrame ?? 0);
    const endFrame = Math.min(totalDurationFrames - 1, options.endFrame ?? totalDurationFrames - 1);
    const frameCount = endFrame - startFrame + 1;

    const canvas = document.createElement('canvas');
    canvas.width = options.width;
    canvas.height = options.height;

    const renderConfig = {
      ...script.config,
      width: options.width,
      height: options.height,
      fps: options.fps,
      duration: options.duration,
      backgroundColor: options.backgroundColor ?? script.config.backgroundColor,
    };

    const runScript: CompiledMotionScript = {
      ...script,
      config: renderConfig,
    };

    const zip = new JSZip();
    const folderName = (options.projectName || 'sequence').replace(/[^a-zA-Z0-9_-]/g, '_');
    const folder = zip.folder(folderName) || zip;

    onProgress({
      stage: 'menyiapkan',
      stageLabel: 'Menyiapkan Render PNG Sequence...',
      progressPercent: 0,
      currentFrame: 0,
      totalFrames: frameCount,
      fpsSpeed: 0,
      etaSeconds: 0,
    });

    const startTime = performance.now();

    for (let f = startFrame; f <= endFrame; f++) {
      if (signal.aborted) {
        onProgress({
          stage: 'dibatalkan',
          stageLabel: 'Render Dibatalkan oleh Pengguna',
          progressPercent: 0,
          currentFrame: f - startFrame,
          totalFrames: frameCount,
          fpsSpeed: 0,
          etaSeconds: 0,
        });
        throw new Error('Render dibatalkan');
      }

      this.runtime.renderFrame(runScript, f, canvas);

      // Extract image data
      const base64Data = canvas.toDataURL('image/png').split(',')[1];
      const filename = `frame_${String(f).padStart(5, '0')}.png`;
      folder.file(filename, base64Data, { base64: true });

      const framesDone = f - startFrame + 1;
      const elapsedSec = (performance.now() - startTime) / 1000;
      const currentFps = elapsedSec > 0 ? framesDone / elapsedSec : 0;
      const remainingFrames = frameCount - framesDone;
      const eta = currentFps > 0 ? remainingFrames / currentFps : 0;
      const pct = Math.round((framesDone / frameCount) * 85); // 85% for capture, 15% for zip compression

      onProgress({
        stage: 'menangkap_frame',
        stageLabel: `Menangkap Frame ${framesDone}/${frameCount} (${pct}%)`,
        progressPercent: pct,
        currentFrame: framesDone,
        totalFrames: frameCount,
        fpsSpeed: Math.round(currentFps * 10) / 10,
        etaSeconds: Math.round(eta),
      });

      // Small tick to allow UI to breathe
      await new Promise((r) => setTimeout(r, 0));
    }

    onProgress({
      stage: 'encoding',
      stageLabel: 'Mengompresi Arsip ZIP...',
      progressPercent: 90,
      currentFrame: frameCount,
      totalFrames: frameCount,
      fpsSpeed: 0,
      etaSeconds: 2,
    });

    const zipBlob = await zip.generateAsync(
      { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
      (metadata) => {
        const pct = 85 + Math.round((metadata.percent / 100) * 14);
        onProgress({
          stage: 'encoding',
          stageLabel: `Mengompresi Arsip ZIP (${metadata.percent.toFixed(0)}%)...`,
          progressPercent: pct,
          currentFrame: frameCount,
          totalFrames: frameCount,
          fpsSpeed: 0,
          etaSeconds: 1,
        });
      }
    );

    const safeName = (options.projectName || 'motion').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeName}_${options.width}x${options.height}_${options.fps}fps.zip`;

    onProgress({
      stage: 'selesai',
      stageLabel: 'Selesai! File Siap Diunduh.',
      progressPercent: 100,
      currentFrame: frameCount,
      totalFrames: frameCount,
      fpsSpeed: 0,
      etaSeconds: 0,
      downloadBlob: zipBlob,
      downloadFilename: filename,
    });

    return { blob: zipBlob, filename };
  }

  /**
   * Deterministically renders a video (WebM or MP4) frame-by-frame
   */
  public async exportVideo(
    script: CompiledMotionScript,
    options: RenderOptions,
    onProgress: (state: RenderProgressState) => void
  ): Promise<{ blob: Blob; filename: string; jobId?: string }> {
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // Check if server render endpoint is available
    let serverJobId: string | undefined;
    try {
      const initRes = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: options.projectName,
          config: {
            width: options.width,
            height: options.height,
            fps: options.fps,
            duration: options.duration,
            crf: options.crf ?? 18,
            codec: options.format === 'mp4' ? 'libx264' : 'libvpx-vp9',
          },
        }),
      });
      if (initRes.ok) {
        const data = await initRes.json();
        serverJobId = data.jobId;
      }
    } catch {
      // Server offline or proxy mode, continue with browser renderer
    }

    const totalDurationFrames = Math.max(1, Math.round(options.fps * options.duration));
    const startFrame = Math.max(0, options.startFrame ?? 0);
    const endFrame = Math.min(totalDurationFrames - 1, options.endFrame ?? totalDurationFrames - 1);
    const frameCount = endFrame - startFrame + 1;

    const canvas = document.createElement('canvas');
    canvas.width = options.width;
    canvas.height = options.height;

    const renderConfig = {
      ...script.config,
      width: options.width,
      height: options.height,
      fps: options.fps,
      duration: options.duration,
      backgroundColor: options.backgroundColor ?? script.config.backgroundColor,
    };

    const runScript: CompiledMotionScript = {
      ...script,
      config: renderConfig,
    };

    onProgress({
      stage: 'menyiapkan',
      stageLabel: `Menyiapkan Video (${options.width}x${options.height} @ ${options.fps} FPS)...`,
      progressPercent: 0,
      currentFrame: 0,
      totalFrames: frameCount,
      fpsSpeed: 0,
      etaSeconds: 0,
      jobId: serverJobId,
    });

    // Determine supported mime types for browser MediaRecorder
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8';
    }
    if (options.format === 'mp4') {
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
        mimeType = 'video/mp4;codecs=avc1';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      }
    }

    const stream = canvas.captureStream(0); // 0 fps: manually controlled by requestFrame()
    const track = stream.getVideoTracks()[0] as any;

    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
      videoBitsPerSecond: options.width >= 3840 ? 50_000_000 : options.width >= 2560 ? 25_000_000 : 12_000_000,
    });

    const recordedChunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    recorder.start();

    const startTime = performance.now();
    const frameIntervalMs = 1000 / options.fps;

    for (let f = startFrame; f <= endFrame; f++) {
      if (signal.aborted) {
        recorder.stop();
        if (serverJobId) {
          fetch(`/api/render/${serverJobId}/cancel`, { method: 'POST' }).catch(() => {});
        }
        onProgress({
          stage: 'dibatalkan',
          stageLabel: 'Render Dibatalkan oleh Pengguna',
          progressPercent: 0,
          currentFrame: f - startFrame,
          totalFrames: frameCount,
          fpsSpeed: 0,
          etaSeconds: 0,
          jobId: serverJobId,
        });
        throw new Error('Render dibatalkan');
      }

      this.runtime.renderFrame(runScript, f, canvas);

      // Trigger frame capture on stream
      if (track && typeof track.requestFrame === 'function') {
        track.requestFrame();
      }

      const framesDone = f - startFrame + 1;
      const elapsedSec = (performance.now() - startTime) / 1000;
      const currentFps = elapsedSec > 0 ? framesDone / elapsedSec : 0;
      const remainingFrames = frameCount - framesDone;
      const eta = currentFps > 0 ? remainingFrames / currentFps : 0;
      const pct = Math.round((framesDone / frameCount) * 92);

      const progressState: RenderProgressState = {
        stage: 'menangkap_frame',
        stageLabel: `Menangkap & Merender Frame ${framesDone}/${frameCount} (${pct}%)`,
        progressPercent: pct,
        currentFrame: framesDone,
        totalFrames: frameCount,
        fpsSpeed: Math.round(currentFps * 10) / 10,
        etaSeconds: Math.round(eta),
        jobId: serverJobId,
      };

      onProgress(progressState);

      // Sync progress to server if active
      if (serverJobId && (framesDone % 15 === 0 || framesDone === frameCount)) {
        fetch(`/api/render/${serverJobId}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'capturing',
            progress: pct,
            currentFrame: framesDone,
            fpsSpeed: currentFps,
            etaSeconds: eta,
          }),
        }).catch(() => {});
      }

      // Allow frame rate timing for media recorder frame encoder
      await new Promise((r) => setTimeout(r, Math.max(10, Math.min(frameIntervalMs, 30))));
    }

    onProgress({
      stage: 'encoding',
      stageLabel: 'Finalisasi Encoding Video...',
      progressPercent: 95,
      currentFrame: frameCount,
      totalFrames: frameCount,
      fpsSpeed: 0,
      etaSeconds: 2,
      jobId: serverJobId,
    });

    const videoBlob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        const finalType = recorder.mimeType || 'video/mp4';
        const blob = new Blob(recordedChunks, { type: finalType });
        resolve(blob);
      };
      recorder.stop();
    });

    const extension = options.format === 'mp4' ? 'mp4' : 'webm';
    const safeName = (options.projectName || 'motion').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeName}_${options.width}x${options.height}_${options.fps}fps.${extension}`;

    // Upload output to server storage
    if (serverJobId) {
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((res) => {
          reader.onloadend = () => res(reader.result as string);
          reader.readAsDataURL(videoBlob);
        });
        const base64Data = await base64Promise;
        await fetch(`/api/render/${serverJobId}/upload-output`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Data, filename }),
        });
      } catch {
        // Fallback to client blob download
      }
    }

    const downloadUrl = serverJobId ? `/api/download/${serverJobId}` : URL.createObjectURL(videoBlob);

    onProgress({
      stage: 'selesai',
      stageLabel: 'Render Selesai! Video Siap Diunduh.',
      progressPercent: 100,
      currentFrame: frameCount,
      totalFrames: frameCount,
      fpsSpeed: 0,
      etaSeconds: 0,
      downloadUrl,
      downloadBlob: videoBlob,
      downloadFilename: filename,
      jobId: serverJobId,
    });

    return { blob: videoBlob, filename, jobId: serverJobId };
  }
}
