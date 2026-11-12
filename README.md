# Dunia SMA Cahaya Nusantara - Website Sekolah 3D Interaktif

Website sekolah 3D interaktif berbasis WebGL / Three.js yang memungkinkan calon siswa dan pengunjung menjelajahi lingkungan kampus virtual, memasuki gedung-gedung sekolah, berinteraksi dengan karakter, mengumpulkan bintang fakta, dan mengakses informasi lengkap sekolah (Profil, Jurusan, Ekstrakurikuler, serta Pendaftaran Siswa Baru / PPDB).

---

## 🌟 Fitur Utama

1. **Gerbang Utama & Halaman Kampus 3D Super Luas**
   - **Halaman Sekolah Luas & Lapang**: Area pulau kampus diperluas hampir 2x lipat (radius 48-53m) dengan lapangan upacara dan olahraga serbaguna (basket/futsal lengkap dengan ring & garis lapangan) di bagian tengah.
   - **Gerbang Sekolah Megah (Main Gate) dengan Fitur Tutup & Buka**:
     - Terinspirasi dari gambar referensi nyata dengan pilar terracotta kokoh, kanopi pelindung, plang nama "SMA CAHAYA NUSANTARA", dua daun pintu besi biru (bukaan 7.4m), pos satpam, NPC Pak Budi (petugas keamanan), serta pagar tembok keliling sekolah (*perimeter wall*).
     - **Fitur Interaktif Buka/Tutup Gerbang (3D & AR)**:
       - Daun gerbang besi biru kiri dan kanan dapat dibuka lebar atau ditutup rapat secara halus dengan efek suara besi gerbang (`sfx('gate')`).
       - Memiliki 3 metode interaksi: Tombol aksi `E` saat mendekati gerbang, tombol navigasi cepat `🚪` di bilah atas, atau lewat dialog Satpam Pak Budi.
       - Saat gerbang ditutup rapat, sistem tabrakan fisik (*solid collision*) aktif sehingga karakter tidak dapat menerobos masuk sampai gerbang dibuka kembali.
       - Pada Mode AR, tersedia tombol khusus **`🚪 Buka/Tutup Gerbang AR`** untuk memperagakan animasi gerbang terbuka/tertutup langsung di atas meja/lantai nyata.
   - **Alur Masuk Leluasa**: Karakter mulai dari halaman depan luar gerbang (`z = 36`), berjalan menyusuri jalan masuk melintasi gerbang utama untuk memulai tur sekolah.
   - **4 Gedung Utama & Interior Megah**:
     - 🏫 **Gedung Utama (Profil & Visi Misi)** di sisi utara.
     - 📚 **Gedung Akademik (Jurusan & Prestasi)** di sayap barat.
     - 🎭 **Aula & Ekskul (Fasilitas & Olahraga)** di sayap timur.
     - 📝 **Kantor PPDB (Pendaftaran)** di sisi gerbang depan.
   - **Pintu Masuk Gedung Interaktif (Animated Double Doors)**:
     - Seluruh pintu masuk gedung dilengkapi daun pintu ganda (*double swing doors*) kayu jati kaca dengan gagang pintu stainless dan lampu kanopi teras.
     - Pintu otomatis membuka saat karakter mendekati pintu (< 3.8 meter) dan menutup kembali saat menjauh.
     - Saat masuk (`enterRoom`), suara engsel/latch pintu berbunyi (`sfx('door')`), pintu terbuka lebar, dan karakter melangkah masuk melewati ambang pintu.
     - Pintu keluar di dalam ruangan juga memiliki pintu ganda interaktif berlabel hijau menyala `🚪 PINTU KELUAR`.
   - **Interior Gedung Akademik Tematik & Alur Terpandu (Guided 3-Step Flow)**:
     - 🧭 **Jalur Karpet Pemandu (Wayfinding Blue & Gold Runner)**: Menghubungkan pintu masuk langsung ke 3 zona bernomor:
       - **Zona 1 (Sayap Barat / Kiri)**: `① ZONA PEMINATAN (MIPA · IPS · BAHASA)` — Dilengkapi meja lab MIPA dengan Mikroskop 3D, rak tabung reaksi cairan berwarna, model molekul kimia 3D, meja IPS dengan Globe bumi berputar, buku ensiklopedia, dan **Kuis Interaktif Rekomendasi Peminatan**.
       - **Zona 2 (Pusat / Utara)**: `② SMART LAB KURIKULUM MERDEKA & RISET P5` — Dilengkapi Smartboard Digital 75-inch di dinding, 3 unit PC modern dengan monitor glowing biru neon & kursi ergonomis, podium riset dengan laptop, serta **Simulator Pemilihan 4 Mapel Pilihan Fase F**.
       - **Zona 3 (Sayap Timur / Kanan)**: `③ HALL OF FAME & PRESTASI SISWA` — Lemari etalase kaca megah berisi 3 Piala Emas 3D berkilau, medali berbingkai emas di dinding, karpet merah VIP, dan filter interaktif kategori prestasi siswa.
     - **Panduan HUD Dinamis**: Indikator langkah di atas layar secara aktif memandu pengunjung menyelesaikan tur dari Zona 1 ➔ Zona 2 ➔ Zona 3 hingga selesai.
   - **Panel Dialog Interaksi Lebar & Responsif**: Modal popup interaksi telah diperlebar hingga `960px / 95vw` dengan tata letak multi-kolom yang nyaman dibaca tanpa terpotong.

