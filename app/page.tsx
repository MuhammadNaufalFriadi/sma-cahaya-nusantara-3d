"use client";

import dynamic from "next/dynamic";

const GameContainer = dynamic(
  () =>
    import("@/components/game/GameContainer").then((mod) => mod.GameContainer),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b1230",
          color: "#fff",
          fontFamily: '"Baloo 2", sans-serif',
        }}
      >
        <div style={{ fontSize: "52px", marginBottom: "16px" }}>🏫</div>
        <h2 style={{ fontSize: "24px", color: "#ffc83d", margin: 0 }}>
          Memuat SMA Cahaya Nusantara...
        </h2>
        <p style={{ color: "#a9c2b6", fontSize: "14px", marginTop: "8px" }}>
          Menyiapkan dunia 3D & Augmented Reality
        </p>
      </div>
    ),
  }
);

export default function HomePage() {
  return (
    <main style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <GameContainer />
    </main>
  );
}

