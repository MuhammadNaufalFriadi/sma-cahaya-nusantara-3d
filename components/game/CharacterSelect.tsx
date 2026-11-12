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
   Mini helper to build a low-poly character on a pedestal
   ============================================================ */
function buildCharacter(
  scene: THREE.Scene,
  x: number,
  charIdx: number,
  selected: boolean
) {
  const c = CHARS[charIdx];
  const isFemale = charIdx > 0;
  const hasHijab = charIdx === 2;

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

  // ----- Pedestal / Platform -----
  const platColor = selected ? 0xffc83d : 0x2a7d8e;
  const plat = addMesh(
    new THREE.CylinderGeometry(1.1, 1.3, 0.22, 32),
    M(platColor),
    0, 0.11, 0
  );
  plat.userData.pedestal = true;

  // Ring glow on selected
  const ringGeo = new THREE.TorusGeometry(1.15, 0.07, 8, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: selected ? 0xffc83d : 0x4fb8cc,
    transparent: true,
    opacity: selected ? 1 : 0.5,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0.24, 0);
  group.add(ring);

  // ----- Legs -----
  const legs: THREE.Group[] = [];
  [-0.21, 0.21].forEach((lx) => {
    const lg = new THREE.Group();
    lg.position.set(lx, 0.76, 0);
    group.add(lg);
    addMesh(
      new THREE.CylinderGeometry(0.14, 0.12, 0.6, 12),
      M(isFemale ? 0xffffff : 0x222222),
      0, -0.3, 0, lg
    );
    addMesh(
      new THREE.BoxGeometry(0.3, 0.14, 0.42),
      M(0x222222),
      0, -0.65, 0.07, lg
    );
    if (isFemale && !hasHijab) {
      // Pleated skirt segment on each leg
      addMesh(
        new THREE.CylinderGeometry(0.14, 0.17, 0.2, 12),
        M(charIdx === 1 ? 0x9b2d3c : 0x1d6640),
        0, -0.05, 0, lg
      );
    }
    legs.push(lg);
  });

  // ----- Skirt for female characters (Rani & Sari) -----
  if (isFemale) {
    addMesh(
      new THREE.CylinderGeometry(0.52, 0.72, 0.52, 20),
      M(charIdx === 1 ? 0xa02840 : 0x1a5c38),
      0, 0.72, 0
    );
  }

  // ----- Torso -----
  const torso = addMesh(
    new THREE.CylinderGeometry(0.42, 0.37, 0.76, 16),
    M(c.jacketColor),
    0, 1.14, 0
  );
  torso.scale.z = 0.82;

  // Collar / badge
  addMesh(
    new THREE.BoxGeometry(0.28, 0.14, 0.07),
    M(0xf1f1f1),
    0, 1.42, 0.37
  );

  // ----- Arms -----
  const arms: THREE.Group[] = [];
  [-1, 1].forEach((s) => {
    const ag = new THREE.Group();
    ag.position.set(s * 0.5, 1.4, 0);
    group.add(ag);
    addMesh(
      new THREE.CylinderGeometry(0.11, 0.1, 0.62, 12),
      M(c.jacketColor),
      0, -0.31, 0, ag
    );
    addMesh(
      new THREE.SphereGeometry(0.12, 10, 8),
      M(c.skinColor),
      0, -0.65, 0, ag
    );
    arms.push(ag);
  });

  // ----- Head -----
  const headG = new THREE.Group();
  headG.position.set(0, 1.72, 0);
  group.add(headG);

  // Face
  addMesh(
    new THREE.SphereGeometry(0.3, 16, 12),
    M(c.skinColor),
    0, 0, 0, headG
  );

  // Eyes
  [-0.1, 0.1].forEach((ex) => {
    addMesh(
      new THREE.SphereGeometry(0.05, 8, 6),
      M(0x222222),
      ex, 0.06, 0.26, headG
    );
    addMesh(
      new THREE.SphereGeometry(0.025, 6, 4),
      M(0xffffff),
      ex + 0.015, 0.075, 0.3, headG
    );
  });

  // Smile
  const smileGeo = new THREE.TorusGeometry(0.1, 0.018, 6, 12, Math.PI);
  const smileMesh = new THREE.Mesh(smileGeo, M(0x993322));
  smileMesh.position.set(0, -0.07, 0.28);
  smileMesh.rotation.set(0, 0, Math.PI);
  headG.add(smileMesh);

  // ----- Hair / Hijab -----
  if (hasHijab) {
    // Hijab
    addMesh(
      new THREE.SphereGeometry(0.33, 14, 10),
      M(0xf0f0f0),
      0, 0.04, 0, headG
    );
    addMesh(
      new THREE.CylinderGeometry(0.32, 0.38, 0.28, 14),
      M(0xf0f0f0),
      0, -0.22, 0, headG
    );
  } else if (isFemale) {
    // Ponytail
    addMesh(
      new THREE.SphereGeometry(0.3, 14, 10),
      M(c.hairColor),
      0, 0.04, 0, headG
    );
    // Ponytail back
    addMesh(
      new THREE.CapsuleGeometry(0.1, 0.35, 6, 8),
      M(c.hairColor),
      0, -0.08, -0.26, headG
    );
    // Hair bow (Rani only)
    if (charIdx === 1) {
      addMesh(
        new THREE.TorusGeometry(0.1, 0.045, 6, 10),
        M(0xff6fa0),
        0.2, 0.3, -0.05, headG
      );
    }
  } else {
    // Boy hair
    addMesh(
      new THREE.SphereGeometry(0.3, 14, 10),
      M(c.hairColor),
      0, 0.08, 0, headG
    );
    // Spiky bits
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2 - 0.4;
      addMesh(
        new THREE.ConeGeometry(0.07, 0.22, 6),
        M(c.hairColor),
        Math.cos(ang) * 0.18, 0.28 + (i % 2) * 0.04, Math.sin(ang) * 0.18,
        headG
      );
    }
  }

  // Add outline glow pass (backside scale)
  // PENTING: kumpulkan mesh dulu, BARU tambahkan outline setelah traverse selesai
  // agar tidak terjadi infinite recursion (stack overflow)
  const meshesToOutline: THREE.Mesh[] = [];
  group.traverse((o) => {
    if (
      (o as THREE.Mesh).isMesh &&
      !o.userData.pedestal &&
      !o.userData.ol &&
      (o as THREE.Mesh).material
    ) {
      meshesToOutline.push(o as THREE.Mesh);
    }
  });
  meshesToOutline.forEach((o) => {
    const outline = new THREE.Mesh(
      o.geometry,
      new THREE.MeshBasicMaterial({
        color: 0x1a1210,
        side: THREE.BackSide,
      })
    );
    outline.scale.setScalar(1.06);
    outline.userData.ol = true;
    o.add(outline);
  });

  return { group, legs, arms, headG, ring, plat };
}

