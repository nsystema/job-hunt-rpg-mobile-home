import React from "react";
import { Gift, Clock, Coins, Zap, Star, Sparkles, TrendingUp, Award, ShoppingBag, Filter } from "lucide-react";
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

// Enhanced Card Component with better visual hierarchy
const ShopCard = ({ c, t, children, type = "default", isActive = false, isPremium = false, isAffordable = true }) => {
  const getBorderGradient = () => {
    if (isPremium) return `linear-gradient(135deg, ${c.sky}, ${c.emerald})`;
    if (type === "effect") return `linear-gradient(135deg, ${c.rose}, ${c.lilac})`;
    if (type === "reward") return `linear-gradient(135deg, ${c.emerald}, ${c.sky})`;
    return c.surfaceBorder;
  };

  const getBackgroundGradient = () => {
    if (isPremium) {
      return `linear-gradient(135deg, ${c.surface}dd, ${c.chipBg}cc), linear-gradient(45deg, ${c.sky}11, ${c.emerald}11)`;
    }
    return `linear-gradient(135deg, ${c.surface}ee, ${c.chipBg}dd)`;
  };

  return (
    <motion.div
      className="relative rounded-2xl p-5 backdrop-blur-sm overflow-hidden group"
      style={{
        background: getBackgroundGradient(),
        border: `2px solid transparent`,
        backgroundImage: `${getBackgroundGradient()}, ${getBorderGradient()}`,
        backgroundOrigin: "padding-box, border-box",
        backgroundClip: "padding-box, border-box",
        boxShadow: shadow(
          t,
          "0 12px 32px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.04), inset 0 1px 0 rgba(255,255,255,.1)",
          "0 12px 32px rgba(0,0,0,.3), 0 4px 12px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.05)"
        ),
        opacity: isAffordable ? 1 : 0.6
      }}
      whileHover={{ 
        scale: 1.02, 
        y: -2,
        boxShadow: shadow(
          t,
          "0 20px 40px rgba(0,0,0,.12), 0 8px 16px rgba(0,0,0,.06)",
          "0 20px 40px rgba(0,0,0,.4), 0 8px 16px rgba(0,0,0,.25)"
        )
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Animated background glow */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${isPremium ? c.sky : c.emerald}22, transparent 70%)`,
          borderRadius: "1rem"
        }}
      />
      
      {/* Premium badge */}
      {isPremium && (
        <div className="absolute top-3 right-3">
          <div 
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
            style={{
              background: `linear-gradient(90deg, ${c.sky}, ${c.emerald})`,
              color: "#0f172a"
            }}
          >
            <Star className="w-3 h-3" />
            Premium
          </div>
        </div>
      )}
      
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default function Shop({ c, eff, gold, setGold, effects, setEffects }) {
  const [now, setNow] = React.useState(Date.now());
  const [redeemed, setRedeemed] = React.useState(null);
  const [confirmReward, setConfirmReward] = React.useState(null);
  const [premiumProgress, setPremiumProgress] = React.useState({});
  const [savingItem, setSavingItem] = React.useState(null);
  const [saveAmount, setSaveAmount] = React.useState(0);
  const tabs = [
    { 
      key: "effects", 
      label: "Power-ups", 
      icon: Zap, 
      description: "Boost your performance",
      color: "rose"
    },
    { 
      key: "rewards", 
      label: "Rewards", 
      icon: Gift, 
      description: "Treat yourself",
      color: "emerald"
    },
    { 
      key: "premium", 
      label: "Premium", 
      icon: Star, 
      description: "Exclusive rewards",
      color: "sky"
    }
  ];
  const [activeTab, setActiveTab] = React.useState("effects");
  const [sortBy, setSortBy] = React.useState("price"); // price, name, popularity
  React.useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      setEffects((e) => e.filter((fx) => !fx.expiresAt || fx.expiresAt > Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [setEffects]);
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setConfirmReward(null);
        setRedeemed(null);
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
    const cost = Math.round(item.minutes * (item.pleasure ?? 1));
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
    const cost = Math.round(
      savingItem.minutes * (savingItem.pleasure ?? 1)
    );
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
  };



  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Section */}
      <motion.div 
        className="mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <div 
            className="p-3 rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${c.sky}, ${c.emerald})`,
              boxShadow: `0 8px 24px ${c.sky}44`
            }}
          >
            <ShoppingBag className="w-8 h-8 text-slate-900" />
          </div>
          <h1 
            className="text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(135deg, ${c.sky}, ${c.emerald})`
            }}
          >
            Power Shop
          </h1>
        </div>
        <p className="text-lg opacity-80" style={{ color: c.text }}>
          Enhance your job hunt with powerful upgrades and rewards
        </p>
      </motion.div>

      <div
        className="grid gap-6 p-6 rounded-3xl relative overflow-hidden"
        style={{
          background:
            `radial-gradient(circle at 0% 0%, ${c.rose}33, transparent 80%),` +
            `radial-gradient(circle at 100% 0%, ${c.sky}33, transparent 80%),` +
            `radial-gradient(circle at 100% 100%, ${c.emerald}33, transparent 80%),` +
            `radial-gradient(circle at 0% 100%, ${c.lilac}33, transparent 80%),` +
            `${c.surface}f5`,
          border: `1px solid ${c.surfaceBorder}`,
          boxShadow: shadow(
            eff,
            "0 20px 60px rgba(0,0,0,.08), 0 8px 24px rgba(0,0,0,.04), inset 0 1px 0 rgba(255,255,255,.1)",
            "0 24px 70px rgba(0,0,0,.3), 0 8px 24px rgba(0,0,0,.15), inset 0 1px 0 rgba(255,255,255,.05)"
          )
        }}
      >
        {/* Active Effects Display */}
        {effects.length > 0 && (
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div 
              className="p-4 rounded-2xl border"
              style={{
                background: `linear-gradient(135deg, ${c.surface}dd, ${c.chipBg}cc)`,
                border: `1px solid ${c.surfaceBorder}`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,.1)`
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5" style={{ color: c.emerald }} />
                <span className="font-semibold" style={{ color: c.text }}>
                  Active Power-ups
                </span>
              </div>
              <div className="flex items-center flex-wrap gap-3">
                {effects.map((e, i) => {
                  const Icon = e.icon || Zap;
                  const remaining = e.expiresAt
                    ? Math.max(0, (e.expiresAt - now) / 1000)
                    : null;
                  return (
                    <motion.div
                      key={i}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, ${c.emerald}22, ${c.sky}22)`,
                        border: `1px solid ${c.emerald}44`
                      }}
                      title={e.description}
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <div className="relative w-8 h-8 flex items-center justify-center">
                        {remaining !== null && e.duration && (
                          <svg className="absolute inset-0" viewBox="0 0 36 36">
                            <circle
                              cx="18"
                              cy="18"
                              r="16"
                              stroke={c.surfaceBorder}
                              strokeWidth="2"
                              fill="none"
                              opacity="0.3"
                            />
                            <circle
                              cx="18"
                              cy="18"
                              r="16"
                              stroke={c.emerald}
                              strokeWidth="2"
                              fill="none"
                              pathLength="1"
                              strokeDasharray="1"
                              strokeDashoffset={
                                1 - Math.max(0, Math.min(1, remaining / e.duration))
                              }
                            />
                          </svg>
                        )}
                        <span className="relative z-10">
                          <Icon className="w-4 h-4" style={{ color: c.emerald }} />
                        </span>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium" style={{ color: c.text }}>
                          {e.name}
                        </div>
                        {remaining !== null && (
                          <div
                            className="text-xs font-semibold tabular-nums"
                            style={{ color: c.emerald }}
                          >
                            {formatTime(Math.ceil(remaining))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Enhanced Tab Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2 flex-wrap" role="tablist">
            {tabs.map((t, index) => {
              const Icon = t.icon;
              const isActive = activeTab === t.key;
              return (
                <motion.button
                  key={t.key}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(t.key)}
                  className="relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group"
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, ${c[t.color]}, ${c.emerald})`
                      : `${c.surface}dd`,
                    border: `2px solid ${isActive ? 'transparent' : c.surfaceBorder}`,
                    color: isActive ? "#0f172a" : c.text,
                    boxShadow: isActive 
                      ? `0 8px 24px ${c[t.color]}44, inset 0 1px 0 rgba(255,255,255,.2)`
                      : `0 2px 8px rgba(0,0,0,.04)`
                  }}
                  whileHover={{ 
                    scale: 1.02, 
                    y: -1,
                    boxShadow: isActive 
                      ? `0 12px 32px ${c[t.color]}55, inset 0 1px 0 rgba(255,255,255,.3)`
                      : `0 8px 16px rgba(0,0,0,.08)`
                  }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 25,
                    delay: index * 0.1 
                  }}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, ${c[t.color]}22, ${c.emerald}22)`,
                      }}
                      layoutId="activeTab"
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    />
                  )}
                  
                  <div className="relative z-10 flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <div className="text-left">
                      <div className="font-semibold">{t.label}</div>
                      <div className="text-xs opacity-70 hidden sm:block">
                        {t.description}
                      </div>
                    </div>
                  </div>

                  {/* Hover glow effect */}
                  <div 
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `radial-gradient(circle at center, ${c[t.color]}11, transparent 70%)`
                    }}
                  />
                </motion.button>
              );
            })}
          </div>

          {/* Sort/Filter Controls */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1">
              <Filter className="w-4 h-4" style={{ color: c.text }} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm font-medium border-0 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{
                  background: `${c.surface}dd`,
                  color: c.text,
                  border: `1px solid ${c.surfaceBorder}`,
                  focusRing: c.sky
                }}
              >
                <option value="price">Sort by Price</option>
                <option value="name">Sort by Name</option>
                <option value="popularity">Most Popular</option>
              </select>
            </div>
          </div>
        </div>
        <AnimatePresence mode="wait">
          {activeTab === "effects" && (
            <motion.div
              key="effects"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {GAME_EFFECTS.slice()
                  .sort((a, b) => {
                    if (sortBy === "price") return a.cost - b.cost;
                    if (sortBy === "name") return a.name.localeCompare(b.name);
                    return a.cost - b.cost; // default to price
                  })
                  .map((item, index) => {
                    const active = effects.some((e) => e.id === item.id);
                    const isAffordable = gold >= item.cost && !active;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <ShopCard 
                          c={c} 
                          t={eff} 
                          type="effect"
                          isActive={active}
                          isAffordable={isAffordable}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{
                                  background: `linear-gradient(135deg, ${c.rose}, ${c.lilac})`,
                                  color: "#0f172a"
                                }}
                              >
                                <item.icon className="w-6 h-6" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold" style={{ color: c.text }}>
                                  {item.name}
                                </h3>
                                {active && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <div 
                                      className="w-2 h-2 rounded-full"
                                      style={{ background: c.emerald }}
                                    />
                                    <span className="text-xs font-medium" style={{ color: c.emerald }}>
                                      Active
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <GoldPill
                              c={c}
                              onClick={() => handleBuyEffect(item)}
                              dim={!isAffordable}
                            >
                              {item.cost}
                            </GoldPill>
                          </div>
                          
                          <p className="text-sm opacity-80 mb-3" style={{ color: c.text }}>
                            {item.description}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1" style={{ color: Grey }}>
                              <Clock className="w-3 h-3" />
                              Duration: {formatTime(item.duration)}
                            </div>
                            {active && (
                              <div className="flex items-center gap-1" style={{ color: c.emerald }}>
                                <TrendingUp className="w-3 h-3" />
                                Boosting
                              </div>
                            )}
                          </div>
                        </ShopCard>
                      </motion.div>
                    );
                  })}
              </div>
            </motion.div>
          )}
          {activeTab === "rewards" && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {REAL_REWARDS.slice()
                  .sort((a, b) => {
                    const costA = Math.round(a.minutes * (a.pleasure ?? 1));
                    const costB = Math.round(b.minutes * (b.pleasure ?? 1));
                    if (sortBy === "price") return costA - costB;
                    if (sortBy === "name") return a.name.localeCompare(b.name);
                    return costA - costB; // default to price
                  })
                  .map((item, index) => {
                    const cost = Math.round(item.minutes * (item.pleasure ?? 1));
                    const isAffordable = gold >= cost;
                    const pleasureLevel = item.pleasure || 1;
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <ShopCard 
                          c={c} 
                          t={eff} 
                          type="reward"
                          isAffordable={isAffordable}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{
                                  background: `linear-gradient(135deg, ${c.emerald}, ${c.sky})`,
                                  color: "#0f172a"
                                }}
                              >
                                <Gift className="w-6 h-6" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold" style={{ color: c.text }}>
                                  {item.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  {/* Pleasure rating */}
                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(pleasureLevel, 3) }, (_, i) => (
                                      <Star 
                                        key={i} 
                                        className="w-3 h-3" 
                                        style={{ 
                                          color: c.emerald,
                                          fill: c.emerald 
                                        }} 
                                      />
                                    ))}
                                  </div>
                                  {pleasureLevel > 1 && (
                                    <span 
                                      className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                                      style={{ 
                                        background: `${c.emerald}22`,
                                        color: c.emerald 
                                      }}
                                    >
                                      High Value
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <GoldPill
                              c={c}
                              onClick={() => setConfirmReward(item)}
                              dim={!isAffordable}
                            >
                              {cost}
                            </GoldPill>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm mb-3">
                            <div className="flex items-center gap-3" style={{ color: Grey }}>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{item.minutes} min</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Award className="w-4 h-4" />
                                <span>Reward</span>
                              </div>
                            </div>
                          </div>
                          
                          <div 
                            className="text-xs text-center py-2 px-3 rounded-lg font-medium"
                            style={{ 
                              background: `${c.emerald}11`,
                              color: c.emerald,
                              border: `1px solid ${c.emerald}33`
                            }}
                          >
                            💎 Treat yourself to some well-deserved relaxation
                          </div>
                        </ShopCard>
                      </motion.div>
                    );
                  })}
              </div>
            </motion.div>
          )}
          {activeTab === "premium" && (
            <motion.div
              key="premium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {PREMIUM_REWARDS.map((item, index) => {
                  const cost = Math.round(item.minutes * (item.pleasure ?? 1));
                  const progress = premiumProgress[item.id] || 0;
                  const isCompleted = progress >= cost;
                  const progressPercent = cost > 0 ? Math.min((progress / cost) * 100, 100) : 100;
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ShopCard 
                        c={c} 
                        t={eff} 
                        type="premium"
                        isPremium={true}
                        isAffordable={gold > 0 || isCompleted}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center"
                              style={{
                                background: `linear-gradient(135deg, ${c.sky}, ${c.emerald})`,
                                color: "#0f172a"
                              }}
                            >
                              <Gift className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold" style={{ color: c.text }}>
                                {item.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <Star 
                                      key={i} 
                                      className="w-3 h-3" 
                                      style={{ 
                                        color: c.sky,
                                        fill: c.sky 
                                      }} 
                                    />
                                  ))}
                                </div>
                                <span 
                                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                                  style={{ 
                                    background: `linear-gradient(90deg, ${c.sky}, ${c.emerald})`,
                                    color: "#0f172a"
                                  }}
                                >
                                  PREMIUM
                                </span>
                              </div>
                            </div>
                          </div>
                          <GoldPill
                            c={c}
                            onClick={() => handlePremiumAction(item)}
                            dim={isCompleted ? false : gold <= 0}
                          >
                            {isCompleted ? "Claim" : "Save"}
                          </GoldPill>
                        </div>

                        {/* Progress Section */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span style={{ color: c.text }}>Progress</span>
                            <span style={{ color: c.text }}>{Math.round(progressPercent)}%</span>
                          </div>
                          <div
                            className="w-full h-3 rounded-full overflow-hidden"
                            style={{ background: c.surfaceBorder }}
                          >
                            <motion.div
                              className="h-full rounded-full"
                              style={{
                                background: `linear-gradient(90deg, ${c.sky}, ${c.emerald})`
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercent}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs mt-2">
                            <span className="font-semibold" style={{ color: c.text }}>
                              {Math.max(progress, 0).toLocaleString()}g saved
                            </span>
                            <span className="opacity-70" style={{ color: c.text }}>
                              {Math.max(cost - progress, 0) === 0
                                ? "🎉 Ready to claim!"
                                : `${Math.max(cost - progress, 0).toLocaleString()}g to go`}
                            </span>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3" style={{ color: Grey }}>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{item.minutes} min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Coins className="w-4 h-4" />
                              <span>{cost}g total</span>
                            </div>
                          </div>
                        </div>
                        
                        {isCompleted && (
                          <div 
                            className="text-xs text-center py-2 px-3 rounded-lg font-bold mt-3"
                            style={{ 
                              background: `linear-gradient(90deg, ${c.sky}22, ${c.emerald}22)`,
                              color: c.sky,
                              border: `1px solid ${c.sky}44`
                            }}
                          >
                            🌟 Premium reward ready to claim!
                          </div>
                        )}
                      </ShopCard>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Enhanced Modals */}
      <AnimatePresence>
        {savingItem && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: eff === "light" ? "rgba(0,0,0,.4)" : "rgba(0,0,0,.7)",
              backdropFilter: "blur(8px)"
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSavingItem(null)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              className="w-full max-w-md rounded-2xl p-6 text-center space-y-6"
              style={{
                background: `linear-gradient(135deg, ${c.surface}f8, ${c.chipBg}f5)`,
                border: `2px solid ${c.surfaceBorder}`,
                boxShadow: shadow(
                  eff,
                  "0 20px 60px rgba(0,0,0,.15), 0 8px 24px rgba(0,0,0,.08)",
                  "0 20px 60px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.2)"
                )
              }}
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <div 
                  className="p-3 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${c.sky}, ${c.emerald})`,
                  }}
                >
                  <Coins className="w-6 h-6 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: c.text }}>
                    Save Gold
                  </h3>
                  <p className="text-sm opacity-80" style={{ color: c.text }}>
                    for {savingItem?.name}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <input
                    type="range"
                    min="0"
                    max={Math.min(
                      gold,
                      Math.round(
                        savingItem.minutes * (savingItem.pleasure ?? 1)
                      ) - (premiumProgress[savingItem.id] || 0)
                    )}
                    value={saveAmount}
                    onChange={(e) => setSaveAmount(Number(e.target.value))}
                    className="w-full h-3 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${c.sky}44 0%, ${c.emerald}44 100%)`,
                      outline: "none"
                    }}
                  />
                  <div className="flex justify-between text-xs mt-2" style={{ color: Grey }}>
                    <span>0g</span>
                    <span>{Math.min(
                      gold,
                      Math.round(
                        savingItem.minutes * (savingItem.pleasure ?? 1)
                      ) - (premiumProgress[savingItem.id] || 0)
                    )}g</span>
                  </div>
                </div>
                
                <div 
                  className="text-2xl font-bold py-3 px-4 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${c.sky}22, ${c.emerald}22)`,
                    color: c.text,
                    border: `1px solid ${c.sky}44`
                  }}
                >
                  {saveAmount.toLocaleString()}g
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setSavingItem(null)}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{
                    background: `${c.surface}dd`,
                    border: `1px solid ${c.surfaceBorder}`,
                    color: c.text
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSave}
                  disabled={saveAmount <= 0}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all duration-200"
                  style={{
                    background: `linear-gradient(135deg, ${c.sky}, ${c.emerald})`,
                    border: `1px solid transparent`,
                    color: "#0f172a",
                    boxShadow: `0 4px 12px ${c.sky}44`
                  }}
                >
                  Save Gold
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    <AnimatePresence>
        {confirmReward && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: eff === "light" ? "rgba(0,0,0,.4)" : "rgba(0,0,0,.7)",
              backdropFilter: "blur(8px)"
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmReward(null)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              className="w-full max-w-md rounded-2xl p-6 text-center space-y-6"
              style={{
                background: `linear-gradient(135deg, ${c.surface}f8, ${c.chipBg}f5)`,
                border: `2px solid ${c.surfaceBorder}`,
                boxShadow: shadow(
                  eff,
                  "0 20px 60px rgba(0,0,0,.15), 0 8px 24px rgba(0,0,0,.08)",
                  "0 20px 60px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.2)"
                )
              }}
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <div 
                  className="p-3 rounded-xl"
                  style={{
                    background: confirmReward.premium 
                      ? `linear-gradient(135deg, ${c.sky}, ${c.emerald})`
                      : `linear-gradient(135deg, ${c.emerald}, ${c.sky})`,
                  }}
                >
                  <Gift className="w-6 h-6 text-slate-900" />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-bold mb-2" style={{ color: c.text }}>
                  Confirm Purchase
                </h3>
                <p className="text-sm opacity-90" style={{ color: c.text }}>
                  {confirmReward.premium
                    ? `Redeem ${confirmReward.name}?`
                    : `Spend ${Math.round(
                        confirmReward.minutes * (confirmReward.pleasure ?? 1)
                      ).toLocaleString()}g for ${confirmReward.name}?`}
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmReward(null)}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{
                    background: `${c.surface}dd`,
                    border: `1px solid ${c.surfaceBorder}`,
                    color: c.text
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
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{
                    background: confirmReward.premium 
                      ? `linear-gradient(135deg, ${c.sky}, ${c.emerald})`
                      : `linear-gradient(135deg, ${c.emerald}, ${c.sky})`,
                    border: `1px solid transparent`,
                    color: "#0f172a",
                    boxShadow: `0 4px 12px ${confirmReward.premium ? c.sky : c.emerald}44`
                  }}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {redeemed && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: eff === "light" ? "rgba(0,0,0,.4)" : "rgba(0,0,0,.7)",
              backdropFilter: "blur(8px)"
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRedeemed(null)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              className="w-full max-w-md rounded-2xl p-6 text-center space-y-6"
              style={{
                background: `linear-gradient(135deg, ${c.surface}f8, ${c.chipBg}f5)`,
                border: `2px solid ${c.surfaceBorder}`,
                boxShadow: shadow(
                  eff,
                  "0 20px 60px rgba(0,0,0,.15), 0 8px 24px rgba(0,0,0,.08)",
                  "0 20px 60px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.2)"
                )
              }}
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <div 
                  className="p-4 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${c.emerald}, ${c.sky})`,
                  }}
                >
                  <Sparkles className="w-8 h-8 text-slate-900" />
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-2" style={{ color: c.text }}>
                  🎉 Success!
                </h3>
                <p className="text-lg opacity-90" style={{ color: c.text }}>
                  Enjoy your {redeemed.name}!
                </p>
                <p className="text-sm opacity-70 mt-2" style={{ color: c.text }}>
                  You've earned this reward. Take your time and enjoy it!
                </p>
              </div>
              
              <button
                onClick={() => setRedeemed(null)}
                className="w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: `linear-gradient(135deg, ${c.emerald}, ${c.sky})`,
                  border: `1px solid transparent`,
                  color: "#0f172a",
                  boxShadow: `0 4px 12px ${c.emerald}44`
                }}
              >
                Awesome!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

