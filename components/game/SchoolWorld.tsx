"use client";

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import * as THREE from "three";
import { BUILDINGS, CHARS, CRY, FACTS, GATE_POS, RM, RX } from "@/lib/constants";
import { SaveState } from "@/lib/types";
import { sfx } from "@/lib/audio";

export interface SchoolWorldHandle {
  setPlayerSkin: (charIndex: number) => void;
  toggleMainGate: () => boolean;
  toggleNight: () => boolean;
  toggleRain: () => boolean;
  jump: () => void;
  enterRoom: (roomId: string) => void;
  exitRoom: () => void;
  moveTo: (x: number, z: number, autoEnterId?: string) => void;
  triggerNearAction: () => void;
}

interface SchoolWorldProps {
  charIndex: number;
  play: boolean;
  saveState: SaveState;
  onSaveStateChange: (updater: (prev: SaveState) => SaveState) => void;
  onNearChange: (near: { id: string; n: string; i: string; v: string } | null) => void;
  onPlayerMove: (pos: { x: number; z: number; yaw: number }) => void;
  onRoomChange: (roomId: string | null) => void;
  onToast: (msg: string) => void;
  onOpenModal: (modalId: string, tabIndex?: number) => void;
}

export const SchoolWorld = forwardRef<SchoolWorldHandle, SchoolWorldProps>(
  (
    {
      charIndex,
      play,
      saveState,
      onSaveStateChange,
      onNearChange,
      onPlayerMove,
      onRoomChange,
      onToast,
      onOpenModal,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Three.js instances
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    // Use performance.now() instead of deprecated THREE.Clock
    interface GameClock {
      _start: number;
      _last: number;
      elapsedTime: number;
      getElapsedTime: () => number;
      getDelta: () => number;
    }

    const clockRef = useRef<GameClock>({
      _start: performance.now() / 1000,
      _last: performance.now() / 1000,
      get elapsedTime() { return performance.now() / 1000 - this._start; },
      getElapsedTime() { return performance.now() / 1000 - this._start; },
      getDelta() { const now = performance.now() / 1000; const d = now - this._last; this._last = now; return d; },
    });

    // Game states
    const playerGroupRef = useRef<THREE.Group | null>(null);
    const playerMatRef = useRef<Record<string, THREE.MeshLambertMaterial>>({});
    const boyGRef = useRef<THREE.Group | null>(null);
    const raniGRef = useRef<THREE.Group | null>(null);
    const sariGRef = useRef<THREE.Group | null>(null);

    // Animation limbs and parts
    const legsRef = useRef<THREE.Group[]>([]);
    const armsRef = useRef<THREE.Group[]>([]);
    const torsoRef = useRef<THREE.Mesh | null>(null);
    const headRef = useRef<THREE.Group | null>(null);

    // 3D Name Tag billboard above character
    const nameTagCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const nameTagTexRef = useRef<THREE.CanvasTexture | null>(null);

    // Wandering student NPCs
    const npcsRef = useRef<any[]>([]);

    // Touch Virtual Joystick
    const joyRef = useRef<{ id: number; x: number; y: number; dx: number; dy: number } | null>(null);

    // Refs for props to prevent stale closure in event listeners and animation loop
    const playRef = useRef(play);
    useEffect(() => {
      playRef.current = play;
    }, [play]);

    const saveStateRef = useRef(saveState);
    useEffect(() => {
      saveStateRef.current = saveState;
    }, [saveState]);

    const onPlayerMoveRef = useRef(onPlayerMove);
    useEffect(() => {
      onPlayerMoveRef.current = onPlayerMove;
    }, [onPlayerMove]);

    const onNearChangeRef = useRef(onNearChange);
    useEffect(() => {
      onNearChangeRef.current = onNearChange;
    }, [onNearChange]);

    const onToastRef = useRef(onToast);
    useEffect(() => {
      onToastRef.current = onToast;
    }, [onToast]);

    const onOpenModalRef = useRef(onOpenModal);
    useEffect(() => {
      onOpenModalRef.current = onOpenModal;
    }, [onOpenModal]);

    const onRoomChangeRef = useRef(onRoomChange);
    useEffect(() => {
      onRoomChangeRef.current = onRoomChange;
    }, [onRoomChange]);

    const onSaveStateChangeRef = useRef(onSaveStateChange);
    useEffect(() => {
      onSaveStateChangeRef.current = onSaveStateChange;
    }, [onSaveStateChange]);

    useEffect(() => {
      applyCharacterSkin(charIndex);
    }, [charIndex]);

    const mainGateOpenRef = useRef(true);
    const isNightRef = useRef(!!saveState.night);
    const isRainingRef = useRef(false);
    const roomRef = useRef<string | null>(null);

    const gateDoorLRef = useRef<THREE.Group | null>(null);
    const gateDoorRRef = useRef<THREE.Group | null>(null);
    const roomsMapRef = useRef<Record<string, THREE.Group>>({});
    const roomRingMapRef = useRef<Record<string, any[]>>({});

    const playerPos = useRef({ x: 0, z: 36 });
    const playerYaw = useRef(0);
    const playerPitch = useRef(0.42);
    const playerDist = useRef(12);
    const playerJumpY = useRef(0);
    const playerJumpVel = useRef(0);
    const stepTimer = useRef(0);
    const waveTimer = useRef(2.4);

    const keys = useRef<Record<string, boolean>>({});
    const targetPos = useRef<{ x: number; z: number } | null>(null);
    const autoEnterRoomId = useRef<string | null>(null);
    const nearObjRef = useRef<{ id: string; n: string; i: string; v: string } | null>(null);

    const starsListRef = useRef<THREE.Mesh[]>([]);
    const flagGeoRef = useRef<THREE.PlaneGeometry | null>(null);
    const lampsRef = useRef<THREE.Mesh[]>([]);
    const rainPointsRef = useRef<THREE.Points | null>(null);
    const rainCoordsRef = useRef<Float32Array | null>(null);

    const animFrameId = useRef<number | null>(null);

    useImperativeHandle(ref, () => ({
      setPlayerSkin: (idx: number) => {
        applyCharacterSkin(idx);
      },
      toggleMainGate: () => {
        sfx("gate");
        mainGateOpenRef.current = !mainGateOpenRef.current;
        onToastRef.current?.(
          mainGateOpenRef.current
            ? "🚪 Gerbang Utama SMA Cahaya Nusantara DIBUKA LEBAR"
            : "🔒 Gerbang Utama SMA Cahaya Nusantara DITUTUP & TERKUNCI RAPAT"
        );
        return mainGateOpenRef.current;
      },
      toggleNight: () => {
        sfx("click");
        isNightRef.current = !isNightRef.current;
        onSaveStateChangeRef.current?.((prev) => ({
          ...prev,
          night: isNightRef.current ? 1 : 0,
        }));
        return isNightRef.current;
      },
      toggleRain: () => {
        sfx("click");
        isRainingRef.current = !isRainingRef.current;
        if (rainPointsRef.current) {
          rainPointsRef.current.visible = isRainingRef.current;
        }
        onToastRef.current?.(isRainingRef.current ? "Hujan turun 🌧" : "Cuaca cerah ☀️");
        return isRainingRef.current;
      },
      jump: () => {
        if (playerJumpY.current <= 0) {
          sfx("jump");
          playerJumpVel.current = 7;
          waveTimer.current = 0;
        }
      },
      enterRoom: (roomId: string) => {
        doEnterRoom(roomId);
      },
      exitRoom: () => {
        doExitRoom();
      },
      moveTo: (x: number, z: number, autoEnterId?: string) => {
        // Fast travel: langsung tempatkan karakter di depan pintu gedung tujuan
        playerPos.current.x = x;
        playerPos.current.z = z;
        targetPos.current = null;
        autoEnterRoomId.current = null;
        waveTimer.current = 1.2;

        // Buka gerbang jika berada di luar agar akses tidak terhalang
        mainGateOpenRef.current = true;

        if (autoEnterId) {
          const b = BUILDINGS.find((item) => item.id === autoEnterId);
          if (b && b.r != null) {
            playerYaw.current = b.r;
            if (playerGroupRef.current) {
              playerGroupRef.current.rotation.y = b.r;
            }
          }
          sfx("enter");
          onToastRef.current?.(`Tiba di ${b?.n || "Gedung"}. Silakan masuk!`);
          doEnterRoom(autoEnterId);
        } else {
          // Gerbang Utama
          playerYaw.current = 0;
          if (playerGroupRef.current) {
            playerGroupRef.current.rotation.y = 0;
          }
          sfx("gate");
          onToastRef.current?.("🚪 Tiba di Gerbang Utama SMA Cahaya Nusantara");
        }
      },
      triggerNearAction: () => {
        if (!nearObjRef.current) return;
        const nb = nearObjRef.current;
        if ((nb as any).exit) {
          doExitRoom();
        } else if (nb.id === "gate_toggle") {
          mainGateOpenRef.current = !mainGateOpenRef.current;
          sfx("gate");
          onToast(
            mainGateOpenRef.current
              ? "🚪 Gerbang Utama SMA Cahaya Nusantara DIBUKA LEBAR"
              : "🔒 Gerbang Utama SMA Cahaya Nusantara DITUTUP & TERKUNCI RAPAT"
          );
        } else if ((nb as any).st) {
          onOpenModal(nb.id, (nb as any).idx);
        } else if (nb.id === "satpam") {
          onOpenModal("satpam");
        } else {
          doEnterRoom(nb.id);
        }
      },
    }));

    const updateNameTag = (idx: number) => {
      const nc = nameTagCanvasRef.current;
      const nT = nameTagTexRef.current;
      if (!nc || !nT) return;
      const nx = nc.getContext("2d");
      if (!nx) return;
      nx.clearRect(0, 0, 256, 64);
      nx.fillStyle = "rgba(15,42,36,0.88)";
      nx.beginPath();
      if ((nx as any).roundRect) (nx as any).roundRect(8, 6, 240, 52, 26);
      else nx.rect(8, 6, 240, 52);
      nx.fill();
      nx.fillStyle = "#ffc83d";
      nx.font = '800 32px "Baloo 2", sans-serif';
      nx.textAlign = "center";
      nx.textBaseline = "middle";
      nx.fillText(CHARS[idx].name, 128, 34);
      nT.needsUpdate = true;
    };

    const applyCharacterSkin = (idx: number) => {
      const c = CHARS[idx];
      const PM = playerMatRef.current;
      if (PM.h) PM.h.color.setHex(c.hairColor);
      if (PM.j) PM.j.color.setHex(c.jacketColor);
      if (PM.k) PM.k.color.setHex(c.skinColor);

      if (boyGRef.current) boyGRef.current.visible = idx === 0;
      if (raniGRef.current) raniGRef.current.visible = idx === 1;
      if (sariGRef.current) sariGRef.current.visible = idx === 2;

      if (playerGroupRef.current) {
        playerGroupRef.current.traverse((o) => {
          if (o.userData.isBoy) o.visible = idx === 0;
          if (o.userData.isRani) o.visible = idx === 1;
          if (o.userData.isSari) o.visible = idx === 2;
        });
      }

      updateNameTag(idx);
    };

    const doEnterRoom = (id: string) => {
      const b = BUILDINGS.find((x) => x.id === id);
      if (b) b.isOpening = 1;
      sfx("door");

      if (b && b.r != null) {
        playerPos.current.x += Math.sin(b.r) * 1.1;
        playerPos.current.z += Math.cos(b.r) * 1.1;
      }

      setTimeout(() => {
        sfx("enter");
        roomRef.current = id;
        onRoomChangeRef.current?.(id);
        playerPos.current.x = RX;
        playerPos.current.z = 4.8;
        targetPos.current = null;
        autoEnterRoomId.current = null;
        playerPitch.current = 0.95;
        playerDist.current = 16;
        if (playerGroupRef.current) {
          playerGroupRef.current.rotation.y = Math.PI;
        }

        if (roomsMapRef.current[id]) {
          roomsMapRef.current[id].visible = true;
        }

        onSaveStateChangeRef.current?.((prev) => {
          if (!prev.v[id]) {
            const nextV = { ...prev.v, [id]: 1 };
            return { ...prev, v: nextV };
          }
          return prev;
        });

        if (id === "akademik") {
          onToastRef.current?.("📚 Masuk Gedung Akademik. Ikuti jalur karpet: Langkah 1 ➔ 2 ➔ 3.");
        } else {
          onToastRef.current?.(`Masuk ${b?.n || "Gedung"}. Jalan ke lingkaran penanda, lalu tekan E.`);
        }

        if (b) b.isOpening = 0;
      }, 220);
    };

    const doExitRoom = () => {
      if (!roomRef.current) return;
      sfx("door");
      const currentRoomId = roomRef.current;
      const b = BUILDINGS.find((x) => x.id === currentRoomId);
      playerPos.current.z = 6.6;

      setTimeout(() => {
        sfx("click");
        if (roomsMapRef.current[currentRoomId]) {
          roomsMapRef.current[currentRoomId].visible = false;
        }
        roomRef.current = null;
        onRoomChangeRef.current?.(null);

        if (b && b.r != null) {
          playerPos.current.x = b.x + Math.sin(b.r) * 5.4;
          playerPos.current.z = b.z + Math.cos(b.r) * 5.4;
          playerYaw.current = b.r + Math.PI;
          playerPitch.current = 0.5;
          playerDist.current = 11;
          if (playerGroupRef.current) {
            playerGroupRef.current.rotation.y = b.r;
          }
        }

        onToastRef.current?.("Kembali ke halaman kampus.");
      }, 200);
    };

    useEffect(() => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;
      rendererRef.current = renderer;

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(56, window.innerWidth / window.innerHeight, 0.5, 450);
      cameraRef.current = camera;

      const M = (c: number, o?: any) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o));
      const addMesh = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, par?: THREE.Object3D) => {
        const o = new THREE.Mesh(g, m);
        o.position.set(x, y, z);
        (par || scene).add(o);
        return o;
      };

      const hemi = new THREE.HemisphereLight(0xffffff, 0x6b8f5a, 0.92);
      const sun = new THREE.DirectionalLight(0xffffff, 0.95);
      sun.position.set(20, 35, 18);
      sun.castShadow = true;
      scene.add(hemi, sun);

      // Sea
      const seaM = M(0x2a9ac4);
      addMesh(new THREE.PlaneGeometry(600, 600), seaM, 0, -0.25, 0).rotation.x = -Math.PI / 2;

      // School Island (Radius 48 - 53m)
      addMesh(new THREE.CylinderGeometry(53, 53, 0.8, 64), M(0xe8d9a8), 0, -0.45, 0);
      addMesh(new THREE.CylinderGeometry(48, 48, 1, 64), M(0x7ec850), 0, -0.5, 0);

      // Central Plaza Paving (y = 0.02)
      const pavCv = document.createElement("canvas");
      pavCv.width = pavCv.height = 64;
      const px = pavCv.getContext("2d");
      if (px) {
        px.fillStyle = "#dfd8cb";
        px.fillRect(0, 0, 64, 64);
        px.strokeStyle = "#c8c0b0";
        px.lineWidth = 2;
        px.strokeRect(0, 0, 32, 32);
        px.strokeRect(32, 32, 32, 32);
      }
      const pavTex = new THREE.CanvasTexture(pavCv);
      pavTex.wrapS = pavTex.wrapT = THREE.RepeatWrapping;
      pavTex.repeat.set(16, 12);
      addMesh(new THREE.BoxGeometry(36, 0.04, 26), new THREE.MeshLambertMaterial({ color: 0xe5ded2, map: pavTex }), 0, 0.02, -5);

      // Basketball / Sports Court (y = 0.042)
      const ccv = document.createElement("canvas");
      ccv.width = 1024;
      ccv.height = 640;
      const cx = ccv.getContext("2d");
      if (cx) {
        cx.fillStyle = "#2a6b52";
        cx.fillRect(0, 0, 1024, 640);
        cx.strokeStyle = "#ffffff";
        cx.lineWidth = 10;
        cx.strokeRect(36, 36, 952, 568);
        cx.beginPath();
        cx.moveTo(512, 36);
        cx.lineTo(512, 604);
        cx.stroke();
        cx.beginPath();
        cx.arc(512, 320, 88, 0, Math.PI * 2);
        cx.stroke();
        cx.strokeRect(36, 220, 180, 200);
        cx.beginPath();
        cx.arc(216, 320, 88, -Math.PI / 2, Math.PI / 2);
        cx.stroke();
        cx.strokeRect(808, 220, 180, 200);
        cx.beginPath();
        cx.arc(808, 320, 88, Math.PI / 2, Math.PI * 1.5);
        cx.stroke();
      }
      const courtTex = new THREE.CanvasTexture(ccv);
      addMesh(new THREE.BoxGeometry(22, 0.04, 13.8), new THREE.MeshLambertMaterial({ map: courtTex }), 0, 0.042, -5);

      // Basketball Hoops
      [-11.5, 11.5].forEach((bx) => {
        const bg = new THREE.Group();
        bg.position.set(bx, 0, -5);
        scene.add(bg);
        addMesh(new THREE.CylinderGeometry(0.08, 0.1, 3.8, 8), M(0x444444), 0, 1.9, 0, bg);
        addMesh(new THREE.BoxGeometry(0.1, 1.2, 1.6), M(0xffffff), 0, 3.3, 0, bg);
        addMesh(new THREE.TorusGeometry(0.35, 0.03, 8, 16), M(0xe4572e), bx > 0 ? -0.4 : 0.4, 3.1, 0, bg).rotation.x = Math.PI / 2;
      });

      // Roads
      addMesh(new THREE.BoxGeometry(7.6, 0.04, 12), M(0xaf8e68), 0, 0.022, 34);
      addMesh(new THREE.BoxGeometry(7.2, 0.04, 20), M(0xeadfba), 0, 0.022, 18);
      addMesh(new THREE.BoxGeometry(4.5, 0.04, 5.5), M(0xeadfba), 0, 0.022, -20.5);
      addMesh(new THREE.BoxGeometry(6, 0.04, 3.6), M(0xeadfba), -21.5, 0.022, -5);
      addMesh(new THREE.BoxGeometry(6, 0.04, 3.6), M(0xeadfba), 21.5, 0.022, -5);
      addMesh(new THREE.BoxGeometry(8, 0.04, 3.6), M(0xeadfba), 9.5, 0.022, 17);

      // School Gate Structure
      const gateG = new THREE.Group();
      gateG.position.set(0, 0, 28);
      scene.add(gateG);
      const gateMat = M(0x8f4333);
      const gateTrimMat = M(0x6b2e22);
      const doorMat = M(0x1e4b75);

      addMesh(new THREE.BoxGeometry(1.8, 6.2, 1.8), gateMat, -4.6, 3.1, 0, gateG);
      addMesh(new THREE.BoxGeometry(1.8, 6.2, 1.8), gateMat, 4.6, 3.1, 0, gateG);
      addMesh(new THREE.BoxGeometry(2.2, 0.7, 2.2), gateTrimMat, -4.6, 0.35, 0, gateG);
      addMesh(new THREE.BoxGeometry(2.2, 0.7, 2.2), gateTrimMat, 4.6, 0.35, 0, gateG);
      addMesh(new THREE.BoxGeometry(12, 1.6, 1.7), gateMat, 0, 5.5, 0, gateG);
      addMesh(new THREE.BoxGeometry(13.2, 0.5, 2.6), gateTrimMat, 0, 6.4, 0, gateG);

      // Signboard
      const gcv = document.createElement("canvas");
      gcv.width = 1024;
      gcv.height = 160;
      const gx = gcv.getContext("2d");
      if (gx) {
        gx.fillStyle = "#6b2e22";
        gx.fillRect(0, 0, 1024, 160);
        gx.strokeStyle = "#ffc83d";
        gx.lineWidth = 6;
        gx.strokeRect(10, 10, 1004, 140);
        gx.fillStyle = "#ffffff";
        gx.font = '800 54px "Baloo 2", sans-serif';
        gx.textAlign = "center";
        gx.textBaseline = "middle";
        gx.fillText("SMA CAHAYA NUSANTARA", 512, 80);
      }
      const gTex = new THREE.CanvasTexture(gcv);
      addMesh(new THREE.PlaneGeometry(8.6, 1.2), new THREE.MeshBasicMaterial({ map: gTex }), 0, 5.5, 0.87, gateG);
      const gTexBack = addMesh(new THREE.PlaneGeometry(8.6, 1.2), new THREE.MeshBasicMaterial({ map: gTex }), 0, 5.5, -0.87, gateG);
      gTexBack.rotation.y = Math.PI;

      // Gate Doors
      const dL = new THREE.Group();
      dL.position.set(-3.7, 0, 0);
      dL.rotation.y = 1.15;
      gateG.add(dL);
      addMesh(new THREE.BoxGeometry(3.4, 3.4, 0.14), doorMat, 1.7, 1.9, 0, dL);
      for (let k = 0; k < 5; k++) {
        addMesh(new THREE.BoxGeometry(0.12, 3.1, 0.16), M(0x13304a), 0.5 + k * 0.65, 1.9, 0, dL);
      }
      addMesh(new THREE.BoxGeometry(0.14, 0.6, 0.2), M(0xf59e0b), 3.3, 1.9, 0, dL);

      const dR = new THREE.Group();
      dR.position.set(3.7, 0, 0);
      dR.rotation.y = -1.15;
      gateG.add(dR);
      addMesh(new THREE.BoxGeometry(3.4, 3.4, 0.14), doorMat, -1.7, 1.9, 0, dR);
      for (let k = 0; k < 5; k++) {
        addMesh(new THREE.BoxGeometry(0.12, 3.1, 0.16), M(0x13304a), -0.5 - k * 0.65, 1.9, 0, dR);
      }
      addMesh(new THREE.BoxGeometry(0.14, 0.6, 0.2), M(0xf59e0b), -3.3, 1.9, 0, dR);

      gateDoorLRef.current = dL;
      gateDoorRRef.current = dR;

      // Outer Walls
      addMesh(new THREE.BoxGeometry(42, 3.2, 0.6), gateMat, -26.5, 1.6, 0, gateG);
      addMesh(new THREE.BoxGeometry(42.2, 0.35, 0.8), gateTrimMat, -26.5, 3.3, 0, gateG);
      addMesh(new THREE.BoxGeometry(42, 3.2, 0.6), gateMat, 26.5, 1.6, 0, gateG);
      addMesh(new THREE.BoxGeometry(42.2, 0.35, 0.8), gateTrimMat, 26.5, 3.3, 0, gateG);

      // Trees
      const addTree = (tx: number, tz: number, k?: number) => {
        const tg = new THREE.Group();
        tg.position.set(tx, 0, tz);
        tg.scale.setScalar(k || 1);
        scene.add(tg);
        addMesh(new THREE.CylinderGeometry(0.25, 0.35, 1.6, 6), M(0x6b4423), 0, 0.8, 0, tg);
        addMesh(new THREE.ConeGeometry(1.3, 2.4, 7), M(0x2f8f46), 0, 2.4, 0, tg);
        addMesh(new THREE.ConeGeometry(1.0, 1.9, 7), M(0x3aa656), 0, 3.7, 0, tg);
      };
      [[-7.5, 30], [7.5, 30], [-9, 25], [9, 25]].forEach((tp) => addTree(tp[0], tp[1], 1.3));
      [-42, -34, -26, 26, 34, 42].forEach((x) => {
        addTree(x, 26, 1.2);
        addTree(x, -42, 1.2);
      });
      [-35, -25, -15, 5, 15].forEach((z) => {
        addTree(-42, z, 1.2);
        addTree(42, z, 1.2);
      });

      // Pos Satpam
      const posG = new THREE.Group();
      posG.position.set(-10, 0, 23.5);
      scene.add(posG);
      addMesh(new THREE.BoxGeometry(3.6, 2.8, 3), M(0xf3ead2), 0, 1.4, 0, posG);
      addMesh(new THREE.BoxGeometry(4.2, 0.35, 3.6), M(0x8f4333), 0, 2.95, 0, posG);
      addMesh(new THREE.BoxGeometry(1.2, 2, 0.08), M(0x8a5a2b), 0, 1, 1.52, posG);

      // Satpam Pak Budi NPC
      const satpamG = new THREE.Group();
      satpamG.position.set(-6.5, 0, 24.5);
      satpamG.rotation.y = 0.5;
      satpamG.scale.setScalar(0.9);
      scene.add(satpamG);
      const sTorso = addMesh(new THREE.CylinderGeometry(0.44, 0.39, 0.78, 16), M(0x1a2e40), 0, 1.09, 0, satpamG);
      sTorso.scale.z = 0.8;
      addMesh(new THREE.BoxGeometry(0.3, 0.4, 0.06), M(0xffffff), 0, 1.2, 0.33, satpamG);
      const sHead = new THREE.Group();
      sHead.position.y = 1.95;
      satpamG.add(sHead);
      addMesh(new THREE.SphereGeometry(0.5, 20, 16), M(0xd9a577), 0, 0, 0, sHead);
      addMesh(new THREE.CylinderGeometry(0.56, 0.52, 0.2, 16), M(0x111c26), 0, 0.35, 0, sHead);
      addMesh(new THREE.BoxGeometry(0.7, 0.06, 0.4), M(0x111c26), 0, 0.3, 0.35, sHead);
      [-0.14, 0.14].forEach((x) => {
        const lg = new THREE.Group();
        lg.position.set(x, 0.73, 0);
        satpamG.add(lg);
        addMesh(new THREE.CylinderGeometry(0.16, 0.15, 0.6, 12), M(0x111c26), 0, -0.3, 0, lg);
        addMesh(new THREE.BoxGeometry(0.3, 0.17, 0.46), M(0x111111), 0, -0.65, 0.08, lg);
      });

      // Lamp posts
      const lamps: THREE.Mesh[] = [];
      [
        [-5, 34], [5, 34], [-5, 24], [5, 24], [-5, 14], [5, 14],
        [-19, -18], [19, -18], [-19, 8], [19, 8],
      ].forEach((lp) => {
        const lg = new THREE.Group();
        lg.position.set(lp[0], 0, lp[1]);
        scene.add(lg);
        addMesh(new THREE.CylinderGeometry(0.09, 0.11, 3.8, 8), M(0x222222), 0, 1.9, 0, lg);
        addMesh(new THREE.ConeGeometry(0.5, 0.28, 6), M(0x333333), 0, 4, 0, lg);
        const bulb = addMesh(new THREE.SphereGeometry(0.25, 12, 10), new THREE.MeshBasicMaterial({ color: 0xd8d8b0 }), 0, 3.75, 0, lg);
        lamps.push(bulb);
      });
      lampsRef.current = lamps;

      // Buildings
      const winM = M(0x9bd3ff);
      BUILDINGS.forEach((b) => {
        const g = new THREE.Group();
        g.position.set(b.x, 0, b.z);
        if (b.r != null) g.rotation.y = b.r;
        scene.add(g);

        const H = { profil: 6.5, akademik: 6.5, ekskul: 4.8, ppdb: 4.2 }[b.id] || 5;
        const WC = { profil: 0xf3ead2, akademik: 0xdbe7f5, ekskul: 0xfbe3b0, ppdb: 0xd5f0e3 }[b.id] || 0xf3ead2;
        const GW = { profil: 9.2, akademik: 9.2, ekskul: 8.6, ppdb: 7.6 }[b.id] || 8;

        addMesh(new THREE.BoxGeometry(GW, H, 6.5), M(WC), 0, H / 2, 0, g);
        addMesh(new THREE.BoxGeometry(GW + 0.3, 0.6, 6.7), M(b.c), 0, 0.3, 0, g);
        addMesh(new THREE.BoxGeometry(GW + 0.3, 0.4, 6.7), M(b.c), 0, H - 0.2, 0, g);

        if (b.id === "ekskul") {
          const r = addMesh(new THREE.CylinderGeometry(3.6, 3.6, GW - 0.4, 20, 1, false, Math.PI / 2, Math.PI), M(0xc7791f), 0, H, 0, g);
          r.rotation.x = Math.PI / 2;
          r.scale.z = 0.55;
          r.scale.x = 1.07;
        } else if (b.id === "ppdb") {
          const r = addMesh(new THREE.ConeGeometry(6, 2, 4), M(0x2f7d5a), 0, H + 1, 0, g);
          r.rotation.y = Math.PI / 4;
          r.scale.z = 0.85;
        } else {
          addMesh(new THREE.BoxGeometry(GW + 0.6, 0.35, 7.1), M(0x8a8f99), 0, H + 0.18, 0, g);
          if (b.id === "profil") {
            addMesh(new THREE.BoxGeometry(2.2, 2.8, 2.2), M(0xf3ead2), 0, H + 1.7, 0, g);
            const r = addMesh(new THREE.ConeGeometry(1.8, 1.4, 4), M(b.c), 0, H + 3.8, 0, g);
            r.rotation.y = Math.PI / 4;
            addMesh(new THREE.CircleGeometry(0.7, 24), new THREE.MeshBasicMaterial({ color: 0xffffff }), 0, H + 1.8, 1.12, g);
            addMesh(new THREE.BoxGeometry(0.07, 0.5, 0.02), M(0x111111), 0, H + 1.9, 1.14, g);
          }
        }

        // Entrance Frame & Doors
        addMesh(new THREE.BoxGeometry(2.4, 2.9, 0.32), M(0x2d3748), 0, 1.45, 3.3, g);
        addMesh(new THREE.BoxGeometry(1.95, 2.7, 0.1), M(0x111827), 0, 1.35, 3.22, g);

        const bDoorL = new THREE.Group();
        bDoorL.position.set(-0.92, 0, 3.3);
        g.add(bDoorL);
        addMesh(new THREE.BoxGeometry(0.92, 2.6, 0.08), M(0x7c4a27), 0.46, 1.3, 0, bDoorL);
        addMesh(new THREE.BoxGeometry(0.56, 1.15, 0.09), winM, 0.46, 1.7, 0, bDoorL);
        b.doorL = bDoorL;

        const bDoorR = new THREE.Group();
        bDoorR.position.set(0.92, 0, 3.3);
        g.add(bDoorR);
        addMesh(new THREE.BoxGeometry(0.92, 2.6, 0.08), M(0x7c4a27), -0.46, 1.3, 0, bDoorR);
        addMesh(new THREE.BoxGeometry(0.56, 1.15, 0.09), winM, -0.46, 1.7, 0, bDoorR);
        b.doorR = bDoorR;
      });

      // Flagpole and Waving Flag
      addMesh(new THREE.CylinderGeometry(1.4, 1.6, 0.35, 24), M(0x752e20), 0, 0.17, -17);
      addMesh(new THREE.CylinderGeometry(0.08, 0.08, 6, 8), M(0xdddddd), 0, 3.2, -17);
      const fcv = document.createElement("canvas");
      fcv.width = 256;
      fcv.height = 128;
      const fx = fcv.getContext("2d");
      if (fx) {
        fx.fillStyle = "#e0222d";
        fx.fillRect(0, 0, 256, 64);
        fx.fillStyle = "#ffffff";
        fx.fillRect(0, 64, 256, 64);
      }
      const flagTex = new THREE.CanvasTexture(fcv);
      const flagGeo = new THREE.PlaneGeometry(1.8, 1.0, 16, 4);
      const flagMesh = new THREE.Mesh(flagGeo, new THREE.MeshBasicMaterial({ map: flagTex, side: THREE.DoubleSide }));
      flagMesh.position.set(0.95, 5.6, -17);
      scene.add(flagMesh);
      flagGeoRef.current = flagGeo;

      // Secret Stars
      const stars: THREE.Mesh[] = [];
      CRY.forEach((c, i) => {
        const m = addMesh(new THREE.OctahedronGeometry(0.5), new THREE.MeshBasicMaterial({ color: 0xffd23f }), c[0], 1.4, c[1]);
        m.visible = !saveState.f[i];
        stars.push(m);
      });
      starsListRef.current = stars;

      // ==========================================
      // ===== PLAYER 3D CHARACTER (LENGKAP) ======
      // ==========================================
      const pl = new THREE.Group();
      scene.add(pl);
      pl.scale.setScalar(0.9);
      playerGroupRef.current = pl;

      const PM = {
        h: M(0),
        j: M(0),
        k: M(0),
        pa: M(0x5a6575),
        sh: M(0xf8f8f8),
        rd: M(0xd62d2d),
        skirt: M(0x5a6575),
        white: M(0xffffff),
        gold: M(0xffd700),
        ribbon: M(0xb03a48),
        blush: M(0xfb7185),
      };
      playerMatRef.current = PM;

      // Torso & Tie
      const torso = addMesh(new THREE.CylinderGeometry(0.43, 0.38, 0.78, 16), PM.j, 0, 1.09, 0, pl);
      torso.scale.z = 0.8;
      torsoRef.current = torso;
      addMesh(new THREE.BoxGeometry(0.3, 0.5, 0.06), PM.sh, 0, 1.2, 0.33, pl);
      addMesh(new THREE.BoxGeometry(0.09, 0.42, 0.05), PM.rd, 0, 1.14, 0.37, pl);
      addMesh(new THREE.BoxGeometry(0.4, 0.09, 0.1), PM.sh, 0, 1.5, 0.3, pl);

      // Backpack
      addMesh(new THREE.BoxGeometry(0.62, 0.72, 0.26), PM.rd, 0, 1.15, -0.45, pl);

      // Head
      const head = new THREE.Group();
      head.position.y = 1.95;
      pl.add(head);
      headRef.current = head;
      addMesh(new THREE.SphereGeometry(0.5, 24, 18), PM.k, 0, 0, 0, head);

      // Face features
      [-1, 1].forEach((s) => {
        addMesh(new THREE.SphereGeometry(0.13, 12, 10), M(0xffffff), s * 0.18, 0.04, 0.4, head);
        addMesh(new THREE.SphereGeometry(0.085, 12, 10), M(0x3b6e8f), s * 0.18, 0.04, 0.48, head);
        addMesh(new THREE.SphereGeometry(0.045, 10, 8), M(0x101820), s * 0.18, 0.04, 0.53, head);
        addMesh(new THREE.SphereGeometry(0.07, 10, 8), PM.blush, s * 0.3, -0.1, 0.37, head).scale.z = 0.4;
      });

      // 1. Naufal (Boy Hair)
      const boyG = new THREE.Group();
      head.add(boyG);
      addMesh(new THREE.SphereGeometry(0.53, 20, 10, 0, 6.283, 0, 1.2), PM.h, 0, 0.02, 0, boyG);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * 6.283;
        const c = addMesh(new THREE.ConeGeometry(0.13, 0.4, 6), PM.h, Math.sin(a) * 0.3, 0.5, Math.cos(a) * 0.25 - 0.05, boyG);
        c.rotation.set(Math.cos(a) * 0.6, 0, -Math.sin(a) * 0.6);
      }
      boyGRef.current = boyG;

      // 2. Rani (Girl Ponytail & Pleated Skirt)
      const raniG = new THREE.Group();
      head.add(raniG);
      addMesh(new THREE.SphereGeometry(0.54, 22, 12, 0, 6.283, 0, 1.35), PM.h, 0, 0.02, 0, raniG);
      addMesh(new THREE.CylinderGeometry(0.48, 0.44, 0.6, 16), PM.h, 0, -0.12, -0.16, raniG);
      addMesh(new THREE.TorusGeometry(0.13, 0.035, 8, 16), PM.ribbon, 0, 0.22, -0.48, raniG);
      const rPony = addMesh(new THREE.CylinderGeometry(0.14, 0.05, 0.8, 12), PM.h, 0, -0.15, -0.64, raniG);
      rPony.rotation.x = -0.42;
      raniGRef.current = raniG;

      const raniSkirt = addMesh(new THREE.CylinderGeometry(0.38, 0.58, 0.46, 16), PM.skirt, 0, 0.68, 0, pl);
      raniSkirt.userData.isRani = 1;

      // 3. Sari (Hijab & Maxi Skirt)
      const sariG = new THREE.Group();
      head.add(sariG);
      addMesh(new THREE.SphereGeometry(0.56, 24, 20), PM.white, 0, 0.02, 0, sariG);
      const sDrape = addMesh(new THREE.ConeGeometry(0.62, 0.68, 20, 1, true), PM.white, 0, -0.36, 0, sariG);
      sDrape.scale.set(1.05, 1, 0.9);
      addMesh(new THREE.TorusGeometry(0.06, 0.02, 8, 16), PM.gold, 0.24, -0.3, 0.38, sariG);
      sariGRef.current = sariG;

      const sariSkirt = addMesh(new THREE.CylinderGeometry(0.38, 0.64, 0.96, 16), PM.skirt, 0, 0.46, 0, pl);
      sariSkirt.userData.isSari = 1;

      // Legs (Bisa mengayun saat berjalan)
      const legs: THREE.Group[] = [];
      [-0.14, 0.14].forEach((x) => {
        const lg = new THREE.Group();
        lg.position.set(x, 0.73, 0);
        pl.add(lg);
        const pLg = addMesh(new THREE.CylinderGeometry(0.16, 0.15, 0.6, 12), PM.pa, 0, -0.3, 0, lg);
        pLg.userData.isBoy = 1;
        const rLg = addMesh(new THREE.CylinderGeometry(0.13, 0.13, 0.35, 12), PM.white, 0, -0.35, 0, lg);
        rLg.userData.isRani = 1;
        addMesh(new THREE.BoxGeometry(0.28, 0.17, 0.46), M(0x151515), 0, -0.65, 0.08, lg);
        addMesh(new THREE.BoxGeometry(0.3, 0.06, 0.48), M(0xffffff), 0, -0.72, 0.08, lg);
        lg.userData.leg = 1;
        legs.push(lg);
      });
      legsRef.current = legs;

      // Arms (Bisa mengayun saat berjalan & melambai)
      const arms: THREE.Group[] = [];
      [-1, 1].forEach((s) => {
        const g = new THREE.Group();
        g.position.set(s * 0.5, 1.38, 0);
        pl.add(g);
        addMesh(new THREE.CylinderGeometry(0.115, 0.1, 0.66, 12), PM.j, 0, -0.33, 0, g);
        addMesh(new THREE.SphereGeometry(0.14, 12, 10), PM.j, 0, 0, 0, g);
        addMesh(new THREE.SphereGeometry(0.12, 12, 10), PM.k, 0, -0.74, 0, g);
        g.userData.arm = 1;
        arms.push(g);
      });
      armsRef.current = arms;

      // 3D Billboard Name Tag di atas kepala karakter
      const nc = document.createElement("canvas");
      nc.width = 256;
      nc.height = 64;
      nameTagCanvasRef.current = nc;
      const nT = new THREE.CanvasTexture(nc);
      nameTagTexRef.current = nT;
      const ns = new THREE.Sprite(new THREE.SpriteMaterial({ map: nT, depthTest: false }));
      ns.scale.set(2, 0.5, 1);
      ns.position.y = 3.05;
      ns.renderOrder = 9;
      pl.add(ns);

      // Student NPCs (Orang-orang / Siswa-siswi lain yang berjalan di sekolah)
      const npcsConfig = [
        [0x2b1b12, 0xb03a48, 0xd9a577, 14, 0.18, 1],
        [0xc58b3a, 0x3b7d5a, 0xe8b98f, 12, 0.22, -1],
        [0x1a1a1a, 0x7a4bb0, 0xf2c9a0, 28, 0.06, 1],
        [0x8a3b1f, 0xe08a2c, 0xd9a577, 26, 0.05, -1],
        [0x30200f, 0x2a8aa8, 0xe8b98f, 16, 0.15, 1],
      ];
      const npcs = npcsConfig.map((c, i) => {
        const g = pl.clone(true);
        g.children.filter((o: any) => o.isSprite).forEach((o) => g.remove(o));
        g.traverse((o: any) => {
          if (o.isMesh && !o.userData.ol) {
            const m = o.material;
            if (m === PM.h) o.material = M(c[0]);
            else if (m === PM.j) o.material = M(c[1]);
            else if (m === PM.k) o.material = M(c[2]);
          }
        });
        scene.add(g);
        return {
          g,
          r: c[3],
          w: (c[4] as number) * (c[5] as number),
          a: i * 1.7,
          lg: g.children.filter((o) => o.userData.leg),
          ar: g.children.filter((o) => o.userData.arm),
        };
      });
      npcsRef.current = npcs;

      // Rain particles
      const rv = new Float32Array(1500);
      for (let i = 0; i < 1500; i += 3) {
        rv[i] = (Math.random() - 0.5) * 40;
        rv[i + 1] = Math.random() * 16;
        rv[i + 2] = (Math.random() - 0.5) * 40;
      }
      rainCoordsRef.current = rv;
      const rg = new THREE.BufferGeometry();
      rg.setAttribute("position", new THREE.BufferAttribute(rv, 3));
      const rainP = new THREE.Points(rg, new THREE.PointsMaterial({ color: 0xaaccee, size: 0.15 }));
      rainP.visible = false;
      scene.add(rainP);
      rainPointsRef.current = rainP;

      // Interior Rooms
      const roomsMap: Record<string, THREE.Group> = {};
      const roomRings: Record<string, any[]> = {};

      Object.keys(RM).forEach((id) => {
        const d = RM[id];
        const g = new THREE.Group();
        g.position.x = RX;
        g.visible = false;
        scene.add(g);

        addMesh(new THREE.BoxGeometry(22, 0.35, 16), M(d.f), 0, -0.15, 0, g);
        addMesh(new THREE.BoxGeometry(22, 4.8, 0.35), M(d.w), 0, 2.4, -8.15, g);
        addMesh(new THREE.BoxGeometry(0.35, 4.8, 16), M(d.w), -11.15, 2.4, 0, g);
        addMesh(new THREE.BoxGeometry(0.35, 4.8, 16), M(d.w), 11.15, 2.4, 0, g);
        addMesh(new THREE.BoxGeometry(22, 4.8, 0.35), M(d.w), 0, 2.4, 8.15, g);

        // Exit Door
        addMesh(new THREE.BoxGeometry(2.4, 2.9, 0.3), M(0x2d3748), 0, 1.45, 7.3, g);

        // Furniture
        d.F.forEach((f: any) =>
          addMesh(new THREE.BoxGeometry(f[2], f[3], f[4]), M(f[5]), f[0], f[3] / 2, f[1], g)
        );

        // Interaction Rings
        roomRings[id] = d.S.map((q: any, i: number) => {
          const r = addMesh(new THREE.TorusGeometry(0.8, 0.1, 8, 24), M(0xffc83d), q[0], 0.12, q[1], g);
          r.rotation.x = Math.PI / 2;
          return {
            id,
            idx: i,
            st: 1,
            x: RX + q[0],
            z: q[1],
            ring: r,
          };
        });

        roomsMap[id] = g;
      });

      roomsMapRef.current = roomsMap;
      roomRingMapRef.current = roomRings;

      applyCharacterSkin(charIndex);

      // Event listeners
      const handleResize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", handleResize);

      const handleKeyDown = (e: KeyboardEvent) => {
        keys.current[e.key.toLowerCase()] = true;
        if (e.key.toLowerCase() === "e") {
          if (nearObjRef.current) {
            const nb = nearObjRef.current;
            if ((nb as any).exit) doExitRoom();
            else if (nb.id === "gate_toggle") {
              mainGateOpenRef.current = !mainGateOpenRef.current;
              sfx("gate");
              onToastRef.current?.(
                mainGateOpenRef.current
                  ? "🚪 Gerbang Utama SMA Cahaya Nusantara DIBUKA LEBAR"
                  : "🔒 Gerbang Utama SMA Cahaya Nusantara DITUTUP & TERKUNCI RAPAT"
              );
            } else if ((nb as any).st) {
              onOpenModalRef.current?.(nb.id, (nb as any).idx);
            } else if (nb.id === "satpam") {
              onOpenModalRef.current?.("satpam");
            } else {
              doEnterRoom(nb.id);
            }
          }
        }
        if (e.key === " " && playRef.current) {
          e.preventDefault();
          if (playerJumpY.current <= 0) {
            sfx("jump");
            playerJumpVel.current = 7;
          }
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        keys.current[e.key.toLowerCase()] = false;
      };

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);

      // Mouse drag camera orbit, touch joystick & click-to-move
      let dn: { x: number; y: number } | null = null;
      let mv = 0;
      const ray = new THREE.Raycaster();
      const pln = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const hit = new THREE.Vector3();

      const jb = document.getElementById("jb");
      const jk = document.getElementById("jk");

      const handlePointerDown = (e: PointerEvent) => {
        if (playRef.current && !roomRef.current && e.pointerType === "touch" && e.clientX < window.innerWidth * 0.55 && !joyRef.current) {
          joyRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0 };
          if (jb) {
            jb.style.left = e.clientX + "px";
            jb.style.top = e.clientY + "px";
            jb.classList.add("on");
          }
          if (jk) jk.style.transform = "";
          targetPos.current = null;
          autoEnterRoomId.current = null;
          return;
        }
        dn = { x: e.clientX, y: e.clientY };
        mv = 0;
      };

      const handlePointerMove = (e: PointerEvent) => {
        if (joyRef.current && e.pointerId === joyRef.current.id) {
          let dx = e.clientX - joyRef.current.x;
          let dy = e.clientY - joyRef.current.y;
          const l = Math.hypot(dx, dy);
          const m = 48;
          if (l > m) {
            dx *= m / l;
            dy *= m / l;
          }
          joyRef.current.dx = dx / m;
          joyRef.current.dy = dy / m;
          if (jk) jk.style.transform = `translate(${dx}px,${dy}px)`;
          return;
        }
        if (!dn) return;
        const ax = e.clientX - dn.x;
        const ay = e.clientY - dn.y;
        mv += Math.abs(ax) + Math.abs(ay);
        playerYaw.current -= ax * 0.006;
        playerPitch.current = Math.min(1.2, Math.max(0.15, playerPitch.current + ay * 0.004));
        dn = { x: e.clientX, y: e.clientY };
      };

      const handlePointerUp = (e: PointerEvent) => {
        if (joyRef.current && e.pointerId === joyRef.current.id) {
          joyRef.current = null;
          if (jb) jb.classList.remove("on");
          return;
        }
        if (dn && mv < 8 && playRef.current && !roomRef.current) {
          ray.setFromCamera(
            new THREE.Vector2(
              (e.clientX / window.innerWidth) * 2 - 1,
              -(e.clientY / window.innerHeight) * 2 + 1
            ),
            camera
          );
          if (ray.ray.intersectPlane(pln, hit)) {
            targetPos.current = { x: hit.x, z: hit.z };
            autoEnterRoomId.current = null;
          }
        }
        dn = null;
      };

      const handlePointerCancel = () => {
        joyRef.current = null;
        if (jb) jb.classList.remove("on");
        dn = null;
      };

      const handleWheel = (e: WheelEvent) => {
        playerDist.current = Math.min(24, Math.max(6, playerDist.current + e.deltaY * 0.012));
      };

      canvas.addEventListener("pointerdown", handlePointerDown);
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerCancel);
      canvas.addEventListener("wheel", handleWheel, { passive: true });

      // ==========================================
      // ===== MAIN GAME LOOP & ANIMATION =========
      // ==========================================
      const animateLoop = () => {
        animFrameId.current = requestAnimationFrame(animateLoop);
        const dt = Math.min(clockRef.current.getDelta(), 0.05);
        const t = clockRef.current.elapsedTime;

        let dx = 0, dz = 0;
        const K = keys.current;

        if (playRef.current) {
          let f = (K.w || K.arrowup ? 1 : 0) - (K.s || K.arrowdown ? 1 : 0);
          let r = (K.d || K.arrowright ? 1 : 0) - (K.a || K.arrowleft ? 1 : 0);

          if (joyRef.current && Math.hypot(joyRef.current.dx, joyRef.current.dy) > 0.15) {
            f = -joyRef.current.dy;
            r = joyRef.current.dx;
          }

          if (f || r) {
            targetPos.current = null;
            autoEnterRoomId.current = null;
            dx = -Math.sin(playerYaw.current) * f + Math.cos(playerYaw.current) * r;
            dz = -Math.cos(playerYaw.current) * f - Math.sin(playerYaw.current) * r;
          } else if (targetPos.current) {
            const ex = targetPos.current.x - playerPos.current.x;
            const ez = targetPos.current.z - playerPos.current.z;
            const d = Math.hypot(ex, ez);
            if (d < 0.6) {
              targetPos.current = null;
              if (autoEnterRoomId.current) {
                const auto = autoEnterRoomId.current;
                autoEnterRoomId.current = null;
                doEnterRoom(auto);
              }
            } else {
              dx = ex / d;
              dz = ez / d;
            }
          }
        }

        // Jump physics
        if (playerJumpY.current > 0 || playerJumpVel.current > 0) {
          playerJumpVel.current -= 20 * dt;
          playerJumpY.current += playerJumpVel.current * dt;
          if (playerJumpY.current <= 0) {
            playerJumpY.current = 0;
            playerJumpVel.current = 0;
          }
        }

        // Movement & Physics
        const l = Math.hypot(dx, dz);
        if (l > 0) {
          dx /= l;
          dz /= l;
          const isSprint = K.shift || (joyRef.current && Math.hypot(joyRef.current.dx, joyRef.current.dy) > 0.9);
          const sp = isSprint ? 8.5 : 5.2;
          playerPos.current.x += dx * sp * dt;
          playerPos.current.z += dz * sp * dt;

          // Collision detection
          if (roomRef.current) {
            playerPos.current.x = Math.min(RX + 10.2, Math.max(RX - 10.2, playerPos.current.x));
            playerPos.current.z = Math.min(7.4, Math.max(-7.2, playerPos.current.z));
          } else {
            // Gate wall collision (z = 28)
            if (Math.abs(playerPos.current.z - 28) < 0.85) {
              if (playerPos.current.x < -3.5 || playerPos.current.x > 3.5 || !mainGateOpenRef.current) {
                playerPos.current.z = 28 + Math.sign(playerPos.current.z - 28 || 1) * 0.85;
              }
            }
            // Pillars
            [-4.6, 4.6].forEach((px) => {
              const distX = playerPos.current.x - px;
              const distZ = playerPos.current.z - 28;
              if (Math.abs(distX) < 1.25 && Math.abs(distZ) < 1.25) {
                if (1.25 - Math.abs(distX) < 1.25 - Math.abs(distZ))
                  playerPos.current.x = px + Math.sign(distX || 1) * 1.25;
                else playerPos.current.z = 28 + Math.sign(distZ || 1) * 1.25;
              }
            });
            // Pos satpam
            if (Math.abs(playerPos.current.x + 10) < 2.2 && Math.abs(playerPos.current.z - 23.5) < 1.8) {
              if (2.2 - Math.abs(playerPos.current.x + 10) < 1.8 - Math.abs(playerPos.current.z - 23.5))
                playerPos.current.x = -10 + Math.sign(playerPos.current.x + 10 || 1) * 2.2;
              else playerPos.current.z = 23.5 + Math.sign(playerPos.current.z - 23.5 || 1) * 1.8;
            }
            // Buildings
            for (const b of BUILDINGS) {
              if (b.r != null) {
                const c = Math.cos(b.r), s = Math.sin(b.r);
                const bdx = playerPos.current.x - b.x, bdz = playerPos.current.z - b.z;
                let lx = bdx * c - bdz * s, lz = bdx * s + bdz * c;
                const hx = 5.2, hz = 4.2;
                if (Math.abs(lx) < hx && Math.abs(lz) < hz) {
                  if (hx - Math.abs(lx) < hz - Math.abs(lz)) lx = Math.sign(lx || 1) * hx;
                  else lz = Math.sign(lz || 1) * hz;
                  playerPos.current.x = b.x + lx * c + lz * s;
                  playerPos.current.z = b.z - lx * s + lz * c;
                }
              }
            }
            // Flagpole (0, -17)
            if (Math.hypot(playerPos.current.x, playerPos.current.z + 17) < 1.4) {
              const dFlag = Math.hypot(playerPos.current.x, playerPos.current.z + 17);
              playerPos.current.x = (playerPos.current.x / (dFlag || 1)) * 1.4;
              playerPos.current.z = -17 + ((playerPos.current.z + 17) / (dFlag || 1)) * 1.4;
            }
            // Campus island radius 47m
            const distIsland = Math.hypot(playerPos.current.x, playerPos.current.z);
            if (distIsland > 47) {
              playerPos.current.x *= 47 / distIsland;
              playerPos.current.z *= 47 / distIsland;
            }
          }

          let da = Math.atan2(dx, dz) - pl.rotation.y;
          da = Math.atan2(Math.sin(da), Math.cos(da));
          pl.rotation.y += da * Math.min(1, dt * 12);
          waveTimer.current = 0;
        }

        // ==========================================
        // ===== ANIMASI ORANG / KARAKTER BERJALAN ==
        // ==========================================
        const sw = Math.sin(t * 12);
        const b = Math.sin(t * 2);
        const [L, Rl] = legsRef.current;
        const [aL, aR] = armsRef.current;
        const torsoObj = torsoRef.current;
        const headObj = headRef.current;

        if (waveTimer.current > 0) {
          waveTimer.current -= dt;
        }

        if (L && Rl && aL && aR) {
          if (l > 0) {
            // Kaki mengayun natural maju mundur
            L.rotation.x = sw * 0.7;
            Rl.rotation.x = -sw * 0.7;
            // Tangan mengayun berlawanan dengan kaki
            aL.rotation.x = -sw * 0.5;
            aR.rotation.x = sw * 0.5;
            aL.rotation.z = -0.1;
            aR.rotation.z = 0.1;
            // Badan membal vertikal naik turun saat melangkah
            pl.position.y = playerJumpY.current + Math.abs(sw) * 0.08;
            if (headObj) headObj.rotation.set(0, 0, 0);
            if (torsoObj) torsoObj.scale.y = 1;

            // Efek suara langkah kaki
            stepTimer.current += dt;
            if (stepTimer.current > 0.28) {
              stepTimer.current = 0;
              sfx("step");
            }
          } else {
            // Diam / Idle Breathing
            L.rotation.x = 0;
            Rl.rotation.x = 0;
            aL.rotation.x = 0;
            aR.rotation.x = 0;
            pl.position.y = playerJumpY.current;
            if (torsoObj) torsoObj.scale.y = 1 + b * 0.012;
            aL.rotation.z = -0.1 - b * 0.02;

            if (waveTimer.current > 0) {
              // Melambaikan tangan menyapa
              aR.rotation.z = 2.5 + Math.sin(t * 10) * 0.3;
              if (headObj) headObj.rotation.set(0, Math.sin(t * 2) * 0.12, 0.1);
            } else {
              aR.rotation.z = 0.1 + b * 0.02;
              if (headObj) headObj.rotation.set(0, 0, Math.sin(t * 1.3) * 0.04);
            }
          }

          // Pose saat melompat
          if (playerJumpY.current > 0) {
            L.rotation.x = -0.5;
            Rl.rotation.x = 0.4;
            aL.rotation.z = -0.7;
            aR.rotation.z = 0.7;
          }
        }

        pl.position.x = playerPos.current.x;
        pl.position.z = playerPos.current.z;

        // ==========================================
        // ===== ANIMASI SISWA / NPC LAIN ===========
        // ==========================================
        npcsRef.current.forEach((n, i) => {
          const d2 = Math.hypot(n.g.position.x - playerPos.current.x, n.g.position.z - playerPos.current.z);
          const nr = d2 < 3.5 && playRef.current;
          if (!nr) n.a += n.w * dt;
          const sg = Math.sign(n.w);
          const nxPos = Math.cos(n.a) * n.r;
          const nzPos = Math.sin(n.a) * n.r;
          n.g.position.x = nxPos;
          n.g.position.z = nzPos;

          // Menghadap pemain jika didekati
          const ang = nr
            ? Math.atan2(playerPos.current.x - nxPos, playerPos.current.z - nzPos)
            : Math.atan2(-Math.sin(n.a) * sg, Math.cos(n.a) * sg);
          let da = ang - n.g.rotation.y;
          da = Math.atan2(Math.sin(da), Math.cos(da));
          n.g.rotation.y += da * Math.min(1, dt * 6);

          const npcSw = Math.sin(t * 9 + i);
          if (n.lg[0] && n.lg[1]) {
            n.lg[0].rotation.x = nr ? 0 : npcSw * 0.6;
            n.lg[1].rotation.x = nr ? 0 : -npcSw * 0.6;
          }
          if (n.ar[0] && n.ar[1]) {
            n.ar[0].rotation.x = nr ? 0 : -npcSw * 0.4;
            n.ar[1].rotation.x = nr ? 0 : npcSw * 0.4;
            n.ar[0].rotation.z = -0.1;
            // NPC melambaikan tangan menyapa saat didekati!
            n.ar[1].rotation.z = nr ? 2.5 + Math.sin(t * 10) * 0.3 : 0.1;
          }
          n.g.position.y = nr ? 0 : Math.abs(npcSw) * 0.05;
        });

        // First gate pass trigger
        if (playRef.current && !saveStateRef.current.gate && playerPos.current.z <= 28.2 && Math.abs(playerPos.current.x) < 3.6) {
          onSaveStateChangeRef.current?.((prev) => ({ ...prev, gate: 1 }));
          sfx("star");
          onToastRef.current?.("🎉 Selamat Datang di SMA Cahaya Nusantara! Halaman sekolah kini luas dan bebas dijelajahi.");
        }

        // Secret star collection
        starsListRef.current.forEach((m, idx) => {
          if (!m.visible) return;
          m.rotation.y = t * 2;
          m.position.y = 1.4 + Math.sin(t * 2 + idx) * 0.15;
          if (playRef.current && Math.hypot(m.position.x - playerPos.current.x, m.position.z - playerPos.current.z) < 1.5) {
            m.visible = false;
            sfx("star");
            onSaveStateChangeRef.current?.((prev) => ({
              ...prev,
              f: { ...prev.f, [idx]: 1 },
            }));
            onToastRef.current?.(`⭐ Fakta Ditemukan: ${FACTS[idx]}`);
          }
        });

        // Waving Flag Simulation
        if (flagGeoRef.current) {
          const fPos = flagGeoRef.current.attributes.position;
          for (let i = 0; i < fPos.count; i++) {
            const vx = fPos.getX(i);
            const factor = (vx + 0.9) / 1.8;
            fPos.setZ(i, Math.sin(t * 7 + vx * 4) * 0.16 * factor);
          }
          flagGeoRef.current.attributes.position.needsUpdate = true;
        }

        // Gate Door swings
        if (gateDoorLRef.current && gateDoorRRef.current) {
          const targetGateAngle = mainGateOpenRef.current ? 1.15 : 0.0;
          gateDoorLRef.current.rotation.y +=
            (targetGateAngle - gateDoorLRef.current.rotation.y) * Math.min(1, dt * 5.5);
          gateDoorRRef.current.rotation.y +=
            (-targetGateAngle - gateDoorRRef.current.rotation.y) * Math.min(1, dt * 5.5);
        }

        // Building door swings
        if (!roomRef.current) {
          BUILDINGS.forEach((b) => {
            if (!b.doorL || !b.doorR || b.dx == null || b.dz == null) return;
            const dist = Math.hypot(b.dx - playerPos.current.x, b.dz - playerPos.current.z);
            const isOpen = dist < 3.6 || b.isOpening;
            const targetAngle = isOpen ? 1.45 : 0;
            b.doorL.rotation.y += (-targetAngle - b.doorL.rotation.y) * Math.min(1, dt * 6.5);
            b.doorR.rotation.y += (targetAngle - b.doorR.rotation.y) * Math.min(1, dt * 6.5);
          });
        }

        // Check nearest interactable object
        let nb: any = null;
        if (playRef.current && !roomRef.current) {
          for (const b of BUILDINGS) {
            if (b.dx != null && b.dz != null && Math.hypot(b.dx - playerPos.current.x, b.dz - playerPos.current.z) < 3.0) {
              nb = { id: b.id, n: b.n, i: b.i, v: "Masuk Pintu" };
            }
          }
          if (Math.hypot(-6.5 - playerPos.current.x, 24.5 - playerPos.current.z) < 2.8) {
            nb = { id: "satpam", n: "Pak Budi (Satpam)", i: "👮", v: "Bicara" };
          }
          if (Math.abs(playerPos.current.x) < 4.2 && Math.abs(playerPos.current.z - 28) < 3.2) {
            nb = {
              id: "gate_toggle",
              n: "Gerbang Utama",
              i: "🚪",
              v: mainGateOpenRef.current ? "Tutup Gerbang" : "Buka Gerbang",
            };
          }
        } else if (roomRef.current) {
          if (Math.hypot(RX - playerPos.current.x, 7 - playerPos.current.z) < 1.8) {
            nb = { exit: 1, id: "exit", n: "Pintu Keluar", i: "🚪", v: "Keluar" };
          }
          const rings = roomRingMapRef.current[roomRef.current] || [];
          for (const r of rings) {
            if (Math.hypot(r.x - playerPos.current.x, r.z - playerPos.current.z) < 1.6) {
              nb = r;
            }
          }
        }

        if (nb !== nearObjRef.current) {
          nearObjRef.current = nb;
          onNearChangeRef.current?.(nb);
        }

        // Camera follow
        const d = roomRef.current ? 15 : playerDist.current;
        const pt = roomRef.current ? 0.95 : playerPitch.current;
        const cp = Math.cos(pt);
        const tv = new THREE.Vector3(
          playerPos.current.x + Math.sin(playerYaw.current) * cp * d,
          1.2 + Math.sin(pt) * d,
          playerPos.current.z + Math.cos(playerYaw.current) * cp * d
        );
        camera.position.lerp(tv, 1 - Math.pow(0.001, dt));
        camera.lookAt(playerPos.current.x, 1.3, playerPos.current.z);

        onPlayerMoveRef.current?.({
          x: playerPos.current.x,
          z: playerPos.current.z,
          yaw: playerYaw.current,
        });

        renderer.render(scene, camera);
      };

      animateLoop();

      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        canvas.removeEventListener("pointerdown", handlePointerDown);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerCancel);
        canvas.removeEventListener("wheel", handleWheel);
        if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        id="c"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          touchAction: "none",
        }}
      />
    );
  }
);

SchoolWorld.displayName = "SchoolWorld";
