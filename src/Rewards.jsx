import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Zap, Gift } from "lucide-react";
import { Grey } from "./data.jsx";

const shadow = (t, l, d) => (t === "light" ? l : d);

// Rarity presets
const RARITIES = [
  {
    key: "Common",
    weight: 0.52,
    xp: [8, 16],
    gold: [4, 12],
    colors: ["#94a3b8", "#64748b"],
    ring: ["#94a3b8", "#64748b"],
  },
  {
    key: "Rare",
    weight: 0.3,
    xp: [14, 26],
    gold: [8, 18],
    colors: ["#60a5fa", "#38bdf8"],
    ring: ["#60a5fa", "#38bdf8"],
  },
  {
    key: "Epic",
    weight: 0.14,
    xp: [22, 40],
    gold: [14, 28],
    colors: ["#a78bfa", "#f472b6"],
    ring: ["#a78bfa", "#f472b6"],
  },
  {
    key: "Legendary",
    weight: 0.04,
    xp: [36, 64],
    gold: [24, 48],
    colors: ["#f59e0b", "#f43f5e"],
    ring: ["#f59e0b", "#f43f5e"],
  },
];

function pickRarity() {
  const r = Math.random();
  let acc = 0;
  for (const it of RARITIES) {
    acc += it.weight;
    if (r <= acc) return it;
  }
  return RARITIES[0];
}

export const PLACEHOLDER_CHESTS = Array.from({ length: 12 }, (_, i) => {
  const r = pickRarity();
  return {
    id: i,
    rarity: r.key,
    xp: r.xp,
    gold: r.gold,
    colors: r.colors,
  };
});

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
      <div className="absolute left-2 top-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{
        background: "rgba(0,0,0,.08)",
        border: `1px solid ${c.surfaceBorder}`,
        color: c.text,
      }}>
        {chest.rarity || "Common"}
      </div>
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

export default function Rewards({ c, eff, gold, setGold, gainXp, chests, setChests, effects = [] }) {
  const [filter, setFilter] = useState("All");
  const [openAllSummary, setOpenAllSummary] = useState(null);
  const [openResult, setOpenResult] = useState(null);

  const rarityKeys = ["All", ...RARITIES.map((r) => r.key)];
  const rarityCounts = useMemo(() => {
    const counts = Object.fromEntries(rarityKeys.map((k) => [k, 0]));
    for (const ch of chests) {
      counts[ch.rarity || "Common"] = (counts[ch.rarity || "Common"] || 0) + 1;
      counts["All"] = (counts["All"] || 0) + 1;
    }
    return counts;
  }, [chests]);

  const visibleChests = useMemo(
    () => chests.filter((ch) => filter === "All" || (ch.rarity || "Common") === filter),
    [chests, filter]
  );

  const goldMultiplier = useMemo(
    () => (effects.some((e) => e.id === 2) ? 2 : 1),
    [effects]
  );

  const openChest = (chest) => {
    const xp = rand(chest.xp);
    const g = Math.round(rand(chest.gold) * goldMultiplier);
    setGold((v) => v + g);
    gainXp?.(xp);
    setChests((prev) => prev.filter((cst) => cst.id !== chest.id));
    setOpenResult({ xp, gold: g });
    setTimeout(() => setOpenResult(null), 1600);
    return { xp, gold: g };
  };

  const openAll = () => {
    if (!chests.length) return;
    let totalXp = 0;
    let totalGold = 0;
    for (const ch of chests) {
      totalXp += rand(ch.xp);
      totalGold += Math.round(rand(ch.gold) * goldMultiplier);
    }
    setGold((v) => v + totalGold);
    gainXp?.(totalXp);
    const opened = chests.length;
    setChests([]);
    setOpenAllSummary({ xp: totalXp, gold: totalGold, opened });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: c.text }}>
          <Gift className="w-4 h-4" />
          <span>Chests</span>
          <span className="px-2 py-0.5 rounded-full" style={{ background: c.chipBg, border: `1px solid ${c.surfaceBorder}` }}>{chests.length}</span>
        </div>
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

      <div className="flex items-center gap-1 mb-3 overflow-x-auto" role="tablist" aria-label="Chest rarity filter">
        {rarityKeys.map((rk) => {
          const active = filter === rk;
          return (
            <button
              key={rk}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(rk)}
              className="rounded-full px-2.5 py-1 text-[12px] font-semibold"
              style={{
                background: active ? `linear-gradient(90deg, ${c.sky}, ${c.emerald})` : c.chipBg,
                color: active ? "#0f172a" : c.text,
                border: `1px solid ${c.surfaceBorder}`,
                whiteSpace: "nowrap",
              }}
            >
              {rk} <span className="opacity-80">{rarityCounts[rk] || 0}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {visibleChests.map((ch) => (
          <ChestCard key={ch.id} chest={ch} c={c} t={eff} onOpen={openChest} />
        ))}
        {visibleChests.length === 0 && (
          <div className="col-span-4 text-center text-xs py-6 rounded-xl" style={{ background: c.surface, border: `1px solid ${c.surfaceBorder}`, color: Grey }}>
            No chests.
          </div>
        )}
      </div>

      <AnimatePresence>
        {openAllSummary && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: eff === "light" ? "rgba(0,0,0,.25)" : "rgba(0,0,0,.55)", backdropFilter: "blur(2px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpenAllSummary(null)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              className="w-full max-w-[320px] rounded-3xl p-5 space-y-3 text-center"
              style={{ background: c.surface, border: `1px solid ${c.surfaceBorder}`, boxShadow: shadow(eff, "0 18px 48px rgba(0,0,0,.14),0 6px 18px rgba(0,0,0,.08)", "0 22px 60px rgba(0,0,0,.48),0 10px 24px rgba(0,0,0,.32)") }}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-sm font-semibold" style={{ color: c.text }}>Opened {openAllSummary.opened} chests</div>
              <div className="flex items-center justify-center gap-3 text-sm font-semibold" style={{ color: c.text }}>
                <span className="inline-flex items-center gap-1"><Zap className="w-4 h-4" /> {openAllSummary.xp}</span>
                <span className="inline-flex items-center gap-1"><Coins className="w-4 h-4" /> {openAllSummary.gold}</span>
              </div>
              <button
                className="px-3 py-2 rounded-lg text-sm font-semibold"
                style={{ background: `linear-gradient(90deg, ${c.sky}, ${c.emerald})`, border: `1px solid ${c.surfaceBorder}`, color: "#0f172a" }}
                onClick={() => setOpenAllSummary(null)}
              >
                Nice!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openResult && (
          <motion.div
            className="fixed left-0 right-0 bottom-16 z-40 mx-auto w-[280px]"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
          >
            <div className="rounded-2xl px-4 py-3 text-sm font-semibold text-center"
              style={{ background: c.surface, border: `1px solid ${c.surfaceBorder}`, color: c.text, boxShadow: shadow(eff, "0 10px 28px rgba(0,0,0,.14)", "0 14px 34px rgba(0,0,0,.48)") }}>
              <div className="flex items-center justify-center gap-3">
                <span className="inline-flex items-center gap-1"><Zap className="w-4 h-4" /> {openResult.xp}</span>
                <span className="inline-flex items-center gap-1"><Coins className="w-4 h-4" /> {openResult.gold}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

