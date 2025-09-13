import React from "react";
import { cur, P } from "../hooks/usePalette.js";

export default function Bg({ t, k }) {
  const c = cur(t, P[k]);
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 1440 1024" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="r1" cx="25%" cy="18%" r="60%">
            <stop offset="0%" stopColor={c.rose} stopOpacity={t === 'light' ? 0.9 : 0.35} />
            <stop offset="100%" stopColor={c.bg} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="r2" cx="80%" cy="72%" r="55%">
            <stop offset="0%" stopColor={c.sky} stopOpacity={t === 'light' ? 0.9 : 0.35} />
            <stop offset="100%" stopColor={c.bg} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="r3" cx="42%" cy="84%" r="45%">
            <stop offset="0%" stopColor={c.emerald} stopOpacity={t === 'light' ? 0.9 : 0.35} />
            <stop offset="100%" stopColor={c.bg} stopOpacity="0" />
          </radialGradient>
          <filter id="b20" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="40" />
          </filter>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope={t === 'light' ? "0.04" : "0.08"} />
            </feComponentTransfer>
          </filter>
        </defs>
        <rect width="1440" height="1024" fill={c.bg} />
        <rect width="1440" height="1024" fill="url(#r1)" />
        <rect width="1440" height="1024" fill="url(#r2)" />
        <rect width="1440" height="1024" fill="url(#r3)" />
        <g filter="url(#b20)" opacity={t === 'light' ? .7 : .55}>
          <circle cx="220" cy="840" r="180" fill={c.rose} />
          <circle cx="1260" cy="140" r="160" fill={c.sky} />
          <rect x="900" y="620" width="300" height="220" rx="56" fill={c.lilac} transform="rotate(18 1050 730)" />
          <path d="M200 200 C 360 80, 540 120, 620 300 C 700 480, 560 560, 460 600 C 320 650, 200 540, 220 420 Z" fill={c.emerald} />
        </g>
        <rect width="1440" height="1024" filter="url(#grain)" opacity={t === 'light' ? .35 : .5} />
      </svg>
    </div>
  );
}
