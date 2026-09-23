import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Building01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  QrCodeIcon,
  Search01Icon,
  Share08Icon,
  ShieldCheckIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
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
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { PinSheet } from '@/components/ui/pin-sheet';
import { useToast } from '@/components/ui/toast';
import { getAppTheme, GRADIENT_STOPS } from '@/constants/app-theme';
import { useAuth } from '@/hooks/auth-provider';
import { useAppTheme } from '@/hooks/theme-provider';
import { useTransactions } from '@/hooks/use-transactions';
import { supabase } from '@/lib/supabase';

type RecipientProfile = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
};

type TransferReceipt = {
  reference: string;
  amount: number;
  recipientName: string;
  recipientTag: string;
  recipientAvatar: string;
  channel: string;
  date: string;
  note: string;
};

const QUICK_AMOUNTS = [
  { label: '₦1,000', value: '1000' },
  { label: '₦2,000', value: '2000' },
  { label: '₦5,000', value: '5000' },
  { label: '₦10,000', value: '10000' },
];

export function SendScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { isDark } = useAppTheme();
  const t = getAppTheme(isDark);
  const { user, hasPin, verifyPin } = useAuth();
  const { balance, refresh } = useTransactions();

  const [tab, setTab] = useState<'nearby' | 'bank'>('nearby');
  const [recipientQuery, setRecipientQuery] = useState('');
  const [nearbyUsers, setNearbyUsers] = useState<RecipientProfile[]>([]);
  const [searchResults, setSearchResults] = useState<RecipientProfile[]>([]);
  const [selectedNearbyUser, setSelectedNearbyUser] = useState<RecipientProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [focused, setFocused] = useState<'search' | 'amount' | 'note' | null>(null);

  // Modals
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [receipt, setReceipt] = useState<TransferReceipt | null>(null);

  const numAmount = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;
  const hasAmount = numAmount > 0;
  const isOverBalance = numAmount > balance;

  // Load nearby/existing users on mount
  useEffect(() => {
    let isMounted = true;
    async function loadNearby() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && data && isMounted) {
          const others = data
            .filter((p) => p.id !== user?.id)
            .map((p) => ({
              id: p.id,
              name: p.full_name || 'NearbyPay User',
              username: (p.username || 'user').replace(/^[@$]/, ''),
              avatarUrl: p.avatar_url || 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_1.png',
            }));
          setNearbyUsers(others);
          setSelectedNearbyUser((prev) => prev || (others.length > 0 ? others[0] : null));
        }
      } catch {
        // ignore
      }
    }
    loadNearby();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleRecipientQueryChange = (text: string) => {
    setRecipientQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  // Live search for Cashtag / username
  useEffect(() => {
    const clean = recipientQuery.trim().toLowerCase().replace(/^[@$]/, '');
    if (!clean) return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .or(`username.ilike.%${clean}%,full_name.ilike.%${clean}%`)
          .limit(6);

        if (!error && data) {
          const filtered = data
            .filter((p) => p.id !== user?.id)
            .map((p) => ({
              id: p.id,
              name: p.full_name || 'NearbyPay User',
              username: (p.username || 'user').replace(/^[@$]/, ''),
              avatarUrl: p.avatar_url || 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_1.png',
            }));
          setSearchResults(filtered);
        }
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [recipientQuery, user?.id]);

  // Parse and apply QR Code
  const handleApplyQr = async (inputStr: string) => {
    const clean = inputStr.trim();
    if (!clean) {
      show({ message: 'Please enter a QR code or Cashtag', variant: 'error' });
      return;
    }

    // Extract Cashtag from various formats:
    // 1. nearbypay://pay?tag=johnsonmas81
    // 2. https://nearbypay.me/@johnsonmas81
    // 3. @johnsonmas81 or johnsonmas81
    let tag = '';
    const uriMatch = clean.match(/tag=([a-zA-Z0-9_]+)/i);
    const atMatch = clean.match(/@([a-zA-Z0-9_]+)/i);
    const pathMatch = clean.match(/(?:pay|receive)\/@?([a-zA-Z0-9_]+)/i);

    if (uriMatch) {
      tag = uriMatch[1];
    } else if (atMatch) {
      tag = atMatch[1];
    } else if (pathMatch) {
      tag = pathMatch[1];
    } else {
      tag = clean.replace(/^[@$]/, '');
    }

    tag = tag.toLowerCase().trim();

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .ilike('username', tag)
        .maybeSingle();

      if (error || !data) {
        show({ message: `No NearbyPay user found with Cashtag @${tag}`, variant: 'error' });
        return;
      }

      if (data.id === user?.id) {
        show({ message: 'That is your own Cashtag QR code!', variant: 'info' });
        return;
      }

      const foundUser: RecipientProfile = {
        id: data.id,
        name: data.full_name || 'NearbyPay User',
        username: (data.username || tag).replace(/^[@$]/, ''),
        avatarUrl: data.avatar_url || 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_1.png',
      };

      setSelectedNearbyUser(foundUser);
      setTab('nearby');
      setQrModalVisible(false);
      setQrInput('');
      setRecipientQuery('');
      show({ message: `Resolved @${foundUser.username} from QR!`, variant: 'success' });
    } catch {
      show({ message: 'Failed to look up user from QR', variant: 'error' });
    }
  };

  const formattedAmount = () => {
    if (!amount) return '0.00';
    return numAmount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSendPress = () => {
    if (numAmount <= 0) {
      show({ message: 'Please enter a valid amount', variant: 'error' });
      return;
    }

    if (isOverBalance) {
      show({
        message: `Insufficient balance. Available: ₦${balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        variant: 'error',
      });
      return;
    }

    if (tab === 'nearby') {
      if (!selectedNearbyUser) {
        show({ message: 'Please select a recipient by Cashtag', variant: 'error' });
        return;
      }
      setPinModalVisible(true);
    } else {
      if (!selectedBank) {
        show({ message: 'Please select a destination bank', variant: 'error' });
        return;
      }
      setPinModalVisible(true);
    }
  };

  const handleAuthorizePin = async (pin: string) => {
    if (tab === 'nearby' && selectedNearbyUser) {
      if (hasPin) {
        const isValid = await verifyPin(pin);
        if (!isValid) throw new Error('Incorrect transaction PIN. Please try again.');
      }

      const { data, error } = await supabase.rpc('transfer_by_tag', {
        p_recipient_tag: selectedNearbyUser.username,
        p_amount: numAmount,
        p_note: note.trim() || 'NearbyPay Cashtag',
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error || 'Transfer failed');

      await refresh();

      setReceipt({
        reference: data.reference,
        amount: numAmount,
        recipientName: selectedNearbyUser.name,
        recipientTag: selectedNearbyUser.username,
        recipientAvatar: selectedNearbyUser.avatarUrl,
        channel: 'NearbyPay Instant Transfer',
        date: new Date().toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        note: note.trim() || 'NearbyPay Cashtag',
      });
    } else {
      if (hasPin) {
        const isValid = await verifyPin(pin);
        if (!isValid) throw new Error('Incorrect transaction PIN. Please try again.');
      }
      const ref = 'NPP-BNK-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      await refresh();
      setReceipt({
        reference: ref,
        amount: numAmount,
        recipientName: recipientQuery || 'Bank Recipient',
        recipientTag: selectedBank || 'Access Bank',
        recipientAvatar: '',
        channel: `${selectedBank || 'Access Bank'} • Transfer`,
        date: new Date().toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        note: note.trim() || 'Bank Transfer',
      });
    }
  };

  const handleDoneReceipt = () => {
    setReceipt(null);
    setAmount('');
    setNote('');
    setRecipientQuery('');
    router.replace('/(tabs)/home');
  };

  const copyReceiptRef = async (ref: string) => {
    try {
      await Clipboard.setStringAsync(ref);
    } catch {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(ref);
      }
    }
    show({ message: 'Reference copied to clipboard!', variant: 'success' });
  };

  const shareReceipt = async () => {
    if (!receipt) return;
    try {
      await Share.share({
        message: `NearbyPay Transfer Receipt\nAmount: ₦${receipt.amount.toLocaleString('en-NG')}\nTo: ${receipt.recipientName} (@${receipt.recipientTag})\nRef: ${receipt.reference}\nStatus: Successful`,
        title: 'NearbyPay Receipt',
      });
    } catch {
      // ignore
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
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Send Money</Text>
        <TouchableOpacity
          style={[styles.headerBtn, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
          activeOpacity={0.7}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Scan QR code"
          onPress={() => setQrModalVisible(true)}>
          <HugeiconsIcon icon={QrCodeIcon} size={18} color={t.brand} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Mode Toggle Switcher */}
        <View style={[styles.tabSegmentContainer, { backgroundColor: t.chipBg }]}>
          <TouchableOpacity
            style={[styles.tabSegment, tab === 'nearby' && styles.tabSegmentActive]}
            activeOpacity={0.85}
            onPress={() => setTab('nearby')}>
            <Text
              style={[
                styles.tabSegmentText,
                tab === 'nearby' ? styles.tabSegmentTextActive : { color: t.textSecondary },
              ]}>
              To Nearby Tag
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabSegment, tab === 'bank' && styles.tabSegmentActive]}
            activeOpacity={0.85}
            onPress={() => setTab('bank')}>
            <Text
              style={[
                styles.tabSegmentText,
                tab === 'bank' ? styles.tabSegmentTextActive : { color: t.textSecondary },
              ]}>
              To Bank
            </Text>
          </TouchableOpacity>
        </View>

        {tab === 'nearby' ? (
          <>
            {/* Cashtag Recipient Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionLabel, { color: t.textPrimary, marginTop: 0 }]}>
                Recipient Cashtag
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.qrScanPill}
                onPress={() => setQrModalVisible(true)}>
                <HugeiconsIcon icon={QrCodeIcon} size={14} color={t.brand} />
                <Text style={[styles.qrScanPillText, { color: t.brand }]}>Read QR</Text>
              </TouchableOpacity>
            </View>

            {/* Selected Recipient Card */}
            {selectedNearbyUser && (
              <View
                style={[
                  styles.selectedUserCard,
                  { backgroundColor: t.cardBg, borderColor: t.brand },
                ]}>
                <Image
                  source={{ uri: selectedNearbyUser.avatarUrl }}
                  style={styles.selectedUserAvatar}
                  contentFit="cover"
                />
                <View style={styles.selectedUserInfo}>
                  <View style={styles.selectedUserNameRow}>
                    <Text style={[styles.selectedUserName, { color: t.textPrimary }]}>
                      {selectedNearbyUser.name}
                    </Text>
                    <View style={styles.verifiedTag}>
                      <HugeiconsIcon icon={Tick02Icon} size={9} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  </View>
                  <Text style={[styles.selectedUserTag, { color: t.brand }]}>
                    @{selectedNearbyUser.username}
                  </Text>
                </View>
                <View style={[styles.activeTagBadge, { backgroundColor: t.brandTint }]}>
                  <Text style={[styles.activeTagBadgeText, { color: t.brand }]}>Active</Text>
                </View>
              </View>
            )}

            {/* Search Bar for Cashtag */}
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: t.cardBg,
                  borderColor: focused === 'search' ? t.brand : t.cardBorder,
                },
              ]}>
              <HugeiconsIcon icon={Search01Icon} size={18} color={t.muted} />
              <TextInput
                style={[styles.searchInput, { color: t.textPrimary }]}
                placeholder="Search @cashtag or user name..."
                placeholderTextColor={t.muted}
                value={recipientQuery}
                onChangeText={handleRecipientQueryChange}
                returnKeyType="search"
                autoCapitalize="none"
                onFocus={() => setFocused('search')}
                onBlur={() => setFocused(null)}
                accessibilityLabel="Search Cashtag"
              />
              {isSearching ? (
                <ActivityIndicator size="small" color={t.brand} />
              ) : (
                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={8}
                  onPress={() => setQrModalVisible(true)}>
                  <HugeiconsIcon icon={QrCodeIcon} size={18} color={t.brand} />
                </TouchableOpacity>
              )}
            </View>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <View
                style={[
                  styles.resultsDropdown,
                  { backgroundColor: t.cardBg, borderColor: t.cardBorder },
                ]}>
                {searchResults.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.resultRow, { borderBottomColor: t.divider }]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedNearbyUser(item);
                      setRecipientQuery('');
                      setSearchResults([]);
                    }}>
                    <Image source={{ uri: item.avatarUrl }} style={styles.resultAvatar} />
                    <View style={styles.resultInfo}>
                      <Text style={[styles.resultName, { color: t.textPrimary }]}>{item.name}</Text>
                      <Text style={[styles.resultTag, { color: t.brand }]}>@{item.username}</Text>
                    </View>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} color={t.muted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Nearby/Recent People Carousel */}
            <Text style={[styles.subLabel, { color: t.textSecondary }]}>Nearby & Recent Users</Text>
            <View style={styles.recipientsRow}>
              {nearbyUsers.slice(0, 4).map((item) => {
                const isSelected = selectedNearbyUser?.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.recipientItem}
                    activeOpacity={0.8}
                    onPress={() => setSelectedNearbyUser(item)}>
                    <View
                      style={[
                        styles.avatarCircle,
                        isSelected && [styles.avatarSelected, { borderColor: t.brand }],
                      ]}>
                      <Image source={{ uri: item.avatarUrl }} style={styles.avatarImg} />
                    </View>
                    <Text
                      style={[
                        styles.recipientName,
                        { color: isSelected ? t.brand : t.textPrimary },
                      ]}
                      numberOfLines={1}>
                      @{item.username}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.recipientItem}
                activeOpacity={0.8}
                onPress={() => setQrModalVisible(true)}>
                <View style={[styles.avatarCircle, { backgroundColor: t.brandTint }]}>
                  <HugeiconsIcon icon={QrCodeIcon} size={22} color={t.brand} />
                </View>
                <Text style={[styles.recipientName, { color: t.brand }]}>Scan QR</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Bank Transfer Section */}
            <Text style={[styles.sectionLabel, { color: t.textPrimary }]}>Bank Account</Text>
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: t.cardBg,
                  borderColor: focused === 'search' ? t.brand : t.cardBorder,
                },
              ]}>
              <HugeiconsIcon icon={Search01Icon} size={18} color={t.muted} />
              <TextInput
                style={[styles.searchInput, { color: t.textPrimary }]}
                placeholder="Enter 10-digit account number"
                placeholderTextColor={t.muted}
                value={recipientQuery}
                keyboardType="numeric"
                maxLength={10}
                onChangeText={setRecipientQuery}
                onFocus={() => setFocused('search')}
                onBlur={() => setFocused(null)}
              />
            </View>

            <Text style={[styles.sectionLabel, { color: t.textPrimary }]}>Destination Bank</Text>
            <TouchableOpacity
              style={[styles.bankSelector, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
              onPress={() => {
                const nextBank = selectedBank ? null : 'Access Bank';
                setSelectedBank(nextBank);
                show({
                  message: nextBank ? 'Selected Access Bank' : 'Bank cleared',
                  variant: 'info',
                });
              }}>
              <View style={styles.bankLeft}>
                <View style={[styles.bankIconCircle, { backgroundColor: t.brandTint }]}>
                  <HugeiconsIcon icon={Building01Icon} size={18} color={t.brand} />
                </View>
                <Text style={[styles.bankText, { color: selectedBank ? t.textPrimary : t.muted }]}>
                  {selectedBank || 'Select Bank (e.g. Access Bank)'}
                </Text>
              </View>
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={t.muted} />
            </TouchableOpacity>
          </>
        )}

        {/* Amount Section */}
        <View style={styles.amountHeaderRow}>
          <Text style={[styles.sectionLabel, { color: t.textPrimary, marginTop: 0 }]}>Amount</Text>
          <View style={styles.balanceRightRow}>
            <Text style={[styles.availBalanceText, { color: t.textSecondary }]}>
              Bal: ₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <TouchableOpacity
              style={[styles.useMaxBtn, { backgroundColor: t.brandTint }]}
              activeOpacity={0.7}
              onPress={() => setAmount(Math.floor(balance).toString())}>
              <Text style={[styles.useMaxText, { color: t.brand }]}>MAX</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[
            styles.amountCard,
            {
              backgroundColor: t.cardBg,
              borderColor: isOverBalance ? '#EF4444' : focused === 'amount' ? t.brand : t.cardBorder,
            },
          ]}>
          <View style={styles.amountInputRow}>
            <Text style={[styles.nairaSymbol, { color: isOverBalance ? '#EF4444' : t.brand }]}>₦</Text>
            <TextInput
              style={[
                styles.amountInput,
                !hasAmount && styles.amountInputEmpty,
                { color: isOverBalance ? '#EF4444' : t.textPrimary },
              ]}
              value={amount}
              onChangeText={(val) => setAmount(val.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={t.muted}
              returnKeyType="done"
              selectTextOnFocus
              maxLength={10}
              onFocus={() => setFocused('amount')}
              onBlur={() => setFocused(null)}
              onSubmitEditing={() => Keyboard.dismiss()}
              accessibilityLabel="Transfer amount in naira"
            />
          </View>
          {isOverBalance && (
            <Text style={styles.amountErrorText}>
              Amount exceeds available balance of ₦{balance.toLocaleString('en-NG')}
            </Text>
          )}
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
                <Text
                  style={[
                    styles.quickChipText,
                    isSelected ? styles.quickChipTextActive : { color: t.textSecondary },
                  ]}>
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
            placeholder="e.g. Lunch money, Hackathon split"
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
        <View
          style={[
            styles.securityCard,
            { backgroundColor: t.brandTint, borderColor: t.brandTintStrong },
          ]}>
          <View style={[styles.securityIconCircle, { backgroundColor: t.brandTintStrong }]}>
            <HugeiconsIcon icon={ShieldCheckIcon} size={20} color={t.brand} />
          </View>
          <View style={styles.securityTextWrap}>
            <Text style={[styles.securityTitle, { color: t.textPrimary }]}>
              Instant &amp; Real-time Settlement
            </Text>
            <Text style={[styles.securitySub, { color: t.textSecondary }]}>
              {tab === 'nearby'
                ? 'Directly debited and credited to recipient Cashtag instantly.'
                : 'Protected with bank-grade encryption and PIN authorization.'}
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!hasAmount || isOverBalance) && styles.submitBtnDisabled,
          ]}
          activeOpacity={0.88}
          disabled={!hasAmount || isOverBalance}
          accessibilityRole="button"
          accessibilityLabel="Review and send transfer"
          onPress={handleSendPress}>
          <Svg style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="sendCtaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={GRADIENT_STOPS.from} />
                <Stop offset="100%" stopColor={GRADIENT_STOPS.to} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" rx={18} fill="url(#sendCtaGrad)" />
          </Svg>
          <Text style={styles.submitBtnText}>
            {hasAmount
              ? `Send ₦${formattedAmount()}`
              : 'Enter Amount to Send'}
          </Text>
          <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>

      {/* Transaction PIN Authorization Sheet */}
      <PinSheet
        visible={pinModalVisible}
        mode="authorize"
        amount={formattedAmount()}
        recipientName={
          tab === 'nearby'
            ? selectedNearbyUser ? `@${selectedNearbyUser.username}` : 'Recipient'
            : selectedBank || 'Bank'
        }
        onClose={() => setPinModalVisible(false)}
        onSuccess={() => setPinModalVisible(false)}
        onAuthorize={handleAuthorizePin}
      />

      {/* QR Code Scanner / Parser Modal */}
      <Modal visible={qrModalVisible} transparent animationType="slide" onRequestClose={() => setQrModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.backdropTouch}
            activeOpacity={1}
            onPress={() => setQrModalVisible(false)}
          />
          <View style={[styles.qrSheet, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
            <View style={[styles.sheetHandle, { backgroundColor: t.divider }]} />
            <View style={styles.qrSheetHeader}>
              <View style={[styles.qrHeaderIconWrap, { backgroundColor: t.brandTint }]}>
                <HugeiconsIcon icon={QrCodeIcon} size={22} color={t.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.qrSheetTitle, { color: t.textPrimary }]}>
                  Read Cashtag QR
                </Text>
                <Text style={[styles.qrSheetSubtitle, { color: t.textSecondary }]}>
                  Paste QR code link or tap a nearby user
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeIconBtn, { backgroundColor: t.chipBg }]}
                onPress={() => setQrModalVisible(false)}>
                <HugeiconsIcon icon={Cancel01Icon} size={16} color={t.textPrimary} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.qrInputBox,
                { backgroundColor: t.inputBg, borderColor: t.inputBorder },
              ]}>
              <TextInput
                style={[styles.qrTextInput, { color: t.textPrimary }]}
                placeholder="e.g. nearbypay://pay?tag=johnsonmas81 or @tag"
                placeholderTextColor={t.muted}
                value={qrInput}
                onChangeText={setQrInput}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.qrApplyBtn, { backgroundColor: t.brand }]}
                activeOpacity={0.85}
                onPress={() => handleApplyQr(qrInput)}>
                <Text style={styles.qrApplyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Discover Nearby Users */}
            <Text style={[styles.qrSheetSectionTitle, { color: t.textPrimary }]}>
              Discovered Nearby Users
            </Text>
            <View style={styles.discoveredList}>
              {nearbyUsers.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.discoveredItem,
                    { backgroundColor: t.chipBg, borderColor: t.cardBorder },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedNearbyUser(item);
                    setTab('nearby');
                    setQrModalVisible(false);
                    show({ message: `Selected @${item.username}`, variant: 'success' });
                  }}>
                  <Image source={{ uri: item.avatarUrl }} style={styles.discoveredAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.discoveredName, { color: t.textPrimary }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.discoveredTag, { color: t.brand }]}>
                      @{item.username}
                    </Text>
                  </View>
                  <View style={[styles.tagBadgeSmall, { backgroundColor: t.brandTint }]}>
                    <Text style={[styles.tagBadgeSmallText, { color: t.brand }]}>Select</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Live Transfer Receipt Modal */}
      <Modal visible={Boolean(receipt)} transparent animationType="fade">
        <View style={styles.receiptBackdrop}>
          <View style={[styles.receiptCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
            {/* Green glowing success badge */}
            <View style={styles.successIconCircle}>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={54} color="#16A34A" />
            </View>

            <Text style={[styles.receiptSuccessTitle, { color: t.textPrimary }]}>
              Transfer Successful!
            </Text>
            <Text style={[styles.receiptSuccessSub, { color: t.textSecondary }]}>
              Funds have been transferred instantly
            </Text>

            <Text style={[styles.receiptBigAmount, { color: t.textPrimary }]}>
              ₦{receipt?.amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>

            {/* Details Box */}
            <View style={[styles.receiptDetailsBox, { backgroundColor: t.chipBg, borderColor: t.cardBorder }]}>
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: t.textSecondary }]}>Recipient</Text>
                <View style={styles.receiptRecipientCol}>
                  <Text style={[styles.receiptValue, { color: t.textPrimary }]}>
                    {receipt?.recipientName}
                  </Text>
                  <Text style={[styles.receiptSubValue, { color: t.brand }]}>
                    @{receipt?.recipientTag}
                  </Text>
                </View>
              </View>

              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: t.textSecondary }]}>Reference</Text>
                <TouchableOpacity
                  style={styles.refRow}
                  activeOpacity={0.7}
                  onPress={() => receipt && copyReceiptRef(receipt.reference)}>
                  <Text style={[styles.receiptValue, { color: t.textPrimary, fontFamily: 'Montserrat_600SemiBold' }]}>
                    {receipt?.reference}
                  </Text>
                  <HugeiconsIcon icon={Copy01Icon} size={14} color={t.brand} />
                </TouchableOpacity>
              </View>

              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: t.textSecondary }]}>Channel</Text>
                <Text style={[styles.receiptValue, { color: t.textPrimary }]}>
                  {receipt?.channel}
                </Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: t.textSecondary }]}>Date &amp; Time</Text>
                <Text style={[styles.receiptValue, { color: t.textPrimary }]}>
                  {receipt?.date}
                </Text>
              </View>

              {receipt?.note && (
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: t.textSecondary }]}>Note</Text>
                  <Text style={[styles.receiptValue, { color: t.textPrimary }]}>
                    {receipt.note}
                  </Text>
                </View>
              )}
            </View>

            {/* Action buttons */}
            <View style={styles.receiptButtonsRow}>
              <TouchableOpacity
                style={[styles.receiptShareBtn, { backgroundColor: t.chipBg, borderColor: t.cardBorder }]}
                activeOpacity={0.8}
                onPress={shareReceipt}>
                <HugeiconsIcon icon={Share08Icon} size={16} color={t.textPrimary} />
                <Text style={[styles.receiptShareBtnText, { color: t.textPrimary }]}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.receiptDoneBtn, { backgroundColor: t.brand }]}
                activeOpacity={0.85}
                onPress={handleDoneReceipt}>
                <Text style={styles.receiptDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 18,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionLabel: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    letterSpacing: -0.2,
    marginTop: 16,
    marginBottom: 10,
  },
  qrScanPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  qrScanPillText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
  },
  selectedUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 12,
    gap: 12,
  },
  selectedUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#CBD5E1',
  },
  selectedUserInfo: {
    flex: 1,
  },
  selectedUserNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  selectedUserName: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
  },
  verifiedTag: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedUserTag: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
    marginTop: 2,
  },
  activeTagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  activeTagBadgeText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 11,
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
  resultsDropdown: {
    borderWidth: 1,
    borderRadius: 16,
    marginTop: 6,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  resultAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#CBD5E1',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
  },
  resultTag: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11.5,
    marginTop: 1,
  },
  subLabel: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11.5,
    marginTop: 14,
    marginBottom: 8,
  },
  recipientsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipientItem: {
    alignItems: 'center',
    gap: 6,
    maxWidth: 68,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarSelected: {
    borderWidth: 2.5,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  recipientName: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 11,
    textAlign: 'center',
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
  amountHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 10,
  },
  balanceRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availBalanceText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 12,
  },
  useMaxBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  useMaxText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 10.5,
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
  amountErrorText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11,
    color: '#EF4444',
    marginTop: 6,
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
    fontSize: 13.5,
  },
  securitySub: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
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
  // QR Sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  qrSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  qrSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  qrHeaderIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrSheetTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 17,
  },
  qrSheetSubtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  qrTextInput: {
    flex: 1,
    fontFamily: 'Montserrat_500Medium',
    fontSize: 13,
    paddingVertical: 8,
  },
  qrApplyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  qrApplyBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12.5,
  },
  qrSheetSectionTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
    marginTop: 20,
    marginBottom: 10,
  },
  discoveredList: {
    gap: 8,
  },
  discoveredItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  discoveredAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#CBD5E1',
  },
  discoveredName: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
  },
  discoveredTag: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11.5,
    marginTop: 1,
  },
  tagBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  tagBadgeSmallText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 11,
  },
  // Receipt Modal
  receiptBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  receiptCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  receiptSuccessTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
    letterSpacing: -0.4,
  },
  receiptSuccessSub: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  receiptBigAmount: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 32,
    letterSpacing: -1,
    marginTop: 16,
    marginBottom: 18,
  },
  receiptDetailsBox: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginBottom: 20,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 12,
  },
  receiptRecipientCol: {
    alignItems: 'flex-end',
  },
  receiptValue: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12.5,
  },
  receiptSubValue: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11,
    marginTop: 1,
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiptButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  receiptShareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
  },
  receiptShareBtnText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
  },
  receiptDoneBtn: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
  },
  receiptDoneBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
  },
});
