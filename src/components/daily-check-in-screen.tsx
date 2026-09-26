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
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useToast } from '@/components/ui/toast';
import { getAppTheme, GRADIENT_STOPS } from '@/constants/app-theme';
import { useAppTheme } from '@/hooks/theme-provider';
import { useDailyCheckIn, type CheckInDay } from '@/hooks/use-daily-check-in';

type SpinOption = {
  id: string;
  label: string;
  amount: number;
  isTryAgain?: boolean;
};

function getDaySpinOptions(dayName: string): SpinOption[] {
  const d = dayName.toLowerCase();
  if (d.includes('monday')) {
    return [
      { id: '1', label: '₦50', amount: 50 },
      { id: '2', label: '₦100', amount: 100 },
      { id: '3', label: '₦150', amount: 150 },
      { id: '4', label: 'Try Again', amount: 0, isTryAgain: true },
    ];
  }
  if (d.includes('tuesday')) {
    return [
      { id: '1', label: '₦100', amount: 100 },
      { id: '2', label: '₦150', amount: 150 },
      { id: '3', label: '₦200', amount: 200 },
      { id: '4', label: 'Try Again', amount: 0, isTryAgain: true },
    ];
  }
  if (d.includes('wednesday')) {
    return [
      { id: '1', label: '₦150', amount: 150 },
      { id: '2', label: '₦200', amount: 200 },
      { id: '3', label: '₦250', amount: 250 },
      { id: '4', label: 'Try Again', amount: 0, isTryAgain: true },
    ];
  }
  if (d.includes('thursday')) {
    return [
      { id: '1', label: '₦200', amount: 200 },
      { id: '2', label: '₦250', amount: 250 },
      { id: '3', label: '₦300', amount: 300 },
      { id: '4', label: 'Try Again', amount: 0, isTryAgain: true },
    ];
  }
  if (d.includes('friday')) {
    return [
      { id: '1', label: '₦250', amount: 250 },
      { id: '2', label: '₦300', amount: 300 },
      { id: '3', label: '₦350', amount: 350 },
      { id: '4', label: 'Try Again', amount: 0, isTryAgain: true },
    ];
  }
  if (d.includes('saturday')) {
    return [
      { id: '1', label: '₦300', amount: 300 },
      { id: '2', label: '₦350', amount: 350 },
      { id: '3', label: '₦400', amount: 400 },
      { id: '4', label: 'Try Again', amount: 0, isTryAgain: true },
    ];
  }
  // Sunday
  return [
    { id: '1', label: '₦350', amount: 350 },
    { id: '2', label: '₦400', amount: 400 },
    { id: '3', label: '₦500', amount: 500 },
    { id: '4', label: 'Try Again', amount: 0, isTryAgain: true },
  ];
}

