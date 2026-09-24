import {
  ArrowLeft01Icon,
  Camera01Icon,
  CheckmarkCircle02Icon,
  LockPasswordIcon,
  Mail01Icon,
  RefreshIcon,
  SparklesIcon,
  Tick02Icon,
  UserIcon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Image as ExpoImage } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ImageBackground,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/theme-provider';
import { useAuth } from '@/hooks/auth-provider';
import { useUserProfile, AVAILABLE_AVATARS } from '@/hooks/user-profile-provider';
import { useToast } from '@/components/ui/toast';
import { AvatarPickerSheet } from '@/components/ui/avatar-picker-sheet';
import { ThemedText } from '@/components/themed-text';

interface SignupScreenProps {
  onCreateAccount?: () => void;
  onGoToLogin: () => void;
}

export function SignupScreen({ onCreateAccount, onGoToLogin }: SignupScreenProps) {
  const { isDark } = useAppTheme();
  const { signUp, signIn, generateUniqueUsername, resendVerificationEmail } = useAuth();
  const { profile } = useUserProfile();
  const { show } = useToast();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [chosenAvatar, setChosenAvatar] = useState(profile.avatar || AVAILABLE_AVATARS[0]);
  const [avatarSheetVisible, setAvatarSheetVisible] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [isVerificationPending, setIsVerificationPending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingUsername, setIsGeneratingUsername] = useState(false);
  const [focusedField, setFocusedField] = useState<'name' | 'username' | 'email' | 'password' | 'confirm' | null>(null);

  const generateSystemUsername = useCallback(async (nameSeed?: string) => {
    try {
      setIsGeneratingUsername(true);
      const generated = await generateUniqueUsername(nameSeed || fullName || 'pay');
      setUsername(generated);
    } catch {
      // fallback
    } finally {
      setIsGeneratingUsername(false);
    }
  }, [generateUniqueUsername, fullName]);

  useEffect(() => {
    let isMounted = true;
    generateUniqueUsername('pay').then((generated) => {
      if (isMounted) {
        setUsername((prev) => prev || generated);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [generateUniqueUsername]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown((c) => c - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleFullNameChange = (text: string) => {
    setFullName(text);
    if (text.trim().length >= 2) {
      generateSystemUsername(text);
    }
  };

  const handleContinue = () => {
    const trimmedName = fullName.trim();
    const cleanUsername = username.trim().toLowerCase().replace(/^[@$]/, '');

    if (!trimmedName || trimmedName.length < 2) {
      show({ message: 'Please enter your full name', variant: 'error' });
      return;
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      show({ message: 'Username must be at least 3 characters', variant: 'error' });
      return;
    }
    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      show({ message: 'Username can only contain letters, numbers, and underscores', variant: 'error' });
      return;
    }

    setStep(2);
  };

  const handleSignUp = async () => {
    if (isSubmitting) return;

    const trimmedName = fullName.trim();
    const cleanUsername = username.trim().toLowerCase().replace(/^[@$]/, '');
    const cleanEmail = email.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setStep(1);
      show({ message: 'Please enter your full name', variant: 'error' });
      return;
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      setStep(1);
      show({ message: 'Username must be at least 3 characters', variant: 'error' });
      return;
    }
    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setStep(1);
      show({ message: 'Username can only contain letters, numbers, and underscores', variant: 'error' });
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      show({ message: 'Please enter a valid email address', variant: 'error' });
      return;
    }
    if (password.length < 6) {
      show({ message: 'Password must be at least 6 characters', variant: 'error' });
      return;
    }
    if (password !== confirmPassword) {
      show({ message: 'Passwords do not match', variant: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await signUp({
        fullName: trimmedName,
        username: cleanUsername,
        email: cleanEmail,
        password,
        avatarUrl: chosenAvatar,
      });

      if (result.needsEmailVerification) {
        show({
          message: `Verification email sent to ${cleanEmail}! Please check your inbox.`,
          variant: 'success',
        });
        setIsVerificationPending(true);
      } else {
        show({ message: 'Account created! Welcome to NearbyPay.', variant: 'success' });
        onCreateAccount?.();
      }
    } catch (err: any) {
      show({ message: err.message || 'Signup failed. Please try again.', variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckConfirmed = async () => {
    try {
      setIsSubmitting(true);
      await signIn(email.trim(), password);
      show({ message: 'Account verified! Welcome to NearbyPay.', variant: 'success' });
      onCreateAccount?.();
    } catch {
      show({ message: 'Email confirmed! Please sign in.', variant: 'info' });
      onGoToLogin();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || isResending) return;
    try {
      setIsResending(true);
      await resendVerificationEmail(email.trim());
      setResendCooldown(60);
      show({
        message: `Verification link resent to ${email.trim()}! Please check your inbox.`,
        variant: 'success',
      });
    } catch (err: any) {
      show({ message: err.message || 'Failed to resend verification email', variant: 'error' });
    } finally {
      setIsResending(false);
    }
  };

  const handleOpenEmailApp = async () => {
    try {
      if (Platform.OS === 'ios') {
        const supported = await Linking.canOpenURL('message:');
        if (supported) {
          await Linking.openURL('message:');
          return;
        }
      }
      await Linking.openURL('mailto:');
    } catch {
      show({ message: 'Please open your email client to verify your account.', variant: 'info' });
    }
  };

  const pageBg = isDark ? '#020617' : '#EEF3FC';
  const cardBg = isDark ? '#0F172A' : '#FFFFFF';
  const cardBorder = isDark ? '#1E293B' : '#E4EAF6';
  const inputBg = isDark ? '#020617' : '#F8FAFC';
  const inputBorder = isDark ? '#1E293B' : '#E2E8F0';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const iconColor = isDark ? '#64748B' : '#94A3B8';

  return (
    <ImageBackground
      source={require('@/assets/images/bg/bg.png')}
      style={[styles.container, { backgroundColor: pageBg }]}
      imageStyle={styles.bgImage}
      resizeMode="cover">
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
              keyboardDismissMode="on-drag">
              <View style={styles.inner}>
                <View style={styles.brandRow}>
                  <View style={[styles.logoTile, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <Image
                      source={require('@/assets/images/logo/logo.png')}
                      style={styles.logo}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.brandTextCol}>
                    <Text style={[styles.brandName, { color: textPrimary }]}>NearbyPay</Text>
                    <Text style={[styles.brandTag, { color: textSecondary }]}>Send. Receive. Stay Close.</Text>
                  </View>
                </View>

                {isVerificationPending ? (
                  <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <View style={styles.verificationIconWrap}>
                      <View style={[styles.verificationIconCircle, { backgroundColor: isDark ? 'rgba(43, 32, 240, 0.16)' : '#EEF2FF' }]}>
                        <HugeiconsIcon icon={Mail01Icon} size={36} color="#2B20F0" />
                        <View style={styles.verificationCheckmarkBadge}>
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} color="#10B981" />
                        </View>
                      </View>
                    </View>

                    <ThemedText style={[styles.title, { textAlign: 'center', color: textPrimary }]}>
                      Verify your email
                    </ThemedText>
                    <Text style={[styles.subtitle, { textAlign: 'center', color: textSecondary, marginTop: -4 }]}>
                      We sent a verification link to your email address. Please click the link to confirm your account.
                    </Text>

                    {/* Email Pill Badge */}
                    <View style={[styles.emailPillCard, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                      <HugeiconsIcon icon={Mail01Icon} size={16} color="#2B20F0" />
                      <Text style={[styles.emailPillText, { color: textPrimary }]} numberOfLines={1}>
                        {email.trim()}
                      </Text>
                    </View>

                    {/* User profile preview pill */}
                    <View style={[styles.verifiedUserPill, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                      <ExpoImage
                        source={{ uri: chosenAvatar }}
                        style={styles.verifiedAvatarImg}
                        contentFit="contain"
                      />
                      <View style={styles.verifiedUserInfo}>
                        <Text style={[styles.verifiedUserName, { color: textPrimary }]}>{fullName.trim()}</Text>
                        <Text style={styles.verifiedUserTag}>@{username.trim().toLowerCase().replace(/^[@$]/, '')}</Text>
                      </View>
                    </View>

                    {/* Steps Helper Card */}
                    <View style={[styles.stepsGuideCard, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                      <Text style={[styles.stepsGuideTitle, { color: textPrimary }]}>Next steps:</Text>
                      <View style={styles.stepItemRow}>
                        <Text style={styles.stepNumberBullet}>1.</Text>
                        <Text style={[styles.stepItemText, { color: textSecondary }]}>
                          Open the verification email in your inbox (or spam).
                        </Text>
                      </View>
                      <View style={styles.stepItemRow}>
                        <Text style={styles.stepNumberBullet}>2.</Text>
                        <Text style={[styles.stepItemText, { color: textSecondary }]}>
                          Tap the <Text style={{ fontWeight: '700', color: textPrimary }}>Confirm Email</Text> link.
                        </Text>
                      </View>
                      <View style={styles.stepItemRow}>
                        <Text style={styles.stepNumberBullet}>3.</Text>
                        <Text style={[styles.stepItemText, { color: textSecondary }]}>
                          Return to NearbyPay and sign in to get started.
                        </Text>
                      </View>
                    </View>

                    {/* Primary action: Open Email App */}
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleOpenEmailApp}
                      activeOpacity={0.88}>
                      <Text style={styles.primaryButtonText}>Open Email App</Text>
                    </TouchableOpacity>

                    {/* Instant continue button */}
                    <TouchableOpacity
                      style={[styles.primaryButton, { backgroundColor: '#10B981', marginTop: 10 }]}
                      onPress={handleCheckConfirmed}
                      activeOpacity={0.88}>
                      <Text style={styles.primaryButtonText}>Continue to My Account</Text>
                    </TouchableOpacity>

                    {/* Secondary action: Proceed to Sign In */}
                    <TouchableOpacity
                      style={[styles.secondarySignInBtn, { backgroundColor: inputBg, borderColor: inputBorder }]}
                      onPress={onGoToLogin}
                      activeOpacity={0.85}>
                      <Text style={[styles.secondarySignInBtnText, { color: textPrimary }]}>Proceed to Sign In</Text>
                    </TouchableOpacity>

                    {/* Resend Verification Email Section */}
                    <View style={styles.resendSection}>
                      <Text style={[styles.resendPromptText, { color: textSecondary }]}>
                        {"Didn't receive the email?"}
                      </Text>
                      <TouchableOpacity
                        onPress={handleResendEmail}
                        disabled={resendCooldown > 0 || isResending}
                        hitSlop={8}
                        style={styles.resendBtnRow}>
                        {isResending ? (
                          <ActivityIndicator size="small" color="#2B20F0" />
                        ) : (
                          <>
                            <HugeiconsIcon
                              icon={RefreshIcon}
                              size={14}
                              color={resendCooldown > 0 ? textSecondary : '#2B20F0'}
                            />
                            <Text
                              style={[
                                styles.resendBtnText,
                                { color: resendCooldown > 0 ? textSecondary : '#2B20F0' },
                              ]}>
                              {resendCooldown > 0 ? `Resend link in ${resendCooldown}s` : 'Resend verification email'}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Wrong email link */}
                    <TouchableOpacity
                      onPress={() => {
                        setIsVerificationPending(false);
                        setStep(2);
                      }}
                      hitSlop={8}
                      style={styles.editEmailLinkTouch}>
                      <Text style={styles.editEmailLinkText}>Wrong email? Tap here to edit</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    {/* Step Progress & Navigation Header */}
                    <View style={styles.stepHeaderRow}>
                      <View style={styles.stepProgressContainer}>
                        <View style={styles.stepTrack}>
                          <View style={[styles.stepBar, { backgroundColor: '#2B20F0' }]} />
                          <View
                            style={[
                              styles.stepBar,
                              { backgroundColor: step === 2 ? '#2B20F0' : isDark ? '#1E293B' : '#E2E8F0' },
                            ]}
                          />
                        </View>
                        <Text style={[styles.stepBadgeText, { color: textSecondary }]}>
                          STEP {step} OF 2 • {step === 1 ? 'Profile & Cashtag' : 'Security & Login'}
                        </Text>
                      </View>

                      {step === 2 && (
                        <TouchableOpacity
                          onPress={() => setStep(1)}
                          hitSlop={8}
                          style={[styles.headerBackBtn, { backgroundColor: inputBg, borderColor: inputBorder }]}
                          accessibilityLabel="Go back to step 1">
                          <HugeiconsIcon icon={ArrowLeft01Icon} size={15} color={textPrimary} />
                          <Text style={[styles.headerBackText, { color: textPrimary }]}>Back</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {step === 1 ? (
                      <>
                        <ThemedText style={[styles.title, { color: textPrimary }]}>Create your account</ThemedText>
                        <Text style={[styles.subtitle, { color: textSecondary }]}>
                          Choose your profile avatar and unique NearbyPay Cashtag.
                        </Text>

                        {/* Profile Avatar Card - Tapping opens Bottom Sheet */}
                        <TouchableOpacity
                          style={[styles.avatarSelectorCard, { backgroundColor: inputBg, borderColor: inputBorder }]}
                          activeOpacity={0.8}
                          onPress={() => setAvatarSheetVisible(true)}>
                          <View style={styles.avatarCardLeft}>
                            <View style={[styles.avatarPreviewRing, { borderColor: '#2B20F0' }]}>
                              <ExpoImage
                                source={{ uri: chosenAvatar }}
                                style={styles.avatarPreviewImg}
                                contentFit="contain"
                                cachePolicy="memory-disk"
                              />
                              <View style={styles.cameraIconBadge}>
                                <HugeiconsIcon icon={Camera01Icon} size={11} color="#FFFFFF" strokeWidth={2} />
                              </View>
                            </View>
                            <View style={styles.avatarCardInfo}>
                              <Text style={[styles.avatarCardTitle, { color: textPrimary }]}>Profile Avatar</Text>
                              <Text style={[styles.avatarCardSubtitle, { color: textSecondary }]}>
                                Tap to select memo or upload photo
                              </Text>
                            </View>
                          </View>
                          <View style={styles.changePill}>
                            <Text style={styles.changePillText}>Change</Text>
                          </View>
                        </TouchableOpacity>

                        <View style={styles.fieldGroup}>
                          <Text style={[styles.label, { color: textPrimary }]}>Full name</Text>
                          <View
                            style={[
                              styles.inputWrap,
                              {
                                backgroundColor: inputBg,
                                borderColor: focusedField === 'name' ? '#2B20F0' : inputBorder,
                              },
                            ]}>
                            <HugeiconsIcon icon={UserIcon} size={18} color={iconColor} strokeWidth={1.8} />
                            <TextInput
                              value={fullName}
                              onChangeText={handleFullNameChange}
                              placeholder="Alex Morgan"
                              textContentType="name"
                              autoComplete="name"
                              returnKeyType="next"
                              placeholderTextColor={iconColor}
                              onFocus={() => setFocusedField('name')}
                              onBlur={() => setFocusedField(null)}
                              style={[styles.input, { color: textPrimary }]}
                            />
                          </View>
                        </View>

                        <View style={styles.fieldGroup}>
                          <View style={styles.labelRow}>
                            <Text style={[styles.label, { color: textPrimary }]}>NearbyPay Cashtag</Text>
                            <TouchableOpacity
                              onPress={() => generateSystemUsername(fullName)}
                              disabled={isGeneratingUsername}
                              hitSlop={6}
                              style={styles.shuffleRow}>
                              <HugeiconsIcon icon={SparklesIcon} size={13} color="#2B20F0" />
                              <Text style={styles.shuffleText}>Shuffle</Text>
                            </TouchableOpacity>
                          </View>
                          <View
                            style={[
                              styles.inputWrap,
                              {
                                backgroundColor: inputBg,
                                borderColor: focusedField === 'username' ? '#2B20F0' : inputBorder,
                              },
                            ]}>
                            <Text style={styles.tagPrefix}>@</Text>
                            <TextInput
                              value={username}
                              onChangeText={(val) => setUsername(val.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                              placeholder="alexmorgan24"
                              autoCapitalize="none"
                              autoCorrect={false}
                              textContentType="username"
                              autoComplete="username"
                              returnKeyType="done"
                              onSubmitEditing={handleContinue}
                              placeholderTextColor={iconColor}
                              onFocus={() => setFocusedField('username')}
                              onBlur={() => setFocusedField(null)}
                              style={[styles.input, { color: textPrimary }]}
                            />
                            <TouchableOpacity
                              onPress={() => generateSystemUsername(fullName)}
                              disabled={isGeneratingUsername}
                              hitSlop={8}
                              style={styles.inputActionIcon}>
                              {isGeneratingUsername ? (
                                <ActivityIndicator size="small" color="#2B20F0" />
                              ) : (
                                <HugeiconsIcon icon={SparklesIcon} size={18} color="#2B20F0" />
                              )}
                            </TouchableOpacity>
                          </View>
                          <View style={styles.usernameStatusRow}>
                            <View
                              style={[
                                styles.statusBadge,
                                { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' },
                              ]}>
                              <HugeiconsIcon icon={Tick02Icon} size={11} color="#10B981" strokeWidth={3} />
                              <Text style={[styles.statusBadgeText, { color: '#10B981' }]}>
                                System-Generated & Unique
                              </Text>
                            </View>
                            <Text style={[styles.usernameHint, { color: textSecondary }]}>Nearby cashtag</Text>
                          </View>
                        </View>

                        {/* Continue Button */}
                        <TouchableOpacity
                          style={styles.primaryButton}
                          onPress={handleContinue}
                          activeOpacity={0.88}>
                          <Text style={styles.primaryButtonText}>Continue</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <ThemedText style={[styles.title, { color: textPrimary }]}>Secure your account</ThemedText>
                        <Text style={[styles.subtitle, { color: textSecondary }]}>
                          Enter your email and create a password for @{username || 'account'}.
                        </Text>

                        <View style={styles.fieldGroup}>
                          <Text style={[styles.label, { color: textPrimary }]}>Email address</Text>
                          <View
                            style={[
                              styles.inputWrap,
                              {
                                backgroundColor: inputBg,
                                borderColor: focusedField === 'email' ? '#2B20F0' : inputBorder,
                              },
                            ]}>
                            <HugeiconsIcon icon={Mail01Icon} size={18} color={iconColor} strokeWidth={1.8} />
                            <TextInput
                              value={email}
                              onChangeText={setEmail}
                              placeholder="name@email.com"
                              autoCapitalize="none"
                              autoCorrect={false}
                              keyboardType="email-address"
                              textContentType="emailAddress"
                              autoComplete="email"
                              returnKeyType="next"
                              placeholderTextColor={iconColor}
                              onFocus={() => setFocusedField('email')}
                              onBlur={() => setFocusedField(null)}
                              style={[styles.input, { color: textPrimary }]}
                            />
                          </View>
                        </View>

                        <View style={styles.fieldGroup}>
                          <Text style={[styles.label, { color: textPrimary }]}>Password</Text>
                          <View
                            style={[
                              styles.inputWrap,
                              {
                                backgroundColor: inputBg,
                                borderColor: focusedField === 'password' ? '#2B20F0' : inputBorder,
                              },
                            ]}>
                            <HugeiconsIcon icon={LockPasswordIcon} size={18} color={iconColor} strokeWidth={1.8} />
                            <TextInput
                              value={password}
                              onChangeText={setPassword}
                              placeholder="Create a password (min 6 chars)"
                              secureTextEntry={!showPassword}
                              textContentType="newPassword"
                              autoComplete="password-new"
                              returnKeyType="next"
                              placeholderTextColor={iconColor}
                              onFocus={() => setFocusedField('password')}
                              onBlur={() => setFocusedField(null)}
                              style={[styles.input, { color: textPrimary }]}
                            />
                            <TouchableOpacity
                              onPress={() => setShowPassword((v) => !v)}
                              hitSlop={10}
                              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                              <HugeiconsIcon
                                icon={showPassword ? ViewOffSlashIcon : ViewIcon}
                                size={18}
                                color={iconColor}
                                strokeWidth={1.8}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={styles.fieldGroup}>
                          <Text style={[styles.label, { color: textPrimary }]}>Confirm password</Text>
                          <View
                            style={[
                              styles.inputWrap,
                              {
                                backgroundColor: inputBg,
                                borderColor: focusedField === 'confirm' ? '#2B20F0' : inputBorder,
                              },
                            ]}>
                            <HugeiconsIcon icon={LockPasswordIcon} size={18} color={iconColor} strokeWidth={1.8} />
                            <TextInput
                              value={confirmPassword}
                              onChangeText={setConfirmPassword}
                              placeholder="Repeat your password"
                              secureTextEntry={!showConfirm}
                              textContentType="newPassword"
                              autoComplete="password-new"
                              returnKeyType="go"
                              onSubmitEditing={handleSignUp}
                              placeholderTextColor={iconColor}
                              onFocus={() => setFocusedField('confirm')}
                              onBlur={() => setFocusedField(null)}
                              style={[styles.input, { color: textPrimary }]}
                            />
                            <TouchableOpacity
                              onPress={() => setShowConfirm((v) => !v)}
                              hitSlop={10}
                              accessibilityLabel={showConfirm ? 'Hide password' : 'Show password'}>
                              <HugeiconsIcon
                                icon={showConfirm ? ViewOffSlashIcon : ViewIcon}
                                size={18}
                                color={iconColor}
                                strokeWidth={1.8}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={[styles.primaryButton, isSubmitting && { opacity: 0.7 }]}
                          onPress={handleSignUp}
                          disabled={isSubmitting}
                          activeOpacity={0.88}>
                          {isSubmitting ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.primaryButtonText}>Create account</Text>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.secondaryBackButton, { borderColor: cardBorder }]}
                          onPress={() => setStep(1)}
                          disabled={isSubmitting}
                          activeOpacity={0.8}>
                          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} color={textPrimary} />
                          <Text style={[styles.secondaryBackButtonText, { color: textPrimary }]}>Go back</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    <View style={styles.dividerRow}>
                      <View style={[styles.dividerLine, { backgroundColor: cardBorder }]} />
                      <Text style={[styles.dividerText, { color: textSecondary }]}>secure signup</Text>
                      <View style={[styles.dividerLine, { backgroundColor: cardBorder }]} />
                    </View>

                    <View style={styles.footerRow}>
                      <Text style={[styles.footerText, { color: textSecondary }]}>Already have an account?</Text>
                      <TouchableOpacity onPress={onGoToLogin} hitSlop={8}>
                        <Text style={styles.linkText}>Sign in</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <AvatarPickerSheet
        visible={avatarSheetVisible}
        currentAvatar={chosenAvatar}
        onSelect={(newAvatar) => setChosenAvatar(newAvatar)}
        onClose={() => setAvatarSheetVisible(false)}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
    bgImage: {
      opacity: 0.55,
    },
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 18,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoTile: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  logo: {
    width: 32,
    height: 32,
  },
  brandTextCol: {
    flex: 1,
    gap: 2,
  },
  brandName: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
    letterSpacing: -0.3,
  },
  brandTag: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 22,
    gap: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 3,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 13.5,
    lineHeight: 20,
    marginTop: -8,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.1,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontFamily: 'Montserrat_500Medium',
    fontSize: 14,
    paddingVertical: 12,
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: '#2B20F0',
    borderRadius: 16,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2B20F0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat_700Bold',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 13,
  },
  linkText: {
    color: '#2B20F0',
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
  },
  tagPrefix: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    color: '#2B20F0',
    marginLeft: 2,
    marginRight: -4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shuffleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shuffleText: {
    color: '#2B20F0',
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
  },
  inputActionIcon: {
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usernameStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  statusBadgeText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 10.5,
  },
  usernameHint: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11,
  },
  avatarSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: -4,
  },
  avatarCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarPreviewRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarPreviewImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2B20F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarCardInfo: {
    flex: 1,
    gap: 2,
  },
  avatarCardTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
  },
  avatarCardSubtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11.5,
  },
  changePill: {
    backgroundColor: 'rgba(43, 32, 240, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  changePillText: {
    color: '#2B20F0',
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  stepProgressContainer: {
    flex: 1,
    gap: 6,
  },
  stepTrack: {
    flexDirection: 'row',
    gap: 6,
    height: 4,
    width: '100%',
  },
  stepBar: {
    flex: 1,
    borderRadius: 2,
  },
  stepBadgeText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    marginLeft: 12,
  },
  headerBackText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
  },
  secondaryBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: -4,
  },
  secondaryBackButtonText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
  },
  verificationIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  verificationIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  verificationCheckmarkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 1,
  },
  emailPillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  emailPillText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13.5,
  },
  verifiedUserPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  verifiedAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  verifiedUserInfo: {
    flex: 1,
    gap: 1,
  },
  verifiedUserName: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
  },
  verifiedUserTag: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
    color: '#2B20F0',
  },
  stepsGuideCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  stepsGuideTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepNumberBullet: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12,
    color: '#2B20F0',
  },
  stepItemText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  secondarySignInBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
  },
  secondarySignInBtnText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
  },
  resendSection: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  resendPromptText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
  },
  resendBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  resendBtnText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12.5,
  },
  editEmailLinkTouch: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  editEmailLinkText: {
    color: '#2B20F0',
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
  },
});
