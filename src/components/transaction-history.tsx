import {
    ArrowLeft01Icon,
    Calendar03Icon,
    Cancel01Icon,
    Download01Icon,
    FilterHorizontalIcon,
    Search01Icon,
    ShoppingBag02Icon,
    Tick02Icon,
    UserGroupIcon,
    UserIcon,
    WifiIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useToast } from '@/components/ui/toast';
import { getAppTheme, GRADIENT_STOPS } from '@/constants/app-theme';
import { useAppTheme } from '@/hooks/theme-provider';
import { useUserProfile } from '@/hooks/user-profile-provider';
import {
  formatTransactionDate,
  isNewAccount,
  NEW_ACCOUNT_DEPOSIT_AMOUNT,
  NEW_ACCOUNT_DEPOSIT_TITLE,
} from '@/lib/welcome-transaction';
import { SafeAreaView } from 'react-native-safe-area-context';

type TxType = 'sent' | 'received';

type HistoryTx = {
  id: string;
  title: string;
  category: string;
  date: string;
  dayGroup: string;
  amount: string;
  numeric: number;
  type: TxType;
  icon: typeof UserIcon;
  iconColor: string;
  amountColor: string;
  status: 'Completed' | 'Pending';
  reference: string;
  channel: string;
};

const HISTORY_TX: HistoryTx[] = [
  {
    id: '1',
    title: 'Tunde Adeboyo',
    category: 'Transfer',
    date: 'Jun 28, 10:24 AM',
    dayGroup: 'Today',
    amount: '- ₦5,000',
    numeric: 5000,
    type: 'sent',
    icon: UserIcon,
    iconColor: '#EF4444',
    amountColor: '#EF4444',
    status: 'Completed',
    reference: 'NPP-93841-XT',
    channel: 'NearbyPay Transfer',
  },
  {
    id: '2',
    title: 'Bisi Lawal',
    category: 'Transfer',
    date: 'Jun 28, 08:02 AM',
    dayGroup: 'Today',
    amount: '+ ₦20,000',
    numeric: 20000,
    type: 'received',
    icon: Download01Icon,
    iconColor: '#16A34A',
    amountColor: '#16A34A',
    status: 'Completed',
    reference: 'NPP-93840-XT',
    channel: 'NearbyPay Transfer',
  },
  {
    id: '3',
    title: 'MTN Data Bundle',
    category: 'Bills',
    date: 'Jun 27, 09:12 PM',
    dayGroup: 'Yesterday',
    amount: '- ₦3,500',
    numeric: 3500,
    type: 'sent',
    icon: WifiIcon,
    iconColor: '#EF4444',
    amountColor: '#EF4444',
    status: 'Completed',
    reference: 'NPP-93710-XT',
    channel: 'Bills & Top-up',
  },
  {
    id: '4',
    title: 'Family Support',
    category: 'Group',
    date: 'Jun 27, 04:12 PM',
    dayGroup: 'Yesterday',
    amount: '+ ₦12,500',
    numeric: 12500,
    type: 'received',
    icon: UserGroupIcon,
    iconColor: '#16A34A',
    amountColor: '#16A34A',
    status: 'Completed',
    reference: 'NPP-93698-XT',
    channel: 'Split Payment',
  },
  {
    id: '5',
    title: 'Shoprite Ikeja',
    category: 'Shopping',
    date: 'Jun 26, 06:40 PM',
    dayGroup: 'Jun 26, 2026',
    amount: '- ₦18,200',
    numeric: 18200,
    type: 'sent',
    icon: ShoppingBag02Icon,
    iconColor: '#EF4444',
    amountColor: '#EF4444',
    status: 'Pending',
    reference: 'NPP-93552-XT',
    channel: 'Card Payment',
  },
  {
    id: '6',
    title: 'Chuka Eme',
    category: 'Transfer',
    date: 'Jun 26, 11:05 AM',
    dayGroup: 'Jun 26, 2026',
    amount: '+ ₦7,000',
    numeric: 7000,
    type: 'received',
    icon: Download01Icon,
    iconColor: '#16A34A',
    amountColor: '#16A34A',
    status: 'Completed',
    reference: 'NPP-93490-XT',
    channel: 'NearbyPay Transfer',
  },
];

