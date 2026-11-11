# LAPORAN TUGAS UJIAN TENGAH SEMESTER (UTS)
## MATA KULIAH: AUGMENTED REALITY & TEKNOLOGI WEB 3D

---

### IDENTITAS PROYEK
- **Judul Proyek**: Pengembangan Media Pengenalan Lingkungan Sekolah Interaktif Berbasis Web 3D dan Augmented Reality (*SMA Cahaya Nusantara Virtual Tour & AR Experience*)
- **Nama Pengembang / Mahasiswa**: [Nama Mahasiswa / Kelompok]
- **NIM**: [Nomor Induk Mahasiswa]
- **Kelas / Semester**: [Kelas / Semester]
- **Program Studi**: Teknik Informatika / Sistem Informasi / Rekayasa Perangkat Lunak
- **Tahun Akademik**: 2026/2027

---

## 1. LATAR BELAKANG
Pengenalan lingkungan sekolah atau kampus bagi calon peserta didik baru dan masyarakat umum umumnya masih menggunakan media konvensional seperti brosur cetak atau video presentasi satu arah. Media tersebut memiliki keterbatasan dalam memberikan pengalaman interaksi spasial yang nyata.

Dengan pemanfaatan teknologi **Web 3D (Three.js / WebGL)** dan **Augmented Reality (AR)**, calon siswa dapat mengeksplorasi seluruh lingkungan sekolah secara mandiri (*virtual tour* 360°), memasuki gedung fasilitas, memilih karakter representatif, serta memproyeksikan maskot dan miniatur gedung sekolah langsung di dunia nyata melalui kamera smartphone atau laptop tanpa memerlukan instalasi aplikasi khusus (*zero-installation web app*).

---

## 2. TUJUAN & MANFAAT
1. **Tujuan**:
   - Membangun antarmuka interaktif 3D berbasis WebGL untuk tur virtual lingkungan sekolah.
   - Mengintegrasikan teknologi Augmented Reality (AR) berbasis kamera (*Markerless / Camera-Feed Projection*) agar pengguna dapat melihat objek 3D di dunia nyata.
   - Menyediakan sarana penyampaian informasi sekolah (profil, kurikulum/jurusan, ekstrakurikuler, dan alur pendaftaran PPDB online) yang interaktif dan menyenangkan.
   - Menerapkan *gamifikasi* pengumpulan bintang fakta untuk meningkatkan keterlibatan (*user engagement*).
2. **Manfaat**:
   - Calon peserta didik baru dapat mengenal denah kampus dan fasilitas sekolah kapan saja dan di mana saja.
   - Meningkatkan daya tarik promosi sekolah melalui teknologi modern yang ramah pengguna.

---

## 3. ARSITEKTUR SISTEM & SPESIFIKASI TEKNIS
Aplikasi ini dikembangkan dengan arsitektur *Single Page Application (SPA)* yang ringan dan efisien:

| Komponen | Teknologi / Pustaka | Keterangan |
| :--- | :--- | :--- |
| **3D Engine** | Three.js (r128) | Rendering grafis 3D real-time, kamera perspektif, pencahayaan, bayangan (*shadow map*), dan geometri parametrik. |
| **Augmented Reality** | HTML5 MediaDevices API & Canvas Composite | Akses kamera perangkat (*rear/environment camera*) dengan penumpukan (*overlay*) objek 3D Three.js berlatar transparan (*alpha channel*). |
| **Audio Synthesizer**| Web Audio API | Sintesis suara prosedural murni tanpa file eksternal (SFX langkah kaki, lompatan, raihan bintang, portal, dan musik latar lofi). |
| **User Interface** | HTML5, CSS3 Glassmorphism | HUD responsif, virtual joystick mobile, minimap radar real-time, dan dialog modal informasi. |
| **Penyimpanan Lokal** | Web Storage API (`localStorage`) | Menyimpan progres kunjungan gedung, perolehan bintang, dan preferensi waktu (siang/malam). |
| **Web Server** | Node.js HTTP Server (`server.js`) | Server statis lokal ringan untuk melayani aset aplikasi. |

---

## 4. FITUR-FITUR UTAMA APLIKASI

### 4.1. Gerbang Sekolah & Halaman Kampus 3D Luas
- **Halaman Sekolah Luas & Lapang (*Spacious School Grounds*)**:
  - Area pulau sekolah diperluas secara signifikan (radius 48 - 53 meter) untuk memberikan kebebasan gerak dan interaksi optimal bagi pengguna.
  - Dilengkapi **Lapangan Olahraga & Upacara Terpadu** (26 x 18 meter) dengan garis lapangan resmi, dua tiang ring basket, dan tiang bendera pusat dengan bendera merah putih yang berkibar dinamis (*cloth simulation*).
