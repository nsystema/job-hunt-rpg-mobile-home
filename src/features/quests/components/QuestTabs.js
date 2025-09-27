import { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const QuestTabsComponent = ({ tabs, activeTab, onSelect, colors, badgeShadow, badgeCounts = {} }) => {
  if (!Array.isArray(tabs) || !tabs.length) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        const badge = badgeCounts[tab.key] || 0;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onSelect?.(tab.key)}
            activeOpacity={0.85}
            style={[styles.tabButton, { borderColor: colors.surfaceBorder, backgroundColor: colors.surface }]}
          >
            {isActive ? (
              <LinearGradient
                colors={[colors.sky, colors.emerald]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFillObject, styles.tabGradient]}
                pointerEvents="none"
              />
            ) : null}
            <View style={styles.tabContent}>
              <MaterialCommunityIcons
                name={tab.icon}
                size={16}
                color={isActive ? '#0f172a' : colors.text}
                style={styles.tabIcon}
              />
              <Text style={[styles.tabLabel, { color: isActive ? '#0f172a' : colors.text }]}>{tab.key}</Text>
            </View>
            {badge > 0 ? (
              <View style={[styles.badge, badgeShadow]}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tabGradient: {
    borderRadius: 12,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  tabIcon: {
    marginRight: 2,
  },
  tabLabel: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 13,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 8,
    backgroundColor: '#f43f5e',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#fff',
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 11,
  },
});

export const QuestTabs = memo(QuestTabsComponent);
export default QuestTabs;
