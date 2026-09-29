import {
  Cancel01Icon,
  Download01Icon,
  Notification03Icon,
  Sent02Icon,
} from '@/lib/icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useNotifications } from '@/hooks/notifications-provider';
import { useAppTheme } from '@/hooks/theme-provider';
import { getAppTheme } from '@/constants/app-theme';
import { formatTransactionDate } from '@/lib/welcome-transaction';

export function NotificationsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { isDark } = useAppTheme();
  const t = getAppTheme(isDark);
  const { notifications, unreadCount, markAllRead } = useNotifications();

  const handleClose = () => {
    markAllRead();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={handleClose} />
        <View style={[styles.sheet, { backgroundColor: t.cardBg }]}>
          <View style={[styles.sheetHandle, { backgroundColor: t.cardBorder }]} />

          <View style={styles.sheetHeader}>
            <View>
              <Text maxFontSizeMultiplier={1.3} style={[styles.sheetTitle, { color: t.textPrimary }]}>Notifications</Text>
              <Text maxFontSizeMultiplier={1.3} style={[styles.sheetSubtitle, { color: t.textSecondary }]}>
                {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.sheetClose, { backgroundColor: t.chipBg }]}
              activeOpacity={0.7}
              onPress={handleClose}>
              <HugeiconsIcon icon={Cancel01Icon} size={16} color={t.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}>
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconWrap, { backgroundColor: t.chipBg }]}>
                  <HugeiconsIcon icon={Notification03Icon} size={22} color={t.muted} />
                </View>
                <Text maxFontSizeMultiplier={1.3} style={[styles.emptyTitle, { color: t.textPrimary }]}>No activity yet</Text>
                <Text maxFontSizeMultiplier={1.3} style={[styles.emptySubtitle, { color: t.textSecondary }]}>
                  Money in and out will show up here instantly
                </Text>
              </View>
            ) : (
              notifications.map((item) => {
                const isReceived = item.kind === 'received';
                return (
                  <View
                    key={item.id}
                    style={[styles.row, { borderBottomColor: t.divider }]}>
                    <View
                      style={[
                        styles.rowIconWrap,
                        { backgroundColor: isReceived ? t.successTint : t.dangerTint },
                      ]}>
                      <HugeiconsIcon
                        icon={isReceived ? Download01Icon : Sent02Icon}
                        size={18}
                        color={isReceived ? t.success : t.danger}
                      />
                    </View>
                    <View style={styles.rowInfo}>
                      <Text maxFontSizeMultiplier={1.3} style={[styles.rowTitle, { color: t.textPrimary }]} numberOfLines={1}>
                        {isReceived ? `Received from ${item.title}` : `Sent to ${item.title}`}
                      </Text>
                      <Text maxFontSizeMultiplier={1.3} style={[styles.rowMeta, { color: t.textSecondary }]} numberOfLines={1}>
                        {item.subtitle} · {formatTransactionDate(item.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Text maxFontSizeMultiplier={1.3}
                        style={[
                          styles.rowAmount,
                          { color: isReceived ? t.success : t.danger },
                        ]}>
                        {isReceived ? '+' : '-'} ₦{item.amount.toLocaleString('en-NG')}
                      </Text>
                      {!item.read && <View style={[styles.unreadDot, { backgroundColor: t.brand }]} />}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 30, 60, 0.45)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: '80%',
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0A2045',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      web: {
        shadowColor: '#0A2045',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
    }),
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    maxHeight: 420,
  },
  listContent: {
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  rowIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
  },
  rowMeta: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  rowAmount: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 4,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
  },
  emptySubtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    textAlign: 'center',
  },
});
