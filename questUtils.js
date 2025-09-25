export const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const toDate = (value) => {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  const parsed = typeof value === 'number' ? new Date(value) : new Date(value || Date.now());
  return Number.isNaN(parsed.getTime()) ? new Date(NaN) : parsed;
};

export const getDayKey = (value) => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getWeekKey = (value) => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const clone = new Date(date.getTime());
  clone.setHours(0, 0, 0, 0);
  const day = clone.getDay() === 0 ? 7 : clone.getDay();
  clone.setDate(clone.getDate() - day + 1);
  return getDayKey(clone);
};

const safeNumber = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

const WEEKLY_STATIC_CORE_IDS = ['W-APPS80', 'W-FULL35', 'W-PLATFORMS', 'W-STREAK', 'W-CVS', 'W-LETTERS', 'W-SKILL'];
const WEEKLY_CYCLABLE_POOL_IDS = [
  'WC-RECRUITERS',
  'WC-AGENCIES',
  'WC-NETWORK',
  'WC-CITIES',
  'WC-REFERRALS',
  'WC-PORTFOLIO',
];
const WEEKLY_CYCLABLE_ACTIVE_COUNT = 3;

const getCountValue = (value) => {
  if (value instanceof Set) {
    return value.size;
  }
  return safeNumber(value);
};

const WEEKLY_REQUIREMENTS = {
  'W-APPS80': (metrics) => safeNumber(metrics?.applications) >= 80,
  'W-FULL35': (metrics) => safeNumber(metrics?.fullApplications) >= 35,
  'W-PLATFORMS': (metrics) => getCountValue(metrics?.platforms) >= 6,
  'W-STREAK': (metrics) => safeNumber(metrics?.dailyPerfectDays) >= 4,
  'W-CVS': (metrics) => safeNumber(metrics?.tailoredCVs) >= 25,
  'W-LETTERS': (metrics) => safeNumber(metrics?.letters) >= 25,
  'W-SKILL': (metrics) => safeNumber(metrics?.skillLearning) >= 1,
  'WC-RECRUITERS': (metrics) => safeNumber(metrics?.recruiterOutreach) >= 10,
  'WC-AGENCIES': (metrics) => safeNumber(metrics?.agencyContacts) >= 3,
  'WC-NETWORK': (metrics) => safeNumber(metrics?.networkPings) >= 3,
  'WC-CITIES': (metrics) => getCountValue(metrics?.cities) >= 4,
  'WC-REFERRALS': (metrics) => safeNumber(metrics?.referralApplications) >= 2,
  'WC-PORTFOLIO': (metrics) => safeNumber(metrics?.portfolioUpdate) >= 1,
};

export const CLAIM_KEY_SEPARATOR = '::';

export const composeQuestClaimKey = (id, triggeredAt) => {
  if (!id) {
    return '';
  }
  if (!Number.isFinite(triggeredAt)) {
    return id;
  }
  return `${id}${CLAIM_KEY_SEPARATOR}${triggeredAt}`;
};

const createSeededRandom = (seedValue) => {
  const normalized = typeof seedValue === 'string' ? seedValue : String(seedValue ?? '');
  let seed = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    seed = (seed * 31 + normalized.charCodeAt(index)) % 2147483647;
  }
  if (seed <= 0) {
    seed += 2147483646;
  }
  return () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
};

const selectDeterministicSubset = (items, count, seedValue) => {
  const source = Array.isArray(items) ? items.filter((item) => item != null) : [];
  if (!source.length || count <= 0) {
    return [];
  }
  const rng = createSeededRandom(seedValue);
  const pool = [...new Set(source)];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const temp = pool[i];
    pool[i] = pool[j];
    pool[j] = temp;
  }
  return pool.slice(0, Math.min(count, pool.length));
};

const getActiveWeeklyCyclableIds = (weekKey, availableIds = WEEKLY_CYCLABLE_POOL_IDS) => {
  const key = weekKey || 'weekly-default';
  return selectDeterministicSubset(availableIds, WEEKLY_CYCLABLE_ACTIVE_COUNT, `${key}|${availableIds.join('|')}`);
};

const getWeeklyCoreInfo = (weekKey, availableCyclableIds) => {
  const activeCyclableIds = getActiveWeeklyCyclableIds(weekKey, availableCyclableIds);
  const coreIds = [...WEEKLY_STATIC_CORE_IDS, ...activeCyclableIds];
  return {
    coreIds,
    coreSet: new Set(coreIds),
    cyclableIds: activeCyclableIds,
    cyclableSet: new Set(activeCyclableIds),
  };
};

const createEmptyDailyMetrics = () => ({
  applications: 0,
  fullApplications: 0,
  combos: 0,
  tailoredCVs: 0,
  letters: 0,
  referralApplications: 0,
  rejections: 0,
  ghosted: 0,
  interviews: 0,
  favorites: 0,
  platforms: new Set(),
  cities: new Set(),
});

const createWeekAccumulator = () => ({
  applications: 0,
  fullApplications: 0,
  combos: 0,
  tailoredCVs: 0,
  letters: 0,
  referralApplications: 0,
  platforms: new Set(),
  cities: new Set(),
  coldApproaches: 0,
  skillLearning: 0,
  recruiterOutreach: 0,
  agencyContacts: 0,
  networkPings: 0,
  portfolioUpdate: 0,
  dailyPerfectDays: 0,
});

const finalizeDaily = (metrics, manualCounts) => ({
  applications: metrics.applications,
  fullApplications: metrics.fullApplications,
  combos: metrics.combos,
  tailoredCVs: metrics.tailoredCVs,
  letters: metrics.letters,
  referralApplications: metrics.referralApplications,
  platforms: metrics.platforms.size,
  cities: metrics.cities.size,
  coldApproaches: safeNumber(manualCounts.coldOutreach),
  skillLearning: safeNumber(manualCounts.skillLearning),
  recruiterOutreach: safeNumber(manualCounts.recruiterOutreach),
  agencyContacts: safeNumber(manualCounts.agencyContacts),
  networkPings: safeNumber(manualCounts.networkPing),
  portfolioUpdate: safeNumber(manualCounts.portfolioUpdate),
});

