import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  BulbIcon,
  Cancel01Icon,
  CheckmarkBadge01Icon,
  FlashIcon,
  Notification03Icon,
  SmartPhone01Icon,
  Tick02Icon,
  Tv01Icon,
  Wallet01Icon,
  WifiIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/components/ui/toast';
import { getAppTheme } from '@/constants/app-theme';
import { useAppTheme } from '@/hooks/theme-provider';
import { useUserProfile } from '@/hooks/user-profile-provider';

export type BillServiceType = 'airtime' | 'data' | 'light' | 'tv';

interface BillService {
  id: BillServiceType;
  label: string;
  tagline: string;
  description: string;
  icon: typeof SmartPhone01Icon;
  badge: string;
  badgeColor?: string;
  providers: string[];
  inputLabel: string;
  inputPlaceholder: string;
  quickAmounts: number[];
}

export const BILL_SERVICES: BillService[] = [
  {
    id: 'airtime',
    label: 'Airtime',
    tagline: 'Instant recharge',
    description: 'Top up any Nigerian network with instant bonus',
    icon: SmartPhone01Icon,
    badge: '2% Cashback',
    providers: ['MTN', 'Airtel', 'Glo', '9mobile'],
    inputLabel: 'Phone Number',
    inputPlaceholder: '0803 123 4567',
    quickAmounts: [100, 200, 500, 1000, 2000, 5000],
  },
  {
    id: 'data',
    label: 'Data',
    tagline: 'Internet bundles',
    description: 'Buy fast 4G/5G data packages for all devices',
    icon: WifiIcon,
    badge: 'Instant',
    providers: ['MTN Data', 'Airtel Data', 'Glo Data', '9mobile Data'],
    inputLabel: 'Phone Number',
    inputPlaceholder: '0803 123 4567',
    quickAmounts: [500, 1000, 2000, 3500, 5000, 8000],
  },
  {
    id: 'light',
    label: 'Light',
    tagline: 'Electricity tokens',
    description: 'Pay prepaid & postpaid electricity bills instantly',
    icon: BulbIcon, // Explicit requirement: Light uses a bulb icon
    badge: 'Zero Fee',
    providers: ['IKEDC (Ikeja)', 'EKEDC (Eko)', 'AEDC (Abuja)', 'IBEDC (Ibadan)', 'EEDC (Enugu)', 'PHED (Port Harcourt)'],
    inputLabel: 'Meter Number',
    inputPlaceholder: '4501 9283 719',
    quickAmounts: [1000, 2000, 5000, 10000, 15000, 20000],
  },
  {
    id: 'tv',
    label: 'TV',
    tagline: 'Cable TV sub',
    description: 'Renew DStv, GOtv, Startimes & Showmax bouquets',
    icon: Tv01Icon,
    badge: 'Instant',
    providers: ['DStv', 'GOtv', 'Startimes', 'Showmax'],
    inputLabel: 'Smartcard / IUC Number',
    inputPlaceholder: '1049 281 742',
    quickAmounts: [3950, 4200, 5700, 7400, 12500, 18500],
  },
];

const RECENT_BILLS = [
  {
    id: '1',
    service: 'Light',
    title: 'IKEDC Prepaid Meter',
    account: '4501 9283 719',
    amount: '₦5,000',
    date: 'Yesterday, 06:14 PM',
    icon: BulbIcon,
  },
  {
    id: '2',
    service: 'Airtime',
    title: 'MTN Airtime Topup',
    account: '0803 123 4567',
    amount: '₦1,000',
    date: 'Jun 22, 11:30 AM',
    icon: SmartPhone01Icon,
  },
  {
    id: '3',
    service: 'TV',
    title: 'DStv Compact Bouquet',
    account: '1049 281 742',
    amount: '₦12,500',
    date: 'Jun 15, 08:20 PM',
    icon: Tv01Icon,
  },
];

