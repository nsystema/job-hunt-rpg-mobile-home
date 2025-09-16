import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import StatCard from '../components/StatCard';
import QuickActionButton from '../components/QuickActionButton';
import SectionHeader from '../components/SectionHeader';
import SurfaceCard from '../components/SurfaceCard';
import ApplicationCard from '../components/ApplicationCard';
import QuestCard from '../components/QuestCard';
import EffectCard from '../components/EffectCard';
import ApplicationFormModal from '../components/ApplicationFormModal';
import ProgressBar from '../components/ProgressBar';
import { useGame } from '../context/GameContext';
import { palette, gradients } from '../constants/theme';
import { FOCUS_BASELINE } from '../utils/gameMechanics';
import { countUnclaimedQuests } from '../utils/quests';
import { recentApplications } from '../utils/applications';

export default function HomeScreen() {
  const {
    state,
    levelInfo,
    logApplication,
    recordNetworking,
    recordSkill,
    recordInterview,
    rechargeFocus,
    claimQuest
  } = useGame();
  const [formVisible, setFormVisible] = useState(false);

  const xpProgress = levelInfo.need ? levelInfo.remainder / levelInfo.need : 0;
  const focusRatio = state.focus / FOCUS_BASELINE;
  const quickActions = [
    { icon: 'PlusCircle', label: 'Log application', action: () => setFormVisible(true) },
    { icon: 'Sparkles', label: 'Networking', action: recordNetworking },
    { icon: 'GraduationCap', label: 'Skill boost', action: recordSkill },
    { icon: 'Target', label: 'Interview prep', action: recordInterview },
    { icon: 'RefreshCcw', label: 'Recharge focus', action: rechargeFocus }
  ];

  const recent = useMemo(() => recentApplications(state.applications, 3), [state.applications]);
  const questHighlights = useMemo(() => {
    const all = Object.values(state.quests).flat();
    return all
      .slice()
      .sort((a, b) => b.progress / b.goal - a.progress / a.goal)
      .slice(0, 3);
  }, [state.quests]);

  const unclaimed = countUnclaimedQuests(state.quests, state.claimedQuests);

  const handleApplicationSubmit = (payload) => {
    logApplication(payload);
    setFormVisible(false);
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#020617', '#0f172a']} style={styles.hero} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <StatCard
            label={`Level ${levelInfo.level}`}
            value={`${levelInfo.remainder}/${levelInfo.need}`}
            hint="XP to next level"
            gradient="primary"
          />
          <StatCard
            label="Gold"
            value={`${state.gold}g`}
            hint={`${unclaimed} quests ready`}
            gradient="secondary"
            align="center"
          />
        </View>
        <SurfaceCard style={styles.xpCard}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpLabel}>Experience progress</Text>
            <Text style={styles.xpValue}>{Math.round(xpProgress * 100)}%</Text>
          </View>
          <ProgressBar value={xpProgress} />
          <Text style={styles.focusLabel}>Focus {Math.round(focusRatio * 100)}%</Text>
          <ProgressBar value={focusRatio} background="rgba(15,23,42,0.7)" fill={gradients.secondary[0]} />
        </SurfaceCard>
        <SectionHeader
          title="Quick actions"
          subtitle="Keep your streak alive with a tap"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionsRow}
        >
          {quickActions.map((action) => (
            <QuickActionButton
              key={action.label}
              icon={action.icon}
              label={action.label}
              onPress={action.action}
            />
          ))}
        </ScrollView>

        <SectionHeader title="Recent applications" subtitle="Your latest activity" />
        {recent.length ? (
          recent.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))
        ) : (
          <SurfaceCard>
            <Text style={styles.empty}>Log an application to get started.</Text>
          </SurfaceCard>
        )}

        <SectionHeader title="Quest tracker" subtitle="Progress towards rewards" />
        {questHighlights.map((quest) => (
          <QuestCard
            key={quest.id}
            quest={quest}
            claimed={state.claimedQuests.includes(quest.id)}
            onClaim={() => claimQuest(quest.id)}
          />
        ))}
        {!questHighlights.length && (
          <SurfaceCard>
            <Text style={styles.empty}>No quests available yet.</Text>
          </SurfaceCard>
        )}

        <SectionHeader title="Active effects" subtitle="Boosts currently running" />
        {state.effects.length ? (
          state.effects.map((effect) => (
            <EffectCard key={effect.id} effect={effect} owned />
          ))
        ) : (
          <SurfaceCard>
            <Text style={styles.empty}>Visit the shop to buy temporary boosts.</Text>
          </SurfaceCard>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
      <ApplicationFormModal
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onSubmit={handleApplicationSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background
  },
  hero: {
    ...StyleSheet.absoluteFillObject
  },
  content: {
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 20
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20
  },
  xpCard: {
    marginBottom: 28
  },
  xpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  xpLabel: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: '600'
  },
  xpValue: {
    color: palette.textMuted,
    fontSize: 13
  },
  focusLabel: {
    marginTop: 18,
    marginBottom: 8,
    color: palette.textMuted,
    fontSize: 12,
    textTransform: 'uppercase'
  },
  actionsRow: {
    gap: 12,
    paddingBottom: 12
  },
  empty: {
    color: palette.textMuted,
    fontSize: 14
  },
  bottomSpace: {
    height: 60
  }
});


