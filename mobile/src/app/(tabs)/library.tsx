// Library Screen - Historical Devotionals

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Heart, Calendar, Tag, BookOpen } from 'lucide-react-native';
import { firestoreService } from '@/lib/firestore';
import { useThemeColors, useLanguage, useUserFavorites } from '@/lib/store';
import { TRANSLATIONS } from '@/lib/constants';
import type { Devotional } from '@/lib/types';
import { cn } from '@/lib/cn';

const { width } = Dimensions.get('window');

type FilterType = 'all' | 'favorites';

interface DevotionalCardProps {
  devotional: Devotional;
  isFavorite: boolean;
  language: 'en' | 'es';
  colors: ReturnType<typeof useThemeColors>;
  onPress: () => void;
}

function DevotionalCard({ devotional, isFavorite, language, colors, onPress }: DevotionalCardProps) {
  const title = language === 'es' ? devotional.titleEs : devotional.title;
  const topic = language === 'es' ? devotional.topicEs : devotional.topic;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      className="mb-4 mx-5"
    >
      <View
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: colors.surface,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        <View className="flex-row">
          {/* Thumbnail */}
          <Image
            source={{ uri: devotional.imageUrl }}
            style={{ width: 100, height: 100 }}
            contentFit="cover"
            transition={200}
          />

          {/* Content */}
          <View className="flex-1 p-4">
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center">
                <Calendar size={12} color={colors.textMuted} />
                <Text
                  className="text-xs ml-1"
                  style={{ color: colors.textMuted }}
                >
                  {formatDate(devotional.date)}
                </Text>
              </View>
              {isFavorite && (
                <Heart size={14} color="#EF4444" fill="#EF4444" />
              )}
            </View>

            <Text
              className="text-base font-semibold mb-2"
              style={{ color: colors.text }}
              numberOfLines={2}
            >
              {title}
            </Text>

            <View className="flex-row items-center">
              <View
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: colors.primary + '20' }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: colors.primary }}
                >
                  {topic}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const language = useLanguage();
  const favorites = useUserFavorites();
  const t = TRANSLATIONS[language];

  const [filter, setFilter] = useState<FilterType>('all');

  const { data: devotionals, isLoading } = useQuery({
    queryKey: ['allDevotionals'],
    queryFn: () => firestoreService.getAllDevotionals(),
  });

  const filteredDevotionals = devotionals?.filter((d) => {
    if (filter === 'favorites') {
      return favorites.includes(d.date);
    }
    return true;
  });

  const handleDevotionalPress = useCallback((devotional: Devotional) => {
    router.push({
      pathname: '/devotional/[date]',
      params: { date: devotional.date },
    });
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: Devotional }) => (
      <DevotionalCard
        devotional={item}
        isFavorite={favorites.includes(item.date)}
        language={language}
        colors={colors}
        onPress={() => handleDevotionalPress(item)}
      />
    ),
    [favorites, language, colors, handleDevotionalPress]
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="px-5 pb-4"
        style={{ paddingTop: insets.top + 16 }}
      >
        <Text
          className="text-3xl font-bold mb-4"
          style={{ color: colors.text }}
        >
          {t.library}
        </Text>

        {/* Filter Tabs */}
        <View className="flex-row">
          <Pressable
            onPress={() => {
              setFilter('all');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className={cn(
              'px-4 py-2 rounded-full mr-2',
              filter === 'all' ? '' : 'bg-transparent'
            )}
            style={
              filter === 'all'
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.surface }
            }
          >
            <Text
              className="font-semibold"
              style={{
                color: filter === 'all' ? '#FFFFFF' : colors.textMuted,
              }}
            >
              {t.all_devotionals}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setFilter('favorites');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="px-4 py-2 rounded-full flex-row items-center"
            style={
              filter === 'favorites'
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.surface }
            }
          >
            <Heart
              size={14}
              color={filter === 'favorites' ? '#FFFFFF' : colors.textMuted}
              fill={filter === 'favorites' ? '#FFFFFF' : 'transparent'}
            />
            <Text
              className="font-semibold ml-1"
              style={{
                color: filter === 'favorites' ? '#FFFFFF' : colors.textMuted,
              }}
            >
              {t.favorites}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredDevotionals && filteredDevotionals.length > 0 ? (
        <FlashList
          data={filteredDevotionals}
          renderItem={renderItem}
          estimatedItemSize={116}
          keyExtractor={(item) => item.date}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-1 items-center justify-center px-8"
        >
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: colors.primary + '15' }}
          >
            <BookOpen size={32} color={colors.primary} />
          </View>
          <Text
            className="text-lg font-semibold text-center mb-2"
            style={{ color: colors.text }}
          >
            {filter === 'favorites' ? t.no_favorites : 'No devotionals yet'}
          </Text>
          <Text
            className="text-center"
            style={{ color: colors.textMuted }}
          >
            {filter === 'favorites'
              ? 'Tap the heart icon on a devotional to save it here'
              : 'Devotionals will appear here as they become available'}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}
