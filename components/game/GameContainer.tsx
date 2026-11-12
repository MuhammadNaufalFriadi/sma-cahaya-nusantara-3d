"use client";

import React, { useState, useRef, useEffect } from "react";
import { SchoolWorld, SchoolWorldHandle } from "./SchoolWorld";
import { GameHUD } from "./GameHUD";
import { CharacterSelect } from "./CharacterSelect";
import { BuildingModal } from "./BuildingModal";
import { AcademicModal } from "./AcademicModal";
import { PPDBModal } from "./PPDBModal";
import { PPDBReceipt } from "./PPDBReceipt";
import { ARModal } from "./ARModal";
import { loadSaveState, writeSaveState } from "@/lib/storage";
import { BUILDINGS, CRY, FACTS, GUIDE } from "@/lib/constants";
import { PPDBFormData, SaveState } from "@/lib/types";
import { initAudio, toggleBGM } from "@/lib/audio";

export const GameContainer: React.FC = () => {
  const worldRef = useRef<SchoolWorldHandle>(null);

  const [play, setPlay] = useState(false);
  const [selectedCharIndex, setSelectedCharIndex] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>(loadSaveState);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);

  const [mainGateOpen, setMainGateOpen] = useState(true);
  const [soundActive, setSoundActive] = useState(false);
  const [isNight, setIsNight] = useState(false);
  const [isRaining, setIsRaining] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const [nearObject, setNearObject] = useState<{
    id: string;
    n: string;
    i: string;
    v: string;
  } | null>(null);
  const [playerPos, setPlayerPos] = useState({ x: 0, z: 36, yaw: 0 });

  // Modals state
  const [activeModalId, setActiveModalId] = useState<string | null>(null);
  const [activeModalTabIndex, setActiveModalTabIndex] = useState<number>(0);

  // PPDB Receipt state
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<PPDBFormData>({
    nama: "",
    nisn: "",
    jk: "Laki-laki",
    ttl: "",
    smp: "",
    nilai: "",
    jur1: "Peminatan IPA (Sains Terapan & Kedokteran)",
    jur2: "Peminatan IPS (Bisnis, Hukum & Sosial Humaniora)",
    jalur: "Jalur Zonasi (Radius Domisili Terdekat ke Kampus)",
    ortu: "",
    wa: "",
    alamat: "",
    docs: { rapor: true, akta: true, kk: true, prestasi: false },
  });
  const [receiptRegId, setReceiptRegId] = useState("");
  const [receiptDate, setReceiptDate] = useState("");

  // AR Modal state
  const [arOpen, setArOpen] = useState(false);

  // Save state syncing
  useEffect(() => {
    writeSaveState(saveState);
  }, [saveState]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3400);
  };

  const handleStart = () => {
    initAudio();
    setPlay(true);
    showToast(
      !saveState.gate
        ? "Halo! Halaman sekolah luas & lapang. Masuklah melewati gerbang utama 🚪"
        : "Halo! Ikuti tanda kuning menuju gedung pertama."
    );
  };

  const handleCharSelect = (idx: number) => {
    setSelectedCharIndex(idx);
    if (worldRef.current) {
      worldRef.current.setPlayerSkin(idx);
    }
  };

  const handleToggleGate = () => {
    if (worldRef.current) {
      const state = worldRef.current.toggleMainGate();
      setMainGateOpen(state);
    }
  };

  const handleToggleSound = () => {
    const active = toggleBGM((isActive) => {
      setSoundActive(isActive);
    });
    setSoundActive(active);
    showToast(active ? "Suara & Musik Aktif 🔊" : "Suara Dimatikan 🔇");
  };

  const handleToggleNight = () => {
    if (worldRef.current) {
      const state = worldRef.current.toggleNight();
      setIsNight(state);
    }
  };

  const handleToggleRain = () => {
    if (worldRef.current) {
      const state = worldRef.current.toggleRain();
      setIsRaining(state);
    }
  };

  const handleOpenModal = (id: string, tabIndex = 0) => {
    setActiveModalId(id);
    setActiveModalTabIndex(tabIndex);

    if (id !== "guide" && id !== "satpam" && id !== "mission") {
      setSaveState((prev) => ({
        ...prev,
        v: { ...prev.v, [id]: 1 },
      }));
    }
  };

  const handleCloseModal = () => {
    setActiveModalId(null);
  };

  const handleShowReceipt = (data: PPDBFormData, regId: string, date: string) => {
    setReceiptData(data);
    setReceiptRegId(regId);
    setReceiptDate(date);
    setReceiptOpen(true);
  };

  const handleOpenMissions = () => {
    setActiveModalId("mission");
    setActiveModalTabIndex(0);
  };

  // Precomputed stars list
  const stars = CRY.map((c, i) => ({
    x: c[0],
    z: c[1],
    visible: !saveState.f[i],
  }));

  // Room progress description
  const getRoomProgress = () => {
    if (!currentRoom) return undefined;
    const visitedZones = [0, 1, 2].filter((i) => saveState.s[currentRoom + i]).length;
    let stepDesc = "Masuk ke lingkaran penanda, lalu tekan E.";
    if (currentRoom === "akademik") {
      if (!saveState.s["akademik0"]) {
        stepDesc = "Langkah 1: Kunjungi <b>① Zona Peminatan (Kiri)</b>";
      } else if (!saveState.s["akademik1"]) {
        stepDesc = "Langkah 2: Eksplorasi <b>② Lab Kurikulum Merdeka (Tengah)</b>";
      } else if (!saveState.s["akademik2"]) {
        stepDesc = "Langkah 3: Saksikan <b>③ Hall of Fame & Prestasi (Kanan)</b>";
      } else {
        stepDesc = "🎓 <b>Tur Akademik Lengkap!</b> Boleh keluar lewat pintu belakang.";
      }
    }
    return {
      visited: visitedZones,
      total: 3,
      stepDesc,
    };
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      {/* 3D Canvas */}
      <SchoolWorld
        ref={worldRef}
        charIndex={selectedCharIndex}
        play={play}
        saveState={saveState}
        onSaveStateChange={setSaveState}
        onNearChange={setNearObject}
        onPlayerMove={setPlayerPos}
        onRoomChange={setCurrentRoom}
        onToast={showToast}
        onOpenModal={handleOpenModal}
      />

      {/* Start Character Selector Screen */}
      {!play && (
        <CharacterSelect
          selectedIndex={selectedCharIndex}
          onSelect={handleCharSelect}
          onStart={handleStart}
          onQuickProfile={() => handleOpenModal("profil")}
        />
      )}

      {/* In-Game HUD Overlays */}
      <GameHUD
        play={play}
        isInRoom={!!currentRoom}
        roomName={BUILDINGS.find((b) => b.id === currentRoom)?.n}
        roomProgress={getRoomProgress()}
        saveState={saveState}
        mainGateOpen={mainGateOpen}
        soundActive={soundActive}
        isNight={isNight}
        isRaining={isRaining}
        toastMessage={toastMessage}
        nearObject={nearObject}
        playerPos={playerPos}
        stars={stars}
        onOpenProfile={() => handleOpenModal("profil")}
        onOpenAR={() => setArOpen(true)}
        onToggleGate={handleToggleGate}
        onToggleSound={handleToggleSound}
        onToggleNight={handleToggleNight}
        onToggleRain={handleToggleRain}
        onOpenGuide={() => handleOpenModal("guide")}
        onOpenMissions={handleOpenMissions}
        onExitRoom={() => worldRef.current?.exitRoom()}
        onAction={() => worldRef.current?.triggerNearAction()}
        onJump={() => worldRef.current?.jump()}
        onFastTravel={(t) => worldRef.current?.moveTo(t.x, t.z, t.id)}
      />

      {/* Gedung Akademik Guided Tour Modal */}
      <AcademicModal
        isOpen={activeModalId === "akademik"}
        initialTab={activeModalTabIndex}
        onClose={handleCloseModal}
        onTabVisited={(tabIdx) => {
          setSaveState((prev) => ({
            ...prev,
            s: { ...prev.s, [`akademik${tabIdx}`]: 1 },
          }));
        }}
      />

      {/* PPDB Form and Info Modal */}
      <PPDBModal
        isOpen={activeModalId === "ppdb"}
        initialTab={activeModalTabIndex}
        onClose={handleCloseModal}
        onShowReceipt={handleShowReceipt}
        onToast={showToast}
      />

      {/* Official PPDB Registration Receipt Modal */}
      <PPDBReceipt
        isOpen={receiptOpen}
        data={receiptData}
        regId={receiptRegId}
        regDate={receiptDate}
        onClose={() => setReceiptOpen(false)}
      />

      {/* Augmented Reality (AR) Camera Modal */}
      <ARModal
        isOpen={arOpen}
        onClose={() => setArOpen(false)}
        onToast={showToast}
      />

      {/* General Modals (Gedung Utama, Aula & Ekskul, Pak Budi Satpam, Guide, Mission Checklist) */}
      {activeModalId === "profil" && (
        <BuildingModal
          isOpen={true}
          title="🏫 Gedung Utama"
          tabs={[
            {
              t: "Tentang",
              h: `<p>SMA Cahaya Nusantara adalah sekolah menengah atas unggulan yang menumbuhkan siswa berprestasi, berkarakter kuat, dan siap menghadapi jenjang perguruan tinggi maupun dunia kerja global.</p><div class="g"><div><b>1.200</b><span>Siswa Aktif</span></div><div><b>78</b><span>Guru & Tenaga Pendidik</span></div><div><b>A (Unggul)</b><span>Akreditasi BAN-S/M</span></div><div><b>28 Tahun</b><span>Tahun Berdiri Sejak 1998</span></div></div><h3>Sambutan Kepala Sekolah</h3><p>Dra. Sri Wahyuni, M.Pd. — "Kami berkomitmen mewujudkan ekosistem pendidikan yang inklusif, modern, berbasis teknologi digital, serta senantiasa mengedepankan integritas moral dan budaya budi pekerti luhur."</p>`,
            },
            {
              t: "Visi & Misi",
              h: `<h3>Visi Sekolah</h3><p>Menjadi institusi pendidikan menengah atas teladan yang melahirkan generasi cerdas bernalar kritis, berakhlak mulia, berwawasan lingkungan, serta berdaya saing global pada tahun 2030.</p><h3>Misi Sekolah</h3><ul class="l"><li>Menyelenggarakan proses pembelajaran aktif, inovatif, dan terintegrasi dengan teknologi digital modern.</li><li>Mengembangkan potensi bakat dan minat peserta didik secara optimal melalui kegiatan akademik maupun non-akademik.</li><li>Membina karakter peserta didik melalui penguatan budaya 5S (Senyum, Salam, Sapa, Sopan, Santun) dan Profil Pelajar Pancasila.</li><li>Membangun jejaring kolaborasi strategis dengan berbagai perguruan tinggi negeri, swasta terkemuka, dan dunia industri.</li></ul>`,
            },
            {
              t: "Sejarah Sekolah",
              h: `<ul class="tl"><li><b>1998</b>Didirikan oleh Yayasan Cahaya Bangsa dengan 3 ruang kelas awal dan 90 peserta didik pertama.</li><li><b>2008</b>Berhasil meraih predikat Akreditasi A (Unggul) untuk pertama kalinya.</li><li><b>2016</b>Peresmian gedung laboratorium terpadu, perpustakaan digital e-library, dan aula serbaguna.</li><li><b>2023</b>Implementasi penuh Kurikulum Merdeka dan peresmian laboratorium robotika & kecerdasan buatan.</li><li><b>Hari Ini</b>Kampus hijau terakreditasi Adiwiyata Mandiri dengan 36 rombongan belajar lengkap.</li></ul>`,
            },
          ]}
          onClose={handleCloseModal}
        />
      )}

      {activeModalId === "ekskul" && (
        <BuildingModal
          isOpen={true}
          title="🎭 Aula & Ekskul"
          tabs={[
            {
              t: "Ekstrakurikuler",
              h: `<p>Tersedia lebih dari 15 klub minat bakat untuk mengasah kepemimpinan dan kreativitas:</p><div class="g"><div><b>Klub Robotika & AI</b><span>Rabu, 15.30 · Lab Komputer</span></div><div><b>Basket & Futsal</b><span>Selasa & Kamis, 16.00 · Lapangan Utama</span></div><div><b>Paduan Suara & Orkestra</b><span>Jumat, 14.30 · Aula Seni</span></div><div><b>Pramuka Penegak</b><span>Sabtu, 07.30 · Halaman Utama</span></div><div><b>Klub Debat Bahasa Inggris</b><span>Senin, 15.30 · Ruang Audiovisual</span></div><div><b>Palang Merah Remaja (PMR)</b><span>Kamis, 15.00 · Ruang UKS Terpadu</span></div></div>`,
            },
            {
              t: "Fasilitas Kampus",
              h: `<ul class="l"><li>36 ruang kelas modern ber-AC dengan Interactive Smart Board & Proyektor 4K.</li><li>3 Laboratorium Sains canggih (Fisika, Kimia, Biologi) berstandar keselamatan nasional.</li><li>Laboratorium Komputer Multimedia & Studio Coding dengan koneksi internet Gigabit Fiber.</li><li>Perpustakaan modern dua lantai dengan 12.000+ buku fisik dan akses ke ribuan jurnal internasional.</li><li>Aula Serbaguna berkapasitas 600 kursi, Masjid Sekolah, Kantin Sehat Higienis, dan UKS dengan dokter jaga.</li><li>Lapangan olahraga multifungsi berstandar untuk Basket, Futsal, Voli, dan Bulu Tangkis.</li></ul>`,
            },
            {
              t: "Agenda Tahunan",
              h: `<ul class="tl"><li><b>Bulan Agustus</b>Peringatan HUT Kemerdekaan RI, karnaval budaya nusantara, dan pekan olahraga antarkelas (Class Meeting).</li><li><b>Bulan Oktober</b>Pekan Bahasa, Gelar Seni Budaya (*Art Fair*), dan Pameran Projek Kreatif P5.</li><li><b>Bulan Desember</b>Bazar Kewirausahaan Siswa, Pembagian Rapor Semester Ganjil, dan Seminar Karier Kampus.</li><li><b>Bulan Mei</b>Wisuda Pelepasan Siswa Kelas XII dan Gebyar Pameran Inovasi Siswa Terbuka.</li></ul>`,
            },
          ]}
          onClose={handleCloseModal}
        />
      )}

      {activeModalId === "satpam" && (
        <BuildingModal
          isOpen={true}
          title="👮 Pak Budi (Satpam)"
          tabs={[
            {
              t: "Sambutan",
              h: `<div style="display:flex;align-items:center;gap:16px;margin-bottom:14px;">
                <span style="font-size:52px;">👮</span>
                <div><b style="font-size:20px;color:var(--y);">Pak Budi (Keamanan Sekolah)</b><p style="margin:2px 0;color:var(--mut);">"Selamat datang di SMA Cahaya Nusantara!"</p></div>
              </div>
              <p>Halo, adik! Halaman sekolah kami telah ditata ulang agar seluruh aktivitas belajar, olahraga upacara, dan penjelajahan berlangsung leluasa dan nyaman dipandang.</p>
              <ul class="l">
                <li><b>Gedung Utama (Profil)</b>: Lurus di utara di balik tiang bendera dan lapangan olahraga pusat.</li>
                <li><b>Gedung Akademik</b>: Di sayap barat (sebelah kiri), tempat peminatan jurusan IPA, IPS, Bahasa, dan riset sains.</li>
                <li><b>Aula & Ekskul</b>: Di sayap timur (sebelah kanan), aula olahraga megah berkapasitas 600 kursi & pentas seni.</li>
                <li><b>Kantor PPDB</b>: Di sebelah kanan jalan masuk dari gerbang untuk pendaftaran siswa baru.</li>
                <li><b>Bintang Rahasia</b>: Ada 7 bintang fakta menarik yang tersebar di halaman kampus. Temukan semuanya!</li>
              </ul>
              <p style="color:var(--y);font-weight:700;">Selamat menjelajah kampus dengan leluasa!</p>`,
            },
          ]}
          onClose={handleCloseModal}
        />
      )}

      {activeModalId === "guide" && (
        <BuildingModal
          isOpen={true}
          title={GUIDE.i + " " + GUIDE.n}
          tabs={GUIDE.tabs}
          onClose={handleCloseModal}
        />
      )}

      {activeModalId === "mission" && (
        <BuildingModal
          isOpen={true}
          title="📋 Daftar Misi Kampus"
          tabs={[
            {
              t: "Misi",
              h: `<p>Pantau progres eksplorasi Anda di halaman luas SMA Cahaya Nusantara:</p>
                <ul class="tl">
                  <li><b>${saveState.gate ? "✅ Selesai" : "⬜ Belum Selesai"} · Masuk Melalui Gerbang Utama</b> ${saveState.gate ? "Gerbang telah berhasil dilewati." : "Jalan maju melewati gerbang depan sekolah."}</li>
                  <li><b>${saveState.v["profil"] ? "✅ Selesai" : "⬜ Belum Dikunjungi"} · Gedung Utama (Profil)</b> Visi, Misi, Sambutan Kepala Sekolah, & Sejarah.</li>
                  <li><b>${saveState.v["akademik"] ? "✅ Selesai" : "⬜ Belum Dikunjungi"} · Gedung Akademik</b> Jurusan IPA, IPS, Bahasa, Kurikulum Merdeka & Prestasi.</li>
                  <li><b>${saveState.v["ekskul"] ? "✅ Selesai" : "⬜ Belum Dikunjungi"} · Aula & Ekstrakurikuler</b> 15+ kegiatan ekskul & fasilitas sekolah.</li>
                  <li><b>${saveState.v["ppdb"] ? "✅ Selesai" : "⬜ Belum Dikunjungi"} · Kantor PPDB</b> Jadwal, pendaftaran WhatsApp, & kontak resmi.</li>
                </ul>
                <h3>⭐ Bintang Fakta Kampus (${Object.keys(saveState.f).length}/7 Ditemukan)</h3>
                <div class="g">
                  ${FACTS.map(
                    (f, i) =>
                      `<div><b>${saveState.f[i] ? "⭐ Fakta " + (i + 1) : "🔒 Belum Ditemukan #" + (i + 1)}</b><span>${saveState.f[i] ? f : "Jelajahi halaman sekolah untuk menemukan bintang emas ini."}</span></div>`
                  ).join("")}
                </div>`,
            },
          ]}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

