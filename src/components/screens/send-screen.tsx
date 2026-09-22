import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Building01Icon,
  QrCodeIcon,
  Search01Icon,
  ShieldCheckIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';

import { useToast } from '@/components/ui/toast';
import { getAppTheme, GRADIENT_STOPS } from '@/constants/app-theme';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

const RECIPIENTS = [
  { id: '1', initials: 'TA', name: 'Tunde', bg: '#EFF6FF', text: '#2563EB' },
  { id: '2', initials: 'BA', name: 'Bisi', bg: '#F0FDF4', text: '#16A34A' },
  { id: '3', initials: 'FD', name: 'Faith', bg: '#FEF3C7', text: '#D97706' },
  { id: '4', initials: 'OA', name: 'Olamide', bg: '#FEE2E2', text: '#DC2626' },
];

const QUICK_AMOUNTS = [
  { label: '₦5,000', value: '5000' },
  { label: '₦10,000', value: '10000' },
  { label: '₦20,000', value: '20000' },
  { label: '₦50,000', value: '50000' },
];

export function SendScreen() {
  const router = useRouter();
  const { show } = useToast();
  const isDark = useColorScheme() === 'dark';
  const t = getAppTheme(isDark);

  const [tab, setTab] = useState<'bank' | 'nearby'>('bank');
  const [recipientQuery, setRecipientQuery] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>('1');
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [focused, setFocused] = useState<'search' | 'amount' | 'note' | null>(null);

  const hasAmount = amount.replace(/[^0-9]/g, '').length > 0;

  const formattedAmount = () => {
    if (!amount) return '0.00';
    const num = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Send Money</Text>
        <TouchableOpacity
          style={[styles.headerBtn, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
          activeOpacity={0.7}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Scan QR code"
          onPress={() => show({ message: 'QR Scanner opened', variant: 'info' })}>
          <HugeiconsIcon icon={QrCodeIcon} size={18} color={t.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Mode Toggle Switcher */}
        <View style={[styles.tabSegmentContainer, { backgroundColor: t.chipBg }]}>
          <TouchableOpacity
            style={[styles.tabSegment, tab === 'bank' && styles.tabSegmentActive]}
            activeOpacity={0.85}
            onPress={() => setTab('bank')}>
            <Text style={[styles.tabSegmentText, tab === 'bank' ? styles.tabSegmentTextActive : { color: t.textSecondary }]}>
              To Bank
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabSegment, tab === 'nearby' && styles.tabSegmentActive]}
            activeOpacity={0.85}
            onPress={() => setTab('nearby')}>
            <Text style={[styles.tabSegmentText, tab === 'nearby' ? styles.tabSegmentTextActive : { color: t.textSecondary }]}>
              To Nearby User
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recipient Section */}
        <Text style={[styles.sectionLabel, { color: t.textPrimary }]}>Recipient</Text>
        
        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: t.cardBg, borderColor: focused === 'search' ? t.brand : t.cardBorder },
          ]}>
          <HugeiconsIcon icon={Search01Icon} size={18} color={t.muted} />
          <TextInput
            style={[styles.searchInput, { color: t.textPrimary }]}
            placeholder="Enter account number, phone or bank name"
            placeholderTextColor={t.muted}
            value={recipientQuery}
            onChangeText={setRecipientQuery}
            returnKeyType="search"
            onFocus={() => setFocused('search')}
            onBlur={() => setFocused(null)}
            accessibilityLabel="Search recipient"
          />
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Scan recipient QR"
            onPress={() => show({ message: 'Scanning recipient QR', variant: 'info' })}>
            <HugeiconsIcon icon={QrCodeIcon} size={18} color={t.muted} />
          </TouchableOpacity>
        </View>

        {/* Recipient Avatars Row */}
        <View style={styles.recipientsRow}>
          {RECIPIENTS.map((item) => {
            const isSelected = selectedRecipient === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.recipientItem}
                activeOpacity={0.8}
                onPress={() => setSelectedRecipient(item.id)}>
                <View
                  style={[
                    styles.avatarCircle,
                    { backgroundColor: item.bg },
                    isSelected && [styles.avatarSelected, { borderColor: t.brand }],
                  ]}>
                  <Text style={[styles.avatarText, { color: item.text }]}>{item.initials}</Text>
                </View>
                <Text style={[styles.recipientName, { color: t.textPrimary }]}>{item.name}</Text>
              </TouchableOpacity>
            );
          })}
          
          <TouchableOpacity
            style={styles.recipientItem}
            activeOpacity={0.8}
            onPress={() => show({ message: 'Viewing all recipients', variant: 'info' })}>
            <View style={[styles.avatarCircle, { backgroundColor: t.chipBg }]}>
              <HugeiconsIcon icon={UserGroupIcon} size={20} color={t.textSecondary} />
            </View>
            <Text style={[styles.recipientName, { color: t.textPrimary }]}>More</Text>
          </TouchableOpacity>
        </View>

        {/* Bank Section */}
        <Text style={[styles.sectionLabel, { color: t.textPrimary }]}>Bank</Text>
        <TouchableOpacity
          style={[styles.bankSelector, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
          activeOpacity={0.8}
          onPress={() => show({ message: 'Bank selector opened', variant: 'info' })}>
          <View style={styles.bankLeft}>
            <View style={[styles.bankIconCircle, { backgroundColor: t.brandTint }]}>
              <HugeiconsIcon icon={Building01Icon} size={18} color={t.brand} />
            </View>
            <Text style={[styles.bankText, { color: selectedBank ? t.textPrimary : t.muted }]}>
              {selectedBank || 'Select Bank'}
            </Text>
          </View>
          <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={t.muted} />
        </TouchableOpacity>

        {/* Amount Section */}
        <Text style={[styles.sectionLabel, { color: t.textPrimary }]}>Amount</Text>
        <View
          style={[
            styles.amountCard,
            { backgroundColor: t.cardBg, borderColor: focused === 'amount' ? t.brand : t.cardBorder },
          ]}>
          <View style={styles.amountInputRow}>
            <Text style={[styles.nairaSymbol, { color: t.brand }]}>₦</Text>
            <TextInput
              style={[styles.amountInput, !hasAmount && styles.amountInputEmpty, { color: t.textPrimary }]}
              value={amount}
              onChangeText={(val) => setAmount(val.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={t.muted}
              returnKeyType="done"
              selectTextOnFocus
              maxLength={13}
              onFocus={() => setFocused('amount')}
              onBlur={() => setFocused(null)}
              onSubmitEditing={() => Keyboard.dismiss()}
              accessibilityLabel="Transfer amount in naira"
            />
          </View>
        </View>

        {/* Quick Amounts Pills */}
        <View style={styles.quickAmountsRow}>
          {QUICK_AMOUNTS.map((item) => {
            const isSelected = amount === item.value;
            return (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.quickChip,
                  { backgroundColor: t.chipBg },
                  isSelected && styles.quickChipActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setAmount(item.value)}>
                <Text style={[styles.quickChipText, isSelected ? styles.quickChipTextActive : { color: t.textSecondary }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Add Note Section */}
        <View style={styles.noteHeader}>
          <Text style={[styles.sectionLabel, { color: t.textPrimary, marginTop: 0 }]}>Add a note</Text>
          <Text style={[styles.optionalLabel, { color: t.textSecondary }]}> (optional)</Text>
        </View>
        <View
          style={[
            styles.noteCard,
            { backgroundColor: t.cardBg, borderColor: focused === 'note' ? t.brand : t.cardBorder },
          ]}>
          <TextInput
            style={[styles.noteInput, { color: t.textPrimary }]}
            placeholder="e.g. For lunch"
            placeholderTextColor={t.muted}
            value={note}
            onChangeText={(text) => text.length <= 50 && setNote(text)}
            maxLength={50}
            multiline
            returnKeyType="done"
            blurOnSubmit
            onFocus={() => setFocused('note')}
            onBlur={() => setFocused(null)}
            accessibilityLabel="Transfer note, optional"
          />
          <Text style={[styles.charCounter, { color: t.muted }]}>{note.length}/50</Text>
        </View>

        {/* Security Banner */}
        <View style={[styles.securityCard, { backgroundColor: t.brandTint, borderColor: t.brandTintStrong }]}>
          <View style={[styles.securityIconCircle, { backgroundColor: t.brandTintStrong }]}>
            <HugeiconsIcon icon={ShieldCheckIcon} size={20} color={t.brand} />
          </View>
          <View style={styles.securityTextWrap}>
            <Text style={[styles.securityTitle, { color: t.textPrimary }]}>Secure &amp; Fast</Text>
            <Text style={[styles.securitySub, { color: t.textSecondary }]}>Your money is protected with bank-level security.</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, !hasAmount && styles.submitBtnDisabled]}
          activeOpacity={0.88}
          disabled={!hasAmount}
          accessibilityRole="button"
          accessibilityLabel="Review and send transfer"
          accessibilityState={{ disabled: !hasAmount }}
          onPress={() =>
            show({
              message: `Sending ₦${formattedAmount()} — processing transfer...`,
              variant: 'success',
            })
          }>
          <Svg style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="sendCtaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={GRADIENT_STOPS.from} />
                <Stop offset="100%" stopColor={GRADIENT_STOPS.to} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" rx={18} fill="url(#sendCtaGrad)" />
          </Svg>
          <Text style={styles.submitBtnText}>Review &amp; Send</Text>
          <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#FFFFFF" />
        </TouchableOpacity>
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
    paddingBottom: 40,
  },
  tabSegmentContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
    marginTop: 8,
    marginBottom: 20,
  },
  tabSegment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  tabSegmentActive: {
    backgroundColor: '#2E45F4',
    ...Platform.select({
      ios: { shadowColor: '#2E45F4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 3 },
      web: { shadowColor: '#2E45F4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    }),
  },
  tabSegmentText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
  },
  tabSegmentTextActive: {
    color: '#FFFFFF',
  },
  sectionLabel: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    letterSpacing: -0.2,
    marginTop: 16,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Montserrat_500Medium',
    fontSize: 13,
  },
  recipientsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  recipientItem: {
    alignItems: 'center',
    gap: 6,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: {
    borderWidth: 2,
  },
  avatarText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 15,
  },
  recipientName: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 12,
  },
  bankSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 56,
  },
  bankLeft: {
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
  bankText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 14,
  },
  amountCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nairaSymbol: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 26,
  },
  amountInput: {
    flex: 1,
    fontFamily: 'Montserrat_700Bold',
    fontSize: 26,
  },
  amountInputEmpty: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 22,
  },
  quickAmountsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  quickChip: {
    flex: 1,
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipActive: {
    backgroundColor: '#2E45F4',
  },
  quickChipText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
  },
  quickChipTextActive: {
    color: '#FFFFFF',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 10,
  },
  optionalLabel: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 13,
  },
  noteCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    minHeight: 88,
    justifyContent: 'space-between',
  },
  noteInput: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 13,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  securityIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityTextWrap: {
    flex: 1,
  },
  securityTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
  },
  securitySub: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: '#2E45F4',
    borderRadius: 18,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
    shadowColor: '#2E45F4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0.1,
    elevation: 0,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
  },
});
