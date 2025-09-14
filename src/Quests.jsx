import React, { useState } from "react";
import {
  CalendarCheck2,
  CalendarClock,
  Sparkles,
  Zap,
  Coins,
  Target,
  Gift
} from "lucide-react";
import { Grey } from "./data.jsx";
import { motion } from "framer-motion";

const shadow = (t, l, d) => (t === "light" ? l : d);

const TABS = [
  { key: "Daily", icon: CalendarCheck2 },
  { key: "Weekly", icon: CalendarClock },
  { key: "Growth", icon: Target },
  { key: "Events", icon: Sparkles }
];

const QUESTS = {
  Daily: [
    {
      id: "d1",
      title: "Log 3 applications",
      desc: "Keep the momentum going",
      progress: 1,
      goal: 3,
      xp: 40,
      gold: 8
    },
    {
      id: "d2",
      title: "Network with a recruiter",
      desc: "Reach out and say hi",
      progress: 1,
      goal: 1,
      xp: 30,
      gold: 6
    }
  ],
  Weekly: [
    {
      id: "w1",
      title: "Complete 10 applications",
      desc: "Consistency is king",
      progress: 4,
      goal: 10,
      xp: 120,
      gold: 30
    },
    {
      id: "w2",
      title: "Secure 2 interviews",
      desc: "Show them your skills",
      progress: 0,
      goal: 2,
      xp: 150,
      gold: 50
    }
  ],
  Growth: [
    {
      id: "g1",
      title: "Earn a new certification",
      desc: "Invest in your skills",
      progress: 0,
      goal: 1,
      xp: 300,
      gold: 80
    }
  ],
  Events: [
    {
      id: "e1",
      title: "Halloween hiring spree",
      desc: "Spooky season bonus",
      progress: 0,
      goal: 1,
      xp: 200,
      gold: 60
    }
  ]
};

const CHEST_MILESTONES = {
  Daily: [40, 80, 120],
  Weekly: [120, 270, 400]
};

function ChestBar({ progress, milestones, c }) {
  const max = milestones[milestones.length - 1];
  const pct = Math.min(100, (progress / max) * 100);
  return (
    <div className="relative h-12 mt-2">
      <div
        className="absolute top-5 w-full h-2 rounded-full overflow-hidden"
        style={{ background: c.chipBg }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ background: `linear-gradient(90deg, ${c.sky}, ${c.emerald})`, height: "100%" }}
        />
      </div>
      {milestones.map((m) => {
        const left = (m / max) * 100;
        const reached = progress >= m;
        return (
          <div
            key={m}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: `${left}%`, transform: "translateX(-50%)" }}
          >
            <Gift
              className="w-5 h-5 mb-1"
              style={{ color: reached ? c.emerald : c.text }}
            />
            <span className="text-[10px]" style={{ color: c.text }}>
              {m}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Progress({ v, m, c }) {
  const p = Math.min(100, (v / m) * 100);
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: c.chipBg }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${p}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ background: `linear-gradient(90deg, ${c.sky}, ${c.emerald})`, height: "100%" }}
      />
    </div>
  );
}

function QuestCard({ q, c, t, onClaim, claimed }) {
  const IconXP = Zap;
  const IconGold = Coins;
  const canClaim = q.progress >= q.goal && !claimed;
  return (
    <motion.div
      className="rounded-2xl p-4 grid gap-3"
      style={{
        background: c.surface,
        border: `1px solid ${c.surfaceBorder}`,
        boxShadow: shadow(
          t,
          "0 8px 24px rgba(0,0,0,.12),0 2px 6px rgba(0,0,0,.06)",
          "0 8px 24px rgba(0,0,0,.46),0 2px 6px rgba(0,0,0,.30)"
        )
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-sm truncate" style={{ color: c.text }}>
            {q.title}
          </div>
          <div className="text-xs mt-0.5 truncate" style={{ color: Grey }}>
            {q.desc}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: c.text }}>
          <span className="flex items-center gap-1">
            <IconXP className="w-3 h-3" /> {q.xp}
          </span>
          <span className="flex items-center gap-1">
            <IconGold className="w-3 h-3" /> {q.gold}
          </span>
        </div>
      </div>
      <div>
        <Progress v={q.progress} m={q.goal} c={c} />
        <div className="mt-1 text-[11px]" style={{ color: Grey }}>
          {q.progress} / {q.goal}
        </div>
      </div>
      <div>
        <button
          onClick={onClaim}
          disabled={!canClaim}
          className="px-3 py-1.5 rounded-xl text-[13px] font-semibold"
          style={{
            background: canClaim
              ? `linear-gradient(90deg, ${c.sky}, ${c.emerald})`
              : c.chipBg,
            color: canClaim ? "#0f172a" : Grey,
            cursor: canClaim ? "pointer" : "not-allowed"
          }}
        >
          {claimed ? "Claimed" : "Claim"}
        </button>
      </div>
    </motion.div>
  );
}

export default function Quests({ c, eff, gainXp, setGold }) {
  const [tab, setTab] = useState("Daily");
  const [claimed, setClaimed] = useState(new Set());
  const quests = QUESTS[tab];
  const points = quests.reduce(
    (sum, q) => sum + q.xp * Math.min(1, q.progress / q.goal),
    0
  );
  const milestones = CHEST_MILESTONES[tab];
  const handleClaim = (q) => {
    if (q.progress >= q.goal && !claimed.has(q.id)) {
      gainXp?.(q.xp);
      setGold?.((g) => g + q.gold);
      setClaimed((prev) => new Set(prev).add(q.id));
    }
  };
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2">
        {TABS.map((t) => {
          const active = tab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px] font-semibold relative"
              style={{
                background: active
                  ? `linear-gradient(90deg, ${c.sky}, ${c.emerald})`
                  : c.chipBg,
                border: `1px solid ${c.surfaceBorder}`,
                color: active ? "#0f172a" : c.text
              }}
            >
              <Icon className="w-4 h-4" /> {t.key}
            </button>
          );
        })}
      </div>
      {milestones && (
        <ChestBar progress={points} milestones={milestones} c={c} />
      )}
      <div className="grid gap-3">
        {quests.map((q) => (
          <QuestCard
            key={q.id}
            q={q}
            c={c}
            t={eff}
            onClaim={() => handleClaim(q)}
            claimed={claimed.has(q.id)}
          />
        ))}
        {quests.length === 0 && (
          <div
            className="rounded-2xl p-6 text-center text-sm"
            style={{
              background: c.surface,
              border: `1px solid ${c.surfaceBorder}`,
              color: Grey
            }}
          >
            No quests available.
          </div>
        )}
      </div>
    </div>
  );
}
