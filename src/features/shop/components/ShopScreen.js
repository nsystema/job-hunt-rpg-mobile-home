import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ensureOpaque, hexToRgba } from '../../../utils/color';
import { formatGold, formatGoldValue } from '../../../utils/formatters';
import ShopActiveEffects from './ShopActiveEffects';
import ShopCatalogue from './ShopCatalogue';
import ShopSavingsModal from './ShopSavingsModal';
import {
  GAME_EFFECTS,
  REAL_REWARDS,
  PREMIUM_REWARDS,
  buyEffect,
  redeemReward,
} from '../../progression';

const SHOP_MAIN_TABS = [
  { key: 'active', label: 'Active', icon: 'auto-fix' },
  { key: 'catalogue', label: 'Catalogue', icon: 'view-grid-outline' },
];

const costFor = (item) => Math.round(item.minutes * (item.pleasure ?? 1));

const ShopScreen = ({
  colors,
  eff,
  gold,
  setGold,
  effects,
  setEffects,
  premiumProgress,
  setPremiumProgress,
  mainTab,
  setMainTab,
  categoryTab,
  setCategoryTab,
}) => {
  const [savingItem, setSavingItem] = useState(null);
  const [saveAmount, setSaveAmount] = useState(0);
  const [confirmReward, setConfirmReward] = useState(null);
  const [redeemed, setRedeemed] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const hasTimers = useMemo(() => effects.some((effect) => effect.expiresAt), [effects]);

  useEffect(() => {
    if (!hasTimers) {
      return;
    }
    setNow(Date.now());
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [hasTimers]);

  const sortedRewards = useMemo(
    () => REAL_REWARDS.slice().sort((a, b) => costFor(a) - costFor(b)),
    [],
  );

  const cardShadow = useMemo(
    () =>
      eff === 'light'
        ? {
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 4,
          }
        : {
            shadowColor: '#000',
            shadowOpacity: 0.35,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 6,
          },
    [eff],
  );

  const filledSurface = useMemo(
    () => (eff === 'light' ? ensureOpaque(colors.surface) : colors.surface),
    [eff, colors.surface],
  );

  const handleBuyEffect = useCallback(
    (item) => {
      buyEffect(item, gold, setGold, effects, setEffects);
    },
    [gold, setGold, effects, setEffects],
  );

  const handleRedeemReward = useCallback(
    (item) => {
      redeemReward(item, gold, setGold, setRedeemed);
    },
    [gold, setGold],
  );

  const handlePremiumAction = useCallback(
    (item) => {
      const cost = costFor(item);
      const progress = premiumProgress[item.id] || 0;
      if (progress >= cost) {
        setConfirmReward({ ...item, premium: true });
      } else {
        setSavingItem(item);
        setSaveAmount(Math.min(gold, cost - progress));
      }
    },
    [premiumProgress, gold],
  );

  const closeSavingModal = useCallback(() => {
    setSavingItem(null);
    setSaveAmount(0);
  }, []);

  const confirmSave = useCallback(() => {
    if (!savingItem) {
      return;
    }
    const cost = costFor(savingItem);
    const progress = premiumProgress[savingItem.id] || 0;
    const maxSavable = Math.max(0, Math.min(gold, cost - progress));
    const amount = Math.max(0, Math.min(saveAmount, maxSavable));
    if (amount > 0) {
      setGold((g) => g - amount);
      setPremiumProgress((prev) => ({
        ...prev,
        [savingItem.id]: Math.min(cost, progress + amount),
      }));
    }
    setSavingItem(null);
    setSaveAmount(0);
  }, [savingItem, premiumProgress, gold, saveAmount, setGold, setPremiumProgress]);

  const confirmCost = confirmReward ? costFor(confirmReward) : 0;
  const ConfirmIcon = confirmReward?.premium ? 'crown' : 'gift-outline';

  const savingProgress = savingItem ? premiumProgress[savingItem.id] || 0 : 0;
  const savingCap = savingItem ? Math.max(costFor(savingItem) - savingProgress, 0) : 0;
  const maxSavableNow = savingItem ? Math.max(0, Math.min(gold, savingCap)) : 0;
  const clampedSaveAmount = Math.max(0, Math.min(saveAmount, maxSavableNow));

  const handleConfirmAction = useCallback(() => {
    if (!confirmReward) {
      return;
    }
    if (confirmReward.premium) {
      setRedeemed(confirmReward);
      setPremiumProgress((prev) => ({
        ...prev,
        [confirmReward.id]: 0,
      }));
    } else {
      handleRedeemReward(confirmReward);
    }
    setConfirmReward(null);
  }, [confirmReward, handleRedeemReward, setPremiumProgress]);

  const overlayBackground = eff === 'light' ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.55)';

  return (
    <>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.shopContainer, { borderColor: colors.surfaceBorder, backgroundColor: colors.surface }]}
        >
          <LinearGradient
            colors={[hexToRgba(colors.rose, 0.28), 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.shopGlowTopLeft}
            pointerEvents="none"
          />
          <LinearGradient
            colors={[hexToRgba(colors.sky, 0.28), 'transparent']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.shopGlowTopRight}
            pointerEvents="none"
          />
          <LinearGradient
            colors={[hexToRgba(colors.emerald, 0.24), 'transparent']}
            start={{ x: 1, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={styles.shopGlowBottomRight}
            pointerEvents="none"
          />
          <LinearGradient
            colors={[hexToRgba(colors.amber, 0.2), 'transparent']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={styles.shopGlowBottomLeft}
            pointerEvents="none"
          />

          <View style={styles.shopContent}>
            <View
              style={[styles.shopMainTabs, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            >
              {SHOP_MAIN_TABS.map((tab) => {
                const active = mainTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setMainTab(tab.key)}
                    activeOpacity={0.9}
                    style={[styles.shopMainTabButton, { borderColor: colors.surfaceBorder }]}
                  >
                    {active ? (
                      <LinearGradient
                        colors={[colors.sky, colors.emerald]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFillObject}
                      />
                    ) : null}
                    <View style={styles.shopMainTabContent}>
                      <MaterialCommunityIcons
                        name={tab.icon}
                        size={16}
                        color={active ? '#0f172a' : colors.text}
                        style={styles.shopMainTabIcon}
                      />
                      <Text style={[styles.shopMainTabLabel, { color: active ? '#0f172a' : colors.text }]}>
                        {tab.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {mainTab === 'active' ? (
              <ShopActiveEffects
                effects={effects}
                colors={colors}
                eff={eff}
                filledSurface={filledSurface}
                cardShadow={cardShadow}
                now={now}
                onBrowseEffects={() => {
                  setMainTab('catalogue');
                  setCategoryTab('effects');
                }}
              />
            ) : (
              <ShopCatalogue
                colors={colors}
                eff={eff}
                categoryTab={categoryTab}
                onSelectCategory={setCategoryTab}
                gameEffects={GAME_EFFECTS}
                activeEffects={effects}
                sortedRewards={sortedRewards}
                premiumRewards={PREMIUM_REWARDS}
                premiumProgress={premiumProgress}
                filledSurface={filledSurface}
                cardShadow={cardShadow}
                gold={gold}
                onBuyEffect={handleBuyEffect}
                onSelectReward={setConfirmReward}
                onPremiumAction={handlePremiumAction}
                costFor={costFor}
                formatDuration={(duration) => {
                  if (!duration) {
                    return 'Instant';
                  }
                  if (duration >= 3600) {
                    return `${Math.round(duration / 3600)} hr`;
                  }
                  return `${Math.round(duration / 60)} min`;
                }}
                formatGold={formatGold}
                formatGoldValue={formatGoldValue}
              />
            )}
          </View>
        </View>
      </ScrollView>

      <ShopSavingsModal
        visible={!!savingItem}
        onClose={closeSavingModal}
        colors={colors}
        eff={eff}
        cardShadow={cardShadow}
        overlayBackground={overlayBackground}
        savingItem={savingItem}
        saveAmount={clampedSaveAmount}
        maxSavableNow={maxSavableNow}
        savingProgress={savingProgress}
        totalCost={savingItem ? costFor(savingItem) : 0}
        onChangeAmount={setSaveAmount}
        onConfirm={confirmSave}
        formatGoldValue={formatGoldValue}
      />

      <Modal
        visible={!!confirmReward}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmReward(null)}
      >
        <TouchableWithoutFeedback onPress={() => setConfirmReward(null)}>
          <View style={[styles.shopModalOverlay, { backgroundColor: overlayBackground }]}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={[
                  styles.shopConfirmCard,
                  { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                  cardShadow,
                ]}
              >
                <View style={styles.shopConfirmIconRow}>
                  <View
                    style={[
                      styles.shopModalIconShell,
                      { borderColor: colors.surfaceBorder, backgroundColor: colors.surface },
                    ]}
                  >
                    <LinearGradient
                      colors={[colors.sky, colors.emerald]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.shopModalIconInner}
                    >
                      <MaterialCommunityIcons name={ConfirmIcon} size={22} color="#0f172a" />
                    </LinearGradient>
                  </View>
                </View>
                <Text style={[styles.shopConfirmTitle, { color: colors.text }]}>Confirm purchase?</Text>
                <Text style={[styles.shopModalDescription, { color: hexToRgba(colors.text, 0.6), textAlign: 'center' }]}>This will deduct {formatGold(confirmCost)} from your stash.</Text>
                <View style={styles.shopModalActions}>
                  <TouchableOpacity
                    onPress={() => setConfirmReward(null)}
                    activeOpacity={0.85}
                    style={[styles.shopModalButton, { borderColor: colors.surfaceBorder, backgroundColor: colors.surface }]}
                  >
                    <Text style={[styles.shopModalButtonText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirmAction}
                    activeOpacity={0.85}
                    style={[styles.shopModalButton, styles.shopModalPrimary, { borderColor: colors.surfaceBorder }]}
                  >
                    <LinearGradient
                      colors={[colors.sky, colors.emerald]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Text style={styles.shopModalPrimaryText}>Yes, do it</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={!!redeemed}
        transparent
        animationType="fade"
        onRequestClose={() => setRedeemed(null)}
      >
        <TouchableWithoutFeedback onPress={() => setRedeemed(null)}>
          <View style={[styles.shopModalOverlay, { backgroundColor: overlayBackground }]}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={[
                  styles.shopConfirmCard,
                  { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                  cardShadow,
                ]}
              >
                <Text style={[styles.shopConfirmTitle, { color: colors.text }]}>Enjoy {redeemed?.name}!</Text>
                <Text style={[styles.shopModalDescription, { color: hexToRgba(colors.text, 0.6), textAlign: 'center' }]}>You earned it. Log it in your journal once you're back.</Text>
                <TouchableOpacity
                  onPress={() => setRedeemed(null)}
                  activeOpacity={0.9}
                  style={[styles.shopModalButton, styles.shopModalPrimary, { borderColor: colors.surfaceBorder }]}
                >
                  <LinearGradient
                    colors={[colors.sky, colors.emerald]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Text style={styles.shopModalPrimaryText}>Back to shopping</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 28,
  },
  shopContainer: {
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  shopGlowTopLeft: {
    position: 'absolute',
    top: -60,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 160,
  },
  shopGlowTopRight: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 180,
  },
  shopGlowBottomRight: {
    position: 'absolute',
    bottom: -60,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 160,
  },
  shopGlowBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 180,
  },
  shopContent: {
    padding: 18,
    gap: 24,
  },
  shopMainTabs: {
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: 1,
    padding: 4,
  },
  shopMainTabButton: {
    flex: 1,
    position: 'relative',
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
    marginHorizontal: 4,
  },
  shopMainTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  shopMainTabIcon: {
    marginRight: 2,
  },
  shopMainTabLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  shopModalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  shopConfirmCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  shopConfirmIconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  shopModalIconShell: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  shopModalIconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopConfirmTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  shopModalDescription: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 20,
  },
  shopModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shopModalButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shopModalButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  shopModalPrimary: {
    position: 'relative',
  },
  shopModalPrimaryText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#0f172a',
  },
});

export default ShopScreen;
