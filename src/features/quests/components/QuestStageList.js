import { memo, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { hexToRgba } from '../../../utils/color';

const QuestStageListComponent = ({
  stages,
  label,
  quest,
  colors,
  makeRewardEntries,
  onLogStage,
  sequential = false,
}) => {
  const rewardEntriesFor = makeRewardEntries || (() => []);

  const visibleStages = useMemo(() => {
    if (!Array.isArray(stages) || !stages.length) {
      return [];
    }

    if (!sequential) {
      return stages.map((stage, index) => ({ stage, stageIndex: index }));
    }

    const entries = [];
    let allowNext = true;

    stages.forEach((stage, index) => {
      if (stage?.completed === true) {
        entries.push({ stage, stageIndex: index });
        return;
      }

      if (allowNext) {
        entries.push({ stage, stageIndex: index });
        allowNext = false;
      }
    });

    return entries;
  }, [stages, sequential]);

  if (!visibleStages.length) {
    return null;
  }

  const questId = quest?.id;

  return (
    <View style={styles.container}>
      {visibleStages.map(({ stage, stageIndex }) => {
        const stageRewards = rewardEntriesFor(stage?.reward);
        const isClaimed = stage?.claimed === true;
        const isCompleted = stage?.completed === true;
        const isReady = !isClaimed && isCompleted;
        const showProgress =
          typeof stage?.progress === 'number' &&
          typeof stage?.goalValue === 'number' &&
          stage.goalValue > 0;
        const progressValue = showProgress
          ? `${Math.min(stage.progress, stage.goalValue)} / ${stage.goalValue}`
          : null;
        const backgroundColor = isClaimed
          ? hexToRgba(colors.emerald, 0.12)
          : isReady
          ? hexToRgba(colors.amber, 0.12)
          : colors.chipBg;
        const borderColor = isClaimed
          ? hexToRgba(colors.emerald, 0.45)
          : isReady
          ? hexToRgba(colors.amber, 0.45)
          : colors.surfaceBorder;
        const statusColor = isClaimed ? colors.emerald : isReady ? colors.amber : null;

        return (
          <View
            key={`${questId || label}-${stageIndex}`}
            style={[styles.stageRow, { backgroundColor, borderColor }]}
          >
            <View style={styles.stageHeader}>
              <View style={styles.stageTitleRow}>
                <Text style={[styles.stageTitle, { color: colors.text }]}>
                  {`${label} ${stageIndex + 1}`}
                </Text>
                {statusColor ? (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={16}
                    color={statusColor}
                    style={styles.stageStatusIcon}
                  />
                ) : null}
              </View>
              {stageRewards.length ? (
                <View style={styles.rewardMeta}>
                  {stageRewards.map((entry, rewardIndex) => (
                    <View key={`${questId || label}-${stageIndex}-reward-${rewardIndex}`} style={styles.rewardPill}>
                      <MaterialCommunityIcons name={entry.icon} size={14} color={entry.color} />
                      <Text style={[styles.rewardText, { color: colors.text }]}>{entry.label}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
            {stage?.goal ? (
              <Text style={[styles.stageGoal, { color: hexToRgba(colors.text, 0.75) }]}>{stage.goal}</Text>
            ) : null}
            {progressValue ? (
              <Text style={[styles.stageProgress, { color: hexToRgba(colors.text, 0.68) }]}>
                {progressValue}
              </Text>
            ) : null}
            {stage?.manualKey ? (
              <TouchableOpacity
                onPress={() =>
                  onLogStage?.(stage.manualKey, {
                    questId,
                    stageId: stage.id || stage.index,
                  })
                }
                style={[styles.stageButton, { borderColor: colors.surfaceBorder, backgroundColor: colors.chipBg }]}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="plus-circle-outline" size={14} color={colors.sky} />
                <Text style={[styles.stageButtonText, { color: colors.text }]}>Log progress</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  stageRow: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  stageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stageTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 15,
  },
  stageStatusIcon: {
    marginLeft: 2,
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
  stageGoal: {
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 13,
  },
  stageProgress: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
  },
  stageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  stageButtonText: {
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 13,
  },
});

export const QuestStageList = memo(QuestStageListComponent);
export default QuestStageList;
