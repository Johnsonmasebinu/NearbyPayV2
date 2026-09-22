import {
    ArrowRight01Icon,
    Clock01Icon,
    Download01Icon,
    MoreHorizontalIcon,
    Notification03Icon,
    Sent02Icon,
    Tick02Icon,
    UserGroupIcon,
    UserIcon,
    ViewIcon,
    ViewOffSlashIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Image,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useToast } from '@/components/ui/toast';
import { getAppTheme, GRADIENT_STOPS, HERO_STOPS } from '@/constants/app-theme';

type StarSpec = {
  id: number;
  left: number;
  top: number;
  size: number;
  drift: number;
  duration: number;
  delay: number;
};

const QUICK_ACTIONS = [
  { id: 'send', label: 'Send', icon: Sent02Icon },
  { id: 'receive', label: 'Receive', icon: Download01Icon },
  { id: 'history', label: 'History', icon: Clock01Icon },
  { id: 'more', label: 'More', icon: MoreHorizontalIcon },
];

const TRANSACTIONS = [
  {
    id: '1',
    title: 'Sent to Tunde Adeboyo',
    date: 'Jun 28, 10:24 AM',
    amount: '- ₦5,000',
    type: 'sent',
    icon: UserIcon,
    iconColor: '#2E45F4',
    amountColor: '#EF4444',
  },
  {
    id: '2',
    title: 'Received from Bisi Lawal',
    date: 'Jun 27, 04:12 PM',
    amount: '+ ₦20,000',
    type: 'received',
    icon: Download01Icon,
    iconColor: '#16A34A',
    amountColor: '#16A34A',
  },
  {
    id: '3',
    title: 'Sent to Family',
    date: 'Jun 25, 09:45 PM',
    amount: '- ₦12,500',
    type: 'sent',
    icon: UserGroupIcon,
    iconColor: '#2E45F4',
    amountColor: '#EF4444',
  },
];

function TwinklingStar({ star }: { star: StarSpec }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(star.delay * 1000),
      Animated.loop(
        Animated.timing(progress, {
          toValue: 1,
          duration: Math.round(star.duration * 1000),
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ),
    ]);
    animation.start();
    return () => animation.stop();
  }, [progress, star]);

  const opacity = progress.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, 0.9, 0],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -star.drift],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -star.drift * 0.7],
  });
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: `${star.left}%`,
        top: `${star.top}%`,
        width: star.size,
        height: star.size,
        opacity,
        transform: [{ translateX }, { translateY }, { scale }],
      }}>
      <Svg width={star.size} height={star.size} viewBox="0 0 24 24">
        <Path
          d="M12 0C13.2 6.8 17.2 10.8 24 12C17.2 13.2 13.2 17.2 12 24C10.8 17.2 6.8 13.2 0 12C6.8 10.8 10.8 6.8 12 0Z"
          fill="#FFFFFF"
        />
      </Svg>
    </Animated.View>
  );
}

interface HomeDashboardProps {
  onNavigate: (tab: 'send' | 'receive' | 'history') => void;
}