- **Gerbang Utama Sekolah (*Grand Entrance Gate*)**:
  - Dibuat berdasarkan referensi arsitektur gerbang sekolah: struktur pilar kokoh berwarna terracotta, balok lintel atas dengan plang bertuliskan **SMA CAHAYA NUSANTARA**, kanopi atas, dua daun pintu besi berwarna biru tua yang terbuka lebar (bukaan 7.4 meter), pos satpam, NPC Pak Budi yang dapat diajak berinteraksi, serta pagar tembok keliling (*perimeter boundary wall*).
  - **Sistem *Entry Gate First***: Karakter memulai penjelajahan dari luar area sekolah (pada koordinat `z = 36`). Pengguna diwajibkan berjalan melintasi gerbang utama terlebih dahulu untuk mengaktifkan misi tur kampus dan memicu suara penyambutan serta notifikasi selamat datang.
- Lingkungan kampus dengan 4 bangunan fungsional:
  1. **Gedung Utama (🏫)**: Profil sekolah, Visi & Misi 2030, Sejarah pendirian, Sambutan Kepala Sekolah (di sisi utara).
  2. **Gedung Akademik (📚)**: Informasi Jurusan (IPA, IPS, Bahasa), Kurikulum Merdeka, serta Galeri Prestasi Siswa (di sayap barat).
  3. **Aula & Ekskul (🎭)**: Jadwal ekstrakurikuler, rincian fasilitas (lab, perpustakaan, aula), dan agenda tahunan (di sayap timur).
  4. **Kantor PPDB (📝)**: Alur pendaftaran, jadwal gelombang, formulir online terintegrasi langsung ke WhatsApp panitia (di dekat gerbang masuk).
- **Interior Ruangan Lebih Lega**: Ruangan interior diperlebar menjadi 22 x 16 meter sehingga pengguna leluasa berjalan ke 3 titik informasi (*waypoint beacon*).
- **Antarmuka Interaksi Lebih Lebar**: Modal popup informasi diperlebar hingga `min(960px, 95vw)` dengan tata letak *grid* responsif sehingga materi profil, jurusan, dan kurikulum tersaji rapi dan nyaman dibaca.

### 4.2. Mode Augmented Reality (AR)
- Dapat diakses dengan menekan tombol **👓 Mode AR** pada bilah navigasi atas.
- Membuka feed kamera pengguna secara langsung (atau mode simulasi 3D jika izin kamera tidak diberikan).
- Pilihan 4 objek proyeksi 3D:
  - **Siswa Maskot**: Karakter avatar siswa 3D berseragam sekolah.
  - **Gerbang Sekolah**: Miniatur 3D Gerbang Utama lengkap dengan pilar terakota dan daun pintu biru.
  - **Gedung Utama**: Miniatur gedung sekolah 3D berlantai dua dengan menara lonceng.
  - **Bintang Prestasi**: Objek piala / bintang emas penghargaan 3D.
- **Interaksi Gestur**:
  - Sentuh & geser horizontal untuk memutar objek 360°.
  - Scroll mouse atau cubit layar (*pinch-to-scale* dua jari pada layar sentuh) untuk memperbesar/memperkecil objek.
  - Tombol **Reset Ukuran** untuk mengembalikan skala dan rotasi ke kondisi semula.
- **Fitur Snapshot AR (📸)**: Menggabungkan tangkapan kamera nyata dan objek 3D menjadi foto ber-watermark resmi yang dapat langsung diunduh ke galeri perangkat.

### 4.3. Kustomisasi Karakter & NPC
- Pilihan 3 karakter siswa: **Naufal** (Blazer Biru), **Rani** (Blazer Merah), dan **Sari** (Blazer Hijau).
- Animasi pergerakan dinamis: *walk cycle*, *running*, *jumping*, *idle breathing*, serta gerakan melambaikan tangan (*waving hand*).
- NPC siswa yang berpatroli mengitari kampus dan menyapa secara otomatis saat didekati.

### 4.4. Efek Lingkungan & Suasana
- **Day & Night Cycle (☀️ / 🌙)**: Transisi gradasi langit, pencahayaan matahari, kabut, dan emisi lampu jendela gedung.
- **Sistem Cuaca Hujan (🌧)**: Partikel tetesan air hujan (*particle points system*) yang dinamis mengikuti pergerakan karakter.
- **Bendera Merah Putih Dinamis**: Bendera berkibar di tiang pusat lapangan upacara.

### 4.5. Kontrol Ganda (PC & Smartphone)
- **Desktop**: Kontrol keyboard `WASD` / Panah, `Shift` (lari), `Spasi` (lompat), `E` (interaksi/masuk), serta klik mouse di tanah (*click-to-move*).
- **Mobile Touch**: Virtual dynamic joystick di sisi kiri layar, rotasi kamera di sisi kanan, dan tombol sentuh khusus lompat.

---

## 5. PANDUAN PENGUJIAN DAN MENJALANKAN SISTEM

### 5.1. Menjalankan Server Lokal
Pastikan Node.js telah terinstal pada komputer:
```bash
# Masuk ke direktori tugas
cd d:\tugas_uts_ar

# Jalankan server lokal
node server.js
```
Akses melalui peramban: `http://localhost:8080/`

