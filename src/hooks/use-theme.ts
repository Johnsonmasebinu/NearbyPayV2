import { useAppTheme } from '@/hooks/theme-provider';

export function useTheme() {
  const { colors } = useAppTheme();
  return colors;
}
