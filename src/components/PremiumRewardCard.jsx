import React from "react";
import { motion } from "framer-motion";
import { Gift, Clock, Coins } from "lucide-react";
import GoldPill from "./GoldPill.jsx";
import { Grey } from "../data.jsx";

const shadow = (t, l, d) => (t === "light" ? l : d);

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
  return (
    <motion.div
      className="relative p-4 rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${c.surface}, ${c.chipBg}) padding-box,` +
          `linear-gradient(135deg, ${c.sky}, ${c.emerald}) border-box`,
        border: "2px solid transparent",
        boxShadow: shadow(
          eff,
          "0 8px 24px rgba(0,0,0,.12),0 2px 6px rgba(0,0,0,.06)",
          "0 8px 24px rgba(0,0,0,.46),0 2px 6px rgba(0,0,0,.30)"
        )
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${c.sky}, ${c.emerald})`,
              color: "#0f172a"
            }}
          >
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[14px] font-semibold">{item.name}</div>
            <div
              className="flex items-center gap-2 text-[12px]"
              style={{ color: Grey }}
            >
              <Clock className="w-3 h-3" /> {item.minutes}
              <Coins className="w-3 h-3" /> {cost}
            </div>
          </div>
        </div>
        <GoldPill
          c={c}
          onClick={() => onAction(item)}
          dim={completed ? false : gold <= 0}
        >
          {completed ? "Claim" : "Save"}
        </GoldPill>
      </div>
      <div className="mt-4">
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ background: c.surfaceBorder }}
        >
          <div
            className="h-full"
            style={{
              width: `${Math.min((progress / cost) * 100, 100)}%`,
              background: `linear-gradient(90deg, ${c.sky}, ${c.emerald})`
            }}
          />
        </div>
        <div
          className="text-xs font-semibold mt-1"
          style={{ color: c.text }}
        >
          {progress}/{cost}g
        </div>
      </div>
    </motion.div>
  );
}