type FilterKey = 'all' | 'sent' | 'received';

const FILTERS: { id: FilterKey; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'sent', label: 'Sent' },
  { id: 'received', label: 'Received' },
];

export default function TransactionHistoryScreen({ onBack }: { onBack: () => void }) {
  const { show } = useToast();
  const { profile } = useUserProfile();
  const { isDark } = useAppTheme();
  const t = getAppTheme(isDark);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTx, setSelectedTx] = useState<HistoryTx | null>(null);
  const historyTransactions = isNewAccount(profile.createdAt)
    ? [
        {
          id: 'new-account-deposit',
          title: NEW_ACCOUNT_DEPOSIT_TITLE,
          category: 'Deposit',
          date: formatTransactionDate(profile.createdAt),
          dayGroup: 'Today',
          amount: `+ ₦${NEW_ACCOUNT_DEPOSIT_AMOUNT.toLocaleString()}`,
          numeric: NEW_ACCOUNT_DEPOSIT_AMOUNT,
          type: 'received' as const,
          icon: Download01Icon,
          iconColor: '#16A34A',
          amountColor: '#16A34A',
          status: 'Completed' as const,
          reference: 'NPP-HACKATHON-DEPOSIT',
          channel: 'NearbyPay New Account Deposit',
        },
        ...HISTORY_TX,
      ]
    : HISTORY_TX;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return historyTransactions.filter((tx) => {
      const matchesFilter = filter === 'all' || tx.type === filter;
      const matchesQuery =
        q.length === 0 ||
        tx.title.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [filter, historyTransactions, query]);

  const groups = useMemo(() => {
    const map = new Map<string, HistoryTx[]>();
    for (const tx of filtered) {
      const list = map.get(tx.dayGroup) ?? [];
      list.push(tx);
      map.set(tx.dayGroup, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const totalIn = filtered
    .filter((tx) => tx.type === 'received')
    .reduce((sum, tx) => sum + tx.numeric, 0);
  const totalOut = filtered
    .filter((tx) => tx.type === 'sent')
    .reduce((sum, tx) => sum + tx.numeric, 0);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.pageBg }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />


      <View style={[styles.container, { backgroundColor: t.pageBg }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
            activeOpacity={0.7}
            onPress={onBack}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} color={t.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Transaction History</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#1E44F8"
              colors={['#1E44F8']}
              progressBackgroundColor={t.cardBg}
            />
          }>
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <Svg style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="histGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={GRADIENT_STOPS.from} />
                  <Stop offset="100%" stopColor={GRADIENT_STOPS.to} />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" rx={22} fill="url(#histGrad)" />
            </Svg>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Money in</Text>
                <Text style={styles.summaryValue}>+₦{totalIn.toLocaleString()}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Money out</Text>
                <Text style={styles.summaryValue}>-₦{totalOut.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {/* Search + Filter */}
          <View style={styles.searchRow}>
            <View style={[styles.searchBox, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
              <HugeiconsIcon icon={Search01Icon} size={15} color={t.iconColor} />
              <TextInput
                style={[styles.searchInput, { color: t.textPrimary }]}
                placeholder="Search transactions"
                placeholderTextColor={t.muted}
                value={query}
                onChangeText={setQuery}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.6}>
                  <HugeiconsIcon icon={Cancel01Icon} size={14} color={t.muted} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
              activeOpacity={0.7}
              onPress={() =>
                show({ message: 'Date range filter coming soon', variant: 'info' })
              }>
              <HugeiconsIcon icon={FilterHorizontalIcon} size={15} color={t.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Filter Chips */}
          <View style={styles.chipRow}>
            {FILTERS.map((f) => {
              const isActive = filter === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[
                    styles.chip,
                    { backgroundColor: t.cardBg, borderColor: t.cardBorder },
                    isActive && styles.chipActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setFilter(f.id)}>
                  <Text
                    style={[
                      styles.chipText,
                      { color: t.textSecondary },
                      isActive && styles.chipTextActive,
                    ]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Grouped Transactions */}
          {groups.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
                <HugeiconsIcon icon={Calendar03Icon} size={22} color={t.muted} />
              </View>
              <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No transactions found</Text>
              <Text style={[styles.emptySubtitle, { color: t.textSecondary }]}>Try a different search or filter</Text>
            </View>
          ) : (
            groups.map(([day, txs]) => (
              <View key={day} style={styles.daySection}>
                <Text style={[styles.dayLabel, { color: t.textSecondary }]}>{day}</Text>
                {txs.map((tx) => (
                  <TouchableOpacity
                    key={tx.id}
                    style={[styles.txRow, { borderBottomColor: t.cardBorder }]}
                    activeOpacity={0.6}
                    onPress={() => setSelectedTx(tx)}>
                    <View
                      style={[
                        styles.txIconWrap,
                        { backgroundColor: tx.type === 'sent' ? t.dangerTint : t.successTint },
                      ]}>
                      <HugeiconsIcon icon={tx.icon} size={18} color={tx.iconColor} />
                    </View>

                    <View style={styles.txInfo}>
                      <Text style={[styles.txTitle, { color: t.textPrimary }]}>{tx.title}</Text>
                      <Text style={[styles.txMeta, { color: t.textSecondary }]}>
                        {tx.category} · {tx.date}
                      </Text>
                    </View>

                    <View style={styles.txRight}>
                      <Text style={[styles.txAmount, { color: tx.amountColor }]}>
                        {tx.amount}
                      </Text>
                      <Text
                        style={[
                          styles.txStatus,
                          tx.status === 'Pending' ? styles.txStatusPending : styles.txStatusDone,
                        ]}>
                        {tx.status}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Transaction Detail Modal */}
      <Modal
        visible={selectedTx !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTx(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setSelectedTx(null)} />
          {selectedTx && (
            <View style={[styles.sheet, { backgroundColor: t.cardBg }]}>
              <View style={[styles.sheetHandle, { backgroundColor: t.cardBorder }]} />

              <View style={styles.sheetHeader}>
                <View style={[styles.sheetIconWrap, { backgroundColor: t.pageBg }]}>
                  <HugeiconsIcon
                    icon={selectedTx.icon}
                    size={22}
                    color={selectedTx.iconColor}
                  />
                </View>
                <View style={styles.sheetHeaderText}>
                  <Text style={[styles.sheetName, { color: t.textPrimary }]}>{selectedTx.title}</Text>
                  <Text style={[styles.sheetCategory, { color: t.textSecondary }]}>{selectedTx.channel}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.sheetClose, { backgroundColor: t.pageBg }]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedTx(null)}>
                  <HugeiconsIcon icon={Cancel01Icon} size={16} color={t.iconColor} />
                </TouchableOpacity>
              </View>

              <Text
                style={[
                  styles.sheetAmount,
                  { color: selectedTx.amountColor },
                ]}>
                {selectedTx.amount}
              </Text>

              <View style={[styles.sheetDetails, { backgroundColor: t.inputBg, borderColor: t.cardBorder }]}>
                <View style={[styles.sheetDetailRow, { borderBottomColor: t.cardBorder }]}>
                  <Text style={[styles.sheetDetailLabel, { color: t.textSecondary }]}>Status</Text>
                  <View style={styles.sheetStatusWrap}>
                    <View
                      style={[
                        styles.sheetStatusDot,
                        {
                          backgroundColor:
                            selectedTx.status === 'Pending' ? '#F59E0B' : '#16A34A',
                        },
                      ]}
                    />
                    <Text style={[styles.sheetDetailValue, { color: t.textPrimary }]}>{selectedTx.status}</Text>
                  </View>
                </View>
                <View style={[styles.sheetDetailRow, { borderBottomColor: t.cardBorder }]}>
                  <Text style={[styles.sheetDetailLabel, { color: t.textSecondary }]}>Date</Text>
                  <Text style={[styles.sheetDetailValue, { color: t.textPrimary }]}>{selectedTx.date}</Text>
                </View>
                <View style={[styles.sheetDetailRow, { borderBottomColor: t.cardBorder }]}>
                  <Text style={[styles.sheetDetailLabel, { color: t.textSecondary }]}>Channel</Text>
                  <Text style={[styles.sheetDetailValue, { color: t.textPrimary }]}>{selectedTx.channel}</Text>
                </View>
                <View style={[styles.sheetDetailRow, styles.sheetDetailRowLast]}>
                  <Text style={[styles.sheetDetailLabel, { color: t.textSecondary }]}>Reference</Text>
                  <Text style={[styles.sheetDetailValue, { color: t.textPrimary }]}>{selectedTx.reference}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.sheetButton}
                activeOpacity={0.8}
                onPress={() => {
                  show({
                    message: `Receipt for ${selectedTx.reference} sent to your email`,
                    variant: 'success',
                  });
                  setSelectedTx(null);
                }}>
                <HugeiconsIcon icon={Tick02Icon} size={15} color="#FFFFFF" />
                <Text style={styles.sheetButtonText}>Get Receipt</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EEF3FC',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: '#EEF3FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0A2045',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        shadowColor: '#0A2045',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
    }),
  },
  headerTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 17,
    color: '#0A1E3C',
    letterSpacing: -0.4,
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  summaryCard: {
    borderRadius: 22,
    overflow: 'hidden',
    paddingVertical: 18,
    paddingHorizontal: 18,
    ...Platform.select({
      ios: { shadowColor: '#0A1240', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16 },
      android: { elevation: 5 },
      web: { shadowColor: '#0A1240', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16 },
    }),
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryLabel: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  summaryValue: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  summaryDivider: {
    width: 1,
    height: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Montserrat_500Medium',
    fontSize: 12,
    color: '#0A1E3C',
    paddingVertical: 0,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
  },
  chipActive: {
    backgroundColor: '#2E45F4',
    borderColor: '#2E45F4',
  },
  chipText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 11,
    color: '#4A5E78',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  daySection: {
    marginTop: 16,
  },
  dayLabel: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 11,
    color: '#5A6F8A',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(203, 213, 225, 0.45)',
  },
  txIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
    color: '#0A1E3C',
  },
  txMeta: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  txAmount: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
  },
  txStatus: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 10,
  },
  txStatusDone: {
    color: '#16A34A',
  },
  txStatusPending: {
    color: '#F59E0B',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 48,
    gap: 4,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
    color: '#0A1E3C',
  },
  emptySubtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11,
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 30, 60, 0.45)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EEF3FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHeaderText: {
    flex: 1,
  },
  sheetName: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 15,
    color: '#0A1E3C',
  },
  sheetCategory: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  sheetClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetAmount: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 28,
    letterSpacing: -1,
    marginTop: 16,
  },
  sheetDetails: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
    paddingHorizontal: 14,
  },
  sheetDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.7)',
  },
  sheetDetailRowLast: {
    borderBottomWidth: 0,
  },
  sheetDetailLabel: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11,
    color: '#64748B',
  },
  sheetDetailValue: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 11,
    color: '#0A1E3C',
  },
  sheetStatusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sheetStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sheetButton: {
    marginTop: 16,
    backgroundColor: '#2E45F4',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Platform.select({
      ios: { shadowColor: '#2E45F4', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.25, shadowRadius: 9 },
      android: { elevation: 3 },
      web: { shadowColor: '#2E45F4', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.25, shadowRadius: 9 },
    }),
  },
  sheetButtonText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
});
