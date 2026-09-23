import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Coins01Icon,
  InformationCircleIcon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useAppTheme } from '@/hooks/theme-provider';
import type { ThemeColors } from '@/constants/theme';
import { useToast } from '@/components/ui/toast';

const WALLET_BALANCE = '₦245,680.75';
const COMMISSION_POINTS = 2450;
const POINTS_VALUE = '₦2,450.00';

export default function WalletScreen() {
  const { colors, isDark } = useAppTheme();
  const { show } = useToast();
  const styles = createStyles(colors);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand}
            colors={[colors.brand]}
            progressBackgroundColor={colors.refreshBg}
          />
        }>
        <Text style={styles.screenTitle}>Wallet</Text>
        <Text style={styles.screenSubtitle}>Manage your money and rewards</Text>

        {/* Wallet Balance Card */}
        <View style={styles.balanceCard}>
          <Svg style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="walletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#2E55F7" />
                <Stop offset="100%" stopColor="#112CC9" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" rx={24} fill="url(#walletGrad)" />
          </Svg>
          <View style={styles.cardHairline} pointerEvents="none" />

          <View style={styles.balanceTopRow}>
            <Text style={styles.balanceLabel}>Wallet Balance</Text>
            <TouchableOpacity
              onPress={() => setIsBalanceVisible(!isBalanceVisible)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.eyeToggle}>
              <HugeiconsIcon
                icon={isBalanceVisible ? ViewIcon : ViewOffSlashIcon}
                size={13}
                color="rgba(255, 255, 255, 0.85)"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.balanceAmount}>
            {isBalanceVisible ? WALLET_BALANCE : '₦ ****'}
          </Text>

          <View style={styles.walletActionRow}>
            <TouchableOpacity
              style={styles.walletActionButton}
              activeOpacity={0.8}
              onPress={() => show({ message: 'Top up coming soon.', variant: 'info' })}>
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} color="#FFFFFF" />
              <Text style={styles.walletActionText}>Top up</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.walletActionButton}
              activeOpacity={0.8}
              onPress={() => show({ message: 'Withdraw coming soon.', variant: 'info' })}>
              <HugeiconsIcon icon={ArrowUp01Icon} size={14} color="#FFFFFF" />
              <Text style={styles.walletActionText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Commission Points Card */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsHeader}>
            <View style={styles.pointsIconWrap}>
              <HugeiconsIcon icon={Coins01Icon} size={18} color={colors.brand} />
            </View>
            <View style={styles.pointsHeaderText}>
              <Text style={styles.pointsTitle}>Commission Points</Text>
              <Text style={styles.pointsSubtitle}>Earn 1 point for every ₦100 sent</Text>
            </View>
          </View>

          <View style={styles.pointsStatsRow}>
            <View style={styles.pointsStat}>
              <Text style={styles.pointsValue}>{COMMISSION_POINTS.toLocaleString()}</Text>
              <Text style={styles.pointsStatLabel}>Points</Text>
            </View>
            <View style={styles.pointsDivider} />
            <View style={styles.pointsStat}>
              <Text style={styles.pointsValue}>{POINTS_VALUE}</Text>
              <Text style={styles.pointsStatLabel}>Redeemable value</Text>
            </View>
          </View>

          <View style={styles.pointsFooter}>
            <HugeiconsIcon icon={InformationCircleIcon} size={12} color={colors.textMuted} />
            <Text style={styles.pointsFooterText}>100 points = ₦100. Redeem anytime.</Text>
          </View>
        </View>

        {/* Recent Wallet Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.activityTitle}>Wallet activity</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: colors.success }]} />
              <Text style={styles.activityText}>Received from Bisi Lawal</Text>
              <Text style={[styles.activityAmount, { color: colors.success }]}>+ ₦20,000</Text>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: colors.danger }]} />
              <Text style={styles.activityText}>Sent to Tunde Adeboyo</Text>
              <Text style={[styles.activityAmount, { color: colors.danger }]}>- ₦5,000</Text>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: colors.warning }]} />
              <Text style={styles.activityText}>Commission points earned</Text>
              <Text style={[styles.activityAmount, { color: colors.accent }]}>+ 120 pts</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 40,
    },
    screenTitle: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 24,
      color: c.text,
      letterSpacing: -0.5,
    },
    screenSubtitle: {
      fontFamily: 'Montserrat_500Medium',
      fontSize: 12,
      color: c.textSecondary,
      marginTop: 2,
      marginBottom: 16,
    },
    balanceCard: {
      borderRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 18,
      position: 'relative',
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#1E44F8',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.22,
          shadowRadius: 18,
        },
        android: { elevation: 8 },
        web: {
          shadowColor: '#1E44F8',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.22,
          shadowRadius: 18,
        },
      }),
    },
    cardHairline: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.14)',
    },
    balanceTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    balanceLabel: {
      fontFamily: 'Montserrat_500Medium',
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.72)',
    },
    eyeToggle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    balanceAmount: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 32,
      color: '#FFFFFF',
      letterSpacing: -1,
      marginTop: 10,
    },
    walletActionRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 16,
    },
    walletActionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.14)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.25)',
      borderRadius: 14,
      paddingVertical: 9,
    },
    walletActionText: {
      fontFamily: 'Montserrat_600SemiBold',
      fontSize: 12,
      color: '#FFFFFF',
    },
    pointsCard: {
      backgroundColor: c.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: 16,
      marginTop: 14,
    },
    pointsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    pointsIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pointsHeaderText: {
      flex: 1,
    },
    pointsTitle: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 14,
      color: c.text,
    },
    pointsSubtitle: {
      fontFamily: 'Montserrat_400Regular',
      fontSize: 11,
      color: c.textMuted,
      marginTop: 2,
    },
    pointsStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
    },
    pointsStat: {
      flex: 1,
      alignItems: 'center',
    },
    pointsValue: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 20,
      color: c.text,
      letterSpacing: -0.5,
    },
    pointsStatLabel: {
      fontFamily: 'Montserrat_500Medium',
      fontSize: 10,
      color: c.textMuted,
      marginTop: 3,
    },
    pointsDivider: {
      width: 1,
      height: 32,
      backgroundColor: c.divider,
    },
    pointsFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: c.divider,
    },
    pointsFooterText: {
      fontFamily: 'Montserrat_400Regular',
      fontSize: 10,
      color: c.textMuted,
    },
    activitySection: {
      marginTop: 18,
    },
    activityTitle: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 15,
      color: c.text,
      letterSpacing: -0.3,
      marginBottom: 10,
    },
    activityCard: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      paddingHorizontal: 14,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
    activityDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 10,
    },
    activityText: {
      flex: 1,
      fontFamily: 'Montserrat_600SemiBold',
      fontSize: 12,
      color: c.text,
    },
    activityAmount: {
      fontFamily: 'Montserrat_700Bold',
      fontSize: 12,
    },
  });
