import { LockPasswordIcon, Mail01Icon, UserIcon, ViewIcon, ViewOffSlashIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useState } from 'react';
import {
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
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/theme-provider';
import { ThemedText } from '@/components/themed-text';

interface SignupScreenProps {
  onCreateAccount: () => void;
  onGoToLogin: () => void;
}

export function SignupScreen({ onCreateAccount, onGoToLogin }: SignupScreenProps) {
  const { isDark } = useAppTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<'name' | 'email' | 'password' | 'confirm' | null>(null);

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

                <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <ThemedText style={[styles.title, { color: textPrimary }]}>Create your account</ThemedText>
                  <Text style={[styles.subtitle, { color: textSecondary }]}>
                    Start sending and receiving money securely in seconds.
                  </Text>

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
                        onChangeText={setFullName}
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
                        onSubmitEditing={onCreateAccount}
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

                  <TouchableOpacity style={styles.primaryButton} onPress={onCreateAccount} activeOpacity={0.88}>
                    <Text style={styles.primaryButtonText}>Create account</Text>
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
});
