import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SectionHeader from '../components/SectionHeader';
import ChestCard from '../components/ChestCard';
import RewardCard from '../components/RewardCard';
import SurfaceCard from '../components/SurfaceCard';
import { palette } from '../constants/theme';
import { useGame } from '../context/GameContext';
import { getChestGoldRange } from '../utils/gameMechanics';
import { formatDate, formatTime } from '../utils/format';

export default function RewardsScreen() {
  const {
    state,
    realRewards,
    premiumRewards,
    openChest,
    redeemReward,
    resetRedeemedReward
  } = useGame();

  const potential = useMemo(() => getChestGoldRange(state.chests), [state.chests]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Chests" subtitle="Open for gold rewards" />
        {state.lastChestReward ? (
          <SurfaceCard style={styles.lastReward}>
            <Text style={styles.lastRewardTitle}>Last reward</Text>
            <Text style={styles.lastRewardValue}>
              {state.lastChestReward.reward} gold - {state.lastChestReward.rarity}
            </Text>
            <Text style={styles.lastRewardMeta}>
              {formatDate(state.lastChestReward.openedAt)} - {formatTime(state.lastChestReward.openedAt)}
            </Text>
          </SurfaceCard>
        ) : null}
        {potential ? (
          <Text style={styles.potential}>Potential loot: {potential[0]} - {potential[1]} gold</Text>
        ) : (
          <Text style={styles.potential}>No chests in the inventory.</Text>
        )}
        {state.chests.map((chest) => (
          <ChestCard key={chest.id} chest={chest} onOpen={(item) => openChest(item.id)} />
        ))}
        {!state.chests.length && (
          <SurfaceCard>
            <Text style={styles.empty}>Log high-quality applications to earn more chests.</Text>
          </SurfaceCard>
        )}

        <SectionHeader title="Rewards" subtitle="Treat yourself for grinding" />
        {state.redeemedReward ? (
          <SurfaceCard style={styles.redeemedBox}>
            <Text style={styles.redeemedTitle}>Redeemed reward</Text>
            <Text style={styles.redeemedName}>{state.redeemedReward.reward.name}</Text>
            <Text style={styles.redeemedTime}>
              {formatDate(state.redeemedReward.timestamp)} - {formatTime(state.redeemedReward.timestamp)}
            </Text>
            <TouchableOpacity onPress={resetRedeemedReward} style={styles.redeemedButton}>
              <Text style={styles.redeemedButtonLabel}>Clear</Text>
            </TouchableOpacity>
          </SurfaceCard>
        ) : null}

        <Text style={styles.sectionLabel}>Standard rewards</Text>
        {realRewards.map((reward) => (
          <RewardCard key={reward.id} reward={reward} onRedeem={redeemReward} />
        ))}

        <Text style={styles.sectionLabel}>Premium rewards</Text>
        {premiumRewards.map((reward) => (
          <RewardCard key={reward.id} reward={reward} premium onRedeem={redeemReward} />
        ))}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background
  },
  content: {
    padding: 20,
    paddingBottom: 32
  },
  potential: {
    color: palette.textMuted,
    marginBottom: 12
  },
  lastReward: {
    marginBottom: 12
  },
  lastRewardTitle: {
    color: palette.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 6
  },
  lastRewardValue: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '600'
  },
  lastRewardMeta: {
    marginTop: 4,
    color: palette.textMuted,
    fontSize: 12
  },
  empty: {
    color: palette.textMuted
  },
  redeemedBox: {
    marginBottom: 18
  },
  redeemedTitle: {
    color: palette.textMuted,
    fontSize: 12,
    textTransform: 'uppercase'
  },
  redeemedName: {
    marginTop: 6,
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '600'
  },
  redeemedTime: {
    marginTop: 4,
    color: palette.textMuted,
    fontSize: 12
  },
  redeemedButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border
  },
  redeemedButtonLabel: {
    color: palette.textMuted,
    fontWeight: '600'
  },
  sectionLabel: {
    marginTop: 16,
    marginBottom: 8,
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '600'
  },
  bottomSpace: {
    height: 60
  }
});





