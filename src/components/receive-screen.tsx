import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  BoltIcon,
  Location01Icon,
  Wallet03Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAppTheme } from '@/hooks/theme-provider';
import type { ThemeColors } from '@/constants/theme';
import { useToast } from '@/components/ui/toast';
import QRCodeView from '@/components/ui/qr-code';

const PAYMENT_CODE = 'NBP-7X2K-QR9M';
const PAYERS = [
  { name: 'Ada Obi', avatar: 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_12.png', amount: '₦2,500' },
  { name: 'Tunde Bakare', avatar: 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_13.png', amount: '₦7,000' },
  { name: 'Ngozi Eze', avatar: 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_14.png', amount: '₦1,200' },
];

type Incoming = { id: number; name: string; avatar: string; amount: string; time: string };

export default function ReceiveScreen({ onClose }: { onClose: () => void }) {
  const { colors, isDark } = useAppTheme();
  const { show } = useToast();
  const styles = createStyles(colors);

  const [isOnline, setIsOnline] = useState(true);
  const [requestAmount, setRequestAmount] = useState('');
  const [incoming, setIncoming] = useState<Incoming[]>([]);

  const entrance = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const feedCounter = useRef(0);

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  useEffect(() => {
    if (!isOnline) return;

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ]),
    );
    pulseLoop.start();

    const timer = setInterval(() => {
      const payer = PAYERS[feedCounter.current % PAYERS.length];
      feedCounter.current += 1;
      const now = new Date();
      setIncoming((prev) => [
        {
          id: now.getTime(),
          name: payer.name,
          avatar: payer.avatar,
          amount: payer.amount,
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ].slice(0, 4));
    }, 9000);

    return () => {
      pulseLoop.stop();
      clearInterval(timer);
    };
  }, [isOnline, pulse]);

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });
  const iconScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  const formatAmount = (value: string) => {
    const digits = value.replace(/[^0-9]/g, '');
    if (!digits) return '';
    return `₦${Number(digits).toLocaleString()}`;
  };

  const handleCopyCode = () => {
    show({ message: 'Payment code copied — share it with anyone nearby.', variant: 'success' });
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onClose}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Receive Money</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
            {/* Merchant online card */}
            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <View style={styles.pulseWrap}>
                  {isOnline && (
                    <Animated.View
                      style={[styles.pulseRing, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]}
                      pointerEvents="none"
                    />
                  )}
                  <Animated.View
                    style={[
                      styles.statusIcon,
                      { backgroundColor: isOnline ? colors.success : colors.textMuted, transform: [{ scale: iconScale }] },
                    ]}>
                    <HugeiconsIcon icon={Wallet03Icon} size={22} color="#FFFFFF" />
                  </Animated.View>
                </View>
                <View style={styles.statusInfo}>
                  <Text style={styles.statusTitle}>
                    {isOnline ? 'You are online' : 'You are offline'}
                  </Text>
                  <Text style={styles.statusSubtitle}>
                    {isOnline
                      ? 'Receiving payments in real time'
                      : 'Go online to start receiving payments'}
                  </Text>
                </View>
                <Switch
                  value={isOnline}
                  onValueChange={(value) => {
                    setIsOnline(value);
                    if (!value) setIncoming([]);
                    show({
                      message: value ? 'You are now online — ready to receive.' : 'You went offline.',
                      variant: 'info',
                    });
                  }}
                  trackColor={{ false: colors.divider, true: colors.success }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <View style={styles.statusNoteRow}>
                <HugeiconsIcon icon={BoltIcon} size={12} color={colors.warning} />
                <Text style={styles.statusNote}>
                  As a merchant you must stay online to receive payments.
                  Customers can pay you even when they are offline.
                </Text>
              </View>
            </View>

            {/* Payment QR + code */}
            <Text style={styles.sectionLabel}>Your payment QR</Text>
            <View style={styles.codeCard}>
              <View style={styles.qrCard}>
                <QRCodeView
                  value={`NBP-RECEIVE:${PAYMENT_CODE}`}
                  size={132}
                  color={isDark ? '#0A1E3C' : colors.text}
                  backgroundColor={isDark ? '#FFFFFF' : 'transparent'}
                />
              </View>
              <View style={styles.codeSide}>
                <Text style={styles.codeText}>{PAYMENT_CODE}</Text>
                <Text style={styles.codeHint}>
                  Customers around you scan this to pay you — even while
                  offline.
                </Text>
                <TouchableOpacity style={styles.codeButton} activeOpacity={0.75} onPress={handleCopyCode}>
                  <Text style={styles.codeButtonText}>Share code</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Request amount */}
            <Text style={styles.sectionLabel}>Request a specific amount</Text>
            <View style={styles.requestCard}>
              <Text style={styles.requestPrefix}>₦</Text>
              <TextInput
                style={styles.requestInput}
                value={requestAmount}
                onChangeText={(text) => setRequestAmount(formatAmount(text))}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                style={styles.requestButton}
                activeOpacity={0.8}
                onPress={() =>
                  show({
                    message: requestAmount
                      ? `Request for ${requestAmount} sent to nearby customers.`
                      : 'Enter an amount to request.',
                    variant: 'info',
                  })
                }>
                <Text style={styles.requestButtonText}>Request</Text>
              </TouchableOpacity>
            </View>

            {/* Incoming feed */}
            <View style={styles.feedHeaderRow}>
              <Text style={styles.sectionLabelFeed}>Incoming payments</Text>
              {isOnline && (
                <View style={styles.liveBadge}>
                  <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
                  <Text style={styles.liveText}>Live</Text>
                </View>
              )}
            </View>

            {incoming.length === 0 ? (
              <View style={styles.feedEmpty}>
                <HugeiconsIcon icon={Location01Icon} size={18} color={colors.textMuted} />
                <Text style={styles.feedEmptyText}>
                  {isOnline
                    ? 'Listening for nearby customers paying you…'
                    : 'Go online to start receiving payments.'}
                </Text>
              </View>
            ) : (
              incoming.map((payment, index) => (
                <IncomingRow key={payment.id} payment={payment} colors={colors} index={index} />
              ))
            )}
          </Animated.View>
        </ScrollView>
      </View>
    </View>
  );
}

