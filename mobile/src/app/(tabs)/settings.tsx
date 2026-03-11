// Settings Screen - With Avatar Selection and Notification Settings

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
  Image as RNImage,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Settings as SettingsIcon,
  Globe,
  Bell,
  Volume2,
  Flame,
  BookOpen,
  Clock,
  Share2,
  Heart,
  Coins,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Sun,
  Moon,
  User,
  Lock,
  Crown,
  Circle,
  Sparkles,
  BellRing,
  TestTube,
  Smartphone,
  Copy,
  Download,
  Key,
  Users,
  ChevronDown,
  LifeBuoy,
  Type,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useThemeColors,
  useLanguage,
  useUser,
  useIsDarkMode,
  useUserSettings,
  useAppStore,
} from '@/lib/store';
import { APP_BRANDING, TRANSLATIONS, DEFAULT_AVATARS, AVATAR_FRAMES, BADGES, RARITY_COLORS } from '@/lib/constants';
import { fetchWithTimeout } from '@/lib/fetch';

const LOGO_PNG = require('../../../assets/logo/luz-diaria-logo.png');
import type { Language } from '@/lib/types';
import { cn } from '@/lib/cn';
import {
  requestNotificationPermissions,
  scheduleDailyNotification,
  cancelAllScheduledNotifications,
  getNotificationSettings,
  formatNotificationTime,
  sendTestNotification,
  type NotificationSettings,
} from '@/lib/notifications';
import { gamificationApi } from '@/lib/gamification-api';
import { useScaledFont } from '@/lib/textScale';
import { useQueryClient } from '@tanstack/react-query';
import { ShareableProfileCard } from '@/components/ShareableProfileCard';
import { AdminHubModal } from '@/components/AdminHubModal';
import { getLedgerEntries, relativeTime, type LedgerEntry } from '@/lib/points-ledger';
import { CountryPickerModal, getCountryByCode, type Country } from '@/components/CountryPicker';
import { BadgeChip } from '@/components/BadgeChip';
import { BadgeInfoModal } from '@/components/BadgeInfoModal';
import {
  BookOpen as LedgerBookOpen,
  Tag,
  ShoppingBag,
  Trophy,
  Zap,
  Gift,
  Target,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native';

interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  colors: ReturnType<typeof useThemeColors>;
  /** When true, removes the individual row background — use inside SectionCard */
  inCard?: boolean;
  /** When true, shows a bottom separator line */
  separator?: boolean;
}

function SettingRow({ icon, title, subtitle, right, onPress, colors, inCard, separator }: SettingRowProps) {
  const { sFont } = useScaledFont();
  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      disabled={!onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: inCard ? 0 : 16,
        backgroundColor: inCard ? 'transparent' : colors.surface,
        borderRadius: inCard ? 0 : 16,
        marginBottom: inCard ? 0 : 2,
        borderBottomWidth: separator ? 0.5 : 0,
        borderBottomColor: colors.textMuted + '20',
      }}
    >
      <View
        style={{
          width: 38, height: 38, borderRadius: 12,
          alignItems: 'center', justifyContent: 'center',
          marginRight: 14,
          backgroundColor: colors.primary + '15',
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: sFont(15), fontWeight: '500', color: colors.text }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: sFont(12), marginTop: 1, color: colors.textMuted }}>
            {subtitle}
          </Text>
        )}
      </View>
      {right || (onPress && <ChevronRight size={18} color={colors.textMuted} />)}
    </Pressable>
  );
}

