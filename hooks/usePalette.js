import { useState } from 'react';

const mk = (name, bgL, bgD, textL, textD, cbL, cbD, cgL, cgD, sL, sD, sbL, sbD, rose, amber, sky, emerald, lilac) => ({
  name, bgL, bgD, textL, textD,
  chipBorderL: cbL, chipBorderD: cbD,
  chipBgL: cgL, chipBgD: cgD,
  surfaceL: sL, surfaceD: sD,
  surfaceBorderL: sbL, surfaceBorderD: sbD,
  rose, amber, sky, emerald, lilac,
});

export const P = {
  pastel: mk("Pastel", "#FAFAFA", "#0A0D14", "#0f172a", "#e5e7eb", "rgba(0,0,0,.06)", "rgba(255,255,255,.14)", "rgba(255,255,255,.80)", "rgba(255,255,255,.12)", "rgba(255,255,255,.90)", "rgba(17,24,39,.82)", "rgba(0,0,0,.06)", "rgba(255,255,255,.12)", "#fbcfe8", "#fde68a", "#bae6fd", "#bbf7d0", "#e9d5ff"),
  ocean: mk("Ocean", "#F7FAFC", "#081018", "#0b1220", "#e6f0ff", "rgba(0,51,102,.08)", "rgba(173,216,230,.18)", "rgba(236,248,255,.82)", "rgba(14,28,44,.6)", "rgba(255,255,255,.94)", "rgba(10,20,30,.86)", "rgba(0,51,102,.08)", "rgba(173,216,230,.14)", "#b3e5fc", "#ffd166", "#60a5fa", "#34d399", "#93c5fd"),
  sunset: mk("Sunset", "#FFF8F1", "#140B0A", "#1f1410", "#ffe9d6", "rgba(128,64,0,.12)", "rgba(255,200,150,.18)", "rgba(255,245,235,.86)", "rgba(41,20,14,.6)", "rgba(255,255,255,.94)", "rgba(35,18,14,.86)", "rgba(128,64,0,.12)", "rgba(255,200,150,.14)", "#fda4af", "#f59e0b", "#fdba74", "#84cc16", "#f9a8d4"),
  forest: mk("Forest", "#F6FBF7", "#08130C", "#0b1f17", "#def7ec", "rgba(0,102,51,.10)", "rgba(200,255,220,.16)", "rgba(240,255,244,.86)", "rgba(10,22,14,.6)", "rgba(255,255,255,.94)", "rgba(12,24,18,.86)", "rgba(0,102,51,.10)", "rgba(200,255,220,.14)", "#a7f3d0", "#facc15", "#86efac", "#22c55e", "#bbf7d0"),
  lavender: mk("Lavender", "#FBF7FF", "#0F0A14", "#2b2140", "#efe9ff", "rgba(80,0,160,.10)", "rgba(220,200,255,.18)", "rgba(250,245,255,.88)", "rgba(30,20,45,.6)", "rgba(255,255,255,.94)", "rgba(22,16,32,.86)", "rgba(80,0,160,.10)", "rgba(220,200,255,.14)", "#e9d5ff", "#f0abfc", "#a78bfa", "#8b5cf6", "#c4b5fd"),
  mono: mk("Mono", "#F5F6F7", "#0B0D10", "#0f172a", "#e5e7eb", "rgba(0,0,0,.08)", "rgba(255,255,255,.14)", "rgba(255,255,255,.90)", "rgba(255,255,255,.08)", "rgba(255,255,255,.96)", "rgba(16,19,26,.88)", "rgba(0,0,0,.08)", "rgba(255,255,255,.12)", "#d1d5db", "#e5e7eb", "#cbd5e1", "#a1a1aa", "#e5e7eb"),
};

const K = Object.keys(P);

export function usePalette() {
  const [key, setKey] = useState('pastel');
  return { key, cycle: () => setKey(k => K[(K.indexOf(k) + 1) % K.length]), pal: P[key] };
}

export const cur = (t, pal = P.pastel) => ({
  bg: t === 'light' ? pal.bgL : pal.bgD,
  text: t === 'light' ? pal.textL : pal.textD,
  chipBorder: t === 'light' ? pal.chipBorderL : pal.chipBorderD,
  chipBg: t === 'light' ? pal.chipBgL : pal.chipBgD,
  surface: t === 'light' ? pal.surfaceL : pal.surfaceD,
  surfaceBorder: t === 'light' ? pal.surfaceBorderL : pal.surfaceBorderD,
  rose: pal.rose, amber: pal.amber, sky: pal.sky, emerald: pal.emerald, lilac: pal.lilac,
});