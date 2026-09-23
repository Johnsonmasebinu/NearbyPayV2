import { Cancel01Icon, Delete02Icon, LockPasswordIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/components/ui/toast';
import { getAppTheme } from '@/constants/app-theme';
import { useAuth } from '@/hooks/auth-provider';
import { useAppTheme } from '@/hooks/theme-provider';

export type PinSheetMode = 'setup' | 'change' | 'reset';

interface PinSheetProps {
  visible: boolean;
  mode: PinSheetMode;
  onClose: () => void;
  onSuccess: () => void;
  canCancel?: boolean;
}

export function PinSheet({ visible, mode, onClose, onSuccess, canCancel = true }: PinSheetProps) {
  const { isDark } = useAppTheme();
  const t = getAppTheme(isDark);
  const insets = useSafeAreaInsets();
  const { show } = useToast();
  const { setupPin, changePin, resetPin } = useAuth();

  // Step handling
  // setup: 1 (new), 2 (confirm)
  // change: 1 (current), 2 (new), 3 (confirm)
  // reset: 1 (password verification), 2 (new), 3 (confirm)
  const [step, setStep] = useState(1);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active digits string being typed on keypad
  const activePin =
    mode === 'setup'
      ? step === 1
        ? newPin
        : confirmPin
      : mode === 'change'
      ? step === 1
        ? currentPin
        : step === 2
        ? newPin
        : confirmPin
      : step === 2
      ? newPin
      : confirmPin;

  const resetAll = () => {
    setStep(1);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setAccountPassword('');
    setErrorMessage('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const handleKeyPress = async (digit: string) => {
    if (errorMessage) setErrorMessage('');
    if (isSubmitting) return;

    if (activePin.length >= 4) return;

    const nextPin = activePin + digit;

    if (mode === 'setup') {
      if (step === 1) {
        setNewPin(nextPin);
        if (nextPin.length === 4) {
          setTimeout(() => setStep(2), 200);
        }
      } else {
        setConfirmPin(nextPin);
        if (nextPin.length === 4) {
          if (nextPin !== newPin) {
            setErrorMessage('PINs do not match. Please try again.');
            setTimeout(() => {
              setConfirmPin('');
              setNewPin('');
              setStep(1);
            }, 800);
            return;
          }
          // Submit setup
          try {
            setIsSubmitting(true);
            await setupPin(nextPin);
            show({ message: 'Transaction PIN set successfully!', variant: 'success' });
            resetAll();
            onSuccess();
          } catch (e: any) {
            setErrorMessage(e.message || 'Failed to setup PIN');
            setConfirmPin('');
          } finally {
            setIsSubmitting(false);
          }
        }
      }
    } else if (mode === 'change') {
      if (step === 1) {
        setCurrentPin(nextPin);
        if (nextPin.length === 4) {
          setTimeout(() => setStep(2), 200);
        }
      } else if (step === 2) {
        setNewPin(nextPin);
        if (nextPin.length === 4) {
          setTimeout(() => setStep(3), 200);
        }
      } else {
        setConfirmPin(nextPin);
        if (nextPin.length === 4) {
          if (nextPin !== newPin) {
            setErrorMessage('New PINs do not match.');
            setTimeout(() => {
              setConfirmPin('');
              setStep(2);
            }, 800);
            return;
          }
          try {
            setIsSubmitting(true);
            await changePin(currentPin, nextPin);
            show({ message: 'Transaction PIN changed successfully!', variant: 'success' });
            resetAll();
            onSuccess();
          } catch (e: any) {
            setErrorMessage(e.message || 'Failed to change PIN');
            setStep(1);
            setCurrentPin('');
            setNewPin('');
            setConfirmPin('');
          } finally {
            setIsSubmitting(false);
          }
        }
      }
    } else if (mode === 'reset') {
      if (step === 2) {
        setNewPin(nextPin);
        if (nextPin.length === 4) {
          setTimeout(() => setStep(3), 200);
        }
      } else if (step === 3) {
        setConfirmPin(nextPin);
        if (nextPin.length === 4) {
          if (nextPin !== newPin) {
            setErrorMessage('PINs do not match.');
            setTimeout(() => {
              setConfirmPin('');
              setStep(2);
            }, 800);
            return;
          }
          try {
            setIsSubmitting(true);
            await resetPin(accountPassword, nextPin);
            show({ message: 'Transaction PIN reset successfully!', variant: 'success' });
            resetAll();
            onSuccess();
          } catch (e: any) {
            setErrorMessage(e.message || 'Failed to reset PIN');
            setStep(1);
            setAccountPassword('');
            setNewPin('');
            setConfirmPin('');
          } finally {
            setIsSubmitting(false);
          }
        }
      }
    }
  };

  const handleDelete = () => {
    if (errorMessage) setErrorMessage('');
    if (isSubmitting) return;

    if (mode === 'setup') {
      if (step === 1) {
        setNewPin((p) => p.slice(0, -1));
      } else {
        setConfirmPin((p) => p.slice(0, -1));
      }
    } else if (mode === 'change') {
      if (step === 1) {
        setCurrentPin((p) => p.slice(0, -1));
      } else if (step === 2) {
        setNewPin((p) => p.slice(0, -1));
      } else {
        setConfirmPin((p) => p.slice(0, -1));
      }
    } else if (mode === 'reset') {
      if (step === 2) {
        setNewPin((p) => p.slice(0, -1));
      } else if (step === 3) {
        setConfirmPin((p) => p.slice(0, -1));
      }
    }
  };

  const handlePasswordSubmit = () => {
    if (!accountPassword.trim()) {
      setErrorMessage('Please enter your account password.');
      return;
    }
    setErrorMessage('');
    setStep(2);
  };

  // Get Title & Subtitle based on mode and step
  const getHeaderInfo = () => {
    if (mode === 'setup') {
      return {
        title: step === 1 ? 'Create Transaction PIN' : 'Confirm Transaction PIN',
        subtitle:
          step === 1
            ? 'Set a 4-digit PIN for authorizing nearby transfers'
            : 'Re-enter your 4-digit PIN to confirm',
      };
    }
    if (mode === 'change') {
      if (step === 1) {
        return {
          title: 'Enter Current PIN',
          subtitle: 'Please enter your existing 4-digit transaction PIN',
        };
      }
      if (step === 2) {
        return {
          title: 'Enter New PIN',
          subtitle: 'Choose a new 4-digit security PIN',
        };
      }
      return {
        title: 'Confirm New PIN',
        subtitle: 'Re-enter your new 4-digit PIN to confirm',
      };
    }
    // reset mode
    if (step === 1) {
      return {
        title: 'Verify Account Password',
        subtitle: 'Enter your NearbyPay account password to reset your PIN',
      };
    }
    if (step === 2) {
      return {
        title: 'Set New PIN',
        subtitle: 'Choose a new 4-digit transaction PIN',
      };
    }
    return {
      title: 'Confirm New PIN',
      subtitle: 'Re-enter your new 4-digit PIN',
    };
  };

  const headerInfo = getHeaderInfo();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalBackdrop}>
        {canCancel && <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={handleClose} />}

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: t.cardBg,
              borderColor: t.cardBorder,
              paddingBottom: Math.max(insets.bottom, 20) + 16,
            },
          ]}>
          <View style={[styles.sheetHandle, { backgroundColor: t.divider }]} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={[styles.lockIconWrap, { backgroundColor: t.brandTint }]}>
              <HugeiconsIcon icon={LockPasswordIcon} size={20} color={t.brand} />
            </View>

            <View style={styles.headerTitles}>
              <Text style={[styles.sheetTitle, { color: t.textPrimary }]}>{headerInfo.title}</Text>
              <Text style={[styles.sheetSubtitle, { color: t.textSecondary }]}>
                {headerInfo.subtitle}
              </Text>
            </View>

            {canCancel && (
              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: t.chipBg }]}
                activeOpacity={0.7}
                onPress={handleClose}>
                <HugeiconsIcon icon={Cancel01Icon} size={16} color={t.textPrimary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Error Message */}
          {errorMessage.length > 0 && (
            <View style={[styles.errorBox, { backgroundColor: t.dangerTint }]}>
              <Text style={[styles.errorText, { color: t.danger }]}>{errorMessage}</Text>
            </View>
          )}

          {/* Password Input Step for Reset Mode */}
          {mode === 'reset' && step === 1 ? (
            <View style={styles.passwordStepWrap}>
              <TextInput
                style={[styles.passwordInput, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.textPrimary }]}
                placeholder="Enter account password"
                placeholderTextColor={t.muted}
                secureTextEntry
                value={accountPassword}
                onChangeText={setAccountPassword}
                autoFocus
              />

              <TouchableOpacity
                style={[styles.submitPasswordBtn, { backgroundColor: t.brand }]}
                activeOpacity={0.85}
                onPress={handlePasswordSubmit}>
                <Text style={styles.submitPasswordBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* 4 PIN Indicator Dots */}
              <View style={styles.dotsContainer}>
                {[0, 1, 2, 3].map((idx) => {
                  const isFilled = activePin.length > idx;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.pinDot,
                        {
                          borderColor: isFilled ? t.brand : t.inputBorder,
                          backgroundColor: isFilled ? t.brand : 'transparent',
                        },
                      ]}
                    />
                  );
                })}
              </View>

              {isSubmitting && (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="small" color={t.brand} />
                  <Text style={[styles.loadingText, { color: t.textSecondary }]}>Securing PIN...</Text>
                </View>
              )}

              {/* Numeric Keypad */}
              <View style={styles.keypadContainer}>
                {[
                  ['1', '2', '3'],
                  ['4', '5', '6'],
                  ['7', '8', '9'],
                  ['', '0', 'del'],
                ].map((row, rIdx) => (
                  <View key={rIdx} style={styles.keypadRow}>
                    {row.map((item, cIdx) => {
                      if (!item) {
                        return <View key={cIdx} style={styles.keyEmpty} />;
                      }
                      if (item === 'del') {
                        return (
                          <TouchableOpacity
                            key={cIdx}
                            style={[styles.keyButton, { backgroundColor: t.chipBg }]}
                            activeOpacity={0.65}
                            onPress={handleDelete}
                            disabled={isSubmitting}>
                            <HugeiconsIcon icon={Delete02Icon} size={20} color={t.textPrimary} />
                          </TouchableOpacity>
                        );
                      }
                      return (
                        <TouchableOpacity
                          key={cIdx}
                          style={[styles.keyButton, { backgroundColor: t.chipBg }]}
                          activeOpacity={0.65}
                          onPress={() => handleKeyPress(item)}
                          disabled={isSubmitting}>
                          <Text style={[styles.keyButtonText, { color: t.textPrimary }]}>{item}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  lockIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  sheetTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
    paddingVertical: 18,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 4,
  },
  loadingText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 12,
  },
  keypadContainer: {
    gap: 10,
    marginTop: 10,
    maxWidth: 320,
    alignSelf: 'center',
    width: '100%',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  keyButton: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 1 },
      web: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
    }),
  },
  keyButtonText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 22,
  },
  keyEmpty: {
    flex: 1,
    height: 54,
  },
  passwordStepWrap: {
    paddingVertical: 14,
    gap: 14,
  },
  passwordInput: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  submitPasswordBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  submitPasswordBtnText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
