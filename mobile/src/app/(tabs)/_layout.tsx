// Tab layout for the main app navigation

import React from 'react';
import { View, Text, Platform } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Sun, BookOpen, Palette, Users, BookMarked, Settings2, Library, Scroll } from 'lucide-react-native';
import { useThemeColors, useLanguage, useUser, useAppStore } from '@/lib/store';
import { TRANSLATIONS } from '@/lib/constants';
import { useNotificationBadges } from '@/lib/use-notification-badges';

function NotifDot() {
  return (
    <View style={{
      position: 'absolute',
      top: -2,
      right: -4,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#EF4444',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.9)',
    }} />
  );
}

function TabIcon({ icon, hasBadge, focused }: { icon: React.ReactNode; hasBadge: boolean; focused: boolean }) {
  return (
    <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}
      className={focused ? 'scale-110' : ''}>
      {icon}
      {hasBadge && <NotifDot />}
    </View>
  );
}

export default function TabLayout() {
  const colors = useThemeColors();
  const language = useLanguage();
  const t = TRANSLATIONS[language];
  const user = useUser();
  const badges = useAppStore((s) => s.notificationBadges);
  const router = useRouter();

  useNotificationBadges(user?.id);

  const hasHomeBadge = badges.recentCommentLikesCount > 0;
  const hasSpaceBadge = badges.pendingTradesCount > 0 || badges.hasPendingGift || badges.unseenStoreGiftsCount > 0 || badges.dailyPackAvailable;
  const hasSettingsBadge = badges.hasPendingGift || badges.pendingSupportCount > 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.surface,
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 72 : 56,
          paddingBottom: Platform.OS === 'ios' ? 16 : 6,
          paddingTop: 8,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={80}
              tint="light"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tab_home,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon hasBadge={hasHomeBadge} focused={focused}
              icon={<Sun size={24} color={color} strokeWidth={focused ? 2.5 : 2} />} />
          ),
        }}
      />
      <Tabs.Screen
        name="hoy-nuevo"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            // Navigate with empty date so hoy-nuevo always shows today when
            // the tab button is pressed directly (clears any stale library date)
            router.navigate({ pathname: '/(tabs)/hoy-nuevo', params: { date: '' } });
          },
        }}
        options={{
          title: 'Nuevo',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon hasBadge={false} focused={focused}
              icon={<Scroll size={24} color={color} strokeWidth={focused ? 2.5 : 2} />} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: t.tab_library,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon hasBadge={false} focused={focused}
              icon={<Library size={24} color={color} strokeWidth={focused ? 2.5 : 2} />} />
          ),
        }}
      />
      <Tabs.Screen
        name="estudios"
        options={{
          title: 'Estudios Bíblicos',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon hasBadge={false} focused={focused}
              icon={<BookOpen size={24} color={color} strokeWidth={focused ? 2.5 : 2} />} />
          ),
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: t.tab_store,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon hasBadge={hasSpaceBadge} focused={focused}
              icon={<Palette size={24} color={color} strokeWidth={focused ? 2.5 : 2} />} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: t.tab_community,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon hasBadge={false} focused={focused}
              icon={<Users size={24} color={color} strokeWidth={focused ? 2.5 : 2} />} />
          ),
        }}
      />
      <Tabs.Screen
        name="bible"
        options={{
          title: t.tab_bible,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon hasBadge={false} focused={focused}
              icon={<BookMarked size={24} color={color} strokeWidth={focused ? 2.5 : 2} />} />
          ),
        }}
      />
      <Tabs.Screen
        name="prayer"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tab_settings,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon hasBadge={hasSettingsBadge} focused={focused}
              icon={<Settings2 size={24} color={color} strokeWidth={focused ? 2.5 : 2} />} />
          ),
        }}
      />
    </Tabs>
  );
}
