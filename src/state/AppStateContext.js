import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  sanitizePersistedData,
  migratePersistedState,
  createDefaultQuestMeta,
} from './persistence/sanitizers';
import { FOCUS_BASELINE } from '../features/progression';

const STORAGE_KEY = 'jobless::state';
const STORAGE_VERSION = 1;

const AppStateContext = createContext(null);

const createInitialState = () => {
  const sanitized = sanitizePersistedData({});

  return {
    xp: sanitized.xp,
    apps: sanitized.apps,
    gold: sanitized.gold,
    streak: sanitized.streak,
    focus: sanitized.focus ?? FOCUS_BASELINE,
    activeEffects: sanitized.activeEffects,
    sprayDebuff: sanitized.sprayDebuff,
    applications: sanitized.applications,
    claimedQuests: new Set(sanitized.claimedQuests || []),
    manualLogs: sanitized.manualLogs,
    eventStates: sanitized.eventStates,
    chests: sanitized.chests,
    premiumProgress: sanitized.premiumProgress,
    questMeta: sanitized.questMeta ?? createDefaultQuestMeta(),
    shop: {
      mainTab: 'catalogue',
      categoryTab: 'effects',
    },
    isHydrated: false,
    hydrationError: null,
  };
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'HYDRATE_SUCCESS': {
      const {
        xp = 0,
        apps = 0,
        gold = 0,
        streak = 0,
        focus = FOCUS_BASELINE,
        activeEffects = [],
        sprayDebuff = null,
        applications = [],
        claimedQuests = [],
        manualLogs = {},
        eventStates = {},
        chests = [],
        premiumProgress = {},
        questMeta = createDefaultQuestMeta(),
      } = action.payload || {};

      return {
        ...state,
        xp,
        apps,
        gold,
        streak,
        focus,
        activeEffects,
        sprayDebuff,
        applications,
        claimedQuests: new Set(claimedQuests),
        manualLogs,
        eventStates,
        chests,
        premiumProgress,
        questMeta,
        isHydrated: true,
        hydrationError: null,
      };
    }
    case 'HYDRATE_FAILURE':
      return {
        ...state,
        isHydrated: true,
        hydrationError: action.error || null,
      };
    case 'SET_FIELD':
      return {
        ...state,
        [action.field]: action.value,
      };
    case 'SET_SHOP_FIELD':
      return {
        ...state,
        shop: {
          ...state.shop,
          [action.field]: action.value,
        },
      };
    case 'SET_ARRAY_FIELD':
      return {
        ...state,
        [action.field]: Array.isArray(action.value) ? action.value : [],
      };
    case 'SET_OBJECT_FIELD':
      return {
        ...state,
        [action.field]: action.value && typeof action.value === 'object' ? action.value : {},
      };
    case 'SET_CLAIMED_QUESTS': {
      const next = action.value instanceof Set ? action.value : new Set(action.value || []);
      return {
        ...state,
        claimedQuests: next,
      };
    }
    default:
      return state;
  }
};

const serializeState = (state) =>
  sanitizePersistedData({
    xp: state.xp,
    apps: state.apps,
    gold: state.gold,
    streak: state.streak,
    focus: state.focus,
    activeEffects: Array.isArray(state.activeEffects) ? state.activeEffects : [],
    sprayDebuff: state.sprayDebuff,
    applications: Array.isArray(state.applications) ? state.applications : [],
    claimedQuests:
      state.claimedQuests instanceof Set
        ? Array.from(state.claimedQuests)
        : Array.isArray(state.claimedQuests)
        ? state.claimedQuests
        : [],
    manualLogs: state.manualLogs && typeof state.manualLogs === 'object' ? state.manualLogs : {},
    eventStates: state.eventStates && typeof state.eventStates === 'object' ? state.eventStates : {},
    chests: Array.isArray(state.chests) ? state.chests : [],
    premiumProgress:
      state.premiumProgress && typeof state.premiumProgress === 'object'
        ? state.premiumProgress
        : {},
    questMeta: state.questMeta && typeof state.questMeta === 'object'
      ? state.questMeta
      : createDefaultQuestMeta(),
  });