/* ============================================================
   Scatter decorative gems around the scene
   ============================================================ */
function scatterGems(scene: THREE.Scene) {
  const gemColors = [0xff69b4, 0x9b59b6, 0xffc83d, 0x3498db, 0xffffff, 0x2ecc71];
  const positions = [
    [-4.5, -1.8], [-3.2, 1.6], [3.5, -1.9], [4.8, 1.4],
    [-5.5, 0.6], [5.2, 0.3], [-2.1, -2.4], [2.3, 2.1],
    [-6.0, -2.2], [6.1, 1.8],
  ];
  positions.forEach(([px, pz], i) => {
    const geo = new THREE.OctahedronGeometry(0.18 + (i % 3) * 0.06, 0);
    const mat = new THREE.MeshLambertMaterial({ color: gemColors[i % gemColors.length] });
    const gem = new THREE.Mesh(geo, mat);
    gem.position.set(px, 0.2, pz);
    gem.rotation.y = Math.random() * Math.PI;
    gem.userData.gem = true;
    scene.add(gem);
  });
}

/* ============================================================
   Build background trees (low-poly cones)
   ============================================================ */
function buildTrees(scene: THREE.Scene) {
  const treePos = [
    [-7, -4], [-6, -2], [-7, 2], [-6, 4],
    [7, -4], [6, -2], [7, 2], [6, 4],
    [-8, 0], [8, 0],
  ];
  treePos.forEach(([tx, tz]) => {
    const g = new THREE.Group();
    g.position.set(tx, 0, tz);
    scene.add(g);
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.9, 7),
      new THREE.MeshLambertMaterial({ color: 0x7a4f2d })
    );
    trunk.position.y = 0.45;
    g.add(trunk);
    [0.9, 0.5, 0.15].forEach((yy, j) => {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.9 - j * 0.1, 1.2 - j * 0.1, 7),
        new THREE.MeshLambertMaterial({ color: j === 0 ? 0x3aab55 : j === 1 ? 0x2e9344 : 0x1f7a32 })
      );
      cone.position.y = 1.1 + yy;
      g.add(cone);
    });
  });
}

/* ============================================================
   Build bunting/flag banner
   ============================================================ */
