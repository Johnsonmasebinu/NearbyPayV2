import {
  ArrowRight01Icon,
  BankIcon,
  BiometricAccessIcon,
  BluetoothIcon,
  Camera01Icon,
  Cancel01Icon,
  CheckmarkBadge01Icon,
  Copy01Icon,
  CustomerSupportIcon,
  FlashIcon,
  HelpCircleIcon,
  IdentityCardIcon,
  InformationCircleIcon,
  LockPasswordIcon,
  Logout03Icon,
  MonitorSmartphoneIcon,
  Moon02Icon,
  Notification03Icon,
  PencilEdit01Icon,
  QrCodeIcon,
  Share01Icon,
  SmartPhone01Icon,
  Sun03Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import QRCodeView from '@/components/ui/qr-code';
import { AvatarPickerSheet } from '@/components/ui/avatar-picker-sheet';
import { PinSheet, type PinSheetMode } from '@/components/ui/pin-sheet';
import { useToast } from '@/components/ui/toast';
import { getAppTheme } from '@/constants/app-theme';
import type { ThemeMode } from '@/constants/theme';
import { useAppTheme } from '@/hooks/theme-provider';
import { useAuth } from '@/hooks/auth-provider';
import { useUserProfile } from '@/hooks/user-profile-provider';

export function ProfileScreen() {
  const { isDark, mode, setMode } = useAppTheme();
  const t = getAppTheme(isDark);
  const { show } = useToast();
  const insets = useSafeAreaInsets();
  const { signOut, hasPin } = useAuth();
  const { profile, updateAvatar, updateProfile } = useUserProfile();

  // Settings & preferences toggles
  const [nearbyDiscovery, setNearbyDiscovery] = useState(true);
  const [offlineAutoPay, setOfflineAutoPay] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sheets / Modals
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [pinSheetVisible, setPinSheetVisible] = useState(false);
  const [pinSheetMode, setPinSheetMode] = useState<PinSheetMode>('change');
  const [qrSheetVisible, setQrSheetVisible] = useState(false);
  const [editSheetVisible, setEditSheetVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [aboutSheetVisible, setAboutSheetVisible] = useState(false);

  // Edit form state
  const [formName, setFormName] = useState(profile.name);
  const [formTag, setFormTag] = useState(profile.tag);
  const [formPhone, setFormPhone] = useState(profile.phone);
  const [formBio, setFormBio] = useState(profile.bio);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      show({ message: 'Profile synced with NearbyPay network', variant: 'success' });
    }, 700);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // fallback
    }
    show({ message: `Copied ${label} to clipboard!`, variant: 'success' });
  };

  const openEditSheet = () => {
    setFormName(profile.name);
    setFormTag(profile.tag);
    setFormPhone(profile.phone);
    setFormBio(profile.bio);
    setEditSheetVisible(true);
  };

  const handleSaveProfile = () => {
    if (!formName.trim()) {
      show({ message: 'Name cannot be empty', variant: 'error' });
      return;
    }
    updateProfile({
      name: formName.trim(),
      tag: formTag.trim().replace(/^[@$]/, ''),
      phone: formPhone.trim(),
      bio: formBio.trim(),
    });
    setEditSheetVisible(false);
    show({ message: 'Profile updated successfully!', variant: 'success' });
  };

  const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun03Icon }[] = [
    { value: 'light', label: 'Light', icon: Sun03Icon },
    { value: 'dark', label: 'Dark', icon: Moon02Icon },
    { value: 'system', label: 'System', icon: MonitorSmartphoneIcon },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.pageBg }]}
      contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 24) + 64 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.brand} />
      }>
      {/* ─── Screen Header ───────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Profile</Text>
        <TouchableOpacity
          style={[styles.headerIconButton, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
          activeOpacity={0.7}
          onPress={() => setQrSheetVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Open QR Code">
          <HugeiconsIcon icon={QrCodeIcon} size={18} color={t.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ─── Profile Identity Hero Card ──────────────────────────── */}
      <View style={[styles.profileHeroCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarTouch}
            activeOpacity={0.85}
            onPress={() => setAvatarPickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Change avatar image">
            <Image
              source={{ uri: profile.avatar }}
              style={styles.avatarImg}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            <View style={[styles.cameraBadge, { backgroundColor: t.brand, borderColor: t.cardBg }]}>
              <HugeiconsIcon icon={Camera01Icon} size={13} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.nameSection}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: t.textPrimary }]}>{profile.name}</Text>
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={18} color={t.brand} />
            </View>

            <TouchableOpacity
              style={[styles.tagPill, { backgroundColor: t.brandTint }]}
              activeOpacity={0.7}
              onPress={() => copyToClipboard(`$${profile.tag}`, 'Nearby Tag')}
              accessibilityRole="button"
              accessibilityLabel="Copy Nearby Tag">
              <Text style={[styles.tagPillText, { color: t.brand }]}>${profile.tag}</Text>
              <HugeiconsIcon icon={Copy01Icon} size={11} color={t.brand} />
            </TouchableOpacity>

            <Text style={[styles.userBio, { color: t.textSecondary }]} numberOfLines={2}>
              {profile.bio || 'Making fast, secure proximity payments.'}
            </Text>
          </View>
        </View>

        {/* Action Pills Row */}
        <View style={[styles.heroActionsRow, { borderTopColor: t.divider }]}>
          <TouchableOpacity
            style={[styles.heroActionBtn, { backgroundColor: t.chipBg, borderColor: t.cardBorder }]}
            activeOpacity={0.7}
            onPress={openEditSheet}>
            <HugeiconsIcon icon={PencilEdit01Icon} size={15} color={t.textPrimary} />
            <Text style={[styles.heroActionBtnText, { color: t.textPrimary }]}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.heroActionBtn, { backgroundColor: t.chipBg, borderColor: t.cardBorder }]}
            activeOpacity={0.7}
            onPress={() => setQrSheetVisible(true)}>
            <HugeiconsIcon icon={QrCodeIcon} size={15} color={t.textPrimary} />
            <Text style={[styles.heroActionBtnText, { color: t.textPrimary }]}>My QR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.heroActionBtn, { backgroundColor: t.chipBg, borderColor: t.cardBorder }]}
            activeOpacity={0.7}
            onPress={() => copyToClipboard(`https://nearbypay.me/$${profile.tag}`, 'Profile link')}>
            <HugeiconsIcon icon={Share01Icon} size={15} color={t.textPrimary} />
            <Text style={[styles.heroActionBtnText, { color: t.textPrimary }]}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Virtual Bank Account Card ───────────────────────────── */}
      <View style={[styles.bankCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
        <View style={styles.bankCardTop}>
          <View style={[styles.bankIconCircle, { backgroundColor: t.brandTint }]}>
            <HugeiconsIcon icon={BankIcon} size={18} color={t.brand} />
          </View>
          <View style={styles.bankCardInfo}>
            <Text style={[styles.bankCardLabel, { color: t.textSecondary }]}>VIRTUAL DEPOSIT ACCOUNT</Text>
            <Text style={[styles.bankCardBankName, { color: t.textPrimary }]}>{profile.bankName}</Text>
          </View>
        </View>

        <View style={[styles.accountBox, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
          <View>
            <Text style={[styles.accountNumberText, { color: t.textPrimary }]}>
              {profile.accountNumber.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}
            </Text>
            <Text style={[styles.accountHolderText, { color: t.textSecondary }]}>
              {profile.name} • NearbyPay
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.copyPill, { backgroundColor: t.brand }]}
            activeOpacity={0.8}
            onPress={() => copyToClipboard(profile.accountNumber, 'Account number')}>
            <HugeiconsIcon icon={Copy01Icon} size={13} color="#FFFFFF" />
            <Text style={styles.copyPillText}>Copy</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bankCardFooter}>
          <View style={[styles.onlineIndicatorDot, { backgroundColor: t.success }]} />
          <Text style={[styles.bankCardFooterText, { color: t.textSecondary }]}>
            Auto-credits instantly • Zero deposit fees
          </Text>
        </View>
      </View>

      {/* ─── Group 1: Appearance & Display ───────────────────────── */}
      <View style={styles.sectionGroup}>
        <Text style={[styles.sectionHeaderTitle, { color: t.textSecondary }]}>APPEARANCE</Text>
        <View style={[styles.groupedCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
          <View style={styles.appearanceRow}>
            <View style={styles.appearanceLabelWrap}>
              <Text style={[styles.rowItemTitle, { color: t.textPrimary }]}>Theme Mode</Text>
              <Text style={[styles.rowItemSubtitle, { color: t.textSecondary }]}>
                {mode === 'dark' ? 'Dark theme active' : mode === 'light' ? 'Light theme active' : 'System auto match'}
              </Text>
            </View>

            <View style={[styles.segmentedTrack, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
              {themeOptions.map((opt) => {
                const isActive = mode === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.segmentItem,
                      isActive && [styles.segmentItemActive, { backgroundColor: t.brand }],
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setMode(opt.value)}>
                    <HugeiconsIcon
                      icon={opt.icon}
                      size={14}
                      color={isActive ? '#FFFFFF' : t.textSecondary}
                    />
                    <Text
                      style={[
                        styles.segmentText,
                        { color: isActive ? '#FFFFFF' : t.textSecondary },
                      ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>

      {/* ─── Group 2: Payment & Mesh Preferences ─────────────────── */}
      <View style={styles.sectionGroup}>
        <Text style={[styles.sectionHeaderTitle, { color: t.textSecondary }]}>PAYMENTS & MESH</Text>
        <View style={[styles.groupedCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
          {/* Nearby Bluetooth Discovery */}
          <View style={styles.groupedRow}>
            <View style={[styles.rowIconWrap, { backgroundColor: t.brandTint }]}>
              <HugeiconsIcon icon={BluetoothIcon} size={18} color={t.brand} />
            </View>
            <View style={styles.rowContentWrap}>
              <Text style={[styles.rowItemTitle, { color: t.textPrimary }]}>Nearby Discovery</Text>
              <Text style={[styles.rowItemSubtitle, { color: t.textSecondary }]}>
                Broadcast over BLE to nearby merchants & peers
              </Text>
            </View>
            <Switch
              value={nearbyDiscovery}
              onValueChange={setNearbyDiscovery}
              trackColor={{ false: t.chipBg, true: t.brand }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.rowDivider, { backgroundColor: t.divider }]} />

          {/* Offline Quick-Pay */}
          <View style={styles.groupedRow}>
            <View style={[styles.rowIconWrap, { backgroundColor: t.brandTint }]}>
              <HugeiconsIcon icon={FlashIcon} size={18} color={t.brand} />
            </View>
            <View style={styles.rowContentWrap}>
              <Text style={[styles.rowItemTitle, { color: t.textPrimary }]}>Offline Quick-Pay</Text>
              <Text style={[styles.rowItemSubtitle, { color: t.textSecondary }]}>
                Auto-approve cryptographic offline vouchers under ₦5,000
              </Text>
            </View>
            <Switch
              value={offlineAutoPay}
              onValueChange={setOfflineAutoPay}
              trackColor={{ false: t.chipBg, true: t.brand }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>

      {/* ─── Group 3: Security & Access ──────────────────────────── */}
      <View style={styles.sectionGroup}>
        <Text style={[styles.sectionHeaderTitle, { color: t.textSecondary }]}>SECURITY</Text>
        <View style={[styles.groupedCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
          {/* Biometrics */}
          <View style={styles.groupedRow}>
            <View style={[styles.rowIconWrap, { backgroundColor: t.brandTint }]}>
              <HugeiconsIcon icon={BiometricAccessIcon} size={18} color={t.brand} />
            </View>
            <View style={styles.rowContentWrap}>
              <Text style={[styles.rowItemTitle, { color: t.textPrimary }]}>Biometric Unlock</Text>
              <Text style={[styles.rowItemSubtitle, { color: t.textSecondary }]}>
                Face ID / Touch ID for app access & transfers
              </Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={setBiometricsEnabled}
              trackColor={{ false: t.chipBg, true: t.brand }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.rowDivider, { backgroundColor: t.divider }]} />

          {/* Transaction PIN */}
          <TouchableOpacity
            style={styles.groupedRow}
            activeOpacity={0.65}
            onPress={() => {
              setPinSheetMode(hasPin ? 'change' : 'setup');
              setPinSheetVisible(true);
            }}>
            <View style={[styles.rowIconWrap, { backgroundColor: t.brandTint }]}>
              <HugeiconsIcon icon={LockPasswordIcon} size={18} color={t.brand} />
            </View>
            <View style={styles.rowContentWrap}>
              <Text style={[styles.rowItemTitle, { color: t.textPrimary }]}>Transaction PIN</Text>
              <Text style={[styles.rowItemSubtitle, { color: t.textSecondary }]}>
                {hasPin ? 'Protected • Tap to change PIN' : 'Not set up • Tap to create PIN'}
              </Text>
            </View>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} color={t.iconColor} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: t.divider }]} />

          {/* Two-Factor Authentication */}
          <TouchableOpacity
            style={styles.groupedRow}
            activeOpacity={0.65}
            onPress={() => show({ message: '2FA is active across your registered devices', variant: 'success' })}>
            <View style={[styles.rowIconWrap, { backgroundColor: t.successTint }]}>
              <HugeiconsIcon icon={IdentityCardIcon} size={18} color={t.success} />
            </View>
            <View style={styles.rowContentWrap}>
              <Text style={[styles.rowItemTitle, { color: t.textPrimary }]}>Two-Factor Authentication</Text>
              <Text style={[styles.rowItemSubtitle, { color: t.textSecondary }]}>SMS & Authenticator</Text>
            </View>
            <View style={[styles.activeStatusPill, { backgroundColor: t.successTint }]}>
              <Text style={[styles.activeStatusText, { color: t.success }]}>Active</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Group 4: Notifications & Haptics ────────────────────── */}
      <View style={styles.sectionGroup}>
        <Text style={[styles.sectionHeaderTitle, { color: t.textSecondary }]}>NOTIFICATIONS</Text>
        <View style={[styles.groupedCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
          {/* Push alerts */}
          <View style={styles.groupedRow}>
            <View style={[styles.rowIconWrap, { backgroundColor: t.brandTint }]}>
              <HugeiconsIcon icon={Notification03Icon} size={18} color={t.brand} />
            </View>
            <View style={styles.rowContentWrap}>
              <Text style={[styles.rowItemTitle, { color: t.textPrimary }]}>Push Notifications</Text>
              <Text style={[styles.rowItemSubtitle, { color: t.textSecondary }]}>
                Real-time sent & received payment alerts
              </Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: t.chipBg, true: t.brand }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.rowDivider, { backgroundColor: t.divider }]} />

          {/* Haptics */}
          <View style={styles.groupedRow}>
            <View style={[styles.rowIconWrap, { backgroundColor: t.brandTint }]}>
              <HugeiconsIcon icon={SmartPhone01Icon} size={18} color={t.brand} />
            </View>
            <View style={styles.rowContentWrap}>
              <Text style={[styles.rowItemTitle, { color: t.textPrimary }]}>Sound & Haptics</Text>
              <Text style={[styles.rowItemSubtitle, { color: t.textSecondary }]}>
                Haptic vibration on transfer completion
              </Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ false: t.chipBg, true: t.brand }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>

      {/* ─── Group 5: Support & Info ─────────────────────────────── */}
      <View style={styles.sectionGroup}>
        <Text style={[styles.sectionHeaderTitle, { color: t.textSecondary }]}>SUPPORT & ABOUT</Text>
        <View style={[styles.groupedCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
          {/* Live Support */}
          <TouchableOpacity
            style={styles.groupedRow}
            activeOpacity={0.65}
            onPress={() => show({ message: 'Connecting with NearbyPay 24/7 Concierge...', variant: 'info' })}>
            <View style={[styles.rowIconWrap, { backgroundColor: t.brandTint }]}>
              <HugeiconsIcon icon={CustomerSupportIcon} size={18} color={t.brand} />
            </View>
            <View style={styles.rowContentWrap}>
              <Text style={[styles.rowItemTitle, { color: t.textPrimary }]}>24/7 Live Support</Text>
              <Text style={[styles.rowItemSubtitle, { color: t.textSecondary }]}>Chat with our customer team</Text>
            </View>
            <View style={[styles.activeStatusPill, { backgroundColor: t.successTint }]}>
              <Text style={[styles.activeStatusText, { color: t.success }]}>Online</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: t.divider }]} />

          {/* Help & FAQs */}
          <TouchableOpacity
            style={styles.groupedRow}
            activeOpacity={0.65}
            onPress={() => show({ message: 'Opening NearbyPay Help Center & FAQs...', variant: 'info' })}>
            <View style={[styles.rowIconWrap, { backgroundColor: t.brandTint }]}>
              <HugeiconsIcon icon={HelpCircleIcon} size={18} color={t.brand} />
            </View>
            <View style={styles.rowContentWrap}>
              <Text style={[styles.rowItemTitle, { color: t.textPrimary }]}>Help & FAQs</Text>
              <Text style={[styles.rowItemSubtitle, { color: t.textSecondary }]}>Payment guides & security tips</Text>
            </View>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} color={t.iconColor} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: t.divider }]} />

          {/* About NearbyPay */}
          <TouchableOpacity
            style={styles.groupedRow}
            activeOpacity={0.65}
            onPress={() => setAboutSheetVisible(true)}>
            <View style={[styles.rowIconWrap, { backgroundColor: t.brandTint }]}>
              <HugeiconsIcon icon={InformationCircleIcon} size={18} color={t.brand} />
            </View>
            <View style={styles.rowContentWrap}>
              <Text style={[styles.rowItemTitle, { color: t.textPrimary }]}>About NearbyPay</Text>
              <Text style={[styles.rowItemSubtitle, { color: t.textSecondary }]}>Version 2.4.0</Text>
            </View>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} color={t.iconColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Group 6: Destructive Action ─────────────────────────── */}
      <View style={styles.sectionGroup}>
        <View style={[styles.groupedCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
          <TouchableOpacity
            style={styles.logoutRow}
            activeOpacity={0.7}
            onPress={() => setLogoutModalVisible(true)}>
            <View style={[styles.logoutIconCircle, { backgroundColor: t.dangerTint }]}>
              <HugeiconsIcon icon={Logout03Icon} size={18} color={t.danger} />
            </View>
            <Text style={[styles.logoutText, { color: t.danger }]}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.versionFootnote, { color: t.textSecondary }]}>
        NearbyPay v2.4.0 (Build 412) • Bank-grade encrypted
      </Text>

      {/* ─── BOTTOM SHEET: QR Code ───────────────────────────────── */}
      <Modal
        visible={qrSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setQrSheetVisible(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalBackdropTouch}
            activeOpacity={1}
            onPress={() => setQrSheetVisible(false)}
          />
          <View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: t.cardBg,
                borderColor: t.cardBorder,
                paddingBottom: Math.max(insets.bottom, 20) + 12,
              },
            ]}>
            <View style={[styles.sheetHandle, { backgroundColor: t.divider }]} />

            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.sheetTitle, { color: t.textPrimary }]}>Receive via QR</Text>
                <Text style={[styles.sheetSubtitle, { color: t.textSecondary }]}>
                  Scan to transfer money directly to {profile.name}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.sheetCloseBtn, { backgroundColor: t.chipBg }]}
                activeOpacity={0.7}
                onPress={() => setQrSheetVisible(false)}>
                <HugeiconsIcon icon={Cancel01Icon} size={16} color={t.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* QR Card */}
            <View style={styles.qrCardCenter}>
              <View style={[styles.qrCodeWrapper, { borderColor: t.cardBorder }]}>
                <QRCodeView value={`nearbypay://pay/${profile.tag}`} size={190} color="#0A1E3C" />
              </View>

              <View style={[styles.qrTagChip, { backgroundColor: t.brandTint }]}>
                <Text style={[styles.qrTagChipText, { color: t.brand }]}>${profile.tag}</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.sheetActionRow}>
              <TouchableOpacity
                style={[styles.sheetActionBtnSecondary, { backgroundColor: t.chipBg, borderColor: t.cardBorder }]}
                activeOpacity={0.75}
                onPress={() => {
                  copyToClipboard(`https://nearbypay.me/$${profile.tag}`, 'Profile link');
                  setQrSheetVisible(false);
                }}>
                <HugeiconsIcon icon={Copy01Icon} size={16} color={t.textPrimary} />
                <Text style={[styles.sheetActionBtnSecondaryText, { color: t.textPrimary }]}>Copy Link</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetActionBtnPrimary, { backgroundColor: t.brand }]}
                activeOpacity={0.85}
                onPress={() => {
                  setQrSheetVisible(false);
                  show({ message: 'QR Code saved to gallery!', variant: 'success' });
                }}>
                <HugeiconsIcon icon={Share01Icon} size={16} color="#FFFFFF" />
                <Text style={styles.sheetActionBtnPrimaryText}>Save & Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── BOTTOM SHEET: Edit Profile ──────────────────────────── */}
      <Modal
        visible={editSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditSheetVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalBackdropTouch}
            activeOpacity={1}
            onPress={() => setEditSheetVisible(false)}
          />
          <View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: t.cardBg,
                borderColor: t.cardBorder,
                paddingBottom: Math.max(insets.bottom, 20) + 12,
              },
            ]}>
            <View style={[styles.sheetHandle, { backgroundColor: t.divider }]} />

            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.sheetTitle, { color: t.textPrimary }]}>Edit Profile</Text>
                <Text style={[styles.sheetSubtitle, { color: t.textSecondary }]}>
                  Update your public NearbyPay details
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.sheetCloseBtn, { backgroundColor: t.chipBg }]}
                activeOpacity={0.7}
                onPress={() => setEditSheetVisible(false)}>
                <HugeiconsIcon icon={Cancel01Icon} size={16} color={t.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.editFormScroll}>
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: t.textSecondary }]}>Full Name</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.textPrimary }]}
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="Enter full name"
                  placeholderTextColor={t.muted}
                />
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: t.textSecondary }]}>Nearby Tag</Text>
                <View style={[styles.formTagWrap, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
                  <Text style={[styles.formTagPrefix, { color: t.brand }]}>$</Text>
                  <TextInput
                    style={[styles.formTagInput, { color: t.textPrimary }]}
                    value={formTag}
                    onChangeText={setFormTag}
                    placeholder="cashtag"
                    placeholderTextColor={t.muted}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: t.textSecondary }]}>Phone Number</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.textPrimary }]}
                  value={formPhone}
                  onChangeText={setFormPhone}
                  placeholder="+234..."
                  placeholderTextColor={t.muted}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: t.textSecondary }]}>Bio</Text>
                <TextInput
                  style={[styles.formInput, styles.formInputMultiline, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.textPrimary }]}
                  value={formBio}
                  onChangeText={setFormBio}
                  placeholder="Short bio or payment note"
                  placeholderTextColor={t.muted}
                  multiline
                  numberOfLines={2}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: t.brand }]}
                activeOpacity={0.85}
                onPress={handleSaveProfile}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── MODAL: Log Out Confirmation ─────────────────────────── */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}>
        <View style={styles.centerModalBackdrop}>
          <View style={[styles.centerModalCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
            <View style={[styles.logoutModalIconWrap, { backgroundColor: t.dangerTint }]}>
              <HugeiconsIcon icon={Logout03Icon} size={28} color={t.danger} />
            </View>

            <Text style={[styles.logoutModalTitle, { color: t.textPrimary }]}>Log Out?</Text>
            <Text style={[styles.logoutModalSubtitle, { color: t.textSecondary }]}>
              Are you sure you want to log out of NearbyPay? You will need your PIN or credentials to sign back in.
            </Text>

            <View style={styles.logoutModalBtnRow}>
              <TouchableOpacity
                style={[styles.logoutCancelBtn, { backgroundColor: t.chipBg, borderColor: t.cardBorder }]}
                activeOpacity={0.7}
                onPress={() => setLogoutModalVisible(false)}>
                <Text style={[styles.logoutCancelBtnText, { color: t.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.logoutConfirmBtn, { backgroundColor: t.danger }]}
                activeOpacity={0.85}
                onPress={async () => {
                  setLogoutModalVisible(false);
                  try {
                    await signOut();
                    show({ message: 'You have been safely logged out.', variant: 'info' });
                  } catch (e: any) {
                    show({ message: e.message || 'Error signing out', variant: 'error' });
                  }
                }}>
                <Text style={styles.logoutConfirmBtnText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── BOTTOM SHEET: About NearbyPay ───────────────────────── */}
      <Modal
        visible={aboutSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAboutSheetVisible(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalBackdropTouch}
            activeOpacity={1}
            onPress={() => setAboutSheetVisible(false)}
          />
          <View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: t.cardBg,
                borderColor: t.cardBorder,
                paddingBottom: Math.max(insets.bottom, 20) + 12,
              },
            ]}>
            <View style={[styles.sheetHandle, { backgroundColor: t.divider }]} />

            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.sheetTitle, { color: t.textPrimary }]}>About NearbyPay</Text>
                <Text style={[styles.sheetSubtitle, { color: t.textSecondary }]}>
                  Next-generation contactless proximity payments
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.sheetCloseBtn, { backgroundColor: t.chipBg }]}
                activeOpacity={0.7}
                onPress={() => setAboutSheetVisible(false)}>
                <HugeiconsIcon icon={Cancel01Icon} size={16} color={t.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.aboutContent}>
              <View style={[styles.aboutLogoCircle, { backgroundColor: t.brandTint }]}>
                <Image
                  source={require('@/assets/images/logo/logo.png')}
                  style={styles.aboutLogoImg}
                  contentFit="contain"
                />
              </View>
              <Text style={[styles.aboutAppName, { color: t.textPrimary }]}>NearbyPay v2.4.0</Text>
              <Text style={[styles.aboutAppTagline, { color: t.brand }]}>Nearby Payments That Just Work</Text>

              <Text style={[styles.aboutDescText, { color: t.textSecondary }]}>
                NearbyPay enables instantaneous, secure proximity payments between friends and local merchants,
                combining Bluetooth Low Energy discovery with high-speed settlement infrastructure.
              </Text>

              <View style={[styles.hackathonBox, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
                <Text style={[styles.hackathonHeader, { color: t.textSecondary }]}>DESIGNED &amp; BUILT BY</Text>
                <Text style={[styles.hackathonName, { color: t.textPrimary }]}>Johnson Masebinu</Text>
                <Text style={[styles.hackathonName, { color: t.textPrimary }]}>Onukwu Ifeanyichukwu Boluwatife</Text>
              </View>

              <Text style={[styles.aboutCopyright, { color: t.muted }]}>
                © 2026 NearbyPay Inc. All rights reserved.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Avatar Picker Bottom Sheet ─────────────────────────── */}
      <AvatarPickerSheet
        visible={avatarPickerVisible}
        currentAvatar={profile.avatar}
        onSelect={(newUrl) => {
          updateAvatar(newUrl);
          show({ message: 'Avatar updated across NearbyPay!', variant: 'success' });
        }}
        onClose={() => setAvatarPickerVisible(false)}
      />

      {/* ─── Transaction PIN Management Sheet ────────────────────── */}
      <PinSheet
        visible={pinSheetVisible}
        mode={pinSheetMode}
        onClose={() => setPinSheetVisible(false)}
        onSuccess={() => setPinSheetVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  headerTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 26,
    letterSpacing: -0.5,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Profile Hero Card */
  profileHeroCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 },
      web: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
    }),
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  avatarTouch: {
    position: 'relative',
  },
  avatarImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameSection: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  tagPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  tagPillText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
  },
  userBio: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  heroActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  heroActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  heroActionBtnText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
  },

  /* Virtual Bank Account Card */
  bankCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 8 },
    }),
  },
  bankCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bankIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankCardInfo: {
    flex: 1,
  },
  bankCardLabel: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  bankCardBankName: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    marginTop: 1,
  },
  accountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  accountNumberText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    letterSpacing: 1,
  },
  accountHolderText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  copyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  copyPillText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  bankCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onlineIndicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  bankCardFooterText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11,
  },

  /* Grouped Inset Sections */
  sectionGroup: {
    gap: 6,
  },
  sectionHeaderTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    paddingHorizontal: 6,
  },
  groupedCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  groupedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContentWrap: {
    flex: 1,
  },
  rowItemTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
  },
  rowItemSubtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  rowDivider: {
    height: 1,
    marginLeft: 60,
  },
  activeStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activeStatusText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 11,
  },

  /* Appearance Row */
  appearanceRow: {
    padding: 16,
    gap: 12,
  },
  appearanceLabelWrap: {
    gap: 2,
  },
  segmentedTrack: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 9,
  },
  segmentItemActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
  },

  /* Logout Row */
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  logoutIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
  },
  versionFootnote: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },

  /* Modal & Sheet Overlays */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouch: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* QR Modal Specific */
  qrCardCenter: {
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  qrCodeWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  qrTagChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  qrTagChipText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 15,
  },
  sheetActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  sheetActionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  sheetActionBtnSecondaryText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
  },
  sheetActionBtnPrimary: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
  },
  sheetActionBtnPrimaryText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },

  /* Edit Form Specific */
  editFormScroll: {
    maxHeight: 400,
  },
  formField: {
    marginBottom: 14,
    gap: 6,
  },
  formLabel: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  formInput: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 14,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  formInputMultiline: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  formTagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  formTagPrefix: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    marginRight: 4,
  },
  formTagInput: {
    flex: 1,
    fontFamily: 'Montserrat_500Medium',
    fontSize: 14,
    paddingVertical: 11,
  },
  saveBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 12,
  },
  saveBtnText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },

  /* Center Logout Modal */
  centerModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centerModalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    gap: 12,
  },
  logoutModalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoutModalTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  logoutModalSubtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  logoutModalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    width: '100%',
  },
  logoutCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutCancelBtnText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
  },
  logoutConfirmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  logoutConfirmBtnText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },

  /* About Modal Specific */
  aboutContent: {
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  aboutLogoCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  aboutLogoImg: {
    width: 32,
    height: 32,
  },
  aboutAppName: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  aboutAppTagline: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
  },
  aboutDescText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    paddingHorizontal: 8,
  },
  hackathonBox: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  hackathonHeader: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  hackathonName: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
  },
  aboutCopyright: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11,
    marginTop: 6,
  },
});
