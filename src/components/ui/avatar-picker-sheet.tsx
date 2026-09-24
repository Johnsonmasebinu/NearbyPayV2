import { Camera01Icon, Cancel01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getAppTheme } from '@/constants/app-theme';
import { useAuth } from '@/hooks/auth-provider';
import { useToast } from '@/components/ui/toast';
import { useAppTheme } from '@/hooks/theme-provider';
import { AVAILABLE_AVATARS } from '@/hooks/user-profile-provider';

interface AvatarPickerSheetProps {
  visible: boolean;
  currentAvatar: string;
  onSelect: (avatarUrl: string) => void;
  onClose: () => void;
}

export function AvatarPickerSheet({
  visible,
  currentAvatar,
  onSelect,
  onClose,
}: AvatarPickerSheetProps) {
  const { isDark } = useAppTheme();
  const t = getAppTheme(isDark);
  const insets = useSafeAreaInsets();
  const { user, uploadProfilePicture } = useAuth();
  const { show } = useToast();

  const [selected, setSelected] = useState(currentAvatar);
  const [prevVisible, setPrevVisible] = useState(visible);
  const [isUploading, setIsUploading] = useState(false);

  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setSelected(currentAvatar);
    }
  }

  const handlePickCustomPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        show({ message: 'Photo library permission is required to choose a picture', variant: 'error' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets || !result.assets[0]?.uri) {
        return;
      }

      const localUri = result.assets[0].uri;

      if (user) {
        setIsUploading(true);
        const publicUrl = await uploadProfilePicture(localUri);
        setSelected(publicUrl);
        onSelect(publicUrl);
        show({ message: 'Profile photo uploaded successfully!', variant: 'success' });
        onClose();
      } else {
        setSelected(localUri);
        onSelect(localUri);
        show({ message: 'Photo selected!', variant: 'success' });
        onClose();
      }
    } catch (err: any) {
      show({ message: err.message || 'Failed to upload photo', variant: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: t.cardBg,
              borderColor: t.cardBorder,
              paddingBottom: Math.max(insets.bottom, 20) + 12,
            },
          ]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: t.divider }]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitles}>
              <Text style={[styles.title, { color: t.textPrimary }]}>Choose Avatar</Text>
              <Text style={[styles.subtitle, { color: t.textSecondary }]}>
                Pick an avatar for your profile
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: t.chipBg }]}
              activeOpacity={0.7}
              onPress={onClose}>
              <HugeiconsIcon icon={Cancel01Icon} size={16} color={t.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Centered Large Preview */}
          <View style={styles.previewContainer}>
            <View style={[styles.previewRing, { borderColor: t.brand, backgroundColor: t.brandTint }]}>
              <Image
                source={{ uri: selected }}
                style={styles.previewImage}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
            </View>
            <Text style={[styles.previewHint, { color: t.textSecondary }]}>
              Tap any avatar below to preview
            </Text>
          </View>

          {/* Custom Upload Button */}
          <TouchableOpacity
            style={[styles.customUploadBtn, { backgroundColor: t.brandTint, borderColor: t.brand }]}
            activeOpacity={0.8}
            disabled={isUploading}
            onPress={handlePickCustomPhoto}>
            {isUploading ? (
              <ActivityIndicator size="small" color={t.brand} />
            ) : (
              <>
                <HugeiconsIcon icon={Camera01Icon} size={17} color={t.brand} />
                <Text style={[styles.customUploadBtnText, { color: t.brand }]}>
                  Upload Custom Photo
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.pickerDividerRow}>
            <View style={[styles.pickerDividerLine, { backgroundColor: t.divider }]} />
            <Text style={[styles.pickerDividerText, { color: t.textSecondary }]}>OR CHOOSE A MEMO</Text>
            <View style={[styles.pickerDividerLine, { backgroundColor: t.divider }]} />
          </View>

          {/* 25 Avatars Grid */}
          <ScrollView
            style={styles.gridScroll}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              {AVAILABLE_AVATARS.map((url) => {
                const isSelected = selected === url;
                return (
                  <TouchableOpacity
                    key={url}
                    style={[
                      styles.avatarSlot,
                      {
                        backgroundColor: isSelected ? t.brandTint : t.chipBg,
                        borderColor: isSelected ? t.brand : 'transparent',
                      },
                    ]}
                    activeOpacity={0.75}
                    onPress={() => setSelected(url)}>
                    <Image
                      source={{ uri: url }}
                      style={styles.avatarImg}
                      contentFit="contain"
                      cachePolicy="memory-disk"
                    />

                    {isSelected && (
                      <View style={[styles.selectedCheck, { backgroundColor: t.brand, borderColor: t.cardBg }]}>
                        <HugeiconsIcon icon={Tick02Icon} size={10} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: t.chipBg, borderColor: t.cardBorder }]}
              activeOpacity={0.7}
              onPress={onClose}>
              <Text style={[styles.cancelBtnText, { color: t.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: t.brand }]}
              activeOpacity={0.85}
              onPress={handleConfirm}>
              <Text style={styles.saveBtnText}>Save Avatar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 10,
    paddingHorizontal: 20,
    maxHeight: '84%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitles: {
    flex: 1,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  previewRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
    }),
  },
  previewImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  previewHint: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11,
  },
  customUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1.5,
    marginVertical: 4,
  },
  customUploadBtnText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
  },
  pickerDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 6,
  },
  pickerDividerLine: {
    flex: 1,
    height: 1,
  },
  pickerDividerText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 10.5,
    letterSpacing: 0.8,
  },
  gridScroll: {
    maxHeight: 220,
  },
  gridContent: {
    paddingVertical: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  avatarSlot: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImg: {
    width: '84%',
    height: '84%',
    borderRadius: 24,
  },
  selectedCheck: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelBtnText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
  },
  saveBtn: {
    flex: 1.6,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
});
