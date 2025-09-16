import React from "react";
import {
  Gift,
  Clock,
  Coins,
  Zap,
  Crown,
  Sparkles,
  PiggyBank
} from "lucide-react";
import { Grey } from "./data.jsx";
import GoldPill from "./components/GoldPill.jsx";
import PremiumRewardCard from "./components/PremiumRewardCard.jsx";
import {
  GAME_EFFECTS,
  REAL_REWARDS,
  PREMIUM_REWARDS,
  formatTime,
  buyEffect,
  redeemReward
} from "./gameMechanics.js";
import { motion, AnimatePresence } from "framer-motion";

const shadow = (t, l, d) => (t === "light" ? l : d);
const costFor = (item) => Math.round(item.minutes * (item.pleasure ?? 1));
const formatGoldValue = (value) =>
  Math.max(0, value).toLocaleString(undefined, {
    maximumFractionDigits: 0
  });
const formatGold = (value) => `${formatGoldValue(value)}g`;

const Panel = ({
  c,
  t,
  children,
  className = "",
  style = {},
  hover = { scale: 1.02 },
  tap = { scale: 0.98 },
  transition = { type: "spring", stiffness: 300, damping: 20 },
  ...rest
}) => (
  <motion.section
    className={`rounded-2xl ${className}`}
    style={{
      background: `linear-gradient(135deg, ${c.surface}, ${c.chipBg})`,
      border: `1px solid ${c.surfaceBorder}`,
      boxShadow: shadow(
        t,
        "0 14px 38px rgba(0,0,0,.12),0 3px 10px rgba(0,0,0,.06)",
        "0 18px 50px rgba(0,0,0,.46),0 4px 12px rgba(0,0,0,.32)"
      ),
      ...style
    }}
    whileHover={hover}
    whileTap={tap}
    transition={transition}
    {...rest}
  >
    {children}
  </motion.section>
);

const StatCard = ({ c, t, icon: Icon, label, value, helper }) => (
  <div
    className="flex items-center gap-3 rounded-2xl p-3"
    style={{
      background: `linear-gradient(135deg, ${c.surface}, ${c.chipBg})`,
      border: `1px solid ${c.surfaceBorder}`,
      boxShadow: shadow(
        t,
        "0 12px 32px rgba(0,0,0,.12),0 4px 12px rgba(0,0,0,.08)",
        "0 16px 40px rgba(0,0,0,.48),0 6px 16px rgba(0,0,0,.32)"
      ),
      color: c.text
    }}
  >
    <div
      className="grid h-11 w-11 place-items-center rounded-xl"
      style={{
        background: `linear-gradient(135deg, ${c.sky}, ${c.emerald})`,
        color: "#0f172a"
      }}
    >
      <Icon className="w-5 h-5" aria-hidden="true" />
    </div>
    <div className="min-w-0">
      <div
        className="text-[11px] uppercase tracking-wide font-semibold"
        style={{ color: Grey }}
      >
        {label}
      </div>
      <div className="text-sm font-semibold leading-tight truncate">
        {value}
      </div>
      {helper && (
        <div
          className="text-[11px] mt-0.5 leading-tight opacity-80 truncate"
          style={{ color: c.text }}
        >
          {helper}
        </div>
      )}
    </div>
  </div>
);

