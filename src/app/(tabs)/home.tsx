import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeDashboard } from '@/components/home-dashboard';
import { getAppTheme, HERO_STOPS } from '@/constants/app-theme';
import { useAppTheme } from '@/hooks/theme-provider';

export default function HomeTab() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const t = getAppTheme(isDark);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: t.pageBg }]}>
      {/* Top status bar inset colored with hero background to blend seamlessly with dark header */}
      <View style={{ height: insets.top, backgroundColor: HERO_STOPS.from }} />
      <View style={[styles.container, { backgroundColor: t.pageBg }]}>
        <HomeDashboard
          onNavigate={(tab, transactionId) => {
            if (tab === 'more') {
              router.push('/more');
            } else if (tab === 'check-in') {
              router.push('/check-in');
            } else if (tab === 'history' && transactionId) {
              router.push(`/(tabs)/history?transactionId=${encodeURIComponent(transactionId)}`);
            } else {
              router.navigate(`/(tabs)/${tab}` as `/(tabs)/${'send' | 'receive' | 'history' | 'profile'}`);
            }
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, width: '100%', maxWidth: 440, alignSelf: 'center' },
});
