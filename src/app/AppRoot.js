import React from 'react';
import BottomTabNavigator from './navigation/BottomTabNavigator';
import { AppStateProvider } from '../state';
import { PaletteProvider, ThemeProvider } from '../theme';

const AppProviders = ({ children }) => (
  <ThemeProvider>
    <PaletteProvider>
      <AppStateProvider>{children}</AppStateProvider>
    </PaletteProvider>
  </ThemeProvider>
);

const AppRoot = () => {
  return (
    <AppProviders>
      <BottomTabNavigator />
    </AppProviders>
  );
};

export default AppRoot;
export { AppProviders };
