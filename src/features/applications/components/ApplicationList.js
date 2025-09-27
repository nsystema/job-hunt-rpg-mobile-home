import { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ApplicationCard from './ApplicationCard';

const ApplicationList = ({
  applications,
  colors,
  statusIcons,
  statusLookup,
  onEdit,
  onDelete,
  onEmptyAction,
}) => {
  if (!applications.length) {
    return (
      <View
        style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
      >
        <Text style={[styles.emptyText, { color: colors.text }]}>No applications yet.</Text>
        <TouchableOpacity
          onPress={onEmptyAction}
          style={[styles.emptyButton, { backgroundColor: colors.sky }]}
        >
          <Text style={styles.emptyButtonText}>Log application</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return applications.map((app) => (
    <ApplicationCard
      key={app.id}
      app={app}
      colors={colors}
      statusInfo={statusIcons[app.status] || {}}
      status={statusLookup[app.status]}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  ));
};

export default memo(ApplicationList);

const styles = StyleSheet.create({
  emptyContainer: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    opacity: 0.75,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
});
