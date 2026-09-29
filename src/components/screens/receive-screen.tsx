import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  BubbleChatIcon,
  CheckmarkBadge01Icon,
  Copy01Icon,
  Download01Icon,
  LockPasswordIcon,
  MoreHorizontalIcon,
  ShieldCheckIcon,
  ShieldKeyIcon,
  TelegramIcon,
  WhatsappIcon,
} from '@/lib/icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { ContactlessCodeSheet } from '@/components/ui/contactless-code-sheet';
import QRCodeView from '@/components/ui/qr-code';
import { useToast } from '@/components/ui/toast';
import { getAppTheme, GRADIENT_STOPS } from '@/constants/app-theme';
import { useAuth } from '@/hooks/auth-provider';
import { succeed, tap, thud } from '@/lib/haptics';
import { useAppTheme } from '@/hooks/theme-provider';
import { useUserProfile } from '@/hooks/user-profile-provider';
import { createReceiveQrPayload } from '@/lib/receive-qr';

export function ReceiveScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { isDark } = useAppTheme();
  const t = getAppTheme(isDark);
  const { hasContactlessCode } = useAuth();
  const { profile } = useUserProfile();
  const [contactlessSheetVisible, setContactlessSheetVisible] = useState(false);

  const cleanTag = (profile.tag || 'user').trim().replace(/^[@$]/, '');
  const [receiveQr, setReceiveQr] = useState<{ tag: string; payload: string } | null>(null);
  const [isSavingQr, setIsSavingQr] = useState(false);
  const qrExportRef = useRef<View>(null);
  const isQrReady = hasContactlessCode && receiveQr?.tag === cleanTag;

  useEffect(() => {
    let isActive = true;
    void createReceiveQrPayload(cleanTag).then((payload) => {
      if (isActive) setReceiveQr({ tag: cleanTag, payload });
    }).catch(() => undefined);
    return () => {
      isActive = false;
    };
  }, [cleanTag]);

  const copyToClipboard = async (text: string, label: string) => {
    tap();
    try {
      await Clipboard.setStringAsync(text);
    } catch {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
    }
    show({ message: `${label} copied to clipboard!`, variant: 'success' });
  };

  // Pre-filled share text. The 8-digit contactless code is intentionally left
  // blank — the user types it into the chat app themselves, the app never
  // auto-shares the secret.
  const buildShareMessage = () => {
    const lines = [
      'Here is my NearbyPay cashtag! 💸',
      '',
      `Cashtag: @${cleanTag}`,
      `Name: ${profile.name}`,
      '',
      'To pay me:',
      '1. Open NearbyPay → Send → To Nearby Tag',
      '2. Enter my cashtag and the amount',
      `3. Enter my 8-digit code when asked (ask me for it)`,
      '',
      'My code: ',
    ];
    return lines.join('\n');
  };

  const fallbackSystemShare = async (message: string) => {
    try {
      await Share.share({ message });
    } catch {
      show({ message: 'Could not open share options.', variant: 'error' });
    }
  };

  const shareViaWhatsApp = async () => {
    tap();
    const message = buildShareMessage();
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        await fallbackSystemShare(message);
        return;
      }
      await Linking.openURL(url);
    } catch {
      show({ message: 'Could not open WhatsApp. Is it installed?', variant: 'error' });
    }
  };

  const shareViaTelegram = async () => {
    tap();
    const message = buildShareMessage();
    const url = `https://t.me/share/url?url=${encodeURIComponent('')}&text=${encodeURIComponent(message)}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        await fallbackSystemShare(message);
        return;
      }
      await Linking.openURL(url);
    } catch {
      show({ message: 'Could not open Telegram. Is it installed?', variant: 'error' });
    }
  };

  const shareViaSms = async () => {
    tap();
    const message = buildShareMessage();
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const url = `sms:${separator}body=${encodeURIComponent(message)}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        await fallbackSystemShare(message);
        return;
      }
      await Linking.openURL(url);
    } catch {
      show({ message: 'Could not open Messages.', variant: 'error' });
    }
  };

  const shareViaMore = async () => {
    tap();
    await fallbackSystemShare(buildShareMessage());
  };

  const handleDownloadQr = async () => {
    if (isSavingQr || !isQrReady || !receiveQr) return;
    thud();
    setIsSavingQr(true);
    try {
      const uri = await captureRef(qrExportRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.Asset.create(uri);
        succeed();
        show({ message: 'QR code saved to your gallery!', variant: 'success' });
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share NearbyPay QR code',
        });
      } else {
        show({ message: 'Allow gallery access to save the QR code.', variant: 'error' });
      }
    } catch {
      show({ message: 'Could not save QR code image.', variant: 'error' });
    } finally {
      setIsSavingQr(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: t.pageBg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.headerBtn, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
          activeOpacity={0.7}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} color={t.textPrimary} />
        </TouchableOpacity>
        <Text maxFontSizeMultiplier={1.3} style={[styles.headerTitle, { color: t.textPrimary }]}>Receive Money</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Main Blue Gradient QR Card */}
        <View style={styles.qrCardContainer}>
          <Svg style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="qrGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={GRADIENT_STOPS.from} />
                <Stop offset="100%" stopColor={GRADIENT_STOPS.to} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" rx={24} fill="url(#qrGrad)" />
          </Svg>

          {/* Captured into the downloadable PNG: solid brand background so the
              white logo/text stays visible in any gallery viewer */}
          <View ref={qrExportRef} collapsable={false} style={styles.qrShotCard}>
          {/* Logo & Header */}
          <View style={styles.qrHeader}>
            <View style={styles.logoRow}>
              <Image
                source={require('@/assets/images/logo/logo.png')}
                style={styles.logoMark}
                resizeMode="contain"
              />
              <Text maxFontSizeMultiplier={1.3} style={styles.logoText}>NearbyPay</Text>
            </View>
            <Text maxFontSizeMultiplier={1.3} style={styles.qrSubtitle}>
              {hasContactlessCode
                ? `Scan this QR code with NearbyPay to send to @${cleanTag}`
                : `Set up your security code to reveal your personal receive QR`}
            </Text>
          </View>

          {/* User Tag Chip */}
          <View style={styles.userTagBadge}>
            <Image
              source={{ uri: profile.avatar }}
              style={styles.badgeAvatar}
            />
            <View>
              <Text maxFontSizeMultiplier={1.3} style={styles.badgeName}>{profile.name}</Text>
              <Text maxFontSizeMultiplier={1.3} style={styles.badgeTag}>@{cleanTag}</Text>
            </View>
          </View>

          {/* QR Code Container */}
          <View style={[styles.qrContainer, !hasContactlessCode && styles.qrContainerSetup]}>
            {hasContactlessCode && receiveQr?.tag === cleanTag ? (
              <View collapsable={false} style={styles.qrSquare}>
                <View style={styles.qrWithLogo}>
                  <QRCodeView
                    value={receiveQr.payload}
                    size={170}
                    color="#0F172A"
                    backgroundColor="#FFFFFF"
                  />
                  <View style={styles.qrCenterBadge}>
                    <Image
                      source={require('@/assets/images/logo/icon-1024.png')}
                      style={styles.qrCenterMark}
                    />
                  </View>
                </View>
              </View>
            ) : hasContactlessCode ? (
              <View style={styles.qrSquare}>
                <ActivityIndicator color={GRADIENT_STOPS.from} size="small" />
                <Text maxFontSizeMultiplier={1.3} style={styles.qrSetupLoadingText}>Preparing secure QR...</Text>
              </View>
            ) : (
              <View style={styles.qrSetupCard}>
                {/* Security Badge Pill */}
                <View style={styles.setupBadgePill}>
                  <HugeiconsIcon icon={ShieldKeyIcon} size={13} color="#2563EB" strokeWidth={2.4} />
                  <Text maxFontSizeMultiplier={1.3} style={styles.setupBadgeText}>ONE-TIME SECURITY ACTIVATION</Text>
                </View>

                {/* Icon Circle */}
                <View style={styles.setupIconCircle}>
                  <HugeiconsIcon icon={LockPasswordIcon} size={28} color="#2563EB" strokeWidth={2.2} />
                </View>

                {/* Title & Subtitle */}
                <Text maxFontSizeMultiplier={1.3} style={styles.setupTitle}>Protect Your Receive QR</Text>
                <Text maxFontSizeMultiplier={1.3} style={styles.setupSubtitle}>
                  Set an 8-digit contactless PIN to safeguard offline transfers and unlock your instant payment QR code.
                </Text>

                {/* Trust / Benefit Chips */}
                <View style={styles.setupBenefitsRow}>
                  <View style={styles.setupBenefitChip}>
                    <HugeiconsIcon icon={CheckmarkBadge01Icon} size={13} color="#16A34A" strokeWidth={2.2} />
                    <Text maxFontSizeMultiplier={1.3} style={styles.setupBenefitText}>Offline Protection</Text>
                  </View>
                  <View style={styles.setupBenefitChip}>
                    <HugeiconsIcon icon={CheckmarkBadge01Icon} size={13} color="#16A34A" strokeWidth={2.2} />
                    <Text maxFontSizeMultiplier={1.3} style={styles.setupBenefitText}>Instant Receive</Text>
                  </View>
                </View>

                {/* Primary Action Button */}
                <TouchableOpacity
                  style={styles.setupActionBtn}
                  activeOpacity={0.85}
                  onPress={() => setContactlessSheetVisible(true)}>
                  <HugeiconsIcon icon={LockPasswordIcon} size={16} color="#FFFFFF" strokeWidth={2.2} />
                  <Text maxFontSizeMultiplier={1.3} style={styles.setupActionBtnText}>Set Up 8-Digit PIN</Text>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={15} color="#FFFFFF" strokeWidth={2.4} />
                </TouchableOpacity>

                <Text maxFontSizeMultiplier={1.3} style={styles.setupFootnote}>Takes ~30 seconds • Bank-grade PIN protection</Text>
              </View>
            )}
          </View>
          </View>

          {/* Card Action Buttons */}
          <View style={styles.cardActionsRow}>
            <TouchableOpacity
              style={styles.cardActionBtnPrimary}
              activeOpacity={0.85}
              onPress={() => copyToClipboard(`@${cleanTag}`, 'Cashtag')}>
              <HugeiconsIcon icon={Copy01Icon} size={16} color="#101A5A" />
              <Text maxFontSizeMultiplier={1.3} style={styles.cardActionTextPrimary}>Copy Cashtag</Text>
            </TouchableOpacity>

            {/* Solid white so it stays visible on the blue gradient in both themes */}
            <TouchableOpacity
              style={[styles.cardActionBtnPrimary, (isSavingQr || !isQrReady) && { opacity: 0.7 }]}
              activeOpacity={0.85}
              disabled={isSavingQr || !isQrReady}
              onPress={handleDownloadQr}>
              {isSavingQr ? (
                <ActivityIndicator size="small" color="#101A5A" />
              ) : (
                <>
                  <HugeiconsIcon icon={Download01Icon} size={16} color="#101A5A" />
                  <Text maxFontSizeMultiplier={1.3} style={styles.cardActionTextPrimary}>Download QR</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Your Link Section */}
        {/* <Text maxFontSizeMultiplier={1.3} style={[styles.sectionLabel, { color: t.textPrimary }]}>Your Cashtag Link</Text>
        <View style={[styles.linkBox, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
          <HugeiconsIcon icon={Link01Icon} size={18} color={t.brand} />
          <Text maxFontSizeMultiplier={1.3} style={[styles.linkText, { color: t.textPrimary, fontFamily: 'Montserrat_600SemiBold' }]} numberOfLines={1}>
            {receiveLink}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Copy receive link"
            onPress={() => copyToClipboard(receiveLink, 'Cashtag link')}>
            <HugeiconsIcon icon={Copy01Icon} size={18} color={t.textPrimary} />
          </TouchableOpacity>
        </View> */}

        {/* Quick Share Section */}
        <Text maxFontSizeMultiplier={1.3} style={[styles.sectionLabel, { color: t.textPrimary }]}>Quick Share</Text>
        <View style={styles.quickShareRow}>
          {/* WhatsApp */}
          <TouchableOpacity
            style={styles.shareAppItem}
            activeOpacity={0.8}
            onPress={() => void shareViaWhatsApp()}>
            <View style={[styles.shareAppIcon, { backgroundColor: '#22C55E' }]}>
              <HugeiconsIcon icon={WhatsappIcon} size={24} color="#FFFFFF" />
            </View>
            <Text maxFontSizeMultiplier={1.3} style={[styles.shareAppName, { color: t.textPrimary }]}>WhatsApp</Text>
          </TouchableOpacity>

          {/* Telegram */}
          <TouchableOpacity
            style={styles.shareAppItem}
            activeOpacity={0.8}
            onPress={() => void shareViaTelegram()}>
            <View style={[styles.shareAppIcon, { backgroundColor: '#38BDF8' }]}>
              <HugeiconsIcon icon={TelegramIcon} size={24} color="#FFFFFF" />
            </View>
            <Text maxFontSizeMultiplier={1.3} style={[styles.shareAppName, { color: t.textPrimary }]}>Telegram</Text>
          </TouchableOpacity>

          {/* Messages */}
          <TouchableOpacity
            style={styles.shareAppItem}
            activeOpacity={0.8}
            onPress={() => void shareViaSms()}>
            <View style={[styles.shareAppIcon, { backgroundColor: '#10B981' }]}>
              <HugeiconsIcon icon={BubbleChatIcon} size={24} color="#FFFFFF" />
            </View>
            <Text maxFontSizeMultiplier={1.3} style={[styles.shareAppName, { color: t.textPrimary }]}>Messages</Text>
          </TouchableOpacity>

          {/* More */}
          <TouchableOpacity
            style={styles.shareAppItem}
            activeOpacity={0.8}
            onPress={() => void shareViaMore()}>
            <View style={[styles.shareAppIcon, { backgroundColor: '#1E293B' }]}>
              <HugeiconsIcon icon={MoreHorizontalIcon} size={22} color="#FFFFFF" />
            </View>
            <Text maxFontSizeMultiplier={1.3} style={[styles.shareAppName, { color: t.textPrimary }]}>More</Text>
          </TouchableOpacity>
        </View>

        {/* Info Banner Card */}
        <TouchableOpacity
          style={[styles.infoBanner, { backgroundColor: t.brandTint, borderColor: t.brandTintStrong }]}
          activeOpacity={0.85}
          onPress={() => show({ message: 'No hidden fees on NearbyPay receive transactions.', variant: 'info' })}>
          <View style={styles.infoBannerLeft}>
            <View style={[styles.infoIconCircle, { backgroundColor: t.brandTintStrong }]}>
              <HugeiconsIcon icon={ShieldCheckIcon} size={20} color={t.brand} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text maxFontSizeMultiplier={1.3} style={[styles.infoTitle, { color: t.textPrimary }]}>Receive Money</Text>
              <Text maxFontSizeMultiplier={1.3} style={[styles.infoSub, { color: t.textSecondary }]}>
                The sender can pay while you are offline. They need internet to complete settlement.
              </Text>
            </View>
          </View>
          <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={t.brand} />
        </TouchableOpacity>

        {/* Bottom Paper Plane Watermark */}
        <View style={styles.watermarkSection}>
          <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
            <Path
              d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
              stroke="#3B82F6"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text maxFontSizeMultiplier={1.3} style={[styles.watermarkText, { color: t.textSecondary }]}>
            NearbyPay Brings You Closer
          </Text>
        </View>
      </ScrollView>

      {/* Hidden branded export card — captured for Download/Share, kept off-screen */}
      {isQrReady && receiveQr ? (
        <View style={styles.qrExportOffscreen} pointerEvents="none">
          <View ref={qrExportRef} collapsable={false} style={styles.qrExportCard}>
            <View style={styles.qrExportHeader}>
              <Image
                source={require('@/assets/images/logo/icon-1024.png')}
                style={styles.qrExportLogo}
              />
              <View style={styles.qrExportBrandCol}>
                <Text style={styles.qrExportBrand}>NearbyPay</Text>
                <Text style={styles.qrExportEyebrow}>SCAN TO PAY</Text>
              </View>
            </View>

            <View style={styles.qrExportQrWrap}>
              <View style={styles.qrWithLogo}>
                <QRCodeView
                  value={receiveQr.payload}
                  size={220}
                  color="#0F172A"
                  backgroundColor="#FFFFFF"
                />
                <View style={styles.qrExportCenterBadge}>
                  <Image
                    source={require('@/assets/images/logo/icon-1024.png')}
                    style={styles.qrExportCenterMark}
                  />
                </View>
              </View>
            </View>

            <Text style={styles.qrExportName} numberOfLines={1}>
              {profile.name}
            </Text>
            <Text style={styles.qrExportTag} numberOfLines={1}>
              @{cleanTag}
            </Text>
            <View style={styles.qrExportDivider} />
            <Text style={styles.qrExportFootnote}>
              Scan with NearbyPay to send money instantly
            </Text>
          </View>
        </View>
      ) : null}
      <ContactlessCodeSheet
        visible={contactlessSheetVisible}
        onClose={() => setContactlessSheetVisible(false)}
        onSuccess={() => setContactlessSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 17,
    letterSpacing: -0.4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  qrCardContainer: {
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#112CC9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  qrHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  logoText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  qrSubtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
  },
  userTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  badgeAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CBD5E1',
  },
  badgeName: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12.5,
    color: '#FFFFFF',
  },
  badgeTag: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  qrContainerSetup: {
    width: '100%',
  },
  qrShotCard: {
    backgroundColor: GRADIENT_STOPS.from,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  qrSquare: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  // QR + centered logo overlay (plain RN Image — reliable on Android,
  // unlike SVG-embedded logos, and captured correctly by view-shot)
  qrWithLogo: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCenterBadge: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qrCenterMark: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  qrExportCenterBadge: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qrExportCenterMark: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  qrSetupLoadingText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
  qrSetupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#0A1240',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 4,
  },
  setupBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 12,
  },
  setupBadgeText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: '#2563EB',
  },
  setupIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  setupTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16.5,
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  setupSubtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 14,
  },
  setupBenefitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  setupBenefitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  setupBenefitText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 10.5,
    color: '#334155',
  },
  setupActionBtn: {
    width: '100%',
    height: 46,
    backgroundColor: '#2E45F4',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: { shadowColor: '#2E45F4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8 },
      android: { elevation: 3 },
      web: { shadowColor: '#2E45F4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8 },
    }),
  },
  setupActionBtnText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  setupFootnote: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 10.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  cardActionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 8,
    ...Platform.select({
      ios: { shadowColor: '#0A1240', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6 },
      android: { elevation: 3 },
      web: { shadowColor: '#0A1240', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6 },
    }),
  },
  cardActionTextPrimary: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
    color: '#101A5A',
  },
  sectionLabel: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    letterSpacing: -0.2,
    marginTop: 10,
    marginBottom: 10,
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
    marginBottom: 10,
  },
  linkText: {
    flex: 1,
    fontFamily: 'Montserrat_500Medium',
    fontSize: 12,
  },
  quickShareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 16,
  },
  shareAppItem: {
    alignItems: 'center',
    gap: 6,
  },
  shareAppIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shareAppName: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 12,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginTop: 8,
    marginBottom: 24,
  },
  infoBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  infoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
  },
  infoSub: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  watermarkSection: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    opacity: 0.7,
  },
  watermarkText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
  },
  // Branded QR export (download/share) — clean white card, no transparency
  qrExportOffscreen: {
    position: 'absolute',
    top: -10000,
    left: -10000,
    opacity: 1,
  },
  qrExportCard: {
    width: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  qrExportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  qrExportLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  qrExportBrandCol: {
    marginLeft: 10,
    alignItems: 'flex-start',
  },
  qrExportBrand: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  qrExportEyebrow: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 9,
    letterSpacing: 2.2,
    color: '#2E45F4',
    marginTop: 2,
  },
  qrExportQrWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 16,
  },
  qrExportName: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 15,
    color: '#0F172A',
    textAlign: 'center',
    maxWidth: 240,
  },
  qrExportTag: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
    color: '#2E45F4',
    textAlign: 'center',
    marginTop: 3,
  },
  qrExportDivider: {
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  qrExportFootnote: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