const createActions = (dispatch) => ({
  setXp: (value) => dispatch({ type: 'SET_FIELD', field: 'xp', value }),
  setApps: (value) => dispatch({ type: 'SET_FIELD', field: 'apps', value }),
  setGold: (value) => dispatch({ type: 'SET_FIELD', field: 'gold', value }),
  setStreak: (value) => dispatch({ type: 'SET_FIELD', field: 'streak', value }),
  setFocus: (value) => dispatch({ type: 'SET_FIELD', field: 'focus', value }),
  setActiveEffects: (value) => dispatch({ type: 'SET_ARRAY_FIELD', field: 'activeEffects', value }),
  setSprayDebuff: (value) => dispatch({ type: 'SET_FIELD', field: 'sprayDebuff', value }),
  setApplications: (value) => dispatch({ type: 'SET_ARRAY_FIELD', field: 'applications', value }),
  setManualLogs: (value) => dispatch({ type: 'SET_OBJECT_FIELD', field: 'manualLogs', value }),
  setEventStates: (value) => dispatch({ type: 'SET_OBJECT_FIELD', field: 'eventStates', value }),
  setChests: (value) => dispatch({ type: 'SET_ARRAY_FIELD', field: 'chests', value }),
  setPremiumProgress: (value) =>
    dispatch({ type: 'SET_OBJECT_FIELD', field: 'premiumProgress', value }),
  setQuestMeta: (value) => dispatch({ type: 'SET_OBJECT_FIELD', field: 'questMeta', value }),
  setClaimedQuests: (value) => dispatch({ type: 'SET_CLAIMED_QUESTS', value }),
  setShopMainTab: (value) => dispatch({ type: 'SET_SHOP_FIELD', field: 'mainTab', value }),
  setShopCategoryTab: (value) => dispatch({ type: 'SET_SHOP_FIELD', field: 'categoryTab', value }),
});

const createSelectors = (state) => ({
  tabBadges: {
    Home: 0,
    Apps: Array.isArray(state.applications) ? state.applications.length : 0,
    Quests:
      state.claimedQuests instanceof Set
        ? state.claimedQuests.size
        : Array.isArray(state.claimedQuests)
        ? state.claimedQuests.length
        : 0,
    Rewards: Array.isArray(state.chests) ? state.chests.length : 0,
    Shop: Array.isArray(state.activeEffects) ? state.activeEffects.length : 0,
  },
});

export const AppStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      if (!AsyncStorage || typeof AsyncStorage.getItem !== 'function') {
        dispatch({ type: 'HYDRATE_FAILURE', error: null });
        return;
      }

      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (!storedValue) {
          dispatch({ type: 'HYDRATE_SUCCESS', payload: sanitizePersistedData({}) });
          return;
        }

        const parsed = JSON.parse(storedValue);
        const migrated = migratePersistedState(parsed, STORAGE_VERSION);
        if (cancelled) {
          return;
        }

        dispatch({ type: 'HYDRATE_SUCCESS', payload: migrated.data });
      } catch (error) {
        if (cancelled) {
          return;
        }
        dispatch({ type: 'HYDRATE_FAILURE', error });
      }
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!state.isHydrated) {
      return;
    }
    if (!AsyncStorage || typeof AsyncStorage.setItem !== 'function') {
      return;
    }

    const payload = {
      version: STORAGE_VERSION,
      data: serializeState(state),
      updatedAt: new Date().toISOString(),
    };

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {
      // Ignore write failures in this lightweight provider; they will be retried on next change.
    });
  }, [state]);

  const actions = useMemo(() => createActions(dispatch), [dispatch]);
  const selectors = useMemo(() => createSelectors(state), [state]);

  const value = useMemo(
    () => ({ state, actions, selectors, dispatch }),
    [state, actions, selectors],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export const useAppStateContext = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppStateContext must be used within an AppStateProvider.');
  }
  return context;
};

export const useAppState = () => useAppStateContext().state;
export const useAppStateActions = () => useAppStateContext().actions;
export const useAppStateSelectors = () => useAppStateContext().selectors;

export default AppStateProvider;
