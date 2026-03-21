'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type ThemeName = 'default' | 'rose';
type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeName;
  mode: ThemeMode;
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'default',
  mode: 'light',
  setTheme: () => undefined,
  setMode: () => undefined,
  toggleMode: () => undefined,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('default');
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('wbc-theme') as ThemeName | null;
    const savedMode = localStorage.getItem('wbc-mode') as ThemeMode | null;
    if (savedTheme) setThemeState(savedTheme);
    if (savedMode) setModeState(savedMode);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-mode', mode);
    localStorage.setItem('wbc-theme', theme);
    localStorage.setItem('wbc-mode', mode);
  }, [theme, mode]);

  const setTheme = (t: ThemeName) => setThemeState(t);
  const setMode = (m: ThemeMode) => setModeState(m);
  const toggleMode = () => setModeState((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
