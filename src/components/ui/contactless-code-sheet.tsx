import {
  AlertCircleIcon,
  Cancel01Icon,
  CheckmarkBadge01Icon,
  CheckmarkCircle02Icon,
  LockPasswordIcon,
  ShieldCheckIcon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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

type ContactlessCodeSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function ContactlessCodeSheet({ visible, onClose, onSuccess }: ContactlessCodeSheetProps) {
  const { isDark } = useAppTheme();
  const t = getAppTheme(isDark);
  const insets = useSafeAreaInsets();
  const { show } = useToast();
  const { hasContactlessCode, setContactlessCode } = useAuth();
  const [currentCode, setCurrentCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setCurrentCode('');
    setNewCode('');
    setConfirmCode('');
    setShowCode(false);
    setError('');
    setIsSaving(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    setError('');
    if (hasContactlessCode && !/^\d{8}$/.test(currentCode)) {
      setError('Please enter your current 8-digit PIN.');
      return;
    }
    if (!/^\d{8}$/.test(newCode)) {
      setError('New PIN must be exactly 8 digits.');
      return;
    }
    if (newCode !== confirmCode) {
      setError('PINs do not match. Please re-enter.');
      return;
    }

    setIsSaving(true);
    try {
      await setContactlessCode(newCode, hasContactlessCode ? currentCode : undefined);
      show({
        message: hasContactlessCode ? 'Security PIN updated successfully.' : 'Security PIN enabled & QR unlocked!',
        variant: 'success',
      });
      resetForm();
      onSuccess();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save your PIN.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderCodeInput = (
    label: string,
    value: string,
    onChangeText: (value: string) => void,
    accessibilityLabel: string,
    placeholder: string,
  ) => {
    const isComplete = value.length === 8;
    return (
      <View style={styles.fieldGroup}>
        <View style={styles.fieldHeader}>
          <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>{label}</Text>
          <View style={[styles.fieldBadge, isComplete && styles.fieldBadgeComplete]}>
            {isComplete ? (
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={11} color="#16A34A" strokeWidth={2.4} />
            ) : null}
            <Text style={[styles.fieldBadgeText, isComplete && styles.fieldBadgeTextComplete]}>
              {value.length}/8
            </Text>
          </View>
        </View>
        <TextInput
          style={[
            styles.codeInput,
            {
              backgroundColor: t.inputBg,
              borderColor: isComplete ? '#22C55E' : t.inputBorder,
              color: t.textPrimary,
            },
          ]}
          value={value}
          onChangeText={(text) => onChangeText(text.replace(/\D/g, '').slice(0, 8))}
          keyboardType="number-pad"
          secureTextEntry={!showCode}
          maxLength={8}
          placeholder={placeholder}
          placeholderTextColor={t.muted}
          accessibilityLabel={accessibilityLabel}
          textContentType="oneTimeCode"
          editable={!isSaving}
        />
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={handleClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: t.cardBg,
              borderColor: t.cardBorder,
              paddingBottom: Math.max(insets.bottom, 20) + 16,
            },
          ]}>
          <View style={[styles.handle, { backgroundColor: t.divider }]} />
          
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: t.brandTint }]}>
              <HugeiconsIcon icon={LockPasswordIcon} size={22} color={t.brand} strokeWidth={2.2} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: t.textPrimary }]}>
                {hasContactlessCode ? 'Change Security PIN' : 'Set Up Contactless PIN'}
              </Text>
              <Text style={[styles.subtitle, { color: t.textSecondary }]}>
                {hasContactlessCode
                  ? 'Update your 8-digit security PIN.'
                  : '8-digit PIN to protect offline transfers & QR receives.'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: t.chipBg }]}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close contactless code settings">
              <HugeiconsIcon icon={Cancel01Icon} size={16} color={t.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Value / Trust Callout */}
          <View style={[styles.infoBanner, { backgroundColor: t.brandTint, borderColor: t.brandTintStrong }]}>
            <HugeiconsIcon icon={ShieldCheckIcon} size={18} color={t.brand} strokeWidth={2.2} />
            <Text style={[styles.infoBannerText, { color: t.textSecondary }]}>
              Your 8-digit PIN confirms your identity during offline tap-to-pay and keeps your receive QR protected from unauthorized transactions.
            </Text>
          </View>

          {/* Form Fields */}
          {hasContactlessCode &&
            renderCodeInput('Current PIN', currentCode, setCurrentCode, 'Current 8-digit contactless PIN', '••••••••')}
          {renderCodeInput('New 8-digit PIN', newCode, setNewCode, 'New 8-digit contactless PIN', '8 numeric digits')}
          {renderCodeInput('Confirm New PIN', confirmCode, setConfirmCode, 'Confirm new contactless PIN', 'Re-enter 8 digits')}

          {/* Toggle PIN Visibility */}
          <TouchableOpacity
            style={styles.toggleRow}
            activeOpacity={0.7}
            onPress={() => setShowCode(!showCode)}>
            <HugeiconsIcon
              icon={showCode ? ViewOffSlashIcon : ViewIcon}
              size={15}
              color={t.textSecondary}
              strokeWidth={2}
            />
            <Text style={[styles.toggleText, { color: t.textSecondary }]}>
              {showCode ? 'Hide digits' : 'Show digits'}
            </Text>
          </TouchableOpacity>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorBanner}>
              <HugeiconsIcon icon={AlertCircleIcon} size={15} color="#DC2626" strokeWidth={2.2} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: t.brand }, isSaving && styles.disabledButton]}
            activeOpacity={0.85}
            disabled={isSaving}
            onPress={() => void handleSave()}>
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.saveButtonInner}>
                <HugeiconsIcon icon={CheckmarkBadge01Icon} size={18} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.saveButtonText}>
                  {hasContactlessCode ? 'Update Security PIN' : 'Save & Unlock Receive QR'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    borderWidth: 1,
    borderBottomWidth: 0,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16.5,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoBannerText: {
    flex: 1,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
  },
  fieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  fieldBadgeComplete: {
    backgroundColor: '#DCFCE7',
  },
  fieldBadgeText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 10.5,
    color: '#64748B',
  },
  fieldBadgeTextComplete: {
    color: '#16A34A',
  },
  codeInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 17,
    letterSpacing: 3,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  toggleText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11.5,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11.5,
  },
  saveButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13.5,
  },
});