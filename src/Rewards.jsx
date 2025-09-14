import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Zap } from "lucide-react";
import { Grey } from "./data.jsx";

const shadow = (t, l, d) => (t === "light" ? l : d);

const CHESTS = [
  {
    id: "wood",
    name: "Wooden Chest",
    cost: 30,
    xp: [20, 40],
    gold: [15, 30],
    colors: ["#b45309", "#92400e"],
  },
  {
    id: "silver",
    name: "Silver Chest",
    cost: 60,
    xp: [40, 70],
    gold: [30, 70],
    colors: ["#9ca3af", "#6b7280"],
  },
  {
    id: "gold",
    name: "Golden Chest",
    cost: 120,
    xp: [80, 120],
    gold: [80, 160],
    colors: ["#fbbf24", "#f59e0b"],
  },
];

const rand = ([min, max]) => Math.floor(Math.random() * (max - min + 1)) + min;

function ChestGraphic({ open, colors }) {
  return (
    <svg
      width="90"
      height="90"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="100%" stopColor={colors[1]} />
        </linearGradient>
      </defs>
      <g stroke="#000" strokeOpacity="0.2" strokeWidth="2">
        <motion.rect
          x="8"
          y="28"
          width="64"
          height="40"
          rx="6"
          fill="url(#base)"
        />
        <motion.rect
          x="8"
          y="12"
          width="64"
          height="20"
          rx="6"
          fill="url(#base)"
          animate={{ rotateX: open ? -120 : 0 }}
          origin="40px 28px"
        />
        <rect x="34" y="42" width="12" height="16" rx="2" fill="#000" fillOpacity="0.2" />
      </g>
    </svg>
  );
}

function ChestCard({ chest, c, t, onOpen, disabled }) {
  const [open, setOpen] = useState(false);
  const [reward, setReward] = useState(null);

  const handleOpen = () => {
    if (disabled || open) return;
    const r = onOpen(chest);
    if (r) {
      setReward(r);
      setOpen(true);
      setTimeout(() => {
        setOpen(false);
        setReward(null);
      }, 2000);
    }
  };

  return (
    <motion.div
      className="relative p-4 rounded-2xl flex flex-col items-center text-center overflow-hidden"
      style={{
        background: c.surface,
        border: `1px solid ${c.surfaceBorder}`,
        boxShadow: shadow(
          t,
          "0 8px 24px rgba(0,0,0,.12),0 2px 6px rgba(0,0,0,.06)",
          "0 8px 24px rgba(0,0,0,.46),0 2px 6px rgba(0,0,0,.30)"
        ),
      }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <ChestGraphic open={open} colors={chest.colors} />
      <div className="mt-2 font-semibold text-sm" style={{ color: c.text }}>
        {chest.name}
      </div>
      <div className="text-[11px] mt-1" style={{ color: Grey }}>
        Cost {chest.cost}g
      </div>
      <button
        onClick={handleOpen}
        disabled={disabled}
        className="mt-3 px-3 py-1.5 rounded-xl text-[13px] font-semibold"
        style={{
          background: disabled
            ? c.chipBg
            : `linear-gradient(90deg, ${c.sky}, ${c.emerald})`,
          color: disabled ? Grey : "#0f172a",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        Open
      </button>
      <AnimatePresence>
        {reward && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{ background: "rgba(0,0,0,.55)" }}
          >
            <div
              className="flex items-center gap-2 text-sm font-semibold"
              style={{ color: c.text }}
            >
              <Zap className="w-4 h-4" /> {reward.xp}
              <Coins className="w-4 h-4" /> {reward.gold}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Rewards({ c, eff, gold, setGold, gainXp }) {
  const openChest = (chest) => {
    if (gold < chest.cost) {
      alert("Not enough gold!");
      return null;
    }
    const xp = rand(chest.xp);
    const g = rand(chest.gold);
    setGold((v) => v - chest.cost + g);
    gainXp?.(xp);
    return { xp, gold: g };
  };
  return (
    <div className="grid gap-4">
      {CHESTS.map((ch) => (
        <ChestCard
          key={ch.id}
          chest={ch}
          c={c}
          t={eff}
          onOpen={openChest}
          disabled={gold < ch.cost}
        />
      ))}
    </div>
  );
}

