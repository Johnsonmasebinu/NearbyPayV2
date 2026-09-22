import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { Colors, type ThemeMode } from '@/constants/theme';

type ThemeColors = (typeof Colors)['light'] | (typeof Colors)['dark'];

type ThemeContextValue = {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';

  const setModeStable = useCallback((next: ThemeMode) => setMode(next), []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? Colors.dark : Colors.light,
      isDark,
      mode,
      setMode: setModeStable,
    }),
    [isDark, mode, setModeStable],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used within ThemeModeProvider');
  }
  return ctx;
}
