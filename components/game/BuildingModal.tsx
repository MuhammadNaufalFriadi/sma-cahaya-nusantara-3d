"use client";

import React, { useState, useEffect } from "react";
import { TabData } from "@/lib/types";
import { sfx } from "@/lib/audio";

interface BuildingModalProps {
  isOpen: boolean;
  title: string;
  tabs: TabData[];
  initialTabIndex?: number;
  onClose: () => void;
  onTabChange?: (tabIndex: number) => void;
}

export const BuildingModal: React.FC<BuildingModalProps> = ({
  isOpen,
  title,
  tabs,
  initialTabIndex = 0,
  onClose,
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState(initialTabIndex);

  useEffect(() => {
    setActiveTab(initialTabIndex);
  }, [initialTabIndex, isOpen]);

  if (!isOpen) return null;

  const currentTab = tabs[activeTab] || tabs[0];

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
          <h2>{title}</h2>
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

        {tabs.length > 1 && (
          <div id="tb">
            {tabs.map((tab, idx) => (
              <button
                key={tab.t}
                className={idx === activeTab ? "on" : ""}
                onClick={() => {
                  sfx("click");
                  setActiveTab(idx);
                  if (onTabChange) onTabChange(idx);
                }}
              >
                {tab.t}
              </button>
            ))}
          </div>
        )}

        <div
          id="bd"
          dangerouslySetInnerHTML={{ __html: currentTab?.h || "" }}
        />
      </div>
    </div>
  );
};