const finalizeWeekly = (metrics, manualCounts) => ({
  applications: metrics.applications,
  fullApplications: metrics.fullApplications,
  combos: metrics.combos,
  tailoredCVs: metrics.tailoredCVs,
  letters: metrics.letters,
  referralApplications: metrics.referralApplications,
  platforms: metrics.platforms.size,
  cities: metrics.cities.size,
  coldApproaches: metrics.coldApproaches + safeNumber(manualCounts.coldOutreach),
  skillLearning: metrics.skillLearning + safeNumber(manualCounts.skillLearning),
  recruiterOutreach: metrics.recruiterOutreach + safeNumber(manualCounts.recruiterOutreach),
  agencyContacts: metrics.agencyContacts + safeNumber(manualCounts.agencyContacts),
  networkPings: metrics.networkPings + safeNumber(manualCounts.networkPing),
  portfolioUpdate: metrics.portfolioUpdate + safeNumber(manualCounts.portfolioUpdate),
  dailyPerfectDays: metrics.dailyPerfectDays,
});

const finalizeLifetime = (metrics, manualTotals) => ({
  applications: metrics.applications,
  fullApplications: metrics.fullApplications,
  combos: metrics.combos,
  tailoredCVs: metrics.tailoredCVs,
  letters: metrics.letters,
  referralApplications: metrics.referralApplications,
  rejections: metrics.rejections,
  ghosted: metrics.ghosted,
  interviews: metrics.interviews,
  favorites: metrics.favorites,
  platforms: metrics.platforms.size,
  cities: metrics.cities.size,
  coldApproaches: safeNumber(manualTotals.coldOutreach),
  recruiterOutreach: safeNumber(manualTotals.recruiterOutreach),
  agencyContacts: safeNumber(manualTotals.agencyContacts),
  networkPings: safeNumber(manualTotals.networkPing),
  portfolioUpdate: safeNumber(manualTotals.portfolioUpdate),
  skillsLearned: safeNumber(manualTotals.skillLearning),
});

const ensureObject = (value) => (value && typeof value === 'object' ? value : {});

const addManualCount = (target, key, amount = 1) => {
  if (!key) {
    return;
  }
  target[key] = (target[key] || 0) + amount;
};

