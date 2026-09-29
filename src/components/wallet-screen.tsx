import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  BankIcon,
  CheckmarkBadge01Icon,
  Coins01Icon,
  Copy01Icon,
  FlashIcon,
  InformationCircleIcon,
  QrCodeIcon,
  Sent02Icon,
  ShieldCheckIcon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@/lib/icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { AddMoneySheet } from '@/components/ui/add-money-sheet';
import { useToast } from '@/components/ui/toast';
import { getAppTheme, GRADIENT_STOPS } from '@/constants/app-theme';
import { useAppTheme } from '@/hooks/theme-provider';
import { useTransactions } from '@/hooks/use-transactions';
import { useUserProfile } from '@/hooks/user-profile-provider';

export default function WalletScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const t = getAppTheme(isDark);
  const { show } = useToast();
  const { profile } = useUserProfile();
  const { balance, transactions, refresh } = useTransactions();

  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddMoneyVisible, setIsAddMoneyVisible] = useState(false);

  const formattedBalance = `₦${balance.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  // Points earned based on sent volume: 1 pt per ₦100 sent
  const sentVolume = transactions
    .filter((tx) => tx.type === 'sent')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const commissionPoints = Math.max(120, Math.floor(sentVolume / 100));
  const pointsValue = `₦${commissionPoints.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const rawAccount = profile.accountNumber || '9012345678';
  const formattedAccount = rawAccount.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  const bankName = profile.bankName || 'NearbyPay MFB • Wema Bank';

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyAccountNumber = async () => {
    try {
      await Clipboard.setStringAsync(rawAccount);
    } catch {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(rawAccount);
      }
    }
    show({ message: 'Account number copied to clipboard!', variant: 'success' });
  };

  const formatTxDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: t.pageBg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: t.pageBg, borderColor: t.divider }]}>
        <TouchableOpacity
          style={[styles.headerBtn, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
          activeOpacity={0.7}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} color={t.textPrimary} />
        </TouchableOpacity>
        <Text maxFontSizeMultiplier={1.3} style={[styles.headerTitle, { color: t.textPrimary }]}>Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={t.brand}
            colors={[t.brand]}
            progressBackgroundColor={t.cardBg}
          />
        }>
        {/* ─── Balance Card ─────────────────────────────────────── */}
        <View style={styles.balanceCard}>
          <Svg style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="walletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={GRADIENT_STOPS.from} />
                <Stop offset="100%" stopColor={GRADIENT_STOPS.to} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" rx={24} fill="url(#walletGrad)" />
          </Svg>

          <View style={styles.balanceTopRow}>
            <View style={styles.balanceLabelGroup}>
              <Text maxFontSizeMultiplier={1.3} style={styles.balanceLabel}>Total Wallet Balance</Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text maxFontSizeMultiplier={1.3} style={styles.liveText}>Live</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setIsBalanceVisible(!isBalanceVisible)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.eyeToggle}>
              <HugeiconsIcon
                icon={isBalanceVisible ? ViewIcon : ViewOffSlashIcon}
                size={15}
                color="rgba(255, 255, 255, 0.9)"
              />
            </TouchableOpacity>
          </View>

          <Text maxFontSizeMultiplier={1.3} style={styles.balanceAmount}>
            {isBalanceVisible ? formattedBalance : '₦ ••••••••'}
          </Text>

          {/* Quick Action Buttons */}
          <View style={styles.walletActionRow}>
            <TouchableOpacity
              style={styles.walletActionButtonPrimary}
              activeOpacity={0.85}
              onPress={() => setIsAddMoneyVisible(true)}>
              <HugeiconsIcon icon={ArrowDown01Icon} size={15} color="#101A5A" strokeWidth={2.4} />
              <Text maxFontSizeMultiplier={1.3} style={styles.walletActionTextPrimary}>Add Money</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.walletActionButtonSecondary}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/send')}>
              <HugeiconsIcon icon={Sent02Icon} size={15} color="#FFFFFF" strokeWidth={2.2} />
              <Text maxFontSizeMultiplier={1.3} style={styles.walletActionTextSecondary}>Send</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.walletActionButtonSecondary}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/receive')}>
              <HugeiconsIcon icon={QrCodeIcon} size={15} color="#FFFFFF" strokeWidth={2.2} />
              <Text maxFontSizeMultiplier={1.3} style={styles.walletActionTextSecondary}>QR Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Virtual Bank Account Card ────────────────────────── */}
        <View style={[styles.sectionCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconWrap, { backgroundColor: t.brandTint }]}>
              <HugeiconsIcon icon={BankIcon} size={18} color={t.brand} strokeWidth={2.2} />
            </View>
            <View style={styles.cardHeaderCopy}>
              <Text maxFontSizeMultiplier={1.3} style={[styles.cardTitle, { color: t.textPrimary }]}>Dedicated Deposit Nuban</Text>
              <Text maxFontSizeMultiplier={1.3} style={[styles.cardSubtitle, { color: t.textSecondary }]}>
                {bankName}
              </Text>
            </View>
            <View style={[styles.statusBadgePill, { backgroundColor: t.successTint }]}>
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={12} color={t.success} strokeWidth={2.4} />
              <Text maxFontSizeMultiplier={1.3} style={[styles.statusBadgeText, { color: t.success }]}>Auto-Credit</Text>
            </View>
          </View>

          <View style={[styles.accountBox, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
            <View style={styles.accountNumberInfo}>
              <Text maxFontSizeMultiplier={1.3} style={[styles.accountNumberLabel, { color: t.muted }]}>ACCOUNT NUMBER</Text>
              <Text maxFontSizeMultiplier={1.3} style={[styles.accountNumberDigits, { color: t.textPrimary }]}>{formattedAccount}</Text>
              <Text maxFontSizeMultiplier={1.3} style={[styles.accountNameLine, { color: t.textSecondary }]}>
                {profile.name.toUpperCase()} / NEARBYPAY
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.accountCopyBtn, { backgroundColor: t.brand }]}
              activeOpacity={0.85}
              onPress={copyAccountNumber}>
              <HugeiconsIcon icon={Copy01Icon} size={14} color="#FFFFFF" strokeWidth={2.2} />
              <Text maxFontSizeMultiplier={1.3} style={styles.accountCopyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.fundNowBtn, { backgroundColor: t.brandTint, borderColor: t.brandTintStrong }]}
            activeOpacity={0.85}
            onPress={() => setIsAddMoneyVisible(true)}>
            <HugeiconsIcon icon={FlashIcon} size={16} color={t.brand} strokeWidth={2.2} />
            <Text maxFontSizeMultiplier={1.3} style={[styles.fundNowBtnText, { color: t.brand }]}>Simulate Instant Top-Up</Text>
            <HugeiconsIcon icon={ArrowRight01Icon} size={15} color={t.brand} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        {/* ─── Commission & Reward Points Card ──────────────────── */}
        <View style={[styles.sectionCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconWrap, { backgroundColor: t.warningTint }]}>
              <HugeiconsIcon icon={Coins01Icon} size={18} color={t.warning} strokeWidth={2.2} />
            </View>
            <View style={styles.cardHeaderCopy}>
              <Text maxFontSizeMultiplier={1.3} style={[styles.cardTitle, { color: t.textPrimary }]}>Commission & Rewards</Text>
              <Text maxFontSizeMultiplier={1.3} style={[styles.cardSubtitle, { color: t.textSecondary }]}>Earn 1 point per ₦100 sent or check-in</Text>
            </View>
          </View>

          <View style={styles.pointsStatsRow}>
            <View style={styles.pointsStat}>
              <Text maxFontSizeMultiplier={1.3} style={[styles.pointsValue, { color: t.textPrimary }]}>
                {commissionPoints.toLocaleString()}
              </Text>
              <Text maxFontSizeMultiplier={1.3} style={[styles.pointsStatLabel, { color: t.textSecondary }]}>Earned Points</Text>
            </View>
            <View style={[styles.pointsDivider, { backgroundColor: t.divider }]} />
            <View style={styles.pointsStat}>
              <Text maxFontSizeMultiplier={1.3} style={[styles.pointsValue, { color: t.brand }]}>{pointsValue}</Text>
              <Text maxFontSizeMultiplier={1.3} style={[styles.pointsStatLabel, { color: t.textSecondary }]}>Redeemable Value</Text>
            </View>
          </View>

          <View style={styles.pointsFooter}>
            <HugeiconsIcon icon={InformationCircleIcon} size={13} color={t.muted} />
            <Text maxFontSizeMultiplier={1.3} style={[styles.pointsFooterText, { color: t.muted }]}>
              Points can be converted 1:1 to wallet funds anytime.
            </Text>
          </View>
        </View>

        {/* ─── Recent Real Activity ─────────────────────────────── */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeadingRow}>
            <Text maxFontSizeMultiplier={1.3} style={[styles.activitySectionTitle, { color: t.textPrimary }]}>Recent Activity</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/history')}>
              <Text maxFontSizeMultiplier={1.3} style={[styles.seeAllText, { color: t.brand }]}>See all</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
              <View style={[styles.emptyIconCircle, { backgroundColor: t.brandTint }]}>
                <HugeiconsIcon icon={ShieldCheckIcon} size={24} color={t.brand} />
              </View>
              <Text maxFontSizeMultiplier={1.3} style={[styles.emptyTitle, { color: t.textPrimary }]}>No transactions yet</Text>
              <Text maxFontSizeMultiplier={1.3} style={[styles.emptySubtitle, { color: t.textSecondary }]}>
                Add money to your account to start making transfers and earning rewards.
              </Text>
              <TouchableOpacity
                style={[styles.emptyActionBtn, { backgroundColor: t.brand }]}
                activeOpacity={0.85}
                onPress={() => setIsAddMoneyVisible(true)}>
                <HugeiconsIcon icon={ArrowDown01Icon} size={15} color="#FFFFFF" strokeWidth={2.4} />
                <Text maxFontSizeMultiplier={1.3} style={styles.emptyActionBtnText}>Add Money Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.activityListCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
              {transactions.slice(0, 5).map((tx, idx) => {
                const isCredit = tx.type === 'received';
                const isLast = idx === Math.min(transactions.length, 5) - 1;
                return (
                  <View
                    key={tx.id || idx}
                    style={[
                      styles.activityRowItem,
                      !isLast && { borderBottomWidth: 1, borderBottomColor: t.divider },
                    ]}>
                    <View
                      style={[
                        styles.activityDotWrap,
                        { backgroundColor: isCredit ? t.successTint : t.brandTint },
                      ]}>
                      <HugeiconsIcon
                        icon={isCredit ? ArrowDown01Icon : ArrowUp01Icon}
                        size={15}
                        color={isCredit ? t.success : t.brand}
                        strokeWidth={2.4}
                      />
                    </View>
                    <View style={styles.activityInfoCol}>
                      <Text maxFontSizeMultiplier={1.3} style={[styles.activityTitleText, { color: t.textPrimary }]} numberOfLines={1}>
                        {tx.title}
                      </Text>
                      <Text maxFontSizeMultiplier={1.3} style={[styles.activityDateText, { color: t.muted }]}>
                        {formatTxDate(tx.created_at)} • {tx.channel || 'NearbyPay'}
                      </Text>
                    </View>
                    <View style={styles.activityAmountCol}>
                      <Text maxFontSizeMultiplier={1.3}
                        style={[
                          styles.activityAmountText,
                          { color: isCredit ? t.success : t.textPrimary },
                        ]}>
                        {isCredit ? '+' : '-'}₦{tx.amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                      <View style={[styles.activityStatusPill, { backgroundColor: t.successTint }]}>
                        <Text maxFontSizeMultiplier={1.3} style={[styles.activityStatusText, { color: t.success }]}>
                          {tx.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Reusable Add Money Sheet */}
      <AddMoneySheet
        visible={isAddMoneyVisible}
        onClose={() => setIsAddMoneyVisible(false)}
        onSuccess={() => {
          void refresh();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  balanceCard: {
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#112CC9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  balanceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceLabel: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
  },
  liveText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 9.5,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  eyeToggle: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
  },
  balanceAmount: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 32,
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginTop: 10,
    marginBottom: 18,
  },
  walletActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  walletActionButtonPrimary: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 14,
    ...Platform.select({
      ios: { shadowColor: '#0A1240', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6 },
      android: { elevation: 3 },
      web: { shadowColor: '#0A1240', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6 },
    }),
  },
  walletActionTextPrimary: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12.5,
    color: '#101A5A',
  },
  walletActionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingVertical: 12,
    borderRadius: 14,
  },
  walletActionTextSecondary: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12.5,
    color: '#FFFFFF',
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderCopy: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11,
    marginTop: 1,
  },
  statusBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 10,
  },
  accountBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountNumberInfo: {
    flex: 1,
  },
  accountNumberLabel: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  accountNumberDigits: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    letterSpacing: 1.2,
    marginVertical: 2,
  },
  accountNameLine: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 10.5,
  },
  accountCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  accountCopyBtnText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  fundNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  fundNowBtnText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12,
  },
  pointsStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  pointsStat: {
    flex: 1,
    alignItems: 'center',
  },
  pointsDivider: {
    width: 1,
    height: 36,
  },
  pointsValue: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
    letterSpacing: -0.4,
  },
  pointsStatLabel: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11,
    marginTop: 2,
  },
  pointsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  pointsFooterText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11,
    flex: 1,
  },
  activitySection: {
    gap: 10,
  },
  activityHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  activitySectionTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 15,
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 15,
  },
  emptySubtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    maxWidth: 260,
    lineHeight: 18,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyActionBtnText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  activityListCard: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  activityRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  activityDotWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInfoCol: {
    flex: 1,
  },
  activityTitleText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
  },
  activityDateText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 10.5,
    marginTop: 3,
  },
  activityAmountCol: {
    alignItems: 'flex-end',
    gap: 3,
  },
  activityAmountText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13.5,
  },
  activityStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activityStatusText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 8.5,
  },
});
