# Xibay08 Motion Studio

Aplikasi web lokal untuk membuat motion graphics prosedural berbasis kode JavaScript dengan pratinjau deterministik real-time dan ekspor video hingga resolusi 4K (3840 x 2160).

---

## 🚀 Cara Menjalankan di Localhost

### 1. Prasyarat Sistem
- **Node.js**: Versi 18.x atau lebih baru ([Unduh Node.js](https://nodejs.org/))
- **NPM** atau **PNPM / Yarn**
- *(Opsional)* **FFmpeg** terpasang di sistem PATH jika ingin memanfaatkan akselerasi pipeline encoding server secara langsung.

### 2. Instalasi Dependensi
Buka terminal di direktori proyek ini, lalu jalankan:
```bash
npm install
```

### 3. Jalankan Server Dev Lokal
Jalankan perintah berikut:
```bash
npm run dev
```
Server Express + Vite akan otomatis berjalan di:
```text
http://localhost:3000
```
Buka URL di atas menggunakan browser modern (Chrome, Edge, Firefox, Safari).

---

## 🎬 Cara Merender & Menyimpan Hasil Video

### 1. Merender Video (MP4 / WebM / PNG Sequence)
1. Buka editor dan pilih atau tulis kode animasi Anda.
2. Klik tombol berkilau **"Render & Ekspor"** di pojok kanan atas layar.
3. Konfigurasikan opsi render:
   - **Resolusi**: 720p HD, 1080p FHD (1920x1080), 1440p 2K, atau 4K UHD (3840x2160).
   - **Format**:
     - `MP4 Video (H.264)`: Video standar siap putar di VLC, browser, dan media sosial.
     - `WebM Video (VP9)`: Video web berkualitas tinggi (mendukung background transparan).
     - `PNG Sequence (ZIP)`: Seluruh frame individual disimpan dalam 1 file ZIP (cocok untuk diimpor ke After Effects, Premiere, atau DaVinci Resolve).
   - **Frame Rate (FPS)**: 24, 30, atau 60 FPS.
   - **Kualitas (CRF)**: 14 (Lossless/Tertinggi) hingga 28 (Ringan).
   - **Latar Belakang**: Solid atau Transparan (*Alpha Channel*).
4. Klik tombol **"Mulai Render Sekarang"**.
5. Sistem akan merender setiap frame secara deterministik. Anda dapat melihat progres bar persen, kecepatan FPS, dan perkiraan sisa waktu (ETA).
6. Setelah selesai, video dapat diputar langsung di pratinjau modal, dan klik tombol **"Unduh Hasil Render"** untuk menyimpannya ke folder **Downloads** komputer Anda.
7. Di sisi server lokal, file hasil render juga otomatis tersimpan di folder:
   ```text
   outputs/<nama_proyek>_<job_id>.mp4
   ```

### 2. Menyimpan Tangkapan Frame Tunggal (Still PNG)
- Geser scrubber timeline ke frame yang ingin Anda simpan.
- Klik tombol **"Still PNG"** di bilah kontrol timeline bawah. File gambar `.png` beresolusi penuh akan langsung terunduh.

### 3. Menyimpan & Mengelola Proyek Animasi
- Klik tombol **"Proyek"** di bilah atas:
  - **Simpan**: Ketik nama proyek lalu klik *Simpan*. Proyek akan disimpan di folder `projects/<id>.json` lokal dan penyimpanan browser.
  - **Ekspor JSON**: Mengunduh kode & konfigurasi sebagai file `.motion.json` untuk cadangan atau dibagikan ke perangkat lain.
  - **Impor JSON**: Membuka kembali file proyek yang telah disimpan sebelumnya.
