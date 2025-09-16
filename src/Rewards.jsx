import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Coins, Gift, Sparkles } from "lucide-react";
import commonChest from "./assets/chests/common.svg";
import rareChest from "./assets/chests/rare.svg";
import epicChest from "./assets/chests/epic.svg";
import legendaryChest from "./assets/chests/legendary.svg";

const shadow = (t, l, d) => (t === "light" ? l : d);

const hexToRgba = (hex, alpha) => {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) {
    return `rgba(148, 163, 184, ${alpha})`;
  }
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

const CHEST_ART = {
  Common: commonChest,
  Rare: rareChest,
  Epic: epicChest,
  Legendary: legendaryChest,
};

const RARITIES = [
  {
    key: "Common",
    weight: 0.52,
    gold: [4, 12],
  },
  {
    key: "Rare",
    weight: 0.3,
    gold: [8, 18],
  },
  {
    key: "Epic",
    weight: 0.14,
    gold: [14, 28],
  },
  {
    key: "Legendary",
    weight: 0.04,
    gold: [24, 48],
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
    gold: r.gold,
  };
});

const rand = ([min, max]) => Math.floor(Math.random() * (max - min + 1)) + min;

const computePotential = (list = []) => {
  if (!list.length) return null;
  const goldMin = list.reduce(
    (acc, ch) => acc + (Array.isArray(ch.gold) ? ch.gold[0] ?? 0 : 0),
    0
  );
  const goldMax = list.reduce(
    (acc, ch) => acc + (Array.isArray(ch.gold) ? ch.gold[1] ?? ch.gold[0] ?? 0 : 0),
    0
  );
  return [goldMin, goldMax];
};

const formatRange = (range) => {
  if (!range) return "0";
  const [min, max] = range;
  return min === max ? `${min}` : `${min} – ${max}`;
};

