import 'react-native-url-polyfill/auto';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Modal,
  TextInput,
  Alert,
  PanResponder,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Defs, Rect, Path, Circle, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { usePalette, cur } from './hooks/usePalette';
import { useTheme } from './hooks/useTheme';
import {
  xpl,
  lvl,
  FOCUS_BASELINE,
  focusCost,
  computeRewards,
  GAME_EFFECTS,
  REAL_REWARDS,
  PREMIUM_REWARDS,
  formatTime,
  buyEffect,
  redeemReward,
} from './gameMechanics';
import { STATUSES, PLATFORMS, COUNTRIES, getCitiesForCountry } from './data';
import { QUESTS } from './quests';
import {
  computeQuestMetrics,
  buildQuestTabs,
  evaluateEventStates,
  computeEventProgressMap,
  composeQuestClaimKey,
} from './questUtils';

const buildInitialFormValues = () => ({
  company: '',
  role: '',
  type: 'Full',
  status: 'Applied',
  platform: 'Company website',
  cvTailored: false,
  motivation: false,
  favorite: false,
  note: '',
  country: '',
  city: '',
});

const TYPE_OPTIONS = ['Full', 'Easy'];

const QUEST_TABS = [
  { key: 'Daily', icon: 'calendar-check-outline' },
  { key: 'Weekly', icon: 'calendar-week-begin' },
  { key: 'Growth', icon: 'chart-line' },
  { key: 'Events', icon: 'party-popper' },
];

const EVENT_DEFINITIONS = (QUESTS.Events || []).filter((quest) => quest?.type === 'event');

const collectStageIds = (quest) => {
  if (!quest?.id) {
    return [];
  }
  const stageIds = [];
  if (Array.isArray(quest?.tiers)) {
    quest.tiers.forEach((tier, index) => {
      const tierId = tier?.id || `${quest.id}-tier-${index}`;
      if (tierId) {
        stageIds.push(tierId);
      }
    });
  }
  if (Array.isArray(quest?.steps)) {
    quest.steps.forEach((step, index) => {
      const stepId = step?.id || `${quest.id}-step-${index}`;
      if (stepId) {
        stageIds.push(stepId);
      }
    });
  }
  return stageIds;
};

const EVENT_STAGE_IDS = EVENT_DEFINITIONS.reduce((acc, quest) => {
  if (quest?.id) {
    acc[quest.id] = collectStageIds(quest);
  }
  return acc;
}, {});

const isQuestTrackable = (quest) => quest?.trackable === true;

const isQuestClaimable = (quest) => quest?.claimable === true;

const BOTTOM_TABS = [
  { key: 'Home', label: 'Home', icon: 'home-variant' },
  { key: 'Apps', label: 'Apps', icon: 'briefcase-outline' },
  { key: 'Quests', label: 'Quests', icon: 'clipboard-check-outline' },
  { key: 'Rewards', label: 'Rewards', icon: 'treasure-chest' },
  { key: 'Shop', label: 'Shop', icon: 'shopping-outline' },
];

const SHOP_MAIN_TABS = [
  { key: 'active', label: 'Active', icon: 'auto-fix' },
  { key: 'catalogue', label: 'Catalogue', icon: 'view-grid-outline' },
];

const SHOP_CATALOG_TABS = [
  { key: 'effects', label: 'Boosts', icon: 'flash-outline' },
  { key: 'rewards', label: 'Treats', icon: 'cupcake' },
  { key: 'premium', label: 'Premium', icon: 'crown-outline' },
];

const SPRAY_DEBUFF_DURATION_MS = 6 * 60 * 60 * 1000;
const SPRAY_DEBUFF_DURATION_SECONDS = SPRAY_DEBUFF_DURATION_MS / 1000;

const STATUS_META = {
  Applied: { icon: 'file-document-outline', tint: 'sky' },
  'Applied with referral': { icon: 'account-star-outline', tint: 'sky' },
  Interview: { icon: 'account-tie-voice', tint: 'emerald' },
  Ghosted: { icon: 'ghost-outline', tint: 'rose' },
  Rejected: { icon: 'close-circle-outline', tint: 'rose' },
};

const LOG_STATUS_OPTIONS = STATUSES.filter(
  (status) => status.key === 'Applied' || status.key === 'Applied with referral',
);

const hexToRgba = (hex, alpha) => {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
    return `rgba(148, 163, 184, ${alpha})`;
  }
  const sanitized = hex.replace('#', '');
  const normalized =
    sanitized.length === 3
      ? sanitized
          .split('')
          .map((char) => char + char)
          .join('')
      : sanitized.slice(0, 6);
  const bigint = parseInt(normalized, 16);
  if (Number.isNaN(bigint)) {
    return `rgba(148, 163, 184, ${alpha})`;
  }
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getGlassGradientColors = (colors) => [
  hexToRgba(colors.sky, 0.35),
  hexToRgba(colors.emerald, 0.35),
];

const getGlassBorderColor = (colors) => hexToRgba(colors.sky, 0.45);

const ensureOpaque = (color, fallback = '#fff') => {
  if (!color || typeof color !== 'string') {
    return fallback;
  }
  const normalized = color.replace(/\s+/g, '');
  const rgbaMatch = normalized.match(/^rgba?\(([-\d.]+),([-\d.]+),([-\d.]+)(?:,([-\d.]+))?\)$/i);
  if (rgbaMatch) {
    const r = Math.round(Number(rgbaMatch[1]));
    const g = Math.round(Number(rgbaMatch[2]));
    const b = Math.round(Number(rgbaMatch[3]));
    if ([r, g, b].every((value) => !Number.isNaN(value))) {
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  if (normalized.startsWith('#')) {
    return color;
  }
  return fallback;
};

const costFor = (item) => Math.round(item.minutes * (item.pleasure ?? 1));

const formatGoldValue = (value) =>
  Math.max(0, value).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });

const formatGold = (value) => `${formatGoldValue(value)}g`;

const formatEffectDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  if (seconds >= 3600) {
    const hours = Math.round(seconds / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes >= 1) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  const rounded = Math.round(seconds);
  return `${rounded} second${rounded === 1 ? '' : 's'}`;
};

const toTimestamp = (value) => {
  if (value == null) {
    return NaN;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : NaN;
  }
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) ? time : NaN;
  }
  if (typeof value === 'string' && value.trim().length) {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? NaN : parsed;
  }
  return NaN;
};

const createChestArt = ({
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
                opacity: 0.85,
              }}
            />
          ) : null}
        </View>
        {accentLine ? (
          <View
            style={{
              position: 'absolute',
              bottom: size * (accentLine.offset ?? 0.26),
              width: baseWidth * (accentLine.width ?? 0.56),
              left:
                size / 2 - (baseWidth * (accentLine.width ?? 0.56)) / 2,
              height: Math.max(1, size * (accentLine.thickness ?? 0.05)),
              borderRadius: size * (accentLine.radius ?? 0.04),
              backgroundColor: accentLine.color,
              opacity: accentLine.opacity ?? 0.35,
            }}
          />
        ) : null}
        <View
          style={{
            position: 'absolute',
            bottom: size * 0.2,
            width: latchWidth,
            height: latchHeight,
            borderRadius: latchWidth * 0.3,
            backgroundColor: latchColor,
            borderWidth: outlineWidth,
            borderColor: latchOutline || outline,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: latchWidth * 0.34,
              height: latchHeight * 0.5,
              borderRadius: latchWidth * 0.18,
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
            }}
          />
        </View>
      </View>
    );
  };
};

const CommonChest = createChestArt({
  baseGradient: ['#D7B48A', '#B28755'],
  lidGradient: ['#E4C59B', '#C89B69'],
  outline: 'rgba(78, 54, 33, 0.65)',
  strapColor: '#8D5A2B',
  strapHighlight: 'rgba(247, 230, 200, 0.55)',
  latchColor: '#F7E6C8',
  baseDividers: [0.32, 0.68],
});

const RareChest = createChestArt({
  baseGradient: ['#8BB7D8', '#4D7BA6'],
  lidGradient: ['#A7CCE4', '#5C8FB6'],
  outline: 'rgba(31, 58, 82, 0.75)',
  strapColor: '#1F4D6F',
  strapHighlight: 'rgba(210, 230, 244, 0.55)',
  latchColor: '#E8F1F7',
  latchOutline: 'rgba(31, 58, 82, 0.75)',
  baseDividers: [0.28, 0.72],
  accentLine: {
    color: 'rgba(31, 58, 82, 0.72)',
    opacity: 0.4,
    width: 0.6,
    thickness: 0.045,
    offset: 0.27,
  },
});

const EpicChest = createChestArt({
  baseGradient: ['#C2A5E6', '#8A6BBF'],
  lidGradient: ['#D7C3F0', '#9A7BD0'],
  outline: 'rgba(59, 44, 84, 0.78)',
  strapColor: '#4E3A75',
  strapHighlight: 'rgba(238, 225, 255, 0.45)',
  latchColor: '#F4ECFF',
  latchOutline: 'rgba(59, 44, 84, 0.78)',
  baseDividers: [0.26, 0.74],
  accentLine: {
    color: 'rgba(59, 44, 84, 0.6)',
    opacity: 0.55,
    width: 0.32,
    thickness: 0.04,
    offset: 0.29,
  },
});

const LegendaryChest = createChestArt({
  baseGradient: ['#F5D48D', '#D4A440'],
  lidGradient: ['#FFE6A8', '#E7BE55'],
  outline: 'rgba(124, 90, 24, 0.78)',
  strapColor: '#8A611E',
  strapHighlight: 'rgba(255, 248, 210, 0.65)',
  latchColor: '#FFF6D9',
  latchOutline: 'rgba(124, 90, 24, 0.78)',
  baseDividers: [0.26, 0.74],
  accentLine: {
    color: 'rgba(124, 90, 24, 0.6)',
    opacity: 0.5,
    width: 0.72,
    thickness: 0.05,
    offset: 0.23,
  },
});

const CHEST_ART = {
  Common: CommonChest,
  Rare: RareChest,
  Epic: EpicChest,
  Legendary: LegendaryChest,
};

const RARITIES = [
  { key: 'Common', weight: 0.52, level100Weight: 0.3, gold: [8, 24] },
  { key: 'Rare', weight: 0.3, level100Weight: 0.35, gold: [16, 36] },
  { key: 'Epic', weight: 0.14, level100Weight: 0.25, gold: [28, 56] },
  { key: 'Legendary', weight: 0.04, level100Weight: 0.1, gold: [48, 96] },
];