const toTimestamp = (value) => {
  const date = toDate(value);
  const time = date.getTime();
  return Number.isNaN(time) ? NaN : time;
};
export const computeQuestMetrics = ({ applications = [], manualLogs = {}, now = Date.now() }) => {
  const nowDate = toDate(now);
  const todayKey = getDayKey(nowDate);
  const currentWeekKey = getWeekKey(nowDate);
  const todayStart = new Date(nowDate.getTime());
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = todayStart.getTime() + DAY_MS - 1;
  const weekStartMs = todayStart.getTime() - 6 * DAY_MS;

  const perDay = new Map();
  const perDayManual = new Map();
  const perWeekManual = new Map();
  const perWeek = new Map();
  const manualTotals = {};
  const manualDaily = {};
  const manualWeekly = {};

  const lifetime = {
    applications: 0,
    fullApplications: 0,
    combos: 0,
    tailoredCVs: 0,
    letters: 0,
    referralApplications: 0,
    rejections: 0,
    ghosted: 0,
    interviews: 0,
    favorites: 0,
    platforms: new Set(),
    cities: new Set(),
  };

  applications.forEach((app) => {
    const date = toDate(app?.date || now);
    if (Number.isNaN(date.getTime())) {
      return;
    }
    const dayKey = getDayKey(date);
    if (!dayKey) {
      return;
    }
    let dayMetrics = perDay.get(dayKey);
    if (!dayMetrics) {
      dayMetrics = createEmptyDailyMetrics();
      perDay.set(dayKey, dayMetrics);
    }
    dayMetrics.applications += 1;
    lifetime.applications += 1;

    const isFull = app?.type === 'Full';
    const hasCombo = Boolean(isFull && app?.cvTailored && app?.motivation);
    if (isFull) {
      dayMetrics.fullApplications += 1;
      lifetime.fullApplications += 1;
    }
    if (hasCombo) {
      dayMetrics.combos += 1;
      lifetime.combos += 1;
    }
    if (app?.cvTailored) {
      dayMetrics.tailoredCVs += 1;
      lifetime.tailoredCVs += 1;
    }
    if (app?.motivation) {
      dayMetrics.letters += 1;
      lifetime.letters += 1;
    }
    if (app?.status === 'Applied with referral') {
      dayMetrics.referralApplications += 1;
      lifetime.referralApplications += 1;
    }
    if (app?.status === 'Rejected') {
      dayMetrics.rejections += 1;
      lifetime.rejections += 1;
    }
    if (app?.status === 'Ghosted') {
      dayMetrics.ghosted += 1;
      lifetime.ghosted += 1;
    }
    if (app?.status === 'Interview') {
      dayMetrics.interviews += 1;
      lifetime.interviews += 1;
    }
    if (app?.favorite) {
      dayMetrics.favorites += 1;
      lifetime.favorites += 1;
    }
    if (app?.platform) {
      dayMetrics.platforms.add(app.platform);
      lifetime.platforms.add(app.platform);
    }
    if (app?.city) {
      dayMetrics.cities.add(app.city);
      lifetime.cities.add(app.city);
    }
  });

  Object.entries(ensureObject(manualLogs)).forEach(([key, entries]) => {
    const list = Array.isArray(entries) ? entries : [];
    manualTotals[key] = list.length;
    list.forEach((entry) => {
      const stamp = entry?.timestamp ?? entry?.createdAt ?? entry?.date ?? entry;
      const date = toDate(stamp);
      if (Number.isNaN(date.getTime())) {
        return;
      }
      const dayKey = getDayKey(date);
      if (!dayKey) {
        return;
      }
      if (!perDayManual.has(dayKey)) {
        perDayManual.set(dayKey, {});
      }
      const dayManual = perDayManual.get(dayKey);
      addManualCount(dayManual, key, 1);

      if (dayKey === todayKey) {
        addManualCount(manualDaily, key, 1);
      }
      if (date.getTime() >= weekStartMs && date.getTime() <= todayEnd) {
        addManualCount(manualWeekly, key, 1);
      }

      const weekKey = getWeekKey(date);
      if (!perWeekManual.has(weekKey)) {
        perWeekManual.set(weekKey, {});
      }
      const weekManual = perWeekManual.get(weekKey);
      addManualCount(weekManual, key, 1);
    });
  });

  const dailyCompletionMap = new Map();

  perDay.forEach((metrics, dayKey) => {
    const weekKey = getWeekKey(dayKey);
    if (!perWeek.has(weekKey)) {
      perWeek.set(weekKey, createWeekAccumulator());
    }
    const weekData = perWeek.get(weekKey);
    weekData.applications += metrics.applications;
    weekData.fullApplications += metrics.fullApplications;
    weekData.combos += metrics.combos;
    weekData.tailoredCVs += metrics.tailoredCVs;
    weekData.letters += metrics.letters;
    weekData.referralApplications += metrics.referralApplications;
    metrics.platforms.forEach((value) => weekData.platforms.add(value));
    metrics.cities.forEach((value) => weekData.cities.add(value));

    const dayManual = perDayManual.get(dayKey) || {};
    weekData.coldApproaches += safeNumber(dayManual.coldOutreach);
    weekData.skillLearning += safeNumber(dayManual.skillLearning);
    weekData.recruiterOutreach += safeNumber(dayManual.recruiterOutreach);
    weekData.agencyContacts += safeNumber(dayManual.agencyContacts);
    weekData.networkPings += safeNumber(dayManual.networkPing);
    weekData.portfolioUpdate += safeNumber(dayManual.portfolioUpdate);

    const dayComplete =
      metrics.applications >= 20 &&
      metrics.fullApplications >= 5 &&
      metrics.platforms.size >= 3 &&
      metrics.tailoredCVs >= 5 &&
      metrics.letters >= 5 &&
      safeNumber(dayManual.coldOutreach) >= 2;
    if (dayComplete) {
      weekData.dailyPerfectDays += 1;
    }
    dailyCompletionMap.set(dayKey, dayComplete);
  });

  const weeklyCompletionMap = new Map();

  perWeek.forEach((metrics, weekKey) => {
    const weekManual = perWeekManual.get(weekKey) || {};
    metrics.coldApproaches += safeNumber(weekManual.coldOutreach);
    metrics.skillLearning += safeNumber(weekManual.skillLearning);
    metrics.recruiterOutreach += safeNumber(weekManual.recruiterOutreach);
    metrics.agencyContacts += safeNumber(weekManual.agencyContacts);
    metrics.networkPings += safeNumber(weekManual.networkPing);
    metrics.portfolioUpdate += safeNumber(weekManual.portfolioUpdate);

    const { coreIds } = getWeeklyCoreInfo(weekKey);
    const weekComplete = coreIds.every((questId) => {
      const requirement = WEEKLY_REQUIREMENTS[questId];
      return requirement ? requirement(metrics) : true;
    });
    weeklyCompletionMap.set(weekKey, weekComplete);
  });

  const todayMetrics = perDay.get(todayKey) || createEmptyDailyMetrics();
  const daily = finalizeDaily(todayMetrics, manualDaily);

  const currentWeekData = perWeek.get(currentWeekKey) || createWeekAccumulator();
  const weekly = finalizeWeekly(currentWeekData, manualWeekly);
  weekly.weeklyPerfectComplete = Boolean(weeklyCompletionMap.get(currentWeekKey));

  const dailyPerfectTotal = Array.from(dailyCompletionMap.values()).filter(Boolean).length;
  const weeklyPerfectTotal = Array.from(weeklyCompletionMap.values()).filter(Boolean).length;

  const lifetimeFinal = finalizeLifetime(lifetime, manualTotals);

  return {
    now,
    todayKey,
    currentWeekKey,
    daily,
    weekly,
    lifetime: lifetimeFinal,
    manual: {
      totals: manualTotals,
      daily: manualDaily,
      weekly: manualWeekly,
    },
    completion: {
      daily: dailyCompletionMap,
      weekly: weeklyCompletionMap,
    },
    totals: {
      dailyPerfect: dailyPerfectTotal,
      weeklyPerfect: weeklyPerfectTotal,
    },
  };
};

const compareEventStates = (a, b) => {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return (
    a.id === b.id &&
    a.active === b.active &&
    (a.triggeredAt ?? null) === (b.triggeredAt ?? null) &&
    (a.expiresAt ?? null) === (b.expiresAt ?? null) &&
    (a.cooldownUntil ?? null) === (b.cooldownUntil ?? null) &&
    (a.lastTriggerAt ?? null) === (b.lastTriggerAt ?? null) &&
    (a.completedAt ?? null) === (b.completedAt ?? null)
  );
};

const getManualEntries = (manualLogs, key) => {
  const entries = ensureObject(manualLogs)[key];
  return Array.isArray(entries) ? entries : [];
};

const evaluateStatusTrigger = (manualLogs, status, threshold, minTime) => {
  const entries = getManualEntries(manualLogs, 'statusChange');
  if (!entries.length || !status || !threshold) {
    return null;
  }
  const sorted = entries
    .map((entry) => ({
      time: toTimestamp(entry?.timestamp ?? entry?.date ?? entry?.createdAt),
      status: entry?.status,
    }))
    .filter((entry) => Number.isFinite(entry.time) && entry.status === status)
    .sort((a, b) => a.time - b.time);

  let currentDay = '';
  let count = 0;

  for (let index = 0; index < sorted.length; index += 1) {
    const item = sorted[index];
    const dayKey = getDayKey(item.time);
    if (!dayKey) {
      continue;
    }
    if (dayKey !== currentDay) {
      currentDay = dayKey;
      count = 0;
    }
    if (item.time < minTime) {
      continue;
    }
    count += 1;
    if (count >= threshold) {
      return item.time;
    }
  }
  return null;
};

