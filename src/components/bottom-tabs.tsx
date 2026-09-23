import {
    AddIcon,
    Clock01Icon,
    Home01Icon,
    Sent02Icon,
    UserIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { getAppTheme, GRADIENT_STOPS } from '@/constants/app-theme';
import { useAppTheme } from '@/hooks/theme-provider';

export type MainTabKey = 'home' | 'receive' | 'send' | 'history' | 'profile';

const LEFT_TABS: { id: MainTabKey; label: string; icon: typeof Home01Icon }[] = [
  { id: 'home', label: 'Home', icon: Home01Icon },
  { id: 'receive', label: 'Receive', icon: AddIcon },
];

const RIGHT_TABS: { id: MainTabKey; label: string; icon: typeof Home01Icon }[] = [
  { id: 'history', label: 'History', icon: Clock01Icon },
  { id: 'profile', label: 'Profile', icon: UserIcon },
];

interface BottomTabsProps {
  active: MainTabKey;
  onPress: (tab: MainTabKey) => void;
}

export function BottomTabs({ active, onPress }: BottomTabsProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const t = getAppTheme(isDark);

  const renderItem = ({ id, label, icon }: { id: MainTabKey; label: string; icon: typeof Home01Icon }) => {
    const isActive = active === id;
    return (
      <TouchableOpacity
        key={id}
        style={styles.navItem}
        activeOpacity={0.7}
        onPress={() => onPress(id)}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={label}>
        <View style={[styles.iconTile, isActive && { backgroundColor: t.brand }]}>
          <HugeiconsIcon icon={icon} size={20} color={isActive ? '#FFFFFF' : t.iconColor} />
        </View>
        <Text style={[styles.navLabel, { color: t.iconColor }, isActive && { color: t.textPrimary }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.bottomNavWrap}>
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: t.cardBg,
            borderTopColor: t.divider,
            paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 6),
          },
        ]}>
        {LEFT_TABS.map(renderItem)}
        <View style={styles.fabSlot} />
        {RIGHT_TABS.map(renderItem)}
      </View>

      <TouchableOpacity
        style={[styles.fab, { borderColor: t.pageBg }]}
        activeOpacity={0.85}
        onPress={() => onPress('send')}
        accessibilityRole="tab"
        accessibilityState={{ selected: active === 'send' }}
        accessibilityLabel="Send">
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="fabGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={GRADIENT_STOPS.from} />
              <Stop offset="100%" stopColor={GRADIENT_STOPS.to} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" rx={30} fill="url(#fabGrad)" />
        </Svg>
        <View style={styles.fabRing} pointerEvents="none" />
        <HugeiconsIcon icon={Sent02Icon} size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavWrap: {
    position: 'relative',
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    paddingHorizontal: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#1E2B6B',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.07,
        shadowRadius: 14,
      },
      android: {
        elevation: 10,
      },
      web: {
        shadowColor: '#1E2B6B',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.07,
        shadowRadius: 14,
      },
    }),
  },
  fabSlot: {
    width: 72,
  },
  fab: {
    position: 'absolute',
    top: -28,
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#2E45F4',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.32,
        shadowRadius: 14,
      },
      android: {
        elevation: 10,
      },
      web: {
        shadowColor: '#2E45F4',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.32,
        shadowRadius: 14,
      },
    }),
  },
  fabRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
    width: 60,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 10,
  },
});
