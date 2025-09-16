import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../constants/theme';
import { TABS } from '../data/appConstants';
import { useGame } from '../context/GameContext';
import QuestCard from '../components/QuestCard';
import SectionHeader from '../components/SectionHeader';
import { countUnclaimedByTab, countUnclaimedQuests } from '../utils/quests';
import { getIconComponent } from '../constants/icons';

export default function QuestsScreen() {
  const { state, claimQuest } = useGame();
  const [tab, setTab] = useState(TABS[0].key);
  const claimedSet = useMemo(() => new Set(state.claimedQuests), [state.claimedQuests]);
  const list = state.quests[tab] || [];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader
          title="Quests"
          subtitle={`${countUnclaimedQuests(state.quests, state.claimedQuests)} rewards ready`}
        />
        <View style={styles.tabRow}>
          {TABS.map((entry) => {
            const Icon = getIconComponent(entry.icon);
            const active = tab === entry.key;
            const badge = countUnclaimedByTab(state.quests, entry.key, state.claimedQuests);
            return (
              <TouchableOpacity
                key={entry.key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setTab(entry.key)}
              >
                <Icon size={18} color={active ? '#041028' : palette.textMuted} />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{entry.key}</Text>
                {badge > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeLabel}>{badge}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
        {list.map((quest) => (
          <QuestCard
            key={quest.id}
            quest={quest}
            claimed={claimedSet.has(quest.id)}
            onClaim={() => claimQuest(quest.id)}
          />
        ))}
        {!list.length && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyLabel}>No quests in this category yet.</Text>
          </View>
        )}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background
  },
  content: {
    padding: 20,
    paddingBottom: 32
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface
  },
  tabActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent
  },
  tabLabel: {
    color: palette.textMuted,
    fontWeight: '500'
  },
  tabLabelActive: {
    color: '#041028'
  },
  badge: {
    marginLeft: 4,
    backgroundColor: palette.accentWarm,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  badgeLabel: {
    color: '#041028',
    fontSize: 12,
    fontWeight: '700'
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 32
  },
  emptyLabel: {
    color: palette.textMuted
  },
  bottomSpace: {
    height: 60
  }
});
