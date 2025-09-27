import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useAppState } from '../../state';
import { useColors } from '../../theme';

const ApplicationsScreen = () => {
  const { applications } = useAppState();
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <FlatList
        data={applications}
        keyExtractor={(item, index) => String(item?.id ?? index)}
        contentContainerStyle={applications.length ? styles.list : styles.emptyState}
        renderItem={({ item }) => (
          <View style={[styles.item, { borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.title, { color: colors.text }]}>{item?.role ?? 'Application'}</Text>
            <Text style={[styles.meta, { color: colors.text }]}>{item?.company ?? 'Unknown company'}</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text style={[styles.emptyText, { color: colors.text }]}>No applications logged yet.</Text>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 24,
    gap: 12,
  },
  emptyState: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    fontSize: 14,
    fontWeight: '400',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ApplicationsScreen;
