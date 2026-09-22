// Shared NearbyPay theme tokens — same values used on login/signup/forgot.
// Use via `getAppTheme(isDark)` so Home/History/Tabs match auth exactly.

export interface AppTheme {
  pageBg: string;
  cardBg: string;
  cardBorder: string;
  inputBg: string;
  inputBorder: string;
  textPrimary: string;
  textSecondary: string;
  muted: string;
  iconColor: string;
  divider: string;
  /** Primary action color (buttons, active chips, links) */
  brand: string;
  /** Deeper shade of brand for pressed states / gradient ends */
  brandDeep: string;
  /** Lighter blue end of the signature blue→indigo gradient */
  gradientFrom: string;
  /** Indigo end of the signature blue→indigo gradient */
  gradientTo: string;
  /** Soft tinted background for icon circles & highlighted tiles */
  brandTint: string;
  /** Stronger tint for icon circles on tinted banners */
  brandTintStrong: string;
  success: string;
  successTint: string;
  danger: string;
  dangerTint: string;
  warning: string;
  warningTint: string;
  /** Neutral chip / segmented-track background */
  chipBg: string;
}

export function getAppTheme(isDark: boolean): AppTheme {
  return {
    pageBg: isDark ? '#020617' : '#EEF3FC',
    cardBg: isDark ? '#0F172A' : '#FFFFFF',
    cardBorder: isDark ? '#1E293B' : '#E4EAF6',
    inputBg: isDark ? '#020617' : '#F8FAFC',
    inputBorder: isDark ? '#1E293B' : '#E2E8F0',
    textPrimary: isDark ? '#F8FAFC' : '#0A1E3C',
    textSecondary: isDark ? '#94A3B8' : '#5A6F8A',
    muted: isDark ? '#64748B' : '#64748B',
    iconColor: isDark ? '#94A3B8' : '#627694',
    divider: isDark ? '#1E293B' : 'rgba(226, 232, 240, 0.7)',
    brand: isDark ? '#5D7CFF' : '#2E45F4',
    brandDeep: isDark ? '#3E56E8' : '#2036D8',
    gradientFrom: isDark ? '#3B5BF0' : '#3D66F7',
    gradientTo: isDark ? '#4A3ADF' : '#4634EE',
    brandTint: isDark ? 'rgba(93, 124, 255, 0.16)' : '#EDF1FE',
    brandTintStrong: isDark ? 'rgba(93, 124, 255, 0.26)' : '#DCE4FD',
    success: isDark ? '#4ADE80' : '#16A34A',
    successTint: isDark ? 'rgba(74, 222, 128, 0.14)' : '#E7F8EF',
    danger: isDark ? '#F87171' : '#EF4444',
    dangerTint: isDark ? 'rgba(248, 113, 113, 0.14)' : '#FDEDED',
    warning: isDark ? '#FBBF24' : '#F59E0B',
    warningTint: isDark ? 'rgba(251, 191, 36, 0.14)' : '#FEF4E2',
    chipBg: isDark ? '#1E293B' : '#F1F4F9',
  };
}

/** Signature blue→indigo stops for react-native-svg LinearGradient fills. */
export const GRADIENT_STOPS = { from: '#3D66F7', to: '#4634EE' } as const;

/** Deep indigo-navy stops for the home hero header. */
export const HERO_STOPS = { from: '#1C1A55', to: '#2F2882' } as const;
