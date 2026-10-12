import React, { useState, useEffect } from 'react';
import {
  X,
  FolderOpen,
  Save,
  Plus,
  Trash2,
  Download,
  Upload,
  Calendar,
  Layers,
} from 'lucide-react';
import { AnimationConfig } from '../engine/motionRuntime.ts';

export interface SavedProject {
  id: string;
  name: string;
  description?: string;
  config: AnimationConfig;
  code: string;
  updatedAt: number;
}

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentCode: string;
  currentConfig: AnimationConfig;
  onLoadProject: (project: SavedProject) => void;
  onNewProject: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  currentName,
  currentCode,
  currentConfig,
  onLoadProject,
  onNewProject,
}) => {
  if (!isOpen) return null;

  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [saveName, setSaveName] = useState(currentName);
  const [saveDesc, setSaveDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch projects from server / local storage
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        if (data.projects && Array.isArray(data.projects)) {
          setProjects(data.projects);
          return;
        }
      }
    } catch {
      // Fallback to local storage
    } finally {
      setLoading(false);
    }

    // LocalStorage fallback
    const saved = localStorage.getItem('xibay_projects');
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
      } catch {
        setProjects([]);
      }
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [isOpen]);

  const handleSaveCurrent = async () => {
    const newProject: SavedProject = {
      id: 'proj_' + Date.now(),
      name: saveName.trim() || 'Untitled Project',
      description: saveDesc.trim(),
      config: currentConfig,
      code: currentCode,
      updatedAt: Date.now(),
    };

    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
    } catch {
      // Local fallback
    }

    // Always update localStorage
    const updated = [newProject, ...projects.filter((p) => p.name !== newProject.name)];
    localStorage.setItem('xibay_projects', JSON.stringify(updated));
    setProjects(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Hapus proyek ini?')) return;

    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    } catch {
      // Ignore
    }

    const updated = projects.filter((p) => p.id !== id);
    localStorage.setItem('xibay_projects', JSON.stringify(updated));
    setProjects(updated);
  };

  const handleExportJSON = () => {
    const data = {
      name: currentName,
      config: currentConfig,
      code: currentCode,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentName.replace(/[^a-zA-Z0-9_-]/g, '_')}.motion.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.code) {
          const importedProject: SavedProject = {
            id: 'proj_' + Date.now(),
            name: parsed.name || file.name.replace('.json', ''),
            description: parsed.description || 'Diimpor dari file JSON',
            config: parsed.config || currentConfig,
            code: parsed.code,
            updatedAt: Date.now(),
          };
          onLoadProject(importedProject);
          onClose();
        }
      } catch {
        alert('Format file JSON tidak valid');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Space_Grotesk']">
                Manajemen Proyek
              </h2>
              <p className="text-xs text-zinc-400">
                Simpan, buka, atau ekspor proyek animasi Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Save Current Section */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/40">
          <div className="text-xs font-semibold text-zinc-300 mb-2">Simpan Proyek Saat Ini</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Nama Proyek..."
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-amber-500"
            />
            <input
              type="text"
              value={saveDesc}
              onChange={(e) => setSaveDesc(e.target.value)}
              placeholder="Deskripsi singkat (opsional)..."
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-amber-500"
            />
            <button
              onClick={handleSaveCurrent}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saveSuccess ? 'Tersimpan!' : 'Simpan'}</span>
            </button>
          </div>
        </div>

        {/* Projects List & Tools */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Daftar Proyek Tersimpan ({projects.length})
            </span>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Impor JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
                title="Unduh Proyek Saat Ini sebagai File JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor JSON</span>
              </button>

              <button
                onClick={() => {
                  onNewProject();
                  onClose();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Proyek Baru</span>
              </button>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              Belum ada proyek tersimpan. Simpan proyek saat ini menggunakan form di atas!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => {
                    onLoadProject(proj);
                    onClose();
                  }}
                  className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950 hover:border-amber-500/50 hover:bg-zinc-950/80 cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-zinc-100 group-hover:text-amber-300 transition-colors">
                        {proj.name}
                      </h4>
                      <button
                        onClick={(e) => handleDelete(proj.id, e)}
                        className="text-zinc-500 hover:text-rose-400 p-1 rounded hover:bg-zinc-900 transition-colors"
                        title="Hapus Proyek"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {proj.description && (
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
                        {proj.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span>
                      {proj.config?.width || 1920}x{proj.config?.height || 1080} • {proj.config?.fps || 30} FPS
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(proj.updatedAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
