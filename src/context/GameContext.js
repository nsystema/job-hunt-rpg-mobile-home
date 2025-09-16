import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { QUESTS } from '../data/appConstants';
import {
  FOCUS_BASELINE,
  computeRewards,
  focusCost,
  rollChest,
  resolveChestReward,
  GAME_EFFECTS,
  REAL_REWARDS,
  PREMIUM_REWARDS,
  lvl,
  PLACEHOLDER_CHESTS
} from '../utils/gameMechanics';

const GameContext = createContext(undefined);

const makeIso = (daysAgo = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

const initialApplications = [
  {
    id: 'app-1',
    company: 'Arcadia Labs',
    role: 'Senior Frontend Engineer',
    platform: 'LinkedIn Jobs',
    status: 'Applied',
    type: 'Full',
    cvTailored: true,
    motivation: true,
    favorite: true,
    note: 'Referral through Sarah',
    date: makeIso(0)
  },
  {
    id: 'app-2',
    company: 'Helios AI',
    role: 'Product Designer',
    platform: 'Company website',
    status: 'Interview',
    type: 'Full',
    cvTailored: true,
    motivation: false,
    favorite: false,
    note: 'Portfolio review scheduled next week.',
    date: makeIso(2)
  },
  {
    id: 'app-3',
    company: 'Nimbus Analytics',
    role: 'Data Analyst',
    platform: 'Indeed',
    status: 'Ghosted',
    type: 'Easy',
    cvTailored: false,
    motivation: false,
    favorite: false,
    note: 'Sent follow-up email after two weeks.',
    date: makeIso(4)
  },
  {
    id: 'app-4',
    company: 'Crimson Works',
    role: 'Growth Marketer',
    platform: 'Glassdoor',
    status: 'Rejected',
    type: 'Full',
    cvTailored: true,
    motivation: true,
    favorite: false,
    note: 'Constructive feedback received. Update CV layout.',
    date: makeIso(6)
  }
];

const cloneQuestState = () =>
  Object.fromEntries(
    Object.entries(QUESTS).map(([key, list]) => [
      key,
      list.map((quest) => ({ ...quest, progress: Math.min(quest.progress ?? 0, quest.goal) }))
    ])
  );

const incrementQuest = (quests, questId, amount = 1) => {
  let changed = false;
  const next = Object.fromEntries(
    Object.entries(quests).map(([tab, list]) => [
      tab,
      list.map((quest) => {
        if (quest.id !== questId) return quest;
        const updatedProgress = Math.min(quest.goal, quest.progress + amount);
        if (updatedProgress !== quest.progress) {
          changed = true;
          return { ...quest, progress: updatedProgress };
        }
        return quest;
      })
    ])
  );
  return changed ? next : quests;
};

const initialState = {
  xp: 240,
  gold: 90,
  focus: FOCUS_BASELINE,
  streak: 2,
  skillPoints: 3,
  applications: initialApplications,
  quests: cloneQuestState(),
  claimedQuests: [],
  chests: PLACEHOLDER_CHESTS.slice(0, 6),
  effects: [],
  redeemedReward: null,
  lastChestReward: null,
  lastAction: null
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'LOG_APPLICATION': {
      const payload = action.payload;
      const now = new Date();
      const application = {
        id: `app-${Date.now()}`,
        company: payload.company?.trim() || 'Unknown company',
        role: payload.role?.trim() || 'Role',
        platform: payload.platform || 'Company website',
        status: payload.status || 'Applied',
        type: payload.type || 'Full',
        cvTailored: !!payload.cvTailored,
        motivation: !!payload.motivation,
        favorite: !!payload.favorite,
        note: payload.note?.trim() || '',
        date: now.toISOString()
      };

      const reward = computeRewards(application, {
        streak: state.streak,
        effects: state.effects,
        spray: action.meta?.spray ?? 1
      });

      const focusReduction = focusCost(application.type);
      const remainingFocus = Math.max(0, state.focus - focusReduction);

      const newApplications = [application, ...state.applications].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      let quests = incrementQuest(state.quests, 'd1', 1);
      quests = incrementQuest(quests, 'w1', 1);
      if (application.status === 'Interview') {
        quests = incrementQuest(quests, 'w2', 1);
      }

      let chests = state.chests;
      if (Math.random() < 0.25) {
        const rolled = rollChest(reward.rareWeight);
        chests = [
          ...state.chests,
          { id: `chest-${Date.now()}`, rarity: rolled.key, gold: rolled.gold }
        ];
      }

      return {
        ...state,
        xp: state.xp + reward.xp,
        gold: state.gold + reward.gold,
        focus: remainingFocus,
        streak: Math.min(state.streak + 1, 7),
        applications: newApplications,
        quests,
        chests,
        lastAction: {
          type: 'application',
          xp: reward.xp,
          gold: reward.gold,
          timestamp: now.toISOString()
        }
      };
    }
    case 'UPDATE_APPLICATION': {
      const { id, updates } = action;
      const updated = state.applications.map((app) =>
        app.id === id ? { ...app, ...updates } : app
      );
      return { ...state, applications: updated };
    }
    case 'DELETE_APPLICATION': {
      const filtered = state.applications.filter((app) => app.id !== action.id);
      return { ...state, applications: filtered };
    }
    case 'TOGGLE_FAVORITE': {
      const updated = state.applications.map((app) =>
        app.id === action.id ? { ...app, favorite: !app.favorite } : app
      );
      return { ...state, applications: updated };
    }
    case 'RECORD_NETWORKING': {
      const xpGain = 12;
      const goldGain = 8;
      const focusReduction = 0.5;
      const quests = incrementQuest(state.quests, 'd2', 1);
      return {
        ...state,
        xp: state.xp + xpGain,
        gold: state.gold + goldGain,
        focus: Math.max(0, state.focus - focusReduction),
        lastAction: {
          type: 'networking',
          xp: xpGain,
          gold: goldGain,
          timestamp: new Date().toISOString()
        },
        quests
      };
    }
    case 'RECORD_SKILL': {
      const xpGain = 18;
      const goldGain = 6;
      const quests = incrementQuest(state.quests, 'g1', 1);
      return {
        ...state,
        xp: state.xp + xpGain,
        gold: state.gold + goldGain,
        skillPoints: state.skillPoints + 1,
        lastAction: {
          type: 'skill',
          xp: xpGain,
          gold: goldGain,
          timestamp: new Date().toISOString()
        },
        quests
      };
    }
    case 'RECORD_INTERVIEW': {
      const xpGain = 22;
      const goldGain = 14;
      const focusReduction = 1.5;
      const quests = incrementQuest(state.quests, 'w2', 1);
      return {
        ...state,
        xp: state.xp + xpGain,
        gold: state.gold + goldGain,
        focus: Math.max(0, state.focus - focusReduction),
        lastAction: {
          type: 'interview',
          xp: xpGain,
          gold: goldGain,
          timestamp: new Date().toISOString()
        },
        quests
      };
    }
    case 'RECHARGE_FOCUS': {
      return {
        ...state,
        focus: FOCUS_BASELINE,
        lastAction: {
          type: 'recharge',
          xp: 0,
          gold: 0,
          timestamp: new Date().toISOString()
        }
      };
    }
    case 'CLAIM_QUEST': {
      const questId = action.id;
      const alreadyClaimed = state.claimedQuests.includes(questId);
      if (alreadyClaimed) return state;

      const entry = Object.values(state.quests)
        .flat()
        .find((quest) => quest.id === questId);
      if (!entry || entry.progress < entry.goal) {
        return state;
      }

      return {
        ...state,
        xp: state.xp + entry.xp,
        gold: state.gold + entry.gold,
        claimedQuests: [...state.claimedQuests, questId],
        lastAction: {
          type: 'quest-claim',
          xp: entry.xp,
          gold: entry.gold,
          timestamp: new Date().toISOString()
        }
      };
    }
    case 'BUY_EFFECT': {
      const effect = action.effect;
      const hasEffect = state.effects.some((fx) => fx.id === effect.id);
      if (hasEffect || state.gold < effect.cost) {
        return state;
      }
      return {
        ...state,
        gold: state.gold - effect.cost,
        effects: [
          ...state.effects,
          {
            ...effect,
            purchasedAt: Date.now(),
            expiresAt: effect.duration ? Date.now() + effect.duration * 1000 : undefined
          }
        ]
      };
    }
    case 'TICK_EFFECTS': {
      const now = Date.now();
      const active = state.effects.filter(
        (effect) => !effect.expiresAt || effect.expiresAt > now
      );
      if (active.length === state.effects.length) return state;
      return { ...state, effects: active };
    }
    case 'OPEN_CHEST': {
      const { id } = action;
      const chest = state.chests.find((c) => c.id === id);
      if (!chest) return state;
      const reward = resolveChestReward(chest);
      const remaining = state.chests.filter((c) => c.id !== id);
      const quests = incrementQuest(state.quests, 'e1', 1);
      const timestamp = new Date().toISOString();
      return {
        ...state,
        gold: state.gold + reward,
        chests: remaining,
        lastChestReward: { ...chest, reward, openedAt: timestamp },
        quests,
        lastAction: {
          type: 'chest',
          xp: 0,
          gold: reward,
          timestamp
        }
      };
    }
    case 'ADD_RANDOM_CHEST': {
      const rolled = rollChest(action.weight ?? 1);
      return {
        ...state,
        chests: [
          ...state.chests,
          { id: `chest-${Date.now()}`, rarity: rolled.key, gold: rolled.gold }
        ]
      };
    }
    case 'REDEEM_REWARD': {
      const reward = action.reward;
      const cost = Math.round(reward.minutes * (reward.pleasure ?? 1));
      if (state.gold < cost) return state;
      return {
        ...state,
        gold: state.gold - cost,
        redeemedReward: { reward, timestamp: new Date().toISOString() },
        lastAction: {
          type: 'reward',
          xp: 0,
          gold: -cost,
          timestamp: new Date().toISOString()
        }
      };
    }
    case 'RESET_REDEEMED_REWARD': {
      if (!state.redeemedReward) return state;
      return { ...state, redeemedReward: null };
    }
    default:
      return state;
  }
};

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const timer = setInterval(() => dispatch({ type: 'TICK_EFFECTS' }), 1000);
    return () => clearInterval(timer);
  }, []);

  const levelInfo = useMemo(() => lvl(state.xp), [state.xp]);

  const value = useMemo(
    () => ({
      state,
      levelInfo,
      gameEffects: GAME_EFFECTS,
      realRewards: REAL_REWARDS,
      premiumRewards: PREMIUM_REWARDS,
      logApplication: (payload, meta) => dispatch({ type: 'LOG_APPLICATION', payload, meta }),
      updateApplication: (id, updates) => dispatch({ type: 'UPDATE_APPLICATION', id, updates }),
      deleteApplication: (id) => dispatch({ type: 'DELETE_APPLICATION', id }),
      toggleFavorite: (id) => dispatch({ type: 'TOGGLE_FAVORITE', id }),
      recordNetworking: () => dispatch({ type: 'RECORD_NETWORKING' }),
      recordSkill: () => dispatch({ type: 'RECORD_SKILL' }),
      recordInterview: () => dispatch({ type: 'RECORD_INTERVIEW' }),
      rechargeFocus: () => dispatch({ type: 'RECHARGE_FOCUS' }),
      claimQuest: (id) => dispatch({ type: 'CLAIM_QUEST', id }),
      buyEffect: (effect) => dispatch({ type: 'BUY_EFFECT', effect }),
      openChest: (id) => dispatch({ type: 'OPEN_CHEST', id }),
      addRandomChest: (weight) => dispatch({ type: 'ADD_RANDOM_CHEST', weight }),
      redeemReward: (reward) => dispatch({ type: 'REDEEM_REWARD', reward }),
      resetRedeemedReward: () => dispatch({ type: 'RESET_REDEEMED_REWARD' })
    }),
    [state, levelInfo]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used inside GameProvider');
  }
  return ctx;
};



