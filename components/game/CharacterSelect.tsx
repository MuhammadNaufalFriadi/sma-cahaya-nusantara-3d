"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { CHARS } from "@/lib/constants";
import { sfx } from "@/lib/audio";

interface CharacterSelectProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
  onStart: () => void;
  onQuickProfile: () => void;
}

/* ============================================================
   Build High-Quality Character matching SchoolWorld.tsx exactly
   ============================================================ */
function buildCharacter(
  scene: THREE.Scene,
  x: number,
  charIdx: number,
  selected: boolean
) {
  const c = CHARS[charIdx];

  const group = new THREE.Group();
  group.position.set(x, 0, 0);
  scene.add(group);

  const M = (hex: number) =>
    new THREE.MeshLambertMaterial({ color: hex });
  const addMesh = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    px = 0,
    py = 0,
    pz = 0,
    parent: THREE.Object3D = group
  ) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(px, py, pz);
    parent.add(m);
    return m;
  };

  // ----- 1. PEDESTAL / PODIUM DUA TINGKAT -----
  // Tingkat 1: Base podium putih / gading halus
  const basePlat = addMesh(
    new THREE.CylinderGeometry(1.22, 1.28, 0.28, 36),
    M(0xf5f3ee),
    0,
    0.14,
    0
  );
  basePlat.userData.pedestal = true;

  // Tingkat 2: Step atas berwarna sesuai identitas karakter
  const topColor =
    charIdx === 0 ? 0x2f5d8a : charIdx === 1 ? 0xb03a48 : 0x247a50;
  const topPlat = addMesh(
    new THREE.CylinderGeometry(1.12, 1.16, 0.14, 36),
    M(topColor),
    0,
    0.33,
    0
  );
  topPlat.userData.pedestal = true;

  // Ring emas penanda karakter aktif (glow)
  const ringGeo = new THREE.TorusGeometry(1.2, 0.055, 12, 36);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffc83d,
    transparent: true,
    opacity: selected ? 1 : 0,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0.41, 0);
  group.add(ring);

  // Group Karakter di atas podium (y = 0.4)
  const charG = new THREE.Group();
  charG.position.y = 0.4;
  charG.scale.setScalar(0.95);
  group.add(charG);

  // Palette Material SESUAI DENGAN SchoolWorld.tsx
  const PM = {
    h: M(c.hairColor),
    j: M(c.jacketColor),
    k: M(c.skinColor),
    pa: M(0x5a6575), // Celana abu-abu SMA
    sh: M(0xf8f8f8), // Kemeja putih
    rd: M(0xd62d2d), // Dasi merah & ransel
    skirt: M(0x5a6575), // Rok abu-abu
    white: M(0xffffff),
    gold: M(0xffd700),
    ribbon: M(0xb03a48),
    blush: M(0xfb7185),
    shoes: M(0x181818),
  };

  // ----- 2. BADAN / TORSO & DASI SEKOLAH -----
  const torso = addMesh(
    new THREE.CylinderGeometry(0.43, 0.38, 0.78, 16),
    PM.j,
    0,
    1.09,
    0,
    charG
  );
  torso.scale.z = 0.8;
  addMesh(new THREE.BoxGeometry(0.3, 0.5, 0.06), PM.sh, 0, 1.2, 0.33, charG);
  addMesh(
    new THREE.BoxGeometry(0.09, 0.42, 0.05),
    PM.rd,
    0,
    1.14,
    0.37,
    charG
  );
  addMesh(new THREE.BoxGeometry(0.4, 0.09, 0.1), PM.sh, 0, 1.5, 0.3, charG);

  // Ransel sekolah merah di punggung
  addMesh(
    new THREE.BoxGeometry(0.62, 0.72, 0.26),
    PM.rd,
    0,
    1.15,
    -0.45,
    charG
  );

  // ----- 3. KEPALA & FITUR WAJAH CUTE -----
  const headG = new THREE.Group();
  headG.position.y = 1.95;
  charG.add(headG);
  addMesh(new THREE.SphereGeometry(0.5, 24, 18), PM.k, 0, 0, 0, headG);

  // Mata bergaya anime manis (Sclera putih, iris biru, pupil hitam, blush pipi)
  [-1, 1].forEach((s) => {
    addMesh(
      new THREE.SphereGeometry(0.13, 12, 10),
      PM.white,
      s * 0.18,
      0.04,
      0.4,
      headG
    );
    addMesh(
      new THREE.SphereGeometry(0.085, 12, 10),
      M(0x3b6e8f),
      s * 0.18,
      0.04,
      0.48,
      headG
    );
    addMesh(
      new THREE.SphereGeometry(0.045, 10, 8),
      M(0x101820),
      s * 0.18,
      0.04,
      0.53,
      headG
    );
    addMesh(
      new THREE.SphereGeometry(0.07, 10, 8),
      PM.blush,
      s * 0.3,
      -0.1,
      0.37,
      headG
    ).scale.z = 0.4;
  });

  // Senyum ramah
  const smile = addMesh(
    new THREE.TorusGeometry(0.09, 0.016, 6, 12, Math.PI),
    M(0x8a3020),
    0,
    -0.16,
    0.46,
    headG
  );
  smile.rotation.set(0, 0, Math.PI);

  // ----- 4. RAMBUT & BUSANA KHAS MASING-MASING KARAKTER -----
  if (charIdx === 0) {
    // NAUFAL (Rambut Cowok Anime Spiky)
    const boyG = new THREE.Group();
    headG.add(boyG);
    addMesh(
      new THREE.SphereGeometry(0.53, 20, 10, 0, 6.283, 0, 1.2),
      PM.h,
      0,
      0.02,
      0,
      boyG
    );
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * 6.283;
      const cCone = addMesh(
        new THREE.ConeGeometry(0.13, 0.4, 6),
        PM.h,
        Math.sin(a) * 0.3,
        0.5,
        Math.cos(a) * 0.25 - 0.05,
        boyG
      );
      cCone.rotation.set(Math.cos(a) * 0.6, 0, -Math.sin(a) * 0.6);
    }
  } else if (charIdx === 1) {
    // RANI (Kuncir Kuda Ponytail + Pita Merah & Rok Lipit)
    const raniG = new THREE.Group();
    headG.add(raniG);
    addMesh(
      new THREE.SphereGeometry(0.54, 22, 12, 0, 6.283, 0, 1.35),
      PM.h,
      0,
      0.02,
      0,
      raniG
    );
    addMesh(
      new THREE.CylinderGeometry(0.48, 0.44, 0.6, 16),
      PM.h,
      0,
      -0.12,
      -0.16,
      raniG
    );
    addMesh(
      new THREE.TorusGeometry(0.13, 0.035, 8, 16),
      PM.ribbon,
      0,
      0.22,
      -0.48,
      raniG
    );
    const rPony = addMesh(
      new THREE.CylinderGeometry(0.14, 0.05, 0.8, 12),
      PM.h,
      0,
      -0.15,
      -0.64,
      raniG
    );
    rPony.rotation.x = -0.42;

    // Rok lipit siswi SMA
    addMesh(
      new THREE.CylinderGeometry(0.38, 0.58, 0.46, 16),
      PM.skirt,
      0,
      0.68,
      0,
      charG
    );
  } else {
    // SARI (Hijab Putih Bersih + Bros Emas & Rok Panjang Maxi)
    const sariG = new THREE.Group();
    headG.add(sariG);
    addMesh(
      new THREE.SphereGeometry(0.56, 24, 20),
      PM.white,
      0,
      0.02,
      0,
      sariG
    );
    const sDrape = addMesh(
      new THREE.ConeGeometry(0.62, 0.68, 20, 1, true),
      PM.white,
      0,
      -0.36,
      0,
      sariG
    );
    sDrape.scale.set(1.05, 1, 0.9);
    addMesh(
      new THREE.TorusGeometry(0.06, 0.02, 8, 16),
      PM.gold,
      0.24,
      -0.3,
      0.38,
      sariG
    );

    // Rok panjang maxi siswi berhijab
    addMesh(
      new THREE.CylinderGeometry(0.38, 0.64, 0.96, 16),
      PM.skirt,
      0,
      0.46,
      0,
      charG
    );
  }

  // ----- 5. TUNGKAI KAKI & SEPATU SEKOLAH -----
  const legs: THREE.Group[] = [];
  [-0.14, 0.14].forEach((lx) => {
    const lg = new THREE.Group();
    lg.position.set(lx, 0.73, 0);
    charG.add(lg);
    if (charIdx === 0) {
      addMesh(
        new THREE.CylinderGeometry(0.16, 0.15, 0.6, 12),
        PM.pa,
        0,
        -0.3,
        0,
        lg
      );
    } else if (charIdx === 1) {
      // Rani: kaos kaki putih siswi
      addMesh(
        new THREE.CylinderGeometry(0.13, 0.13, 0.35, 12),
        PM.white,
        0,
        -0.35,
        0,
        lg
      );
    } else {
      // Sari: rok panjang menutupi kaki
      addMesh(
        new THREE.CylinderGeometry(0.14, 0.13, 0.4, 12),
        PM.pa,
        0,
        -0.3,
        0,
        lg
      );
    }
    // Sepatu hitam dengan sol putih
    addMesh(
      new THREE.BoxGeometry(0.28, 0.17, 0.46),
      PM.shoes,
      0,
      -0.65,
      0.08,
      lg
    );
    addMesh(
      new THREE.BoxGeometry(0.3, 0.06, 0.48),
      PM.white,
      0,
      -0.72,
      0.08,
      lg
    );
    legs.push(lg);
  });

  // ----- 6. LENGAN & TANGAN -----
  const arms: THREE.Group[] = [];
  [-1, 1].forEach((s) => {
    const ag = new THREE.Group();
    ag.position.set(s * 0.5, 1.38, 0);
    charG.add(ag);
    addMesh(
      new THREE.CylinderGeometry(0.115, 0.1, 0.66, 12),
      PM.j,
      0,
      -0.33,
      0,
      ag
    );
    addMesh(new THREE.SphereGeometry(0.14, 12, 10), PM.j, 0, 0, 0, ag);
    addMesh(new THREE.SphereGeometry(0.12, 12, 10), PM.k, 0, -0.74, 0, ag);
    arms.push(ag);
  });

  return { group, charG, legs, arms, headG, ring, topPlat, basePlat };
}

