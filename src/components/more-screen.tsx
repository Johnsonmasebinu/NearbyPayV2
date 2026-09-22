import {
  ArrowLeft01Icon,
  Notification03Icon,
  BulbIcon,
  SmartPhone01Icon,
  Tv01Icon,
  WifiIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/theme-provider';
import type { ThemeColors } from '@/constants/theme';
import { useToast } from '@/components/ui/toast';

const BILL_SERVICES = [
  { id: 'airtime', label: 'Airtime', description: 'Top up any network', icon: SmartPhone01Icon },
  { id: 'data', label: 'Data', description: 'Buy data bundles', icon: WifiIcon },
  { id: 'light', label: 'Light', description: 'Pay electricity bills', icon: BulbIcon },
  { id: 'tv', label: 'TV', description: 'Cable subscriptions', icon: Tv01Icon },
];

const PROVIDERS: Record<string, string[]> = {
  airtime: ['MTN', 'Airtel', 'Glo', '9mobile'],
  data: ['MTN Data', 'Airtel Data', 'Glo Data', '9mobile Data'],
  light: ['IKEDC', 'EKEDC', 'AEDC', 'PHED'],
  tv: ['DStv', 'GOtv', 'Startimes', 'Showmax'],
};

export default function MoreScreen({ onClose }: { onClose: () => void }) {
  const { colors, isDark } = useAppTheme();
  const { show } = useToast();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();

  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const openService = (id: string, label: string) => {
    show({
      message: `${label} payment is coming soon. Providers: ${PROVIDERS[id]?.join(', ')}.`,
      variant: 'info',
    });
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} onPress={onClose}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>More</Text>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            onPress={() => show({ message: 'You have no new notifications.', variant: 'info' })}>
            <HugeiconsIcon icon={Notification03Icon} size={15} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: entrance,
              transform: [
                {
                  translateY: entrance.interpolate({
                    inputRange: [0, 1],
                    outputRange: [24, 0],
                  }),
                },
              ],
            },
          ]}>
          <Text style={styles.sectionTitle}>Bills & Top-ups</Text>
          <View style={styles.servicesGrid}>
            {BILL_SERVICES.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                activeOpacity={0.75}
                onPress={() => openService(service.id, service.label)}>
                <View style={styles.serviceIconWrap}>
                  <HugeiconsIcon icon={service.icon} size={22} color={colors.brandSoft} />
                </View>
                <Text style={styles.serviceLabel}>{service.label}</Text>
                <Text style={styles.serviceDescription} numberOfLines={2}>
                  {service.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.background,
    },
    container: {
      flex: 1,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 10,
    },
    screenTitle: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 17,
      color: c.text,
      letterSpacing: -0.3,
    },
    iconButton: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 13,
      color: c.textSecondary,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      marginTop: 10,
      marginBottom: 12,
    },
    servicesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    serviceCard: {
      width: '47.5%',
      backgroundColor: c.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: 16,
      gap: 8,
    },
    serviceIconWrap: {
      width: 46,
      height: 46,
      borderRadius: 15,
      backgroundColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    serviceLabel: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 14,
      color: c.text,
    },
    serviceDescription: {
      fontFamily: 'Montserrat_400Regular',
      fontSize: 10,
      color: c.textMuted,
      lineHeight: 14,
    },
  });
