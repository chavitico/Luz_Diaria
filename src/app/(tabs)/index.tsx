// Home Screen - Daily Devotional Display

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  BookOpen,
  Heart,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Volume2,
  Check,
  Flame,
  Star,
} from 'lucide-react-native';
import { firestoreService, getTodayDate } from '@/lib/firestore';
import {
  useThemeColors,
  useLanguage,
  useUser,
  useUserFavorites,
  useAppStore,
} from '@/lib/store';
import { TRANSLATIONS } from '@/lib/constants';
import { COMPLETION_REQUIREMENTS, POINTS } from '@/lib/types';
import type { Devotional } from '@/lib/types';
import { cn } from '@/lib/cn';

const { width, height } = Dimensions.get('window');

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

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const language = useLanguage();
  const t = TRANSLATIONS[language];
  const user = useUser();
  const favorites = useUserFavorites();

  const addFavorite = useAppStore((s) => s.addFavorite);
  const removeFavorite = useAppStore((s) => s.removeFavorite);
  const addPoints = useAppStore((s) => s.addPoints);
  const updateUser = useAppStore((s) => s.updateUser);
  const incrementStreak = useAppStore((s) => s.incrementStreak);

  const [timeSpent, setTimeSpent] = useState(0);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: devotional, isLoading } = useQuery({
    queryKey: ['todayDevotional'],
    queryFn: () => firestoreService.getTodayDevotional(),
  });

  const today = getTodayDate();
  const isFavorite = favorites.includes(today);

  // Time tracking
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Check completion
  useEffect(() => {
    if (
      !isCompleted &&
      scrolledToBottom &&
      timeSpent >= COMPLETION_REQUIREMENTS.MIN_TIME_SECONDS
    ) {
      handleComplete();
    }
  }, [scrolledToBottom, timeSpent, isCompleted]);

  const handleComplete = useCallback(() => {
    if (isCompleted) return;

    setIsCompleted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Award points
    addPoints(POINTS.COMPLETE_DEVOTIONAL);

    // Update stats
    if (user) {
      const lastActive = user.lastActiveDate;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastActive === yesterdayStr) {
        incrementStreak();
      } else if (lastActive !== today) {
        // Reset streak if not consecutive
        updateUser({ streakCurrent: 1 });
      }

      updateUser({
        devotionalsCompleted: user.devotionalsCompleted + 1,
        lastActiveDate: today,
      });
    }
  }, [isCompleted, user, today, addPoints, incrementStreak, updateUser]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;

    if (isAtBottom && !scrolledToBottom) {
      setScrolledToBottom(true);
    }
  };

  const toggleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isFavorite) {
      removeFavorite(today);
    } else {
      addFavorite(today);
      if (!favorites.includes(today)) {
        addPoints(POINTS.FAVORITE_DEVOTIONAL);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timeRemaining = Math.max(
    0,
    COMPLETION_REQUIREMENTS.MIN_TIME_SECONDS - timeSpent
  );

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
        <Text style={{ color: colors.text }}>No devotional available</Text>
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
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Hero Image */}
        <View style={{ height: height * 0.45 }}>
          <Image
            source={{ uri: devotional.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 200,
            }}
          />

          {/* Header overlay */}
          <View
            className="absolute top-0 left-0 right-0 flex-row items-center justify-between px-5"
            style={{ paddingTop: insets.top + 10 }}
          >
            {/* Streak badge */}
            {user && user.streakCurrent > 0 && (
              <View className="flex-row items-center bg-orange-500/90 px-3 py-2 rounded-full">
                <Flame size={16} color="#FFFFFF" />
                <Text className="text-white font-bold ml-1">
                  {user.streakCurrent}
                </Text>
              </View>
            )}
            <View className="flex-1" />

            {/* Favorite button */}
            <Pressable
              onPress={toggleFavorite}
              className="w-10 h-10 rounded-full items-center justify-center bg-white/20"
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
            <Text className="text-white/80 text-sm font-medium mb-2 uppercase tracking-wider">
              {t.todays_devotional}
            </Text>
            <Text className="text-white text-3xl font-bold">{title}</Text>
          </View>
        </View>

        {/* Content */}
        <View className="px-5 -mt-4">
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

          {/* Progress indicator */}
          {!isCompleted && (
            <Animated.View
              entering={FadeIn.duration(300)}
              className="rounded-2xl p-4 mb-6 flex-row items-center"
              style={{ backgroundColor: colors.primary + '15' }}
            >
              {timeRemaining > 0 ? (
                <>
                  <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.primary }}>
                    <Text className="text-white text-xs font-bold">
                      {formatTime(timeRemaining)}
                    </Text>
                  </View>
                  <Text style={{ color: colors.text }} className="flex-1">
                    {t.time_remaining.replace('{time}', formatTime(timeRemaining))}
                  </Text>
                </>
              ) : !scrolledToBottom ? (
                <>
                  <ChevronDown size={20} color={colors.primary} />
                  <Text style={{ color: colors.text }} className="ml-2">
                    {t.scroll_to_complete}
                  </Text>
                </>
              ) : null}
            </Animated.View>
          )}

          {/* Completed badge */}
          {isCompleted && (
            <Animated.View
              entering={FadeIn.duration(300)}
              className="rounded-2xl p-4 mb-6 flex-row items-center"
              style={{ backgroundColor: '#22C55E20' }}
            >
              <View className="w-8 h-8 rounded-full items-center justify-center mr-3 bg-green-500">
                <Check size={18} color="#FFFFFF" strokeWidth={3} />
              </View>
              <Text className="text-green-700 font-semibold flex-1">
                {t.completed} • +{POINTS.COMPLETE_DEVOTIONAL} {t.points}
              </Text>
            </Animated.View>
          )}

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
