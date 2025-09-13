import React from "react";
import { Coins, Zap, Gift, Clock } from "lucide-react";
import { Grey } from "./data.jsx";
import GoldPill from "./components/GoldPill.jsx";

const GAME_EFFECTS = [
  {
    id: 1,
    name: "XP Boost",
    cost: 10,
    icon: Zap,
    description: "Double XP for 10 minutes",
    duration: 600
  },
  {
    id: 2,
    name: "Gold Rush",
    cost: 15,
    icon: Coins,
    description: "Earn extra gold on next quest",
    // not time bound
  }
];

const REAL_REWARDS = [
  { id: 1, name: "Watch anime episode", minutes: 20, pleasure: 1 },
  { id: 2, name: "Premium coffee", minutes: 15, pleasure: 2 }
];

const shadow = (t, l, d) => (t === "light" ? l : d);
const Panel = ({ c, t, children }) => (
  <section
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
  >
    {children}
  </section>
);

export default function Shop({ c, eff, gold, setGold, effects, setEffects }) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      setEffects((e) => e.filter((fx) => !fx.expiresAt || fx.expiresAt > Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [setEffects]);

  const pad = (n) => String(n).padStart(2, "0");
  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
  };

  const buyEffect = (item) => {
    if (gold >= item.cost && !effects.some((fx) => fx.id === item.id)) {
      setGold((g) => g - item.cost);
      setEffects((e) => [
        ...e,
        {
          ...item,
          expiresAt: item.duration ? Date.now() + item.duration * 1000 : undefined
        }
      ]);
    }
  };

  const redeemReward = (r) => {
    const cost = Math.round(r.minutes * (r.pleasure ?? 1));
    if (gold >= cost) {
      setGold((g) => g - cost);
      alert(`Enjoy ${r.name}!`);
    }
  };

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
      <div className="flex items-center justify-between">
        <GoldPill c={c}>{gold}</GoldPill>
        <div className="flex items-center gap-2">
          {effects.map((e, i) => {
            const Icon = e.icon || Zap;
            const remaining = e.expiresAt
              ? Math.max(0, Math.ceil((e.expiresAt - now) / 1000))
              : null;
            return (
              <div key={i} className="relative" title={e.description}>
                <Icon className="w-5 h-5 animate-bounce" />
                {remaining !== null && (
                  <span
                    className="absolute -top-2 -right-2 rounded px-1 py-px text-[8px]"
                    style={{
                      background:
                        eff === "light"
                          ? "rgba(255,255,255,.85)"
                          : "rgba(0,0,0,.85)",
                      color: eff === "light" ? "#0f172a" : "#f8fafc",
                      border: `1px solid ${c.surfaceBorder}`
                    }}
                  >
                    {formatTime(remaining)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-2">
        <div className="text-sm font-semibold mb-2">In-game effects</div>
        <div className="grid gap-2">
          {GAME_EFFECTS.map((item) => {
            const active = effects.some((e) => e.id === item.id);
            return (
              <Panel key={item.id} c={c} t={eff}>
                <div className="flex items-center justify-between" title={item.description}>
                  <div className="flex items-center gap-2">
                    <item.icon className="w-5 h-5" />
                    <div className="text-[14px] font-medium">{item.name}</div>
                  </div>
                  <GoldPill
                    c={c}
                    onClick={() => buyEffect(item)}
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
          {REAL_REWARDS.map((item) => {
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
                    onClick={() => redeemReward(item)}
                    dim={gold < cost}
                  >
                    Redeem
                  </GoldPill>
                </div>
              </Panel>
            );
          })}
        </div>
      </div>
    </div>
  );
}

