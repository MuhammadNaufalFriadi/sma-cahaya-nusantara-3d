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
  onPlayerMove: (pos: { x: number; z: number; yaw: number; rotY: number }) => void;
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
    const kneesRef = useRef<THREE.Group[]>([]);
    const armsRef = useRef<THREE.Group[]>([]);
    const forearmsRef = useRef<THREE.Group[]>([]);
    const torsoRef = useRef<THREE.Mesh | null>(null);
    const headRef = useRef<THREE.Group | null>(null);
    const raniSkirtRef = useRef<THREE.Mesh | null>(null);
    const sariSkirtRef = useRef<THREE.Mesh | null>(null);
    const rPonyRef = useRef<THREE.Mesh | null>(null);
    const backpackRef = useRef<THREE.Group | null>(null);
    const walkPhase = useRef(0);
    const walkWeight = useRef(0);

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
    const openDoorTimer = useRef(0);

    const keys = useRef<Record<string, boolean>>({});
    const targetPos = useRef<{ x: number; z: number } | null>(null);
    const autoEnterRoomId = useRef<string | null>(null);
    const nearObjRef = useRef<{ id: string; n: string; i: string; v: string } | null>(null);

    const starsListRef = useRef<THREE.Mesh[]>([]);
    const flagGeoRef = useRef<THREE.PlaneGeometry | null>(null);
    const lampsRef = useRef<THREE.Mesh[]>([]);
    const rainPointsRef = useRef<THREE.Points | null>(null);
    const rainCoordsRef = useRef<Float32Array | null>(null);
    const nightSkyGroupRef = useRef<THREE.Points | null>(null);
    const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
    const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
    const updateWeatherVisualsRef = useRef<() => void>(() => {});

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
        updateWeatherVisualsRef.current?.();
        onSaveStateChangeRef.current?.((prev) => ({
          ...prev,
          night: isNightRef.current ? 1 : 0,
        }));
        onToastRef.current?.(isNightRef.current ? "🌙 Suasana Malam SMA" : "☀️ Cuaca Siang Cerah");
        return isNightRef.current;
      },
      toggleRain: () => {
        sfx("click");
        isRainingRef.current = !isRainingRef.current;
        updateWeatherVisualsRef.current?.();
        onToastRef.current?.(isRainingRef.current ? "🌧️ Hujan Gerimis Aktif" : "🌤️ Hujan Reda & Cuaca Cerah");
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
          onToastRef.current?.(
            `Tiba di ${b?.n || "Gedung"}. Tekan 'Buka Pintu' untuk masuk!`
          );
        } else {
          // Gerbang Utama
          playerYaw.current = 0;
          if (playerGroupRef.current) {
            playerGroupRef.current.rotation.y = Math.PI;
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
          if (o.userData.isNonHijab) o.visible = idx !== 2;
        });
      }

      updateNameTag(idx);
    };

    const doEnterRoom = (id: string) => {
      const b = BUILDINGS.find((x) => x.id === id);
      if (b) b.isOpening = 1;
      openDoorTimer.current = 0.55;
      sfx("door");

      if (b && b.r != null) {
        playerPos.current.x += Math.sin(b.r) * 1.2;
        playerPos.current.z += Math.cos(b.r) * 1.2;
      }

      setTimeout(() => {
        sfx("enter");
        roomRef.current = id;
        onRoomChangeRef.current?.(id);
        playerPos.current.x = RX;
        playerPos.current.z = 2.4;
        targetPos.current = null;
        autoEnterRoomId.current = null;
        playerPitch.current = 0.28;
        playerDist.current = 7.5;
        playerYaw.current = 0;
        if (playerGroupRef.current) {
          playerGroupRef.current.rotation.y = Math.PI;
        }

        if (roomsMapRef.current[id]) {
          roomsMapRef.current[id].visible = true;
        }

        if (rainPointsRef.current) rainPointsRef.current.visible = false;
        if (nightSkyGroupRef.current) nightSkyGroupRef.current.visible = false;

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
      }, 420);
    };

    const doExitRoom = () => {
      if (!roomRef.current) return;
      sfx("door");
      const currentRoomId = roomRef.current;
      const b = BUILDINGS.find((x) => x.id === currentRoomId);
      if (roomsMapRef.current[currentRoomId]) {
        roomsMapRef.current[currentRoomId].userData.isOpeningExit = 1;
      }
      openDoorTimer.current = 0.55;

      setTimeout(() => {
        sfx("click");
        if (roomsMapRef.current[currentRoomId]) {
          roomsMapRef.current[currentRoomId].visible = false;
          roomsMapRef.current[currentRoomId].userData.isOpeningExit = 0;
        }
        roomRef.current = null;
        onRoomChangeRef.current?.(null);
        updateWeatherVisualsRef.current?.();

        if (b && b.r != null) {
          const frontDist =
            b.id === "ekskul"
              ? 5.8
              : b.id === "profil"
              ? 5.6
              : b.id === "akademik"
              ? 5.5
              : 5.4;
          playerPos.current.x = b.x + Math.sin(b.r) * (frontDist + 0.3);
          playerPos.current.z = b.z + Math.cos(b.r) * (frontDist + 0.3);
          playerYaw.current = b.r + Math.PI;
          playerPitch.current = 0.5;
          playerDist.current = 11;
          if (playerGroupRef.current) {
            playerGroupRef.current.rotation.y = b.r;
          }
        }

        onToastRef.current?.("Kembali ke halaman SMA.");
      }, 420);
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
      hemiLightRef.current = hemi;
      sunLightRef.current = sun;

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

      // ========================================================
      // ===== GEDUNG-GEDUNG SEKOLAH 3D ARSITEKTUR REALISTIK =====
      // ========================================================
      const winGlassM = new THREE.MeshLambertMaterial({
        color: 0x93c5fd,
        transparent: true,
        opacity: 0.85,
      });

      // Helper untuk membuat jendela 3D berbingkai dengan visor peneduh
      function buildWin(w: number, h: number, x: number, y: number, z: number, par: THREE.Object3D, frameCol = 0xffffff, visorCol = 0xb5483b) {
        // Bingkai Luar Jendela
        addMesh(new THREE.BoxGeometry(w, h, 0.12), M(frameCol), x, y, z, par);
        // Kaca Biru Langit Berkilau
        addMesh(new THREE.BoxGeometry(w - 0.12, h - 0.12, 0.05), winGlassM, x, y, z + 0.02, par);
        // Teralis / Kusen Pembagi (Grid +)
        addMesh(new THREE.BoxGeometry(w - 0.12, 0.04, 0.07), M(frameCol), x, y, z + 0.03, par);
        addMesh(new THREE.BoxGeometry(0.04, h - 0.12, 0.07), M(frameCol), x, y, z + 0.03, par);
        // Kanopi / Visor Peneduh Jendela
        addMesh(new THREE.BoxGeometry(w + 0.22, 0.1, 0.35), M(visorCol), x, y + h / 2 + 0.06, z + 0.14, par);
      }

      // Helper untuk membuat pot bunga & taman hias depan gedung
      function buildPlanter(x: number, z: number, par: THREE.Object3D) {
        addMesh(new THREE.BoxGeometry(1.6, 0.45, 0.8), M(0xe2e8f0), x, 0.225, z, par);
        addMesh(new THREE.BoxGeometry(1.44, 0.08, 0.66), M(0x271912), x, 0.44, z, par);
        [-0.44, 0, 0.44].forEach((ox, idx) => {
          const sh = addMesh(
            new THREE.SphereGeometry(idx === 1 ? 0.34 : 0.28, 10, 8),
            M(idx === 1 ? 0x16a34a : 0x22c55e),
            x + ox,
            0.66,
            z,
            par
          );
          sh.scale.set(1.1, 0.88, 1.1);
        });
      }

      // Helper untuk membuat papan nama gedung 3D
      function buildSignboard(title: string, x: number, y: number, z: number, par: THREE.Object3D, bgCol = 0x0f2a24, borderCol = 0xffc83d) {
        addMesh(new THREE.BoxGeometry(4.2, 0.9, 0.12), M(bgCol), x, y, z, par);
        addMesh(new THREE.BoxGeometry(4.34, 1.02, 0.06), M(borderCol), x, y, z - 0.02, par);
        lbl(title, x, y, z + 0.1, par);
      }

      BUILDINGS.forEach((b) => {
        const g = new THREE.Group();
        g.position.set(b.x, 0, b.z);
        if (b.r != null) g.rotation.y = b.r;
        scene.add(g);

        // Jalan Setapak Paving Block Menghubungkan Lapangan ke Tangga Masuk Gedung
        addMesh(new THREE.BoxGeometry(4.2, 0.03, 7.5), M(0xd1d5db), 0, 0.015, 6.8, g);
        addMesh(new THREE.BoxGeometry(4.6, 0.02, 7.5), M(0x9ca3af), 0, 0.008, 6.8, g);

        if (b.id === "profil") {
          // ========================================================
          // 🏫 GEDUNG UTAMA (Neo-Classical 2-Lantai dengan Menara Jam)
          // ========================================================
          const GW = 11.8, H = 7.4, D = 8.0;

          // Pondasi Plinth Granit Gelap
          addMesh(new THREE.BoxGeometry(GW + 0.6, 0.5, D + 0.6), M(0x334155), 0, 0.25, 0, g);
          // Fasad Utama Dinding Lantai 1 & 2 (Batu Gading Halus)
          addMesh(new THREE.BoxGeometry(GW, H, D), M(0xf8fafc), 0, H / 2, 0, g);
          // Quoin Aksen Sudut Bata Terakota
          [-GW / 2 + 0.2, GW / 2 - 0.2].forEach((qx) => {
            addMesh(new THREE.BoxGeometry(0.5, H, 0.5), M(0xb5483b), qx, H / 2, D / 2 - 0.2, g);
            addMesh(new THREE.BoxGeometry(0.5, H, 0.5), M(0xb5483b), qx, H / 2, -D / 2 + 0.2, g);
          });
          // Lis Sabuk Molding Pembatas Lantai 1 & Lantai 2
          addMesh(new THREE.BoxGeometry(GW + 0.4, 0.4, D + 0.4), M(0xb5483b), 0, 3.7, 0, g);
          // Parapet & Cornice Mahkota Atap
          addMesh(new THREE.BoxGeometry(GW + 0.6, 0.45, D + 0.6), M(0x1e293b), 0, H + 0.22, 0, g);
          addMesh(new THREE.BoxGeometry(GW + 0.3, 0.15, D + 0.3), M(0xffc83d), 0, H + 0.48, 0, g);

          // Portico / Kanopi Masuk Megah Berpilar (Lantai 1)
          addMesh(new THREE.BoxGeometry(5.2, 0.35, 2.4), M(0xe2e8f0), 0, 0.18, 4.4, g);
          // Tangga Masuk 3 Tingkat
          [0.1, 0.2, 0.3].forEach((sy, i) => {
            addMesh(new THREE.BoxGeometry(4.6 - i * 0.4, 0.12, 0.45), M(0xcbd5e1), 0, sy - 0.04, 5.5 - i * 0.4, g);
          });
          // 4 Pilar Kolom Silindris Megah
          [-1.9, -0.65, 0.65, 1.9].forEach((px) => {
            addMesh(new THREE.CylinderGeometry(0.22, 0.22, 3.4, 16), M(0xffffff), px, 1.9, 5.2, g);
            addMesh(new THREE.BoxGeometry(0.52, 0.2, 0.52), M(0xb5483b), px, 0.45, 5.2, g);
            addMesh(new THREE.BoxGeometry(0.56, 0.2, 0.56), M(0xb5483b), px, 3.5, 5.2, g);
          });
          // Atap Portico / Balkon Lantai 2
          addMesh(new THREE.BoxGeometry(5.2, 0.35, 2.6), M(0xb5483b), 0, 3.75, 4.4, g);
          // Pagar Balkon Besi Tempa
          addMesh(new THREE.BoxGeometry(5.0, 0.75, 0.06), M(0x111827), 0, 4.3, 5.5, g);
          addMesh(new THREE.BoxGeometry(0.06, 0.75, 2.3), M(0x111827), -2.5, 4.3, 4.35, g);
          addMesh(new THREE.BoxGeometry(0.06, 0.75, 2.3), M(0x111827), 2.5, 4.3, 4.35, g);

          // Papan Nama Gedung Utama
          buildSignboard("🏫 GEDUNG UTAMA", 0, 4.8, 4.08, g, 0x111827, 0xffc83d);

          // Jendela-Jendela 3D Fasad Depan (Lantai 1 & Lantai 2)
          [-4.3, -2.8, 2.8, 4.3].forEach((wx) => {
            buildWin(1.3, 1.8, wx, 2.0, D / 2 + 0.02, g, 0xffffff, 0xb5483b);
          });
          [-4.3, -2.8, -1.3, 1.3, 2.8, 4.3].forEach((wx) => {
            buildWin(1.3, 1.7, wx, 5.6, D / 2 + 0.02, g, 0xffffff, 0xb5483b);
          });
          // Jendela Samping (Kiri & Kanan)
          [-2.2, 0, 2.2].forEach((wz) => {
            buildWin(1.3, 1.6, -GW / 2 - 0.02, 2.0, wz, g, 0xffffff, 0xb5483b);
            buildWin(1.3, 1.6, GW / 2 + 0.02, 2.0, wz, g, 0xffffff, 0xb5483b);
            buildWin(1.3, 1.6, -GW / 2 - 0.02, 5.6, wz, g, 0xffffff, 0xb5483b);
            buildWin(1.3, 1.6, GW / 2 + 0.02, 5.6, wz, g, 0xffffff, 0xb5483b);
          });

          // Menara Jam Klasik (Clock Tower) di Tengah Atap
          const tow = new THREE.Group();
          tow.position.set(0, H + 0.4, 0);
          g.add(tow);
          addMesh(new THREE.BoxGeometry(3.4, 3.2, 3.4), M(0xf8fafc), 0, 1.6, 0, tow);
          addMesh(new THREE.BoxGeometry(3.6, 0.35, 3.6), M(0xb5483b), 0, 3.3, 0, tow);
          // Jam Dinding Raksasa 4 Sisi (Dial Putih, Lis Emas, Jarum Jam)
          [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach((ang) => {
            const ck = new THREE.Group();
            ck.rotation.y = ang;
            tow.add(ck);
            addMesh(new THREE.CylinderGeometry(0.85, 0.85, 0.06, 24), M(0xffc83d), 0, 1.8, 1.72, ck).rotation.x = Math.PI / 2;
            addMesh(new THREE.CylinderGeometry(0.76, 0.76, 0.08, 24), M(0xffffff), 0, 1.8, 1.73, ck).rotation.x = Math.PI / 2;
            addMesh(new THREE.BoxGeometry(0.06, 0.42, 0.04), M(0x111111), 0, 1.95, 1.78, ck);
            addMesh(new THREE.BoxGeometry(0.3, 0.06, 0.04), M(0x111111), 0.12, 1.8, 1.78, ck);
          });
          // Ruang Lonceng Terbuka & Atap Piramida Genteng
          addMesh(new THREE.BoxGeometry(2.6, 1.4, 2.6), M(0x334155), 0, 4.0, 0, tow);
          addMesh(new THREE.CylinderGeometry(0.3, 0.45, 0.6, 14), M(0xffd700), 0, 4.0, 0, tow); // Lonceng Emas
          const pir = addMesh(new THREE.ConeGeometry(2.4, 2.2, 4), M(0xb5483b), 0, 5.8, 0, tow);
          pir.rotation.y = Math.PI / 4;
          // Tiang Penangkal Petir & Finial Emas
          addMesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8), M(0xffd700), 0, 7.4, 0, tow);
          addMesh(new THREE.SphereGeometry(0.18), M(0xffd700), 0, 7.8, 0, tow);

          // Pot Tanaman Hias Bunga di Kiri & Kanan Pintu
          buildPlanter(-3.2, 5.1, g);
          buildPlanter(3.2, 5.1, g);
        } else if (b.id === "akademik") {
          // ========================================================
          // 📚 GEDUNG AKADEMIK (Modern 2-Lantai dengan Sun-Shading Fins)
          // ========================================================
          const GW = 12.2, H = 7.4, D = 8.0;

          // Pondasi Beton Charcoal
          addMesh(new THREE.BoxGeometry(GW + 0.5, 0.45, D + 0.5), M(0x1e293b), 0, 0.225, 0, g);
          // Badan Gedung Putih Bersih
          addMesh(new THREE.BoxGeometry(GW, H, D), M(0xffffff), 0, H / 2, 0, g);
          // Kolom Struktur Biru Edukasi (Royal Blue)
          [-GW / 2 + 0.25, -2.4, 2.4, GW / 2 - 0.25].forEach((cx) => {
            addMesh(new THREE.BoxGeometry(0.6, H + 0.2, 0.6), M(0x1e40af), cx, H / 2, D / 2 + 0.1, g);
          });
          // Lis Sabuk Horizontal Modern
          addMesh(new THREE.BoxGeometry(GW + 0.3, 0.35, D + 0.3), M(0x1e40af), 0, 3.7, 0, g);
          // Parapet Atap Modern
          addMesh(new THREE.BoxGeometry(GW + 0.5, 0.5, D + 0.5), M(0x1e293b), 0, H + 0.25, 0, g);
          addMesh(new THREE.BoxGeometry(GW + 0.2, 0.15, D + 0.2), M(0x38bdf8), 0, H + 0.55, 0, g);

          // Deretan Jendela Kelas Modern (Ribbon Windows)
          [-4.4, 4.4].forEach((wx) => {
            buildWin(2.8, 1.7, wx, 2.0, D / 2 + 0.02, g, 0x1e293b, 0x1e40af);
            buildWin(2.8, 1.7, wx, 5.6, D / 2 + 0.02, g, 0x1e293b, 0x1e40af);
          });
          buildWin(2.8, 1.7, 0, 5.6, D / 2 + 0.02, g, 0x1e293b, 0x1e40af);
          // Jendela Samping Kelas
          [-2.2, 0, 2.2].forEach((wz) => {
            buildWin(1.4, 1.7, -GW / 2 - 0.02, 2.0, wz, g, 0x1e293b, 0x1e40af);
            buildWin(1.4, 1.7, GW / 2 + 0.02, 2.0, wz, g, 0x1e293b, 0x1e40af);
            buildWin(1.4, 1.7, -GW / 2 - 0.02, 5.6, wz, g, 0x1e293b, 0x1e40af);
            buildWin(1.4, 1.7, GW / 2 + 0.02, 5.6, wz, g, 0x1e293b, 0x1e40af);
          });

          // Kanopi Pintu Masuk Baja & Kaca Modern
          addMesh(new THREE.BoxGeometry(4.4, 0.25, 2.2), M(0x1e293b), 0, 3.65, 4.2, g);
          addMesh(new THREE.BoxGeometry(4.0, 0.06, 1.9), winGlassM, 0, 3.75, 4.2, g);
          // 2 Tiang Penyangga Stainless Steel
          [-1.9, 1.9].forEach((px) => {
            addMesh(new THREE.CylinderGeometry(0.08, 0.08, 3.6, 12), M(0xe2e8f0), px, 1.8, 5.1, g);
          });
          // Tangga Masuk 3 Tingkat
          [0.1, 0.2, 0.3].forEach((sy, i) => {
            addMesh(new THREE.BoxGeometry(4.2 - i * 0.4, 0.12, 0.45), M(0x94a3b8), 0, sy - 0.04, 5.4 - i * 0.4, g);
          });

          // Papan Nama Gedung Akademik
          buildSignboard("📚 GEDUNG AKADEMIK", 0, 4.5, 4.08, g, 0x1e40af, 0xffc83d);

          // Rooftop Architecture: Panel Surya & Unit Chiller AC
          for (let k = -1; k <= 1; k++) {
            const sp = addMesh(new THREE.BoxGeometry(2.4, 0.1, 1.6), M(0x0f172a), k * 3.2, H + 0.65, -1.0, g);
            sp.rotation.x = -0.25;
          }
          addMesh(new THREE.BoxGeometry(2.2, 1.2, 1.8), M(0x64748b), -3.6, H + 0.85, 1.5, g); // Chiller AC

          // Pot Tanaman Depan
          buildPlanter(-3.6, 5.0, g);
          buildPlanter(3.6, 5.0, g);
        } else if (b.id === "ekskul") {
          // ========================================================
          // 🎭 AULA & EKSKUL (Gedung Serbaguna dengan Atap Busur Lengkung)
          // ========================================================
          const GW = 11.6, H = 6.2, D = 9.0;

          // Pondasi Batu Alam
          addMesh(new THREE.BoxGeometry(GW + 0.5, 0.45, D + 0.5), M(0x451a03), 0, 0.225, 0, g);
          // Dinding Fasad Travertine / Sandstone Hangat
          addMesh(new THREE.BoxGeometry(GW, H, D), M(0xfef3c7), 0, H / 2, 0, g);
          // Panel Kisi-Kisi Kayu Arsitektural Vertikal (Timber Louvers)
          for (let ix = -4.8; ix <= 4.8; ix += 0.8) {
            if (Math.abs(ix) < 1.8) continue; // Kosongkan area tengah pintu
            addMesh(new THREE.BoxGeometry(0.12, H - 0.8, 0.18), M(0x92400e), ix, H / 2, D / 2 + 0.06, g);
          }

          // Atap Busur Megah (Curved Arched Barrel Roof) Tembaga Terakota
          const archRoof = addMesh(
            new THREE.CylinderGeometry(5.2, 5.2, GW + 0.6, 32, 1, false, Math.PI / 2, Math.PI),
            M(0xc2410c),
            0,
            H,
            0,
            g
          );
          archRoof.rotation.x = Math.PI / 2;
          archRoof.rotation.z = Math.PI / 2;
          archRoof.scale.set(1.0, 0.48, 1.0);

          // Jendela Kaca Busur Raksasa (Grand Transom Window) di Atas Pintu
          addMesh(new THREE.CylinderGeometry(2.2, 2.2, 0.1, 24, 1, false, 0, Math.PI), winGlassM, 0, 4.6, D / 2 + 0.08, g).rotation.x = Math.PI / 2;
          addMesh(new THREE.TorusGeometry(2.2, 0.08, 8, 24, Math.PI), M(0x92400e), 0, 4.6, D / 2 + 0.09, g);

          // Jendela Vertikal Tinggi Aula Samping
          [-2.6, 0, 2.6].forEach((wz) => {
            buildWin(1.4, 3.4, -GW / 2 - 0.02, 3.4, wz, g, 0x451a03, 0xc2410c);
            buildWin(1.4, 3.4, GW / 2 + 0.02, 3.4, wz, g, 0x451a03, 0xc2410c);
          });

          // Teras Bundar & Kanopi Portico Lengkung
          addMesh(new THREE.CylinderGeometry(2.8, 3.0, 0.35, 24), M(0xfde68a), 0, 0.175, 4.8, g);
          addMesh(new THREE.CylinderGeometry(2.4, 2.4, 0.25, 24, 1, false, 0, Math.PI), M(0xc2410c), 0, 3.5, 4.8, g);
          // 2 Pilar Bulat Aula
          [-1.7, 1.7].forEach((px) => {
            addMesh(new THREE.CylinderGeometry(0.18, 0.18, 3.3, 16), M(0xffffff), px, 1.75, 4.8, g);
            addMesh(new THREE.CylinderGeometry(0.24, 0.24, 0.2, 16), M(0xb45309), px, 0.35, 4.8, g);
          });

          // Papan Nama Aula & Ekskul
          buildSignboard("🎭 AULA & EKSKUL", 0, 3.9, 4.58, g, 0x78350f, 0xffc83d);

          // Papan Etalase Display Kegiatan / Poster di Dinding Depan
          [-3.6, 3.6].forEach((bx) => {
            addMesh(new THREE.BoxGeometry(1.8, 2.2, 0.08), M(0x451a03), bx, 2.4, D / 2 + 0.08, g);
            addMesh(new THREE.BoxGeometry(1.6, 2.0, 0.04), M(bx > 0 ? 0xf59e0b : 0x0ea5e9), bx, 2.4, D / 2 + 0.12, g);
          });

          // Pot Tanaman
          buildPlanter(-3.8, 5.4, g);
          buildPlanter(3.8, 5.4, g);
        } else if (b.id === "ppdb") {
          // ========================================================
          // 📝 KANTOR PPDB (Paviliun Layanan Ramah dengan Atap Limas)
          // ========================================================
          const GW = 10.4, H = 5.8, D = 7.8;

          // Pondasi Teras Hijau Zamrud
          addMesh(new THREE.BoxGeometry(GW + 0.5, 0.4, D + 0.5), M(0x064e3b), 0, 0.2, 0, g);
          // Dinding Kantor Putih & Panel Kayu Modern
          addMesh(new THREE.BoxGeometry(GW, H, D), M(0xf8fafc), 0, H / 2, 0, g);
          // Fasad Aksen Hijau Emerald
          addMesh(new THREE.BoxGeometry(GW + 0.2, 0.35, D + 0.2), M(0x059669), 0, 3.0, 0, g);
          addMesh(new THREE.BoxGeometry(GW + 0.4, 0.4, D + 0.4), M(0x064e3b), 0, H + 0.2, 0, g);

          // Atap Limas Tumpang Sari Tradisional-Modern (Clay Terracotta Hipped Roof)
          const hipRoof = addMesh(new THREE.ConeGeometry(7.2, 2.4, 4), M(0x9a3412), 0, H + 1.4, 0, g);
          hipRoof.rotation.y = Math.PI / 4;
          hipRoof.scale.set(1.2, 1, 0.95);
          // Bubungan & Nok Atap
          addMesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), M(0xffc83d), 0, H + 2.7, 0, g);

          // Jendela-Jendela Kantor Berjejer Rapi
          [-3.8, -2.2, 2.2, 3.8].forEach((wx) => {
            buildWin(1.3, 1.6, wx, 1.8, D / 2 + 0.02, g, 0xffffff, 0x059669);
          });
          [-1.8, 1.8].forEach((wz) => {
            buildWin(1.3, 1.6, -GW / 2 - 0.02, 1.8, wz, g, 0xffffff, 0x059669);
            buildWin(1.3, 1.6, GW / 2 + 0.02, 1.8, wz, g, 0xffffff, 0x059669);
          });

          // Teras Veranda Sambutan & Pergola Kayu
          addMesh(new THREE.BoxGeometry(5.2, 0.3, 2.4), M(0xecfdf5), 0, 0.15, 4.4, g);
          [0.1, 0.2].forEach((sy, i) => {
            addMesh(new THREE.BoxGeometry(4.4 - i * 0.4, 0.1, 0.45), M(0xa7f3d0), 0, sy - 0.05, 5.4 - i * 0.4, g);
          });
          // Pergola Kayu & Kanopi Peneduh
          addMesh(new THREE.BoxGeometry(5.0, 0.2, 2.2), M(0x78350f), 0, 3.4, 4.3, g);
          for (let rx = -2.2; rx <= 2.2; rx += 0.8) {
            addMesh(new THREE.BoxGeometry(0.1, 0.22, 2.4), M(0x92400e), rx, 3.52, 4.3, g);
          }
          // 2 Tiang Kayu Pergola
          [-2.2, 2.2].forEach((px) => {
            addMesh(new THREE.BoxGeometry(0.25, 3.2, 0.25), M(0x78350f), px, 1.7, 5.2, g);
          });

          // Papan Nama Kantor PPDB
          buildSignboard("📝 KANTOR PPDB", 0, 4.2, 4.08, g, 0x064e3b, 0xffc83d);

          // Spanduk / Banner Info PPDB di Depan
          addMesh(new THREE.BoxGeometry(4.2, 0.7, 0.04), M(0xf59e0b), 0, 2.7, 4.06, g);

          // Pot Tanaman Hias di Veranda
          buildPlanter(-3.2, 5.1, g);
          buildPlanter(3.2, 5.1, g);
        }

        // ========================================================
        // KUSEN & PINTU MASUK DOUBLE DOOR BERKUALITAS TINGGI
        // ========================================================
        const bFrontZ =
          b.id === "ekskul"
            ? 4.52
            : b.id === "profil"
            ? 4.12
            : b.id === "akademik"
            ? 4.02
            : 3.92;
        const bDoorZ = bFrontZ;

        // Kusen Pintu Luar Arsitektural (Kusen tebal abu-abu gelap charcoal)
        addMesh(new THREE.BoxGeometry(2.5, 3.05, 0.3), M(0x1e293b), 0, 1.5, bDoorZ, g);
        // Rongga Lorong Masuk / Vestibule Berpenerangan Hangat
        addMesh(new THREE.BoxGeometry(2.05, 2.8, 0.5), M(0xfffbeb), 0, 1.4, bDoorZ - 0.22, g);
        // Karpet Sambutan Masuk di Lantai
        addMesh(new THREE.BoxGeometry(2.4, 0.04, 1.5), M(b.c || 0x1e40af), 0, 0.02, bDoorZ + 0.75, g);
        addMesh(new THREE.BoxGeometry(2.5, 0.02, 1.6), M(0xffc83d), 0, 0.01, bDoorZ + 0.75, g); // Lis Emas Karpet

        // Papan Penanda Pintu Masuk di Atas Kusen
        addMesh(new THREE.BoxGeometry(2.2, 0.36, 0.1), M(0x0f172a), 0, 3.15, bDoorZ + 0.08, g);
        lbl("🚪 Buka Pintu", 0, 3.5, bDoorZ + 0.16, g);

        // Daun Pintu Kiri (Hinge di x = -0.96)
        const bDoorL = new THREE.Group();
        bDoorL.position.set(-0.96, 0, bDoorZ);
        g.add(bDoorL);
        addMesh(new THREE.BoxGeometry(0.96, 2.65, 0.07), M(0x7c4a27), 0.48, 1.33, 0, bDoorL);
        addMesh(new THREE.BoxGeometry(0.64, 1.55, 0.08), winGlassM, 0.48, 1.5, 0, bDoorL);
        // Handle Gagang Pintu Panjang Vertikal Emas
        addMesh(new THREE.CylinderGeometry(0.025, 0.025, 0.65, 8), M(0xffc83d), 0.85, 1.3, 0.06, bDoorL);
        addMesh(new THREE.CylinderGeometry(0.025, 0.025, 0.65, 8), M(0xffc83d), 0.85, 1.3, -0.06, bDoorL);
        b.doorL = bDoorL;

        // Daun Pintu Kanan (Hinge di x = 0.96)
        const bDoorR = new THREE.Group();
        bDoorR.position.set(0.96, 0, bDoorZ);
        g.add(bDoorR);
        addMesh(new THREE.BoxGeometry(0.96, 2.65, 0.07), M(0x7c4a27), -0.48, 1.33, 0, bDoorR);
        addMesh(new THREE.BoxGeometry(0.64, 1.55, 0.08), winGlassM, -0.48, 1.5, 0, bDoorR);
        // Handle Gagang Pintu Panjang Vertikal Emas
        addMesh(new THREE.CylinderGeometry(0.025, 0.025, 0.65, 8), M(0xffc83d), -0.85, 1.3, 0.06, bDoorR);
        addMesh(new THREE.CylinderGeometry(0.025, 0.025, 0.65, 8), M(0xffc83d), -0.85, 1.3, -0.06, bDoorR);
        b.doorR = bDoorR;

        // Lampu Dinding Lentera Hangat di Kiri & Kanan Pintu
        [-1.45, 1.45].forEach((lx) => {
          addMesh(new THREE.BoxGeometry(0.2, 0.4, 0.2), M(0x1e293b), lx, 2.3, bDoorZ + 0.12, g);
          addMesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff0c2 }), lx, 2.3, bDoorZ + 0.2, g);
        });
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
      // ===== 3D BILLBOARD LABEL HELPER ==========
      // ==========================================
      function lbl(t: string, x: number, y: number, z: number, par: THREE.Object3D) {
        const c = document.createElement("canvas");
        c.width = 256;
        c.height = 64;
        const q = c.getContext("2d");
        if (q) {
          q.fillStyle = "rgba(15, 42, 36, 0.88)";
          if ((q as any).roundRect) (q as any).roundRect(8, 8, 240, 48, 12);
          else q.fillRect(8, 8, 240, 48);
          q.fill();
          q.fillStyle = "#ffffff";
          q.font = '700 24px "Baloo 2", sans-serif';
          q.textAlign = "center";
          q.textBaseline = "middle";
          q.fillText(t, 128, 32);
        }
        const s = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(c),
            depthTest: false,
          })
        );
        s.scale.set(2.4, 0.6, 1);
        s.position.set(x, y, z);
        s.renderOrder = 8;
        par.add(s);
        return s;
      }

      // ==========================================
      // ===== PLAYER 3D CHARACTER (LENGKAP) ======
      // ==========================================
      const pl = new THREE.Group();
      scene.add(pl);
      pl.scale.setScalar(0.9);
      pl.rotation.y = Math.PI; // Face north (towards the entrance gate & school grounds)
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
        mouth: M(0x8a2020),
        mouthCavity: M(0x6b1016),
        belt: M(0x271e1b),
        bottle: M(0x0ea5e9),
        metal: M(0xd1d5db),
        shoes: M(0x181818),
      };
      playerMatRef.current = PM;

      // Leher anatomis menghubungkan badan dan kepala
      const neck = addMesh(new THREE.CylinderGeometry(0.18, 0.20, 0.28, 16), PM.k, 0, 1.58, 0, pl);
      neck.scale.z = 0.85;

      // Torso & Blazer Seragam Sekolah
      const torso = addMesh(new THREE.CylinderGeometry(0.43, 0.38, 0.78, 16), PM.j, 0, 1.09, 0, pl);
      torso.scale.z = 0.8;
      torso.userData.isTorso = 1;
      torsoRef.current = torso;

      // Kemeja Putih bagian dalam
      addMesh(new THREE.BoxGeometry(0.3, 0.5, 0.06), PM.sh, 0, 1.2, 0.33, pl);

      // Kerah Kemeja 3D Lipat (Kiri & Kanan)
      [-1, 1].forEach((s) => {
        const col = addMesh(new THREE.BoxGeometry(0.16, 0.07, 0.12), PM.sh, s * 0.14, 1.48, 0.22, pl);
        col.rotation.set(0.32, s * 0.45, -s * 0.15);
      });

      // Simpul Dasi 3D & Dasi Merah Menjuntai
      addMesh(new THREE.BoxGeometry(0.11, 0.09, 0.08), PM.rd, 0, 1.41, 0.35, pl);
      addMesh(new THREE.BoxGeometry(0.09, 0.42, 0.05), PM.rd, 0, 1.14, 0.37, pl);
      addMesh(new THREE.BoxGeometry(0.4, 0.09, 0.1), PM.sh, 0, 1.5, 0.3, pl);

      // Lencana Emas OSIS / Sekolah di Dada Kiri
      const badgeBase = addMesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 8), PM.gold, -0.22, 1.25, 0.32, pl);
      badgeBase.rotation.x = Math.PI / 2;
      const badgeCenter = addMesh(new THREE.CylinderGeometry(0.03, 0.03, 0.025, 8), M(0x1e3a8a), -0.22, 1.25, 0.325, pl);
      badgeCenter.rotation.x = Math.PI / 2;

      // Sabuk / Ikat Pinggang & Gesper Emas
      const belt = addMesh(new THREE.CylinderGeometry(0.41, 0.41, 0.08, 16), PM.belt, 0, 0.74, 0, pl);
      belt.scale.z = 0.82;
      addMesh(new THREE.BoxGeometry(0.12, 0.075, 0.04), PM.gold, 0, 0.74, 0.36, pl);
      addMesh(new THREE.BoxGeometry(0.06, 0.045, 0.045), M(0x181818), 0, 0.74, 0.362, pl);

      // Tas Ransel Petualang Lengkap (Explorer Backpack)
      const backpackG = new THREE.Group();
      backpackG.userData.isBackpack = 1;
      pl.add(backpackG);
      backpackRef.current = backpackG;

      // Badan utama ransel
      addMesh(new THREE.BoxGeometry(0.60, 0.70, 0.28), PM.rd, 0, 1.15, -0.44, backpackG);
      // Kantung saku depan dengan resleting
      addMesh(new THREE.BoxGeometry(0.48, 0.32, 0.09), M(0xa81c1c), 0, 1.02, -0.59, backpackG);
      // Pegangan atas ransel (Handle)
      const bpHandle = addMesh(new THREE.TorusGeometry(0.09, 0.022, 6, 12, Math.PI), M(0x222222), 0, 1.52, -0.44, backpackG);
      bpHandle.rotation.set(0, 0, Math.PI);
      // Tali ransel empuk membungkus pundak (Shoulder straps)
      [-1, 1].forEach((s) => {
        const strap = addMesh(new THREE.BoxGeometry(0.08, 0.50, 0.30), PM.rd, s * 0.22, 1.30, 0.04, backpackG);
        strap.rotation.x = 0.08;
      });
      // Kantong samping + Botol Minum / Tumbler Petualang
      addMesh(new THREE.CylinderGeometry(0.075, 0.07, 0.18, 12), M(0x991b1b), 0.33, 0.98, -0.44, backpackG);
      addMesh(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 12), PM.bottle, 0.33, 1.08, -0.44, backpackG);
      addMesh(new THREE.CylinderGeometry(0.035, 0.04, 0.06, 10), PM.metal, 0.33, 1.23, -0.44, backpackG);

      // Head
      const head = new THREE.Group();
      head.position.y = 1.95;
      head.userData.isHead = 1;
      pl.add(head);
      headRef.current = head;
      addMesh(new THREE.SphereGeometry(0.5, 24, 18), PM.k, 0, 0, 0, head);

      // Mata bergaya anime manis & ekspresif
      [-1, 1].forEach((s) => {
        // Sclera putih mata
        addMesh(new THREE.SphereGeometry(0.13, 12, 10), PM.white, s * 0.18, 0.04, 0.4, head);
        // Iris biru jernih
        addMesh(new THREE.SphereGeometry(0.085, 12, 10), M(0x3b6e8f), s * 0.18, 0.04, 0.48, head);
        // Pupil hitam
        addMesh(new THREE.SphereGeometry(0.045, 10, 8), M(0x101820), s * 0.18, 0.04, 0.53, head);
        // Kilau pantulan cahaya mata (Catchlights)
        addMesh(new THREE.SphereGeometry(0.024, 8, 8), PM.white, s * 0.155, 0.07, 0.542, head);
        addMesh(new THREE.SphereGeometry(0.013, 8, 8), PM.white, s * 0.195, 0.02, 0.545, head);
        // Blush rona pipi merona
        addMesh(new THREE.SphereGeometry(0.07, 10, 8), PM.blush, s * 0.3, -0.1, 0.37, head).scale.z = 0.4;

        // Alis 3D ekspresif di atas mata
        const brow = addMesh(new THREE.BoxGeometry(0.11, 0.026, 0.04), PM.h, s * 0.18, 0.19, 0.46, head);
        brow.rotation.set(0.1, -s * 0.15, -s * 0.12);
      });

      // Hidung 3D mungil (Button nose)
      const nose = addMesh(new THREE.SphereGeometry(0.045, 10, 8), PM.k, 0, -0.04, 0.505, head);
      nose.scale.set(0.9, 0.8, 1.2);

      // Mulut 3D senyum manis & rapi bergaya anime (Garis senyum melengkung lembut)
      const mouthG = new THREE.Group();
      mouthG.position.set(0, -0.155, 0.485);
      mouthG.rotation.x = -0.12;
      head.add(mouthG);

      const smile = addMesh(
        new THREE.TorusGeometry(0.075, 0.012, 8, 24, Math.PI),
        M(0x782418),
        0,
        0,
        0,
        mouthG
      );
      smile.rotation.z = Math.PI;

      // Aksen lesung pipi / ujung senyum manis di kiri & kanan
      [-1, 1].forEach((s) => {
        addMesh(
          new THREE.SphereGeometry(0.012, 8, 8),
          M(0x782418),
          s * 0.074,
          0.005,
          0,
          mouthG
        );
      });

      // Kuping / Telinga 3D Kiri & Kanan (Daun telinga anatomis dengan lipatan dalam)
      [-1, 1].forEach((s) => {
        const earG = new THREE.Group();
        earG.position.set(s * 0.485, 0.02, -0.02);
        earG.rotation.set(0, s * 0.25, -s * 0.12);
        earG.userData.isNonHijab = 1;
        head.add(earG);

        // Daun telinga luar
        const earOuter = addMesh(new THREE.SphereGeometry(0.12, 12, 10), PM.k, 0, 0, 0, earG);
        earOuter.scale.set(0.35, 0.95, 0.65);
        earOuter.userData.isNonHijab = 1;

        // Lipatan dalam telinga (sedikit lebih berbayang)
        const earInner = addMesh(new THREE.SphereGeometry(0.075, 10, 8), M(0xc6825c), s * 0.02, 0.01, 0.01, earG);
        earInner.scale.set(0.28, 0.70, 0.50);
        earInner.userData.isNonHijab = 1;

        // Anting mutiara emas manis untuk siswi Rani
        const earring = addMesh(new THREE.SphereGeometry(0.03, 8, 8), PM.gold, s * 0.03, -0.08, 0, earG);
        earring.userData.isRani = 1;
      });

      // 1. Naufal (Boy Hair)
      const boyG = new THREE.Group();
      boyG.userData.isBoy = 1;
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
      raniG.userData.isRani = 1;
      head.add(raniG);
      addMesh(new THREE.SphereGeometry(0.54, 22, 12, 0, 6.283, 0, 1.35), PM.h, 0, 0.02, 0, raniG);
      addMesh(new THREE.CylinderGeometry(0.48, 0.44, 0.6, 16), PM.h, 0, -0.12, -0.16, raniG);
      addMesh(new THREE.TorusGeometry(0.13, 0.035, 8, 16), PM.ribbon, 0, 0.22, -0.48, raniG);
      const rPony = addMesh(new THREE.CylinderGeometry(0.14, 0.05, 0.8, 12), PM.h, 0, -0.15, -0.64, raniG);
      rPony.rotation.x = -0.42;
      rPony.userData.isPony = 1;
      raniGRef.current = raniG;

      const raniSkirt = addMesh(new THREE.CylinderGeometry(0.38, 0.58, 0.46, 16), PM.skirt, 0, 0.68, 0, pl);
      raniSkirt.userData.isRani = 1;
      raniSkirt.userData.isRaniSkirt = 1;
      raniSkirtRef.current = raniSkirt;

      // 3. Sari (Hijab & Maxi Skirt)
      const sariG = new THREE.Group();
      sariG.userData.isSari = 1;
      head.add(sariG);
      addMesh(new THREE.SphereGeometry(0.56, 24, 20), PM.white, 0, 0.02, 0, sariG);
      const sDrape = addMesh(new THREE.ConeGeometry(0.62, 0.68, 20, 1, true), PM.white, 0, -0.36, 0, sariG);
      sDrape.scale.set(1.05, 1, 0.9);
      addMesh(new THREE.TorusGeometry(0.06, 0.02, 8, 16), PM.gold, 0.24, -0.3, 0.38, sariG);
      sariGRef.current = sariG;

      const sariSkirt = addMesh(new THREE.CylinderGeometry(0.38, 0.64, 0.96, 16), PM.skirt, 0, 0.46, 0, pl);
      sariSkirt.userData.isSari = 1;
      sariSkirt.userData.isSariSkirt = 1;
      sariSkirtRef.current = sariSkirt;

      // Legs (Bisa mengayun natural dengan artikulasi lutut / knee flexion)
      const legs: THREE.Group[] = [];
      const knees: THREE.Group[] = [];
      [-0.14, 0.14].forEach((x) => {
        // Hip joint & Thigh / Upper Leg
        const lg = new THREE.Group();
        lg.position.set(x, 0.73, 0);
        pl.add(lg);

        // Paha atas
        const pThigh = addMesh(new THREE.CylinderGeometry(0.155, 0.14, 0.36, 12), PM.pa, 0, -0.18, 0, lg);
        pThigh.userData.isBoy = 1;
        const rThigh = addMesh(new THREE.CylinderGeometry(0.135, 0.125, 0.36, 12), PM.k, 0, -0.18, 0, lg);
        rThigh.userData.isRani = 1;
        const sThigh = addMesh(new THREE.CylinderGeometry(0.145, 0.135, 0.36, 12), PM.pa, 0, -0.18, 0, lg);
        sThigh.userData.isSari = 1;

        // Knee joint & Shin / Lower Leg group (artikulasi lutut menekuk natural saat melangkah)
        const kneeG = new THREE.Group();
        kneeG.position.set(0, -0.36, 0);
        kneeG.userData.isKnee = 1;
        lg.add(kneeG);
        knees.push(kneeG);

        // Sendi lutut
        addMesh(new THREE.SphereGeometry(0.11, 10, 8), PM.pa, 0, 0, 0, kneeG).userData.isBoy = 1;
        addMesh(new THREE.SphereGeometry(0.10, 10, 8), PM.white, 0, 0, 0, kneeG).userData.isRani = 1;
        addMesh(new THREE.SphereGeometry(0.10, 10, 8), PM.pa, 0, 0, 0, kneeG).userData.isSari = 1;

        // Betis / Tulang kering bawah
        const pCalf = addMesh(new THREE.CylinderGeometry(0.14, 0.125, 0.28, 12), PM.pa, 0, -0.14, 0, kneeG);
        pCalf.userData.isBoy = 1;
        const rCalf = addMesh(new THREE.CylinderGeometry(0.125, 0.115, 0.28, 12), PM.white, 0, -0.14, 0, kneeG);
        rCalf.userData.isRani = 1;
        const sCalf = addMesh(new THREE.CylinderGeometry(0.135, 0.12, 0.28, 12), PM.pa, 0, -0.14, 0, kneeG);
        sCalf.userData.isSari = 1;

        // Sepatu Sneakers Petualang Sporty
        // Badan atas sepatu
        addMesh(new THREE.BoxGeometry(0.28, 0.16, 0.44), PM.shoes, 0, -0.27, 0.08, kneeG);
        // Sol putih tebal khas sneakers
        addMesh(new THREE.BoxGeometry(0.30, 0.07, 0.48), PM.white, 0, -0.355, 0.08, kneeG);
        // Moncong karet melengkung di ujung depan
        const toeCap = addMesh(new THREE.CylinderGeometry(0.125, 0.135, 0.16, 12), PM.white, 0, -0.28, 0.24, kneeG);
        toeCap.rotation.z = Math.PI / 2;
        toeCap.scale.set(0.7, 1, 0.7);
        // Tali sepatu putih
        addMesh(new THREE.BoxGeometry(0.15, 0.025, 0.12), PM.white, 0, -0.19, 0.12, kneeG);

        lg.userData.leg = 1;
        legs.push(lg);
      });
      legsRef.current = legs;
      kneesRef.current = knees;

      // Arms (Bisa mengayun saat berjalan & melambai dengan artikulasi siku)
      const arms: THREE.Group[] = [];
      const forearms: THREE.Group[] = [];
      [-1, 1].forEach((s) => {
        // Shoulder joint
        const g = new THREE.Group();
        g.position.set(s * 0.5, 1.38, 0);
        pl.add(g);

        // Sendi bahu
        addMesh(new THREE.SphereGeometry(0.135, 12, 10), PM.j, 0, 0, 0, g);
        // Lengan atas blazer
        addMesh(new THREE.CylinderGeometry(0.115, 0.105, 0.34, 12), PM.j, 0, -0.17, 0, g);

        // Elbow / Forearm group
        const foreG = new THREE.Group();
        foreG.position.set(0, -0.34, 0);
        foreG.userData.isForearm = 1;
        g.add(foreG);
        forearms.push(foreG);

        // Sendi siku
        addMesh(new THREE.SphereGeometry(0.105, 10, 8), PM.j, 0, 0, 0, foreG);
        // Lengan bawah blazer
        addMesh(new THREE.CylinderGeometry(0.102, 0.092, 0.28, 12), PM.j, 0, -0.14, 0, foreG);

        // Telapak tangan halus
        const palm = addMesh(new THREE.SphereGeometry(0.11, 12, 10), PM.k, 0, -0.35, 0, foreG);
        palm.scale.set(1.0, 1.1, 0.85);
        // Jempol tangan 3D mengarah ke depan & dalam (Anatomi manusia alami)
        const thumb = addMesh(new THREE.CylinderGeometry(0.03, 0.035, 0.09, 8), PM.k, -s * 0.055, -0.33, 0.045, foreG);
        thumb.rotation.set(0.35, 0, s * 0.5);

        g.userData.arm = 1;
        arms.push(g);
      });
      armsRef.current = arms;
      forearmsRef.current = forearms;

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

      // Student NPCs (Siswa Cowok dan Siswi Cewek Beragam yang Berjalan di Halaman Sekolah)
      const npcsConfig = [
        // [name, gender(0=cowok, 1=cewek, 2=cewek hijab), hairColor, jacketColor, skinColor, cx, cz, rx, rz, speed, dir]
        // 1. Budi: Koridor taman timur (dekat PPDB)
        ["👦 Budi", 0, 0x1f1f1f, 0x245585, 0xd9a577, 8, 13, 6, 4, 0.48, 1],
        // 2. Maya: Plaza taman barat dekat pepohonan
        ["👧 Maya", 1, 0x3d2314, 0xaf3444, 0xf2c9a0, -8, 13, 6, 4, 0.45, -1],
        // 3. Dimas: Jalur penghubung depan lapangan olahraga
        ["👦 Dimas", 0, 0x362214, 0x2b7a54, 0xe8b98f, 0, 2, 8, 4, 0.42, 1],
        // 4. Aisyah: Siswi hijab berjalan di taman sisi barat
        ["🧕 Aisyah", 2, 0x1a1a1a, 0xd98a2b, 0xf5cfb0, -11, 2, 5, 4, 0.38, -1],
        // 5. Rizky: Siswa berjalan di plaza terbuka timur
        ["👦 Rizky", 0, 0x101010, 0x227685, 0xd9a577, 11, 2, 5, 4, 0.44, 1],
        // 6. Citra: Siswi berjalan santai di koridor depan gerbang
        ["👧 Citra", 1, 0x4a2a18, 0x7b3ba8, 0xe8b98f, 0, 21, 6, 3, 0.40, -1],
      ];

      const npcs = npcsConfig.map((c, i) => {
        const [nName, nGender, nHair, nJacket, nSkin, cx, cz, rx, rz, nSpd, nDir] = c as any;
        const g = pl.clone(true);
        // Hapus nametag sprite bawaan player jika ada
        g.children.filter((o: any) => o.isSprite).forEach((o) => g.remove(o));

        // Buat material independen per NPC
        const npcH = M(nHair);
        const npcJ = M(nJacket);
        const npcK = M(nSkin);

        const npcKnees: THREE.Group[] = [];
        const npcForearms: THREE.Group[] = [];
        let npcTorso: THREE.Mesh | null = null;
        let npcHead: THREE.Group | null = null;
        let npcSkirt: THREE.Mesh | null = null;
        let npcPony: THREE.Mesh | null = null;

        g.traverse((o: any) => {
          if (o.isMesh && !o.userData.ol) {
            const m = o.material;
            if (m === PM.h) o.material = npcH;
            else if (m === PM.j) o.material = npcJ;
            else if (m === PM.k) o.material = npcK;
          }
          if (o.userData.isKnee) npcKnees.push(o);
          if (o.userData.isForearm) npcForearms.push(o);
          if (o.userData.isTorso) npcTorso = o;
          if (o.userData.isHead) npcHead = o;
          if (o.userData.isPony) npcPony = o;
          if ((nGender === 1 && o.userData.isRaniSkirt) || (nGender === 2 && o.userData.isSariSkirt)) {
            npcSkirt = o;
          }
          // Set gender model NPC: Cowok vs Cewek vs Cewek Hijab!
          if (o.userData.isBoy) o.visible = (nGender === 0);
          if (o.userData.isRani) o.visible = (nGender === 1);
          if (o.userData.isSari) o.visible = (nGender === 2);
          if (o.userData.isNonHijab) o.visible = (nGender !== 2);
        });

        // Pasang 3D nametag billboard di atas kepala NPC
        lbl(nName, 0, 2.9, 0, g);

        scene.add(g);
        return {
          g,
          cx,
          cz,
          rx,
          rz,
          w: (nSpd as number) * (nDir as number),
          a: i * 1.15,
          lg: g.children.filter((o) => o.userData.leg),
          knees: npcKnees,
          ar: g.children.filter((o) => o.userData.arm),
          forearms: npcForearms,
          torso: npcTorso,
          head: npcHead,
          skirt: npcSkirt,
          pony: npcPony,
          walkWeight: 1.0,
          walkPhase: i * 0.8,
        };
      });
      npcsRef.current = npcs;

      // Rain particle system (2400 butiran hujan aktif bergerak vertikal)
      const rainCount = 2400;
      const rv = new Float32Array(rainCount * 3);
      for (let i = 0; i < rainCount * 3; i += 3) {
        rv[i] = (Math.random() - 0.5) * 60;
        rv[i + 1] = Math.random() * 22;
        rv[i + 2] = (Math.random() - 0.5) * 60;
      }
      rainCoordsRef.current = rv;
      const rg = new THREE.BufferGeometry();
      rg.setAttribute("position", new THREE.BufferAttribute(rv, 3));
      const rainP = new THREE.Points(
        rg,
        new THREE.PointsMaterial({
          color: 0x93c5fd,
          size: 0.22,
          transparent: true,
          opacity: 0.75,
        })
      );
      rainP.visible = isRainingRef.current;
      scene.add(rainP);
      rainPointsRef.current = rainP;

      // Langit Malam Berbintang (350 Bintang Berkelip)
      const starCount = 350;
      const sv = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount * 3; i += 3) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * (Math.PI / 2.3);
        const r = 210 + Math.random() * 30;
        sv[i] = r * Math.sin(phi) * Math.cos(theta);
        sv[i + 1] = r * Math.cos(phi) + 12;
        sv[i + 2] = r * Math.sin(phi) * Math.sin(theta);
      }
      const sg = new THREE.BufferGeometry();
      sg.setAttribute("position", new THREE.BufferAttribute(sv, 3));
      const nightStars = new THREE.Points(
        sg,
        new THREE.PointsMaterial({
          color: 0xffffff,
          size: 1.3,
          transparent: true,
          opacity: 0.85,
        })
      );
      nightStars.visible = isNightRef.current && !isRainingRef.current;
      scene.add(nightStars);
      nightSkyGroupRef.current = nightStars;

      // Sistem Visual Cuaca & Siang/Malam Realtime
      const updateWeatherVisuals = () => {
        const isNight = isNightRef.current;
        const isRaining = isRainingRef.current;

        let targetSky: number;
        let targetFogNear: number;
        let targetFogFar: number;
        let sunColor: number;
        let sunInt: number;
        let hemiSky: number;
        let hemiGround: number;
        let hemiInt: number;

        if (isNight) {
          if (isRaining) {
            // Malam Hujan
            targetSky = 0x070c18;
            targetFogNear = 20;
            targetFogFar = 85;
            sunColor = 0x60a5fa;
            sunInt = 0.15;
            hemiSky = 0x0f172a;
            hemiGround = 0x020617;
            hemiInt = 0.25;
          } else {
            // Malam Cerah Bertabur Bintang
            targetSky = 0x0b1329;
            targetFogNear = 35;
            targetFogFar = 140;
            sunColor = 0x93c5fd;
            sunInt = 0.28;
            hemiSky = 0x1e3a8a;
            hemiGround = 0x0f172a;
            hemiInt = 0.42;
          }
        } else {
          if (isRaining) {
            // Siang Hujan Gerimis / Mendung
            targetSky = 0x64748b;
            targetFogNear = 25;
            targetFogFar = 95;
            sunColor = 0xdbeafe;
            sunInt = 0.55;
            hemiSky = 0x94a3b8;
            hemiGround = 0x475569;
            hemiInt = 0.65;
          } else {
            // Siang Cerah Terik
            targetSky = 0x8cd3ff;
            targetFogNear = 45;
            targetFogFar = 165;
            sunColor = 0xfffaec;
            sunInt = 1.25;
            hemiSky = 0xffffff;
            hemiGround = 0x6b8f5a;
            hemiInt = 0.95;
          }
        }

        scene.background = new THREE.Color(targetSky);
        if (scene.fog instanceof THREE.Fog) {
          scene.fog.color.setHex(targetSky);
          scene.fog.near = targetFogNear;
          scene.fog.far = targetFogFar;
        } else {
          scene.fog = new THREE.Fog(targetSky, targetFogNear, targetFogFar);
        }
        renderer.setClearColor(targetSky, 1);

        sun.color.setHex(sunColor);
        sun.intensity = sunInt;
        hemi.color.setHex(hemiSky);
        hemi.groundColor.setHex(hemiGround);
        hemi.intensity = hemiInt;

        // Lampu jalan taman (Street lamps) menyala kuning keemasan saat malam
        lampsRef.current.forEach((bulb) => {
          if (bulb.material instanceof THREE.MeshBasicMaterial) {
            bulb.material.color.setHex(isNight ? 0xffeb3b : 0xd8d8b0);
          }
        });

        if (rainPointsRef.current) {
          rainPointsRef.current.visible = isRaining && !roomRef.current;
        }

        if (nightSkyGroupRef.current) {
          nightSkyGroupRef.current.visible = isNight && !isRaining && !roomRef.current;
        }
      };

      updateWeatherVisualsRef.current = updateWeatherVisuals;
      // Terapkan visual cuaca pertama kali
      updateWeatherVisuals();

      // ========================================================
      // ===== RUANGAN DALAM / INTERIOR SETIAP GEDUNG (LENGKAP) =
      // ========================================================

      // Checkered floor tile texture
      const tc = document.createElement("canvas");
      tc.width = tc.height = 64;
      const tcx = tc.getContext("2d");
      if (tcx) {
        tcx.fillStyle = "#ffffff";
        tcx.fillRect(0, 0, 64, 64);
        tcx.fillStyle = "#e2e8f0";
        tcx.fillRect(0, 0, 32, 32);
        tcx.fillRect(32, 32, 32, 32);
      }
      const tile = new THREE.CanvasTexture(tc);
      tile.wrapS = tile.wrapT = THREE.RepeatWrapping;
      tile.repeat.set(10, 8);

      const IC: Record<string, string[]> = {
        profil: ["🏫", "🎯", "📜"],
        akademik: ["🎓", "📚", "🏆"],
        ekskul: ["⚽", "🏟", "📅"],
        ppdb: ["📝", "✍", "📞"],
      };

      const TAB_NAMES: Record<string, string[]> = {
        profil: ["Tentang Sekolah", "Visi & Misi", "Sejarah Sekolah"],
        akademik: ["① Peminatan MIPA/IPS", "② Lab Kurikulum Merdeka", "③ Hall of Fame Prestasi"],
        ekskul: ["Klub Ekskul & Minat", "Fasilitas SMA", "Agenda Tahunan"],
        ppdb: ["Jadwal & Kuota", "Formulir Pendaftaran", "Kontak & Alur PPDB"],
      };

      const roomsMap: Record<string, THREE.Group> = {};
      const roomRings: Record<string, any[]> = {};

      Object.keys(RM).forEach((id) => {
        const d = RM[id];
        const g = new THREE.Group();
        g.position.x = RX;
        g.visible = false;
        scene.add(g);

        // Pencahayaan Ruangan Interior (Terang, Hangat & Nyaman)
        const rLight1 = new THREE.PointLight(0xfffaed, 2.0, 32);
        rLight1.position.set(0, 4.2, -2.5);
        g.add(rLight1);
        const rLight2 = new THREE.PointLight(0xfffaed, 1.8, 32);
        rLight2.position.set(0, 4.2, 2.5);
        g.add(rLight2);
        const rAmb = new THREE.AmbientLight(0xffffff, 0.5);
        g.add(rAmb);

        // Lantai Berkeramik Halus (22 x 16 meter)
        addMesh(new THREE.BoxGeometry(22, 0.35, 16), new THREE.MeshLambertMaterial({ color: d.f, map: tile }), 0, -0.15, 0, g);

        // Plafon Atap Ruangan
        // Menggunakan PlaneGeometry dengan side: THREE.BackSide:
        // - Dari dalam ruangan tampak sebagai plafon putih bersih elegan
        // - Dari atas/luar ruangan 100% tembus pandang (transparan) sehingga kamera bebas hambatan dan tidak pernah tertutup bidang abu-abu
        const ceilMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc, side: THREE.BackSide });
        const ceilPlane = new THREE.Mesh(new THREE.PlaneGeometry(22, 16), ceilMat);
        ceilPlane.position.set(0, 4.85, 0);
        ceilPlane.rotation.x = Math.PI / 2;
        g.add(ceilPlane);

        // Lis Plafon Tepi Dinding
        addMesh(new THREE.BoxGeometry(22, 0.35, 0.25), M(0x334155), 0, 4.65, -7.95, g);
        addMesh(new THREE.BoxGeometry(22, 0.35, 0.25), M(0x334155), 0, 4.65, 7.95, g);
        addMesh(new THREE.BoxGeometry(0.25, 0.35, 16), M(0x334155), -10.95, 4.65, 0, g);
        addMesh(new THREE.BoxGeometry(0.25, 0.35, 16), M(0x334155), 10.95, 4.65, 0, g);

        // 6 Lampu Plafon LED Kotak Downlight (side: THREE.BackSide agar tidak pernah menutupi kamera dari atas)
        [[-6, -4], [0, -4], [6, -4], [-6, 2], [0, 2], [6, 2]].forEach((lp) => {
          const lMat = new THREE.MeshBasicMaterial({ color: 0xfffae5, side: THREE.BackSide });
          const lPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), lMat);
          lPlane.position.set(lp[0], 4.84, lp[1]);
          lPlane.rotation.x = Math.PI / 2;
          g.add(lPlane);
        });

        // Lis Plin Lantai Kayu (Baseboard)
        addMesh(new THREE.BoxGeometry(22, 0.25, 0.15), M(0x1e293b), 0, 0.125, -7.98, g);
        addMesh(new THREE.BoxGeometry(0.15, 0.25, 16), M(0x1e293b), -10.98, 0.125, 0, g);
        addMesh(new THREE.BoxGeometry(0.15, 0.25, 16), M(0x1e293b), 10.98, 0.125, 0, g);

        // Dinding Ruangan
        addMesh(new THREE.BoxGeometry(22, 4.8, 0.35), M(d.w), 0, 2.4, -8.15, g);
        addMesh(new THREE.BoxGeometry(0.35, 4.8, 16), M(d.w), -11.15, 2.4, 0, g);
        addMesh(new THREE.BoxGeometry(0.35, 4.8, 16), M(d.w), 11.15, 2.4, 0, g);
        addMesh(new THREE.BoxGeometry(22, 4.8, 0.35), M(d.w), 0, 2.4, 8.15, g);

        // Jendela Kaca Biru Langit & List Lis Dinding
        [-6, 6].forEach((wx) => {
          addMesh(new THREE.BoxGeometry(3.6, 2.2, 0.1), new THREE.MeshBasicMaterial({ color: 0x9bd3ff }), wx, 2.8, -7.95, g);
          addMesh(new THREE.BoxGeometry(3.8, 0.12, 0.14), M(0x1e293b), wx, 3.96, -7.94, g);
          addMesh(new THREE.BoxGeometry(3.8, 0.12, 0.14), M(0x1e293b), wx, 1.64, -7.94, g);
        });
        addMesh(new THREE.BoxGeometry(22, 0.4, 0.36), M(0xb5483b), 0, 1.2, -8.1, g);
        addMesh(new THREE.BoxGeometry(0.36, 0.4, 16), M(0xb5483b), -11.1, 1.2, 0, g);
        addMesh(new THREE.BoxGeometry(0.36, 0.4, 16), M(0xb5483b), 11.1, 1.2, 0, g);

        // Kusen & Pintu Keluar Ruangan Interior (z = 7.35)
        addMesh(new THREE.BoxGeometry(2.6, 3.1, 0.32), M(0x1e293b), 0, 1.5, 7.35, g);
        addMesh(new THREE.BoxGeometry(2.05, 2.75, 0.1), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }), 0, 1.38, 7.48, g);
        addMesh(new THREE.BoxGeometry(2.6, 0.04, 1.5), M(0x059669), 0, 0.02, 6.6, g); // Karpet keluar hijau zamrud
        addMesh(new THREE.BoxGeometry(2.7, 0.02, 1.6), M(0xffc83d), 0, 0.01, 6.6, g); // Lis emas karpet
        addMesh(new THREE.BoxGeometry(2.0, 0.4, 0.15), M(0x10b981), 0, 3.15, 7.28, g);
        lbl("🚪 Buka Pintu Keluar", 0, 3.55, 7.25, g);

        // Daun Pintu Keluar Kiri (Hinge di x = -0.96)
        const rmExL = new THREE.Group();
        rmExL.position.set(-0.96, 0, 7.35);
        g.add(rmExL);
        addMesh(new THREE.BoxGeometry(0.96, 2.65, 0.07), M(0x7c4a27), 0.48, 1.33, 0, rmExL);
        addMesh(new THREE.BoxGeometry(0.64, 1.55, 0.08), winGlassM, 0.48, 1.5, 0, rmExL);
        addMesh(new THREE.CylinderGeometry(0.025, 0.025, 0.65, 8), M(0xe2e8f0), 0.85, 1.3, -0.06, rmExL);
        g.userData.exitDoorL = rmExL;

        // Daun Pintu Keluar Kanan (Hinge di x = 0.96)
        const rmExR = new THREE.Group();
        rmExR.position.set(0.96, 0, 7.35);
        g.add(rmExR);
        addMesh(new THREE.BoxGeometry(0.96, 2.65, 0.07), M(0x7c4a27), -0.48, 1.33, 0, rmExR);
        addMesh(new THREE.BoxGeometry(0.64, 1.55, 0.08), winGlassM, -0.48, 1.5, 0, rmExR);
        addMesh(new THREE.CylinderGeometry(0.025, 0.025, 0.65, 8), M(0xe2e8f0), -0.85, 1.3, -0.06, rmExR);
        g.userData.exitDoorR = rmExR;

        // ==========================================
        // KHUSUS GEDUNG UTAMA (Lobby Eksekutif):
        // ==========================================
        if (id === "profil") {
          // Karpet Beludru Merah Maroon Besar
          addMesh(new THREE.CylinderGeometry(4.4, 4.4, 0.04, 32), M(0x881337), 0, 0.02, 0.5, g);
          addMesh(new THREE.CylinderGeometry(4.6, 4.6, 0.02, 32), M(0xffc83d), 0, 0.01, 0.5, g);

          // Meja Resepsionis Lengkung Kayu Jati
          addMesh(new THREE.BoxGeometry(5.4, 1.15, 1.2), M(0x7c2d12), 0, 0.58, 2.8, g);
          addMesh(new THREE.BoxGeometry(5.6, 0.1, 1.35), M(0xf8fafc), 0, 1.2, 2.8, g);
          addMesh(new THREE.BoxGeometry(1.6, 0.04, 0.4), M(0xffc83d), 0, 0.85, 3.42, g); // Lis Emas

          // Komputer Resepsionis & Buku Tamu
          addMesh(new THREE.BoxGeometry(0.8, 0.5, 0.04), M(0x1e293b), 0, 1.55, 2.6, g);
          addMesh(new THREE.BoxGeometry(0.74, 0.44, 0.02), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }), 0, 1.55, 2.58, g);
          addMesh(new THREE.BoxGeometry(0.45, 0.03, 0.32), M(0xf59e0b), 1.4, 1.26, 2.6, g);

          // Set Sofa Tamu VIP Kulit Hitam di Sisi Barat
          addMesh(new THREE.BoxGeometry(2.8, 0.85, 1.1), M(0x1e293b), -6.8, 0.43, -0.5, g);
          addMesh(new THREE.BoxGeometry(1.1, 0.85, 1.1), M(0x1e293b), -6.8, 0.43, 1.2, g);
          addMesh(new THREE.BoxGeometry(1.4, 0.45, 0.8), M(0x78350f), -4.8, 0.23, 0.2, g); // Meja Kopi
          addMesh(new THREE.BoxGeometry(1.5, 0.04, 0.9), new THREE.MeshBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.7 }), -4.8, 0.47, 0.2, g); // Kaca Meja

          // 3 Pigura Dinding Visi, Misi & Sejarah (Dinding Utara)
          [-4.5, 0, 4.5].forEach((px, idx) => {
            addMesh(new THREE.BoxGeometry(3.2, 2.2, 0.08), M(0x78350f), px, 2.8, -7.95, g);
            addMesh(new THREE.BoxGeometry(3.0, 2.0, 0.04), M(0xffffff), px, 2.8, -7.9, g);
            addMesh(new THREE.BoxGeometry(3.3, 2.3, 0.04), M(0xffc83d), px, 2.8, -7.97, g);
          });
          lbl("🎯 VISI & MISI SEKOLAH", -4.5, 2.8, -7.86, g);
          lbl("🏫 SMA CAHAYA NUSANTARA", 0, 2.8, -7.86, g);
          lbl("📜 SEJARAH & PRESTASI", 4.5, 2.8, -7.86, g);

          // Lemari Arsip Kayu Jati Penuh Buku
          for (let k = 0; k < 4; k++) {
            addMesh(new THREE.BoxGeometry(1.1, 2.8, 1.4), M(0x7c2d12), 10.3, 1.4, -2.4 + k * 1.6, g);
          }

          // Jam Bandul Berdiri Klasik (Grandfather Clock)
          const gClk = new THREE.Group();
          gClk.position.set(9.8, 0, 6.0);
          g.add(gClk);
          addMesh(new THREE.BoxGeometry(0.8, 2.8, 0.6), M(0x451a03), 0, 1.4, 0, gClk);
          addMesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 16), M(0xffffff), 0, 2.3, 0.32, gClk).rotation.x = Math.PI / 2;
          addMesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 12), M(0xffd700), 0, 1.3, 0.25, gClk);
        } else if (id === "akademik") {
          // ==========================================
          // KHUSUS GEDUNG AKADEMIK:
          // ==========================================
          // Jalur Karpet Wayfinding Terpandu (Biru & Emas)
          addMesh(new THREE.BoxGeometry(3.2, 0.03, 7.2), M(0x1e3a8a), 0, 0.02, 3.4, g);
          addMesh(new THREE.BoxGeometry(3.5, 0.02, 7.2), M(0xf59e0b), 0, 0.01, 3.4, g);
          addMesh(new THREE.BoxGeometry(7.2, 0.03, 2.4), M(0x1e3a8a), -3.6, 0.02, -1.5, g);
          addMesh(new THREE.BoxGeometry(7.2, 0.02, 2.6), M(0xf59e0b), -3.6, 0.01, -1.5, g);
          addMesh(new THREE.BoxGeometry(2.4, 0.03, 4.4), M(0x1e3a8a), 0, 0.02, -2.3, g);
          addMesh(new THREE.BoxGeometry(2.6, 0.02, 4.4), M(0xf59e0b), 0, 0.01, -2.3, g);
          addMesh(new THREE.BoxGeometry(7.2, 0.03, 2.4), M(0x1e3a8a), 3.6, 0.02, -1.5, g);
          addMesh(new THREE.BoxGeometry(7.2, 0.02, 2.6), M(0xf59e0b), 3.6, 0.01, -1.5, g);

          [[-6.8, -1.5, 0x2563eb], [0, -4.2, 0xf59e0b], [6.8, -1.5, 0x10b981]].forEach((pt) => {
            addMesh(new THREE.CylinderGeometry(1.3, 1.3, 0.04, 24), M(pt[2]), pt[0], 0.03, pt[1], g);
          });

          // Smartboard Digital Raksasa di dinding utara
          const sbCan = document.createElement("canvas");
          sbCan.width = 1024;
          sbCan.height = 384;
          const sbX = sbCan.getContext("2d");
          if (sbX) {
            sbX.fillStyle = "#0f172a";
            sbX.fillRect(0, 0, 1024, 384);
            sbX.fillStyle = "#1e293b";
            sbX.fillRect(16, 16, 992, 352);
            sbX.fillStyle = "#38bdf8";
            sbX.font = 'bold 36px "Baloo 2", sans-serif';
            sbX.textAlign = "center";
            sbX.fillText("KURIKULUM MERDEKA · PUSAT RISET & INOVASI SISWA", 512, 65);
            sbX.fillStyle = "#f8fafc";
            sbX.font = "20px sans-serif";
            sbX.fillText("SMA CAHAYA NUSANTARA — BERBASIS RISET & PROFIL PELAJAR PANCASILA", 512, 105);
            sbX.fillStyle = "#1e3a8a";
            sbX.fillRect(50, 140, 280, 190);
            sbX.fillStyle = "#93c5fd";
            sbX.font = "bold 20px sans-serif";
            sbX.fillText("1. FASE E (KELAS X)", 190, 180);
            sbX.fillStyle = "#cbd5e1";
            sbX.font = "16px sans-serif";
            sbX.fillText("Pondasi Mapel Umum,", 190, 220);
            sbX.fillText("Literasi & Diagnostik", 190, 255);

            sbX.fillStyle = "#78350f";
            sbX.fillRect(372, 140, 280, 190);
            sbX.fillStyle = "#fcd34d";
            sbX.font = "bold 20px sans-serif";
            sbX.fillText("2. FASE F (KELAS XI-XII)", 512, 180);
            sbX.fillStyle = "#cbd5e1";
            sbX.font = "16px sans-serif";
            sbX.fillText("Paket Mapel Pilihan", 512, 220);
            sbX.fillText("& Sukses SNBP/SNBT", 512, 255);

            sbX.fillStyle = "#065f46";
            sbX.fillRect(694, 140, 280, 190);
            sbX.fillStyle = "#6ee7b7";
            sbX.font = "bold 20px sans-serif";
            sbX.fillText("3. PROJEK RISET P5", 834, 180);
            sbX.fillStyle = "#cbd5e1";
            sbX.font = "16px sans-serif";
            sbX.fillText("IoT Smart Waste Bin,", 834, 220);
            sbX.fillText("Batik & Bazar Startup", 834, 255);
          }
          const sbTex = new THREE.CanvasTexture(sbCan);
          addMesh(new THREE.BoxGeometry(8.2, 2.6, 0.1), M(0x334155), 0, 2.8, -7.98, g);
          addMesh(new THREE.PlaneGeometry(8, 2.4), new THREE.MeshBasicMaterial({ map: sbTex }), 0, 2.8, -7.92, g);

          // 3 Unit PC Modern di Meja Lab Komputer
          [-2.2, 0, 2.2].forEach((cx) => {
            addMesh(new THREE.CylinderGeometry(0.12, 0.14, 0.04, 12), M(0x64748b), cx, 0.92, -5.7, g);
            addMesh(new THREE.BoxGeometry(0.05, 0.35, 0.05), M(0x64748b), cx, 1.1, -5.7, g);
            addMesh(new THREE.BoxGeometry(0.95, 0.6, 0.04), M(0x0f172a), cx, 1.4, -5.7, g);
            addMesh(new THREE.BoxGeometry(0.88, 0.52, 0.02), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }), cx, 1.4, -5.67, g);
            addMesh(new THREE.BoxGeometry(0.52, 0.02, 0.2), M(0x1e293b), cx, 0.91, -5.3, g);
            addMesh(new THREE.BoxGeometry(0.08, 0.02, 0.12), M(0x38bdf8), cx + 0.35, 0.91, -5.3, g);
            addMesh(new THREE.BoxGeometry(0.25, 0.5, 0.45), M(0x0f172a), cx + 0.6, 0.26, -5.7, g);
            const ch = new THREE.Group();
            ch.position.set(cx, 0, -4.6);
            g.add(ch);
            addMesh(new THREE.CylinderGeometry(0.25, 0.25, 0.08, 12), M(0x1e293b), 0, 0.5, 0, ch);
            addMesh(new THREE.BoxGeometry(0.45, 0.45, 0.06), M(0x1e293b), 0, 0.8, 0.2, ch);
            addMesh(new THREE.CylinderGeometry(0.04, 0.04, 0.48, 8), M(0x94a3b8), 0, 0.24, 0, ch);
          });

          // Zona 1 Props (Mikroskop, Tabung Reaksi, Model Molekul, Globe)
          const mic = new THREE.Group();
          mic.position.set(-8.5, 0.9, -4.5);
          g.add(mic);
          addMesh(new THREE.CylinderGeometry(0.16, 0.18, 0.08, 16), M(0x0f172a), 0, 0.04, 0, mic);
          addMesh(new THREE.BoxGeometry(0.06, 0.45, 0.08), M(0x334155), -0.04, 0.28, -0.06, mic);
          const mBody = addMesh(new THREE.CylinderGeometry(0.04, 0.04, 0.34, 10), M(0x0f172a), 0.04, 0.42, 0.02, mic);
          mBody.rotation.x = -0.4;
          addMesh(new THREE.CylinderGeometry(0.025, 0.02, 0.1, 8), M(0xd1d5db), 0.04, 0.24, 0.09, mic);

          // Model molekul
          const mol = new THREE.Group();
          mol.position.set(-9.5, 0.9, -4.5);
          g.add(mol);
          addMesh(new THREE.SphereGeometry(0.1, 12, 10), M(0xef4444), 0, 0.18, 0, mol);
          [[0.18, 0.25, 0.08, 0x3b82f6], [-0.18, 0.25, -0.08, 0x10b981], [0.08, 0.08, -0.18, 0xffffff]].forEach((ap) => {
            addMesh(new THREE.SphereGeometry(0.06, 10, 8), M(ap[3]), ap[0], ap[1], ap[2], mol);
            addMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 6), M(0xcccccc), ap[0] / 2, (ap[1] + 0.18) / 2, ap[2] / 2, mol).lookAt(ap[0], ap[1], ap[2]);
          });

          // Globe
          const glb = new THREE.Group();
          glb.position.set(-8.5, 0.9, 1.5);
          g.add(glb);
          addMesh(new THREE.CylinderGeometry(0.12, 0.16, 0.06, 16), M(0x78350f), 0, 0.03, 0, glb);
          addMesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8), M(0xd97706), 0, 0.14, 0, glb);
          const gRing = addMesh(new THREE.TorusGeometry(0.24, 0.02, 8, 20, Math.PI * 1.2), M(0xd97706), 0, 0.38, 0, glb);
          gRing.rotation.z = -Math.PI / 4;
          addMesh(new THREE.SphereGeometry(0.2, 16, 12), M(0x2563eb), 0, 0.38, 0, glb);

          // Zona 3 Props (Etalase Piala, 3 Piala 3D Emas/Perak/Perunggu, Karpet Merah)
          addMesh(new THREE.BoxGeometry(1.6, 3.4, 5.0), M(0x78350f), 9.8, 1.7, -1.5, g);
          addMesh(new THREE.BoxGeometry(1.4, 3.1, 4.7), M(0x0f172a), 9.7, 1.7, -1.5, g);
          addMesh(new THREE.BoxGeometry(0.1, 3.1, 4.7), new THREE.MeshBasicMaterial({ color: 0xa5f3fc, transparent: true, opacity: 0.35 }), 9.0, 1.7, -1.5, g);
          [-0.7, 0, 0.7].forEach((ry) => addMesh(new THREE.BoxGeometry(1.2, 0.04, 4.6), M(0x38bdf8), 9.7, 1.7 + ry, -1.5, g));
          addMesh(new THREE.BoxGeometry(2.0, 0.02, 5.2), M(0xd9534f), 8.0, 0.025, -1.5, g);

          // 3 Piala 3D
          const tp1 = new THREE.Group();
          tp1.position.set(9.6, 1.74, -1.5);
          g.add(tp1);
          addMesh(new THREE.BoxGeometry(0.32, 0.18, 0.32), M(0x111111), 0, 0.09, 0, tp1);
          addMesh(new THREE.CylinderGeometry(0.06, 0.1, 0.16, 12), M(0xffd700), 0, 0.25, 0, tp1);
          addMesh(new THREE.CylinderGeometry(0.2, 0.12, 0.4, 16), M(0xffd700), 0, 0.5, 0, tp1);
          addMesh(new THREE.TorusGeometry(0.14, 0.022, 8, 16), M(0xffd700), 0.2, 0.52, 0, tp1);
          addMesh(new THREE.TorusGeometry(0.14, 0.022, 8, 16), M(0xffd700), -0.2, 0.52, 0, tp1);
          addMesh(new THREE.OctahedronGeometry(0.1), M(0xffd700), 0, 0.76, 0, tp1);

          const tp2 = new THREE.Group();
          tp2.position.set(9.6, 1.74, -0.5);
          g.add(tp2);
          addMesh(new THREE.BoxGeometry(0.26, 0.15, 0.26), M(0x111111), 0, 0.08, 0, tp2);
          addMesh(new THREE.CylinderGeometry(0.16, 0.1, 0.32, 14), M(0xe2e8f0), 0, 0.38, 0, tp2);
          addMesh(new THREE.TorusGeometry(0.11, 0.02, 8, 14), M(0xe2e8f0), 0.16, 0.4, 0, tp2);

          const tp3 = new THREE.Group();
          tp3.position.set(9.6, 1.74, -2.5);
          g.add(tp3);
          addMesh(new THREE.BoxGeometry(0.26, 0.15, 0.26), M(0x111111), 0, 0.08, 0, tp3);
          addMesh(new THREE.CylinderGeometry(0.15, 0.09, 0.3, 14), M(0xd97706), 0, 0.36, 0, tp3);
          addMesh(new THREE.TorusGeometry(0.1, 0.02, 8, 14), M(0xd97706), 0.15, 0.38, 0, tp3);

          // Jam dinding
          const clk = new THREE.Group();
          clk.position.set(0, 3.8, 7.85);
          g.add(clk);
          addMesh(new THREE.CylinderGeometry(0.45, 0.45, 0.06, 24), M(0x1e293b), 0, 0, 0, clk).rotation.x = Math.PI / 2;
          addMesh(new THREE.CylinderGeometry(0.4, 0.4, 0.07, 24), M(0xffffff), 0, 0, -0.01, clk).rotation.x = Math.PI / 2;
        } else if (id === "ekskul") {
          // ==========================================
          // KHUSUS AULA & EKSKUL (Panggung, Drum & Alat Musik, Rak Olahraga):
          // ==========================================
          // Panggung Utama Megah di Dinding Utara
          addMesh(new THREE.BoxGeometry(13.0, 0.5, 4.8), M(0x78350f), 0, 0.25, -5.4, g);
          addMesh(new THREE.BoxGeometry(13.2, 0.06, 5.0), M(0x92400e), 0, 0.52, -5.4, g);
          // Tangga Masuk Panggung Kiri & Kanan
          [-6.2, 6.2].forEach((sx) => {
            addMesh(new THREE.BoxGeometry(0.8, 0.18, 0.6), M(0x78350f), sx, 0.09, -2.8, g);
            addMesh(new THREE.BoxGeometry(0.8, 0.36, 0.6), M(0x78350f), sx, 0.18, -3.4, g);
          });
          // Tirai Panggung Beludru Merah Kirmizi Mewah
          addMesh(new THREE.BoxGeometry(2.4, 4.2, 0.2), M(0x991b1b), -5.5, 2.6, -3.2, g);
          addMesh(new THREE.BoxGeometry(2.4, 4.2, 0.2), M(0x991b1b), 5.5, 2.6, -3.2, g);
          addMesh(new THREE.BoxGeometry(13.2, 0.8, 0.2), M(0x991b1b), 0, 4.3, -3.2, g);

          // Podium Pidato Kayu Jati di Tengah Panggung
          addMesh(new THREE.BoxGeometry(1.1, 1.3, 0.8), M(0x451a03), 0, 1.15, -5.2, g);
          addMesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 8), M(0xffd700), 0, 1.95, -5.2, g); // Tiang Mic
          addMesh(new THREE.SphereGeometry(0.06, 8, 8), M(0xffd700), 0, 2.15, -5.18, g); // Mikrofon Emas

          // Backdrop Panggung Banner 3D
          addMesh(new THREE.BoxGeometry(8.4, 1.4, 0.08), M(0x1e3a8a), 0, 3.2, -7.9, g);
          lbl("🎭 AULA SERBAGUNA & SENI", 0, 3.2, -7.82, g);

          // Drum Set Band / Musik 3D (Bass Drum, Snare, Cymbal Emas)
          const drumG = new THREE.Group();
          drumG.position.set(4.2, 0.52, -5.2);
          g.add(drumG);
          // Bass drum
          const bd = addMesh(new THREE.CylinderGeometry(0.65, 0.65, 0.6, 20), M(0x1e293b), 0, 0.68, 0, drumG);
          bd.rotation.x = Math.PI / 2;
          addMesh(new THREE.CylinderGeometry(0.62, 0.62, 0.62), M(0xf8fafc), 0, 0.68, 0, drumG).rotation.x = Math.PI / 2;
          // Snare & Tom
          addMesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16), M(0xb91c1c), -0.65, 0.82, -0.1, drumG);
          addMesh(new THREE.CylinderGeometry(0.28, 0.28, 0.25, 16), M(0xb91c1c), 0.25, 1.45, -0.05, drumG);
          // Cymbal Emas Berkibar
          addMesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8), M(0xcccccc), 0.85, 0.75, 0.2, drumG);
          addMesh(new THREE.CylinderGeometry(0.42, 0.05, 0.04, 20), M(0xffd700), 0.85, 1.5, 0.2, drumG);

          // Rak Peralatan Olahraga (Bola Basket, Futsal, Matras)
          const spG = new THREE.Group();
          spG.position.set(-8.8, 0, 1.2);
          g.add(spG);
          addMesh(new THREE.BoxGeometry(2.4, 1.6, 0.8), M(0x475569), 0, 0.8, 0, spG);
          // 3 Bola Basket Oranye 3D
          [-0.6, 0, 0.6].forEach((bx) => {
            addMesh(new THREE.SphereGeometry(0.22, 14, 12), M(0xea580c), bx, 1.82, 0, spG);
          });
          // Matras Senam Biru Tebal
          addMesh(new THREE.BoxGeometry(2.6, 0.35, 1.6), M(0x2563eb), 0, 0.175, 1.6, spG);
        } else if (id === "ppdb") {
          // ==========================================
          // KHUSUS KANTOR PPDB (3 Loket Pelayanan CS, Kios Antrean, Ruang Tunggu):
          // ==========================================
          // 3 Meja Loket Customer Service Pelayanan
          [-4.2, 0, 4.2].forEach((lx, idx) => {
            // Meja CS
            addMesh(new THREE.BoxGeometry(3.2, 1.1, 1.4), M(0x065f46), lx, 0.55, -4.5, g);
            addMesh(new THREE.BoxGeometry(3.4, 0.08, 1.5), M(0xf8fafc), lx, 1.14, -4.5, g);
            // Sekat Kaca Akrilik Loket
            addMesh(new THREE.BoxGeometry(3.0, 0.65, 0.04), new THREE.MeshBasicMaterial({ color: 0xa7f3d0, transparent: true, opacity: 0.5 }), lx, 1.5, -3.85, g);
            // Label Nomor Loket
            lbl(`LOKET ${idx + 1}`, lx, 2.1, -3.85, g);
            // PC All-in-One Staf
            addMesh(new THREE.BoxGeometry(0.7, 0.45, 0.04), M(0x0f172a), lx, 1.45, -4.6, g);
            addMesh(new THREE.BoxGeometry(0.64, 0.4, 0.02), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }), lx, 1.45, -4.58, g);
            // Kursi Staf & Kursi Tamu Pemohon
            addMesh(new THREE.CylinderGeometry(0.24, 0.24, 0.45, 12), M(0x047857), lx, 0.25, -5.6, g);
            addMesh(new THREE.CylinderGeometry(0.22, 0.22, 0.45, 12), M(0x1e293b), lx, 0.25, -3.2, g);
          });

          // Kios Totem Mesin Antrean Elektronik Touchscreen di Dekat Pintu
          const kiosk = new THREE.Group();
          kiosk.position.set(2.4, 0, 4.6);
          g.add(kiosk);
          addMesh(new THREE.BoxGeometry(0.55, 1.4, 0.4), M(0x0f172a), 0, 0.7, 0, kiosk);
          addMesh(new THREE.BoxGeometry(0.48, 0.35, 0.02), new THREE.MeshBasicMaterial({ color: 0x10b981 }), 0, 1.25, 0.21, kiosk); // Layar Sentuh
          lbl("AMBIL TIKET", 2.4, 1.8, 4.6, g);

          // 2 Deret Kursi Tunggu Stainless Steel
          [-2.4, 2.4].forEach((qx) => {
            const bench = new THREE.Group();
            bench.position.set(qx, 0, 0.5);
            g.add(bench);
            addMesh(new THREE.BoxGeometry(2.8, 0.06, 0.6), M(0x94a3b8), 0, 0.45, 0, bench);
            addMesh(new THREE.BoxGeometry(2.8, 0.45, 0.06), M(0x64748b), 0, 0.7, -0.3, bench);
            [-1.2, 1.2].forEach((lx) => {
              addMesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8), M(0x334155), lx, 0.225, 0, bench);
            });
          });

          // TV Dinding LED Menampilkan Profil Sekolah
          addMesh(new THREE.BoxGeometry(3.6, 2.0, 0.08), M(0x0f172a), -8.0, 2.8, 0.5, g).rotation.y = Math.PI / 2;
          addMesh(new THREE.BoxGeometry(3.4, 1.8, 0.02), new THREE.MeshBasicMaterial({ color: 0x059669 }), -7.95, 2.8, 0.5, g).rotation.y = Math.PI / 2;
          lbl("📺 PROFIL PPDB", -7.9, 2.8, 0.5, g);

          // Dispenser Galon Air Mineral di Sudut
          const disp = new THREE.Group();
          disp.position.set(-9.8, 0, 6.0);
          g.add(disp);
          addMesh(new THREE.BoxGeometry(0.5, 0.95, 0.5), M(0xffffff), 0, 0.475, 0, disp);
          addMesh(new THREE.CylinderGeometry(0.2, 0.2, 0.45, 14), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 }), 0, 1.18, 0, disp); // Galon Biru
        }

        // Tanaman Hias Sudut Cantik
        [[-9.8, -6.8], [9.8, -6.8]].forEach((pos) => {
          const pln = new THREE.Group();
          pln.position.set(pos[0], 0, pos[1]);
          g.add(pln);
          addMesh(new THREE.CylinderGeometry(0.38, 0.3, 0.75, 16), M(0xffffff), 0, 0.375, 0, pln);
          addMesh(new THREE.CylinderGeometry(0.34, 0.32, 0.05, 12), M(0x3e2723), 0, 0.73, 0, pln);
          const lf = addMesh(new THREE.SphereGeometry(0.48, 10, 8), M(0x16a34a), 0, 1.1, 0, pln);
          lf.scale.set(1.15, 0.85, 1.15);
        });

        // Furniture meja & partisi dari data constants RM
        d.F.forEach((f: any) =>
          addMesh(new THREE.BoxGeometry(f[2], f[3], f[4]), M(f[5]), f[0], f[3] / 2, f[1], g)
        );

        // Lingkaran Interaksi Zona (Torus Emas/Hijau + Beam Silinder Cahaya + Billboard 3D Label)
        roomRings[id] = d.S.map((q: any, i: number) => {
          const ic = IC[id]?.[i] || "📍";
          const tName = TAB_NAMES[id]?.[i] || "Zona";
          const c = saveStateRef.current.s[id + i] ? 0x4ade80 : 0xffc83d;
          const r = addMesh(new THREE.TorusGeometry(0.8, 0.1, 8, 24), M(c), q[0], 0.12, q[1], g);
          r.rotation.x = Math.PI / 2;
          const bm = addMesh(
            new THREE.CylinderGeometry(0.8, 0.8, 2.8, 20, 1, true),
            new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
            q[0], 1.4, q[1], g
          );
          lbl(ic + " " + tName, q[0], 3.2, q[1], g);
          return {
            id,
            idx: i,
            i: ic,
            n: tName,
            v: "Buka Info",
            st: 1,
            x: RX + q[0],
            z: q[1],
            ring: r,
            beam: bm,
          };
        });

        roomsMap[id] = g;
      });

      roomsMapRef.current = roomsMap;
      roomRingMapRef.current = roomRings;

      applyCharacterSkin(charIndex);

      // Event listeners & Mobile Responsive FOV
      const handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        if (w < h) {
          // Mode layar HP Portrait: perluas FOV vertikal agar ruangan & gedung terlihat utuh
          camera.fov = Math.min(76, 56 * (h / w) * 0.58);
        } else {
          camera.fov = 56;
        }
        camera.updateProjectionMatrix();
      };
      handleResize();
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
        if (playRef.current && e.pointerType === "touch" && e.clientX < window.innerWidth * 0.55 && !joyRef.current) {
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
          if (jk) jk.style.transform = "";
          return;
        }
        if (dn && mv < 8 && playRef.current) {
          ray.setFromCamera(
            new THREE.Vector2(
              (e.clientX / window.innerWidth) * 2 - 1,
              -(e.clientY / window.innerHeight) * 2 + 1
            ),
            camera
          );
          if (ray.ray.intersectPlane(pln, hit)) {
            if (roomRef.current) {
              targetPos.current = {
                x: Math.min(RX + 8.5, Math.max(RX - 8.5, hit.x)),
                z: Math.min(6.5, Math.max(-6.5, hit.z)),
              };
            } else {
              targetPos.current = { x: hit.x, z: hit.z };
            }
            autoEnterRoomId.current = null;
          }
        }
        dn = null;
      };

      const handlePointerCancel = () => {
        joyRef.current = null;
        if (jb) jb.classList.remove("on");
        if (jk) jk.style.transform = "";
        dn = null;
      };

      const handleWheel = (e: WheelEvent) => {
        const minDist = roomRef.current ? 5.2 : 6.0;
        const maxDist = roomRef.current ? 12.0 : 24.0;
        playerDist.current = Math.min(
          maxDist,
          Math.max(minDist, playerDist.current + e.deltaY * 0.012)
        );
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
              autoEnterRoomId.current = null;
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
        let actualSpeed = 5.2;
        let isSprint = false;
        if (l > 0) {
          dx /= l;
          dz /= l;
          const joyMag = joyRef.current ? Math.hypot(joyRef.current.dx, joyRef.current.dy) : 1;
          isSprint = K.shift || joyMag > 0.88;
          actualSpeed = isSprint ? 8.5 : joyRef.current ? Math.max(3.2, 5.2 * Math.min(1, joyMag)) : 5.2;
          playerPos.current.x += dx * actualSpeed * dt;
          playerPos.current.z += dz * actualSpeed * dt;

          // Collision detection
          if (roomRef.current) {
            playerPos.current.x = Math.min(RX + 10.2, Math.max(RX - 10.2, playerPos.current.x));
            const isExOpen =
              roomsMapRef.current[roomRef.current]?.userData.isOpeningExit === 1;
            const maxZ = isExOpen ? 7.4 : 6.75;
            playerPos.current.z = Math.min(maxZ, Math.max(-7.2, playerPos.current.z));
            const rmData = RM[roomRef.current];
            if (rmData && rmData.F) {
              for (const f of rmData.F) {
                const fx = RX + f[0];
                const fz = f[1];
                const hw = f[2] / 2 + 0.35;
                const hd = f[4] / 2 + 0.35;
                const cdx = playerPos.current.x - fx;
                const cdz = playerPos.current.z - fz;
                if (Math.abs(cdx) < hw && Math.abs(cdz) < hd) {
                  const ox = hw - Math.abs(cdx);
                  const oz = hd - Math.abs(cdz);
                  if (ox < oz) {
                    playerPos.current.x = fx + Math.sign(cdx || 1) * hw;
                  } else {
                    playerPos.current.z = fz + Math.sign(cdz || 1) * hd;
                  }
                }
              }
            }
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
                const c = Math.cos(b.r),
                  s = Math.sin(b.r);
                const bdx = playerPos.current.x - b.x,
                  bdz = playerPos.current.z - b.z;
                let lx = bdx * c - bdz * s,
                  lz = bdx * s + bdz * c;
                const hx =
                  b.id === "profil"
                    ? 6.5
                    : b.id === "akademik"
                    ? 6.2
                    : b.id === "ekskul"
                    ? 5.9
                    : 5.3;
                const bFrontZ =
                  b.id === "ekskul"
                    ? 4.52
                    : b.id === "profil"
                    ? 4.12
                    : b.id === "akademik"
                    ? 4.02
                    : 3.92;
                const hz = bFrontZ;

                // Jika pintu sedang dibuka oleh karakter (b.isOpening), izinkan melangkah masuk
                if (b.isOpening && Math.abs(lx) < 1.35 && lz > 0) {
                  // Melangkah masuk bebas
                } else if (Math.abs(lx) < hx && Math.abs(lz) < hz) {
                  if (hx - Math.abs(lx) < hz - Math.abs(lz))
                    lx = Math.sign(lx || 1) * hx;
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
          pl.rotation.y += da * Math.min(1, dt * 14);
          waveTimer.current = 0;
        }

        // ==========================================
        // ===== ANIMASI ORANG / KARAKTER BERJALAN ==
        // ==========================================
        const [L, Rl] = legsRef.current;
        const [kneeL, kneeR] = kneesRef.current;
        const [aL, aR] = armsRef.current;
        const [foreL, foreR] = forearmsRef.current;
        const torsoObj = torsoRef.current;
        const headObj = headRef.current;

        // Transisi halus antara idle dan jalan (mencegah sentakan / snapping saat mulai atau berhenti)
        const isMoving = l > 0;
        const targetWeight = isMoving ? 1.0 : 0.0;
        walkWeight.current += (targetWeight - walkWeight.current) * Math.min(1, dt * 9.0);

        // Skala irama langkah dinamis dengan kecepatan pergerakan
        const cadence = isSprint ? 14.0 : 10.5 * (actualSpeed / 5.2);
        if (isMoving) {
          walkPhase.current += dt * cadence;
        }

        const ph = walkPhase.current;
        const sw = Math.sin(ph);
        const w = walkWeight.current;
        const b = Math.sin(t * 2);

        if (waveTimer.current > 0) {
          waveTimer.current -= dt;
        }

        if (L && Rl && aL && aR) {
          if (w > 0.005) {
            // ----- KAKI & LUTUT (Siklus melangkah maju alami / Natural Forward Gait) -----
            const legAmp = isSprint ? 0.65 : 0.48;
            const kneeAmp = isSprint ? 0.88 : 0.64;

            // Ayunan paha berlawanan:
            // sw > 0: Kaki kiri mengayun ke depan (rotX < 0 mengarah ke +Z), Kaki kanan dorong ke belakang (rotX > 0 mengarah ke -Z)
            L.rotation.x = -sw * legAmp * w;
            Rl.rotation.x = sw * legAmp * w;

            // Artikulasi lutut: lutut menekuk ke belakang saat mengayun ke depan (sw > 0 untuk kaki kiri, sw < 0 untuk kaki kanan)
            if (kneeL && kneeR) {
              kneeL.rotation.x = Math.max(0, sw * kneeAmp) * w;
              kneeR.rotation.x = Math.max(0, -sw * kneeAmp) * w;
            }

            // ----- TANGAN & SIKU (Mengayun harmonis berlawanan dengan kaki) -----
            const armAmp = isSprint ? 0.58 : 0.40;
            // Saat kaki kiri mengayun ke depan (sw > 0), tangan kanan mengayun ke depan (rotX < 0) & tangan kiri ke belakang (rotX > 0)
            aL.rotation.x = sw * armAmp * w;
            aR.rotation.x = -sw * armAmp * w;
            aL.rotation.z = -0.12 - (isSprint ? 0.06 : 0.03) * w;
            aR.rotation.z = 0.12 + (isSprint ? 0.06 : 0.03) * w;

            // Artikulasi siku: siku menekuk alami saat tangan mengayun ke depan
            if (foreL && foreR) {
              foreL.rotation.x = (-0.14 - Math.max(0, -sw * 0.28)) * w;
              foreR.rotation.x = (-0.14 - Math.max(0, sw * 0.28)) * w;
            }

            // ----- BADAN & PANGGUL (Spine twist & bobbing pijakan tanah alami) -----
            // Pelvic bobbing (titik puncak saat kaki tumpu tegak, merendah saat langkah melebar)
            const bob = (1 - Math.abs(sw)) * (isSprint ? 0.045 : 0.025) * w;
            pl.position.y = playerJumpY.current + bob;

            if (torsoObj) {
              // Pilinan pundak berlawanan arah dengan panggul (Shoulder twist)
              torsoObj.rotation.y = -sw * (isSprint ? 0.11 : 0.06) * w;
              // Ayunan berat badan ke kiri & kanan (Lateral sway)
              torsoObj.rotation.z = Math.sin(ph) * 0.025 * w;
              // Condong sedikit ke depan saat bergerak (Athletic pitch)
              torsoObj.rotation.x = (isSprint ? 0.10 : 0.04) * w;
            }

            // Stabilisasi kepala (menatap fokus ke arah pandang)
            if (headObj) {
              headObj.rotation.set(
                -(isSprint ? 0.05 : 0.02) * w,
                sw * 0.04 * w,
                -Math.sin(ph) * 0.015 * w
              );
            }

            // Badan miring halus saat berbelok (Banking into curves)
            if (isMoving) {
              let curDa = Math.atan2(dx, dz) - pl.rotation.y;
              curDa = Math.atan2(Math.sin(curDa), Math.cos(curDa));
              const bankAngle = Math.max(-0.14, Math.min(0.14, curDa * 0.22));
              pl.rotation.z = -bankAngle * w;
            } else {
              pl.rotation.z = 0;
            }

            // Ayunan kain rok siswi (Rani & Sari) mengikuti langkah kaki
            if (raniSkirtRef.current) {
              raniSkirtRef.current.rotation.x = Math.sin(ph) * 0.08 * w;
              raniSkirtRef.current.rotation.z = -Math.sin(ph) * 0.03 * w;
            }
            if (sariSkirtRef.current) {
              sariSkirtRef.current.rotation.x = Math.sin(ph) * 0.05 * w;
              sariSkirtRef.current.rotation.z = -Math.sin(ph) * 0.02 * w;
            }

            // Pantulan kuncir rambut siswi Rani
            if (rPonyRef.current) {
              rPonyRef.current.rotation.x = -0.42 + Math.sin(ph * 2) * 0.14 * w;
            }

            // Pantulan halus tas ransel petualang
            if (backpackRef.current) {
              backpackRef.current.position.y = Math.abs(sw) * 0.025 * w;
            }

            // Suara langkah kaki sinkron dengan hentakan sepatu
            stepTimer.current += dt * (actualSpeed / 5.2);
            if (stepTimer.current > 0.30) {
              stepTimer.current = 0;
              sfx("step");
            }
          } else {
            // ----- DIAM / IDLE BREATHING (Pernapasan rileks) -----
            L.rotation.x = 0;
            Rl.rotation.x = 0;
            if (kneeL && kneeR) {
              kneeL.rotation.x = 0;
              kneeR.rotation.x = 0;
            }
            aL.rotation.x = 0;
            aR.rotation.x = 0;
            if (foreL && foreR) {
              foreL.rotation.x = -0.08;
              foreR.rotation.x = -0.08;
            }
            pl.position.y = playerJumpY.current;
            pl.rotation.z = 0;
            if (torsoObj) {
              torsoObj.scale.y = 1 + b * 0.012;
              torsoObj.rotation.set(0, 0, 0);
            }
            aL.rotation.z = -0.1 - b * 0.02;

            if (waveTimer.current > 0) {
              // Melambaikan tangan menyapa
              aR.rotation.z = 2.5 + Math.sin(t * 10) * 0.3;
              if (headObj) headObj.rotation.set(0, Math.sin(t * 2) * 0.12, 0.1);
            } else {
              aR.rotation.z = 0.1 + b * 0.02;
              if (headObj) headObj.rotation.set(0, 0, Math.sin(t * 1.3) * 0.04);
            }

            if (rPonyRef.current) {
              rPonyRef.current.rotation.x = -0.42 + b * 0.03;
            }
            if (raniSkirtRef.current) raniSkirtRef.current.rotation.set(0, 0, 0);
            if (sariSkirtRef.current) sariSkirtRef.current.rotation.set(0, 0, 0);
            if (backpackRef.current) backpackRef.current.position.y = 0;
          }

          // Pose saat melompat
          if (playerJumpY.current > 0) {
            L.rotation.x = -0.45;
            Rl.rotation.x = 0.35;
            if (kneeL && kneeR) {
              kneeL.rotation.x = 0.55;
              kneeR.rotation.x = 0.25;
            }
            aL.rotation.z = -0.65;
            aR.rotation.z = 0.65;
          }

          // Animasi tangan kanan karakter menjangkau gagang pintu saat membuka pintu
          if (openDoorTimer.current > 0) {
            openDoorTimer.current -= dt;
            aR.rotation.x = -1.35;
            aR.rotation.y = -0.15;
            aR.rotation.z = -0.22;
          }
        }

        pl.position.x = playerPos.current.x;
        pl.position.z = playerPos.current.z;

        // ==========================================
        // ===== ANIMASI SISWA / NPC LAIN ===========
        // ==========================================
        npcsRef.current.forEach((n, i) => {
          const d2 = Math.hypot(n.g.position.x - playerPos.current.x, n.g.position.z - playerPos.current.z);
          const isNear = d2 < 3.4 && playRef.current;

          // Transisi halus antara jalan dan berhenti sapa pemain (menghilangkan sentakan / snapping)
          const targetWeight = isNear ? 0.0 : 1.0;
          n.walkWeight += (targetWeight - n.walkWeight) * Math.min(1, dt * 6.0);

          if (!isNear) {
            n.a += n.w * dt;
          }

          // Hitung posisi di jalur taman/koridor
          const sg = Math.sign(n.w);
          const nxPos = n.cx + Math.cos(n.a) * n.rx;
          const nzPos = n.cz + Math.sin(n.a) * n.rz;
          n.g.position.x = nxPos;
          n.g.position.z = nzPos;

          // Arah hadap berjalan: tangen kecepatan lintasan
          const moveDx = -n.rx * Math.sin(n.a) * sg;
          const moveDz = n.rz * Math.cos(n.a) * sg;
          const walkAngle = Math.atan2(moveDx, moveDz);

          // Arah menghadap pemain saat disapa
          const facePlayerAngle = Math.atan2(playerPos.current.x - nxPos, playerPos.current.z - nzPos);

          const targetAngle = isNear ? facePlayerAngle : walkAngle;
          let da = targetAngle - n.g.rotation.y;
          da = Math.atan2(Math.sin(da), Math.cos(da));
          n.g.rotation.y += da * Math.min(1, dt * (isNear ? 8 : 4));

          // Pergerakan langkah NPC
          const nw = n.walkWeight;
          if (nw > 0.01) {
            n.walkPhase += dt * 9.5;
          }
          const npcPh = n.walkPhase;
          const npcSw = Math.sin(npcPh);
          const b = Math.sin(t * 2 + i);

          const [L, Rl] = n.lg;
          const [kneeL, kneeR] = n.knees;
          const [aL, aR] = n.ar;
          const [foreL, foreR] = n.forearms;

          // Ketinggian tubuh alami (Pelvic bobbing)
          n.g.position.y = (1 - Math.abs(npcSw)) * 0.025 * nw;

          if (L && Rl) {
            // Ayunan paha maju mundur natural (sw > 0: L ayun ke depan rotX < 0, Rl dorong ke belakang rotX > 0)
            L.rotation.x = -npcSw * 0.46 * nw;
            Rl.rotation.x = npcSw * 0.46 * nw;

            // Artikulasi lutut NPC: menekuk saat melangkah maju
            if (kneeL && kneeR) {
              kneeL.rotation.x = Math.max(0, npcSw * 0.62) * nw;
              kneeR.rotation.x = Math.max(0, -npcSw * 0.62) * nw;
            }
          }

          if (aL && aR) {
            if (isNear) {
              // Melambaikan tangan kanan ramah menyapa pemain
              aR.rotation.x = -0.2;
              aR.rotation.z = 2.4 + Math.sin(t * 8) * 0.35;
              aL.rotation.set(0, 0, -0.12 - b * 0.02);
              if (foreR) foreR.rotation.x = -0.4;
              if (foreL) foreL.rotation.x = -0.08;
              if (n.head) n.head.rotation.set(0, Math.sin(t * 2) * 0.1, 0.06);
            } else {
              // Lengan mengayun rileks saat berjalan berlawanan dengan kaki
              aL.rotation.x = npcSw * 0.38 * nw;
              aR.rotation.x = -npcSw * 0.38 * nw;
              aL.rotation.z = -0.12;
              aR.rotation.z = 0.12;

              if (foreL && foreR) {
                foreL.rotation.x = (-0.12 - Math.max(0, -npcSw * 0.25)) * nw;
                foreR.rotation.x = (-0.12 - Math.max(0, npcSw * 0.25)) * nw;
              }
              if (n.head) n.head.rotation.set(0, 0, 0);
            }
          }

          // Torso pilinan bahu saat melangkah & napas saat diam
          if (n.torso) {
            if (nw > 0.05) {
              n.torso.rotation.y = -npcSw * 0.05 * nw;
              n.torso.rotation.z = Math.sin(npcPh) * 0.02 * nw;
              n.torso.rotation.x = 0.03 * nw;
              n.torso.scale.y = 1;
            } else {
              n.torso.rotation.set(0, 0, 0);
              n.torso.scale.y = 1 + b * 0.012;
            }
          }

          // Ayunan rok siswi & kuncir rambut
          if (n.skirt && nw > 0.05) {
            n.skirt.rotation.x = Math.sin(npcPh) * 0.05 * nw;
            n.skirt.rotation.z = -Math.sin(npcPh) * 0.02 * nw;
          }
          if (n.pony) {
            n.pony.rotation.x = -0.42 + (nw > 0.05 ? Math.sin(npcPh * 2) * 0.10 * nw : b * 0.03);
          }
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

        // Animasi Butiran Hujan Jatuh Aktif Mengikuti Posisi Pemain
        if (isRainingRef.current && !roomRef.current && rainPointsRef.current && rainCoordsRef.current) {
          const coords = rainCoordsRef.current;
          const px = playerPos.current.x;
          const pz = playerPos.current.z;
          const count = coords.length / 3;

          for (let i = 0; i < count; i++) {
            const idx = i * 3;
            coords[idx + 1] -= dt * 25; // Kecepatan jatuh 25 meter/detik

            // Jika butiran menyentuh tanah, respawn di atas awan sekitar pemain
            if (coords[idx + 1] <= 0.1) {
              coords[idx + 1] = 16 + Math.random() * 6;
              coords[idx] = px + (Math.random() - 0.5) * 52;
              coords[idx + 2] = pz + (Math.random() - 0.5) * 52;
            }
          }

          rainPointsRef.current.geometry.attributes.position.needsUpdate = true;
        }

        // Animasi Kelip Bintang Malam
        if (nightSkyGroupRef.current && nightSkyGroupRef.current.visible) {
          const mat = nightSkyGroupRef.current.material as THREE.PointsMaterial;
          mat.opacity = 0.75 + Math.sin(t * 2.5) * 0.18;
        }

        // Gate Door swings
        if (gateDoorLRef.current && gateDoorRRef.current) {
          const targetGateAngle = mainGateOpenRef.current ? 1.15 : 0.0;
          gateDoorLRef.current.rotation.y +=
            (targetGateAngle - gateDoorLRef.current.rotation.y) * Math.min(1, dt * 5.5);
          gateDoorRRef.current.rotation.y +=
            (-targetGateAngle - gateDoorRRef.current.rotation.y) * Math.min(1, dt * 5.5);
        }

        // Building door swings: Pintu HANYA dibuka saat karakter berinteraksi membuka pintu (b.isOpening === 1)
        if (!roomRef.current) {
          BUILDINGS.forEach((b) => {
            if (!b.doorL || !b.doorR) return;
            const isOpen = b.isOpening === 1;
            const targetAngle = isOpen ? 1.55 : 0.0;
            b.doorL.rotation.y +=
              (-targetAngle - b.doorL.rotation.y) * Math.min(1, dt * 7.0);
            b.doorR.rotation.y +=
              (targetAngle - b.doorR.rotation.y) * Math.min(1, dt * 7.0);
          });
        } else if (roomRef.current && roomsMapRef.current[roomRef.current]) {
          const rg = roomsMapRef.current[roomRef.current];
          const exL = rg.userData.exitDoorL;
          const exR = rg.userData.exitDoorR;
          if (exL && exR) {
            const isExOpen = rg.userData.isOpeningExit === 1;
            const tgtEx = isExOpen ? 1.55 : 0.0;
            exL.rotation.y += (-tgtEx - exL.rotation.y) * Math.min(1, dt * 7.0);
            exR.rotation.y += (tgtEx - exR.rotation.y) * Math.min(1, dt * 7.0);
          }
        }

        // Check nearest interactable object
        let nb: any = null;
        if (playRef.current && !roomRef.current) {
          for (const b of BUILDINGS) {
            if (
              b.dx != null &&
              b.dz != null &&
              Math.hypot(
                b.dx - playerPos.current.x,
                b.dz - playerPos.current.z
              ) < 3.8
            ) {
              nb = { id: b.id, n: b.n, i: "🚪", v: "Buka Pintu" };
            }
          }
          if (
            Math.hypot(-6.5 - playerPos.current.x, 24.5 - playerPos.current.z) <
            2.8
          ) {
            nb = { id: "satpam", n: "Pak Budi (Satpam)", i: "👮", v: "Bicara" };
          }
          if (
            Math.abs(playerPos.current.x) < 4.2 &&
            Math.abs(playerPos.current.z - 28) < 3.2
          ) {
            nb = {
              id: "gate_toggle",
              n: "Gerbang Utama",
              i: "🚪",
              v: mainGateOpenRef.current ? "Tutup Gerbang" : "Buka Gerbang",
            };
          }
        } else if (roomRef.current) {
          if (
            Math.hypot(RX - playerPos.current.x, 7.1 - playerPos.current.z) <
            2.5
          ) {
            nb = {
              exit: 1,
              id: "exit",
              n: "Pintu Keluar",
              i: "🚪",
              v: "Buka Pintu Keluar",
            };
          }
          const rings = roomRingMapRef.current[roomRef.current] || [];
          for (const r of rings) {
            if (
              Math.hypot(r.x - playerPos.current.x, r.z - playerPos.current.z) <
              1.6
            ) {
              nb = r;
            }
          }
        }

        if (nb !== nearObjRef.current) {
          nearObjRef.current = nb;
          onNearChangeRef.current?.(nb);
        }

        // Camera follow & Mobile Responsive Angle
        const isPortrait = window.innerHeight > window.innerWidth;
        let tv: THREE.Vector3;

        if (roomRef.current) {
          // ==========================================
          // KAMERA DI DALAM RUANGAN (INTERIOR 3D)
          // ==========================================
          // Jarak kamera nyaman & luas agar ruangan dan karakter terlihat proporsional
          const baseDist = Math.max(5.8, Math.min(11.0, playerDist.current));
          const cd = isPortrait ? baseDist * 1.15 : baseDist;
          // Sudut elevasi kamera proporsional
          const cpt = Math.min(0.48, Math.max(0.12, playerPitch.current));
          const cp = Math.cos(cpt);

          const rawX = playerPos.current.x + Math.sin(playerYaw.current) * cp * cd;
          const rawY = 2.0 + Math.sin(cpt) * cd;
          const rawZ = playerPos.current.z + Math.cos(playerYaw.current) * cp * cd;

          // Batasi posisi kamera selalu di dalam batas ruangan
          tv = new THREE.Vector3(
            Math.min(RX + 10.2, Math.max(RX - 10.2, rawX)),
            Math.min(4.5, Math.max(1.5, rawY)),
            Math.min(7.4, Math.max(-7.4, rawZ))
          );
        } else {
          // ==========================================
          // KAMERA DI LUAR RUANGAN (CAMPUS OUTDOOR)
          // ==========================================
          const d = isPortrait ? playerDist.current * 1.25 : playerDist.current;
          const pt = Math.min(1.18, Math.max(0.18, playerPitch.current));
          const cp = Math.cos(pt);
          tv = new THREE.Vector3(
            playerPos.current.x + Math.sin(playerYaw.current) * cp * d,
            1.2 + Math.sin(pt) * d,
            playerPos.current.z + Math.cos(playerYaw.current) * cp * d
          );
        }

        camera.position.lerp(tv, 1 - Math.pow(0.001, dt));
        const lookTargetY = roomRef.current ? 1.25 : 1.3;
        camera.lookAt(playerPos.current.x, lookTargetY, playerPos.current.z);

        const plObj = playerGroupRef.current;
        onPlayerMoveRef.current?.({
          x: playerPos.current.x,
          z: playerPos.current.z,
          yaw: playerYaw.current,
          rotY: plObj ? plObj.rotation.y : Math.PI,
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
