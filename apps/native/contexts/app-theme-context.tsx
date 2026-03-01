import React, { createContext, useCallback, useContext, useMemo } from "react";
import { useColorScheme } from "nativewind";

type ThemeName = "light" | "dark";

type AppThemeContextType = {
  currentTheme: ThemeName;
  isLight: boolean;
  isDark: boolean;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
};

const AppThemeContext = createContext<AppThemeContextType | undefined>(undefined);

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { colorScheme, setColorScheme, toggleColorScheme } = useColorScheme();

  const isLight = colorScheme === "light";
  const isDark = colorScheme === "dark";

  const setTheme = useCallback(
    (newTheme: ThemeName) => {
      setColorScheme(newTheme);
    },
    [setColorScheme],
  );

  const value = useMemo(
    () => ({
      currentTheme: (colorScheme ?? "dark") as ThemeName,
      isLight,
      isDark,
      setTheme,
      toggleTheme: toggleColorScheme,
    }),
    [colorScheme, isLight, isDark, setTheme, toggleColorScheme],
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
};

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  return context;
}
