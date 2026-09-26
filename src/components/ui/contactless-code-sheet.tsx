import { Cancel01Icon, LockPasswordIcon } from '@hugeicons/core-free-icons';
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
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setCurrentCode('');
    setNewCode('');
    setConfirmCode('');
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
      setError('Enter your current 8-digit code.');
      return;
    }
    if (!/^\d{8}$/.test(newCode)) {
      setError('New code must be exactly 8 digits.');
      return;
    }
    if (newCode !== confirmCode) {
      setError('The codes do not match.');
      return;
    }

    setIsSaving(true);
    try {
      await setContactlessCode(newCode, hasContactlessCode ? currentCode : undefined);
      show({ message: 'Contactless code enabled.', variant: 'success' });
      resetForm();
      onSuccess();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save your code.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderCodeInput = (
    label: string,
    value: string,
    onChangeText: (value: string) => void,
    accessibilityLabel: string,
  ) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>{label}</Text>
      <TextInput
        style={[styles.codeInput, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.textPrimary }]}
        value={value}
        onChangeText={(text) => onChangeText(text.replace(/\D/g, '').slice(0, 8))}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={8}
        accessibilityLabel={accessibilityLabel}
        textContentType="oneTimeCode"
        editable={!isSaving}
      />
    </View>
  );

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
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: t.brandTint }]}>
              <HugeiconsIcon icon={LockPasswordIcon} size={20} color={t.brand} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: t.textPrimary }]}>8-digit contactless code</Text>
              <Text style={[styles.subtitle, { color: t.textSecondary }]}>
                Required to enable your receive QR.
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

          {hasContactlessCode && renderCodeInput('Current code', currentCode, setCurrentCode, 'Current 8-digit contactless code')}
          {renderCodeInput('New code', newCode, setNewCode, 'New 8-digit contactless code')}
          {renderCodeInput('Confirm new code', confirmCode, setConfirmCode, 'Confirm new contactless code')}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: t.brand }, isSaving && styles.disabledButton]}
            activeOpacity={0.85}
            disabled={isSaving}
            onPress={() => void handleSave()}>
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>{hasContactlessCode ? 'Update code' : 'Enable code'}</Text>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    marginBottom: 4,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
  },
  subtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    marginTop: 3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
  },
  codeInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 18,
    letterSpacing: 4,
  },
  errorText: {
    color: '#DC2626',
    fontFamily: 'Montserrat_500Medium',
    fontSize: 12,
  },
  saveButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
  },
});