import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeDashboard } from '@/components/home-dashboard';
import { HERO_STOPS } from '@/constants/app-theme';

export default function HomeTab() {
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: HERO_STOPS.from }]} edges={['top']}>
      <StatusBar style="light" />
      <View style={[styles.container, { backgroundColor: HERO_STOPS.from }]}>
        <HomeDashboard
          onNavigate={(tab) => {
            if (tab === 'more') {
              router.push('/more');
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
