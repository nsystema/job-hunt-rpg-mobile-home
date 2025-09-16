import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../constants/theme';
import { getIconComponent } from '../constants/icons';
import { STATUSES } from '../data/appConstants';
import { formatDate, formatTime, relativeLabel } from '../utils/format';

const CVIcon = getIconComponent('FileText');
const MotivationIcon = getIconComponent('Mail');
const FavoriteIcon = getIconComponent('Star');
const ClockIcon = getIconComponent('Clock');

const statusMap = Object.fromEntries(
  STATUSES.map((item) => [item.key, { icon: getIconComponent(item.icon), hint: item.hint }])
);

export default function ApplicationCard({
  application,
  onPress,
  onToggleFavorite,
  onDelete
}) {
  const StatusIcon = statusMap[application.status]?.icon;
  const favorite = !!application.favorite;
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(application)}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.company}>{application.company}</Text>
          <Text style={styles.role}>{application.role}</Text>
        </View>
        <TouchableOpacity onPress={() => onToggleFavorite?.(application)} hitSlop={8}>
          <FavoriteIcon
            size={18}
            color={favorite ? palette.gold : palette.textMuted}
            fill={favorite ? palette.gold : 'transparent'}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.metaRow}>
        {StatusIcon ? (
          <View style={styles.chip}>
            <StatusIcon size={16} color={palette.textPrimary} />
            <Text style={styles.chipLabel}>{application.status}</Text>
          </View>
        ) : null}
        <View style={styles.chipMuted}>
          <ClockIcon size={16} color={palette.textMuted} />
          <Text style={styles.mutedLabel}>{relativeLabel(application.date)}</Text>
        </View>
        <View style={styles.chipMuted}>
          <Text style={styles.mutedLabel}>{application.platform}</Text>
        </View>
      </View>
      {application.note ? <Text style={styles.note}>{application.note}</Text> : null}
      <View style={styles.footer}>
        <View style={styles.tags}>
          {application.cvTailored ? (
            <View style={styles.iconTag}>
              <CVIcon size={16} color={palette.textPrimary} />
              <Text style={styles.tagLabel}>CV</Text>
            </View>
          ) : null}
          {application.motivation ? (
            <View style={styles.iconTag}>
              <MotivationIcon size={16} color={palette.textPrimary} />
              <Text style={styles.tagLabel}>Motivation</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.dateWrap}>
          <Text style={styles.dateText}>{formatDate(application.date)}</Text>
          <Text style={styles.dateText}>{formatTime(application.date)}</Text>
        </View>
      </View>
      {onDelete ? (
        <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(application)}>
          <Text style={styles.deleteLabel}>Delete</Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    borderColor: palette.border,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  titleWrap: {
    flex: 1,
    paddingRight: 12
  },
  company: {
    color: palette.textPrimary,
    fontSize: 17,
    fontWeight: '700'
  },
  role: {
    marginTop: 4,
    color: palette.textMuted,
    fontSize: 14
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(56, 189, 248, 0.18)'
  },
  chipMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.8)'
  },
  chipLabel: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: '600'
  },
  mutedLabel: {
    color: palette.textMuted,
    fontSize: 12
  },
  note: {
    marginTop: 12,
    color: palette.textPrimary,
    fontSize: 13,
    lineHeight: 18
  },
  footer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  tags: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  iconTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 64, 175, 0.35)'
  },
  tagLabel: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: '600'
  },
  dateWrap: {
    alignItems: 'flex-end'
  },
  dateText: {
    color: palette.textMuted,
    fontSize: 12
  },
  deleteButton: {
    marginTop: 14,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(248,113,113,0.18)'
  },
  deleteLabel: {
    color: palette.danger,
    fontSize: 12,
    fontWeight: '600'
  }
});
