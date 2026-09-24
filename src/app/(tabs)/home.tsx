import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeDashboard } from '@/components/home-dashboard';
import { getAppTheme, HERO_STOPS } from '@/constants/app-theme';
import { useAppTheme } from '@/hooks/theme-provider';

export default function HomeTab() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const t = getAppTheme(isDark);

  return (
    // Hero-colored backdrop so the status-bar strip blends into the dark header.
    // Status bar style is owned by (tabs)/_layout.tsx (always "light" on home).
    <SafeAreaView style={[styles.safeArea, { backgroundColor: HERO_STOPS.from }]} edges={['top']}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, width: '100%', maxWidth: 440, alignSelf: 'center' },
});
