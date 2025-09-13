import { useEffect, useState } from "react";

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
  candy: mk("Candy", "#FFF7FB", "#140A12", "#321227", "#ffe3f2", "rgba(160,0,120,.12)", "rgba(255,200,235,.18)", "rgba(255,245,252,.90)", "rgba(32,16,28,.6)", "rgba(255,255,255,.94)", "rgba(28,16,24,.86)", "rgba(160,0,120,.12)", "rgba(255,200,235,.14)", "#f9a8d4", "#f472b6", "#f0abfc", "#c084fc", "#e879f9"),
  neon: mk("Neon", "#F6FFFB", "#060B0B", "#071a18", "#d5fffb", "rgba(0,160,160,.12)", "rgba(150,255,255,.18)", "rgba(240,255,253,.90)", "rgba(6,14,14,.6)", "rgba(255,255,255,.96)", "rgba(8,16,16,.90)", "rgba(0,160,160,.12)", "rgba(150,255,255,.14)", "#22d3ee", "#a3e635", "#34d399", "#22c55e", "#67e8f9"),
  sepia: mk("Sepia", "#F8F4EC", "#0E0B08", "#2a2014", "#efe1c7", "rgba(80,60,20,.12)", "rgba(220,200,150,.18)", "rgba(255,252,244,.92)", "rgba(28,22,16,.6)", "rgba(255,255,255,.96)", "rgba(20,16,12,.88)", "rgba(80,60,20,.12)", "rgba(220,200,150,.14)", "#fbbf24", "#f59e0b", "#d6b88a", "#a3a380", "#e9d5b7"),
  royal: mk("Royal", "#F7F8FF", "#090A14", "#0b0f26", "#e6eaff", "rgba(40,60,180,.10)", "rgba(200,210,255,.18)", "rgba(244,246,255,.92)", "rgba(14,16,40,.64)", "rgba(255,255,255,.96)", "rgba(12,14,32,.90)", "rgba(40,60,180,.10)", "rgba(200,210,255,.14)", "#818cf8", "#a78bfa", "#60a5fa", "#34d399", "#c4b5fd"),
  citrus: mk("Citrus", "#FFFDF5", "#0D0A05", "#20160a", "#fff4cc", "rgba(160,120,0,.10)", "rgba(255,230,150,.18)", "rgba(255,252,235,.92)", "rgba(28,20,10,.6)", "rgba(255,255,255,.96)", "rgba(24,16,8,.90)", "rgba(160,120,0,.10)", "rgba(255,230,150,.14)", "#fde68a", "#fbbf24", "#fca5a5", "#86efac", "#fcd34d"),
};

const K = Object.keys(P);

export function usePalette() {
  const gi = () => (typeof window !== "undefined" && localStorage.getItem("jh_palette_key")) || "pastel";
  const [key, setKey] = useState(gi);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("jh_palette_key", key); }, [key]);
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
