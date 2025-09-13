import React from "react";
import { Coins } from "lucide-react";
import { Grey } from "./data.jsx";

const GAME_EFFECTS = [
  { id: 1, name: "XP Boost", cost: 10, description: "Double XP for 10 minutes" },
  { id: 2, name: "Gold Rush", cost: 15, description: "Earn extra gold on next quest" }
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
  const buyEffect = (item) => {
    if (gold >= item.cost) {
      setGold((g) => g - item.cost);
      setEffects((e) => [...e, item]);
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
      <Panel c={c} t={eff}>
        <div className="flex items-center justify-between">
          <div className="font-semibold">Gold</div>
          <div className="flex items-center gap-1 font-extrabold">
            <Coins className="w-4 h-4" />{gold}
          </div>
        </div>
        <div className="mt-3">
          <div className="text-[12px] mb-1" style={{ color: Grey }}>
            Active effects
          </div>
          {effects.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {effects.map((e, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-[12px] rounded-md"
                  style={{ background: c.chipBg, color: c.text }}
                >
                  {e.name}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-[12px]" style={{ color: Grey }}>
              None
            </div>
          )}
        </div>
      </Panel>

      <div className="pt-2">
        <div className="text-sm font-semibold mb-2">In-game effects</div>
        <div className="grid gap-2">
          {GAME_EFFECTS.map((item) => (
            <Panel key={item.id} c={c} t={eff}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-medium">{item.name}</div>
                  <div className="text-[12px]" style={{ color: Grey }}>
                    {item.description}
                  </div>
                </div>
                <button
                  disabled={gold < item.cost}
                  onClick={() => buyEffect(item)}
                  className="px-3 py-1 rounded-full text-[12px] font-semibold"
                  style={{
                    background:
                      gold >= item.cost
                        ? `linear-gradient(90deg, ${c.amber}, ${c.rose})`
                        : c.chipBg,
                    color: gold >= item.cost ? "#0f172a" : Grey
                  }}
                >
                  {item.cost}g
                </button>
              </div>
            </Panel>
          ))}
        </div>
      </div>

      <div className="pt-4">
        <div className="text-sm font-semibold mb-2">Real-life rewards</div>
        <div className="grid gap-2">
          {REAL_REWARDS.map((item) => {
            const cost = Math.round(item.minutes * (item.pleasure ?? 1));
            return (
              <Panel key={item.id} c={c} t={eff}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-medium">{item.name}</div>
                    <div className="text-[12px]" style={{ color: Grey }}>
                      {item.minutes} min • {cost}g
                    </div>
                  </div>
                  <button
                    disabled={gold < cost}
                    onClick={() => redeemReward(item)}
                    className="px-3 py-1 rounded-full text-[12px] font-semibold"
                    style={{
                      background:
                        gold >= cost
                          ? `linear-gradient(90deg, ${c.amber}, ${c.rose})`
                          : c.chipBg,
                      color: gold >= cost ? "#0f172a" : Grey
                    }}
                  >
                    Redeem
                  </button>
                </div>
              </Panel>
            );
          })}
        </div>
      </div>
    </div>
  );
}