const evaluateManualTrigger = (entries, threshold, minTime) => {
  if (!Array.isArray(entries) || !entries.length || threshold <= 0) {
    return null;
  }
  const sorted = entries
    .map((entry) => toTimestamp(entry?.timestamp ?? entry?.date ?? entry?.createdAt))
    .filter((time) => Number.isFinite(time))
    .sort((a, b) => a - b);

  let count = 0;
  for (let index = 0; index < sorted.length; index += 1) {
    const time = sorted[index];
    if (time < minTime) {
      continue;
    }
    count += 1;
    if (count >= threshold) {
      return time;
    }
  }
  return null;
};

const findMomentumThawTrigger = (applications, minTime, requiredGapHours = 48) => {
  const list = Array.isArray(applications) ? applications : [];
  if (!list.length) {
    return null;
  }
  const gapMs = requiredGapHours * HOUR_MS;
  const dayMap = new Map();

  list.forEach((app) => {
    const stamp = toTimestamp(app?.date ?? app?.createdAt ?? app?.timestamp);
    if (!Number.isFinite(stamp)) {
      return;
    }
    const day = new Date(stamp);
    day.setHours(0, 0, 0, 0);
    const dayStart = day.getTime();
    if (!dayMap.has(dayStart) || dayMap.get(dayStart) > stamp) {
      dayMap.set(dayStart, stamp);
    }
  });

  if (!dayMap.size) {
    return null;
  }

  const days = Array.from(dayMap.entries())
    .map(([dayStart, firstTime]) => ({ dayStart, firstTime }))
    .sort((a, b) => a.dayStart - b.dayStart);

  for (let index = 3; index < days.length; index += 1) {
    const current = days[index];
    const prev1 = days[index - 1];
    const prev2 = days[index - 2];
    const prev3 = days[index - 3];
    if (!prev1 || !prev2 || !prev3) {
      continue;
    }
    const consecutiveStreak =
      prev1.dayStart - prev2.dayStart === DAY_MS && prev2.dayStart - prev3.dayStart === DAY_MS;
    if (!consecutiveStreak) {
      continue;
    }
    const gap = current.dayStart - prev1.dayStart;
    if (gap >= gapMs && current.firstTime >= minTime) {
      return current.firstTime;
    }
  }

  return null;
};

const evaluateTriggerForEvent = (definition, state, context, minTime) => {
  const { triggerMeta } = definition || {};
  if (!triggerMeta) {
    return null;
  }
  const threshold = triggerMeta.threshold || 1;
  const scope = triggerMeta.scope || 'lifetime';
  const metric = triggerMeta.metric;

  if (scope === 'daily' && metric === 'statusChanges' && triggerMeta.status) {
    return evaluateStatusTrigger(context.manualLogs, triggerMeta.status, threshold, minTime);
  }

  if (scope === 'lifetime') {
    if (metric === 'favorites') {
      return evaluateManualTrigger(getManualEntries(context.manualLogs, 'favoriteMarked'), threshold, minTime);
    }
    if (metric === 'sprayAndPray') {
      return evaluateManualTrigger(getManualEntries(context.manualLogs, 'sprayAndPray'), threshold, minTime);
    }
    if (metric === 'interviews') {
      return evaluateStatusTrigger(context.manualLogs, 'Interview', threshold, minTime);
    }
    if (metric === 'hiatus') {
      return findMomentumThawTrigger(context.applications, minTime, threshold || 48);
    }
  }

  if (scope === 'event' && metric) {
    const source = context.states?.[metric];
    if (source && Number.isFinite(source.completedAt) && source.completedAt >= minTime) {
      return source.completedAt;
    }
  }

  return null;
};

const evaluateSingleEvent = (definition, prevState, context) => {
  const baseState = prevState ? { ...prevState } : { id: definition.id, active: false };
  const durationMs = (definition?.durationHours || 0) * HOUR_MS;
  const cooldownMs = (definition?.cooldownHours || 0) * HOUR_MS;
  const now = context.now;

  if (baseState.active && Number.isFinite(baseState.expiresAt) && now >= baseState.expiresAt) {
    baseState.active = false;
  }

  if (baseState.active) {
    return baseState;
  }

  const cooldownUntil = Number.isFinite(baseState.cooldownUntil) ? baseState.cooldownUntil : undefined;
  const lastTriggerAt = Number.isFinite(baseState.lastTriggerAt) ? baseState.lastTriggerAt : undefined;
  const minTime = Math.max(cooldownUntil ?? -Infinity, lastTriggerAt != null ? lastTriggerAt + 1 : -Infinity);
  const triggerAt = evaluateTriggerForEvent(definition, baseState, context, minTime);

  if (Number.isFinite(triggerAt) && triggerAt <= now) {
    baseState.active = true;
    baseState.triggeredAt = triggerAt;
    baseState.lastTriggerAt = triggerAt;
    baseState.expiresAt = durationMs > 0 ? triggerAt + durationMs : undefined;
    baseState.cooldownUntil = cooldownMs > 0 ? triggerAt + cooldownMs : undefined;
    baseState.completedAt = undefined;
  } else if (cooldownMs > 0 && !Number.isFinite(baseState.cooldownUntil) && Number.isFinite(baseState.lastTriggerAt)) {
    baseState.cooldownUntil = baseState.lastTriggerAt + cooldownMs;
  }

  return baseState;
};

