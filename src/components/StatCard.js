import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, gradients } from '../constants/theme';

export default function StatCard({ label, value, hint, gradient = 'primary', align = 'left' }) {
  const colors = gradients[gradient] || gradients.primary;
  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <View style={[styles.inner, align === 'center' && styles.centered]}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    padding: 16,
    flex: 1
  },
  inner: {
    backgroundColor: 'rgba(2, 6, 23, 0.35)',
    borderRadius: 14,
    padding: 16
  },
  centered: {
    alignItems: 'center'
  },
  label: {
    color: palette.textMuted,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6
  },
  value: {
    color: palette.textPrimary,
    fontSize: 28,
    fontWeight: '700'
  },
  hint: {
    marginTop: 6,
    color: 'rgba(226, 232, 240, 0.8)',
    fontSize: 13
  }
});
