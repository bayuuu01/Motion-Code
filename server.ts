import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Ensure required directories exist
const projectsDir = path.resolve(__dirname, 'projects');
const assetsDir = path.resolve(__dirname, 'assets');
const outputsDir = path.resolve(__dirname, 'outputs');
const tmpDir = path.resolve(__dirname, 'tmp');

[projectsDir, assetsDir, outputsDir, tmpDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

interface RenderJob {
  id: string;
  projectName: string;
  config: {
    width: number;
    height: number;
    fps: number;
    duration: number;
    crf?: number;
    codec?: string;
  };
  code: string;
  status: 'queued' | 'preparing' | 'capturing' | 'encoding' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0 to 100
  currentFrame: number;
  totalFrames: number;
  fpsSpeed: number;
  etaSeconds: number;
  outputFile?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

const renderJobs = new Map<string, RenderJob>();
const sseClients = new Map<string, express.Response[]>();

function notifyJobUpdate(job: RenderJob) {
  job.updatedAt = Date.now();
  const clients = sseClients.get(job.id) || [];
  const payload = `data: ${JSON.stringify(job)}\n\n`;
  for (const client of clients) {
    try {
      client.write(payload);
    } catch {
      // client disconnected
    }
  }
}

async function startServer() {
  const app = express();

  // Support JSON and urlencoded with generous payload limits
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // Static directory for uploaded assets
  app.use('/assets-storage', express.static(assetsDir));
  app.use('/outputs-storage', express.static(outputsDir));

  // 1. System Status API
  app.get('/api/system/status', (_req, res) => {
    res.json({
      status: 'online',
      activeJobs: Array.from(renderJobs.values()).filter(j => j.status === 'capturing' || j.status === 'encoding').length,
      directories: {
        projects: projectsDir,
        assets: assetsDir,
        outputs: outputsDir,
      },
      supportedResolutions: [
        { label: '720p HD (1280x720)', width: 1280, height: 720 },
        { label: '1080p Full HD (1920x1080)', width: 1920, height: 1080 },
        { label: '1440p 2K (2560x1440)', width: 2560, height: 1440 },
        { label: '4K Ultra HD (3840x2160)', width: 3840, height: 2160 },
      ],
      memoryUsage: process.memoryUsage(),
    });
  });

  // 2. Render Jobs Endpoints
  app.post('/api/render', (req, res) => {
    try {
      const { projectName = 'Untitled Motion', config, code } = req.body;
      const totalFrames = Math.max(1, Math.round((config?.fps || 30) * (config?.duration || 10)));
      const jobId = 'job_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

      const job: RenderJob = {
        id: jobId,
        projectName,
        config: {
          width: config?.width || 1920,
          height: config?.height || 1080,
          fps: config?.fps || 30,
          duration: config?.duration || 10,
          crf: config?.crf || 18,
          codec: config?.codec || 'libx264',
        },
        code: code || '',
        status: 'preparing',
        progress: 0,
        currentFrame: 0,
        totalFrames,
        fpsSpeed: 0,
        etaSeconds: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      renderJobs.set(jobId, job);
      res.json({ success: true, jobId, job });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal membuat job render';
      res.status(500).json({ success: false, error: message });
    }
  });

  app.get('/api/render/:id', (req, res) => {
    const job = renderJobs.get(req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job tidak ditemukan' });
      return;
    }
    res.json(job);
  });

  // SSE progress stream
  app.get('/api/render/:id/events', (req, res) => {
    const jobId = req.params.id;
    const job = renderJobs.get(jobId);

    if (!job) {
      res.status(404).json({ error: 'Job tidak ditemukan' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Initial message
    res.write(`data: ${JSON.stringify(job)}\n\n`);

    if (!sseClients.has(jobId)) {
      sseClients.set(jobId, []);
    }
    sseClients.get(jobId)!.push(res);

    req.on('close', () => {
      const clients = sseClients.get(jobId) || [];
      sseClients.set(jobId, clients.filter((c) => c !== res));
    });
  });

  // Update progress / status from client or background renderer
  app.post('/api/render/:id/progress', (req, res) => {
    const job = renderJobs.get(req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job tidak ditemukan' });
      return;
    }

    const { status, progress, currentFrame, fpsSpeed, etaSeconds, error, outputFile } = req.body;
    if (status !== undefined) job.status = status;
    if (progress !== undefined) job.progress = progress;
    if (currentFrame !== undefined) job.currentFrame = currentFrame;
    if (fpsSpeed !== undefined) job.fpsSpeed = fpsSpeed;
    if (etaSeconds !== undefined) job.etaSeconds = etaSeconds;
    if (error !== undefined) job.error = error;
    if (outputFile !== undefined) job.outputFile = outputFile;

    notifyJobUpdate(job);
    res.json({ success: true, job });
  });

  // Cancel job
  app.post('/api/render/:id/cancel', (req, res) => {
    const job = renderJobs.get(req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job tidak ditemukan' });
      return;
    }
    job.status = 'cancelled';
    job.progress = 0;
    notifyJobUpdate(job);
    res.json({ success: true, message: 'Job dibatalkan', job });
  });

  // Upload completed render blob
  app.post('/api/render/:id/upload-output', (req, res) => {
    const job = renderJobs.get(req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job tidak ditemukan' });
      return;
    }
    const { base64Data, filename } = req.body;
    if (!base64Data) {
      res.status(400).json({ error: 'Data output kosong' });
      return;
    }

    const safeFilename = filename || `${job.projectName.replace(/[^a-z0-9_-]/gi, '_')}_${job.id}.mp4`;
    const targetPath = path.join(outputsDir, safeFilename);

    const buffer = Buffer.from(base64Data.replace(/^data:[^;]+;base64,/, ''), 'base64');
    fs.writeFileSync(targetPath, buffer);

    job.status = 'completed';
    job.progress = 100;
    job.outputFile = safeFilename;
    notifyJobUpdate(job);

    res.json({ success: true, downloadUrl: `/api/download/${job.id}` });
  });

  // Download endpoint
  app.get('/api/download/:id', (req, res) => {
    const job = renderJobs.get(req.params.id);
    if (!job || !job.outputFile) {
      res.status(404).send('File render belum siap atau tidak ditemukan');
      return;
    }

    const filePath = path.join(outputsDir, job.outputFile);
    if (!fs.existsSync(filePath)) {
      res.status(404).send('File tidak ditemukan di penyimpanan server');
      return;
    }

    res.download(filePath, job.outputFile);
  });

  // 3. Projects API (Save, Load, List, Delete)
  app.get('/api/projects', (_req, res) => {
    try {
      const files = fs.readdirSync(projectsDir).filter((f) => f.endsWith('.json'));
      const projects = files.map((file) => {
        try {
          const content = fs.readFileSync(path.join(projectsDir, file), 'utf-8');
          const data = JSON.parse(content);
          return {
            filename: file,
            id: data.id || file.replace('.json', ''),
            name: data.name || file.replace('.json', ''),
            updatedAt: data.updatedAt || fs.statSync(path.join(projectsDir, file)).mtimeMs,
            config: data.config,
            description: data.description || '',
          };
        } catch {
          return null;
        }
      }).filter(Boolean);

      projects.sort((a, b) => (b?.updatedAt || 0) - (a?.updatedAt || 0));
      res.json({ projects });
    } catch (err) {
      res.status(500).json({ error: 'Gagal membaca daftar proyek' });
    }
  });

  app.get('/api/projects/:id', (req, res) => {
    const filename = req.params.id.endsWith('.json') ? req.params.id : `${req.params.id}.json`;
    const targetPath = path.join(projectsDir, filename);

    if (!fs.existsSync(targetPath)) {
      res.status(404).json({ error: 'Proyek tidak ditemukan' });
      return;
    }

    try {
      const content = fs.readFileSync(targetPath, 'utf-8');
      res.json(JSON.parse(content));
    } catch {
      res.status(500).json({ error: 'Format proyek rusak' });
    }
  });

  app.post('/api/projects', (req, res) => {
    try {
      const { id, name = 'Untitled Project', config, code, description = '' } = req.body;
      const projectId = id || 'proj_' + Date.now();
      const safeFilename = `${projectId}.json`;
      const targetPath = path.join(projectsDir, safeFilename);

      const projectData = {
        id: projectId,
        name,
        description,
        config: config || { width: 1920, height: 1080, fps: 30, duration: 10 },
        code: code || '',
        updatedAt: Date.now(),
        createdAt: req.body.createdAt || Date.now(),
      };

      fs.writeFileSync(targetPath, JSON.stringify(projectData, null, 2), 'utf-8');
      res.json({ success: true, project: projectData });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan proyek';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/projects/:id', (req, res) => {
    const filename = req.params.id.endsWith('.json') ? req.params.id : `${req.params.id}.json`;
    const targetPath = path.join(projectsDir, filename);

    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Proyek tidak ditemukan' });
    }
  });

  // 4. Assets API
  app.get('/api/assets', (_req, res) => {
    try {
      const files = fs.readdirSync(assetsDir);
      const assets = files.map((file) => {
        const stat = fs.statSync(path.join(assetsDir, file));
        const ext = path.extname(file).toLowerCase();
        let type = 'image';
        if (['.mp3', '.wav', '.ogg', '.aac'].includes(ext)) type = 'audio';
        if (['.ttf', '.otf', '.woff', '.woff2'].includes(ext)) type = 'font';
        if (['.svg'].includes(ext)) type = 'svg';

        return {
          filename: file,
          name: file,
          url: `/assets-storage/${encodeURIComponent(file)}`,
          size: stat.size,
          type,
          updatedAt: stat.mtimeMs,
        };
      });
      res.json({ assets });
    } catch {
      res.status(500).json({ error: 'Gagal membaca daftar aset' });
    }
  });

  app.post('/api/assets', (req, res) => {
    try {
      const { filename, base64Data } = req.body;
      if (!filename || !base64Data) {
        res.status(400).json({ error: 'Filename dan base64Data diperlukan' });
        return;
      }

      const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const targetPath = path.join(assetsDir, cleanFilename);
      const buffer = Buffer.from(base64Data.replace(/^data:[^;]+;base64,/, ''), 'base64');
      fs.writeFileSync(targetPath, buffer);

      const ext = path.extname(cleanFilename).toLowerCase();
      let type = 'image';
      if (['.mp3', '.wav', '.ogg', '.aac'].includes(ext)) type = 'audio';
      if (['.ttf', '.otf', '.woff', '.woff2'].includes(ext)) type = 'font';
      if (['.svg'].includes(ext)) type = 'svg';

      res.json({
        success: true,
        asset: {
          filename: cleanFilename,
          name: cleanFilename,
          url: `/assets-storage/${encodeURIComponent(cleanFilename)}`,
          size: buffer.length,
          type,
          updatedAt: Date.now(),
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mengunggah aset';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/assets/:filename', (req, res) => {
    const targetPath = path.join(assetsDir, req.params.filename);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Aset tidak ditemukan' });
    }
  });

  // Vite Integration (Dev middleware mode)
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Xibay08 Motion Studio] Server berjalan pada http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Xibay08 Motion Studio] Gagal memulai server:', err);
  process.exit(1);
});
