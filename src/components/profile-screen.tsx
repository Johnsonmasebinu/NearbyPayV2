import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  DocumentValidationIcon,
  HelpCircleIcon,
  InformationCircleIcon,
  Logout03Icon,
  MonitorSmartphoneIcon,
  Moon02Icon,
  PencilEdit01Icon,
  SecurityCheckIcon,
  Settings01Icon,
  ShieldKeyIcon,
  Sun03Icon,
  Tick02Icon,
  UserIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/theme-provider';
import type { ThemeColors } from '@/constants/theme';
import type { ThemeMode } from '@/constants/theme';
import { useToast } from '@/components/ui/toast';
import type { IconSvgElement } from '@hugeicons/react-native';

const PROFILE = {
  name: 'Chinedu Okafor',
  email: 'chinedu.okafor@gmail.com',
  phone: '+234 803 123 4567',
  avatar: 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_23.png',
};

type SettingsRow = {
  id: string;
  label: string;
  hint?: string;
  icon: IconSvgElement;
  showChevron?: boolean;
};

const ACCOUNT_ROWS: SettingsRow[] = [
  { id: 'edit-profile', label: 'Edit profile', icon: PencilEdit01Icon, showChevron: true },
  { id: 'kyc', label: 'KYC verification', hint: 'Verified', icon: DocumentValidationIcon, showChevron: true },
  { id: 'payment-methods', label: 'Payment methods', hint: '2 cards', icon: Settings01Icon, showChevron: true },
];

const SECURITY_ROWS: SettingsRow[] = [
  { id: 'change-pin', label: 'Change PIN', icon: ShieldKeyIcon, showChevron: true },
];

const SUPPORT_ROWS: SettingsRow[] = [
  { id: 'help', label: 'Help center', icon: HelpCircleIcon, showChevron: true },
  { id: 'about', label: 'About NearbyPay', hint: 'v1.0.0', icon: InformationCircleIcon, showChevron: true },
];