/** Premium section card — matches Mi Espacio card aesthetic */
function SectionCard({
  children,
  colors,
}: {
  children: React.ReactNode;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View
      style={{
        borderRadius: 20,
        marginBottom: 10,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <LinearGradient
        colors={[colors.primary + '18', colors.primary + '05', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20, padding: 1 }}
      >
        <View
          style={{
            borderRadius: 19,
            backgroundColor: colors.surface,
            paddingHorizontal: 16,
            paddingVertical: 8,
            overflow: 'hidden',
          }}
        >
          {children}
        </View>
      </LinearGradient>
    </View>
  );
}

/** Muted section label */
function SectionLabel({ label, colors }: { label: string; colors: ReturnType<typeof useThemeColors> }) {
  const { sFont } = useScaledFont();
  return (
    <Text
      style={{
        fontSize: sFont(11),
        fontWeight: '700',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: colors.textMuted,
        marginBottom: 8,
        marginLeft: 4,
        marginTop: 20,
      }}
    >
      {label}
    </Text>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  colors: ReturnType<typeof useThemeColors>;
}

function StatCard({ icon, value, label, colors }: StatCardProps) {
  return (
    <View
      className="flex-1 p-4 rounded-2xl items-center"
      style={{ backgroundColor: colors.surface }}
    >
      {icon}
      <Text className="text-2xl font-bold mt-2" style={{ color: colors.text }}>
        {value}
      </Text>
      <Text className="text-xs mt-1" style={{ color: colors.textMuted }}>
        {label}
      </Text>
    </View>
  );
}

// Avatar with Frame component
function AvatarWithFrame({
  emoji,
  frameId,
  size = 64
}: {
  emoji: string;
  frameId?: string | null;
  size?: number
}) {
  const colors = useThemeColors();
  const frameColor = frameId ? AVATAR_FRAMES[frameId]?.color : null;

  return (
    <View
      className="items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        borderWidth: frameColor ? 3 : 0,
        borderColor: frameColor || 'transparent',
        backgroundColor: colors.primary + '15',
      }}
    >
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const language = useLanguage();
  const user = useUser();
  const isDarkMode = useIsDarkMode();
  const settings = useUserSettings();
  const router = useRouter();
  const t = TRANSLATIONS[language];

  const setDarkMode = useAppStore((s) => s.setDarkMode);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const updateUser = useAppStore((s) => s.updateUser);
  const setOnboarded = useAppStore((s) => s.setOnboarded);
  const setUser = useAppStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const { sFont } = useScaledFont();

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [showGenerateCodeModal, setShowGenerateCodeModal] = useState(false);
  const [showEnterCodeModal, setShowEnterCodeModal] = useState(false);
  const [transferExpanded, setTransferExpanded] = useState(false);
  const [showProfileShare, setShowProfileShare] = useState(false);

  // Transfer code state
  const [transferCode, setTransferCode] = useState<string | null>(null);
  const [transferCodeExpiry, setTransferCodeExpiry] = useState<Date | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [showAdminHub, setShowAdminHub] = useState(false);
  const [adminTapCount, setAdminTapCount] = useState(0);
  const adminTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [expiryCountdown, setExpiryCountdown] = useState<number>(0);

  // Debug panel state
  const BACKEND_URL_CONST = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';
  const EMERGENCY_IDS = ['cmml8uiit0000m2vluztbkjwf'];
  const [debugBackendRole, setDebugBackendRole] = useState<string | null>(null);
  const [debugBackendStatus, setDebugBackendStatus] = useState<string | null>(null);
  const [debugCommunityCount, setDebugCommunityCount] = useState<number | null>(null);
  const [debugCommunityNicknames, setDebugCommunityNicknames] = useState<string[] | null>(null);
  const [debugMeNickname, setDebugMeNickname] = useState<string | null>(null);
  const [debugMeUserId, setDebugMeUserId] = useState<string | null>(null);
  const [debugEnvName, setDebugEnvName] = useState<string | null>(null);
  const fetchDebugBackendRole = useCallback(async () => {
    if (!user?.nickname) return;
    try {
      // Query by nickname ONLY — sending the stale local id would return the wrong user
      // and make the debug panel falsely show "ID MATCH" while the wrong identity is active.
      const res = await fetchWithTimeout(`${BACKEND_URL_CONST}/api/gamification/me`, {
        headers: { 'X-User-Nickname': user.nickname },
      });
      setDebugBackendStatus(String(res.status));
      if (res.ok) {
        const data = await res.json() as { role?: string; nickname?: string; id?: string };
        setDebugBackendRole(data?.role ?? 'null');
        setDebugMeNickname(data?.nickname ?? 'null');
        setDebugMeUserId(data?.id ?? 'null');
        // HARD FIX: if backend canonical id differs from store, overwrite immediately.
        // This ensures the Settings footer (and all screens) show the correct id
        // even if the bootstrap in _layout.tsx ran with the old stale-id logic.
        if (data?.id && data.id !== user?.id) {
          console.log(`[Settings] fetchDebugBackendRole: correcting store userId ${user?.id} → ${data.id}`);
          const fixes: Record<string, string> = { id: data.id };
          if (data.nickname && data.nickname !== user?.nickname) fixes.nickname = data.nickname;
          if (data.role && data.role !== (user as { role?: string })?.role) fixes.role = data.role;
          updateUser(fixes as Parameters<typeof updateUser>[0]);
          queryClient.invalidateQueries();
        }
      } else {
        setDebugBackendRole(`error-${res.status}`);
        setDebugMeUserId('error');
      }
    } catch (e) {
      setDebugBackendRole(`fetch-error: ${String(e)}`);
      setDebugBackendStatus('network-err');
    }
    // Fetch community members
    try {
      const cr = await fetchWithTimeout(`${BACKEND_URL_CONST}/api/gamification/community/members?limit=50&offset=0`);
      if (cr.ok) {
        const cd = await cr.json() as { members: { nickname: string }[]; total: number };
        setDebugCommunityCount(cd.total);
        setDebugCommunityNicknames(cd.members.map((m) => m.nickname));
      } else {
        setDebugCommunityCount(-1);
        setDebugCommunityNicknames([`error-${cr.status}`]);
      }
    } catch (e) {
      setDebugCommunityCount(-1);
      setDebugCommunityNicknames([`fetch-error: ${String(e)}`]);
    }
    // Fetch health/env
    try {
      const hr = await fetchWithTimeout(`${BACKEND_URL_CONST}/health`);
      if (hr.ok) {
        const hd = await hr.json() as { appEnv?: string; isProd?: boolean };
        setDebugEnvName(`${hd.appEnv ?? '?'} (isProd=${hd.isProd})`);
      } else {
        setDebugEnvName(`health-err-${hr.status}`);
      }
    } catch (e) {
      setDebugEnvName(`health-fetch-error`);
    }
  }, [user?.id, user?.nickname]);

  // Notification state
  const [notificationSettings, setNotificationSettingsState] = useState<NotificationSettings>({
    enabled: false,
    hour: 6,
    minute: 0,
  });
  const [selectedTime, setSelectedTime] = useState(new Date());

  // Community opt-in state
  const [communityOptIn, setCommunityOptIn] = useState(false);
  const [isLoadingCommunityOptIn, setIsLoadingCommunityOptIn] = useState(true);

  // Prayer display opt-in state
  const [prayerDisplayOptIn, setPrayerDisplayOptIn] = useState(true);
  const [isLoadingPrayerOptIn, setIsLoadingPrayerOptIn] = useState(true);

  // Country state
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [showCountryInCommunity, setShowCountryInCommunity] = useState(true);
  const [isLoadingCountry, setIsLoadingCountry] = useState(true);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // Active badge state
  const [activeBadgeId, setActiveBadgeId] = useState<string | null>(null);
  const [ownedBadgeIds, setOwnedBadgeIds] = useState<string[]>([]);
  const [badgeInfoId, setBadgeInfoId] = useState<string | null>(null);

  // Points ledger state
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [showFullLedger, setShowFullLedger] = useState(false);

  // Pending support tickets badge
  const [pendingSupportCount, setPendingSupportCount] = useState(0);

  const loadPendingSupport = useCallback(async () => {
    if (!user?.id) return;
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/support/tickets/${user.id}`);
      if (!res.ok) return; // silent fail for non-critical feature
      const data = await res.json() as { tickets?: Array<{ status: string }> };
      const count = (data.tickets ?? []).filter(t => t.status === 'waiting_user').length;
      setPendingSupportCount(count);
    } catch {}
  }, [user?.id]);

  const loadLedger = useCallback(async () => {
    const entries = await getLedgerEntries();
    setLedgerEntries(entries);
  }, []);

  // Reload ledger whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      loadLedger();
      loadPendingSupport();
      loadBadgeData();
      fetchDebugBackendRole();
    }, [loadLedger, loadPendingSupport, fetchDebugBackendRole])
  );

  // Load notification settings and community opt-in on mount
  useEffect(() => {
    loadNotificationSettings();
    loadCommunityOptIn();
    loadPrayerDisplayOptIn();
    loadCountry();
    loadBadgeData();
  }, [user?.id]);

  const loadCommunityOptIn = async () => {
    if (!user?.id) {
      setIsLoadingCommunityOptIn(false);
      return;
    }
    try {
      const result = await gamificationApi.getCommunityOptIn(user.id);
      setCommunityOptIn(result.communityOptIn);
    } catch (error) {
      console.error('[Settings] Error loading community opt-in:', error);
    } finally {
      setIsLoadingCommunityOptIn(false);
    }
  };

  const handleCommunityOptInToggle = async (value: boolean) => {
    if (!user?.id) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic update
    setCommunityOptIn(value);

    try {
      await gamificationApi.updateCommunityOptIn(user.id, value);
      // Invalidate community members query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['community-members'] });

      if (value) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      // Revert on error
      setCommunityOptIn(!value);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es'
          ? 'No se pudo actualizar la configuracion. Intenta de nuevo.'
          : 'Failed to update setting. Please try again.'
      );
    }
  };

  const loadPrayerDisplayOptIn = async () => {
    if (!user?.id) {
      setIsLoadingPrayerOptIn(false);
      return;
    }
    try {
      const result = await gamificationApi.getPrayerDisplayOptIn(user.id);
      setPrayerDisplayOptIn(result.prayerDisplayOptIn);
    } catch (error) {
      console.error('[Settings] Error loading prayer display opt-in:', error);
    } finally {
      setIsLoadingPrayerOptIn(false);
    }
  };

  const handlePrayerDisplayOptInToggle = async (value: boolean) => {
    if (!user?.id) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic update
    setPrayerDisplayOptIn(value);

    try {
      await gamificationApi.updatePrayerDisplayOptIn(user.id, value);
      // Invalidate prayer requests to refresh
      queryClient.invalidateQueries({ queryKey: ['community-prayer-requests'] });

      if (value) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      // Revert on error
      setPrayerDisplayOptIn(!value);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es'
          ? 'No se pudo actualizar la configuracion. Intenta de nuevo.'
          : 'Failed to update setting. Please try again.'
      );
    }
  };

  const loadCountry = async () => {
    if (!user?.id) {
      setIsLoadingCountry(false);
      return;
    }
    try {
      const result = await gamificationApi.getCountry(user.id);
      setCountryCode(result.countryCode);
      setShowCountryInCommunity(result.showCountry);
    } catch {
      // non-critical
    } finally {
      setIsLoadingCountry(false);
    }
  };

  const handleCountrySelect = async (country: Country) => {
    if (!user?.id) return;
    setShowCountryPicker(false);
    setCountryCode(country.code);
    try {
      await gamificationApi.updateCountry(user.id, { countryCode: country.code });
      queryClient.invalidateQueries({ queryKey: ['community-members'] });
    } catch {
      setCountryCode(countryCode); // revert
    }
  };

  const handleShowCountryToggle = async (value: boolean) => {
    if (!user?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCountryInCommunity(value);
    try {
      await gamificationApi.updateCountry(user.id, { showCountry: value });
      queryClient.invalidateQueries({ queryKey: ['community-members'] });
    } catch {
      setShowCountryInCommunity(!value);
    }
  };

  const loadBadgeData = async () => {
    if (!user?.id) return;
    try {
      const profile = await gamificationApi.getUser(user.id);
      const badges = profile.inventory
        .filter((inv) => inv.item.type === 'badge')
        .map((inv) => inv.itemId);
      setOwnedBadgeIds(badges);
      setActiveBadgeId(profile.activeBadgeId ?? null);
      // Sync points from backend into local store
      updateUser({ points: profile.points });
      // Sync role from backend into local store
      if (profile.role && profile.role !== user.role) {
        updateUser({ role: profile.role as 'USER' | 'MODERATOR' | 'OWNER' });
      }
    } catch {
      // non-critical
    }
  };

  const handleEquipBadge = async (badgeId: string | null) => {
    if (!user?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveBadgeId(badgeId);
    try {
      await gamificationApi.equipItem(user.id, 'badge', badgeId);
      queryClient.invalidateQueries({ queryKey: ['community-members'] });
    } catch {
      setActiveBadgeId(activeBadgeId); // revert
    }
  };

  const loadNotificationSettings = async () => {
    const saved = await getNotificationSettings();
    setNotificationSettingsState(saved);
    // Set the time picker to the saved time
    const date = new Date();
    date.setHours(saved.hour, saved.minute, 0, 0);
    setSelectedTime(date);
  };

  // Countdown timer for transfer code expiry
  useEffect(() => {
    if (!transferCodeExpiry) {
      setExpiryCountdown(0);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const diff = Math.max(0, Math.floor((transferCodeExpiry.getTime() - now.getTime()) / 1000));
      setExpiryCountdown(diff);

      if (diff <= 0) {
        setTransferCode(null);
        setTransferCodeExpiry(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [transferCodeExpiry]);

  // Format code with space in middle (XXXX XXXX)
  const formatTransferCode = (code: string): string => {
    if (code.length <= 4) return code.toUpperCase();
    return `${code.slice(0, 4)} ${code.slice(4)}`.toUpperCase();
  };

  // Format countdown time
  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate transfer code
  const handleGenerateCode = async () => {
    if (!user?.id) return;

    setIsGeneratingCode(true);
    try {
      const result = await gamificationApi.generateTransferCode(user.id);
      setTransferCode(result.code);
      setTransferCodeExpiry(new Date(result.expiresAt));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es'
          ? 'No se pudo generar el codigo. Intenta de nuevo.'
          : 'Failed to generate code. Please try again.'
      );
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = async () => {
    if (!transferCode) return;

    await Clipboard.setStringAsync(transferCode);
    setCodeCopied(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setTimeout(() => setCodeCopied(false), 2000);
  };

  // Handle code input - auto format
  const handleCodeInput = (text: string) => {
    // Remove spaces and non-alphanumeric chars, limit to 8 chars
    const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
    setEnteredCode(cleaned);
    setRestoreError(null);
  };

  // Restore account with code
  const handleRestore = async () => {
    if (!user?.id || enteredCode.length !== 8) return;

    setIsRestoring(true);
    setRestoreError(null);

    try {
      const result = await gamificationApi.restoreWithCode(enteredCode, user.id);

      if (result.success && result.user) {
        // Update local user state with restored data
        updateUser({
          points: result.user.points,
          streakCurrent: result.user.streakCurrent,
          streakBest: result.user.streakBest,
          devotionalsCompleted: result.user.devotionalsCompleted,
          totalTime: result.user.totalTimeSeconds,
          frameId: result.user.frameId,
          titleId: result.user.titleId,
          themeId: result.user.themeId,
          selectedMusicId: result.user.selectedMusicId,
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowEnterCodeModal(false);
        setEnteredCode('');

        Alert.alert(
          t.restore_success,
          t.restore_success_desc
        );
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setRestoreError(error.message || t.invalid_code);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (enabled) {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert(
          language === 'es' ? 'Permisos necesarios' : 'Permissions Required',
          language === 'es'
            ? 'Por favor habilita las notificaciones en la configuración de tu dispositivo.'
            : 'Please enable notifications in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Schedule with current time settings
      const identifier = await scheduleDailyNotification(
        notificationSettings.hour,
        notificationSettings.minute,
        language
      );

      if (identifier) {
        setNotificationSettingsState((prev) => ({ ...prev, enabled: true, scheduledIdentifier: identifier }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      await cancelAllScheduledNotifications();
      setNotificationSettingsState((prev) => ({ ...prev, enabled: false }));
    }
  };

  const handleTimeChange = (event: any, date?: Date) => {
    if (date) {
      setSelectedTime(date);
    }
  };

  const handleTimeSave = async () => {
    const hour = selectedTime.getHours();
    const minute = selectedTime.getMinutes();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Update state
    setNotificationSettingsState((prev) => ({ ...prev, hour, minute }));

    // If notifications are enabled, reschedule with new time
    if (notificationSettings.enabled) {
      await scheduleDailyNotification(hour, minute, language);
    }

    setShowTimePickerModal(false);

    // Show confirmation
    Alert.alert(
      language === 'es' ? 'Hora actualizada' : 'Time Updated',
      language === 'es'
        ? `Recibirás tu recordatorio a las ${formatNotificationTime(hour, minute)}`
        : `You'll receive your reminder at ${formatNotificationTime(hour, minute)}`,
      [{ text: 'OK' }]
    );
  };

  const handleTestNotification = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await sendTestNotification(language);
    Alert.alert(
      language === 'es' ? 'Notificación enviada' : 'Notification Sent',
      language === 'es'
        ? 'Deberías recibir una notificación de prueba en unos segundos.'
        : 'You should receive a test notification in a few seconds.',
      [{ text: 'OK' }]
    );
  };

  const handleResetLocalData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      language === 'es' ? 'Restablecer datos locales' : 'Reset Local Data',
      language === 'es'
        ? 'Esto borrara todos los datos guardados en este dispositivo y volveras a la pantalla de registro. Tu cuenta en el servidor NO se eliminara.'
        : 'This will clear all locally stored data and return you to the registration screen. Your server account will NOT be deleted.',
      [
        {
          text: language === 'es' ? 'Cancelar' : 'Cancel',
          style: 'cancel',
        },
        {
          text: language === 'es' ? 'Restablecer' : 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              setOnboarded(false);
              // @ts-ignore — null is valid to clear the user
              setUser(null);
            } catch (e) {
              Alert.alert(
                language === 'es' ? 'Error' : 'Error',
                language === 'es' ? 'No se pudo restablecer. Intenta de nuevo.' : 'Could not reset. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const purchasedItems = user?.purchasedItems ?? [];

  // Check if avatar is available (free or purchased)
  const isAvatarAvailable = (avatar: typeof DEFAULT_AVATARS[number]) => {
    if ('unlocked' in avatar && avatar.unlocked) return true;
    if ('price' in avatar && purchasedItems.includes(avatar.id)) return true;
    return false;
  };

  const handleAvatarSelect = (avatarId: string) => {
    const avatar = DEFAULT_AVATARS.find((a) => a.id === avatarId);
    if (!avatar || !isAvatarAvailable(avatar)) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateUser({ avatar: avatarId });
    setShowAvatarModal(false);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View className="px-5" style={{ paddingTop: insets.top + 16 }}>
          <View className="flex-row items-center mb-6">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface,
                marginRight: 12,
              }}
            >
              <ChevronLeft size={22} color={colors.text} />
            </Pressable>
            <Text className="text-3xl font-bold" style={{ color: colors.text }}>
              {t.settings}
            </Text>
          </View>

          {/* ── SECTION 1: PRIVACIDAD ─────────────────────────────── */}
          <SectionLabel label={language === 'es' ? 'Privacidad' : 'Privacy'} colors={colors} />
          <SectionCard colors={colors}>
            <SettingRow
              inCard separator
              icon={<Users size={20} color={colors.primary} />}
              title={language === 'es' ? 'Mostrarme en Comunidad' : 'Show me in Community'}
              subtitle={language === 'es' ? 'Permite que otros vean tu progreso' : 'Allow others to see your progress'}
              colors={colors}
              right={
                isLoadingCommunityOptIn ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Switch
                    value={communityOptIn}
                    onValueChange={handleCommunityOptInToggle}
                    disabled={isLoadingCommunityOptIn}
                    trackColor={{ false: colors.textMuted + '40', true: colors.primary + '60' }}
                    thumbColor={communityOptIn ? colors.primary : '#FFFFFF'}
                  />
                )
              }
            />
            <SettingRow
              inCard separator
              icon={<Heart size={20} color={colors.primary} />}
              title={t.prayer_display_opt_in}
              subtitle={t.prayer_display_opt_in_desc}
              colors={colors}
              right={
                isLoadingPrayerOptIn ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Switch
                    value={prayerDisplayOptIn}
                    onValueChange={handlePrayerDisplayOptInToggle}
                    trackColor={{ false: colors.textMuted + '40', true: colors.primary + '60' }}
                    thumbColor={prayerDisplayOptIn ? colors.primary : '#FFFFFF'}
                  />
                )
              }
            />
            <SettingRow
              inCard separator
              icon={
                countryCode
                  ? <Text style={{ fontSize: sFont(20) }}>{getCountryByCode(countryCode)?.flag ?? '🌍'}</Text>
                  : <Globe size={20} color={colors.primary} />
              }
              title={language === 'es' ? 'Mi país' : 'My Country'}
              subtitle={
                isLoadingCountry
                  ? '...'
                  : countryCode
                    ? getCountryByCode(countryCode)?.name ?? countryCode
                    : language === 'es' ? 'No seleccionado' : 'Not selected'
              }
              colors={colors}
              onPress={() => setShowCountryPicker(true)}
            />
            <SettingRow
              inCard
              icon={<Users size={20} color={colors.primary} />}
              title={language === 'es' ? 'Mostrar mi país en Comunidad' : 'Show my country in Community'}
              subtitle={language === 'es' ? 'Muestra tu bandera junto a tu nombre' : 'Show your flag next to your name'}
              colors={colors}
              right={
                <Switch
                  value={showCountryInCommunity}
                  onValueChange={handleShowCountryToggle}
                  trackColor={{ false: colors.textMuted + '40', true: colors.primary + '60' }}
                  thumbColor={showCountryInCommunity ? colors.primary : '#FFFFFF'}
                />
              }
            />
          </SectionCard>

          {/* ── SECTION 2: NOTIFICACIONES ─────────────────────────── */}
          <SectionLabel label={language === 'es' ? 'Notificaciones' : 'Notifications'} colors={colors} />
          <SectionCard colors={colors}>
            <SettingRow
              inCard separator
              icon={<Bell size={20} color={colors.primary} />}
              title={language === 'es' ? 'Recordatorio diario' : 'Daily Reminder'}
              subtitle={
                notificationSettings.enabled
                  ? `${language === 'es' ? 'Activo' : 'Active'} - ${formatNotificationTime(notificationSettings.hour, notificationSettings.minute)}`
                  : language === 'es' ? 'Desactivado' : 'Disabled'
              }
              colors={colors}
              right={
                <Switch
                  value={notificationSettings.enabled}
                  onValueChange={handleNotificationToggle}
                  trackColor={{ false: colors.textMuted + '40', true: colors.primary + '60' }}
                  thumbColor={notificationSettings.enabled ? colors.primary : '#FFFFFF'}
                />
              }
            />
            {notificationSettings.enabled && (
              <>
                <SettingRow
                  inCard separator
                  icon={<Clock size={20} color={colors.primary} />}
                  title={language === 'es' ? 'Hora del recordatorio' : 'Reminder Time'}
                  subtitle={formatNotificationTime(notificationSettings.hour, notificationSettings.minute)}
                  colors={colors}
                  onPress={() => setShowTimePickerModal(true)}
                />
                <SettingRow
                  inCard separator
                  icon={<TestTube size={20} color={colors.secondary} />}
                  title={language === 'es' ? 'Probar notificación' : 'Test Notification'}
                  subtitle={language === 'es' ? 'Enviar una notificación de prueba' : 'Send a test notification'}
                  colors={colors}
                  onPress={handleTestNotification}
                />
              </>
            )}
            <SettingRow
              inCard
              icon={<Flame size={20} color={colors.primary} />}
              title={t.streak_reminders}
              colors={colors}
              right={
                <Switch
                  value={settings.streakReminders}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateSettings({ streakReminders: value });
                  }}
                  trackColor={{ false: colors.textMuted + '40', true: colors.primary + '60' }}
                  thumbColor={settings.streakReminders ? colors.primary : '#FFFFFF'}
                />
              }
            />
          </SectionCard>

          {/* ── SECTION 3: APARIENCIA ─────────────────────────────── */}
          <SectionLabel label={language === 'es' ? 'Apariencia' : 'Appearance'} colors={colors} />
          <SectionCard colors={colors}>
            <SettingRow
              inCard separator
              icon={isDarkMode ? <Moon size={20} color={colors.primary} /> : <Sun size={20} color={colors.primary} />}
              title="Dark Mode"
              colors={colors}
              right={
                <Switch
                  value={isDarkMode}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDarkMode(value);
                  }}
                  trackColor={{ false: colors.textMuted + '40', true: colors.primary + '60' }}
                  thumbColor={isDarkMode ? colors.primary : '#FFFFFF'}
                />
              }
            />
            <SettingRow
              inCard separator
              icon={<Globe size={20} color={colors.primary} />}
              title={t.language}
              subtitle={language === 'en' ? 'English' : 'Español'}
              colors={colors}
              onPress={() => setShowLanguageModal(true)}
            />

            {/* Text Zoom */}
            <View style={{ paddingVertical: 13, borderBottomWidth: ownedBadgeIds.length > 0 ? 0.5 : 0, borderBottomColor: colors.textMuted + '20' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary + '15' }}>
                    <Type size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={{ fontSize: sFont(15), fontWeight: '500', color: colors.text }}>
                      {language === 'es' ? 'Zoom de texto' : 'Text zoom'}
                    </Text>
                    <Text style={{ fontSize: sFont(12), color: colors.textMuted }}>
                      {language === 'es' ? 'Tamaño de letra en toda la app' : 'Font size across the app'}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: sFont(17), fontWeight: '800', color: colors.primary }}>
                    {Math.round((settings.textScale ?? 1.0) * 100)}%
                  </Text>
                  {(settings.textScale ?? 1.0) !== 1.0 && (
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        updateSettings({ textScale: 1.0 });
                      }}
                      style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: colors.textMuted + '18' }}
                    >
                      <Text style={{ fontSize: sFont(11), color: colors.textMuted, fontWeight: '600' }}>
                        {language === 'es' ? 'Restablecer' : 'Reset'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
              <Slider
                value={settings.textScale ?? 1.0}
                onValueChange={(value) => {
                  const snapped = Math.round(value / 0.05) * 0.05;
                  updateSettings({ textScale: snapped });
                }}
                minimumValue={0.85}
                maximumValue={1.40}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.textMuted + '40'}
                thumbTintColor={colors.primary}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                <Text style={{ fontSize: sFont(10), color: colors.textMuted }}>85%</Text>
                <Text style={{ fontSize: sFont(10), color: colors.textMuted }}>100%</Text>
                <Text style={{ fontSize: sFont(10), color: colors.textMuted }}>140%</Text>
              </View>
            </View>

            {/* Badge Selection — inside Apariencia */}
            {ownedBadgeIds.length > 0 && (
              <View style={{ paddingVertical: 13 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary + '15' }}>
                    <Crown size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={{ fontSize: sFont(15), fontWeight: '500', color: colors.text }}>
                      {language === 'es' ? 'Insignia activa' : 'Active Badge'}
                    </Text>
                    <Text style={{ fontSize: sFont(12), color: colors.textMuted }}>
                      {language === 'es' ? 'Aparece junto a tu nombre en Comunidad' : 'Shown next to your name in Community'}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <Pressable
                    onPress={() => handleEquipBadge(null)}
                    style={{
                      paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12,
                      backgroundColor: activeBadgeId === null ? colors.primary + '20' : colors.background,
                      borderWidth: 1.5,
                      borderColor: activeBadgeId === null ? colors.primary : colors.textMuted + '30',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: sFont(11), fontWeight: '600', color: activeBadgeId === null ? colors.primary : colors.textMuted }}>
                      {language === 'es' ? 'Ninguna' : 'None'}
                    </Text>
                  </Pressable>
                  {ownedBadgeIds.map((badgeId) => {
                    const isActive = activeBadgeId === badgeId;
                    const badge = BADGES[badgeId];
                    if (!badge) return null;
                    return (
                      <Pressable
                        key={badgeId}
                        onPress={() => handleEquipBadge(badgeId)}
                        style={{
                          flexDirection: 'row', alignItems: 'center',
                          paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12,
                          backgroundColor: isActive ? badge.color + '20' : colors.background,
                          borderWidth: 1.5,
                          borderColor: isActive ? badge.color : colors.textMuted + '30',
                          gap: 6,
                        }}
                      >
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setBadgeInfoId(badgeId);
                          }}
                          hitSlop={4}
                        >
                          <BadgeChip badgeId={badgeId} variant="community" />
                        </Pressable>
                        <Text style={{ fontSize: sFont(11), fontWeight: '600', color: isActive ? badge.color : colors.textMuted }}>
                          {badge.nameEs}
                        </Text>
                        {isActive && (
                          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: badge.color, alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={8} color="#FFFFFF" strokeWidth={3} />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </SectionCard>

          {/* ── SECTION 4: HISTORIAL DE PUNTOS ───────────────────── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginLeft: 4, marginTop: 20 }}>
            <Text style={{ fontSize: sFont(11), fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: colors.textMuted }}>
              {language === 'es' ? 'Historial de Puntos' : 'Points History'}
            </Text>
            {ledgerEntries.length > 5 && (
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowFullLedger((v) => !v); }}>
                <Text style={{ fontSize: sFont(12), fontWeight: '600', color: colors.primary }}>
                  {showFullLedger ? (language === 'es' ? 'Ver menos' : 'Show less') : (language === 'es' ? 'Ver más' : 'Show more')}
                </Text>
              </Pressable>
            )}
          </View>
          <SectionCard colors={colors}>
            {ledgerEntries.length === 0 ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12, backgroundColor: colors.primary + '18' }}>
                  <Coins size={24} color={colors.primary} />
                </View>
                <Text style={{ fontSize: sFont(14), fontWeight: '600', marginBottom: 4, color: colors.text }}>
                  {language === 'es' ? 'Aún no hay movimientos' : 'No movements yet'}
                </Text>
                <Text style={{ fontSize: sFont(12), textAlign: 'center', color: colors.textMuted }}>
                  {language === 'es'
                    ? 'Completa un devocional, canjea un código\no reclama una colección.'
                    : 'Complete a devotional, redeem a code,\nor claim a collection.'}
                </Text>
              </View>
            ) : (
              (showFullLedger ? ledgerEntries.slice(0, 10) : ledgerEntries.slice(0, 5)).map((entry, idx, arr) => {
                const isPositive = entry.delta > 0;
                const LedgerIcon = (() => {
                  switch (entry.kind) {
                    case 'devotional': return LedgerBookOpen;
                    case 'promo_code': return Tag;
                    case 'purchase': return ShoppingBag;
                    case 'claim': return Trophy;
                    case 'challenge': return Zap;
                    case 'chest': return Gift;
                    case 'mission': return Target;
                    default: return Coins;
                  }
                })();
                const iconColor = isPositive ? '#22c55e' : '#ef4444';
                const deltaText = isPositive ? `+${entry.delta}` : `${entry.delta}`;
                return (
                  <View
                    key={entry.id}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingVertical: 11,
                      borderBottomWidth: idx < arr.length - 1 ? 0.5 : 0,
                      borderBottomColor: colors.textMuted + '20',
                    }}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: (isPositive ? '#22c55e' : '#ef4444') + '18' }}>
                      <LedgerIcon size={16} color={iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: sFont(13), fontWeight: '600', color: colors.text }} numberOfLines={1}>
                        {entry.title}
                      </Text>
                      {entry.detail ? (
                        <Text style={{ fontSize: sFont(11), marginTop: 1, color: colors.textMuted }} numberOfLines={1}>
                          {entry.detail}
                        </Text>
                      ) : null}
                    </View>
                    <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                      <Text style={{ fontSize: sFont(13), fontWeight: '700', color: iconColor }}>{deltaText}</Text>
                      <Text style={{ fontSize: sFont(11), marginTop: 1, color: colors.textMuted }}>{relativeTime(entry.ts, language)}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </SectionCard>

          {/* ── SECTION 5: SOPORTE ───────────────────────────────── */}
          <SectionLabel label={language === 'es' ? 'Ayuda' : 'Help'} colors={colors} />
          <SectionCard colors={colors}>
            <SettingRow
              inCard
              icon={<LifeBuoy size={20} color={colors.primary} />}
              title={language === 'es' ? 'Soporte' : 'Support'}
              subtitle={language === 'es' ? 'Reporta problemas de racha o devocional' : 'Report streak or devotional issues'}
              colors={colors}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/support');
              }}
              right={
                pendingSupportCount > 0 ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
                      <Text style={{ fontSize: sFont(11), fontWeight: '800', color: '#FFF' }}>{pendingSupportCount}</Text>
                    </View>
                    <ChevronRight size={18} color={colors.textMuted} />
                  </View>
                ) : undefined
              }
            />
          </SectionCard>

          {/* ── SECTION 6: MÚSICA ────────────────────────────────── */}
          <SectionLabel label={t.background_music} colors={colors} />
          <SectionCard colors={colors}>
            <SettingRow
              inCard separator={settings.musicEnabled}
              icon={<Volume2 size={20} color={colors.primary} />}
              title={t.background_music}
              colors={colors}
              right={
                <Switch
                  value={settings.musicEnabled}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateSettings({ musicEnabled: value });
                  }}
                  trackColor={{ false: colors.textMuted + '40', true: colors.primary + '60' }}
                  thumbColor={settings.musicEnabled ? colors.primary : '#FFFFFF'}
                />
              }
            />
            {settings.musicEnabled && (
              <View style={{ paddingVertical: 13 }}>
                <Text style={{ fontSize: sFont(13), fontWeight: '500', marginBottom: 10, color: colors.text }}>{t.volume}</Text>
                <Slider
                  value={settings.musicVolume}
                  onValueChange={(value) => updateSettings({ musicVolume: value })}
                  minimumValue={0}
                  maximumValue={1}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.textMuted + '40'}
                  thumbTintColor={colors.primary}
                />
              </View>
            )}
          </SectionCard>

          {/* ── SECTION 7: TRANSFERIR CUENTA ─────────────────────── */}
          <SectionLabel label={t.account_transfer} colors={colors} />
          <SectionCard colors={colors}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTransferExpanded((v) => !v);
              }}
              style={{ paddingVertical: 13 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14, backgroundColor: colors.primary + '15' }}>
                    <Smartphone size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: sFont(15), fontWeight: '500', color: colors.text }}>{t.account_transfer}</Text>
                    <Text style={{ fontSize: sFont(12), marginTop: 1, color: colors.textMuted }}>{t.account_transfer_desc}</Text>
                  </View>
                </View>
                <ChevronDown size={18} color={colors.textMuted} style={{ transform: [{ rotate: transferExpanded ? '180deg' : '0deg' }] }} />
              </View>
              {transferExpanded && (
                <Animated.View entering={FadeInDown.duration(200)} style={{ marginTop: 14 }}>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowGenerateCodeModal(true); }}
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary }}
                    >
                      <Key size={16} color="#FFFFFF" />
                      <Text style={{ fontSize: sFont(13), fontWeight: '600', color: '#FFFFFF', marginLeft: 8 }}>{t.generate_code}</Text>
                    </Pressable>
                  </View>
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEnteredCode(''); setRestoreError(null); setShowEnterCodeModal(true); }}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, marginTop: 10, borderRadius: 12, backgroundColor: colors.primary + '15' }}
                  >
                    <Download size={16} color={colors.primary} />
                    <Text style={{ fontSize: sFont(13), fontWeight: '600', marginLeft: 8, color: colors.primary }}>{t.enter_code}</Text>
                  </Pressable>
                </Animated.View>
              )}
            </Pressable>
          </SectionCard>

          {/* ── SECTION: DATOS DEL DISPOSITIVO ─────────────────── */}
          <SectionLabel label={language === 'es' ? 'Datos del dispositivo' : 'Device Data'} colors={colors} />
          <SectionCard colors={colors}>
            <SettingRow
              inCard
              icon={<Smartphone size={20} color={'#EF4444'} />}
              title={language === 'es' ? 'Restablecer datos locales' : 'Reset Local App Data'}
              subtitle={language === 'es' ? 'Borra el cache del dispositivo y vuelve al registro' : 'Clears device cache and returns to registration'}
              colors={colors}
              onPress={handleResetLocalData}
              right={<ChevronRight size={18} color={'#EF4444'} />}
            />
          </SectionCard>

          {/* ── BRANDING + VERSION ───────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(300).springify()} style={{ marginTop: 32, marginBottom: 8, alignItems: 'center', paddingVertical: 32 }}>
            <View style={{ alignItems: 'center' }}>
              <RNImage
                source={LOGO_PNG}
                style={{ width: 180, height: 180, marginBottom: 16 }}
                resizeMode="contain"
              />
              <Text style={{ fontSize: sFont(26), fontWeight: '800', color: colors.text, letterSpacing: -0.5, textAlign: 'center' }}>
                {APP_BRANDING.appName}
              </Text>
              <Text style={{ fontSize: sFont(13), color: colors.textMuted, letterSpacing: 1.5, marginTop: 6, textTransform: 'uppercase', textAlign: 'center' }}>
                {APP_BRANDING.tagline.es}
              </Text>
              <View style={{ marginTop: 20, height: 1, width: '35%', backgroundColor: colors.textMuted + '20' }} />
              <Text style={{ fontSize: sFont(12), color: colors.textMuted + '80', marginTop: 14, textAlign: 'center' }}>
                © {new Date().getFullYear()} ChaViTico Games
              </Text>
            </View>
          </Animated.View>

          {/* Admin Hub trigger — tap 5 veces el número de versión */}
          <Pressable
            onPress={() => {
              const next = adminTapCount + 1;
              setAdminTapCount(next);
              if (adminTapTimer.current) clearTimeout(adminTapTimer.current);
              if (next >= 5) {
                setAdminTapCount(0);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                setShowAdminHub(true);
              } else {
                adminTapTimer.current = setTimeout(() => setAdminTapCount(0), 3000);
              }
            }}
            style={{ alignItems: 'center', paddingVertical: 10, marginBottom: 8 }}
            hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
          >
            <Text style={{ fontSize: sFont(12), color: adminTapCount > 0 ? colors.primary + 'CC' : colors.textMuted + '60', letterSpacing: 0.5 }}>
              v1.0.0{adminTapCount > 0 ? ` (${adminTapCount}/5)` : ''}
            </Text>
          </Pressable>

          {/* DEBUG PANEL */}
          <View style={{ marginBottom: 16, marginHorizontal: 8, padding: 14, borderRadius: 14, backgroundColor: '#1E1E2E', borderWidth: 1, borderColor: '#F59E0B40' }}>
            <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '700', marginBottom: 10, letterSpacing: 1 }}>DEBUG PANEL</Text>
            <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '600', marginBottom: 4, marginTop: 2 }}>— IDENTITY —</Text>
            {/* Identity consistency badge */}
            {debugMeNickname !== null && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', marginBottom: 6, padding: 6,
                borderRadius: 8, backgroundColor: debugMeNickname === user?.nickname ? '#10B98120' : '#EF444420',
                borderWidth: 1, borderColor: debugMeNickname === user?.nickname ? '#10B98140' : '#EF444440',
              }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: debugMeNickname === user?.nickname ? '#10B981' : '#EF4444' }}>
                  {debugMeNickname === user?.nickname ? 'IDENTITY CONSISTENT' : 'IDENTITY MISMATCH — store vs backend differ'}
                </Text>
              </View>
            )}
            <Text style={{ color: '#94A3B8', fontSize: 10, marginBottom: 3 }}>userId (store): <Text style={{ color: '#E2E8F0', fontFamily: 'monospace' }}>{user?.id ?? 'none'}</Text></Text>
            <Text style={{ color: '#94A3B8', fontSize: 10, marginBottom: 3 }}>userId (/me backend): <Text style={{ color: debugMeUserId && debugMeUserId !== user?.id ? '#EF4444' : '#10B981', fontFamily: 'monospace' }}>{debugMeUserId ?? '...'}</Text></Text>
            <Text style={{ color: '#94A3B8', fontSize: 10, marginBottom: 3 }}>footer displays: <Text style={{ color: '#E2E8F0', fontFamily: 'monospace' }}>{user?.id ?? 'none'}</Text></Text>
            {debugMeUserId && debugMeUserId !== '...' && debugMeUserId !== 'null' && debugMeUserId !== 'error' && debugMeUserId !== user?.id && (
              <View style={{ padding: 6, borderRadius: 8, backgroundColor: '#EF444420', borderWidth: 1, borderColor: '#EF444440', marginBottom: 4 }}>
                <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: '700' }}>ID MISMATCH — store has stale ID. Use "Force sync" below to fix.</Text>
              </View>
            )}
            {debugMeUserId && debugMeUserId === user?.id && (
              <View style={{ padding: 6, borderRadius: 8, backgroundColor: '#10B98120', borderWidth: 1, borderColor: '#10B98140', marginBottom: 4 }}>
                <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '700' }}>ID MATCH — store matches backend</Text>
              </View>
            )}
            <Text style={{ color: '#94A3B8', fontSize: 10, marginBottom: 3 }}>nickname (store): <Text style={{ color: '#E2E8F0', fontFamily: 'monospace' }}>{user?.nickname ?? 'none'}</Text></Text>
            <Text style={{ color: '#94A3B8', fontSize: 10, marginBottom: 3 }}>nickname (/me): <Text style={{ color: debugMeNickname && debugMeNickname !== user?.nickname ? '#EF4444' : '#E2E8F0', fontFamily: 'monospace' }}>{debugMeNickname ?? '...'}</Text></Text>
            <Text style={{ color: '#94A3B8', fontSize: 10, marginBottom: 3 }}>local role (store): <Text style={{ color: '#E2E8F0', fontFamily: 'monospace' }}>{(user as { role?: string })?.role ?? 'none'}</Text></Text>
            <Text style={{ color: '#94A3B8', fontSize: 10, marginBottom: 3 }}>backend role (/me): <Text style={{ color: '#E2E8F0', fontFamily: 'monospace' }}>{debugBackendRole ?? '...'}</Text></Text>
            <Text style={{ color: '#94A3B8', fontSize: 10, marginBottom: 3 }}>backend http status: <Text style={{ color: '#E2E8F0', fontFamily: 'monospace' }}>{debugBackendStatus ?? '...'}</Text></Text>
            <Text style={{ color: '#94A3B8', fontSize: 10, marginBottom: 3 }}>emergency override: <Text style={{ color: '#E2E8F0', fontFamily: 'monospace' }}>{String(EMERGENCY_IDS.includes(user?.id ?? ''))}</Text></Text>
            <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '600', marginBottom: 4, marginTop: 6 }}>— BACKEND —</Text>
            <Text style={{ color: '#94A3B8', fontSize: 10, marginBottom: 3 }}>backend URL: <Text style={{ color: '#22D3EE', fontFamily: 'monospace', fontSize: 9 }}>{BACKEND_URL_CONST}</Text></Text>
            <Text style={{ color: '#94A3B8', fontSize: 10, marginBottom: 3 }}>env/appEnv: <Text style={{ color: '#E2E8F0', fontFamily: 'monospace' }}>{debugEnvName ?? '...'}</Text></Text>
            <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '600', marginBottom: 4, marginTop: 6 }}>— COMMUNITY —</Text>
            <Text style={{ color: '#94A3B8', fontSize: 10, marginBottom: 3 }}>communityOptIn total: <Text style={{ color: '#E2E8F0', fontFamily: 'monospace' }}>{debugCommunityCount !== null ? String(debugCommunityCount) : '...'}</Text></Text>
            <Text style={{ color: '#94A3B8', fontSize: 10, marginBottom: 6 }}>nicknames returned:{'\n'}<Text style={{ color: '#E2E8F0', fontFamily: 'monospace' }}>{debugCommunityNicknames !== null ? JSON.stringify(debugCommunityNicknames) : '...'}</Text></Text>
            <Pressable
              onPress={() => fetchDebugBackendRole()}
              style={{ padding: 8, borderRadius: 8, backgroundColor: '#334155', alignItems: 'center', marginBottom: 8 }}
            >
              <Text style={{ color: '#94A3B8', fontSize: 11 }}>Refresh all diagnostics</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                await fetchDebugBackendRole();
                // Apply any corrections from /me to the store immediately
                if (user?.nickname) {
                  // Query by nickname only — same reason as fetchDebugBackendRole
                  const res = await fetchWithTimeout(`${BACKEND_URL_CONST}/api/gamification/me`, {
                    headers: { 'X-User-Nickname': user.nickname },
                  });
                  if (res.ok) {
                    const data = await res.json() as { id?: string; nickname?: string; role?: string };
                    const fixes: Record<string, string> = {};
                    if (data.id && data.id !== user.id) fixes.id = data.id;
                    if (data.nickname && data.nickname !== user.nickname) fixes.nickname = data.nickname;
                    if (data.role && data.role !== (user as { role?: string }).role) fixes.role = data.role;
                    if (Object.keys(fixes).length > 0) {
                      updateUser(fixes as Parameters<typeof updateUser>[0]);
                      queryClient.invalidateQueries();
                      Alert.alert('Identity Corrected', `Applied fixes: ${JSON.stringify(fixes)}`);
                    } else {
                      Alert.alert('Identity OK', 'Store already matches backend — no changes needed.');
                    }
                  }
                }
              }}
              style={{ padding: 8, borderRadius: 8, backgroundColor: '#10B98120', borderWidth: 1, borderColor: '#10B98140', alignItems: 'center', marginBottom: 8 }}
            >
              <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '600' }}>Force sync identity from backend</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                // Invalidate all UI-feeding caches so every screen repopulates with fresh data
                queryClient.invalidateQueries({ queryKey: ['community-members'] });
                queryClient.invalidateQueries({ queryKey: ['community-support-status'] });
                queryClient.invalidateQueries({ queryKey: ['backendUser'] });
                queryClient.invalidateQueries({ queryKey: ['challengeProgress'] });
                queryClient.invalidateQueries({ queryKey: ['trades'] });
                // Also refresh diagnostics so debug panel shows latest
                await fetchDebugBackendRole();
                Alert.alert('Refreshed', 'Community + profile caches invalidated. All screens will refetch fresh data.');
              }}
              style={{ padding: 8, borderRadius: 8, backgroundColor: '#3B82F620', borderWidth: 1, borderColor: '#3B82F640', alignItems: 'center', marginBottom: 8 }}
            >
              <Text style={{ color: '#3B82F6', fontSize: 11, fontWeight: '600' }}>Refresh profile + community UI</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                setShowAdminHub(true);
              }}
              style={{ padding: 10, borderRadius: 10, backgroundColor: '#F59E0B', alignItems: 'center' }}
            >
              <Text style={{ color: '#000', fontSize: 13, fontWeight: '700' }}>Open AdminHub (debug bypass)</Text>
            </Pressable>
          </View>

          {/* Debug Info - User ID — shows canonical backend id as primary source */}
          {(user?.id || debugMeUserId) && (
            <View className="mb-4 px-2">
              <Text className="text-xs" style={{ color: colors.textMuted + '60' }}>
                {t.user_id}: {debugMeUserId && debugMeUserId !== '...' && debugMeUserId !== 'error' ? debugMeUserId : user?.id}
              </Text>
              <Text className="text-xs" style={{ color: colors.textMuted + '40' }}>
                canonical (backend): {debugMeUserId ?? '...'}
              </Text>
              <Text className="text-xs" style={{ color: colors.textMuted + '40' }}>
                rendered (store): {user?.id ?? '...'}
              </Text>
              {debugMeUserId && debugMeUserId !== '...' && debugMeUserId !== 'error' && user?.id && debugMeUserId !== user.id && (
                <Text className="text-xs" style={{ color: '#EF4444' }}>
                  MISMATCH — store stale, syncing...
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Profile Share Card */}
      <ShareableProfileCard
        visible={showProfileShare}
        onClose={() => setShowProfileShare(false)}
      />

      {/* Admin Hub Modal */}
      <AdminHubModal
        visible={showAdminHub}
        onClose={() => setShowAdminHub(false)}
      />

      {/* Avatar Selection Modal */}
      <Modal
        visible={showAvatarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="w-full rounded-3xl p-6" style={{ backgroundColor: colors.surface, maxHeight: '80%' }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                {language === 'es' ? 'Seleccionar Avatar' : 'Select Avatar'}
              </Text>
              <Pressable
                onPress={() => setShowAvatarModal(false)}
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.textMuted + '20' }}
              >
                <X size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap justify-between">
                {DEFAULT_AVATARS.map((avatar) => {
                  const isAvailable = isAvatarAvailable(avatar);
                  const isSelected = user?.avatar === avatar.id;
                  const isPremium = 'price' in avatar;

                  return (
                    <Pressable
                      key={avatar.id}
                      onPress={() => isAvailable && handleAvatarSelect(avatar.id)}
                      className="mb-4"
                      style={{ width: '30%' }}
                    >
                      <View
                        className="items-center p-3 rounded-2xl"
                        style={{
                          backgroundColor: isSelected
                            ? colors.primary + '20'
                            : isAvailable
                            ? colors.textMuted + '10'
                            : colors.textMuted + '05',
                          borderWidth: isSelected ? 2 : 0,
                          borderColor: isSelected ? colors.primary : 'transparent',
                          opacity: isAvailable ? 1 : 0.5,
                        }}
                      >
                        <View className="relative">
                          <Text style={{ fontSize: sFont(36) }}>{avatar.emoji}</Text>
                          {!isAvailable && isPremium && (
                            <View
                              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full items-center justify-center"
                              style={{ backgroundColor: colors.textMuted }}
                            >
                              <Lock size={10} color="#FFFFFF" />
                            </View>
                          )}
                          {isSelected && (
                            <View
                              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full items-center justify-center"
                              style={{ backgroundColor: colors.primary }}
                            >
                              <Check size={10} color="#FFFFFF" strokeWidth={3} />
                            </View>
                          )}
                        </View>
                        <Text
                          className="text-xs font-medium mt-2 text-center"
                          style={{ color: isAvailable ? colors.text : colors.textMuted }}
                          numberOfLines={1}
                        >
                          {avatar.name}
                        </Text>
                        {isPremium && !isAvailable && (
                          <View className="flex-row items-center mt-1">
                            <Coins size={10} color={colors.textMuted} />
                            <Text
                              className="text-xs ml-0.5"
                              style={{ color: colors.textMuted }}
                            >
                              {(avatar as { price: number }).price}
                            </Text>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <Text
                className="text-sm text-center mt-4 px-4"
                style={{ color: colors.textMuted }}
              >
                {language === 'es'
                  ? 'Los avatares bloqueados se pueden desbloquear en Personalizar'
                  : 'Locked avatars can be unlocked in Customize'}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-8">
          <View className="w-full rounded-3xl p-6" style={{ backgroundColor: colors.surface }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                {t.language}
              </Text>
              <Pressable
                onPress={() => setShowLanguageModal(false)}
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.textMuted + '20' }}
              >
                <X size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            {(['en', 'es'] as Language[]).map((lang) => (
              <Pressable
                key={lang}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateSettings({ language: lang });
                  setShowLanguageModal(false);
                }}
                className="flex-row items-center py-4 border-b"
                style={{ borderBottomColor: colors.textMuted + '20' }}
              >
                <Text style={{ fontSize: sFont(28) }} className="mr-4">
                  {lang === 'en' ? '🇺🇸' : '🇪🇸'}
                </Text>
                <Text className="flex-1 text-base font-medium" style={{ color: colors.text }}>
                  {lang === 'en' ? 'English' : 'Español'}
                </Text>
                {language === lang && (
                  <Check size={20} color={colors.primary} strokeWidth={3} />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimePickerModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-8">
          <View className="w-full rounded-3xl p-6" style={{ backgroundColor: colors.surface }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                {language === 'es' ? 'Hora del recordatorio' : 'Reminder Time'}
              </Text>
              <Pressable
                onPress={() => setShowTimePickerModal(false)}
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.textMuted + '20' }}
              >
                <X size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            <Text className="text-sm mb-4" style={{ color: colors.textMuted }}>
              {language === 'es'
                ? 'Selecciona la hora a la que deseas recibir tu recordatorio diario.'
                : 'Select the time you want to receive your daily reminder.'}
            </Text>

            <View className="items-center py-4">
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                textColor={colors.text}
                themeVariant={isDarkMode ? 'dark' : 'light'}
                style={{ height: 150, width: '100%' }}
              />
            </View>

            <View className="flex-row gap-3 mt-4">
              <Pressable
                onPress={() => setShowTimePickerModal(false)}
                className="flex-1 py-3 rounded-xl items-center justify-center"
                style={{ backgroundColor: colors.textMuted + '20' }}
              >
                <Text className="font-semibold" style={{ color: colors.text }}>
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleTimeSave}
                className="flex-1 py-3 rounded-xl items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="font-semibold text-white">
                  {language === 'es' ? 'Guardar' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Generate Transfer Code Modal */}
      <Modal
        visible={showGenerateCodeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGenerateCodeModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <Animated.View
            entering={FadeInUp.duration(300)}
            className="w-full rounded-3xl p-6"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                {t.transfer_code}
              </Text>
              <Pressable
                onPress={() => {
                  setShowGenerateCodeModal(false);
                  setTransferCode(null);
                  setTransferCodeExpiry(null);
                }}
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.textMuted + '20' }}
              >
                <X size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            {!transferCode ? (
              <>
                <Text className="text-sm mb-6" style={{ color: colors.textMuted }}>
                  {t.account_transfer_desc}
                </Text>

                <Pressable
                  onPress={handleGenerateCode}
                  disabled={isGeneratingCode}
                  className="py-4 rounded-xl items-center justify-center"
                  style={{
                    backgroundColor: isGeneratingCode ? colors.textMuted + '40' : colors.primary,
                  }}
                >
                  {isGeneratingCode ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text className="text-base font-semibold text-white ml-2">
                        {t.generating}
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center">
                      <Key size={20} color="#FFFFFF" />
                      <Text className="text-base font-semibold text-white ml-2">
                        {t.generate_code}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                {/* Generated Code Display */}
                <View
                  className="py-6 px-4 rounded-2xl items-center mb-4"
                  style={{ backgroundColor: colors.background }}
                >
                  <Text
                    className="text-3xl font-bold tracking-widest"
                    style={{ color: colors.primary, letterSpacing: 8 }}
                  >
                    {formatTransferCode(transferCode)}
                  </Text>
                </View>

                {/* Countdown Timer */}
                <View className="flex-row items-center justify-center mb-4">
                  <Clock size={16} color={expiryCountdown < 120 ? '#EF4444' : colors.textMuted} />
                  <Text
                    className="text-sm ml-2 font-medium"
                    style={{ color: expiryCountdown < 120 ? '#EF4444' : colors.textMuted }}
                  >
                    {expiryCountdown > 0
                      ? t.code_expires_in.replace('{minutes}', formatCountdown(expiryCountdown))
                      : t.code_expired}
                  </Text>
                </View>

                {/* Warning Text */}
                <View
                  className="p-3 rounded-xl mb-4"
                  style={{ backgroundColor: colors.primary + '10' }}
                >
                  <Text className="text-sm text-center" style={{ color: colors.primary }}>
                    {t.transfer_warning}
                  </Text>
                </View>

                {/* Copy Button */}
                <Pressable
                  onPress={handleCopyCode}
                  className="py-3 rounded-xl flex-row items-center justify-center"
                  style={{ backgroundColor: codeCopied ? '#22C55E' : colors.primary }}
                >
                  {codeCopied ? (
                    <>
                      <Check size={18} color="#FFFFFF" strokeWidth={3} />
                      <Text className="text-base font-semibold text-white ml-2">
                        {t.code_copied}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Copy size={18} color="#FFFFFF" />
                      <Text className="text-base font-semibold text-white ml-2">
                        {t.copy_code}
                      </Text>
                    </>
                  )}
                </Pressable>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Enter Transfer Code Modal */}
      <Modal
        visible={showEnterCodeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEnterCodeModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <Animated.View
            entering={FadeInUp.duration(300)}
            className="w-full rounded-3xl p-6"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                {t.enter_code}
              </Text>
              <Pressable
                onPress={() => setShowEnterCodeModal(false)}
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.textMuted + '20' }}
              >
                <X size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            <Text className="text-sm mb-4" style={{ color: colors.textMuted }}>
              {language === 'es'
                ? 'Ingresa el codigo de 8 caracteres generado en tu otro dispositivo.'
                : 'Enter the 8-character code generated on your other device.'}
            </Text>

            {/* Code Input */}
            <View
              className="rounded-xl mb-4 overflow-hidden"
              style={{
                backgroundColor: colors.background,
                borderWidth: restoreError ? 2 : 0,
                borderColor: restoreError ? '#EF4444' : 'transparent',
              }}
            >
              <TextInput
                value={formatTransferCode(enteredCode).trim()}
                onChangeText={handleCodeInput}
                placeholder={t.enter_code_placeholder}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={9} // 8 chars + 1 space
                className="text-center text-2xl font-bold py-4 px-4"
                style={{
                  color: colors.text,
                  letterSpacing: 4,
                }}
              />
            </View>

            {/* Error Message */}
            {restoreError && (
              <View className="mb-4">
                <Text className="text-sm text-center" style={{ color: '#EF4444' }}>
                  {restoreError}
                </Text>
              </View>
            )}

            {/* Restore Button */}
            <Pressable
              onPress={handleRestore}
              disabled={isRestoring || enteredCode.length !== 8}
              className="py-4 rounded-xl items-center justify-center"
              style={{
                backgroundColor:
                  isRestoring || enteredCode.length !== 8
                    ? colors.textMuted + '40'
                    : colors.primary,
              }}
            >
              {isRestoring ? (
                <View className="flex-row items-center">
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text className="text-base font-semibold text-white ml-2">
                    {t.restoring}
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center">
                  <Download size={20} color="#FFFFFF" />
                  <Text className="text-base font-semibold text-white ml-2">
                    {t.restore}
                  </Text>
                </View>
              )}
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      <CountryPickerModal
        visible={showCountryPicker}
        selectedCode={countryCode}
        onSelect={handleCountrySelect}
        onClose={() => setShowCountryPicker(false)}
      />

      <BadgeInfoModal
        badgeId={badgeInfoId}
        visible={!!badgeInfoId}
        variant="settings"
        onClose={() => setBadgeInfoId(null)}
      />

    </View>
  );
}
