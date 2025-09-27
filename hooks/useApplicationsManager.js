import { useCallback } from 'react';
import { Alert, Platform, Share } from 'react-native';

import { computeRewards, focusCost } from '../src/features/progression';
import { sanitizePersistedData } from '../src/state/persistence/sanitizers';
import { toTimestamp } from '../src/utils/time';

export const useApplicationsManager = ({
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
  sprayDebuffDurationMs,
  handleManualLog,
  updateCurrentTime,
  editingApp,
  setEditingApp,
  persistedStateData,
  storageVersion,
}) => {
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
        setSprayDebuff({ activatedAt, expiresAt: activatedAt + sprayDebuffDurationMs });
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
      sprayMultiplier,
      sprayActive,
      gainXp,
      setApplications,
      setApps,
      setGold,
      setFocus,
      lowQualityStreakRef,
      setSprayDebuff,
      sprayDebuffDurationMs,
      handleManualLog,
      updateCurrentTime,
    ],
  );

  const deleteApplication = useCallback(
    (id) => {
      setApplications((list) => {
        const target = list.find((item) => item.id === id);
        if (!target) {
          return list;
        }
        setApps((value) => Math.max(0, value - 1));
        return list.filter((item) => item.id !== id);
      });
    },
    [setApplications, setApps],
  );

  const submitEdit = useCallback(
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
    [editingApp, activeEffects, sprayMultiplier, setApplications, setEditingApp, handleManualLog],
  );

  const exportApplications = useCallback(async () => {
    const stateSnapshot = sanitizePersistedData(persistedStateData);
    const applicationsList = Array.isArray(stateSnapshot.applications)
      ? stateSnapshot.applications
      : [];
    const manualLogsMap =
      stateSnapshot.manualLogs && typeof stateSnapshot.manualLogs === 'object'
        ? stateSnapshot.manualLogs
        : {};

    const hasManualLogs = Object.values(manualLogsMap).some(
      (entries) => Array.isArray(entries) && entries.length,
    );
    const hasPremiumSavings = Object.keys(stateSnapshot.premiumProgress || {}).length > 0;
    const hasChests = Array.isArray(stateSnapshot.chests) && stateSnapshot.chests.length > 0;
    const hasEffects = Array.isArray(stateSnapshot.activeEffects) && stateSnapshot.activeEffects.length > 0;
    const hasClaims = Array.isArray(stateSnapshot.claimedQuests) && stateSnapshot.claimedQuests.length > 0;
    const hasCurrency = (stateSnapshot.gold ?? 0) > 0 || (stateSnapshot.xp ?? 0) > 0;

    if (
      !(
        applicationsList.length ||
        hasManualLogs ||
        hasPremiumSavings ||
        hasChests ||
        hasEffects ||
        hasClaims ||
        hasCurrency
      )
    ) {
      Alert.alert('Nothing to export', 'Play a bit to generate some progress before exporting.');
      return;
    }

    const statusEntries = Array.isArray(manualLogsMap?.statusChange)
      ? manualLogsMap.statusChange
      : [];

    const statusByApp = statusEntries.reduce((acc, entry) => {
      const appId = entry?.applicationId;
      if (!appId) {
        return acc;
      }
      const timestampMs = toTimestamp(entry?.timestamp ?? entry?.date ?? entry?.createdAt);
      const hasTimestamp = Number.isFinite(timestampMs);
      const record = {
        from: entry?.from ?? null,
        to: entry?.to ?? entry?.status ?? null,
        status: entry?.status ?? entry?.to ?? null,
        timestampMs: hasTimestamp ? timestampMs : null,
        timestamp: hasTimestamp ? new Date(timestampMs).toISOString() : null,
      };
      if (!acc[appId]) {
        acc[appId] = [];
      }
      acc[appId].push(record);
      return acc;
    }, {});

    Object.values(statusByApp).forEach((list) => {
      list.sort((a, b) => {
        const aTime = Number.isFinite(a.timestampMs) ? a.timestampMs : 0;
        const bTime = Number.isFinite(b.timestampMs) ? b.timestampMs : 0;
        return aTime - bTime;
      });
    });

    const exportItems = applicationsList.map((app) => {
      const loggedTimestamp = toTimestamp(app?.date ?? app?.timestamp ?? app?.createdAt);
      const hasLoggedTimestamp = Number.isFinite(loggedTimestamp);
      const loggedAt = hasLoggedTimestamp ? new Date(loggedTimestamp).toISOString() : null;
      const statusHistory = (statusByApp[app.id] || []).map((entry) => ({ ...entry }));
      const lastStatusChange = statusHistory.reduce((latest, entry) => {
        if (!Number.isFinite(entry.timestampMs)) {
          return latest;
        }
        if (!latest || entry.timestampMs > latest.timestampMs) {
          return entry;
        }
        return latest;
      }, null);

      return {
        ...app,
        loggedAt,
        loggedAtMs: hasLoggedTimestamp ? loggedTimestamp : null,
        statusHistory,
        statusLastChangedAt: lastStatusChange?.timestamp ?? null,
        statusLastChangedAtMs: lastStatusChange?.timestampMs ?? null,
      };
    });

    const exportedAt = new Date().toISOString();
    const persistenceSnapshot = {
      version: storageVersion,
      updatedAt: exportedAt,
      data: stateSnapshot,
    };

    const exportPayload = {
      exportedAt,
      schemaVersion: storageVersion,
      totalApplications: exportItems.length,
      applications: exportItems,
      state: persistenceSnapshot,
    };

    const exportText = JSON.stringify(exportPayload, null, 2);

    if (!Share || typeof Share.share !== 'function' || Platform.OS === 'web') {
      const logger = globalThis?.['console'];
      if (logger && typeof logger.log === 'function') {
        logger.log('Applications export', exportPayload);
      }
      Alert.alert('Export generated', 'The export data has been printed to the console.');
      return;
    }

    try {
      await Share.share({
        title: 'Applications Export',
        message: exportText,
      });
    } catch (error) {
      Alert.alert('Export failed', error?.message || 'Unable to export applications.');
    }
  }, [persistedStateData, storageVersion]);

  return {
    addApplication,
    deleteApplication,
    submitEdit,
    exportApplications,
  };
};
