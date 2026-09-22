import { Tabs } from 'expo-router';

import { BottomTabs, type MainTabKey } from '@/components/bottom-tabs';

const VALID_TABS: MainTabKey[] = ['home', 'receive', 'send', 'history', 'profile'];

export default function TabsLayout() {
  return (
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
  );
}
