// Settings Screen - With Avatar Selection and Notification Settings

import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
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
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import {
  useThemeColors,
  useLanguage,
  useUser,
  useIsDarkMode,
  useUserSettings,
  useAppStore,
} from '@/lib/store';
import { TRANSLATIONS, DEFAULT_AVATARS, AVATAR_FRAMES, SPIRITUAL_TITLES } from '@/lib/constants';
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
import { useQueryClient } from '@tanstack/react-query';

interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  colors: ReturnType<typeof useThemeColors>;
}

function SettingRow({ icon, title, subtitle, right, onPress, colors }: SettingRowProps) {
  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      disabled={!onPress}
      className="flex-row items-center py-4 px-5 mb-2 rounded-2xl"
      style={{ backgroundColor: colors.surface }}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mr-4"
        style={{ backgroundColor: colors.primary + '15' }}
      >
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium" style={{ color: colors.text }}>
          {title}
        </Text>
        {subtitle && (
          <Text className="text-sm mt-0.5" style={{ color: colors.textMuted }}>
            {subtitle}
          </Text>
        )}
      </View>
      {right || (onPress && <ChevronRight size={20} color={colors.textMuted} />)}
    </Pressable>
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
  const queryClient = useQueryClient();

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [showGenerateCodeModal, setShowGenerateCodeModal] = useState(false);
  const [showEnterCodeModal, setShowEnterCodeModal] = useState(false);

  // Transfer code state
  const [transferCode, setTransferCode] = useState<string | null>(null);
  const [transferCodeExpiry, setTransferCodeExpiry] = useState<Date | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [adminPressCount, setAdminPressCount] = useState(0);
  const [enteredCode, setEnteredCode] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [expiryCountdown, setExpiryCountdown] = useState<number>(0);

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

  // Load notification settings and community opt-in on mount
  useEffect(() => {
    loadNotificationSettings();
    loadCommunityOptIn();
    loadPrayerDisplayOptIn();
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

  const currentAvatar = DEFAULT_AVATARS.find((a) => a.id === user?.avatar);
  const purchasedItems = user?.purchasedItems ?? [];

  // Get equipped title info
  const equippedTitle = user?.titleId ? SPIRITUAL_TITLES[user.titleId] : null;
  const titleDisplay = equippedTitle
    ? (language === 'es' ? equippedTitle.nameEs : equippedTitle.name)
    : t.no_title;

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
          <Text className="text-3xl font-bold mb-6" style={{ color: colors.text }}>
            {t.settings}
          </Text>

          {/* User Profile Card */}
          {user && (
            <Animated.View
              entering={FadeInDown.duration(400)}
              className="rounded-2xl p-5 mb-6"
              style={{ backgroundColor: colors.surface }}
            >
              {/* Profile Header with Avatar, Name, Title */}
              <View className="flex-row items-center mb-4">
                <AvatarWithFrame
                  emoji={currentAvatar?.emoji ?? '😊'}
                  frameId={user.frameId}
                  size={64}
                />
                <View className="flex-1 ml-4">
                  <Text className="text-xl font-bold" style={{ color: colors.text }}>
                    {user.nickname}
                  </Text>
                  <Text
                    className="text-sm mt-0.5"
                    style={{ color: equippedTitle ? colors.secondary : colors.textMuted }}
                  >
                    {titleDisplay}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Coins size={14} color={colors.primary} />
                    <Text className="ml-1 font-semibold" style={{ color: colors.primary }}>
                      {user.points} {t.points}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Quick Stats Row */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1 items-center p-3 rounded-xl" style={{ backgroundColor: colors.background }}>
                  <Flame size={18} color={colors.primary} />
                  <Text className="text-lg font-bold mt-1" style={{ color: colors.text }}>
                    {user.streakCurrent}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.textMuted }}>
                    {t.current_streak}
                  </Text>
                </View>
                <View className="flex-1 items-center p-3 rounded-xl" style={{ backgroundColor: colors.background }}>
                  <BookOpen size={18} color={colors.secondary} />
                  <Text className="text-lg font-bold mt-1" style={{ color: colors.text }}>
                    {user.devotionalsCompleted}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.textMuted }}>
                    {t.total_completed}
                  </Text>
                </View>
                <View className="flex-1 items-center p-3 rounded-xl" style={{ backgroundColor: colors.background }}>
                  <Share2 size={18} color={colors.accent} />
                  <Text className="text-lg font-bold mt-1" style={{ color: colors.text }}>
                    {user.totalShares ?? 0}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.textMuted }}>
                    {language === 'es' ? 'Compartidos' : 'Shared'}
                  </Text>
                </View>
              </View>

            </Animated.View>
          )}

          {/* Community Section */}
          <Text className="text-sm font-semibold uppercase tracking-wider mb-3 ml-1 mt-6" style={{ color: colors.textMuted }}>
            {language === 'es' ? 'Comunidad' : 'Community'}
          </Text>

          <SettingRow
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
                  trackColor={{ false: colors.textMuted + '40', true: colors.primary + '60' }}
                  thumbColor={communityOptIn ? colors.primary : '#FFFFFF'}
                />
              )
            }
          />

          <SettingRow
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

          {/* Appearance Section */}
          <Text className="text-sm font-semibold uppercase tracking-wider mb-3 ml-1 mt-6" style={{ color: colors.textMuted }}>
            {language === 'es' ? 'Apariencia' : 'Appearance'}
          </Text>

          <SettingRow
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
            icon={<Globe size={20} color={colors.primary} />}
            title={t.language}
            subtitle={language === 'en' ? 'English' : 'Español'}
            colors={colors}
            onPress={() => setShowLanguageModal(true)}
          />

          {/* Notifications Section */}
          <Text className="text-sm font-semibold uppercase tracking-wider mb-3 ml-1 mt-6" style={{ color: colors.textMuted }}>
            {language === 'es' ? 'Notificaciones' : 'Notifications'}
          </Text>

          <SettingRow
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
                icon={<Clock size={20} color={colors.primary} />}
                title={language === 'es' ? 'Hora del recordatorio' : 'Reminder Time'}
                subtitle={formatNotificationTime(notificationSettings.hour, notificationSettings.minute)}
                colors={colors}
                onPress={() => setShowTimePickerModal(true)}
              />

              <SettingRow
                icon={<TestTube size={20} color={colors.secondary} />}
                title={language === 'es' ? 'Probar notificación' : 'Test Notification'}
                subtitle={language === 'es' ? 'Enviar una notificación de prueba' : 'Send a test notification'}
                colors={colors}
                onPress={handleTestNotification}
              />
            </>
          )}

          <SettingRow
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

          {/* Music Section */}
          <Text className="text-sm font-semibold uppercase tracking-wider mb-3 ml-1 mt-6" style={{ color: colors.textMuted }}>
            {t.background_music}
          </Text>

          <SettingRow
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
            <View
              className="px-5 py-4 rounded-2xl mb-2"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-sm font-medium mb-3" style={{ color: colors.text }}>
                {t.volume}
              </Text>
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

          {/* Account Transfer Section */}
          <Text className="text-sm font-semibold uppercase tracking-wider mb-3 ml-1 mt-6" style={{ color: colors.textMuted }}>
            {t.account_transfer}
          </Text>

          <View
            className="rounded-2xl p-5 mb-2"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="flex-row items-center mb-3">
              <Smartphone size={20} color={colors.primary} />
              <Text className="text-base font-medium ml-3" style={{ color: colors.text }}>
                {t.account_transfer}
              </Text>
            </View>
            <Text className="text-sm mb-4" style={{ color: colors.textMuted }}>
              {t.account_transfer_desc}
            </Text>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowGenerateCodeModal(true);
                }}
                className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
                style={{ backgroundColor: colors.primary }}
              >
                <Key size={16} color="#FFFFFF" />
                <Text className="text-sm font-semibold text-white ml-2">
                  {t.generate_code}
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEnteredCode('');
                setRestoreError(null);
                setShowEnterCodeModal(true);
              }}
              className="flex-row items-center justify-center py-3 mt-3 rounded-xl"
              style={{ backgroundColor: colors.primary + '15' }}
            >
              <Download size={16} color={colors.primary} />
              <Text className="text-sm font-semibold ml-2" style={{ color: colors.primary }}>
                {t.enter_code}
              </Text>
            </Pressable>
          </View>

          {/* Debug Info - User ID */}
          {user?.id && (
            <View className="mt-6 mb-4 px-2">
              <Pressable
                onPress={() => {
                  const next = adminPressCount + 1;
                  setAdminPressCount(next);
                  if (next >= 5) {
                    setAdminPressCount(0);
                    router.push('/admin/branding');
                  }
                }}
              >
                <Text className="text-xs" style={{ color: colors.textMuted + '80' }}>
                  {t.user_id}: {user.id.slice(0, 8)}...
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

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
                          <Text style={{ fontSize: 36 }}>{avatar.emoji}</Text>
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
                <Text style={{ fontSize: 28 }} className="mr-4">
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
    </View>
  );
}
