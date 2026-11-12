"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { sfx } from "@/lib/audio";

interface ARModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const ARModal: React.FC<ARModalProps> = ({ isOpen, onClose, onToast }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedModel, setSelectedModel] = useState<string>("mascot");
  const [arGateOpen, setArGateOpen] = useState<boolean>(true);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const arGateLRef = useRef<THREE.Group | null>(null);
  const arGateRRef = useRef<THREE.Group | null>(null);

  const rotYRef = useRef(0);
  const scaleRef = useRef(1);
  const isTouchingRef = useRef(false);
  const touchStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      return;
    }

    sfx("click");
    initAR();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen]);

  const initAR = async () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 4.2);
    cameraRef.current = camera;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1);
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 10, 7);
    scene.add(hemi, dir);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    loadModel("mascot");

    // Camera video stream
    if (videoRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        onToast("Mode AR aktif! Arahkan kamera ke meja atau lantai.");
      } catch (err) {
        onToast("Kamera tidak aktif. Menjalankan Mode AR Simulasi / 3D Viewer.");
        if (videoRef.current) {
          videoRef.current.style.background =
            "radial-gradient(circle at center, #1b3a32 0%, #081412 100%)";
        }
      }
    }

    renderLoop();
  };

  const renderLoop = () => {
    animFrameRef.current = requestAnimationFrame(renderLoop);

    if (modelGroupRef.current) {
      modelGroupRef.current.rotation.y = rotYRef.current;
      modelGroupRef.current.scale.setScalar(scaleRef.current);
    }

    if (arGateLRef.current && arGateRRef.current) {
      const targetAngle = arGateOpen ? 1.2 : 0.0;
      arGateLRef.current.rotation.y +=
        (targetAngle - arGateLRef.current.rotation.y) * 0.12;
      arGateRRef.current.rotation.y +=
        (-targetAngle - arGateRRef.current.rotation.y) * 0.12;
    }

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  const loadModel = (type: string) => {
    if (!modelGroupRef.current) return;
    const mg = modelGroupRef.current;
    while (mg.children.length > 0) {
      mg.remove(mg.children[0]);
    }
    rotYRef.current = 0;
    scaleRef.current = 1;
    setSelectedModel(type);

    const M = (c: number) => new THREE.MeshLambertMaterial({ color: c });

    if (type === "mascot") {
      const g = new THREE.Group();
      // Torso
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.38, 0.8, 16), M(0x2f5d8a));
      torso.position.y = 1.1;
      g.add(torso);
      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 16), M(0xf2c9a0));
      head.position.y = 1.95;
      g.add(head);
      // Hair
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.53, 16, 10), M(0x2b1b12));
      hair.position.set(0, 2.05, -0.05);
      g.add(hair);
      // Legs
      [-0.15, 0.15].forEach((x) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.6, 12), M(0x5a6575));
        leg.position.set(x, 0.45, 0);
        g.add(leg);
        const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.4), M(0x151515));
        shoe.position.set(x, 0.1, 0.08);
        g.add(shoe);
      });
      g.position.set(0, -1.2, 0);
      g.scale.setScalar(1.4);
      mg.add(g);
    } else if (type === "gate") {
      const g = new THREE.Group();
      const gm = M(0x8f4333);
      const gt = M(0x6b2e22);
      const dm = M(0x1e4b75);
      const metalBar = M(0x13304a);

      const pL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.4, 0.6), gm);
      pL.position.set(-1.4, 1.2, 0);
      g.add(pL);
      const pR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.4, 0.6), gm);
      pR.position.set(1.4, 1.2, 0);
      g.add(pR);

      const bL = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.3, 0.76), gt);
      bL.position.set(-1.4, 0.15, 0);
      g.add(bL);
      const bR = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.3, 0.76), gt);
      bR.position.set(1.4, 0.15, 0);
      g.add(bR);

      const b = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.6, 0.6), gm);
      b.position.set(0, 2.15, 0);
      g.add(b);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.2, 0.9), gt);
      cap.position.set(0, 2.5, 0);
      g.add(cap);

      // Signboard
      const acv = document.createElement("canvas");
      acv.width = 512;
      acv.height = 96;
      const ax = acv.getContext("2d");
      if (ax) {
        ax.fillStyle = "#6b2e22";
        ax.fillRect(0, 0, 512, 96);
        ax.strokeStyle = "#ffc83d";
        ax.lineWidth = 4;
        ax.strokeRect(6, 6, 500, 84);
        ax.fillStyle = "#ffffff";
        ax.font = 'bold 34px "Baloo 2", sans-serif';
        ax.textAlign = "center";
        ax.textBaseline = "middle";
        ax.fillText("SMA CAHAYA NUSANTARA", 256, 48);
      }
      const aTex = new THREE.CanvasTexture(acv);
      const aSign = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.45), new THREE.MeshBasicMaterial({ map: aTex }));
      aSign.position.set(0, 2.15, 0.31);
      g.add(aSign);

      const arDL = new THREE.Group();
      arDL.position.set(-1.1, 0, 0);
      g.add(arDL);
      const pnlL = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.5, 0.06), dm);
      pnlL.position.set(0.55, 0.75, 0);
      arDL.add(pnlL);
      for (let k = 0; k < 4; k++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.4, 0.08), metalBar);
        bar.position.set(0.18 + k * 0.24, 0.75, 0);
        arDL.add(bar);
      }

      const arDR = new THREE.Group();
      arDR.position.set(1.1, 0, 0);
      g.add(arDR);
      const pnlR = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.5, 0.06), dm);
      pnlR.position.set(-0.55, 0.75, 0);
      arDR.add(pnlR);
      for (let k = 0; k < 4; k++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.4, 0.08), metalBar);
        bar.position.set(-0.18 - k * 0.24, 0.75, 0);
        arDR.add(bar);
      }

      arGateLRef.current = arDL;
      arGateRRef.current = arDR;
      const initialAngle = arGateOpen ? 1.2 : 0.0;
      arDL.rotation.y = initialAngle;
      arDR.rotation.y = -initialAngle;

      g.position.set(0, -0.8, 0);
      g.scale.setScalar(1.05);
      mg.add(g);
    } else if (type === "building") {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(3, 2.4, 2.5), M(0xf3ead2));
      body.position.y = 1.2;
      g.add(body);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.2, 2.8), M(0x8a8f99));
      roof.position.y = 2.5;
      g.add(roof);
      const tower = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.8), M(0xf3ead2));
      tower.position.y = 3.1;
      g.add(tower);
      const steeple = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.7, 4), M(0xd9534f));
      steeple.position.y = 3.95;
      steeple.rotation.y = Math.PI / 4;
      g.add(steeple);
      g.position.set(0, -1, 0);
      mg.add(g);
    } else if (type === "trophy") {
      const g = new THREE.Group();
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(1.2), new THREE.MeshLambertMaterial({ color: 0xffd23f }));
      m.position.y = 1.4;
      g.add(m);
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 0.6, 24), new THREE.MeshLambertMaterial({ color: 0x2f5f4f }));
      stand.position.y = 0.3;
      g.add(stand);
      g.position.set(0, -1, 0);
      mg.add(g);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isTouchingRef.current = true;
    touchStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isTouchingRef.current || e.buttons === 1) {
      const dx = e.clientX - touchStartPos.current.x;
      rotYRef.current += dx * 0.015;
      touchStartPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    scaleRef.current = Math.min(2.5, Math.max(0.4, scaleRef.current - e.deltaY * 0.001));
  };

  const handleSnap = () => {
    sfx("star");
    const snapCanvas = document.createElement("canvas");
    snapCanvas.width = window.innerWidth;
    snapCanvas.height = window.innerHeight;
    const ctx = snapCanvas.getContext("2d");
    if (!ctx) return;

    if (videoRef.current && videoRef.current.videoWidth > 0) {
      ctx.drawImage(videoRef.current, 0, 0, snapCanvas.width, snapCanvas.height);
    } else {
      ctx.fillStyle = "#0f2a24";
      ctx.fillRect(0, 0, snapCanvas.width, snapCanvas.height);
    }

    if (canvasRef.current) {
      ctx.drawImage(canvasRef.current, 0, 0);
    }

    ctx.fillStyle = "rgba(15,42,36,0.85)";
    ctx.fillRect(20, snapCanvas.height - 70, 360, 50);
    ctx.fillStyle = "#ffc83d";
    ctx.font = '700 20px "Baloo 2",sans-serif';
    ctx.fillText("SMA Cahaya Nusantara - AR Snapshot", 35, snapCanvas.height - 38);

    const link = document.createElement("a");
    link.download = "AR_SMA_Cahaya_Nusantara_" + Date.now() + ".png";
    link.href = snapCanvas.toDataURL("image/png");
    link.click();
    onToast("📸 Foto AR berhasil diunduh!");
  };

  const toggleARGates = () => {
    sfx("gate");
    const nextState = !arGateOpen;
    setArGateOpen(nextState);
    onToast(nextState ? "🚪 Pintu Gerbang AR DIBUKA LEBAR" : "🔒 Pintu Gerbang AR DITUTUP RAPAT");
  };

  if (!isOpen) return null;

  return (
    <div id="ar-modal" className="on">
      <video ref={videoRef} id="ar-video" autoPlay playsInline muted />
      <canvas
        ref={canvasRef}
        id="ar-c"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => {
          isTouchingRef.current = false;
        }}
        onWheel={handleWheel}
      />
      <div id="ar-ui">
        <div className="ar-top">
          <div className="ar-badge">👓 Mode Kamera AR SMA Cahaya Nusantara</div>
          <button
            className="ar-close"
            onClick={() => {
              sfx("click");
              onClose();
            }}
            aria-label="Tutup AR"
          >
            ×
          </button>
        </div>

        <div className="ar-bot">
          <div className="ar-hint">
            💡 Geser untuk memutar objek · Scroll / cubit untuk memperbesar
          </div>

          <div className="ar-selector">
            <button
              className={selectedModel === "mascot" ? "on" : ""}
              onClick={() => {
                sfx("click");
                loadModel("mascot");
              }}
            >
              Siswa Mascot
            </button>
            <button
              className={selectedModel === "gate" ? "on" : ""}
              onClick={() => {
                sfx("click");
                loadModel("gate");
              }}
            >
              Gerbang Sekolah
            </button>
            <button
              className={selectedModel === "building" ? "on" : ""}
              onClick={() => {
                sfx("click");
                loadModel("building");
              }}
            >
              Gedung Utama
            </button>
            <button
              className={selectedModel === "trophy" ? "on" : ""}
              onClick={() => {
                sfx("click");
                loadModel("trophy");
              }}
            >
              Bintang Prestasi
            </button>
          </div>

          <div className="ar-actions">
            <button className="ar-btn" onClick={handleSnap}>
              📸 Ambil Foto AR
            </button>
            {selectedModel === "gate" && (
              <button
                className="ar-btn-sec"
                onClick={toggleARGates}
                style={{
                  background: "linear-gradient(90deg,#1e4b75,#2563eb)",
                  color: "#fff",
                  borderColor: "#60a5fa",
                }}
              >
                {arGateOpen ? "🚪 Tutup Gerbang AR" : "🚪 Buka Gerbang AR"}
              </button>
            )}
            <button
              className="ar-btn-sec"
              onClick={() => {
                sfx("click");
                rotYRef.current = 0;
                scaleRef.current = 1;
              }}
            >
              🔄 Reset Ukuran
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