function ChestCard({ chest, c, t, onOpen }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const rarity = chest.rarity || "Common";
  const icon = CHEST_ART[rarity] || CHEST_ART.Common;
  const detail = RARITY_DETAILS[rarity] || RARITY_DETAILS.Common;
  const goldRange = chest.gold ? formatRange(chest.gold) : "?";

  const showDetails = () => setDetailsOpen(true);
  const hideDetails = (event) => {
    if (event && event.currentTarget.contains(event.relatedTarget)) {
      return;
    }
    setDetailsOpen(false);
  };

  const handleCardClick = () => {
    if (!detailsOpen) {
      setDetailsOpen(true);
    }
  };

  const handleOpen = (event) => {
    event.stopPropagation();
    const reward = onOpen(chest);
    if (reward) {
      setDetailsOpen(false);
    }
  };

  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl border"
      style={{
        background: t === "light" ? "rgba(255,255,255,0.72)" : "rgba(15,23,42,0.55)",
        border: `1px solid ${c.surfaceBorder}`,
        boxShadow: shadow(
          t,
          "0 16px 32px rgba(15,23,42,0.08)",
          "0 18px 40px rgba(6,8,18,0.48)"
        ),
        color: c.text,
      }}
      whileHover={{ y: -2 }}
      onMouseEnter={showDetails}
      onMouseLeave={() => setDetailsOpen(false)}
      onFocus={showDetails}
      onBlur={hideDetails}
      onClick={handleCardClick}
    >
      <div className="relative flex flex-col items-center gap-3 px-4 py-5 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-xl border"
          style={{
            background: t === "light" ? "rgba(255,255,255,0.7)" : "rgba(15,23,42,0.45)",
            border: `1px solid ${c.surfaceBorder}`,
          }}
        >
          <img
            src={icon}
            alt={`${rarity} chest`}
            className="h-14 w-14 object-contain drop-shadow-sm"
            draggable={false}
          />
        </div>
        <div
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: hexToRgba(c.text, 0.7) }}
        >
          {rarity} chest
        </div>
        <div
          className="text-sm font-medium"
          style={{ color: hexToRgba(c.text, 0.82) }}
        >
          {detail.headline}
        </div>
      </div>

      <div
        className={`absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center transition duration-200 ${
          detailsOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{
          background:
            t === "light"
              ? "linear-gradient(140deg, rgba(255,255,255,0.92), rgba(226,232,240,0.78))"
              : "linear-gradient(140deg, rgba(15,23,42,0.82), rgba(15,23,42,0.74))",
          color: t === "light" ? "#0f172a" : "#f8fafc",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="text-[11px] uppercase tracking-wide opacity-80">Gold stash</div>
        <div className="text-lg font-semibold tabular-nums">{goldRange}g</div>
        <div className="text-xs leading-snug opacity-80">{detail.helper}</div>
        <motion.button
          onClick={handleOpen}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
          style={{
            background: `linear-gradient(120deg, ${c.sky}, ${c.emerald})`,
            color: "#0f172a",
            border: `1px solid ${c.surfaceBorder}`,
            boxShadow: shadow(
              t,
              "0 10px 24px rgba(148, 163, 184, 0.18)",
              "0 12px 28px rgba(6, 8, 18, 0.45)"
            ),
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
        >
          <Sparkles className="h-4 w-4" />
          Open chest
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function Rewards({ c, eff, setGold, chests, setChests, effects = [] }) {
  const [filter, setFilter] = useState("All");
  const [openAllSummary, setOpenAllSummary] = useState(null);
  const [openResult, setOpenResult] = useState(null);

  const rarityKeys = useMemo(() => ["All", ...RARITIES.map((r) => r.key)], []);

  const rarityCounts = useMemo(() => {
    const counts = Object.fromEntries(rarityKeys.map((k) => [k, 0]));
    for (const ch of chests) {
      counts[ch.rarity || "Common"] = (counts[ch.rarity || "Common"] || 0) + 1;
      counts["All"] = (counts["All"] || 0) + 1;
    }
    return counts;
  }, [chests, rarityKeys]);

  const visibleChests = useMemo(
    () => chests.filter((ch) => filter === "All" || (ch.rarity || "Common") === filter),
    [chests, filter]
  );

  const overallPotential = useMemo(() => computePotential(chests), [chests]);
  const filteredPotential = useMemo(() => computePotential(visibleChests), [visibleChests]);

  const goldMultiplier = useMemo(
    () => (effects.some((e) => e.id === 2) ? 2 : 1),
    [effects]
  );

  const openChest = (chest) => {
    const base = rand(chest.gold);
    const totalGold = Math.round(base * goldMultiplier);
    setGold((v) => v + totalGold);
    setChests((prev) => prev.filter((cst) => cst.id !== chest.id));
    setOpenResult({ gold: totalGold });
    setTimeout(() => setOpenResult(null), 1600);
    return { gold: totalGold };
  };

  const openAll = () => {
    if (!chests.length) return;
    let totalGold = 0;
    for (const ch of chests) {
      totalGold += Math.round(rand(ch.gold) * goldMultiplier);
    }
    setGold((v) => v + totalGold);
    const opened = chests.length;
    setChests([]);
    setOpenAllSummary({ gold: totalGold, opened });
  };

  const viewRange = filteredPotential ? `${formatRange(filteredPotential)}g` : "0g";
  const vaultRange = overallPotential ? `${formatRange(overallPotential)}g` : null;

  return (
    <div className="space-y-5">
      <motion.section
        className="relative overflow-hidden rounded-3xl px-5 py-6"
        style={{
          background: `linear-gradient(135deg, ${hexToRgba(c.sky, 0.2)}, ${hexToRgba(
            c.emerald,
            0.18
          )})`,
          border: `1px solid ${c.surfaceBorder}`,
          boxShadow: shadow(
            eff,
            "0 18px 38px rgba(15,23,42,0.14),0 8px 20px rgba(15,23,42,0.08)",
            "0 22px 52px rgba(6,8,18,0.55),0 10px 28px rgba(6,8,18,0.42)"
          ),
          color: eff === "light" ? "#0f172a" : c.text,
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="relative flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
                style={{
                  background:
                    eff === "light" ? "rgba(255,255,255,0.65)" : "rgba(15,23,42,0.32)",
                  border: `1px solid ${hexToRgba(c.sky, 0.4)}`,
                  color: eff === "light" ? "#0f172a" : c.text,
                }}
              >
                <Gift className="h-4 w-4" />
                Treasure vault
              </div>
              <div
                className="text-2xl font-semibold leading-tight"
                style={{ color: eff === "light" ? "#0f172a" : c.text }}
              >
                Streamline your loot stash.
              </div>
              <p
                className="text-sm leading-snug"
                style={{
                  color:
                    eff === "light"
                      ? "rgba(15,23,42,0.66)"
                      : "rgba(226,232,240,0.76)",
                }}
              >
                Track how much gold is tucked away and open chests when you're ready for a boost.
              </p>
            </div>
            <motion.button
              onClick={openAll}
              disabled={!chests.length}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold"
              style={{
                background: chests.length
                  ? `linear-gradient(120deg, ${c.sky}, ${c.emerald})`
                  : eff === "light"
                  ? "rgba(255,255,255,0.45)"
                  : "rgba(15,23,42,0.45)",
                color: chests.length ? "#0f172a" : hexToRgba(c.text, 0.6),
                border: `1px solid ${chests.length ? hexToRgba(c.emerald, 0.45) : c.surfaceBorder}`,
                cursor: chests.length ? "pointer" : "not-allowed",
                boxShadow: chests.length
                  ? shadow(
                      eff,
                      "0 14px 30px rgba(15,23,42,0.18)",
                      "0 16px 38px rgba(6,8,18,0.58)"
                    )
                  : "none",
              }}
              whileHover={chests.length ? { scale: 1.02 } : undefined}
              whileTap={chests.length ? { scale: 0.96 } : undefined}
            >
              <Sparkles className="h-4 w-4" />
              Open all
            </motion.button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div
              className="rounded-2xl px-4 py-3"
              style={{
                background: eff === "light" ? "rgba(255,255,255,0.58)" : "rgba(15,23,42,0.32)",
                border: `1px solid ${hexToRgba(c.sky, 0.35)}`,
              }}
            >
              <div
                className="text-[11px] uppercase tracking-wide"
                style={{ color: eff === "light" ? "rgba(15,23,42,0.6)" : "rgba(226,232,240,0.7)" }}
              >
                In view ({filter})
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span
                  className="text-2xl font-semibold tabular-nums"
                  style={{ color: eff === "light" ? "#0f172a" : c.text }}
                >
                  {visibleChests.length}
                </span>
                <span
                  className="text-xs uppercase tracking-wide"
                  style={{ color: eff === "light" ? "rgba(15,23,42,0.55)" : "rgba(226,232,240,0.65)" }}
                >
                  chests
                </span>
              </div>
            </div>
            <div
              className="rounded-2xl px-4 py-3"
              style={{
                background: eff === "light" ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.28)",
                border: `1px solid ${hexToRgba(c.emerald, 0.35)}`,
              }}
            >
              <div
                className="text-[11px] uppercase tracking-wide"
                style={{ color: eff === "light" ? "rgba(15,23,42,0.6)" : "rgba(226,232,240,0.7)" }}
              >
                Gold potential
              </div>
              <div className="mt-1 inline-flex items-center gap-2 text-base font-semibold">
                <Coins className="h-4 w-4" /> {viewRange}
              </div>
            </div>
          </div>

          {vaultRange && (
            <div
              className="text-[11px]"
              style={{ color: eff === "light" ? "rgba(15,23,42,0.6)" : "rgba(226,232,240,0.7)" }}
            >
              Vault holds {vaultRange} across {chests.length} chest
              {chests.length === 1 ? "" : "s"}.
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
            style={{
              background: eff === "light" ? "rgba(0,0,0,.25)" : "rgba(0,0,0,.55)",
              backdropFilter: "blur(2px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpenAllSummary(null)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              className="w-full max-w-[320px] space-y-3 rounded-3xl p-5 text-center"
              style={{
                background: c.surface,
                border: `1px solid ${c.surfaceBorder}`,
                boxShadow: shadow(
                  eff,
                  "0 18px 48px rgba(0,0,0,.14),0 6px 18px rgba(0,0,0,.08)",
                  "0 22px 60px rgba(0,0,0,.48),0 10px 24px rgba(0,0,0,.32)"
                ),
              }}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-sm font-semibold" style={{ color: c.text }}>
                Opened {openAllSummary.opened} chest{openAllSummary.opened === 1 ? "" : "s"}
              </div>
              <div
                className="inline-flex items-center justify-center gap-2 text-base font-semibold"
                style={{ color: c.text }}
              >
                <Coins className="h-4 w-4" /> {openAllSummary.gold}g
              </div>
              <button
                className="rounded-lg px-3 py-2 text-sm font-semibold"
                style={{
                  background: `linear-gradient(90deg, ${c.sky}, ${c.emerald})`,
                  border: `1px solid ${c.surfaceBorder}`,
                  color: "#0f172a",
                }}
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
              className="rounded-3xl px-5 py-4 text-center text-sm font-semibold backdrop-blur"
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
                style={{
                  color:
                    eff === "light"
                      ? "rgba(15,23,42,0.68)"
                      : "rgba(226,232,240,0.78)",
                }}
              >
                Fresh loot
              </div>
              <div className="inline-flex items-center gap-1">
                <Coins className="h-4 w-4" /> {openResult.gold}g
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
