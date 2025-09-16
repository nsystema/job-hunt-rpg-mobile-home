import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../constants/theme';
import { getIconComponent } from '../constants/icons';

export default function QuickActionButton({ icon, label, onPress, disabled }) {
  const Icon = getIconComponent(icon);
  return (
    <TouchableOpacity
      style={[styles.container, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={styles.iconWrap}>
        <Icon size={20} color={palette.textPrimary} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 150,
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  disabled: {
    opacity: 0.5
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(36, 45, 75, 0.9)',
    marginBottom: 8
  },
  label: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center'
  }
});