export default function MoreScreen({ onBack }: { onBack?: () => void }) {
  const { isDark } = useAppTheme();
  const t = getAppTheme(isDark);
  const insets = useSafeAreaInsets();
  const { show } = useToast();
  const { profile } = useUserProfile();

  const [activeService, setActiveService] = useState<BillService | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [accountInput, setAccountInput] = useState<string>('');
  const [amountInput, setAmountInput] = useState<string>('');
  const [meterType, setMeterType] = useState<'Prepaid' | 'Postpaid'>('Prepaid');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<{
    service: string;
    account: string;
    amount: string;
    token?: string;
  } | null>(null);

  const openService = (service: BillService) => {
    setActiveService(service);
    setSelectedProvider(service.providers[0]);
    setAccountInput(service.id === 'airtime' || service.id === 'data' ? profile.phone : '');
    setAmountInput(service.quickAmounts[1] ? String(service.quickAmounts[1]) : '1000');
  };

  const handlePay = () => {
    if (!accountInput.trim()) {
      show({ message: `Please enter a valid ${activeService?.inputLabel.toLowerCase()}`, variant: 'error' });
      return;
    }
    const numAmount = parseFloat(amountInput);
    if (isNaN(numAmount) || numAmount <= 0) {
      show({ message: 'Please enter a valid amount', variant: 'error' });
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const isLight = activeService?.id === 'light';
      const token = isLight ? '4820-1928-3920-1049' : undefined;

      setSuccessReceipt({
        service: activeService?.label || 'Utility',
        account: accountInput,
        amount: `₦${numAmount.toLocaleString()}`,
        token,
      });

      show({
        message: `${activeService?.label} payment of ₦${numAmount.toLocaleString()} successful!`,
        variant: 'success',
      });
    }, 1200);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.pageBg }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.container, { backgroundColor: t.pageBg }]}>
        {/* ─── Top Bar ─────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
            activeOpacity={0.7}
            onPress={onBack}
            accessibilityLabel="Go back">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} color={t.textPrimary} />
          </TouchableOpacity>

          <View style={styles.topTitles}>
            <Text style={[styles.topEyebrow, { color: t.brand }]}>UTILITIES & BILLS</Text>
            <Text style={[styles.screenTitle, { color: t.textPrimary }]}>More Services</Text>
          </View>

          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
            activeOpacity={0.7}
            onPress={() => show({ message: 'All utility channels operating normally', variant: 'info' })}>
            <HugeiconsIcon icon={Notification03Icon} size={17} color={t.iconColor} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 32 },
          ]}
          showsVerticalScrollIndicator={false}>
          {/* ─── Wallet Balance Quick Bar ────────────────────────── */}
          <View style={[styles.balancePillCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
            <View style={styles.balanceInfo}>
              <View style={[styles.walletIconWrap, { backgroundColor: t.brandTint }]}>
                <HugeiconsIcon icon={Wallet01Icon} size={16} color={t.brand} />
              </View>
              <View>
                <Text style={[styles.balanceLabel, { color: t.muted }]}>AVAILABLE WALLET BALANCE</Text>
                <Text style={[styles.balanceValue, { color: t.textPrimary }]}>₦84,520.00</Text>
              </View>
            </View>
            <View style={[styles.cashbackBadge, { backgroundColor: t.successTint }]}>
              <HugeiconsIcon icon={Tick02Icon} size={11} color={t.success} strokeWidth={2.5} />
              <Text style={[styles.cashbackText, { color: t.success }]}>Auto-Cashback</Text>
            </View>
          </View>

          {/* ─── 4 Core Bill Services ────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Bills & Utilities</Text>
            <Text style={[styles.sectionSubtitle, { color: t.textSecondary }]}>
              Recharge phones, electricity & television
            </Text>
          </View>

          <View style={styles.servicesGrid}>
            {BILL_SERVICES.map((service) => {
              const isBulb = service.id === 'light';
              return (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.serviceCard,
                    { backgroundColor: t.cardBg, borderColor: t.cardBorder },
                    Platform.select({
                      ios: { shadowColor: '#1E2B6B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
                      android: { elevation: 2 },
                      web: { shadowColor: '#1E2B6B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
                    }),
                  ]}
                  activeOpacity={0.75}
                  onPress={() => openService(service)}>
                  {/* Top row with icon & badge */}
                  <View style={styles.serviceCardTop}>
                    <View
                      style={[
                        styles.serviceIconWrap,
                        {
                          backgroundColor: isBulb ? t.warningTint : t.brandTint,
                        },
                      ]}>
                      <HugeiconsIcon
                        icon={service.icon}
                        size={22}
                        color={isBulb ? t.warning : t.brand}
                      />
                    </View>

                    <View
                      style={[
                        styles.serviceBadge,
                        {
                          backgroundColor: isBulb ? t.successTint : t.brandTint,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.serviceBadgeText,
                          { color: isBulb ? t.success : t.brand },
                        ]}>
                        {service.badge}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.serviceTextGroup}>
                    <Text style={[styles.serviceLabel, { color: t.textPrimary }]}>
                      {service.label}
                    </Text>
                    <Text style={[styles.serviceTagline, { color: t.brand }]}>
                      {service.tagline}
                    </Text>
                    <Text style={[styles.serviceDesc, { color: t.textSecondary }]} numberOfLines={2}>
                      {service.description}
                    </Text>
                  </View>

                  <View style={[styles.serviceCardFooter, { borderTopColor: t.divider }]}>
                    <Text style={[styles.tapToPay, { color: t.brand }]}>Pay Now</Text>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={t.brand} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ─── Offline Mesh Utility Notice ─────────────────────── */}
          <View style={[styles.meshNoticeCard, { backgroundColor: t.cardBg, borderColor: t.brandTintStrong }]}>
            <View style={[styles.meshIconBox, { backgroundColor: t.brandTint }]}>
              <HugeiconsIcon icon={FlashIcon} size={20} color={t.brand} />
            </View>
            <View style={styles.meshNoticeInfo}>
              <Text style={[styles.meshNoticeTitle, { color: t.textPrimary }]}>
                Offline Bill Delegation
              </Text>
              <Text style={[styles.meshNoticeText, { color: t.textSecondary }]}>
                No mobile data? NearbyPay broadcasts encrypted token requests to nearby merchants via BLE
                mesh so you can recharge anytime.
              </Text>
            </View>
          </View>

          {/* ─── Recent Bill Payments ────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Recent Utility Payments</Text>
            <Text style={[styles.sectionSubtitle, { color: t.textSecondary }]}>
              Quickly re-order previous bills
            </Text>
          </View>

          <View style={[styles.recentBillsCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
            {RECENT_BILLS.map((item, idx) => {
              const isBulb = item.service === 'Light';
              const isLast = idx === RECENT_BILLS.length - 1;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.recentBillRow,
                    !isLast && { borderBottomWidth: 1, borderBottomColor: t.divider },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    const found = BILL_SERVICES.find((s) => s.label === item.service);
                    if (found) {
                      openService(found);
                      setAccountInput(item.account);
                    }
                  }}>
                  <View
                    style={[
                      styles.recentBillIconWrap,
                      { backgroundColor: isBulb ? t.warningTint : t.brandTint },
                    ]}>
                    <HugeiconsIcon
                      icon={item.icon}
                      size={18}
                      color={isBulb ? t.warning : t.brand}
                    />
                  </View>

                  <View style={styles.recentBillDetails}>
                    <Text style={[styles.recentBillTitle, { color: t.textPrimary }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.recentBillAccount, { color: t.textSecondary }]}>
                      {item.account} • {item.date}
                    </Text>
                  </View>

                  <View style={styles.recentBillAction}>
                    <Text style={[styles.recentBillAmount, { color: t.textPrimary }]}>
                      {item.amount}
                    </Text>
                    <Text style={[styles.repeatText, { color: t.brand }]}>Repeat</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* ─── MODAL: Interactive Bill Payment Sheet ───────────── */}
        <Modal
          visible={!!activeService && !successReceipt}
          transparent
          animationType="slide"
          onRequestClose={() => setActiveService(null)}>
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={styles.backdropDismiss}
              activeOpacity={1}
              onPress={() => setActiveService(null)}
            />

            <View
              style={[
                styles.sheetContent,
                {
                  backgroundColor: t.cardBg,
                  borderColor: t.cardBorder,
                  paddingBottom: Math.max(insets.bottom, 20) + 10,
                },
              ]}>
              <View style={[styles.sheetHandle, { backgroundColor: t.divider }]} />

              <View style={styles.sheetHeader}>
                <View style={styles.sheetHeaderTitles}>
                  <View style={styles.sheetTitleRow}>
                    {activeService?.icon && (
                      <HugeiconsIcon
                        icon={activeService.icon}
                        size={20}
                        color={activeService.id === 'light' ? t.warning : t.brand}
                      />
                    )}
                    <Text style={[styles.sheetTitle, { color: t.textPrimary }]}>
                      Pay {activeService?.label}
                    </Text>
                  </View>
                  <Text style={[styles.sheetSubtitle, { color: t.textSecondary }]}>
                    {activeService?.description}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.sheetCloseBtn, { backgroundColor: t.chipBg }]}
                  activeOpacity={0.7}
                  onPress={() => setActiveService(null)}>
                  <HugeiconsIcon icon={Cancel01Icon} size={16} color={t.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
                {/* Provider Selector Chips */}
                <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>SELECT PROVIDER</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.providerScroll}>
                  <View style={styles.providerRow}>
                    {activeService?.providers.map((p) => {
                      const isSelected = selectedProvider === p;
                      return (
                        <TouchableOpacity
                          key={p}
                          style={[
                            styles.providerChip,
                            {
                              backgroundColor: isSelected ? t.brand : t.inputBg,
                              borderColor: isSelected ? t.brand : t.inputBorder,
                            },
                          ]}
                          activeOpacity={0.7}
                          onPress={() => setSelectedProvider(p)}>
                          <Text
                            style={[
                              styles.providerChipText,
                              { color: isSelected ? '#FFFFFF' : t.textPrimary },
                            ]}>
                            {p}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* Meter Type (for light) */}
                {activeService?.id === 'light' && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>METER TYPE</Text>
                    <View style={[styles.segmentTrack, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
                      {(['Prepaid', 'Postpaid'] as const).map((m) => {
                        const isMSelected = meterType === m;
                        return (
                          <TouchableOpacity
                            key={m}
                            style={[
                              styles.segmentOption,
                              isMSelected && [styles.segmentOptionActive, { backgroundColor: t.brand }],
                            ]}
                            activeOpacity={0.8}
                            onPress={() => setMeterType(m)}>
                            <Text
                              style={[
                                styles.segmentOptionText,
                                { color: isMSelected ? '#FFFFFF' : t.textSecondary },
                              ]}>
                              {m}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Account / Meter / Phone Input */}
                <View style={styles.formGroup}>
                  <View style={styles.inputHeader}>
                    <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>
                      {activeService?.inputLabel.toUpperCase()}
                    </Text>
                    {(activeService?.id === 'airtime' || activeService?.id === 'data') && (
                      <TouchableOpacity
                        onPress={() => setAccountInput(profile.phone)}
                        activeOpacity={0.7}>
                        <Text style={[styles.autofillText, { color: t.brand }]}>Use My Phone</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <TextInput
                    value={accountInput}
                    onChangeText={setAccountInput}
                    style={[
                      styles.textInput,
                      { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.textPrimary },
                    ]}
                    placeholder={activeService?.inputPlaceholder}
                    placeholderTextColor={t.muted}
                    keyboardType="numeric"
                  />
                </View>

                {/* Amount Input */}
                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>AMOUNT (₦)</Text>
                  <TextInput
                    value={amountInput}
                    onChangeText={setAmountInput}
                    style={[
                      styles.textInput,
                      styles.amountInput,
                      { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.textPrimary },
                    ]}
                    placeholder="1,000"
                    placeholderTextColor={t.muted}
                    keyboardType="numeric"
                  />

                  {/* Quick Amount Chips */}
                  <View style={styles.quickAmountRow}>
                    {activeService?.quickAmounts.map((amt) => {
                      const isSelected = amountInput === String(amt);
                      return (
                        <TouchableOpacity
                          key={amt}
                          style={[
                            styles.quickAmountChip,
                            {
                              backgroundColor: isSelected ? t.brandTint : t.chipBg,
                              borderColor: isSelected ? t.brand : t.cardBorder,
                            },
                          ]}
                          activeOpacity={0.7}
                          onPress={() => setAmountInput(String(amt))}>
                          <Text
                            style={[
                              styles.quickAmountText,
                              { color: isSelected ? t.brand : t.textPrimary },
                            ]}>
                            ₦{amt.toLocaleString()}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Fee & Summary */}
                <View style={[styles.summaryBox, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
                  <View style={styles.summaryLine}>
                    <Text style={[styles.summaryLabel, { color: t.muted }]}>Service Fee</Text>
                    <Text style={[styles.summaryVal, { color: t.success }]}>₦0.00 (Free)</Text>
                  </View>
                  <View style={styles.summaryLine}>
                    <Text style={[styles.summaryLabel, { color: t.muted }]}>Payment Source</Text>
                    <Text style={[styles.summaryVal, { color: t.textPrimary }]}>NearbyPay Wallet</Text>
                  </View>
                </View>
              </ScrollView>

              {/* Pay Button */}
              <TouchableOpacity
                style={[styles.payButton, { backgroundColor: t.brand }]}
                activeOpacity={0.8}
                disabled={isProcessing}
                onPress={handlePay}>
                <Text style={styles.payButtonText}>
                  {isProcessing ? 'Processing Transaction...' : `Pay ₦${parseFloat(amountInput || '0').toLocaleString()}`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ─── MODAL: Success Receipt ──────────────────────────── */}
        <Modal
          visible={!!successReceipt}
          transparent
          animationType="fade"
          onRequestClose={() => setSuccessReceipt(null)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.receiptCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
              <View style={[styles.receiptIconWrap, { backgroundColor: t.successTint }]}>
                <HugeiconsIcon icon={CheckmarkBadge01Icon} size={32} color={t.success} />
              </View>

              <Text style={[styles.receiptHeading, { color: t.textPrimary }]}>Bill Paid Successfully!</Text>
              <Text style={[styles.receiptSubhead, { color: t.textSecondary }]}>
                Your {successReceipt?.service} purchase has been delivered instantly.
              </Text>

              {/* Token box for light */}
              {successReceipt?.token && (
                <View style={[styles.tokenBox, { backgroundColor: t.warningTint, borderColor: t.warning }]}>
                  <Text style={[styles.tokenLabel, { color: t.warning }]}>ELECTRICITY TOKEN</Text>
                  <Text style={[styles.tokenCode, { color: t.textPrimary }]}>{successReceipt.token}</Text>
                  <Text style={[styles.tokenSub, { color: t.textSecondary }]}>Enter this 20-digit code into your meter</Text>
                </View>
              )}

              <View style={[styles.receiptDetails, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
                <View style={styles.receiptLine}>
                  <Text style={[styles.receiptLabel, { color: t.muted }]}>Service</Text>
                  <Text style={[styles.receiptValue, { color: t.textPrimary }]}>{successReceipt?.service}</Text>
                </View>
                <View style={styles.receiptLine}>
                  <Text style={[styles.receiptLabel, { color: t.muted }]}>Account</Text>
                  <Text style={[styles.receiptValue, { color: t.textPrimary }]}>{successReceipt?.account}</Text>
                </View>
                <View style={styles.receiptLine}>
                  <Text style={[styles.receiptLabel, { color: t.muted }]}>Amount Paid</Text>
                  <Text style={[styles.receiptValue, { color: t.textPrimary, fontFamily: 'Montserrat_700Bold' }]}>
                    {successReceipt?.amount}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.receiptDoneBtn, { backgroundColor: t.brand }]}
                activeOpacity={0.8}
                onPress={() => {
                  setSuccessReceipt(null);
                  setActiveService(null);
                }}>
                <Text style={styles.receiptDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitles: {
    alignItems: 'center',
  },
  topEyebrow: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 10,
    letterSpacing: 1.2,
  },
  screenTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
  },
  balancePillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceLabel: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  balanceValue: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    marginTop: 2,
  },
  cashbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  cashbackText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 10,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '48%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  serviceCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 100,
  },
  serviceBadgeText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 9,
  },
  serviceTextGroup: {
    gap: 2,
  },
  serviceLabel: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 15,
  },
  serviceTagline: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 11,
  },
  serviceDesc: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  serviceCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  tapToPay: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
  },
  meshNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  meshIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meshNoticeInfo: {
    flex: 1,
    gap: 3,
  },
  meshNoticeTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
  },
  meshNoticeText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11,
    lineHeight: 16,
  },
  recentBillsCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  recentBillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  recentBillIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentBillDetails: {
    flex: 1,
    gap: 2,
  },
  recentBillTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
  },
  recentBillAccount: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11,
  },
  recentBillAction: {
    alignItems: 'flex-end',
    gap: 2,
  },
  recentBillAmount: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
  },
  repeatText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 11,
  },

  // Modal Sheet Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  backdropDismiss: {
    flex: 1,
  },
  sheetContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetHeaderTitles: {
    flex: 1,
    gap: 2,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
  },
  sheetSubtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScroll: {
    maxHeight: 380,
  },
  fieldLabel: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  providerScroll: {
    marginBottom: 14,
  },
  providerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  providerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
  },
  providerChipText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
  },
  formGroup: {
    marginBottom: 14,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autofillText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 11,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
  },
  amountInput: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
  },
  quickAmountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  quickAmountChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickAmountText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 11,
  },
  segmentTrack: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  segmentOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  segmentOptionActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentOptionText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
  },
  summaryBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    marginBottom: 14,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11,
  },
  summaryVal: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 11,
  },
  payButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  payButtonText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },

  // Receipt Modal
  receiptCard: {
    margin: 20,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    width: '90%',
    maxWidth: 380,
    alignSelf: 'center',
  },
  receiptIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  receiptHeading: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    textAlign: 'center',
  },
  receiptSubhead: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  tokenBox: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
    marginVertical: 4,
  },
  tokenLabel: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 10,
    letterSpacing: 1,
  },
  tokenCode: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    letterSpacing: 1.5,
  },
  tokenSub: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 10,
    textAlign: 'center',
  },
  receiptDetails: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginVertical: 4,
  },
  receiptLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
  },
  receiptValue: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
  },
  receiptDoneBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  receiptDoneBtnText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
