// Tab layout for the main app navigation

import React from 'react';
import { View, Text, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Sun, BookOpen, Palette, Users, BookMarked, Settings2 } from 'lucide-react-native';
import { useThemeColors, useLanguage } from '@/lib/store';
import { TRANSLATIONS } from '@/lib/constants';

export default function TabLayout() {
  const colors = useThemeColors();
  const language = useLanguage();
  const t = TRANSLATIONS[language];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.surface,
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 10,
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
            <View className={focused ? 'scale-110' : ''}>
              <Sun size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: t.tab_library,
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'scale-110' : ''}>
              <BookOpen size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: t.tab_store,
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'scale-110' : ''}>
              <Palette size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: t.tab_community,
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'scale-110' : ''}>
              <Users size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="bible"
        options={{
          title: t.tab_bible,
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'scale-110' : ''}>
              <BookMarked size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
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
            <View className={focused ? 'scale-110' : ''}>
              <Settings2 size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
