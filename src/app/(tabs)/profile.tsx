import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileScreen } from '@/components/screens/profile-screen';
import { getAppTheme } from '@/constants/app-theme';
import { useAppTheme } from '@/hooks/theme-provider';

export default function ProfileTab() {
  const { isDark } = useAppTheme();
  const t = getAppTheme(isDark);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.pageBg }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.container, { backgroundColor: t.pageBg }]}>
        <ProfileScreen />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, width: '100%', maxWidth: 440, alignSelf: 'center' },
});
