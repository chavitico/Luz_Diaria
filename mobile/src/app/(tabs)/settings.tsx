// Settings Screen - With Avatar Selection

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Slider from '@react-native-community/slider';
import {
  Settings as SettingsIcon,
  Palette,
  Globe,
  Bell,
  Volume2,
  Flame,
  BookOpen,
  Clock,
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
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import {
  useThemeColors,
  useLanguage,
  useUser,
  useCurrentTheme,
  useIsDarkMode,
  useUserSettings,
  useAppStore,
} from '@/lib/store';
import { TRANSLATIONS, THEMES, DEFAULT_AVATARS, AVATAR_FRAMES, SPIRITUAL_TITLES, PURCHASABLE_THEMES } from '@/lib/constants';
import type { ThemeOption, Language } from '@/lib/types';
import { cn } from '@/lib/cn';

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
  const currentTheme = useCurrentTheme();
  const isDarkMode = useIsDarkMode();
  const settings = useUserSettings();
  const router = useRouter();
  const t = TRANSLATIONS[language];

  const setTheme = useAppStore((s) => s.setTheme);
  const setDarkMode = useAppStore((s) => s.setDarkMode);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const updateUser = useAppStore((s) => s.updateUser);

  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
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
                  <Clock size={18} color={colors.accent} />
                  <Text className="text-lg font-bold mt-1" style={{ color: colors.text }}>
                    {formatTime(user.totalTime)}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.textMuted }}>
                    {t.total_time}
                  </Text>
                </View>
              </View>

              {/* Quick Navigation to Store */}
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/store?tab=avatars');
                  }}
                  className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl"
                  style={{ backgroundColor: colors.primary + '15' }}
                >
                  <User size={14} color={colors.primary} />
                  <Text className="text-xs font-medium ml-1.5" style={{ color: colors.primary }}>
                    {language === 'es' ? 'Avatar' : 'Avatar'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/store?tab=frames');
                  }}
                  className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl"
                  style={{ backgroundColor: colors.secondary + '15' }}
                >
                  <Circle size={14} color={colors.secondary} />
                  <Text className="text-xs font-medium ml-1.5" style={{ color: colors.secondary }}>
                    {t.frames}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/store?tab=titles');
                  }}
                  className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl"
                  style={{ backgroundColor: colors.accent + '15' }}
                >
                  <Sparkles size={14} color={colors.accent} />
                  <Text className="text-xs font-medium ml-1.5" style={{ color: colors.accent }}>
                    {t.titles}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* Profile Section */}
          <Text className="text-sm font-semibold uppercase tracking-wider mb-3 ml-1" style={{ color: colors.textMuted }}>
            {language === 'es' ? 'Perfil' : 'Profile'}
          </Text>

          <SettingRow
            icon={<User size={20} color={colors.primary} />}
            title={language === 'es' ? 'Avatar' : 'Avatar'}
            subtitle={currentAvatar?.name ?? 'Default'}
            colors={colors}
            onPress={() => setShowAvatarModal(true)}
          />

          {/* Appearance Section */}
          <Text className="text-sm font-semibold uppercase tracking-wider mb-3 ml-1 mt-6" style={{ color: colors.textMuted }}>
            {language === 'es' ? 'Apariencia' : 'Appearance'}
          </Text>

          <SettingRow
            icon={<Palette size={20} color={colors.primary} />}
            title={t.theme}
            subtitle={THEMES[currentTheme].name}
            colors={colors}
            onPress={() => setShowThemeModal(true)}
          />

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
            title={t.notifications}
            colors={colors}
            right={
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateSettings({ notificationsEnabled: value });
                }}
                trackColor={{ false: colors.textMuted + '40', true: colors.primary + '60' }}
                thumbColor={settings.notificationsEnabled ? colors.primary : '#FFFFFF'}
              />
            }
          />

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
                  ? 'Los avatares bloqueados se pueden desbloquear en la Tienda'
                  : 'Locked avatars can be unlocked in the Store'}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Theme Selection Modal */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-8">
          <View className="w-full rounded-3xl p-6" style={{ backgroundColor: colors.surface }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                {t.theme}
              </Text>
              <Pressable
                onPress={() => setShowThemeModal(false)}
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.textMuted + '20' }}
              >
                <X size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            {(Object.keys(THEMES) as ThemeOption[]).map((theme) => (
              <Pressable
                key={theme}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setTheme(theme);
                  setShowThemeModal(false);
                }}
                className="flex-row items-center py-4 border-b"
                style={{ borderBottomColor: colors.textMuted + '20' }}
              >
                <View
                  className="w-10 h-10 rounded-full mr-4"
                  style={{ backgroundColor: THEMES[theme].primary }}
                />
                <Text className="flex-1 text-base font-medium" style={{ color: colors.text }}>
                  {language === 'es' ? THEMES[theme].nameEs : THEMES[theme].name}
                </Text>
                {currentTheme === theme && (
                  <Check size={20} color={colors.primary} strokeWidth={3} />
                )}
              </Pressable>
            ))}
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
    </View>
  );
}
