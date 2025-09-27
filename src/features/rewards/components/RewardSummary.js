import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { hexToRgba } from '../../../utils/color';

const RewardSummary = ({ colors, eff, hasChests, viewRange, onOpenAll, openAllSummary, onCloseSummary }) => {
  const summaryMuted = eff === 'light' ? 'rgba(15,23,42,0.66)' : 'rgba(226,232,240,0.76)';
  const summaryStrong = eff === 'light' ? '#0f172a' : colors.text;
  const headlineColor = hexToRgba(colors.text, 0.85);
  const shadowStyle = eff === 'light' ? styles.chestCardShadowLight : styles.chestCardShadowDark;

  return (
    <>
      <LinearGradient
        colors={[hexToRgba(colors.sky, 0.28), hexToRgba(colors.emerald, 0.22)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.rewardsSummary, { borderColor: colors.surfaceBorder }]}
      >
        <View style={styles.rewardsSummaryHeader}>
          <View style={styles.rewardsSummaryTitle}>
            <MaterialCommunityIcons name="gift-outline" size={16} color={headlineColor} />
            <Text style={[styles.rewardsSummaryTitleText, { color: headlineColor }]}>Treasure vault</Text>
          </View>
          <TouchableOpacity
            onPress={onOpenAll}
            disabled={!hasChests}
            activeOpacity={hasChests ? 0.9 : 1}
            style={[
              styles.rewardsSummaryButton,
              {
                borderColor: hasChests ? hexToRgba(colors.emerald, 0.45) : colors.surfaceBorder,
                backgroundColor: hasChests
                  ? 'transparent'
                  : hexToRgba(colors.text, eff === 'light' ? 0.08 : 0.18),
              },
            ]}
          >
            {hasChests ? (
              <LinearGradient
                colors={[colors.sky, colors.emerald]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.rewardsSummaryButtonBackground}
              />
            ) : null}
            <View style={styles.rewardsSummaryButtonContent}>
              <MaterialCommunityIcons
                name="auto-fix"
                size={14}
                color={hasChests ? '#0f172a' : hexToRgba(colors.text, 0.55)}
              />
              <Text
                style={[
                  styles.rewardsSummaryButtonText,
                  { color: hasChests ? '#0f172a' : hexToRgba(colors.text, 0.55) },
                ]}
              >
                Open all
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.rewardsSummaryRow}>
          <View style={styles.rewardsSummaryStat}>
            <MaterialCommunityIcons name="diamond-stone" size={14} color={summaryMuted} />
            <Text style={[styles.rewardsSummaryStatText, { color: summaryMuted }]}>Potential</Text>
            <Text style={[styles.rewardsSummaryRange, { color: summaryStrong }]}>{viewRange}</Text>
          </View>
        </View>
      </LinearGradient>

      <Modal visible={!!openAllSummary} transparent animationType="fade" onRequestClose={onCloseSummary}>
        <View style={styles.rewardsModalOverlay}>
          <View
            style={[
              styles.rewardsModalCard,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              shadowStyle,
            ]}
          >
            <Text style={[styles.rewardsModalTitle, { color: colors.text }]}>
              Opened {openAllSummary?.opened} chest{openAllSummary?.opened === 1 ? '' : 's'}
            </Text>
            <View style={styles.rewardsModalGold}>
              <MaterialCommunityIcons name="diamond-stone" size={18} color={colors.emerald} />
              <Text style={[styles.rewardsModalGoldText, { color: colors.text }]}>{openAllSummary?.gold}g</Text>
            </View>
            <TouchableOpacity
              onPress={onCloseSummary}
              activeOpacity={0.9}
              style={[styles.rewardsModalButton, { borderColor: colors.surfaceBorder }]}
            >
              <LinearGradient
                colors={[colors.sky, colors.emerald]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.rewardsModalButtonBackground}
              >
                <Text style={styles.rewardsModalButtonText}>Nice!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  rewardsSummary: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  rewardsSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardsSummaryTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewardsSummaryTitleText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  rewardsSummaryButton: {
    position: 'relative',
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rewardsSummaryButtonBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  rewardsSummaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  rewardsSummaryButtonText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  rewardsSummaryRow: {
    marginTop: 18,
  },
  rewardsSummaryStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardsSummaryStatText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  rewardsSummaryRange: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  rewardsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  rewardsModalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  rewardsModalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  rewardsModalGold: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardsModalGoldText: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
  },
  rewardsModalButton: {
    marginTop: 20,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rewardsModalButtonBackground: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardsModalButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#0f172a',
  },
  chestCardShadowLight: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  chestCardShadowDark: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});

export default RewardSummary;
