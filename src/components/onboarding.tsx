import { Moon02Icon, Sun03Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getAppTheme } from '@/constants/app-theme';
import { useAppTheme } from '@/hooks/theme-provider';
import { AVAILABLE_AVATARS, useUserProfile } from '@/hooks/user-profile-provider';

type SlideData = {
  id: string;
  type?: 'intro' | 'avatar';
  badge: string;
  image?: ImageSourcePropType;
  title: string;
  description: string;
  isWide?: boolean;
};

const SLIDES: SlideData[] = [
  {
    id: '1',
    type: 'intro',
    badge: 'NEARBY PAYMENTS',
    image: require('@/assets/images/ill/both-nobg.png'),
    title: 'Welcome to NearbyPay',
    description: 'The effortless way to pay and transfer money nearby with bank-grade security.',
    isWide: true,
  },
  {
    id: '2',
    type: 'intro',
    badge: 'FAST & SECURE',
    image: require('@/assets/images/ill/man.png'),
    title: 'Instant Transfers',
    description: 'Protected with cutting-edge encryption. Experience lightning-fast, zero-delay transactions.',
    isWide: false,
  },
  {
    id: '3',
    type: 'intro',
    badge: 'CONTACTLESS FREEDOM',
    image: require('@/assets/images/ill/woman.png'),
    title: 'Nearby Freedom',
    description: 'Join thousands enjoying the modern standard for proximity payments anywhere, anytime.',
    isWide: false,
  },
  {
    id: '4',
    type: 'avatar',
    badge: 'CHOOSE YOUR AVATAR',
    title: 'Select Profile Memo',
    description: 'Choose a memo avatar for your profile. This will be visible to nearby merchants and contacts.',
  },
];

interface OnboardingProps {
  onFinish: () => void;
}

