import {
  ArrowLeft01Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  SparklesIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/components/ui/toast';
import { getAppTheme } from '@/constants/app-theme';
import { useAppTheme } from '@/hooks/theme-provider';
import { useDailyCheckIn, type CheckInDay } from '@/hooks/use-daily-check-in';

export default function DailyCheckInScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { isDark } = useAppTheme();
  const t = getAppTheme(isDark);
  const { days, weekStart, isLoading, isCheckingIn, checkIn, refresh } = useDailyCheckIn();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [rewardSplash, setRewardSplash] = useState<{ amount: number; reward: string } | null>(null);
  const splashOpacity = useState(() => new Animated.Value(0))[0];
  const splashScale = useState(() => new Animated.Value(0.82))[0];

  const availableDay = days.find((day) => day.status === 'Available');
  const completedCount = days.filter((day) => day.status === 'Completed').length;

  const handleCheckIn = async () => {
    try {
      const result = await checkIn();
      setRewardSplash(result);
    } catch (error) {
      show({ message: error instanceof Error ? error.message : 'Check-in failed.', variant: 'error' });
    }
  };

  useEffect(() => {
    if (!rewardSplash) return;

    splashOpacity.setValue(0);
    splashScale.setValue(0.82);
    Animated.parallel([
      Animated.timing(splashOpacity, { toValue: 1, duration: 220, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.spring(splashScale, { toValue: 1, friction: 7, tension: 58, useNativeDriver: true }),
    ]).start();
  }, [rewardSplash, splashOpacity, splashScale]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } catch (error) {
      show({ message: error instanceof Error ? error.message : 'Unable to refresh check-ins.', variant: 'error' });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.pageBg }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.container, { backgroundColor: t.pageBg }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={19} color={t.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.eyebrow, { color: t.brand }]}>WEEKLY REWARDS</Text>
            <Text style={[styles.title, { color: t.textPrimary }]}>Daily Check-In</Text>
          </View>
          <View style={[styles.weekIcon, { backgroundColor: t.brandTint }]}>
            <HugeiconsIcon icon={Calendar03Icon} size={19} color={t.brand} />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={t.brand} colors={[t.brand]} />
          }
          contentContainerStyle={styles.content}>
          <View style={[styles.heroCard, { backgroundColor: t.brand }] }>
            <View style={styles.heroOrb} />
            <View style={styles.heroTopRow}>
              <View style={styles.heroIcon}>
                <HugeiconsIcon icon={SparklesIcon} size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.heroKicker}>{weekStart ? `Week of ${weekStart}` : 'This week'}</Text>
            </View>
            <Text style={styles.heroTitle}>Show up. Get rewarded.</Text>
            <Text style={styles.heroCopy}>Check in once each day to unlock your reward. Missed days cannot be reclaimed.</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round((completedCount / 7) * 100)}%` }]} />
            </View>
            <Text style={styles.progressText}>{completedCount} of 7 days completed</Text>
          </View>

          {availableDay && (
            <View style={[styles.todayCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
              <View style={[styles.todayIcon, { backgroundColor: t.successTint }]}>
                <HugeiconsIcon icon={Clock01Icon} size={20} color={t.success} />
              </View>
              <View style={styles.todayCopy}>
                <Text style={[styles.todayEyebrow, { color: t.success }]}>TODAY&apos;S REWARD</Text>
                <Text style={[styles.todayTitle, { color: t.textPrimary }]}>{availableDay.dayName}</Text>
                <Text style={[styles.todayReward, { color: t.textSecondary }]}>Mystery reward · Spin to reveal</Text>
              </View>
              <TouchableOpacity
                style={[styles.checkButton, { backgroundColor: t.brand }]}
                onPress={handleCheckIn}
                disabled={isCheckingIn}
                activeOpacity={0.84}>
                {isCheckingIn ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.checkButtonText}>Spin to reveal</Text>}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.sectionHeading}>
            <View>
              <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Your weekly streak</Text>
              <Text style={[styles.sectionSubtitle, { color: t.textSecondary }]}>One check-in per day, Monday through Sunday</Text>
            </View>
            <Text style={[styles.countLabel, { color: t.brand }]}>{completedCount}/7</Text>
          </View>

          <View style={[styles.daysCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
            {isLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color={t.brand} />
                <Text style={[styles.loadingText, { color: t.textSecondary }]}>Loading your week...</Text>
              </View>
            ) : (
              days.map((day, index) => (
                <DayRow key={day.date} day={day} isLast={index === days.length - 1} theme={t} />
              ))
            )}
          </View>

          <Text style={[styles.footnote, { color: t.muted }]}>Rewards are credited instantly after a successful check-in.</Text>
        </ScrollView>
      </View>
      <Modal visible={rewardSplash !== null} transparent animationType="none" onRequestClose={() => setRewardSplash(null)}>
        <Animated.View style={[styles.rewardBackdrop, { opacity: splashOpacity }]}>
          <Animated.View
            style={[styles.rewardCard, { backgroundColor: t.cardBg, transform: [{ scale: splashScale }] }]}
            accessibilityViewIsModal>
            <View style={[styles.rewardIcon, { backgroundColor: t.successTint }]}>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={42} color={t.success} />
            </View>
            <Text style={[styles.rewardEyebrow, { color: t.success }]}>CHECK-IN COMPLETE</Text>
            <Text style={[styles.rewardTitle, { color: t.textPrimary }]}>You got</Text>
            <Text style={[styles.rewardAmount, { color: t.brand }]}>₦{rewardSplash?.amount.toLocaleString('en-NG')}</Text>
            <Text style={[styles.rewardSubtitle, { color: t.textSecondary }]}>{rewardSplash?.reward}</Text>
            <Text style={[styles.rewardNote, { color: t.muted }]}>Your reward has been added to your balance.</Text>
            <TouchableOpacity
              style={[styles.rewardButton, { backgroundColor: t.brand }]}
              onPress={() => setRewardSplash(null)}
              activeOpacity={0.84}>
              <Text style={styles.rewardButtonText}>Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

function DayRow({ day, isLast, theme: t }: { day: CheckInDay; isLast: boolean; theme: ReturnType<typeof getAppTheme> }) {
  const isCompleted = day.status === 'Completed';
  const isAvailable = day.status === 'Available';
  const statusColor = isCompleted ? t.success : isAvailable ? t.brand : t.muted;
  const iconColor = isCompleted ? t.success : isAvailable ? t.brand : t.muted;

  return (
    <View style={[styles.dayRow, !isLast && { borderBottomColor: t.divider, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={[styles.dayIcon, { backgroundColor: isCompleted ? t.successTint : isAvailable ? t.brandTint : t.chipBg }]}>
        {isCompleted ? <HugeiconsIcon icon={Tick02Icon} size={17} color={iconColor} /> : <Text style={[styles.dayInitial, { color: iconColor }]}>{day.dayName.slice(0, 1)}</Text>}
      </View>
      <View style={styles.dayInfo}>
        <Text style={[styles.dayName, { color: t.textPrimary }]}>{day.dayName}</Text>
        <Text style={[styles.dayReward, { color: t.textSecondary }]}>
          {isCompleted ? day.reward : 'Mystery reward · Spin to reveal'}
        </Text>
      </View>
      <View style={styles.dayStatusWrap}>
        <Text style={[styles.dayStatus, { color: statusColor }]}>{day.status}</Text>
        {isCompleted && <Text style={[styles.earnedLabel, { color: t.success }]}>Reward earned</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, width: '100%', maxWidth: 440, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  iconButton: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitleWrap: { flex: 1, marginLeft: 13 },
  eyebrow: { fontFamily: 'Montserrat_700Bold', fontSize: 9, letterSpacing: 1.2 },
  title: { fontFamily: 'Montserrat_700Bold', fontSize: 20, marginTop: 2 },
  weekIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingBottom: 34 },
  heroCard: { borderRadius: 24, padding: 20, overflow: 'hidden', marginBottom: 16 },
  heroOrb: { position: 'absolute', width: 180, height: 180, borderRadius: 90, right: -50, top: -66, backgroundColor: '#FFFFFF', opacity: 0.1 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  heroIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  heroKicker: { fontFamily: 'Montserrat_600SemiBold', color: 'rgba(255,255,255,0.78)', fontSize: 11 },
  heroTitle: { fontFamily: 'Montserrat_700Bold', color: '#FFFFFF', fontSize: 23, marginTop: 18 },
  heroCopy: { fontFamily: 'Montserrat_400Regular', color: 'rgba(255,255,255,0.76)', fontSize: 11.5, lineHeight: 18, marginTop: 7, maxWidth: 320 },
  progressTrack: { height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 20, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: '#FFFFFF' },
  progressText: { fontFamily: 'Montserrat_600SemiBold', color: 'rgba(255,255,255,0.78)', fontSize: 10, marginTop: 8 },
  todayCard: { borderRadius: 20, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  todayIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  todayCopy: { flex: 1, marginLeft: 11 },
  todayEyebrow: { fontFamily: 'Montserrat_700Bold', fontSize: 9, letterSpacing: 0.8 },
  todayTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 15, marginTop: 2 },
  todayReward: { fontFamily: 'Montserrat_500Medium', fontSize: 11, marginTop: 2 },
  checkButton: { minWidth: 82, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  checkButtonText: { fontFamily: 'Montserrat_700Bold', fontSize: 11, color: '#FFFFFF' },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
  sectionTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 17 },
  sectionSubtitle: { fontFamily: 'Montserrat_400Regular', fontSize: 10.5, marginTop: 4 },
  countLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 18 },
  daysCard: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 15 },
  dayRow: { minHeight: 69, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  dayIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dayInitial: { fontFamily: 'Montserrat_700Bold', fontSize: 14 },
  dayInfo: { flex: 1, marginLeft: 11 },
  dayName: { fontFamily: 'Montserrat_700Bold', fontSize: 13 },
  dayReward: { fontFamily: 'Montserrat_400Regular', fontSize: 10.5, marginTop: 3 },
  dayStatusWrap: { alignItems: 'flex-end' },
  dayStatus: { fontFamily: 'Montserrat_700Bold', fontSize: 11 },
  earnedLabel: { fontFamily: 'Montserrat_400Regular', fontSize: 9, marginTop: 3 },
  loadingState: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontFamily: 'Montserrat_500Medium', fontSize: 11 },
  footnote: { fontFamily: 'Montserrat_400Regular', fontSize: 10, textAlign: 'center', marginTop: 16 },
  rewardBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(3, 7, 25, 0.72)' },
  rewardCard: { width: '100%', maxWidth: 360, borderRadius: 28, alignItems: 'center', paddingHorizontal: 24, paddingTop: 30, paddingBottom: 24 },
  rewardIcon: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  rewardEyebrow: { fontFamily: 'Montserrat_700Bold', fontSize: 10, letterSpacing: 1.1 },
  rewardTitle: { fontFamily: 'Montserrat_600SemiBold', fontSize: 17, marginTop: 12 },
  rewardAmount: { fontFamily: 'Montserrat_700Bold', fontSize: 38, marginTop: 3 },
  rewardSubtitle: { fontFamily: 'Montserrat_500Medium', fontSize: 11, marginTop: 6 },
  rewardNote: { fontFamily: 'Montserrat_400Regular', fontSize: 10.5, textAlign: 'center', marginTop: 16 },
  rewardButton: { width: '100%', height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  rewardButtonText: { fontFamily: 'Montserrat_700Bold', fontSize: 12, color: '#FFFFFF' },
});
