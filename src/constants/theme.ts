/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0A1E3C',
    textSecondary: '#4A5E78',
    textMuted: '#64748B',
    background: '#EEF3FC',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    surface: '#FFFFFF',
    surfaceBorder: '#E2E8F0',
    divider: 'rgba(203, 213, 225, 0.45)',
    inputBg: '#F8FAFC',
    navIcon: '#627694',
    brand: '#1E44F8',
    brandDeep: '#112CC9',
    brandSoft: '#2146EB',
    accent: '#4F46E5',
    success: '#16A34A',
    danger: '#EF4444',
    warning: '#F59E0B',
    statusBar: 'dark',
    refreshBg: '#FFFFFF',
  },
  dark: {
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#8195B3',
    background: '#0B1120',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    surface: '#0F172A',
    surfaceBorder: '#1E293B',
    divider: 'rgba(30, 41, 59, 0.9)',
    inputBg: '#020617',
    navIcon: '#8195B3',
    brand: '#3B66FF',
    brandDeep: '#112CC9',
    brandSoft: '#4B63F5',
    accent: '#818CF8',
    success: '#22C55E',
    danger: '#F87171',
    warning: '#FBBF24',
    statusBar: 'light',
    refreshBg: '#0F172A',
  },
} as const;

export type ThemeMode = 'light' | 'dark' | 'system';

export type ThemeColors = (typeof Colors)['light'] | (typeof Colors)['dark'];

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
