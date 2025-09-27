import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const createChestArt = ({
  baseGradient,
  lidGradient,
  outline,
  strapColor,
  strapHighlight,
  latchColor,
  latchOutline,
  accentLine,
  baseDividers,
}) => {
  return ({ size = 56 }) => {
    const baseWidth = size * 0.82;
    const baseHeight = size * 0.48;
    const lidHeight = size * 0.3;
    const strapWidth = size * 0.18;
    const strapHeight = size * 0.56;
    const latchWidth = size * 0.24;
    const latchHeight = size * 0.24;
    const radius = size * 0.18;
    const outlineWidth = Math.max(1, Math.round(size * 0.035));
    const baseLeft = (size - baseWidth) / 2;
    const lidTop = size * 0.12;
    const baseBottom = size * 0.16;

    return (
      <View
        style={{
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            position: 'absolute',
            bottom: baseBottom - baseHeight * 0.1,
            width: baseWidth * 1.04,
            height: baseHeight * 0.22,
            backgroundColor: outline,
            opacity: 0.18,
            borderRadius: baseHeight * 0.3,
            transform: [{ scaleY: 0.8 }],
          }}
        />
        <LinearGradient
          colors={lidGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            top: lidTop,
            left: baseLeft,
            width: baseWidth,
            height: lidHeight,
            borderTopLeftRadius: radius,
            borderTopRightRadius: radius,
            borderBottomLeftRadius: radius * 0.6,
            borderBottomRightRadius: radius * 0.6,
            borderWidth: outlineWidth,
            borderColor: outline,
          }}
        />
        <LinearGradient
          colors={baseGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            bottom: baseBottom,
            left: baseLeft,
            width: baseWidth,
            height: baseHeight,
            borderRadius: radius,
            borderWidth: outlineWidth,
            borderColor: outline,
          }}
        />
        {(baseDividers || []).map((offset, index) => (
          <View
            key={`divider-${index}`}
            style={{
              position: 'absolute',
              bottom: baseBottom + outlineWidth,
              left: baseLeft + baseWidth * offset - outlineWidth / 2,
              width: outlineWidth,
              height: baseHeight - outlineWidth * 2,
              backgroundColor: outline,
              opacity: 0.22,
              borderRadius: outlineWidth,
            }}
          />
        ))}
        <View
          style={{
            position: 'absolute',
            top: size * 0.1,
            left: size / 2 - strapWidth / 2,
            width: strapWidth,
            height: strapHeight,
            borderRadius: strapWidth / 2,
            backgroundColor: strapColor,
            borderWidth: outlineWidth,
            borderColor: outline,
            justifyContent: 'center',
          }}
        >
          {strapHighlight ? (
            <View
              style={{
                alignSelf: 'center',
                width: strapWidth * 0.36,
                height: strapHeight - outlineWidth * 3,
                borderRadius: strapWidth / 2,
                backgroundColor: strapHighlight,
                opacity: 0.35,
              }}
            />
          ) : null}
        </View>
        <View
          style={{
            position: 'absolute',
            top: size * 0.34,
            width: latchWidth,
            height: latchHeight,
            borderRadius: latchWidth * 0.25,
            backgroundColor: latchColor,
            borderWidth: outlineWidth,
            borderColor: latchOutline || outline,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {accentLine ? (
            <View
              style={{
                width: latchWidth * 0.45,
                height: outlineWidth,
                borderRadius: outlineWidth / 2,
                backgroundColor: accentLine,
              }}
            />
          ) : null}
        </View>
      </View>
    );
  };
};

const CommonChest = createChestArt({
  baseGradient: ['#fcd34d', '#f97316'],
  lidGradient: ['#fde68a', '#fb923c'],
  outline: '#78350f',
  strapColor: '#fde68a',
  strapHighlight: '#fff7ed',
  latchColor: '#facc15',
  latchOutline: '#78350f',
  accentLine: '#78350f',
  baseDividers: [0.35, 0.65],
});

const RareChest = createChestArt({
  baseGradient: ['#c4b5fd', '#7c3aed'],
  lidGradient: ['#ddd6fe', '#8b5cf6'],
  outline: '#4c1d95',
  strapColor: '#ddd6fe',
  strapHighlight: '#ede9fe',
  latchColor: '#c4b5fd',
  latchOutline: '#4c1d95',
  accentLine: '#4c1d95',
  baseDividers: [0.33, 0.67],
});

const EpicChest = createChestArt({
  baseGradient: ['#f472b6', '#ec4899'],
  lidGradient: ['#f9a8d4', '#f472b6'],
  outline: '#9d174d',
  strapColor: '#f9a8d4',
  strapHighlight: '#fdf2f8',
  latchColor: '#f472b6',
  latchOutline: '#9d174d',
  accentLine: '#9d174d',
  baseDividers: [0.32, 0.68],
});

