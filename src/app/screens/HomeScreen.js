import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppState } from '../../state';
import { useColors } from '../../theme';
import { FOCUS_BASELINE } from '../../features/progression';

const HomeScreen = () => {
  const state = useAppState();
  const colors = useColors();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.heading, { color: colors.text }]}>Progress Overview</Text>
      <View style={[styles.card, { borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.label, { color: colors.text }]}>XP</Text>
        <Text style={[styles.value, { color: colors.sky }]}>{state.xp}</Text>
      </View>
      <View style={[styles.card, { borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.label, { color: colors.text }]}>Gold</Text>
        <Text style={[styles.value, { color: colors.emerald }]}>{state.gold}</Text>
      </View>
      <View style={[styles.card, { borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.label, { color: colors.text }]}>Focus</Text>
        <Text style={[styles.value, { color: colors.lilac }]}>
          {state.focus} / {FOCUS_BASELINE}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
  },
});

export default HomeScreen;
