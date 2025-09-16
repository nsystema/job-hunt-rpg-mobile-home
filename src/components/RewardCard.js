import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../constants/theme';
import { getIconComponent } from '../constants/icons';

const GiftIcon = getIconComponent('Gift');

export default function RewardCard({ reward, premium, onRedeem }) {
  const cost = Math.round(reward.minutes * (reward.pleasure ?? 1));
  return (
    <View style={[styles.card, premium && styles.premiumCard]}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <GiftIcon size={22} color={palette.textPrimary} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{reward.name}</Text>
          <Text style={styles.subtitle}>
            {reward.minutes} min - Pleasure {reward.pleasure ?? 1}
          </Text>
        </View>
        <Text style={[styles.cost, premium && styles.premiumCost]}>{cost}g</Text>
      </View>
      {onRedeem ? (
        <TouchableOpacity style={styles.button} onPress={() => onRedeem(reward)}>
          <Text style={styles.buttonLabel}>Redeem</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
    marginBottom: 12
  },
  premiumCard: {
    borderColor: palette.accentWarm
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(253, 224, 71, 0.18)'
  },
  textWrap: {
    flex: 1
  },
  title: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '600'
  },
  subtitle: {
    marginTop: 4,
    color: palette.textMuted,
    fontSize: 13
  },
  cost: {
    color: palette.gold,
    fontWeight: '700'
  },
  premiumCost: {
    color: palette.accentWarm
  },
  button: {
    marginTop: 16,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: palette.accent
  },
  buttonLabel: {
    color: '#041028',
    fontWeight: '700'
  }
});


