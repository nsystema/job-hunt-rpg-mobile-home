import React from "react";
import { Zap } from "lucide-react";
import { formatTime } from "../gameMechanics.js";

export default function EffectBar({ c, effects, setEffects }) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      setEffects?.((e) =>
        e.filter((fx) => !fx.expiresAt || fx.expiresAt > Date.now())
      );
    }, 1000);
    return () => clearInterval(id);
  }, [setEffects]);

  if (!effects.length) return null;

  return (
    <div className="flex items-center flex-wrap gap-1 mb-4">
      {effects.map((e, i) => {
        const Icon = e.icon || Zap;
        const remaining = e.expiresAt
          ? Math.max(0, (e.expiresAt - now) / 1000)
          : null;
        return (
          <div
            key={i}
            className="flex flex-col items-center w-10 text-center"
            title={e.description}
          >
            <div className="relative w-6 h-6 flex items-center justify-center">
              {remaining !== null && e.duration && (
                <svg className="absolute inset-0" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    stroke={c.surfaceBorder}
                    strokeWidth="2"
                    fill="none"
                    opacity="0.3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    stroke={c.emerald}
                    strokeWidth="2"
                    fill="none"
                    pathLength="1"
                    strokeDasharray="1"
                    strokeDashoffset={
                      1 - Math.max(0, Math.min(1, remaining / e.duration))
                    }
                  />
                </svg>
              )}
              <span className="relative z-10">
                <Icon className="w-4 h-4" />
              </span>
            </div>
            {remaining !== null && (
              <span
                className="mt-1 text-[8px] font-semibold leading-none tabular-nums"
                style={{ color: c.text }}
              >
                {formatTime(Math.ceil(remaining))}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

