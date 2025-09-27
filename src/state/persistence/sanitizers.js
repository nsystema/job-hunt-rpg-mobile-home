import { FOCUS_BASELINE } from '../../features/progression';

export const parseFiniteNumber = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed.length) {
      return null;
    }
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
};

export const sanitizeArrayOfObjects = (input) => {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.reduce((acc, item) => {
    if (item && typeof item === 'object') {
      acc.push({ ...item });
    }
    return acc;
  }, []);
};

export const sanitizeRecordOfArrays = (input) => {
  if (!input || typeof input !== 'object') {
    return {};
  }
  const result = {};
  Object.entries(input).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      result[key] = value.reduce((entries, entry) => {
        if (entry && typeof entry === 'object') {
          entries.push({ ...entry });
        }
        return entries;
      }, []);
    }
  });
  return result;
};

export const sanitizeRecordOfObjects = (input) => {
  if (!input || typeof input !== 'object') {
    return {};
  }
  const result = {};
  Object.entries(input).forEach(([key, value]) => {
    if (value && typeof value === 'object') {
      result[key] = { ...value };
    }
  });
  return result;
};

export const sanitizePremiumProgress = (input) => {
  if (!input || typeof input !== 'object') {
    return {};
  }
  const result = {};
  Object.entries(input).forEach(([key, value]) => {
    const numeric = parseFiniteNumber(value);
    if (numeric != null) {
      result[key] = Math.max(0, numeric);
    }
  });
  return result;
};

export const sanitizeClaimedQuests = (input) => {
  if (!Array.isArray(input)) {
    return [];
  }
  const unique = new Set();
  input.forEach((value) => {
    if (value != null) {
      unique.add(String(value));
    }
  });
  return Array.from(unique);
};

export const sanitizeSprayDebuff = (input) => {
  if (!input || typeof input !== 'object') {
    return null;
  }
  const activatedAt = parseFiniteNumber(input.activatedAt);
  const expiresAt = parseFiniteNumber(input.expiresAt);
  if (activatedAt == null && expiresAt == null) {
    return null;
  }
  const result = {};
  if (activatedAt != null) {
    result.activatedAt = activatedAt;
  }
  if (expiresAt != null) {
    result.expiresAt = expiresAt;
  }
  return result;
};

export const createDefaultQuestMeta = () => ({
  lastDailyKey: '',
  lastWeeklyKey: '',
  lastAppVersion: '',
});

const createDefaultPersistedState = () => ({
  xp: 0,
  apps: 0,
  gold: 0,
  streak: 0,
  focus: FOCUS_BASELINE,
  activeEffects: [],
  sprayDebuff: null,
  applications: [],
  claimedQuests: [],
  manualLogs: {},
  eventStates: {},
  chests: [],
  premiumProgress: {},
  questMeta: createDefaultQuestMeta(),
});

export const sanitizeQuestMeta = (input) => {
  const defaults = createDefaultQuestMeta();
  if (!input || typeof input !== 'object') {
    return { ...defaults };
  }
  const result = { ...defaults };
  if (typeof input.lastDailyKey === 'string') {
    result.lastDailyKey = input.lastDailyKey;
  }
  if (typeof input.lastWeeklyKey === 'string') {
    result.lastWeeklyKey = input.lastWeeklyKey;
  }
  if (typeof input.lastAppVersion === 'string') {
    result.lastAppVersion = input.lastAppVersion;
  }
  return result;
};

export const sanitizePersistedData = (candidate) => {
  const defaults = createDefaultPersistedState();
  const safe = candidate && typeof candidate === 'object' ? candidate : {};

  const applications = sanitizeArrayOfObjects(safe.applications);
  const activeEffects = sanitizeArrayOfObjects(safe.activeEffects);
  const chests = sanitizeArrayOfObjects(safe.chests);
  const manualLogs = sanitizeRecordOfArrays(safe.manualLogs);
  const eventStates = sanitizeRecordOfObjects(safe.eventStates);
  const premiumProgress = sanitizePremiumProgress(safe.premiumProgress);
  const sprayDebuff = sanitizeSprayDebuff(safe.sprayDebuff);
  const questMeta = sanitizeQuestMeta(safe.questMeta);

  const xp = parseFiniteNumber(safe.xp);
  const appsCount = parseFiniteNumber(safe.apps);
  const gold = parseFiniteNumber(safe.gold);
  const streak = parseFiniteNumber(safe.streak);
  const focus = parseFiniteNumber(safe.focus);

  return {
    xp: xp != null ? Math.max(0, xp) : defaults.xp,
    apps: appsCount != null ? Math.max(0, appsCount) : applications.length,
    gold: gold != null ? Math.max(0, gold) : defaults.gold,
    streak: streak != null ? Math.max(0, streak) : defaults.streak,
    focus: focus != null ? Math.max(0, focus) : defaults.focus,
    activeEffects,
    sprayDebuff,
    applications,
    claimedQuests: sanitizeClaimedQuests(safe.claimedQuests),
    manualLogs,
    eventStates,
    chests,
    premiumProgress,
    questMeta,
  };
};

export const MIGRATIONS = {
  1: (state) => sanitizePersistedData(state),
};

export const migratePersistedState = (payload, storageVersion = 1) => {
  if (!payload || typeof payload !== 'object') {
    return { version: storageVersion, data: sanitizePersistedData() };
  }
  const startingVersion = Number.isInteger(payload.version) ? payload.version : 0;
  let currentVersion = startingVersion;
  let currentState = payload.data && typeof payload.data === 'object' ? payload.data : {};

  if (currentVersion > storageVersion) {
    currentVersion = storageVersion;
  }

  while (currentVersion < storageVersion) {
    const targetVersion = currentVersion + 1;
    const migrate = MIGRATIONS[targetVersion];
    if (typeof migrate === 'function') {
      currentState = migrate(currentState);
    }
    currentVersion = targetVersion;
  }

  const sanitized = sanitizePersistedData(currentState);
  return { version: storageVersion, data: sanitized };
};