export const evaluateEventStates = ({
  definitions = [],
  previousStates = {},
  manualLogs = {},
  applications = [],
  now = Date.now(),
}) => {
  if (!definitions.length) {
    return previousStates && typeof previousStates === 'object' ? previousStates : {};
  }

  const prev = previousStates && typeof previousStates === 'object' ? previousStates : {};
  const next = {};
  const working = { ...prev };
  let changed = false;

  definitions.forEach((definition) => {
    if (!definition?.id) {
      return;
    }
    const currentState = working[definition.id];
    const updated = evaluateSingleEvent(definition, currentState, {
      manualLogs,
      applications,
      now,
      states: working,
    });
    next[definition.id] = updated;
    working[definition.id] = updated;
    if (!changed && !compareEventStates(currentState, updated)) {
      changed = true;
    }
  });

  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  if (!changed && prevKeys.length !== nextKeys.length) {
    changed = true;
  }

  return changed ? next : prev;
};

export const computeEventProgressMap = ({
  events = {},
  applications = [],
  manualLogs = {},
  now = Date.now(),
}) => {
  const result = {};
  const appList = Array.isArray(applications) ? applications : [];
  const manual = ensureObject(manualLogs);

  Object.entries(events || {}).forEach(([eventId, state]) => {
    if (!state || state.active !== true || !Number.isFinite(state.triggeredAt)) {
      return;
    }
    const start = state.triggeredAt;
    const endLimit = Number.isFinite(state.expiresAt) ? Math.min(state.expiresAt, now) : now;
    if (!Number.isFinite(start) || endLimit <= start) {
      return;
    }

    const metrics = {
      applications: 0,
      fullApplications: 0,
      qualityApplications: 0,
      applicationsBurst: 0,
    };
    const manualCounts = {};
    const burstWindowEnd = start + 2 * HOUR_MS;

    appList.forEach((app) => {
      const stamp = toTimestamp(app?.date ?? app?.createdAt ?? app?.timestamp);
      if (!Number.isFinite(stamp) || stamp < start || stamp > endLimit) {
        return;
      }
      metrics.applications += 1;
      if (app?.type === 'Full') {
        metrics.fullApplications += 1;
      }
      if (safeNumber(app?.qs) >= 2) {
        metrics.qualityApplications += 1;
      }
      if (stamp <= burstWindowEnd) {
        metrics.applicationsBurst += 1;
      }
    });

    Object.entries(manual).forEach(([key, entries]) => {
      if (!Array.isArray(entries) || !entries.length) {
        return;
      }
      let count = 0;
      entries.forEach((entry) => {
        const stamp = toTimestamp(entry?.timestamp ?? entry?.date ?? entry?.createdAt);
        if (!Number.isFinite(stamp)) {
          return;
        }
        if (stamp >= start && stamp <= endLimit) {
          count += 1;
        }
      });
      if (count > 0) {
        manualCounts[key] = count;
      }
    });

    result[eventId] = {
      start,
      end: endLimit,
      metrics,
      manualCounts,
    };
  });

  return result;
};
const getMetricValue = (tracking, context) => {
  if (!tracking) {
    return { progress: 0, goalValue: 0 };
  }
  const { metrics, manual, totals, todayKey, currentWeekKey, events, eventProgress } = context;
  const scope = tracking.scope || 'lifetime';
  const manualKey = tracking.manualKey;
  const metricKey = tracking.metric;
  let progress = 0;

  if (scope === 'event') {
    const referenceId =
      typeof tracking.reference === 'string' && tracking.reference
        ? tracking.reference
        : typeof metricKey === 'string'
        ? metricKey
        : undefined;
    const eventState = referenceId ? events?.[referenceId] : undefined;
    const progressEntry = referenceId ? eventProgress?.[referenceId] : undefined;
    if (eventState?.active && progressEntry) {
      if (manualKey) {
        progress = safeNumber(progressEntry?.manualCounts?.[manualKey]);
      } else if (metricKey) {
        progress = safeNumber(progressEntry?.metrics?.[metricKey]);
      }
    } else {
      progress = 0;
    }
  } else if (manualKey) {
    if (scope === 'daily') {
      progress = safeNumber(manual.daily[manualKey]);
    } else if (scope === 'weekly') {
      progress = safeNumber(manual.weekly[manualKey]);
    } else {
      progress = safeNumber(manual.totals[manualKey]);
    }
  } else if (metricKey === 'dailyPerfect') {
    progress = metrics?.completion?.daily?.get(todayKey) ? 1 : 0;
  } else if (metricKey === 'weeklyPerfect') {
    progress = metrics?.completion?.weekly?.get(currentWeekKey) ? 1 : 0;
  } else if (metricKey === 'dailyPerfectCompletions') {
    progress = totals?.dailyPerfect ?? 0;
  } else if (metricKey === 'weeklyPerfectCompletions') {
    progress = totals?.weeklyPerfect ?? 0;
  } else {
    const source =
      scope === 'daily'
        ? metrics.daily
        : scope === 'weekly'
        ? metrics.weekly
        : metrics.lifetime;
    progress = safeNumber(source?.[metricKey]);
  }

  let goalValue = 0;
  if (typeof tracking.goal === 'number') {
    goalValue = tracking.goal;
  } else if (Array.isArray(tracking.thresholds) && tracking.thresholds.length) {
    goalValue = Math.max(...tracking.thresholds.map((value) => safeNumber(value)));
  } else if (tracking.incremental && Array.isArray(tracking.tiers) && tracking.tiers.length) {
    goalValue = Math.max(...tracking.tiers.map((tier) => safeNumber(tier.value)));
  } else if (manualKey) {
    goalValue = 1;
  }

  return { progress, goalValue };
};

const getQuestRewardTotals = (quest) => {
  let gold = 0;
  let xp = 0;
  if (Array.isArray(quest.tiers)) {
    quest.tiers.forEach((tier) => {
      gold += safeNumber(tier?.reward?.gold);
      xp += safeNumber(tier?.reward?.xp);
    });
  }
  if (Array.isArray(quest.steps)) {
    quest.steps.forEach((step) => {
      gold += safeNumber(step?.reward?.gold);
      xp += safeNumber(step?.reward?.xp);
    });
  }
  gold += safeNumber(quest?.reward?.gold);
  xp += safeNumber(quest?.reward?.xp);
  return { gold, xp };
};

