import { Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold, useFonts } from '@expo-google-fonts/montserrat';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import { NavigationBar } from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

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
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {Platform.OS === 'android' && <NavigationBar style={isDark ? 'dark' : 'light'} />}
      <ToastProvider>
        <AnimatedSplashOverlay />
        {shouldShowOnboarding ? (
          <Onboarding onFinish={() => setShowOnboarding(false)} />
        ) : isAuthenticated ? (
          <>
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
