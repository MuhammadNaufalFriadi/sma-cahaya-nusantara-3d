"use client";

import React, { useState } from "react";
import { PPDBFormData } from "@/lib/types";
import { sfx } from "@/lib/audio";

interface PPDBModalProps {
  isOpen: boolean;
  initialTab?: number;
  onClose: () => void;
  onShowReceipt: (data: PPDBFormData, regId: string, date: string) => void;
  onToast: (msg: string) => void;
}

export const PPDBModal: React.FC<PPDBModalProps> = ({
  isOpen,
  initialTab = 0,
  onClose,
  onShowReceipt,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [form, setForm] = useState<PPDBFormData>({
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
    docs: {
      rapor: true,
      akta: true,
      kk: true,
      prestasi: false,
    },
  });

  if (!isOpen) return null;

  const updateField = (field: keyof PPDBFormData, val: any) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const updateDoc = (docKey: keyof PPDBFormData["docs"], val: boolean) => {
    setForm((prev) => ({
      ...prev,
      docs: { ...prev.docs, [docKey]: val },
    }));
  };

  const handleWA = () => {
    sfx("click");
    if (!form.nama.trim()) {
      onToast("Harap isi Nama Lengkap Calon Siswa.");
      return;
    }
    if (!form.nisn.trim()) {
      onToast("Harap lengkapi NISN (10 digit).");
      return;
    }
    if (!form.ttl.trim()) {
      onToast("Harap isi Tempat & Tanggal Lahir.");
      return;
    }
    if (!form.smp.trim()) {
      onToast("Harap isi Asal Sekolah (SMP/MTs).");
      return;
    }
    if (!form.ortu.trim()) {
      onToast("Harap isi Nama Orang Tua / Wali.");
      return;
    }
    if (!form.wa.trim()) {
      onToast("Harap isi No. WhatsApp untuk notifikasi.");
      return;
    }
    if (!form.alamat.trim()) {
      onToast("Harap isi Alamat Lengkap Domisili.");
      return;
    }

    const regId = "PPDB-CN-2026-" + Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const text = `*FORMULIR PENDAFTARAN PPDB ONLINE*
*SMA CAHAYA NUSANTARA*
----------------------------------------
No. Registrasi : ${regId}
Waktu Daftar   : ${dateStr}

*1. IDENTITAS CALON SISWA:*
• Nama Lengkap : ${form.nama}
• NISN         : ${form.nisn}
• Jenis Kelamin: ${form.jk}
• TTL          : ${form.ttl}
• Asal SMP/MTs : ${form.smp}
• Nilai Rapor  : ${form.nilai || "-"}

*2. PEMINATAN & JALUR SELEKSI:*
• Pilihan 1 (Utama)   : ${form.jur1}
• Pilihan 2 (Cadangan): ${form.jur2}
• Jalur Pendaftaran   : ${form.jalur}

*3. DATA ORANG TUA & KONTAK:*
• Nama Ortu/Wali: ${form.ortu}
• No. WhatsApp  : ${form.wa}
• Alamat        : ${form.alamat}

Mohon informasi verifikasi berkas dan jadwal tes wawancara selanjutnya. Terima kasih.`;

    window.open(
      "https://wa.me/6281234567890?text=" + encodeURIComponent(text),
      "_blank",
      "noopener"
    );
    onToast("✅ Data formulir berhasil disiapkan ke WhatsApp Panitia PPDB!");
  };

  const handlePrint = () => {
    sfx("star");
    if (!form.nama.trim()) {
      onToast("Harap isi minimal Nama Lengkap Siswa.");
      return;
    }
    if (!form.smp.trim()) {
      onToast("Harap lengkapi Asal Sekolah SMP/MTs.");
      return;
    }

    const regId = "PPDB-CN-2026-" + Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    onShowReceipt(form, regId, dateStr);
  };

  const handleReset = () => {
    sfx("click");
    setForm({
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
      docs: {
        rapor: true,
        akta: true,
        kk: true,
        prestasi: false,
      },
    });
    onToast("Formulir pendaftaran telah dibersihkan.");
  };

  return (
    <div
      id="pn"
      className="on"
      onClick={(e) => {
        if ((e.target as HTMLElement).id === "pn") {
          sfx("click");
          onClose();
        }
      }}
    >
      <div className="card">
        <div className="hd">
          <h2>📝 Kantor PPDB</h2>
          <button
            onClick={() => {
              sfx("click");
              onClose();
            }}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <div id="tb">
          <button
            className={activeTab === 0 ? "on" : ""}
            onClick={() => {
              sfx("click");
              setActiveTab(0);
            }}
          >
            Alur & Syarat PPDB
          </button>
          <button
            className={activeTab === 1 ? "on" : ""}
            onClick={() => {
              sfx("click");
              setActiveTab(1);
            }}
          >
            Formulir Pendaftaran
          </button>
          <button
            className={activeTab === 2 ? "on" : ""}
            onClick={() => {
              sfx("click");
              setActiveTab(2);
            }}
          >
            Kontak & Lokasi
          </button>
        </div>

        <div id="bd">
          {/* TAB 1: ALUR & SYARAT */}
          {activeTab === 0 && (
            <div>
              <div className="form-box" style={{ borderLeft: "4px solid var(--y)", marginBottom: "14px" }}>
                <h3 style={{ margin: "0 0 4px", color: "var(--y)", fontSize: "20px" }}>
                  Penerimaan Peserta Didik Baru (PPDB) T.A. 2026/2027
                </h3>
                <p style={{ margin: 0, fontSize: "13.5px", color: "var(--mut)" }}>
                  SMA Cahaya Nusantara membuka kesempatan bagi lulusan SMP/MTs sederajat untuk bergabung bersama komunitas pembelajar unggul dan berprestasi.
                </p>
              </div>

              <div className="g" style={{ marginBottom: "14px" }}>
                <div>
                  <b style={{ color: "#4ade80" }}>Gelombang I (Unggulan & Prestasi)</b>
                  <span>10 Januari - 31 Maret 2026 · Bebas Uang Pendaftaran & Beasiswa Prestasi s.d. 100% SPP.</span>
                </div>
                <div>
                  <b style={{ color: "#60a5fa" }}>Gelombang II (Reguler & Zonasi)</b>
                  <span>1 April - 30 Juni 2026 · Seleksi nilai rapor dan pemetaan minat bakat terpadu.</span>
                </div>
              </div>

              <h3>Tahapan Pendaftaran:</h3>
              <ul className="tl">
                <li>
                  <b>1. Pengisian Formulir Online</b>
                  Isi data calon siswa secara lengkap dan valid pada tab <i>Formulir Pendaftaran</i>.
                </li>
                <li>
                  <b>2. Konfirmasi & Pengiriman Berkas</b>
                  Kirim data pendaftaran via WhatsApp resmi panitia dan simpan/cetak tanda terima pendaftaran.
                </li>
                <li>
                  <b>3. Asesmen Diagnostik & Wawancara</b>
                  Wawancara minat bakat serta asesmen diagnostik gaya belajar (dapat dilakukan daring maupun tatap muka).
                </li>
                <li>
                  <b>4. Pengumuman Kelulusan Seleksi</b>
                  Pengumuman resmi disampaikan melalui notifikasi WhatsApp panitia dan papan pengumuman sekolah.
                </li>
                <li>
                  <b>5. Daftar Ulang & Pengambilan Seragam</b>
                  Verifikasi dokumen fisik asli serta pengukuran seragam sekolah bertempat di Kantor PPDB.
                </li>
              </ul>

              <h3>Dokumen Berkas Persyaratan Fisik:</h3>
              <ul className="l">
                <li>Fotokopi Ijazah SMP / Surat Keterangan Lulus (SKL) terlegalisir (2 lembar).</li>
                <li>Fotokopi Rapor SMP Semester 1 s.d. 5 yang telah dilegalisir kepala sekolah (1 rangkap).</li>
                <li>Fotokopi Akta Kelahiran dan Kartu Keluarga (KK) terbaru (2 lembar).</li>
                <li>Pas foto berwarna terbaru ukuran 3x4 berlatar belakang merah (4 lembar).</li>
                <li>Sertifikat / Piagam Penghargaan kejuaraan akademik maupun non-akademik minimal tingkat kota/kabupaten (jika ada).</li>
              </ul>
            </div>
          )}

          {/* TAB 2: FORMULIR PENDAFTARAN */}
          {activeTab === 1 && (
            <div>
              <div className="form-box" style={{ borderLeft: "4px solid var(--y)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <h3 style={{ margin: 0, color: "var(--y)", fontSize: "20px" }}>
                      FORMULIR PENDAFTARAN SISWA BARU
                    </h3>
                    <p style={{ margin: "2px 0", fontSize: "13px", color: "var(--mut)" }}>
                      Isi seluruh data calon siswa dengan jelas dan lengkap di bawah ini:
                    </p>
                  </div>
                  <span style={{ background: "rgba(16,185,129,.2)", border: "1px solid #10b981", color: "#6ee7b7", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 700 }}>
                    🟢 Pendaftaran Terbuka
                  </span>
                </div>
              </div>

              {/* 1. Identitas Calon Siswa */}
              <div className="form-box">
                <div className="form-title">👤 1. Identitas Calon Siswa</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      Nama Lengkap Siswa <span className="form-req">*</span>
                    </label>
                    <input
                      value={form.nama}
                      onChange={(e) => updateField("nama", e.target.value)}
                      placeholder="Contoh: Muhammad Raditya Pratama"
                    />
                    <span className="form-help">Sesuai nama yang tertera di Akta Kelahiran / Ijazah</span>
                  </div>

                  <div className="form-group">
                    <label>
                      NISN (10 Digit Angka) <span className="form-req">*</span>
                    </label>
                    <input
                      value={form.nisn}
                      onChange={(e) => updateField("nisn", e.target.value)}
                      maxLength={10}
                      placeholder="Contoh: 0081234567"
                    />
                    <span className="form-help">Dapat dilihat pada rapor SMP atau kartu NISN</span>
                  </div>

                  <div className="form-group">
                    <label>
                      Jenis Kelamin <span className="form-req">*</span>
                    </label>
                    <select
                      value={form.jk}
                      onChange={(e) => updateField("jk", e.target.value)}
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      Tempat & Tanggal Lahir <span className="form-req">*</span>
                    </label>
                    <input
                      value={form.ttl}
                      onChange={(e) => updateField("ttl", e.target.value)}
                      placeholder="Contoh: Semarang, 14 Mei 2010"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Asal Sekolah (SMP / MTs) <span className="form-req">*</span>
                    </label>
                    <input
                      value={form.smp}
                      onChange={(e) => updateField("smp", e.target.value)}
                      placeholder="Contoh: SMP Negeri 1 Nusantara"
                    />
                  </div>

                  <div className="form-group">
                    <label>Nilai Rata-rata Rapor (Sem. 1-5)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={form.nilai}
                      onChange={(e) => updateField("nilai", e.target.value)}
                      placeholder="Contoh: 88.5"
                    />
                    <span className="form-help">Rata-rata 4 mata pelajaran utama (skala 0-100)</span>
                  </div>
                </div>
              </div>

              {/* 2. Peminatan & Jalur */}
              <div className="form-box">
                <div className="form-title">🎯 2. Pilihan Peminatan Jurusan & Jalur Masuk</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      Pilihan Peminatan 1 (Utama) <span className="form-req">*</span>
                    </label>
                    <select
                      value={form.jur1}
                      onChange={(e) => updateField("jur1", e.target.value)}
                    >
                      <option value="Peminatan IPA (Sains Terapan & Kedokteran)">
                        Peminatan IPA (Sains Terapan & Kedokteran)
                      </option>
                      <option value="Peminatan IPS (Bisnis, Hukum & Sosial Humaniora)">
                        Peminatan IPS (Bisnis, Hukum & Sosial Humaniora)
                      </option>
                      <option value="Peminatan Bahasa (Linguistik & Hubungan Internasional)">
                        Peminatan Bahasa (Linguistik & Hubungan Internasional)
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      Pilihan Peminatan 2 (Cadangan) <span className="form-req">*</span>
                    </label>
                    <select
                      value={form.jur2}
                      onChange={(e) => updateField("jur2", e.target.value)}
                    >
                      <option value="Peminatan IPS (Bisnis, Hukum & Sosial Humaniora)">
                        Peminatan IPS (Bisnis, Hukum & Sosial Humaniora)
                      </option>
                      <option value="Peminatan IPA (Sains Terapan & Kedokteran)">
                        Peminatan IPA (Sains Terapan & Kedokteran)
                      </option>
                      <option value="Peminatan Bahasa (Linguistik & Hubungan Internasional)">
                        Peminatan Bahasa (Linguistik & Hubungan Internasional)
                      </option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>
                      Jalur Seleksi Pendaftaran <span className="form-req">*</span>
                    </label>
                    <select
                      value={form.jalur}
                      onChange={(e) => updateField("jalur", e.target.value)}
                    >
                      <option value="Jalur Zonasi (Radius Domisili Terdekat ke Kampus)">
                        Jalur Zonasi (Radius Domisili Terdekat ke Kampus)
                      </option>
                      <option value="Jalur Prestasi Akademik (Nilai Rapor & Juara OSN/Lomba Sains)">
                        Jalur Prestasi Akademik (Nilai Rapor & Juara OSN/Lomba Sains)
                      </option>
                      <option value="Jalur Prestasi Non-Akademik (Olahraga / Seni / Robotik / Tahfidz)">
                        Jalur Prestasi Non-Akademik (Olahraga / Seni / Robotik / Tahfidz)
                      </option>
                      <option value="Jalur Afirmasi / KIP (Bantuan Biaya Pendidikan)">
                        Jalur Afirmasi / KIP (Bantuan Biaya Pendidikan)
                      </option>
                      <option value="Jalur Mutasi / Perpindahan Tugas Kedinasan Orang Tua">
                        Jalur Mutasi / Perpindahan Tugas Kedinasan Orang Tua
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Data Orang Tua */}
              <div className="form-box">
                <div className="form-title">🏡 3. Data Orang Tua / Wali & Kontak Notifikasi</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      Nama Lengkap Orang Tua / Wali <span className="form-req">*</span>
                    </label>
                    <input
                      value={form.ortu}
                      onChange={(e) => updateField("ortu", e.target.value)}
                      placeholder="Contoh: Bambang Sudarsono, S.E."
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      No. WhatsApp Aktif (Notifikasi Hasil) <span className="form-req">*</span>
                    </label>
                    <input
                      type="tel"
                      value={form.wa}
                      onChange={(e) => updateField("wa", e.target.value)}
                      placeholder="Contoh: 081234567890"
                    />
                    <span className="form-help">Pengumuman seleksi dan tautan wawancara akan dikirim ke nomor ini</span>
                  </div>

                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>
                      Alamat Lengkap Domisili <span className="form-req">*</span>
                    </label>
                    <input
                      value={form.alamat}
                      onChange={(e) => updateField("alamat", e.target.value)}
                      placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Konfirmasi Berkas */}
              <div className="form-box">
                <div className="form-title">📑 4. Konfirmasi Dokumen Persyaratan Fisik</div>
                <p style={{ fontSize: "12.5px", color: "var(--mut)", margin: "0 0 8px" }}>
                  Centang berkas yang telah Anda siapkan untuk diverifikasi saat daftar ulang di Kantor PPDB:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: "6px" }}>
                  <label className="form-check">
                    <input
                      type="checkbox"
                      checked={form.docs.rapor}
                      onChange={(e) => updateDoc("rapor", e.target.checked)}
                    />
                    Salinan Rapor SMP (Sem. 1-5)
                  </label>
                  <label className="form-check">
                    <input
                      type="checkbox"
                      checked={form.docs.akta}
                      onChange={(e) => updateDoc("akta", e.target.checked)}
                    />
                    Salinan Akta Kelahiran
                  </label>
                  <label className="form-check">
                    <input
                      type="checkbox"
                      checked={form.docs.kk}
                      onChange={(e) => updateDoc("kk", e.target.checked)}
                    />
                    Salinan Kartu Keluarga (KK)
                  </label>
                  <label className="form-check">
                    <input
                      type="checkbox"
                      checked={form.docs.prestasi}
                      onChange={(e) => updateDoc("prestasi", e.target.checked)}
                    />
                    Piagam / Sertifikat Prestasi
                  </label>
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="form-actions">
                <button className="btn-wa" onClick={handleWA}>
                  <span>📲</span> Kirim Pendaftaran via WhatsApp
                </button>
                <button className="btn-print" onClick={handlePrint}>
                  <span>📄</span> Cetak / Simpan Bukti Pendaftaran
                </button>
                <button className="btn-reset" onClick={handleReset}>
                  🔄 Bersihkan Form
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: KONTAK & LOKASI */}
          {activeTab === 2 && (
            <div>
              <div className="form-box" style={{ marginBottom: "14px" }}>
                <h3 style={{ margin: "0 0 6px", color: "var(--y)", fontSize: "18px" }}>
                  Layanan Informasi & Konsultasi PPDB
                </h3>
                <p style={{ margin: 0, fontSize: "13.5px", color: "var(--mut)" }}>
                  Tim panitia PPDB siap melayani konsultasi pemilihan peminatan jurusan, informasi beasiswa, dan verifikasi berkas secara ramah dan profesional.
                </p>
              </div>

              <ul className="l">
                <li>
                  <b>Meja Layanan Fisik:</b> Ruang Front Office Kantor PPDB (Lantai 1), Sayap Tenggara Kampus SMA Cahaya Nusantara.
                </li>
                <li>
                  <b>Hotline WhatsApp Panitia:</b> +62 812-3456-7890 (Ibu Anisa, S.Pd. - Sekretariat PPDB)
                </li>
                <li>
                  <b>Telepon Kantor:</b> (024) 876-5432 / Hunting: (024) 876-5433
                </li>
                <li>
                  <b>Email Resmi PPDB:</b> ppdb@cahayanusantara.sch.id
                </li>
                <li>
                  <b>Jam Operasional Layanan:</b>
                  <br />• Senin s.d. Jumat : Pukul 08.00 - 15.00 WIB
                  <br />• Sabtu : Pukul 08.00 - 12.00 WIB (Layanan Khusus Verifikasi Berkas)
                  <br />• Minggu & Hari Libur Nasional : Tutup (Pendaftaran Online 24 Jam Tetap Aktif)
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

