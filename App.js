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
  Switch,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
import { STATUSES, PLATFORMS } from './data';

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
  { key: 'Daily', icon: 'calendar' },
  { key: 'Weekly', icon: 'time' },
  { key: 'Growth', icon: 'trending-up' },
  { key: 'Events', icon: 'sparkles' },
];

const QUESTS = {
  Daily: [
    { id: 'd1', title: 'Log 3 applications', desc: 'Keep the momentum going', progress: 1, goal: 3, xp: 40, gold: 8 },
    { id: 'd2', title: 'Network with a recruiter', desc: 'Reach out and say hi', progress: 1, goal: 1, xp: 30, gold: 6 },
  ],
  Weekly: [
    { id: 'w1', title: 'Complete 10 applications', desc: 'Consistency is king', progress: 4, goal: 10, xp: 120, gold: 30 },
    { id: 'w2', title: 'Secure 2 interviews', desc: 'Show them your skills', progress: 0, goal: 2, xp: 150, gold: 50 },
  ],
  Growth: [
    { id: 'g1', title: 'Earn a new certification', desc: 'Invest in your skills', progress: 0, goal: 1, xp: 300, gold: 80 },
  ],
  Events: [
    { id: 'e1', title: 'Halloween hiring spree', desc: 'Spooky season bonus', progress: 0, goal: 1, xp: 200, gold: 60 },
  ],
};

const countUnclaimedQuests = (claimed) =>
  Object.values(QUESTS)
    .flat()
    .filter((quest) => quest.progress >= quest.goal && !claimed.has(quest.id)).length;

const countUnclaimedQuestsByTab = (tabKey, claimed) =>
  (QUESTS[tabKey] || []).filter((quest) => quest.progress >= quest.goal && !claimed.has(quest.id)).length;

const BOTTOM_TABS = [
  { key: 'Home', label: 'Home', icon: 'home' },
  { key: 'Apps', label: 'Apps', icon: 'briefcase' },
  { key: 'Quests', label: 'Quests', icon: 'flag' },
  { key: 'Rewards', label: 'Rewards', icon: 'gift' },
  { key: 'Shop', label: 'Shop', icon: 'cart' },
];

const SHOP_MAIN_TABS = [
  { key: 'active', label: 'Active', icon: 'sparkles' },
  { key: 'catalogue', label: 'Catalogue', icon: 'wallet' },
];

const SHOP_CATALOG_TABS = [
  { key: 'effects', label: 'Boosts', icon: 'flash' },
  { key: 'rewards', label: 'Treats', icon: 'gift' },
  { key: 'premium', label: 'Premium', icon: 'trophy' },
];

const STATUS_META = {
  Applied: { icon: 'document-text-outline', tint: 'sky' },
  Interview: { icon: 'chatbubble-ellipses-outline', tint: 'emerald' },
  Ghosted: { icon: 'skull-outline', tint: 'rose' },
  Rejected: { icon: 'close-circle-outline', tint: 'rose' },
};

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

const costFor = (item) => Math.round(item.minutes * (item.pleasure ?? 1));

const formatGoldValue = (value) =>
  Math.max(0, value).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });

const formatGold = (value) => `${formatGoldValue(value)}g`;

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
  { key: 'Common', weight: 0.52, gold: [4, 12] },
  { key: 'Rare', weight: 0.3, gold: [8, 18] },
  { key: 'Epic', weight: 0.14, gold: [14, 28] },
  { key: 'Legendary', weight: 0.04, gold: [24, 48] },
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

function pickRarity() {
  const r = Math.random();
  let acc = 0;
  for (const entry of RARITIES) {
    acc += entry.weight;
    if (r <= acc) {
      return entry;
    }
  }
  return RARITIES[0];
}

const PLACEHOLDER_CHESTS = Array.from({ length: 12 }, (_, index) => {
  const rarity = pickRarity();
  return {
    id: index,
    rarity: rarity.key,
    gold: rarity.gold,
  };
});

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

