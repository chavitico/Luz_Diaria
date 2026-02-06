// Settings Screen

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
} from 'lucide-react-native';
import {
  useThemeColors,
  useLanguage,
  useUser,
  useCurrentTheme,
  useIsDarkMode,
  useUserSettings,
  useAppStore,
} from '@/lib/store';
import { TRANSLATIONS, THEMES, DEFAULT_AVATARS } from '@/lib/constants';
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

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const language = useLanguage();
  const user = useUser();
  const currentTheme = useCurrentTheme();
  const isDarkMode = useIsDarkMode();
  const settings = useUserSettings();
  const t = TRANSLATIONS[language];

  const setTheme = useAppStore((s) => s.setTheme);
  const setDarkMode = useAppStore((s) => s.setDarkMode);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const currentAvatar = DEFAULT_AVATARS.find((a) => a.id === user?.avatar);

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
              <View className="flex-row items-center mb-4">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center mr-4"
                  style={{ backgroundColor: colors.primary + '15' }}
                >
                  <Text style={{ fontSize: 32 }}>{currentAvatar?.emoji ?? '😊'}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold" style={{ color: colors.text }}>
                    {user.nickname}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Coins size={14} color={colors.primary} />
                    <Text className="ml-1 font-semibold" style={{ color: colors.primary }}>
                      {user.points} {t.points}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Stats Grid */}
              <View className="flex-row gap-3">
                <StatCard
                  icon={<Flame size={20} color={colors.primary} />}
                  value={user.streakCurrent}
                  label={t.current_streak}
                  colors={colors}
                />
                <StatCard
                  icon={<BookOpen size={20} color={colors.secondary} />}
                  value={user.devotionalsCompleted}
                  label={t.total_completed}
                  colors={colors}
                />
                <StatCard
                  icon={<Clock size={20} color={colors.accent} />}
                  value={formatTime(user.totalTime)}
                  label={t.total_time}
                  colors={colors}
                />
              </View>
            </Animated.View>
          )}

          {/* Appearance Section */}
          <Text className="text-sm font-semibold uppercase tracking-wider mb-3 ml-1" style={{ color: colors.textMuted }}>
            Appearance
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
            Notifications
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
