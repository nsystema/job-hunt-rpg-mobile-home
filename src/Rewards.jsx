import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Zap } from "lucide-react";
import { Grey } from "./data.jsx";

const shadow = (t, l, d) => (t === "light" ? l : d);

export const PLACEHOLDER_CHESTS = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  xp: [10, 20],
  gold: [5, 15],
  colors: ["#9ca3af", "#6b7280"],
}));

const rand = ([min, max]) => Math.floor(Math.random() * (max - min + 1)) + min;

function ChestGraphic({ open, colors }) {
  return (
    <svg
      width="60"
      height="60"
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

function ChestCard({ chest, c, t, onOpen }) {
  const [open, setOpen] = useState(false);
  const [reward, setReward] = useState(null);

  const handleOpen = () => {
    if (open) return;
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
      className="relative p-2 rounded-xl flex flex-col items-center text-center overflow-hidden"
      style={{
        background: c.surface,
        border: `1px solid ${c.surfaceBorder}`,
        boxShadow: shadow(
          t,
          "0 8px 24px rgba(0,0,0,.12),0 2px 6px rgba(0,0,0,.06)",
          "0 8px 24px rgba(0,0,0,.46),0 2px 6px rgba(0,0,0,.30)"
        ),
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <ChestGraphic open={open} colors={chest.colors} />
      <button
        onClick={handleOpen}
        className="mt-2 px-2 py-1 rounded-lg text-[12px] font-semibold"
        style={{
          background: `linear-gradient(90deg, ${c.sky}, ${c.emerald})`,
          color: "#0f172a",
          cursor: "pointer",
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

export default function Rewards({ c, eff, gold, setGold, gainXp, chests, setChests }) {

  const openChest = (chest) => {
    const xp = rand(chest.xp);
    const g = rand(chest.gold);
    setGold((v) => v + g);
    gainXp?.(xp);
    setChests((prev) => prev.filter((cst) => cst.id !== chest.id));
    return { xp, gold: g };
  };

  const openAll = () => {
    let totalXp = 0;
    let totalGold = 0;
    chests.forEach((ch) => {
      totalXp += rand(ch.xp);
      totalGold += rand(ch.gold);
    });
    if (!chests.length) return;
    setGold((v) => v + totalGold);
    gainXp?.(totalXp);
    setChests([]);
    alert(`Gained ${totalXp} XP and ${totalGold} gold!`);
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={openAll}
          disabled={!chests.length}
          className="px-3 py-1.5 rounded-xl text-sm font-semibold"
          style={{
            background: !chests.length
              ? c.chipBg
              : `linear-gradient(90deg, ${c.sky}, ${c.emerald})`,
            color: !chests.length ? Grey : "#0f172a",
            cursor: !chests.length ? "not-allowed" : "pointer",
          }}
        >
          Open All
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {chests.map((ch) => (
          <ChestCard key={ch.id} chest={ch} c={c} t={eff} onOpen={openChest} />
        ))}
      </div>
    </div>
  );
}

