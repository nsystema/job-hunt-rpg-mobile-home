import { useEffect, useState } from "react";

export function useTheme() {
  const getInitial = () => (typeof window !== "undefined" && localStorage.getItem("jh_theme")) || "system";
  const [mode, setMode] = useState(getInitial);
  const effective = mode !== "system"
    ? mode
    : (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("jh_theme", mode);
      document.documentElement.dataset.theme = effective;
    }
  }, [mode, effective]);
  return {
    mode,
    eff: effective,
    cycle: () => setMode(m => m === "light" ? "dark" : m === "dark" ? "system" : "light"),
  };
}