2. **Karakter & Animasi**
   - Pilihan 3 karakter siswa: **Naufal** (Blazer Biru), **Rani** (Blazer Merah), **Sari** (Blazer Hijau).
   - Animasi jalan (walk cycle), idle breathing, melambaikan tangan (wave), dan melompat (jump).
   - Name tag dinamis melayang di atas kepala karakter.
   - NPC siswa lain yang berpatroli dan menyapa saat didekati.

3. **Interaktivitas & Gamifikasi**
   - Bintang fakta rahasia sekolah (7 bintang) tersebar di seluruh kampus yang dapat dikumpulkan.
   - Petunjuk arah dan suar cahaya kuning (*waypoint beacon*) menuju gedung misi berikutnya.
   - Minimap radar sudut pandang di pojok kanan atas dengan rotasi dinamis.
   - Progress bar persentase pengenalan kampus.
   - Penyimpanan progres otomatis di `localStorage`.

4. **Sistem Cuaca & Waktu**
   - Mode Siang / Malam (*Day & Night Cycle* toggle).
   - Efek cuaca Hujan partikel (*Rain effect* toggle).

5. **Mode Augmented Reality (AR)**
   - Akses via tombol **👓 Mode AR** di navigasi atas.
   - Menggunakan kamera ponsel atau laptop (*rear/environment camera*) untuk memproyeksikan objek 3D di dunia nyata (meja/lantai).
   - Dilengkapi fallback Mode AR Simulasi 3D jika izin kamera tidak diberikan.
   - Pilihan 4 model AR 3D interaktif:
     - 🎓 **Siswa Maskot**: Avatar 3D siswa berseragam sekolah.
     - 🚪 **Gerbang Sekolah**: Miniatur 3D Gerbang Utama lengkap dengan pilar dan pintu biru.
     - 🏫 **Gedung Utama**: Miniatur gedung sekolah 3D berlantai dua dengan menara lonceng.
     - ⭐ **Bintang Prestasi**: Objek 3D piala penghargaan emas.
   - Kontrol gestur sentuh / mouse: rotasi 360°, pinch/wheel scale, dan tombol reset ukuran.
   - **Tombol Snapshot AR (📸)**: Mengambil foto hasil penggabungan feed kamera dan objek 3D dengan watermark resmi untuk diunduh langsung ke galeri perangkat.

6. **Responsif & Kontrol Lengkap**
   - **Keyboard / Desktop**:
     - `W`, `A`, `S`, `D` atau `Tombol Panah`: Berjalan.
     - `Shift`: Lari cepat.
     - `Spasi`: Melompat.
     - `E` / Tombol Masuk: Masuk gedung / Buka titik informasi / Bicara dengan satpam.
     - `Klik Tanah`: Berjalan ke titik tujuan (*click-to-move*).
     - `Klik & Seret Mouse`: Memutar kamera 360°.
     - `Scroll Mouse`: Zoom in / Zoom out kamera.
   - **Smartphone / Layar Sentuh**:
     - Virtual joystick dinamis di sisi kiri layar.
     - Geser layar kanan untuk memutar kamera.
     - Tombol aksi layar untuk Lompat & Masuk.

---

## 🚀 Cara Menjalankan

### Cara 1: Menggunakan Node.js Server Bawaan (Sangat Direkomendasikan)
Proyek ini sudah dilengkapi server HTTP lokal tanpa dependensi tambahan:
```bash
# Buka terminal di folder tugas_uts_ar
node server.js
```
Akses di browser: **`http://localhost:8080/`**

### Cara 2: Langsung Buka File HTML
Klik dua kali file `index.html` pada File Explorer untuk membukanya di Google Chrome, Microsoft Edge, atau Mozilla Firefox.

---

## 📁 Struktur File

```
tugas_uts_ar/
├── index.html        # Halaman utama aplikasi (HTML5, Three.js 3D Tour, UI HUD, & Fitur AR)
├── server.js         # HTTP server Node.js ringan (CORS & no-cache headers)
├── three.min.js      # Pustaka Three.js lokal (memungkinkan jalan 100% offline)
├── README.md         # Dokumentasi petunjuk & fitur proyek
└── LAPORAN_UTS.md    # Laporan akademik lengkap UTS (Arsitektur & Black Box Testing)
```

---

## 🛠️ Teknologi yang Digunakan
- **HTML5 & CSS3**: Antarmuka responsif modern, glassmorphism UI, safe-area inset support untuk smartphone.
- **JavaScript (ES6+)**: Logika game loop, state management, navigasi, localStorage, dan gesture handler.
- **Three.js (r128)**: Rendering grafis 3D real-time, pencahayaan directional + hemisphere, bayangan (*shadow map*), collision detection, partikel hujan, dan canvas textures.
- **MediaDevices API & Canvas Composite**: Feed video kamera AR dan snapshot composite photo downloader.
- **Web Audio API**: Sintesis audio prosedural tanpa file audio eksternal (SFX langkah kaki, lompat, raihan bintang, klik, dan musik latar lofi).

