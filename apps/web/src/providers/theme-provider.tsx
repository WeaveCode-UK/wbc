"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type ThemeName = "default" | "rose";
type ThemeMode = "light" | "dark";

interface ThemeContextType {
  theme: ThemeName;
  mode: ThemeMode;
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "default",
  mode: "light",
  setTheme: () => undefined,
  setMode: () => undefined,
  toggleMode: () => undefined,
});

export function useTheme() {
  return useContext(ThemeContext);
}

// ACH-019: Persist theme in BOTH localStorage and cookie so SSR can read
// the cookie and render with the correct data-theme/data-mode on first
// paint (no flash of wrong theme). `initialTheme`/`initialMode` come from
// the server when available.
function writeCookie(name: string, value: string) {
  // 1-year TTL; SameSite=Lax is fine for preference cookies. Not HttpOnly
  // because the client needs to read it too; not a security-sensitive value.
  document.cookie = `${name}=${value}; Max-Age=31536000; Path=/; SameSite=Lax`;
}

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: ThemeName;
  initialMode?: ThemeMode;
}

export function ThemeProvider({
  children,
  initialTheme,
  initialMode,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeName>(initialTheme ?? "default");
  const [mode, setModeState] = useState<ThemeMode>(initialMode ?? "light");

  useEffect(() => {
    // Client-side hydration: prefer localStorage (explicit user choice)
    // then fall back to the cookie (what SSR used).
    const savedTheme = localStorage.getItem("wbc-theme") as ThemeName | null;
    const savedMode = localStorage.getItem("wbc-mode") as ThemeMode | null;
    if (savedTheme) setThemeState(savedTheme);
    if (savedMode) setModeState(savedMode);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-mode", mode);
    localStorage.setItem("wbc-theme", theme);
    localStorage.setItem("wbc-mode", mode);
    writeCookie("wbc-theme", theme);
    writeCookie("wbc-mode", mode);
  }, [theme, mode]);

  const setTheme = (t: ThemeName) => setThemeState(t);
  const setMode = (m: ThemeMode) => setModeState(m);
  const toggleMode = () =>
    setModeState((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider
      value={{ theme, mode, setTheme, setMode, toggleMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// Server-side helper — called by `app/layout.tsx` to read the cookie.
// Returns undefined on first visit (falls back to defaults).
export function parseThemeCookies(cookieHeader: string | null): {
  theme?: ThemeName;
  mode?: ThemeMode;
} {
  if (!cookieHeader) return {};
  const parsed = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((s) => s.trim().split("="))
      .filter((kv): kv is [string, string] => kv.length === 2),
  );
  const theme = parsed["wbc-theme"] === "rose" ? "rose" : undefined;
  const mode = parsed["wbc-mode"] === "dark" ? "dark" : undefined;
  return {
    theme: theme ?? (parsed["wbc-theme"] === "default" ? "default" : undefined),
    mode: mode ?? (parsed["wbc-mode"] === "light" ? "light" : undefined),
  };
}