/* ============================================================
   Dekorasi Lingkungan 3D (Pohon, Jalan Melengkung, Banner, Gems)
   ============================================================ */
function buildEnvironment(scene: THREE.Scene) {
  const M = (hex: number) =>
    new THREE.MeshLambertMaterial({ color: hex });

  // 1. Lapangan / Rumput luas
  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 40),
    M(0x75be48)
  );
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = -0.01;
  scene.add(grass);

  // 2. Jalan lengkung paving di halaman (Plaza setengah lingkaran)
  const courtGeo = new THREE.RingGeometry(2.4, 7.5, 48, 1, 0, Math.PI);
  const courtMat = M(0xeadecb);
  const court = new THREE.Mesh(courtGeo, courtMat);
  court.rotation.x = -Math.PI / 2;
  court.position.set(0, 0.01, 1.8);
  scene.add(court);

  // Jalan lurus ke depan
  const road = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 12), M(0xeadecb));
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.012, 5.5);
  scene.add(road);

  // 3. Pohon Cemara & Pohon Rindang Low-Poly
  const treePositions = [
    [-6.8, -3.2, "pine"],
    [-5.6, -1.0, "pine"],
    [-6.9, 1.8, "round"],
    [-5.8, 3.8, "pine"],
    [6.8, -3.2, "pine"],
    [5.6, -1.0, "round"],
    [6.9, 1.8, "pine"],
    [5.8, 3.8, "round"],
    [-8.2, 0, "pine"],
    [8.2, 0, "pine"],
  ];

  treePositions.forEach(([tx, tz, type]) => {
    const tg = new THREE.Group();
    tg.position.set(tx as number, 0, tz as number);
    scene.add(tg);

    // Batang pohon coklat
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.26, 1.1, 7),
      M(0x70482b)
    );
    trunk.position.y = 0.55;
    tg.add(trunk);

    if (type === "pine") {
      // Pohon cemara bertingkat
      [1.05, 0.6, 0.2].forEach((yy, j) => {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(1.0 - j * 0.12, 1.3 - j * 0.1, 7),
          M(j === 0 ? 0x339b4b : j === 1 ? 0x27823c : 0x1d6a2f)
        );
        cone.position.y = 1.25 + yy;
        tg.add(cone);
      });
    } else {
      // Pohon bundar rindang
      const leaves = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.1, 1),
        M(0x42ab54)
      );
      leaves.position.y = 1.9;
      tg.add(leaves);
    }
  });

  // 4. Tiang Kayu & Tali Bendera Bunting Warna-Warni
  [-4.8, 4.8].forEach((px) => {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 5.2, 8),
      M(0x5c3a21)
    );
    pole.position.set(px, 2.6, -1.2);
    scene.add(pole);
    // Ujung tiang bola emas
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), M(0xffc83d));
    ball.position.set(px, 5.25, -1.2);
    scene.add(ball);
  });

  // Palang / tali atas
  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(9.8, 0.12, 0.12),
    M(0x6e4628)
  );
  beam.position.set(0, 5.0, -1.2);
  scene.add(beam);

  // Bendera segitiga warna-warni (Bunting flags)
  const flagColors = [
    0xe4572e, 0xf39c12, 0x2ecc71, 0x3498db, 0x9b59b6, 0xe4572e, 0xf39c12,
    0x2ecc71, 0x3498db,
  ];
  flagColors.forEach((col, i) => {
    const tri = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 0.48, 3),
      M(col)
    );
    const fx = (i / (flagColors.length - 1) - 0.5) * 8.6;
    tri.position.set(fx, 4.65, -1.18);
    tri.rotation.z = Math.PI;
    scene.add(tri);
  });

  // 5. Permata Berkilau (Gems) Mengambang di Sekitar Podium
  const gemColors = [
    0xff69b4, 0x9b59b6, 0xffc83d, 0x3498db, 0x2ecc71, 0xff7043,
  ];
  const gemPositions = [
    [-4.2, 0.8],
    [-3.6, 2.8],
    [-1.6, 3.4],
    [1.6, 3.4],
    [3.6, 2.8],
    [4.2, 0.8],
    [-2.8, -1.8],
    [2.8, -1.8],
    [-4.8, -1.2],
    [4.8, -1.2],
  ];

  gemPositions.forEach(([gx, gz], i) => {
    const gemGeo = new THREE.OctahedronGeometry(0.18 + (i % 3) * 0.05, 0);
    const gemMat = new THREE.MeshLambertMaterial({
      color: gemColors[i % gemColors.length],
    });
    const gem = new THREE.Mesh(gemGeo, gemMat);
    gem.position.set(gx, 0.25, gz);
    gem.userData.isGem = true;
    gem.userData.seed = i;
    scene.add(gem);
  });
}

