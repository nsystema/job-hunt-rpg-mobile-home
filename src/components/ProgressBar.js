import React from 'react';
import { StyleSheet, View } from 'react-native';
import { palette } from '../constants/theme';

export default function ProgressBar({ value = 0, height = 8, background = palette.elevated, fill = palette.accent }) {
  const pct = Math.min(1, Math.max(0, value));
  return (
    <View style={[styles.track, { height, backgroundColor: background }]}> 
      <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: fill }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden'
  },
  fill: {
    height: '100%'
  }
});
