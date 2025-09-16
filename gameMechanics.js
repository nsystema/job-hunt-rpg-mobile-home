// Leveling mechanics
export const xpl = (L) => Math.max(12, Math.round(20 + 0.82 * (L - 1)));

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