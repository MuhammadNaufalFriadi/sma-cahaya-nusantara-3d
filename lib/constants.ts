import { BuildingData, CharacterInfo, ProfileSection } from "./types";

export const CHARS: CharacterInfo[] = [
  {
    name: "Naufal",
    hairColor: 0x2b1b12,
    jacketColor: 0x2f5d8a,
    skinColor: 0xf2c9a0,
    desc: "Siswa (Putra) · Blazer Biru",
    intro:
      "👋 Halo! Aku <b>Naufal</b>. Halaman sekolah kini dibuat <b>sangat luas & tertata rapi</b>! Masuklah melewati gerbang dan jelajahi seluruh kampus bersama.",
  },
  {
    name: "Rani",
    hairColor: 0x1a1210,
    jacketColor: 0xb03a48,
    skinColor: 0xfbe2cb,
    desc: "Siswi (Putri) · Blazer Merah & Rok Lipit",
    intro:
      "🌸 Halo! Aku <b>Rani</b>. Halaman sekolah kini <b>sangat luas, asri, dan cantik</b>! Yuk ikuti aku masuk melewati gerbang utama dan keliling kampus.",
  },
  {
    name: "Sari",
    hairColor: 0xffffff,
    jacketColor: 0x247a50,
    skinColor: 0xf8d7c0,
    desc: "Siswi (Hijab) · Blazer Hijau & Kerudung",
    intro:
      "🌿 Assalamu'alaikum! Aku <b>Sari</b>. Selamat datang di <b>SMA Cahaya Nusantara</b>! Mari masuk lewat gerbang utama untuk melihat seluruh fasilitas sekolah.",
  },
];

export const BUILDINGS: BuildingData[] = [
  { id: "profil", n: "Gedung Utama", i: "🏫", x: 0, z: -26, c: 0xd9534f },
  { id: "akademik", n: "Gedung Akademik", i: "📚", x: -25, z: -5, c: 0x3b82f6 },
  { id: "ekskul", n: "Aula & Ekskul", i: "🎭", x: 25, z: -5, c: 0xf59e0b },
  { id: "ppdb", n: "Kantor PPDB", i: "📝", x: 15, z: 17, c: 0x10b981 },
];

BUILDINGS.forEach((b) => {
  b.r = Math.atan2(-b.x, -b.z);
  b.dx = b.x + Math.sin(b.r) * 4.2;
  b.dz = b.z + Math.cos(b.r) * 4.2;
});

export const GATE_POS = {
  x: 0,
  z: 28,
  dx: 0,
  dz: 30,
  n: "Gerbang Utama",
  i: "🚪",
};

export const FACTS = [
  "Sekolah berdiri sejak 1998 dengan hanya 3 ruang kelas.",
  "Perpustakaan menyimpan lebih dari 12.000 judul buku.",
  "Tim robotik meraih juara 2 tingkat provinsi.",
  "Upacara bendera tiap Senin diikuti 1.200 siswa.",
  "Lulusan diterima di 40+ perguruan tinggi negeri.",
  "Kebun hidroponik dirawat siswa kelas X.",
  "Bel masuk berbunyi pukul 07.00. Jangan terlambat!",
];

export const CRY: [number, number][] = [
  [-14, -14],
  [14, -14],
  [-14, 8],
  [14, 8],
  [-32, 2],
  [32, -2],
  [0, -33],
];

export const RX = 500;
export const EX = { exit: 1, v: "Keluar", i: "🚪", n: "Pintu keluar", x: RX, z: 7 };

export const IC: Record<string, string[]> = {
  profil: ["🏫", "🎯", "📜"],
  akademik: ["🎓", "📚", "🏆"],
  ekskul: ["⚽", "🏟", "📅"],
  ppdb: ["📝", "✍", "📞"],
};

