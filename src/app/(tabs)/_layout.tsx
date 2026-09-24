import { Tabs, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { BottomTabs, type MainTabKey } from '@/components/bottom-tabs';
import { useAppTheme } from '@/hooks/theme-provider';

const VALID_TABS: MainTabKey[] = ['home', 'receive', 'send', 'history', 'profile'];

export default function TabsLayout() {
  const pathname = usePathname();
  const { isDark } = useAppTheme();

  // Single source of truth for the status bar inside tabs. Per-screen
  // <StatusBar> components were removed because multiple mounted instances
  // race (last-mount wins) and Home's "light" would get stuck when
  // navigating away. Home's hero header is dark in both themes, so it
  // always needs light icons; every other tab follows the theme.
  const isHome = pathname.includes('/home') || pathname.endsWith('(tabs)');
  const statusStyle = isHome ? 'light' : isDark ? 'light' : 'dark';

  return (
    <>
      <StatusBar style={statusStyle} />
      <Tabs
      screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
      tabBar={({ state, navigation }) => {
        const routeName = state.routes[state.index]?.name ?? 'home';
        const active: MainTabKey = (VALID_TABS.includes(routeName as MainTabKey)
          ? routeName
          : 'home') as MainTabKey;
        return (
          <BottomTabs
            active={active}
            onPress={(tab) => {
              if (tab !== active) {
                navigation.navigate(tab);
              }
            }}
          />
        );
      }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="receive" />
      <Tabs.Screen name="send" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="profile" />
      </Tabs>
    </>
  );
}
