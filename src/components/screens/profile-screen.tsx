import { ArrowRight01Icon, Logout01Icon, Settings01Icon, Tick02Icon, UserIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Platform, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';

import { useToast } from '@/components/ui/toast';
import { getAppTheme } from '@/constants/app-theme';

// TODO(api): GET /me -> User, PATCH /me/preferences, POST /auth/logout

export function ProfileScreen() {
  const { show } = useToast();
  const isDark = useColorScheme() === 'dark';
  const t = getAppTheme(isDark);

  return (
    <View style={styles.content}>
      <Text style={[styles.eyebrow, { color: t.brand }]}>PROFILE</Text>
      <View
        style={[
          styles.card,
          { backgroundColor: t.cardBg, borderColor: t.cardBorder },
          Platform.select({
            ios: { shadowColor: '#1E2B6B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 14 },
            android: { elevation: 2 },
            web: { shadowColor: '#1E2B6B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 14 },
          }),
        ]}>
        <View style={[styles.avatar, { backgroundColor: t.brandTint }]}>
          <HugeiconsIcon icon={UserIcon} size={30} color={t.brand} />
        </View>
        <Text style={[styles.name, { color: t.textPrimary }]}>Chinedu Okafor</Text>
        <Text style={[styles.email, { color: t.textSecondary }]}>chinedu@email.com</Text>
        <View style={styles.badge}>
          <HugeiconsIcon icon={Tick02Icon} size={10} color="#FFFFFF" strokeWidth={3} />
          <Text style={styles.badgeText}>KYC Verified</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.row, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
        activeOpacity={0.7}
        onPress={() => show({ message: 'Settings opened.', variant: 'info' })}>
        <View style={[styles.rowIconWrap, { backgroundColor: t.brandTint }]}>
          <HugeiconsIcon icon={Settings01Icon} size={17} color={t.brand} />
        </View>
        <Text style={[styles.rowText, { color: t.textPrimary }]}>Settings</Text>
        <HugeiconsIcon icon={ArrowRight01Icon} size={16} color={t.iconColor} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.row, { backgroundColor: t.cardBg, borderColor: t.dangerTint }]}
        activeOpacity={0.7}
        onPress={() => show({ message: 'Logged out (wire backend).', variant: 'info' })}>
        <View style={[styles.rowIconWrap, { backgroundColor: t.dangerTint }]}>
          <HugeiconsIcon icon={Logout01Icon} size={17} color={t.danger} />
        </View>
        <Text style={[styles.rowText, { color: t.danger }]}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 12 },
  eyebrow: { fontFamily: 'Montserrat_700Bold', fontSize: 11, letterSpacing: 1.2 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 26,
    gap: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  name: { fontFamily: 'Montserrat_700Bold', fontSize: 19, letterSpacing: -0.3 },
  email: { fontFamily: 'Montserrat_400Regular', fontSize: 13 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#16A34A',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 10,
  },
  badgeText: { color: '#FFF', fontFamily: 'Montserrat_600SemiBold', fontSize: 11 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  rowIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    flex: 1,
  },
});
