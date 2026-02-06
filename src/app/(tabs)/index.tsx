// Home Screen - Daily Devotional Display

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  BookOpen,
  Heart,
  ChevronDown,
  Check,
  Flame,
  Star,
  Trophy,
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

// Confetti colors
const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

// Individual confetti piece component
function ConfettiPiece({ delay, color, startX }: { delay: number; color: string; startX: number }) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(startX);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    const randomX = (Math.random() - 0.5) * 200;
    const duration = 2500 + Math.random() * 1000;

    translateY.value = withDelay(
      delay,
      withTiming(height + 100, { duration })
    );
    translateX.value = withDelay(
      delay,
      withSequence(
        withTiming(startX + randomX * 0.5, { duration: duration * 0.3 }),
        withTiming(startX + randomX, { duration: duration * 0.7 })
      )
    );
    rotate.value = withDelay(
      delay,
      withTiming(360 * (2 + Math.random() * 3), { duration })
    );
    opacity.value = withDelay(
      delay + duration * 0.7,
      withTiming(0, { duration: duration * 0.3 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const pieceSize = 8 + Math.random() * 8;
  const isCircle = Math.random() > 0.5;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          width: pieceSize,
          height: isCircle ? pieceSize : pieceSize * 2,
          backgroundColor: color,
          borderRadius: isCircle ? pieceSize / 2 : 2,
        },
        animatedStyle,
      ]}
    />
  );
}

// Confetti explosion component
function ConfettiCelebration({ visible }: { visible: boolean }) {
  if (!visible) return null;

  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    delay: Math.random() * 300,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    startX: Math.random() * width,
  }));

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      {pieces.map((piece) => (
        <ConfettiPiece
          key={piece.id}
          delay={piece.delay}
          color={piece.color}
          startX={piece.startX}
        />
      ))}
    </View>
  );
}

// Achievement popup component
function AchievementPopup({
  visible,
  points,
  colors,
  language,
}: {
  visible: boolean;
  points: number;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSequence(
        withSpring(1.1, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );
      opacity.value = withTiming(1, { duration: 300 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
        pointerEvents: 'none',
      }}
    >
      <Animated.View
        style={[
          {
            backgroundColor: colors.surface,
            borderRadius: 24,
            padding: 32,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 10,
            borderWidth: 3,
            borderColor: '#FFD700',
          },
          animatedStyle,
        ]}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#FFD700',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Trophy size={40} color="#FFFFFF" />
        </View>
        <Text
          style={{
            color: colors.text,
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          {language === 'es' ? '¡Devocional Completado!' : 'Devotional Complete!'}
        </Text>
        <Text
          style={{
            color: colors.primary,
            fontSize: 28,
            fontWeight: 'bold',
          }}
        >
          +{points} {language === 'es' ? 'puntos' : 'points'}
        </Text>
      </Animated.View>
    </View>
  );
}

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

  // Hidden timer for internal tracking (not shown to user)
  const [timeSpent, setTimeSpent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: devotional, isLoading } = useQuery({
    queryKey: ['todayDevotional'],
    queryFn: () => firestoreService.getTodayDevotional(),
  });

  const today = getTodayDate();
  const isFavorite = favorites.includes(today);

  // Time tracking (hidden from user - internal control only)
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-complete when 3 minutes have passed
  useEffect(() => {
    if (
      !isCompleted &&
      timeSpent >= COMPLETION_REQUIREMENTS.MIN_TIME_SECONDS
    ) {
      handleComplete();
    }
  }, [timeSpent, isCompleted]);

  const handleComplete = useCallback(() => {
    if (isCompleted) return;

    setIsCompleted(true);

    // Show celebration
    setShowCelebration(true);
    setShowAchievement(true);

    // Haptic feedback
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

    // Hide achievement popup after 3 seconds
    setTimeout(() => {
      setShowAchievement(false);
    }, 3000);

    // Hide confetti after 4 seconds
    setTimeout(() => {
      setShowCelebration(false);
    }, 4000);
  }, [isCompleted, user, today, addPoints, incrementStreak, updateUser]);

  const handleScroll = () => {
    // Scroll tracking removed - completion is now time-based only (3 minutes)
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
      {/* Confetti celebration overlay */}
      <ConfettiCelebration visible={showCelebration} />

      {/* Achievement popup */}
      <AchievementPopup
        visible={showAchievement}
        points={POINTS.COMPLETE_DEVOTIONAL}
        colors={colors}
        language={language}
      />

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

          {/* Completed badge - only shown after 3 minutes */}
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
