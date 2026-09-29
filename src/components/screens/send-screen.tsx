import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  BluetoothIcon,
  Building01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  QrCodeIcon,
  Search01Icon,
  Share08Icon,
  ShieldCheckIcon,
  Tick02Icon,
} from '@/lib/icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import * as Clipboard from 'expo-clipboard';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { captureRef } from 'react-native-view-shot';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
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
import { select, succeed, tap, thud } from '@/lib/haptics';
import { useAppTheme } from '@/hooks/theme-provider';
import { useTransactions } from '@/hooks/use-transactions';
import { useNearbyBluetooth } from '@/hooks/use-nearby-bluetooth';
import { parseReceiveQrPayload } from '@/lib/receive-qr';
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
  const nearbyBluetooth = useNearbyBluetooth();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

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
  const [bleModalVisible, setBleModalVisible] = useState(false);
  const [contactlessCodeModalVisible, setContactlessCodeModalVisible] = useState(false);
  const [contactlessCode, setContactlessCode] = useState('');
  const [contactlessCodeError, setContactlessCodeError] = useState('');
  const [qrInput, setQrInput] = useState('');
  const hasScannedQr = useRef(false);
  const [receipt, setReceipt] = useState<TransferReceipt | null>(null);
  const receiptArtworkRef = useRef<View>(null);

  const numAmount = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;
  const hasAmount = numAmount > 0;
  const isOverBalance = numAmount > balance;

  const openQrScanner = () => {
    hasScannedQr.current = false;
    setQrModalVisible(true);
  };

  const openBluetoothScanner = async () => {
    setBleModalVisible(true);
    try {
      await nearbyBluetooth.scanForReceivers();
    } catch (error) {
      setBleModalVisible(false);
      show({
        message: error instanceof Error ? error.message : 'Could not scan for nearby receivers.',
        variant: 'error',
      });
    }
  };

  const closeBluetoothScanner = () => {
    setBleModalVisible(false);
    void nearbyBluetooth.stopReceiverScan().catch(() => undefined);
  };

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

    let tag: string;
    try {
      tag = await parseReceiveQrPayload(clean);
    } catch (error) {
      hasScannedQr.current = false;
      show({
        message: error instanceof Error ? error.message : 'This payment QR is invalid.',
        variant: 'error',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .ilike('username', tag)
        .maybeSingle();

      if (error) {
        hasScannedQr.current = false;
        show({ message: 'Connect to the internet to resolve this payment QR.', variant: 'error' });
        return;
      }
      if (!data) {
        hasScannedQr.current = false;
        show({ message: `No NearbyPay user found with Cashtag @${tag}`, variant: 'error' });
        return;
      }

      if (data.id === user?.id) {
        hasScannedQr.current = false;
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
      setContactlessCode('');
      setContactlessCodeError('');
      setTab('nearby');
      setQrModalVisible(false);
      setContactlessCodeModalVisible(true);
      setQrInput('');
      setRecipientQuery('');
      show({ message: `Resolved @${foundUser.username} from QR!`, variant: 'success' });
    } catch {
      hasScannedQr.current = false;
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
      if (!/^\d{8}$/.test(contactlessCode)) {
        setContactlessCodeModalVisible(true);
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
        p_contactless_code: contactlessCode,
        p_note: note.trim() || 'NearbyPay Cashtag',
      });

      if (error) throw new Error(error.message);
      if (!data.success) {
        const transferError = data.error || 'Transfer failed';
        if (/contactless code/i.test(transferError)) {
          setContactlessCode('');
          setContactlessCodeError(transferError);
          setContactlessCodeModalVisible(true);
          return;
        }
        throw new Error(transferError);
      }

      await refresh();
      setContactlessCode('');

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
      succeed();
    } else {
      if (hasPin) {
        const isValid = await verifyPin(pin);
        if (!isValid) throw new Error('Incorrect transaction PIN. Please try again.');
      }
      const { data, error } = await supabase.rpc('record_bank_transfer', {
        p_account_number: recipientQuery,
        p_bank_name: selectedBank || 'Bank Transfer',
        p_amount: numAmount,
        p_note: note.trim() || null,
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error || 'Bank transfer failed');

      await refresh();
      setReceipt({
        reference: data.reference,
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
      succeed();
    }
  };

  const handleDoneReceipt = () => {
    setReceipt(null);
    setContactlessCode('');
    setAmount('');
    setNote('');
    setRecipientQuery('');
    router.replace('/(tabs)/home');
  };

  const copyReceiptRef = async (ref: string) => {
    tap();
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
      if (!(await Sharing.isAvailableAsync())) {
        show({ message: 'Image sharing is not available on this device.', variant: 'error' });
        return;
      }

      const capturedUri = await captureRef(receiptArtworkRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      const savedReceipt = new File(
        Paths.document,
        `NearbyPay-Receipt-${receipt.reference}.png`,
      );
      if (savedReceipt.exists) {
        savedReceipt.delete();
      }
      await new File(capturedUri).copy(savedReceipt);

      await Sharing.shareAsync(savedReceipt.uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share NearbyPay receipt',
        UTI: 'public.png',
      });
    } catch (error) {
      show({
        message: error instanceof Error ? error.message : 'Could not create receipt image.',
        variant: 'error',
      });
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
        <Text maxFontSizeMultiplier={1.3} style={[styles.headerTitle, { color: t.textPrimary }]}>Send Money</Text>
        <TouchableOpacity
          style={[styles.headerBtn, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
          activeOpacity={0.7}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Scan QR code"
          onPress={openQrScanner}>
          <HugeiconsIcon icon={QrCodeIcon} size={18} color={t.brand} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Mode Toggle Switcher */}
        <View style={[styles.tabSegmentContainer, { backgroundColor: t.chipBg }]}>
          <TouchableOpacity
            style={[styles.tabSegment, tab === 'nearby' && styles.tabSegmentActive]}
            activeOpacity={0.85}
            onPress={() => {
              select();
              setTab('nearby');
            }}>
            <Text maxFontSizeMultiplier={1.3}
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
            onPress={() => {
              select();
              setTab('bank');
            }}>
            <Text maxFontSizeMultiplier={1.3}
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
              <Text maxFontSizeMultiplier={1.3} style={[styles.sectionLabel, { color: t.textPrimary, marginTop: 0 }]}>
                Recipient Cashtag
              </Text>
              <View style={styles.scanActions}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.qrScanPill}
                  onPress={openQrScanner}>
                  <HugeiconsIcon icon={QrCodeIcon} size={14} color={t.brand} />
                  <Text maxFontSizeMultiplier={1.3} style={[styles.qrScanPillText, { color: t.brand }]}>Read QR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.qrScanPill}
                  onPress={() => void openBluetoothScanner()}>
                  <HugeiconsIcon icon={BluetoothIcon} size={14} color={t.brand} />
                  <Text maxFontSizeMultiplier={1.3} style={[styles.qrScanPillText, { color: t.brand }]}>Bluetooth</Text>
                </TouchableOpacity>
              </View>
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
                  cachePolicy="memory-disk"
                  transition={0}
                  recyclingKey={selectedNearbyUser.id}
                />
                <View style={styles.selectedUserInfo}>
                  <View style={styles.selectedUserNameRow}>
                    <Text maxFontSizeMultiplier={1.3} style={[styles.selectedUserName, { color: t.textPrimary }]}>
                      {selectedNearbyUser.name}
                    </Text>
                    <View style={styles.verifiedTag}>
                      <HugeiconsIcon icon={Tick02Icon} size={9} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  </View>
                  <Text maxFontSizeMultiplier={1.3} style={[styles.selectedUserTag, { color: t.brand }]}>
                    @{selectedNearbyUser.username}
                  </Text>
                </View>
                <View style={[styles.activeTagBadge, { backgroundColor: t.brandTint }]}>
                  <Text maxFontSizeMultiplier={1.3} style={[styles.activeTagBadgeText, { color: t.brand }]}>Active</Text>
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
              <TextInput maxFontSizeMultiplier={1.3}
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
                  onPress={openQrScanner}>
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
                      setContactlessCode('');
                      setRecipientQuery('');
                      setSearchResults([]);
                    }}>
                    <Image
                      source={{ uri: item.avatarUrl }}
                      style={styles.resultAvatar}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={0}
                      recyclingKey={item.id}
                    />
                    <View style={styles.resultInfo}>
                      <Text maxFontSizeMultiplier={1.3} style={[styles.resultName, { color: t.textPrimary }]}>{item.name}</Text>
                      <Text maxFontSizeMultiplier={1.3} style={[styles.resultTag, { color: t.brand }]}>@{item.username}</Text>
                    </View>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} color={t.muted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Nearby/Recent People Carousel */}
            <Text maxFontSizeMultiplier={1.3} style={[styles.subLabel, { color: t.textSecondary }]}>Nearby & Recent Users</Text>
            <View style={styles.recipientsRow}>
              {nearbyUsers.slice(0, 4).map((item) => {
                const isSelected = selectedNearbyUser?.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.recipientItem}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedNearbyUser(item);
                      setContactlessCode('');
                    }}>
                    <View
                      style={[
                        styles.avatarCircle,
                        { borderColor: isSelected ? t.brand : 'transparent' },
                      ]}>
                      <Image
                        source={{ uri: item.avatarUrl }}
                        style={styles.avatarImg}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={0}
                        recyclingKey={item.id}
                      />
                    </View>
                    <Text maxFontSizeMultiplier={1.3}
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
                onPress={openQrScanner}>
                <View style={[styles.avatarCircle, { backgroundColor: t.brandTint }]}>
                  <HugeiconsIcon icon={QrCodeIcon} size={22} color={t.brand} />
                </View>
                <Text maxFontSizeMultiplier={1.3} style={[styles.recipientName, { color: t.brand }]}>Scan QR</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Bank Transfer Section */}
            <Text maxFontSizeMultiplier={1.3} style={[styles.sectionLabel, { color: t.textPrimary }]}>Bank Account</Text>
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: t.cardBg,
                  borderColor: focused === 'search' ? t.brand : t.cardBorder,
                },
              ]}>
              <HugeiconsIcon icon={Search01Icon} size={18} color={t.muted} />
              <TextInput maxFontSizeMultiplier={1.3}
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

            <Text maxFontSizeMultiplier={1.3} style={[styles.sectionLabel, { color: t.textPrimary }]}>Destination Bank</Text>
            <TouchableOpacity
              style={[styles.bankSelector, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
              onPress={() => {
                tap();
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
                <Text maxFontSizeMultiplier={1.3} style={[styles.bankText, { color: selectedBank ? t.textPrimary : t.muted }]}>
                  {selectedBank || 'Select Bank (e.g. Access Bank)'}
                </Text>
              </View>
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={t.muted} />
            </TouchableOpacity>
          </>
        )}

        {/* Amount Section */}
        <View style={styles.amountHeaderRow}>
          <Text maxFontSizeMultiplier={1.3} style={[styles.sectionLabel, { color: t.textPrimary, marginTop: 0 }]}>Amount</Text>
          <View style={styles.balanceRightRow}>
            <Text maxFontSizeMultiplier={1.3} style={[styles.availBalanceText, { color: t.textSecondary }]}>
              Bal: ₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <TouchableOpacity
              style={[styles.useMaxBtn, { backgroundColor: t.brandTint }]}
              activeOpacity={0.7}
              onPress={() => setAmount(Math.floor(balance).toString())}>
              <Text maxFontSizeMultiplier={1.3} style={[styles.useMaxText, { color: t.brand }]}>MAX</Text>
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
            <Text maxFontSizeMultiplier={1.3} style={[styles.nairaSymbol, { color: isOverBalance ? '#EF4444' : t.brand }]}>₦</Text>
            <TextInput maxFontSizeMultiplier={1.3}
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
            <Text maxFontSizeMultiplier={1.3} style={styles.amountErrorText}>
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
                onPress={() => {
                  tap();
                  setAmount(item.value);
                }}>
                <Text maxFontSizeMultiplier={1.3}
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
          <Text maxFontSizeMultiplier={1.3} style={[styles.sectionLabel, { color: t.textPrimary, marginTop: 0 }]}>Add a note</Text>
          <Text maxFontSizeMultiplier={1.3} style={[styles.optionalLabel, { color: t.textSecondary }]}> (optional)</Text>
        </View>
        <View
          style={[
            styles.noteCard,
            { backgroundColor: t.cardBg, borderColor: focused === 'note' ? t.brand : t.cardBorder },
          ]}>
          <TextInput maxFontSizeMultiplier={1.3}
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
          <Text maxFontSizeMultiplier={1.3} style={[styles.charCounter, { color: t.muted }]}>{note.length}/50</Text>
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
            <Text maxFontSizeMultiplier={1.3} style={[styles.securityTitle, { color: t.textPrimary }]}>
              Instant &amp; Real-time Settlement
            </Text>
            <Text maxFontSizeMultiplier={1.3} style={[styles.securitySub, { color: t.textSecondary }]}>
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
          onPress={() => {
            thud();
            handleSendPress();
          }}>
          <Svg style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="sendCtaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={GRADIENT_STOPS.from} />
                <Stop offset="100%" stopColor={GRADIENT_STOPS.to} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" rx={18} fill="url(#sendCtaGrad)" />
          </Svg>
          <Text maxFontSizeMultiplier={1.3} style={styles.submitBtnText}>
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
                <Text maxFontSizeMultiplier={1.3} style={[styles.qrSheetTitle, { color: t.textPrimary }]}>
                  Scan payment QR
                </Text>
                <Text maxFontSizeMultiplier={1.3} style={[styles.qrSheetSubtitle, { color: t.textSecondary }]}>
                  The receiver can be offline; you need internet to pay
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeIconBtn, { backgroundColor: t.chipBg }]}
                onPress={() => setQrModalVisible(false)}>
                <HugeiconsIcon icon={Cancel01Icon} size={16} color={t.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.cameraFrame, { backgroundColor: t.chipBg }]}>
              {cameraPermission?.granted ? (
                <CameraView
                  style={styles.cameraPreview}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={({ data }) => {
                    if (hasScannedQr.current) return;
                    hasScannedQr.current = true;
                    void handleApplyQr(data);
                  }}
                />
              ) : (
                <View style={styles.cameraPermissionPrompt}>
                  <Text maxFontSizeMultiplier={1.3} style={[styles.cameraPermissionText, { color: t.textSecondary }]}>
                    {cameraPermission ? 'Camera access is needed to scan a payment QR.' : 'Starting camera...'}
                  </Text>
                  {cameraPermission && (
                    <TouchableOpacity
                      style={[styles.qrApplyBtn, { backgroundColor: t.brand }]}
                      activeOpacity={0.85}
                      onPress={() => void requestCameraPermission()}>
                      <Text maxFontSizeMultiplier={1.3} style={styles.qrApplyBtnText}>Enable camera</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* <View
              style={[
                styles.qrInputBox,
                { backgroundColor: t.inputBg, borderColor: t.inputBorder },
              ]}>
              <TextInput maxFontSizeMultiplier={1.3}
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
                <Text maxFontSizeMultiplier={1.3} style={styles.qrApplyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View> */}

            {/* Quick Discover Nearby Users */}
            <Text maxFontSizeMultiplier={1.3} style={[styles.qrSheetSectionTitle, { color: t.textPrimary }]}>
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
                    tap();
                    setSelectedNearbyUser(item);
                    setContactlessCode('');
                    setTab('nearby');
                    setQrModalVisible(false);
                    show({ message: `Selected @${item.username}`, variant: 'success' });
                  }}>
                  <Image
                    source={{ uri: item.avatarUrl }}
                    style={styles.discoveredAvatar}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={0}
                    recyclingKey={item.id}
                  />
                  <View style={{ flex: 1 }}>
                    <Text maxFontSizeMultiplier={1.3} style={[styles.discoveredName, { color: t.textPrimary }]}>
                      {item.name}
                    </Text>
                    <Text maxFontSizeMultiplier={1.3} style={[styles.discoveredTag, { color: t.brand }]}>
                      @{item.username}
                    </Text>
                  </View>
                  <View style={[styles.tagBadgeSmall, { backgroundColor: t.brandTint }]}>
                    <Text maxFontSizeMultiplier={1.3} style={[styles.tagBadgeSmallText, { color: t.brand }]}>Select</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={bleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeBluetoothScanner}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.backdropTouch}
            activeOpacity={1}
            onPress={closeBluetoothScanner}
          />
          <View style={[styles.qrSheet, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
            <View style={[styles.sheetHandle, { backgroundColor: t.divider }]} />
            <View style={styles.qrSheetHeader}>
              <View style={[styles.qrHeaderIconWrap, { backgroundColor: t.brandTint }]}>
                <HugeiconsIcon icon={BluetoothIcon} size={22} color={t.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text maxFontSizeMultiplier={1.3} style={[styles.qrSheetTitle, { color: t.textPrimary }]}>Nearby receivers</Text>
                <Text maxFontSizeMultiplier={1.3} style={[styles.qrSheetSubtitle, { color: t.textSecondary }]}>
                  Keep the receiver app open with Nearby Discovery on.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeIconBtn, { backgroundColor: t.chipBg }]}
                onPress={closeBluetoothScanner}>
                <HugeiconsIcon icon={Cancel01Icon} size={16} color={t.textPrimary} />
              </TouchableOpacity>
            </View>

            {nearbyBluetooth.devices.length > 0 ? (
              <View style={styles.discoveredList}>
                {nearbyBluetooth.devices.map((device) => (
                  <TouchableOpacity
                    key={device.id}
                    style={[styles.discoveredItem, { backgroundColor: t.chipBg, borderColor: t.cardBorder }]}
                    activeOpacity={0.8}
                    onPress={() => {
                      closeBluetoothScanner();
                      void handleApplyQr(device.tag);
                    }}>
                    <View style={[styles.discoveredAvatar, styles.bluetoothAvatar, { backgroundColor: t.brandTint }]}>
                      <HugeiconsIcon icon={BluetoothIcon} size={17} color={t.brand} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text maxFontSizeMultiplier={1.3} style={[styles.discoveredName, { color: t.textPrimary }]}>{device.name}</Text>
                      <Text maxFontSizeMultiplier={1.3} style={[styles.discoveredTag, { color: t.brand }]}>@{device.tag}</Text>
                    </View>
                    <Text maxFontSizeMultiplier={1.3} style={[styles.bluetoothSignal, { color: t.textSecondary }]}>{device.rssi} dBm</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : nearbyBluetooth.isScanning ? (
              <View style={styles.bluetoothEmptyState}>
                <ActivityIndicator color={t.brand} />
                <Text maxFontSizeMultiplier={1.3} style={[styles.cameraPermissionText, { color: t.textSecondary }]}>
                  Scanning for NearbyPay receivers...
                </Text>
              </View>
            ) : (
              <Text maxFontSizeMultiplier={1.3} style={[styles.bluetoothEmptyText, { color: t.textSecondary }]}>
                {nearbyBluetooth.status?.message || 'No receivers found nearby.'}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.contactlessContinueButton, { backgroundColor: t.chipBg }]}
              activeOpacity={0.85}
              onPress={closeBluetoothScanner}>
              <Text maxFontSizeMultiplier={1.3} style={[styles.qrApplyBtnText, { color: t.textPrimary }]}>Close scan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={contactlessCodeModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setContactlessCodeModalVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          keyboardVerticalOffset={0}>
          <TouchableOpacity
            style={styles.backdropTouch}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              setContactlessCodeModalVisible(false);
            }}
          />
          <View
            style={[
              styles.qrSheet,
              { backgroundColor: t.cardBg, borderColor: t.cardBorder },
            ]}>
            <View style={[styles.sheetHandle, { backgroundColor: t.divider }]} />
            <View style={styles.qrSheetHeader}>
              <View style={[styles.qrHeaderIconWrap, { backgroundColor: t.brandTint }]}>
                <HugeiconsIcon icon={ShieldCheckIcon} size={22} color={t.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text maxFontSizeMultiplier={1.3} style={[styles.qrSheetTitle, { color: t.textPrimary }]}>Recipient contactless code</Text>
                <Text maxFontSizeMultiplier={1.3} style={[styles.qrSheetSubtitle, { color: t.textSecondary }]}>
                  Ask @{selectedNearbyUser?.username || 'recipient'} for their 8-digit code. It is not in the QR.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeIconBtn, { backgroundColor: t.chipBg }]}
                onPress={() => {
                  Keyboard.dismiss();
                  setContactlessCodeModalVisible(false);
                }}>
                <HugeiconsIcon icon={Cancel01Icon} size={16} color={t.textPrimary} />
              </TouchableOpacity>
            </View>

            <TextInput maxFontSizeMultiplier={1.3}
              style={[styles.contactlessCodeInput, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.textPrimary }]}
              placeholder="8-digit code"
              placeholderTextColor={t.muted}
              value={contactlessCode}
              onChangeText={(value) => {
                setContactlessCode(value.replace(/\D/g, '').slice(0, 8));
                setContactlessCodeError('');
              }}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={8}
              accessibilityLabel="Recipient's 8-digit contactless code"
            />
            {contactlessCodeError ? <Text maxFontSizeMultiplier={1.3} style={styles.contactlessCodeError}>{contactlessCodeError}</Text> : null}

            <TouchableOpacity
              style={[styles.contactlessContinueButton, { backgroundColor: t.brand }]}
              activeOpacity={0.85}
              onPress={() => {
                if (!/^\d{8}$/.test(contactlessCode)) {
                  setContactlessCodeError('Enter the recipient\'s 8-digit code.');
                  return;
                }
                setContactlessCodeError('');
                Keyboard.dismiss();
                setContactlessCodeModalVisible(false);
              }}>
              <Text maxFontSizeMultiplier={1.3} style={styles.qrApplyBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Live Transfer Receipt Modal */}
      <Modal visible={Boolean(receipt)} transparent animationType="fade">
        <View style={styles.receiptBackdrop}>
          <View style={[styles.receiptCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
            <View ref={receiptArtworkRef} style={[styles.receiptArtwork, { backgroundColor: t.cardBg }]}>
              <Text maxFontSizeMultiplier={1.3} style={[styles.receiptBrand, { color: t.brand }]}>NearbyPay</Text>
              <Text maxFontSizeMultiplier={1.3} style={[styles.receiptType, { color: t.textSecondary }]}>TRANSACTION RECEIPT</Text>
            {/* Green glowing success badge */}
            <View style={styles.successIconCircle}>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={54} color="#16A34A" />
            </View>

            <Text maxFontSizeMultiplier={1.3} style={[styles.receiptSuccessTitle, { color: t.textPrimary }]}>
              Transfer Successful!
            </Text>
            <Text maxFontSizeMultiplier={1.3} style={[styles.receiptSuccessSub, { color: t.textSecondary }]}>
              Funds have been transferred instantly
            </Text>

            <Text maxFontSizeMultiplier={1.3} adjustsFontSizeToFit numberOfLines={1} style={[styles.receiptBigAmount, { color: t.textPrimary }]}>
              ₦{receipt?.amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>

            {/* Details Box */}
            <View style={[styles.receiptDetailsBox, { backgroundColor: t.chipBg, borderColor: t.cardBorder }]}>
              <View style={styles.receiptRow}>
                <Text maxFontSizeMultiplier={1.3} style={[styles.receiptLabel, { color: t.textSecondary }]}>Recipient</Text>
                <View style={styles.receiptRecipientCol}>
                  <Text maxFontSizeMultiplier={1.3} style={[styles.receiptValue, { color: t.textPrimary }]}>
                    {receipt?.recipientName}
                  </Text>
                  <Text maxFontSizeMultiplier={1.3} style={[styles.receiptSubValue, { color: t.brand }]}>
                    @{receipt?.recipientTag}
                  </Text>
                </View>
              </View>

              <View style={styles.receiptRow}>
                <Text maxFontSizeMultiplier={1.3} style={[styles.receiptLabel, { color: t.textSecondary }]}>Reference</Text>
                <TouchableOpacity
                  style={styles.refRow}
                  activeOpacity={0.7}
                  onPress={() => receipt && copyReceiptRef(receipt.reference)}>
                  <Text maxFontSizeMultiplier={1.3} style={[styles.receiptValue, { color: t.textPrimary, fontFamily: 'Montserrat_600SemiBold' }]}>
                    {receipt?.reference}
                  </Text>
                  <HugeiconsIcon icon={Copy01Icon} size={14} color={t.brand} />
                </TouchableOpacity>
              </View>

              <View style={styles.receiptRow}>
                <Text maxFontSizeMultiplier={1.3} style={[styles.receiptLabel, { color: t.textSecondary }]}>Channel</Text>
                <Text maxFontSizeMultiplier={1.3} style={[styles.receiptValue, { color: t.textPrimary }]}>
                  {receipt?.channel}
                </Text>
              </View>

              <View style={styles.receiptRow}>
                <Text maxFontSizeMultiplier={1.3} style={[styles.receiptLabel, { color: t.textSecondary }]}>Date &amp; Time</Text>
                <Text maxFontSizeMultiplier={1.3} style={[styles.receiptValue, { color: t.textPrimary }]}>
                  {receipt?.date}
                </Text>
              </View>

              {receipt?.note && (
                <View style={styles.receiptRow}>
                  <Text maxFontSizeMultiplier={1.3} style={[styles.receiptLabel, { color: t.textSecondary }]}>Note</Text>
                  <Text maxFontSizeMultiplier={1.3} style={[styles.receiptValue, { color: t.textPrimary }]}>
                    {receipt.note}
                  </Text>
                </View>
              )}
            </View>
            </View>

            {/* Action buttons */}
            <View style={styles.receiptButtonsRow}>
              <TouchableOpacity
                style={[styles.receiptShareBtn, { backgroundColor: t.chipBg, borderColor: t.cardBorder }]}
                activeOpacity={0.8}
                onPress={shareReceipt}>
                <HugeiconsIcon icon={Share08Icon} size={16} color={t.textPrimary} />
                <Text maxFontSizeMultiplier={1.3} style={[styles.receiptShareBtnText, { color: t.textPrimary }]}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.receiptDoneBtn, { backgroundColor: t.brand }]}
                activeOpacity={0.85}
                onPress={handleDoneReceipt}>
                <Text maxFontSizeMultiplier={1.3} style={styles.receiptDoneBtnText}>Done</Text>
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
  scanActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    borderColor: 'transparent',
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarSelected: {
    borderColor: '#2E45F4',
  },
  avatarImg: {
    width: 51,
    height: 51,
    borderRadius: 25.5,
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
    maxHeight: '92%',
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
  cameraFrame: {
    height: 210,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cameraPreview: {
    flex: 1,
  },
  cameraPermissionPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  cameraPermissionText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 13,
    textAlign: 'center',
  },
  contactlessCodeInput: {
    height: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
    textAlign: 'center',
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
    letterSpacing: 5,
  },
  contactlessCodeError: {
    color: '#DC2626',
    fontFamily: 'Montserrat_500Medium',
    fontSize: 12,
  },
  contactlessContinueButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
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
  bluetoothAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bluetoothSignal: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 10,
  },
  bluetoothEmptyState: {
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  bluetoothEmptyText: {
    paddingVertical: 28,
    fontFamily: 'Montserrat_500Medium',
    fontSize: 13,
    textAlign: 'center',
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
  receiptArtwork: {
    width: '100%',
    alignItems: 'center',
    padding: 4,
  },
  receiptBrand: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    letterSpacing: -0.4,
  },
  receiptType: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 9,
    letterSpacing: 1.4,
    marginTop: 3,
    marginBottom: 18,
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
