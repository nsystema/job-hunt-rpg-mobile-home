import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GoldPill } from '../../../components/layout/GoldPill';
import { hexToRgba } from '../../../utils/color';

export const SHOP_CATALOG_TABS = [
  { key: 'effects', label: 'Boosts', icon: 'flash-outline' },
  { key: 'rewards', label: 'Treats', icon: 'cupcake' },
  { key: 'premium', label: 'Premium', icon: 'crown-outline' },
];

const ShopCatalogue = ({
  colors,
  eff,
  categoryTab,
  onSelectCategory,
  gameEffects,
  activeEffects,
  sortedRewards,
  premiumRewards,
  premiumProgress,
  filledSurface,
  cardShadow,
  gold,
  onBuyEffect,
  onSelectReward,
  onPremiumAction,
  costFor,
  formatDuration,
  formatGold,
  formatGoldValue,
}) => {
  return (
    <View style={styles.shopSection}>
      <View style={styles.shopSectionHeader}>
        <Text style={[styles.shopSectionEyebrow, { color: hexToRgba(colors.text, 0.55) }]}>Catalogue</Text>
        <Text style={[styles.shopSectionTitle, { color: colors.text }]}>Choose how you want to level the journey today.</Text>
      </View>
      <View
        style={[
          styles.shopSecondaryTabs,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        {SHOP_CATALOG_TABS.map((tab) => {
          const active = categoryTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onSelectCategory(tab.key)}
              activeOpacity={0.9}
              style={[styles.shopSecondaryTabButton, { borderColor: colors.surfaceBorder }]}
            >
              {active ? (
                <LinearGradient
                  colors={[colors.sky, colors.emerald]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              ) : null}
              <View style={styles.shopSecondaryTabContent}>
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={15}
                  color={active ? '#0f172a' : colors.text}
                  style={styles.shopSecondaryTabIcon}
                />
                <Text
                  style={[styles.shopSecondaryTabLabel, { color: active ? '#0f172a' : colors.text }]}
                >
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {categoryTab === 'effects' && (
        <View style={styles.shopCardList}>
          {gameEffects
            .slice()
            .sort((a, b) => a.cost - b.cost)
            .map((item) => {
              const active = activeEffects.some((fx) => fx.id === item.id);
              const durationLabel = formatDuration(item.duration);
              return (
                <View
                  key={item.id}
                  style={[
                    styles.shopCard,
                    { backgroundColor: filledSurface, borderColor: colors.surfaceBorder },
                    cardShadow,
                  ]}
                >
                  <View style={styles.shopCardHeader}>
                    <View
                      style={[
                        styles.shopIconShell,
                        { borderColor: colors.surfaceBorder, backgroundColor: colors.surface },
                      ]}
                    >
                      <LinearGradient
                        colors={[colors.sky, colors.emerald]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.shopIconInner}
                      >
                        <MaterialCommunityIcons name={item.icon || 'flash-outline'} size={20} color="#0f172a" />
                      </LinearGradient>
                    </View>
                    <View style={styles.shopCardTitleArea}>
                      <View style={styles.shopCardTitleRow}>
                        <Text style={[styles.shopCardTitle, { color: colors.text }]}>{item.name}</Text>
                        {active ? (
                          <View
                            style={[
                              styles.shopCardBadge,
                              {
                                borderColor: colors.surfaceBorder,
                                backgroundColor: hexToRgba(colors.text, eff === 'light' ? 0.05 : 0.22),
                              },
                            ]}
                          >
                            <Text style={[styles.shopCardBadgeText, { color: colors.text }]}>In progress</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.shopCardDescription, { color: hexToRgba(colors.text, 0.65) }]}> 
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.shopCardFooter}>
                    <View style={styles.shopMetaRow}>
                      <View style={styles.shopMetaItem}>
                        <MaterialCommunityIcons name="clock-time-four-outline" size={14} color={hexToRgba(colors.text, 0.6)} />
                        <Text style={[styles.shopMetaText, { color: hexToRgba(colors.text, 0.6) }]}>{durationLabel}</Text>
                      </View>
                      <View style={styles.shopMetaItem}>
                        <MaterialCommunityIcons name="diamond-stone" size={14} color={hexToRgba(colors.text, 0.6)} />
                        <Text style={[styles.shopMetaText, { color: hexToRgba(colors.text, 0.6) }]}>{formatGold(item.cost)}</Text>
                      </View>
                    </View>
                    <GoldPill
                      colors={colors}
                      icon="diamond-stone"
                      onPress={() => onBuyEffect(item)}
                      dim={gold < item.cost || active}
                    >
                      {active ? 'Owned' : `${item.cost}g`}
                    </GoldPill>
                  </View>
                </View>
              );
            })}
        </View>
      )}

      {categoryTab === 'rewards' && (
        <View style={styles.shopCardList}>
          {sortedRewards.map((item) => {
            const cost = costFor(item);
            return (
              <View
                key={item.id}
                style={[
                  styles.shopCard,
                  { backgroundColor: filledSurface, borderColor: colors.surfaceBorder },
                  cardShadow,
                ]}
              >
                <View style={styles.shopCardHeader}>
                  <View
                    style={[
                      styles.shopIconShell,
                      { borderColor: colors.surfaceBorder, backgroundColor: colors.surface },
                    ]}
                  >
                    <LinearGradient
                      colors={[colors.rose, colors.lilac]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.shopIconInner}
                    >
                      <MaterialCommunityIcons name="gift-outline" size={20} color="#0f172a" />
                    </LinearGradient>
                  </View>
                  <View style={styles.shopCardTitleArea}>
                    <Text style={[styles.shopCardTitle, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.shopCardDescription, { color: hexToRgba(colors.text, 0.65) }]}> 
                      Reward yourself with {item.minutes} minutes of joy.
                    </Text>
                  </View>
                </View>
                <View style={styles.shopCardFooter}>
                  <View style={styles.shopMetaRow}>
                    <View style={styles.shopMetaItem}>
                      <MaterialCommunityIcons name="clock-time-four-outline" size={14} color={hexToRgba(colors.text, 0.6)} />
                      <Text style={[styles.shopMetaText, { color: hexToRgba(colors.text, 0.6) }]}>{item.minutes} min</Text>
                    </View>
                    <View style={styles.shopMetaItem}>
                      <MaterialCommunityIcons name="diamond-stone" size={14} color={hexToRgba(colors.text, 0.6)} />
                      <Text style={[styles.shopMetaText, { color: hexToRgba(colors.text, 0.6) }]}>{formatGold(cost)}</Text>
                    </View>
                  </View>
                  <GoldPill colors={colors} icon="diamond-stone" onPress={() => onSelectReward(item)} dim={gold < cost}>
                    {`${cost}g`}
                  </GoldPill>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {categoryTab === 'premium' && (
        <View style={styles.shopCardList}>
          {premiumRewards.map((item) => {
            const cost = costFor(item);
            const progress = premiumProgress[item.id] || 0;
            const completed = progress >= cost;
            const savedGold = Math.min(progress, cost);
            const remainingGold = Math.max(cost - savedGold, 0);
            const progressPercent = cost > 0 ? Math.min(100, (savedGold / cost) * 100) : 100;
            const displayName = (item.name || '').replace(/premium reward/gi, '').trim();
            return (
              <View
                key={item.id}
                style={[
                  styles.shopPremiumCard,
                  { backgroundColor: filledSurface, borderColor: colors.surfaceBorder },
                  cardShadow,
                ]}
              >
                <View style={styles.shopPremiumHeader}>
                  <View
                    style={[
                      styles.shopIconShell,
                      { borderColor: colors.surfaceBorder, backgroundColor: colors.surface },
                    ]}
                  >
                    <LinearGradient
                      colors={[colors.sky, colors.emerald]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.shopIconInner}
                    >
                      <MaterialCommunityIcons name="crown-outline" size={20} color="#0f172a" />
                    </LinearGradient>
                  </View>
                  <View style={styles.shopPremiumTitleArea}>
                    <View style={styles.shopPremiumTitleRow}>
                      <Text style={[styles.shopCardTitle, { color: colors.text }]}>
                        {displayName || 'Premium reward'}
                      </Text>
                      {completed ? (
                        <View style={[styles.shopPremiumBadge, { backgroundColor: hexToRgba(colors.emerald, 0.2) }] }>
                          <Text style={[styles.shopPremiumBadgeText, { color: colors.emerald }]}>Ready to claim</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.shopCardDescription, { color: hexToRgba(colors.text, 0.65) }]}> 
                      Set aside gold to unlock this premium reward.
                    </Text>
                  </View>
                  <GoldPill
                    colors={colors}
                    icon="diamond-stone"
                    onPress={() => onPremiumAction(item)}
                    dim={!completed && gold <= 0}
                    style={styles.shopPremiumButton}
                  >
                    {completed ? 'Claim' : 'Save'}
                  </GoldPill>
                </View>
                <View style={[styles.shopPremiumProgressBar, { borderColor: colors.surfaceBorder }]}>
                  <LinearGradient
                    colors={[colors.sky, colors.emerald]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.shopPremiumProgressFill, { width: `${progressPercent}%` }]}
                  />
                </View>
                <View style={styles.shopPremiumAmounts}>
                  <View style={styles.shopMetaItem}>
                    <MaterialCommunityIcons name="wallet-outline" size={14} color={hexToRgba(colors.text, 0.6)} />
                    <Text style={[styles.shopMetaText, { color: hexToRgba(colors.text, 0.6) }]}>
                      {formatGoldValue(savedGold)}
                    </Text>
                  </View>
                  <Text style={[styles.shopPremiumRemaining, { color: hexToRgba(colors.text, 0.6) }]}> 
                    {remainingGold === 0 ? 'Goal reached' : `${formatGoldValue(remainingGold)} to go`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  shopSection: {
    marginTop: 24,
  },
  shopSectionHeader: {
    marginBottom: 12,
  },
  shopSectionEyebrow: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  shopSectionTitle: {
    marginTop: 4,
    fontSize: 18,
    lineHeight: 26,
    fontFamily: 'Poppins_700Bold',
  },
  shopSecondaryTabs: {
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: 1,
    padding: 4,
    marginBottom: 16,
  },
  shopSecondaryTabButton: {
    flex: 1,
    position: 'relative',
    borderWidth: 1,
    borderRadius: 999,
    overflow: 'hidden',
    marginHorizontal: 4,
  },
  shopSecondaryTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  shopSecondaryTabIcon: {
    marginRight: 2,
  },
  shopSecondaryTabLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  shopCardList: {
    gap: 16,
  },
  shopCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 16,
  },
  shopCardHeader: {
    flexDirection: 'row',
    gap: 16,
  },
  shopIconShell: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  shopIconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopCardTitleArea: {
    flex: 1,
    gap: 6,
  },
  shopCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  shopCardTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  shopCardBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  shopCardBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  shopCardDescription: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 20,
  },
  shopCardFooter: {
    gap: 12,
  },
  shopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shopMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shopMetaText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  shopPremiumCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 16,
  },
  shopPremiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  shopPremiumTitleArea: {
    flex: 1,
    gap: 6,
  },
  shopPremiumTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  shopPremiumBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  shopPremiumBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  shopPremiumButton: {
    marginLeft: 'auto',
  },
  shopPremiumProgressBar: {
    borderWidth: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  shopPremiumProgressFill: {
    height: 10,
    borderRadius: 999,
  },
  shopPremiumAmounts: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shopPremiumRemaining: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
});

export default ShopCatalogue;
