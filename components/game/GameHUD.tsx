"use client";

import React, { useRef, useEffect } from "react";
import { BUILDINGS, GATE_POS } from "@/lib/constants";
import { SaveState } from "@/lib/types";
import { sfx } from "@/lib/audio";

interface GameHUDProps {
  play: boolean;
  isInRoom: boolean;
  roomName?: string;
  roomProgress?: { visited: number; total: number; stepDesc: string };
  saveState: SaveState;
  mainGateOpen: boolean;
  soundActive: boolean;
  isNight: boolean;
  isRaining: boolean;
  toastMessage: string | null;
  nearObject: { id: string; n: string; i: string; v: string } | null;
  playerPos: { x: number; z: number; yaw: number };
  stars: Array<{ x: number; z: number; visible: boolean }>;
  onOpenProfile: () => void;
  onOpenAR: () => void;
  onToggleGate: () => void;
  onToggleSound: () => void;
  onToggleNight: () => void;
  onToggleRain: () => void;
  onOpenGuide: () => void;
  onOpenMissions: () => void;
  onExitRoom: () => void;
  onAction: () => void;
  onJump: () => void;
  onFastTravel: (target: { x: number; z: number; id?: string }) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  play,
  isInRoom,
  roomName,
  roomProgress,
  saveState,
  mainGateOpen,
  soundActive,
  isNight,
  isRaining,
  toastMessage,
  nearObject,
  playerPos,
  stars,
  onOpenProfile,
  onOpenAR,
  onToggleGate,
  onToggleSound,
  onToggleNight,
  onToggleRain,
  onOpenGuide,
  onOpenMissions,
  onExitRoom,
  onAction,
  onJump,
  onFastTravel,
}) => {
  const mapCanvasRef = useRef<HTMLCanvasElement>(null);

  // Minimap drawing loop
  useEffect(() => {
    if (!play || isInRoom || !mapCanvasRef.current) return;
    const canvas = mapCanvasRef.current;
    const mc = canvas.getContext("2d");
    if (!mc) return;

    const c = 104;
    const k = c / 52;
    const cy = Math.cos(playerPos.yaw);
    const sy = Math.sin(playerPos.yaw);
    const W = (x: number, z: number) => [
      c + (x * cy - z * sy) * k,
      c + (x * sy + z * cy) * k,
    ];
    const hx = (n: number) => "#" + n.toString(16).padStart(6, "0");

    mc.clearRect(0, 0, 208, 208);
    mc.save();
    mc.beginPath();
    mc.arc(c, c, c, 0, 7);
    mc.clip();

    // Ocean & Island
    mc.fillStyle = "#2a7fa6";
    mc.fillRect(0, 0, 208, 208);
    mc.fillStyle = "#e8d9a8";
    mc.beginPath();
    mc.arc(c, c, 53 * k, 0, 7);
    mc.fill();
    mc.fillStyle = "#7ec850";
    mc.beginPath();
    mc.arc(c, c, 48 * k, 0, 7);
    mc.fill();

    // Plaza & Court
    const pq = W(0, -5);
    mc.fillStyle = "#e0d8cc";
    mc.fillRect(pq[0] - 18 * k, pq[1] - 13 * k, 36 * k, 26 * k);
    mc.fillStyle = "#2a6b52";
    mc.fillRect(pq[0] - 11 * k, pq[1] - 7 * k, 22 * k, 14 * k);

    // Wall & Gate
    const wL1 = W(-46, 28);
    const wL2 = W(-4.5, 28);
    const wR1 = W(4.5, 28);
    const wR2 = W(46, 28);
    mc.strokeStyle = "#8f4333";
    mc.lineWidth = 4;
    mc.beginPath();
    mc.moveTo(wL1[0], wL1[1]);
    mc.lineTo(wL2[0], wL2[1]);
    mc.stroke();
    mc.beginPath();
    mc.moveTo(wR1[0], wR1[1]);
    mc.lineTo(wR2[0], wR2[1]);
    mc.stroke();

    const gq = W(0, 28);
    mc.fillStyle = mainGateOpen ? "#ffc83d" : "#ef4444";
    mc.fillRect(gq[0] - 6, gq[1] - 3, 12, 6);

    // Buildings
    BUILDINGS.forEach((b) => {
      const q = W(b.x, b.z);
      mc.fillStyle = hx(b.c);
      mc.fillRect(q[0] - 9, q[1] - 9, 18, 18);
      if (saveState.v[b.id]) {
        mc.fillStyle = "#fff";
        mc.font = "16px sans-serif";
        mc.fillText("✓", q[0] - 6, q[1] + 6);
      }
    });

    // Secret Stars
    stars.forEach((m) => {
      if (m.visible) {
        const q = W(m.x, m.z);
        mc.fillStyle = "#ffd23f";
        mc.beginPath();
        mc.arc(q[0], q[1], 4, 0, 7);
        mc.fill();
      }
    });

    // Player arrow
    const q = W(playerPos.x, playerPos.z);
    mc.translate(q[0], q[1]);
    mc.rotate(Math.PI);
    mc.fillStyle = "#fff";
    mc.strokeStyle = "#1a1210";
    mc.lineWidth = 3;
    mc.beginPath();
    mc.moveTo(0, -11);
    mc.lineTo(8, 9);
    mc.lineTo(0, 5);
    mc.lineTo(-8, 9);
    mc.closePath();
    mc.stroke();
    mc.fill();
    mc.restore();
  }, [play, isInRoom, playerPos, stars, saveState, mainGateOpen]);

  if (!play) return null;

  const enteredGate = saveState.gate || 0;
  const visitedCount = Object.keys(saveState.v).length;
  const starCount = Object.keys(saveState.f).length;
  const totalScorePct = Math.round(
    (visitedCount + starCount + Object.keys(saveState.s).length + (enteredGate ? 1 : 0)) /
      24 *
      100
  );

  return (
    <>
      {/* Top HUD */}
      <div id="top" className="hud" style={{ display: "flex" }}>
        <button className="chip b" id="pf" onClick={onOpenProfile}>
          🏫 Profil
        </button>

        <div className="row">
          <button id="bar" aria-label="Buka Mode AR" onClick={onOpenAR}>
            👓 Mode AR
          </button>
          <button
            className="ib"
            id="btn-gate-toggle"
            title={
              mainGateOpen
                ? "Gerbang Utama Terbuka (Klik untuk Tutup)"
                : "Gerbang Utama Terkunci (Klik untuk Buka)"
            }
            style={{
              background: mainGateOpen ? "rgba(15,42,36,.88)" : "#dc2626",
            }}
            onClick={onToggleGate}
          >
            {mainGateOpen ? "🚪" : "🔒"}
          </button>
          <button className="ib" id="bs" aria-label="Toggle Suara" onClick={onToggleSound}>
            {soundActive ? "🔊" : "🔇"}
          </button>
          <button className="ib" id="bn" aria-label="Ganti siang atau malam" onClick={onToggleNight}>
            {isNight ? "☀️" : "🌙"}
          </button>
          <button className="ib" id="br" aria-label="Hidupkan hujan" onClick={onToggleRain}>
            {isRaining ? "☀️" : "🌧"}
          </button>
          <button className="ib" id="bg" aria-label="Cara bermain" onClick={onOpenGuide}>
            ❓
          </button>
        </div>
      </div>

      {/* Exit Button if inside interior */}
      {isInRoom && (
        <button
          className="chip b"
          id="ex"
          style={{ display: "block" }}
          onClick={onExitRoom}
        >
          ← Keluar
        </button>
      )}

      {/* Quest Goal Widget / Room Progress Widget */}
      <div
        id="ms"
        className="hud"
        style={{ display: "flex" }}
        onClick={onOpenMissions}
        title="Klik untuk lihat rincian misi kampus"
      >
        {isInRoom && roomProgress ? (
          <div>
            <b>
              {roomName} · Tur Terpandu <i>{roomProgress.visited}/{roomProgress.total} Zona</i>
            </b>
            <div className="bar">
              <u style={{ width: `${(roomProgress.visited / roomProgress.total) * 100}%` }}></u>
            </div>
            <span dangerouslySetInnerHTML={{ __html: roomProgress.stepDesc }} />
          </div>
        ) : !enteredGate ? (
          <div>
            <b>Langkah 1: Masuk Sekolah</b>
            <div className="bar">
              <u style={{ width: "10%" }}></u>
            </div>
            <span>Tujuan: 🚪 Gerbang Utama · Jalan masuk ke sekolah</span>
          </div>
        ) : (
          <div>
            <b>
              Kenali sekolah <i>{totalScorePct}%</i>
            </b>
            <div className="bar">
              <u style={{ width: `${totalScorePct}%` }}></u>
            </div>
            <span>
              {visitedCount === 4
                ? "🎓 Semua gedung sudah dikunjungi!"
                : `Tujuan: ${
                    BUILDINGS.find((b) => !saveState.v[b.id])?.i || ""
                  } ${
                    BUILDINGS.find((b) => !saveState.v[b.id])?.n || ""
                  } (Dekati untuk masuk)`}
            </span>
          </div>
        )}
      </div>

      {/* Minimap (only when outside) */}
      {!isInRoom && (
        <canvas
          ref={mapCanvasRef}
          id="mm"
          className="hud"
          width="208"
          height="208"
          style={{ display: "block" }}
        />
      )}

      {/* Fast travel sidebar buttons */}
      {!isInRoom && (
        <div id="pl" className="hud" style={{ display: "flex" }}>
          <button
            className={enteredGate ? "ok" : ""}
            onClick={() => {
              sfx("click");
              onFastTravel({ x: GATE_POS.dx, z: GATE_POS.dz });
            }}
          >
            🚪 Gerbang Utama{enteredGate ? " ✓" : ""}
          </button>
          {BUILDINGS.map((b) => (
            <button
              key={b.id}
              className={saveState.v[b.id] ? "ok" : ""}
              onClick={() => {
                sfx("click");
                onFastTravel({ x: b.dx || 0, z: b.dz || 0, id: b.id });
              }}
            >
              {b.i} {b.n}
              {saveState.v[b.id] ? " ✓" : ""}
            </button>
          ))}
        </div>
      )}

      {/* Jump Button (Touch) */}
      <button
        id="jp"
        className="hud"
        style={{ display: "flex" }}
        aria-label="Lompat"
        onPointerDown={(e) => {
          e.preventDefault();
          onJump();
        }}
      >
        Lompat
      </button>

      {/* Action Prompt Button (Dekati gedung/objek) */}
      {nearObject && (
        <button
          id="go"
          style={{ display: "block" }}
          onClick={onAction}
        >
          {nearObject.v} <small>{nearObject.i} {nearObject.n}</small>
        </button>
      )}

      {/* Toast Notification */}
      <div
        id="ts"
        role="status"
        className={toastMessage ? "on" : ""}
      >
        {toastMessage}
      </div>
    </>
  );
};

