import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../constants/theme';

export default function SectionHeader({ title, subtitle, actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  textWrap: {
    flex: 1
  },
  title: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: '700'
  },
  subtitle: {
    marginTop: 4,
    color: palette.textMuted,
    fontSize: 13
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border
  },
  actionLabel: {
    color: palette.accent,
    fontSize: 13,
    fontWeight: '600'
  }
});
