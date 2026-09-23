import { Cancel01Icon, CheckmarkBadge01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getAppTheme } from '@/constants/app-theme';
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

  const [selected, setSelected] = useState(currentAvatar);
  const [prevVisible, setPrevVisible] = useState(visible);

  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setSelected(currentAvatar);
    }
  }

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
                Pick a memo avatar to use across NearbyPay
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: t.chipBg }]}
              activeOpacity={0.7}
              onPress={onClose}>
              <HugeiconsIcon icon={Cancel01Icon} size={16} color={t.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Current Selection Preview */}
          <View style={[styles.previewCard, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
            <View style={[styles.previewRing, { borderColor: t.brand }]}>
              <Image source={{ uri: selected }} style={styles.previewImage} resizeMode="cover" />
              <View style={[styles.previewBadge, { backgroundColor: t.brand }]}>
                <HugeiconsIcon icon={CheckmarkBadge01Icon} size={13} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.previewInfo}>
              <Text style={[styles.previewTitle, { color: t.textPrimary }]}>Selected Avatar</Text>
              <Text style={[styles.previewSub, { color: t.muted }]}>
                {selected.split('/').pop()?.replace('.png', '') || 'Custom'}
              </Text>
            </View>
          </View>

          {/* 25 Avatars Grid */}
          <ScrollView
            style={styles.gridScroll}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              {AVAILABLE_AVATARS.map((url, index) => {
                const isSelected = selected === url;
                return (
                  <TouchableOpacity
                    key={url}
                    style={[
                      styles.avatarSlot,
                      {
                        backgroundColor: isSelected ? t.brandTint : t.chipBg,
                        borderColor: isSelected ? t.brand : t.cardBorder,
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => setSelected(url)}>
                    <Image source={{ uri: url }} style={styles.avatarImg} resizeMode="contain" />

                    {isSelected && (
                      <View style={[styles.selectedCheck, { backgroundColor: t.brand }]}>
                        <HugeiconsIcon icon={Tick02Icon} size={10} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}

                    <Text style={[styles.avatarIndex, { color: isSelected ? t.brand : t.muted }]}>
                      #{index + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: t.chipBg }]}
              activeOpacity={0.7}
              onPress={onClose}>
              <Text style={[styles.cancelBtnText, { color: t.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: t.brand }]}
              activeOpacity={0.8}
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
    paddingHorizontal: 16,
    maxHeight: '82%',
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  previewRing: {
    position: 'relative',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  previewBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  previewInfo: {
    flex: 1,
  },
  previewTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
  },
  previewSub: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11,
    marginTop: 1,
    textTransform: 'capitalize',
  },
  gridScroll: {
    maxHeight: 280,
  },
  gridContent: {
    paddingBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  avatarSlot: {
    width: '18%',
    aspectRatio: 0.85,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 4,
  },
  avatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  selectedCheck: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarIndex: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 9,
    marginTop: 2,
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
