import { useEffect, useState } from 'react';
import { Appearance } from 'react-native';

export function useTheme() {
  const getInitial = () => 'system';
  const [mode, setMode] = useState(getInitial());
  
  const getSystemTheme = () => {
    const colorScheme = Appearance.getColorScheme();
    return colorScheme === 'dark' ? 'dark' : 'light';
  };
  
  const effective = mode !== 'system' ? mode : getSystemTheme();

  useEffect(() => {
    if (mode === 'system') {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        // This will trigger a re-render when system theme changes
      });
      return () => subscription?.remove();
    }
  }, [mode]);

  return {
    mode,
    eff: effective,
    cycle: () => setMode(m => m === 'light' ? 'dark' : m === 'dark' ? 'system' : 'light'),
  };
}