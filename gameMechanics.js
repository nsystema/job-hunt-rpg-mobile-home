// Leveling mechanics
export const xpl = (L) => Math.round(214.2 + 8.4 * (L - 1));

export function lvl(x) {
  let l = 1, r = x;
  for (;;) {
    const n = xpl(l);
    if (r >= n) {
      r -= n;
      l++;
      if (l > 999) break;
    } else break;
  }
  return { l, rem: r, need: xpl(l) };
}

// Focus (Stamina) mechanics
export const FOCUS_BASELINE = 20;
export function focusCost(type, reduction = 0) {
  const base = type === "Full" ? 1 : 0.5;
  const min = type === "Full" ? 0.5 : 0.25;
  return Math.max(min, base - reduction);
}

// XP/Gold reward mechanics
export function computeRewards(app, opts = {}) {
  const { streak = 0, effects = [], spray = 1 } = opts;
  const au = app.type === "Full" ? 1 : 0.5;
  const qs =
    (app.type === "Full" ? 1 : 0) +
    (app.cvTailored ? 1 : 0) +
    (app.motivation ? 1 : 0);

  const baseXp = 10 * au;
  const baseGold = 5 * au;

  // Buff multipliers from active effects
  const xpBuff = effects.some((e) => e.id === 1 || e.id === 3) ? 2 : 1;
  const goldBuff = effects.some((e) => e.id === 2) ? 2 : 1;

  let xpMultiplier = (1 + 0.15 * qs) * (1 + streak) * xpBuff * spray;
  let goldMultiplier = (1 + 0.1 * qs) * goldBuff * spray;

  if (qs >= 2 && qs < 3) {
    xpMultiplier *= 1.25;
    goldMultiplier *= 1.15;
  } else if (qs === 3) {
    xpMultiplier *= 1.4;
    goldMultiplier *= 1.25;
  }

  const xp = Math.round(baseXp * xpMultiplier);
  const gold = Math.round(baseGold * goldMultiplier);
  const rareWeight = qs === 3 ? 1.1 : 1;
  return { xp, gold, qs, au, rareWeight };
}

// Shop mechanics
export const GAME_EFFECTS = [
  {
    id: 1,
    name: "XP Boost",
    cost: 10,
    icon: "flash",
    description: "Double XP for 10 minutes",
    duration: 600,
  },
  {
    id: 2,
    name: "Gold Rush",
    cost: 15,
    icon: "diamond-stone",
    description: "Double gold for 10 minutes",
    duration: 600,
  },
  {
    id: 3,
    name: "Ghost's Revenge",
    cost: 25,
    icon: "ghost",
    description: "Double XP for 1 hour",
    duration: 3600,
  },
];

export const REAL_REWARDS = [
  { id: 1, name: "Watch TV show", minutes: 40, pleasure: 1 },
  { id: 2, name: "Guilt free gaming session", minutes: 60, pleasure: 1 },
  { id: 3, name: "Microdose", minutes: 120, pleasure: 1 },
  { id: 4, name: "Wellness Voucher", minutes: 120, pleasure: 2 },
  { id: 6, name: "Watch anime", minutes: 20, pleasure: 1 },
];

export const PREMIUM_REWARDS = [
  { id: 5, name: "Premium Reward", minutes: 50, pleasure: 20 },
];

const pad = (n) => String(n).padStart(2, "0");

export const formatTime = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};

export function buyEffect(item, gold, setGold, effects, setEffects) {
  if (gold >= item.cost && !effects.some((fx) => fx.id === item.id)) {
    setGold((g) => g - item.cost);
    setEffects((list) => [
      ...list,
      {
        ...item,
        expiresAt: item.duration ? Date.now() + item.duration * 1000 : undefined,
      },
    ]);
  }
}

export function redeemReward(r, gold, setGold, setRedeemed) {
  const cost = Math.round(r.minutes * (r.pleasure ?? 1));
  if (gold >= cost) {
    setGold((g) => g - cost);
    setRedeemed(r);
  }
}
