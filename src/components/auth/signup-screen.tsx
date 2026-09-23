import {
  Camera01Icon,
  LockPasswordIcon,
  Mail01Icon,
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
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
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
  const { signUp, generateUniqueUsername } = useAuth();
  const { profile } = useUserProfile();
  const { show } = useToast();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [chosenAvatar, setChosenAvatar] = useState(profile.avatar || AVAILABLE_AVATARS[0]);
  const [avatarSheetVisible, setAvatarSheetVisible] = useState(false);
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

  const handleFullNameChange = (text: string) => {
    setFullName(text);
    if (text.trim().length >= 2) {
      generateSystemUsername(text);
    }
  };

  const handleSignUp = async () => {
    if (isSubmitting) return;

    const trimmedName = fullName.trim();
    const cleanUsername = username.trim().toLowerCase().replace(/^[@$]/, '');
    const cleanEmail = email.trim();

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
      await signUp({
        fullName: trimmedName,
        username: cleanUsername,
        email: cleanEmail,
        password,
        avatarUrl: chosenAvatar,
      });
      show({ message: 'Account created! Welcome to NearbyPay.', variant: 'success' });
      onCreateAccount?.();
    } catch (err: any) {
      show({ message: err.message || 'Signup failed. Please try again.', variant: 'error' });
    } finally {
      setIsSubmitting(false);
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

                <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <ThemedText style={[styles.title, { color: textPrimary }]}>Create your account</ThemedText>
                  <Text style={[styles.subtitle, { color: textSecondary }]}>
                    Start sending and receiving money securely in seconds.
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
                        placeholder="alexmorgan"
                        autoCapitalize="none"
                        autoCorrect={false}
                        textContentType="username"
                        autoComplete="username"
                        returnKeyType="next"
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
                      <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' }]}>
                        <HugeiconsIcon icon={Tick02Icon} size={11} color="#10B981" strokeWidth={3} />
                        <Text style={[styles.statusBadgeText, { color: '#10B981' }]}>System-Generated & Unique</Text>
                      </View>
                      <Text style={[styles.usernameHint, { color: textSecondary }]}>Nearby cashtag</Text>
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={[styles.label, { color: textPrimary }]}>Email</Text>
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
                        placeholder="Create a password"
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
});