/* ============================================================
   Komponen Utama: CharacterSelect
   ============================================================ */
export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  selectedIndex,
  onSelect,
  onStart,
  onQuickProfile,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const charsRef = useRef<ReturnType<typeof buildCharacter>[]>([]);
  const [selIdx, setSelIdx] = useState(selectedIndex);
  const selIdxRef = useRef(selectedIndex);

  // Sync state dengan parent prop
  useEffect(() => {
    setSelIdx(selectedIndex);
    selIdxRef.current = selectedIndex;
  }, [selectedIndex]);

  /* ---- Navigasi Keyboard ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        const next = (selIdxRef.current - 1 + CHARS.length) % CHARS.length;
        selIdxRef.current = next;
        setSelIdx(next);
        onSelect(next);
        sfx("click");
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        const next = (selIdxRef.current + 1) % CHARS.length;
        selIdxRef.current = next;
        setSelIdx(next);
        onSelect(next);
        sfx("click");
      } else if (e.key === "Enter" || e.key === " ") {
        onStart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSelect, onStart]);

  /* ---- Three.js 3D Viewport ---- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.setClearColor(0x8cd3ff, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x8cd3ff, 18, 38);

    // Kamera ditempatkan pas di depan 3 podium
    const camera = new THREE.PerspectiveCamera(
      48,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      60
    );
    camera.position.set(0, 2.5, 7.8);
    camera.lookAt(0, 1.45, 0);

    // SISTEM PENCAHAYAAN CERAH & SEGAR (ANTI MUDDY / GELAP)
    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambient);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x8ec862, 0.85);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfffaec, 1.25);
    sun.position.set(6, 14, 8);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xbadfff, 0.55);
    fill.position.set(-6, 8, 6);
    scene.add(fill);

    // Bangun Lingkungan 3D
    buildEnvironment(scene);

    // Bangun 3 Karakter di podium masing-masing
    // Posisi x: Naufal = -2.75, Rani = 0, Sari = 2.75
    const positions = [-2.75, 0, 2.75];
    charsRef.current = CHARS.map((_, i) =>
      buildCharacter(scene, positions[i], i, i === selIdxRef.current)
    );

    // Klik langsung pada karakter di layar 3D (Raycasting)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      charsRef.current.forEach((ch, i) => {
        const intersects = raycaster.intersectObjects(ch.group.children, true);
        if (intersects.length > 0) {
          sfx("click");
          setSelIdx(i);
          selIdxRef.current = i;
          onSelect(i);
        }
      });
    };
    canvas.addEventListener("click", handleCanvasClick);

    // Render loop animasi
    let t = 0;
    let lastTime = performance.now();

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      t += dt;

      const curSel = selIdxRef.current;

      // Update setiap karakter
      charsRef.current.forEach((ch, i) => {
        const isSel = i === curSel;

        // Ring emas menyala & berdenyut pada karakter terpilih
        (ch.ring.material as THREE.MeshBasicMaterial).opacity = isSel
          ? 0.75 + Math.sin(t * 5) * 0.25
          : 0;

        // Platform sedikit naik jika terpilih
        const targetPlatScale = isSel ? 1.04 : 1.0;
        ch.topPlat.scale.lerp(
          new THREE.Vector3(targetPlatScale, 1, targetPlatScale),
          0.1
        );

        // Ayunan tubuh / idle breathing
        const b = Math.sin(t * 2 + i * 1.5);
        ch.charG.position.y = 0.4 + (isSel ? Math.abs(b) * 0.04 : 0);

        // Karakter sedikit menoleh menghadap pemain
        if (isSel) {
          ch.group.rotation.y = Math.sin(t * 1.2) * 0.08;
        } else {
          ch.group.rotation.y = Math.sin(t * 0.8 + i) * 0.05;
        }

        // Lengan kiri santai
        if (ch.arms[0]) {
          ch.arms[0].rotation.z = -0.1 - b * 0.03;
          ch.arms[0].rotation.x = Math.sin(t * 1.5 + i) * 0.05;
        }

        // Lengan kanan melambai menyapa JIKA karakter sedang dipilih!
        if (ch.arms[1]) {
          if (isSel) {
            // Melambaikan tangan menyapa ceria
            ch.arms[1].rotation.z = 2.4 + Math.sin(t * 8) * 0.35;
            ch.arms[1].rotation.x = Math.cos(t * 8) * 0.15;
          } else {
            // Santai di samping badan
            ch.arms[1].rotation.z = 0.1 + b * 0.03;
            ch.arms[1].rotation.x = -Math.sin(t * 1.5 + i) * 0.05;
          }
        }

        // Kepala mengangguk ramah
        if (ch.headG) {
          ch.headG.rotation.y = isSel
            ? Math.sin(t * 1.5) * 0.1
            : Math.sin(t * 0.9 + i) * 0.04;
        }
      });

      // Animasi permata mengambang dan berputar
      scene.traverse((o) => {
        if (o.userData.isGem) {
          const s = o.userData.seed;
          o.position.y = 0.28 + Math.sin(t * 2.2 + s) * 0.08;
          o.rotation.y += 0.025;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      if (w < h) {
        // Layar smartphone portrait: mundurkan kamera & sesuaikan FOV agar ketiga podium karakter tampak utuh
        camera.fov = Math.min(74, 48 * (h / w) * 0.58);
        camera.position.set(0, 2.7, 9.8);
      } else {
        camera.fov = 48;
        camera.position.set(0, 2.5, 7.8);
      }
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    onResize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("click", handleCanvasClick);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      renderer.dispose();
    };
  }, []);

  const cur = CHARS[selIdx];

  const handleSelect = (i: number) => {
    sfx("click");
    setSelIdx(i);
    selIdxRef.current = i;
    onSelect(i);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20,
        fontFamily: "'Baloo 2', 'Nunito', system-ui, sans-serif",
        userSelect: "none",
        pointerEvents: "none",
      }}
    >
      {/* 3D Canvas Background */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "auto",
        }}
      />

      {/* ============================================================
          HEADER: BADGE + TITLE BESAR DENGAN DROP SHADOW MEWAH
          ============================================================ */}
      <div
        style={{
          position: "absolute",
          top: "calc(16px + env(safe-area-inset-top, 0px))",
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          textAlign: "center",
        }}
      >
        {/* Pill Badge */}
        <div
          style={{
            background: "rgba(15, 35, 55, 0.88)",
            color: "#ffc83d",
            borderRadius: 999,
            padding: "5px 18px",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 1.8,
            textTransform: "uppercase",
            border: "1.5px solid rgba(255, 200, 61, 0.4)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
            backdropFilter: "blur(6px)",
          }}
        >
          INTERACTIVE 3D &amp; AUGMENTED REALITY
        </div>

        {/* Big Title */}
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(30px, 5.5vw, 54px)",
            fontWeight: 900,
            color: "#ffffff",
            textShadow:
              "0 3px 0 #1a3a5a, 0 6px 16px rgba(0, 0, 0, 0.55), 0 0 24px rgba(255, 255, 255, 0.3)",
            letterSpacing: -0.5,
            lineHeight: 1.1,
          }}
        >
          SMA Cahaya Nusantara
        </h1>

        {/* Speech Card / Dialog Box */}
        <div
          style={{
            marginTop: 6,
            background: "rgba(10, 24, 40, 0.84)",
            color: "#e8f4ff",
            borderRadius: 18,
            padding: "10px 22px",
            maxWidth: "min(560px, 90vw)",
            fontSize: "clamp(13px, 2vw, 15px)",
            fontWeight: 600,
            lineHeight: 1.5,
            border: "1.5px solid rgba(100, 180, 255, 0.28)",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(8px)",
          }}
          dangerouslySetInnerHTML={{ __html: cur.intro }}
        />
      </div>

      {/* ============================================================
          FOOTER CONTROLS: 3 CHARACTER CARDS + MULAI JELAJAH BUTTON
          ============================================================ */}
      <div
        style={{
          position: "absolute",
          bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          padding: "0 16px",
        }}
      >
        {/* 3 Character Cards Row */}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            width: "min(680px, 96vw)",
            pointerEvents: "auto",
          }}
        >
          {CHARS.map((ch, i) => {
            const isSel = i === selIdx;
            const jacketHex =
              "#" + ch.jacketColor.toString(16).padStart(6, "0");

            return (
              <button
                key={ch.name}
                onClick={() => handleSelect(i)}
                style={{
                  flex: 1,
                  background: isSel
                    ? "rgba(15, 38, 64, 0.92)"
                    : "rgba(12, 26, 42, 0.76)",
                  border: isSel
                    ? "2.5px solid #ffc83d"
                    : "2px solid rgba(100, 160, 220, 0.28)",
                  borderRadius: 16,
                  padding: "10px 14px",
                  color: "#ffffff",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  backdropFilter: "blur(8px)",
                  boxShadow: isSel
                    ? "0 0 24px rgba(255, 200, 61, 0.4), 0 6px 18px rgba(0,0,0,0.3)"
                    : "0 4px 12px rgba(0,0,0,0.25)",
                  transform: isSel ? "translateY(-4px)" : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: jacketHex,
                      border: "2px solid rgba(255, 255, 255, 0.6)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'Baloo 2', sans-serif",
                      fontSize: 17,
                      fontWeight: 800,
                      color: isSel ? "#ffc83d" : "#ffffff",
                    }}
                  >
                    {ch.name}
                  </span>
                  {isSel && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 11,
                        background: "#ffc83d",
                        color: "#2b2100",
                        padding: "1px 7px",
                        borderRadius: 99,
                        fontWeight: 800,
                      }}
                    >
                      DIPILIH
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: isSel ? "#d4e9ff" : "rgba(200, 225, 250, 0.72)",
                    lineHeight: 1.35,
                    fontWeight: 500,
                  }}
                >
                  {ch.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Big Explore Button */}
        <button
          onClick={() => {
            sfx("click");
            onStart();
          }}
          style={{
            pointerEvents: "auto",
            background: "linear-gradient(90deg, #ffc83d 0%, #ff7043 100%)",
            color: "#1e1600",
            border: "none",
            borderRadius: 999,
            padding: "13px 52px",
            fontSize: 21,
            fontWeight: 900,
            fontFamily: "'Baloo 2', sans-serif",
            cursor: "pointer",
            boxShadow:
              "0 6px 24px rgba(255, 112, 67, 0.5), 0 2px 6px rgba(0,0,0,0.25)",
            letterSpacing: 0.5,
            transition: "transform 0.15s, box-shadow 0.15s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform =
              "translateY(-3px) scale(1.04)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 10px 30px rgba(255, 112, 67, 0.7)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "none";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 6px 24px rgba(255, 112, 67, 0.5)";
          }}
        >
          Mulai Jelajah
        </button>

        {/* Footer Subtext Links */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            pointerEvents: "auto",
          }}
        >
          <button
            onClick={() => {
              sfx("click");
              onQuickProfile();
            }}
            style={{
              background: "none",
              border: "none",
              color: "#fffae8",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "underline",
              cursor: "pointer",
              padding: "2px 6px",
              textShadow: "0 1px 4px rgba(0,0,0,0.6)",
            }}
          >
            Buru-buru? Lihat profil sekolah dalam 30 detik →
          </button>
          <div
            style={{
              color: "rgba(255, 255, 255, 0.75)",
              fontSize: 11.5,
              fontWeight: 600,
              textShadow: "0 1px 3px rgba(0,0,0,0.7)",
              pointerEvents: "none",
            }}
          >
            ← → pilih karakter · Enter untuk mulai · Atau klik langsung karakter 3D
          </div>
        </div>
      </div>
    </div>
  );
};
