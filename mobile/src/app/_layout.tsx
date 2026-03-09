// Root Layout - App Entry Point with Splash and Onboarding

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, AppState, Text, Image } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppStore, useIsOnboarded, useIsDarkMode, useThemeColors, useLanguage } from '@/lib/store';
import logger from '@/lib/logger';
import { SplashScreen } from '@/components/SplashScreen';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { BackgroundMusicProvider } from '@/components/BackgroundMusicProvider';
import { initializeNotifications, markAppOpenedToday } from '@/lib/notifications';
import { useBrandingStore } from '@/lib/branding-service';
import GiftModal, { type PendingGift } from '@/components/GiftModal';
import { ReceivedGiftModal, type ReceivedGift } from '@/components/ReceivedGiftModal';
import { gamificationApi } from '@/lib/gamification-api';
import { fetchWithTimeout } from '@/lib/fetch';
import { prefetchDevotionals, checkAndPrefetchOnDateChange } from '@/lib/devotional-cache';
import { usePackRevealRequest, useClearPackRevealRequest, useRequestPackReveal } from '@/lib/store';
import { PackOpeningModal } from '@/components/PackOpeningModal';
import { initCardImageCache, downloadCollection } from '@/lib/card-image-cache';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

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
        <Stack.Screen
          name="collections/adventures"
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="biblical-cards-album"
          options={{
            presentation: 'card',
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
  const heartbeatSessionId = useAppStore(s => s.heartbeatSessionId);
  const setHeartbeatSessionId = useAppStore(s => s.setHeartbeatSessionId);
  const bumpResumeTick = useAppStore(s => s.bumpResumeTick);
  const queryClient = useQueryClient();
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);
  const fetchBranding = useBrandingStore(s => s.fetchBranding);

  // Root-level pack reveal — rendered above all navigation layers
  const packRevealRequest = usePackRevealRequest();
  const clearPackRevealRequest = useClearPackRevealRequest();
  const requestPackReveal = useRequestPackReveal();
  const router = useRouter();

  // Gift modal state
  const [pendingGift, setPendingGift] = useState<PendingGift | null>(null);
  const [showGiftModal, setShowGiftModal] = useState(false);

  // Received item gift (peer-to-peer gift notifications)
  const [pendingReceivedGift, setPendingReceivedGift] = useState<ReceivedGift | null>(null);
  const [showReceivedGiftModal, setShowReceivedGiftModal] = useState(false);

  const appStateRef = useRef(AppState.currentState);
  // Stable refs for AppState listener (register-once pattern)
  const isOnboardedRef = useRef(false);
  const userIdRef = useRef<string | undefined>(undefined);
  // Global cooldown: ignore resumes fired within 2s of each other
  const lastLayoutResumeRef = useRef<number>(0);
  // Heartbeat state
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatInFlightRef = useRef(false);
  const sessionIdRef = useRef<string | null>(heartbeatSessionId);

  // Keep ref in sync with persisted store value
  useEffect(() => {
    sessionIdRef.current = heartbeatSessionId;
  }, [heartbeatSessionId]);

  // Keep stable refs in sync for the register-once AppState listener
  useEffect(() => { isOnboardedRef.current = isOnboarded; }, [isOnboarded]);
  useEffect(() => { userIdRef.current = user?.id; }, [user?.id]);

  const sendHeartbeat = useCallback(async (userId: string) => {
    if (heartbeatInFlightRef.current) return; // throttle: skip if request in flight
    heartbeatInFlightRef.current = true;
    try {
      const result = await gamificationApi.sessionHeartbeat(userId, sessionIdRef.current ?? undefined);
      if (result.sessionId !== sessionIdRef.current) {
        sessionIdRef.current = result.sessionId;
        setHeartbeatSessionId(result.sessionId);
      }
    } catch {
      // silent fail — non-critical
    } finally {
      heartbeatInFlightRef.current = false;
    }
  }, [setHeartbeatSessionId]);

  const startHeartbeat = useCallback((userId: string) => {
    if (heartbeatTimerRef.current) return;
    // Send one immediately on start/resume
    sendHeartbeat(userId);
    heartbeatTimerRef.current = setInterval(() => {
      sendHeartbeat(userId);
    }, 30_000); // every 30s
  }, [sendHeartbeat]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

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

  // Check for received peer-to-peer item gifts
  const checkReceivedGifts = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/store/gift/notifications`, {
        headers: { 'X-User-Id': user.id },
      });
      if (!res.ok) return;
      const data = await res.json();
      const notifs: ReceivedGift[] = data.notifications ?? [];
      if (notifs.length > 0) {
        // Show the first unseen notification; others will appear next time
        setPendingReceivedGift(notifs[0]);
        setShowReceivedGiftModal(true);
      }
    } catch {
      // Silent fail
    }
  }, [user?.id]);

  // Stable callback refs for the register-once AppState listener
  const checkPendingGiftRef = useRef(checkPendingGift);
  useEffect(() => { checkPendingGiftRef.current = checkPendingGift; }, [checkPendingGift]);
  const checkReceivedGiftsRef = useRef(checkReceivedGifts);
  useEffect(() => { checkReceivedGiftsRef.current = checkReceivedGifts; }, [checkReceivedGifts]);
  const startHeartbeatRef = useRef(startHeartbeat);
  useEffect(() => { startHeartbeatRef.current = startHeartbeat; }, [startHeartbeat]);
  const stopHeartbeatRef = useRef(stopHeartbeat);
  useEffect(() => { stopHeartbeatRef.current = stopHeartbeat; }, [stopHeartbeat]);
  const checkAndPrefetchOnDateChangeRef = useRef(checkAndPrefetchOnDateChange);
  useEffect(() => { checkAndPrefetchOnDateChangeRef.current = checkAndPrefetchOnDateChange; }, [checkAndPrefetchOnDateChange]);
  const bumpResumeTickRef = useRef(bumpResumeTick);
  useEffect(() => { bumpResumeTickRef.current = bumpResumeTick; }, [bumpResumeTick]);

  useEffect(() => {
    // Hide native splash screen once we're ready
    const prepare = async () => {
      await ExpoSplashScreen.hideAsync();
      setAppReady(true);
    };
    prepare();
    // Kick off branding fetch immediately on startup
    fetchBranding();
    // Warm card image cache immediately — before user ever navigates to album.
    // This runs the disk scan + downloads both collections in the background.
    initCardImageCache();
    downloadCollection('inicial');
    downloadCollection('pascua');
    downloadCollection('milagros');
  }, []);

  // Start heartbeat when user is ready; stop on unmount
  useEffect(() => {
    if (appReady && isOnboarded && user?.id) {
      startHeartbeat(user.id);
    } else {
      stopHeartbeat();
    }
    return () => stopHeartbeat();
  }, [appReady, isOnboarded, user?.id, startHeartbeat, stopHeartbeat]);

  // Check for pending gifts on app start (after onboarding)
  useEffect(() => {
    if (appReady && isOnboarded && user?.id) {
      checkPendingGift();
      checkReceivedGifts();
    }
  }, [appReady, isOnboarded, user?.id]);

  // Check for pending gifts when app comes to foreground — registered ONCE (stable-ref pattern)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextAppState;

      const wasBackground = prev.match(/inactive|background/);
      const isNowActive = nextAppState === 'active';
      const isNowBackground = nextAppState.match(/inactive|background/);

      if (wasBackground && isNowActive) {
        // Global cooldown: ignore duplicate resume events within 2s
        const now = Date.now();
        if (now - lastLayoutResumeRef.current < 2_000) {
          logger.debug('[Layout] App resumed — cooldown active, skipping pipeline');
          return;
        }
        lastLayoutResumeRef.current = now;

        logger.debug('[Layout] App resumed from background → running resume pipeline');
        // Notify all subscribers (e.g. Community screen) via store tick
        bumpResumeTickRef.current();
        if (isOnboardedRef.current) {
          logger.debug('[Layout] Resume: checkAndPrefetchOnDateChange');
          checkAndPrefetchOnDateChangeRef.current().catch(() => {});
        }
        if (isOnboardedRef.current && userIdRef.current) {
          logger.debug('[Layout] Resume: checkPendingGift + checkReceivedGifts + startHeartbeat');
          checkPendingGiftRef.current();
          checkReceivedGiftsRef.current();
          startHeartbeatRef.current(userIdRef.current);
        }
      } else if (isNowBackground) {
        logger.debug('[Layout] App went to background → stopHeartbeat');
        stopHeartbeatRef.current();
      }
    });
    return () => subscription.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — stable-ref pattern, registers once

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

  // Received peer-to-peer gift handlers
  const handleReceivedGiftClose = useCallback(async () => {
    if (!user?.id || !pendingReceivedGift) return;
    // Receiver dismisses → reject (marks seen, no status change to "delivered")
    try {
      await fetchWithTimeout(`${BACKEND_URL}/api/store/gift/notifications/${pendingReceivedGift.notificationId}/reject`, {
        method: 'POST',
        headers: { 'X-User-Id': user.id },
      });
    } catch { /* silent */ }
    setShowReceivedGiftModal(false);
    setPendingReceivedGift(null);
  }, [user?.id, pendingReceivedGift]);

  const handleReceivedGiftEquip = useCallback(async () => {
    if (!user?.id || !pendingReceivedGift) return;
    // Receiver equips → accept (marks seen + sets status "delivered", notifies sender)
    try {
      await fetchWithTimeout(`${BACKEND_URL}/api/store/gift/notifications/${pendingReceivedGift.notificationId}/accept`, {
        method: 'POST',
        headers: { 'X-User-Id': user.id },
      });
    } catch { /* silent */ }
    setShowReceivedGiftModal(false);
    setPendingReceivedGift(null);
    // Navigate to store so user can equip the item
  }, [user?.id, pendingReceivedGift]);

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
      {pendingReceivedGift && (
        <ReceivedGiftModal
          visible={showReceivedGiftModal}
          gift={pendingReceivedGift}
          onEquip={handleReceivedGiftEquip}
          onClose={handleReceivedGiftClose}
        />
      )}
      {/* Root-level pack reveal — mounted ABOVE all navigation and pageSheet layers */}
      {/* Pre-decode pack PNG assets: 1×1 invisible images force RN to decode before animation */}
      <View style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} pointerEvents="none">
        <Image source={require('../../assets/packs/pack_pascua_pack.png')} style={{ width: 1, height: 1 }} />
        <Image source={require('../../assets/packs/pack_pascua_card_back.png')} style={{ width: 1, height: 1 }} />
      </View>
      <PackOpeningModal
        visible={!!packRevealRequest}
        packType={packRevealRequest?.packType ?? null}
        drawnCards={packRevealRequest?.drawnCards ?? []}
        userPoints={user?.points ?? 0}
        onClose={() => {
          console.log('[PackReveal] closed');
          clearPackRevealRequest();
          queryClient.invalidateQueries({ queryKey: ['biblical-cards'] });
        }}
        onViewAlbum={() => {
          console.log('[PackReveal] navigating to album');
          clearPackRevealRequest();
          queryClient.invalidateQueries({ queryKey: ['biblical-cards'] });
          router.push('/biblical-cards-album' as any);
        }}
        onOpenAnother={packRevealRequest?.packType ? async () => {
          const pt = packRevealRequest!.packType;
          const uid = user?.id;
          if (!uid) return;
          console.log('[PackReveal] open another:', pt);
          clearPackRevealRequest();
          try {
            const res = await gamificationApi.purchaseItem(uid, pt);
            const cards = res.drawnCards?.length ? res.drawnCards : (res.drawnCard ? [res.drawnCard] : null);
            if (res.success && cards) {
              queryClient.invalidateQueries({ queryKey: ['biblical-cards'] });
              queryClient.invalidateQueries({ queryKey: ['backendUser'] });
              setTimeout(() => {
                requestPackReveal({ drawnCards: cards, packType: pt });
              }, 350);
            }
          } catch (err) {
            console.log('[PackReveal] open another failed', err);
          }
        } : undefined}
      />
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
