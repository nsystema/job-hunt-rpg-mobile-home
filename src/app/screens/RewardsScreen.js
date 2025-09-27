import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppState } from '../../state';
import { useColors } from '../../theme';

const RewardsScreen = () => {
  const { chests } = useAppState();
  const colors = useColors();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View style={[styles.card, { borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.title, { color: colors.text }]}>Chests</Text>
        <Text style={[styles.value, { color: colors.sky }]}>{chests.length}</Text>
        <Text style={[styles.caption, { color: colors.text }]}>Open chests in the rewards hub.</Text>
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
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
  },
  caption: {
    fontSize: 14,
  },
});

export default RewardsScreen;
