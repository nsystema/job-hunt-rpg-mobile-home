export const FOCUS_BASELINE = 20;

export const xpl = (level) => Math.max(12, Math.round(20 + 0.82 * (level - 1)));

export function lvl(totalXp) {
  let currentLevel = 1;
  let remaining = totalXp;
  for (;;) {
    const need = xpl(currentLevel);
    if (remaining >= need) {
      remaining -= need;
      currentLevel += 1;
      if (currentLevel > 999) break;
    } else {
      break;
    }
  }
  return { level: currentLevel, remainder: remaining, need: xpl(currentLevel) };
}

export const last7 = (() => {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return {
      day: d.toISOString().slice(5, 10),
      apps: Math.max(
        0,
        Math.round((Math.sin(i * 1.1) + 1) * 4 + (i % 3 === 0 ? 3 : 0))
      )
    };
  });
})();

export function focusCost(type, reduction = 0) {
  const base = type === 'Full' ? 1 : 0.5;
  const min = type === 'Full' ? 0.5 : 0.25;
  return Math.max(min, base - reduction);
}

export function computeRewards(application, options = {}) {
  const { streak = 0, effects = [], spray = 1 } = options;
  const applicationUnit = application.type === 'Full' ? 1 : 0.5;
  const qualityScore =
    (application.type === 'Full' ? 1 : 0) +
    (application.cvTailored ? 1 : 0) +
    (application.motivation ? 1 : 0);

  const baseXp = 10 * applicationUnit;
  const baseGold = 5 * applicationUnit;

  const xpBuff = effects.some((e) => e.id === 1 || e.id === 3) ? 2 : 1;
  const goldBuff = effects.some((e) => e.id === 2) ? 2 : 1;

  let xpMultiplier = (1 + 0.15 * qualityScore) * (1 + streak) * xpBuff * spray;
  let goldMultiplier = (1 + 0.1 * qualityScore) * goldBuff * spray;

  if (qualityScore >= 2 && qualityScore < 3) {
    xpMultiplier *= 1.25;
    goldMultiplier *= 1.15;
  } else if (qualityScore === 3) {
    xpMultiplier *= 1.4;
    goldMultiplier *= 1.25;
  }

  const xp = Math.round(baseXp * xpMultiplier);
  const gold = Math.round(baseGold * goldMultiplier);
  const rareWeight = qualityScore === 3 ? 1.1 : 1;
  return { xp, gold, qualityScore, applicationUnit, rareWeight };
}

export const GAME_EFFECTS = [
  {
    id: 1,
    name: 'XP Boost',
    cost: 10,
    icon: 'Zap',
    description: 'Double XP for 10 minutes',
    duration: 600
  },
  {
    id: 2,
    name: 'Gold Rush',
    cost: 15,
    icon: 'Coins',
    description: 'Double gold for 10 minutes',
    duration: 600
  },
  {
    id: 3,
    name: "Ghost's Revenge",
    cost: 25,
    icon: 'Ghost',
    description: 'Double XP for 1 hour',
    duration: 3600
  }
];

export const REAL_REWARDS = [
  { id: 1, name: 'Watch TV show', minutes: 40, pleasure: 1 },
  { id: 2, name: 'Guilt free gaming session', minutes: 60, pleasure: 1 },
  { id: 3, name: 'Microdose', minutes: 120, pleasure: 1 },
  { id: 4, name: 'Wellness Voucher', minutes: 120, pleasure: 2 },
  { id: 6, name: 'Watch anime', minutes: 20, pleasure: 1 }
];

export const PREMIUM_REWARDS = [
  { id: 5, name: 'Premium Reward', minutes: 50, pleasure: 20 }
];

const pad = (n) => String(n).padStart(2, '0');

export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(secs)}`
    : `${pad(minutes)}:${pad(secs)}`;
};

export const chestRarityDetails = {
  Common: {
    headline: 'Reliable stash',
    helper: 'Solid boosts to keep momentum steady.'
  },
  Rare: {
    headline: 'Shiny find',
    helper: 'Elevated rewards with a spark of luck.'
  },
  Epic: {
    headline: 'Elite haul',
    helper: 'High-tier loot for big progress leaps.'
  },
  Legendary: {
    headline: 'Mythic treasure',
    helper: 'Top-shelf rewards reserved for heroes.'
  }
};

export const rarityWeights = [
  { key: 'Common', gold: [4, 12], threshold: 0.58 },
  { key: 'Rare', gold: [8, 18], threshold: 0.82 },
  { key: 'Epic', gold: [14, 28], threshold: 0.96 },
  { key: 'Legendary', gold: [24, 48], threshold: 1 }
];

export function rollChest(rareWeight = 1) {
  const weight = Math.max(0.2, Math.min(rareWeight, 3));
  const roll = Math.pow(Math.random(), 1 / weight);
  return rarityWeights.find((item) => roll <= item.threshold) ?? rarityWeights[0];
}

export const PLACEHOLDER_CHESTS = Array.from({ length: 12 }, (_, index) => {
  const rarity = rollChest();
  return {
    id: `chest-${index}`,
    rarity: rarity.key,
    gold: rarity.gold
  };
});

export function getChestGoldRange(list = []) {
  if (!list.length) return null;
  const min = list.reduce(
    (value, chest) => value + (Array.isArray(chest.gold) ? chest.gold[0] ?? 0 : 0),
    0
  );
  const max = list.reduce(
    (value, chest) => value + (Array.isArray(chest.gold) ? chest.gold[1] ?? chest.gold[0] ?? 0 : 0),
    0
  );
  return [min, max];
}

export function resolveChestReward(chest) {
  if (!chest) return 0;
  if (Array.isArray(chest.gold)) {
    const [min, max] = chest.gold;
    const low = Number.isFinite(min) ? min : 0;
    const high = Number.isFinite(max) ? max : low;
    return Math.floor(Math.random() * (high - low + 1)) + low;
  }
  return chest.gold ?? 0;
}
