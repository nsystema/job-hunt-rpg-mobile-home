import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../constants/theme';
import ProgressBar from './ProgressBar';
import { getIconComponent } from '../constants/icons';

const XPIcon = getIconComponent('Zap');
const GoldIcon = getIconComponent('Coins');

export default function QuestCard({ quest, claimed, onClaim }) {
  const canClaim = quest.progress >= quest.goal && !claimed;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{quest.title}</Text>
          <Text style={styles.subtitle}>{quest.desc}</Text>
        </View>
        <View style={styles.rewardWrap}>
          <View style={styles.rewardBadge}>
            <XPIcon size={16} color={palette.textPrimary} />
            <Text style={styles.rewardText}>{quest.xp}</Text>
          </View>
          <View style={styles.rewardBadge}>
            <GoldIcon size={16} color={palette.gold} />
            <Text style={[styles.rewardText, styles.goldText]}>{quest.gold}</Text>
          </View>
        </View>
      </View>
      <View style={styles.progressWrap}>
        <ProgressBar value={quest.progress / quest.goal} />
        <Text style={styles.progressLabel}>
          {quest.progress} / {quest.goal}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.button, canClaim ? styles.buttonActive : styles.buttonDisabled]}
        disabled={!canClaim}
        onPress={onClaim}
        activeOpacity={0.85}
      >
        <Text
          style={[styles.buttonLabel, canClaim ? styles.buttonLabelActive : styles.buttonLabelMuted]}
        >
          {claimed ? 'Claimed' : 'Claim reward'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
    marginBottom: 12
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  titleWrap: {
    flex: 1
  },
  title: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '700'
  },
  subtitle: {
    marginTop: 4,
    color: palette.textMuted,
    fontSize: 13
  },
  rewardWrap: {
    justifyContent: 'center',
    gap: 6
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6
  },
  rewardText: {
    color: palette.textPrimary,
    fontWeight: '600'
  },
  goldText: {
    color: palette.gold
  },
  progressWrap: {
    marginTop: 16
  },
  progressLabel: {
    marginTop: 8,
    color: palette.textMuted,
    fontSize: 12
  },
  button: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center'
  },
  buttonActive: {
    backgroundColor: palette.accent
  },
  buttonDisabled: {
    backgroundColor: 'rgba(148,163,184,0.18)'
  },
  buttonLabel: {
    fontWeight: '700',
    fontSize: 14
  },
  buttonLabelActive: {
    color: '#041028'
  },
  buttonLabelMuted: {
    color: palette.textMuted
  }
});
