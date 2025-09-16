import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import ApplicationsScreen from './src/screens/ApplicationsScreen';
import QuestsScreen from './src/screens/QuestsScreen';
import RewardsScreen from './src/screens/RewardsScreen';
import ShopScreen from './src/screens/ShopScreen';
import { GameProvider } from './src/context/GameContext';
import { palette } from './src/constants/theme';
import { getIconComponent } from './src/constants/icons';

const Tab = createBottomTabNavigator();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent'
  }
};

const TAB_ICONS = {
  Home: 'Home',
  Applications: 'Briefcase',
  Quests: 'ClipboardList',
  Rewards: 'Gift',
  Shop: 'ShoppingBag'
};

export default function App() {
  return (
    <SafeAreaProvider>
      <GameProvider>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style="light" />
          <Tab.Navigator
            screenOptions={({ route }) => {
              const iconName = TAB_ICONS[route.name] || 'Sparkles';
              const Icon = getIconComponent(iconName);
              return {
                headerShown: false,
                tabBarShowLabel: true,
                tabBarActiveTintColor: palette.accent,
                tabBarInactiveTintColor: palette.textMuted,
                tabBarStyle: {
                  backgroundColor: 'rgba(15,23,42,0.95)',
                  borderTopColor: 'rgba(148,163,184,0.15)',
                  height: 70,
                  paddingBottom: 10,
                  paddingTop: 8
                },
                tabBarLabelStyle: {
                  fontSize: 12,
                  fontWeight: '600'
                },
                tabBarIcon: ({ color, size }) => <Icon size={size} color={color} />
              };
            }}
          >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Applications" component={ApplicationsScreen} />
            <Tab.Screen name="Quests" component={QuestsScreen} />
            <Tab.Screen name="Rewards" component={RewardsScreen} />
            <Tab.Screen name="Shop" component={ShopScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </GameProvider>
    </SafeAreaProvider>
  );
}
