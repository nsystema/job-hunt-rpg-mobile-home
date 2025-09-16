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
      className="group relative h-full rounded-3xl p-[1px]"
      style={{
        background: `linear-gradient(135deg, ${accentA}, ${accentB})`,
      }}
      whileHover={{ scale: 1.03, rotateX: 0, rotateY: 0 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
    >
      <div
        className="absolute inset-[-40%] rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-80"
        style={{
          background: `radial-gradient(circle at 50% 10%, ${hexToRgba(
            accentA,
            0.45
          )}, transparent 65%)`,
        }}
      />
      <div
        className="relative flex h-full flex-col items-center gap-3 rounded-[26px] px-4 pb-4 pt-5 text-center"
        style={{
          background: `linear-gradient(140deg, ${hexToRgba(
            accentA,
            0.16
          )}, ${hexToRgba(accentB, 0.08)})`,
          border: `1px solid ${hexToRgba(accentB, 0.35)}`,
          boxShadow: shadow(
            t,
            "0 16px 42px rgba(15,23,42,0.15),0 4px 12px rgba(15,23,42,0.06)",
            "0 18px 52px rgba(8,11,24,0.52),0 6px 18px rgba(8,11,24,0.4)"
          ),
          color: c.text,
        }}
      >
        <div
          className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
          style={{
            background: hexToRgba(accentA, 0.18),
            border: `1px solid ${hexToRgba(accentA, 0.35)}`,
            color: "#0f172a",
          }}
        >
          <Sparkles className="h-3.5 w-3.5" /> {rarity}
        </div>

        <div className="mt-6 flex flex-col items-center gap-2">
          <motion.div
            className="relative grid h-24 w-24 place-items-center rounded-2xl"
            style={{
              background: `linear-gradient(145deg, ${hexToRgba(
                accentA,
                0.22
              )}, ${hexToRgba(accentB, 0.14)})`,
              border: `1px solid ${hexToRgba(accentB, 0.4)}`,
              boxShadow: shadow(
                t,
                "0 12px 28px rgba(15,23,42,0.18),0 4px 10px rgba(15,23,42,0.08)",
                "0 16px 36px rgba(8,11,24,0.5),0 6px 14px rgba(8,11,24,0.42)"
              ),
            }}
            animate={{ y: open ? -6 : 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
          >
            <ChestGraphic open={open} colors={[accentA, accentB]} />
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-2xl"
              style={{
                background: `radial-gradient(circle at 50% 0%, ${hexToRgba(
                  accentB,
                  0.35
                )}, transparent 70%)`,
              }}
              animate={{ opacity: open ? 0.75 : 0.4 }}
            />
          </motion.div>

          <div className="space-y-1">
            <div className="text-sm font-semibold" style={{ color: c.text }}>
              {rarityDetail.headline}
            </div>
            <div
              className="text-[11px] leading-tight"
              style={{ color: hexToRgba(c.text, 0.75) }}
            >
              {rarityDetail.helper}
            </div>
          </div>
        </div>

        <div className="mt-2 grid w-full grid-cols-2 gap-2 text-left">
          <div
            className="rounded-2xl px-3 py-2"
            style={{
              background: hexToRgba("#0f172a", t === "light" ? 0.06 : 0.28),
              border: `1px solid ${hexToRgba(accentA, 0.35)}`,
            }}
          >
            <div className="text-[10px] uppercase tracking-wide" style={{ color: hexToRgba(c.text, 0.65) }}>
              XP Range
            </div>
            <div className="mt-1 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: c.text }}>
              <Zap className="h-4 w-4" />
              {xpRange}
            </div>
          </div>
          <div
            className="rounded-2xl px-3 py-2"
            style={{
              background: hexToRgba("#0f172a", t === "light" ? 0.06 : 0.28),
              border: `1px solid ${hexToRgba(accentB, 0.35)}`,
            }}
          >
            <div className="text-[10px] uppercase tracking-wide" style={{ color: hexToRgba(c.text, 0.65) }}>
              Gold Range
            </div>
            <div className="mt-1 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: c.text }}>
              <Coins className="h-4 w-4" />
              {goldRange}g
            </div>
          </div>
        </div>

        <motion.button
          onClick={handleOpen}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold"
          style={{
            background: `linear-gradient(120deg, ${accentA}, ${accentB})`,
            color: "#0f172a",
            boxShadow: shadow(
              t,
              "0 10px 24px rgba(148, 163, 184, 0.26)",
              "0 10px 24px rgba(14, 23, 42, 0.5)"
            ),
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
        >
          <Sparkles className="h-4 w-4" /> Open Chest
        </motion.button>

        <AnimatePresence>
          {reward && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-4"
              style={{
                background: `linear-gradient(140deg, ${hexToRgba(
                  accentA,
                  0.9
                )}, ${hexToRgba(accentB, 0.9)})`,
                color: "#0f172a",
              }}
            >
              <div className="text-xs font-semibold uppercase tracking-wider opacity-80">
                Loot revealed
              </div>
              <div className="grid w-full grid-cols-2 gap-2 text-sm font-semibold">
                <div className="rounded-2xl bg-white/20 px-3 py-2">
                  <div className="text-[11px] uppercase tracking-wide opacity-75">
                    XP
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1 text-base">
                    <Zap className="h-4 w-4" /> {reward.xp}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/20 px-3 py-2">
                  <div className="text-[11px] uppercase tracking-wide opacity-75">
                    Gold
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1 text-base">
                    <Coins className="h-4 w-4" /> {reward.gold}g
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
        className="relative overflow-hidden rounded-3xl px-5 py-6"
        style={{
          background: `linear-gradient(135deg, ${hexToRgba(c.sky, 0.28)}, ${hexToRgba(
            c.emerald,
            0.18
          )})`,
          border: `1px solid ${c.surfaceBorder}`,
          boxShadow: shadow(
            eff,
            "0 20px 48px rgba(15,23,42,0.18),0 8px 24px rgba(15,23,42,0.08)",
            "0 24px 60px rgba(6,8,18,0.55),0 12px 32px rgba(6,8,18,0.42)"
          ),
          color: eff === "light" ? "#0f172a" : c.text,
        }}
      >
        <div
          className="pointer-events-none absolute -left-10 -top-12 h-40 w-40 rounded-full opacity-60 blur-3xl"
          style={{ background: hexToRgba(c.sky, 0.35) }}
        />
        <div
          className="pointer-events-none absolute -right-6 bottom-0 h-32 w-32 rounded-full opacity-40 blur-3xl"
          style={{ background: hexToRgba(c.emerald, 0.3) }}
        />
        <div className="relative flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
                style={{
                  background: eff === "light" ? "rgba(255,255,255,0.65)" : "rgba(15,23,42,0.28)",
                  border: `1px solid ${hexToRgba(c.sky, 0.45)}`,
                  color: eff === "light" ? "#0f172a" : c.text,
                }}
              >
                <Gift className="h-4 w-4" />
                {chests.length} chest{chests.length === 1 ? "" : "s"} in vault
              </div>
              <div className="space-y-1 text-left">
                <div className="text-lg font-semibold">Treasure vault</div>
                <div
                  className="text-sm leading-snug"
                  style={{
                    color: eff === "light" ? "rgba(15,23,42,0.68)" : "rgba(226,232,240,0.78)",
                  }}
                >
                  Curate your next motivation burst by exploring chest rarities and their reward arcs.
                </div>
              </div>
            </div>
            <motion.button
              onClick={openAll}
              disabled={!chests.length}
              className="relative inline-flex items-center gap-2 rounded-2xl px-5 py-2 text-sm font-semibold"
              style={{
                background: chests.length
                  ? `linear-gradient(120deg, ${c.sky}, ${c.emerald})`
                  : hexToRgba("#0f172a", eff === "light" ? 0.08 : 0.35),
                color: chests.length ? "#0f172a" : hexToRgba(c.text, 0.5),
                border: `1px solid ${
                  chests.length
                    ? hexToRgba(c.emerald, 0.5)
                    : hexToRgba("#0f172a", eff === "light" ? 0.12 : 0.4)
                }`,
                cursor: chests.length ? "pointer" : "not-allowed",
                boxShadow: chests.length
                  ? shadow(
                      eff,
                      "0 14px 32px rgba(15,23,42,0.22)",
                      "0 16px 40px rgba(6,8,18,0.6)"
                    )
                  : "none",
              }}
              whileHover={chests.length ? { scale: 1.02 } : undefined}
              whileTap={chests.length ? { scale: 0.97 } : undefined}
            >
              <Sparkles className="h-4 w-4" /> Open All
            </motion.button>
          </div>

          {filteredPotential && (
            <div className="grid gap-2 sm:grid-cols-2">
              <div
                className="rounded-2xl px-3 py-3"
                style={{
                  background: eff === "light" ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.32)",
                  border: `1px solid ${hexToRgba(c.sky, 0.35)}`,
                }}
              >
                <div
                  className="text-[11px] uppercase tracking-wide"
                  style={{ color: eff === "light" ? "rgba(15,23,42,0.62)" : "rgba(226,232,240,0.74)" }}
                >
                  Potential XP ({filter})
                </div>
                <div className="mt-1 inline-flex items-center gap-2 text-base font-semibold">
                  <Zap className="h-4 w-4" />
                  {formatRange(filteredPotential.xp)}
                </div>
              </div>
              <div
                className="rounded-2xl px-3 py-3"
                style={{
                  background: eff === "light" ? "rgba(255,255,255,0.42)" : "rgba(15,23,42,0.3)",
                  border: `1px solid ${hexToRgba(c.emerald, 0.35)}`,
                }}
              >
                <div
                  className="text-[11px] uppercase tracking-wide"
                  style={{ color: eff === "light" ? "rgba(15,23,42,0.62)" : "rgba(226,232,240,0.74)" }}
                >
                  Potential Gold ({filter})
                </div>
                <div className="mt-1 inline-flex items-center gap-2 text-base font-semibold">
                  <Coins className="h-4 w-4" />
                  {formatRange(filteredPotential.gold)}g
                </div>
              </div>
            </div>
          )}

          {overallPotential && (
            <div
              className="text-[11px]"
              style={{ color: eff === "light" ? "rgba(15,23,42,0.6)" : "rgba(226,232,240,0.7)" }}
            >
              Entire vault holds {formatRange(overallPotential.xp)} XP and {formatRange(overallPotential.gold)}g across {chests.length} chest{chests.length === 1 ? "" : "s"}.
            </div>
          )}
        </div>
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