export default function DailyCheckInScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { isDark } = useAppTheme();
  const t = getAppTheme(isDark);
  const { days, weekStart, isLoading, isCheckingIn, checkIn, refresh } = useDailyCheckIn();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Success Splash State
  const [rewardSplash, setRewardSplash] = useState<{ amount: number; reward: string } | null>(null);
  const [splashOpacity] = useState(() => new Animated.Value(0));
  const [splashScale] = useState(() => new Animated.Value(0.82));

  // Daily Spin Modal State
  const [activeSpinDay, setActiveSpinDay] = useState<CheckInDay | null>(null);
  const [spinOptions, setSpinOptions] = useState<SpinOption[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [landedTryAgain, setLandedTryAgain] = useState(false);
  const spinTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const availableDay = days.find((day) => day.status === 'Available');
  const completedCount = days.filter((day) => day.status === 'Completed').length;

  const handleOpenSpin = (day: CheckInDay) => {
    if (day.status !== 'Available') return;
    const options = getDaySpinOptions(day.dayName);
    setSpinOptions(options);
    setActiveSpinDay(day);
    setLandedTryAgain(false);
    setHighlightedIndex(0);
  };

  const handleSpinReel = () => {
    if (isSpinning || !activeSpinDay || spinOptions.length === 0) return;
    setIsSpinning(true);
    setLandedTryAgain(false);

    // Pick target: 25% chance of Try Again, 75% chance of one of the cash prizes
    const cashOptions = spinOptions.filter((o) => !o.isTryAgain);
    const tryAgainOption = spinOptions.find((o) => o.isTryAgain);

    const willTryAgain = Math.random() < 0.25 && !!tryAgainOption;
    const targetOption = willTryAgain
      ? tryAgainOption!
      : cashOptions[Math.floor(Math.random() * cashOptions.length)];

    const targetIdx = spinOptions.findIndex((o) => o.id === targetOption.id);

    let currentIndex = highlightedIndex;
    let stepCount = 0;
    const totalSteps = 24 + targetIdx; // at least 6 full cycles before landing

    if (spinTimerRef.current) clearInterval(spinTimerRef.current);

    spinTimerRef.current = setInterval(() => {
      stepCount++;
      currentIndex = (currentIndex + 1) % spinOptions.length;
      setHighlightedIndex(currentIndex);

      if (stepCount >= totalSteps) {
        if (spinTimerRef.current) clearInterval(spinTimerRef.current);
        spinTimerRef.current = null;
        setHighlightedIndex(targetIdx);

        setTimeout(async () => {
          if (targetOption.isTryAgain) {
            setIsSpinning(false);
            setLandedTryAgain(true);
          } else {
            try {
              const res = await checkIn(targetOption.amount);
              setIsSpinning(false);
              setActiveSpinDay(null);
              setRewardSplash(res);
            } catch (err) {
              setIsSpinning(false);
              show({
                message: err instanceof Error ? err.message : 'Failed to claim reward.',
                variant: 'error',
              });
            }
          }
        }, 300);
      }
    }, 75);
  };

  useEffect(() => {
    return () => {
      if (spinTimerRef.current) clearInterval(spinTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!rewardSplash) return;
    splashOpacity.setValue(0);
    splashScale.setValue(0.82);
    Animated.parallel([
      Animated.timing(splashOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(splashScale, {
        toValue: 1,
        friction: 7,
        tension: 58,
        useNativeDriver: true,
      }),
    ]).start();
  }, [rewardSplash, splashOpacity, splashScale]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } catch (error) {
      show({
        message: error instanceof Error ? error.message : 'Unable to refresh check-ins.',
        variant: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.pageBg }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.container, { backgroundColor: t.pageBg }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={19} color={t.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.eyebrow, { color: t.brand }]}>DAILY MYSTERY REWARDS</Text>
            <Text style={[styles.title, { color: t.textPrimary }]}>Daily Check-In</Text>
          </View>
          <View style={[styles.weekIcon, { backgroundColor: t.brandTint }]}>
            <HugeiconsIcon icon={Calendar03Icon} size={19} color={t.brand} />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#FFFFFF"
              colors={['#FFFFFF']}
              progressBackgroundColor={t.brand}
            />
          }
          contentContainerStyle={styles.content}>
          {/* Hero Banner Card */}
          <View style={styles.heroCard}>
            <Svg style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="heroCheckinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={GRADIENT_STOPS.from} />
                  <Stop offset="100%" stopColor={GRADIENT_STOPS.to} />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" rx={24} fill="url(#heroCheckinGrad)" />
            </Svg>

            <View style={styles.heroOrb} pointerEvents="none" />
            <View style={styles.heroTopRow}>
              <View style={styles.heroIcon}>
                <HugeiconsIcon icon={SparklesIcon} size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.heroKicker}>{weekStart ? `Week of ${weekStart}` : 'Monday — Sunday Cycle'}</Text>
            </View>

            <Text style={styles.heroTitle}>Spin each day to unlock rewards.</Text>
            <Text style={styles.heroCopy}>
              Check-in is always by spinning! Prize figures remain hidden until you spin to reveal them.
            </Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round((completedCount / 7) * 100)}%` }]} />
            </View>
            <Text style={styles.progressText}>{completedCount} of 7 days completed</Text>
          </View>

          {/* Today's Active Mystery Spin Card if Available */}
          {availableDay && (
            <View style={[styles.todayCard, { backgroundColor: t.cardBg, borderColor: t.brand }]}>
              <View style={[styles.todayIcon, { backgroundColor: t.brandTint }]}>
                <HugeiconsIcon icon={Clock01Icon} size={20} color={t.brand} />
              </View>
              <View style={styles.todayCopy}>
                <Text style={[styles.todayEyebrow, { color: t.brand }]}>TODAY&apos;S CHECK-IN</Text>
                <Text style={[styles.todayTitle, { color: t.textPrimary }]}>{availableDay.dayName}</Text>
                <Text style={[styles.todayReward, { color: t.textSecondary }]}>
                  Mystery Cash Reward • Spin to Reveal
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.checkButton, { backgroundColor: t.brand }]}
                onPress={() => handleOpenSpin(availableDay)}
                disabled={isCheckingIn}
                activeOpacity={0.84}>
                {isCheckingIn ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.checkButtonText}>Spin 🎰</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Weekly Streak Schedule & Mystery Statuses */}
          <View style={styles.sectionHeading}>
            <View>
              <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Weekly Reward Schedule</Text>
              <Text style={[styles.sectionSubtitle, { color: t.textSecondary }]}>
                Monday through Sunday • Figures unlocked upon spin
              </Text>
            </View>
            <Text style={[styles.countLabel, { color: t.brand }]}>{completedCount}/7</Text>
          </View>

          <View style={[styles.daysCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
            {isLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color={t.brand} />
                <Text style={[styles.loadingText, { color: t.textSecondary }]}>Loading weekly rewards...</Text>
              </View>
            ) : (
              days.map((day, index) => (
                <DayRow
                  key={day.date}
                  day={day}
                  isLast={index === days.length - 1}
                  theme={t}
                  isCheckingIn={isCheckingIn}
                  onCheckIn={() => handleOpenSpin(day)}
                />
              ))
            )}
          </View>

          <Text style={[styles.footnote, { color: t.muted }]}>
            Rewards are credited immediately to your live transaction balance after check-in.
          </Text>
        </ScrollView>
      </View>

      {/* Daily Spin Wheel / Reel Modal */}
      <Modal
        visible={activeSpinDay !== null}
        transparent
        animationType="fade"
        onRequestClose={() => !isSpinning && setActiveSpinDay(null)}>
        <View style={styles.spinModalOverlay}>
          <View style={[styles.spinCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
            <View style={[styles.spinHeaderBadge, { backgroundColor: t.brandTint }]}>
              <Text style={[styles.spinBadgeText, { color: t.brand }]}>
                🎰 {activeSpinDay?.dayName.toUpperCase()} LUCKY SPIN
              </Text>
            </View>

            <Text style={[styles.spinTitle, { color: t.textPrimary }]}>Spin to Unlock Cash Prize</Text>
            <Text style={[styles.spinSubtitle, { color: t.textSecondary }]}>
              Figures are only revealed on the wheel. Spin now to see what you win!
            </Text>

            {/* Central Animated Reel Display */}
            <View
              style={[
                styles.spinReelBox,
                {
                  backgroundColor: isDark ? '#0C1326' : '#F1F5F9',
                  borderColor: spinOptions[highlightedIndex]?.isTryAgain ? '#F59E0B' : t.brand,
                },
              ]}>
              {spinOptions[highlightedIndex]?.isTryAgain ? (
                <View style={styles.tryAgainReelWrap}>
                  <Text style={styles.tryAgainIcon}>🔄</Text>
                  <Text style={styles.tryAgainReelText}>Try Again</Text>
                </View>
              ) : (
                <View style={styles.cashReelWrap}>
                  <Text style={styles.spinCurrency}>₦</Text>
                  <Text style={[styles.spinValueNumber, { color: t.brand }]}>
                    {spinOptions[highlightedIndex]?.amount ?? '???'}
                  </Text>
                </View>
              )}
            </View>

            {/* Options Strip Preview */}
            <Text style={[styles.optionsLabel, { color: t.textSecondary }]}>Available Outcomes Today:</Text>
            <View style={styles.spinPillsRow}>
              {spinOptions.map((opt, idx) => {
                const isSelected = highlightedIndex === idx;
                return (
                  <View
                    key={opt.id}
                    style={[
                      styles.spinPillItem,
                      {
                        backgroundColor: isSelected
                          ? opt.isTryAgain
                            ? '#F59E0B'
                            : t.brand
                          : t.cardBg,
                        borderColor: isSelected
                          ? opt.isTryAgain
                            ? '#F59E0B'
                            : t.brand
                          : t.cardBorder,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.spinPillText,
                        {
                          color: isSelected
                            ? '#FFFFFF'
                            : opt.isTryAgain
                            ? '#F59E0B'
                            : t.textPrimary,
                        },
                      ]}>
                      {opt.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* If landed on Try Again banner */}
            {landedTryAgain && (
              <View style={styles.tryAgainBanner}>
                <Text style={styles.tryAgainBannerText}>
                  Almost had it! You got &quot;Try Again&quot;. Spin once more! 🔄
                </Text>
              </View>
            )}

            {/* Spin CTA Button */}
            <TouchableOpacity
              style={[styles.spinActionBtn, isSpinning && { opacity: 0.7 }]}
              onPress={handleSpinReel}
              disabled={isSpinning}
              activeOpacity={0.85}>
              {isSpinning ? (
                <View style={styles.spinBtnContent}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.spinActionBtnText}>Spinning...</Text>
                </View>
              ) : (
                <Text style={styles.spinActionBtnText}>
                  {landedTryAgain ? 'Spin Again 🔄' : 'Spin to Reveal 🎰'}
                </Text>
              )}
            </TouchableOpacity>

            {!isSpinning && (
              <TouchableOpacity
                style={styles.spinCloseBtn}
                onPress={() => setActiveSpinDay(null)}
                activeOpacity={0.7}>
                <Text style={[styles.spinCloseText, { color: t.muted }]}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Success Celebration Splash Modal */}
      <Modal
        visible={rewardSplash !== null}
        transparent
        animationType="none"
        onRequestClose={() => setRewardSplash(null)}>
        <Animated.View style={[styles.rewardBackdrop, { opacity: splashOpacity }]}>
          <Animated.View
            style={[styles.rewardCard, { backgroundColor: t.cardBg, transform: [{ scale: splashScale }] }]}
            accessibilityViewIsModal>
            <View style={[styles.rewardIcon, { backgroundColor: t.successTint }]}>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={42} color={t.success} />
            </View>
            <Text style={[styles.rewardEyebrow, { color: t.success }]}>CHECK-IN COMPLETE</Text>
            <Text style={[styles.rewardTitle, { color: t.textPrimary }]}>You won</Text>
            <Text style={[styles.rewardAmount, { color: t.brand }]}>
              ₦{rewardSplash?.amount.toLocaleString('en-NG')}
            </Text>
            <Text style={[styles.rewardSubtitle, { color: t.textSecondary }]}>{rewardSplash?.reward}</Text>
            <Text style={[styles.rewardNote, { color: t.muted }]}>
              Your reward has been credited to your transaction balance.
            </Text>
            <TouchableOpacity
              style={[styles.rewardButton, { backgroundColor: t.brand }]}
              onPress={() => setRewardSplash(null)}
              activeOpacity={0.84}>
              <Text style={styles.rewardButtonText}>Awesome, Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

function DayRow({
  day,
  isLast,
  theme: t,
  isCheckingIn,
  onCheckIn,
}: {
  day: CheckInDay;
  isLast: boolean;
  theme: ReturnType<typeof getAppTheme>;
  isCheckingIn: boolean;
  onCheckIn: () => void;
}) {
  const isCompleted = day.status === 'Completed';
  const isAvailable = day.status === 'Available';
  const isMissed = day.status === 'Missed';

  return (
    <View
      style={[
        styles.dayRow,
        !isLast && { borderBottomColor: t.divider, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}>
      {/* Day initial / icon */}
      <View
        style={[
          styles.dayIcon,
          {
            backgroundColor: isCompleted
              ? t.successTint
              : isAvailable
              ? t.brandTint
              : isMissed
              ? 'rgba(239, 68, 68, 0.12)'
              : t.chipBg,
          },
        ]}>
        {isCompleted ? (
          <HugeiconsIcon icon={Tick02Icon} size={18} color={t.success} />
        ) : (
          <Text
            style={[
              styles.dayInitial,
              {
                color: isCompleted
                  ? t.success
                  : isAvailable
                  ? t.brand
                  : isMissed
                  ? '#EF4444'
                  : t.muted,
              },
            ]}>
            {day.dayName.slice(0, 1)}
          </Text>
        )}
      </View>

      {/* Info: Day name & Mystery or Won amount */}
      <View style={styles.dayInfo}>
        <View style={styles.dayNameRow}>
          <Text style={[styles.dayName, { color: t.textPrimary }]}>{day.dayName}</Text>
          {isAvailable && (
            <View style={[styles.todayBadge, { backgroundColor: t.brandTint }]}>
              <Text style={[styles.todayBadgeText, { color: t.brand }]}>TODAY</Text>
            </View>
          )}
        </View>
        <Text style={[styles.dayReward, { color: isCompleted ? t.success : t.textSecondary }]}>
          {isCompleted ? day.reward : 'Mystery Reward • Spin to Reveal'}
        </Text>
      </View>

      {/* Status or Spin Button */}
      <View style={styles.dayStatusWrap}>
        {isAvailable ? (
          <TouchableOpacity
            style={[styles.rowCheckInBtn, { backgroundColor: t.brand }]}
            onPress={onCheckIn}
            disabled={isCheckingIn}
            activeOpacity={0.82}>
            {isCheckingIn ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.rowCheckInBtnText}>Spin 🎰</Text>
            )}
          </TouchableOpacity>
        ) : isCompleted ? (
          <View style={[styles.statusPill, { backgroundColor: t.successTint }]}>
            <HugeiconsIcon icon={Tick02Icon} size={12} color={t.success} />
            <Text style={[styles.statusPillText, { color: t.success }]}>Completed</Text>
          </View>
        ) : isMissed ? (
          <View style={[styles.statusPill, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Text style={[styles.statusPillText, { color: '#EF4444' }]}>Missed</Text>
          </View>
        ) : (
          <View style={[styles.statusPill, { backgroundColor: t.chipBg }]}>
            <Text style={[styles.statusPillText, { color: t.muted }]}>Locked 🔒</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, width: '100%', maxWidth: 440, alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: { flex: 1, marginLeft: 13 },
  eyebrow: { fontFamily: 'Montserrat_700Bold', fontSize: 9, letterSpacing: 1.2 },
  title: { fontFamily: 'Montserrat_700Bold', fontSize: 20, marginTop: 2 },
  weekIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingBottom: 34 },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: '#1E2B6B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 16 },
      android: { elevation: 6 },
      web: { shadowColor: '#1E2B6B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 16 },
    }),
  },
  heroOrb: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -50,
    top: -66,
    backgroundColor: '#FFFFFF',
    opacity: 0.12,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  heroIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroKicker: { fontFamily: 'Montserrat_600SemiBold', color: 'rgba(255,255,255,0.78)', fontSize: 11 },
  heroTitle: { fontFamily: 'Montserrat_700Bold', color: '#FFFFFF', fontSize: 22, marginTop: 18 },
  heroCopy: {
    fontFamily: 'Montserrat_400Regular',
    color: 'rgba(255,255,255,0.76)',
    fontSize: 11.5,
    lineHeight: 18,
    marginTop: 7,
    maxWidth: 320,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 20,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: '#FFFFFF' },
  progressText: {
    fontFamily: 'Montserrat_600SemiBold',
    color: 'rgba(255,255,255,0.78)',
    fontSize: 10,
    marginTop: 8,
  },
  todayCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: '#2E45F4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10 },
      android: { elevation: 3 },
      web: { shadowColor: '#2E45F4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10 },
    }),
  },
  todayIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  todayCopy: { flex: 1, marginLeft: 11 },
  todayEyebrow: { fontFamily: 'Montserrat_700Bold', fontSize: 9, letterSpacing: 0.8 },
  todayTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 15, marginTop: 2 },
  todayReward: { fontFamily: 'Montserrat_500Medium', fontSize: 11, marginTop: 2 },
  checkButton: {
    minWidth: 84,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  checkButtonText: { fontFamily: 'Montserrat_700Bold', fontSize: 11, color: '#FFFFFF' },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  sectionTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 17 },
  sectionSubtitle: { fontFamily: 'Montserrat_400Regular', fontSize: 10.5, marginTop: 4 },
  countLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 18 },
  daysCard: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 15 },
  dayRow: { minHeight: 69, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  dayIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dayInitial: { fontFamily: 'Montserrat_700Bold', fontSize: 14 },
  dayInfo: { flex: 1, marginLeft: 11 },
  dayNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dayName: { fontFamily: 'Montserrat_700Bold', fontSize: 13 },
  todayBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  todayBadgeText: { fontFamily: 'Montserrat_700Bold', fontSize: 8.5 },
  dayReward: { fontFamily: 'Montserrat_400Regular', fontSize: 10.5, marginTop: 3 },
  dayStatusWrap: { alignItems: 'flex-end' },
  rowCheckInBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCheckInBtnText: { fontFamily: 'Montserrat_700Bold', fontSize: 10.5, color: '#FFFFFF' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusPillText: { fontFamily: 'Montserrat_700Bold', fontSize: 10 },
  loadingState: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontFamily: 'Montserrat_500Medium', fontSize: 11 },
  footnote: { fontFamily: 'Montserrat_400Regular', fontSize: 10, textAlign: 'center', marginTop: 16 },
  spinModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 12, 34, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  spinCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  spinHeaderBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  spinBadgeText: { fontFamily: 'Montserrat_700Bold', fontSize: 10, letterSpacing: 0.8 },
  spinTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 19, textAlign: 'center' },
  spinSubtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
  spinReelBox: {
    width: '100%',
    height: 106,
    borderRadius: 20,
    borderWidth: 2,
    marginVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryAgainReelWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryAgainIcon: {
    fontSize: 28,
  },
  tryAgainReelText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 22,
    color: '#F59E0B',
    marginTop: 4,
  },
  cashReelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinCurrency: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 26,
    color: '#94A3B8',
    marginRight: 4,
  },
  spinValueNumber: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 48,
    letterSpacing: -1,
  },
  optionsLabel: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 10.5,
    marginBottom: 8,
  },
  spinPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  spinPillItem: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  spinPillText: { fontFamily: 'Montserrat_700Bold', fontSize: 11.5 },
  tryAgainBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
    width: '100%',
  },
  tryAgainBannerText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 11,
    color: '#D97706',
    textAlign: 'center',
  },
  spinActionBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#2E45F4',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#2E45F4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 3 },
      web: { shadowColor: '#2E45F4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    }),
  },
  spinBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spinActionBtnText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  spinCloseBtn: {
    marginTop: 12,
    paddingVertical: 6,
  },
  spinCloseText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 11 },
  rewardBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(3, 7, 25, 0.72)',
  },
  rewardCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 24,
  },
  rewardIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  rewardEyebrow: { fontFamily: 'Montserrat_700Bold', fontSize: 10, letterSpacing: 1.1 },
  rewardTitle: { fontFamily: 'Montserrat_600SemiBold', fontSize: 17, marginTop: 12 },
  rewardAmount: { fontFamily: 'Montserrat_700Bold', fontSize: 38, marginTop: 3 },
  rewardSubtitle: { fontFamily: 'Montserrat_500Medium', fontSize: 11, marginTop: 6 },
  rewardNote: { fontFamily: 'Montserrat_400Regular', fontSize: 10.5, textAlign: 'center', marginTop: 16 },
  rewardButton: {
    width: '100%',
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  rewardButtonText: { fontFamily: 'Montserrat_700Bold', fontSize: 12, color: '#FFFFFF' },
});