export default function Shop({ c, eff, gold, setGold, effects, setEffects }) {
  const [now, setNow] = React.useState(Date.now());
  const [redeemed, setRedeemed] = React.useState(null);
  const [confirmReward, setConfirmReward] = React.useState(null);
  const [premiumProgress, setPremiumProgress] = React.useState({});
  const [savingItem, setSavingItem] = React.useState(null);
  const [saveAmount, setSaveAmount] = React.useState(0);

  const tabs = [
    { key: "effects", label: "Boosts", icon: Zap },
    { key: "rewards", label: "Treats", icon: Gift },
    { key: "premium", label: "Premium", icon: Crown }
  ];
  const mainTabs = [
    { key: "active", label: "Active", icon: Sparkles },
    { key: "catalogue", label: "Catalogue", icon: PiggyBank }
  ];
  const [activeTab, setActiveTab] = React.useState("effects");
  const [mainTab, setMainTab] = React.useState("catalogue");

  React.useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      setEffects((e) =>
        e.filter((fx) => !fx.expiresAt || fx.expiresAt > Date.now())
      );
    }, 1000);
    return () => clearInterval(id);
  }, [setEffects]);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setConfirmReward(null);
        setRedeemed(null);
        setSavingItem(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleBuyEffect = (item) =>
    buyEffect(item, gold, setGold, effects, setEffects);
  const handleRedeemReward = (r) =>
    redeemReward(r, gold, setGold, setRedeemed);

  const handlePremiumAction = (item) => {
    const cost = costFor(item);
    const progress = premiumProgress[item.id] || 0;
    if (progress >= cost) {
      setConfirmReward({ ...item, premium: true });
    } else {
      setSavingItem(item);
      setSaveAmount(Math.min(gold, cost - progress));
    }
  };

  const confirmSave = () => {
    if (!savingItem) return;
    const cost = costFor(savingItem);
    const progress = premiumProgress[savingItem.id] || 0;
    const max = Math.min(gold, cost - progress);
    const amount = Math.max(0, Math.min(saveAmount, max));
    if (amount > 0) {
      setGold((g) => g - amount);
      setPremiumProgress((p) => ({
        ...p,
        [savingItem.id]: progress + amount
      }));
    }
    setSavingItem(null);
    setSaveAmount(0);
  };

  const sortedRewards = React.useMemo(
    () =>
      REAL_REWARDS.slice().sort((a, b) => costFor(a) - costFor(b)),
    []
  );
  const nextTreat = React.useMemo(() => {
    const affordable = sortedRewards.find((item) => gold >= costFor(item));
    return affordable || sortedRewards[0];
  }, [gold, sortedRewards]);

  const totalSaved = React.useMemo(
    () =>
      PREMIUM_REWARDS.reduce(
        (acc, item) =>
          acc + Math.min(premiumProgress[item.id] || 0, costFor(item)),
        0
      ),
    [premiumProgress]
  );
  const nextPremiumTarget = React.useMemo(
    () =>
      PREMIUM_REWARDS.find(
        (item) => (premiumProgress[item.id] || 0) < costFor(item)
      ) || PREMIUM_REWARDS[0],
    [premiumProgress]
  );
  const nextPremiumRemaining = nextPremiumTarget
    ? Math.max(
        costFor(nextPremiumTarget) - (premiumProgress[nextPremiumTarget.id] || 0),
        0
      )
    : 0;

  const savingProgress = savingItem ? premiumProgress[savingItem.id] || 0 : 0;
  const savingCap = savingItem
    ? Math.max(costFor(savingItem) - savingProgress, 0)
    : 0;
  const effectiveSaveAmount = Math.min(saveAmount, Math.min(gold, savingCap));
  const ConfirmIcon = confirmReward?.premium ? Crown : Gift;
  const confirmCost = confirmReward ? costFor(confirmReward) : 0;

  return (
    <div
      className="grid w-full gap-6 p-4 rounded-3xl relative overflow-hidden"
      style={{
        background:
          `radial-gradient(circle at 0% 0%, ${c.rose}40, transparent 65%),` +
          `radial-gradient(circle at 100% 0%, ${c.sky}40, transparent 65%),` +
          `radial-gradient(circle at 100% 100%, ${c.emerald}35, transparent 65%),` +
          `radial-gradient(circle at 0% 100%, ${c.lilac}40, transparent 65%)`,
        border: `1px solid ${c.surfaceBorder}`,
        boxShadow: shadow(
          eff,
          "0 24px 70px rgba(0,0,0,.12),0 10px 26px rgba(0,0,0,.08)",
          "0 28px 80px rgba(0,0,0,.46),0 12px 30px rgba(0,0,0,.32)"
        )
      }}
    >
      <div
        className="flex w-full items-center gap-1 p-1 rounded-full"
        role="tablist"
        aria-label="Shop sections"
        style={{
          background: c.surface,
          border: `1px solid ${c.surfaceBorder}`
        }}
      >
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const active = mainTab === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={active}
              onClick={() => setMainTab(tab.key)}
              className="flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors"
              style={{
                background: active
                  ? `linear-gradient(90deg, ${c.sky}, ${c.emerald})`
                  : "transparent",
                color: active ? "#0f172a" : c.text
              }}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        {mainTab === "active" && (
          <motion.section
            key="active"
            className="space-y-4 min-w-0 w-full"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div
                  className="text-[11px] uppercase tracking-wide font-semibold"
                  style={{ color: Grey }}
                >
                  Active effects
                </div>
                <div
                  className="text-sm font-semibold leading-tight"
                  style={{ color: c.text }}
                >
                  Track your current boosts in real time.
                </div>
              </div>
            </div>
            {effects.length === 0 ? (
              <Panel
                c={c}
                t={eff}
                className="p-5 flex flex-col gap-3"
                hover={{ scale: 1.01 }}
                tap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-semibold" style={{ color: c.text }}>
                    No active boosts yet
                  </span>
                </div>
                <p className="text-sm leading-snug" style={{ color: Grey }}>
                  Activate a boost to double down on XP or gold. Your effects will
                  appear here with live timers once purchased.
                </p>
                <button
                  onClick={() => {
                    setMainTab("catalogue");
                    setActiveTab("effects");
                  }}
                  className="self-start px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{
                    background: `linear-gradient(90deg, ${c.sky}, ${c.emerald})`,
                    border: `1px solid ${c.surfaceBorder}`,
                    color: "#0f172a",
                    boxShadow: "0 12px 24px rgba(15,23,42,.18)"
                  }}
                >
                  Browse boosts
                </button>
              </Panel>
            ) : (
              <div className="flex w-full flex-wrap gap-3 pb-2">
                {effects.map((e) => {
                  const Icon = e.icon || Zap;
                  const remaining = e.expiresAt
                    ? Math.max(0, (e.expiresAt - now) / 1000)
                    : null;
                  const progress =
                    e.duration && remaining !== null
                      ? Math.max(0, Math.min(1, remaining / e.duration))
                      : null;
                  const angle = progress !== null ? progress * 360 : 360;
                  const ringBackground =
                    progress !== null
                      ? `conic-gradient(from -90deg, ${c.sky} 0deg, ${c.emerald} ${angle}deg, ${c.surfaceBorder} ${angle}deg 360deg)`
                      : `linear-gradient(135deg, ${c.sky}, ${c.emerald})`;
                  const tooltip = [
                    e.description,
                    remaining !== null ? `${formatTime(Math.ceil(remaining))} left` : null
                  ]
                    .filter(Boolean)
                    .join(" • ");
                  return (
                    <motion.div
                      key={e.id}
                      className="flex flex-col items-center gap-2 rounded-2xl p-3"
                      style={{
                        background: `linear-gradient(135deg, ${c.surface}, ${c.chipBg})`,
                        border: `1px solid ${c.surfaceBorder}`,
                        boxShadow: shadow(
                          eff,
                          "0 12px 32px rgba(0,0,0,.12),0 4px 10px rgba(0,0,0,.06)",
                          "0 16px 40px rgba(0,0,0,.46),0 5px 14px rgba(0,0,0,.32)"
                        ),
                        color: c.text,
                        minWidth: 112
                      }}
                      whileHover={{ translateY: -4 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                      title={tooltip ? `${e.name} • ${tooltip}` : e.name}
                    >
                      <div
                        className="rounded-full p-[3px]"
                        style={{
                          background: ringBackground,
                          transition: "background 0.35s ease"
                        }}
                      >
                        <div
                          className="grid h-12 w-12 place-items-center rounded-full"
                          style={{
                            background: `linear-gradient(135deg, ${c.surface}, ${c.chipBg})`,
                            border: `1px solid ${c.surfaceBorder}`,
                            color: "#0f172a"
                          }}
                        >
                          <Icon className="w-5 h-5" aria-hidden="true" />
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1 text-center">
                        <span
                          className="text-xs font-semibold leading-tight"
                          style={{ color: c.text }}
                        >
                          {e.name}
                        </span>
                        {remaining !== null && e.duration ? (
                          <span
                            className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide"
                            style={{ color: Grey }}
                          >
                            <Clock className="w-3 h-3" aria-hidden="true" />
                            {formatTime(Math.ceil(remaining))}
                          </span>
                        ) : (
                          <span
                            className="text-[10px] uppercase tracking-wide"
                            style={{ color: Grey }}
                          >
                            Passive boost
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.section>
        )}
        {mainTab === "catalogue" && (
          <motion.section
            key="catalogue"
            className="space-y-4 min-w-0 w-full"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <div>
              <div
                className="text-[11px] uppercase tracking-wide font-semibold"
                style={{ color: Grey }}
              >
                Catalogue
              </div>
              <div
                className="text-sm font-semibold leading-tight"
                style={{ color: c.text }}
              >
                Choose how you want to level the journey today.
              </div>
            </div>
            <div
              className="flex w-full items-center gap-1 p-1 rounded-full"
              role="tablist"
              aria-label="Shop categories"
              style={{
                background: c.surface,
                border: `1px solid ${c.surfaceBorder}`
              }}
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(tab.key)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors"
                    style={{
                      background: active
                        ? `linear-gradient(90deg, ${c.sky}, ${c.emerald})`
                        : "transparent",
                      color: active ? "#0f172a" : c.text
                    }}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <AnimatePresence mode="wait">
              {activeTab === "effects" && (
                <motion.div
                  key="effects"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="min-w-0 w-full"
                >
                  <div className="grid w-full gap-3 min-w-0">
                    {GAME_EFFECTS.slice()
                      .sort((a, b) => a.cost - b.cost)
                      .map((item) => {
                        const Icon = item.icon || Zap;
                        const active = effects.some((e) => e.id === item.id);
                        const durationLabel = item.duration
                          ? item.duration >= 3600
                            ? `${Math.round(item.duration / 3600)} hr`
                            : `${Math.round(item.duration / 60)} min`
                          : "Instant";
                        return (
                          <Panel
                            key={item.id}
                            c={c}
                            t={eff}
                            className="p-4 space-y-3"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className="grid h-11 w-11 place-items-center rounded-xl"
                                style={{
                                  background: `linear-gradient(135deg, ${c.sky}, ${c.emerald})`,
                                  color: "#0f172a"
                                }}
                              >
                                <Icon className="w-5 h-5" aria-hidden="true" />
                              </div>
                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div
                                    className="text-sm font-semibold leading-tight"
                                    style={{ color: c.text }}
                                  >
                                    {item.name}
                                  </div>
                                  {active && (
                                    <span
                                      className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full"
                                      style={{
                                        background: c.surface,
                                        border: `1px solid ${c.surfaceBorder}`,
                                        color: c.text
                                      }}
                                    >
                                      In progress
                                    </span>
                                  )}
                                </div>
                                <p
                                  className="text-xs leading-snug"
                                  style={{ color: Grey }}
                                >
                                  {item.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-end justify-between">
                              <div
                                className="flex flex-wrap items-center gap-3 text-xs"
                                style={{ color: c.text }}
                              >
                                <span className="inline-flex items-center gap-1 opacity-80">
                                  <Clock className="w-3 h-3" aria-hidden="true" />
                                  {durationLabel}
                                </span>
                                <span className="inline-flex items-center gap-1 opacity-80">
                                  <Coins className="w-3 h-3" aria-hidden="true" />
                                  {formatGold(item.cost)}
                                </span>
                              </div>
                              <GoldPill
                                c={c}
                                onClick={() => handleBuyEffect(item)}
                                dim={gold < item.cost || active}
                              >
                                {active ? "Owned" : `${item.cost}g`}
                              </GoldPill>
                            </div>
                          </Panel>
                        );
                      })}
                  </div>
                </motion.div>
              )}
              {activeTab === "rewards" && (
                <motion.div
                  key="rewards"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="min-w-0 w-full"
                >
                  <div className="grid w-full gap-3 min-w-0">
                    {sortedRewards.map((item) => {
                      const cost = costFor(item);
                      return (
                        <Panel
                          key={item.id}
                          c={c}
                          t={eff}
                          className="p-4 space-y-3"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="grid h-11 w-11 place-items-center rounded-xl"
                              style={{
                                background: `linear-gradient(135deg, ${c.rose}, ${c.lilac})`,
                                color: "#0f172a"
                              }}
                            >
                              <Gift className="w-5 h-5" aria-hidden="true" />
                            </div>
                            <div className="min-w-0 space-y-1">
                              <div
                                className="text-sm font-semibold leading-tight"
                                style={{ color: c.text }}
                              >
                                {item.name}
                              </div>
                              <p
                                className="text-xs leading-snug"
                                style={{ color: Grey }}
                              >
                                Reward yourself with {item.minutes} minutes of joy.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-end justify-between">
                            <div
                              className="flex flex-wrap items-center gap-3 text-xs"
                              style={{ color: c.text }}
                            >
                              <span className="inline-flex items-center gap-1 opacity-80">
                                <Clock className="w-3 h-3" aria-hidden="true" />
                                {item.minutes} min
                              </span>
                              <span className="inline-flex items-center gap-1 opacity-80">
                                <Coins className="w-3 h-3" aria-hidden="true" />
                                {formatGold(cost)}
                              </span>
                            </div>
                            <GoldPill
                              c={c}
                              onClick={() => setConfirmReward(item)}
                              dim={gold < cost}
                            >
                              {`${cost}g`}
                            </GoldPill>
                          </div>
                        </Panel>
                      );
                    })}
                  </div>
                </motion.div>
              )}
              {activeTab === "premium" && (
                <motion.div
                  key="premium"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="min-w-0 w-full"
                >
                  <div className="grid w-full gap-3 min-w-0">
                    {PREMIUM_REWARDS.map((item) => {
                      const cost = costFor(item);
                      const progress = premiumProgress[item.id] || 0;
                      return (
                        <PremiumRewardCard
                          key={item.id}
                          c={c}
                          eff={eff}
                          item={item}
                          cost={cost}
                          progress={progress}
                          gold={gold}
                          onAction={handlePremiumAction}
                        />
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {savingItem && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{
              background:
                eff === "light" ? "rgba(0,0,0,.25)" : "rgba(0,0,0,.55)",
              backdropFilter: "blur(2px)"
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setSavingItem(null);
              setSaveAmount(0);
            }}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              className="w-full max-w-[360px] rounded-3xl p-5 space-y-5 text-left"
              style={{
                background: c.surface,
                border: `1px solid ${c.surfaceBorder}`,
                boxShadow: shadow(
                  eff,
                  "0 18px 48px rgba(0,0,0,.14),0 6px 18px rgba(0,0,0,.08)",
                  "0 22px 60px rgba(0,0,0,.48),0 10px 24px rgba(0,0,0,.32)"
                )
              }}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <div
                  className="grid h-10 w-10 place-items-center rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${c.sky}, ${c.emerald})`,
                    color: "#0f172a"
                  }}
                >
                  <PiggyBank className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <div
                    className="text-sm font-semibold leading-tight"
                    style={{ color: c.text }}
                  >
                    Save gold for {savingItem?.name}
                  </div>
                  <p className="text-xs leading-snug" style={{ color: Grey }}>
                    Decide how much to stash away right now. You can come back
                    later to add more.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, Math.min(gold, savingCap))}
                  value={effectiveSaveAmount}
                  onChange={(e) => setSaveAmount(Number(e.target.value))}
                  className="w-full"
                  aria-label="Gold to save"
                />
                <div
                  className="flex items-center justify-between text-xs"
                  style={{ color: c.text }}
                >
                  <span className="font-semibold">
                    {formatGoldValue(effectiveSaveAmount)}
                  </span>
                  <span className="opacity-70">
                    {formatGoldValue(Math.min(gold, savingCap))} available now
                  </span>
                </div>
                <div className="text-[11px]" style={{ color: Grey }}>
                  Already saved {formatGoldValue(savingProgress)} / {formatGoldValue(costFor(savingItem))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setSavingItem(null);
                    setSaveAmount(0);
                  }}
                  className="px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{
                    background: c.surface,
                    border: `1px solid ${c.surfaceBorder}`
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSave}
                  disabled={effectiveSaveAmount <= 0}
                  className="px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                  style={{
                    background: `linear-gradient(90deg, ${c.sky}, ${c.emerald})`,
                    border: `1px solid ${c.surfaceBorder}`,
                    color: "#0f172a"
                  }}
                >
                  Save amount
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmReward && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{
              background:
                eff === "light" ? "rgba(0,0,0,.25)" : "rgba(0,0,0,.55)",
              backdropFilter: "blur(2px)"
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmReward(null)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              className="w-full max-w-[360px] rounded-3xl p-5 space-y-5 text-center"
              style={{
                background: c.surface,
                border: `1px solid ${c.surfaceBorder}`,
                boxShadow: shadow(
                  eff,
                  "0 18px 48px rgba(0,0,0,.14),0 6px 18px rgba(0,0,0,.08)",
                  "0 22px 60px rgba(0,0,0,.48),0 10px 24px rgba(0,0,0,.32)"
                )
              }}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center">
                <div
                  className="grid h-12 w-12 place-items-center rounded-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${c.sky}, ${c.emerald})`,
                    color: "#0f172a"
                  }}
                >
                  <ConfirmIcon className="w-6 h-6" aria-hidden="true" />
                </div>
              </div>
              <div
                className="text-sm font-semibold leading-snug"
                style={{ color: c.text }}
              >
                {confirmReward.premium
                  ? `Redeem ${confirmReward.name}?`
                  : `Spend ${formatGold(confirmCost)} for ${confirmReward.name}?`}
              </div>
              {!confirmReward.premium && (
                <div className="text-xs" style={{ color: Grey }}>
                  {confirmReward.minutes} minutes of joy await.
                </div>
              )}
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setConfirmReward(null)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{
                    background: c.surface,
                    border: `1px solid ${c.surfaceBorder}`
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmReward.premium) {
                      setRedeemed(confirmReward);
                      setPremiumProgress((p) => ({
                        ...p,
                        [confirmReward.id]: 0
                      }));
                    } else {
                      handleRedeemReward(confirmReward);
                    }
                    setConfirmReward(null);
                  }}
                  className="px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{
                    background: `linear-gradient(90deg, ${c.sky}, ${c.emerald})`,
                    border: `1px solid ${c.surfaceBorder}`,
                    color: "#0f172a"
                  }}
                >
                  Yes, do it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {redeemed && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{
              background:
                eff === "light" ? "rgba(0,0,0,.25)" : "rgba(0,0,0,.55)",
              backdropFilter: "blur(2px)"
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRedeemed(null)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              className="w-full max-w-[320px] rounded-3xl p-5 space-y-4 text-center"
              style={{
                background: c.surface,
                border: `1px solid ${c.surfaceBorder}`,
                boxShadow: shadow(
                  eff,
                  "0 18px 48px rgba(0,0,0,.14),0 6px 18px rgba(0,0,0,.08)",
                  "0 22px 60px rgba(0,0,0,.48),0 10px 24px rgba(0,0,0,.32)"
                )
              }}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="text-sm font-semibold leading-snug"
                style={{ color: c.text }}
              >
                Enjoy {redeemed.name}!
              </div>
              <p className="text-xs" style={{ color: Grey }}>
                You earned it. Log it in your journal once you&apos;re back.
              </p>
              <button
                onClick={() => setRedeemed(null)}
                className="px-3 py-2 rounded-lg text-sm font-semibold"
                style={{
                  background: `linear-gradient(90deg, ${c.sky}, ${c.emerald})`,
                  border: `1px solid ${c.surfaceBorder}`,
                  color: "#0f172a"
                }}
              >
                Back to shopping
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