function buildBunting(scene: THREE.Scene) {
  const colors = [0xe74c3c, 0xf39c12, 0x2ecc71, 0x3498db, 0x9b59b6, 0xe74c3c, 0xf39c12];
  colors.forEach((col, i) => {
    const tri = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.4, 3),
      new THREE.MeshLambertMaterial({ color: col })
    );
    const t = (i / (colors.length - 1)) - 0.5;
    tri.position.set(t * 7, 4.1 + Math.abs(t) * 0.6, -1.5);
    tri.rotation.z = Math.PI;
    scene.add(tri);
    // Rope (thin cylinder connecting flags)
    if (i < colors.length - 1) {
      const rope = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 1.0, 4),
        new THREE.MeshBasicMaterial({ color: 0x8b7355 })
      );
      rope.position.set((t + (1 / (colors.length - 1)) * 0.5) * 7, 4.1 + Math.abs(t + 0.05) * 0.6, -1.5);
      rope.rotation.z = 0.1 * (i - colors.length / 2);
      scene.add(rope);
    }
  });
}

/* ============================================================
   Build road / path
   ============================================================ */
function buildPath(scene: THREE.Scene) {
  // Ground plane
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 20),
    new THREE.MeshLambertMaterial({ color: 0x7ec850 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  scene.add(ground);

  // Path
  const path = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 20),
    new THREE.MeshLambertMaterial({ color: 0xd4c4a0 })
  );
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.005, 2);
  scene.add(path);

  // Sky gradient sphere (inside)
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(40, 24, 12),
    new THREE.MeshBasicMaterial({ color: 0xb0d9f0, side: THREE.BackSide })
  );
  scene.add(sky);
}

/* ============================================================
   Main Component
   ============================================================ */
