"use client";

import React, { useState } from "react";
import { sfx } from "@/lib/audio";

interface AcademicModalProps {
  isOpen: boolean;
  initialTab?: number;
  onClose: () => void;
  onTabVisited?: (tabIndex: number) => void;
}

export const AcademicModal: React.FC<AcademicModalProps> = ({
  isOpen,
  initialTab = 0,
  onClose,
  onTabVisited,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [minatType, setMinatType] = useState<"mipa" | "ips" | "bahasa" | null>(null);

  // Mapel Simulator
  const [selectedMapels, setSelectedMapels] = useState<string[]>([
    "Matematika Lanjut",
    "Fisika Terapan",
    "Kimia Analisis",
    "Biologi Kedokteran",
  ]);

  // Prestasi Filter
  const [prestasiFilter, setPrestasiFilter] = useState<string>("all");

  if (!isOpen) return null;

  const toggleMapel = (name: string) => {
    sfx("click");
    setSelectedMapels((prev) =>
      prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name]
    );
  };

  const getMapelRecommendation = () => {
    const count = selectedMapels.length;
    let rec = "";
    if (
      selectedMapels.includes("Biologi Kedokteran") &&
      selectedMapels.includes("Kimia Analisis")
    ) {
      rec =
        "Fakultas Kedokteran (FK), Farmasi, Ilmu Gizi, Bioteknologi di UI, UGM, Unair.";
    } else if (
      selectedMapels.includes("Matematika Lanjut") &&
      selectedMapels.includes("Informatika & AI")
    ) {
      rec =
        "Teknik Informatika, Ilmu Komputer, Software Engineering, Data Science di ITB, UI, ITS.";
    } else if (
      selectedMapels.includes("Matematika Lanjut") &&
      selectedMapels.includes("Fisika Terapan")
    ) {
      rec =
        "Teknik Elektro, Teknik Mesin, Teknik Sipil, Penerbangan di ITB, UGM, ITS.";
    } else if (selectedMapels.includes("Ekonomi Makro")) {
      rec = "Manajemen Bisnis, Ilmu Ekonomi, Akuntansi, Ilmu Hukum di UI, UGM, Undip.";
    } else if (
      selectedMapels.includes("English Academics") ||
      selectedMapels.includes("Bahasa Jepang")
    ) {
      rec =
        "Hubungan Internasional (HI), Ilmu Komunikasi, Diplomasi, Jurnalisme di UI, UGM, Unpad.";
    } else {
      rec = "Pilihan Multidisiplin Fleksibel yang memperluas jangkauan seleksi SNBP/SNBT.";
    }

    return {
      text:
        count === 0
          ? "Silakan centang minimal 3 hingga 5 mata pelajaran pilihan di atas."
          : `Kombinasi ${count} mapel pilihan Anda sangat selaras untuk program studi: ${rec}`,
      status:
        count >= 4 && count <= 5
          ? "✅ Beban Jam Pelajaran Ideal Sesuai Standar Kurikulum Merdeka (20 - 25 JP)."
          : count < 4
          ? "⚠️ Direkomendasikan memilih minimal 4 mata pelajaran (20 JP)."
          : "⚠️ Beban belajar melebihi batas maksimal (maksimal 5 mata pelajaran).",
      statusColor: count >= 4 && count <= 5 ? "#4ade80" : "#f87171",
    };
  };

  const mapelFeedback = getMapelRecommendation();

  const handleTabClick = (idx: number) => {
    sfx("click");
    setActiveTab(idx);
    if (onTabVisited) onTabVisited(idx);
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
          <h2>📚 Gedung Akademik</h2>
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
            onClick={() => handleTabClick(0)}
          >
            Program Peminatan
          </button>
          <button
            className={activeTab === 1 ? "on" : ""}
            onClick={() => handleTabClick(1)}
          >
            Kurikulum & Pembelajaran
          </button>
          <button
            className={activeTab === 2 ? "on" : ""}
            onClick={() => handleTabClick(2)}
          >
            Galeri Prestasi
          </button>
        </div>

        <div id="bd">
          {/* TAB 1: PROGRAM PEMINATAN */}
          {activeTab === 0 && (
            <div>
              <div
                style={{
                  background: "linear-gradient(135deg,#1e3a8a,#2563eb)",
                  color: "#fff",
                  padding: "14px 18px",
                  borderRadius: "16px",
                  marginBottom: "14px",
                  border: "1px solid #60a5fa",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        background: "rgba(255,255,255,.2)",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: ".5px",
                      }}
                    >
                      📍 Zona 1 · Langkah Pertama
                    </span>
                    <h3 style={{ margin: "4px 0 2px", color: "#fff", fontSize: "22px" }}>
                      Program Peminatan Siswa
                    </h3>
                  </div>
                  <span style={{ fontSize: "32px" }}>🔬📈🌏</span>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: "13.5px", color: "#dbeafe" }}>
                  Pilihan rumpun peminatan berbasis riset, eksplorasi minat bakat, dan kesiapan perguruan tinggi masa depan.
                </p>
              </div>

              <div
                className="g"
                style={{
                  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
                  gap: "14px",
                  marginBottom: "16px",
                }}
              >
                {/* MIPA */}
                <div
                  style={{
                    background: "rgba(30,58,138,.35)",
                    border: "2px solid #3b82f6",
                    borderRadius: "14px",
                    padding: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span
                      style={{
                        fontSize: "32px",
                        background: "rgba(59,130,246,.25)",
                        width: "48px",
                        height: "48px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "12px",
                      }}
                    >
                      🔬
                    </span>
                    <div>
                      <b style={{ fontSize: "18px", color: "#93c5fd" }}>Peminatan MIPA</b>
                      <span style={{ fontSize: "12px", color: "#bfdbfe", display: "block" }}>
                        Sains Terapan & Rekayasa Teknologi
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: "13px", color: "#e2e8f0", margin: "0 0 10px" }}>
                    Fokus pada pembelajaran analitis kuantitatif, eksperimen laboratorium sains modern, dan teknologi komputasi AI.
                  </p>
                  <div style={{ marginBottom: "8px" }}>
                    <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#93c5fd", textTransform: "uppercase" }}>
                      Mapel Unggulan:
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                      <span style={{ background: "rgba(59,130,246,.3)", border: "1px solid #60a5fa", borderRadius: "6px", padding: "2px 8px", fontSize: "11.5px" }}>Matematika Lanjut</span>
                      <span style={{ background: "rgba(59,130,246,.3)", border: "1px solid #60a5fa", borderRadius: "6px", padding: "2px 8px", fontSize: "11.5px" }}>Fisika Terapan</span>
                      <span style={{ background: "rgba(59,130,246,.3)", border: "1px solid #60a5fa", borderRadius: "6px", padding: "2px 8px", fontSize: "11.5px" }}>Kimia Analitik</span>
                      <span style={{ background: "rgba(59,130,246,.3)", border: "1px solid #60a5fa", borderRadius: "6px", padding: "2px 8px", fontSize: "11.5px" }}>Biologi Molekuler</span>
                      <span style={{ background: "rgba(59,130,246,.3)", border: "1px solid #60a5fa", borderRadius: "6px", padding: "2px 8px", fontSize: "11.5px" }}>Informatika & AI</span>
                    </div>
                  </div>
                  <div style={{ background: "rgba(15,23,42,.6)", borderRadius: "8px", padding: "8px 10px", fontSize: "12px", color: "#cbd5e1" }}>
                    <b>🎯 Target Karier:</b> Dokter, Software Engineer, Data Scientist, Ahli Bioteknologi, Arsitek.
                  </div>
                </div>

                {/* IPS */}
                <div
                  style={{
                    background: "rgba(120,53,15,.35)",
                    border: "2px solid #f59e0b",
                    borderRadius: "14px",
                    padding: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span
                      style={{
                        fontSize: "32px",
                        background: "rgba(245,158,11,.25)",
                        width: "48px",
                        height: "48px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "12px",
                      }}
                    >
                      📈
                    </span>
                    <div>
                      <b style={{ fontSize: "18px", color: "#fcd34d" }}>Peminatan IPS</b>
                      <span style={{ fontSize: "12px", color: "#fde68a", display: "block" }}>
                        Sosial, Bisnis, & Hukum Global
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: "13px", color: "#e2e8f0", margin: "0 0 10px" }}>
                    Fokus pada dinamika ekonomi makro, kebijakan publik, sosiologi terapan, dan negosiasi diplomasi.
                  </p>
                  <div style={{ marginBottom: "8px" }}>
                    <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#fcd34d", textTransform: "uppercase" }}>
                      Mapel Unggulan:
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                      <span style={{ background: "rgba(245,158,11,.3)", border: "1px solid #fbbf24", borderRadius: "6px", padding: "2px 8px", fontSize: "11.5px" }}>Ekonomi & Akuntansi</span>
                      <span style={{ background: "rgba(245,158,11,.3)", border: "1px solid #fbbf24", borderRadius: "6px", padding: "2px 8px", fontSize: "11.5px" }}>Sosiologi Terapan</span>
                      <span style={{ background: "rgba(245,158,11,.3)", border: "1px solid #fbbf24", borderRadius: "6px", padding: "2px 8px", fontSize: "11.5px" }}>Geografi Digital (GIS)</span>
                      <span style={{ background: "rgba(245,158,11,.3)", border: "1px solid #fbbf24", borderRadius: "6px", padding: "2px 8px", fontSize: "11.5px" }}>Sejarah Dunia</span>
                    </div>
                  </div>
                  <div style={{ background: "rgba(15,23,42,.6)", borderRadius: "8px", padding: "8px 10px", fontSize: "12px", color: "#cbd5e1" }}>
                    <b>🎯 Target Karier:</b> Ekonom, Diplomat, Corporate Lawyer, Akuntan Publik, Konsultan Bisnis.
                  </div>
                </div>

                {/* BAHASA */}
                <div
                  style={{
                    background: "rgba(16,185,129,.25)",
                    border: "2px solid #10b981",
                    borderRadius: "14px",
                    padding: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span
                      style={{
                        fontSize: "32px",
                        background: "rgba(16,185,129,.25)",
                        width: "48px",
                        height: "48px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "12px",
                      }}
                    >
                      🌏
                    </span>
                    <div>
                      <b style={{ fontSize: "18px", color: "#6ee7b7" }}>Peminatan Bahasa</b>
                      <span style={{ fontSize: "12px", color: "#a7f3d0", display: "block" }}>
                        Komunikasi Global & Budaya
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: "13px", color: "#e2e8f0", margin: "0 0 10px" }}>
                    Fokus pada bahasa internasional, sastra komparatif, diplomasi kultural, dan public relations.
                  </p>
                  <div style={{ marginBottom: "8px" }}>
                    <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#6ee7b7", textTransform: "uppercase" }}>
                      Mapel Unggulan:
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                      <span style={{ background: "rgba(16,185,129,.3)", border: "1px solid #34d399", borderRadius: "6px", padding: "2px 8px", fontSize: "11.5px" }}>English for Academics</span>
                      <span style={{ background: "rgba(16,185,129,.3)", border: "1px solid #34d399", borderRadius: "6px", padding: "2px 8px", fontSize: "11.5px" }}>Bahasa Jepang (JLPT)</span>
                      <span style={{ background: "rgba(16,185,129,.3)", border: "1px solid #34d399", borderRadius: "6px", padding: "2px 8px", fontSize: "11.5px" }}>Bahasa Jerman (Goethe)</span>
                      <span style={{ background: "rgba(16,185,129,.3)", border: "1px solid #34d399", borderRadius: "6px", padding: "2px 8px", fontSize: "11.5px" }}>Kajian Sastra</span>
                    </div>
                  </div>
                  <div style={{ background: "rgba(15,23,42,.6)", borderRadius: "8px", padding: "8px 10px", fontSize: "12px", color: "#cbd5e1" }}>
                    <b>🎯 Target Karier:</b> Penerjemah Konferensi PBB, Duta Budaya, Jurnalis Luar Negeri, Content Creator Global.
                  </div>
                </div>
              </div>

              {/* Kuis Rekomendasi Peminatan */}
              <div
                className="form-box"
                style={{
                  borderLeft: "4px solid #38bdf8",
                  background: "rgba(15,35,55,.85)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "10px",
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, color: "#38bdf8", fontSize: "18px" }}>
                      🎯 Tes Cepat Rekomendasi Peminatan (Simulasi Mandiri)
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--mut)" }}>
                      Pilih minat utamamu di bawah ini untuk melihat hasil kecocokan rumpun studi:
                    </p>
                  </div>
                  <span
                    style={{
                      background: "rgba(56,189,248,.2)",
                      border: "1px solid #38bdf8",
                      color: "#7dd3fc",
                      padding: "3px 10px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    Interaktif
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                    gap: "10px",
                    marginTop: "10px",
                  }}
                >
                  <button
                    onClick={() => {
                      sfx("star");
                      setMinatType("mipa");
                    }}
                    style={{
                      background: minatType === "mipa" ? "rgba(30,58,138,.9)" : "rgba(30,58,138,.6)",
                      border: "1px solid #3b82f6",
                      color: "#fff",
                      padding: "12px",
                      borderRadius: "10px",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: ".2s",
                    }}
                  >
                    <b style={{ color: "#93c5fd", display: "block", marginBottom: "4px" }}>
                      🔬 Suka Sains & Eksperimen
                    </b>
                    <span style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: 1.4, display: "block" }}>
                      Praktikum laboratorium, pemrograman AI, biologi kedokteran, & logika analitis.
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      sfx("star");
                      setMinatType("ips");
                    }}
                    style={{
                      background: minatType === "ips" ? "rgba(120,53,15,.9)" : "rgba(120,53,15,.6)",
                      border: "1px solid #f59e0b",
                      color: "#fff",
                      padding: "12px",
                      borderRadius: "10px",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: ".2s",
                    }}
                  >
                    <b style={{ color: "#fcd34d", display: "block", marginBottom: "4px" }}>
                      📈 Suka Bisnis & Diskusi
                    </b>
                    <span style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: 1.4, display: "block" }}>
                      Pasar modal, hukum masyarakat, debat publik, & dinamika ekonomi sosial.
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      sfx("star");
                      setMinatType("bahasa");
                    }}
                    style={{
                      background: minatType === "bahasa" ? "rgba(6,78,59,.9)" : "rgba(6,78,59,.6)",
                      border: "1px solid #10b981",
                      color: "#fff",
                      padding: "12px",
                      borderRadius: "10px",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: ".2s",
                    }}
                  >
                    <b style={{ color: "#6ee7b7", display: "block", marginBottom: "4px" }}>
                      🌏 Suka Bahasa & Budaya
                    </b>
                    <span style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: 1.4, display: "block" }}>
                      Bahasa Jepang/Jerman, diplomasi internasional, sastra, & komunikasi global.
                    </span>
                  </button>
                </div>

                {minatType && (
                  <div
                    style={{
                      marginTop: "14px",
                      padding: "14px",
                      borderRadius: "10px",
                      background: "rgba(15,23,42,.9)",
                      border: "1px solid #38bdf8",
                    }}
                  >
                    {minatType === "mipa" && (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                          <span style={{ fontSize: "28px" }}>🔬</span>
                          <div>
                            <b style={{ color: "#93c5fd", fontSize: "16px" }}>
                              Hasil Rekomendasi: 95% Cocok untuk RUMPUN MIPA
                            </b>
                            <span style={{ fontSize: "12px", color: "#38bdf8", display: "block" }}>
                              Sains Terapan, Rekayasa Teknologi, & Kedokteran
                            </span>
                          </div>
                        </div>
                        <p style={{ fontSize: "13px", color: "#cbd5e1", margin: "0 0 8px" }}>
                          Karakter berpikir logis dan minat praktikum laboratorium Anda sangat kuat. Anda disarankan mengambil paket pilihan: <b>Matematika Lanjut, Fisika Terapan, Kimia Analitik, dan Biologi/Informatika</b>.
                        </p>
                        <div style={{ fontSize: "12px", color: "#94a3b8", borderTop: "1px dashed #334155", paddingTop: "6px" }}>
                          💡 <i>Langkah berikutnya: Masuki Zona 2 (Tengah) untuk mencoba Simulator Mata Pelajaran Kurikulum Merdeka!</i>
                        </div>
                      </div>
                    )}
                    {minatType === "ips" && (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                          <span style={{ fontSize: "28px" }}>📈</span>
                          <div>
                            <b style={{ color: "#fcd34d", fontSize: "16px" }}>
                              Hasil Rekomendasi: 94% Cocok untuk RUMPUN IPS
                            </b>
                            <span style={{ fontSize: "12px", color: "#f59e0b", display: "block" }}>
                              Ekonomi Bisnis, Diplomasi, & Ilmu Hukum
                            </span>
                          </div>
                        </div>
                        <p style={{ fontSize: "13px", color: "#cbd5e1", margin: "0 0 8px" }}>
                          Kekuatan observasi sosial dan pemikiran kritis Anda sangat menonjol. Anda disarankan mengambil paket pilihan: <b>Ekonomi Makro, Sosiologi Terapan, Geografi Digital (GIS), dan Sejarah Dunia</b>.
                        </p>
                        <div style={{ fontSize: "12px", color: "#94a3b8", borderTop: "1px dashed #334155", paddingTop: "6px" }}>
                          💡 <i>Langkah berikutnya: Masuki Zona 2 (Tengah) untuk mencoba Simulator Mata Pelajaran Kurikulum Merdeka!</i>
                        </div>
                      </div>
                    )}
                    {minatType === "bahasa" && (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                          <span style={{ fontSize: "28px" }}>🌏</span>
                          <div>
                            <b style={{ color: "#6ee7b7", fontSize: "16px" }}>
                              Hasil Rekomendasi: 92% Cocok untuk RUMPUN BAHASA
                            </b>
                            <span style={{ fontSize: "12px", color: "#10b981", display: "block" }}>
                              Komunikasi Internasional & Kajian Kultural
                            </span>
                          </div>
                        </div>
                        <p style={{ fontSize: "13px", color: "#cbd5e1", margin: "0 0 8px" }}>
                          Kepekaan linguistik dan kemampuan adaptasi kultural Anda luar biasa. Anda disarankan mengambil paket pilihan: <b>English for Academic Purposes, Bahasa Jepang (JLPT), Bahasa Jerman (Goethe), dan Sastra Komparatif</b>.
                        </p>
                        <div style={{ fontSize: "12px", color: "#94a3b8", borderTop: "1px dashed #334155", paddingTop: "6px" }}>
                          💡 <i>Langkah berikutnya: Masuki Zona 2 (Tengah) untuk mencoba Simulator Mata Pelajaran Kurikulum Merdeka!</i>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: KURIKULUM & PEMBELAJARAN */}
          {activeTab === 1 && (
            <div>
              <div
                style={{
                  background: "linear-gradient(135deg,#78350f,#d97706)",
                  color: "#fff",
                  padding: "14px 18px",
                  borderRadius: "16px",
                  marginBottom: "14px",
                  border: "1px solid #fbbf24",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        background: "rgba(255,255,255,.2)",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: ".5px",
                      }}
                    >
                      📍 Zona 2 · Langkah Kedua
                    </span>
                    <h3 style={{ margin: "4px 0 2px", color: "#fff", fontSize: "22px" }}>
                      Kurikulum Merdeka & Riset P5
                    </h3>
                  </div>
                  <span style={{ fontSize: "32px" }}>📋💻🚀</span>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: "13.5px", color: "#fef3c7" }}>
                  Implementasi Kurikulum Merdeka mandiri berbagi dengan kebebasan memilih kombinasi mata pelajaran Fase F.
                </p>
              </div>

              {/* 2 Fase Belajar */}
              <div className="g" style={{ marginBottom: "14px" }}>
                <div style={{ background: "rgba(30,41,59,.8)", borderLeft: "4px solid #38bdf8" }}>
                  <b style={{ color: "#38bdf8", fontSize: "17px" }}>Fase E (Kelas X) · Pondasi Akademik</b>
                  <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#cbd5e1" }}>
                    Mempelajari seluruh mata pelajaran umum, asesmen diagnostik gaya belajar, literasi riset ilmiah, dan pembentukan karakter Profil Pelajar Pancasila.
                  </p>
                </div>
                <div style={{ background: "rgba(30,41,59,.8)", borderLeft: "4px solid #f59e0b" }}>
                  <b style={{ color: "#f59e0b", fontSize: "17px" }}>Fase F (Kelas XI & XII) · Peminatan Fleksibel</b>
                  <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#cbd5e1" }}>
                    Siswa bebas memilih 4 - 5 mata pelajaran pilihan sesuai cita-cita karier, pendampingan intensif UTBK SNBP/SNBT, dan riset karya tulis ilmiah mandiri.
                  </p>
                </div>
              </div>

              {/* Simulasi Mapel Pilihan Interaktif */}
              <div
                className="form-box"
                style={{
                  borderLeft: "4px solid #f59e0b",
                  background: "rgba(25,20,10,.85)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "10px",
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, color: "#fcd34d", fontSize: "18px" }}>
                      🎛️ Simulator Pemilihan Mata Pelajaran Fase F (Kelas XI - XII)
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--mut)" }}>
                      Centang mata pelajaran pilihan (rekomendasi 4 mapel) untuk memvalidasi keselarasan program studi perguruan tinggi:
                    </p>
                  </div>
                  <span
                    style={{
                      background: "rgba(245,158,11,.2)",
                      border: "1px solid #f59e0b",
                      color: "#fcd34d",
                      padding: "3px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {selectedMapels.length} Mapel Terpilih ({selectedMapels.length * 5} JP)
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
                    gap: "8px",
                    marginTop: "10px",
                  }}
                >
                  {[
                    { name: "Matematika Lanjut", sub: "5 Jam/Minggu · MIPA", col: "#93c5fd" },
                    { name: "Fisika Terapan", sub: "5 Jam/Minggu · MIPA", col: "#93c5fd" },
                    { name: "Kimia Analisis", sub: "5 Jam/Minggu · MIPA", col: "#93c5fd" },
                    { name: "Biologi Kedokteran", sub: "5 Jam/Minggu · MIPA", col: "#93c5fd" },
                    { name: "Informatika & AI", sub: "5 Jam/Minggu · MIPA", col: "#93c5fd" },
                    { name: "Ekonomi Makro", sub: "5 Jam/Minggu · IPS", col: "#fcd34d" },
                    { name: "Sosiologi Terapan", sub: "5 Jam/Minggu · IPS", col: "#fcd34d" },
                    { name: "Geografi GIS", sub: "5 Jam/Minggu · IPS", col: "#fcd34d" },
                    { name: "English Academics", sub: "5 Jam/Minggu · Bahasa", col: "#6ee7b7" },
                    { name: "Bahasa Jepang", sub: "5 Jam/Minggu · Bahasa", col: "#6ee7b7" },
                  ].map((m) => (
                    <label
                      key={m.name}
                      className="form-check"
                      style={{
                        background: "rgba(15,23,42,.6)",
                        padding: "8px 10px",
                        borderRadius: "8px",
                        border: "1px solid #334155",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMapels.includes(m.name)}
                        onChange={() => toggleMapel(m.name)}
                      />
                      <span>
                        {m.name} <small style={{ color: m.col, display: "block" }}>{m.sub}</small>
                      </span>
                    </label>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "rgba(15,23,42,.9)",
                    border: "1px solid #f59e0b",
                  }}
                >
                  <b style={{ color: "#fcd34d", display: "block", marginBottom: "4px" }}>
                    🎯 Rekomendasi Program Studi Perguruan Tinggi yang Selaras:
                  </b>
                  <span style={{ fontSize: "13.5px", color: "#e2e8f0", lineHeight: 1.5, display: "block" }}>
                    {mapelFeedback.text}
                  </span>
                  <div
                    style={{
                      marginTop: "6px",
                      fontSize: "11.5px",
                      color: mapelFeedback.statusColor,
                      fontWeight: 700,
                    }}
                  >
                    {mapelFeedback.status}
                  </div>
                </div>
              </div>

              <h3>Projek Penguatan Profil Pelajar Pancasila (P5) Unggulan</h3>
              <ul className="tl">
                <li>
                  <b>1. Smart Sorting Bin berbasis IoT (Rekayasa & Teknologi)</b>
                  Siswa kelas X mendesain tempat sampah cerdas berdaya surya yang mampu memilah sampah logam, organik, dan plastik secara otomatis.
                </li>
                <li>
                  <b>2. Festival Batik Ecoprint Nusantara (Kearifan Lokal)</b>
                  Mengeksplorasi tanaman obat di halaman sekolah untuk pewarna alami batik ecoprint bernilai jual tinggi.
                </li>
                <li>
                  <b>3. Inkubator Startup Siswa & Bazar Mandiri (Kewirausahaan)</b>
                  Pelatihan business plan, pembukuan digital, dan expo produk siswa setiap akhir semester.
                </li>
              </ul>
            </div>
          )}

          {/* TAB 3: GALERI PRESTASI */}
          {activeTab === 2 && (
            <div>
              <div
                style={{
                  background: "linear-gradient(135deg,#065f46,#10b981)",
                  color: "#fff",
                  padding: "14px 18px",
                  borderRadius: "16px",
                  marginBottom: "14px",
                  border: "1px solid #34d399",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        background: "rgba(255,255,255,.2)",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: ".5px",
                      }}
                    >
                      📍 Zona 3 · Langkah Ketiga
                    </span>
                    <h3 style={{ margin: "4px 0 2px", color: "#fff", fontSize: "22px" }}>
                      Hall of Fame & Galeri Prestasi Siswa
                    </h3>
                  </div>
                  <span style={{ fontSize: "32px" }}>🏆🥇🌟</span>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: "13.5px", color: "#d1fae5" }}>
                  Rekam jejak membanggakan putra-putri SMA Cahaya Nusantara di kancah daerah, nasional, dan internasional.
                </p>
              </div>

              {/* Statistik Kelulusan PTN */}
              <div className="g" style={{ marginBottom: "14px" }}>
                <div style={{ textAlign: "center", background: "rgba(6,78,59,.4)", border: "1px solid #10b981" }}>
                  <b style={{ fontSize: "28px", color: "#34d399" }}>94.2%</b>
                  <span style={{ color: "#a7f3d0", fontWeight: 700, display: "block" }}>Tembus PTN & Luar Negeri</span>
                  <span style={{ fontSize: "12px", color: "#cbd5e1" }}>Dari total 360 lulusan tahun 2025</span>
                </div>
                <div style={{ textAlign: "center", background: "rgba(30,58,138,.4)", border: "1px solid #3b82f6" }}>
                  <b style={{ fontSize: "28px", color: "#93c5fd" }}>42 Siswa</b>
                  <span style={{ color: "#bfdbfe", fontWeight: 700, display: "block" }}>Jalur SNBP (Prestasi Rapor)</span>
                  <span style={{ fontSize: "12px", color: "#cbd5e1" }}>ITB (12), UI (15), UGM (15)</span>
                </div>
                <div style={{ textAlign: "center", background: "rgba(120,53,15,.4)", border: "1px solid #f59e0b" }}>
                  <b style={{ fontSize: "28px", color: "#fcd34d" }}>98 Siswa</b>
                  <span style={{ color: "#fde68a", fontWeight: 700, display: "block" }}>Jalur SNBT (UTBK Skolastik)</span>
                  <span style={{ fontSize: "12px", color: "#cbd5e1" }}>Rata-rata skor UTBK 685.4</span>
                </div>
                <div style={{ textAlign: "center", background: "rgba(88,28,135,.4)", border: "1px solid #a855f7" }}>
                  <b style={{ fontSize: "28px", color: "#d8b4fe" }}>18 Siswa</b>
                  <span style={{ color: "#e9d5ff", fontWeight: 700, display: "block" }}>Beasiswa Luar Negeri</span>
                  <span style={{ fontSize: "12px", color: "#cbd5e1" }}>Jepang, Jerman, & Singapura</span>
                </div>
              </div>

              {/* Filter Prestasi */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", margin: "12px 0 10px" }}>
                {[
                  { id: "all", label: "Semua Prestasi" },
                  { id: "sains", label: "Sains & OSN" },
                  { id: "robotik", label: "Robotika & AI" },
                  { id: "bahasa", label: "Debat & Humaniora" },
                  { id: "adiwiyata", label: "Adiwiyata & Lingkungan" },
                ].map((f) => (
                  <button
                    key={f.id}
                    className={`pres-pill ${prestasiFilter === f.id ? "on" : ""}`}
                    onClick={() => {
                      sfx("click");
                      setPrestasiFilter(f.id);
                    }}
                    style={{
                      background: prestasiFilter === f.id ? "#10b981" : "rgba(15,23,42,.6)",
                      color: prestasiFilter === f.id ? "#fff" : "#cbd5e1",
                      border: prestasiFilter === f.id ? 0 : "1px solid #334155",
                      padding: "6px 14px",
                      borderRadius: "20px",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <ul className="tl">
                {(prestasiFilter === "all" || prestasiFilter === "robotik") && (
                  <li>
                    <b>🤖 Juara 2 Kontes Robotika Nasional (2025)</b>
                    Kategori Autonomous Line Follower & AI Vision oleh Tim Cahaya Bot (Puspresnas).
                  </li>
                )}
                {(prestasiFilter === "all" || prestasiFilter === "sains") && (
                  <li>
                    <b>🥈 Medali Perak OSN Bidang Kimia & Fisika (2025)</b>
                    Tingkat Nasional diselenggarakan oleh Balai Pengembangan Talenta Indonesia (BPTI).
                  </li>
                )}
                {(prestasiFilter === "all" || prestasiFilter === "bahasa") && (
                  <li>
                    <b>🥇 Juara 1 National English Debate Championship (2024)</b>
                    Diselenggarakan oleh Universitas Indonesia, menjuarai kategori Best Speaker.
                  </li>
                )}
                {(prestasiFilter === "all" || prestasiFilter === "adiwiyata") && (
                  <li>
                    <b>🌿 Sekolah Adiwiyata Mandiri Tingkat Nasional (2024)</b>
                    Penghargaan langsung dari Menteri LHK Republik Indonesia atas inisiatif zero-waste campus.
                  </li>
                )}
                {(prestasiFilter === "all" || prestasiFilter === "sains") && (
                  <li>
                    <b>📊 Medali Emas National Economics Olympiad (2024)</b>
                    Diselenggarakan oleh Fakultas Ekonomika dan Bisnis Universitas Gadjah Mada (UGM).
                  </li>
                )}
              </ul>

              <h3>Testimoni Alumni Siswa</h3>
              <div
                style={{
                  background: "rgba(15,23,42,.7)",
                  borderLeft: "4px solid #34d399",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  marginTop: "10px",
                }}
              >
                <p style={{ margin: "0 0 4px", fontStyle: "italic", color: "#e2e8f0", fontSize: "13.5px" }}>
                  "Lingkungan belajar di SMA Cahaya Nusantara sangat mendukung kemandirian riset. Praktik di lab komputer AI dan pendampingan olimpiade membimbing saya hingga berhasil diterima di Kedokteran UI tanpa bimbel luar."
                </p>
                <b style={{ color: "#6ee7b7", fontSize: "13px" }}>
                  — dr. Muhammad Farhan (Alumni 2021 · Dokter & Peneliti Muda)
                </b>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

