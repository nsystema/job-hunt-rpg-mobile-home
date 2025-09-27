import 'react-native-url-polyfill/auto';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
} from './src/features/progression';
import { STATUSES } from './src/features/applications';
import { QUESTS, composeQuestClaimKey, CLAIM_KEY_SEPARATOR } from './src/features/quests';
import { useQuestBoard } from './src/features/quests/hooks/useQuestBoard';
import { useQuestNotifications } from './src/features/quests/hooks/useQuestNotifications';
import QuestTabs from './src/features/quests/components/QuestTabs';
import QuestCard from './src/features/quests/components/QuestCard';
import appConfig from './app.json';
import { ensureOpaque, hexToRgba } from './src/utils/color';
import {
  formatEffectDuration,
  formatGold,
  formatGoldValue,
  formatTime,
} from './src/utils/formatters';
import { toTimestamp } from './src/utils/time';
import {
  createDefaultQuestMeta,
  migratePersistedState,
  sanitizePersistedData,
} from './src/state/persistence/sanitizers';
import ApplicationFormModal from './src/features/applications/components/ApplicationFormModal';
import ApplicationFilters from './src/features/applications/components/ApplicationFilters';
import ApplicationList from './src/features/applications/components/ApplicationList';
import { useApplicationFilters } from './hooks/useApplicationFilters';
import { useApplicationsManager } from './hooks/useApplicationsManager';
import { Panel } from './src/components/layout/Panel';
import { GoldPill } from './src/components/layout/GoldPill';
import { StatBadge } from './src/components/layout/StatBadge';
import { IconButton } from './src/components/layout/IconButton';
import { ProgressBar } from './src/components/layout/ProgressBar';
import { EffectTimerRing } from './src/components/feedback/EffectTimerRing';
import { ToastBanner } from './src/components/feedback/ToastBanner';
import {
  useRewardsInventory,
  RewardSummary,
  ChestGrid,
  createLevelUpChest,
} from './src/features/rewards';
import {
  ShopScreen,
  includeSprayEffect,
  createSprayEffectDetails,
  isSprayDebuffActive,
  shouldClearSprayDebuff,
  SPRAY_DEBUFF_DURATION_MS,
} from './src/features/shop';

const APP_VERSION = appConfig?.expo?.version ?? '1.0.0';

const DAILY_CLAIM_PREFIXES = ['D-'];
const WEEKLY_CLAIM_PREFIXES = ['W-', 'WC-'];

const extractClaimBaseId = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  const separatorIndex = value.indexOf(CLAIM_KEY_SEPARATOR);
  if (separatorIndex === -1) {
    return value;
  }
  return value.slice(0, separatorIndex);
};

const isDailyClaimKeyValue = (value) => {
  const baseId = extractClaimBaseId(value);
  return DAILY_CLAIM_PREFIXES.some((prefix) => baseId.startsWith(prefix));
};

const isWeeklyClaimKeyValue = (value) => {
  const baseId = extractClaimBaseId(value);
  return WEEKLY_CLAIM_PREFIXES.some((prefix) => baseId.startsWith(prefix));
};

const filterClaimedQuestSet = (sourceSet, predicate) => {
  const base = sourceSet instanceof Set ? sourceSet : new Set();
  const next = new Set();
  base.forEach((value) => {
    if (predicate(value)) {
      next.add(value);
    }
  });
  if (next.size === base.size) {
    let identical = true;
    for (const value of base) {
      if (!next.has(value)) {
        identical = false;
        break;
      }
    }
    if (identical) {
      return base;
    }
  }
  return next;
};

const QUEST_TABS = [
  { key: 'Daily', icon: 'calendar-check-outline' },
  { key: 'Weekly', icon: 'calendar-week-begin' },
  { key: 'Growth', icon: 'chart-line' },
  { key: 'Events', icon: 'party-popper' },
];

const BOTTOM_TABS = [
  { key: 'Home', label: 'Home', icon: 'home-variant' },
  { key: 'Apps', label: 'Apps', icon: 'briefcase-outline' },
  { key: 'Quests', label: 'Quests', icon: 'clipboard-check-outline' },
  { key: 'Rewards', label: 'Rewards', icon: 'treasure-chest' },
  { key: 'Shop', label: 'Shop', icon: 'shopping-outline' },
];

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

const STORAGE_KEY = 'jobless::state';
const STORAGE_VERSION = 1;

