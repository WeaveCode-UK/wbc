import React, { createContext, useContext, useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { themes } from '@wbc/shared/src/theme/colors';
import type { ThemeName, ThemeMode, ThemeColors } from '@wbc/shared/src/theme/colors';

interface ThemeContextValue {
  theme: ThemeName;
  mode: ThemeMode;
  colors: ThemeColors;
  setTheme: (t: ThemeName) => void;
  setMode: (m: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'default',
  mode: 'light',
  colors: themes.default.light,
  setTheme: () => undefined,
  setMode: () => undefined,
  toggleMode: () => undefined,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function NativeThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>('default');
  const [mode, setMode] = useState<ThemeMode>('light');

  const colors = useMemo(() => themes[theme][mode] as ThemeColors, [theme, mode]);
  const toggleMode = () => setMode((m) => (m === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, mode, colors, setTheme, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