const ToggleControl = ({ label, value, onValueChange, colors }) => (
  <TouchableOpacity
    onPress={() => onValueChange(!value)}
    activeOpacity={0.85}
    style={[
      styles.toggleItem,
      {
        backgroundColor: colors.surface,
        borderColor: colors.surfaceBorder,
      },
      value && {
        backgroundColor: hexToRgba(colors.sky, 0.22),
        borderColor: colors.sky,
      },
    ]}
  >
    <Text style={[styles.toggleLabel, { color: colors.text }]}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: hexToRgba(colors.text, 0.18), true: colors.sky }}
      thumbColor={Platform.OS === 'android' ? (value ? '#0f172a' : '#f8fafc') : undefined}
      ios_backgroundColor={hexToRgba(colors.text, 0.18)}
    />
  </TouchableOpacity>
);

const TypeSelector = ({ value, onChange, colors }) => (
  <View style={styles.segmentedControl}>
    {TYPE_OPTIONS.map((option) => {
      const isActive = value === option;
      return (
        <TouchableOpacity
          key={option}
          onPress={() => onChange(option)}
          style={[
            styles.segmentButton,
            { borderColor: colors.surfaceBorder },
            isActive && { backgroundColor: colors.sky },
          ]}
        >
          <Text style={[styles.segmentText, { color: isActive ? '#0f172a' : colors.text }]}>{option}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const StatusSelector = ({ value, onChange, colors }) => (
  <View>
    {STATUSES.map((status) => {
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
                <Ionicons
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
          {isActive ? <Ionicons name="checkmark-circle" size={18} color={tintColor} /> : null}
        </TouchableOpacity>
      );
    })}
  </View>
);

const PlatformSelector = ({ value, onChange, colors }) => (
  <View style={styles.platformOptions}>
    {PLATFORMS.map((platform) => {
      const isActive = value === platform;
      return (
        <TouchableOpacity
          key={platform}
          onPress={() => onChange(platform)}
          activeOpacity={0.85}
          style={[
            styles.platformChip,
            {
              backgroundColor: colors.chipBg,
              borderColor: colors.surfaceBorder,
            },
            isActive && {
              backgroundColor: colors.emerald,
              borderColor: colors.emerald,
            },
          ]}
        >
          <Text style={[styles.platformChipText, { color: isActive ? '#0f172a' : colors.text }]}>
            {platform}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// Helper components
const StatBadge = ({ icon, count, colors }) => (
  <View style={[styles.statBadge, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
    <Ionicons name={icon} size={20} color={colors.text} />
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
    <Ionicons name={icon} size={20} color={colors.text} />
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

const GoldPill = ({ children, colors, onPress, dim = false, style = {}, icon = 'diamond' }) => {
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
      <Ionicons name={icon} size={16} color={dim ? hexToRgba('#0f172a', 0.55) : '#1f2937'} />
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

const EffectTimerRing = ({ progress, colors, eff, size = 64, children }) => {
  const strokeWidth = Math.max(4, size * 0.14);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gradientId = useMemo(() => `effect-ring-${Math.random().toString(36).slice(2, 9)}`, []);
  const normalized = progress == null ? 1 : Math.max(0, Math.min(1, progress));
  const offset = circumference * (1 - normalized);
  const innerSize = size - strokeWidth * 1.6;
  const trackColor = hexToRgba(colors.text, eff === 'light' ? 0.16 : 0.4);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgLinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.sky} stopOpacity="1" />
            <Stop offset="100%" stopColor={colors.emerald} stopOpacity="1" />
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
  now,
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

  const sortedRewards = useMemo(
    () => REAL_REWARDS.slice().sort((a, b) => costFor(a) - costFor(b)),
    [],
  );

  const cardShadow = eff === 'light' ? styles.shopCardShadowLight : styles.shopCardShadowDark;

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
  const ConfirmIcon = confirmReward?.premium ? 'trophy' : 'gift';

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
                      <Ionicons
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
                  <Text style={[styles.shopSectionTitle, { color: colors.text }]}>Track your current boosts in real time.</Text>
                </View>
                {effects.length === 0 ? (
                  <View
                    style={[
                      styles.shopEmptyCard,
                      { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                      cardShadow,
                    ]}
                  >
                    <View style={styles.shopEmptyHeader}>
                      <Ionicons name="sparkles" size={18} color={colors.sky} />
                      <Text style={[styles.shopEmptyTitle, { color: colors.text }]}>No active boosts yet</Text>
                    </View>
                    <Text style={[styles.shopEmptyDescription, { color: hexToRgba(colors.text, 0.65) }]}>Activate a boost to double down on XP or gold. Your effects will appear here with live timers once purchased.</Text>
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
                      const progress = effect.duration && remaining != null
                        ? Math.max(0, Math.min(1, remaining / effect.duration))
                        : null;
                      return (
                        <View
                          key={effect.id}
                          style={[
                            styles.shopActiveCard,
                            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                            cardShadow,
                          ]}
                        >
                          <EffectTimerRing progress={progress} colors={colors} eff={eff}>
                            <View
                              style={[
                                styles.shopActiveIconShell,
                                { borderColor: colors.surfaceBorder, backgroundColor: colors.surface },
                              ]}
                            >
                              <LinearGradient
                                colors={[hexToRgba(colors.surface, 0.98), hexToRgba(colors.chipBg, 0.85)]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.shopActiveIconInner}
                              >
                                <Ionicons name={effect.icon || 'flash'} size={22} color="#0f172a" />
                              </LinearGradient>
                            </View>
                          </EffectTimerRing>
                          <View style={styles.shopActiveInfo}>
                            <Text style={[styles.shopActiveName, { color: colors.text }]}>{effect.name}</Text>
                            {remaining != null && effect.duration ? (
                              <View style={styles.shopActiveTimerRow}>
                                <Ionicons name="time" size={14} color={hexToRgba(colors.text, 0.6)} />
                                <Text style={[styles.shopActiveTimerText, { color: hexToRgba(colors.text, 0.6) }]}>
                                  {formatTime(remaining)}
                                </Text>
                              </View>
                            ) : (
                              <Text style={[styles.shopActivePassive, { color: hexToRgba(colors.text, 0.6) }]}>Passive boost</Text>
                            )}
                            <Text
                              style={[styles.shopActiveDescription, { color: hexToRgba(colors.text, 0.65) }]}
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
                          <Ionicons
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
                              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
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
                                  <Ionicons name={item.icon || 'flash'} size={20} color="#0f172a" />
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
                                  <Ionicons name="time" size={14} color={hexToRgba(colors.text, 0.6)} />
                                  <Text style={[styles.shopMetaText, { color: hexToRgba(colors.text, 0.6) }]}>
                                    {durationLabel}
                                  </Text>
                                </View>
                                <View style={styles.shopMetaItem}>
                                  <Ionicons name="cash" size={14} color={hexToRgba(colors.text, 0.6)} />
                                  <Text style={[styles.shopMetaText, { color: hexToRgba(colors.text, 0.6) }]}>
                                    {formatGold(item.cost)}
                                  </Text>
                                </View>
                              </View>
                              <GoldPill
                                colors={colors}
                                icon="cash"
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
                            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
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
                                <Ionicons name="gift" size={20} color="#0f172a" />
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
                                <Ionicons name="time" size={14} color={hexToRgba(colors.text, 0.6)} />
                                <Text style={[styles.shopMetaText, { color: hexToRgba(colors.text, 0.6) }]}>
                                  {item.minutes} min
                                </Text>
                              </View>
                              <View style={styles.shopMetaItem}>
                                <Ionicons name="cash" size={14} color={hexToRgba(colors.text, 0.6)} />
                                <Text style={[styles.shopMetaText, { color: hexToRgba(colors.text, 0.6) }]}>
                                  {formatGold(cost)}
                                </Text>
                              </View>
                            </View>
                            <GoldPill
                              colors={colors}
                              icon="cash"
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
                            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
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
                                <Ionicons name="trophy" size={20} color="#0f172a" />
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
                              icon="cash"
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
                              <Ionicons name="wallet" size={14} color={hexToRgba(colors.text, 0.6)} />
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
                      <Ionicons name="wallet" size={20} color="#0f172a" />
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
                      <Ionicons name={ConfirmIcon} size={22} color="#0f172a" />
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
          backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.72)' : 'rgba(15,23,42,0.55)',
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
              backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.45)',
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
              <Ionicons name="sparkles" size={16} color="#0f172a" />
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
  defaults,
  title = 'Log Application',
  submitLabel = 'Add Application',
}) => {
  const initialValues = useMemo(
    () => ({ ...buildInitialFormValues(), ...defaults }),
    [defaults],
  );
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
    () => computeRewards({ type, cvTailored, motivation }, { effects }),
    [type, cvTailored, motivation, effects],
  );
  const cost = useMemo(() => focusCost(type), [type]);

  const handleCancel = useCallback(() => {
    setForm(initialValues);
    onClose?.();
  }, [initialValues, onClose]);

  const handleSubmit = useCallback(() => {
    if (!company || !role) {
      Alert.alert('Error', 'Please fill in company and role');
      return;
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
          <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity onPress={handleCancel} style={[styles.closeButton, { backgroundColor: colors.chipBg }]}>
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
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
            <StatusSelector value={status} onChange={setField('status')} colors={colors} />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Platform</Text>
            <PlatformSelector value={platform} onChange={setField('platform')} colors={colors} />
          </View>

          <View style={styles.inlineFieldRow}>
            <TextField
              label="Country"
              value={country}
              onChangeText={setField('country')}
              placeholder="Switzerland"
              colors={colors}
              containerStyle={styles.inlineField}
              autoCapitalize="words"
            />
            <TextField
              label="City"
              value={city}
              onChangeText={setField('city')}
              placeholder="Zurich"
              colors={colors}
              containerStyle={styles.inlineField}
              autoCapitalize="words"
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

          <View style={styles.toggleGrid}>
            <ToggleControl
              label="CV Tailored"
              value={cvTailored}
              onValueChange={setField('cvTailored')}
              colors={colors}
            />
            <ToggleControl
              label="Motivation Letter"
              value={motivation}
              onValueChange={setField('motivation')}
              colors={colors}
            />
            <ToggleControl
              label="Favorite"
              value={favorite}
              onValueChange={setField('favorite')}
              colors={colors}
            />
          </View>

          <View style={styles.rewardInfo}>
            <Text style={[styles.rewardText, { color: colors.text }]}> 
              Rewards: +{xpReward} XP, +{goldReward} Gold, -{cost} Focus
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.modalFooter, { borderTopColor: colors.surfaceBorder }]}>
          <TouchableOpacity onPress={handleCancel} style={[styles.cancelButton, { backgroundColor: colors.chipBg }]}>
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSubmit}>
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
  const colors = cur(eff, pal);

  // Game state
  const [xp, setXp] = useState(520);
  const [apps, setApps] = useState(48);
  const [weighted, setWeighted] = useState(46.5);
  const [gold, setGold] = useState(260);
  const [skillPoints, setSkillPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [activeEffects, setActiveEffects] = useState([]);
  const [effectTimestamp, setEffectTimestamp] = useState(Date.now());
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
  const [chests, setChests] = useState(PLACEHOLDER_CHESTS);
  const [chestFilter, setChestFilter] = useState('All');
  const [focusedChestId, setFocusedChestId] = useState(null);
  const [openAllSummary, setOpenAllSummary] = useState(null);
  const [openResult, setOpenResult] = useState(null);
  const [premiumProgress, setPremiumProgress] = useState({});
  const [shopMainTab, setShopMainTab] = useState('catalogue');
  const [shopCategoryTab, setShopCategoryTab] = useState('effects');

  const openResultTimer = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = Date.now();
      setEffectTimestamp(current);
      setActiveEffects((list) => list.filter((fx) => !fx.expiresAt || fx.expiresAt > current));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { l, rem, need } = useMemo(() => lvl(xp), [xp]);
  const step = 25;
  const into = weighted % step;

  const gainXp = useCallback(
    (base, applyBuff = true) => {
      const hasBuff = applyBuff && activeEffects.some((effect) => effect.id === 1 || effect.id === 3);
      const multiplier = hasBuff ? 2 : 1;
      setXp((value) => value + base * multiplier);
    },
    [activeEffects]
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

      const id = Math.random().toString(36).slice(2, 9);
      const { xp: xpReward, gold: goldReward, qs, au } = computeRewards(payload, { effects: activeEffects });
      const app = { id, ...payload, qs, au };

      setApplications((list) => [app, ...list]);
      setApps((value) => value + 1);
      setWeighted((value) => value + au);
      gainXp(xpReward, false);
      setGold((value) => value + goldReward);
      setFocus((value) => Math.max(0, value - cost));
      return true;
    },
    [focus, activeEffects, gainXp]
  );

  const handleLogPress = useCallback(() => {
    if (focus < MIN_FOCUS_FOR_LOG) {
      Alert.alert('Out of Focus', 'You are out of focus! Recharge to log more applications.');
      return;
    }
    setShowForm(true);
  }, [focus]);

  const handleEasyApply = useCallback(() => {
    const now = new Date();
    addApplication({
      company: 'New Company',
      role: 'Easy Apply',
      country: '',
      city: '',
      type: 'Easy',
      status: 'Applied',
      date: now.toISOString(),
      note: '',
      cvTailored: false,
      motivation: false,
      favorite: false,
      platform: 'Company website',
    });
  }, [addApplication]);

  const handleNetworking = useCallback(() => {
    setGold((value) => value + 8);
  }, []);

  const handleSkill = useCallback(() => {
    gainXp(14);
    setGold((value) => value + 3);
  }, [gainXp]);

  const handleInterview = useCallback(() => {
    gainXp(18);
    setGold((value) => value + 4);
  }, [gainXp]);

  const handlePrestige = useCallback(() => {}, []);

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

  const quickActions = useMemo(
    () => [
      { key: 'Log application', icon: 'flash', onPress: handleLogPress, hint: 'Open log form' },
      { key: 'Easy apply', icon: 'trending-up', onPress: handleEasyApply, hint: 'Log easy apply' },
      { key: 'Networking', icon: 'people', onPress: handleNetworking, hint: 'Add networking' },
      { key: 'Skill', icon: 'school', onPress: handleSkill, hint: 'Add skill block' },
      { key: 'Interview', icon: 'chatbubbles', onPress: handleInterview, hint: 'Add interview prep' },
      {
        key: 'Prestige',
        icon: 'trophy',
        onPress: handlePrestige,
        hint: 'Prestige (requires Level 100)',
        disabled: l < 100,
      },
    ],
    [handleLogPress, handleEasyApply, handleNetworking, handleSkill, handleInterview, handlePrestige, l]
  );

  const viewRange = filteredPotential ? `${formatRange(filteredPotential)}g` : '0g';
  const hasChests = chests.length > 0;
  const summaryMuted = eff === 'light' ? 'rgba(15,23,42,0.66)' : 'rgba(226,232,240,0.76)';
  const summaryStrong = eff === 'light' ? '#0f172a' : colors.text;
  const pillBg = eff === 'light' ? 'rgba(255,255,255,0.55)' : 'rgba(15,23,42,0.38)';
  const filterHintColor = eff === 'light' ? 'rgba(15,23,42,0.5)' : 'rgba(226,232,240,0.6)';
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
      setWeighted((value) => Math.max(0, value - (target.au || 0)));
      return list.filter((item) => item.id !== id);
    });
  }, []);

  const handleEditSubmit = useCallback(
    (fields) => {
      if (!editingApp) {
        return false;
      }
      setApplications((list) =>
        list.map((app) => {
          if (app.id !== editingApp.id) {
            return app;
          }
          const next = { ...app, ...fields };
          const { qs, au } = computeRewards(next, { effects: activeEffects });
          setWeighted((value) => value - (app.au || 0) + au);
          return { ...next, qs, au };
        }),
      );
      setEditingApp(null);
      return true;
    },
    [editingApp, activeEffects],
  );

  const quests = useMemo(() => QUESTS[questTab] || [], [questTab]);

  const unclaimedQuestsTotal = useMemo(() => countUnclaimedQuests(claimedQuests), [claimedQuests]);

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

  const filteredPotential = useMemo(() => computePotential(visibleChests), [visibleChests]);

  const goldMultiplier = useMemo(
    () => (activeEffects.some((effect) => effect.id === 2) ? 2 : 1),
    [activeEffects],
  );

  const handleClaimQuest = useCallback(
    (quest) => {
      if (quest.progress < quest.goal) {
        return;
      }
      setClaimedQuests((prev) => {
        if (prev.has(quest.id)) {
          return prev;
        }
        const next = new Set(prev);
        next.add(quest.id);
        gainXp(quest.xp);
        setGold((value) => value + quest.gold);
        return next;
      });
    },
    [gainXp, setGold],
  );

  useEffect(() => {
    return () => {
      if (openResultTimer.current) {
        clearTimeout(openResultTimer.current);
      }
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
            icon={mode === 'light' ? 'sunny' : mode === 'dark' ? 'moon' : 'desktop'}
            colors={colors}
            accessibilityLabel="Cycle theme"
          />
          <TouchableOpacity
            onPress={cyclePal}
            style={[styles.paletteButton, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          >
            <Ionicons name="color-palette" size={20} color={colors.text} />
            <Text style={[styles.paletteText, { color: colors.text }]}>{pal.name}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerRight}>
          <StatBadge icon="school" count={skillPoints} colors={colors} />
          <StatBadge icon="flame" count={streak} colors={colors} />
          <GoldPill colors={colors}>{gold}</GoldPill>
        </View>
      </View>

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
              <Ionicons name="medal" size={16} color={colors.sky} />
              <Text style={[styles.levelText, { color: colors.text }]}>Level {l}</Text>
            </View>
            <View style={styles.appsCount}>
              <Ionicons name="briefcase" size={16} color={colors.text} />
              <Text style={[styles.appsCountText, { color: colors.text }]}>{apps}</Text>
            </View>
          </View>
          
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <View style={styles.progressLabel}>
                <Ionicons name="flash" size={14} color="rgba(148,163,184,.95)" />
                <Text style={styles.progressLabelText}>XP to next</Text>
              </View>
              <Text style={styles.progressValue}>{Math.floor(rem)} / {need}</Text>
            </View>
            <ProgressBar value={rem} max={need} fromColor={colors.rose} toColor={colors.amber} colors={colors} />
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <View style={styles.progressLabel}>
                <Ionicons name="bulb-outline" size={14} color="rgba(148,163,184,.95)" />
                <Text style={styles.progressLabelText}>Focus</Text>
              </View>
              <Text style={styles.progressValue}>{focus.toFixed(1)} / {FOCUS_BASELINE}</Text>
            </View>
            <ProgressBar value={focus} max={FOCUS_BASELINE} fromColor={colors.lilac} toColor={colors.sky} colors={colors} />
          </View>
        </Panel>

        {/* Milestone Panel */}
        <Panel colors={colors}>
          <View style={styles.progressHeader}>
            <View style={styles.progressLabel}>
              <Ionicons name="flag-outline" size={14} color="rgba(148,163,184,.95)" />
              <Text style={styles.progressLabelText}>Milestone</Text>
            </View>
            <Text style={styles.progressValue}>{into.toFixed(1)} / {step}</Text>
          </View>
          <ProgressBar value={into} max={step} fromColor={colors.sky} toColor={colors.emerald} colors={colors} />
        </Panel>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.key}
              onPress={action.onPress}
              disabled={action.disabled}
              style={[styles.quickAction, { opacity: action.disabled ? 0.5 : 1 }]}
              accessibilityLabel={action.hint}
            >
              <Ionicons name={action.icon} size={20} color="rgba(148,163,184,.95)" />
              <Text style={styles.quickActionText}>{action.key}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footerText}>
          Mobile build. Use "Log application" to open the form.
        </Text>
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
              <Ionicons name="search" size={16} color="rgba(148,163,184,.95)" />
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
              icon="filter"
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
                { key: 'cv', icon: 'document-text-outline', active: app.cvTailored },
                { key: 'motivation', icon: 'mail-outline', active: app.motivation },
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
                          <Ionicons name="create-outline" size={16} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleDelete}
                          style={[styles.appsActionButton, { borderColor: colors.surfaceBorder }]}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.rose} />
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
                            <Ionicons name={extra.icon} size={14} color="#0f172a" />
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
                          <Ionicons name={extra.icon} size={14} color="rgba(148,163,184,.95)" />
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
                          <Ionicons
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
              const badge = countUnclaimedQuestsByTab(tab.key, claimedQuests);
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
                    <Ionicons
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
              const claimed = claimedQuests.has(quest.id);
              const claimable = quest.progress >= quest.goal && !claimed;
              const percent = quest.goal ? Math.min(100, (quest.progress / quest.goal) * 100) : 0;
              return (
                <View
                  key={quest.id}
                  style={[
                    styles.questCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.surfaceBorder,
                      marginBottom: index === quests.length - 1 ? 0 : 12,
                    },
                    questCardShadow,
                  ]}
                >
                  <View style={styles.questCardHeader}>
                    <View style={styles.questTitleGroup}>
                      <Text style={[styles.questTitle, { color: colors.text }]}>{quest.title}</Text>
                      <Text style={[styles.questDescription, { color: 'rgba(148,163,184,.95)' }]}>{quest.desc}</Text>
                    </View>
                    <View style={styles.questRewardMeta}>
                      <View style={styles.questRewardPill}>
                        <Ionicons name="flash" size={14} color={colors.sky} />
                        <Text style={[styles.questRewardText, { color: colors.text }]}>{quest.xp}</Text>
                      </View>
                      <View style={styles.questRewardPill}>
                        <Ionicons name="cash" size={14} color={colors.emerald} />
                        <Text style={[styles.questRewardText, { color: colors.text }]}>{quest.gold}</Text>
                      </View>
                    </View>
                  </View>
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
                      {quest.progress} / {quest.goal}
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
                  <Ionicons name="gift" size={16} color={headlineColor} />
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
                    <Ionicons
                      name="sparkles"
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
                  <Text style={[styles.rewardsSummaryStatText, { color: summaryMuted }]}>In view</Text>
                  <View style={[styles.rewardsSummaryChip, { backgroundColor: pillBg }]}>
                    <Text style={[styles.rewardsSummaryChipText, { color: summaryStrong }]}>
                      {visibleChests.length}
                    </Text>
                  </View>
                  {chestFilter !== 'All' ? (
                    <Text style={[styles.rewardsSummaryHint, { color: filterHintColor }]}>({chestFilter.toLowerCase()})</Text>
                  ) : null}
                </View>
                <View style={styles.rewardsSummaryStat}>
                  <Ionicons name="cash" size={14} color={summaryMuted} />
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
                  <Ionicons name="cash" size={18} color={colors.emerald} />
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
                  <Ionicons name="cash" size={18} color={eff === 'light' ? '#0f172a' : colors.emerald} />
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
          effects={activeEffects}
          setEffects={setActiveEffects}
          now={effectTimestamp}
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
      />
      <AppFormModal
        visible={!!editingApp}
        onClose={() => setEditingApp(null)}
        onSubmit={handleEditSubmit}
        colors={colors}
        effects={activeEffects}
        defaults={editingApp || undefined}
        title="Edit application"
        submitLabel="Save"
      />

      <Modal visible={filterModalVisible} transparent animationType="fade">
        <View style={styles.sheetOverlay}>
          <View
            style={[styles.sheetBody, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          >
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Filters</Text>
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
                      { backgroundColor: active ? colors.sky : colors.chipBg, borderColor: colors.surfaceBorder },
                    ]}
                  >
                    <Text style={[styles.sheetOptionText, { color: active ? '#0f172a' : colors.text }]}>{status.key}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
                      { backgroundColor: active ? colors.emerald : colors.chipBg, borderColor: colors.surfaceBorder },
                    ]}
                  >
                    <Text style={[styles.sheetOptionText, { color: active ? '#0f172a' : colors.text }]}>{platform}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.sheetButtons}>
              <TouchableOpacity
                onPress={clearFilters}
                style={[styles.sheetButton, { backgroundColor: colors.chipBg, borderColor: colors.surfaceBorder }]}
              >
                <Text style={[styles.sheetButtonText, { color: colors.text }]}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={[styles.sheetButton, { backgroundColor: colors.sky }]}
              >
                <Text style={[styles.sheetButtonText, { color: '#0f172a' }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={sortModalVisible} transparent animationType="fade">
        <View style={styles.sheetOverlay}>
          <View
            style={[styles.sheetBody, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          >
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Sort by</Text>
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
                    { backgroundColor: active ? colors.sky : colors.chipBg, borderColor: colors.surfaceBorder },
                  ]}
                >
                  <Text style={[styles.sheetOptionText, { color: active ? '#0f172a' : colors.text }]}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
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
            const badge = tab.key === 'Quests' && unclaimedQuestsTotal ? String(unclaimedQuestsTotal) : undefined;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.9}
                style={styles.bottomNavButton}
              >
                <Ionicons
                  name={tab.icon}
                  size={22}
                  color={isActive ? colors.text : 'rgba(148,163,184,.65)'}
                />
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
                {badge ? (
                  <View style={[styles.bottomNavBadge, questBadgeShadow]}>
                    <Text style={styles.bottomNavBadgeText}>{badge}</Text>
                  </View>
                ) : null}
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
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  quickAction: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(148,163,184,.95)',
    textAlign: 'center',
    marginTop: 6,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInputField: {
    flex: 1,
    fontSize: 14,
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
  questCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
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
  questDescription: {
    fontSize: 12,
    marginTop: 4,
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
  footerText: {
    fontSize: 11,
    color: 'rgba(148,163,184,.95)',
    textAlign: 'center',
    marginBottom: 20,
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
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  sheetBody: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.4)',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  sheetSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  sheetOptionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  sheetOptionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  sheetOption: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sheetOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sheetButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  sheetButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sheetButtonText: {
    fontSize: 13,
    fontWeight: '600',
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
  bottomNavBadge: {
    position: 'absolute',
    top: 2,
    right: 22,
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  toggleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 6,
    marginBottom: 12,
    flexGrow: 1,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '600',
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
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 6,
    marginBottom: 12,
  },
  platformChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rewardInfo: {
    marginBottom: 20,
  },
  rewardText: {
    fontSize: 11,
    textAlign: 'center',
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
  rewardsSummaryChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rewardsSummaryChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  rewardsSummaryHint: {
    fontSize: 11,
    fontWeight: '500',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  shopActiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 12,
    flexGrow: 1,
    flexBasis: '48%',
    maxWidth: '48%',
    minWidth: 150,
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
