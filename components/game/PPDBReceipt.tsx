"use client";

import React from "react";
import { PPDBFormData } from "@/lib/types";

interface PPDBReceiptProps {
  isOpen: boolean;
  data: PPDBFormData;
  regId: string;
  regDate: string;
  onClose: () => void;
}

export const PPDBReceipt: React.FC<PPDBReceiptProps> = ({
  isOpen,
  data,
  regId,
  regDate,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div id="ppdb-receipt" style={{ display: "flex" }}>
      <div className="receipt-card">
        <div className="receipt-header">
          <div className="receipt-logo">🏫</div>
          <h2>SMA CAHAYA NUSANTARA</h2>
          <p style={{ margin: "2px 0", fontSize: "13px", color: "#718096" }}>
            Jl. Pendidikan Cendekia No. 1 · Telp: (024) 876-5432 · Email: ppdb@cahayanusantara.sch.id
          </p>
          <div className="receipt-badge">
            TANDA TERIMA PENDAFTARAN PPDB T.A. 2026/2027
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "13px",
            color: "#4a5568",
            marginBottom: "8px",
            paddingBottom: "8px",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <span>
            No. Registrasi: <b style={{ color: "#2b6cb0" }}>{regId}</b>
          </span>
          <span>
            Tanggal: <b>{regDate}</b>
          </span>
        </div>

        <table className="receipt-table">
          <tbody>
            <tr>
              <td>Nama Lengkap Siswa</td>
              <td>{data.nama || "-"}</td>
            </tr>
            <tr>
              <td>NISN</td>
              <td>{data.nisn || "-"}</td>
            </tr>
            <tr>
              <td>Jenis Kelamin</td>
              <td>{data.jk || "-"}</td>
            </tr>
            <tr>
              <td>Tempat, Tanggal Lahir</td>
              <td>{data.ttl || "-"}</td>
            </tr>
            <tr>
              <td>Asal Sekolah (SMP/MTs)</td>
              <td>{data.smp || "-"}</td>
            </tr>
            <tr>
              <td>Nilai Rata-rata Rapor</td>
              <td>{data.nilai || "-"}</td>
            </tr>
            <tr>
              <td>Pilihan Peminatan 1 (Utama)</td>
              <td>{data.jur1 || "-"}</td>
            </tr>
            <tr>
              <td>Pilihan Peminatan 2 (Cadangan)</td>
              <td>{data.jur2 || "-"}</td>
            </tr>
            <tr>
              <td>Jalur Seleksi</td>
              <td>{data.jalur || "-"}</td>
            </tr>
            <tr>
              <td>Nama Orang Tua / Wali</td>
              <td>{data.ortu || "-"}</td>
            </tr>
            <tr>
              <td>No. WhatsApp Notifikasi</td>
              <td>{data.wa || "-"}</td>
            </tr>
            <tr>
              <td>Alamat Domisili</td>
              <td>{data.alamat || "-"}</td>
            </tr>
            <tr>
              <td>Status Berkas Fisik</td>
              <td>
                <b style={{ color: "#2b6cb0" }}>
                  Diverifikasi saat verifikasi fisik di Kantor PPDB
                </b>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          style={{
            background: "#f7fafc",
            borderLeft: "4px solid #3182ce",
            padding: "10px 14px",
            borderRadius: "6px",
            fontSize: "12.5px",
            color: "#4a5568",
            margin: "12px 0",
          }}
        >
          <b>Petunjuk Selanjutnya:</b>
          <ol style={{ margin: "4px 0 0", paddingLeft: "18px" }}>
            <li>Simpan atau cetak tanda terima pendaftaran ini sebagai bukti registrasi awal.</li>
            <li>Bawa fotokopi rapor SMP, akta kelahiran, dan kartu keluarga ke Kantor PPDB SMA Cahaya Nusantara pada hari kerja (Senin - Jumat 08.00 - 15.00 WIB).</li>
            <li>Informasi tes diagnostik minat bakat dan jadwal wawancara dikirimkan via WhatsApp ke nomor yang terdaftar.</li>
          </ol>
        </div>

        <div className="receipt-footer">
          <button
            className="receipt-btn-print"
            onClick={() => window.print()}
          >
            🖨️ Cetak / Simpan PDF
          </button>
          <button
            className="receipt-btn-close"
            onClick={onClose}
          >
            ✕ Tutup Jendela
          </button>
        </div>
      </div>
    </div>
  );
};