const LegendaryChest = createChestArt({
  baseGradient: ['#fbbf24', '#f97316'],
  lidGradient: ['#fef08a', '#fbbf24'],
  outline: '#92400e',
  strapColor: '#fef08a',
  strapHighlight: '#fefce8',
  latchColor: '#fbbf24',
  latchOutline: '#92400e',
  accentLine: '#92400e',
  baseDividers: [0.3, 0.7],
});

export const CHEST_ART = {
  Common: CommonChest,
  Rare: RareChest,
  Epic: EpicChest,
  Legendary: LegendaryChest,
};

export const RARITIES = [
  { key: 'Common', weight: 0.52, level100Weight: 0.3, gold: [8, 24] },
  { key: 'Rare', weight: 0.3, level100Weight: 0.35, gold: [16, 36] },
  { key: 'Epic', weight: 0.14, level100Weight: 0.25, gold: [28, 56] },
  { key: 'Legendary', weight: 0.04, level100Weight: 0.1, gold: [48, 96] },
];

export const RARITY_DETAILS = {
  Common: {
    headline: 'Reliable stash',
    helper: 'Solid boosts to keep momentum steady.',
  },
  Rare: {
    headline: 'Shiny find',
    helper: 'Elevated rewards with a spark of luck.',
  },
  Epic: {
    headline: 'Elite haul',
    helper: 'High-tier loot for big progress leaps.',
  },
  Legendary: {
    headline: 'Mythic treasure',
    helper: 'Top-shelf rewards reserved for heroes.',
  },
};

const RARITY_LOOKUP = RARITIES.reduce((acc, entry) => {
  acc[entry.key.toLowerCase()] = entry;
  return acc;
}, {});

let chestIdCounter = 0;

export const createChestId = () => {
  chestIdCounter += 1;
  return `chest-${Date.now()}-${chestIdCounter}`;
};

export const createChestFromRarity = (rarityInput) => {
  if (!rarityInput) {
    return null;
  }
  let key = null;
  if (typeof rarityInput === 'string') {
    key = rarityInput.trim();
  } else if (typeof rarityInput === 'object') {
    key = rarityInput.key || rarityInput.rarity || null;
  }
  if (!key) {
    return null;
  }
  const match = RARITY_LOOKUP[key.toLowerCase()];
  if (!match) {
    return null;
  }
  return {
    id: createChestId(),
    rarity: match.key,
    gold: Array.isArray(match.gold) ? [...match.gold] : match.gold,
  };
};

const CHEST_LEVEL_CAP = 100;

const clampDropLevel = (level) => {
  if (!Number.isFinite(level)) {
    return 1;
  }
  return Math.min(Math.max(Math.floor(level), 1), CHEST_LEVEL_CAP);
};

const getChestWeightsForLevel = (level) => {
  const clampedLevel = clampDropLevel(level);
  const progress = CHEST_LEVEL_CAP <= 1 ? 1 : (clampedLevel - 1) / (CHEST_LEVEL_CAP - 1);
  const weights = RARITIES.map((rarity) => {
    const start = rarity.weight ?? 0;
    const end = rarity.level100Weight ?? start;
    const value = start + (end - start) * progress;
    return { key: rarity.key, weight: value };
  });
  const total = weights.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) {
    return weights.map((entry) => ({ ...entry, weight: 0 }));
  }
  return weights.map((entry) => ({ ...entry, weight: entry.weight / total }));
};

const pickChestRarityForLevel = (level) => {
  const weights = getChestWeightsForLevel(level);
  if (!weights.length) {
    return null;
  }
  const roll = Math.random();
  let cumulative = 0;
  for (const entry of weights) {
    cumulative += entry.weight;
    if (roll < cumulative) {
      return entry.key;
    }
  }
  return weights[weights.length - 1].key;
};

export const createLevelUpChest = (level) => {
  const rarityKey = pickChestRarityForLevel(level);
  return rarityKey ? createChestFromRarity(rarityKey) : null;
};

export const rand = ([min, max]) => Math.floor(Math.random() * (max - min + 1)) + min;

export const computePotential = (list = []) => {
  if (!list.length) {
    return null;
  }
  const goldMin = list.reduce(
    (acc, chest) => acc + (Array.isArray(chest.gold) ? chest.gold[0] ?? 0 : 0),
    0,
  );
  const goldMax = list.reduce(
    (acc, chest) => acc + (Array.isArray(chest.gold) ? chest.gold[1] ?? chest.gold[0] ?? 0 : 0),
    0,
  );
  return [goldMin, goldMax];
};

export const formatRange = (range) => {
  if (!range) {
    return '0';
  }
  const [min, max] = range;
  return min === max ? `${min}` : `${min} – ${max}`;
};
