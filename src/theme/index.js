import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Appearance } from 'react-native';

const resolveSystemScheme = (scheme) => (scheme === 'dark' ? 'dark' : 'light');

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('system');
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

  const eff = mode === 'system' ? systemScheme : mode;

  const value = useMemo(
    () => ({
      mode,
      eff,
      setMode,
      cycle: () => setMode((current) => (current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light')),
    }),
    [mode, eff],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider.');
  }
  return context;
};

const mkPalette = (
  name,
  bgL,
  bgD,
  textL,
  textD,
  chipBorderL,
  chipBorderD,
  chipBgL,
  chipBgD,
  surfaceL,
  surfaceD,
  surfaceBorderL,
  surfaceBorderD,
  rose,
  amber,
  sky,
  emerald,
  lilac,
) => ({
  name,
  bgL,
  bgD,
  textL,
  textD,
  chipBorderL,
  chipBorderD,
  chipBgL,
  chipBgD,
  surfaceL,
  surfaceD,
  surfaceBorderL,
  surfaceBorderD,
  rose,
  amber,
  sky,
  emerald,
  lilac,
});

const PALETTES = {
  pastel: mkPalette(
    'Pastel',
    '#FAFAFA',
    '#0A0D14',
    '#0f172a',
    '#e5e7eb',
    'rgba(0,0,0,.06)',
    'rgba(255,255,255,.14)',
    'rgba(255,255,255,.80)',
    'rgba(255,255,255,.12)',
    'rgba(255,255,255,.90)',
    'rgba(17,24,39,.82)',
    'rgba(0,0,0,.06)',
    'rgba(255,255,255,.12)',
    '#fbcfe8',
    '#fde68a',
    '#bae6fd',
    '#bbf7d0',
    '#e9d5ff',
  ),
  ocean: mkPalette(
    'Ocean',
    '#F7FAFC',
    '#081018',
    '#0b1220',
    '#e6f0ff',
    'rgba(0,51,102,.08)',
    'rgba(173,216,230,.18)',
    'rgba(236,248,255,.82)',
    'rgba(14,28,44,.6)',
    'rgba(255,255,255,.94)',
    'rgba(10,20,30,.86)',
    'rgba(0,51,102,.08)',
    'rgba(173,216,230,.14)',
    '#b3e5fc',
    '#ffd166',
    '#60a5fa',
    '#34d399',
    '#93c5fd',
  ),
  sunset: mkPalette(
    'Sunset',
    '#FFF8F1',
    '#140B0A',
    '#1f1410',
    '#ffe9d6',
    'rgba(128,64,0,.12)',
    'rgba(255,200,150,.18)',
    'rgba(255,245,235,.86)',
    'rgba(41,20,14,.6)',
    'rgba(255,255,255,.94)',
    'rgba(35,18,14,.86)',
    'rgba(128,64,0,.12)',
    'rgba(255,200,150,.14)',
    '#fda4af',
    '#f59e0b',
    '#fdba74',
    '#84cc16',
    '#f9a8d4',
  ),
  forest: mkPalette(
    'Forest',
    '#F6FBF7',
    '#08130C',
    '#0b1f17',
    '#def7ec',
    'rgba(0,102,51,.10)',
    'rgba(200,255,220,.16)',
    'rgba(240,255,244,.86)',
    'rgba(10,22,14,.6)',
    'rgba(255,255,255,.94)',
    'rgba(12,24,18,.86)',
    'rgba(0,102,51,.10)',
    'rgba(200,255,220,.14)',
    '#a7f3d0',
    '#facc15',
    '#86efac',
    '#22c55e',
    '#bbf7d0',
  ),
  lavender: mkPalette(
    'Lavender',
    '#FBF7FF',
    '#0F0A14',
    '#2b2140',
    '#efe9ff',
    'rgba(80,0,160,.10)',
    'rgba(220,200,255,.18)',
    'rgba(250,245,255,.88)',
    'rgba(30,20,45,.6)',
    'rgba(255,255,255,.94)',
    'rgba(22,16,32,.86)',
    'rgba(80,0,160,.10)',
    'rgba(220,200,255,.14)',
    '#e9d5ff',
    '#f0abfc',
    '#a78bfa',
    '#8b5cf6',
    '#c4b5fd',
  ),
  mono: mkPalette(
    'Mono',
    '#F5F6F7',
    '#0B0D10',
    '#0f172a',
    '#e5e7eb',
    'rgba(0,0,0,.08)',
    'rgba(255,255,255,.14)',
    'rgba(255,255,255,.90)',
    'rgba(255,255,255,.08)',
    'rgba(255,255,255,.96)',
    'rgba(16,19,26,.88)',
    'rgba(0,0,0,.08)',
    'rgba(255,255,255,.12)',
    '#d1d5db',
    '#e5e7eb',
    '#cbd5e1',
    '#a1a1aa',
    '#e5e7eb',
  ),
};

const PALETTE_KEYS = Object.keys(PALETTES);

const PaletteContext = createContext(null);

export const PaletteProvider = ({ children }) => {
  const [key, setKey] = useState('pastel');

  const cycle = useCallback(() => {
    setKey((current) => {
      const index = PALETTE_KEYS.indexOf(current);
      const nextIndex = index === -1 ? 0 : (index + 1) % PALETTE_KEYS.length;
      return PALETTE_KEYS[nextIndex];
    });
  }, []);

  const value = useMemo(
    () => ({ key, palette: PALETTES[key], cycle, palettes: PALETTES }),
    [key, cycle],
  );

  return <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>;
};

export const usePalette = () => {
  const context = useContext(PaletteContext);
  if (!context) {
    throw new Error('usePalette must be used within a PaletteProvider.');
  }
  return context;
};

export const useColors = () => {
  const { eff } = useTheme();
  const { palette } = usePalette();

  return useMemo(
    () => ({
      bg: eff === 'light' ? palette.bgL : palette.bgD,
      text: eff === 'light' ? palette.textL : palette.textD,
      chipBorder: eff === 'light' ? palette.chipBorderL : palette.chipBorderD,
      chipBg: eff === 'light' ? palette.chipBgL : palette.chipBgD,
      surface: eff === 'light' ? palette.surfaceL : palette.surfaceD,
      surfaceBorder: eff === 'light' ? palette.surfaceBorderL : palette.surfaceBorderD,
      rose: palette.rose,
      amber: palette.amber,
      sky: palette.sky,
      emerald: palette.emerald,
      lilac: palette.lilac,
    }),
    [eff, palette],
  );
};

export default ThemeProvider;
