import React, { createContext, useContext, useState, useMemo } from "react";
import type { ReactNode } from "react";
import { themes, md3 } from "@wbc/shared/theme";
import type {
  ThemeName,
  ThemeMode,
  ThemeColors,
  MD3Colors,
} from "@wbc/shared/theme";

interface ThemeContextValue {
  theme: ThemeName;
  mode: ThemeMode;
  colors: ThemeColors;
  md3: MD3Colors;
  setTheme: (t: ThemeName) => void;
  setMode: (m: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "default",
  mode: "light",
  colors: themes.default.light,
  md3: md3.light,
  setTheme: () => undefined,
  setMode: () => undefined,
  toggleMode: () => undefined,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function NativeThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>("default");
  const [mode, setMode] = useState<ThemeMode>("light");

  const colors = useMemo(
    () => themes[theme][mode] as ThemeColors,
    [theme, mode],
  );
  const md3Colors = useMemo(() => md3[mode], [mode]);
  const toggleMode = () => setMode((m) => (m === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider
      value={{
        theme,
        mode,
        colors,
        md3: md3Colors,
        setTheme,
        setMode,
        toggleMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
