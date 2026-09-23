import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  BubbleChatIcon,
  Copy01Icon,
  Download01Icon,
  HelpCircleIcon,
  Link01Icon,
  MoreHorizontalIcon,
  Share08Icon,
  ShieldCheckIcon,
  TelegramIcon,
  WhatsappIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useRouter } from 'expo-router';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import QRCodeView from '@/components/ui/qr-code';
import { useToast } from '@/components/ui/toast';
import { getAppTheme, GRADIENT_STOPS } from '@/constants/app-theme';
import { useAppTheme } from '@/hooks/theme-provider';

export function ReceiveScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { isDark } = useAppTheme();
  const t = getAppTheme(isDark);

  const receiveLink = 'https://nearbypay.app/receive/nby_7f3a2lX9q';

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
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Receive Money</Text>
        <TouchableOpacity
          style={[styles.headerBtn, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
          activeOpacity={0.7}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Help and FAQs"
          onPress={() => show({ message: 'Help & FAQs', variant: 'info' })}>
          <HugeiconsIcon icon={HelpCircleIcon} size={18} color={t.textPrimary} />
        </TouchableOpacity>
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

          {/* Logo & Header */}
          <View style={styles.qrHeader}>
            <View style={styles.logoRow}>
              {/* NearbyPay N Emblem */}
              <Svg width={28} height={28} viewBox="0 0 32 32" fill="none">
                <Rect width={32} height={32} rx={16} fill="#FFFFFF" opacity={0.25} />
                <Path
                  d="M10 22V10L22 22V10"
                  stroke="#FFFFFF"
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.logoText}>NearbyPay</Text>
            </View>
            <Text style={styles.qrSubtitle}>
              Share your QR code or link so others can send you money.
            </Text>
          </View>

          {/* QR Code Container */}
          <View style={styles.qrSquare}>
            <QRCodeView value={receiveLink} size={170} color="#0F172A" />
            <View style={styles.qrCenterBadge}>
              <Image
                source={require('@/assets/images/logo/logo.png')}
                style={styles.qrCenterLogo}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Card Action Buttons */}
          <View style={styles.cardActionsRow}>
            <TouchableOpacity
              style={styles.cardActionBtnPrimary}
              activeOpacity={0.85}
              onPress={() => show({ message: 'QR Code saved to gallery.', variant: 'success' })}>
              <HugeiconsIcon icon={Download01Icon} size={16} color="#101A5A" />
              <Text style={styles.cardActionTextPrimary}>Download QR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cardActionBtn}
              activeOpacity={0.85}
              onPress={() => show({ message: 'Share sheet opened.', variant: 'info' })}>
              <HugeiconsIcon icon={Share08Icon} size={16} color="#FFFFFF" />
              <Text style={styles.cardActionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Your Link Section */}
        <Text style={[styles.sectionLabel, { color: t.textPrimary }]}>Your Link</Text>
        <View style={[styles.linkBox, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
          <HugeiconsIcon icon={Link01Icon} size={18} color={t.brand} />
          <Text style={[styles.linkText, { color: t.textSecondary }]} numberOfLines={1}>
            {receiveLink}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Copy receive link"
            onPress={() => show({ message: 'Link copied to clipboard.', variant: 'success' })}>
            <HugeiconsIcon icon={Copy01Icon} size={18} color={t.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Quick Share Section */}
        <Text style={[styles.sectionLabel, { color: t.textPrimary }]}>Quick Share</Text>
        <View style={styles.quickShareRow}>
          {/* WhatsApp */}
          <TouchableOpacity
            style={styles.shareAppItem}
            activeOpacity={0.8}
            onPress={() => show({ message: 'Opening WhatsApp...', variant: 'info' })}>
            <View style={[styles.shareAppIcon, { backgroundColor: '#22C55E' }]}>
              <HugeiconsIcon icon={WhatsappIcon} size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.shareAppName, { color: t.textPrimary }]}>WhatsApp</Text>
          </TouchableOpacity>

          {/* Telegram */}
          <TouchableOpacity
            style={styles.shareAppItem}
            activeOpacity={0.8}
            onPress={() => show({ message: 'Opening Telegram...', variant: 'info' })}>
            <View style={[styles.shareAppIcon, { backgroundColor: '#38BDF8' }]}>
              <HugeiconsIcon icon={TelegramIcon} size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.shareAppName, { color: t.textPrimary }]}>Telegram</Text>
          </TouchableOpacity>

          {/* Messages */}
          <TouchableOpacity
            style={styles.shareAppItem}
            activeOpacity={0.8}
            onPress={() => show({ message: 'Opening Messages...', variant: 'info' })}>
            <View style={[styles.shareAppIcon, { backgroundColor: '#10B981' }]}>
              <HugeiconsIcon icon={BubbleChatIcon} size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.shareAppName, { color: t.textPrimary }]}>Messages</Text>
          </TouchableOpacity>

          {/* More */}
          <TouchableOpacity
            style={styles.shareAppItem}
            activeOpacity={0.8}
            onPress={() => show({ message: 'Opening more options...', variant: 'info' })}>
            <View style={[styles.shareAppIcon, { backgroundColor: '#1E293B' }]}>
              <HugeiconsIcon icon={MoreHorizontalIcon} size={22} color="#FFFFFF" />
            </View>
            <Text style={[styles.shareAppName, { color: t.textPrimary }]}>More</Text>
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
              <Text style={[styles.infoTitle, { color: t.textPrimary }]}>Receive Money</Text>
              <Text style={[styles.infoSub, { color: t.textSecondary }]}>
                No fees. No stress. Just share and get paid.
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
          <Text style={[styles.watermarkText, { color: t.textSecondary }]}>
            NearbyPay Brings You Closer
          </Text>
        </View>
      </ScrollView>
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
  qrCenterBadge: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  qrCenterLogo: {
    width: 24,
    height: 24,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 8,
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
  cardActionText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
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
});
