import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Zap, Gift, Sparkles } from "lucide-react";
import { Grey } from "./data.jsx";

const shadow = (t, l, d) => (t === "light" ? l : d);

const hexToRgba = (hex, alpha) => {
  if (!hex) return `rgba(148, 163, 184, ${alpha})`;
  const sanitized = hex.replace("#", "");
  const normalized =
    sanitized.length === 3
      ? sanitized
          .split("")
          .map((char) => char + char)
          .join("")
      : sanitized.slice(0, 6);
  const bigint = parseInt(normalized, 16);
  if (Number.isNaN(bigint)) return `rgba(148, 163, 184, ${alpha})`;
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

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

const RARITY_DETAILS = {
  Common: {
    headline: "Reliable stash",
    helper: "Solid boosts to keep momentum steady.",
  },
  Rare: {
    headline: "Shiny find",
    helper: "Elevated rewards with a spark of luck.",
  },
  Epic: {
    headline: "Elite haul",
    helper: "High-tier loot for big progress leaps.",
  },
  Legendary: {
    headline: "Mythic treasure",
    helper: "Top-shelf rewards reserved for heroes.",
  },
};

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

const computePotential = (list = []) => {
  if (!list.length) return null;
  const xpMin = list.reduce(
    (acc, ch) => acc + (Array.isArray(ch.xp) ? ch.xp[0] ?? 0 : 0),
    0
  );
  const xpMax = list.reduce(
    (acc, ch) => acc + (Array.isArray(ch.xp) ? ch.xp[1] ?? ch.xp[0] ?? 0 : 0),
    0
  );
  const goldMin = list.reduce(
    (acc, ch) => acc + (Array.isArray(ch.gold) ? ch.gold[0] ?? 0 : 0),
    0
  );
  const goldMax = list.reduce(
    (acc, ch) => acc + (Array.isArray(ch.gold) ? ch.gold[1] ?? ch.gold[0] ?? 0 : 0),
    0
  );
  return {
    xp: [xpMin, xpMax],
    gold: [goldMin, goldMax],
  };
};

const formatRange = (range) => {
  if (!range) return "0";
  const [min, max] = range;
  return min === max ? `${min}` : `${min} – ${max}`;
};

function ChestGraphic({ open, colors, size = 48 }) {
  return (
    <svg
      width={size}
      height={size}
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

  const rarity = chest.rarity || "Common";
  const rarityConfig = useMemo(
    () => RARITIES.find((r) => r.key === rarity) || RARITIES[0],
    [rarity]
  );
  const accentA = chest.colors?.[0] || rarityConfig.colors?.[0] || c.sky;
  const accentB = chest.colors?.[1] || rarityConfig.colors?.[1] || c.emerald;
  const rarityDetail = RARITY_DETAILS[rarity] || RARITY_DETAILS.Common;

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

  const xpRange = chest.xp ? `${chest.xp[0]} – ${chest.xp[1]}` : "?";
  const goldRange = chest.gold ? `${chest.gold[0]} – ${chest.gold[1]}` : "?";

  return (
    <motion.div
      className="group relative flex h-full flex-col rounded-2xl border p-3 text-left"
      style={{
        borderColor: hexToRgba(accentA, t === "light" ? 0.28 : 0.45),
        background: t === "light" ? "rgba(255,255,255,0.9)" : "rgba(15,23,42,0.45)",
        boxShadow: shadow(
          t,
          "0 10px 22px rgba(15,23,42,0.08),0 4px 10px rgba(15,23,42,0.06)",
          "0 16px 34px rgba(6,8,18,0.5),0 6px 14px rgba(6,8,18,0.42)"
        ),
        color: c.text,
      }}
      whileHover={{ translateY: -4 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
    >
      <div className="flex items-center gap-3">
        <motion.div
          className="grid h-12 w-12 place-items-center rounded-xl"
          style={{
            background: hexToRgba(accentA, t === "light" ? 0.16 : 0.32),
            border: `1px solid ${hexToRgba(accentA, 0.35)}`,
          }}
          animate={{ rotate: open ? -8 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <ChestGraphic size={40} open={open} colors={[accentA, accentB]} />
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold leading-tight">{rarity}</div>
          <div
            className="truncate text-[11px]"
            style={{ color: hexToRgba(c.text, 0.65) }}
          >
            {rarityDetail.headline}
          </div>
        </div>
      </div>

      <div
        className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium"
        style={{ color: hexToRgba(c.text, 0.75) }}
      >
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-1"
          style={{
            background: hexToRgba(accentA, t === "light" ? 0.18 : 0.28),
            color: t === "light" ? "#0f172a" : c.text,
          }}
        >
          <Zap className="h-3.5 w-3.5" /> {xpRange} XP
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-1"
          style={{
            background: hexToRgba(accentB, t === "light" ? 0.18 : 0.28),
            color: t === "light" ? "#0f172a" : c.text,
          }}
        >
          <Coins className="h-3.5 w-3.5" /> {goldRange}g
        </span>
      </div>

      <motion.button
        onClick={handleOpen}
        className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl px-3 py-1.5 text-[12px] font-semibold"
        style={{
          background: `linear-gradient(120deg, ${accentA}, ${accentB})`,
          color: "#0f172a",
        }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles className="h-3.5 w-3.5" /> Open chest
      </motion.button>

      <AnimatePresence>
        {reward && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl px-3 text-center"
            style={{
              background: hexToRgba(
                t === "light" ? "#f8fafc" : "#0f172a",
                t === "light" ? 0.9 : 0.85
              ),
              border: `1px solid ${hexToRgba(accentB, 0.35)}`,
              color: t === "light" ? "#0f172a" : c.text,
              backdropFilter: "blur(6px)",
            }}
          >
            <div className="text-[11px] uppercase tracking-wide opacity-80">
              Loot revealed
            </div>
            <div className="flex items-center justify-center gap-3 text-sm font-semibold">
              <span className="inline-flex items-center gap-1">
                <Zap className="h-4 w-4" /> {reward.xp}
              </span>
              <span className="inline-flex items-center gap-1">
                <Coins className="h-4 w-4" /> {reward.gold}g
              </span>
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

  const overallPotential = useMemo(() => computePotential(chests), [chests]);
  const filteredPotential = useMemo(
    () => computePotential(visibleChests),
    [visibleChests]
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
    <div className="space-y-5">
      <motion.section
        className="rounded-3xl border px-5 py-5"
        style={{
          background: c.surface,
          border: `1px solid ${c.surfaceBorder}`,
          boxShadow: shadow(
            eff,
            "0 12px 28px rgba(15,23,42,0.08),0 4px 10px rgba(15,23,42,0.06)",
            "0 18px 38px rgba(6,8,18,0.5),0 6px 16px rgba(6,8,18,0.42)"
          ),
          color: c.text,
        }}
        layout
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Gift className="h-4 w-4" />
              <span>
                {chests.length} chest{chests.length === 1 ? "" : "s"} ready
              </span>
            </div>
            <div
              className="text-[12px]"
              style={{ color: hexToRgba(c.text, 0.65) }}
            >
              Viewing {filter === "All" ? "all rarities" : `${filter} chests`}
            </div>
          </div>
          <motion.button
            onClick={openAll}
            disabled={!chests.length}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
            style={{
              background: chests.length
                ? `linear-gradient(120deg, ${c.sky}, ${c.emerald})`
                : c.chipBg,
              color: chests.length ? "#0f172a" : hexToRgba(c.text, 0.5),
              border: `1px solid ${
                chests.length
                  ? hexToRgba(c.emerald, 0.45)
                  : c.surfaceBorder
              }`,
              cursor: chests.length ? "pointer" : "not-allowed",
              boxShadow: chests.length
                ? shadow(
                    eff,
                    "0 12px 26px rgba(15,23,42,0.16)",
                    "0 14px 32px rgba(6,8,18,0.55)"
                  )
                : "none",
            }}
            whileHover={chests.length ? { scale: 1.03 } : undefined}
            whileTap={chests.length ? { scale: 0.96 } : undefined}
          >
            <Sparkles className="h-4 w-4" /> Open all
          </motion.button>
        </div>

        {filteredPotential && (
          <div
            className="mt-4 flex flex-wrap items-center gap-2 text-[12px] font-medium"
            style={{ color: hexToRgba(c.text, 0.7) }}
          >
            <span
              className="inline-flex items-center gap-1 rounded-full px-3 py-1"
              style={{
                background: c.chipBg,
                border: `1px solid ${c.surfaceBorder}`,
              }}
            >
              <Zap className="h-3.5 w-3.5" /> {formatRange(filteredPotential.xp)} XP
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-3 py-1"
              style={{
                background: c.chipBg,
                border: `1px solid ${c.surfaceBorder}`,
              }}
            >
              <Coins className="h-3.5 w-3.5" /> {formatRange(filteredPotential.gold)}g
            </span>
          </div>
        )}

        {overallPotential && (
          <div
            className="mt-3 text-[12px]"
            style={{ color: hexToRgba(c.text, 0.6) }}
          >
            Vault total {formatRange(overallPotential.xp)} XP · {formatRange(overallPotential.gold)}g across {chests.length} chest
            {chests.length === 1 ? "" : "s"}.
          </div>
        )}
      </motion.section>

      <div>
        <div
          className="mb-2 text-[11px] uppercase tracking-wide"
          style={{ color: hexToRgba(c.text, 0.6) }}
        >
          Choose rarity
        </div>
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Chest rarity filter"
        >
          {rarityKeys.map((rk) => {
            const active = filter === rk;
            return (
              <motion.button
                key={rk}
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(rk)}
                className="relative inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-semibold"
                style={{
                  background: active
                    ? `linear-gradient(120deg, ${c.sky}, ${c.emerald})`
                    : hexToRgba("#0f172a", eff === "light" ? 0.04 : 0.32),
                  color: active ? "#0f172a" : c.text,
                  border: `1px solid ${
                    active
                      ? hexToRgba(c.emerald, 0.45)
                      : hexToRgba("#0f172a", eff === "light" ? 0.08 : 0.24)
                  }`,
                  whiteSpace: "nowrap",
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <span>{rk}</span>
                <span
                  className="rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
                  style={{
                    background: active
                      ? "rgba(255,255,255,0.6)"
                      : hexToRgba("#0f172a", eff === "light" ? 0.08 : 0.28),
                    color: active ? "#0f172a" : hexToRgba(c.text, 0.7),
                  }}
                >
                  {rarityCounts[rk] || 0}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visibleChests.map((ch) => (
          <ChestCard key={ch.id} chest={ch} c={c} t={eff} onOpen={openChest} />
        ))}
        {visibleChests.length === 0 && (
          <div
            className="col-span-full rounded-3xl px-6 py-10 text-center text-sm"
            style={{
              background: `linear-gradient(135deg, ${hexToRgba(c.sky, 0.18)}, ${hexToRgba(c.emerald, 0.12)})`,
              border: `1px solid ${c.surfaceBorder}`,
              color: hexToRgba(c.text, 0.7),
            }}
          >
            No chests match this view.
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
                <span className="inline-flex items-center gap-1"><Coins className="w-4 h-4" /> {openAllSummary.gold}g</span>
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
            <div
              className="rounded-3xl px-5 py-4 text-sm font-semibold text-center backdrop-blur"
              style={{
                background: `linear-gradient(135deg, ${hexToRgba(c.sky, 0.24)}, ${hexToRgba(c.emerald, 0.2)})`,
                border: `1px solid ${c.surfaceBorder}`,
                color: eff === "light" ? "#0f172a" : c.text,
                boxShadow: shadow(
                  eff,
                  "0 18px 42px rgba(15,23,42,0.2),0 8px 20px rgba(15,23,42,0.12)",
                  "0 20px 46px rgba(6,8,18,0.6),0 10px 24px rgba(6,8,18,0.5)"
                ),
              }}
            >
              <div
                className="mb-1 text-[11px] uppercase tracking-wide"
                style={{ color: eff === "light" ? "rgba(15,23,42,0.68)" : "rgba(226,232,240,0.78)" }}
              >
                Fresh loot
              </div>
              <div className="flex items-center justify-center gap-4">
                <span className="inline-flex items-center gap-1">
                  <Zap className="w-4 h-4" /> {openResult.xp}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Coins className="w-4 h-4" /> {openResult.gold}g
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

