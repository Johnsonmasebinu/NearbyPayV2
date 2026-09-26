import {
  ArrowLeft01Icon,
  Calendar03Icon,
  Cancel01Icon,
  Clock01Icon,
  Download01Icon,
  FilterHorizontalIcon,
  Search01Icon,
  Share01Icon,
  Tick02Icon,
  UserIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
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
import { useTransactions } from '@/hooks/use-transactions';
import { formatTransactionDate } from '@/lib/welcome-transaction';
import { captureRef } from 'react-native-view-shot';
import { SafeAreaView } from 'react-native-safe-area-context';

type TxType = 'sent' | 'received';

type HistoryTx = {
  id: string;
  title: string;
  category: string;
  description: string;
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

type FilterKey = 'all' | 'sent' | 'received';

const FILTERS: { id: FilterKey; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'sent', label: 'Sent' },
  { id: 'received', label: 'Received' },
];

export default function TransactionHistoryScreen({
  onBack,
  initialTransactionId,
}: {
  onBack: () => void;
  initialTransactionId?: string;
}) {
  const { show } = useToast();
  const { transactions } = useTransactions();
  const { isDark } = useAppTheme();
  const t = getAppTheme(isDark);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTx, setSelectedTx] = useState<HistoryTx | null>(null);
  const [isSavingReceipt, setIsSavingReceipt] = useState(false);
  const [isSharingReceipt, setIsSharingReceipt] = useState(false);
  const receiptArtworkRef = useRef<View>(null);
  const historyTransactions = useMemo<HistoryTx[]>(
    () =>
      transactions.map((transaction) => ({
        id: transaction.id,
        title: transaction.title,
        category: transaction.category,
        description: transaction.description || transaction.channel || transaction.title,
        date: formatTransactionDate(transaction.created_at),
        dayGroup: new Date(transaction.created_at).toDateString() === new Date().toDateString() ? 'Today' : new Date(transaction.created_at).toLocaleDateString(),
        amount: `${transaction.type === 'received' ? '+' : '-'} ₦${transaction.amount.toLocaleString('en-NG')}`,
        numeric: transaction.amount,
        type: transaction.type,
        icon: transaction.type === 'received' ? Download01Icon : UserIcon,
        iconColor: transaction.type === 'received' ? '#16A34A' : '#EF4444',
        amountColor: transaction.type === 'received' ? '#16A34A' : '#EF4444',
        status: transaction.status,
        reference: transaction.reference,
        channel: transaction.channel,
      })),
    [transactions],
  );

  useEffect(() => {
    if (!initialTransactionId) return;
    const transaction = historyTransactions.find((tx) => tx.id === initialTransactionId);
    if (transaction && selectedTx?.id !== transaction.id) {
      const timer = setTimeout(() => setSelectedTx(transaction), 0);
      return () => clearTimeout(timer);
    }
  }, [historyTransactions, initialTransactionId, selectedTx]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return historyTransactions.filter((tx) => {
      const matchesFilter = filter === 'all' || tx.type === filter;
      const matchesQuery =
        q.length === 0 ||
        tx.title.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        tx.description.toLowerCase().includes(q);
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

  const handleDownloadReceipt = async () => {
    if (!selectedTx || isSavingReceipt) return;
    setIsSavingReceipt(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const uri = await captureRef(receiptArtworkRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri);
        show({ message: 'Receipt image saved to your gallery!', variant: 'success' });
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Save NearbyPay Receipt',
        });
      } else {
        show({ message: 'Gallery permission required to save receipts.', variant: 'error' });
      }
    } catch (error) {
      show({
        message: error instanceof Error ? error.message : 'Could not create receipt image.',
        variant: 'error',
      });
    } finally {
      setIsSavingReceipt(false);
    }
  };

  const handleShareReceipt = async () => {
    if (!selectedTx || isSharingReceipt) return;
    setIsSharingReceipt(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const uri = await captureRef(receiptArtworkRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share NearbyPay Receipt',
        });
      } else {
        show({ message: 'Sharing not supported on this device.', variant: 'error' });
      }
    } catch (error) {
      show({
        message: error instanceof Error ? error.message : 'Could not share receipt image.',
        variant: 'error',
      });
    } finally {
      setIsSharingReceipt(false);
    }
  };

  // Status bar style is owned by (tabs)/_layout.tsx.
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.pageBg }]} edges={['top']}>

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
              tintColor="#FFFFFF"
              colors={['#FFFFFF']}
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

              <View style={styles.sheetTopRow}>
                <Text style={[styles.sheetTopTitle, { color: t.textPrimary }]}>Transaction Receipt</Text>
                <TouchableOpacity
                  style={[styles.sheetClose, { backgroundColor: t.pageBg }]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedTx(null)}>
                  <HugeiconsIcon icon={Cancel01Icon} size={16} color={t.iconColor} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.receiptScrollArea}>
                {/* Captured into the receipt PNG (collapsable={false} is required
                    on Android or the capture comes out blank) */}
                <View
                  ref={receiptArtworkRef}
                  collapsable={false}
                  style={[
                    styles.receiptCard,
                    {
                      backgroundColor: isDark ? '#0D1527' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}>
                  {/* Brand & Logo Header */}
                  <View style={styles.receiptHeader}>
                    <Image
                      source={require('@/assets/images/logo/logo.png')}
                      style={styles.receiptLogo}
                      contentFit="contain"
                    />
                    <Text style={[styles.receiptBrand, { color: t.brand }]}>NearbyPay</Text>
                    <View style={[styles.receiptPill, { backgroundColor: t.brandTint }]}>
                      <Text style={[styles.receiptType, { color: t.brand }]}>OFFICIAL PAYMENT RECEIPT</Text>
                    </View>
                  </View>

                  {/* Amount & Status Badge */}
                  <View style={styles.receiptAmountBox}>
                    <Text style={[styles.receiptAmountLabel, { color: t.textSecondary }]}>Amount Transferred</Text>
                    <Text style={[styles.receiptAmount, { color: selectedTx.amountColor }]}>
                      {selectedTx.amount}
                    </Text>
                    <View
                      style={[
                        styles.receiptStatusBadge,
                        {
                          backgroundColor:
                            selectedTx.status === 'Completed'
                              ? isDark ? 'rgba(34, 197, 94, 0.16)' : '#DCFCE7'
                              : isDark ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7',
                        },
                      ]}>
                      <HugeiconsIcon
                        icon={selectedTx.status === 'Completed' ? Tick02Icon : Clock01Icon}
                        size={12}
                        color={selectedTx.status === 'Completed' ? '#16A34A' : '#D97706'}
                      />
                      <Text
                        style={[
                          styles.receiptStatusText,
                          { color: selectedTx.status === 'Completed' ? '#16A34A' : '#D97706' },
                        ]}>
                        Payment {selectedTx.status}
                      </Text>
                    </View>
                  </View>

                  {/* Receipt Details Breakdown */}
                  <View
                    style={[
                      styles.sheetDetails,
                      {
                        backgroundColor: isDark ? '#131D33' : '#F8FAFC',
                        borderColor: isDark ? '#1E293B' : '#E2E8F0',
                      },
                    ]}>
                    <View style={[styles.sheetDetailRow, { borderBottomColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
                      <Text style={[styles.sheetDetailLabel, { color: t.textSecondary }]}>Transaction Type</Text>
                      <Text style={[styles.sheetDetailValue, { color: t.textPrimary }]}>
                        {selectedTx.type === 'received' ? 'Money In (Credit)' : 'Money Out (Debit)'}
                      </Text>
                    </View>

                    <View style={[styles.sheetDetailRow, { borderBottomColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
                      <Text style={[styles.sheetDetailLabel, { color: t.textSecondary }]}>Title</Text>
                      <Text
                        style={[styles.sheetDetailValue, { color: t.textPrimary, flex: 1, textAlign: 'right' }]}
                        numberOfLines={2}>
                        {selectedTx.title}
                      </Text>
                    </View>

                    <View style={[styles.sheetDetailRow, { borderBottomColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
                      <Text style={[styles.sheetDetailLabel, { color: t.textSecondary }]}>Description</Text>
                      <Text
                        style={[styles.sheetDetailValue, { color: t.textPrimary, flex: 1, textAlign: 'right' }]}
                        numberOfLines={2}>
                        {selectedTx.description || selectedTx.title}
                      </Text>
                    </View>

                    <View style={[styles.sheetDetailRow, { borderBottomColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
                      <Text style={[styles.sheetDetailLabel, { color: t.textSecondary }]}>Payment Channel</Text>
                      <Text style={[styles.sheetDetailValue, { color: t.textPrimary }]}>{selectedTx.channel}</Text>
                    </View>

                    <View style={[styles.sheetDetailRow, { borderBottomColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
                      <Text style={[styles.sheetDetailLabel, { color: t.textSecondary }]}>Date & Time</Text>
                      <Text style={[styles.sheetDetailValue, { color: t.textPrimary }]}>{selectedTx.date}</Text>
                    </View>

                    <View style={[styles.sheetDetailRow, styles.sheetDetailRowLast]}>
                      <Text style={[styles.sheetDetailLabel, { color: t.textSecondary }]}>Reference No.</Text>
                      <Text
                        style={[
                          styles.sheetDetailValue,
                          { color: t.textPrimary, fontFamily: 'Montserrat_700Bold', fontSize: 10.5 },
                        ]}>
                        {selectedTx.reference}
                      </Text>
                    </View>
                  </View>

                  {/* Security Footer Seal */}
                  <View style={styles.receiptSecurityFooter}>
                    <HugeiconsIcon icon={Tick02Icon} size={11} color={t.muted} />
                    <Text style={[styles.receiptSecurityText, { color: t.muted }]}>
                      Verified by NearbyPay • Instant Settlement
                    </Text>
                  </View>
                </View>

                {/* Action Buttons: Download Receipt & Share Receipt */}
                <View style={styles.receiptActionsRow}>
                  <TouchableOpacity
                    style={[styles.receiptActionButton, styles.downloadButton, isSavingReceipt && { opacity: 0.7 }]}
                    activeOpacity={0.8}
                    disabled={isSavingReceipt}
                    onPress={handleDownloadReceipt}>
                    {isSavingReceipt ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <HugeiconsIcon icon={Download01Icon} size={16} color="#FFFFFF" />
                        <Text style={styles.receiptActionText}>Download Image</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.receiptActionButton,
                      { backgroundColor: t.cardBg, borderColor: t.cardBorder, borderWidth: 1 },
                      isSharingReceipt && { opacity: 0.7 },
                    ]}
                    activeOpacity={0.8}
                    disabled={isSharingReceipt}
                    onPress={handleShareReceipt}>
                    {isSharingReceipt ? (
                      <ActivityIndicator size="small" color={t.textPrimary} />
                    ) : (
                      <>
                        <HugeiconsIcon icon={Share01Icon} size={16} color={t.textPrimary} />
                        <Text style={[styles.receiptActionText, { color: t.textPrimary }]}>Share</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    maxHeight: '92%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 10,
  },
  sheetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  sheetTopTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
  },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptScrollArea: {
    paddingBottom: 16,
  },
  receiptCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#1E2B6B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 14 },
      android: { elevation: 3 },
      web: { shadowColor: '#1E2B6B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 14 },
    }),
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 14,
  },
  receiptLogo: {
    width: 44,
    height: 44,
    marginBottom: 6,
  },
  receiptBrand: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 19,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  receiptPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  receiptType: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 9.5,
    textAlign: 'center',
    letterSpacing: 1.2,
  },
  receiptAmountBox: {
    alignItems: 'center',
    marginBottom: 16,
  },
  receiptAmountLabel: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11,
    marginBottom: 4,
  },
  receiptAmount: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 30,
    letterSpacing: -1,
  },
  receiptStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  receiptStatusText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 11,
  },
  sheetDetails: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  sheetDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  sheetDetailRowLast: {
    borderBottomWidth: 0,
  },
  sheetDetailLabel: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11,
  },
  sheetDetailValue: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 11,
  },
  receiptSecurityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  receiptSecurityText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 10,
  },
  receiptActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  receiptActionButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  downloadButton: {
    backgroundColor: '#2E45F4',
    ...Platform.select({
      ios: { shadowColor: '#2E45F4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8 },
      android: { elevation: 3 },
      web: { shadowColor: '#2E45F4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8 },
    }),
  },
  receiptActionText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12.5,
    color: '#FFFFFF',
  },
});
