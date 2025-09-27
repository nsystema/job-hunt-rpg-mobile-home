import React, { useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import ApplicationsScreen from '../screens/ApplicationsScreen';
import QuestsScreen from '../screens/QuestsScreen';
import RewardsScreen from '../screens/RewardsScreen';
import ShopScreen from '../screens/ShopScreen';
import { useAppStateSelectors } from '../../state';
import { useColors } from '../../theme';

const BOTTOM_TABS = [
  { key: 'Home', label: 'Home', icon: 'home-variant' },
  { key: 'Apps', label: 'Apps', icon: 'briefcase-outline' },
  { key: 'Quests', label: 'Quests', icon: 'clipboard-check-outline' },
  { key: 'Rewards', label: 'Rewards', icon: 'treasure-chest' },
  { key: 'Shop', label: 'Shop', icon: 'shopping-outline' },
];

const SCREEN_MAP = {
  Home: HomeScreen,
  Apps: ApplicationsScreen,
  Quests: QuestsScreen,
  Rewards: RewardsScreen,
  Shop: ShopScreen,
};

const BottomTabNavigator = ({ initialTab = 'Home' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const { tabBadges } = useAppStateSelectors();
  const colors = useColors();

  const ScreenComponent = useMemo(() => SCREEN_MAP[activeTab] || View, [activeTab]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.screenContainer}>
        <ScreenComponent />
      </View>
      <View style={[styles.tabBar, { borderTopColor: colors.surfaceBorder }]}>
        {BOTTOM_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const badgeCount = tabBadges?.[tab.key];
          const showBadge = Number.isFinite(badgeCount) && badgeCount > 0;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.key)}
              accessibilityRole="button"
              accessibilityLabel={`Switch to ${tab.label} tab`}
            >
              <View
                style={[
                  styles.iconWrapper,
                  {
                    backgroundColor: isActive ? colors.sky : 'transparent',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={22}
                  color={isActive ? '#0f172a' : colors.text}
                />
                {showBadge ? (
                  <View style={[styles.badge, { backgroundColor: colors.rose }]}>
                    <Text style={styles.badgeText}>{badgeCount}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.tabLabel, { color: isActive ? colors.sky : colors.text }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#0f172a',
  },
});

export default BottomTabNavigator;
export { BOTTOM_TABS };
