import React, { useState, useEffect } from 'react';
import {
  X,
  Image as ImageIcon,
  Upload,
  Copy,
  Check,
  Trash2,
  FileText,
  Music,
  Type,
} from 'lucide-react';

export interface MotionAsset {
  filename: string;
  name: string;
  url: string;
  size: number;
  type: string;
  updatedAt: number;
}

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetAdded?: (asset: MotionAsset) => void;
}

export const AssetModal: React.FC<AssetModalProps> = ({
  isOpen,
  onClose,
  onAssetAdded,
}) => {
  if (!isOpen) return null;

  const [assets, setAssets] = useState<MotionAsset[]>([]);
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/assets');
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
        return;
      }
    } catch {
      // Local fallback
    }

    const local = localStorage.getItem('xibay_assets');
    if (local) {
      try {
        setAssets(JSON.parse(local));
      } catch {
        setAssets([]);
      }
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

      try {
        const res = await fetch('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: cleanName, base64Data }),
        });
        if (res.ok) {
          const data = await res.json();
          setAssets((prev) => [data.asset, ...prev]);
          onAssetAdded?.(data.asset);
          setIsUploading(false);
          return;
        }
      } catch {
        // Fallback
      }

      // LocalStorage fallback
      const ext = cleanName.split('.').pop()?.toLowerCase() || '';
      let type = 'image';
      if (['mp3', 'wav', 'ogg'].includes(ext)) type = 'audio';
      if (['ttf', 'otf', 'woff', 'woff2'].includes(ext)) type = 'font';

      const localAsset: MotionAsset = {
        filename: cleanName,
        name: cleanName,
        url: base64Data,
        size: file.size,
        type,
        updatedAt: Date.now(),
      };

      const updated = [localAsset, ...assets];
      setAssets(updated);
      localStorage.setItem('xibay_assets', JSON.stringify(updated));
      onAssetAdded?.(localAsset);
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleCopySnippet = (filename: string) => {
    const snippet = `const img = api.getImage('${filename}');\nif (img) ctx.drawImage(img, x, y);`;
    navigator.clipboard.writeText(snippet);
    setCopiedName(filename);
    setTimeout(() => setCopiedName(null), 2000);
  };

  const handleDelete = async (filename: string) => {
    try {
      await fetch(`/api/assets/${filename}`, { method: 'DELETE' });
    } catch {
      // Ignore
    }
    const updated = assets.filter((a) => a.filename !== filename);
    setAssets(updated);
    localStorage.setItem('xibay_assets', JSON.stringify(updated));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Space_Grotesk']">
                Asset Manager (Gambar, SVG, Audio)
              </h2>
              <p className="text-xs text-zinc-400">
                Unggah dan panggil aset dari kode animasi Anda via <code className="text-sky-300 font-mono">api.getImage()</code>
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

        {/* Upload Zone */}
        <div className="p-5 border-b border-zinc-800 bg-zinc-950/30">
          <label className="border-2 border-dashed border-zinc-800 hover:border-sky-500/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group">
            <Upload className="w-7 h-7 text-zinc-500 group-hover:text-sky-400 transition-colors mb-2" />
            <span className="text-xs font-semibold text-zinc-200">
              {isUploading ? 'Mengunggah aset...' : 'Klik atau seret file gambar (PNG, JPG, SVG) ke sini'}
            </span>
            <span className="text-[10px] text-zinc-500 mt-1">
              Aset akan disimpan lokal di folder assets/ server
            </span>
            <input
              type="file"
              accept="image/*,.svg,audio/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>

        {/* Asset List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Aset Tersedia ({assets.length})
          </div>

          {assets.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              Belum ada aset terunggah. Unggah logo atau ilustrasi untuk digunakan dalam animasi!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {assets.map((asset) => (
                <div
                  key={asset.filename}
                  className="p-3 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {/* Thumbnail preview */}
                    <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                      {asset.type === 'image' || asset.type === 'svg' ? (
                        <img
                          src={asset.url}
                          alt={asset.name}
                          className="w-full h-full object-contain"
                        />
                      ) : asset.type === 'audio' ? (
                        <Music className="w-5 h-5 text-amber-400" />
                      ) : (
                        <FileText className="w-5 h-5 text-zinc-400" />
                      )}
                    </div>

                    <div className="overflow-hidden">
                      <div className="font-mono text-xs font-bold text-zinc-200 truncate">
                        {asset.name}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {formatSize(asset.size)} • {asset.type.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopySnippet(asset.filename)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-[11px] font-mono transition-colors"
                      title="Salin Cuplikan Kode"
                    >
                      {copiedName === asset.filename ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Salin</span>
                    </button>

                    <button
                      onClick={() => handleDelete(asset.filename)}
                      className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 transition-colors"
                      title="Hapus Aset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