export function Onboarding({ onFinish }: OnboardingProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isDark, setMode } = useAppTheme();
  const t = getAppTheme(isDark);
  const { profile, updateAvatar } = useUserProfile();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatar || AVAILABLE_AVATARS[0]);
  const flatListRef = useRef<FlatList<SlideData>>(null);

  // Proportional responsive sizes
  const illustrationContainerHeight = Math.min(Math.max(height * 0.36, 220), 300);
  const backdropSize = Math.min(illustrationContainerHeight * 0.88, 240);

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
      // Final slide: save chosen avatar and finish
      updateAvatar(selectedAvatar);
      onFinish();
    }
  };

  const handleSkip = () => {
    updateAvatar(selectedAvatar);
    onFinish();
  };

  const handleDotPress = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  };

  const renderIntroSlide = (item: SlideData) => {
    return (
      <View style={[styles.slide, { width }]}>
        {/* Visual Stage & Illustration */}
        <View style={[styles.illustrationWrapper, { height: illustrationContainerHeight }]}>
          <View
            style={[
              styles.backdropCircle,
              {
                width: backdropSize,
                height: backdropSize,
                borderRadius: backdropSize / 2,
                backgroundColor: isDark ? 'rgba(93, 124, 255, 0.16)' : 'rgba(43, 32, 240, 0.06)',
              },
            ]}
          />
          {item.image && (
            <Image
              source={item.image}
              style={[
                styles.illustrationImage,
                item.isWide
                  ? { width: width * 0.85, height: illustrationContainerHeight * 0.85 }
                  : { width: width * 0.7, height: illustrationContainerHeight * 0.95 },
              ]}
              contentFit="contain"
            />
          )}
        </View>

        {/* Content & Typography */}
        <View style={styles.textContainer}>
          <View style={[styles.badgeChip, { backgroundColor: t.brandTint }]}>
            <Text style={[styles.badgeText, { color: t.brand }]}>{item.badge}</Text>
          </View>

          <Text style={[styles.title, { color: t.textPrimary }]}>{item.title}</Text>

          <Text style={[styles.description, { color: t.textSecondary }]}>{item.description}</Text>
        </View>
      </View>
    );
  };

  const renderAvatarSlide = (item: SlideData) => {
    return (
      <View style={[styles.slide, { width }]}>
        {/* Centered Preview Ring */}
        <View style={styles.avatarSlidePreviewWrap}>
          <View style={[styles.avatarPreviewRing, { borderColor: t.brand, backgroundColor: t.brandTint }]}>
            <Image
              source={{ uri: selectedAvatar }}
              style={styles.avatarPreviewImg}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          </View>
        </View>

        {/* Typography */}
        <View style={styles.textContainer}>
          <View style={[styles.badgeChip, { backgroundColor: t.brandTint }]}>
            <Text style={[styles.badgeText, { color: t.brand }]}>{item.badge}</Text>
          </View>

          <Text style={[styles.title, { color: t.textPrimary }]}>{item.title}</Text>
          <Text style={[styles.description, { color: t.textSecondary }]}>{item.description}</Text>
        </View>

        {/* Avatars Grid (Preloaded in memory/disk cache) */}
        <View style={[styles.avatarGridContainer, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
          <ScrollView
            style={styles.avatarGridScroll}
            contentContainerStyle={styles.avatarGridContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.avatarGrid}>
              {AVAILABLE_AVATARS.map((url) => {
                const isSelected = selectedAvatar === url;
                return (
                  <TouchableOpacity
                    key={url}
                    style={[
                      styles.avatarGridSlot,
                      {
                        backgroundColor: isSelected ? t.brandTint : t.chipBg,
                        borderColor: isSelected ? t.brand : 'transparent',
                      },
                    ]}
                    activeOpacity={0.75}
                    onPress={() => setSelectedAvatar(url)}>
                    <Image
                      source={{ uri: url }}
                      style={styles.avatarGridImg}
                      contentFit="contain"
                      cachePolicy="memory-disk"
                    />

                    {isSelected && (
                      <View style={[styles.avatarGridCheck, { backgroundColor: t.brand, borderColor: t.cardBg }]}>
                        <HugeiconsIcon icon={Tick02Icon} size={9} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderSlide = ({ item }: { item: SlideData }) => {
    if (item.type === 'avatar') {
      return renderAvatarSlide(item);
    }
    return renderIntroSlide(item);
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: t.pageBg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

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
            contentFit="contain"
            accessibilityLabel="NearbyPay Logo"
          />
          <Text style={[styles.brandName, { color: t.textPrimary }]}>NearbyPay</Text>
        </View>

        <View style={styles.topRightActions}>
          <TouchableOpacity
            onPress={() => setMode(isDark ? 'light' : 'dark')}
            style={[styles.themeToggleBtn, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Toggle dark/light mode">
            <HugeiconsIcon icon={isDark ? Sun03Icon : Moon02Icon} size={16} color={t.textPrimary} />
          </TouchableOpacity>

          {!isLastSlide ? (
            <TouchableOpacity
              onPress={handleSkip}
              hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
              style={[styles.skipButton, { backgroundColor: t.chipBg }]}>
              <Text style={[styles.skipText, { color: t.textSecondary }]}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.skipPlaceholder} />
          )}
        </View>
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
                    backgroundColor: isActive ? t.brand : isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Primary CTA Button */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: t.brand, shadowColor: t.brand }]}
          onPress={handleNext}
          activeOpacity={0.88}>
          <Text style={styles.primaryButtonText}>
            {isLastSlide ? 'Save & Get Started' : 'Continue'}
          </Text>
          <Text style={styles.buttonArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeToggleBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 34,
  },
  carousel: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  illustrationWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
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
    marginBottom: 8,
  },
  badgeText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 11,
    letterSpacing: 1.1,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  description: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
  },

  /* Avatar Slide Specific */
  avatarSlidePreviewWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarPreviewRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2.5,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8 },
      android: { elevation: 3 },
      web: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8 },
    }),
  },
  avatarPreviewImg: {
    width: 66,
    height: 66,
    borderRadius: 33,
  },
  avatarGridContainer: {
    width: '100%',
    maxHeight: 180,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 14,
    padding: 10,
    overflow: 'hidden',
  },
  avatarGridScroll: {
    flexGrow: 0,
  },
  avatarGridContent: {
    paddingVertical: 4,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  avatarGridSlot: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarGridImg: {
    width: '84%',
    height: '84%',
    borderRadius: 18,
  },
  avatarGridCheck: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },

  /* Footer */
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 16,
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
    height: 52,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
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
