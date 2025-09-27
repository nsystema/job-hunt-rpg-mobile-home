import { memo, useMemo } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const month = MONTHS[date.getMonth()];
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month} ${day} at ${hours}:${minutes}`;
};

const truncate = (value, limit = 70) => {
  if (!value) return '';
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 3)}...`;
};

const ApplicationCard = ({ app, colors, statusInfo = {}, status, onEdit, onDelete }) => {
  const extras = useMemo(
    () => [
      { key: 'cv', icon: 'file-document-outline', active: app.cvTailored },
      { key: 'motivation', icon: 'email-outline', active: app.motivation },
      { key: 'favorite', icon: 'star-outline', active: app.favorite },
    ],
    [app.cvTailored, app.motivation, app.favorite],
  );

  const dateLabel = formatDateTime(app.date);
  const notePreview = truncate(app.note);

  const handleDelete = () => {
    Alert.alert('Delete application', 'Remove this application?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(app.id) },
    ]);
  };

  return (
    <View
      style={[
        styles.appCard,
        { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
      ]}
    >
      <View style={styles.appHeader}>
        <View style={styles.appTitle}>
          <Text style={[styles.appCompany, { color: colors.text }]}>{app.company}</Text>
          <Text style={styles.appRole}>{app.role}</Text>
          {notePreview ? <Text style={styles.appNote}>{notePreview}</Text> : null}
        </View>
        <View style={styles.appsCardMeta}>
          {dateLabel ? <Text style={styles.appMetaText}>{dateLabel}</Text> : null}
          <View style={styles.appsCardActions}>
            <TouchableOpacity
              onPress={() => onEdit?.(app)}
              style={[styles.appsActionButton, { borderColor: colors.surfaceBorder }]}
            >
              <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.appsActionButton, { borderColor: colors.surfaceBorder }]}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.rose} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.appExtras}>
        {extras.map((extra, extraIndex) => {
          const marginStyle = { marginRight: extraIndex === extras.length - 1 ? 0 : 8 };
          if (extra.active) {
            return (
              <LinearGradient
                key={extra.key}
                colors={[colors.sky, colors.emerald]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.appExtraIcon, marginStyle]}
              >
                <MaterialCommunityIcons name={extra.icon} size={14} color="#0f172a" />
              </LinearGradient>
            );
          }
          return (
            <View
              key={extra.key}
              style={[
                styles.appExtraIcon,
                marginStyle,
                { backgroundColor: colors.chipBg, borderColor: colors.surfaceBorder, borderWidth: 1 },
              ]}
            >
              <MaterialCommunityIcons name={extra.icon} size={14} color="rgba(148,163,184,.95)" />
            </View>
          );
        })}
      </View>

      <View style={[styles.appFooter, { borderTopColor: colors.surfaceBorder }]}>
        <View style={styles.appChips}>
          <View
            style={[
              styles.appChip,
              { backgroundColor: colors.chipBg, borderColor: colors.surfaceBorder, marginRight: 8 },
            ]}
          >
            {statusInfo.icon ? (
              <MaterialCommunityIcons
                name={statusInfo.icon}
                size={14}
                color={statusInfo.tint || colors.text}
                style={styles.appChipIcon}
              />
            ) : null}
            <Text style={[styles.appChipText, { color: colors.text }]}>{status?.key || app.status}</Text>
          </View>
          <View
            style={[
              styles.appChip,
              { backgroundColor: colors.chipBg, borderColor: colors.surfaceBorder },
            ]}
          >
            <Text style={[styles.appChipText, { color: colors.text }]}>{app.platform}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default memo(ApplicationCard);

const styles = StyleSheet.create({
  appCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  appTitle: {
    flex: 1,
    marginRight: 12,
  },
  appCompany: {
    fontSize: 15,
    fontWeight: '700',
  },
  appRole: {
    fontSize: 12,
    color: 'rgba(148,163,184,.95)',
    marginTop: 2,
  },
  appNote: {
    fontSize: 11,
    color: 'rgba(148,163,184,.95)',
    marginTop: 6,
  },
  appsCardMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  appMetaText: {
    fontSize: 11,
    color: 'rgba(148,163,184,.95)',
  },
  appsCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  appsActionButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appExtras: {
    flexDirection: 'row',
    marginTop: 12,
  },
  appExtraIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  appChips: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  appChipIcon: {
    marginRight: 6,
  },
  appChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
