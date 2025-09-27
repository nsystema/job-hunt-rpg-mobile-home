import { useEffect, useMemo, useRef } from 'react';
import {
  buildQuestTabs,
  computeQuestMetrics,
  computeEventProgressMap,
  evaluateEventStates,
  composeQuestClaimKey,
} from '../utils/questProcessing';
import { QUESTS } from '../data/questCatalog';

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

export const useQuestBoard = ({
  baseQuests = QUESTS,
  applications,
  manualLogs,
  currentTime,
  claimedQuests,
  setClaimedQuests,
  eventStates,
  setEventStates,
  eventsReactivatedRef,
}) => {
  const previousEventStatesRef = useRef({});

  const eventDefinitions = useMemo(
    () =>
      Array.isArray(baseQuests?.Events)
        ? baseQuests.Events.filter((quest) => quest?.type === 'event')
        : [],
    [baseQuests],
  );

  useEffect(() => {
    if (!eventDefinitions.length || typeof setEventStates !== 'function') {
      return;
    }

    setEventStates((prev) =>
      evaluateEventStates({
        definitions: eventDefinitions,
        previousStates: prev,
        manualLogs,
        applications,
        now: currentTime,
      }),
    );
  }, [
    eventDefinitions,
    setEventStates,
    manualLogs,
    applications,
    currentTime,
  ]);

  const eventStageIds = useMemo(() => {
    return eventDefinitions.reduce((acc, quest) => {
      if (quest?.id) {
        acc[quest.id] = collectStageIds(quest);
      }
      return acc;
    }, {});
  }, [eventDefinitions]);

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
        base: baseQuests,
        metrics: questMetrics,
        claimed: claimedQuests,
        events: eventStates,
        eventProgress,
      }),
    [baseQuests, questMetrics, claimedQuests, eventStates, eventProgress],
  );

  useEffect(() => {
    if (typeof setClaimedQuests !== 'function') {
      return;
    }

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
      const stageIds = eventStageIds[eventId] || [];
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

    if (reactivatedEventIds.length && eventsReactivatedRef?.current) {
      eventsReactivatedRef.current(reactivatedEventIds);
    }
  }, [eventStates, eventStageIds, setClaimedQuests, eventsReactivatedRef]);

  return {
    questMetrics,
    eventProgress,
    questsByTab,
    unclaimedByTab,
    eventDefinitions,
    eventStageIds,
  };
};
