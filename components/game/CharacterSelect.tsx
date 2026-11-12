"use client";

import React from "react";
import { CHARS } from "@/lib/constants";
import { sfx } from "@/lib/audio";

interface CharacterSelectProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
  onStart: () => void;
  onQuickProfile: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  selectedIndex,
  onSelect,
  onStart,
  onQuickProfile,
}) => {
  const cur = CHARS[selectedIndex];

  return (
    <div id="sel">
      <div id="sh">
        <span className="bd">Website sekolah interaktif & Augmented Reality</span>
        <h1>SMA Cahaya Nusantara</h1>
        <div
          id="sb"
          dangerouslySetInnerHTML={{ __html: cur.intro }}
        />
      </div>

      <div className="cd">
        <ol className="sp">
          <li>Pilih karakter</li>
          <li>Masuk melewati gerbang utama</li>
          <li>Kunjungi gedung & kumpulkan fakta</li>
        </ol>

        <div className="ch">
          {CHARS.map((char, i) => (
            <button
              key={char.name}
              className={i === selectedIndex ? "on" : ""}
              onClick={() => {
                sfx("click");
                onSelect(i);
              }}
            >
              <i
                style={{
                  background: "#" + char.jacketColor.toString(16).padStart(6, "0"),
                }}
              />
              {char.name}
              <small>{char.desc}</small>
            </button>
          ))}
        </div>

        <button
          className="big"
          onClick={() => {
            sfx("click");
            onStart();
          }}
        >
          Mulai jelajah
        </button>

        <button
          className="lk"
          onClick={() => {
            sfx("click");
            onQuickProfile();
          }}
        >
          Buru-buru? Lihat profil sekolah dalam 30 detik →
        </button>
      </div>
    </div>
  );
};

