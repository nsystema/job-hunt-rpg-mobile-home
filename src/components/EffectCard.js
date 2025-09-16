import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../constants/theme';
import { getIconComponent } from '../constants/icons';
import { formatTime as formatDuration } from '../utils/gameMechanics';

export default function EffectCard({ effect, owned, onPress }) {
  const Icon = getIconComponent(effect.icon);
  const secondsRemaining = owned && effect.expiresAt
    ? Math.max(0, Math.floor((effect.expiresAt - Date.now()) / 1000))
    : null;
  const durationLabel = effect.duration
    ? `${Math.round(effect.duration / 60)} min`
    : 'Instant';
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Icon size={22} color={palette.textPrimary} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{effect.name}</Text>
          <Text style={styles.subtitle}>{effect.description}</Text>
        </View>
        <Text style={styles.cost}>{effect.cost}g</Text>
      </View>
      <View style={styles.footer}>
        {owned && secondsRemaining !== null ? (
          <Text style={styles.remaining}>Active - {formatDuration(secondsRemaining)}</Text>
        ) : (
          <Text style={styles.remaining}>{durationLabel}</Text>
        )}
        {onPress ? (
          <TouchableOpacity
            style={[styles.button, owned && styles.buttonOwned]}
            onPress={() => onPress(effect)}
            disabled={owned}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonLabel, owned && styles.buttonLabelMuted]}>
              {owned ? 'Owned' : 'Buy effect'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
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
    backgroundColor: 'rgba(59, 130, 246, 0.2)'
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
  footer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  remaining: {
    color: palette.textMuted,
    fontSize: 12
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: palette.accent
  },
  buttonOwned: {
    backgroundColor: 'rgba(148,163,184,0.2)'
  },
  buttonLabel: {
    color: '#041028',
    fontWeight: '700'
  },
  buttonLabelMuted: {
    color: palette.textMuted
  }
});


