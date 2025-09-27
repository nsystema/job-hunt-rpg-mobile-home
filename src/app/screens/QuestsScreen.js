import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppState } from '../../state';
import { useColors } from '../../theme';

const QuestsScreen = () => {
  const { claimedQuests, eventStates } = useAppState();
  const colors = useColors();

  const activeEvents = Object.values(eventStates || {}).filter((state) => state?.active);
  const completedQuests = claimedQuests instanceof Set ? claimedQuests.size : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.card, { borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.title, { color: colors.text }]}>Claimed quests</Text>
        <Text style={[styles.value, { color: colors.sky }]}>{completedQuests}</Text>
      </View>
      <View style={[styles.card, { borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.title, { color: colors.text }]}>Active events</Text>
        <Text style={[styles.value, { color: colors.emerald }]}>{activeEvents.length}</Text>
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
});

export default QuestsScreen;
