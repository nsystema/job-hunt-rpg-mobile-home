import React from "react";
import { Coins } from "lucide-react";
import { Grey } from "../data.jsx";

export default function GoldPill({ c, children, dim = false, onClick, className = "" }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-[12px] ${className}`}
      style={{
        background: dim
          ? c.chipBg
          : `linear-gradient(90deg, ${c.amber}, ${c.rose})`,
        color: dim ? Grey : "#0f172a",
        cursor: onClick && dim ? "not-allowed" : undefined
      }}
      title={dim ? "Not enough gold" : undefined}
    >
      <Coins className="w-4 h-4" />
      {children}
    </Tag>
  );
}
