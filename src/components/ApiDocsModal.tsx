import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Code,
  Sparkles,
  Layers,
  Activity,
  Copy,
  Check,
  Zap,
} from 'lucide-react';

interface ApiDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiDocsModal: React.FC<ApiDocsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'kontrak' | 'properti' | 'waktu' | 'grafis' | 'prosedural'>('kontrak');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Space_Grotesk']">
                Dokumentasi API Motion Studio
              </h2>
              <p className="text-xs text-zinc-400">
                Panduan lengkap menulis kode motion graphics deterministik dalam Bahasa Indonesia
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

        {/* Navigation Tabs */}
        <div className="p-3 border-b border-zinc-800 bg-zinc-950/20 flex gap-2 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'kontrak', label: '1. Kontrak Animasi' },
            { id: 'properti', label: '2. Properti Objek API' },
            { id: 'waktu', label: '3. Interpolasi & Spring' },
            { id: 'grafis', label: '4. Grafis 2D & Trim Path' },
            { id: 'prosedural', label: '5. Noise, Acak & Partikel' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-zinc-300 leading-relaxed font-sans">
          {activeTab === 'kontrak' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" />
                <span>Struktur Utama & Sifat Deterministik</span>
              </h3>
              <p>
                Setiap animasi ditulis sebagai fungsi murni yang menerima state waktu, bukan memakai waktu nyata.
                Hal ini menjamin hasil <strong>100% deterministik</strong>: scrubbing maju atau mundur ke frame N akan selalu menghasilkan gambar yang identik pixel-perfect.
              </p>

              <div className="relative bg-zinc-950 rounded-xl p-4 border border-zinc-800 font-mono text-[12px]">
                <button
                  onClick={() =>
                    copyCode(
                      `export const config = {\n  width: 1920,\n  height: 1080,\n  fps: 30,\n  duration: 10,\n  backgroundColor: '#0a0a0c'\n};\n\nexport function setup(ctx, api) {\n  // Inisialisasi satu kali saat script dimuat\n}\n\nexport function draw(ctx, api) {\n  const { frame, time, progress, width, height } = api;\n  // Gambar frame ke-frame pada waktu time detik\n}`,
                      1
                    )
                  }
                  className="absolute top-3 right-3 p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  title="Salin Kode"
                >
                  {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <pre className="text-zinc-200 overflow-x-auto leading-relaxed">
{`export const config = {
  width: 1920,      // Resolusi lebar kanvas (px)
  height: 1080,     // Resolusi tinggi kanvas (px)
  fps: 30,          // Frame rate (24, 30, 60)
  duration: 10,     // Durasi video dalam detik
  backgroundColor: '#0a0a0c' // Warna latar kanvas
};

export function setup(ctx, api) {
  // Inisialisasi satu kali saat script dimuat
}

export function draw(ctx, api) {
  const { frame, time, progress, width, height } = api;
  // Gambar frame ke-frame pada detik time secara deterministik!
}`}
                </pre>
              </div>

              <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                <strong>Aturan Wajib:</strong> Fungsi <code>Math.random()</code>, <code>Date.now()</code>, dan <code>performance.now()</code> telah di-override secara internal oleh engine dengan generator acak ber-seed agar hasil render selalu konsisten. Jangan menyimpan mutasi antar frame di variabel global luar!
              </div>
            </div>
          )}

          {activeTab === 'properti' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Daftar Properti Parameter `api`</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                {[
                  { name: 'api.frame', desc: 'Nomor frame aktif saat ini (integer, mulai dari 0)' },
                  { name: 'api.time', desc: 'Waktu saat ini dalam detik (frame / fps)' },
                  { name: 'api.progress', desc: 'Progres durasi keseluruhan (desimal antara 0.0 sampai 1.0)' },
                  { name: 'api.width, api.height', desc: 'Dimensi kanvas saat ini dalam piksel' },
                  { name: 'api.fps', desc: 'Frame rate aktif (misal 30 atau 60)' },
                  { name: 'api.duration', desc: 'Total durasi animasi dalam detik' },
                  { name: 'api.totalFrames', desc: 'Total frame durasi (fps * duration)' },
                  { name: 'api.scale', desc: 'Faktor skala relatif terhadap 1920x1080 (agar responsif)' },
                ].map((item) => (
                  <div key={item.name} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                    <div className="text-emerald-400 font-bold">{item.name}</div>
                    <div className="text-zinc-400 font-sans mt-1 text-xs">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'waktu' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Interpolasi, Keyframes & Spring Physics Analitik</span>
              </h3>

              <div className="space-y-3">
                <h4 className="font-bold text-zinc-100 text-xs">1. Keyframes Interpolator</h4>
                <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800 font-mono text-[11px]">
                  <pre className="text-zinc-200">
{`// Nilai x bergerak dari 100 ke 800 antara detik ke-1 sampai ke-3 menggunakan ease-out bounce
const x = api.keyframes([
  [0, 100],
  [1.0, 100],
  [3.0, 800, api.ease.outBounce],
  [5.0, 400, api.ease.inOutCubic]
]);`}
                  </pre>
                </div>

                <h4 className="font-bold text-zinc-100 text-xs">2. Analytic Spring Physics</h4>
                <p>
                  Dihitung secara formula analitik tertutup (bukan simulasi loop langkah bertahap), sehingga dapat di-scrub maju dan mundur tanpa memory leak atau drift.
                </p>
                <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800 font-mono text-[11px]">
                  <pre className="text-zinc-200">
{`const popScale = api.spring({
  stiffness: 140, // Kekakuan pegas (k)
  damping: 12,    // Peredam getaran (c)
  mass: 1,        // Massa (m)
  start: 0,       // Nilai awal
  target: 1       // Nilai target
});`}
                  </pre>
                </div>

                <h4 className="font-bold text-zinc-100 text-xs">3. Fungsi Pembantu Matematika</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
                    <span className="text-indigo-400">api.lerp(a, b, t)</span>: Interpolasi linier
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
                    <span className="text-indigo-400">api.clamp(val, min, max)</span>: Batasi rentang angka
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
                    <span className="text-indigo-400">api.map(v, inMin, inMax, outMin, outMax)</span>: Pemetaan skala
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
                    <span className="text-indigo-400">api.lerpColor(colorA, colorB, t)</span>: Interpolasi warna
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'grafis' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Bentuk Grafis 2D & After Effects-style Trim Path</span>
              </h3>

              <div className="space-y-3 font-mono text-[11px]">
                <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800">
                  <div className="text-indigo-400 font-bold mb-1">// Bentuk Dasar</div>
                  <pre className="text-zinc-200">
{`api.rect(x, y, w, h, { fill: '#6366f1' });
api.roundedRect(x, y, w, h, 16, { fill: '#38bdf8', stroke: '#ffffff', lineWidth: 2 });
api.circle(cx, cy, radius, { fill: '#ec4899', shadowColor: '#ec4899', shadowBlur: 20 });
api.polygon(cx, cy, radius, 6, rotation, { stroke: '#818cf8', lineWidth: 3 });
api.star(cx, cy, innerR, outerR, 5, rotation, { fill: '#fbbf24' });
api.ring(cx, cy, innerR, outerR, startAngle, endAngle, { fill: '#10b981' });
api.grid(spacing, { stroke: 'rgba(255,255,255,0.05)' });`}
                  </pre>
                </div>

                <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800">
                  <div className="text-emerald-400 font-bold mb-1">// AE Trim Path Stroke Animation</div>
                  <pre className="text-zinc-200">
{`const points = [{x: 100, y: 100}, {x: 400, y: 250}, {x: 800, y: 100}];
const strokeProg = api.keyframes([[0.5, 0], [2.0, 1, api.ease.inOutCubic]]);

// Menggambar garis stroke secara progresif dari 0% ke strokeProg
api.trimPath(points, 0, strokeProg, { stroke: '#38bdf8', lineWidth: 4 });`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'prosedural' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Noise Prosedural, Generator Acak Ber-seed & Partikel</span>
              </h3>

              <div className="space-y-3 font-mono text-[11px]">
                <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800">
                  <div className="text-sky-400 font-bold mb-1">// Simplex Noise 2D / 3D</div>
                  <pre className="text-zinc-200">
{`// Menghasilkan nilai mulus (-1 hingga 1) untuk gelombang atau pergerakan organik
const n = api.noise(x * 0.005, y * 0.005, api.time * 0.5);`}
                  </pre>
                </div>

                <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800">
                  <div className="text-amber-400 font-bold mb-1">// Generator Acak Ber-seed</div>
                  <pre className="text-zinc-200">
{`api.random(seed);               // Bilangan acak 0..1 berbasis seed
api.randomRange(min, max, seed);// Angka acak desimal min..max
api.randomInt(min, max, seed);  // Angka bulat min..max
api.pick(array, seed);          // Memilih 1 elemen secara deterministik`}
                  </pre>
                </div>

                <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800">
                  <div className="text-indigo-400 font-bold mb-1">// Sistem Partikel Deterministik & Post-FX</div>
                  <pre className="text-zinc-200">
{`// Partikel dihitung langsung dari waktu tanpa dependensi antar-frame
api.particles({ count: 150, seed: 42, speedMin: 40, speedMax: 160 });

// Efek Vignette & Film Grain lembut
api.vignette(0.65, 0.9);
api.filmGrain(0.05);`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
