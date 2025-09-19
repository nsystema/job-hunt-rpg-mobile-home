export const DAY_MS = 24 * 60 * 60 * 1000;

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

    const weekComplete =
      metrics.applications >= 80 &&
      metrics.fullApplications >= 35 &&
      metrics.platforms.size >= 6 &&
      metrics.tailoredCVs >= 25 &&
      metrics.letters >= 25 &&
      metrics.dailyPerfectDays >= 4 &&
      metrics.skillLearning >= 1;
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
const getMetricValue = (tracking, context) => {
  if (!tracking) {
    return { progress: 0, goalValue: 0 };
  }
  const { metrics, manual, totals, todayKey, currentWeekKey } = context;
  const scope = tracking.scope || 'lifetime';
  const manualKey = tracking.manualKey;
  const metricKey = tracking.metric;
  let progress = 0;

  if (manualKey) {
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
  gold += safeNumber(quest?.reward?.gold);
  xp += safeNumber(quest?.reward?.xp);
  return { gold, xp };
};

const getQuestRewardEarned = (quest) => {
  let gold = 0;
  let xp = 0;
  if (Array.isArray(quest.tiers)) {
    quest.tiers.forEach((tier) => {
      if (tier.completed) {
        gold += safeNumber(tier?.reward?.gold);
        xp += safeNumber(tier?.reward?.xp);
      }
    });
  }
  if (quest.completed) {
    gold += safeNumber(quest?.reward?.gold);
    xp += safeNumber(quest?.reward?.xp);
  }
  return { gold, xp };
};
export const buildQuestTabs = ({ base, metrics, claimed }) => {
  const questsByTab = {};
  const unclaimedByTab = {};
  const claimedSet = claimed instanceof Set ? claimed : new Set(claimed);
  const context = {
    metrics,
    manual: metrics?.manual || { totals: {}, daily: {}, weekly: {} },
    totals: metrics?.totals || {},
    todayKey: metrics?.todayKey || '',
    currentWeekKey: metrics?.currentWeekKey || '',
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

    (quests || []).forEach((quest) => {
      if (quest?.type === 'summary') {
        const clone = { ...quest };
        summaryRefs.push(clone);
        enriched.push(clone);
        return;
      }

      if (quest?.type === 'note' || quest?.type === 'section') {
        enriched.push({ ...quest });
        return;
      }

      const clone = {
        ...quest,
        actions: Array.isArray(quest?.actions) ? quest.actions.map((action) => ({ ...action })) : undefined,
      };

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

        if (Array.isArray(quest.tracking.thresholds) && quest.tracking.thresholds.length) {
          clone.tiers = (clone.tiers || quest.tracking.thresholds.map((value) => ({ value }))).map((tier) => ({
            ...tier,
            completed: progress >= safeNumber(tier?.value),
            goalValue: safeNumber(tier?.value),
            progress,
          }));
        }

        if (Array.isArray(clone.tiers)) {
          clone.tiers = clone.tiers.map((tier) => ({
            ...tier,
            completed: progress >= safeNumber(tier?.value),
            goalValue: safeNumber(tier?.value),
            progress,
          }));
        }

        completed = trackable && progress >= goalValue;

        if (Array.isArray(quest.tracking.requires) && quest.tracking.requires.length) {
          const depsComplete = quest.tracking.requires.every((depId) => statusMap.get(depId)?.completed);
          if (!depsComplete) {
            locked = true;
            completed = false;
          }
        }
      }

      clone.trackable = trackable;
      clone.progress = progress;
      clone.goalValue = goalValue;
      clone.completed = completed;
      clone.locked = locked;
      clone.percent = goalValue > 0 ? Math.min(100, (progress / goalValue) * 100) : 0;

      statusMap.set(clone.id, { progress, goalValue, completed });

      if (Array.isArray(clone.steps)) {
        clone.steps = clone.steps.map((step, index) => {
          if (!step?.tracking) {
            return { ...step, index };
          }
          const stepStatus = getMetricValue(step.tracking, context);
          const stepCompleted = stepStatus.goalValue > 0 && stepStatus.progress >= stepStatus.goalValue;
          return {
            ...step,
            index,
            manualKey: step.tracking.manualKey,
            progress: stepStatus.progress,
            goalValue: stepStatus.goalValue,
            completed: stepCompleted,
            percent:
              stepStatus.goalValue > 0
                ? Math.min(100, (stepStatus.progress / stepStatus.goalValue) * 100)
                : 0,
          };
        });
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

      clone.claimed = claimedSet.has(clone.id);
      clone.claimable = clone.trackable && clone.completed && !clone.claimed && !clone.locked;

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

      if (tabKey === 'Weekly') {
        if (quest?.category === 'Weekly core quest') {
          aggregator.coreTotal += 1;
          if (clone.completed) {
            aggregator.coreCompleted += 1;
          }
        }
        if (quest?.category === 'Weekly cyclable quest') {
          aggregator.cyclableTotal += 1;
          if (clone.completed) {
            aggregator.cyclableCompleted += 1;
          }
        }
      }

      enriched.push(clone);
    });

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
          slotsUsed: Math.min(aggregator.cyclableCompleted, 2),
          slotsTotal: 2,
          weeklyPerfectComplete: Boolean(weeklyPerfect?.completed),
        };
      }
    });

    unclaimedByTab[tabKey] = enriched.filter((quest) => quest?.claimable).length;
    questsByTab[tabKey] = enriched;
  });

  return { questsByTab, unclaimedByTab };
};
