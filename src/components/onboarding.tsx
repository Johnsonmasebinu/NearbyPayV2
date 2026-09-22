import React, { useRef, useState } from 'react';
import {
  FlatList,
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

type SlideData = {
  id: string;
  badge: string;
  image: ImageSourcePropType;
  title: string;
  description: string;
  isWide?: boolean;
};

const PRIMARY_COLOR = '#2B20F0';

const SLIDES: SlideData[] = [
  {
    id: '1',
    badge: 'NEARBY PAYMENTS',
    image: require('@/assets/images/ill/both-nobg.png'),
    title: 'Welcome to NearbyPay',
    description: 'The effortless way to pay and transfer money nearby with bank-grade security.',
    isWide: true,
  },
  {
    id: '2',
    badge: 'FAST & SECURE',
    image: require('@/assets/images/ill/man.png'),
    title: 'Instant Transfers',
    description: 'Protected with cutting-edge encryption. Experience lightning-fast, zero-delay transactions.',
    isWide: false,
  },
  {
    id: '3',
    badge: 'CONTACTLESS FREEDOM',
    image: require('@/assets/images/ill/woman.png'),
    title: 'Ready to Get Started',
    description: 'Join thousands enjoying the modern standard for proximity payments anywhere, anytime.',
    isWide: false,
  },
];

interface OnboardingProps {
  onFinish: () => void;
}

export function Onboarding({ onFinish }: OnboardingProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<SlideData>>(null);

  // Proportional responsive sizes
  const illustrationContainerHeight = Math.min(Math.max(height * 0.38, 240), 320);
  const backdropSize = Math.min(illustrationContainerHeight * 0.88, 250);

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);
    if (newIndex >= 0 && newIndex < SLIDES.length) {
      setCurrentIndex(newIndex);
    }
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      onFinish();
    }
  };

  const handleSkip = () => {
    onFinish();
  };

  const handleDotPress = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  };

  const renderSlide = ({ item }: { item: SlideData }) => {
    return (
      <View style={[styles.slide, { width }]}>
        {/* Visual Stage & Illustration */}
        <View style={[styles.illustrationWrapper, { height: illustrationContainerHeight }]}>
          {/* Subtle ambient backdrop circle to anchor illustrations */}
          <View
            style={[
              styles.backdropCircle,
              {
                width: backdropSize,
                height: backdropSize,
                borderRadius: backdropSize / 2,
                backgroundColor: isDark ? 'rgba(43, 32, 240, 0.16)' : 'rgba(43, 32, 240, 0.06)',
              },
            ]}
          />
          <Image
            source={item.image}
            style={[
              styles.illustrationImage,
              item.isWide
                ? { width: width * 0.85, height: illustrationContainerHeight * 0.85 }
                : { width: width * 0.7, height: illustrationContainerHeight * 0.95 },
            ]}
            resizeMode="contain"
          />
        </View>

        {/* Content & Typography */}
        <View style={styles.textContainer}>
          {/* Category Chip */}
          <View
            style={[
              styles.badgeChip,
              {
                backgroundColor: isDark
                  ? 'rgba(43, 32, 240, 0.22)'
                  : 'rgba(43, 32, 240, 0.08)',
              },
            ]}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>

          {/* Scaled & Refined Title */}
          <ThemedText style={styles.title}>{item.title}</ThemedText>

          {/* Description */}
          <Text
            style={[
              styles.description,
              { color: isDark ? '#94A3B8' : '#64748B' },
            ]}>
            {item.description}
          </Text>
        </View>
      </View>
    );
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <ThemedView style={styles.container}>
      {/* Top Header Bar */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 16),
          },
        ]}>
        <View style={styles.brandRow}>
          <Image
            source={require('@/assets/images/logo/logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
            accessibilityLabel="NearbyPay Logo"
          />
          <Text
            style={[
              styles.brandName,
              { color: isDark ? '#F1F5F9' : '#0F172A' },
            ]}>
            NearbyPay
          </Text>
        </View>

        {!isLastSlide ? (
          <TouchableOpacity
            onPress={handleSkip}
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
            style={styles.skipButton}>
            <Text
              style={[
                styles.skipText,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}>
              Skip
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}
      </View>

      {/* Main Slides Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        style={styles.carousel}
      />

      {/* Modern Footer with Dots and Action Button */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}>
        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, index) => {
            const isActive = currentIndex === index;
            return (
              <TouchableOpacity
                key={index.toString()}
                onPress={() => handleDotPress(index)}
                hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                activeOpacity={0.8}
                style={[
                  styles.dot,
                  isActive ? styles.activeDot : styles.inactiveDot,
                  {
                    backgroundColor: isActive
                      ? PRIMARY_COLOR
                      : isDark
                      ? '#334155'
                      : '#E2E8F0',
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Primary CTA Button */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleNext}
          activeOpacity={0.88}>
          <Text style={styles.primaryButtonText}>
            {isLastSlide ? 'Get Started' : 'Continue'}
          </Text>
          <Text style={styles.buttonArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 8,
    zIndex: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogo: {
    width: 30,
    height: 30,
  },
  brandName: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  skipText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 14,
  },
  skipPlaceholder: {
    width: 44,
  },
  carousel: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  illustrationWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  backdropCircle: {
    position: 'absolute',
    alignSelf: 'center',
  },
  illustrationImage: {
    alignSelf: 'center',
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 12,
  },
  badgeChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    marginBottom: 12,
  },
  badgeText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 11,
    color: PRIMARY_COLOR,
    letterSpacing: 1.1,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  description: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
  activeDot: {
    width: 24,
  },
  inactiveDot: {
    width: 7,
  },
  primaryButton: {
    backgroundColor: PRIMARY_COLOR,
    height: 54,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButtonText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  buttonArrow: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 20,
  },
});
