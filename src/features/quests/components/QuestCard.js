import { memo, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { hexToRgba } from '../../../utils/color';
import { formatTime } from '../../../utils/formatters';
import QuestStageList from './QuestStageList';

const isQuestTrackable = (quest) => quest?.trackable === true;

const QuestCardComponent = ({
  quest,
  colors,
  currentTime,
  makeRewardEntries,
  getStageProgressSummary,
  onClaim,
  onAction,
  onLogStage,
  filledSurface,
  questCardShadow,
  isLast,
}) => {
  const trackable = isQuestTrackable(quest);
  const progress = trackable ? quest?.progress ?? 0 : 0;
  const goalValue = trackable ? quest?.goalValue ?? 0 : 0;
  const claimed = quest?.claimed === true;
  const claimable = quest?.claimable === true;
  const percent = trackable
    ? quest?.percent ?? (goalValue > 0 ? Math.min(100, (progress / goalValue) * 100) : 0)
    : 0;
  const questReward = quest?.claimReward || quest?.reward;
  const rewardEntries = useMemo(() => makeRewardEntries?.(questReward) || [], [makeRewardEntries, questReward]);
  const rewardBonuses = useMemo(() => {
    const entries = [];
    if (questReward?.effect) {
      entries.push({ icon: 'auto-fix', color: colors.lilac, label: questReward.effect });
    }
    if (questReward?.cleanse) {
      entries.push({ icon: 'broom', color: colors.sky, label: `Cleanse: ${questReward.cleanse}` });
    }
    return entries;
  }, [questReward, colors]);

  const tierSummary = useMemo(
    () => (Array.isArray(quest?.tiers) ? getStageProgressSummary?.(quest.tiers) : null),
    [quest?.tiers, getStageProgressSummary],
  );

  const isMilestoneChain = quest?.stageLabel === 'Milestone';
  const milestoneSummary = useMemo(() => {
    if (!isMilestoneChain || !Array.isArray(quest?.steps)) {
      return null;
    }
    return getStageProgressSummary?.(quest.steps) ?? null;
  }, [isMilestoneChain, quest?.steps, getStageProgressSummary]);

  const showTaskStages = useMemo(() => {
    if (!Array.isArray(quest?.steps) || !quest.steps.length) {
      return false;
    }
    return !isMilestoneChain;
  }, [quest?.steps, isMilestoneChain]);

  const isEventQuest = quest?.type === 'event';
  const remainingSeconds = useMemo(() => {
    if (!isEventQuest || !Number.isFinite(quest?.expiresAt)) {
      return null;
    }
    return Math.max(0, Math.ceil((quest.expiresAt - currentTime) / 1000));
  }, [isEventQuest, quest?.expiresAt, currentTime]);
  const timeRemainingLabel = remainingSeconds > 0 ? formatTime(remainingSeconds) : null;

  const renderMetaRow = (icon, label, value, key) => {
    if (!value) {
      return null;
    }
    return (
      <View key={key} style={styles.metaRow}>
        <MaterialCommunityIcons name={icon} size={14} color={colors.sky} />
        <Text style={[styles.metaLabel, { color: hexToRgba(colors.text, 0.7) }]}>{label}:</Text>
        <Text style={[styles.metaValue, { color: colors.text }]}>{value}</Text>
      </View>
    );
  };

  const cardMargin = isLast ? 0 : 12;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: filledSurface,
          borderColor: colors.surfaceBorder,
          marginBottom: cardMargin,
        },
        questCardShadow,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={[styles.title, { color: colors.text }]}>{quest?.title}</Text>
          {quest?.subtitle ? (
            <Text style={[styles.subtitle, { color: hexToRgba(colors.text, 0.72) }]}>{quest.subtitle}</Text>
          ) : null}
        </View>
        {rewardEntries.length ? (
          <View style={styles.rewardMeta}>
            {rewardEntries.map((entry, index) => (
              <View key={`${quest?.id}-reward-${index}`} style={styles.rewardPill}>
                <MaterialCommunityIcons name={entry.icon} size={14} color={entry.color} />
                <Text style={[styles.rewardText, { color: colors.text }]}>{entry.label}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {Array.isArray(quest?.actions) && quest.actions.length ? (
        <View style={styles.actionsRow}>
          {quest.actions.map((action, actionIndex) => (
            <TouchableOpacity
              key={`${quest?.id}-action-${actionIndex}`}
              onPress={() => onAction?.(action, quest)}
              style={[styles.actionButton, { borderColor: colors.surfaceBorder, backgroundColor: colors.chipBg }]}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name={action.icon || 'plus-circle-outline'}
                size={14}
                color={colors.sky}
              />
              <Text style={[styles.actionText, { color: colors.text }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {rewardBonuses.length ? (
        <View style={styles.infoSection}>
          <Text style={[styles.infoLabel, { color: colors.text }]}>Bonus</Text>
          <View style={styles.bonusList}>
            {rewardBonuses.map((bonus, index) => (
              <View
                key={`${quest?.id}-bonus-${index}`}
                style={[styles.bonusPill, { borderColor: colors.surfaceBorder, backgroundColor: colors.chipBg }]}
              >
                <MaterialCommunityIcons name={bonus.icon} size={14} color={bonus.color} />
                <Text style={[styles.bonusText, { color: colors.text }]}>{bonus.label}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {Array.isArray(quest?.goals) && quest.goals.length ? (
        <View style={styles.infoSection}>
          {quest.goals.map((goal, goalIndex) => (
            <Text key={`${quest?.id}-goal-${goalIndex}`} style={[styles.goalText, { color: colors.text }]}>
              {goal}
            </Text>
          ))}
        </View>
      ) : null}

      {Array.isArray(quest?.tasks) && quest.tasks.length ? (
        <View style={styles.infoSection}>
          <Text style={[styles.infoLabel, { color: colors.text }]}>Tasks</Text>
          <QuestStageList
            stages={quest.tasks}
            label={quest.stageLabel || 'Task'}
            quest={quest}
            colors={colors}
            makeRewardEntries={makeRewardEntries}
            onLogStage={onLogStage}
          />
        </View>
      ) : null}

      {tierSummary ? (
        <View style={styles.infoSection}>
          <Text style={[styles.stageSummaryText, { color: colors.text }]}>
            {`Tier progress (${tierSummary})`}
          </Text>
        </View>
      ) : null}

      {milestoneSummary ? (
        <View style={styles.infoSection}>
          <Text style={[styles.stageSummaryText, { color: colors.text }]}>
            {`Milestone progress (${milestoneSummary})`}
          </Text>
        </View>
      ) : null}

      {showTaskStages ? (
        <View style={styles.infoSection}>
          <Text style={[styles.infoLabel, { color: colors.text }]}>
            {quest?.stageLabel ? `${quest.stageLabel}s` : 'Steps'}
          </Text>
          <QuestStageList
            stages={quest.steps}
            label={quest.stageLabel || 'Step'}
            quest={quest}
            colors={colors}
            makeRewardEntries={makeRewardEntries}
            onLogStage={onLogStage}
            sequential
          />
        </View>
      ) : null}

      {quest?.trigger
        ? renderMetaRow('flag-outline', 'Trigger', quest.trigger, `${quest?.id}-trigger`)
        : null}
      {quest?.duration
        ? renderMetaRow('clock-time-four-outline', 'Duration', quest.duration, `${quest?.id}-duration`)
        : null}
      {timeRemainingLabel
        ? renderMetaRow('timer-sand', 'Time left', timeRemainingLabel, `${quest?.id}-remaining`)
        : null}
      {quest?.lock ? renderMetaRow('lock-outline', 'Lock', quest.lock, `${quest?.id}-lock`) : null}
      {quest?.requires
        ? renderMetaRow('link-variant', 'Requires', quest.requires, `${quest?.id}-requires`)
        : null}

      {trackable ? (
        <>
          <View style={styles.progressSection}>
            <View style={[styles.progressTrack, { backgroundColor: colors.chipBg }]}>
              <LinearGradient
                colors={[colors.sky, colors.emerald]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${percent}%` }]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: 'rgba(148,163,184,.95)' }]}>
              {progress} / {goalValue}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onClaim?.(quest)}
            disabled={!claimable}
            activeOpacity={0.85}
            style={[
              styles.claimButton,
              {
                borderColor: colors.surfaceBorder,
                backgroundColor: claimable ? 'transparent' : colors.chipBg,
              },
            ]}
          >
            {claimable ? (
              <LinearGradient
                colors={[colors.sky, colors.emerald]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFillObject, styles.claimGradient]}
                pointerEvents="none"
              />
            ) : null}
            <Text style={[styles.claimText, { color: claimable ? '#0f172a' : 'rgba(148,163,184,.95)' }]}>
              {claimed ? 'Claimed' : 'Claim'}
            </Text>
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleGroup: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 17,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 13,
  },
  rewardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(15,23,42,0.05)',
  },
  rewardText: {
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  actionText: {
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 13,
  },
  infoSection: {
    gap: 10,
  },
  infoLabel: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 13,
  },
  bonusList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bonusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  bonusText: {
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 12,
  },
  goalText: {
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 14,
  },
  stageSummaryText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 12,
  },
  metaValue: {
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 13,
  },
  rewardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressSection: {
    gap: 8,
  },
  progressTrack: {
    borderRadius: 999,
    overflow: 'hidden',
    height: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressLabel: {
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 12,
    textAlign: 'center',
  },
  claimButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  claimGradient: {
    borderRadius: 999,
  },
  claimText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
  },
});

export const QuestCard = memo(QuestCardComponent);
export default QuestCard;
