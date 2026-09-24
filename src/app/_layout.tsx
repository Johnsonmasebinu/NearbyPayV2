import { Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold, useFonts } from '@expo-google-fonts/montserrat';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack, usePathname } from 'expo-router';
import { NavigationBar } from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { getAppTheme } from '@/constants/app-theme';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ForgotPasswordScreen } from '@/components/auth/forgot-password-screen';
import { LoginScreen } from '@/components/auth/login-screen';
import { SignupScreen } from '@/components/auth/signup-screen';
import { Onboarding } from '@/components/onboarding';
import { PinSheet } from '@/components/ui/pin-sheet';
import { ThemeModeProvider, useAppTheme } from '@/hooks/theme-provider';
import { AuthProvider, useAuth } from '@/hooks/auth-provider';
import { ToastProvider } from '@/components/ui/toast';
import { UserProfileProvider } from '@/hooks/user-profile-provider';

SplashScreen.preventAutoHideAsync();

type AuthView = 'login' | 'signup' | 'forgot-password';

/**
 * Single source of truth for the status bar inside the authenticated app.
 * Home's hero is dark indigo in BOTH themes, so it always needs light icons;
 * every other surface follows the theme. Keyed by pathname so navigating
 * between routes always re-applies the style imperatively.
 */
function AppStatusBar() {
  const { isDark } = useAppTheme();
  const pathname = usePathname();
  const style: 'light' | 'dark' = pathname.endsWith('/home') ? 'light' : isDark ? 'light' : 'dark';
  return <StatusBar key={pathname} style={style} />;
}

export default function TabLayout() {
  return (
    <ThemeModeProvider>
      <AuthProvider>
        <UserProfileProvider>
          <RootShell />
        </UserProfileProvider>
      </AuthProvider>
    </ThemeModeProvider>
  );
}

function RootShell() {
  const { isDark } = useAppTheme();
  const { session, isLoading: authLoading, hasPin } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [pinSheetDismissed, setPinSheetDismissed] = useState(false);

  const t = getAppTheme(isDark);

  // Android system navigation bar (back/home/recents buttons) background
  // follows the app theme instead of the default white. The <NavigationBar>
  // style below keeps the buttons contrasting (light buttons on dark theme).
  useEffect(() => {
    if (Platform.OS === 'android') {
      SystemUI.setBackgroundColorAsync(t.pageBg).catch(() => {});
    }
  }, [t.pageBg]);

  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  if (!fontsLoaded || authLoading) {
    return null;
  }

  const isAuthenticated = Boolean(session);
  const shouldShowOnboarding = !session && showOnboarding;

  const renderAuthScreen = () => {
    if (authView === 'signup') {
      return (
        <SignupScreen
          onCreateAccount={() => {
            // Managed by session state change in AuthProvider
          }}
          onGoToLogin={() => setAuthView('login')}
        />
      );
    }

    if (authView === 'forgot-password') {
      return (
        <ForgotPasswordScreen
          onResetPassword={() => setAuthView('login')}
          onBackToLogin={() => setAuthView('login')}
        />
      );
    }

    return (
      <LoginScreen
        onLogin={() => {
          // Managed by session state change in AuthProvider
        }}
        onGoToSignup={() => setAuthView('signup')}
        onForgotPassword={() => setAuthView('forgot-password')}
      />
    );
  };

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      {/* Status bar style is route-driven: Home's dark hero always needs light
          icons; other routes follow the theme. Onboarding and the auth screens
          render their own, so this only mounts with the router. */}
      {Platform.OS === 'android' && <NavigationBar style={isDark ? 'dark' : 'light'} />}
      <ToastProvider>
        <AnimatedSplashOverlay />
        {shouldShowOnboarding ? (
          <Onboarding onFinish={() => setShowOnboarding(false)} />
        ) : isAuthenticated ? (
          <>
            <AppStatusBar />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="index" />
              <Stack.Screen name="more" />
            </Stack>
            {!hasPin && !pinSheetDismissed && (
              <PinSheet
                visible={true}
                mode="setup"
                onClose={() => setPinSheetDismissed(true)}
                onSuccess={() => setPinSheetDismissed(true)}
                canCancel={true}
              />
            )}
          </>
        ) : (
          renderAuthScreen()
        )}
      </ToastProvider>
    </ThemeProvider>
  );
}
