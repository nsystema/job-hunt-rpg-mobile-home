import React from "react";
import { Coins } from "lucide-react";
import { Grey } from "../data.jsx";

export default function GoldPill({ c, children, dim = false, onClick, className = "" }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={!dim ? onClick : undefined}
      className={`relative inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-extrabold ${className}`}
      style={{
        background: dim ? "rgba(148,163,184,.15)" : "linear-gradient(135deg,#fde68a,#f59e0b)",
        color: dim ? Grey : "#1f2937",
        border: "1px solid rgba(0,0,0,.08)",
        boxShadow: dim ? "none" : "0 8px 24px rgba(245,158,11,.45),0 2px 8px rgba(0,0,0,.08)",
        cursor: onClick && dim ? "not-allowed" : undefined
      }}
      title={dim ? "Not enough gold" : undefined}
    >
      <Coins className="w-4 h-4" />
      {children}
      {!dim && (
        <span className="pointer-events-none absolute inset-0 rounded-full overflow-hidden">
          <span
            className="absolute -left-full top-0 h-full w-1/2"
            style={{
              background:
                "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.5), rgba(255,255,255,0))",
              transform: "skewX(-20deg)",
              animation: "goldShine 2.4s infinite"
            }}
          />
        </span>
      )}
    </Tag>
  );
}
