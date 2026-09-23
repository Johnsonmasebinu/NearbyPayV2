import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    Easing,
    FadeOut,
    SlideInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/theme-provider';

// ─── Types ───────────────────────────────────────────────────────

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastConfig {
  message: string;
  variant?: ToastVariant;
  /** Duration in ms. Default 3000. Set 0 for persistent. */
  duration?: number;
  /** Optional action button */
  action?: { label: string; onPress: () => void };
}

interface ToastContextValue {
  show: (config: ToastConfig) => void;
  hide: () => void;
}

// ─── Context ─────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}

// ─── Variant colours ─────────────────────────────────────────────

const variantColors: Record<ToastVariant, { bg: string; border: string; icon: string }> = {
  success: { bg: '#ECFDF5', border: '#6EE7B7', icon: '✓' },
  error:   { bg: '#FEF2F2', border: '#FCA5A5', icon: '✕' },
  warning: { bg: '#FFFBEB', border: '#FCD34D', icon: '!' },
  info:    { bg: '#EFF6FF', border: '#93C5FD', icon: 'i' },
};

const variantColorsDark: Record<ToastVariant, { bg: string; border: string; icon: string }> = {
  success: { bg: '#064E3B', border: '#34D399', icon: '✓' },
  error:   { bg: '#7F1D1D', border: '#F87171', icon: '✕' },
  warning: { bg: '#78350F', border: '#FBBF24', icon: '!' },
  info:    { bg: '#1E3A5F', border: '#60A5FA', icon: 'i' },
};

// ─── Provider ────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    setToast(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const show = useCallback((config: ToastConfig) => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setToast(config);

    const duration = config.duration ?? 3000;
    if (duration > 0) {
      timerRef.current = setTimeout(() => {
        setToast(null);
        timerRef.current = null;
      }, duration);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ show, hide }}>
      {children}
      {toast && <ToastView config={toast} onDismiss={hide} />}
    </ToastContext.Provider>
  );
}

// ─── Toast View ──────────────────────────────────────────────────

function ToastView({ config, onDismiss }: { config: ToastConfig; onDismiss: () => void }) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const variant = config.variant ?? 'info';

  const palette = isDark ? variantColorsDark[variant] : variantColors[variant];

  return (
    <Animated.View
      entering={SlideInUp.duration(250).easing(Easing.out(Easing.cubic))}
      exiting={FadeOut.duration(180)}
      style={[
        styles.wrapper,
        { top: Math.max(insets.top, 12) + (Platform.OS === 'ios' ? 4 : 12) },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onDismiss}
        style={[
          styles.toast,
          {
            backgroundColor: palette.bg,
            borderColor: palette.border,
            shadowColor: isDark ? '#000' : '#64748B',
          },
        ]}
      >
        <View style={[styles.iconCircle, { borderColor: palette.border }]}>
          <Text style={[styles.iconText, { color: palette.border }]}>{palette.icon}</Text>
        </View>

        <Text
          style={[
            styles.message,
            { color: isDark ? '#F1F5F9' : '#1E293B' },
          ]}
          numberOfLines={2}
        >
          {config.message}
        </Text>

        {config.action && (
          <TouchableOpacity
            onPress={() => {
              config.action?.onPress();
              onDismiss();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.actionText, { color: palette.border }]}>
              {config.action.label}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    maxWidth: 420,
    marginHorizontal: 'auto' as const,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12,
    lineHeight: 14,
  },
  message: {
    flex: 1,
    fontFamily: 'Montserrat_500Medium',
    fontSize: 13,
    lineHeight: 18,
  },
  actionText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.2,
  },
});

