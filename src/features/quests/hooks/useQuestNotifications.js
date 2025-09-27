import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const ensureObject = (value) => (value && typeof value === 'object' ? value : {});

export const useQuestNotifications = ({
  eventStates,
  questsByTab,
  questTab,
  unclaimedByTab,
  onManualLog,
  eventSeenRef,
  eventsReactivatedRef,
}) => {
  const [eventNotifications, setEventNotifications] = useState(() => ({}));
  const previousStatesRef = useRef({});

  useEffect(() => {
    const prevStates = previousStatesRef.current || {};
    const currentStates = ensureObject(eventStates);
    previousStatesRef.current = currentStates;

    setEventNotifications((currentNotifications) => {
      const safeCurrent = ensureObject(currentNotifications);
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
        const seenTrigger = eventSeenRef?.current?.get?.(eventId);
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
  }, [eventStates, eventSeenRef]);

  useEffect(() => {
    if (questTab !== 'Events') {
      return;
    }

    setEventNotifications((current) => {
      const safeCurrent = ensureObject(current);
      const entries = Object.entries(safeCurrent);
      if (!entries.length) {
        return current;
      }
      const seenMap = eventSeenRef?.current;
      entries.forEach(([eventId, triggeredAt]) => {
        if (Number.isFinite(triggeredAt)) {
          seenMap?.set?.(eventId, triggeredAt);
        }
      });
      return {};
    });
  }, [questTab, eventNotifications, eventSeenRef]);

  const eventNotificationIds = useMemo(
    () => Object.keys(ensureObject(eventNotifications)),
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
    () => (unclaimedByTab?.Events || 0) + additionalEventNotifications,
    [unclaimedByTab, additionalEventNotifications],
  );

  const handleQuestAction = useCallback(
    (action, quest) => {
      if (!action) {
        return;
      }
      if (action.type === 'log' && action.key) {
        onManualLog?.(action.key, { questId: quest?.id, actionKey: action.key });
      }
    },
    [onManualLog],
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

  const handleEventsReactivated = useCallback(
    (eventIds = []) => {
      if (!Array.isArray(eventIds) || !eventIds.length) {
        return;
      }
      const seenMap = eventSeenRef?.current;
      if (!seenMap || typeof seenMap.delete !== 'function') {
        return;
      }
      eventIds.forEach((eventId) => {
        seenMap.delete(eventId);
      });
    },
    [eventSeenRef],
  );

  if (eventsReactivatedRef) {
    eventsReactivatedRef.current = handleEventsReactivated;
  }

  return {
    eventTabBadgeCount,
    handleQuestAction,
    getStageProgressSummary,
  };
};