export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  selectedIndex,
  onSelect,
  onStart,
  onQuickProfile,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rafRef = useRef<number | null>(null);
  const charsRef = useRef<ReturnType<typeof buildCharacter>[]>([]);
  const [selIdx, setSelIdx] = useState(selectedIndex);
  const selIdxRef = useRef(selectedIndex);

  // Sync external prop
  useEffect(() => {
    setSelIdx(selectedIndex);
    selIdxRef.current = selectedIndex;
  }, [selectedIndex]);

  /* ---- keyboard navigation ---- */
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

  /* ---- Three.js scene ---- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.shadowMap.enabled = false;
    renderer.setClearColor(0x87ceeb, 1);

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.Fog(0x87ceeb, 14, 28);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      52,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      60
    );
    camera.position.set(0, 2.6, 7.5);
    camera.lookAt(0, 1.3, 0);

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x7ec850, 0.95);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff5e0, 1.1);
    sun.position.set(5, 10, 6);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xddeeff, 0.4);
    fill.position.set(-5, 4, -4);
    scene.add(fill);

    // World
    buildPath(scene);
    buildTrees(scene);
    scatterGems(scene);
    buildBunting(scene);

    // Characters  x positions: Naufal=-2.1, Rani=0, Sari=2.1
    const positions = [-2.3, 0, 2.3];
    charsRef.current = CHARS.map((_, i) =>
      buildCharacter(scene, positions[i], i, i === selIdxRef.current)
    );

    let t = 0;
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const dt = 0.016;
      t += dt;

      const curSel = selIdxRef.current;

      // Update each character
      charsRef.current.forEach((ch, i) => {
        const isSel = i === curSel;

        // Update pedestal color
        (ch.plat.material as THREE.MeshLambertMaterial).color.setHex(
          isSel ? 0xffc83d : 0x2a7d8e
        );
        (ch.ring.material as THREE.MeshBasicMaterial).color.setHex(
          isSel ? 0xffc83d : 0x4fb8cc
        );
        (ch.ring.material as THREE.MeshBasicMaterial).opacity = isSel ? 1 : 0.4;

        // Platform glow pulse for selected
        const scale = isSel ? 1 + Math.sin(t * 3) * 0.03 : 1;
        ch.plat.scale.setScalar(scale);
        ch.ring.scale.setScalar(scale);

        // Idle breathing / gentle sway
        const b = Math.sin(t * 1.8 + i * 1.2);
        ch.group.position.y = Math.sin(t * 1.4 + i) * 0.04;
        ch.group.rotation.y = isSel
          ? Math.sin(t * 0.6) * 0.15
          : Math.sin(t * 0.4 + i * 1.5) * 0.08;

        // Arm sway
        if (ch.arms[0]) ch.arms[0].rotation.z = -0.12 - b * 0.025;
        if (ch.arms[1]) {
          if (isSel) {
            // Wave!
            ch.arms[1].rotation.z = 2.4 + Math.sin(t * 8) * 0.35;
          } else {
            ch.arms[1].rotation.z = 0.12 + b * 0.025;
          }
        }

        // Head nod
        if (ch.headG) {
          ch.headG.rotation.y = isSel
            ? Math.sin(t * 1.2) * 0.12
            : Math.sin(t * 0.9 + i) * 0.06;
        }

        // Gem float
      });

      // Float gems
      scene.traverse((o) => {
        if (o.userData.gem) {
          o.position.y = 0.2 + Math.sin(t * 2 + o.position.x) * 0.08;
          o.rotation.y += 0.02;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const onResize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      renderer.dispose();
    };
  }, []);

  /* ---- Update selection highlight without rebuilding ---- */
  useEffect(() => {
    selIdxRef.current = selIdx;
  }, [selIdx]);

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
      }}
    >
      {/* 3D Background Canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />

      {/* Top Banner label */}
      <div
        style={{
          position: "absolute",
          top: 18,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(15,30,50,0.85)",
          color: "#b0d9f0",
          borderRadius: 999,
          padding: "4px 18px",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          border: "1.5px solid rgba(100,180,255,0.3)",
          pointerEvents: "none",
        }}
      >
        Website Sekolah Interaktif &amp; Augmented Reality
      </div>

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 52,
          left: 0,
          right: 0,
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(28px, 6vw, 56px)",
            fontWeight: 900,
            color: "#ffffff",
            textShadow: "0 3px 16px rgba(0,0,0,0.6), 0 1px 0 #0005",
            letterSpacing: -0.5,
          }}
        >
          SMA Cahaya Nusantara
        </h1>
      </div>

      {/* Description box — centered over canvas */}
      <div
        style={{
          position: "absolute",
          top: "14%",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(10,22,36,0.82)",
          color: "#e8f4ff",
          borderRadius: 16,
          padding: "14px 24px",
          maxWidth: "min(480px, 88vw)",
          textAlign: "center",
          lineHeight: 1.55,
          fontSize: 15,
          fontWeight: 500,
          backdropFilter: "blur(6px)",
          border: "1.5px solid rgba(100,180,255,0.18)",
          pointerEvents: "none",
        }}
        dangerouslySetInnerHTML={{ __html: cur.intro }}
      />

      {/* Character cards row */}
      <div
        style={{
          position: "absolute",
          bottom: "calc(100px + env(safe-area-inset-bottom, 0px))",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 12,
          justifyContent: "center",
          alignItems: "stretch",
          width: "min(600px, 94vw)",
        }}
      >
        {CHARS.map((ch, i) => {
          const isSel = i === selIdx;
          return (
            <button
              key={ch.name}
              onClick={() => handleSelect(i)}
              style={{
                flex: 1,
                background: isSel
                  ? "rgba(255,200,61,0.18)"
                  : "rgba(10,22,36,0.72)",
                border: `2.5px solid ${isSel ? "#ffc83d" : "rgba(100,180,255,0.25)"}`,
                borderRadius: 16,
                padding: "12px 14px",
                color: "#fff",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.18s ease",
                backdropFilter: "blur(6px)",
                boxShadow: isSel
                  ? "0 0 20px rgba(255,200,61,0.3)"
                  : "none",
                transform: isSel ? "translateY(-3px)" : "none",
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
                    background:
                      "#" + ch.jacketColor.toString(16).padStart(6, "0"),
                    border: "2px solid rgba(255,255,255,0.4)",
                    flexShrink: 0,
                  }}
                />
                <strong
                  style={{
                    fontFamily: "'Baloo 2', sans-serif",
                    fontSize: 16,
                    fontWeight: 800,
                    color: isSel ? "#ffc83d" : "#fff",
                  }}
                >
                  {ch.name}
                </strong>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(200,230,255,0.75)",
                  lineHeight: 1.4,
                }}
              >
                {ch.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Explore / Mulai Button */}
      <button
        onClick={() => {
          sfx("click");
          onStart();
        }}
        style={{
          position: "absolute",
          bottom: "calc(50px + env(safe-area-inset-bottom, 0px))",
          left: "50%",
          transform: "translateX(-50%)",
          background: "linear-gradient(90deg, #ffc83d 0%, #ff8a65 100%)",
          color: "#2b2100",
          border: "none",
          borderRadius: 999,
          padding: "14px 48px",
          fontSize: 20,
          fontWeight: 900,
          fontFamily: "'Baloo 2', sans-serif",
          cursor: "pointer",
          boxShadow: "0 6px 24px rgba(255,138,101,0.5)",
          letterSpacing: 0.5,
          transition: "transform 0.15s, box-shadow 0.15s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform =
            "translateX(-50%) translateY(-3px) scale(1.04)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 10px 32px rgba(255,138,101,0.65)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform =
            "translateX(-50%)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 6px 24px rgba(255,138,101,0.5)";
        }}
      >
        Mulai Jelajah
      </button>

      {/* Bottom hints */}
      <div
        style={{
          position: "absolute",
          bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
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
            color: "rgba(200,230,255,0.65)",
            fontSize: 13,
            textDecoration: "underline",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Buru-buru? Lihat profil sekolah dalam 30 detik →
        </button>
        <div
          style={{
            color: "rgba(180,210,255,0.5)",
            fontSize: 11,
            pointerEvents: "none",
          }}
        >
          ← → pilih karakter · Enter untuk mulai
        </div>
      </div>
    </div>
  );
};
