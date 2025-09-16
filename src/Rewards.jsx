import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Zap, Sparkles } from "lucide-react";

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

  const xpRange = formatRange(chest.xp);
  const goldRange = formatRange(chest.gold);

  return (
    <motion.div
      className="relative h-full"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 240, damping: 24 }}
    >
      <div
        className="relative flex h-full flex-col items-center gap-4 rounded-2xl border px-4 py-6 text-center"
        style={{
          background: t === "light" ? "#ffffff" : "rgba(15,23,42,0.55)",
          borderColor: hexToRgba(accentA, 0.35),
          color: c.text,
        }}
      >
        <div
          className="absolute inset-x-6 top-0 h-[3px] rounded-b-full"
          style={{
            background: `linear-gradient(90deg, ${accentA}, ${accentB})`,
          }}
        />

        <span
          className="mt-1 inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
          style={{
            background: hexToRgba(accentA, t === "light" ? 0.12 : 0.24),
            color: t === "light" ? "#0f172a" : c.text,
          }}
        >
          {rarity}
        </span>

        <motion.div
          className="grid h-16 w-16 place-items-center rounded-full"
          style={{
            background: `linear-gradient(135deg, ${hexToRgba(accentA, 0.25)}, ${hexToRgba(
              accentB,
              0.25
            )})`,
            border: `1px solid ${hexToRgba(accentB, 0.4)}`,
          }}
          animate={{ y: open ? -6 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
        >
          <ChestGraphic open={open} colors={[accentA, accentB]} />
        </motion.div>

        <div className="w-full space-y-3 text-sm font-medium">
          <div
            className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide"
            style={{ color: hexToRgba(c.text, 0.6) }}
          >
            <span>XP</span>
            <span>Gold</span>
          </div>
          <div className="flex items-center justify-between text-base">
            <span className="inline-flex items-center gap-1">
              <Zap className="h-4 w-4" />
              {xpRange}
            </span>
            <span className="inline-flex items-center gap-1">
              <Coins className="h-4 w-4" /> {goldRange}g
            </span>
          </div>
        </div>

        <motion.button
          onClick={handleOpen}
          className="w-full rounded-xl px-4 py-2 text-sm font-semibold"
          style={{
            background: `linear-gradient(90deg, ${accentA}, ${accentB})`,
            color: "#0f172a",
            border: `1px solid ${hexToRgba(accentB, 0.4)}`,
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
        >
          Open chest
        </motion.button>

        <AnimatePresence>
          {reward && (
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl px-4"
              style={{
                background: `linear-gradient(120deg, ${hexToRgba(
                  accentA,
                  0.9
                )}, ${hexToRgba(accentB, 0.9)})`,
                color: "#0f172a",
              }}
            >
              <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
                Loot
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
        className="rounded-3xl border px-5 py-6 space-y-5"
        style={{
          background: eff === "light" ? "#ffffff" : "rgba(15,23,42,0.55)",
          borderColor: c.surfaceBorder,
          color: c.text,
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="text-base font-semibold">Rewards</div>
            <div
              className="text-sm"
              style={{ color: hexToRgba(c.text, 0.65) }}
            >
              {chests.length
                ? `${chests.length} chest${chests.length === 1 ? "" : "s"} ready to open`
                : "No chests available"}
            </div>
          </div>
          <motion.button
            onClick={openAll}
            disabled={!chests.length}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
            style={{
              background: chests.length
                ? `linear-gradient(90deg, ${c.sky}, ${c.emerald})`
                : "transparent",
              color: chests.length ? "#0f172a" : hexToRgba(c.text, 0.45),
              border: `1px solid ${
                chests.length ? hexToRgba(c.emerald, 0.4) : hexToRgba(c.text, 0.2)
              }`,
              cursor: chests.length ? "pointer" : "not-allowed",
            }}
            whileHover={chests.length ? { scale: 1.02 } : undefined}
            whileTap={chests.length ? { scale: 0.96 } : undefined}
          >
            <Sparkles className="h-4 w-4" /> Open all
          </motion.button>
        </div>

        {filteredPotential && (
          <div
            className="flex flex-wrap items-center gap-3 text-xs font-medium"
            style={{ color: hexToRgba(c.text, 0.6) }}
          >
            <span>Potential loot</span>
            <span className="inline-flex items-center gap-1">
              <Zap className="h-4 w-4" /> {formatRange(filteredPotential.xp)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Coins className="h-4 w-4" /> {formatRange(filteredPotential.gold)}g
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-2" role="tablist">
          {rarityKeys.map((rk) => {
            const active = filter === rk;
            return (
              <motion.button
                key={rk}
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(rk)}
                className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm"
                style={{
                  background: active
                    ? `linear-gradient(90deg, ${c.sky}, ${c.emerald})`
                    : hexToRgba("#0f172a", eff === "light" ? 0.05 : 0.32),
                  color: active ? "#0f172a" : hexToRgba(c.text, 0.75),
                  border: `1px solid ${
                    active ? hexToRgba(c.emerald, 0.5) : c.surfaceBorder
                  }`,
                  whiteSpace: "nowrap",
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <span>{rk}</span>
                <span
                  className="rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
                  style={{
                    background: active
                      ? "rgba(255,255,255,0.6)"
                      : hexToRgba("#0f172a", eff === "light" ? 0.05 : 0.18),
                    color: active ? "#0f172a" : hexToRgba(c.text, 0.6),
                    border: active ? "none" : `1px solid ${hexToRgba(c.text, 0.1)}`,
                  }}
                >
                  {rarityCounts[rk] || 0}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleChests.map((ch) => (
          <ChestCard key={ch.id} chest={ch} c={c} t={eff} onOpen={openChest} />
        ))}
        {visibleChests.length === 0 && (
          <div
            className="col-span-full rounded-2xl border px-6 py-10 text-center text-sm"
            style={{
              background: eff === "light" ? "#ffffff" : "rgba(15,23,42,0.55)",
              borderColor: c.surfaceBorder,
              color: hexToRgba(c.text, 0.7),
            }}
          >
            Nothing to show here yet.
          </div>
        )}
      </div>

      <AnimatePresence>
        {openAllSummary && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(15,23,42,0.45)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpenAllSummary(null)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              className="w-full max-w-[300px] space-y-3 rounded-2xl border px-5 py-6 text-center"
              style={{
                background: eff === "light" ? "#ffffff" : "rgba(15,23,42,0.75)",
                borderColor: c.surfaceBorder,
                color: c.text,
              }}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-sm font-semibold">
                Opened {openAllSummary.opened} chest{openAllSummary.opened === 1 ? "" : "s"}
              </div>
              <div className="flex items-center justify-center gap-3 text-sm font-semibold">
                <span className="inline-flex items-center gap-1">
                  <Zap className="h-4 w-4" /> {openAllSummary.xp}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Coins className="h-4 w-4" /> {openAllSummary.gold}g
                </span>
              </div>
              <button
                className="w-full rounded-lg border px-3 py-2 text-sm font-semibold"
                style={{
                  background: eff === "light" ? "#f8fafc" : "rgba(15,23,42,0.5)",
                  borderColor: c.surfaceBorder,
                  color: c.text,
                }}
                onClick={() => setOpenAllSummary(null)}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openResult && (
          <motion.div
            className="fixed left-0 right-0 bottom-16 z-40 mx-auto w-[260px]"
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 32, opacity: 0 }}
          >
            <div
              className="rounded-xl border px-4 py-3 text-sm font-semibold text-center"
              style={{
                background: eff === "light" ? "#ffffff" : "rgba(15,23,42,0.75)",
                borderColor: c.surfaceBorder,
                color: c.text,
              }}
            >
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