export default function ProfileScreen() {
  const { colors, isDark, mode, setMode } = useAppTheme();
  const { show } = useToast();
  const styles = createStyles(colors);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [faceIdEnabled, setFaceIdEnabled] = useState(true);
  const [showAbout, setShowAbout] = useState(false);

  const appearanceOptions: { value: ThemeMode; label: string; icon: IconSvgElement }[] = [
    { value: 'light', label: 'Light', icon: Sun03Icon },
    { value: 'dark', label: 'Dark', icon: Moon02Icon },
    { value: 'system', label: 'Auto', icon: MonitorSmartphoneIcon },
  ];

  const handleRowPress = (row: SettingsRow) => {
    if (row.id === 'about') {
      setShowAbout(true);
      return;
    }
    show({ message: `${row.label} coming soon.`, variant: 'info' });
  };

  const renderRow = (row: SettingsRow, isLast: boolean) => (
    <TouchableOpacity
      key={row.id}
      style={[styles.settingsRow, isLast && styles.settingsRowLast]}
      activeOpacity={0.6}
      onPress={() => handleRowPress(row)}>
      <View style={styles.settingsRowIcon}>
        <HugeiconsIcon icon={row.icon} size={16} color={colors.brandSoft} />
      </View>
      <Text style={styles.settingsRowLabel}>{row.label}</Text>
      {row.hint && <Text style={styles.settingsRowHint}>{row.hint}</Text>}
      {row.showChevron && (
        <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={colors.navIcon} />
      )}
    </TouchableOpacity>
  );

  if (showAbout) {
    return (
      <View style={styles.safeArea}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.container}>
          <View style={styles.aboutTopBar}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => setShowAbout(false)}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.aboutTitle}>About NearbyPay</Text>
            <View style={styles.backButton} />
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.aboutContent}
            showsVerticalScrollIndicator={false}>
            <Image
              source={require('@/assets/images/logo/logo.png')}
              style={styles.aboutLogo}
              resizeMode="contain"
            />
            <Text style={styles.aboutAppName}>NearbyPay</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0</Text>

            <View style={styles.aboutSectionCard}>
              <Text style={styles.aboutSectionTitle}>Our Mission</Text>
              <Text style={styles.aboutBody}>
                NearbyPay makes paying merchants effortless. Send money
                directly from your account to any merchant near you — even
                when you are offline. Only the merchant needs to be online to
                receive payments, so you can pay anytime, anywhere, without
                worrying about your connection.
              </Text>
            </View>

            <View style={styles.aboutSectionCard}>
              <Text style={styles.aboutSectionTitle}>How It Works</Text>
              <View style={styles.aboutFeatureRow}>
                <View style={styles.aboutFeatureDot} />
                <Text style={styles.aboutBody}>
                  Transfer money from your user account to nearby merchants
                </Text>
              </View>
              <View style={styles.aboutFeatureRow}>
                <View style={styles.aboutFeatureDot} />
                <Text style={styles.aboutBody}>
                  Merchants stay online to receive payments in real time
                </Text>
              </View>
              <View style={styles.aboutFeatureRow}>
                <View style={styles.aboutFeatureDot} />
                <Text style={styles.aboutBody}>
                  No internet? No problem — you can pay while offline
                </Text>
              </View>
              <View style={styles.aboutFeatureRow}>
                <View style={styles.aboutFeatureDot} />
                <Text style={styles.aboutBody}>
                  Earn commission points on every transaction
                </Text>
              </View>
            </View>

            <View style={[styles.aboutSectionCard, styles.aboutCreditCard]}>
              <Text style={styles.aboutCreditLabel}>Hackathon Project</Text>
              <Text style={styles.aboutBody}>
                Built with dedication during a hackathon by:
              </Text>
              <View style={styles.aboutCreditRow}>
                <Text style={styles.aboutCreditName}>Johnson Masebinu</Text>
                <Text style={styles.aboutCreditName}>Onukwu Ifeanyichukwu Boluwatife</Text>
              </View>
            </View>

            <View style={styles.aboutSectionCard}>
              <Text style={styles.aboutSectionTitle}>Contact</Text>
              <Text style={styles.aboutBody}>
                Questions or feedback? We would love to hear from you at
                support@nearbypay.com
              </Text>
            </View>

            <Text style={styles.aboutFooter}>
              © 2026 NearbyPay. All rights reserved.
            </Text>
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.container}>
        <Text style={styles.screenTitle}>Profile</Text>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: PROFILE.avatar }} style={styles.avatar} resizeMode="cover" />
              <View style={styles.verifiedBadge}>
                <HugeiconsIcon icon={Tick02Icon} size={9} color="#FFFFFF" strokeWidth={2.8} />
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{PROFILE.name}</Text>
              <Text style={styles.profileEmail}>{PROFILE.email}</Text>
              <Text style={styles.profilePhone}>{PROFILE.phone}</Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              activeOpacity={0.7}
              onPress={() => handleRowPress({ id: 'edit-profile', label: 'Edit profile', icon: PencilEdit01Icon })}>
              <HugeiconsIcon icon={PencilEdit01Icon} size={13} color={colors.brandSoft} />
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>148</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>2,450</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>2 yrs</Text>
              <Text style={styles.statLabel}>Member</Text>
            </View>
          </View>

          {/* Appearance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appearance</Text>
            <View style={styles.sectionCard}>
              <View style={styles.appearanceRow}>
                <Text style={styles.settingsRowLabel}>Theme</Text>
                <View style={styles.segmentWrap}>
                  {appearanceOptions.map((option) => {
                    const isActive = mode === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[styles.segmentItem, isActive && styles.segmentItemActive]}
                        activeOpacity={0.7}
                        onPress={() => setMode(option.value)}>
                        <HugeiconsIcon
                          icon={option.icon}
                          size={13}
                          color={isActive ? '#FFFFFF' : colors.navIcon}
                        />
                        <Text style={[styles.segmentLabel, isActive && styles.segmentLabelActive]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>

          {/* Account */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.sectionCard}>
              <View style={styles.settingsRow}>
                <View style={styles.settingsRowIcon}>
                  <HugeiconsIcon icon={UserIcon} size={16} color={colors.brandSoft} />
                </View>
                <Text style={styles.settingsRowLabel}>Push notifications</Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: colors.divider, true: colors.brand }}
                  thumbColor="#FFFFFF"
                  style={styles.switchStyle}
                />
              </View>
              {ACCOUNT_ROWS.map((row, index) =>
                renderRow(row, index === ACCOUNT_ROWS.length - 1),
              )}
            </View>
          </View>

          {/* Security */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>
            <View style={styles.sectionCard}>
              <View style={styles.settingsRow}>
                <View style={styles.settingsRowIcon}>
                  <HugeiconsIcon icon={SecurityCheckIcon} size={16} color={colors.brandSoft} />
                </View>
                <Text style={styles.settingsRowLabel}>Face ID unlock</Text>
                <Switch
                  value={faceIdEnabled}
                  onValueChange={setFaceIdEnabled}
                  trackColor={{ false: colors.divider, true: colors.brand }}
                  thumbColor="#FFFFFF"
                  style={styles.switchStyle}
                />
              </View>
              {SECURITY_ROWS.map((row, index) =>
                renderRow(row, index === SECURITY_ROWS.length - 1),
              )}
            </View>
          </View>

          {/* Support */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <View style={styles.sectionCard}>
              {SUPPORT_ROWS.map((row, index) =>
                renderRow(row, index === SUPPORT_ROWS.length - 1),
              )}
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.7}
            onPress={() => show({ message: 'Logged out (demo).', variant: 'info' })}>
            <HugeiconsIcon icon={Logout03Icon} size={16} color={colors.danger} />
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>NearbyPay v1.0.0</Text>
        </ScrollView>
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.background,
    },
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
    },
    contentInner: {
      paddingHorizontal: 16,
      paddingBottom: 40,
    },
    screenTitle: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 24,
      color: c.text,
      letterSpacing: -0.5,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 14,
    },
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: 16,
      gap: 14,
    },
    avatarWrap: {
      position: 'relative',
    },
    avatar: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: c.backgroundSelected,
    },
    verifiedBadge: {
      position: 'absolute',
      bottom: -1,
      right: -1,
      width: 17,
      height: 17,
      borderRadius: 9,
      backgroundColor: '#0066FF',
      borderWidth: 2,
      borderColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 16,
      color: c.text,
      letterSpacing: -0.3,
    },
    profileEmail: {
      fontFamily: 'Montserrat_400Regular',
      fontSize: 11,
      color: c.textMuted,
      marginTop: 2,
    },
    profilePhone: {
      fontFamily: 'Montserrat_400Regular',
      fontSize: 11,
      color: c.textMuted,
      marginTop: 1,
    },
    editButton: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statsCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      paddingVertical: 14,
      marginTop: 12,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statValue: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 16,
      color: c.text,
    },
    statLabel: {
      fontFamily: 'Montserrat_500Medium',
      fontSize: 10,
      color: c.textMuted,
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      height: 30,
      backgroundColor: c.divider,
    },
    section: {
      marginTop: 18,
    },
    sectionTitle: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 13,
      color: c.textSecondary,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    sectionCard: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      paddingHorizontal: 4,
    },
    appearanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    segmentWrap: {
      flexDirection: 'row',
      backgroundColor: c.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: 3,
      gap: 2,
    },
    segmentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 9,
    },
    segmentItemActive: {
      backgroundColor: c.brandSoft,
    },
    segmentLabel: {
      fontFamily: 'Montserrat_600SemiBold',
      fontSize: 10,
      color: c.navIcon,
    },
    segmentLabelActive: {
      color: '#FFFFFF',
    },
    settingsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
      gap: 12,
    },
    settingsRowLast: {
      borderBottomWidth: 0,
    },
    settingsRowIcon: {
      width: 32,
      height: 32,
      borderRadius: 11,
      backgroundColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingsRowLabel: {
      flex: 1,
      fontFamily: 'Montserrat_600SemiBold',
      fontSize: 13,
      color: c.text,
    },
    settingsRowHint: {
      fontFamily: 'Montserrat_600SemiBold',
      fontSize: 10,
      color: c.success,
      backgroundColor: c.background,
      overflow: 'hidden',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    switchStyle: {
      transform: [{ scale: 0.85 }],
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.danger,
      paddingVertical: 14,
      marginTop: 24,
    },
    logoutText: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 13,
      color: c.danger,
    },
    versionText: {
      fontFamily: 'Montserrat_400Regular',
      fontSize: 10,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: 14,
    },
    aboutTopBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 10,
    },
    aboutTitle: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 16,
      color: c.text,
      letterSpacing: -0.3,
    },
    backButton: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    aboutContent: {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 40,
    },
    aboutLogo: {
      width: 72,
      height: 72,
    },
    aboutAppName: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 22,
      color: c.text,
      letterSpacing: -0.5,
      marginTop: 12,
    },
    aboutVersion: {
      fontFamily: 'Montserrat_500Medium',
      fontSize: 11,
      color: c.textMuted,
      marginTop: 3,
    },
    aboutSectionCard: {
      alignSelf: 'stretch',
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: 16,
      marginTop: 12,
    },
    aboutSectionTitle: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 13,
      color: c.text,
      letterSpacing: -0.2,
      marginBottom: 8,
    },
    aboutBody: {
      fontFamily: 'Montserrat_400Regular',
      fontSize: 12,
      color: c.textSecondary,
      lineHeight: 19,
      flex: 1,
    },
    aboutFeatureRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginTop: 8,
    },
    aboutFeatureDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.brand,
      marginTop: 6,
    },
    aboutCreditCard: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    aboutCreditLabel: {
      fontFamily: 'Montserrat_600SemiBold',
      fontSize: 10,
      color: c.textMuted,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    aboutCreditRow: {
      alignSelf: 'stretch',
      marginTop: 4,
      gap: 4,
    },
    aboutCreditName: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 14,
      color: c.text,
      textAlign: 'center',
      lineHeight: 21,
    },
    aboutFooter: {
      fontFamily: 'Montserrat_400Regular',
      fontSize: 10,
      color: c.textMuted,
      marginTop: 24,
      textAlign: 'center',
    },
  });
