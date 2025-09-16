import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../constants/theme';

const rarityColors = {
  Common: ['#64748b', '#475569'],
  Rare: ['#38bdf8', '#0ea5e9'],
  Epic: ['#a855f7', '#6366f1'],
  Legendary: ['#facc15', '#f97316']
};

export default function ChestCard({ chest, onOpen }) {
  const colors = rarityColors[chest.rarity] || rarityColors.Common;
  const label = Array.isArray(chest.gold)
    ? `${chest.gold[0]} - ${chest.gold[1]} gold`
    : `${chest.gold} gold`;
  return (
    <View style={[styles.card, { borderColor: colors[1] }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.rarity}>{chest.rarity} chest</Text>
          <Text style={styles.reward}>{label}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors[0] }]} />
      </View>
      {onOpen ? (
        <TouchableOpacity style={styles.button} onPress={() => onOpen(chest)}>
          <Text style={styles.buttonLabel}>Open chest</Text>
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
    padding: 16,
    marginBottom: 12
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  rarity: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '600'
  },
  reward: {
    marginTop: 4,
    color: palette.textMuted,
    fontSize: 13
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    opacity: 0.7
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
