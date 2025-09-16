import React from "react";
import { motion } from "framer-motion";
import { Crown, PiggyBank } from "lucide-react";
import GoldPill from "./GoldPill.jsx";
import { Grey } from "../data.jsx";

const shadow = (t, l, d) => (t === "light" ? l : d);
const formatAmount = (value) =>
  Math.max(0, value).toLocaleString(undefined, {
    maximumFractionDigits: 0
  });

export default function PremiumRewardCard({
  c,
  eff,
  item,
  cost,
  progress,
  gold,
  onAction
}) {
  const completed = progress >= cost;
  const savedGold = Math.min(progress, cost);
  const remainingGold = Math.max(cost - savedGold, 0);
  const progressPercent =
    cost > 0 ? Math.min((savedGold / cost) * 100, 100) : 100;

  const displayName = (item.name || "").replace(/premium reward/gi, "").trim();

  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl p-5 space-y-4"
      style={{
        background: `linear-gradient(140deg, ${c.surface}, ${c.chipBg})`,
        border: `1px solid ${c.surfaceBorder}`,
        boxShadow: shadow(
          eff,
          "0 18px 48px rgba(0,0,0,.14),0 6px 18px rgba(0,0,0,.08)",
          "0 22px 60px rgba(0,0,0,.48),0 10px 24px rgba(0,0,0,.32)"
        )
      }}
      whileHover={{ translateY: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="grid h-12 w-12 place-items-center rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${c.sky}, ${c.emerald})`,
              color: "#0f172a",
              boxShadow: "0 12px 32px rgba(15,23,42,.18)"
            }}
          >
            <Crown className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap text-[11px] uppercase tracking-wide font-semibold">
              <span style={{ color: Grey }}>Premium Reward</span>
              {completed && (
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${c.sky}, ${c.emerald})`,
                    color: "#0f172a"
                  }}
                >
                  Ready to claim
                </span>
              )}
            </div>
            {displayName && (
              <div
                className="text-sm font-semibold leading-tight"
                style={{ color: c.text }}
              >
                {displayName}
              </div>
            )}
            <p className="text-xs leading-snug" style={{ color: Grey }}>
              Set aside gold to unlock this premium reward.
            </p>
          </div>
        </div>
        <GoldPill
          c={c}
          onClick={() => onAction(item)}
          dim={!completed && gold <= 0}
        >
          {completed ? "Claim" : "Save"}
        </GoldPill>
      </div>
      <div className="space-y-2">
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: c.surfaceBorder }}
        >
          <div
            className="h-full"
            style={{
              width: `${progressPercent}%`,
              background: `linear-gradient(90deg, ${c.sky}, ${c.emerald})`
            }}
          />
        </div>
        <div
          className="flex items-center justify-between text-[11px]"
          style={{ color: c.text }}
        >
          <span className="inline-flex items-center gap-1 font-semibold">
            <PiggyBank className="w-3 h-3" aria-hidden="true" />
            {formatAmount(savedGold)}
          </span>
          <span className="opacity-70">
            {remainingGold === 0
              ? "Goal reached"
              : `${formatAmount(remainingGold)} to go`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
