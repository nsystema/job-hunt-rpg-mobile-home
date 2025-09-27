import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const StatBadge = ({ icon, count, colors }) => (
  <View style={[styles.statBadge, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
    <MaterialCommunityIcons name={icon} size={20} color={colors.text} />
    <View style={[styles.statBadgeCount, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <Text style={[styles.statBadgeCountText, { color: colors.text }]}>{count}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  statBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBadgeCount: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  statBadgeCountText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
