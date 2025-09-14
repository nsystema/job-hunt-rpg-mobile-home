import React from "react";
import { Gift, Clock, Coins, Zap } from "lucide-react";
import { Grey } from "./data.jsx";
import GoldPill from "./components/GoldPill.jsx";
import {
  GAME_EFFECTS,
  REAL_REWARDS,
  formatTime,
  buyEffect,
  redeemReward
} from "./gameMechanics.js";
import { motion, AnimatePresence } from "framer-motion";


const shadow = (t, l, d) => (t === "light" ? l : d);
const Panel = ({ c, t, children }) => (
  <motion.section
    className="rounded-2xl p-4 backdrop-blur-sm"
    style={{
      background: `linear-gradient(135deg, ${c.chipBg}, ${c.surface})`,
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
    {children}
  </motion.section>
);

export default function Shop({ c, eff, gold, setGold, effects, setEffects }) {
  const [now, setNow] = React.useState(Date.now());
  const [redeemed, setRedeemed] = React.useState(null);
  const [confirmReward, setConfirmReward] = React.useState(null);
  React.useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      setEffects((e) => e.filter((fx) => !fx.expiresAt || fx.expiresAt > Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [setEffects]);
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setConfirmReward(null);
        setRedeemed(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const handleBuyEffect = (item) =>
    buyEffect(item, gold, setGold, effects, setEffects);
  const handleRedeemReward = (r) =>
    redeemReward(r, gold, setGold, setRedeemed);



  return (
    <div
      className="grid gap-4 p-4 rounded-3xl relative overflow-hidden"
      style={{
        background:
          `radial-gradient(circle at 0% 0%, ${c.rose}55, transparent 70%),` +
          `radial-gradient(circle at 100% 0%, ${c.sky}55, transparent 70%),` +
          `radial-gradient(circle at 100% 100%, ${c.emerald}55, transparent 70%),` +
          `radial-gradient(circle at 0% 100%, ${c.lilac}55, transparent 70%)`,
        border: `1px solid ${c.surfaceBorder}`,
        boxShadow: shadow(
          eff,
          "0 20px 60px rgba(0,0,0,.12),0 8px 16px rgba(0,0,0,.06)",
          "0 24px 70px rgba(0,0,0,.46),0 8px 18px rgba(0,0,0,.32)"
        )
      }}
    >
      <div className="flex items-center flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <GoldPill c={c}>{gold}</GoldPill>
          <div className="flex items-center gap-2">
            {effects.map((e, i) => {
              const Icon = e.icon || Zap;
              const remaining = e.expiresAt
                ? Math.max(0, Math.ceil((e.expiresAt - now) / 1000))
                : null;
              return (
                <div key={i} className="relative" title={e.description}>
                  <motion.span
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.span>
                  {remaining !== null && (
                    <span
                      className="absolute -top-2 -right-2 px-1 py-px text-[8px]"
                      style={{ color: c.text }}
                    >
                      {formatTime(remaining)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pt-2">
        <div className="text-sm font-semibold mb-2">In-game effects</div>
        <div className="grid gap-2">
          {GAME_EFFECTS.slice()
            .sort((a, b) => a.cost - b.cost)
            .map((item) => {
              const active = effects.some((e) => e.id === item.id);
              return (
                <Panel key={item.id} c={c} t={eff}>
                  <div
                    className="flex items-center justify-between"
                    title={item.description}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="w-5 h-5" />
                      <div className="text-[14px] font-medium">{item.name}</div>
                    </div>
                    <GoldPill
                      c={c}
                      onClick={() => handleBuyEffect(item)}
                      dim={gold < item.cost || active}
                    >
                      {item.cost}
                    </GoldPill>
                  </div>
                </Panel>
              );
            })}
        </div>
      </div>

      <div className="pt-4">
        <div className="text-sm font-semibold mb-2">Real-life rewards</div>
        <div className="grid gap-2">
          {REAL_REWARDS.slice()
            .sort((a, b) => {
              const costA = Math.round(a.minutes * (a.pleasure ?? 1));
              const costB = Math.round(b.minutes * (b.pleasure ?? 1));
              return costA - costB;
            })
            .map((item) => {
              const cost = Math.round(item.minutes * (item.pleasure ?? 1));
              return (
                <Panel key={item.id} c={c} t={eff}>
                  <div
                    className="flex items-center justify-between"
                    title={`${item.minutes} min • ${cost}g`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Gift className="w-5 h-5" />
                        <div className="text-[14px] font-medium">{item.name}</div>
                      </div>
                      <div
                        className="flex items-center gap-2 text-[12px]"
                        style={{ color: Grey }}
                      >
                        <Clock className="w-3 h-3" /> {item.minutes}
                        <Coins className="w-3 h-3" /> {cost}
                      </div>
                    </div>
                    <GoldPill
                      c={c}
                      onClick={() => setConfirmReward(item)}
                      dim={gold < cost}
                    >
                      {cost}
                    </GoldPill>
                  </div>
                </Panel>
              );
            })}
        </div>
      </div>
      <AnimatePresence>
        {confirmReward && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: eff === "light" ? "rgba(0,0,0,.25)" : "rgba(0,0,0,.55)",
              backdropFilter: "blur(2px)"
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmReward(null)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              className="rounded-xl p-4 text-center space-y-4"
              style={{
                background: c.surface,
                border: `1px solid ${c.surfaceBorder}`
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-sm font-medium">
                Spend {Math.round(confirmReward.minutes * (confirmReward.pleasure ?? 1))}g
                for {confirmReward.name}?
              </div>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setConfirmReward(null)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{
                    background: c.surface,
                    border: `1px solid ${c.surfaceBorder}`
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleRedeemReward(confirmReward);
                    setConfirmReward(null);
                  }}
                  className="px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{
                    background: `linear-gradient(90deg, ${c.sky}, ${c.emerald})`,
                    border: `1px solid ${c.surfaceBorder}`,
                    color: "#0f172a"
                  }}
                >
                  Yes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {redeemed && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: eff === "light" ? "rgba(0,0,0,.25)" : "rgba(0,0,0,.55)",
              backdropFilter: "blur(2px)"
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRedeemed(null)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              className="rounded-xl p-4 text-center"
              style={{
                background: c.surface,
                border: `1px solid ${c.surfaceBorder}`
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 text-sm font-medium">Enjoy {redeemed.name}!</div>
              <button
                onClick={() => setRedeemed(null)}
                className="px-3 py-2 rounded-lg text-sm font-semibold"
                style={{
                  background: `linear-gradient(90deg, ${c.sky}, ${c.emerald})`,
                  border: `1px solid ${c.surfaceBorder}`,
                  color: "#0f172a"
                }}
              >
                OK
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