function IncomingRow({
  payment,
  colors: c,
  index,
}: {
  payment: Incoming;
  colors: ThemeColors;
  index: number;
}) {
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [slide]);

  return (
    <Animated.View
      style={[
        incomingRowStyles(c).row,
        index === 0 && incomingRowStyles(c).rowFirst,
        {
          opacity: slide,
          transform: [
            { translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) },
            { scale: slide.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
          ],
        },
      ]}>
      <Image source={{ uri: payment.avatar }} style={incomingRowStyles(c).avatar} resizeMode="cover" />
      <View style={incomingRowStyles(c).info}>
        <Text style={incomingRowStyles(c).name}>{payment.name}</Text>
        <Text style={incomingRowStyles(c).time}>{payment.time} · paid offline-ready</Text>
      </View>
      <Text style={incomingRowStyles(c).amount}>{payment.amount}</Text>
      <View style={incomingRowStyles(c).icon}>
        <HugeiconsIcon icon={ArrowDown01Icon} size={13} color={c.success} />
      </View>
    </Animated.View>
  );
}

const incomingRowStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: 12,
      marginBottom: 8,
      gap: 10,
    },
    rowFirst: {
      borderColor: c.success,
      borderWidth: 1.5,
    },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: c.backgroundSelected,
    },
    info: {
      flex: 1,
    },
    name: {
      fontFamily: 'Montserrat_600SemiBold',
      fontSize: 12,
      color: c.text,
    },
    time: {
      fontFamily: 'Montserrat_400Regular',
      fontSize: 10,
      color: c.textMuted,
      marginTop: 2,
    },
    amount: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 13,
      color: c.success,
    },
    icon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.background,
    },
    container: {
      flex: 1,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 10,
    },
    screenTitle: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 17,
      color: c.text,
      letterSpacing: -0.3,
    },
    backButton: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
    },
    contentInner: {
      paddingHorizontal: 16,
      paddingBottom: 40,
    },
    statusCard: {
      backgroundColor: c.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: 16,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    pulseWrap: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pulseRing: {
      position: 'absolute',
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.success,
    },
    statusIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusInfo: {
      flex: 1,
    },
    statusTitle: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 14,
      color: c.text,
    },
    statusSubtitle: {
      fontFamily: 'Montserrat_400Regular',
      fontSize: 11,
      color: c.textMuted,
      marginTop: 2,
    },
    statusNoteRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: c.divider,
    },
    statusNote: {
      flex: 1,
      fontFamily: 'Montserrat_400Regular',
      fontSize: 10,
      color: c.textMuted,
      lineHeight: 15,
    },
    sectionLabel: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 13,
      color: c.textSecondary,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      marginTop: 20,
      marginBottom: 10,
    },
    codeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: 14,
      gap: 14,
    },
    qrCard: {
      padding: 8,
      borderRadius: 12,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
    },
    codeSide: {
      flex: 1,
      alignItems: 'flex-start',
      gap: 8,
    },
    codeText: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 15,
      color: c.text,
      letterSpacing: 1.2,
    },
    codeHint: {
      fontFamily: 'Montserrat_400Regular',
      fontSize: 10,
      color: c.textMuted,
      lineHeight: 15,
    },
    codeButton: {
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 14,
    },
    codeButtonText: {
      fontFamily: 'Montserrat_600SemiBold',
      fontSize: 11,
      color: c.brand,
    },
    requestCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      paddingLeft: 16,
      paddingRight: 6,
      paddingVertical: 6,
      gap: 4,
    },
    requestPrefix: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 20,
      color: c.textMuted,
    },
    requestInput: {
      flex: 1,
      fontFamily: 'Montserrat_700Bold',
      fontSize: 18,
      color: c.text,
      paddingVertical: 0,
    },
    requestButton: {
      backgroundColor: c.brand,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    requestButtonText: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 12,
      color: '#FFFFFF',
    },
    feedHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 22,
      marginBottom: 10,
    },
    sectionLabelFeed: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 13,
      color: c.textSecondary,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    liveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    liveText: {
      fontFamily: 'Montserrat_600SemiBold',
      fontSize: 9,
      color: c.textMuted,
    },
    feedEmpty: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: c.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      borderStyle: 'dashed',
      paddingVertical: 26,
    },
    feedEmptyText: {
      fontFamily: 'Montserrat_400Regular',
      fontSize: 11,
      color: c.textMuted,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
  });