export default function App() {
  const [fontsLoaded, fontError] = useFonts(MaterialCommunityIcons.font);
  const { mode, eff, cycle } = useTheme();
  const { cycle: cyclePal, pal } = usePalette();
  const colors = useMemo(() => cur(eff, pal), [eff, pal]);
  const filledSurface = useMemo(
    () => (eff === 'light' ? ensureOpaque(colors.surface) : colors.surface),
    [eff, colors.surface],
  );

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
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [questTab, setQuestTab] = useState('Daily');
  const [claimedQuests, setClaimedQuests] = useState(() => new Set());
  const [questMeta, setQuestMeta] = useState(() => createDefaultQuestMeta());
  const [questMetaReady, setQuestMetaReady] = useState(false);
  const [manualLogs, setManualLogs] = useState(() => ({}));
  const [eventStates, setEventStates] = useState(() => ({}));
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [premiumProgress, setPremiumProgress] = useState({});
  const [isHydrated, setIsHydrated] = useState(false);
  const [hydrationError, setHydrationError] = useState(null);
  const [shopMainTab, setShopMainTab] = useState('catalogue');
  const [shopCategoryTab, setShopCategoryTab] = useState('effects');

  const goldMultiplier = useMemo(
    () => (activeEffects.some((effect) => effect.id === 2) ? 2 : 1),
    [activeEffects],
  );

  const {
    chests,
    setChests,
    chestFilter,
    setChestFilter,
    focusedChestId,
    setFocusedChestId,
    openChest,
    openAll,
    openAllSummary,
    dismissOpenAllSummary,
    openResult,
    dismissOpenResult,
    rarityKeys,
    rarityCounts,
    visibleChests,
    hasChests,
    viewRange,
  } = useRewardsInventory({ goldMultiplier, setGold });

  const handleSelectChestFilter = useCallback(
    (key) => {
      setChestFilter(key);
      setFocusedChestId(null);
    },
    [setChestFilter, setFocusedChestId],
  );

  useEffect(() => {
    if (activeTab !== 'Rewards') {
      setFocusedChestId(null);
      dismissOpenResult();
    }
  }, [activeTab, dismissOpenResult, setFocusedChestId]);

  const {
    appsQuery,
    setAppsQuery,
    filterStatuses,
    toggleFilterStatus,
    filterPlatforms,
    toggleFilterPlatform,
    clearFilters,
    sortKey,
    setSortKey,
    filteredApps,
  } = useApplicationFilters(applications);

  const lowQualityStreakRef = useRef(0);
  const effectWarningTimers = useRef(new Map());
  const announcedEffectKeysRef = useRef(new Set());
  const eventSeenRef = useRef(new Map());
  const eventsReactivatedRef = useRef(null);
  const previousLevelRef = useRef(null);
  const lastPersistedRef = useRef('');

  useEffect(() => {
    if (!fontError) {
      return;
    }
    const logger = globalThis?.console;
    if (logger && typeof logger.error === 'function') {
      logger.error('Failed to load MaterialCommunityIcons font', fontError);
    }
  }, [fontError]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      if (!AsyncStorage || typeof AsyncStorage.getItem !== 'function') {
        if (!cancelled) {
          setIsHydrated(true);
          setQuestMetaReady(true);
        }
        return;
      }

      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (!storedValue) {
          return;
        }

        let parsed;
        try {
          parsed = JSON.parse(storedValue);
        } catch (parseError) {
          throw parseError instanceof Error
            ? parseError
            : new Error('Failed to parse saved progress payload.');
        }

        const { data } = migratePersistedState(parsed, STORAGE_VERSION);
        if (!data || typeof data !== 'object' || cancelled) {
          return;
        }

        const xpValue = Number.isFinite(data.xp) ? data.xp : 0;
        const hydratedLevel = lvl(xpValue);
        if (hydratedLevel && Number.isFinite(hydratedLevel.l)) {
          previousLevelRef.current = hydratedLevel.l;
        } else {
          const baselineLevel = lvl(0);
          previousLevelRef.current = Number.isFinite(baselineLevel?.l)
            ? baselineLevel.l
            : null;
        }

        setXp(xpValue);
        setApps(data.apps);
        setGold(data.gold);
        setStreak(data.streak);
        setFocus(data.focus);
        setActiveEffects(data.activeEffects);
        setSprayDebuff(data.sprayDebuff);
        setApplications(data.applications);
        setManualLogs(data.manualLogs);
        setEventStates(data.eventStates);
        setChests(data.chests);
        setPremiumProgress(data.premiumProgress);
        setQuestMeta(data.questMeta);
        const claimEntries = Array.isArray(data.claimedQuests) ? data.claimedQuests : [];
        setClaimedQuests(new Set(claimEntries));
        previousEventStatesRef.current =
          data.eventStates && typeof data.eventStates === 'object' ? data.eventStates : {};
        setHydrationError(null);
      } catch (error) {
        if (!cancelled) {
          const logger = globalThis?.console;
          if (logger && typeof logger.error === 'function') {
            logger.error('Failed to hydrate saved progress', error);
          }
          setHydrationError(
            error instanceof Error ? error : new Error('Failed to load saved progress.'),
          );
        }
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
          setQuestMetaReady(true);
        }
      }
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  const persistedStateData = useMemo(
    () =>
      sanitizePersistedData({
        xp,
        apps,
        gold,
        streak,
        focus,
        activeEffects,
        sprayDebuff,
        applications,
        claimedQuests: claimedQuests instanceof Set ? Array.from(claimedQuests) : [],
        manualLogs,
        eventStates,
        chests,
        premiumProgress,
        questMeta,
      }),
    [
      xp,
      apps,
      gold,
      streak,
      focus,
      activeEffects,
      sprayDebuff,
      applications,
      claimedQuests,
      manualLogs,
      eventStates,
      chests,
      premiumProgress,
      questMeta,
    ],
  );

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    if (!AsyncStorage || typeof AsyncStorage.setItem !== 'function') {
      return;
    }

    const basePayload = { version: STORAGE_VERSION, data: persistedStateData };
    const serialized = JSON.stringify(basePayload);
    if (lastPersistedRef.current === serialized) {
      return;
    }
    lastPersistedRef.current = serialized;

    const persist = async () => {
      try {
        const payload = { ...basePayload, updatedAt: new Date().toISOString() };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (error) {
        const logger = globalThis?.console;
        if (logger && typeof logger.error === 'function') {
          logger.error('Failed to persist progress state', error);
        }
      }
    };

    persist();
  }, [persistedStateData, isHydrated]);

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

  const sprayActive = useMemo(
    () => isSprayDebuffActive(sprayDebuff, currentTime),
    [sprayDebuff, currentTime],
  );

  useEffect(() => {
    if (shouldClearSprayDebuff(sprayDebuff, currentTime)) {
      setSprayDebuff(null);
    }
  }, [sprayDebuff, currentTime, setSprayDebuff]);

  const sprayMultiplier = sprayActive ? 0.5 : 1;

  const sprayEffectDetails = useMemo(() => {
    if (!sprayActive) {
      return null;
    }
    return createSprayEffectDetails(sprayDebuff);
  }, [sprayActive, sprayDebuff]);

  const shopEffects = useMemo(
    () => includeSprayEffect(activeEffects, sprayEffectDetails),
    [activeEffects, sprayEffectDetails],
  );

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

    const perDayAverageRaw = trackedDays > 0 ? totalCount / trackedDays : 0;
    const perDayAverage = formatAverage(totalCount, trackedDays);
    const replyRate = totalCount > 0 ? Math.round((respondedCount / totalCount) * 100) : 0;
    const interviewRate = totalCount > 0 ? Math.round((interviewCount / totalCount) * 100) : 0;

    const statsSnapshot = [
      {
        key: 'today',
        label: 'Logged Today',
        value: String(todayCount),
        rawValue: todayCount,
        type: 'count',
      },
      {
        key: 'perDayAverage',
        label: 'Per day',
        value: perDayAverage,
        rawValue: perDayAverageRaw,
        type: 'count',
      },
      {
        key: 'pipeline',
        label: 'Active apps',
        value: String(pipelineCount),
        rawValue: pipelineCount,
        type: 'count',
      },
      {
        key: 'responseRate',
        label: 'Reply rate',
        value: `${replyRate}%`,
        rawValue: replyRate,
        type: 'percentage',
      },
      {
        key: 'interviews',
        label: 'Interviews',
        value: String(interviewCount),
        rawValue: interviewCount,
        type: 'count',
      },
      {
        key: 'interviewRate',
        label: 'Interview rate',
        value: `${interviewRate}%`,
        rawValue: interviewRate,
        type: 'percentage',
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
  const statLabelColor = hexToRgba(colors.text, eff === 'light' ? 0.62 : 0.72);
  const statPanelBorderColor = colors.surfaceBorder;
  const statBorderColor = hexToRgba(colors.sky, eff === 'light' ? 0.4 : 0.6);
  const statHeaderIconBackground = 'transparent';
  const statHeaderIconBorder = hexToRgba(colors.sky, eff === 'light' ? 0.35 : 0.45);
  const statValueColor = eff === 'light' ? '#0f172a' : colors.text;
  const statMutedColor = hexToRgba(colors.text, eff === 'light' ? 0.68 : 0.8);
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

  const statVisuals = useMemo(() => {
    const isLight = eff === 'light';
    const accent = colors.sky;
    const secondary = colors.emerald;

    const makeVisual = (icon) => {
      return {
        icon,
        gradient: ['transparent', 'transparent'],
        borderColor: 'transparent',
        iconBackground: hexToRgba(accent, isLight ? 0.2 : 0.32),
        iconBorder: hexToRgba(accent, isLight ? 0.32 : 0.48),
        iconColor: isLight ? '#0f172a' : colors.text,
      };
    };

    const fallback = makeVisual('chart-box-outline');

    return {
      today: makeVisual('calendar-star'),
      perDayAverage: makeVisual('clock-outline'),
      pipeline: makeVisual('chart-timeline-variant'),
      responseRate: makeVisual('email-check-outline'),
      interviews: makeVisual('account-voice'),
      interviewRate: makeVisual('chart-line'),
      default: fallback,
    };
  }, [colors, eff]);

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

  const { addApplication, deleteApplication, submitEdit, exportApplications } = useApplicationsManager({
    focus,
    setFocus,
    setGold,
    setApps,
    setApplications,
    activeEffects,
    sprayMultiplier,
    sprayActive,
    gainXp,
    setSprayDebuff,
    lowQualityStreakRef,
    sprayDebuffDurationMs: SPRAY_DEBUFF_DURATION_MS,
    handleManualLog,
    updateCurrentTime,
    editingApp,
    setEditingApp,
    persistedStateData,
    storageVersion: STORAGE_VERSION,
  });

  const { questMetrics, questsByTab, unclaimedByTab } = useQuestBoard({
    applications,
    manualLogs,
    currentTime,
    claimedQuests,
    setClaimedQuests,
    eventStates,
    setEventStates,
    eventsReactivatedRef,
  });

  useEffect(() => {
    if (!questMetaReady) {
      return;
    }
    const todayKey = questMetrics?.todayKey || '';
    const weekKey = questMetrics?.currentWeekKey || '';
    const versionChanged =
      questMeta.lastAppVersion && questMeta.lastAppVersion !== APP_VERSION;

    const shouldResetDaily =
      versionChanged || (todayKey && todayKey !== questMeta.lastDailyKey);

    const shouldResetWeekly =
      weekKey && questMeta.lastWeeklyKey && questMeta.lastWeeklyKey !== weekKey;

    if (!shouldResetDaily && !shouldResetWeekly) {
      setQuestMeta((prev) => {
        const nextDaily = todayKey || '';
        const nextWeekly = weekKey || '';
        const nextVersion = APP_VERSION;
        if (
          prev.lastDailyKey === nextDaily &&
          prev.lastWeeklyKey === nextWeekly &&
          prev.lastAppVersion === nextVersion
        ) {
          return prev;
        }
        return {
          lastDailyKey: nextDaily,
          lastWeeklyKey: nextWeekly,
          lastAppVersion: nextVersion,
        };
      });
      return;
    }

    if (shouldResetDaily) {
      setFocus((current) => (current < FOCUS_BASELINE ? FOCUS_BASELINE : current));
    }

    setClaimedQuests((prev) => {
      let working = prev instanceof Set ? prev : new Set();
      if (shouldResetDaily) {
        working = filterClaimedQuestSet(working, (value) => !isDailyClaimKeyValue(value));
      }
      if (shouldResetWeekly) {
        working = filterClaimedQuestSet(working, (value) => !isWeeklyClaimKeyValue(value));
      }
      return working;
    });

    setQuestMeta({
      lastDailyKey: todayKey || '',
      lastWeeklyKey: weekKey || '',
      lastAppVersion: APP_VERSION,
    });
  }, [
    questMetaReady,
    questMetrics?.todayKey,
    questMetrics?.currentWeekKey,
    questMeta.lastDailyKey,
    questMeta.lastWeeklyKey,
    questMeta.lastAppVersion,
  ]);

  const { eventTabBadgeCount, handleQuestAction, getStageProgressSummary } = useQuestNotifications({
    eventStates,
    questsByTab,
    questTab,
    unclaimedByTab,
    onManualLog: handleManualLog,
    eventSeenRef,
    eventsReactivatedRef,
  });

  const additionalEventNotifications = useMemo(
    () => Math.max(0, eventTabBadgeCount - (unclaimedByTab.Events || 0)),
    [eventTabBadgeCount, unclaimedByTab],
  );

  const questTabBadges = useMemo(
    () => ({
      Daily: unclaimedByTab.Daily || 0,
      Weekly: unclaimedByTab.Weekly || 0,
      Growth: unclaimedByTab.Growth || 0,
      Events: eventTabBadgeCount,
    }),
    [unclaimedByTab, eventTabBadgeCount],
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
      effectWarningTimers.current.forEach((timeout) => clearTimeout(timeout));
      effectWarningTimers.current.clear();
    };
  }, []);

  useEffect(() => {
    if (focusedChestId != null && !chests.some((item) => item.id === focusedChestId)) {
      setFocusedChestId(null);
    }
  }, [chests, focusedChestId]);

  const renderBlockingScreen = (message, errorMessage) => {
    const errorColor = hexToRgba(colors.text, eff === 'light' ? 0.6 : 0.7);
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <StatusBar
          barStyle={eff === 'light' ? 'dark-content' : 'light-content'}
          backgroundColor={colors.bg}
        />
        <View style={styles.hydrationContainer}>
          <ActivityIndicator size="large" color={colors.sky} />
          <Text style={[styles.hydrationMessage, { color: colors.text }]}>{message}</Text>
          {errorMessage ? (
            <Text style={[styles.hydrationError, { color: errorColor }]}>{errorMessage}</Text>
          ) : null}
        </View>
      </SafeAreaView>
    );
  };

  if (fontError) {
    const errorMessage =
      fontError instanceof Error
        ? fontError.message || 'Failed to load icon font.'
        : 'Failed to load icon font.';
    return renderBlockingScreen('Unable to load icon assets.', errorMessage);
  }

  if (!fontsLoaded) {
    return renderBlockingScreen('Preparing icon assets...', null);
  }

  if (!isHydrated) {
    const hydrationMessage = hydrationError
      ? hydrationError.message || 'Unable to load saved progress.'
      : null;
    return renderBlockingScreen('Loading your progress...', hydrationMessage);
  }

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
            {statsSnapshot.map((stat) => {
              const visual = statVisuals[stat.key] || statVisuals.default;

              return (
                <View
                  key={stat.key}
                  style={[
                    styles.statItem,
                    eff === 'light' ? styles.statItemShadowLight : styles.statItemShadowDark,
                  ]}
                >
                  <LinearGradient
                    colors={visual.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.statCard, { borderColor: visual.borderColor }]}
                  >
                    <View style={styles.statCardHeader}>
                      <View
                        style={[
                          styles.statCardIcon,
                          { backgroundColor: visual.iconBackground, borderColor: visual.iconBorder },
                        ]}
                      >
                        <MaterialCommunityIcons name={visual.icon} size={16} color={visual.iconColor} />
                      </View>
                      <View style={styles.statCardTextGroup}>
                        <Text style={[styles.statHeaderValue, { color: statValueColor }]}>{stat.value}</Text>
                        <Text style={[styles.statLabel, { color: statMutedColor }]}>{stat.label}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              );
            })}
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
          <ApplicationFilters
            colors={colors}
            appsQuery={appsQuery}
            onChangeQuery={setAppsQuery}
            onOpenFilter={() => setFilterModalVisible(true)}
            onOpenSort={() => setSortModalVisible(true)}
            onExport={exportApplications}
            filterModalVisible={filterModalVisible}
            onCloseFilter={() => setFilterModalVisible(false)}
            filterStatuses={filterStatuses}
            toggleFilterStatus={toggleFilterStatus}
            filterPlatforms={filterPlatforms}
            toggleFilterPlatform={toggleFilterPlatform}
            clearFilters={clearFilters}
            sortModalVisible={sortModalVisible}
            onCloseSort={() => setSortModalVisible(false)}
            sortKey={sortKey}
            onSelectSortKey={setSortKey}
          />
          <ApplicationList
            applications={filteredApps}
            colors={colors}
            statusIcons={statusIcons}
            statusLookup={statusLookup}
            onEdit={setEditingApp}
            onDelete={deleteApplication}
            onEmptyAction={handleLogPress}
          />
        </ScrollView>
      )}

      {activeTab === 'Quests' && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <QuestTabs
            tabs={QUEST_TABS}
            activeTab={questTab}
            onSelect={setQuestTab}
            colors={colors}
            badgeShadow={questBadgeShadow}
            badgeCounts={questTabBadges}
          />

          <View style={styles.questList}>
            {quests.map((quest, index) => {
              if (quest.type === 'section') {
                return (
                  <View
                    key={quest.id}
                    style={[
                      styles.questSectionHeading,
                      {
                        marginTop: index === 0 ? 0 : 24,
                        marginBottom: index === quests.length - 1 ? 0 : 12,
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

              return (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  colors={colors}
                  currentTime={currentTime}
                  makeRewardEntries={makeRewardEntries}
                  getStageProgressSummary={getStageProgressSummary}
                  onClaim={handleClaimQuest}
                  onAction={handleQuestAction}
                  onLogStage={handleManualLog}
                  filledSurface={filledSurface}
                  questCardShadow={questCardShadow}
                  isLast={index === quests.length - 1}
                />
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
            <View style={styles.rewardsSection}>
              <View style={styles.rewardsSummaryWrapper}>
                <RewardSummary
                  colors={colors}
                  eff={eff}
                  hasChests={hasChests}
                  viewRange={viewRange}
                  onOpenAll={openAll}
                  openAllSummary={openAllSummary}
                  onCloseSummary={dismissOpenAllSummary}
                />
              </View>
              <ChestGrid
                rarityKeys={rarityKeys}
                rarityCounts={rarityCounts}
                chestFilter={chestFilter}
                onSelectFilter={handleSelectChestFilter}
                colors={colors}
                eff={eff}
                visibleChests={visibleChests}
                focusedChestId={focusedChestId}
                onFocus={setFocusedChestId}
                onOpen={openChest}
              />
            </View>
          </ScrollView>

          {openResult ? (
            <ToastBanner
              colors={colors}
              eff={eff}
              title="Fresh loot"
              icon="diamond-stone"
              value={`${openResult.gold}g`}
            />
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

      <ApplicationFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={addApplication}
        colors={colors}
        effects={activeEffects}
        spray={sprayMultiplier}
        statusOptions={LOG_STATUS_OPTIONS}
        statusMeta={STATUS_META}
      />
      <ApplicationFormModal
        visible={!!editingApp}
        onClose={() => setEditingApp(null)}
        onSubmit={submitEdit}
        colors={colors}
        effects={activeEffects}
        spray={sprayMultiplier}
        defaults={editingApp || undefined}
        title="Edit application"
        submitLabel="Save"
        statusOptions={STATUSES}
        statusMeta={STATUS_META}
      />


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
  },
  hydrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  hydrationMessage: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  hydrationError: {
    marginTop: 12,
    fontSize: 12,
    textAlign: 'center',
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 140,
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
  statPanel: {
    paddingBottom: 12,
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
    marginBottom: 16,
  },
  statItemShadowLight: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  statItemShadowDark: {
    shadowColor: '#000',
    shadowOpacity: 0.42,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  statCard: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    backgroundColor: 'transparent',
    width: '100%',
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
  },
  statCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statCardTextGroup: {
    height: 32,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statHeaderValue: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'left',
    lineHeight: 18,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'left',
    textTransform: 'uppercase',
    lineHeight: 14,
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
appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
appCompany: {
    fontSize: 15,
    fontWeight: '700',
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
appsCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
appExtras: {
    flexDirection: 'row',
    marginTop: 12,
  },
appFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
appChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
appChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
appEmptyText: {
    fontSize: 12,
    opacity: 0.75,
    textAlign: 'center',
  },
appEmptyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
sheetBody: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
sheetContentContainer: {
    gap: 20,
    paddingBottom: 8,
  },
sheetOptionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
sheetOptionList: {
    gap: 12,
  },
sheetOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
sheetSecondaryButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
sheetPrimaryButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
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
modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
modalTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
inlineFieldRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
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
statusOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
statusOptionTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
platformOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
platformChipInner: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
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
  rewardsSection: {
    paddingBottom: 24,
  },
  rewardsSummaryWrapper: {
    marginBottom: 18,
  },
});
