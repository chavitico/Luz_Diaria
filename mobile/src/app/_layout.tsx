// Root Layout - App Entry Point with Splash and Onboarding

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, AppState, Text } from 'react-native';
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
import { initializeNotifications, markAppOpenedToday } from '@/lib/notifications';
import { useBrandingStore } from '@/lib/branding-service';
import GiftModal, { type PendingGift } from '@/components/GiftModal';
import { gamificationApi } from '@/lib/gamification-api';
import { prefetchDevotionals } from '@/lib/devotional-cache';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

const IS_DEV = process.env.EXPO_PUBLIC_APP_ENV === 'dev' || !process.env.EXPO_PUBLIC_APP_ENV;

function DevBanner() {
  if (!IS_DEV) return null;
  return (
    <View style={{ backgroundColor: '#DC2626', paddingVertical: 4, alignItems: 'center', zIndex: 9999 }}>
      <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>
        ⚠ DEV — ENTORNO DE DESARROLLO ⚠
      </Text>
    </View>
  );
}

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
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="support"
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="admin/branding"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="admin/support"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="admin/gifts"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="admin/moderators"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="admin/backup"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="logo-preview"
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
  const user = useAppStore(s => s.user);
  const addNewGiftItem = useAppStore(s => s.addNewGiftItem);
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);
  const fetchBranding = useBrandingStore(s => s.fetchBranding);

  // Gift modal state
  const [pendingGift, setPendingGift] = useState<PendingGift | null>(null);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const appStateRef = useRef(AppState.currentState);

  const checkPendingGift = useCallback(async () => {
    if (!user?.id) return;
    try {
      const result = await gamificationApi.getPendingGift(user.id);
      if (result.gift) {
        setPendingGift(result.gift);
        setShowGiftModal(true);
      }
    } catch {
      // Silent fail - gifts are non-critical
    }
  }, [user?.id]);

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

  // Check for pending gifts on app start (after onboarding)
  useEffect(() => {
    if (appReady && isOnboarded && user?.id) {
      checkPendingGift();
    }
  }, [appReady, isOnboarded, user?.id]);

  // Check for pending gifts when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        isOnboarded &&
        user?.id
      ) {
        checkPendingGift();
      }
      appStateRef.current = nextAppState;
    });
    return () => subscription.remove();
  }, [isOnboarded, user?.id, checkPendingGift]);

  // Initialize notifications + mark app opened (for smart skip logic)
  useEffect(() => {
    if (appReady && isOnboarded) {
      // Mark that user opened the app today, then initialize notifications
      // (smart suppression: if opened before 7 AM, today's notif is cancelled)
      markAppOpenedToday().then(() => {
        initializeNotifications(language);
      });

      // Prefetch next 7 devotionals in background for offline support
      prefetchDevotionals().catch(() => {});
    }
  }, [appReady, isOnboarded, language]);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    // Onboarding sets isOnboarded to true via store
  }, []);

  const handleClaimGift = useCallback(async () => {
    if (!pendingGift || !user?.id) return;
    await gamificationApi.claimGift(user.id, pendingGift.giftDropId);
    // Mark item as new so the store can show a badge
    if (pendingGift.rewardId) {
      addNewGiftItem(pendingGift.rewardId);
    }
    setShowGiftModal(false);
    setPendingGift(null);
  }, [pendingGift, user?.id, addNewGiftItem]);

  const handleLaterGift = useCallback(() => {
    setShowGiftModal(false);
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
      <DevBanner />
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <BackgroundMusicProvider>
        <RootLayoutNav />
      </BackgroundMusicProvider>
      {pendingGift && (
        <GiftModal
          visible={showGiftModal}
          gift={pendingGift}
          onClaim={handleClaimGift}
          onLater={handleLaterGift}
        />
      )}
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
