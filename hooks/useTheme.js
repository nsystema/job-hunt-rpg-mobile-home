import { useEffect, useState } from 'react';
import { Appearance } from 'react-native';

const resolveSystemScheme = (scheme) => (scheme === 'dark' ? 'dark' : 'light');

export function useTheme() {
  const getInitial = () => 'system';
  const [mode, setMode] = useState(getInitial);
  const [systemScheme, setSystemScheme] = useState(() =>
    resolveSystemScheme(Appearance.getColorScheme()),
  );

  useEffect(() => {
    if (mode !== 'system') {
      return undefined;
    }

    const handleAppearanceChange = ({ colorScheme }) => {
      setSystemScheme(resolveSystemScheme(colorScheme));
    };

    setSystemScheme(resolveSystemScheme(Appearance.getColorScheme()));

    const subscription =
      typeof Appearance.addChangeListener === 'function'
        ? Appearance.addChangeListener(handleAppearanceChange)
        : null;

    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      } else if (typeof Appearance.removeChangeListener === 'function') {
        Appearance.removeChangeListener(handleAppearanceChange);
      }
    };
  }, [mode]);

  const effective = mode === 'system' ? systemScheme : mode;

  return {
    mode,
    eff: effective,
    cycle: () => setMode((m) => (m === 'light' ? 'dark' : m === 'dark' ? 'system' : 'light')),
  };
}