const RARITY_DETAILS = {
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

const createChestId = () => {
  chestIdCounter += 1;
  return `chest-${Date.now()}-${chestIdCounter}`;
};

const createChestFromRarity = (rarityInput) => {
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

const createLevelUpChest = (level) => {
  const rarityKey = pickChestRarityForLevel(level);
  return rarityKey ? createChestFromRarity(rarityKey) : null;
};

const rand = ([min, max]) => Math.floor(Math.random() * (max - min + 1)) + min;

const computePotential = (list = []) => {
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

const formatRange = (range) => {
  if (!range) {
    return '0';
  }
  const [min, max] = range;
  return min === max ? `${min}` : `${min} – ${max}`;
};

const TextField = ({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
  multiline = false,
  numberOfLines = 1,
  containerStyle,
  ...inputProps
}) => (
  <View style={[styles.formGroup, containerStyle]}>
    <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={`${colors.text}80`}
      multiline={multiline}
      numberOfLines={multiline ? numberOfLines : 1}
      style={[
        multiline ? styles.textArea : styles.textInput,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
          color: colors.text,
        },
      ]}
      {...inputProps}
    />
  </View>
);

const AutoCompleteField = ({
  label,
  value,
  onSelect,
  colors,
  placeholder,
  options = [],
  minChars = 0,
  containerStyle,
  disabled = false,
}) => {
  const [query, setQuery] = useState(value ?? '');
  const [focused, setFocused] = useState(false);
  const blurTimeout = useRef(null);

  useEffect(() => {
    if (!focused) {
      setQuery(value ?? '');
    }
  }, [value, focused]);

  useEffect(
    () => () => {
      if (blurTimeout.current) {
        clearTimeout(blurTimeout.current);
      }
    },
    [],
  );

  const trimmedQuery = query.trim();

  const normalizedOptions = useMemo(() => options.filter(Boolean), [options]);

  const suggestions = useMemo(() => {
    if (!focused || disabled) {
      return [];
    }
    if (!trimmedQuery.length) {
      return normalizedOptions;
    }
    if (trimmedQuery.length < minChars) {
      return normalizedOptions;
    }
    const lower = trimmedQuery.toLowerCase();
    return normalizedOptions.filter((option) => option.toLowerCase().includes(lower));
  }, [focused, disabled, trimmedQuery, normalizedOptions, minChars]);

  const shouldShowList = focused && !disabled && normalizedOptions.length > 0;

  const handleChange = (text) => {
    if (disabled) {
      return;
    }
    setQuery(text);
    setFocused(true);
  };

  const handleSelect = (option) => {
    setQuery(option);
    onSelect?.(option);
    setFocused(false);
    Keyboard.dismiss();
  };

  const handleFocus = () => {
    if (disabled) {
      return;
    }
    setFocused(true);
    if (!query && value) {
      setQuery(value);
    }
  };

  const handleBlur = () => {
    if (blurTimeout.current) {
      clearTimeout(blurTimeout.current);
    }
    blurTimeout.current = setTimeout(() => {
      setFocused(false);
      if ((value ?? '') !== query) {
        setQuery(value ?? '');
      }
    }, 120);
  };

  const handleClear = () => {
    setQuery('');
    onSelect?.('');
    setFocused(false);
    Keyboard.dismiss();
  };

  const hasMatches = suggestions.length > 0;

  return (
    <View style={[styles.formGroup, containerStyle]}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View
        style={[
          styles.autoCompleteInputWrapper,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          disabled && styles.disabledInput,
        ]}
      >
        <TextInput
          value={query}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={`${colors.text}80`}
          style={[
            styles.textInput,
            styles.autoCompleteInput,
            { color: colors.text, borderColor: 'transparent', backgroundColor: 'transparent' },
          ]}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCapitalize="words"
          autoCorrect={false}
          selectTextOnFocus
        />
        {!!(query || value) && !disabled && (
          <TouchableOpacity onPress={handleClear} style={styles.autoCompleteClear} hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={18} color={hexToRgba(colors.text, 0.5)} />
          </TouchableOpacity>
        )}
      </View>
      {shouldShowList && (
        <View
          style={[
            styles.autoCompleteSuggestions,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {hasMatches ? (
              suggestions.map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => handleSelect(option)}
                  style={styles.autoCompleteOption}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.autoCompleteOptionText, { color: colors.text }]}>{option}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.autoCompleteEmpty}>
                <Text style={[styles.autoCompleteEmptyText, { color: hexToRgba(colors.text, 0.6) }]}>No matches</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const IconToggle = ({ label, icon, activeIcon, value, onToggle, colors }) => {
  const iconName = value && activeIcon ? activeIcon : icon;
  const glassColors = getGlassGradientColors(colors);
  const glassBorder = getGlassBorderColor(colors);
  const inactiveBorder = colors.surfaceBorder;
  const inactiveBackground = colors.chipBg;
  const activeContentColor = '#0f172a';
  const inactiveContentColor = hexToRgba(colors.text, 0.75);
  const contentColor = value ? activeContentColor : inactiveContentColor;

  return (
    <TouchableOpacity onPress={() => onToggle(!value)} activeOpacity={0.9} style={styles.iconToggle}>
      <View
        style={[
          styles.iconToggleInner,
          { borderColor: 'transparent', backgroundColor: 'transparent', borderWidth: 0 },
        ]}
      >
        {value ? (
          <LinearGradient
            colors={glassColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.iconToggleIconWrap, { borderColor: glassBorder }]}
          >
            <MaterialCommunityIcons name={iconName} size={20} color={contentColor} />
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.iconToggleIconWrap,
              { backgroundColor: colors.chipBg, borderColor: inactiveBorder },
            ]}
          >
            <MaterialCommunityIcons name={iconName} size={20} color={contentColor} />
          </View>
        )}
        <Text style={[styles.iconToggleLabel, { color: contentColor }]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
};

const RewardPreview = ({ xp, gold, focus, colors }) => {
  const glassColors = getGlassGradientColors(colors);
  const glassBorder = getGlassBorderColor(colors);
  const chipTextColor = colors.text;
  const chips = [
    { key: 'xp', icon: 'flash-outline', label: `+${xp}` },
    { key: 'gold', icon: 'diamond-stone', label: `+${gold}` },
    { key: 'focus', icon: 'brain', label: `-${focus}` },
  ];

  return (
    <View style={styles.rewardPreview}>
      {chips.map((chip) => (
        <LinearGradient
          key={chip.key}
          colors={glassColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.rewardChip, { borderColor: glassBorder }]}
        >
          <MaterialCommunityIcons name={chip.icon} size={14} color={chipTextColor} />
          <Text style={[styles.rewardChipText, { color: chipTextColor }]}>{chip.label}</Text>
        </LinearGradient>
      ))}
    </View>
  );
};

const TypeSelector = ({ value, onChange, colors }) => {
  const glassColors = getGlassGradientColors(colors);
  const glassBorder = getGlassBorderColor(colors);
  const activeTextColor = colors.text;
  const inactiveTextColor = hexToRgba(colors.text, 0.75);

  return (
    <View style={styles.segmentedControl}>
      {TYPE_OPTIONS.map((option) => {
        const isActive = value === option;
        return (
          <TouchableOpacity
            key={option}
            onPress={() => onChange(option)}
            activeOpacity={0.85}
            style={styles.segmentButton}
          >
            {isActive ? (
              <LinearGradient
                colors={glassColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.segmentButtonInner, { borderColor: glassBorder }]}
              >
                <Text style={[styles.segmentText, { color: activeTextColor }]}>{option}</Text>
              </LinearGradient>
            ) : (
              <View
                style={[
                  styles.segmentButtonInner,
                  { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                ]}
              >
                <Text style={[styles.segmentText, { color: inactiveTextColor }]}>{option}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const StatusSelector = ({ value, onChange, colors, options = STATUSES }) => (
  <View>
    {options.map((status) => {
      const isActive = value === status.key;
      const meta = STATUS_META[status.key] || {};
      const tintColor = meta.tint ? colors[meta.tint] : colors.sky;
      return (
        <TouchableOpacity
          key={status.key}
          onPress={() => onChange(status.key)}
          activeOpacity={0.85}
          style={[
            styles.statusOption,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
            },
            isActive && {
              backgroundColor: hexToRgba(tintColor, 0.18),
              borderColor: tintColor,
            },
          ]}
        >
          <View style={styles.statusOptionContent}>
            {meta.icon ? (
              <View
                style={[
                  styles.statusOptionIcon,
                  {
                    backgroundColor: isActive ? tintColor : colors.chipBg,
                    borderColor: isActive ? tintColor : colors.surfaceBorder,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={meta.icon}
                  size={14}
                  color={isActive ? '#0f172a' : 'rgba(148,163,184,.95)'}
                />
              </View>
            ) : null}
            <View style={styles.statusOptionTextGroup}>
              <Text style={[styles.statusOptionTitle, { color: colors.text }]}>{status.key}</Text>
              {status.hint ? (
                <Text style={[styles.statusOptionHint, { color: hexToRgba(colors.text, 0.55) }]}>
                  {status.hint}
                </Text>
              ) : null}
            </View>
          </View>
          {isActive ? <MaterialCommunityIcons name="check-circle" size={18} color={tintColor} /> : null}
        </TouchableOpacity>
      );
    })}
  </View>
);

const PlatformSelector = ({ value, onChange, colors }) => {
  const glassColors = getGlassGradientColors(colors);
  const glassBorder = getGlassBorderColor(colors);
  const activeLabelColor = colors.text;
  const inactiveLabelColor = hexToRgba(colors.text, 0.75);

  return (
    <View style={styles.platformOptions}>
      {PLATFORMS.map((platform) => {
        const isActive = value === platform;
        return (
          <TouchableOpacity
            key={platform}
            onPress={() => onChange(platform)}
            activeOpacity={0.85}
            style={styles.platformChip}
          >
            {isActive ? (
              <LinearGradient
                colors={glassColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.platformChipInner, { borderColor: glassBorder }]}
              >
                <Text style={[styles.platformChipText, { color: activeLabelColor }]}>
                  {platform}
                </Text>
              </LinearGradient>
            ) : (
              <View
                style={[
                  styles.platformChipInner,
                  { backgroundColor: colors.chipBg, borderColor: colors.surfaceBorder },
                ]}
              >
                <Text style={[styles.platformChipText, { color: inactiveLabelColor }]}>
                  {platform}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Helper components
const StatBadge = ({ icon, count, colors }) => (
  <View style={[styles.statBadge, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
    <MaterialCommunityIcons name={icon} size={20} color={colors.text} />
    <View style={[styles.statBadgeCount, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <Text style={[styles.statBadgeCountText, { color: colors.text }]}>{count}</Text>
    </View>
  </View>
);

const IconButton = ({ onPress, icon, colors, accessibilityLabel }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
    accessibilityLabel={accessibilityLabel}
  >
    <MaterialCommunityIcons name={icon} size={20} color={colors.text} />
  </TouchableOpacity>
);

const ProgressBar = ({ value, max, fromColor, toColor, colors }) => {
  const percentage = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <View style={[styles.progressBarContainer, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: colors.surfaceBorder }]}> 
      <LinearGradient
        colors={[fromColor, toColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.progressBarFill, { width: `${percentage}%` }]}
      />
    </View>
  );
};

const GoldPill = ({ children, colors, onPress, dim = false, style = {}, icon = 'diamond-stone' }) => {
  const gradientColors = dim
    ? [hexToRgba('#94a3b8', 0.18), hexToRgba('#94a3b8', 0.12)]
    : ['#fde68a', '#f59e0b'];

  const content = (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.goldPill, dim && styles.goldPillDim]}
    >
      <MaterialCommunityIcons name={icon} size={16} color={dim ? hexToRgba('#0f172a', 0.55) : '#1f2937'} />
      <Text style={[styles.goldPillText, dim && styles.goldPillTextDim]}>{children}</Text>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={dim ? 1 : 0.85}
        disabled={dim}
        style={[styles.goldPillWrapper, style]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={style}>{content}</View>;
};

const Panel = ({ children, colors, style = {} }) => (
  <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }, style]}>
    {children}
  </View>
);

const EffectTimerRing = ({ progress, colors, eff, size = 64, children, gradientColors }) => {
  const strokeWidth = Math.max(4, size * 0.14);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gradientId = useMemo(() => `effect-ring-${Math.random().toString(36).slice(2, 9)}`, []);
  const normalized = progress == null ? 1 : Math.max(0, Math.min(1, progress));
  const offset = circumference * (1 - normalized);
  const innerSize = size - strokeWidth * 1.6;
  const gradientPair =
    Array.isArray(gradientColors) && gradientColors.length >= 2
      ? gradientColors
      : [colors.sky, colors.emerald];
  const [gradientStart, gradientEnd] = gradientPair;
  const trackBase = Array.isArray(gradientColors) ? gradientStart : colors.text;
  const trackColor = hexToRgba(trackBase, eff === 'light' ? 0.16 : 0.4);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgLinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradientStart} stopOpacity="1" />
            <Stop offset="100%" stopColor={gradientEnd} stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference},${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View
        style={{
          position: 'absolute',
          top: (size - innerSize) / 2,
          left: (size - innerSize) / 2,
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: eff === 'light' ? hexToRgba(colors.surface, 0.98) : hexToRgba(colors.surface, 0.78),
          borderWidth: 1,
          borderColor: colors.surfaceBorder,
        }}
      >
        {children}
      </View>
    </View>
  );
};

const GoldSlider = ({ value, max, colors, eff, onChange }) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const clampedMax = Math.max(0, max);
  const clampedValue = Math.max(0, Math.min(value, clampedMax));
  const percentage = clampedMax > 0 ? Math.min(100, (clampedValue / clampedMax) * 100) : 0;

  const handleGesture = useCallback(
    (evt) => {
      if (!trackWidth || clampedMax <= 0) {
        return;
      }
      const x = evt.nativeEvent.locationX;
      const ratio = Math.max(0, Math.min(1, x / trackWidth));
      const next = Math.round(clampedMax * ratio);
      onChange(next);
    },
    [trackWidth, clampedMax, onChange],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: handleGesture,
        onPanResponderMove: handleGesture,
        onPanResponderRelease: handleGesture,
      }),
    [handleGesture],
  );

  const thumbSize = 22;
  const thumbLeft = trackWidth ? (percentage / 100) * trackWidth : 0;

  return (
    <View
      style={[
        styles.shopSliderTrack,
        {
          borderColor: colors.surfaceBorder,
          backgroundColor: hexToRgba(colors.text, eff === 'light' ? 0.12 : 0.28),
        },
      ]}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <LinearGradient
        colors={[colors.sky, colors.emerald]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.shopSliderFill, { width: `${percentage}%` }]}
      />
      <View
        style={[
          styles.shopSliderThumb,
          {
            left: Math.max(0, Math.min(trackWidth - thumbSize, thumbLeft - thumbSize / 2)),
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            backgroundColor: colors.surface,
            borderColor: colors.surfaceBorder,
          },
        ]}
      />
    </View>
  );
};

const ShopScreen = ({
  colors,
  eff,
  gold,
  setGold,
  effects,
  setEffects,
  premiumProgress,
  setPremiumProgress,
  mainTab,
  setMainTab,
  categoryTab,
  setCategoryTab,
}) => {
  const [savingItem, setSavingItem] = useState(null);
  const [saveAmount, setSaveAmount] = useState(0);
  const [confirmReward, setConfirmReward] = useState(null);
  const [redeemed, setRedeemed] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const hasTimers = useMemo(() => effects.some((effect) => effect.expiresAt), [effects]);

  useEffect(() => {
    if (!hasTimers) {
      return;
    }
    setNow(Date.now());
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [hasTimers]);

  const sortedRewards = useMemo(
    () => REAL_REWARDS.slice().sort((a, b) => costFor(a) - costFor(b)),
    [],
  );

  const cardShadow = eff === 'light' ? styles.shopCardShadowLight : styles.shopCardShadowDark;
  const filledSurface = useMemo(
    () => (eff === 'light' ? ensureOpaque(colors.surface) : colors.surface),
    [eff, colors.surface],
  );

  const handleBuyEffect = useCallback(
    (item) => {
      buyEffect(item, gold, setGold, effects, setEffects);
    },
    [gold, setGold, effects, setEffects],
  );

  const handleRedeemReward = useCallback(
    (item) => {
      redeemReward(item, gold, setGold, setRedeemed);
    },
    [gold, setGold],
  );

  const handlePremiumAction = useCallback(
    (item) => {
      const cost = costFor(item);
      const progress = premiumProgress[item.id] || 0;
      if (progress >= cost) {
        setConfirmReward({ ...item, premium: true });
      } else {
        setSavingItem(item);
        setSaveAmount(Math.min(gold, cost - progress));
      }
    },
    [premiumProgress, gold],
  );

  const closeSavingModal = useCallback(() => {
    setSavingItem(null);
    setSaveAmount(0);
  }, []);

  const confirmSave = useCallback(() => {
    if (!savingItem) {
      return;
    }
    const cost = costFor(savingItem);
    const progress = premiumProgress[savingItem.id] || 0;
    const maxSavable = Math.max(0, Math.min(gold, cost - progress));
    const amount = Math.max(0, Math.min(saveAmount, maxSavable));
    if (amount > 0) {
      setGold((g) => g - amount);
      setPremiumProgress((prev) => ({
        ...prev,
        [savingItem.id]: Math.min(cost, progress + amount),
      }));
    }
    setSavingItem(null);
    setSaveAmount(0);
  }, [savingItem, premiumProgress, gold, saveAmount, setGold, setPremiumProgress]);

  const confirmCost = confirmReward ? costFor(confirmReward) : 0;
  const ConfirmIcon = confirmReward?.premium ? 'crown' : 'gift-outline';

  const savingProgress = savingItem ? premiumProgress[savingItem.id] || 0 : 0;
  const savingCap = savingItem ? Math.max(costFor(savingItem) - savingProgress, 0) : 0;
  const maxSavableNow = savingItem ? Math.max(0, Math.min(gold, savingCap)) : 0;
  const clampedSaveAmount = Math.max(0, Math.min(saveAmount, maxSavableNow));

  const handleConfirmAction = useCallback(() => {
    if (!confirmReward) {
      return;
    }
    if (confirmReward.premium) {
      setRedeemed(confirmReward);
      setPremiumProgress((prev) => ({
        ...prev,
        [confirmReward.id]: 0,
      }));
    } else {
      handleRedeemReward(confirmReward);
    }
    setConfirmReward(null);
  }, [confirmReward, handleRedeemReward, setPremiumProgress]);

  const formatDuration = useCallback((duration) => {
    if (!duration) {
      return 'Instant';
    }
    if (duration >= 3600) {
      return `${Math.round(duration / 3600)} hr`;
    }
    return `${Math.round(duration / 60)} min`;
  }, []);

  const overlayBackground = eff === 'light' ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.55)';

  return (
    <>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.shopContainer, { borderColor: colors.surfaceBorder, backgroundColor: colors.surface }]}
        >
          <LinearGradient
            colors={[hexToRgba(colors.rose, 0.28), 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.shopGlowTopLeft}
            pointerEvents="none"
          />
          <LinearGradient
            colors={[hexToRgba(colors.sky, 0.28), 'transparent']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.shopGlowTopRight}
            pointerEvents="none"
          />
          <LinearGradient
            colors={[hexToRgba(colors.emerald, 0.24), 'transparent']}
            start={{ x: 1, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={styles.shopGlowBottomRight}
            pointerEvents="none"
          />
          <LinearGradient
            colors={[hexToRgba(colors.lilac, 0.26), 'transparent']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={styles.shopGlowBottomLeft}
            pointerEvents="none"
          />
          <View style={styles.shopContent}>
            <View
              style={[
                styles.shopMainTabs,
                { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              ]}
            >
              {SHOP_MAIN_TABS.map((tab) => {
                const active = mainTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setMainTab(tab.key)}
                    activeOpacity={0.9}
                    style={[styles.shopMainTabButton, { borderColor: colors.surfaceBorder }]}
                  >
                    {active ? (
                      <LinearGradient
                        colors={[colors.sky, colors.emerald]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFillObject}
                      />
                    ) : null}
                    <View style={styles.shopMainTabContent}>
                      <MaterialCommunityIcons
                        name={tab.icon}
                        size={16}
                        color={active ? '#0f172a' : colors.text}
                        style={styles.shopMainTabIcon}
                      />
                      <Text
                        style={[
                          styles.shopMainTabLabel,
                          { color: active ? '#0f172a' : colors.text },
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {mainTab === 'active' ? (
              <View style={styles.shopSection}>
                <View style={styles.shopSectionHeader}>
                  <Text style={[styles.shopSectionEyebrow, { color: hexToRgba(colors.text, 0.55) }]}>Active effects</Text>
                  <Text style={[styles.shopSectionTitle, { color: colors.text }]}>Track your current boosts and penalties in real time.</Text>
                </View>
                {effects.length === 0 ? (
                  <View
                    style={[
                      styles.shopEmptyCard,
                      { backgroundColor: filledSurface, borderColor: colors.surfaceBorder },
                      cardShadow,
                    ]}
                  >
                    <View style={styles.shopEmptyHeader}>
                      <MaterialCommunityIcons name="auto-fix" size={18} color={colors.sky} />
                      <Text style={[styles.shopEmptyTitle, { color: colors.text }]}>No active effects yet</Text>
                    </View>
                    <Text style={[styles.shopEmptyDescription, { color: hexToRgba(colors.text, 0.65) }]}>Activate a boost to double down on XP or gold. Your effects — including any penalties — will appear here with live timers once purchased.</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setMainTab('catalogue');
                        setCategoryTab('effects');
                      }}
                      activeOpacity={0.9}
                      style={[styles.shopBrowseButton, { borderColor: colors.surfaceBorder }]}
                    >
                      <LinearGradient
                        colors={[colors.sky, colors.emerald]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFillObject}
                      />
                      <Text style={styles.shopBrowseButtonText}>Browse boosts</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.shopActiveList}>
                    {effects.map((effect) => {
                      const remaining = effect.expiresAt
                        ? Math.max(0, Math.floor((effect.expiresAt - now) / 1000))
                        : null;
                      const progress =
                        effect.duration && remaining != null
                          ? Math.max(0, Math.min(1, remaining / effect.duration))
                          : null;
                      const isDebuff = effect.type === 'debuff';
                      const cardBackgroundColor = filledSurface;
                      const cardBorderColor = colors.surfaceBorder;
                      const iconShellStyle = {
                        borderColor: colors.surfaceBorder,
                        backgroundColor: colors.surface,
                      };
                      const iconGradient = [
                        hexToRgba(colors.surface, 0.98),
                        hexToRgba(colors.chipBg, 0.85),
                      ];
                      const iconColor = '#0f172a';
                      const timerColor = hexToRgba(colors.text, 0.6);
                      const passiveColor = hexToRgba(colors.text, 0.6);
                      const descriptionColor = hexToRgba(colors.text, 0.65);
                      const nameColor = colors.text;

                      return (
                        <View
                          key={effect.id}
                          style={[
                            styles.shopActiveCard,
                            { backgroundColor: cardBackgroundColor, borderColor: cardBorderColor },
                            cardShadow,
                          ]}
                        >
                          <EffectTimerRing
                            progress={progress}
                            colors={colors}
                            eff={eff}
                            gradientColors={isDebuff ? [colors.rose, colors.lilac] : undefined}
                          >
                            <View style={[styles.shopActiveIconShell, iconShellStyle]}>
                              <LinearGradient
                                colors={iconGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.shopActiveIconInner}
                              >
                                <MaterialCommunityIcons
                                  name={effect.icon || 'flash-outline'}
                                  size={22}
                                  color={iconColor}
                                />
                              </LinearGradient>
                            </View>
                          </EffectTimerRing>
                          <View style={styles.shopActiveInfo}>
                            <View style={styles.shopActiveNameRow}>
                              <Text style={[styles.shopActiveName, { color: nameColor }]}>{effect.name}</Text>
                            </View>
                            {remaining != null && effect.duration ? (
                              <View style={styles.shopActiveTimerRow}>
                                <MaterialCommunityIcons
                                  name="clock-time-four-outline"
                                  size={14}
                                  color={timerColor}
                                />
                                <Text style={[styles.shopActiveTimerText, { color: timerColor }]}>
                                  {formatTime(remaining)}
                                </Text>
                              </View>
                            ) : (
                              <Text style={[styles.shopActivePassive, { color: passiveColor }]}>
                                {isDebuff ? 'Active penalty' : 'Passive boost'}
                              </Text>
                            )}
                            <Text
                              style={[styles.shopActiveDescription, { color: descriptionColor }]}
                              numberOfLines={2}
                            >
                              {effect.description}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.shopSection}>
                <View style={styles.shopSectionHeader}>
                  <Text style={[styles.shopSectionEyebrow, { color: hexToRgba(colors.text, 0.55) }]}>Catalogue</Text>
                  <Text style={[styles.shopSectionTitle, { color: colors.text }]}>Choose how you want to level the journey today.</Text>
                </View>
                <View
                  style={[
                    styles.shopSecondaryTabs,
                    { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                  ]}
                >
                  {SHOP_CATALOG_TABS.map((tab) => {
                    const active = categoryTab === tab.key;
                    return (
                      <TouchableOpacity
                        key={tab.key}
                        onPress={() => setCategoryTab(tab.key)}
                        activeOpacity={0.9}
                        style={[styles.shopSecondaryTabButton, { borderColor: colors.surfaceBorder }]}
                      >
                        {active ? (
                          <LinearGradient
                            colors={[colors.sky, colors.emerald]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFillObject}
                          />
                        ) : null}
                        <View style={styles.shopSecondaryTabContent}>
                          <MaterialCommunityIcons
                            name={tab.icon}
                            size={15}
                            color={active ? '#0f172a' : colors.text}
                            style={styles.shopSecondaryTabIcon}
                          />
                          <Text
                            style={[
                              styles.shopSecondaryTabLabel,
                              { color: active ? '#0f172a' : colors.text },
                            ]}
                          >
                            {tab.label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {categoryTab === 'effects' && (
                  <View style={styles.shopCardList}>
                    {GAME_EFFECTS.slice()
                      .sort((a, b) => a.cost - b.cost)
                      .map((item) => {
                        const active = effects.some((fx) => fx.id === item.id);
                        const durationLabel = formatDuration(item.duration);
                        return (
                          <View
                            key={item.id}
                            style={[
                              styles.shopCard,
                              { backgroundColor: filledSurface, borderColor: colors.surfaceBorder },
                              cardShadow,
                            ]}
                          >
                            <View style={styles.shopCardHeader}>
                              <View
                                style={[
                                  styles.shopIconShell,
                                  { borderColor: colors.surfaceBorder, backgroundColor: colors.surface },
                                ]}
                              >
                                <LinearGradient
                                  colors={[colors.sky, colors.emerald]}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 1 }}
                                  style={styles.shopIconInner}
                                >
                                  <MaterialCommunityIcons name={item.icon || 'flash-outline'} size={20} color="#0f172a" />
                                </LinearGradient>
                              </View>
                              <View style={styles.shopCardTitleArea}>
                                <View style={styles.shopCardTitleRow}>
                                  <Text style={[styles.shopCardTitle, { color: colors.text }]}>{item.name}</Text>
                                  {active ? (
                                    <View
                                      style={[
                                        styles.shopCardBadge,
                                        {
                                          borderColor: colors.surfaceBorder,
                                          backgroundColor: hexToRgba(colors.text, eff === 'light' ? 0.05 : 0.22),
                                        },
                                      ]}
                                    >
                                      <Text style={[styles.shopCardBadgeText, { color: colors.text }]}>In progress</Text>
                                    </View>
                                  ) : null}
                                </View>
                                <Text style={[styles.shopCardDescription, { color: hexToRgba(colors.text, 0.65) }]}>
                                  {item.description}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.shopCardFooter}>
                              <View style={styles.shopMetaRow}>
                                <View style={styles.shopMetaItem}>
                                  <MaterialCommunityIcons name="clock-time-four-outline" size={14} color={hexToRgba(colors.text, 0.6)} />
                                  <Text style={[styles.shopMetaText, { color: hexToRgba(colors.text, 0.6) }]}>
                                    {durationLabel}
                                  </Text>
                                </View>
                                <View style={styles.shopMetaItem}>
                                  <MaterialCommunityIcons name="diamond-stone" size={14} color={hexToRgba(colors.text, 0.6)} />
                                  <Text style={[styles.shopMetaText, { color: hexToRgba(colors.text, 0.6) }]}>
                                    {formatGold(item.cost)}
                                  </Text>
                                </View>
                              </View>
                              <GoldPill
                                colors={colors}
                                icon="diamond-stone"
                                onPress={() => handleBuyEffect(item)}
                                dim={gold < item.cost || active}
                              >
                                {active ? 'Owned' : `${item.cost}g`}
                              </GoldPill>
                            </View>
                          </View>
                        );
                      })}
                  </View>
                )}

                {categoryTab === 'rewards' && (
                  <View style={styles.shopCardList}>
                    {sortedRewards.map((item) => {
                      const cost = costFor(item);
                      return (
                        <View
                          key={item.id}
                          style={[
                            styles.shopCard,
                            { backgroundColor: filledSurface, borderColor: colors.surfaceBorder },
                            cardShadow,
                          ]}
                        >
                          <View style={styles.shopCardHeader}>
                            <View
                              style={[
                                styles.shopIconShell,
                                { borderColor: colors.surfaceBorder, backgroundColor: colors.surface },
                              ]}
                            >
                              <LinearGradient
                                colors={[colors.rose, colors.lilac]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.shopIconInner}
                              >
                                <MaterialCommunityIcons name="gift-outline" size={20} color="#0f172a" />
                              </LinearGradient>
                            </View>
                            <View style={styles.shopCardTitleArea}>
                              <Text style={[styles.shopCardTitle, { color: colors.text }]}>{item.name}</Text>
                              <Text style={[styles.shopCardDescription, { color: hexToRgba(colors.text, 0.65) }]}>
                                Reward yourself with {item.minutes} minutes of joy.
                              </Text>
                            </View>
                          </View>
                          <View style={styles.shopCardFooter}>
                            <View style={styles.shopMetaRow}>
                              <View style={styles.shopMetaItem}>
                                <MaterialCommunityIcons name="clock-time-four-outline" size={14} color={hexToRgba(colors.text, 0.6)} />
                                <Text style={[styles.shopMetaText, { color: hexToRgba(colors.text, 0.6) }]}>
                                  {item.minutes} min
                                </Text>
                              </View>
                              <View style={styles.shopMetaItem}>
                                <MaterialCommunityIcons name="diamond-stone" size={14} color={hexToRgba(colors.text, 0.6)} />
                                <Text style={[styles.shopMetaText, { color: hexToRgba(colors.text, 0.6) }]}>
                                  {formatGold(cost)}
                                </Text>
                              </View>
                            </View>
                            <GoldPill
                              colors={colors}
                              icon="diamond-stone"
                              onPress={() => setConfirmReward(item)}
                              dim={gold < cost}
                            >
                              {`${cost}g`}
                            </GoldPill>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {categoryTab === 'premium' && (
                  <View style={styles.shopCardList}>
                    {PREMIUM_REWARDS.map((item) => {
                      const cost = costFor(item);
                      const progress = premiumProgress[item.id] || 0;
                      const completed = progress >= cost;
                      const savedGold = Math.min(progress, cost);
                      const remainingGold = Math.max(cost - savedGold, 0);
                      const progressPercent = cost > 0 ? Math.min(100, (savedGold / cost) * 100) : 100;
                      const displayName = (item.name || '').replace(/premium reward/gi, '').trim();
                      return (
                        <View
                          key={item.id}
                          style={[
                            styles.shopPremiumCard,
                            { backgroundColor: filledSurface, borderColor: colors.surfaceBorder },
                            cardShadow,
                          ]}
                        >
                          <View style={styles.shopPremiumHeader}>
                            <View
                              style={[
                                styles.shopIconShell,
                                { borderColor: colors.surfaceBorder, backgroundColor: colors.surface },
                              ]}
                            >
                              <LinearGradient
                                colors={[colors.sky, colors.emerald]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.shopIconInner}
                              >
                                <MaterialCommunityIcons name="crown-outline" size={20} color="#0f172a" />
                              </LinearGradient>
                            </View>
                            <View style={styles.shopPremiumTitleArea}>
                              <View style={styles.shopPremiumTitleRow}>
                                <Text style={[styles.shopCardTitle, { color: colors.text }]}>
                                  {displayName || 'Premium reward'}
                                </Text>
                                {completed ? (
                                  <View style={[styles.shopPremiumBadge, { backgroundColor: hexToRgba(colors.emerald, 0.2) }]}>
                                    <Text style={[styles.shopPremiumBadgeText, { color: colors.emerald }]}>Ready to claim</Text>
                                  </View>
                                ) : null}
                              </View>
                              <Text style={[styles.shopCardDescription, { color: hexToRgba(colors.text, 0.65) }]}>
                                Set aside gold to unlock this premium reward.
                              </Text>
                            </View>
                            <GoldPill
                              colors={colors}
                              icon="diamond-stone"
                              onPress={() => handlePremiumAction(item)}
                              dim={!completed && gold <= 0}
                              style={styles.shopPremiumButton}
                            >
                              {completed ? 'Claim' : 'Save'}
                            </GoldPill>
                          </View>
                          <View
                            style={[styles.shopPremiumProgressBar, { borderColor: colors.surfaceBorder }]}
                          >
                            <LinearGradient
                              colors={[colors.sky, colors.emerald]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={[styles.shopPremiumProgressFill, { width: `${progressPercent}%` }]}
                            />
                          </View>
                          <View style={styles.shopPremiumAmounts}>
                            <View style={styles.shopMetaItem}>
                              <MaterialCommunityIcons name="wallet-outline" size={14} color={hexToRgba(colors.text, 0.6)} />
                              <Text style={[styles.shopMetaText, { color: hexToRgba(colors.text, 0.6) }]}>
                                {formatGoldValue(savedGold)}
                              </Text>
                            </View>
                            <Text style={[styles.shopPremiumRemaining, { color: hexToRgba(colors.text, 0.6) }]}>
                              {remainingGold === 0
                                ? 'Goal reached'
                                : `${formatGoldValue(remainingGold)} to go`}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={!!savingItem}
        transparent
        animationType="fade"
        onRequestClose={closeSavingModal}
      >
        <TouchableWithoutFeedback onPress={closeSavingModal}>
          <View style={[styles.shopModalOverlay, { backgroundColor: overlayBackground }]}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={[
                  styles.shopModalCard,
                  { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                  cardShadow,
                ]}
              >
                <View style={styles.shopModalHeader}>
                  <View
                    style={[
                      styles.shopModalIconShell,
                      { borderColor: colors.surfaceBorder, backgroundColor: colors.surface },
                    ]}
                  >
                    <LinearGradient
                      colors={[colors.sky, colors.emerald]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.shopModalIconInner}
                    >
                      <MaterialCommunityIcons name="wallet-outline" size={20} color="#0f172a" />
                    </LinearGradient>
                  </View>
                  <View style={styles.shopModalHeaderText}>
                    <Text style={[styles.shopModalTitle, { color: colors.text }]}>
                      Save gold for {savingItem?.name}
                    </Text>
                    <Text style={[styles.shopModalDescription, { color: hexToRgba(colors.text, 0.65) }]}>Decide how much to stash away right now. You can come back later to add more.</Text>
                  </View>
                </View>
                <GoldSlider
                  value={clampedSaveAmount}
                  max={maxSavableNow}
                  colors={colors}
                  eff={eff}
                  onChange={(next) => setSaveAmount(next)}
                />
                <View style={styles.shopModalLabelRow}>
                  <Text style={[styles.shopModalLabel, { color: colors.text }]}>
                    {formatGoldValue(clampedSaveAmount)}
                  </Text>
                  <Text style={[styles.shopModalLabelValue, { color: hexToRgba(colors.text, 0.6) }]}>
                    {formatGoldValue(maxSavableNow)} available now
                  </Text>
                </View>
                <Text style={[styles.shopModalHint, { color: hexToRgba(colors.text, 0.6) }]}>
                  Already saved {formatGoldValue(savingProgress)} / {formatGoldValue(savingItem ? costFor(savingItem) : 0)}
                </Text>
                <View style={styles.shopModalActions}>
                  <TouchableOpacity
                    onPress={closeSavingModal}
                    activeOpacity={0.85}
                    style={[styles.shopModalButton, { borderColor: colors.surfaceBorder, backgroundColor: colors.surface }]}
                  >
                    <Text style={[styles.shopModalButtonText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={confirmSave}
                    activeOpacity={clampedSaveAmount > 0 ? 0.85 : 1}
                    disabled={clampedSaveAmount <= 0}
                    style={[
                      styles.shopModalButton,
                      styles.shopModalPrimary,
                      {
                        borderColor: colors.surfaceBorder,
                        opacity: clampedSaveAmount > 0 ? 1 : 0.5,
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={[colors.sky, colors.emerald]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Text style={styles.shopModalPrimaryText}>Save amount</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={!!confirmReward}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmReward(null)}
      >
        <TouchableWithoutFeedback onPress={() => setConfirmReward(null)}>
          <View style={[styles.shopModalOverlay, { backgroundColor: overlayBackground }]}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={[
                  styles.shopConfirmCard,
                  { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                  cardShadow,
                ]}
              >
                <View style={styles.shopConfirmIconRow}>
                  <View
                    style={[
                      styles.shopModalIconShell,
                      { borderColor: colors.surfaceBorder, backgroundColor: colors.surface },
                    ]}
                  >
                    <LinearGradient
                      colors={[colors.sky, colors.emerald]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.shopModalIconInner}
                    >
                      <MaterialCommunityIcons name={ConfirmIcon} size={22} color="#0f172a" />
                    </LinearGradient>
                  </View>
                </View>
                <Text style={[styles.shopConfirmTitle, { color: colors.text }]}>
                  {confirmReward?.premium
                    ? `Redeem ${confirmReward?.name}?`
                    : `Spend ${formatGold(confirmCost)} for ${confirmReward?.name}?`}
                </Text>
                {!confirmReward?.premium && (
                  <Text style={[styles.shopModalDescription, { color: hexToRgba(colors.text, 0.6), textAlign: 'center' }]}>
                    {confirmReward?.minutes} minutes of joy await.
                  </Text>
                )}
                <View style={styles.shopModalActions}>
                  <TouchableOpacity
                    onPress={() => setConfirmReward(null)}
                    activeOpacity={0.85}
                    style={[styles.shopModalButton, { borderColor: colors.surfaceBorder, backgroundColor: colors.surface }]}
                  >
                    <Text style={[styles.shopModalButtonText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirmAction}
                    activeOpacity={0.9}
                    style={[styles.shopModalButton, styles.shopModalPrimary, { borderColor: colors.surfaceBorder }]}
                  >
                    <LinearGradient
                      colors={[colors.sky, colors.emerald]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Text style={styles.shopModalPrimaryText}>Yes, do it</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={!!redeemed}
        transparent
        animationType="fade"
        onRequestClose={() => setRedeemed(null)}
      >
        <TouchableWithoutFeedback onPress={() => setRedeemed(null)}>
          <View style={[styles.shopModalOverlay, { backgroundColor: overlayBackground }]}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={[
                  styles.shopConfirmCard,
                  { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                  cardShadow,
                ]}
              >
                <Text style={[styles.shopConfirmTitle, { color: colors.text }]}>Enjoy {redeemed?.name}!</Text>
                <Text style={[styles.shopModalDescription, { color: hexToRgba(colors.text, 0.6), textAlign: 'center' }]}>
                  You earned it. Log it in your journal once you're back.
                </Text>
                <TouchableOpacity
                  onPress={() => setRedeemed(null)}
                  activeOpacity={0.9}
                  style={[styles.shopModalButton, styles.shopModalPrimary, { borderColor: colors.surfaceBorder }]}
                >
                  <LinearGradient
                    colors={[colors.sky, colors.emerald]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Text style={styles.shopModalPrimaryText}>Back to shopping</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};


const ChestCard = ({ chest, colors, theme, isFocused, onFocus, onOpen }) => {
  const rarity = chest.rarity || 'Common';
  const ChestArt = CHEST_ART[rarity] || CHEST_ART.Common;
  const detail = RARITY_DETAILS[rarity] || RARITY_DETAILS.Common;
  const goldRange = chest.gold ? formatRange(chest.gold) : '?';
  const cardBackground = theme === 'light' ? ensureOpaque(colors.surface) : 'rgba(15,23,42,0.55)';
  const iconBackground = theme === 'light' ? ensureOpaque(colors.surface) : 'rgba(15,23,42,0.45)';

  const overlayColors =
    theme === 'light'
      ? ['rgba(255,255,255,0.96)', 'rgba(226,232,240,0.86)']
      : ['rgba(15,23,42,0.9)', 'rgba(15,23,42,0.78)'];

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onFocus(isFocused ? null : chest.id)}
      style={[
        styles.chestCard,
        {
          backgroundColor: cardBackground,
          borderColor: colors.surfaceBorder,
        },
        theme === 'light' ? styles.chestCardShadowLight : styles.chestCardShadowDark,
      ]}
    >
      <View style={styles.chestCardInner}>
        <View
          style={[
            styles.chestIconWrapper,
            {
              backgroundColor: iconBackground,
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          <ChestArt size={54} />
        </View>
        <Text style={[styles.chestRarity, { color: hexToRgba(colors.text, 0.7) }]}>{rarity} chest</Text>
        <Text style={[styles.chestHeadline, { color: hexToRgba(colors.text, 0.82) }]}>{detail.headline}</Text>
      </View>
      {isFocused ? (
        <LinearGradient colors={overlayColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.chestOverlay}>
          <Text
            style={[
              styles.chestOverlayTitle,
              { color: theme === 'light' ? 'rgba(15,23,42,0.68)' : 'rgba(226,232,240,0.78)' },
            ]}
          >
            Gold stash
          </Text>
          <Text style={[styles.chestOverlayRange, { color: theme === 'light' ? '#0f172a' : colors.text }]}>
            {goldRange}g
          </Text>
          <Text
            style={[
              styles.chestOverlayHelper,
              { color: theme === 'light' ? 'rgba(15,23,42,0.65)' : 'rgba(226,232,240,0.78)' },
            ]}
          >
            {detail.helper}
          </Text>
          <TouchableOpacity
            onPress={() => {
              const reward = onOpen?.(chest);
              if (reward) {
                onFocus(null);
              }
            }}
            activeOpacity={0.9}
            style={[styles.chestOpenButton, { borderColor: colors.surfaceBorder }]}
          >
            <LinearGradient
              colors={[colors.sky, colors.emerald]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.chestOpenButtonBg}
            >
              <MaterialCommunityIcons name="auto-fix" size={16} color="#0f172a" />
              <Text style={styles.chestOpenButtonText}>Open chest</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      ) : null}
    </TouchableOpacity>
  );
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const month = MONTHS[date.getMonth()];
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month} ${day} at ${hours}:${minutes}`;
};

const truncate = (value, limit = 70) => {
  if (!value) return '';
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 3)}...`;
};

const MIN_FOCUS_FOR_LOG = 0.25;

// Application Form Modal
const AppFormModal = ({
  visible,
  onClose,
  onSubmit,
  colors,
  effects = [],
  spray = 1,
  defaults,
  title = 'Log Application',
  submitLabel = 'Add Application',
  statusOptions = STATUSES,
}) => {
  const initialValues = useMemo(() => {
    const base = { ...buildInitialFormValues(), ...defaults };
    if (statusOptions.length && !statusOptions.some((option) => option.key === base.status)) {
      base.status = statusOptions[0].key;
    }
    return base;
  }, [defaults, statusOptions]);
  const [form, setForm] = useState(initialValues);

  useEffect(() => {
    if (visible) {
      setForm(initialValues);
    }
  }, [visible, initialValues]);

  const setField = useCallback(
    (field) => (value) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const { company, role, type, note, cvTailored, motivation, favorite, status, platform, country, city } = form;

  const { xp: xpReward, gold: goldReward } = useMemo(
    () => computeRewards({ type, cvTailored, motivation }, { effects, spray }),
    [type, cvTailored, motivation, effects, spray],
  );
  const cost = useMemo(() => focusCost(type), [type]);
  const cityOptions = useMemo(() => (country ? getCitiesForCountry(country) : []), [country]);

  const handleCountrySelect = useCallback((selected) => {
    setForm((prev) => {
      const nextCountry = selected;
      const shouldResetCity = nextCountry !== prev.country;
      return {
        ...prev,
        country: nextCountry,
        city: shouldResetCity ? '' : prev.city,
      };
    });
  }, []);

  const handleCitySelect = useCallback((selected) => {
    setForm((prev) => ({ ...prev, city: selected }));
  }, []);

  const handleCancel = useCallback(() => {
    setForm(initialValues);
    onClose?.();
  }, [initialValues, onClose]);

  const handleSubmit = useCallback(() => {
    if (!company || !role) {
      Alert.alert('Error', 'Please fill in company and role');
      return;
    }

    if (country && !COUNTRIES.includes(country)) {
      Alert.alert('Invalid Country', 'Please select a country from the list.');
      return;
    }

    if (city) {
      if (!country) {
        Alert.alert('Invalid City', 'Please select a country before choosing a city.');
        return;
      }
      const validCities = getCitiesForCountry(country);
      if (!validCities.includes(city)) {
        Alert.alert('Invalid City', 'Please select a city from the list.');
        return;
      }
    }

    const payload = { ...form };
    if (!payload.date) {
      payload.date = new Date().toISOString();
    }
    const result = onSubmit?.(payload);
    if (result !== false) {
      setForm(initialValues);
      onClose?.();
    }
  }, [company, role, form, onSubmit, initialValues, onClose]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.surfaceBorder }]}>
          <View style={styles.modalTitleRow}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            <RewardPreview xp={xpReward} gold={goldReward} focus={cost} colors={colors} />
          </View>
          <TouchableOpacity onPress={handleCancel} style={[styles.closeButton, { backgroundColor: colors.chipBg }]}>
            <MaterialCommunityIcons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TextField
            label="Company"
            value={company}
            onChangeText={setField('company')}
            placeholder="Acme Inc."
            colors={colors}
          />

          <TextField
            label="Role"
            value={role}
            onChangeText={setField('role')}
            placeholder="Data Analyst"
            colors={colors}
          />

          <TypeSelector value={type} onChange={setField('type')} colors={colors} />

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Status</Text>
            <StatusSelector
              value={status}
              onChange={setField('status')}
              colors={colors}
              options={statusOptions}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Platform</Text>
            <PlatformSelector value={platform} onChange={setField('platform')} colors={colors} />
          </View>

          <View style={styles.inlineFieldRow}>
            <AutoCompleteField
              label="Country"
              value={country}
              onSelect={handleCountrySelect}
              placeholder="Start typing..."
              colors={colors}
              options={COUNTRIES}
              minChars={2}
              containerStyle={styles.inlineField}
            />
            <AutoCompleteField
              label="City"
              value={city}
              onSelect={handleCitySelect}
              placeholder={country ? 'Start typing...' : 'Select country first'}
              colors={colors}
              options={cityOptions}
              minChars={1}
              containerStyle={styles.inlineField}
              disabled={!country}
            />
          </View>

          <TextField
            label="Notes (optional)"
            value={note}
            onChangeText={setField('note')}
            placeholder="Additional notes..."
            colors={colors}
            multiline
            numberOfLines={3}
          />

          <View style={styles.iconToggleRow}>
            <IconToggle
              label="CV"
              icon="file-document-edit-outline"
              activeIcon="file-check"
              value={cvTailored}
              onToggle={setField('cvTailored')}
              colors={colors}
            />
            <IconToggle
              label="Motivation"
              icon="email-edit-outline"
              activeIcon="email-check-outline"
              value={motivation}
              onToggle={setField('motivation')}
              colors={colors}
            />
            <IconToggle
              label="Fav"
              icon="star-outline"
              activeIcon="star"
              value={favorite}
              onToggle={setField('favorite')}
              colors={colors}
            />
          </View>
        </ScrollView>

        <View style={[styles.modalFooter, { borderTopColor: colors.surfaceBorder }]}>
          <TouchableOpacity onPress={handleCancel} style={[styles.cancelButton, { backgroundColor: colors.chipBg }]}>
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSubmit} style={styles.submitButtonWrapper}>
            <LinearGradient
              colors={[colors.sky, colors.emerald]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButton}
            >
              <Text style={styles.submitButtonText}>{submitLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// Main App Component
export default function App() {
  const { mode, eff, cycle } = useTheme();
  const { cycle: cyclePal, pal } = usePalette();
  const colors = useMemo(() => cur(eff, pal), [eff, pal]);
  const filledSurface = useMemo(
    () => (eff === 'light' ? ensureOpaque(colors.surface) : colors.surface),
    [eff, colors.surface],
  );

  // Game state
  const [xp, setXp] = useState(0);
  const [apps, setApps] = useState(0);
  const [gold, setGold] = useState(0);
  const [streak, setStreak] = useState(0);
  const [activeEffects, setActiveEffects] = useState([]);
  const [effectWarnings, setEffectWarnings] = useState([]);
  const [sprayDebuff, setSprayDebuff] = useState(null);
  const [focus, setFocus] = useState(FOCUS_BASELINE);
  const [applications, setApplications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const [appsQuery, setAppsQuery] = useState('');
  const [filterStatuses, setFilterStatuses] = useState([]);
  const [filterPlatforms, setFilterPlatforms] = useState([]);
  const [sortKey, setSortKey] = useState('Newest');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [questTab, setQuestTab] = useState('Daily');
  const [claimedQuests, setClaimedQuests] = useState(() => new Set());
  const [manualLogs, setManualLogs] = useState(() => ({}));
  const [eventStates, setEventStates] = useState(() => ({}));
  const [eventNotifications, setEventNotifications] = useState(() => ({}));
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [chests, setChests] = useState([]);
  const [chestFilter, setChestFilter] = useState('All');
  const [focusedChestId, setFocusedChestId] = useState(null);
  const [openAllSummary, setOpenAllSummary] = useState(null);
  const [openResult, setOpenResult] = useState(null);
  const [premiumProgress, setPremiumProgress] = useState({});
  const [shopMainTab, setShopMainTab] = useState('catalogue');
  const [shopCategoryTab, setShopCategoryTab] = useState('effects');

  const lowQualityStreakRef = useRef(0);
  const openResultTimer = useRef(null);
  const effectWarningTimers = useRef(new Map());
  const announcedEffectKeysRef = useRef(new Set());
  const eventSeenRef = useRef(new Map());
  const previousEventStatesRef = useRef({});
  const previousLevelRef = useRef(null);

  const updateCurrentTime = useCallback(
    (hint) => {
      const now = Date.now();
      const parsed = toTimestamp(hint);
      const candidate = Number.isFinite(parsed) ? Math.max(now, parsed) : now;
      setCurrentTime((prev) => (candidate > prev ? candidate : prev));
    },
    [setCurrentTime],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!EVENT_DEFINITIONS.length) {
      return;
    }
    setEventStates((prev) =>
      evaluateEventStates({
        definitions: EVENT_DEFINITIONS,
        previousStates: prev,
        manualLogs,
        applications,
        now: currentTime,
      }),
    );
  }, [manualLogs, applications, currentTime]);

  useEffect(() => {
    const prevStates = previousEventStatesRef.current || {};
    const currentStates = eventStates && typeof eventStates === 'object' ? eventStates : {};
    previousEventStatesRef.current = currentStates;

    const cleanupTargets = [];
    const reactivatedEventIds = [];

    Object.entries(currentStates).forEach(([eventId, state]) => {
      if (!state || state.active !== true || !Number.isFinite(state.triggeredAt)) {
        return;
      }
      const prevState = prevStates[eventId];
      const prevTrigger = Number.isFinite(prevState?.triggeredAt) ? prevState.triggeredAt : undefined;
      if (prevTrigger == null || prevTrigger === state.triggeredAt) {
        return;
      }
      const stageIds = EVENT_STAGE_IDS[eventId] || [];
      cleanupTargets.push({
        ids: [eventId, ...stageIds],
        triggeredAt: prevTrigger,
      });
      reactivatedEventIds.push(eventId);
    });

    if (cleanupTargets.length) {
      setClaimedQuests((currentSet) => {
        if (!(currentSet instanceof Set) || currentSet.size === 0) {
          return currentSet;
        }
        let mutated = false;
        const nextSet = new Set(currentSet);
        cleanupTargets.forEach(({ ids, triggeredAt }) => {
          ids.forEach((id) => {
            if (!id) {
              return;
            }
            const compositeKey = composeQuestClaimKey(id, triggeredAt);
            if (compositeKey && nextSet.delete(compositeKey)) {
              mutated = true;
            }
            if (nextSet.delete(id)) {
              mutated = true;
            }
          });
        });
        return mutated ? nextSet : currentSet;
      });
    }

    if (reactivatedEventIds.length) {
      const seenMap = eventSeenRef.current;
      if (seenMap && typeof seenMap.delete === 'function') {
        reactivatedEventIds.forEach((eventId) => {
          seenMap.delete(eventId);
        });
      }
    }

    setEventNotifications((currentNotifications) => {
      const safeCurrent =
        currentNotifications && typeof currentNotifications === 'object'
          ? currentNotifications
          : {};
      let nextNotifications = safeCurrent;
      let changed = false;

      Object.entries(safeCurrent).forEach(([eventId, triggerAt]) => {
        const state = currentStates[eventId];
        if (
          !state ||
          state.active !== true ||
          !Number.isFinite(state.triggeredAt) ||
          state.triggeredAt !== triggerAt
        ) {
          if (!changed) {
            nextNotifications = { ...nextNotifications };
            changed = true;
          }
          delete nextNotifications[eventId];
        }
      });

      Object.entries(currentStates).forEach(([eventId, state]) => {
        if (!state || state.active !== true || !Number.isFinite(state.triggeredAt)) {
          return;
        }
        const prevState = prevStates[eventId];
        const prevActive = prevState?.active === true && Number.isFinite(prevState?.triggeredAt);
        const seenTrigger = eventSeenRef.current.get(eventId);
        const isNewTrigger = !prevActive || prevState.triggeredAt !== state.triggeredAt;
        const alreadySeen = seenTrigger === state.triggeredAt;
        const alreadyNotified = nextNotifications[eventId] === state.triggeredAt;

        if (isNewTrigger && !alreadySeen && !alreadyNotified) {
          if (!changed) {
            nextNotifications = { ...nextNotifications };
            changed = true;
          }
          nextNotifications[eventId] = state.triggeredAt;
        }
      });

      return changed ? nextNotifications : safeCurrent;
    });
  }, [eventStates]);

  useEffect(() => {
    if (questTab !== 'Events') {
      return;
    }
    setEventNotifications((current) => {
      const safeCurrent = current && typeof current === 'object' ? current : {};
      const entries = Object.entries(safeCurrent);
      if (!entries.length) {
        return current;
      }
      const seenMap = eventSeenRef.current;
      entries.forEach(([eventId, triggeredAt]) => {
        if (Number.isFinite(triggeredAt)) {
          seenMap.set(eventId, triggeredAt);
        }
      });
      return {};
    });
  }, [questTab, eventNotifications]);

  const pushEffectWarnings = useCallback(
    (messages = []) => {
      if (!Array.isArray(messages) || messages.length === 0) {
        return;
      }
      setEffectWarnings((current) => [...current, ...messages]);
      messages.forEach((message) => {
        if (!message?.id) {
          return;
        }
        const timeout = setTimeout(() => {
          setEffectWarnings((current) => current.filter((item) => item.id !== message.id));
          effectWarningTimers.current.delete(message.id);
        }, 6500);
        effectWarningTimers.current.set(message.id, timeout);
      });
    },
    [setEffectWarnings],
  );

  const handleDismissEffectWarning = useCallback(
    (id) => {
      if (!id) {
        return;
      }
      setEffectWarnings((current) => current.filter((item) => item.id !== id));
      const existing = effectWarningTimers.current.get(id);
      if (existing) {
        clearTimeout(existing);
        effectWarningTimers.current.delete(id);
      }
    },
    [setEffectWarnings],
  );

  const createEffectWarningEntry = useCallback((effect, key) => {
    if (!effect) {
      return null;
    }
    const type = effect.type === 'debuff' ? 'debuff' : 'buff';
    const baseKey =
      key ||
      (effect.id != null
        ? `effect-${effect.id}`
        : effect.name
        ? `effect-${String(effect.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
        : 'effect');
    const uniqueId = `${baseKey}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const description = typeof effect.description === 'string' && effect.description.trim().length
      ? effect.description.trim()
      : type === 'debuff'
      ? 'A penalty is now active.'
      : 'A boost is now active.';
    const duration = Number.isFinite(effect.duration) && effect.duration > 0 ? effect.duration : null;
    return {
      id: uniqueId,
      type,
      name:
        typeof effect.name === 'string' && effect.name.trim().length
          ? effect.name.trim()
          : type === 'debuff'
          ? 'Penalty active'
          : 'Boost active',
      description,
      duration,
      icon: effect.icon,
    };
  }, []);

  const hasTimedEffects = useMemo(
    () => activeEffects.some((effect) => effect.expiresAt),
    [activeEffects],
  );

  useEffect(() => {
    if (!hasTimedEffects) {
      return;
    }
    const interval = setInterval(() => {
      const current = Date.now();
      setActiveEffects((list) => {
        if (!list.length) {
          return list;
        }
        let changed = false;
        const filtered = list.filter((fx) => {
          if (fx.expiresAt && fx.expiresAt <= current) {
            changed = true;
            return false;
          }
          return true;
        });
        return changed ? filtered : list;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [hasTimedEffects]);

  const sprayActive = useMemo(() => {
    if (!sprayDebuff) {
      return false;
    }
    const { expiresAt } = sprayDebuff;
    if (!expiresAt) {
      return true;
    }
    return expiresAt > currentTime;
  }, [sprayDebuff, currentTime]);

  useEffect(() => {
    if (!sprayDebuff) {
      return;
    }
    if (sprayDebuff.expiresAt && sprayDebuff.expiresAt <= currentTime) {
      setSprayDebuff(null);
    }
  }, [sprayDebuff, currentTime]);

  const sprayMultiplier = sprayActive ? 0.5 : 1;

  const sprayEffectDetails = useMemo(() => {
    if (!sprayActive) {
      return null;
    }
    const expiresAt =
      sprayDebuff?.expiresAt ??
      (sprayDebuff?.activatedAt ? sprayDebuff.activatedAt + SPRAY_DEBUFF_DURATION_MS : undefined);
    return {
      id: 'spray-and-pray',
      name: 'Spray and Pray',
      icon: 'spray-bottle',
      description: 'XP and gold from applications are halved for six hours.',
      expiresAt,
      duration: SPRAY_DEBUFF_DURATION_SECONDS,
      type: 'debuff',
    };
  }, [sprayActive, sprayDebuff]);

  const shopEffects = useMemo(() => {
    if (!sprayEffectDetails) {
      return activeEffects;
    }
    return [sprayEffectDetails, ...activeEffects];
  }, [sprayEffectDetails, activeEffects]);

  useEffect(() => {
    const previous = announcedEffectKeysRef.current;
    const next = new Set();
    const pending = [];

    const getKey = (effect, fallback) => {
      if (!effect) {
        return fallback;
      }
      const base =
        effect.id != null
          ? `effect-${effect.id}`
          : effect.name
          ? `effect-${String(effect.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
          : fallback;
      return effect.expiresAt ? `${base}-${effect.expiresAt}` : base;
    };

    activeEffects.forEach((effect) => {
      if (!effect) {
        return;
      }
      const key = getKey(effect, 'effect');
      next.add(key);
      if (!previous.has(key)) {
        const entry = createEffectWarningEntry(effect, key);
        if (entry) {
          pending.push(entry);
        }
      }
    });

    if (sprayEffectDetails) {
      const sprayKey = getKey(sprayEffectDetails, 'spray');
      next.add(sprayKey);
      if (!previous.has(sprayKey)) {
        const entry = createEffectWarningEntry(sprayEffectDetails, sprayKey);
        if (entry) {
          pending.push(entry);
        }
      }
    }

    announcedEffectKeysRef.current = next;

    if (pending.length) {
      pushEffectWarnings(pending);
    }
  }, [activeEffects, sprayEffectDetails, pushEffectWarnings, createEffectWarningEntry]);

  const { l, rem, need } = useMemo(() => lvl(xp), [xp]);

  useEffect(() => {
    const prevLevel = previousLevelRef.current;
    if (prevLevel == null) {
      previousLevelRef.current = l;
      return;
    }
    if (l > prevLevel) {
      const granted = [];
      for (let level = prevLevel + 1; level <= l; level += 1) {
        const chest = createLevelUpChest(level);
        if (chest) {
          granted.push(chest);
        }
      }
      if (granted.length) {
        setChests((prev) => [...prev, ...granted]);
      }
    }
    if (prevLevel !== l) {
      previousLevelRef.current = l;
    }
  }, [l, setChests]);

  const gainXp = useCallback(
    (base, applyBuff = true) => {
      const hasBuff = applyBuff && activeEffects.some((effect) => effect.id === 1 || effect.id === 3);
      const multiplier = hasBuff ? 2 : 1;
      setXp((value) => value + base * multiplier);
    },
    [activeEffects]
  );

  const handleManualLog = useCallback(
    (key, payload = {}) => {
      if (!key) {
        return;
      }
      const providedTime = toTimestamp(payload?.timestamp);
      const timestamp = Number.isFinite(providedTime) ? providedTime : Date.now();
      updateCurrentTime(timestamp);
      const entry = { id: Math.random().toString(36).slice(2), ...payload, timestamp };
      setManualLogs((prev) => {
        const entries = Array.isArray(prev[key]) ? [...prev[key]] : [];
        entries.push(entry);
        return { ...prev, [key]: entries };
      });
    },
    [updateCurrentTime]
  );

  const addApplication = useCallback(
    (fields) => {
      const payload = { ...fields };
      const cost = focusCost(payload.type);
      if (focus < cost) {
        Alert.alert('Out of Focus', 'You are out of focus! Recharge to log more applications.');
        return false;
      }
      if (!payload.date) {
        payload.date = new Date().toISOString();
      }

      updateCurrentTime(payload.date);

      const id = Math.random().toString(36).slice(2, 9);
      const { xp: xpReward, gold: goldReward, qs, au } = computeRewards(payload, {
        effects: activeEffects,
        spray: sprayMultiplier,
      });
      const app = { id, ...payload, qs, au };

      setApplications((list) => [app, ...list]);
      setApps((value) => value + 1);
      gainXp(xpReward, false);
      setGold((value) => value + goldReward);
      setFocus((value) => Math.max(0, value - cost));
      let shouldTriggerSpray = false;
      if (sprayActive) {
        lowQualityStreakRef.current = 0;
      } else if (qs < 2) {
        const next = lowQualityStreakRef.current + 1;
        if (next >= 5) {
          shouldTriggerSpray = true;
          lowQualityStreakRef.current = 0;
        } else {
          lowQualityStreakRef.current = next;
        }
      } else {
        lowQualityStreakRef.current = 0;
      }
      if (shouldTriggerSpray) {
        const activatedAt = Date.now();
        setSprayDebuff({ activatedAt, expiresAt: activatedAt + SPRAY_DEBUFF_DURATION_MS });
        handleManualLog('sprayAndPray', { timestamp: activatedAt, streak: 5 });
      }
      if (app.favorite) {
        handleManualLog('favoriteMarked', { applicationId: id });
      }
      if (app.status) {
        handleManualLog('statusChange', {
          applicationId: id,
          from: null,
          to: app.status,
          status: app.status,
        });
      }
      return true;
    },
    [
      focus,
      activeEffects,
      gainXp,
      sprayMultiplier,
      sprayActive,
      handleManualLog,
      updateCurrentTime,
    ]
  );

  const handleLogPress = useCallback(() => {
    if (focus < MIN_FOCUS_FOR_LOG) {
      Alert.alert('Out of Focus', 'You are out of focus! Recharge to log more applications.');
      return;
    }
    setShowForm(true);
  }, [focus]);

  const handleQuestAction = useCallback(
    (action, quest) => {
      if (!action) {
        return;
      }
      if (action.type === 'log' && action.key) {
        handleManualLog(action.key, { questId: quest?.id, actionKey: action.key });
      }
    },
    [handleManualLog],
  );

  const openChest = useCallback(
    (chest) => {
      if (!chest) {
        return null;
      }
      const base = rand(chest.gold);
      const totalGold = Math.round(base * goldMultiplier);
      setGold((value) => value + totalGold);
      setChests((prev) => prev.filter((item) => item.id !== chest.id));
      setFocusedChestId(null);
      setOpenResult({ gold: totalGold });
      if (openResultTimer.current) {
        clearTimeout(openResultTimer.current);
      }
      openResultTimer.current = setTimeout(() => {
        setOpenResult(null);
      }, 1600);
      return { gold: totalGold };
    },
    [goldMultiplier],
  );

  const openAll = useCallback(() => {
    if (!chests.length) {
      return;
    }
    let totalGold = 0;
    chests.forEach((item) => {
      totalGold += Math.round(rand(item.gold) * goldMultiplier);
    });
    setGold((value) => value + totalGold);
    setChests([]);
    setFocusedChestId(null);
    setOpenAllSummary({ gold: totalGold, opened: chests.length });
  }, [chests, goldMultiplier]);

  const { statsSnapshot, weeklyTrend } = useMemo(() => {
    const now = Number.isFinite(currentTime) ? currentTime : Date.now();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const dayMs = 24 * 60 * 60 * 1000;
    const todayStart = startOfToday.getTime();
    const weekStart = todayStart - dayMs * 6;
    const previousWeekStart = weekStart - dayMs * 7;

    let todayCount = 0;
    let weekCount = 0;
    let previousWeekCount = 0;
    let pipelineCount = 0;
    let respondedCount = 0;
    let interviewCount = 0;
    let earliestTimestamp = Number.POSITIVE_INFINITY;

    const pipelineStatuses = new Set(['Applied', 'Applied with referral', 'Interview']);
    const respondedStatuses = new Set(['Applied with referral', 'Interview', 'Rejected']);

    applications.forEach((app) => {
      const statusKey = app?.status;
      if (pipelineStatuses.has(statusKey)) {
        pipelineCount += 1;
      }
      if (respondedStatuses.has(statusKey)) {
        respondedCount += 1;
      }
      if (statusKey === 'Interview') {
        interviewCount += 1;
      }
      const timestamp = toTimestamp(app?.date ?? app?.timestamp ?? app?.createdAt);
      if (!Number.isFinite(timestamp)) {
        return;
      }
      if (timestamp < earliestTimestamp) {
        earliestTimestamp = timestamp;
      }
      if (timestamp >= weekStart) {
        weekCount += 1;
      } else if (timestamp >= previousWeekStart) {
        previousWeekCount += 1;
      }
      if (timestamp >= todayStart) {
        todayCount += 1;
      }
    });

    const formatAverage = (count, span) => {
      if (span <= 0) {
        return '0';
      }
      const average = count / span;
      const rounded = Math.round(average * 10) / 10;
      return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
    };

    const totalCount = applications.length;

    let trackedDays = 1;
    if (Number.isFinite(earliestTimestamp)) {
      const earliestDay = new Date(earliestTimestamp);
      earliestDay.setHours(0, 0, 0, 0);
      const diff = todayStart - earliestDay.getTime();
      trackedDays = Math.max(1, Math.floor(diff / dayMs) + 1);
    }

    const perDayAverage = formatAverage(totalCount, trackedDays);
    const replyRate = totalCount > 0 ? Math.round((respondedCount / totalCount) * 100) : 0;
    const interviewRate = totalCount > 0 ? Math.round((interviewCount / totalCount) * 100) : 0;

    const statsSnapshot = [
      {
        key: 'today',
        label: 'Logged Today',
        value: String(todayCount),
      },
      {
        key: 'perDayAverage',
        label: 'Per day',
        value: perDayAverage,
      },
      {
        key: 'pipeline',
        label: 'Active apps',
        value: String(pipelineCount),
      },
      {
        key: 'responseRate',
        label: 'Reply rate',
        value: `${replyRate}%`,
      },
      {
        key: 'interviews',
        label: 'Interviews',
        value: String(interviewCount),
      },
      {
        key: 'interviewRate',
        label: 'Interview rate',
        value: `${interviewRate}%`,
      },
    ];

    let percentChange = 0;
    if (previousWeekCount === 0) {
      percentChange = weekCount > 0 ? 100 : 0;
    } else {
      percentChange = Math.round(((weekCount - previousWeekCount) / previousWeekCount) * 100);
    }

    const weeklyTrend = {
      current: weekCount,
      previous: previousWeekCount,
      percent: percentChange,
      direction:
        weekCount > previousWeekCount ? 'up' : weekCount < previousWeekCount ? 'down' : 'neutral',
    };

    return { statsSnapshot, weeklyTrend };
  }, [applications, currentTime]);
  const statPrimaryColor = colors.text;
  const statLabelColor = 'rgba(148,163,184,.95)';
  const statPanelBorderColor = colors.surfaceBorder;
  const statBorderColor = hexToRgba(colors.sky, eff === 'light' ? 0.4 : 0.6);
  const statHeaderIconBackground = 'transparent';
  const statHeaderIconBorder = hexToRgba(colors.sky, eff === 'light' ? 0.35 : 0.45);
  const trendIconName =
    weeklyTrend.direction === 'up'
      ? 'trending-up'
      : weeklyTrend.direction === 'down'
      ? 'trending-down'
      : 'trending-neutral';
  const trendColor =
    weeklyTrend.direction === 'up'
      ? colors.emerald
      : weeklyTrend.direction === 'down'
      ? colors.rose
      : statLabelColor;
  const trendBackground =
    weeklyTrend.direction === 'up'
      ? hexToRgba(colors.emerald, eff === 'light' ? 0.18 : 0.32)
      : weeklyTrend.direction === 'down'
      ? hexToRgba(colors.rose, eff === 'light' ? 0.18 : 0.32)
      : 'rgba(148,163,184,0.18)';
  const trendLabel = `${weeklyTrend.percent > 0 ? '+' : ''}${weeklyTrend.percent}% vs last week`;
  const trendAccessibilityLabel =
    weeklyTrend.direction === 'up'
      ? `Total applications increased ${trendLabel}`
      : weeklyTrend.direction === 'down'
      ? `Total applications decreased ${trendLabel}`
      : `Total applications unchanged ${trendLabel}`;

  const totalPotential = useMemo(() => computePotential(chests), [chests]);
  const viewRange = totalPotential ? `${formatRange(totalPotential)}g` : '0g';
  const hasChests = chests.length > 0;
  const summaryMuted = eff === 'light' ? 'rgba(15,23,42,0.66)' : 'rgba(226,232,240,0.76)';
  const summaryStrong = eff === 'light' ? '#0f172a' : colors.text;
  const headlineColor = hexToRgba(colors.text, 0.85);

  const statusIcons = useMemo(() => {
    const entries = {};
    Object.entries(STATUS_META).forEach(([key, meta]) => {
      if (!meta) {
        return;
      }
      entries[key] = {
        icon: meta.icon,
        tint: meta.tint ? colors[meta.tint] : colors.text,
      };
    });
    return entries;
  }, [colors]);

  const statusLookup = useMemo(
    () => Object.fromEntries(STATUSES.map((status) => [status.key, status])),
    []
  );

  const filteredApps = useMemo(() => {
    let list = [...applications];
    const query = appsQuery.trim().toLowerCase();
    if (query) {
      list = list.filter((app) =>
        `${app.company} ${app.role} ${app.platform}`.toLowerCase().includes(query),
      );
    }
    if (filterStatuses.length) {
      list = list.filter((app) => filterStatuses.includes(app.status));
    }
    if (filterPlatforms.length) {
      list = list.filter((app) => filterPlatforms.includes(app.platform));
    }
    switch (sortKey) {
      case 'Oldest':
        list.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
        break;
      case 'Company A-Z':
        list.sort((a, b) => {
          const compare = a.company.localeCompare(b.company);
          if (compare !== 0) {
            return compare;
          }
          return new Date(b.date || 0) - new Date(a.date || 0);
        });
        break;
      case 'Favorites first':
        list.sort(
          (a, b) =>
            (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0) ||
            new Date(b.date || 0) - new Date(a.date || 0),
        );
        break;
      default:
        list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }
    return list;
  }, [applications, appsQuery, filterStatuses, filterPlatforms, sortKey]);

  const toggleFilterStatus = useCallback((value) => {
    setFilterStatuses((list) =>
      list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
    );
  }, []);

  const toggleFilterPlatform = useCallback((value) => {
    setFilterPlatforms((list) =>
      list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
    );
  }, []);

  const clearFilters = useCallback(() => {
    setFilterStatuses([]);
    setFilterPlatforms([]);
  }, []);

  const handleDeleteApp = useCallback((id) => {
    setApplications((list) => {
      const target = list.find((item) => item.id === id);
      if (!target) {
        return list;
      }
      setApps((value) => Math.max(0, value - 1));
      return list.filter((item) => item.id !== id);
    });
  }, []);

  const handleEditSubmit = useCallback(
    (fields) => {
      if (!editingApp) {
        return false;
      }
      const previous = editingApp;
      const updated = { ...previous, ...fields };
      const { qs, au } = computeRewards(updated, { effects: activeEffects, spray: sprayMultiplier });
      updated.qs = qs;
      updated.au = au;
      setApplications((list) => list.map((app) => (app.id === previous.id ? updated : app)));
      setEditingApp(null);
      if (!previous.favorite && updated.favorite) {
        handleManualLog('favoriteMarked', { applicationId: previous.id });
      }
      if (previous.status !== updated.status) {
        handleManualLog('statusChange', {
          applicationId: previous.id,
          from: previous.status,
          to: updated.status,
          status: updated.status,
        });
      }
      return true;
    },
    [editingApp, activeEffects, sprayMultiplier, handleManualLog],
  );

  const questMetrics = useMemo(
    () => computeQuestMetrics({ applications, manualLogs, now: currentTime }),
    [applications, manualLogs, currentTime],
  );

  const eventProgress = useMemo(
    () =>
      computeEventProgressMap({
        events: eventStates,
        applications,
        manualLogs,
        now: currentTime,
      }),
    [eventStates, applications, manualLogs, currentTime],
  );

  const { questsByTab, unclaimedByTab } = useMemo(
    () =>
      buildQuestTabs({
        base: QUESTS,
        metrics: questMetrics,
        claimed: claimedQuests,
        events: eventStates,
        eventProgress,
      }),
    [questMetrics, claimedQuests, eventStates, eventProgress],
  );

  const eventNotificationIds = useMemo(
    () =>
      Object.keys(
        eventNotifications && typeof eventNotifications === 'object'
          ? eventNotifications
          : {},
      ),
    [eventNotifications],
  );

  const eventNotificationCount = eventNotificationIds.length;

  const eventClaimableIds = useMemo(() => {
    const eventsList = questsByTab?.Events || [];
    const ids = new Set();
    eventsList.forEach((quest) => {
      if (quest?.type === 'event' && quest.claimable) {
        ids.add(quest.id);
      }
    });
    return ids;
  }, [questsByTab]);

  const unseenClaimableEventCount = useMemo(
    () =>
      eventNotificationIds.reduce(
        (count, id) => (eventClaimableIds.has(id) ? count + 1 : count),
        0,
      ),
    [eventNotificationIds, eventClaimableIds],
  );

  const additionalEventNotifications = useMemo(
    () => Math.max(0, eventNotificationCount - unseenClaimableEventCount),
    [eventNotificationCount, unseenClaimableEventCount],
  );

  const eventTabBadgeCount = useMemo(
    () => (unclaimedByTab.Events || 0) + additionalEventNotifications,
    [unclaimedByTab, additionalEventNotifications],
  );

  const quests = useMemo(() => {
    const list = questsByTab[questTab] || [];
    return list.filter((quest) => {
      if (quest.type === 'note' || quest.type === 'summary') {
        return false;
      }
      if (quest.claimed) {
        return false;
      }
      if (quest.type === 'event' && Number.isFinite(quest.expiresAt) && quest.expiresAt <= currentTime) {
        return false;
      }
      return true;
    });
  }, [questTab, questsByTab, currentTime]);

  const unclaimedQuestsTotal = useMemo(
    () =>
      Object.values(unclaimedByTab).reduce((sum, value) => sum + value, 0) +
      additionalEventNotifications,
    [unclaimedByTab, additionalEventNotifications],
  );

  const questCardShadow = useMemo(
    () =>
      eff === 'light'
        ? {
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 4,
          }
        : {
            shadowColor: '#000',
            shadowOpacity: 0.35,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 6,
          },
    [eff],
  );

  const questBadgeShadow = useMemo(
    () =>
      eff === 'light'
        ? {
            shadowColor: '#f43f5e',
            shadowOpacity: 0.35,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
            elevation: 4,
          }
        : {
            shadowColor: '#f43f5e',
            shadowOpacity: 0.55,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          },
    [eff],
  );

  const makeRewardEntries = useCallback(
    (reward) => {
      if (!reward) {
        return [];
      }
      const entries = [];
      if (typeof reward.xp === 'number' && reward.xp > 0) {
        entries.push({ icon: 'flash-outline', color: colors.sky, label: `${reward.xp} XP` });
      }
      if (typeof reward.gold === 'number' && reward.gold > 0) {
        entries.push({ icon: 'diamond-stone', color: colors.emerald, label: formatGold(reward.gold) });
      }
      if (reward.chest) {
        entries.push({ icon: 'treasure-chest', color: colors.amber, label: `${reward.chest} chest` });
      }
      return entries;
    },
    [colors],
  );

  const renderMetaRow = useCallback(
    (icon, label, value, key) => {
      if (!value) {
        return null;
      }
      return (
        <View key={key} style={styles.questMetaRow}>
          <MaterialCommunityIcons name={icon} size={14} color={colors.sky} />
          <Text style={[styles.questMetaLabel, { color: hexToRgba(colors.text, 0.7) }]}>{label}:</Text>
          <Text style={[styles.questMetaValue, { color: colors.text }]}>{value}</Text>
        </View>
      );
    },
    [colors],
  );

  const renderStages = useCallback(
    (stages, label, keyPrefix, quest, options = {}) => {
      if (!stages || !stages.length) {
        return null;
      }

      const { sequential = false } = options;
      const visibleStages = [];
      let allowNext = true;

      stages.forEach((stage, stageIndex) => {
        if (!sequential) {
          visibleStages.push({ stage, stageIndex });
          return;
        }

        if (stage.completed === true) {
          visibleStages.push({ stage, stageIndex });
          return;
        }

        if (allowNext) {
          visibleStages.push({ stage, stageIndex });
          allowNext = false;
        }
      });

      return (
        <View style={styles.questStageList}>
          {visibleStages.map(({ stage, stageIndex }) => {
            const stageRewards = makeRewardEntries(stage.reward);
            const isClaimed = stage.claimed === true;
            const isCompleted = stage.completed === true;
            const isReady = !isClaimed && isCompleted;
            const showProgress =
              typeof stage.progress === 'number' && typeof stage.goalValue === 'number' && stage.goalValue > 0;
            const progressValue = showProgress
              ? `${Math.min(stage.progress, stage.goalValue)} / ${stage.goalValue}`
              : null;
            const backgroundColor = isClaimed
              ? hexToRgba(colors.emerald, 0.12)
              : isReady
              ? hexToRgba(colors.amber, 0.12)
              : colors.chipBg;
            const borderColor = isClaimed
              ? hexToRgba(colors.emerald, 0.45)
              : isReady
              ? hexToRgba(colors.amber, 0.45)
              : colors.surfaceBorder;
            const statusColor = isClaimed ? colors.emerald : isReady ? colors.amber : null;
            return (
              <View
                key={`${keyPrefix}-${stageIndex}`}
                style={[
                  styles.questStageRow,
                  {
                    backgroundColor,
                    borderColor,
                  },
                ]}
              >
                <View style={styles.questStageHeader}>
                  <View style={styles.questStageTitleRow}>
                    <Text style={[styles.questStageTitle, { color: colors.text }]}>
                      {`${label} ${stageIndex + 1}`}
                    </Text>
                    {statusColor ? (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={16}
                        color={statusColor}
                        style={styles.questStageStatusIcon}
                      />
                    ) : null}
                  </View>
                  {stageRewards.length ? (
                    <View style={styles.questRewardMeta}>
                      {stageRewards.map((entry, rewardIndex) => (
                        <View
                          key={`${keyPrefix}-${stageIndex}-reward-${rewardIndex}`}
                          style={styles.questRewardPill}
                        >
                          <MaterialCommunityIcons name={entry.icon} size={14} color={entry.color} />
                          <Text style={[styles.questRewardText, { color: colors.text }]}>{entry.label}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.questStageGoal, { color: hexToRgba(colors.text, 0.75) }]}>{stage.goal}</Text>
                {progressValue ? (
                  <Text style={[styles.questStageProgress, { color: hexToRgba(colors.text, 0.68) }]}>{progressValue}</Text>
                ) : null}
                {stage.manualKey ? (
                  <TouchableOpacity
                    onPress={() =>
                      handleManualLog(stage.manualKey, { questId: quest?.id, stageId: stage.id || stage.index })
                    }
                    style={[
                      styles.questStageButton,
                      { borderColor: colors.surfaceBorder, backgroundColor: colors.chipBg },
                    ]}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="plus-circle-outline" size={14} color={colors.sky} />
                    <Text style={[styles.questStageButtonText, { color: colors.text }]}>Log progress</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })}
        </View>
      );
    },
    [colors, handleManualLog, makeRewardEntries],
  );

  const getStageProgressSummary = useCallback((stages) => {
    if (!Array.isArray(stages) || !stages.length) {
      return null;
    }
    const total = stages.length;
    const completed = stages.reduce((count, stage) => {
      if (stage?.claimed === true) {
        return count + 1;
      }
      if (stage?.claimed === false) {
        return count;
      }
      return stage?.completed ? count + 1 : count;
    }, 0);
    const current = Math.min(completed + 1, total);
    return `${current}/${total}`;
  }, []);

  const rarityKeys = useMemo(() => ['All', ...RARITIES.map((r) => r.key)], []);

  const rarityCounts = useMemo(() => {
    const counts = Object.fromEntries(rarityKeys.map((key) => [key, 0]));
    chests.forEach((item) => {
      const key = item.rarity || 'Common';
      counts[key] = (counts[key] || 0) + 1;
      counts.All = (counts.All || 0) + 1;
    });
    return counts;
  }, [chests, rarityKeys]);

  const visibleChests = useMemo(
    () =>
      chests.filter(
        (item) => chestFilter === 'All' || (item.rarity || 'Common') === chestFilter,
      ),
    [chests, chestFilter],
  );

  const goldMultiplier = useMemo(
    () => (activeEffects.some((effect) => effect.id === 2) ? 2 : 1),
    [activeEffects],
  );

  const applyRewardEffect = useCallback(
    (label) => {
      if (!label || typeof label !== 'string') {
        return;
      }
      const normalized = label.toLowerCase();
      const match = GAME_EFFECTS.find((effect) => normalized.includes(effect.name.toLowerCase()));
      if (!match) {
        return;
      }
      setActiveEffects((list) => {
        if (list.some((item) => item.id === match.id)) {
          return list;
        }
        return [
          ...list,
          {
            ...match,
            expiresAt: match.duration ? Date.now() + match.duration * 1000 : undefined,
          },
        ];
      });
    },
    [setActiveEffects],
  );

  const handleClaimQuest = useCallback(
    (quest) => {
      if (!quest || !quest.claimable) {
        return;
      }
      const reward = quest.claimReward || quest.reward || {};
      const eventTriggerAt = Number.isFinite(quest?.eventTriggerAt)
        ? quest.eventTriggerAt
        : Number.isFinite(quest?.startedAt)
        ? quest.startedAt
        : Number.isFinite(quest?.eventState?.triggeredAt)
        ? quest.eventState.triggeredAt
        : undefined;
      const targetId = quest.activeStageId || quest.id;
      const claimKey =
        quest.claimKey || quest.activeStageClaimKey || composeQuestClaimKey(targetId, eventTriggerAt);
      const questClaimKey = quest.questClaimKey || composeQuestClaimKey(quest.id, eventTriggerAt);
      const shouldCompleteQuest = quest.activeStageId
        ? quest.activeStageIsFinal === true && !quest.reward
        : true;
      let rewardGranted = false;
      setClaimedQuests((prev) => {
        if (!claimKey || prev.has(claimKey)) {
          return prev;
        }
        const next = new Set(prev);
        next.add(claimKey);
        if (quest.type === 'event') {
          if (targetId) {
            next.delete(targetId);
          }
          if (quest.id) {
            next.delete(quest.id);
          }
        } else if (targetId && targetId !== claimKey) {
          next.add(targetId);
        }
        if (shouldCompleteQuest && questClaimKey) {
          next.add(questClaimKey);
          if (quest.type !== 'event' && quest.id && questClaimKey !== quest.id) {
            next.add(quest.id);
          }
          if (quest.type === 'event' && quest.id) {
            next.delete(quest.id);
          }
        }
        if (typeof reward.xp === 'number' && reward.xp > 0) {
          gainXp(reward.xp);
        }
        if (typeof reward.gold === 'number' && reward.gold > 0) {
          setGold((value) => value + reward.gold);
        }
        if (reward.effect) {
          applyRewardEffect(reward.effect);
        }
        if (reward.cleanse) {
          const cleanseLabel = String(reward.cleanse).toLowerCase();
          if (cleanseLabel.includes('spray and pray')) {
            setSprayDebuff(null);
            lowQualityStreakRef.current = 0;
          }
        }
        rewardGranted = true;
        return next;
      });
      if (rewardGranted) {
        const newChest = createChestFromRarity(reward.chest);
        if (newChest) {
          setChests((prev) => [...prev, newChest]);
        }
      }
      if (quest?.type === 'event') {
        const completionTime = Date.now();
        updateCurrentTime(completionTime);
        setEventStates((prev) => {
          const map = prev && typeof prev === 'object' ? prev : {};
          const current = map[quest.id];
          if (!current) {
            return prev;
          }
          if (current.active === false && Number.isFinite(current.completedAt) && current.completedAt >= completionTime) {
            return prev;
          }
          return {
            ...map,
            [quest.id]: {
              ...current,
              active: false,
              completedAt: completionTime,
            },
          };
        });
      }
    },
    [gainXp, setGold, applyRewardEffect, setEventStates, updateCurrentTime],
  );

  useEffect(() => {
    return () => {
      if (openResultTimer.current) {
        clearTimeout(openResultTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      effectWarningTimers.current.forEach((timeout) => clearTimeout(timeout));
      effectWarningTimers.current.clear();
    };
  }, []);

  useEffect(() => {
    if (focusedChestId != null && !chests.some((item) => item.id === focusedChestId)) {
      setFocusedChestId(null);
    }
  }, [chests, focusedChestId]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={eff === 'light' ? 'dark-content' : 'light-content'} backgroundColor={colors.bg} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            onPress={cycle}
            icon={mode === 'light' ? 'weather-sunny' : mode === 'dark' ? 'weather-night' : 'theme-light-dark'}
            colors={colors}
            accessibilityLabel="Cycle theme"
          />
          <TouchableOpacity
            onPress={cyclePal}
            style={[styles.paletteButton, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          >
            <MaterialCommunityIcons name="palette-outline" size={20} color={colors.text} />
            <Text style={[styles.paletteText, { color: colors.text }]}>{pal.name}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <StatBadge icon="fire" count={streak} colors={colors} />
          <GoldPill colors={colors}>{gold}</GoldPill>
        </View>
      </View>

      {effectWarnings.length > 0 ? (
        <View style={styles.effectWarningsContainer}>
          {effectWarnings.map((warning, index) => {
            const gradientColors =
              warning.type === 'debuff'
                ? [hexToRgba(colors.rose, 0.28), hexToRgba(colors.amber, 0.22)]
                : [hexToRgba(colors.sky, 0.28), hexToRgba(colors.emerald, 0.24)];
            const borderColor =
              warning.type === 'debuff'
                ? hexToRgba(colors.rose, eff === 'light' ? 0.5 : 0.62)
                : hexToRgba(colors.sky, eff === 'light' ? 0.5 : 0.64);
            const titleColor = eff === 'light' ? '#0f172a' : colors.text;
            const labelColor = hexToRgba(colors.text, eff === 'light' ? 0.6 : 0.72);
            const descriptionColor = hexToRgba(colors.text, eff === 'light' ? 0.78 : 0.9);
            const metaColor = hexToRgba(colors.text, eff === 'light' ? 0.68 : 0.82);
            const iconBackground = hexToRgba(colors.text, eff === 'light' ? 0.12 : 0.28);
            const iconBorder = hexToRgba(colors.text, eff === 'light' ? 0.16 : 0.34);
            const iconColor = eff === 'light' ? '#0f172a' : colors.text;
            const closeColor = hexToRgba(colors.text, eff === 'light' ? 0.5 : 0.7);
            const durationLabel = warning.duration ? formatEffectDuration(warning.duration) : null;
            const iconName = warning.icon || (warning.type === 'debuff' ? 'alert-octagon-outline' : 'flash-outline');

            return (
              <View
                key={warning.id}
                style={[
                  styles.effectWarningItem,
                  index > 0 && styles.effectWarningItemSpacing,
                  eff === 'light' ? styles.effectWarningShadowLight : styles.effectWarningShadowDark,
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleDismissEffectWarning(warning.id)}
                  activeOpacity={0.88}
                  style={styles.effectWarningTouchable}
                  accessibilityRole="button"
                  accessibilityLabel={`${warning.name} ${warning.type === 'debuff' ? 'penalty active' : 'boost active'}`}
                >
                  <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.effectWarningCard, { borderColor }]}
                  >
                    <View style={styles.effectWarningTopRow}>
                      <View
                        style={[
                          styles.effectWarningIconShell,
                          { backgroundColor: iconBackground, borderColor: iconBorder },
                        ]}
                      >
                        <MaterialCommunityIcons name={iconName} size={20} color={iconColor} />
                      </View>
                      <View style={styles.effectWarningTextHeader}>
                        <Text style={[styles.effectWarningLabel, { color: labelColor }]}>
                          {warning.type === 'debuff' ? 'Penalty active' : 'Boost active'}
                        </Text>
                        <Text style={[styles.effectWarningTitle, { color: titleColor }]}>{warning.name}</Text>
                      </View>
                      <MaterialCommunityIcons
                        name="close"
                        size={16}
                        color={closeColor}
                        style={styles.effectWarningCloseIcon}
                      />
                    </View>
                    {warning.description ? (
                      <Text style={[styles.effectWarningDescription, { color: descriptionColor }]}>
                        {warning.description}
                      </Text>
                    ) : null}
                    {durationLabel ? (
                      <View style={styles.effectWarningMetaRow}>
                        <MaterialCommunityIcons name="clock-outline" size={13} color={metaColor} />
                        <Text style={[styles.effectWarningMetaText, { color: metaColor }]}>Lasts {durationLabel}</Text>
                      </View>
                    ) : null}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ) : null}

      {activeTab === 'Home' && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Level Panel */}
        <Panel colors={colors}>
          <View style={styles.levelHeader}>
            <View style={styles.levelInfo}>
              <MaterialCommunityIcons name="medal-outline" size={16} color={colors.sky} />
              <Text style={[styles.levelText, { color: colors.text }]}>Level {l}</Text>
            </View>
            <View style={styles.appsCount}>
              <MaterialCommunityIcons name="briefcase-outline" size={16} color={colors.text} />
              <Text style={[styles.appsCountText, { color: colors.text }]}>{apps}</Text>
            </View>
          </View>
          
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <View style={styles.progressLabel}>
                <MaterialCommunityIcons name="flash-outline" size={14} color="rgba(148,163,184,.95)" />
                <Text style={styles.progressLabelText}>XP to next</Text>
              </View>
              <Text style={styles.progressValue}>{Math.floor(rem)} / {need}</Text>
            </View>
            <ProgressBar value={rem} max={need} fromColor={colors.rose} toColor={colors.amber} colors={colors} />
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <View style={styles.progressLabel}>
                <MaterialCommunityIcons name="brain" size={14} color="rgba(148,163,184,.95)" />
                <Text style={styles.progressLabelText}>Focus</Text>
              </View>
              <Text style={styles.progressValue}>{focus.toFixed(1)} / {FOCUS_BASELINE}</Text>
            </View>
            <ProgressBar value={focus} max={FOCUS_BASELINE} fromColor={colors.lilac} toColor={colors.sky} colors={colors} />
          </View>
        </Panel>

        {/* Activity Snapshot */}
        <Panel colors={colors} style={[styles.statPanel, { borderColor: statPanelBorderColor }]}>
          <View style={styles.statHeaderRow}>
            <View style={styles.statHeaderInfo}>
              <View
                style={[
                  styles.statHeaderIcon,
                  { backgroundColor: statHeaderIconBackground, borderColor: statHeaderIconBorder },
                ]}
              >
                <MaterialCommunityIcons name="pulse" size={16} color={colors.sky} />
              </View>
              <View>
                <Text style={[styles.statHeaderTitle, { color: statPrimaryColor }]}>Activity</Text>
              </View>
            </View>
            <View
              style={[styles.statTrendTag, { backgroundColor: trendBackground }]}
              accessible
              accessibilityRole="text"
              accessibilityLabel={trendAccessibilityLabel}
            >
              <MaterialCommunityIcons name={trendIconName} size={14} color={trendColor} />
              <Text style={[styles.statTrendText, { color: trendColor }]}>{trendLabel}</Text>
            </View>
          </View>
          <View style={styles.statGrid}>
            {statsSnapshot.map((stat) => (
              <View key={stat.key} style={styles.statItem}>
                <Text style={[styles.statValue, { color: statLabelColor }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: statLabelColor }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </Panel>
        <TouchableOpacity
          onPress={handleLogPress}
          activeOpacity={0.88}
          style={[styles.logApplicationButton, { borderColor: statBorderColor }]}
          accessibilityLabel="Log a new job application"
        >
          <LinearGradient
            colors={[colors.sky, colors.emerald]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logApplicationInner}
          >
            <MaterialCommunityIcons name="file-document-edit-outline" size={16} color="#0f172a" />
            <Text style={[styles.logApplicationText, styles.logApplicationTextOnGradient]}>
              Log application
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        </ScrollView>
      )}

      {activeTab === 'Apps' && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.appsToolbar}>
            <View
              style={[
                styles.searchInput,
                { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              ]}
            >
              <MaterialCommunityIcons name="magnify" size={16} color="rgba(148,163,184,.95)" />
              <TextInput
                value={appsQuery}
                onChangeText={setAppsQuery}
                placeholder="Search applications"
                placeholderTextColor="rgba(148,163,184,.65)"
                style={[styles.searchInputField, { color: colors.text }]}
              />
            </View>
            <IconButton
              onPress={() => setFilterModalVisible(true)}
              icon="tune-variant"
              colors={colors}
              accessibilityLabel="Filter applications"
            />
            <IconButton
              onPress={() => setSortModalVisible(true)}
              icon="swap-vertical"
              colors={colors}
              accessibilityLabel="Sort applications"
            />
          </View>

          {filteredApps.length ? (
            filteredApps.map((app) => {
              const extras = [
                { key: 'cv', icon: 'file-document-outline', active: app.cvTailored },
                { key: 'motivation', icon: 'email-outline', active: app.motivation },
                { key: 'favorite', icon: 'star-outline', active: app.favorite },
              ];
              const statusInfo = statusIcons[app.status] || {};
              const status = statusLookup[app.status];
              const dateLabel = formatDateTime(app.date);
              const notePreview = truncate(app.note);
              const handleDelete = () => {
                Alert.alert('Delete application', 'Remove this application?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => handleDeleteApp(app.id) },
                ]);
              };

              return (
                <View
                  key={app.id}
                  style={[
                    styles.appCard,
                    { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, marginBottom: 12 },
                  ]}
                >
                  <View style={styles.appHeader}>
                    <View style={styles.appTitle}>
                      <Text style={[styles.appCompany, { color: colors.text }]}>{app.company}</Text>
                      <Text style={styles.appRole}>{app.role}</Text>
                      {notePreview ? <Text style={styles.appNote}>{notePreview}</Text> : null}
                    </View>
                    <View style={styles.appsCardMeta}>
                      {dateLabel ? <Text style={styles.appMetaText}>{dateLabel}</Text> : null}
                      <View style={styles.appsCardActions}>
                        <TouchableOpacity
                          onPress={() => setEditingApp(app)}
                          style={[styles.appsActionButton, { borderColor: colors.surfaceBorder }]}
                        >
                          <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleDelete}
                          style={[styles.appsActionButton, { borderColor: colors.surfaceBorder }]}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.rose} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <View style={styles.appExtras}>
                    {extras.map((extra, extraIndex) => {
                      const marginStyle = { marginRight: extraIndex === extras.length - 1 ? 0 : 8 };
                      if (extra.active) {
                        return (
                          <LinearGradient
                            key={extra.key}
                            colors={[colors.sky, colors.emerald]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.appExtraIcon, marginStyle]}
                          >
                            <MaterialCommunityIcons name={extra.icon} size={14} color="#0f172a" />
                          </LinearGradient>
                        );
                      }
                      return (
                        <View
                          key={extra.key}
                          style={[
                            styles.appExtraIcon,
                            marginStyle,
                            { backgroundColor: colors.chipBg, borderColor: colors.surfaceBorder, borderWidth: 1 },
                          ]}
                        >
                          <MaterialCommunityIcons name={extra.icon} size={14} color="rgba(148,163,184,.95)" />
                        </View>
                      );
                    })}
                  </View>

                  <View style={[styles.appFooter, { borderTopColor: colors.surfaceBorder }]}>
                    <View style={styles.appChips}>
                      <View
                        style={[
                          styles.appChip,
                          { backgroundColor: colors.chipBg, borderColor: colors.surfaceBorder, marginRight: 8 },
                        ]}
                      >
                        {statusInfo.icon ? (
                          <MaterialCommunityIcons
                            name={statusInfo.icon}
                            size={14}
                            color={statusInfo.tint || colors.text}
                            style={styles.appChipIcon}
                          />
                        ) : null}
                        <Text style={[styles.appChipText, { color: colors.text }]}>{status?.key || app.status}</Text>
                      </View>
                      <View
                        style={[
                          styles.appChip,
                          { backgroundColor: colors.chipBg, borderColor: colors.surfaceBorder },
                        ]}
                      >
                        <Text style={[styles.appChipText, { color: colors.text }]}>{app.platform}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View
              style={[
                styles.appEmpty,
                { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              ]}
            >
              <Text style={[styles.appEmptyText, { color: colors.text }]}>No applications yet.</Text>
              <TouchableOpacity
                onPress={handleLogPress}
                style={[styles.appEmptyButton, { backgroundColor: colors.sky }]}
              >
                <Text style={styles.appEmptyButtonText}>Log application</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {activeTab === 'Quests' && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.questTabsRow,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
            ]}
          >
            {QUEST_TABS.map((tab) => {
              const isActive = questTab === tab.key;
              const badge =
                tab.key === 'Events' ? eventTabBadgeCount : unclaimedByTab[tab.key] || 0;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setQuestTab(tab.key)}
                  activeOpacity={0.85}
                  style={[
                    styles.questTabButton,
                    { borderColor: colors.surfaceBorder, backgroundColor: colors.surface },
                  ]}
                >
                  {isActive ? (
                    <LinearGradient
                      colors={[colors.sky, colors.emerald]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[StyleSheet.absoluteFillObject, styles.questTabButtonGradient]}
                      pointerEvents="none"
                    />
                  ) : null}
                  <View style={styles.questTabButtonContent}>
                    <MaterialCommunityIcons
                      name={tab.icon}
                      size={16}
                      color={isActive ? '#0f172a' : colors.text}
                      style={styles.questTabIcon}
                    />
                    <Text style={[styles.questTabText, { color: isActive ? '#0f172a' : colors.text }]}>{tab.key}</Text>
                  </View>
                  {badge > 0 && (
                    <View style={[styles.questTabBadge, questBadgeShadow]}>
                      <Text style={styles.questTabBadgeText}>{badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.questList}>
            {quests.map((quest, index) => {
              const isLast = index === quests.length - 1;
              if (quest.type === 'section') {
                return (
                  <View
                    key={quest.id}
                    style={[
                      styles.questSectionHeading,
                      {
                        marginTop: index === 0 ? 0 : 24,
                        marginBottom: isLast ? 0 : 12,
                      },
                    ]}
                  >
                    <Text style={[styles.questSectionHeadingText, { color: colors.text }]}>{quest.title}</Text>
                    {quest.subtitle ? (
                      <Text
                        style={[styles.questSectionHeadingSubtitle, { color: hexToRgba(colors.text, 0.68) }]}
                      >
                        {quest.subtitle}
                      </Text>
                    ) : null}
                  </View>
                );
              }

              const trackable = quest.trackable === true;
              const progress = trackable ? quest.progress ?? 0 : 0;
              const goalValue = trackable ? quest.goalValue ?? 0 : 0;
              const claimed = quest.claimed === true;
              const claimable = quest.claimable === true;
              const percent = trackable
                ? quest.percent ?? (goalValue > 0 ? Math.min(100, (progress / goalValue) * 100) : 0)
                : 0;
              const questReward = quest.claimReward || quest.reward;
              const rewardEntries = makeRewardEntries(questReward);
              const rewardBonuses = [];
              if (questReward?.effect) {
                rewardBonuses.push({
                  icon: 'auto-fix',
                  color: colors.lilac,
                  label: questReward.effect,
                });
              }
              if (questReward?.cleanse) {
                rewardBonuses.push({
                  icon: 'broom',
                  color: colors.sky,
                  label: `Cleanse: ${questReward.cleanse}`,
                });
              }
              const tierSummary = Array.isArray(quest.tiers)
                ? getStageProgressSummary(quest.tiers)
                : null;
              const isMilestoneChain = quest.stageLabel === 'Milestone';
              const milestoneSummary =
                isMilestoneChain && Array.isArray(quest.steps)
                  ? getStageProgressSummary(quest.steps)
                  : null;
              const showTaskStages =
                Array.isArray(quest.steps) && quest.steps.length > 0 && !isMilestoneChain;
              const isEventQuest = quest.type === 'event';
              const remainingSeconds =
                isEventQuest && Number.isFinite(quest.expiresAt)
                  ? Math.max(0, Math.ceil((quest.expiresAt - currentTime) / 1000))
                  : null;
              const timeRemainingLabel =
                isEventQuest && remainingSeconds > 0 ? formatTime(remainingSeconds) : null;

              return (
                <View
                  key={quest.id}
                  style={[
                    styles.questCard,
                    {
                      backgroundColor: filledSurface,
                      borderColor: colors.surfaceBorder,
                      marginBottom: isLast ? 0 : 12,
                    },
                    questCardShadow,
                  ]}
                >
                  <View style={styles.questCardHeader}>
                    <View style={styles.questTitleGroup}>
                      <Text style={[styles.questTitle, { color: colors.text }]}>{quest.title}</Text>
                      {quest.subtitle ? (
                        <Text style={[styles.questSubtitle, { color: hexToRgba(colors.text, 0.72) }]}>{quest.subtitle}</Text>
                      ) : null}
                    </View>
                    {rewardEntries.length ? (
                      <View style={styles.questRewardMeta}>
                        {rewardEntries.map((entry, rewardIndex) => (
                          <View key={`${quest.id}-reward-${rewardIndex}`} style={styles.questRewardPill}>
                            <MaterialCommunityIcons name={entry.icon} size={14} color={entry.color} />
                            <Text style={[styles.questRewardText, { color: colors.text }]}>{entry.label}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>

                    {quest.actions?.length ? (
                    <View style={styles.questActionsRow}>
                      {quest.actions.map((action, actionIndex) => (
                        <TouchableOpacity
                          key={`${quest.id}-action-${actionIndex}`}
                          onPress={() => handleQuestAction(action, quest)}
                          style={[
                          styles.questActionButton,
                          { borderColor: colors.surfaceBorder, backgroundColor: colors.chipBg },
                        ]}
                          activeOpacity={0.85}
                        >
                          <MaterialCommunityIcons
                            name={action.icon || 'plus-circle-outline'}
                            size={14}
                            color={colors.sky}
                          />
                          <Text style={[styles.questActionText, { color: colors.text }]}>{action.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}

                  {rewardBonuses.length ? (
                    <View style={styles.questInfoSection}>
                      <Text style={[styles.questInfoLabel, { color: colors.text }]}>Bonus</Text>
                      <View style={styles.questBonusList}>
                        {rewardBonuses.map((bonus, bonusIndex) => (
                          <View
                            key={`${quest.id}-bonus-${bonusIndex}`}
                            style={[
                              styles.questBonusPill,
                              { borderColor: colors.surfaceBorder, backgroundColor: colors.chipBg },
                            ]}
                          >
                            <MaterialCommunityIcons name={bonus.icon} size={14} color={bonus.color} />
                            <Text style={[styles.questBonusText, { color: colors.text }]}>{bonus.label}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}

                  {quest.goals?.length ? (
                    <View style={styles.questInfoSection}>
                      {quest.goals.map((goal, goalIndex) => (
                        <Text
                          key={`${quest.id}-goal-${goalIndex}`}
                          style={[styles.questGoalText, { color: colors.text }]}
                        >
                          {goal}
                        </Text>
                      ))}
                    </View>
                  ) : null}

                  {quest.tasks?.length ? (
                    <View style={styles.questInfoSection}>
                      <Text style={[styles.questInfoLabel, { color: colors.text }]}>Tasks</Text>
                      {renderStages(quest.tasks, quest.stageLabel || 'Task', `${quest.id}-task`, quest)}
                    </View>
                  ) : null}

                  {tierSummary ? (
                    <View style={styles.questInfoSection}>
                      <Text style={[styles.questStageSummaryText, { color: colors.text }]}>
                        {`Tier progress (${tierSummary})`}
                      </Text>
                    </View>
                  ) : null}

                  {milestoneSummary ? (
                    <View style={styles.questInfoSection}>
                      <Text style={[styles.questStageSummaryText, { color: colors.text }]}>
                        {`Milestone progress (${milestoneSummary})`}
                      </Text>
                    </View>
                  ) : null}
                  {showTaskStages ? (
                    <View style={styles.questInfoSection}>
                      <Text style={[styles.questInfoLabel, { color: colors.text }]}>
                        {quest.stageLabel ? `${quest.stageLabel}s` : 'Steps'}
                      </Text>
                      {renderStages(quest.steps, quest.stageLabel || 'Step', `${quest.id}-step`, quest, { sequential: true })}
                    </View>
                  ) : null}

                  {quest.trigger ? renderMetaRow('flag-outline', 'Trigger', quest.trigger, `${quest.id}-trigger`) : null}
                  {quest.duration
                    ? renderMetaRow('clock-time-four-outline', 'Duration', quest.duration, `${quest.id}-duration`)
                    : null}
                  {timeRemainingLabel
                    ? renderMetaRow('timer-sand', 'Time left', timeRemainingLabel, `${quest.id}-remaining`)
                    : null}
                  {quest.lock ? renderMetaRow('lock-outline', 'Lock', quest.lock, `${quest.id}-lock`) : null}
                  {quest.requires ? renderMetaRow('link-variant', 'Requires', quest.requires, `${quest.id}-requires`) : null}

                  {trackable ? (
                    <>
                      <View style={styles.questProgressSection}>
                        <View
                          style={[
                            styles.questProgressTrack,
                            { backgroundColor: colors.chipBg },
                          ]}
                        >
                          <LinearGradient
                            colors={[colors.sky, colors.emerald]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.questProgressFill, { width: `${percent}%` }]}
                          />
                        </View>
                        <Text style={[styles.questProgressLabel, { color: 'rgba(148,163,184,.95)' }]}>
                          {progress} / {goalValue}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleClaimQuest(quest)}
                        disabled={!claimable}
                        activeOpacity={0.85}
                        style={[
                          styles.questClaimButton,
                          {
                            borderColor: colors.surfaceBorder,
                            backgroundColor: claimable ? 'transparent' : colors.chipBg,
                          },
                        ]}
                      >
                        {claimable ? (
                          <LinearGradient
                            colors={[colors.sky, colors.emerald]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[StyleSheet.absoluteFillObject, styles.questClaimGradient]}
                            pointerEvents="none"
                          />
                        ) : null}
                        <Text
                          style={[
                            styles.questClaimText,
                            { color: claimable ? '#0f172a' : 'rgba(148,163,184,.95)' },
                          ]}
                        >
                          {claimed ? 'Claimed' : 'Claim'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : null}
                </View>
              );
            })}
            {!quests.length && (
              <View style={[styles.questEmpty, { borderColor: colors.surfaceBorder }]}>
                <Text style={styles.questEmptyText}>No quests available.</Text>
              </View>
            )}
      </View>
        </ScrollView>
      )}

      {activeTab === 'Rewards' && (
        <>
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <LinearGradient
              colors={[hexToRgba(colors.sky, 0.28), hexToRgba(colors.emerald, 0.22)]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.rewardsSummary, { borderColor: colors.surfaceBorder }]}
            >
              <View style={styles.rewardsSummaryHeader}>
                <View style={styles.rewardsSummaryTitle}>
                  <MaterialCommunityIcons name="gift-outline" size={16} color={headlineColor} />
                  <Text style={[styles.rewardsSummaryTitleText, { color: headlineColor }]}>Treasure vault</Text>
                </View>
                <TouchableOpacity
                  onPress={openAll}
                  disabled={!hasChests}
                  activeOpacity={hasChests ? 0.9 : 1}
                  style={[
                    styles.rewardsSummaryButton,
                    {
                      borderColor: hasChests ? hexToRgba(colors.emerald, 0.45) : colors.surfaceBorder,
                      backgroundColor: hasChests
                        ? 'transparent'
                        : hexToRgba(colors.text, eff === 'light' ? 0.08 : 0.18),
                    },
                  ]}
                >
                  {hasChests ? (
                    <LinearGradient
                      colors={[colors.sky, colors.emerald]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.rewardsSummaryButtonBackground}
                    />
                  ) : null}
                  <View style={styles.rewardsSummaryButtonContent}>
                    <MaterialCommunityIcons
                      name="auto-fix"
                      size={14}
                      color={hasChests ? '#0f172a' : hexToRgba(colors.text, 0.55)}
                    />
                    <Text
                      style={[
                        styles.rewardsSummaryButtonText,
                        { color: hasChests ? '#0f172a' : hexToRgba(colors.text, 0.55) },
                      ]}
                    >
                      Open all
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.rewardsSummaryRow}>
                <View style={styles.rewardsSummaryStat}>
                  <MaterialCommunityIcons name="diamond-stone" size={14} color={summaryMuted} />
                  <Text style={[styles.rewardsSummaryStatText, { color: summaryMuted }]}>Potential</Text>
                  <Text style={[styles.rewardsSummaryRange, { color: summaryStrong }]}>{viewRange}</Text>
                </View>
              </View>
            </LinearGradient>

            <Text style={[styles.rewardsFilterLabel, { color: hexToRgba(colors.text, 0.6) }]}>Choose rarity</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rewardsFilterRow}
            >
              {rarityKeys.map((key) => {
                const active = chestFilter === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => {
                      setChestFilter(key);
                      setFocusedChestId(null);
                    }}
                    activeOpacity={0.9}
                    style={[
                      styles.rarityButton,
                      {
                        borderColor: active
                          ? hexToRgba(colors.emerald, 0.45)
                          : hexToRgba('#0f172a', eff === 'light' ? 0.08 : 0.24),
                        backgroundColor: active
                          ? 'transparent'
                          : hexToRgba('#0f172a', eff === 'light' ? 0.04 : 0.32),
                      },
                    ]}
                  >
                    {active ? (
                      <LinearGradient
                        colors={[colors.sky, colors.emerald]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.rarityButtonBackground}
                      />
                    ) : null}
                    <View style={styles.rarityButtonContent}>
                      <Text style={[styles.rarityButtonText, { color: active ? '#0f172a' : colors.text }]}>
                        {key}
                      </Text>
                      <View
                        style={[
                          styles.rarityBadge,
                          {
                            backgroundColor: active
                              ? 'rgba(255,255,255,0.6)'
                              : hexToRgba('#0f172a', eff === 'light' ? 0.08 : 0.28),
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.rarityBadgeText,
                            { color: active ? '#0f172a' : hexToRgba(colors.text, 0.7) },
                          ]}
                        >
                          {rarityCounts[key] || 0}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.chestGrid}>
              {visibleChests.map((chest) => (
                <ChestCard
                  key={chest.id}
                  chest={chest}
                  colors={colors}
                  theme={eff}
                  isFocused={focusedChestId === chest.id}
                  onFocus={setFocusedChestId}
                  onOpen={openChest}
                />
              ))}
              {!visibleChests.length && (
                <LinearGradient
                  colors={[hexToRgba(colors.sky, 0.18), hexToRgba(colors.emerald, 0.12)]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.chestEmpty, { borderColor: colors.surfaceBorder }]}
                >
                  <Text style={[styles.chestEmptyText, { color: hexToRgba(colors.text, 0.7) }]}>
                    No chests match this view.
                  </Text>
                </LinearGradient>
              )}
            </View>
          </ScrollView>

          <Modal
            visible={!!openAllSummary}
            transparent
            animationType="fade"
            onRequestClose={() => setOpenAllSummary(null)}
          >
            <View style={styles.rewardsModalOverlay}>
              <View
                style={[
                  styles.rewardsModalCard,
                  { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                  eff === 'light' ? styles.chestCardShadowLight : styles.chestCardShadowDark,
                ]}
              >
                <Text style={[styles.rewardsModalTitle, { color: colors.text }]}> 
                  Opened {openAllSummary?.opened} chest{openAllSummary?.opened === 1 ? '' : 's'}
                </Text>
                <View style={styles.rewardsModalGold}>
                  <MaterialCommunityIcons name="diamond-stone" size={18} color={colors.emerald} />
                  <Text style={[styles.rewardsModalGoldText, { color: colors.text }]}>
                    {openAllSummary?.gold}g
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setOpenAllSummary(null)}
                  activeOpacity={0.9}
                  style={[styles.rewardsModalButton, { borderColor: colors.surfaceBorder }]}
                >
                  <LinearGradient
                    colors={[colors.sky, colors.emerald]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.rewardsModalButtonBackground}
                  >
                    <Text style={styles.rewardsModalButtonText}>Nice!</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {openResult ? (
            <View
              pointerEvents="none"
              style={[
                styles.rewardsToastWrapper,
                eff === 'light' ? styles.rewardsToastShadowLight : styles.rewardsToastShadowDark,
              ]}
            >
              <LinearGradient
                colors={[hexToRgba(colors.sky, 0.24), hexToRgba(colors.emerald, 0.2)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.rewardsToastContainer, { borderColor: colors.surfaceBorder }]}
              >
                <Text
                  style={[
                    styles.rewardsToastTitle,
                    { color: eff === 'light' ? 'rgba(15,23,42,0.68)' : 'rgba(226,232,240,0.78)' },
                  ]}
                >
                  Fresh loot
                </Text>
                <View style={styles.rewardsToastValue}>
                  <MaterialCommunityIcons name="diamond-stone" size={18} color={eff === 'light' ? '#0f172a' : colors.emerald} />
                  <Text style={[styles.rewardsToastText, { color: eff === 'light' ? '#0f172a' : colors.text }]}>
                    {openResult.gold}g
                  </Text>
                </View>
              </LinearGradient>
            </View>
          ) : null}
        </>
      )}

      {activeTab === 'Shop' && (
        <ShopScreen
          colors={colors}
          eff={eff}
          gold={gold}
          setGold={setGold}
          effects={shopEffects}
          setEffects={setActiveEffects}
          premiumProgress={premiumProgress}
          setPremiumProgress={setPremiumProgress}
          mainTab={shopMainTab}
          setMainTab={setShopMainTab}
          categoryTab={shopCategoryTab}
          setCategoryTab={setShopCategoryTab}
        />
      )}

      <AppFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={addApplication}
        colors={colors}
        effects={activeEffects}
        spray={sprayMultiplier}
        statusOptions={LOG_STATUS_OPTIONS}
      />
      <AppFormModal
        visible={!!editingApp}
        onClose={() => setEditingApp(null)}
        onSubmit={handleEditSubmit}
        colors={colors}
        effects={activeEffects}
        spray={sprayMultiplier}
        defaults={editingApp || undefined}
        title="Edit application"
        submitLabel="Save"
        statusOptions={STATUSES}
      />

      <Modal visible={filterModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)} accessible={false}>
          <View style={styles.sheetOverlay}>
            <TouchableWithoutFeedback onPress={() => {}} accessible={false}>
              <View
                style={[styles.sheetBody, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
              >
                <View style={[styles.sheetHeader, { borderBottomColor: colors.surfaceBorder }]}>
                  <Text style={[styles.sheetTitle, { color: colors.text }]}>Filters</Text>
                  <TouchableOpacity
                    onPress={() => setFilterModalVisible(false)}
                    style={[styles.closeButton, { backgroundColor: colors.chipBg }]}
                  >
                    <MaterialCommunityIcons name="close" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  style={styles.sheetContent}
                  contentContainerStyle={styles.sheetContentContainer}
                  showsVerticalScrollIndicator={false}
                >
                  <View>
                    <Text style={[styles.sheetSubtitle, { color: colors.text }]}>Status</Text>
                    <View style={styles.sheetOptionRow}>
                      {STATUSES.map((status) => {
                        const active = filterStatuses.includes(status.key);
                        return (
                          <TouchableOpacity
                            key={status.key}
                            onPress={() => toggleFilterStatus(status.key)}
                            style={[
                              styles.sheetOption,
                              {
                                backgroundColor: active ? colors.sky : colors.chipBg,
                                borderColor: colors.surfaceBorder,
                              },
                            ]}
                          >
                            <Text style={[styles.sheetOptionText, { color: active ? '#0f172a' : colors.text }]}>
                              {status.key}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                  <View>
                    <Text style={[styles.sheetSubtitle, { color: colors.text }]}>Platform</Text>
                    <View style={styles.sheetOptionWrap}>
                      {PLATFORMS.map((platform) => {
                        const active = filterPlatforms.includes(platform);
                        return (
                          <TouchableOpacity
                            key={platform}
                            onPress={() => toggleFilterPlatform(platform)}
                            style={[
                              styles.sheetOption,
                              {
                                backgroundColor: active ? colors.emerald : colors.chipBg,
                                borderColor: colors.surfaceBorder,
                              },
                            ]}
                          >
                            <Text style={[styles.sheetOptionText, { color: active ? '#0f172a' : colors.text }]}>
                              {platform}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </ScrollView>
                <View style={[styles.sheetFooter, { borderTopColor: colors.surfaceBorder }]}>
                  <TouchableOpacity
                    onPress={clearFilters}
                    style={[
                      styles.sheetSecondaryButton,
                      { backgroundColor: colors.chipBg, borderColor: colors.surfaceBorder },
                    ]}
                  >
                    <Text style={[styles.sheetSecondaryButtonText, { color: colors.text }]}>Reset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={styles.sheetPrimaryButton}>
                    <LinearGradient
                      colors={[colors.sky, colors.emerald]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.sheetPrimaryButtonGradient}
                    >
                      <Text style={styles.sheetPrimaryButtonText}>Done</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={sortModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setSortModalVisible(false)} accessible={false}>
          <View style={styles.sheetOverlay}>
            <TouchableWithoutFeedback onPress={() => {}} accessible={false}>
              <View
                style={[styles.sheetBody, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
              >
                <View style={[styles.sheetHeader, { borderBottomColor: colors.surfaceBorder }]}>
                  <Text style={[styles.sheetTitle, { color: colors.text }]}>Sort by</Text>
                  <TouchableOpacity
                    onPress={() => setSortModalVisible(false)}
                    style={[styles.closeButton, { backgroundColor: colors.chipBg }]}
                  >
                    <MaterialCommunityIcons name="close" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <View style={styles.sheetContent}>
                  <View style={styles.sheetOptionList}>
                    {['Newest', 'Oldest', 'Company A-Z', 'Favorites first'].map((option) => {
                      const active = sortKey === option;
                      return (
                        <TouchableOpacity
                          key={option}
                          onPress={() => {
                            setSortKey(option);
                            setSortModalVisible(false);
                          }}
                          style={[
                            styles.sheetOption,
                            {
                              backgroundColor: active ? colors.sky : colors.chipBg,
                              borderColor: colors.surfaceBorder,
                            },
                          ]}
                        >
                          <Text style={[styles.sheetOptionText, { color: active ? '#0f172a' : colors.text }]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: eff === 'light' ? 'rgba(255,255,255,0.72)' : 'rgba(10,14,20,0.72)',
            borderTopColor: colors.surfaceBorder,
          },
        ]}
      >
        <View style={styles.bottomNavInner}>
          {BOTTOM_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const badgeCount =
              tab.key === 'Quests'
                ? unclaimedQuestsTotal
                : tab.key === 'Rewards'
                ? chests.length
                : 0;
            const badge = badgeCount ? String(badgeCount) : undefined;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.9}
                style={styles.bottomNavButton}
              >
                <View style={styles.bottomNavIconWrapper}>
                  <MaterialCommunityIcons
                    name={tab.icon}
                    size={22}
                    color={isActive ? colors.text : 'rgba(148,163,184,.65)'}
                  />
                  {badge ? (
                    <View style={[styles.bottomNavBadge, questBadgeShadow]}>
                      <Text style={styles.bottomNavBadgeText}>{badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.bottomNavLabel,
                    { color: isActive ? colors.text : 'rgba(148,163,184,.65)' },
                  ]}
                >
                  {tab.label}
                </Text>
                {isActive && (
                  <LinearGradient
                    colors={[colors.sky, colors.emerald]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.bottomNavIndicator}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.bottomSpacer} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paletteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  paletteText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  statBadgeCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  statBadgeCountText: {
    fontSize: 10,
    fontWeight: '600',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldPillWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  goldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.1)',
  },
  goldPillDim: {
    borderColor: 'rgba(15,23,42,0.12)',
  },
  goldPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1f2937',
  },
  goldPillTextDim: {
    color: 'rgba(15,23,42,0.6)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  panel: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  panelSubtitle: {
    fontSize: 12,
    color: 'rgba(148,163,184,.95)',
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelText: {
    fontSize: 18,
    fontWeight: '800',
  },
  appsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  appsCountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressSection: {
    marginTop: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressLabelText: {
    fontSize: 12,
    color: 'rgba(148,163,184,.95)',
  },
  progressValue: {
    fontSize: 12,
    color: 'rgba(148,163,184,.95)',
  },
  progressBarContainer: {
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  statPanel: {
    padding: 20,
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  statHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  statHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  statHeaderSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  statTrendTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statTrendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  logApplicationButton: {
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 12,
    overflow: 'hidden',
  },
  logApplicationInner: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logApplicationText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  logApplicationTextOnGradient: {
    color: '#0f172a',
  },
  appsToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 38,
    paddingHorizontal: 12,
    paddingVertical: 0,
    gap: 8,
  },
  searchInputField: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  questTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 12,
  },
  questTabButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  questTabButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questTabButtonGradient: {
    borderRadius: 999,
  },
  questTabIcon: {
    marginRight: 6,
  },
  questTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  questTabBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    backgroundColor: '#f43f5e',
  },
  questTabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  questList: {
    marginTop: 20,
  },
  questInfoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  questInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  questCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  questTag: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  questTagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  questCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  questTitleGroup: {
    flex: 1,
  },
  questTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  questSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  questActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 8,
  },
  questActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  questActionText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  questRewardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questRewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  questRewardText: {
    fontSize: 12,
    fontWeight: '600',
  },
  questBonusList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  questBonusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  questBonusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  questInfoSection: {
    marginTop: 16,
    gap: 6,
  },
  questGoalText: {
    fontSize: 12,
    lineHeight: 18,
  },
  questInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  questStageSummaryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  questBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  questBulletDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    marginTop: 6,
  },
  questBulletText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  questNoteText: {
    fontStyle: 'italic',
  },
  summaryRows: {
    marginTop: 8,
  },
  summaryRow: {
    fontSize: 13,
    marginBottom: 4,
  },
  questStageList: {
    gap: 10,
  },
  questStageRow: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  questStageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questStageProgress: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  questStageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
  },
  questStageButtonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  questStageStatusIcon: {
    marginLeft: 6,
  },
  questStageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  questStageTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  questStageGoal: {
    fontSize: 12,
    lineHeight: 18,
  },
  questMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  questMetaLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  questMetaValue: {
    fontSize: 12,
    flex: 1,
    flexWrap: 'wrap',
  },
  questProgressSection: {
    marginTop: 14,
  },
  questProgressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  questProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  questProgressLabel: {
    fontSize: 11,
    marginTop: 6,
  },
  questClaimButton: {
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  questClaimGradient: {
    borderRadius: 12,
  },
  questClaimText: {
    fontSize: 13,
    fontWeight: '600',
  },
  questSectionHeading: {
    gap: 4,
  },
  questSectionHeadingText: {
    fontSize: 13,
    fontWeight: '700',
  },
  questSectionHeadingSubtitle: {
    fontSize: 12,
  },
  questEmpty: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 24,
  },
  questEmptyText: {
    fontSize: 12,
    textAlign: 'center',
    color: 'rgba(148,163,184,.95)',
  },
  effectWarningsContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  effectWarningItem: {
    borderRadius: 18,
  },
  effectWarningItemSpacing: {
    marginTop: 12,
  },
  effectWarningTouchable: {
    borderRadius: 18,
  },
  effectWarningCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  effectWarningTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  effectWarningIconShell: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  effectWarningTextHeader: {
    flex: 1,
    marginLeft: 12,
  },
  effectWarningLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  effectWarningTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  effectWarningDescription: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
  },
  effectWarningMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  effectWarningMetaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  effectWarningCloseIcon: {
    marginLeft: 12,
  },
  effectWarningShadowLight: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  effectWarningShadowDark: {
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  appCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  appTitle: {
    flex: 1,
    marginRight: 12,
  },
  appCompany: {
    fontSize: 15,
    fontWeight: '700',
  },
  appRole: {
    fontSize: 12,
    color: 'rgba(148,163,184,.95)',
    marginTop: 2,
  },
  appNote: {
    fontSize: 11,
    color: 'rgba(148,163,184,.95)',
    marginTop: 6,
  },
  appMeta: {
    alignItems: 'flex-end',
  },
  appMetaText: {
    fontSize: 11,
    color: 'rgba(148,163,184,.95)',
  },
  appsCardMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  appsCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  appsActionButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appExtras: {
    flexDirection: 'row',
    marginTop: 12,
  },
  appExtraIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  appChips: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  appChipIcon: {
    marginRight: 6,
  },
  appChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  appEmpty: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  appEmptyText: {
    fontSize: 12,
    opacity: 0.75,
    textAlign: 'center',
  },
  appEmptyButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  appEmptyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  sheetBody: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sheetContent: {
    flexGrow: 0,
  },
  sheetContentContainer: {
    gap: 20,
    paddingBottom: 8,
  },
  sheetSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  sheetOptionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sheetOptionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sheetOptionList: {
    gap: 12,
  },
  sheetOption: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sheetOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    marginTop: 16,
  },
  sheetSecondaryButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  sheetSecondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sheetPrimaryButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sheetPrimaryButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  sheetPrimaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  bottomNav: {
    borderTopWidth: 1,
  },
  bottomNavInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  bottomNavButton: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  bottomNavIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavBadge: {
    position: 'absolute',
    top: -6,
    right: -12,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 12,
    backgroundColor: '#f43f5e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  bottomNavLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  bottomNavIndicator: {
    marginTop: 6,
    height: 3,
    borderRadius: 999,
    alignSelf: 'stretch',
  },
  bottomSpacer: {
    height: Platform.OS === 'ios' ? 28 : 16,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  rewardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  rewardChipText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
  },
  autoCompleteInputWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 4,
    position: 'relative',
  },
  autoCompleteInput: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  autoCompleteClear: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  autoCompleteSuggestions: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 160,
    overflow: 'hidden',
  },
  autoCompleteOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  autoCompleteOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  autoCompleteEmpty: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoCompleteEmptyText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  disabledInput: {
    opacity: 0.55,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    height: 80,
    textAlignVertical: 'top',
  },
  segmentedControl: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  segmentButtonInner: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  iconToggleRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  iconToggle: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  iconToggleInner: {
    flex: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  iconToggleInnerActive: {
    borderWidth: 0,
  },
  iconToggleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconToggleLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  inlineFieldRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  inlineField: {
    flex: 1,
    marginHorizontal: 6,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  statusOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  statusOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusOptionTextGroup: {
    flexShrink: 1,
  },
  statusOptionTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusOptionHint: {
    fontSize: 11,
  },
  platformOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  platformChip: {
    marginHorizontal: 6,
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  platformChipInner: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitButtonWrapper: {
    flex: 1,
    borderRadius: 12,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  rewardsSummary: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  rewardsSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rewardsSummaryTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardsSummaryTitleText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  rewardsSummaryButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  rewardsSummaryButtonBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 999,
  },
  rewardsSummaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rewardsSummaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rewardsSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  rewardsSummaryStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardsSummaryStatText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rewardsSummaryRange: {
    fontSize: 13,
    fontWeight: '700',
  },
  rewardsFilterLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  rewardsFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 6,
  },
  rarityButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  rarityButtonBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 999,
  },
  rarityButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rarityButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rarityBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rarityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  chestCard: {
    width: '48%',
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  chestCardInner: {
    alignItems: 'center',
    gap: 12,
  },
  chestIconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  chestRarity: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  chestHeadline: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  chestOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 8,
  },
  chestOverlayTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  chestOverlayRange: {
    fontSize: 18,
    fontWeight: '700',
  },
  chestOverlayHelper: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  chestOpenButton: {
    borderWidth: 1,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 8,
  },
  chestOpenButtonBg: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  chestOpenButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  chestEmpty: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  chestEmptyText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  shopContainer: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
  },
  shopGlowTopLeft: {
    position: 'absolute',
    top: -120,
    left: -120,
    width: 240,
    height: 240,
    borderRadius: 240,
  },
  shopGlowTopRight: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: 240,
    height: 240,
    borderRadius: 240,
  },
  shopGlowBottomRight: {
    position: 'absolute',
    bottom: -140,
    right: -120,
    width: 260,
    height: 260,
    borderRadius: 260,
  },
  shopGlowBottomLeft: {
    position: 'absolute',
    bottom: -140,
    left: -120,
    width: 260,
    height: 260,
    borderRadius: 260,
  },
  shopContent: {
    gap: 20,
  },
  shopMainTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    padding: 4,
    gap: 6,
  },
  shopMainTabButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  shopMainTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  shopMainTabIcon: {
    marginRight: 0,
  },
  shopMainTabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  shopSection: {
    marginTop: 16,
    gap: 18,
  },
  shopSectionHeader: {
    gap: 4,
  },
  shopSectionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  shopSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  shopEmptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  shopEmptyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopEmptyTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  shopEmptyDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  shopBrowseButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  shopBrowseButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  shopActiveList: {
    flexDirection: 'column',
    gap: 12,
  },
  shopActiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 12,
    width: '100%',
  },
  shopActiveIconShell: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopActiveIconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopActiveInfo: {
    flex: 1,
    gap: 6,
  },
  shopActiveNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopActiveName: {
    fontSize: 13,
    fontWeight: '600',
  },
  shopActiveTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shopActiveTimerText: {
    fontSize: 11,
    fontWeight: '600',
  },
  shopActivePassive: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  shopActiveDescription: {
    fontSize: 11,
    lineHeight: 16,
  },
  shopSecondaryTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    padding: 4,
    gap: 6,
  },
  shopSecondaryTabButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  shopSecondaryTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  shopSecondaryTabIcon: {
    marginRight: 0,
  },
  shopSecondaryTabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  shopCardList: {
    gap: 12,
  },
  shopCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  shopCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  shopIconShell: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopIconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopCardTitleArea: {
    flex: 1,
    gap: 6,
  },
  shopCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  shopCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  shopCardBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  shopCardBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  shopCardDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  shopCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shopMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shopMetaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  shopPremiumCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  shopPremiumHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  shopPremiumTitleArea: {
    flex: 1,
    gap: 6,
  },
  shopPremiumTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  shopPremiumBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  shopPremiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  shopPremiumButton: {
    marginLeft: 'auto',
  },
  shopPremiumProgressBar: {
    height: 10,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 12,
  },
  shopPremiumProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  shopPremiumAmounts: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  shopPremiumRemaining: {
    fontSize: 11,
    fontWeight: '600',
  },
  shopSliderTrack: {
    marginTop: 16,
    marginBottom: 12,
    height: 14,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
  },
  shopSliderFill: {
    height: '100%',
    borderRadius: 999,
  },
  shopSliderThumb: {
    position: 'absolute',
    top: -4,
    borderWidth: 1,
    borderRadius: 12,
  },
  shopModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  shopModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    gap: 20,
  },
  shopModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shopModalIconShell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopModalIconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopModalHeaderText: {
    flex: 1,
    gap: 6,
  },
  shopModalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  shopModalDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  shopModalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  shopModalLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  shopModalLabelValue: {
    fontSize: 12,
  },
  shopModalHint: {
    fontSize: 11,
  },
  shopModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  shopModalButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shopModalButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  shopModalPrimary: {
    backgroundColor: 'transparent',
  },
  shopModalPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  shopConfirmCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  shopConfirmIconRow: {
    alignItems: 'center',
  },
  shopConfirmTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  shopCardShadowLight: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  shopCardShadowDark: {
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7,
  },

  rewardsModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 24,
  },
  rewardsModalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  rewardsModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  rewardsModalGold: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  rewardsModalGoldText: {
    fontSize: 18,
    fontWeight: '700',
  },
  rewardsModalButton: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  rewardsModalButtonBackground: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardsModalButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  rewardsToastWrapper: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 120,
    borderRadius: 24,
    overflow: 'hidden',
  },
  rewardsToastContainer: {
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  rewardsToastTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  rewardsToastValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardsToastText: {
    fontSize: 16,
    fontWeight: '700',
  },
  chestCardShadowLight: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  chestCardShadowDark: {
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  rewardsToastShadowLight: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  rewardsToastShadowDark: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
});
