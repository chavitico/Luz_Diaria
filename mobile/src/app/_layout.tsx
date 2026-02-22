// Root Layout - App Entry Point with Splash and Onboarding

import React, { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppStore, useIsOnboarded, useIsDarkMode, useThemeColors, useLanguage } from '@/lib/store';
import { SplashScreen } from '@/components/SplashScreen';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { BackgroundMusicProvider } from '@/components/BackgroundMusicProvider';
import { initializeNotifications } from '@/lib/notifications';
import { useBrandingStore } from '@/lib/branding-service';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent the native splash screen from auto-hiding
ExpoSplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

function RootLayoutNav() {
  const colors = useThemeColors();
  const isDarkMode = useIsDarkMode();

  const customTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.textMuted + '30',
    },
  };

  return (
    <ThemeProvider value={customTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="devotional/[date]"
          options={{
            presentation: 'card',
            headerShown: true,
            headerTitle: '',
            headerTransparent: true,
            headerTintColor: '#FFFFFF',
          }}
        />
        <Stack.Screen
          name="admin/branding"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}

function AppContent() {
  const isOnboarded = useIsOnboarded();
  const isDarkMode = useIsDarkMode();
  const language = useLanguage();
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);
  const fetchBranding = useBrandingStore(s => s.fetchBranding);

  useEffect(() => {
    // Hide native splash screen once we're ready
    const prepare = async () => {
      await ExpoSplashScreen.hideAsync();
      setAppReady(true);
    };
    prepare();
    // Kick off branding fetch immediately on startup
    fetchBranding();
  }, []);

  // Initialize notifications when app is ready and user is onboarded
  useEffect(() => {
    if (appReady && isOnboarded) {
      initializeNotifications(language);
    }
  }, [appReady, isOnboarded, language]);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    // Onboarding sets isOnboarded to true via store
  }, []);

  if (!appReady) {
    return null;
  }

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (!isOnboarded) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <BackgroundMusicProvider>
        <RootLayoutNav />
      </BackgroundMusicProvider>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <AppContent />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