const getQuestRewardEarned = (quest) => {
  let gold = 0;
  let xp = 0;
  if (Array.isArray(quest.tiers)) {
    quest.tiers.forEach((tier) => {
      const claimed = tier?.claimed;
      const completed = tier?.completed;
      if (claimed === true || (claimed == null && completed)) {
        gold += safeNumber(tier?.reward?.gold);
        xp += safeNumber(tier?.reward?.xp);
      }
    });
  }
  if (Array.isArray(quest.steps)) {
    quest.steps.forEach((step) => {
      const claimed = step?.claimed;
      const completed = step?.completed;
      if (claimed === true || (claimed == null && completed)) {
        gold += safeNumber(step?.reward?.gold);
        xp += safeNumber(step?.reward?.xp);
      }
    });
  }
  if (quest.claimed) {
    gold += safeNumber(quest?.reward?.gold);
    xp += safeNumber(quest?.reward?.xp);
  }
  return { gold, xp };
};
export const buildQuestTabs = ({ base, metrics, claimed, events, eventProgress }) => {
  const questsByTab = {};
  const unclaimedByTab = {};
  const claimedSet = claimed instanceof Set ? claimed : new Set(claimed);
  const context = {
    metrics,
    manual: metrics?.manual || { totals: {}, daily: {}, weekly: {} },
    totals: metrics?.totals || {},
    todayKey: metrics?.todayKey || '',
    currentWeekKey: metrics?.currentWeekKey || '',
    events: events || {},
    eventProgress: eventProgress || {},
  };

  Object.entries(base || {}).forEach(([tabKey, quests]) => {
    const statusMap = new Map();
    const enriched = [];
    const summaryRefs = [];
    const aggregator = {
      totalGold: 0,
      totalXp: 0,
      earnedGold: 0,
      earnedXp: 0,
      coreCompleted: 0,
      coreTotal: 0,
      cyclableCompleted: 0,
      cyclableTotal: 0,
    };

    const isWeeklyTab = tabKey === 'Weekly';
    let weeklyCoreInfo = null;
    let weeklyPerfectClone = null;
    let weeklySlotsTotal = 0;

    if (isWeeklyTab) {
      const weeklyCyclableIds = (quests || [])
        .filter((quest) => quest?.category === 'Weekly cyclable quest')
        .map((quest) => quest.id);
      weeklyCoreInfo = getWeeklyCoreInfo(context.currentWeekKey, weeklyCyclableIds);
      weeklySlotsTotal = weeklyCoreInfo?.cyclableIds?.length || 0;
    }

    const weeklyActiveCoreSet = weeklyCoreInfo?.coreSet;
    const weeklyActiveCyclableSet = weeklyCoreInfo?.cyclableSet;

    (quests || []).forEach((quest) => {
      if (quest?.type === 'summary') {
        const clone = { ...quest };
        summaryRefs.push(clone);
        enriched.push(clone);
        return;
      }

      if (quest?.type === 'note') {
        enriched.push({ ...quest });
        return;
      }

      if (quest?.type === 'section') {
        if (!isWeeklyTab) {
          enriched.push({ ...quest });
        }
        return;
      }

      if (isWeeklyTab && quest?.category === 'Weekly cyclable quest' && !weeklyActiveCyclableSet?.has(quest.id)) {
        return;
      }

      if (quest?.type === 'event') {
        const eventState = context.events?.[quest.id];
        if (!eventState || eventState.active !== true || !Number.isFinite(eventState.triggeredAt)) {
          return;
        }
      }

      const clone = {
        ...quest,
        actions: Array.isArray(quest?.actions) ? quest.actions.map((action) => ({ ...action })) : undefined,
      };

      if (isWeeklyTab && quest?.category === 'Weekly cyclable quest' && weeklyActiveCyclableSet?.has(quest.id)) {
        clone.category = 'Weekly core quest';
      }

      if (isWeeklyTab && clone.id === 'W-PERFECT' && clone.tracking) {
        clone.tracking = { ...clone.tracking, requires: weeklyCoreInfo?.coreIds || WEEKLY_STATIC_CORE_IDS };
      }

      if (quest?.type === 'event') {
        const eventState = context.events?.[quest.id];
        if (eventState) {
          clone.eventState = eventState;
          clone.startedAt = eventState.triggeredAt;
          clone.expiresAt = eventState.expiresAt;
          clone.cooldownUntil = eventState.cooldownUntil;
        }
      }

      const eventTriggerAt =
        quest?.type === 'event' && Number.isFinite(clone.startedAt) ? clone.startedAt : undefined;

      if (Array.isArray(quest?.tiers)) {
        clone.tiers = quest.tiers.map((tier) => ({ ...tier }));
      }
      if (Array.isArray(quest?.steps)) {
        clone.steps = quest.steps.map((step) => ({ ...step }));
      }
      if (Array.isArray(quest?.tasks)) {
        clone.tasks = quest.tasks.map((task) => ({ ...task }));
      }

      let progress = 0;
      let goalValue = 0;
      let completed = false;
      let locked = false;
      let trackable = false;

      if (quest?.tracking) {
        const baseStatus = getMetricValue(quest.tracking, context);
        progress = baseStatus.progress;
        goalValue = baseStatus.goalValue;
        trackable = goalValue > 0;

        const requires = Array.isArray(quest.tracking.requires) ? quest.tracking.requires : null;
        if (requires?.length) {
          const completedDeps = requires.reduce((count, depId) => {
            const depStatus = statusMap.get(depId);
            return depStatus?.completed ? count + 1 : count;
          }, 0);
          progress = completedDeps;
          goalValue = requires.length;
          trackable = goalValue > 0;
          locked = completedDeps < requires.length;
        }

        if (Array.isArray(quest.tracking.thresholds) && quest.tracking.thresholds.length) {
          if (!Array.isArray(clone.tiers) || !clone.tiers.length) {
            clone.tiers = quest.tracking.thresholds.map((value, index) => ({
              value,
              id: `${quest.id}-tier-${index}`,
            }));
          }
        }

        completed = trackable && progress >= goalValue;

        if (requires?.length) {
          locked = progress < goalValue;
        }
      }

      const questStatus = { progress, goalValue, completed };

      clone.trackable = trackable;
      clone.progress = progress;
      clone.goalValue = goalValue;
      clone.completed = completed;
      clone.locked = locked;
      clone.percent = goalValue > 0 ? Math.min(100, (progress / goalValue) * 100) : 0;

      statusMap.set(clone.id, questStatus);

      if (isWeeklyTab && clone.id === 'W-PERFECT') {
        weeklyPerfectClone = clone;
      }

      let tierStage = null;
      if (Array.isArray(clone.tiers)) {
        clone.tiers = clone.tiers.map((tier, tierIndex) => {
          const tierGoal = safeNumber(tier?.value ?? tier?.goalValue);
          const tierProgress = progress;
          const tierCompleted = tierGoal > 0 && tierProgress >= tierGoal;
          const tierId = tier.id || `${clone.id}-tier-${tierIndex}`;
          const tierClaimKey = composeQuestClaimKey(tierId, eventTriggerAt);
          const tierClaimed = claimedSet.has(tierClaimKey);
          if (!tierClaimed && !tierStage && tierGoal > 0) {
            tierStage = {
              id: tierId,
              index: tierIndex,
              goalValue: tierGoal,
              progress: tierProgress,
              reward: tier.reward,
              completed: tierCompleted,
              claimKey: tierClaimKey,
            };
          }
          return {
            ...tier,
            id: tierId,
            index: tierIndex,
            completed: tierCompleted,
            goalValue: tierGoal > 0 ? tierGoal : undefined,
            progress: tierProgress,
            claimKey: tierClaimKey,
            claimed: tierClaimed,
          };
        });
        if (tierStage) {
          const hasRemaining = clone.tiers.slice(tierStage.index + 1).some((tier) => !tier.claimed);
          tierStage.isFinal = !hasRemaining;
        }
      }

      let stepStage = null;
      if (Array.isArray(clone.steps)) {
        const questProgress = progress;
        clone.steps = clone.steps.map((step, index) => {
          let stepProgress = questProgress;
          let stepGoal = safeNumber(step?.value);
          let manualKey;
          let stepCompleted = false;
          let percent = 0;

          if (step?.tracking) {
            const stepStatus = getMetricValue(step.tracking, context);
            stepProgress = stepStatus.progress;
            stepGoal = stepStatus.goalValue;
            manualKey = step.tracking.manualKey;
            stepCompleted = stepGoal > 0 && stepStatus.progress >= stepStatus.goalValue;
            percent = stepGoal > 0 ? Math.min(100, (stepStatus.progress / stepStatus.goalValue) * 100) : 0;
          } else {
            stepCompleted = stepGoal > 0 && questProgress >= stepGoal;
            percent = stepGoal > 0 ? Math.min(100, (questProgress / stepGoal) * 100) : 0;
          }

          const stepId = step.id || `${clone.id}-step-${index}`;
          const stepClaimKey = composeQuestClaimKey(stepId, eventTriggerAt);
          const stepClaimed = claimedSet.has(stepClaimKey);
          if (!stepClaimed && !stepStage && stepGoal > 0) {
            stepStage = {
              id: stepId,
              index,
              goalValue: stepGoal,
              progress: stepProgress,
              reward: step.reward,
              completed: stepCompleted,
              claimKey: stepClaimKey,
            };
          }

          return {
            ...step,
            id: stepId,
            index,
            manualKey,
            progress: stepProgress,
            goalValue: stepGoal > 0 ? stepGoal : undefined,
            completed: stepCompleted,
            percent,
            claimKey: stepClaimKey,
            claimed: stepClaimed,
          };
        });
        if (stepStage) {
          const hasRemaining = clone.steps.slice(stepStage.index + 1).some((step) => !step.claimed);
          stepStage.isFinal = !hasRemaining;
        }
      }

      if (Array.isArray(clone.tasks)) {
        clone.tasks = clone.tasks.map((task, index) => {
          if (!task?.tracking) {
            return { ...task, index };
          }
          const taskStatus = getMetricValue(task.tracking, context);
          const taskCompleted = taskStatus.goalValue > 0 && taskStatus.progress >= taskStatus.goalValue;
          return {
            ...task,
            index,
            manualKey: task.tracking.manualKey,
            progress: taskStatus.progress,
            goalValue: taskStatus.goalValue,
            completed: taskCompleted,
            percent:
              taskStatus.goalValue > 0
                ? Math.min(100, (taskStatus.progress / taskStatus.goalValue) * 100)
                : 0,
          };
        });
      }

      if (quest?.type === 'event' && Array.isArray(clone.tasks) && clone.tasks.length) {
        let aggregatedGoal = 0;
        let aggregatedProgress = 0;
        let aggregatedCompleted = true;

        clone.tasks.forEach((task) => {
          const taskGoal = safeNumber(task?.goalValue);
          const taskProgress = safeNumber(task?.progress);

          if (taskGoal > 0) {
            aggregatedGoal += taskGoal;
            aggregatedProgress += Math.min(taskGoal, taskProgress);
            if (taskProgress < taskGoal) {
              aggregatedCompleted = false;
            }
          } else {
            aggregatedGoal += 1;
            if (task.completed) {
              aggregatedProgress += 1;
            } else {
              aggregatedCompleted = false;
            }
          }
        });

        if (aggregatedGoal > 0) {
          clone.trackable = true;
          clone.goalValue = aggregatedGoal;
          clone.progress = aggregatedProgress;
          clone.percent = Math.min(100, (aggregatedProgress / aggregatedGoal) * 100);
          clone.completed = aggregatedCompleted;
        }
      }

      const stageClaim = tierStage || stepStage;

      const claimBaseId = stageClaim ? stageClaim.id : clone.id;
      const claimKey = composeQuestClaimKey(claimBaseId, eventTriggerAt);
      const questClaimKey = composeQuestClaimKey(clone.id, eventTriggerAt);
      const questClaimed = claimedSet.has(questClaimKey);

      let claimReward = clone.reward;
      let claimable = clone.trackable && clone.completed && !questClaimed && !clone.locked;
      let activeStageId;
      let activeStageIsFinal = false;

      if (stageClaim && !questClaimed) {
        const stageGoalValue = safeNumber(stageClaim.goalValue);
        const stageProgress = safeNumber(stageClaim.progress);
        claimReward = stageClaim.reward || claimReward;
        activeStageId = stageClaim.id;
        activeStageIsFinal = stageClaim.isFinal === true;
        clone.trackable = true;
        clone.eventTriggerAt = eventTriggerAt;
        if (stageGoalValue > 0) {
          clone.goalValue = stageGoalValue;
          clone.progress = stageProgress;
          clone.percent = Math.min(100, stageGoalValue > 0 ? (stageProgress / stageGoalValue) * 100 : 0);
        } else {
          clone.progress = stageProgress;
          clone.goalValue = stageGoalValue;
          clone.percent = 0;
        }
        claimable = !clone.locked && stageGoalValue > 0 && stageProgress >= stageGoalValue;
      }

      clone.claimReward = claimReward;
      clone.claimKey = claimKey;
      clone.questClaimKey = questClaimKey;
      clone.eventTriggerAt = eventTriggerAt;
      clone.claimed = questClaimed;
      clone.claimable = claimable && !questClaimed;
      clone.activeStageId = activeStageId;
      clone.activeStageIsFinal = activeStageIsFinal;
      clone.activeStageClaimKey = stageClaim?.claimKey;

      const rewardTotals = getQuestRewardTotals(quest);
      aggregator.totalGold += rewardTotals.gold;
      aggregator.totalXp += rewardTotals.xp;
      const rewardsEarned = getQuestRewardEarned(clone);
      aggregator.earnedGold += rewardsEarned.gold;
      aggregator.earnedXp += rewardsEarned.xp;

      if (tabKey === 'Daily' && quest?.category === 'Daily core quest') {
        aggregator.coreTotal += 1;
        if (clone.completed) {
          aggregator.coreCompleted += 1;
        }
      }

      if (isWeeklyTab) {
        const isActiveCore = weeklyActiveCoreSet?.has(clone.id);
        const isActiveCyclable = weeklyActiveCyclableSet?.has(clone.id);
        if (isActiveCore) {
          aggregator.coreTotal += 1;
          if (clone.completed) {
            aggregator.coreCompleted += 1;
          }
        }
        if (isActiveCyclable) {
          aggregator.cyclableTotal += 1;
          if (clone.completed) {
            aggregator.cyclableCompleted += 1;
          }
        }
      }

      enriched.push(clone);
    });

    if (isWeeklyTab && weeklyPerfectClone) {
      const requires = Array.isArray(weeklyPerfectClone?.tracking?.requires)
        ? weeklyPerfectClone.tracking.requires
        : [];
      const completedDeps = requires.reduce((count, depId) => {
        const depStatus = statusMap.get(depId);
        return depStatus?.completed ? count + 1 : count;
      }, 0);
      const goalValue = requires.length;
      weeklyPerfectClone.progress = completedDeps;
      weeklyPerfectClone.goalValue = goalValue;
      weeklyPerfectClone.percent = goalValue > 0 ? Math.min(100, (completedDeps / goalValue) * 100) : 0;
      weeklyPerfectClone.completed = goalValue > 0 && completedDeps >= goalValue;
      weeklyPerfectClone.locked = completedDeps < goalValue;
      weeklyPerfectClone.trackable = goalValue > 0;
      weeklyPerfectClone.claimable =
        weeklyPerfectClone.trackable && weeklyPerfectClone.completed && !weeklyPerfectClone.claimed;
      statusMap.set(weeklyPerfectClone.id, {
        progress: weeklyPerfectClone.progress,
        goalValue: weeklyPerfectClone.goalValue,
        completed: weeklyPerfectClone.completed,
      });
    }

    summaryRefs.forEach((summary) => {
      if (summary.summaryKey === 'dailyTotals') {
        const masteryStatus = statusMap.get('D-PERFECT');
        summary.summary = {
          goldTotal: aggregator.totalGold,
          xpTotal: aggregator.totalXp,
          goldEarned: aggregator.earnedGold,
          xpEarned: aggregator.earnedXp,
          coreCompleted: aggregator.coreCompleted,
          coreTotal: aggregator.coreTotal,
          masteryComplete: Boolean(masteryStatus?.completed),
          percent:
            aggregator.totalGold > 0 ? Math.min(100, (aggregator.earnedGold / aggregator.totalGold) * 100) : 0,
        };
      } else if (summary.summaryKey === 'weeklyTotals') {
        summary.summary = {
          goldTotal: aggregator.totalGold,
          xpTotal: aggregator.totalXp,
          goldEarned: aggregator.earnedGold,
          xpEarned: aggregator.earnedXp,
        };
      } else if (summary.summaryKey === 'weeklyProgress') {
        const weeklyPerfect = statusMap.get('W-PERFECT');
        summary.summary = {
          coreCompleted: aggregator.coreCompleted,
          coreTotal: aggregator.coreTotal,
          cyclableCompleted: aggregator.cyclableCompleted,
          cyclableTotal: aggregator.cyclableTotal,
          slotsUsed: Math.min(aggregator.cyclableCompleted, weeklySlotsTotal),
          slotsTotal: weeklySlotsTotal,
          weeklyPerfectComplete: Boolean(weeklyPerfect?.completed),
        };
      }
    });

    unclaimedByTab[tabKey] = enriched.filter((quest) => quest?.claimable).length;
    questsByTab[tabKey] = enriched;
  });

  return { questsByTab, unclaimedByTab };
};