### 5.2. Tabel Hasil Pengujian Fungsional (Black Box Testing)

| No | Komponen / Fitur yang Diuji | Skenario Pengujian | Hasil yang Diharapkan | Status |
| :---: | :--- | :--- | :--- | :---: |
| 1 | Pemilihan Karakter | Klik tombol karakter Naufal, Rani, Sari | Warna pakaian karakter 3D dan nama berubah sesuai pilihan | **BERHASIL** |
| 2 | Pergerakan Karakter | Menekan tombol `W/A/S/D` atau virtual joystick | Karakter bergerak mulus dan memutar sesuai arah pergerakan | **BERHASIL** |
| 3 | Lompatan & Fisika Sederhana | Menekan tombol `Spasi` / tombol Lompat | Karakter melompat dengan kurva gravitasi dan efek suara swoosh | **BERHASIL** |
| 4 | Collision Detection | Berjalan menabrak dinding gedung atau pohon | Karakter tertahan dan tidak menembus dinding (*solid collision*) | **BERHASIL** |
| 5 | Masuk Interior Gedung | Mendekati pintu gedung dan menekan `E` | Layar fade out dan berpindah ke interior ruangan gedung terkait | **BERHASIL** |
| 6 | Titik Informasi Gedung | Berdiri di lingkaran kuning interior dan tekan `E` | Modal popup tab materi (Visi-Misi, Jurusan, dll) terbuka | **BERHASIL** |
| 7 | Pengumpulan Bintang Fakta | Menyentuh bintang emas yang melayang di kampus | Bintang lenyap, progres bertambah, dan fakta sekolah muncul | **BERHASIL** |
| 8 | Mode Augmented Reality | Menekan tombol **👓 Mode AR** | Kamera menyala, objek 3D tampil di atas feed kamera nyata | **BERHASIL** |
| 9 | Manipulasi Objek AR | Melakukan drag mouse/sentuhan pada layar AR | Objek 3D berputar halus secara horizontal (360°) | **BERHASIL** |
| 10 | Snapshot Foto AR | Menekan tombol **📸 Ambil Foto AR** | File gambar `.png` berisi foto kamera + objek 3D terunduh | **BERHASIL** |
| 11 | Siklus Siang / Malam | Menekan tombol 🌙 / ☀️ | Pencahayaan dan warna langit berganti antara siang dan malam | **BERHASIL** |
| 12 | Sistem Cuaca Hujan | Menekan tombol 🌧 | Efek hujan partikel turun dan intensitas cahaya meredup | **BERHASIL** |
| 13 | Sistem Audio & BGM | Menekan tombol 🔊 / 🔇 | Efek suara dan instrumen musik latar menyala/mati | **BERHASIL** |
| 14 | Masuk Lewat Gerbang Utama | Berjalan maju dari titik awal (z=36) melintasi gerbang (z=28) | Notifikasi selamat datang muncul, progress bar aktif, dan panduan gedung terbuka | **BERHASIL** |
| 15 | Interaksi Pos Satpam (Pak Budi) | Mendekati pos satpam di sebelah gerbang dan tekan `E` / tombol Bicara | Dialog profil satpam dan rangkuman tata letak kampus terbuka | **BERHASIL** |
| 16 | Lapangan Bebas Kedipan (*No Z-Fighting*) | Berlari dan mengarahkan kamera 360° di sekitar lapangan basket | Garis lapangan tampil tajam, mulus, dan tidak ada kedipan antar permukaan | **BERHASIL** |
| 17 | Pemilihan Model AR Gerbang Sekolah | Memilih tab "Gerbang Sekolah" di jendela AR | Objek 3D miniatur gerbang sekolah termuat dan siap diputar | **BERHASIL** |
| 18 | Animasi Daun Pintu Masuk Gedung | Mendekati pintu gedung (< 3.8 meter) dan menekan tombol Masuk | Sepasang daun pintu ganda membuka otomatis, suara engsel pintu terdengar (`sfx door`), dan karakter melangkah masuk | **BERHASIL** |
| 19 | Alur Terpandu & Simulator Gedung Akademik | Memasuki Gedung Akademik dan mencoba tes peminatan serta simulator mapel Fase F | Jalur karpet memandu Zona 1 ➔ 2 ➔ 3 secara urut, kuis peminatan menghitung skor kecocokan secara real-time | **BERHASIL** |

---

## 6. KESIMPULAN
Aplikasi pengenalan lingkungan sekolah interaktif berbasis Web 3D dan Augmented Reality telah berhasil dirancang dan diimplementasikan sesuai dengan spesifikasi tugas UTS. Kombinasi grafis real-time Three.js, mode AR berbasis kamera, dan sintesis audio Web Audio API menghasilkan media presentasi sekolah yang imersif, interaktif, serta dapat diakses langsung oleh siapa saja tanpa memerlukan instalasi aplikasi tambahan.
