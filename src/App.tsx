/**
 * Xibay08 Motion Studio
 * Procedural JavaScript Motion Graphics Studio with Deterministic Real-time Preview & 4K Render Engine
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { CodeEditor } from './components/CodeEditor.tsx';
import { PreviewPanel } from './components/PreviewPanel.tsx';
import { TimelineControls } from './components/TimelineControls.tsx';
import { RenderModal } from './components/RenderModal.tsx';
import { TemplateModal } from './components/TemplateModal.tsx';
import { ProjectModal, SavedProject } from './components/ProjectModal.tsx';
import { AssetModal, MotionAsset } from './components/AssetModal.tsx';
import { ConsoleDrawer } from './components/ConsoleDrawer.tsx';
import { ApiDocsModal } from './components/ApiDocsModal.tsx';

import {
  MotionRuntime,
  AnimationConfig,
  CompiledMotionScript,
  RuntimeLogItem,
} from './engine/motionRuntime.ts';
import { MotionExporter, RenderOptions, RenderProgressState } from './export/exporter.ts';
import { TEMPLATES, MotionTemplate } from './templates/gallery.ts';

export default function App() {
  // Initialize default template: Acceptance Test #1 "Kotak Bergerak"
  const defaultTemplate = TEMPLATES[0];

  const [projectName, setProjectName] = useState(defaultTemplate.title);
  const [code, setCode] = useState(defaultTemplate.code);
  const [config, setConfig] = useState<AnimationConfig>({
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 6,
    backgroundColor: '#090a10',
  });

  const [compiledScript, setCompiledScript] = useState<CompiledMotionScript | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [errorLine, setErrorLine] = useState<number | null>(null);

  // Playback state
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [actualFps, setActualFps] = useState(30);
  const [lastExecutionTimeMs, setLastExecutionTimeMs] = useState(1.2);

  // Logs & Diagnostics
  const [logs, setLogs] = useState<RuntimeLogItem[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);

  // Modals state
  const [isRenderModalOpen, setIsRenderModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);

  // Render & Export Engine
  const [isRendering, setIsRendering] = useState(false);
  const [renderState, setRenderState] = useState<RenderProgressState | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<MotionRuntime>(new MotionRuntime());
  const exporterRef = useRef<MotionExporter>(new MotionExporter(runtimeRef.current));
  const animFrameIdRef = useRef<number | null>(null);
  const lastRenderTimeRef = useRef<number>(performance.now());
  const fpsFrameCountRef = useRef<number>(0);
  const fpsLastTimeRef = useRef<number>(performance.now());

  // Log handler
  useEffect(() => {
    runtimeRef.current.setLogCallback((item) => {
      setLogs((prev) => [...prev.slice(-300), item]);
    });
  }, []);

  // Compile user code
  const compileCode = useCallback(
    (codeToCompile: string) => {
      const result = runtimeRef.current.compile(codeToCompile);
      if (result.script) {
        setCompiledScript(result.script);
        setConfig(result.script.config);
        setCompileError(null);
        setErrorLine(null);
        return result.script;
      } else {
        setCompileError(result.error || 'Kesalahan sintaks');
        setErrorLine(result.line || null);
        return null;
      }
    },
    []
  );

  // Initial compilation on mount
  useEffect(() => {
    compileCode(code);
  }, []);

  // Frame rendering trigger
  const renderCurrentFrameToCanvas = useCallback(
    (frameNumber: number, scriptToUse?: CompiledMotionScript | null) => {
      const script = scriptToUse || compiledScript;
      if (!script || !canvasRef.current) return;

      const result = runtimeRef.current.renderFrame(script, frameNumber, canvasRef.current);
      if (result.executionTimeMs) {
        setLastExecutionTimeMs(result.executionTimeMs);
      }
      if (!result.success && result.error) {
        setCompileError(`Runtime: ${result.error}`);
      }
    },
    [compiledScript]
  );

  // Redraw when compiled script or frame changes (e.g. scrubbing or step)
  useEffect(() => {
    if (!isPlaying) {
      renderCurrentFrameToCanvas(currentFrame);
    }
  }, [currentFrame, compiledScript, isPlaying, renderCurrentFrameToCanvas]);

  // Main playback animation loop
  useEffect(() => {
    if (!isPlaying || !compiledScript) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    const targetFps = config.fps * playbackSpeed;
    const frameIntervalMs = 1000 / targetFps;
    const totalFrames = Math.max(1, Math.round(config.fps * config.duration));

    let frame = currentFrame;
    lastRenderTimeRef.current = performance.now();

    const loopStep = (now: number) => {
      const elapsed = now - lastRenderTimeRef.current;

      if (elapsed >= frameIntervalMs) {
        lastRenderTimeRef.current = now - (elapsed % frameIntervalMs);

        frame = frame + 1;
        if (frame >= totalFrames) {
          if (isLooping) {
            frame = 0;
          } else {
            setIsPlaying(false);
            setCurrentFrame(totalFrames - 1);
            return;
          }
        }

        setCurrentFrame(frame);
        renderCurrentFrameToCanvas(frame, compiledScript);

        // Real-time FPS calculation
        fpsFrameCountRef.current++;
        if (now - fpsLastTimeRef.current >= 500) {
          const calculated = (fpsFrameCountRef.current * 1000) / (now - fpsLastTimeRef.current);
          setActualFps(calculated);
          fpsFrameCountRef.current = 0;
          fpsLastTimeRef.current = now;
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loopStep);
    };

    animFrameIdRef.current = requestAnimationFrame(loopStep);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [
    isPlaying,
    compiledScript,
    config.fps,
    config.duration,
    playbackSpeed,
    isLooping,
    renderCurrentFrameToCanvas,
  ]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing inside textarea or input
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') return;

      const totalFrames = Math.max(1, Math.round(config.fps * config.duration));

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentFrame((prev) => Math.max(0, prev - 1));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentFrame((prev) => Math.min(totalFrames - 1, prev + 1));
      } else if (e.code === 'Home' || e.key === '0') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentFrame(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config.fps, config.duration]);

  // Handlers
  const handleRunCode = () => {
    const newScript = compileCode(code);
    if (newScript) {
      renderCurrentFrameToCanvas(currentFrame, newScript);
    }
  };

  const handleResetCode = () => {
    if (confirm('Kembalikan kode ke template awal?')) {
      setCode(defaultTemplate.code);
      setProjectName(defaultTemplate.title);
      compileCode(defaultTemplate.code);
      setCurrentFrame(0);
    }
  };

  const handleSelectTemplate = (template: MotionTemplate) => {
    setCode(template.code);
    setProjectName(template.title);
    const newScript = compileCode(template.code);
    if (newScript) {
      setCurrentFrame(0);
      renderCurrentFrameToCanvas(0, newScript);
    }
    setIsTemplateModalOpen(false);
  };

  const handleLoadProject = (proj: SavedProject) => {
    setCode(proj.code);
    setProjectName(proj.name);
    const newScript = compileCode(proj.code);
    if (newScript) {
      setCurrentFrame(0);
      renderCurrentFrameToCanvas(0, newScript);
    }
  };

  const handleNewProject = () => {
    const blankTemplate = `export const config = {
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 6,
  backgroundColor: '#0a0a0c',
};

export function setup(ctx, api) {
  // Inisialisasi
}

export function draw(ctx, api) {
  const { time, width, height, circle, roundedRect } = api;
  api.grid(60, { stroke: 'rgba(255, 255, 255, 0.05)' });

  // Tulis animasi baru di sini
  circle(width / 2, height / 2, 80, { fill: '#6366f1' });
}
`;
    setCode(blankTemplate);
    setProjectName('Proyek Baru');
    compileCode(blankTemplate);
    setCurrentFrame(0);
  };

  const handleAssetAdded = (asset: MotionAsset) => {
    if (asset.type === 'image' || asset.type === 'svg') {
      const img = new Image();
      img.src = asset.url;
      img.onload = () => {
        runtimeRef.current.registerAssetImage(asset.filename, img);
      };
    }
  };

  // Snapshot still frame PNG
  const handleSnapshotStill = async () => {
    if (!compiledScript) return;
    try {
      const { blob, filename } = await exporterRef.current.exportStillFrame(
        compiledScript,
        currentFrame,
        {
          projectName,
          width: config.width,
          height: config.height,
          fps: config.fps,
          duration: config.duration,
          format: 'still-png',
        }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Gagal mengambil still frame: ${err?.message || err}`);
    }
  };

  // Start video / sequence render
  const handleStartRender = async (options: RenderOptions) => {
    if (!compiledScript) return;
    setIsRendering(true);
    setIsPlaying(false);

    try {
      if (options.format === 'zip-png') {
        await exporterRef.current.exportPngSequence(
          compiledScript,
          options,
          (progressState) => {
            setRenderState(progressState);
          }
        );
      } else {
        await exporterRef.current.exportVideo(
          compiledScript,
          options,
          (progressState) => {
            setRenderState(progressState);
          }
        );
      }
    } catch (err: any) {
      if (err?.message !== 'Render dibatalkan') {
        setRenderState({
          stage: 'gagal',
          stageLabel: 'Render Gagal',
          progressPercent: 0,
          currentFrame: 0,
          totalFrames: 0,
          fpsSpeed: 0,
          etaSeconds: 0,
          error: err?.message || 'Terjadi kesalahan saat rendering',
        });
      }
    } finally {
      setIsRendering(false);
    }
  };

  const handleCancelRender = () => {
    exporterRef.current.cancel();
    setIsRendering(false);
  };

  const hasErrors = Boolean(compileError) || logs.some((l) => l.type === 'error');

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* 1. Header Toolbar */}
      <Header
        projectName={projectName}
        onProjectNameChange={setProjectName}
        config={config}
        onOpenTemplates={() => setIsTemplateModalOpen(true)}
        onOpenProjects={() => setIsProjectModalOpen(true)}
        onOpenAssets={() => setIsAssetModalOpen(true)}
        onOpenDocs={() => setIsDocsModalOpen(true)}
        onOpenRender={() => {
          setRenderState(null);
          setIsRenderModalOpen(true);
        }}
        onRunCode={handleRunCode}
        onResetCode={handleResetCode}
      />

      {/* 2. Main Workspace Split: Code Editor (Left) & Canvas Preview (Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Code Editor */}
        <div className="w-1/2 min-w-[340px] max-w-[55%] h-full">
          <CodeEditor
            code={code}
            onChange={(newCode) => {
              setCode(newCode);
              // Live compile on edit
              compileCode(newCode);
            }}
            onRun={handleRunCode}
            error={compileError}
            errorLine={errorLine}
          />
        </div>

        {/* Right Column: Live Deterministic Canvas Preview */}
        <div className="flex-1 h-full flex flex-col overflow-hidden">
          <PreviewPanel
            canvasRef={canvasRef}
            config={config}
            currentFrame={currentFrame}
            actualFps={actualFps}
          />
        </div>
      </div>

      {/* 3. Bottom Timeline Scrubber & Playback Controls */}
      <TimelineControls
        config={config}
        currentFrame={currentFrame}
        isPlaying={isPlaying}
        isLooping={isLooping}
        playbackSpeed={playbackSpeed}
        onPlayPause={() => setIsPlaying((p) => !p)}
        onStop={() => {
          setIsPlaying(false);
          setCurrentFrame(0);
        }}
        onStepBackward={() => {
          setIsPlaying(false);
          setCurrentFrame((f) => Math.max(0, f - 1));
        }}
        onStepForward={() => {
          const total = Math.max(1, Math.round(config.fps * config.duration));
          setIsPlaying(false);
          setCurrentFrame((f) => Math.min(total - 1, f + 1));
        }}
        onScrub={(targetFrame) => {
          setIsPlaying(false);
          setCurrentFrame(targetFrame);
        }}
        onToggleLoop={() => setIsLooping((l) => !l)}
        onChangeSpeed={setPlaybackSpeed}
        onSnapshotStill={handleSnapshotStill}
        onToggleConsole={() => setIsConsoleOpen((c) => !c)}
        logCount={logs.length}
        hasErrors={hasErrors}
      />

      {/* 4. Bottom Collapsible Console & Diagnostics Drawer */}
      <ConsoleDrawer
        isOpen={isConsoleOpen}
        onClose={() => setIsConsoleOpen(false)}
        logs={logs}
        onClear={() => {
          runtimeRef.current.clearLogs();
          setLogs([]);
        }}
        executionTimeMs={lastExecutionTimeMs}
      />

      {/* 5. Modals */}
      <RenderModal
        isOpen={isRenderModalOpen}
        onClose={() => setIsRenderModalOpen(false)}
        config={config}
        projectName={projectName}
        isRendering={isRendering}
        renderState={renderState}
        onStartRender={handleStartRender}
        onCancelRender={handleCancelRender}
      />

      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        currentName={projectName}
        currentCode={code}
        currentConfig={config}
        onLoadProject={handleLoadProject}
        onNewProject={handleNewProject}
      />

      <AssetModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        onAssetAdded={handleAssetAdded}
      />

      <ApiDocsModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
      />
    </div>
  );
}
