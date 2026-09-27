import {
  ArrowDown01Icon,
  BankIcon,
  Cancel01Icon,
  CheckmarkBadge01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  CreditCardIcon,
  FlashIcon,
  InformationCircleIcon,
  Share08Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/components/ui/toast';
import { getAppTheme } from '@/constants/app-theme';
import { useAppTheme } from '@/hooks/theme-provider';
import { useUserProfile } from '@/hooks/user-profile-provider';
import { supabase } from '@/lib/supabase';

type AddMoneySheetProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (newBalance: number) => void;
};

const PRESET_AMOUNTS = [2000, 5000, 10000, 20000, 50000];

export function AddMoneySheet({ visible, onClose, onSuccess }: AddMoneySheetProps) {
  const { isDark } = useAppTheme();
  const t = getAppTheme(isDark);
  const insets = useSafeAreaInsets();
  const { show } = useToast();
  const { profile } = useUserProfile();

  const [activeTab, setActiveTab] = useState<'transfer' | 'topup'>('transfer');
  const [selectedAmount, setSelectedAmount] = useState<number>(10000);
  const [customAmount, setCustomAmount] = useState<string>('10000');
  const [selectedChannel, setSelectedChannel] = useState<'Bank Transfer' | 'Debit Card' | 'USSD'>('Bank Transfer');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successData, setSuccessData] = useState<{
    amount: number;
    reference: string;
    newBalance: number;
  } | null>(null);

  const rawAccount = profile.accountNumber || '9012345678';
  const formattedAccount = rawAccount.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  const bankName = profile.bankName || 'NearbyPay MFB • Wema Bank';

  const resetForm = () => {
    setIsProcessing(false);
    setSuccessData(null);
    setSelectedAmount(10000);
    setCustomAmount('10000');
    setActiveTab('transfer');
  };

  const handleClose = () => {
    resetForm();
    onClose();
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

  const handleShareDetails = async () => {
    try {
      await Share.share({
        message: `NearbyPay Deposit Details:\nBank: ${bankName}\nAccount Number: ${rawAccount}\nAccount Name: ${profile.name.toUpperCase()}`,
        title: 'NearbyPay Account Details',
      });
    } catch {
      show({ message: 'Unable to open share sheet', variant: 'error' });
    }
  };

  const handlePresetSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount(amount.toString());
  };

  const handleCustomAmountChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    setCustomAmount(cleaned);
    const parsed = parseInt(cleaned, 10);
    if (!isNaN(parsed)) {
      setSelectedAmount(parsed);
    } else {
      setSelectedAmount(0);
    }
  };

  const handleDeposit = async () => {
    const amountToDeposit = selectedAmount;
    if (!amountToDeposit || amountToDeposit < 100) {
      show({ message: 'Minimum deposit amount is ₦100.', variant: 'error' });
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.rpc('add_money_deposit', {
        p_amount: amountToDeposit,
        p_channel: selectedChannel,
        p_description: `Deposit via ${selectedChannel}`,
      });

      if (error) throw new Error(error.message);

      const res = data as { success: boolean; error?: string; reference: string; newBalance: number; amount: number };
      if (!res.success) {
        throw new Error(res.error || 'Deposit failed. Please try again.');
      }

      setSuccessData({
        amount: res.amount,
        reference: res.reference,
        newBalance: res.newBalance,
      });

      show({
        message: `₦${amountToDeposit.toLocaleString('en-NG')} added to your wallet!`,
        variant: 'success',
      });

      if (onSuccess) {
        onSuccess(res.newBalance);
      }
    } catch (err) {
      show({
        message: err instanceof Error ? err.message : 'Unable to complete deposit. Try again.',
        variant: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={handleClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: t.cardBg,
              borderColor: t.cardBorder,
              paddingBottom: Math.max(insets.bottom, 20) + 16,
            },
          ]}>
          <View style={[styles.handle, { backgroundColor: t.divider }]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: t.brandTint }]}>
              <HugeiconsIcon icon={ArrowDown01Icon} size={22} color={t.brand} strokeWidth={2.4} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: t.textPrimary }]}>Add Money</Text>
              <Text style={[styles.subtitle, { color: t.textSecondary }]}>
                Fund your live NearbyPay balance
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: t.chipBg }]}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close add money">
              <HugeiconsIcon icon={Cancel01Icon} size={16} color={t.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Success State */}
          {successData ? (
            <View style={styles.successContainer}>
              <View style={[styles.successIconWrap, { backgroundColor: t.successTint }]}>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={46} color={t.success} strokeWidth={2.4} />
              </View>
              <Text style={[styles.successTitle, { color: t.textPrimary }]}>Deposit Confirmed!</Text>
              <Text style={[styles.successAmount, { color: t.success }]}>
                +₦{successData.amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={[styles.successSubtitle, { color: t.textSecondary }]}>
                Funds have been credited directly to your live Supabase wallet balance.
              </Text>

              <View style={[styles.successReceiptCard, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
                <View style={styles.receiptLine}>
                  <Text style={[styles.receiptLabel, { color: t.muted }]}>Channel</Text>
                  <Text style={[styles.receiptVal, { color: t.textPrimary }]}>{selectedChannel}</Text>
                </View>
                <View style={styles.receiptLine}>
                  <Text style={[styles.receiptLabel, { color: t.muted }]}>Reference</Text>
                  <Text style={[styles.receiptVal, { color: t.textPrimary }]}>{successData.reference}</Text>
                </View>
                <View style={styles.receiptLine}>
                  <Text style={[styles.receiptLabel, { color: t.muted }]}>Updated Balance</Text>
                  <Text style={[styles.receiptVal, { color: t.brand, fontFamily: 'Montserrat_700Bold' }]}>
                    ₦{successData.newBalance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: t.brand }]}
                activeOpacity={0.85}
                onPress={handleClose}>
                <Text style={styles.primaryActionBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {/* Tab Selector */}
              <View style={[styles.tabSegmentTrack, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
                <TouchableOpacity
                  style={[styles.tabSegmentBtn, activeTab === 'transfer' && { backgroundColor: t.cardBg }]}
                  activeOpacity={0.8}
                  onPress={() => setActiveTab('transfer')}>
                  <HugeiconsIcon
                    icon={BankIcon}
                    size={15}
                    color={activeTab === 'transfer' ? t.brand : t.muted}
                    strokeWidth={2.2}
                  />
                  <Text
                    style={[
                      styles.tabSegmentText,
                      { color: activeTab === 'transfer' ? t.textPrimary : t.muted },
                    ]}>
                    Bank Transfer
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabSegmentBtn, activeTab === 'topup' && { backgroundColor: t.cardBg }]}
                  activeOpacity={0.8}
                  onPress={() => setActiveTab('topup')}>
                  <HugeiconsIcon
                    icon={FlashIcon}
                    size={15}
                    color={activeTab === 'topup' ? t.brand : t.muted}
                    strokeWidth={2.2}
                  />
                  <Text
                    style={[
                      styles.tabSegmentText,
                      { color: activeTab === 'topup' ? t.textPrimary : t.muted },
                    ]}>
                    Instant Top-Up
                  </Text>
                </TouchableOpacity>
              </View>

              {activeTab === 'transfer' ? (
                /* ─── TAB 1: BANK TRANSFER ─────────────────────── */
                <View style={styles.tabContent}>
                  <View style={[styles.infoBanner, { backgroundColor: t.brandTint, borderColor: t.brandTintStrong }]}>
                    <HugeiconsIcon icon={InformationCircleIcon} size={18} color={t.brand} strokeWidth={2.2} />
                    <Text style={[styles.infoBannerText, { color: t.textSecondary }]}>
                      Transfer money to your dedicated NearbyPay account from any bank app. Your balance updates automatically.
                    </Text>
                  </View>

                  <View style={[styles.accountCard, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
                    <View style={styles.accountCardTop}>
                      <View>
                        <Text style={[styles.accountDetailLabel, { color: t.muted }]}>BANK NAME</Text>
                        <Text style={[styles.accountDetailValue, { color: t.textPrimary }]}>{bankName}</Text>
                      </View>
                      <View style={[styles.liveStatusBadge, { backgroundColor: t.successTint }]}>
                        <HugeiconsIcon icon={CheckmarkBadge01Icon} size={12} color={t.success} strokeWidth={2.4} />
                        <Text style={[styles.liveStatusText, { color: t.success }]}>Active Nuban</Text>
                      </View>
                    </View>

                    <View style={styles.accountNumberRow}>
                      <View style={styles.accountNumberBlock}>
                        <Text style={[styles.accountDetailLabel, { color: t.muted }]}>ACCOUNT NUMBER</Text>
                        <Text style={[styles.accountNumberBig, { color: t.textPrimary }]}>{formattedAccount}</Text>
                      </View>

                      <TouchableOpacity
                        style={[styles.copyBtn, { backgroundColor: t.brand }]}
                        activeOpacity={0.85}
                        onPress={copyAccountNumber}>
                        <HugeiconsIcon icon={Copy01Icon} size={15} color="#FFFFFF" strokeWidth={2.2} />
                        <Text style={styles.copyBtnText}>Copy</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.accountHolderBlock}>
                      <Text style={[styles.accountDetailLabel, { color: t.muted }]}>ACCOUNT NAME</Text>
                      <Text style={[styles.accountHolderName, { color: t.textPrimary }]}>
                        {profile.name.toUpperCase()} / NEARBYPAY
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={[styles.secondaryActionBtn, { borderColor: t.cardBorder, backgroundColor: t.chipBg }]}
                      activeOpacity={0.8}
                      onPress={handleShareDetails}>
                      <HugeiconsIcon icon={Share08Icon} size={16} color={t.textPrimary} strokeWidth={2.2} />
                      <Text style={[styles.secondaryActionBtnText, { color: t.textPrimary }]}>Share Details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.primaryActionBtn, { backgroundColor: t.brand, flex: 1.3 }]}
                      activeOpacity={0.85}
                      onPress={() => setActiveTab('topup')}>
                      <HugeiconsIcon icon={FlashIcon} size={16} color="#FFFFFF" strokeWidth={2.2} />
                      <Text style={styles.primaryActionBtnText}>Instant Top-Up</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.footnoteText, { color: t.muted }]}>
                    Zero transaction fee • Instant settlement • Real-time Supabase sync
                  </Text>
                </View>
              ) : (
                /* ─── TAB 2: INSTANT TOP-UP ───────────────────── */
                <View style={styles.tabContent}>
                  <Text style={[styles.sectionHeading, { color: t.textPrimary }]}>Select Top-Up Amount</Text>

                  {/* Preset Amount Pills */}
                  <View style={styles.presetAmountsGrid}>
                    {PRESET_AMOUNTS.map((amt) => {
                      const isSelected = selectedAmount === amt;
                      return (
                        <TouchableOpacity
                          key={amt}
                          style={[
                            styles.presetChip,
                            {
                              backgroundColor: isSelected ? t.brand : t.inputBg,
                              borderColor: isSelected ? t.brand : t.inputBorder,
                            },
                          ]}
                          activeOpacity={0.8}
                          onPress={() => handlePresetSelect(amt)}>
                          <Text
                            style={[
                              styles.presetChipText,
                              { color: isSelected ? '#FFFFFF' : t.textPrimary },
                            ]}>
                            ₦{amt.toLocaleString('en-NG')}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Custom Amount Input */}
                  <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Or enter custom amount (₦)</Text>
                  <View style={[styles.amountInputContainer, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
                    <Text style={[styles.currencyPrefix, { color: t.brand }]}>₦</Text>
                    <TextInput
                      style={[styles.amountTextInput, { color: t.textPrimary }]}
                      keyboardType="number-pad"
                      value={customAmount}
                      onChangeText={handleCustomAmountChange}
                      placeholder="0"
                      placeholderTextColor={t.muted}
                      maxLength={8}
                    />
                  </View>

                  {/* Channel Selection */}
                  <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Payment Channel</Text>
                  <View style={styles.channelRow}>
                    {(['Bank Transfer', 'Debit Card', 'USSD'] as const).map((channel) => {
                      const isSelected = selectedChannel === channel;
                      return (
                        <TouchableOpacity
                          key={channel}
                          style={[
                            styles.channelChip,
                            {
                              backgroundColor: isSelected ? t.brandTint : t.inputBg,
                              borderColor: isSelected ? t.brand : t.inputBorder,
                            },
                          ]}
                          activeOpacity={0.8}
                          onPress={() => setSelectedChannel(channel)}>
                          <HugeiconsIcon
                            icon={channel === 'Debit Card' ? CreditCardIcon : channel === 'Bank Transfer' ? BankIcon : FlashIcon}
                            size={14}
                            color={isSelected ? t.brand : t.muted}
                            strokeWidth={2.2}
                          />
                          <Text
                            style={[
                              styles.channelChipText,
                              { color: isSelected ? t.brand : t.textSecondary, fontFamily: isSelected ? 'Montserrat_700Bold' : 'Montserrat_500Medium' },
                            ]}>
                            {channel}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[
                      styles.primaryActionBtn,
                      { backgroundColor: t.brand, marginTop: 16 },
                      (isProcessing || selectedAmount <= 0) && styles.disabledBtn,
                    ]}
                    activeOpacity={0.85}
                    disabled={isProcessing || selectedAmount <= 0}
                    onPress={handleDeposit}>
                    {isProcessing ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <View style={styles.btnInner}>
                        <HugeiconsIcon icon={FlashIcon} size={17} color="#FFFFFF" strokeWidth={2.4} />
                        <Text style={styles.primaryActionBtnText}>
                          Deposit ₦{selectedAmount.toLocaleString('en-NG')}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <Text style={[styles.footnoteText, { color: t.muted }]}>
                    Credits live to your Supabase account balance immediately.
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    borderWidth: 1,
    borderBottomWidth: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '88%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 17,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  tabSegmentTrack: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 9,
    borderRadius: 10,
  },
  tabSegmentText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12,
  },
  tabContent: {
    gap: 12,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoBannerText: {
    flex: 1,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
  },
  accountCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  accountCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountDetailLabel: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 9.5,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  accountDetailValue: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
  },
  liveStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveStatusText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 10,
  },
  accountNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  accountNumberBlock: {
    flex: 1,
  },
  accountNumberBig: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 22,
    letterSpacing: 1.5,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  copyBtnText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 11.5,
    color: '#FFFFFF',
  },
  accountHolderBlock: {
    marginTop: 2,
  },
  accountHolderName: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12.5,
    letterSpacing: 0.5,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  secondaryActionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryActionBtnText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12.5,
  },
  primaryActionBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#2E45F4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
      android: { elevation: 3 },
      web: { shadowColor: '#2E45F4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
    }),
  },
  primaryActionBtnText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  footnoteText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 10.5,
    textAlign: 'center',
    marginTop: 4,
  },
  sectionHeading: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
    marginBottom: 4,
  },
  presetAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 11,
    borderWidth: 1,
  },
  presetChipText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12,
  },
  inputLabel: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 11.5,
    marginTop: 4,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
  },
  currencyPrefix: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 22,
    marginRight: 6,
  },
  amountTextInput: {
    flex: 1,
    fontFamily: 'Montserrat_700Bold',
    fontSize: 22,
    height: '100%',
  },
  channelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  channelChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 11,
    borderWidth: 1,
  },
  channelChipText: {
    fontSize: 11,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 8,
  },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
    letterSpacing: -0.4,
  },
  successAmount: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 32,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  successSubtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
    lineHeight: 18,
    maxWidth: 290,
  },
  successReceiptCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    marginBottom: 20,
  },
  receiptLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11.5,
  },
  receiptVal: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12.5,
  },
});
