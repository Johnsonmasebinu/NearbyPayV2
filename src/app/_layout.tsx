import { Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold, useFonts } from '@expo-google-fonts/montserrat';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import { NavigationBar } from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { Platform } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ForgotPasswordScreen } from '@/components/auth/forgot-password-screen';
import { LoginScreen } from '@/components/auth/login-screen';
import { SignupScreen } from '@/components/auth/signup-screen';
import { Onboarding } from '@/components/onboarding';
import { ThemeModeProvider, useAppTheme } from '@/hooks/theme-provider';
import { ToastProvider } from '@/components/ui/toast';

SplashScreen.preventAutoHideAsync();

type AuthView = 'login' | 'signup' | 'forgot-password';

export default function TabLayout() {
  return (
    <ThemeModeProvider>
      <RootShell />
    </ThemeModeProvider>
  );
}

function RootShell() {
  const { isDark } = useAppTheme();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');

  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const renderAuthScreen = () => {
    if (authView === 'signup') {
      return (
        <SignupScreen
          onCreateAccount={() => {
            setAuthView('login');
            setIsAuthenticated(true);
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
        onLogin={() => setIsAuthenticated(true)}
        onGoToSignup={() => setAuthView('signup')}
        onForgotPassword={() => setAuthView('forgot-password')}
      />
    );
  };

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      {Platform.OS === 'android' && <NavigationBar style={isDark ? 'dark' : 'light'} />}
      <ToastProvider>
        <AnimatedSplashOverlay />
        {showOnboarding ? (
          <Onboarding onFinish={() => setShowOnboarding(false)} />
        ) : isAuthenticated ? (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="index" />
          </Stack>
        ) : (
          renderAuthScreen()
        )}
      </ToastProvider>
    </ThemeProvider>
  );
}
