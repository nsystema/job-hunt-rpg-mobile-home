import React from 'react';
import { StyleSheet, View } from 'react-native';
import { palette } from '../constants/theme';

export default function SurfaceCard({ style, children }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16
  }
});