// TODO(api): GET /wallet -> balance, GET /transactions?limit=3 -> recent
export function HomeDashboard({ onNavigate }: HomeDashboardProps) {
  const { show } = useToast();
  const isDark = useColorScheme() === 'dark';
  const t = getAppTheme(isDark);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [starPositions, setStarPositions] = useState<StarSpec[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  useEffect(() => {
    const stars: StarSpec[] = [];
    for (let i = 0; i < 6; i++) {
      stars.push({
        id: i,
        left: Math.random() * 20 + 58,
        top: Math.random() * 22 + 6,
        size: Math.random() * 5 + 5,
        drift: Math.random() * 12 + 10,
        duration: Math.random() * 4 + 4,
        delay: Math.random() * 3,
      });
    }
    setStarPositions(stars);
  }, []);

  const handleActionPress = (action: string) => {
    if (action === 'Send' || action === 'Receive' || action === 'History') {
      onNavigate(action.toLowerCase() as 'send' | 'receive' | 'history');
      return;
    }
    show({ message: `${action} feature opened.`, variant: 'info' });
  };

  const txTint = { sent: t.brandTint, received: t.successTint } as const;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#FFFFFF"
          colors={['#2E45F4']}
          progressBackgroundColor={t.cardBg}
        />
      }>
      {/* Hero — dark indigo header with brand, greeting and balance card */}
      <View style={styles.hero}>
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={HERO_STOPS.from} />
              <Stop offset="100%" stopColor={HERO_STOPS.to} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#heroGrad)" />
        </Svg>

        <View style={styles.heroInner}>
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Image source={require('@/assets/images/logo/logo.png')} style={styles.logo} resizeMode="contain" />
              <Text style={styles.brandTitle}>NearbyPay</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.notificationButton}
                activeOpacity={0.7}
                onPress={() => show({ message: 'You have 1 new payment alert', variant: 'info' })}>
                <HugeiconsIcon icon={Notification03Icon} size={18} color="#FFFFFF" />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.avatarButton}
                activeOpacity={0.8}
                onPress={() => show({ message: 'Viewing profile details: Chinedu Okafor', variant: 'info' })}>
                <Image
                  source={{ uri: 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_23.png' }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.greetingSection}>
            <Text style={styles.greetingSub}>Good morning,</Text>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>Chinedu Okafor</Text>
              <View style={styles.verifiedBadge}>
                <HugeiconsIcon icon={Tick02Icon} size={10} color="#FFFFFF" strokeWidth={2.8} />
              </View>
            </View>
            <Text style={styles.tagline}>Send. Receive. Stay Close.</Text>
          </View>

          <View style={styles.balanceCard}>
            <Svg style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="balGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={GRADIENT_STOPS.from} />
                  <Stop offset="100%" stopColor={GRADIENT_STOPS.to} />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" rx={22} fill="url(#balGrad)" />
            </Svg>
            <View style={styles.cardHairline} pointerEvents="none" />
            <Image
              source={require('@/assets/images/dash/image.png')}
              style={styles.balanceArt}
              resizeMode="contain"
            />
            {starPositions.map((star) => (
              <TwinklingStar key={star.id} star={star} />
            ))}
            <View style={styles.balanceTopRow}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <TouchableOpacity
                onPress={() => setIsBalanceVisible(!isBalanceVisible)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.eyeToggle}>
                <HugeiconsIcon
                  icon={isBalanceVisible ? ViewIcon : ViewOffSlashIcon}
                  size={13}
                  color="rgba(255, 255, 255, 0.85)"
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceAmount}>{isBalanceVisible ? '₦245,680.75' : '₦ ••••••'}</Text>
            <TouchableOpacity
              style={styles.availableRow}
              activeOpacity={0.8}
              onPress={() => onNavigate('history')}>
              <View>
                <Text style={styles.availableLabel}>Available Balance</Text>
                <Text style={styles.availableValue}>{isBalanceVisible ? '₦245,680.75' : '₦ ••••••'}</Text>
              </View>
              <HugeiconsIcon icon={ArrowRight01Icon} size={15} color="rgba(255, 255, 255, 0.85)" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Quick actions — four tiled cards */}
      <View style={styles.actionRow}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionTile, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
            activeOpacity={0.7}
            onPress={() => handleActionPress(action.label)}>
            <View style={[styles.actionIconWrap, { backgroundColor: t.brandTint }]}>
              <HugeiconsIcon icon={action.icon} size={19} color={t.brand} />
            </View>
            <Text style={[styles.actionLabel, { color: t.textPrimary }]}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.promoCard}>
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="promoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#101446" />
              <Stop offset="60%" stopColor="#0A0E33" />
              <Stop offset="100%" stopColor="#05081E" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" rx={20} fill="url(#promoGrad)" />
        </Svg>
        <View style={styles.promoGlowCircle} pointerEvents="none" />
        <Image source={require('@/assets/images/dash/image_2.png')} style={styles.promoImage} resizeMode="contain" />
        <View style={styles.promoTextCol}>
          <Text style={styles.promoTitle}>{'One App.\nAll Your People.'}</Text>
          <Text style={styles.promoSubtitle}>{'Send money, split bills,\ncollect payments and more.'}</Text>
          <TouchableOpacity
            style={styles.promoButton}
            activeOpacity={0.8}
            onPress={() => show({ message: 'Discover NearbyPay social transfers & split pay', variant: 'info' })}>
            <Text style={styles.promoButtonText}>Explore NearbyPay</Text>
            <HugeiconsIcon icon={ArrowRight01Icon} size={12} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.transactionsSection}>
        <View style={styles.transactionsHeader}>
          <Text style={[styles.transactionsTitle, { color: t.textPrimary }]}>Recent Transactions</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => onNavigate('history')}>
            <Text style={[styles.seeAllText, { color: t.brand }]}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.transactionsList}>
          {TRANSACTIONS.map((tx, index) => (
            <TouchableOpacity
              key={tx.id}
              style={[
                styles.transactionItem,
                { borderBottomColor: t.divider },
                index === TRANSACTIONS.length - 1 && styles.lastTransactionItem,
              ]}
              activeOpacity={0.7}
              onPress={() => show({ message: `Transaction details: ${tx.title}`, variant: 'info' })}>
              <View style={[styles.txIconWrap, { backgroundColor: txTint[tx.type as 'sent' | 'received'] }]}>
                <HugeiconsIcon icon={tx.icon} size={18} color={tx.iconColor} />
              </View>
              <View style={styles.txInfo}>
                <Text style={[styles.txTitle, { color: t.textPrimary }]}>{tx.title}</Text>
                <Text style={[styles.txDate, { color: t.textSecondary }]}>{tx.date}</Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.amountColor }]}>{tx.amount}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 28 },
  hero: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  heroInner: { paddingHorizontal: 16, paddingTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 30, height: 30 },
  brandTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 20, color: '#FFFFFF', letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notificationButton: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.16)',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#F87171', borderWidth: 1.5, borderColor: '#1C1A55',
  },
  avatarButton: {
    width: 38, height: 38, borderRadius: 19, overflow: 'hidden', borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)', backgroundColor: '#CBD5E1',
  },
  avatarImage: { width: 34, height: 34 },
  greetingSection: { marginTop: 16, marginBottom: 16 },
  greetingSub: { fontFamily: 'Montserrat_500Medium', fontSize: 13.5, color: 'rgba(255, 255, 255, 0.78)' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 6 },
  userName: { fontFamily: 'Montserrat_700Bold', fontSize: 22, color: '#FFFFFF', letterSpacing: -0.5 },
  verifiedBadge: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  tagline: { fontFamily: 'Montserrat_500Medium', fontSize: 12, marginTop: 4, color: 'rgba(255, 255, 255, 0.66)' },
  balanceCard: {
    borderRadius: 22, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 16, position: 'relative', overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#0A1240', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.35, shadowRadius: 20 },
      android: { elevation: 8 },
      web: { shadowColor: '#0A1240', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.35, shadowRadius: 20 },
    }),
  },
  cardHairline: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 22,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  balanceArt: { position: 'absolute', top: -14, right: -8, width: 104, height: 104, opacity: 0.95 },
  balanceTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceLabel: { fontFamily: 'Montserrat_500Medium', fontSize: 13, color: 'rgba(255, 255, 255, 0.78)' },
  eyeToggle: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.14)', alignItems: 'center', justifyContent: 'center' },
  balanceAmount: { fontFamily: 'Montserrat_700Bold', fontSize: 33, color: '#FFFFFF', letterSpacing: -1, marginTop: 8 },
  availableRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(13, 20, 60, 0.30)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14, paddingVertical: 10, marginTop: 16,
  },
  availableLabel: { fontFamily: 'Montserrat_500Medium', fontSize: 10.5, color: 'rgba(255, 255, 255, 0.75)' },
  availableValue: { fontFamily: 'Montserrat_600SemiBold', fontSize: 13.5, color: '#FFFFFF', marginTop: 1 },
  actionRow: {
    flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 18,
  },
  actionTile: {
    flex: 1, alignItems: 'center', gap: 8, paddingVertical: 14, borderRadius: 18, borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#1E2B6B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 },
      web: { shadowColor: '#1E2B6B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
    }),
  },
  actionIconWrap: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontFamily: 'Montserrat_600SemiBold', fontSize: 11 },
  promoCard: {
    borderRadius: 20, overflow: 'hidden', marginHorizontal: 16, marginTop: 14, position: 'relative', minHeight: 126,
    paddingHorizontal: 16, paddingVertical: 16,
    ...Platform.select({
      ios: { shadowColor: '#081030', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 12 },
      android: { elevation: 5 },
      web: { shadowColor: '#081030', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 12 },
    }),
  },
  promoGlowCircle: {
    position: 'absolute', bottom: -18, right: 24, width: 130, height: 130,
    borderRadius: 65, backgroundColor: '#2E45F4', opacity: 0.16,
  },
  promoImage: { position: 'absolute', right: 0, bottom: 0, width: 112, height: 112 },
  promoTextCol: { flex: 1, maxWidth: '62%' },
  promoTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 17, color: '#FFFFFF', lineHeight: 22, letterSpacing: -0.3 },
  promoSubtitle: { fontFamily: 'Montserrat_400Regular', fontSize: 10.5, color: '#A6B1D6', marginTop: 5, lineHeight: 14 },
  promoButton: {
    backgroundColor: '#3D5AF8', borderRadius: 16, paddingVertical: 7, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6 },
      android: { elevation: 3 },
      web: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6 },
    }),
  },
  promoButtonText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 10.5, color: '#FFFFFF' },
  transactionsSection: { marginTop: 20, marginHorizontal: 16 },
  transactionsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  transactionsTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 16, letterSpacing: -0.3 },
  seeAllText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 12 },
  transactionsList: { marginTop: 2 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  lastTransactionItem: { borderBottomWidth: 0 },
  txIconWrap: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txTitle: { fontFamily: 'Montserrat_600SemiBold', fontSize: 13 },
  txDate: { fontFamily: 'Montserrat_400Regular', fontSize: 11, marginTop: 2 },
  txAmount: { fontFamily: 'Montserrat_700Bold', fontSize: 14 },
});
