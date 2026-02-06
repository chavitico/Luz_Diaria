// Devotional Detail Page - View historical devotionals

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  BookOpen,
  Heart,
  ChevronDown,
  Star,
  Check,
  ArrowLeft,
} from 'lucide-react-native';
import { firestoreService } from '@/lib/firestore';
import {
  useThemeColors,
  useLanguage,
  useUserFavorites,
  useAppStore,
} from '@/lib/store';
import { TRANSLATIONS } from '@/lib/constants';
import { POINTS } from '@/lib/types';

const { height } = Dimensions.get('window');

interface SectionProps {
  title: string;
  content: string;
  icon: React.ReactNode;
  colors: ReturnType<typeof useThemeColors>;
  defaultExpanded?: boolean;
}

function ExpandableSection({ title, content, icon, colors, defaultExpanded = false }: SectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const rotation = useSharedValue(defaultExpanded ? 180 : 0);

  const handleToggle = () => {
    setExpanded(!expanded);
    rotation.value = withSpring(expanded ? 0 : 180);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View className="mb-4">
      <Pressable
        onPress={handleToggle}
        className="flex-row items-center justify-between py-4 px-5 rounded-2xl"
        style={{ backgroundColor: colors.surface }}
      >
        <View className="flex-row items-center flex-1">
          {icon}
          <Text
            className="text-base font-semibold ml-3 flex-1"
            style={{ color: colors.text }}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        <Animated.View style={iconStyle}>
          <ChevronDown size={20} color={colors.textMuted} />
        </Animated.View>
      </Pressable>

      {expanded && (
        <Animated.View
          entering={FadeIn.duration(200)}
          className="px-5 py-4 mt-1 rounded-2xl"
          style={{ backgroundColor: colors.surface }}
        >
          <Text
            className="text-base leading-7"
            style={{ color: colors.text, lineHeight: 26 }}
          >
            {content}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

export default function DevotionalDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const colors = useThemeColors();
  const language = useLanguage();
  const favorites = useUserFavorites();
  const t = TRANSLATIONS[language];

  const addFavorite = useAppStore((s) => s.addFavorite);
  const removeFavorite = useAppStore((s) => s.removeFavorite);
  const addPoints = useAppStore((s) => s.addPoints);

  const { data: devotional, isLoading } = useQuery({
    queryKey: ['devotional', date],
    queryFn: () => firestoreService.getDevotional(date ?? ''),
    enabled: !!date,
  });

  const isFavorite = date ? favorites.includes(date) : false;

  const toggleFavorite = () => {
    if (!date) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isFavorite) {
      removeFavorite(date);
    } else {
      addFavorite(date);
      addPoints(POINTS.FAVORITE_DEVOTIONAL);
    }
  };

  const formatDate = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    return dateObj.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!devotional) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <Text style={{ color: colors.text }}>Devotional not found</Text>
      </View>
    );
  }

  const title = language === 'es' ? devotional.titleEs : devotional.title;
  const verse = language === 'es' ? devotional.bibleVerseEs : devotional.bibleVerse;
  const reflection = language === 'es' ? devotional.reflectionEs : devotional.reflection;
  const story = language === 'es' ? devotional.storyEs : devotional.story;
  const character = language === 'es' ? devotional.biblicalCharacterEs : devotional.biblicalCharacter;
  const application = language === 'es' ? devotional.applicationEs : devotional.application;
  const prayer = language === 'es' ? devotional.prayerEs : devotional.prayer;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Hero Image */}
        <View style={{ height: height * 0.4 }}>
          <Image
            source={{ uri: devotional.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.7)']}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />

          {/* Back button */}
          <View
            className="absolute top-0 left-0 right-0 flex-row items-center justify-between px-5"
            style={{ paddingTop: insets.top + 10 }}
          >
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full items-center justify-center bg-black/30"
            >
              <ArrowLeft size={22} color="#FFFFFF" />
            </Pressable>

            <Pressable
              onPress={toggleFavorite}
              className="w-10 h-10 rounded-full items-center justify-center bg-black/30"
            >
              <Heart
                size={22}
                color="#FFFFFF"
                fill={isFavorite ? '#EF4444' : 'transparent'}
              />
            </Pressable>
          </View>

          {/* Title overlay */}
          <View className="absolute bottom-0 left-0 right-0 p-6">
            <Text className="text-white/70 text-sm font-medium mb-2">
              {formatDate(devotional.date)}
            </Text>
            <Text className="text-white text-2xl font-bold">{title}</Text>
          </View>
        </View>

        {/* Content */}
        <View className="px-5 pt-6">
          {/* Bible Verse Card */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            className="rounded-3xl p-6 mb-6 shadow-lg"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="flex-row items-center mb-4">
              <BookOpen size={20} color={colors.primary} />
              <Text
                className="ml-2 font-semibold"
                style={{ color: colors.primary }}
              >
                {t.bible_verse}
              </Text>
            </View>
            <Text
              className="text-xl italic leading-8 mb-3"
              style={{ color: colors.text }}
            >
              {verse}
            </Text>
            <Text
              className="text-sm font-medium"
              style={{ color: colors.textMuted }}
            >
              — {devotional.bibleReference}
            </Text>
          </Animated.View>

          {/* Expandable Sections */}
          <ExpandableSection
            title={t.reflection}
            content={reflection}
            icon={<Star size={20} color={colors.primary} />}
            colors={colors}
            defaultExpanded={true}
          />

          <ExpandableSection
            title={t.story}
            content={story}
            icon={<BookOpen size={20} color={colors.secondary} />}
            colors={colors}
          />

          <ExpandableSection
            title={t.biblical_character}
            content={character}
            icon={<Star size={20} color={colors.accent} />}
            colors={colors}
          />

          <ExpandableSection
            title={t.application}
            content={application}
            icon={<Check size={20} color={colors.primary} />}
            colors={colors}
          />

          <ExpandableSection
            title={t.prayer}
            content={prayer}
            icon={<Heart size={20} color={colors.secondary} />}
            colors={colors}
          />
        </View>
      </ScrollView>
    </View>
  );
}