export const RM: Record<string, any> = {
  profil: {
    f: 0xc9a66b,
    w: 0xf0e2c0,
    rug: 0xd9534f,
    F: [
      [0, -6, 7, 1.4, 1.8, 0x7a4a2b],
      [-8, -5, 3, 2.8, 1.2, 0x6b4a2a],
      [8, -5, 3, 2.8, 1.2, 0x6b4a2a],
      [8, 4, 3.5, 1, 1.8, 0x3b7d6a],
    ],
    S: [
      [0, -3.5],
      [-7, 0],
      [7, 0],
    ],
  },
  akademik: {
    f: 0xbf9868,
    w: 0xe2ebf5,
    rug: 0x1e3a8a,
    F: [
      [0, -5.8, 6.8, 0.9, 1.4, 0xf1f5f9],
      [-8.5, -4.5, 3.2, 0.9, 1.3, 0x1e293b],
      [-8.5, 1.5, 3.2, 0.9, 1.3, 0x78350f],
      [-4.2, -4.5, 2.0, 0.9, 1.2, 0x334155],
      [9.8, -1.5, 1.5, 3.2, 4.8, 0x78350f],
      [3.6, -4.0, 1.1, 1.1, 1.0, 0x475569],
    ],
    S: [
      [-6.8, -1.5],
      [0, -4.2],
      [6.8, -1.5],
    ],
  },
  ekskul: {
    f: 0xc58b5a,
    w: 0xf3d9a6,
    rug: 0xf59e0b,
    F: [
      [0, -6, 10, 1, 2.4, 0x8a5a2b],
      [-8, -2, 1.6, 2.4, 1.6, 0x6b8f5a],
      [8, 4, 2, 0.9, 2, 0x2a7fa6],
    ],
    S: [
      [0, -3.2],
      [-6, 2.2],
      [6, 1.5],
    ],
  },
  ppdb: {
    f: 0xb08a62,
    w: 0xd9efe3,
    rug: 0x10b981,
    F: [
      [0, -4.5, 8, 1.2, 1.2, 0x8a5a2b],
      [-8, -5.5, 2.6, 2, 1.4, 0x5a6b7a],
      [8, -5.5, 2.6, 2, 1.4, 0x5a6b7a],
    ],
    S: [
      [0, -2],
      [-7, 1.8],
      [7, 2.2],
    ],
  },
};

export const GUIDE: ProfileSection = {
  n: "Cara bermain",
  i: "❓",
  tabs: [
    {
      t: "Kontrol & Fitur",
      h: `<ul class="l">
        <li><b>Halaman Sekolah Luas</b>: Anda bebas berlari, berputar, dan menjelajahi halaman upacara, lapangan olahraga, taman, dan gedung-gedung.</li>
        <li><b>Langkah 1</b>: Mulai dari luar gerbang, jalan maju melintasi Gerbang Utama sekolah untuk mengawali tur kampus.</li>
        <li><b>Pak Budi (Satpam)</b>: Berdiri di pos keamanan dekat gerbang. Dekati dan tekan E untuk berbicara.</li>
        <li><b>Jalan & Lari</b>: Gunakan WASD atau tombol panah. Tahan <b>Shift</b> untuk berlari cepat di halaman.</li>
        <li><b>Lompat</b>: Tekan Spasi (atau tombol Lompat di HP).</li>
        <li><b>Kamera 360°</b>: Seret mouse / geser layar untuk melihat seluruh penjuru sekolah; scroll mouse untuk zoom in/out.</li>
        <li><b>Interaksi Gedung</b>: Dekati pintu gedung lalu tekan E atau tombol Masuk. Di dalam ruangan, dekati lingkaran kuning penanda.</li>
        <li><b>Tombol AR (👓)</b>: Memproyeksikan maskot siswa, miniatur gerbang, atau gedung sekolah di meja Anda lewat kamera ponsel!</li>
      </ul>`,
    },
    {
      t: "Misi Eksplorasi",
      h: `<p>Masuki gerbang utama, jelajahi 4 gedung sekolah, dan kumpulkan 7 bintang fakta rahasia yang melayang di halaman kampus. Kemajuan Anda tersimpan otomatis.</p>`,
    },
  ],
};

