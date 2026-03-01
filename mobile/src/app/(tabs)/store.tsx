// Store Screen - Premium Gamification Hub with Collections, Bundles & Weekly Chest

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { IllustratedAvatar } from '@/components/IllustratedAvatar';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Coins,
  Check,
  Flame,
  Lock,
  Music,
  Award,
  X,
  Gift,
  ChevronRight,
  Sparkles,
  Star,
  Gem,
  ShoppingBag,
  Ticket,
  Info,
} from 'lucide-react-native';
import { TextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  useThemeColors,
  useLanguage,
  useUserPoints,
  useUser,
  useAppStore,
} from '@/lib/store';
import {
  TRANSLATIONS,
  DEFAULT_AVATARS,
  PURCHASABLE_THEMES,
  AVATAR_FRAMES,
  SPIRITUAL_TITLES,
  RARITY_COLORS,
  RARITY_GRADIENTS,
  ITEM_COLLECTIONS,
  STORE_BUNDLES,
  WEEKLY_CHEST_CONFIG,
  CHAPTER_COLLECTIONS,
  type ChapterCollection,
  type CollectionChapter,
} from '@/lib/constants';
import { cn } from '@/lib/cn';
import { addLedgerEntry } from '@/lib/points-ledger';

// ─── Premium Category Icons ───────────────────────────────────────────────────
// Each icon is a 28×28 React Native component using View + LinearGradient shapes.
// They adapt color via props (active = bright, inactive = muted).

function IconTemas({ color, active }: { color: string; active: boolean }) {
  const opacity = active ? 1 : 0.75;
  return (
    <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
      {/* Stacked palette layers */}
      <View style={{ position: 'absolute', bottom: 0, left: 1, width: 22, height: 14, borderRadius: 5, backgroundColor: color, opacity: opacity * 0.25 }} />
      <View style={{ position: 'absolute', bottom: 3, left: 3, width: 20, height: 13, borderRadius: 4, backgroundColor: color, opacity: opacity * 0.45 }} />
      <View style={{ position: 'absolute', bottom: 6, left: 2, width: 22, height: 12, borderRadius: 5, backgroundColor: color, opacity: opacity * 0.75 }} />
      {/* Light ray */}
      {active && (
        <View style={{ position: 'absolute', top: 0, left: 11, width: 2, height: 8, borderRadius: 1, backgroundColor: color, opacity: 0.9 }} />
      )}
      {/* Dot accents */}
      <View style={{ position: 'absolute', bottom: 8, left: 5, width: 4, height: 4, borderRadius: 2, backgroundColor: active ? '#fff' : color, opacity: opacity }} />
      <View style={{ position: 'absolute', bottom: 8, left: 11, width: 4, height: 4, borderRadius: 2, backgroundColor: active ? '#fff' : color, opacity: opacity * 0.7 }} />
      <View style={{ position: 'absolute', bottom: 8, right: 5, width: 4, height: 4, borderRadius: 2, backgroundColor: active ? '#fff' : color, opacity: opacity * 0.5 }} />
    </View>
  );
}

function IconMarcos({ color, active }: { color: string; active: boolean }) {
  const opacity = active ? 1 : 0.75;
  return (
    <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer ring */}
      <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2.5, borderColor: color, opacity: opacity }} />
      {/* Inner ring */}
      <View style={{ position: 'absolute', width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: color, opacity: opacity * 0.5 }} />
      {/* Center dot */}
      <View style={{ position: 'absolute', width: 5, height: 5, borderRadius: 2.5, backgroundColor: color, opacity: opacity }} />
      {/* Glow ring when active */}
      {active && (
        <View style={{ position: 'absolute', width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: color, opacity: 0.3 }} />
      )}
    </View>
  );
}

function IconTitulos({ color, active }: { color: string; active: boolean }) {
  const opacity = active ? 1 : 0.75;
  return (
    <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
      {/* Medal circle */}
      <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: color, opacity: opacity, position: 'absolute', bottom: 0 }} />
      {/* Medal ribbon left */}
      <View style={{
        position: 'absolute', top: 2, left: 5,
        width: 3, height: 11, borderRadius: 1.5,
        backgroundColor: color, opacity: opacity * 0.7,
        transform: [{ rotate: '-15deg' }],
      }} />
      {/* Medal ribbon right */}
      <View style={{
        position: 'absolute', top: 2, right: 5,
        width: 3, height: 11, borderRadius: 1.5,
        backgroundColor: color, opacity: opacity * 0.7,
        transform: [{ rotate: '15deg' }],
      }} />
      {/* Star in medal */}
      <View style={{ position: 'absolute', bottom: 4, width: 6, height: 6, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 6, color: active ? '#fff' : color, opacity: opacity }}>★</Text>
      </View>
    </View>
  );
}

function IconAvatares({ color, active }: { color: string; active: boolean }) {
  const opacity = active ? 1 : 0.75;
  return (
    <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
      {/* Aura ring */}
      <View style={{ position: 'absolute', width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: color, opacity: opacity * 0.3 }} />
      {/* Head */}
      <View style={{ position: 'absolute', top: 3, width: 10, height: 10, borderRadius: 5, backgroundColor: color, opacity: opacity }} />
      {/* Shoulders */}
      <View style={{
        position: 'absolute', bottom: 2,
        width: 18, height: 9, borderRadius: 9,
        backgroundColor: color, opacity: opacity * 0.75,
      }} />
      {/* Halo when active */}
      {active && (
        <View style={{ position: 'absolute', top: 0, width: 12, height: 4, borderRadius: 2, borderWidth: 1.5, borderColor: color, opacity: 0.8 }} />
      )}
    </View>
  );
}

function IconPaquetes({ color, active }: { color: string; active: boolean }) {
  const opacity = active ? 1 : 0.75;
  return (
    <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
      {/* Box body */}
      <View style={{ position: 'absolute', bottom: 0, width: 20, height: 14, borderRadius: 3, borderWidth: 2, borderColor: color, opacity: opacity }} />
      {/* Box lid */}
      <View style={{ position: 'absolute', bottom: 12, width: 22, height: 5, borderRadius: 2, borderWidth: 2, borderColor: color, opacity: opacity }} />
      {/* Ribbon vertical */}
      <View style={{ position: 'absolute', bottom: 0, left: 12, width: 2, height: 17, backgroundColor: color, opacity: opacity * 0.6 }} />
      {/* Light rays from box */}
      {active && (
        <>
          <View style={{ position: 'absolute', top: 1, left: 11, width: 1.5, height: 5, borderRadius: 1, backgroundColor: color, opacity: 0.8 }} />
          <View style={{ position: 'absolute', top: 2, left: 6, width: 1.5, height: 4, borderRadius: 1, backgroundColor: color, opacity: 0.5, transform: [{ rotate: '-30deg' }] }} />
          <View style={{ position: 'absolute', top: 2, right: 6, width: 1.5, height: 4, borderRadius: 1, backgroundColor: color, opacity: 0.5, transform: [{ rotate: '30deg' }] }} />
        </>
      )}
    </View>
  );
}

function IconColecciones({ color, active }: { color: string; active: boolean }) {
  const opacity = active ? 1 : 0.75;
  return (
    <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
      {/* Stacked scroll cards */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, width: 20, height: 14, borderRadius: 4, borderWidth: 1.5, borderColor: color, opacity: opacity * 0.35, transform: [{ rotate: '-6deg' }] }} />
      <View style={{ position: 'absolute', bottom: 2, left: 1, width: 20, height: 14, borderRadius: 4, borderWidth: 1.5, borderColor: color, opacity: opacity * 0.6, transform: [{ rotate: '-2deg' }] }} />
      <View style={{ position: 'absolute', bottom: 4, left: 3, width: 20, height: 14, borderRadius: 4, backgroundColor: color, opacity: opacity * 0.15 }} />
      <View style={{ position: 'absolute', bottom: 4, left: 3, width: 20, height: 14, borderRadius: 4, borderWidth: 2, borderColor: color, opacity: opacity }} />
      {/* Lines inside top card */}
      <View style={{ position: 'absolute', bottom: 12, left: 6, width: 12, height: 1.5, borderRadius: 1, backgroundColor: active ? '#fff' : color, opacity: opacity * 0.8 }} />
      <View style={{ position: 'absolute', bottom: 9, left: 6, width: 8, height: 1.5, borderRadius: 1, backgroundColor: active ? '#fff' : color, opacity: opacity * 0.5 }} />
    </View>
  );
}
// ─── End Premium Category Icons ───────────────────────────────────────────────

import {
  gamificationApi,
  StoreItem,
  WeeklyProgress,
  WeeklyChallenge,
} from '@/lib/gamification-api';

type CategoryType = 'themes' | 'frames' | 'titles' | 'avatars' | 'bundles' | 'collections';

type CategoryIconComponent = (props: { color: string; active: boolean }) => React.ReactElement;

const CATEGORIES: { key: CategoryType; IconComponent: CategoryIconComponent; label: string; labelEs: string }[] = [
  { key: 'themes', IconComponent: IconTemas, label: 'Themes', labelEs: 'Temas' },
  { key: 'frames', IconComponent: IconMarcos, label: 'Frames', labelEs: 'Marcos' },
  { key: 'titles', IconComponent: IconTitulos, label: 'Titles', labelEs: 'Titulos' },
  { key: 'avatars', IconComponent: IconAvatares, label: 'Avatars', labelEs: 'Avatares' },
  { key: 'bundles', IconComponent: IconPaquetes, label: 'Bundles', labelEs: 'Paquetes' },
  { key: 'collections', IconComponent: IconColecciones, label: 'Collections', labelEs: 'Colecciones' },
];

// Get rarity icon
function RarityIcon({ rarity, size = 12 }: { rarity: string; size?: number }) {
  const color = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  if (rarity === 'epic') return <Gem size={size} color={color} />;
  if (rarity === 'rare') return <Star size={size} color={color} />;
  return null;
}

// Rarity Badge Component
function RarityBadge({ rarity, language }: { rarity: string; language: 'en' | 'es' }) {
  const color = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const labels = {
    common: { en: 'Common', es: 'Comun' },
    rare: { en: 'Rare', es: 'Raro' },
    epic: { en: 'Epic', es: 'Epico' },
  };
  const label = labels[rarity as keyof typeof labels]?.[language] || rarity;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: color + '20',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        gap: 4,
      }}
    >
      <RarityIcon rarity={rarity} size={10} />
      <Text style={{ fontSize: 10, fontWeight: '600', color, textTransform: 'capitalize' }}>
        {label}
      </Text>
    </View>
  );
}

// Profile Header Component
function ProfileHeader({
  colors,
  user,
  points,
  language,
}: {
  colors: ReturnType<typeof useThemeColors>;
  user: ReturnType<typeof useUser>;
  points: number;
  language: 'en' | 'es';
}) {
  const t = TRANSLATIONS[language];

  const frameColor = user?.frameId && AVATAR_FRAMES[user.frameId]
    ? AVATAR_FRAMES[user.frameId].color
    : colors.textMuted;

  const equippedTitle = user?.titleId && SPIRITUAL_TITLES[user.titleId]
    ? language === 'es'
      ? SPIRITUAL_TITLES[user.titleId].nameEs
      : SPIRITUAL_TITLES[user.titleId].name
    : t.no_title;

  const avatarData = DEFAULT_AVATARS.find(a => a.id === user?.avatar);
  const avatarEmoji = avatarData?.emoji || '🕊️';

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      className="mx-5 mb-5 rounded-2xl overflow-hidden"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <LinearGradient
        colors={[colors.surface, colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 20 }}
      >
        <View className="flex-row items-center">
          {/* Avatar with Frame */}
          <View className="relative mr-4">
            <View
              className="w-18 h-18 rounded-full items-center justify-center"
              style={{
                width: 72,
                height: 72,
                backgroundColor: colors.primary + '15',
                borderWidth: 4,
                borderColor: frameColor,
                shadowColor: frameColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
              }}
            >
              <Text style={{ fontSize: 32 }}>{avatarEmoji}</Text>
            </View>
          </View>

          {/* User Info */}
          <View className="flex-1">
            <Text
              className="text-xl font-bold mb-0.5"
              style={{ color: colors.text }}
            >
              {user?.nickname || 'Pilgrim'}
            </Text>
            <Text
              className="text-sm italic"
              style={{ color: colors.textMuted }}
              numberOfLines={1}
            >
              {equippedTitle}
            </Text>
          </View>

          {/* Points & Streak */}
          <View className="items-end">
            <View
              className="flex-row items-center mb-2 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: colors.primary + '15' }}
            >
              <Coins size={18} color={colors.primary} />
              <Text
                className="text-lg font-bold ml-1.5"
                style={{ color: colors.primary }}
              >
                {points}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Flame size={16} color="#F97316" />
              <Text
                className="text-base font-semibold ml-1"
                style={{ color: '#F97316' }}
              >
                {user?.streakCurrent || 0}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// Single confetti particle - needs its own component to use hooks legally
function ConfettiParticle({
  pv,
  x,
  y,
  angle,
  size,
  borderRadius,
  color,
}: {
  pv: SharedValue<number>;
  x: number;
  y: number;
  angle: number;
  size: number;
  borderRadius: number;
  color: string;
}) {
  const pStyle = useAnimatedStyle<{ opacity: number; transform: { translateX: number }[] | { translateY: number }[] | { scale: number }[] | { rotate: string }[] }>(() => ({
    opacity: pv.value,
    transform: [
      { translateX: x * pv.value },
      { translateY: y * pv.value },
      { scale: pv.value },
      { rotate: `${angle * 180 / Math.PI * pv.value}deg` },
    ] as any,
  }));
  return (
    <Animated.View
      style={[{ position: 'absolute' as const, width: size, height: size, borderRadius, backgroundColor: color }, pStyle as any]}
    />
  );
}

// Chest Reward Modal - confetti splash + prize reveal
function ChestRewardModal({
  visible,
  reward,
  language,
  colors,
  onClose,
}: {
  visible: boolean;
  reward: {
    type: 'points' | 'item';
    value?: number;
    itemId?: string;
    itemType?: 'avatar' | 'frame' | 'title' | 'theme';
    itemName?: string;
    itemNameEs?: string;
    itemEmoji?: string;
    itemColor?: string;
    rarity: string;
  } | null;
  language: 'en' | 'es';
  colors: ReturnType<typeof useThemeColors>;
  onClose: () => void;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const chestScale = useSharedValue(1);

  // Fixed 20 shared values — always created, never in a loop
  const p0 = useSharedValue(0); const p1 = useSharedValue(0); const p2 = useSharedValue(0);
  const p3 = useSharedValue(0); const p4 = useSharedValue(0); const p5 = useSharedValue(0);
  const p6 = useSharedValue(0); const p7 = useSharedValue(0); const p8 = useSharedValue(0);
  const p9 = useSharedValue(0); const p10 = useSharedValue(0); const p11 = useSharedValue(0);
  const p12 = useSharedValue(0); const p13 = useSharedValue(0); const p14 = useSharedValue(0);
  const p15 = useSharedValue(0); const p16 = useSharedValue(0); const p17 = useSharedValue(0);
  const p18 = useSharedValue(0); const p19 = useSharedValue(0);
  const pValues = [p0,p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13,p14,p15,p16,p17,p18,p19];

  const confettiColors = ['#F59E0B', '#EF4444', '#8B5CF6', '#10B981', '#3B82F6', '#F97316', '#EC4899', '#FCD34D'];
  // Fixed particle positions (stable — no random on render)
  const particleData = React.useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    x: Math.cos((i / 20) * Math.PI * 2) * (80 + (i % 4) * 30),
    y: Math.sin((i / 20) * Math.PI * 2) * (80 + (i % 4) * 30),
    color: confettiColors[i % confettiColors.length],
    angle: (i / 20) * Math.PI * 2,
    size: 10 + (i % 4) * 4,
    borderRadius: i % 3 === 0 ? 99 : 2,
  })), []);

  const rarityGrad: [string, string] = reward?.rarity === 'epic'
    ? ['#4C1D95', '#7C3AED']
    : reward?.rarity === 'rare'
    ? ['#1E3A5F', '#2563EB']
    : ['#1A3A1A', '#15803D'];
  const rarityColor = reward?.rarity === 'epic' ? '#A855F7' : reward?.rarity === 'rare' ? '#3B82F6' : '#22C55E';

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSequence(
        withSpring(1.1, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 180 })
      );
      chestScale.value = withSequence(
        withTiming(1, { duration: 100 }),
        withSpring(1.3, { damping: 6, stiffness: 300 }),
        withSpring(1, { damping: 8, stiffness: 200 })
      );
      pValues.forEach((p, i) => {
        p.value = 0;
        p.value = withSequence(
          withTiming(0, { duration: i * 30 }),
          withSpring(1, { damping: 8, stiffness: 120 })
        );
      });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.8, { duration: 200 });
      pValues.forEach(p => { p.value = 0; });
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const chestStyle = useAnimatedStyle(() => ({
    transform: [{ scale: chestScale.value }],
  }));

  const isExclusive = reward?.itemId?.includes('_chest_');
  const displayName = language === 'es' ? (reward?.itemNameEs ?? reward?.itemName ?? '') : (reward?.itemName ?? '');

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center' }}>
        {/* Confetti particles — each is its own component with its own hooks */}
        {particleData.map((pt, i) => (
          <ConfettiParticle
            key={i}
            pv={pValues[i] as SharedValue<number>}
            x={pt.x}
            y={pt.y}
            angle={pt.angle}
            size={pt.size}
            borderRadius={pt.borderRadius}
            color={pt.color}
          />
        ))}

        <Animated.View style={[{ width: 320, borderRadius: 28, overflow: 'hidden' }, containerStyle]}>
          <LinearGradient colors={rarityGrad} style={{ padding: 32, alignItems: 'center' }}>
            {/* Rarity badge */}
            {isExclusive && (
              <View style={{ backgroundColor: rarityColor + '30', borderWidth: 1, borderColor: rarityColor, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 16 }}>
                <Text style={{ color: rarityColor, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>
                  {language === 'es' ? '✦ EXCLUSIVO DEL COFRE ✦' : '✦ CHEST EXCLUSIVE ✦'}
                </Text>
              </View>
            )}

            {/* Chest icon */}
            <Animated.View style={[{ marginBottom: 20 }, chestStyle]}>
              <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: rarityColor + '25', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: rarityColor + '60' }}>
                <Text style={{ fontSize: 52 }}>🎁</Text>
              </View>
            </Animated.View>

            {/* Prize */}
            {reward?.type === 'item' ? (
              <>
                {/* Item type label */}
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>
                  {language === 'es'
                    ? reward.itemType === 'avatar' ? 'Nuevo avatar desbloqueado'
                      : reward.itemType === 'frame' ? 'Nuevo marco desbloqueado'
                      : reward.itemType === 'title' ? 'Nuevo título desbloqueado'
                      : reward.itemType === 'theme' ? 'Nuevo tema desbloqueado'
                      : 'Has obtenido'
                    : reward.itemType === 'avatar' ? 'New avatar unlocked'
                      : reward.itemType === 'frame' ? 'New frame unlocked'
                      : reward.itemType === 'title' ? 'New title unlocked'
                      : reward.itemType === 'theme' ? 'New theme unlocked'
                      : 'You received'
                  }
                </Text>
                {reward.itemEmoji ? (
                  <Text style={{ fontSize: 56, marginBottom: 12 }}>{reward.itemEmoji}</Text>
                ) : reward.itemColor ? (
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: reward.itemColor, marginBottom: 12, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' }} />
                ) : null}
                <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 6 }}>
                  {displayName}
                </Text>
                <View style={{ backgroundColor: rarityColor + '30', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 4 }}>
                  <Text style={{ color: rarityColor, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {reward.rarity}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 8 }}>
                  {language === 'es' ? 'Has ganado' : 'You earned'}
                </Text>
                <Text style={{ color: '#FCD34D', fontSize: 52, fontWeight: '900', marginBottom: 8 }}>
                  +{reward?.value}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, fontWeight: '600' }}>
                  {language === 'es' ? 'puntos' : 'points'}
                </Text>
              </>
            )}

            {/* Close button */}
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onClose(); }}
              style={{ marginTop: 28, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, paddingHorizontal: 40, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                {language === 'es' ? '¡Genial!' : 'Awesome!'}
              </Text>
            </Pressable>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Weekly Chest Card Component
function WeeklyChestCard({
  colors,
  language,
  userId,
  allChallengesComplete,
  onClaim,
}: {
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  userId: string;
  allChallengesComplete: boolean;
  onClaim: () => void;
}) {
  const [isClaiming, setIsClaiming] = useState(false);
  const user = useUser();
  const lastChestClaimed = user?.lastWeeklyChestClaimed;

  // Get current week ID
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  const currentWeekId = `${now.getFullYear()}-W${weekNumber}`;

  const alreadyClaimed = lastChestClaimed === currentWeekId;
  const canClaim = allChallengesComplete && !alreadyClaimed;

  if (!allChallengesComplete && !alreadyClaimed) return null;

  return (
    <Animated.View
      entering={FadeInDown.delay(150).duration(400)}
      className="mx-5 mb-5 rounded-2xl overflow-hidden"
      style={{
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: canClaim ? 0.3 : 0.1,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <LinearGradient
        colors={canClaim ? ['#FAF5FF', '#F3E8FF'] : [colors.surface, colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 20 }}
      >
        <View className="flex-row items-center">
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
            style={{ backgroundColor: canClaim ? '#A855F7' + '20' : colors.textMuted + '15' }}
          >
            <Gift size={28} color={canClaim ? '#A855F7' : colors.textMuted} />
          </View>

          <View className="flex-1">
            <Text
              className="text-base font-bold mb-1"
              style={{ color: colors.text }}
            >
              {language === 'es' ? 'Cofre Semanal' : 'Weekly Chest'}
            </Text>
            <Text
              className="text-xs"
              style={{ color: colors.textMuted }}
            >
              {alreadyClaimed
                ? language === 'es' ? 'Reclamado esta semana' : 'Claimed this week'
                : language === 'es' ? 'Completa todos los desafios' : 'Complete all challenges'
              }
            </Text>
          </View>

          {canClaim && (
            <Pressable
              onPress={() => {
                setIsClaiming(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onClaim();
                setTimeout(() => setIsClaiming(false), 500);
              }}
              disabled={isClaiming}
              className="px-4 py-2.5 rounded-xl"
              style={{ backgroundColor: '#A855F7' }}
            >
              {isClaiming ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-sm font-semibold text-white">
                  {language === 'es' ? 'Abrir' : 'Open'}
                </Text>
              )}
            </Pressable>
          )}

          {alreadyClaimed && (
            <View className="flex-row items-center px-3 py-2 rounded-xl" style={{ backgroundColor: '#22C55E20' }}>
              <Check size={14} color="#22C55E" strokeWidth={3} />
            </View>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// Weekly Challenges Card
function WeeklyChallengesCard({
  colors,
  language,
  userId,
  onAllComplete,
}: {
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  userId: string;
  onAllComplete: (complete: boolean) => void;
}) {
  const t = TRANSLATIONS[language];
  const queryClient = useQueryClient();
  const updateUser = useAppStore((s) => s.updateUser);
  const [selectedChallenge, setSelectedChallenge] = React.useState<{
    title: string;
    description: string;
    type: string;
  } | null>(null);

  const { data: challenges = [] } = useQuery({
    queryKey: ['weeklyChallenges'],
    queryFn: () => gamificationApi.getCurrentChallenges(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: progressData = [] } = useQuery({
    queryKey: ['challengeProgress', userId],
    queryFn: () => gamificationApi.getChallengeProgress(userId),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  // Check if all challenges complete
  React.useEffect(() => {
    if (challenges.length > 0 && progressData.length > 0) {
      const allComplete = challenges.every(c => {
        const progress = progressData.find(p => p.challengeId === c.id);
        return progress?.completed && progress?.claimed;
      });
      onAllComplete(allComplete);
    }
  }, [challenges, progressData, onAllComplete]);

  const claimMutation = useMutation({
    mutationFn: ({ challengeId }: { challengeId: string }) =>
      gamificationApi.claimChallengeReward(userId, challengeId),
    onSuccess: (data) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['challengeProgress', userId] });
      if (data.pointsAwarded) {
        updateUser({ points: (useAppStore.getState().user?.points || 0) + data.pointsAwarded });
        addLedgerEntry({
          delta: data.pointsAwarded,
          kind: 'challenge',
          title: language === 'es' ? 'Desafío completado' : 'Challenge completed',
          detail: '',
        });
      }
    },
  });

  const getChallengeTypeHint = (type: string, lang: 'en' | 'es') => {
    if (lang === 'es') {
      switch (type) {
        case 'prayer': return 'Toca el botón "Ya oré" en la pantalla principal para registrar tu oración diaria.';
        case 'share': return 'Toca el botón de compartir en el devocional y envíalo por WhatsApp u otras apps.';
        case 'devotional_complete': return 'Lee el devocional completo del día en la pantalla principal.';
        default: return '';
      }
    } else {
      switch (type) {
        case 'prayer': return 'Tap the "I prayed" button on the main screen to register your daily prayer.';
        case 'share': return 'Tap the share button on the devotional and send it via WhatsApp or other apps.';
        case 'devotional_complete': return 'Read the full daily devotional on the main screen.';
        default: return '';
      }
    }
  };

  if (challenges.length === 0) return null;

  return (
    <>
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        className="mx-5 mb-5 rounded-2xl overflow-hidden"
        style={{
          backgroundColor: colors.surface,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <View className="p-5">
          <View className="flex-row items-center mb-4">
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: '#F97316' + '20' }}
            >
              <Gift size={20} color="#F97316" />
            </View>
            <Text
              className="text-base font-bold flex-1"
              style={{ color: colors.text }}
            >
              {t.weekly_challenges}
            </Text>
          </View>

          {challenges.slice(0, 3).map((challenge, index) => {
            const progress = progressData.find(p => p.challengeId === challenge.id);
            const currentCount = progress?.currentCount || 0;
            const progressPercent = Math.min((currentCount / challenge.goalCount) * 100, 100);
            const isComplete = progress?.completed || false;
            const isClaimed = progress?.claimed || false;
            const title = language === 'es' ? challenge.titleEs : challenge.titleEn;
            const description = language === 'es' ? challenge.descriptionEs : challenge.descriptionEn;

            return (
              <View key={challenge.id} className={index > 0 ? 'mt-4' : ''}>
                <View className="flex-row items-center justify-between mb-2">
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedChallenge({ title, description, type: challenge.type });
                    }}
                    className="flex-row items-center flex-1 mr-2"
                    style={{ gap: 6 }}
                  >
                    <Text
                      className="text-sm font-medium flex-1"
                      style={{ color: colors.text }}
                      numberOfLines={1}
                    >
                      {title}
                    </Text>
                    <Info size={14} color={colors.textMuted} />
                  </Pressable>
                  <Text
                    className="text-xs font-bold ml-2 px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: isComplete ? '#22C55E20' : colors.textMuted + '15',
                      color: isComplete ? '#22C55E' : colors.textMuted
                    }}
                  >
                    {currentCount}/{challenge.goalCount}
                  </Text>
                </View>

                <View
                  className="h-2.5 rounded-full overflow-hidden mb-2"
                  style={{ backgroundColor: colors.textMuted + '15' }}
                >
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${progressPercent}%`,
                      backgroundColor: isComplete ? '#22C55E' : colors.primary,
                    }}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Coins size={14} color={colors.primary} />
                    <Text
                      className="text-xs font-semibold ml-1"
                      style={{ color: colors.primary }}
                    >
                      +{challenge.rewardPoints}
                    </Text>
                  </View>

                  {isComplete && !isClaimed && (
                    <Pressable
                      onPress={() => claimMutation.mutate({ challengeId: challenge.id })}
                      disabled={claimMutation.isPending}
                      className="px-4 py-1.5 rounded-lg"
                      style={{ backgroundColor: '#22C55E' }}
                    >
                      {claimMutation.isPending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text className="text-xs font-semibold text-white">
                          {t.claim_reward}
                        </Text>
                      )}
                    </Pressable>
                  )}

                  {isClaimed && (
                    <View className="flex-row items-center px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#22C55E20' }}>
                      <Check size={12} color="#22C55E" strokeWidth={3} />
                      <Text className="text-xs font-semibold text-green-600 ml-1">
                        {t.reward_claimed}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </Animated.View>

      {/* Challenge Description Modal */}
      <Modal
        visible={!!selectedChallenge}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedChallenge(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 }}
          onPress={() => setSelectedChallenge(null)}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 24,
              width: '100%',
              maxWidth: 360,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.18,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            {/* Header */}
            <View className="flex-row items-start justify-between mb-4">
              <View
                className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: '#F97316' + '20' }}
              >
                <Gift size={22} color="#F97316" />
              </View>
              <View className="flex-1 mr-2">
                <Text className="text-base font-bold mb-0.5" style={{ color: colors.text }}>
                  {selectedChallenge?.title}
                </Text>
                <Text className="text-xs" style={{ color: colors.textMuted }}>
                  {language === 'es' ? 'Desafío semanal' : 'Weekly challenge'}
                </Text>
              </View>
              <Pressable
                onPress={() => setSelectedChallenge(null)}
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.textMuted + '18' }}
              >
                <X size={16} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Description */}
            <View className="mb-4 p-3 rounded-xl" style={{ backgroundColor: colors.background }}>
              <Text className="text-sm leading-5" style={{ color: colors.text }}>
                {selectedChallenge?.description}
              </Text>
            </View>

            {/* How to complete */}
            <View className="p-3 rounded-xl" style={{ backgroundColor: colors.primary + '12' }}>
              <Text className="text-xs font-semibold mb-1" style={{ color: colors.primary }}>
                {language === 'es' ? '¿Cómo completarlo?' : 'How to complete it?'}
              </Text>
              <Text className="text-xs leading-5" style={{ color: colors.text }}>
                {selectedChallenge ? getChallengeTypeHint(selectedChallenge.type, language) : ''}
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// Promo Code Card Component
function PromoCodeCard({
  colors,
  language,
  userId,
  onSuccess,
}: {
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  userId: string;
  onSuccess: (points: number) => void;
}) {
  const [code, setCode] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRedeem = async () => {
    if (!code.trim() || isRedeeming) return;

    setIsRedeeming(true);
    setMessage(null);

    try {
      const result = await gamificationApi.redeemPromoCode(userId, code.trim());

      if (result.success && result.pointsAwarded) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMessage({
          type: 'success',
          text: `${language === 'es' ? 'Codigo aplicado' : 'Code applied'}: +${result.pointsAwarded} ${language === 'es' ? 'puntos' : 'points'}`,
        });
        setCode('');
        onSuccess(result.pointsAwarded);
        // Close card after success
        setTimeout(() => {
          setIsExpanded(false);
          setMessage(null);
        }, 2000);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        let errorText = result.error || (language === 'es' ? 'Error al canjear' : 'Redemption error');
        setMessage({ type: 'error', text: errorText });
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setMessage({
        type: 'error',
        text: language === 'es' ? 'Error de conexion' : 'Connection error',
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(400)}
      className="mx-5 mb-5 rounded-2xl overflow-hidden"
      style={{
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          setIsExpanded(!isExpanded);
          setMessage(null);
        }}
        style={{ padding: 20 }}
      >
        <View className="flex-row items-center">
          <View
            className="w-12 h-12 rounded-xl items-center justify-center mr-4"
            style={{ backgroundColor: colors.primary + '20' }}
          >
            <Ticket size={24} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text
              className="text-base font-bold"
              style={{ color: colors.text }}
            >
              {language === 'es' ? 'Canjear Codigo' : 'Redeem Code'}
            </Text>
            <Text
              className="text-xs"
              style={{ color: colors.textMuted }}
            >
              {language === 'es' ? 'Ingresa tu codigo promocional' : 'Enter your promo code'}
            </Text>
          </View>
          <View
            style={{
              transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
            }}
          >
            <ChevronRight size={20} color={colors.textMuted} />
          </View>
        </View>
      </Pressable>

      {isExpanded && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={{ paddingHorizontal: 20, paddingBottom: 20 }}
        >
          {/* Input Field */}
          <View
            className="flex-row items-center rounded-xl overflow-hidden mb-3"
            style={{ backgroundColor: colors.background }}
          >
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder={language === 'es' ? 'Codigo...' : 'Code...'}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                flex: 1,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: colors.text,
                fontWeight: '600',
              }}
              editable={!isRedeeming}
            />
            <Pressable
              onPress={handleRedeem}
              disabled={!code.trim() || isRedeeming}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 14,
                backgroundColor: code.trim() && !isRedeeming ? colors.primary : colors.textMuted + '30',
              }}
            >
              {isRedeeming ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={{
                    color: code.trim() ? '#FFFFFF' : colors.textMuted,
                    fontWeight: '700',
                    fontSize: 14,
                  }}
                >
                  {language === 'es' ? 'Canjear' : 'Redeem'}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Message */}
          {message && (
            <Animated.View
              entering={FadeIn.duration(150)}
              className="flex-row items-center rounded-lg px-4 py-3"
              style={{
                backgroundColor: message.type === 'success' ? '#22C55E20' : '#EF444420',
              }}
            >
              {message.type === 'success' ? (
                <Check size={16} color="#22C55E" strokeWidth={3} />
              ) : (
                <X size={16} color="#EF4444" strokeWidth={3} />
              )}
              <Text
                className="text-sm font-medium ml-2 flex-1"
                style={{ color: message.type === 'success' ? '#22C55E' : '#EF4444' }}
              >
                {message.text}
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
}

// Category Tab with premium glow active state

// ─── useCollectionClaimBadges hook ───────────────────────────────────────────
const SEEN_STORAGE_KEY = 'seen_claimable_collections_v1';

function useCollectionClaimBadges(
  collections: typeof ITEM_COLLECTIONS,
  purchasedItems: string[],
  claimedCollectionIds: Set<string>
) {
  // seenMap: collectionId → timestamp when user last marked it as seen
  const [seenMap, setSeenMap] = useState<Record<string, number>>({});
  // claimableSince: collectionId → timestamp when we first detected it became claimable
  const [claimableSince, setClaimableSince] = useState<Record<string, number>>({});

  // Load persisted seen map on mount
  useEffect(() => {
    AsyncStorage.getItem(SEEN_STORAGE_KEY).then(raw => {
      if (raw) {
        try { setSeenMap(JSON.parse(raw)); } catch { /* ignore */ }
      }
    });
  }, []);

  // Derive claimable collection IDs
  const claimableIds = useMemo(() => {
    return Object.values(collections)
      .filter(col => {
        const owned = col.items.filter(itemId => {
          if (purchasedItems.includes(itemId)) return true;
          const av = DEFAULT_AVATARS.find(a => a.id === itemId);
          return av && !('price' in av);
        });
        return owned.length === col.items.length && !claimedCollectionIds.has(col.id);
      })
      .map(col => col.id);
  }, [collections, purchasedItems, claimedCollectionIds]);

  // When a new collection becomes claimable, record the timestamp if not already tracked
  useEffect(() => {
    const now = Date.now();
    setClaimableSince(prev => {
      const next = { ...prev };
      let changed = false;
      for (const id of claimableIds) {
        if (!next[id]) { next[id] = now; changed = true; }
      }
      return changed ? next : prev;
    });
  }, [claimableIds]);

  // newClaimableIds: claimable AND (never seen OR seen before it became claimable)
  const newClaimableIds = useMemo(() => {
    const result = new Set<string>();
    for (const id of claimableIds) {
      const seen = seenMap[id] ?? 0;
      const since = claimableSince[id] ?? Date.now();
      if (seen < since) result.add(id);
    }
    return result;
  }, [claimableIds, seenMap, claimableSince]);

  const pendingClaimsCount = claimableIds.length;

  // Call this when the user enters the Collections tab
  const markClaimablesSeen = useCallback(async () => {
    const now = Date.now();
    const next: Record<string, number> = { ...seenMap };
    for (const id of claimableIds) {
      next[id] = now;
    }
    setSeenMap(next);
    await AsyncStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(next));
  }, [seenMap, claimableIds]);

  return { pendingClaimsCount, newClaimableIds, markClaimablesSeen };
}

function CategoryTab({
  category,
  isActive,
  colors,
  language,
  onPress,
  badgeCount = 0,
}: {
  category: typeof CATEGORIES[0];
  isActive: boolean;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
  badgeCount?: number;
}) {
  const { IconComponent } = category;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.92); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={{ alignItems: 'center', marginRight: 12 }}
      >
        <View style={{ position: 'relative' }}>
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 6,
              backgroundColor: isActive ? colors.primary : colors.surface,
              shadowColor: isActive ? colors.primary : '#000',
              shadowOffset: { width: 0, height: isActive ? 6 : 2 },
              shadowOpacity: isActive ? 0.38 : 0.07,
              shadowRadius: isActive ? 12 : 5,
              elevation: isActive ? 6 : 2,
              borderWidth: isActive ? 0 : 1,
              borderColor: colors.textMuted + '18',
            }}
          >
            <IconComponent
              color={isActive ? '#FFFFFF' : colors.textMuted}
              active={isActive}
            />
          </View>
          {badgeCount > 0 && (
            <View
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: '#EF4444',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 4,
                borderWidth: 2,
                borderColor: colors.background,
                shadowColor: '#EF4444',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', lineHeight: 14 }}>
                {badgeCount > 9 ? '9+' : String(badgeCount)}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={{
            fontSize: 11,
            fontWeight: isActive ? '700' : '500',
            color: isActive ? colors.primary : colors.textMuted,
            letterSpacing: isActive ? 0.2 : 0,
          }}
        >
          {language === 'es' ? category.labelEs : category.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// Item Detail Modal
function ItemDetailModal({
  visible,
  onClose,
  item,
  colors,
  language,
  isOwned,
  isEquipped,
  canAfford,
  onPurchase,
  onEquip,
  isPurchasing,
}: {
  visible: boolean;
  onClose: () => void;
  item: {
    id: string;
    type: 'theme' | 'frame' | 'title' | 'avatar';
    name: string;
    nameEs: string;
    description: string;
    descriptionEs: string;
    price: number;
    rarity: string;
    emoji?: string;
    color?: string;
    colors?: { primary: string; secondary: string; accent: string };
    chestOnly?: boolean;
    meaning?: string;
    meaningEn?: string;
    unlockType?: 'streak' | 'devotionals' | 'share' | 'store';
    unlockValue?: number;
  } | null;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
  onPurchase: () => void;
  onEquip: () => void;
  isPurchasing: boolean;
}) {
  const t = TRANSLATIONS[language];
  if (!item) return null;

  const rarityColor = RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const displayName = language === 'es' ? item.nameEs : item.name;
  const displayDesc = language === 'es' ? item.descriptionEs : item.description;

  // Render preview based on type
  const renderPreview = () => {
    if (item.type === 'avatar' && item.emoji) {
      const isV2 = item.id.startsWith('avatar_v2_') || item.id.startsWith('avatar_l2_');
      if (isV2) {
        return (
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              borderWidth: 4,
              borderColor: rarityColor + '40',
              overflow: 'hidden',
            }}
          >
            <IllustratedAvatar avatarId={item.id} size={120} emoji={item.emoji} />
          </View>
        );
      }
      return (
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: colors.primary + '15',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 4,
            borderColor: rarityColor + '40',
          }}
        >
          <Text style={{ fontSize: 56 }}>{item.emoji}</Text>
        </View>
      );
    }

    if (item.type === 'frame' && item.color) {
      return (
        <View style={{ alignItems: 'center' }}>
          {/* Multi-layer frame: outer ring */}
          <View
            style={{
              width: 132,
              height: 132,
              borderRadius: 66,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 6,
              borderColor: item.color,
              shadowColor: item.color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.7,
              shadowRadius: 16,
              elevation: 12,
              backgroundColor: colors.background,
            }}
          >
            {/* Inner glow layer */}
            <View
              style={{
                position: 'absolute',
                top: 6,
                left: 6,
                right: 6,
                bottom: 6,
                borderRadius: 60,
                borderWidth: 1,
                borderColor: item.color + '50',
              }}
            />
            {/* Avatar emoji */}
            <Text style={{ fontSize: 44 }}>🕊️</Text>
          </View>
          {/* Hex color label */}
          <Text style={{
            marginTop: 10,
            fontSize: 11,
            fontWeight: '600',
            color: colors.textMuted,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
          }}>
            {item.color}
          </Text>
        </View>
      );
    }

    if (item.type === 'theme' && item.colors) {
      const tc = item.colors;
      return (
        <View
          style={{
            width: 200,
            height: 155,
            borderRadius: 18,
            overflow: 'hidden',
            shadowColor: tc.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.22,
            shadowRadius: 10,
            elevation: 6,
            backgroundColor: '#F7F3EE',
          }}
        >
          {/* Mini app header */}
          <View style={{ backgroundColor: tc.primary, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.35)' }} />
              <View>
                <View style={{ width: 60, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.9)', marginBottom: 2 }} />
                <View style={{ width: 40, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.55)' }} />
              </View>
            </View>
          </View>

          {/* Mini verse card */}
          <View style={{ backgroundColor: '#F7F3EE', flex: 1, padding: 10, gap: 6 }}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 10, padding: 8, gap: 4 }}>
              {/* Verse text lines */}
              <View style={{ width: '80%', height: 4, borderRadius: 2, backgroundColor: tc.primary + 'CC' }} />
              <View style={{ width: '65%', height: 4, borderRadius: 2, backgroundColor: tc.primary + '88' }} />
              <View style={{ width: '50%', height: 3, borderRadius: 2, backgroundColor: tc.secondary + 'AA', marginTop: 2 }} />
              {/* Divider */}
              <View style={{ height: 1, backgroundColor: tc.primary + '22', marginVertical: 2 }} />
              {/* Reference pill */}
              <View style={{ alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: tc.accent + '25' }}>
                <View style={{ width: 30, height: 3, borderRadius: 1, backgroundColor: tc.accent }} />
              </View>
            </View>

            {/* Action button row */}
            <View style={{ flexDirection: 'row', gap: 5 }}>
              <View style={{ flex: 1, height: 18, borderRadius: 9, backgroundColor: tc.primary, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 30, height: 3, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.9)' }} />
              </View>
              <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: tc.secondary + '40', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tc.secondary }} />
              </View>
            </View>
          </View>
        </View>
      );
    }

    if (item.type === 'title') {
      return (
        <View
          style={{
            paddingHorizontal: 24,
            paddingVertical: 16,
            borderRadius: 16,
            backgroundColor: rarityColor + '15',
            borderWidth: 2,
            borderColor: rarityColor + '30',
          }}
        >
          <Award size={48} color={rarityColor} />
        </View>
      );
    }

    return null;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/60 items-center justify-center px-6"
        onPress={onClose}
      >
        <Pressable onPress={() => {}}>
          <Animated.View
            entering={FadeIn.duration(200)}
            className="w-full rounded-3xl overflow-hidden"
            style={{
              backgroundColor: colors.surface,
              maxWidth: 340,
              shadowColor: rarityColor,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 24,
            }}
          >
            {/* Close button */}
            <Pressable
              onPress={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full items-center justify-center z-10"
              style={{ backgroundColor: colors.textMuted + '20' }}
            >
              <X size={18} color={colors.textMuted} />
            </Pressable>

            {/* Header gradient */}
            <LinearGradient
              colors={RARITY_GRADIENTS[item.rarity as keyof typeof RARITY_GRADIENTS] || RARITY_GRADIENTS.common}
              style={{ paddingTop: 40, paddingBottom: 24, alignItems: 'center' }}
            >
              {renderPreview()}
            </LinearGradient>

            {/* Content */}
            <View className="p-6">
              {/* Rarity badge */}
              <View className="items-center mb-3">
                <RarityBadge rarity={item.rarity} language={language} />
              </View>

              {/* Name */}
              <Text
                className="text-xl font-bold text-center mb-2"
                style={{ color: colors.text }}
              >
                {displayName}
              </Text>

              {/* Description */}
              <Text
                className="text-sm text-center mb-4"
                style={{ color: colors.textMuted }}
              >
                {displayDesc}
              </Text>

              {/* Spiritual meaning — only for L2 avatars */}
              {item.meaning && item.type === 'avatar' && (
                <View
                  style={{
                    backgroundColor: rarityColor + '10',
                    borderLeftWidth: 3,
                    borderLeftColor: rarityColor,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: rarityColor, marginBottom: 3, letterSpacing: 0.5 }}>
                    {language === 'es' ? 'SIGNIFICADO' : 'MEANING'}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.text, lineHeight: 18, fontStyle: 'italic' }}>
                    {language === 'es' ? item.meaning : (item.meaningEn ?? item.meaning)}
                  </Text>
                </View>
              )}

              {/* Unlock type badge */}
              {item.unlockType && !item.chestOnly && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: colors.textMuted + '12',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 13 }}>
                    {item.unlockType === 'streak' ? '🔥' : item.unlockType === 'devotionals' ? '📖' : item.unlockType === 'share' ? '💌' : '🏪'}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>
                    {language === 'es'
                      ? item.unlockType === 'streak'
                        ? `Racha de ${item.unlockValue} días`
                        : item.unlockType === 'devotionals'
                        ? `Completa ${item.unlockValue} devocionales`
                        : item.unlockType === 'share'
                        ? `Comparte ${item.unlockValue} veces`
                        : 'Disponible en tienda'
                      : item.unlockType === 'streak'
                        ? `${item.unlockValue}-day streak`
                        : item.unlockType === 'devotionals'
                        ? `Complete ${item.unlockValue} devotionals`
                        : item.unlockType === 'share'
                        ? `Share ${item.unlockValue} times`
                        : 'Available in store'}
                  </Text>
                </View>
              )}

              {/* Access type label: Free / Premium / Reward-only */}
              {item.type === 'avatar' && (
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 14 }}>
                  <View style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 99,
                    backgroundColor: item.chestOnly
                      ? '#F59E0B20'
                      : item.price === 0
                      ? '#22C55E20'
                      : rarityColor + '18',
                    borderWidth: 1,
                    borderColor: item.chestOnly
                      ? '#F59E0B50'
                      : item.price === 0
                      ? '#22C55E50'
                      : rarityColor + '40',
                  }}>
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '700',
                      letterSpacing: 0.5,
                      color: item.chestOnly ? '#F59E0B' : item.price === 0 ? '#22C55E' : rarityColor,
                    }}>
                      {item.chestOnly
                        ? (language === 'es' ? 'SOLO COFRE' : 'CHEST ONLY')
                        : item.price === 0
                        ? (language === 'es' ? 'GRATIS' : 'FREE')
                        : (language === 'es' ? 'PREMIUM' : 'PREMIUM')}
                    </Text>
                  </View>
                </View>
              )}

              {/* Action button */}
              {isEquipped ? (
                <View
                  className="py-4 rounded-xl flex-row items-center justify-center"
                  style={{ backgroundColor: '#22C55E20' }}
                >
                  <Check size={20} color="#22C55E" strokeWidth={3} />
                  <Text className="text-base font-semibold text-green-600 ml-2">
                    {t.equipped}
                  </Text>
                </View>
              ) : isOwned ? (
                <Pressable
                  onPress={onEquip}
                  className="py-4 rounded-xl items-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-base font-semibold text-white">
                    {t.equip}
                  </Text>
                </Pressable>
              ) : item.chestOnly ? (
                <View
                  className="py-4 rounded-xl flex-row items-center justify-center"
                  style={{ backgroundColor: '#F59E0B20' }}
                >
                  <Gift size={18} color="#F59E0B" />
                  <Text
                    className="text-base font-semibold ml-2"
                    style={{ color: '#F59E0B' }}
                  >
                    {language === 'es' ? 'Solo disponible en Cofres' : 'Only from Chests'}
                  </Text>
                </View>
              ) : item.price === 0 ? (
                <Pressable
                  onPress={onPurchase}
                  disabled={isPurchasing}
                  className="py-4 rounded-xl items-center"
                  style={{ backgroundColor: '#22C55E' }}
                >
                  {isPurchasing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-base font-semibold text-white">
                      {language === 'es' ? 'Reclamar Gratis' : 'Claim Free'}
                    </Text>
                  )}
                </Pressable>
              ) : canAfford ? (
                <Pressable
                  onPress={onPurchase}
                  disabled={isPurchasing}
                  className="py-4 rounded-xl flex-row items-center justify-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  {isPurchasing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Coins size={18} color="#FFFFFF" />
                      <Text className="text-base font-semibold text-white ml-2">
                        {item.price} {language === 'es' ? 'puntos' : 'points'}
                      </Text>
                    </>
                  )}
                </Pressable>
              ) : (
                <View
                  className="py-4 rounded-xl flex-row items-center justify-center"
                  style={{ backgroundColor: colors.textMuted + '20' }}
                >
                  <Lock size={18} color={colors.textMuted} />
                  <Text
                    className="text-base font-semibold ml-2"
                    style={{ color: colors.textMuted }}
                  >
                    {item.price} {language === 'es' ? 'puntos' : 'points'}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Premium Theme Card with V2 enhanced preview
function PremiumThemeCard({
  themeData,
  isOwned,
  isEquipped,
  canAfford,
  colors,
  language,
  onPress,
  isHighlighted = false,
  viewRef,
}: {
  themeData: typeof PURCHASABLE_THEMES[string];
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
  isHighlighted?: boolean;
  viewRef?: (ref: View | null) => void;
})
 {
  const t = TRANSLATIONS[language];
  const scale = useSharedValue(1);
  const highlightOpacity = useSharedValue(0);
  const rarityColor = RARITY_COLORS[themeData.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const isV2Theme = themeData.id.includes('_v2_') || themeData.id.includes('amanecer_dorado') || themeData.id.includes('noche_profunda') || themeData.id.includes('bosque_sereno') || themeData.id.includes('desierto_suave') || themeData.id.includes('promesa_violeta') || themeData.id.includes('cielo_gloria') || themeData.id.includes('mar_misericordia') || themeData.id.includes('fuego_espiritu') || themeData.id.includes('jardin_gracia') || themeData.id.includes('olivo_paz') || themeData.id.includes('trono_azul') || themeData.id.includes('lampara_encendida') || themeData.id.includes('pergamino_antiguo') || themeData.id.includes('luz_celestial');

  // Pulse the highlight border when isHighlighted changes
  useEffect(() => {
    if (isHighlighted) {
      highlightOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.4, { duration: 400 }),
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 400 }),
      );
      scale.value = withSequence(withSpring(1.04), withSpring(1));
    }
  }, [isHighlighted]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: highlightOpacity.value,
  }));

  return (
    <Animated.View ref={viewRef as any} style={[animatedStyle, { width: '48%', marginBottom: 14 }]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          backgroundColor: colors.surface,
          shadowColor: isEquipped ? colors.primary : rarityColor,
          shadowOffset: { width: 0, height: isEquipped ? 6 : 3 },
          shadowOpacity: isEquipped ? 0.3 : (themeData.rarity !== 'common' ? 0.15 : 0.08),
          shadowRadius: isEquipped ? 12 : 8,
          elevation: isEquipped ? 5 : 3,
          borderWidth: isEquipped ? 2 : 0,
          borderColor: colors.primary,
          opacity: !canAfford && !isOwned ? 0.7 : 1,
        }}
      >
        {/* Highlight glow overlay — appears when navigated from chapter requirement */}
        <Animated.View
          pointerEvents="none"
          style={[highlightStyle, {
            position: 'absolute', inset: 0, zIndex: 20,
            borderRadius: 20, borderWidth: 2.5,
            borderColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
          }]}
        />
        {/* Enhanced Color Preview with 5 swatches + sample text for V2 */}
        <View style={{ height: isV2Theme ? 90 : 72, backgroundColor: themeData.colors.background }}>
          {/* Color swatches row */}
          <View style={{ flexDirection: 'row', height: isV2Theme ? 50 : 72 }}>
            <View style={{ flex: 1, backgroundColor: themeData.colors.primary }} />
            <View style={{ flex: 1, backgroundColor: themeData.colors.secondary }} />
            <View style={{ flex: 1, backgroundColor: themeData.colors.accent }} />
            {isV2Theme && (
              <>
                <View style={{ flex: 1, backgroundColor: themeData.colors.surface }} />
                <View style={{ flex: 1, backgroundColor: themeData.colors.text }} />
              </>
            )}
          </View>
          {/* Mini-card mock preview for V2 themes */}
          {isV2Theme && (
            <View style={{
              paddingHorizontal: 8,
              paddingVertical: 6,
              backgroundColor: themeData.colors.background,
            }}>
              {/* Row 1: Bold "Aa" heading text */}
              <Text style={{
                fontSize: 15,
                fontWeight: '800',
                color: themeData.colors.text,
                marginBottom: 4,
              }}>Aa</Text>
              {/* Row 2: Thin horizontal rule colored with textMuted */}
              <View style={{
                height: 1,
                backgroundColor: themeData.colors.text + '25',
                marginBottom: 5,
              }} />
              {/* Row 3: Small rounded pill using primary color */}
              <View style={{
                alignSelf: 'flex-start',
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: 99,
                backgroundColor: themeData.colors.primary,
              }}>
                <Text style={{ fontSize: 8, fontWeight: '700', color: '#FFFFFF' }}>V2</Text>
              </View>
            </View>
          )}
        </View>

        {/* Rarity glow overlay */}
        {themeData.rarity !== 'common' && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: isV2Theme ? 90 : 72,
              borderBottomWidth: 2,
              borderBottomColor: rarityColor + '50',
            }}
          />
        )}

        {/* Lock Overlay */}
        {!canAfford && !isOwned && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: isV2Theme ? 90 : 72,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.35)',
          }}>
            {themeData.chestOnly ? <Gift size={22} color="#F59E0B" /> : <Lock size={24} color="#FFFFFF" />}
          </View>
        )}

        {/* Rarity badge — top-right corner overlay, outside text block */}
        <View style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
          <View style={{
            backgroundColor: 'rgba(0,0,0,0.55)',
            borderRadius: 99,
            padding: 4,
          }}>
            <RarityIcon rarity={themeData.rarity} size={13} />
          </View>
        </View>

        <View style={{ padding: 12 }}>
          {/* Name: up to 2 lines, fixed minHeight so all cards align in the grid */}
          <View style={{ minHeight: 40, justifyContent: 'flex-start', marginBottom: 6 }}>
            <Text
              style={{ fontSize: 13, fontWeight: '700', color: colors.text, lineHeight: 19 }}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {language === 'es' ? themeData.nameEs : themeData.name}
            </Text>
          </View>

          {/* Price or Status */}
          {isEquipped ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Check size={13} color="#22C55E" strokeWidth={3} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#22C55E', marginLeft: 4 }}>
                {t.equipped}
              </Text>
            </View>
          ) : isOwned ? (
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>
              {t.equip}
            </Text>
          ) : themeData.chestOnly ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Gift size={11} color="#F59E0B" />
              <Text style={{ fontSize: 10, fontWeight: '700', marginLeft: 3, color: '#F59E0B' }}>
                {language === 'es' ? 'Solo Cofre' : 'Chest Only'}
              </Text>
            </View>
          ) : themeData.price === 0 ? (
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#22C55E' }}>
              {language === 'es' ? 'Gratis' : 'Free'}
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Coins size={13} color={canAfford ? colors.primary : colors.textMuted} />
              <Text
                style={{ fontSize: 12, fontWeight: '700', marginLeft: 4, color: canAfford ? colors.primary : colors.textMuted }}
              >
                {themeData.price}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Premium Frame Card
function PremiumFrameCard({
  frameData,
  isOwned,
  isEquipped,
  canAfford,
  colors,
  language,
  onPress,
  isHighlighted = false,
  viewRef,
}: {
  frameData: typeof AVATAR_FRAMES[string];
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
  isHighlighted?: boolean;
  viewRef?: (ref: View | null) => void;
}) {
  const t = TRANSLATIONS[language];
  const scale = useSharedValue(1);
  const highlightOpacity = useSharedValue(0);
  const rarityColor = RARITY_COLORS[frameData.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const gradientColors = RARITY_GRADIENTS[frameData.rarity as keyof typeof RARITY_GRADIENTS] || RARITY_GRADIENTS.common;
  const isV2Frame = 'isV2' in frameData && (frameData as any).isV2 === true;

  useEffect(() => {
    if (isHighlighted) {
      highlightOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.4, { duration: 400 }),
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 400 }),
      );
      scale.value = withSequence(withSpring(1.06), withSpring(1));
    }
  }, [isHighlighted]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: highlightOpacity.value,
  }));

  const circleSize = isV2Frame ? 84 : 72;
  const circleRadius = circleSize / 2;

  return (
    <Animated.View ref={viewRef as any} style={animatedStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.94); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: colors.surface,
          shadowColor: isEquipped ? colors.primary : frameData.color,
          shadowOffset: { width: 0, height: isEquipped ? 6 : 4 },
          shadowOpacity: isEquipped ? 0.35 : (isV2Frame ? 0.28 : 0.2),
          shadowRadius: isV2Frame ? 14 : 10,
          elevation: isEquipped ? 5 : (isV2Frame ? 4 : 3),
          borderWidth: isEquipped ? 2 : (isV2Frame ? 1 : 0),
          borderColor: isEquipped ? colors.primary : (isV2Frame ? frameData.color + '50' : 'transparent'),
          opacity: !canAfford && !isOwned ? 0.7 : 1,
        }}
      >
        {/* Highlight overlay */}
        <Animated.View
          pointerEvents="none"
          style={[highlightStyle, {
            position: 'absolute', inset: 0, zIndex: 20,
            borderRadius: 16, borderWidth: 2.5,
            borderColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
          }]}
        />
        <LinearGradient
          colors={gradientColors}
          style={{ padding: 14, alignItems: 'center' }}
        >
          {/* V2 Badge */}
          {isV2Frame && (
            <View style={{
              position: 'absolute',
              top: 8,
              right: 8,
              paddingHorizontal: 5,
              paddingVertical: 2,
              borderRadius: 5,
              backgroundColor: frameData.color + '30',
              borderWidth: 1,
              borderColor: frameData.color + '60',
            }}>
              <Text style={{ fontSize: 8, fontWeight: '800', color: frameData.color, letterSpacing: 0.5 }}>V2</Text>
            </View>
          )}

          {/* Frame Preview Circle */}
          <View style={{ position: 'relative', marginBottom: 10 }}>
            {/* Radial glow for V2 */}
            {isV2Frame && (
              <View
                style={{
                  position: 'absolute',
                  top: -8,
                  left: -8,
                  right: -8,
                  bottom: -8,
                  borderRadius: circleRadius + 8,
                  backgroundColor: frameData.color + '18',
                }}
              />
            )}
            <View
              style={{
                width: circleSize,
                height: circleSize,
                borderRadius: circleRadius,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.background,
                borderWidth: isV2Frame ? 6 : 5,
                borderColor: frameData.color,
                shadowColor: frameData.color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: isV2Frame ? 0.6 : 0.4,
                shadowRadius: isV2Frame ? 12 : 8,
              }}
            >
              <Text style={{ fontSize: isV2Frame ? 32 : 28 }}>🕊️</Text>
            </View>

            {/* Lock Overlay */}
            {!canAfford && !isOwned && (
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.35)',
                borderRadius: circleRadius,
              }}>
                {frameData.chestOnly ? <Gift size={18} color="#F59E0B" /> : <Lock size={20} color="#FFFFFF" />}
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: isV2Frame ? 2 : 4 }}>
            <Text
              style={{ fontSize: 12, fontWeight: '700', color: colors.text, maxWidth: isV2Frame ? 80 : 70 }}
              numberOfLines={1}
            >
              {language === 'es' ? frameData.nameEs : frameData.name}
            </Text>
            <View style={{ marginLeft: 4 }}>
              <RarityIcon rarity={frameData.rarity} size={12} />
            </View>
          </View>

          {/* V2 subtitle description */}
          {isV2Frame && (
            <Text
              style={{ fontSize: 9, color: colors.textMuted, textAlign: 'center', marginBottom: 4, maxWidth: 80 }}
              numberOfLines={1}
            >
              {language === 'es'
                ? (frameData.descriptionEs || frameData.description || '').slice(0, 22)
                : (frameData.description || '').slice(0, 22)}
            </Text>
          )}

          {/* Price or Status */}
          {isEquipped ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Check size={11} color="#22C55E" strokeWidth={3} />
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#22C55E', marginLeft: 2 }}>
                {t.equipped}
              </Text>
            </View>
          ) : isOwned ? (
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.primary }}>
              {t.equip}
            </Text>
          ) : frameData.chestOnly ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Gift size={10} color="#F59E0B" />
              <Text style={{ fontSize: 9, fontWeight: '700', marginLeft: 2, color: '#F59E0B' }}>
                {language === 'es' ? 'Solo Cofre' : 'Chest Only'}
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Coins size={11} color={canAfford ? colors.primary : colors.textMuted} />
              <Text
                style={{ fontSize: 11, fontWeight: '700', marginLeft: 3, color: canAfford ? colors.primary : colors.textMuted }}
              >
                {frameData.price}
              </Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// Premium Title Card
function PremiumTitleCard({
  titleData,
  isOwned,
  isEquipped,
  canAfford,
  colors,
  language,
  onPress,
  isHighlighted = false,
  viewRef,
}: {
  titleData: typeof SPIRITUAL_TITLES[string];
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
  isHighlighted?: boolean;
  viewRef?: (ref: View | null) => void;
}) {
  const t = TRANSLATIONS[language];
  const scale = useSharedValue(1);
  const highlightOpacity = useSharedValue(0);
  const rarityColor = RARITY_COLORS[titleData.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;

  useEffect(() => {
    if (isHighlighted) {
      highlightOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.4, { duration: 400 }),
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 400 }),
      );
      scale.value = withSequence(withSpring(1.03), withSpring(1));
    }
  }, [isHighlighted]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: highlightOpacity.value,
  }));

  return (
    <Animated.View ref={viewRef as any} style={animatedStyle} className="mb-3">
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: colors.surface,
          shadowColor: isEquipped ? colors.primary : rarityColor,
          shadowOffset: { width: 0, height: isEquipped ? 6 : 3 },
          shadowOpacity: isEquipped ? 0.25 : 0.12,
          shadowRadius: isEquipped ? 10 : 6,
          elevation: isEquipped ? 4 : 2,
          borderWidth: isEquipped ? 2 : 0,
          borderColor: colors.primary,
          opacity: !canAfford && !isOwned ? 0.7 : 1,
        }}
      >
        {/* Highlight overlay */}
        <Animated.View
          pointerEvents="none"
          style={[highlightStyle, {
            position: 'absolute', inset: 0, zIndex: 20,
            borderRadius: 16, borderWidth: 2.5,
            borderColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
          }]}
        />
        <LinearGradient
          colors={RARITY_GRADIENTS[titleData.rarity as keyof typeof RARITY_GRADIENTS] || RARITY_GRADIENTS.common}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}
        >
          {/* Icon */}
          <View
            className="w-12 h-12 rounded-xl items-center justify-center mr-4"
            style={{ backgroundColor: rarityColor + '25' }}
          >
            {!canAfford && !isOwned ? (
              titleData.chestOnly ? <Gift size={22} color="#F59E0B" /> : <Lock size={22} color={colors.textMuted} />
            ) : (
              <Award size={22} color={rarityColor} />
            )}
          </View>

          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text
                className="text-sm font-bold"
                style={{ color: colors.text }}
              >
                {language === 'es' ? titleData.nameEs : titleData.name}
              </Text>
              <View className="ml-2">
                <RarityBadge rarity={titleData.rarity} language={language} />
              </View>
            </View>
            <Text
              className="text-xs"
              style={{ color: colors.textMuted }}
              numberOfLines={1}
            >
              {language === 'es' ? titleData.descriptionEs : titleData.description}
            </Text>
          </View>

          {/* Price or Status */}
          {isEquipped ? (
            <View className="flex-row items-center px-3 py-2 rounded-xl" style={{ backgroundColor: '#22C55E20' }}>
              <Check size={14} color="#22C55E" strokeWidth={3} />
              <Text className="text-xs font-semibold text-green-600 ml-1">
                {t.equipped}
              </Text>
            </View>
          ) : isOwned ? (
            <View
              className="px-4 py-2 rounded-xl"
              style={{ backgroundColor: colors.primary + '15' }}
            >
              <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                {t.equip}
              </Text>
            </View>
          ) : titleData.chestOnly ? (
            <View className="flex-row items-center px-3 py-2 rounded-xl" style={{ backgroundColor: '#F59E0B20' }}>
              <Gift size={13} color="#F59E0B" />
              <Text className="text-xs font-bold ml-1" style={{ color: '#F59E0B' }}>
                {language === 'es' ? 'Solo Cofre' : 'Chest Only'}
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center px-3 py-2 rounded-xl" style={{ backgroundColor: colors.primary + '15' }}>
              <Coins size={14} color={canAfford ? colors.primary : colors.textMuted} />
              <Text
                className="text-xs font-bold ml-1"
                style={{ color: canAfford ? colors.primary : colors.textMuted }}
              >
                {titleData.price}
              </Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// Premium Avatar Card with V2 enhanced styling
function PremiumAvatarCard({
  avatar,
  isOwned,
  isEquipped,
  canAfford,
  colors,
  language,
  onPress,
  isHighlighted = false,
  viewRef,
}: {
  avatar: typeof DEFAULT_AVATARS[number];
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
  isHighlighted?: boolean;
  viewRef?: (ref: View | null) => void;
}) {
  const scale = useSharedValue(1);
  const highlightOpacity = useSharedValue(0);
  const hasCost = 'price' in avatar && (avatar as { price: number }).price > 0;
  const price = hasCost ? (avatar as { price: number }).price : 0;
  const rarity = avatar.rarity || 'common';
  const rarityColor = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const isV2Avatar = 'isV2' in avatar && (avatar as { isV2?: boolean }).isV2 === true;

  useEffect(() => {
    if (isHighlighted) {
      highlightOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.4, { duration: 400 }),
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 400 }),
      );
      scale.value = withSequence(withSpring(1.06), withSpring(1));
    }
  }, [isHighlighted]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: highlightOpacity.value,
  }));

  return (
    <Animated.View ref={viewRef as any} style={animatedStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.92); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: colors.surface,
          shadowColor: isEquipped ? colors.primary : rarityColor,
          shadowOffset: { width: 0, height: isEquipped ? 6 : 3 },
          shadowOpacity: isEquipped ? 0.35 : (isV2Avatar ? 0.25 : 0.15),
          shadowRadius: isV2Avatar ? 10 : 8,
          elevation: isEquipped ? 5 : (isV2Avatar ? 4 : 3),
          borderWidth: isEquipped ? 2 : (isV2Avatar ? 1 : 0),
          borderColor: isEquipped ? colors.primary : (isV2Avatar ? rarityColor + '40' : 'transparent'),
          opacity: !canAfford && !isOwned && (hasCost || (avatar as { chestOnly?: boolean }).chestOnly) ? 0.7 : 1,
        }}
      >
        {/* Highlight overlay */}
        <Animated.View
          pointerEvents="none"
          style={[highlightStyle, {
            position: 'absolute', inset: 0, zIndex: 20,
            borderRadius: 16, borderWidth: 2.5,
            borderColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
          }]}
        />
        <LinearGradient
          colors={isV2Avatar
            ? [rarityColor + '15', rarityColor + '08']
            : (RARITY_GRADIENTS[rarity as keyof typeof RARITY_GRADIENTS] || RARITY_GRADIENTS.common)
          }
          style={{ padding: 12, alignItems: 'center' }}
        >
          {/* V2 Badge */}
          {isV2Avatar && (
            <View style={{
              position: 'absolute',
              top: 6,
              right: 6,
              paddingHorizontal: 5,
              paddingVertical: 2,
              borderRadius: 4,
              backgroundColor: rarityColor + '20',
            }}>
              <Text style={{ fontSize: 8, fontWeight: '700', color: rarityColor }}>V2</Text>
            </View>
          )}

          {/* Avatar Emoji */}
          <View style={{ position: 'relative', marginBottom: 8 }}>
            {/* Static glow ring for V2 avatars */}
            {isV2Avatar && (
              <View
                style={{
                  position: 'absolute',
                  top: -5,
                  left: -5,
                  width: 76 + 10,
                  height: 76 + 10,
                  borderRadius: (76 + 10) / 2,
                  borderWidth: 1,
                  borderColor: rarityColor + '70',
                }}
              />
            )}
            <View
              style={{
                width: isV2Avatar ? 76 : 64,
                height: isV2Avatar ? 76 : 64,
                borderRadius: isV2Avatar ? 38 : 32,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isV2Avatar ? colors.surface : colors.primary + '15',
                borderWidth: isV2Avatar ? 3 : (rarity !== 'common' ? 2 : 0),
                borderColor: isV2Avatar ? rarityColor + '60' : rarityColor + '40',
                shadowColor: isV2Avatar ? rarityColor : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: isV2Avatar ? 0.4 : 0,
                shadowRadius: isV2Avatar ? 8 : 0,
              }}
            >
              {isV2Avatar ? (
                <IllustratedAvatar avatarId={avatar.id} size={60} emoji={avatar.emoji} />
              ) : (
                <Text style={{ fontSize: 32 }}>{avatar.emoji}</Text>
              )}
            </View>

            {/* Rarity indicator */}
            {rarity !== 'common' && (
              <View
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: rarityColor,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                }}
              >
                <RarityIcon rarity={rarity} size={10} />
              </View>
            )}

            {/* Lock Overlay with blur effect for V2 */}
            {!isOwned && (hasCost || (avatar as { chestOnly?: boolean }).chestOnly) && !canAfford && (
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isV2Avatar ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.35)',
                borderRadius: isV2Avatar ? 38 : 32,
              }}>
                {(avatar as { chestOnly?: boolean }).chestOnly
                  ? <Gift size={16} color="#F59E0B" />
                  : <Lock size={18} color="#FFFFFF" />
                }
              </View>
            )}
          </View>

          <Text
            style={{ fontSize: 11, fontWeight: isV2Avatar ? '700' : '600', color: colors.text, textAlign: 'center', marginBottom: 4 }}
            numberOfLines={1}
          >
            {language === 'es' && avatar.nameEs ? avatar.nameEs : avatar.name}
          </Text>

          {/* Price or Status */}
          {isEquipped ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Check size={10} color="#22C55E" strokeWidth={3} />
            </View>
          ) : isOwned && !isEquipped && hasCost ? (
            <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '600' }}>
              {language === 'es' ? 'Equipar' : 'Equip'}
            </Text>
          ) : (avatar as { chestOnly?: boolean }).chestOnly ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Gift size={10} color="#F59E0B" />
              <Text style={{ fontSize: 9, fontWeight: '700', marginLeft: 2, color: '#F59E0B' }}>
                {language === 'es' ? 'Solo Cofre' : 'Chest Only'}
              </Text>
            </View>
          ) : !hasCost || isOwned ? (
            <Text style={{ fontSize: 10, color: '#22C55E', fontWeight: '600' }}>
              {language === 'es' ? 'Gratis' : 'Free'}
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Coins size={10} color={canAfford ? colors.primary : colors.textMuted} />
              <Text
                style={{ fontSize: 10, fontWeight: '700', marginLeft: 3, color: canAfford ? colors.primary : colors.textMuted }}
              >
                {price}
              </Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// Bundle Card with V2 support
function BundleCard({
  bundle,
  purchasedItems,
  points,
  colors,
  language,
  onPress,
  isPurchasing = false,
}: {
  bundle: typeof STORE_BUNDLES[string];
  purchasedItems: string[];
  points: number;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
  isPurchasing?: boolean;
}) {
  const scale = useSharedValue(1);
  const rarityColor = RARITY_COLORS[bundle.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const canAfford = points >= bundle.bundlePrice;
  const savings = bundle.originalPrice - bundle.bundlePrice;
  const isV2Bundle = 'isV2' in bundle && bundle.isV2 === true;

  // Check if all items in bundle are already owned
  const allOwned = bundle.items.every(itemId => purchasedItems.includes(itemId));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Get item previews
  const getItemPreview = (itemId: string) => {
    if (itemId.startsWith('theme_')) {
      const theme = PURCHASABLE_THEMES[itemId];
      if (theme) return { type: 'theme', colors: theme.colors };
    }
    if (itemId.startsWith('frame_')) {
      const frame = AVATAR_FRAMES[itemId];
      if (frame) return { type: 'frame', color: frame.color };
    }
    if (itemId.startsWith('title_')) {
      return { type: 'title' };
    }
    if (itemId.startsWith('avatar_')) {
      const avatar = DEFAULT_AVATARS.find(a => a.id === itemId);
      if (avatar) return { type: 'avatar', emoji: avatar.emoji };
    }
    return null;
  };

  return (
    <Animated.View style={animatedStyle} className="mb-4">
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        disabled={allOwned || isPurchasing || !canAfford}
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: colors.surface,
          shadowColor: rarityColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 4,
          opacity: allOwned ? 0.6 : 1,
        }}
      >
        <LinearGradient
          colors={RARITY_GRADIENTS[bundle.rarity as keyof typeof RARITY_GRADIENTS] || RARITY_GRADIENTS.common}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 16 }}
        >
          {/* Header */}
          <View className="flex-row items-center mb-4">
            <View
              className="w-12 h-12 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: rarityColor + '25' }}
            >
              <ShoppingBag size={24} color={rarityColor} />
            </View>
            <View className="flex-1">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  className="text-base font-bold"
                  style={{ color: colors.text }}
                >
                  {language === 'es' ? bundle.nameEs : bundle.name}
                </Text>
                {isV2Bundle && (
                  <View style={{
                    paddingHorizontal: 5,
                    paddingVertical: 2,
                    borderRadius: 4,
                    backgroundColor: rarityColor + '20',
                  }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: rarityColor }}>V2</Text>
                  </View>
                )}
              </View>
              <Text
                className="text-xs"
                style={{ color: colors.textMuted }}
              >
                {language === 'es' ? bundle.descriptionEs : bundle.description}
              </Text>
            </View>
            <RarityBadge rarity={bundle.rarity} language={language} />
          </View>

          {/* Item Previews */}
          <View className="flex-row mb-4" style={{ gap: 8 }}>
            {bundle.items.map((itemId, index) => {
              const preview = getItemPreview(itemId);
              const isItemOwned = purchasedItems.includes(itemId);

              return (
                <View
                  key={itemId}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: colors.background,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: isItemOwned ? '#22C55E' : colors.textMuted + '30',
                    opacity: isItemOwned ? 0.5 : 1,
                  }}
                >
                  {isItemOwned && (
                    <View style={{ position: 'absolute', top: -4, right: -4, zIndex: 1 }}>
                      <Check size={12} color="#22C55E" strokeWidth={3} />
                    </View>
                  )}
                  {preview?.type === 'theme' && preview.colors && (
                    <View style={{ flexDirection: 'row', width: 32, height: 32, borderRadius: 6, overflow: 'hidden' }}>
                      <View style={{ flex: 1, backgroundColor: preview.colors.primary }} />
                      <View style={{ flex: 1, backgroundColor: preview.colors.secondary }} />
                    </View>
                  )}
                  {preview?.type === 'frame' && preview.color && (
                    <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 3, borderColor: preview.color }} />
                  )}
                  {preview?.type === 'title' && <Award size={20} color={colors.textMuted} />}
                  {preview?.type === 'avatar' && preview.emoji && (
                    <Text style={{ fontSize: 22 }}>{preview.emoji}</Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* Pricing */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text
                className="text-sm line-through mr-2"
                style={{ color: colors.textMuted }}
              >
                {bundle.originalPrice}
              </Text>
              <View className="flex-row items-center">
                <Coins size={16} color={colors.primary} />
                <Text
                  className="text-lg font-bold ml-1"
                  style={{ color: colors.primary }}
                >
                  {bundle.bundlePrice}
                </Text>
              </View>
              <View
                className="ml-3 px-2 py-1 rounded-md"
                style={{ backgroundColor: '#22C55E20' }}
              >
                <Text className="text-xs font-bold text-green-600">
                  {language === 'es' ? `Ahorra ${savings}` : `Save ${savings}`}
                </Text>
              </View>
            </View>

            {allOwned ? (
              <View className="flex-row items-center px-3 py-2 rounded-xl" style={{ backgroundColor: '#22C55E20' }}>
                <Check size={14} color="#22C55E" strokeWidth={3} />
                <Text className="text-xs font-semibold text-green-600 ml-1">
                  {language === 'es' ? 'Completado' : 'Owned'}
                </Text>
              </View>
            ) : canAfford ? (
              <View
                className="px-4 py-2 rounded-xl"
                style={{ backgroundColor: isPurchasing ? colors.primary + '80' : colors.primary }}
              >
                {isPurchasing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-sm font-semibold text-white">
                    {language === 'es' ? 'Comprar' : 'Buy'}
                  </Text>
                )}
              </View>
            ) : (
              <View
                className="flex-row items-center px-4 py-2 rounded-xl"
                style={{ backgroundColor: colors.textMuted + '20' }}
              >
                <Lock size={14} color={colors.textMuted} />
              </View>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ─── Chapter Collection Progress Hook ────────────────────────────────────────
const CHAPTER_PROGRESS_KEY = 'chapter_collection_progress_v1';

// Sync strategy:
//  1. On mount: load AsyncStorage (instant), then fetch backend.
//  2. Merge = union of both (never lose claims).
//  3. On claim: update memory + AsyncStorage immediately, then push to backend async.
function useChapterCollectionProgress(userId?: string): {
  claimedChapterIds: Set<string>;
  claimChapter: (chapterId: string, collectionId: string) => Promise<void>;
  isLoaded: boolean;
} {
  const [claimedChapterIds, setClaimedChapterIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from AsyncStorage + backend on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      // 1. Local cache first
      let localIds: string[] = [];
      try {
        const raw = await AsyncStorage.getItem(CHAPTER_PROGRESS_KEY);
        if (raw) localIds = JSON.parse(raw);
      } catch { /* ignore */ }

      if (!cancelled) {
        setClaimedChapterIds(new Set(localIds));
        setIsLoaded(true);
      }

      // 2. Backend merge (if logged in)
      if (!userId) return;
      try {
        const { progress } = await gamificationApi.getChapterProgress(userId);
        const backendIds: string[] = [];
        for (const row of progress) {
          backendIds.push(...row.claimedChapterIds);
        }
        if (backendIds.length === 0) return;

        // Merge: union of local + backend
        const merged = Array.from(new Set([...localIds, ...backendIds]));
        if (!cancelled && merged.length > localIds.length) {
          setClaimedChapterIds(new Set(merged));
          await AsyncStorage.setItem(CHAPTER_PROGRESS_KEY, JSON.stringify(merged));
          console.debug('[ChapterProgress] Merged from backend:', merged.length, 'chapters');
        }
      } catch (e) {
        console.debug('[ChapterProgress] Backend load failed (offline?):', e);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userId]);

  const claimChapter = useCallback(async (chapterId: string, collectionId: string) => {
    // 1. Optimistic update in memory
    let merged: string[] = [];
    setClaimedChapterIds(prev => {
      const next = new Set(prev);
      next.add(chapterId);
      merged = [...next];
      return next;
    });

    // 2. Persist locally
    try {
      const raw = await AsyncStorage.getItem(CHAPTER_PROGRESS_KEY);
      const existing: string[] = raw ? JSON.parse(raw) : [];
      const updated = Array.from(new Set([...existing, chapterId]));
      await AsyncStorage.setItem(CHAPTER_PROGRESS_KEY, JSON.stringify(updated));
      merged = updated;
    } catch (e) {
      console.debug('[ChapterProgress] AsyncStorage save failed:', e);
    }

    // 3. Push to backend async (non-blocking)
    if (userId) {
      gamificationApi.saveChapterProgress({ userId, collectionId, claimedChapterIds: merged })
        .then(() => console.debug('[ChapterProgress] Backend sync ok for', collectionId))
        .catch(e => console.debug('[ChapterProgress] Backend sync failed:', e));
    }
  }, [userId]);

  return { claimedChapterIds, claimChapter, isLoaded };
}

// ─── ChapterCollectionModal ───────────────────────────────────────────────────
// Simple, reliable claim button — no Reanimated wrapper to avoid touch-target issues
// inside the Reanimated sheet. Uses TouchableOpacity which reliably fires inside transforms.
function ClaimChapterButton({ onClaim, points, language, colors, isLoading }: {
  onClaim: () => void;
  points: number;
  language: 'en' | 'es';
  colors: ReturnType<typeof useThemeColors>;
  isLoading?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={isLoading}
      onPress={() => {
        console.debug('[ClaimChapterButton] tapped, points=', points);
        onClaim();
      }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: isLoading ? colors.primary + '99' : pressed ? colors.primary + 'DD' : colors.primary,
        borderRadius: 16,
        paddingVertical: 17,
        paddingHorizontal: 20,
        transform: [{ scale: pressed && !isLoading ? 0.97 : 1 }],
      }}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.3 }}>
          {language === 'es' ? `🎁 Reclamar Capítulo +${points} pts` : `🎁 Claim Chapter +${points} pts`}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function ChapterCollectionModal({
  visible,
  collection,
  purchasedItems,
  colors,
  language,
  claimedChapterIds,
  onClaimChapter,
  onClose,
  onNavigateToItem,
}: {
  visible: boolean;
  collection: ChapterCollection | null;
  purchasedItems: string[];
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  claimedChapterIds: Set<string>;
  onClaimChapter: (chapterId: string, points: number) => Promise<void>;
  onClose: () => void;
  onNavigateToItem: (itemId: string, itemType: 'avatar' | 'frame' | 'title' | 'theme') => void;
}) {
  const translateY = useSharedValue(600);
  const opacity = useSharedValue(0);
  // Track which chapterId was just claimed so we can show "new chapter" message
  const [justClaimedId, setJustClaimedId] = useState<string | null>(null);
  // Track which chapter is currently being claimed (for loading state)
  const [claimingChapterId, setClaimingChapterId] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(600, { duration: 250 });
      setJustClaimedId(null);
      setClaimingChapterId(null);
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  if (!collection) return null;

  // Check if an item is owned
  const isItemOwned = (itemId: string) => {
    if (purchasedItems.includes(itemId)) return true;
    const av = DEFAULT_AVATARS.find(a => a.id === itemId);
    return !!(av && !('price' in av));
  };

  // Derive chapter states
  const getChapterState = (chapter: CollectionChapter, index: number): 'completed' | 'active' | 'locked' => {
    if (claimedChapterIds.has(chapter.chapterId)) return 'completed';
    const prevChapters = collection.chapters.slice(0, index);
    const allPrevCompleted = prevChapters.every(c => claimedChapterIds.has(c.chapterId));
    if (allPrevCompleted) return 'active';
    return 'locked';
  };

  const typeLabel = (type: 'avatar' | 'frame' | 'title' | 'theme') => {
    const labels = { avatar: { en: 'Avatar', es: 'Avatar' }, frame: { en: 'Frame', es: 'Marco' }, title: { en: 'Title', es: 'Título' }, theme: { en: 'Theme', es: 'Tema' } };
    return language === 'es' ? labels[type].es : labels[type].en;
  };

  const totalChapters = collection.chapters.length;
  const completedCount = collection.chapters.filter(c => claimedChapterIds.has(c.chapterId)).length;
  const allDone = completedCount === totalChapters;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View
        style={[
          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)' },
          backdropStyle,
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            backgroundColor: colors.surface,
            maxHeight: '93%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -6 },
            shadowOpacity: 0.22,
            shadowRadius: 24,
            elevation: 24,
          },
          sheetStyle,
        ]}
      >
        {/* Handle */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 2 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.textMuted + '40' }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
          <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
            {/* Close */}
            <Pressable onPress={onClose} style={{ position: 'absolute', top: 6, right: 16, padding: 10, zIndex: 10 }}>
              <X size={20} color={colors.textMuted} />
            </Pressable>

            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{
                width: 80, height: 80, borderRadius: 24,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: allDone ? '#22C55E15' : colors.primary + '15',
                borderWidth: 2,
                borderColor: allDone ? '#22C55E40' : colors.primary + '30',
                marginBottom: 12,
              }}>
                <Text style={{ fontSize: 40 }}>{collection.icon}</Text>
              </View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 6 }}>
                {language === 'es' ? collection.nameEs : collection.nameEn}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 8 }}>
                {language === 'es' ? collection.descriptionEs : collection.descriptionEn}
              </Text>
            </View>

            {/* Overall progress pills with labels */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
              {collection.chapters.map((ch, i) => {
                const state = getChapterState(ch, i);
                return (
                  <View key={ch.chapterId} style={{ flex: 1, gap: 4 }}>
                    <View style={{
                      height: 7, borderRadius: 4,
                      backgroundColor: state === 'completed' ? '#22C55E' : state === 'active' ? colors.primary : colors.textMuted + '25',
                    }} />
                    <Text style={{
                      fontSize: 9, fontWeight: '600', textAlign: 'center',
                      color: state === 'completed' ? '#22C55E' : state === 'active' ? colors.primary : colors.textMuted + '60',
                    }}>
                      {language === 'es' ? ch.titleEs : ch.titleEn}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* All done banner */}
            {allDone && (
              <Animated.View
                entering={FadeInDown.duration(400)}
                style={{
                  backgroundColor: '#22C55E12',
                  borderRadius: 16,
                  padding: 18,
                  marginBottom: 24,
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: '#22C55E40',
                }}
              >
                <Text style={{ fontSize: 32, marginBottom: 6 }}>🏆</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#22C55E', marginBottom: 4 }}>
                  {language === 'es' ? '¡Camino completado!' : 'Path completed!'}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 }}>
                  {language === 'es'
                    ? 'Has completado todos los capítulos. Gracias por avanzar con fidelidad.'
                    : 'You have completed all chapters. Thank you for advancing with faithfulness.'}
                </Text>
              </Animated.View>
            )}

            {/* Chapter list */}
            {collection.chapters.map((chapter, index) => {
              const state = getChapterState(chapter, index);
              const isLocked = state === 'locked';
              const isActive = state === 'active';
              const isCompleted = state === 'completed';

              // Check chapter item ownership
              const chapterItemsOwned = chapter.items.filter(ci => isItemOwned(ci.itemId));
              const ownedCount = chapterItemsOwned.length;
              const totalCount = chapter.items.length;
              const chapterComplete = ownedCount === totalCount;
              const canClaimChapter = isActive && !isCompleted && chapterComplete;
              const pendingCount = totalCount - ownedCount;
              const progressPct = totalCount > 0 ? ownedCount / totalCount : 0;

              // Debug log
              console.debug('[ChapterModal]', chapter.chapterId, {
                state,
                ownedCount,
                totalCount,
                chapterComplete,
                canClaimChapter,
                isClaimed: claimedChapterIds.has(chapter.chapterId),
              });

              // Determine if this chapter was just activated (previous chapter was justClaimed)
              const prevChapter = index > 0 ? collection.chapters[index - 1] : null;
              const isNewlyActivated = isActive && prevChapter?.chapterId === justClaimedId;

              const borderColor = isCompleted ? '#22C55E30' : isActive ? colors.primary + '40' : colors.textMuted + '18';
              const headerBg = isCompleted ? '#22C55E08' : isActive ? colors.primary + '0A' : 'transparent';

              return (
                <Animated.View
                  key={chapter.chapterId}
                  entering={FadeInDown.delay(index * 80).duration(350)}
                  style={{ marginBottom: 16 }}
                >
                  {/* Chapter card — NO overflow:hidden so CTA button is never clipped */}
                  <View style={{
                    borderRadius: 20,
                    backgroundColor: isLocked ? colors.background : colors.surface,
                    borderWidth: 1.5,
                    borderColor,
                    shadowColor: isActive ? colors.primary : '#000',
                    shadowOffset: { width: 0, height: isActive ? 5 : 1 },
                    shadowOpacity: isActive ? 0.14 : 0.04,
                    shadowRadius: isActive ? 14 : 4,
                    elevation: isActive ? 5 : 1,
                    opacity: isLocked ? 0.5 : 1,
                  }}>
                    {/* Chapter header bar */}
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 13,
                      backgroundColor: headerBg,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.textMuted + '12',
                    }}>
                      {/* Chapter number badge */}
                      <View style={{
                        width: 34, height: 34, borderRadius: 11,
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: isCompleted ? '#22C55E20' : isActive ? colors.primary + '20' : colors.textMuted + '15',
                        marginRight: 12,
                      }}>
                        {isCompleted
                          ? <Check size={17} color="#22C55E" strokeWidth={2.5} />
                          : isActive
                          ? <Text style={{ fontSize: 14, fontWeight: '800', color: colors.primary }}>{chapter.number}</Text>
                          : <Lock size={14} color={colors.textMuted} />
                        }
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: isCompleted ? '#22C55E' : isActive ? colors.primary : colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                            {language === 'es' ? `Capítulo ${chapter.number}` : `Chapter ${chapter.number}`}
                          </Text>
                          {isActive && !isCompleted && (
                            <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, backgroundColor: colors.primary + '20' }}>
                              <Text style={{ fontSize: 8, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 }}>
                                {language === 'es' ? 'ACTIVO' : 'ACTIVE'}
                              </Text>
                            </View>
                          )}
                          {isCompleted && (
                            <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, backgroundColor: '#22C55E20' }}>
                              <Text style={{ fontSize: 8, fontWeight: '800', color: '#22C55E', letterSpacing: 0.5 }}>
                                {language === 'es' ? 'COMPLETADO' : 'COMPLETED'}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: isLocked ? colors.textMuted : colors.text }}>
                          {language === 'es' ? chapter.titleEs : chapter.titleEn}
                        </Text>
                      </View>

                      {/* Reward badge */}
                      <View style={{
                        paddingHorizontal: 9, paddingVertical: 5,
                        borderRadius: 9,
                        backgroundColor: isCompleted ? '#22C55E15' : isActive ? colors.primary + '15' : colors.textMuted + '10',
                        flexDirection: 'row', alignItems: 'center', gap: 3,
                      }}>
                        <Sparkles size={11} color={isCompleted ? '#22C55E' : isActive ? colors.primary : colors.textMuted} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: isCompleted ? '#22C55E' : isActive ? colors.primary : colors.textMuted }}>
                          +{chapter.rewardPoints}
                        </Text>
                      </View>
                    </View>

                    {/* Locked state body */}
                    {isLocked && (
                      <View style={{
                        padding: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                      }}>
                        <View style={{
                          width: 36, height: 36, borderRadius: 10,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: colors.textMuted + '12',
                        }}>
                          <Lock size={16} color={colors.textMuted} />
                        </View>
                        <Text style={{ flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 18 }}>
                          {language === 'es'
                            ? 'Completa el capítulo anterior para desbloquearlo.'
                            : 'Complete the previous chapter to unlock this one.'}
                        </Text>
                      </View>
                    )}

                    {/* Active or Completed chapter body */}
                    {!isLocked && (
                      <View style={{ padding: 16 }}>

                        {/* "Newly activated" message */}
                        {isNewlyActivated && (
                          <Animated.View
                            entering={FadeInDown.duration(350)}
                            style={{
                              backgroundColor: colors.primary + '10',
                              borderRadius: 12,
                              padding: 12,
                              marginBottom: 14,
                              borderWidth: 1,
                              borderColor: colors.primary + '25',
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <Text style={{ fontSize: 18 }}>✨</Text>
                            <Text style={{ flex: 1, fontSize: 13, color: colors.primary, fontWeight: '600', lineHeight: 18 }}>
                              {language === 'es'
                                ? 'Ahora es tiempo de crecer y fortalecerte.'
                                : 'Now is the time to grow and strengthen yourself.'}
                            </Text>
                          </Animated.View>
                        )}

                        {/* Verse reference */}
                        {chapter.verseEn && (
                          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                            {language === 'es' ? chapter.verseEs : chapter.verseEn}
                          </Text>
                        )}

                        {/* Spiritual text */}
                        <View style={{
                          backgroundColor: colors.primary + '0C',
                          borderRadius: 12,
                          padding: 14,
                          borderLeftWidth: 3,
                          borderLeftColor: colors.primary + '50',
                          marginBottom: 18,
                        }}>
                          <Text style={{ fontSize: 13, lineHeight: 21, color: colors.text + 'DD', fontStyle: 'italic' }}>
                            {language === 'es' ? chapter.spiritualTextEs : chapter.spiritualTextEn}
                          </Text>
                        </View>

                        {/* Items progress header */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, flex: 1 }}>
                            {language === 'es' ? 'Ítems requeridos' : 'Required items'}
                          </Text>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: chapterComplete ? '#22C55E' : colors.primary }}>
                            {ownedCount}/{totalCount}
                          </Text>
                        </View>

                        {/* Per-chapter progress bar */}
                        <View style={{
                          height: 5, borderRadius: 3,
                          backgroundColor: colors.textMuted + '20',
                          marginBottom: 14,
                          overflow: 'hidden',
                        }}>
                          <View style={{
                            height: '100%',
                            width: `${Math.round(progressPct * 100)}%`,
                            backgroundColor: chapterComplete ? '#22C55E' : colors.primary,
                            borderRadius: 3,
                          }} />
                        </View>

                        {/* Items checklist */}
                        {chapter.items.map((ci) => {
                          const owned = isItemOwned(ci.itemId);
                          const meta = resolveCollectionItem(ci.itemId);
                          return (
                            <Pressable
                              key={ci.itemId}
                              onPress={() => { if (!owned && isActive) onNavigateToItem(ci.itemId, ci.itemType); }}
                              disabled={owned || !isActive}
                              style={({ pressed }) => ({
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 11,
                                paddingHorizontal: 13,
                                marginBottom: 8,
                                borderRadius: 13,
                                backgroundColor: owned
                                  ? colors.textMuted + '08'
                                  : pressed
                                  ? colors.primary + '18'
                                  : colors.primary + '09',
                                borderWidth: 1,
                                borderColor: owned ? colors.textMuted + '18' : colors.primary + '28',
                              })}
                            >
                              {/* Icon */}
                              <View style={{
                                width: 38, height: 38, borderRadius: 11,
                                alignItems: 'center', justifyContent: 'center',
                                backgroundColor: owned ? '#22C55E15' : colors.primary + '18',
                                marginRight: 11,
                              }}>
                                {meta.emoji
                                  ? <Text style={{ fontSize: 19 }}>{meta.emoji}</Text>
                                  : meta.color
                                  ? <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: meta.color }} />
                                  : <Text style={{ fontSize: 17 }}>{collection.icon}</Text>
                                }
                              </View>

                              {/* Info */}
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: owned ? colors.textMuted : colors.text }}>
                                  {language === 'es' ? meta.nameEs : meta.name}
                                </Text>
                                <Text style={{ fontSize: 10, color: colors.textMuted }}>
                                  {typeLabel(ci.itemType)}
                                </Text>
                              </View>

                              {/* Status */}
                              {owned ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <Check size={14} color="#22C55E" strokeWidth={2.5} />
                                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#22C55E' }}>
                                    {language === 'es' ? 'Adquirido' : 'Acquired'}
                                  </Text>
                                </View>
                              ) : isActive ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: colors.primary + '15' }}>
                                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                                    {language === 'es' ? 'Ir' : 'Go'}
                                  </Text>
                                  <ChevronRight size={13} color={colors.primary} />
                                </View>
                              ) : (
                                <Lock size={14} color={colors.textMuted} />
                              )}
                            </Pressable>
                          );
                        })}

                        {/* CTA section — inside card for pending state */}
                        {isActive && !canClaimChapter && (
                          <View style={{ marginTop: 4 }}>
                            {/* Pending items copy */}
                            <View style={{
                              borderRadius: 13,
                              paddingVertical: 14,
                              paddingHorizontal: 16,
                              alignItems: 'center',
                              backgroundColor: colors.textMuted + '08',
                              borderWidth: 1,
                              borderColor: colors.textMuted + '18',
                              gap: 4,
                            }}>
                              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>
                                {language === 'es'
                                  ? `${pendingCount} ítem${pendingCount !== 1 ? 's' : ''} pendiente${pendingCount !== 1 ? 's' : ''}`
                                  : `${pendingCount} item${pendingCount !== 1 ? 's' : ''} remaining`}
                              </Text>
                              <Text style={{ color: colors.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 17 }}>
                                {language === 'es'
                                  ? 'Completa todos los ítems de este capítulo para continuar tu camino espiritual.'
                                  : 'Complete all items in this chapter to continue your spiritual path.'}
                              </Text>
                            </View>
                          </View>
                        )}

                        {/* Completed state inside card */}
                        {isCompleted && (
                          <View style={{
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                            gap: 6, paddingVertical: 11,
                            backgroundColor: '#22C55E10', borderRadius: 12,
                            borderWidth: 1, borderColor: '#22C55E25',
                          }}>
                            <Check size={14} color="#22C55E" strokeWidth={2.5} />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#22C55E' }}>
                              {language === 'es' ? 'Capítulo completado' : 'Chapter completed'}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  {/* CTA Claim button — rendered OUTSIDE the card View so it's never clipped */}
                  {canClaimChapter && (
                    <View style={{ paddingHorizontal: 2 }}>
                      {/* Ready to claim copy */}
                      <View style={{
                        backgroundColor: colors.primary + '0C',
                        borderRadius: 10,
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        marginTop: 10,
                        borderWidth: 1,
                        borderColor: colors.primary + '20',
                      }}>
                        <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600', textAlign: 'center', lineHeight: 18 }}>
                          {language === 'es'
                            ? 'Capítulo completo. Reclámalo para avanzar al siguiente nivel.'
                            : 'Chapter complete. Claim it to advance to the next level.'}
                        </Text>
                      </View>
                      <ClaimChapterButton
                        onClaim={async () => {
                          setClaimingChapterId(chapter.chapterId);
                          setJustClaimedId(chapter.chapterId);
                          await onClaimChapter(chapter.chapterId, chapter.rewardPoints);
                          setClaimingChapterId(null);
                        }}
                        points={chapter.rewardPoints}
                        language={language}
                        colors={colors}
                        isLoading={claimingChapterId === chapter.chapterId}
                      />
                    </View>
                  )}

                  {/* Connector line between chapters */}
                  {index < collection.chapters.length - 1 && (
                    <View style={{ alignItems: 'center', paddingVertical: 6 }}>
                      <View style={{
                        width: 2, height: 18,
                        backgroundColor: isCompleted ? '#22C55E50' : colors.textMuted + '25',
                        borderRadius: 1,
                      }} />
                    </View>
                  )}
                </Animated.View>
              );
            })}
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ─── Helpers to resolve item metadata from any item type ─────────────────────
function resolveCollectionItem(itemId: string): {
  name: string;
  nameEs: string;
  type: 'avatar' | 'frame' | 'title' | 'theme';
  emoji?: string;
  color?: string;
} {
  // Check avatars
  const defaultAvatar = DEFAULT_AVATARS.find(a => a.id === itemId);
  if (defaultAvatar) {
    return { name: defaultAvatar.name, nameEs: defaultAvatar.nameEs, type: 'avatar', emoji: defaultAvatar.emoji };
  }
  // Check frames
  if (AVATAR_FRAMES[itemId]) {
    const f = AVATAR_FRAMES[itemId];
    return { name: f.name, nameEs: f.nameEs, type: 'frame', color: f.color };
  }
  // Check titles
  if (SPIRITUAL_TITLES[itemId]) {
    const t = SPIRITUAL_TITLES[itemId];
    return { name: t.name, nameEs: t.nameEs, type: 'title', emoji: '👑' };
  }
  // Check themes
  if (PURCHASABLE_THEMES[itemId]) {
    const th = PURCHASABLE_THEMES[itemId];
    return { name: th.name, nameEs: th.nameEs, type: 'theme', color: th.colors?.primary };
  }
  // Fallback
  const label = itemId.replace(/(avatar_|frame_|title_|theme_)(v2_|l2_)?/g, '').replace(/_/g, ' ');
  return { name: label, nameEs: label, type: itemId.startsWith('frame') ? 'frame' : itemId.startsWith('title') ? 'title' : itemId.startsWith('theme') ? 'theme' : 'avatar' };
}

// Collection Detail Modal — mission-style bottom sheet
function CollectionDetailModal({
  visible,
  collection,
  purchasedItems,
  colors,
  language,
  isClaimed,
  isClaiming,
  onClaim,
  onClose,
  onNavigateToItem,
}: {
  visible: boolean;
  collection: typeof ITEM_COLLECTIONS[string] | null;
  purchasedItems: string[];
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  isClaimed: boolean;
  isClaiming: boolean;
  onClaim: (ownedItemIds: string[]) => void;
  onClose: () => void;
  onNavigateToItem: (itemId: string, itemType: 'avatar' | 'frame' | 'title' | 'theme') => void;
}) {
  const translateY = useSharedValue(600);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(600, { duration: 250 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  if (!collection) return null;

  const ownedItemIds = collection.items.filter(itemId => {
    if (purchasedItems.includes(itemId)) return true;
    const avatar = DEFAULT_AVATARS.find(a => a.id === itemId);
    if (avatar && !('price' in avatar)) return true;
    return false;
  });

  const ownedCount = ownedItemIds.length;
  const totalCount = collection.items.length;
  const isComplete = ownedCount === totalCount;
  const progressPercent = (ownedCount / totalCount) * 100;
  const canClaim = isComplete && !isClaimed;

  const typeLabel = (type: 'avatar' | 'frame' | 'title' | 'theme') => {
    const labels = {
      avatar: { en: 'Avatar', es: 'Avatar' },
      frame: { en: 'Frame', es: 'Marco' },
      title: { en: 'Title', es: 'Titulo' },
      theme: { en: 'Theme', es: 'Tema' },
    };
    return language === 'es' ? labels[type].es : labels[type].en;
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View
        style={[
          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' },
          backdropStyle,
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            backgroundColor: colors.surface,
            maxHeight: '88%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 20,
          },
          sheetStyle,
        ]}
      >
        {/* Drag Handle */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.textMuted + '40' }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 48 }}
        >
          {/* ── Header ─────────────────────────────────────── */}
          <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 }}>
            {/* Close button */}
            <Pressable
              onPress={onClose}
              style={{ position: 'absolute', top: 10, right: 20, zIndex: 10, padding: 8 }}
            >
              <X size={20} color={colors.textMuted} />
            </Pressable>

            {/* Icon + Title block */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isClaimed ? '#22C55E20' : colors.primary + '20',
                  marginBottom: 12,
                  borderWidth: 1.5,
                  borderColor: isClaimed ? '#22C55E40' : colors.primary + '40',
                }}
              >
                <Text style={{ fontSize: 36 }}>{collection.icon}</Text>
              </View>

              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 4 }}>
                {language === 'es' ? collection.nameEs : collection.name}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic' }}>
                {language === 'es' ? collection.subtitleEs : collection.subtitle}
              </Text>
            </View>

            {/* ── Inspiration ─────────────────────────────── */}
            <View
              style={{
                backgroundColor: colors.primary + '0D',
                borderRadius: 14,
                padding: 14,
                borderLeftWidth: 3,
                borderLeftColor: colors.primary + '60',
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 12, lineHeight: 20, color: colors.text + 'CC', fontStyle: 'italic' }}>
                {language === 'es' ? collection.inspirationEs : collection.inspiration}
              </Text>
            </View>

            {/* ── Progress ─────────────────────────────────── */}
            <View
              style={{
                backgroundColor: colors.background,
                borderRadius: 14,
                padding: 14,
                marginBottom: 20,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {language === 'es' ? 'Progreso' : 'Progress'}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: isComplete ? '#22C55E' : colors.primary }}>
                  {ownedCount}/{totalCount}
                </Text>
              </View>
              <View style={{ height: 8, backgroundColor: colors.textMuted + '20', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                <Animated.View
                  style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    backgroundColor: isClaimed ? '#22C55E' : isComplete ? colors.primary : colors.primary,
                    borderRadius: 4,
                  }}
                />
              </View>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                {language === 'es'
                  ? `Has completado ${ownedCount} de ${totalCount}`
                  : `You have completed ${ownedCount} of ${totalCount}`}
              </Text>
            </View>

            {/* ── Completed badge ──────────────────────────── */}
            {isClaimed && (
              <View
                style={{
                  backgroundColor: '#22C55E15',
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 20,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#22C55E40',
                }}
              >
                <Text style={{ fontSize: 28, marginBottom: 6 }}>🏆</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#22C55E', marginBottom: 4 }}>
                  {language === 'es' ? 'Coleccion completada' : 'Collection completed'}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center' }}>
                  {language === 'es'
                    ? 'Has completado este reto. Gracias por avanzar con fidelidad.'
                    : 'You completed this challenge. Thank you for advancing with faithfulness.'}
                </Text>
              </View>
            )}

            {/* ── Items list ───────────────────────────────── */}
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
              {language === 'es' ? 'Elementos de la Coleccion' : 'Collection Items'}
            </Text>

            {collection.items.map((itemId, index) => {
              const isOwned = ownedItemIds.includes(itemId);
              const meta = resolveCollectionItem(itemId);

              return (
                <Animated.View
                  key={itemId}
                  entering={FadeInDown.delay(index * 40).duration(300)}
                >
                  <Pressable
                    onPress={() => {
                      if (!isOwned) {
                        onNavigateToItem(itemId, meta.type);
                      }
                    }}
                    disabled={isOwned}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      marginBottom: 8,
                      borderRadius: 14,
                      backgroundColor: isOwned
                        ? colors.textMuted + '08'
                        : pressed
                        ? colors.primary + '18'
                        : colors.primary + '0C',
                      borderWidth: 1,
                      borderColor: isOwned ? colors.textMuted + '20' : colors.primary + '30',
                      opacity: isOwned ? 0.65 : 1,
                    })}
                  >
                    {/* Item icon */}
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isOwned ? colors.textMuted + '15' : colors.primary + '20',
                        marginRight: 12,
                      }}
                    >
                      {meta.emoji ? (
                        <Text style={{ fontSize: 20 }}>{meta.emoji}</Text>
                      ) : meta.color ? (
                        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: meta.color, borderWidth: 2, borderColor: '#fff' + '80' }} />
                      ) : (
                        <Text style={{ fontSize: 18 }}>{collection.icon}</Text>
                      )}
                    </View>

                    {/* Item info */}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: isOwned ? colors.textMuted : colors.text }}>
                        {language === 'es' ? meta.nameEs : meta.name}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
                        {typeLabel(meta.type)}
                      </Text>
                    </View>

                    {/* Status */}
                    {isOwned ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Check size={14} color="#22C55E" strokeWidth={2.5} />
                        <Text style={{ fontSize: 11, fontWeight: '600', color: '#22C55E' }}>
                          {language === 'es' ? 'Adquirido' : 'Acquired'}
                        </Text>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Lock size={13} color={colors.primary} />
                        <ChevronRight size={14} color={colors.primary} />
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              );
            })}

            {/* ── CTA ──────────────────────────────────────── */}
            {!isClaimed && (
              <View style={{ marginTop: 8 }}>
                {canClaim ? (
                  <Pressable
                    onPress={() => onClaim(ownedItemIds)}
                    disabled={isClaiming}
                    style={{
                      backgroundColor: isClaiming ? colors.primary + '80' : colors.primary,
                      borderRadius: 14,
                      paddingVertical: 15,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {isClaiming ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Gift size={18} color="#fff" />
                    )}
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                      {language === 'es' ? 'Reclamar recompensa' : 'Claim reward'} • +{collection.rewardPoints} pts
                    </Text>
                  </Pressable>
                ) : (
                  <View
                    style={{
                      borderRadius: 14,
                      paddingVertical: 14,
                      alignItems: 'center',
                      borderWidth: 1.5,
                      borderColor: colors.primary + '40',
                      backgroundColor: colors.primary + '08',
                    }}
                  >
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                      {language === 'es'
                        ? `Faltan ${totalCount - ownedCount} elemento${totalCount - ownedCount !== 1 ? 's' : ''} para completar`
                        : `${totalCount - ownedCount} item${totalCount - ownedCount !== 1 ? 's' : ''} remaining to complete`}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                      {language === 'es' ? 'Toca un elemento pendiente para ir a el' : 'Tap a pending item to navigate to it'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ─── Chapter Collection Card ──────────────────────────────────────────────────
function ChapterCollectionCard({
  collection,
  purchasedItems,
  colors,
  language,
  claimedChapterIds,
  onPress,
}: {
  collection: ChapterCollection;
  purchasedItems: string[];
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  claimedChapterIds: Set<string>;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isItemOwned = (itemId: string) => {
    if (purchasedItems.includes(itemId)) return true;
    const av = DEFAULT_AVATARS.find(a => a.id === itemId);
    return !!(av && !('price' in av));
  };

  const totalChapters = collection.chapters.length;
  const completedCount = collection.chapters.filter(c => claimedChapterIds.has(c.chapterId)).length;
  const allDone = completedCount === totalChapters;

  const activeChapterIdx = collection.chapters.findIndex(c => !claimedChapterIds.has(c.chapterId));
  const activeChapter = activeChapterIdx >= 0 ? collection.chapters[activeChapterIdx] : null;

  const activeChapterOwnedCount = activeChapter
    ? activeChapter.items.filter(ci => isItemOwned(ci.itemId)).length
    : 0;
  const activeChapterReady = activeChapter
    ? activeChapterOwnedCount === activeChapter.items.length
    : false;

  return (
    <Animated.View style={animatedStyle} className="mb-4">
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={{
          borderRadius: 18,
          overflow: 'hidden',
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: allDone ? '#22C55E40' : activeChapterReady ? colors.primary + '50' : colors.textMuted + '18',
          shadowColor: allDone ? '#22C55E' : activeChapterReady ? colors.primary : '#000',
          shadowOffset: { width: 0, height: allDone || activeChapterReady ? 4 : 2 },
          shadowOpacity: allDone || activeChapterReady ? 0.14 : 0.06,
          shadowRadius: allDone || activeChapterReady ? 12 : 5,
          elevation: allDone || activeChapterReady ? 4 : 2,
        }}
      >
        {/* Top banner */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 12, paddingVertical: 6,
          backgroundColor: allDone ? '#22C55E12' : activeChapterReady ? colors.primary + '12' : colors.primary + '0C',
        }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: allDone ? '#22C55E' : colors.primary, letterSpacing: 0.5 }}>
            {language === 'es' ? '✦ CAMINO ESPIRITUAL' : '✦ SPIRITUAL PATH'}
          </Text>
          <View style={{ flex: 1 }} />
          {activeChapterReady && !allDone ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>
                🎁 {language === 'es' ? '¡Listo!' : 'Ready!'}
              </Text>
            </View>
          ) : (
            <Text style={{ fontSize: 10, fontWeight: '600', color: allDone ? '#22C55E' : colors.textMuted }}>
              {completedCount}/{totalChapters} {language === 'es' ? 'cap.' : 'ch.'}
            </Text>
          )}
        </View>

        <View style={{ padding: 14 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 48, height: 48, borderRadius: 14,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: allDone ? '#22C55E18' : colors.primary + '18',
              marginRight: 12,
            }}>
              <Text style={{ fontSize: 26 }}>{collection.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 2 }}>
                {language === 'es' ? collection.nameEs : collection.nameEn}
              </Text>
              {activeChapter && !allDone ? (
                <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600' }}>
                  {language === 'es' ? `Capítulo ${activeChapter.number}: ` : `Chapter ${activeChapter.number}: `}
                  <Text style={{ fontWeight: '400', color: colors.textMuted }}>
                    {language === 'es' ? activeChapter.titleEs : activeChapter.titleEn}
                  </Text>
                </Text>
              ) : (
                <Text style={{ fontSize: 11, color: '#22C55E', fontWeight: '600' }}>
                  {language === 'es' ? 'Camino completado' : 'Path completed'}
                </Text>
              )}
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </View>

          {/* Chapter progress bars */}
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
            {collection.chapters.map((ch, i) => {
              const done = claimedChapterIds.has(ch.chapterId);
              const active = !done && i === activeChapterIdx;
              return (
                <View key={ch.chapterId} style={{ flex: 1, gap: 4 }}>
                  <View style={{
                    height: 5, borderRadius: 3,
                    backgroundColor: done ? '#22C55E' : active ? colors.primary : colors.textMuted + '22',
                  }} />
                  <Text style={{ fontSize: 9, fontWeight: '600', color: done ? '#22C55E' : active ? colors.primary : colors.textMuted + '80', textAlign: 'center' }}>
                    {language === 'es' ? ch.titleEs : ch.titleEn}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Active chapter item status */}
          {activeChapter && !allDone && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: activeChapterReady ? colors.primary + '0C' : colors.textMuted + '08',
              borderRadius: 10, padding: 8,
            }}>
              <Text style={{ fontSize: 11, color: colors.textMuted, flex: 1 }}>
                {activeChapterOwnedCount}/{activeChapter.items.length} {language === 'es' ? 'ítems del capítulo activo' : 'items in active chapter'}
              </Text>
              {activeChapterReady ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.primary }}>
                  <Gift size={12} color="#fff" />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>
                    {language === 'es' ? 'Listo' : 'Ready'}
                  </Text>
                </View>
              ) : (
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.primary }}>
                  +{activeChapter.rewardPoints} pts
                </Text>
              )}
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Collection Card with claim support
function CollectionCard({
  collection,
  purchasedItems,
  colors,
  language,
  isClaimed,
  isClaiming,
  isNew,
  onClaim,
  onPress,
}: {
  collection: typeof ITEM_COLLECTIONS[string];
  purchasedItems: string[];
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  isClaimed: boolean;
  isClaiming: boolean;
  isNew: boolean;
  onClaim: (ownedItemIds: string[]) => void;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const isV2Collection = 'isV2' in collection && (collection as any).isV2 === true;

  const ownedItemIds = collection.items.filter(itemId => {
    if (purchasedItems.includes(itemId)) return true;
    const avatar = DEFAULT_AVATARS.find(a => a.id === itemId);
    if (avatar && !('price' in avatar)) return true;
    return false;
  });

  const ownedCount = ownedItemIds.length;
  const totalCount = collection.items.length;
  const isComplete = ownedCount === totalCount;
  const progressPercent = (ownedCount / totalCount) * 100;
  const canClaim = isComplete && !isClaimed;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle} className="mb-4">
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: colors.surface,
          shadowColor: isClaimed ? '#22C55E' : isComplete ? colors.primary : '#000',
          shadowOffset: { width: 0, height: isClaimed || isComplete ? 4 : 2 },
          shadowOpacity: isClaimed || isComplete ? 0.18 : 0.08,
          shadowRadius: isClaimed || isComplete ? 12 : 6,
          elevation: isClaimed || isComplete ? 4 : 2,
          borderWidth: isClaimed || isComplete ? 1.5 : 0,
          borderColor: isClaimed ? '#22C55E' : colors.primary,
        }}
      >
        <View style={{ padding: 16 }}>
          {/* Header */}
          <View className="flex-row items-center mb-3">
            <View
              className="w-12 h-12 rounded-xl items-center justify-center mr-3"
              style={{
                backgroundColor: isClaimed
                  ? '#22C55E20'
                  : isComplete
                  ? colors.primary + '25'
                  : isV2Collection
                  ? colors.primary + '20'
                  : colors.primary + '15',
              }}
            >
              <Text style={{ fontSize: 24 }}>{collection.icon}</Text>
            </View>
            <View className="flex-1">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text className="text-base font-bold" style={{ color: colors.text }}>
                  {language === 'es' ? collection.nameEs : collection.name}
                </Text>
                {isV2Collection && (
                  <View style={{
                    paddingHorizontal: 5,
                    paddingVertical: 2,
                    borderRadius: 4,
                    backgroundColor: colors.primary + '20',
                  }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: colors.primary }}>V2</Text>
                  </View>
                )}
                {isNew && (
                  <View style={{
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                    backgroundColor: '#EF4444',
                    shadowColor: '#EF4444',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.4,
                    shadowRadius: 4,
                    elevation: 3,
                  }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>
                      {language === 'es' ? 'NUEVO' : 'NEW'}
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-xs" style={{ color: colors.textMuted }}>
                {language === 'es' ? collection.descriptionEs : collection.description}
              </Text>
            </View>
            <View
              className="px-3 py-1.5 rounded-full"
              style={{ backgroundColor: isComplete ? colors.primary + '20' : colors.textMuted + '15' }}
            >
              <Text
                className="text-sm font-bold"
                style={{ color: isComplete ? colors.primary : colors.textMuted }}
              >
                {ownedCount}/{totalCount}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View
            className="h-2.5 rounded-full overflow-hidden mb-3"
            style={{ backgroundColor: colors.textMuted + '15' }}
          >
            <View
              className="h-full rounded-full"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: isClaimed ? '#22C55E' : colors.primary,
              }}
            />
          </View>

          {/* Reward + Claim Row */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Sparkles size={14} color={isClaimed ? '#22C55E' : colors.primary} />
              <Text
                className="text-xs font-semibold ml-1"
                style={{ color: isClaimed ? '#22C55E' : colors.primary }}
              >
                {language === 'es' ? 'Premio' : 'Reward'}: +{collection.rewardPoints}{' '}
                {language === 'es' ? 'pts' : 'pts'}
              </Text>
            </View>

            {isClaimed ? (
              <View className="flex-row items-center px-3 py-1 rounded-lg" style={{ backgroundColor: '#22C55E20' }}>
                <Check size={12} color="#22C55E" strokeWidth={3} />
                <Text className="text-xs font-bold ml-1" style={{ color: '#22C55E' }}>
                  {language === 'es' ? 'Reclamado' : 'Claimed'}
                </Text>
              </View>
            ) : canClaim ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onClaim(ownedItemIds);
                }}
                disabled={isClaiming}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 10,
                  backgroundColor: isClaiming ? colors.primary + '60' : colors.primary,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                {isClaiming ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Gift size={13} color="#fff" />
                )}
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>
                  {language === 'es' ? 'Reclamar' : 'Claim'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Points Animation Toast
function PointsToast({
  amount,
  visible,
  onHide,
  isPositive = false,
  message,
}: {
  amount: number;
  visible: boolean;
  onHide: () => void;
  isPositive?: boolean;
  message?: string;
}) {
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      translateY.value = withSequence(
        withTiming(-10, { duration: 300 }),
        withTiming(0, { duration: 100 })
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 300 })
      );
      const timeout = setTimeout(() => {
        runOnJS(onHide)();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 100,
          left: 16,
          right: 16,
          alignItems: 'center',
          zIndex: 1000,
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          backgroundColor: isPositive ? '#22C55E' : '#EF4444',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 16,
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Sparkles size={16} color="#FFFFFF" />
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
            {isPositive ? '+' : '-'}{amount} pts
          </Text>
        </View>
        {message ? (
          <Text style={{ color: '#ffffffCC', fontSize: 12, fontWeight: '500', textAlign: 'center' }}>
            {message}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

// Main Store Screen
export default function StoreScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const language = useLanguage();
  const points = useUserPoints();
  const user = useUser();
  const updateUser = useAppStore((s) => s.updateUser);
  const t = TRANSLATIONS[language];
  const queryClient = useQueryClient();

  const [activeCategory, setActiveCategory] = useState<CategoryType>('themes');
  const [showV2Only, setShowV2Only] = useState(false);
  const [showPointsToast, setShowPointsToast] = useState(false);
  const [toastAmount, setToastAmount] = useState(0);
  const [toastPositive, setToastPositive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | undefined>(undefined);
  const [allChallengesComplete, setAllChallengesComplete] = useState(false);
  const [showChestModal, setShowChestModal] = useState(false);
  const [showCollectionDetailModal, setShowCollectionDetailModal] = useState(false);
  const [showChapterCollectionModal, setShowChapterCollectionModal] = useState(false);
  const [selectedChapterCollection, setSelectedChapterCollection] = useState<ChapterCollection | null>(null);

  const [selectedCollection, setSelectedCollection] = useState<typeof ITEM_COLLECTIONS[string] | null>(null);
  const [chestReward, setChestReward] = useState<{
    type: 'points' | 'item';
    value?: number;
    itemId?: string;
    itemType?: 'avatar' | 'frame' | 'title' | 'theme';
    itemName?: string;
    itemNameEs?: string;
    itemEmoji?: string;
    itemColor?: string;
    rarity: string;
  } | null>(null);

  // Item detail modal state
  const [selectedDetailItem, setSelectedDetailItem] = useState<{
    id: string;
    type: 'theme' | 'frame' | 'title' | 'avatar';
    name: string;
    nameEs: string;
    description: string;
    descriptionEs: string;
    price: number;
    rarity: string;
    emoji?: string;
    color?: string;
    colors?: { primary: string; secondary: string; accent: string };
    chestOnly?: boolean;
    meaning?: string;
    meaningEn?: string;
    unlockType?: 'streak' | 'devotionals' | 'share' | 'store';
    unlockValue?: number;
  } | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Pending navigation target: set when user taps "Ir →" from a collection modal
  const [pendingNavTarget, setPendingNavTarget] = useState<{
    itemId: string;
    itemType: 'avatar' | 'frame' | 'title' | 'theme';
  } | null>(null);

  // ScrollView ref for programmatic scrolling
  const mainScrollViewRef = useRef<ScrollView>(null);
  // Track current scroll offset so we can compute absolute item positions
  const scrollOffsetY = useRef(0);
  // Track the ScrollView's on-screen Y position (for measureInWindow math)
  const scrollViewPageY = useRef(0);
  // Map of itemId → View ref for highlight + scroll-to
  const itemViewRefs = useRef<Map<string, View>>(new Map());

  const userId = user?.id || '';
  const purchasedItems = user?.purchasedItems ?? [];

  // State for synced backend user ID (might be different from local if user was created offline)
  const [syncedBackendUserId, setSyncedBackendUserId] = useState<string | null>(null);
  const effectiveUserId = syncedBackendUserId || userId;

  // Chapter collection progress (AsyncStorage + backend sync)
  const { claimedChapterIds, claimChapter } = useChapterCollectionProgress(effectiveUserId);

  // Memoize user data for backend sync to avoid unnecessary re-fetches
  const userDataForSync = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      points: user.points,
      streakCurrent: user.streakCurrent,
      streakBest: user.streakBest,
      devotionalsCompleted: user.devotionalsCompleted,
      totalTime: user.totalTime,
    };
  }, [user?.id, user?.nickname, user?.avatar]);

  // Sync/create user in backend on mount
  const { data: backendUser, isLoading: isLoadingBackendUser } = useQuery({
    queryKey: ['backendUser', userDataForSync],
    queryFn: async () => {
      if (!userDataForSync) return null;
      // Try to ensure user exists in backend, creating if necessary
      const result = await gamificationApi.ensureUserExists(userDataForSync);
      return result;
    },
    enabled: !!userId && !!user?.nickname,
    staleTime: 60 * 1000,
    retry: 1,
  });

  // Update local user with backend data if synced
  React.useEffect(() => {
    if (backendUser) {
      // If backend user has different ID, save it for API calls
      if (backendUser.id !== userId) {
        console.log('[Store] Backend user ID differs, using:', backendUser.id);
        setSyncedBackendUserId(backendUser.id);
        updateUser({ id: backendUser.id });
      }

      // Build a partial update with any backend values that are higher than local
      const localUser = useAppStore.getState().user;
      const updates: Record<string, unknown> = {};

      // Always take the higher points value
      if (backendUser.points !== (localUser?.points ?? 0)) {
        updates.points = Math.max(backendUser.points, localUser?.points ?? 0);
      }
      // Take the higher streak
      if (backendUser.streakCurrent > (localUser?.streakCurrent ?? 0)) {
        updates.streakCurrent = backendUser.streakCurrent;
      }
      if (backendUser.streakBest > (localUser?.streakBest ?? 0)) {
        updates.streakBest = backendUser.streakBest;
      }
      // Take the higher devotionals count
      if (backendUser.devotionalsCompleted > (localUser?.devotionalsCompleted ?? 0)) {
        updates.devotionalsCompleted = backendUser.devotionalsCompleted;
      }
      // Sync lastActiveDate from backend if local is empty or older
      if (backendUser.lastActiveAt) {
        const backendDate = backendUser.lastActiveAt.slice(0, 10);
        if (!localUser?.lastActiveDate || backendDate > localUser.lastActiveDate) {
          updates.lastActiveDate = backendDate;
        }
      }

      if (Object.keys(updates).length > 0) {
        console.log('[Store] Syncing from backend:', updates);
        updateUser(updates as Parameters<typeof updateUser>[0]);
      }
    }
  }, [backendUser?.id, backendUser?.points, backendUser?.streakCurrent, backendUser?.devotionalsCompleted]);

  const { data: collectionClaimsData, refetch: refetchCollectionClaims } = useQuery({
    queryKey: ['collectionClaims', effectiveUserId],
    queryFn: () => gamificationApi.getCollectionClaims(effectiveUserId),
    enabled: !!effectiveUserId,
  });
  const claimedCollectionIds = useMemo(
    () => new Set((collectionClaimsData?.claims ?? []).map(c => c.collectionId)),
    [collectionClaimsData]
  );

  // Badge + "Nuevo" state for collections
  const { pendingClaimsCount, newClaimableIds, markClaimablesSeen } = useCollectionClaimBadges(
    ITEM_COLLECTIONS,
    purchasedItems,
    claimedCollectionIds
  );

  // Count chapter collections with at least 1 chapter ready to claim (canClaimChapter)
  const chapterPendingCount = useMemo(() => {
    const isItemOwned = (itemId: string) => {
      if (purchasedItems.includes(itemId)) return true;
      const av = DEFAULT_AVATARS.find(a => a.id === itemId);
      return !!(av && !('price' in av));
    };
    let count = 0;
    for (const col of Object.values(CHAPTER_COLLECTIONS)) {
      for (let i = 0; i < col.chapters.length; i++) {
        const ch = col.chapters[i];
        if (claimedChapterIds.has(ch.chapterId)) continue;
        // Chapter is active only if all previous are claimed
        const allPrevClaimed = col.chapters.slice(0, i).every(c => claimedChapterIds.has(c.chapterId));
        if (!allPrevClaimed) continue;
        // Active and all items owned = ready to claim
        const allOwned = ch.items.every(ci => isItemOwned(ci.itemId));
        if (allOwned) count++;
      }
    }
    return count;
  }, [claimedChapterIds, purchasedItems]);

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: ({ itemId }: { itemId: string }) =>
      gamificationApi.purchaseItem(effectiveUserId, itemId),
    onSuccess: (data) => {
      if (data.success && data.newPoints !== undefined && selectedDetailItem) {
        const delta = -(selectedDetailItem.price);
        updateUser({
          points: data.newPoints,
          purchasedItems: [...purchasedItems, selectedDetailItem.id],
        });
        addLedgerEntry({
          delta,
          kind: 'purchase',
          title: language === 'es' ? 'Compra en Tienda' : 'Store Purchase',
          detail: language === 'es' ? (selectedDetailItem.nameEs ?? selectedDetailItem.name) : selectedDetailItem.name,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowDetailModal(false);
        setToastAmount(selectedDetailItem.price);
        setToastPositive(false);
        setShowPointsToast(true);
      }
    },
    onError: () => {
      // Fallback: use local store for purchase
      if (selectedDetailItem) {
        const localSuccess = useAppStore.getState().purchaseItem(selectedDetailItem.id, selectedDetailItem.price);
        if (localSuccess) {
          addLedgerEntry({
            delta: -(selectedDetailItem.price),
            kind: 'purchase',
            title: language === 'es' ? 'Compra en Tienda' : 'Store Purchase',
            detail: language === 'es' ? (selectedDetailItem.nameEs ?? selectedDetailItem.name) : selectedDetailItem.name,
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowDetailModal(false);
          setToastAmount(selectedDetailItem.price);
          setToastPositive(false);
          setShowPointsToast(true);
        }
      }
    },
  });

  // Equip mutation
  const equipMutation = useMutation({
    mutationFn: ({
      type,
      itemId,
    }: {
      type: 'theme' | 'frame' | 'title' | 'music' | 'avatar';
      itemId: string | null;
    }) => gamificationApi.equipItem(effectiveUserId, type, itemId),
    onSuccess: (data, variables) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const updates: Partial<typeof user> = {};
      if (variables.type === 'frame') updates.frameId = variables.itemId;
      if (variables.type === 'title') updates.titleId = variables.itemId;
      if (variables.type === 'theme') updates.themeId = variables.itemId || undefined;
      if (variables.type === 'music') updates.selectedMusicId = variables.itemId || undefined;
      if (variables.type === 'avatar') updates.avatar = variables.itemId || undefined;
      updateUser(updates);
      setShowDetailModal(false);
    },
    onError: (_, variables) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const updates: Partial<typeof user> = {};
      if (variables.type === 'frame') updates.frameId = variables.itemId;
      if (variables.type === 'title') updates.titleId = variables.itemId;
      if (variables.type === 'theme') updates.themeId = variables.itemId || undefined;
      if (variables.type === 'music') updates.selectedMusicId = variables.itemId || undefined;
      if (variables.type === 'avatar') updates.avatar = variables.itemId || undefined;
      updateUser(updates);
      setShowDetailModal(false);
    },
  });

  // Bundle purchase mutation
  const bundlePurchaseMutation = useMutation({
    mutationFn: ({ bundleId, itemIds, bundlePrice }: { bundleId: string; itemIds: string[]; bundlePrice: number }) =>
      gamificationApi.purchaseBundle(effectiveUserId, bundleId, itemIds, bundlePrice),
    onSuccess: (data) => {
      if (data.success && data.newPoints !== undefined && data.itemsAdded) {
        const newPurchasedItems = [...purchasedItems, ...data.itemsAdded.map(item => item.id)];
        updateUser({
          points: data.newPoints,
          purchasedItems: newPurchasedItems,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setToastAmount(points - data.newPoints);
        setToastPositive(false);
        setShowPointsToast(true);
      }
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const claimCollectionMutation = useMutation({
    mutationFn: (params: { collectionId: string; rewardPoints: number; ownedItemIds: string[] }) =>
      gamificationApi.claimCollection({
        userId: effectiveUserId,
        collectionId: params.collectionId,
        ownedItemIds: params.ownedItemIds,
        rewardPoints: params.rewardPoints,
      }),
    onSuccess: (data) => {
      updateUser({ points: data.newPoints });
      addLedgerEntry({
        delta: data.pointsAwarded,
        kind: 'claim',
        title: language === 'es' ? 'Colección completada' : 'Collection completed',
        detail: '',
      });
      refetchCollectionClaims();
      setToastAmount(data.pointsAwarded);
      setToastPositive(true);
      setShowPointsToast(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: Error) => {
      console.error('[Collections] Claim failed:', err.message);
    },
  });

  // Handle item press - open detail modal
  const handleItemPress = useCallback((item: typeof selectedDetailItem) => {
    if (!item) return;
    setSelectedDetailItem(item);
    setShowDetailModal(true);
    Haptics.selectionAsync();
  }, []);

  // Destructure mutation functions for stable references (eslint requirement)
  const { mutate: purchaseMutate } = purchaseMutation;
  const { mutate: equipMutate } = equipMutation;
  const { mutate: bundlePurchaseMutate } = bundlePurchaseMutation;

  // Handle bundle purchase
  const handleBundlePurchase = useCallback((bundle: typeof STORE_BUNDLES[string]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    bundlePurchaseMutate({
      bundleId: bundle.id,
      itemIds: bundle.items,
      bundlePrice: bundle.bundlePrice,
    });
  }, [bundlePurchaseMutate]);

  // Handle purchase from modal
  const handlePurchase = useCallback(() => {
    if (!selectedDetailItem) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    purchaseMutate({ itemId: selectedDetailItem.id });
  }, [selectedDetailItem, purchaseMutate]);

  // Handle equip from modal
  const handleEquip = useCallback(() => {
    if (!selectedDetailItem) return;

    equipMutate({
      type: selectedDetailItem.type as 'theme' | 'frame' | 'title' | 'music' | 'avatar',
      itemId: selectedDetailItem.id,
    });
  }, [selectedDetailItem, equipMutate]);

  // Handle weekly chest claim
  const handleChestClaim = useCallback(() => {
    // Deterministic reward based on week + userId
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    const currentWeekId = `${now.getFullYear()}-W${weekNumber}`;

    // Weighted random selection
    const totalWeight = WEEKLY_CHEST_CONFIG.possibleRewards.reduce((sum, r) => sum + r.weight, 0);
    const seed = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + weekNumber;
    // Use seeded value but pick from weighted pool
    let pick = (seed * 1664525 + 1013904223) % totalWeight;
    let reward = WEEKLY_CHEST_CONFIG.possibleRewards[0];
    for (const r of WEEKLY_CHEST_CONFIG.possibleRewards) {
      pick -= r.weight;
      if (pick <= 0) { reward = r; break; }
    }

    // Skip already-owned items - find next unowned one
    if (reward.type === 'item' && reward.itemId) {
      const itemRewards = WEEKLY_CHEST_CONFIG.possibleRewards.filter(
        r => r.type === 'item' && r.itemId && !purchasedItems.includes(r.itemId)
      );
      if (itemRewards.length > 0) {
        reward = itemRewards[seed % itemRewards.length];
      } else {
        // All items owned, give points instead
        reward = { type: 'points', value: 250, weight: 0, rarity: 'rare' };
      }
    }

    // Resolve item details for modal display
    let rewardInfo: typeof chestReward = null;
    if (reward.type === 'points' && 'value' in reward) {
      rewardInfo = { type: 'points', value: reward.value, rarity: reward.rarity };
      updateUser({ points: points + reward.value, lastWeeklyChestClaimed: currentWeekId });
      addLedgerEntry({
        delta: reward.value,
        kind: 'chest',
        title: language === 'es' ? 'Cofre Semanal' : 'Weekly Chest',
        detail: '',
      });
    } else if (reward.type === 'item' && 'itemId' in reward && reward.itemId) {
      const itemId = reward.itemId;
      // Find item details from all catalogs
      let itemName = itemId;
      let itemNameEs = itemId;
      let itemEmoji: string | undefined;
      let itemColor: string | undefined;
      let itemType: 'avatar' | 'frame' | 'title' | 'theme' | undefined;

      if (itemId.startsWith('avatar_')) {
        itemType = 'avatar';
        const av = DEFAULT_AVATARS.find(a => a.id === itemId);
        if (av) { itemName = av.name; itemNameEs = av.nameEs; itemEmoji = av.emoji; }
      } else if (itemId.startsWith('frame_')) {
        itemType = 'frame';
        const fr = AVATAR_FRAMES[itemId];
        if (fr) { itemName = fr.name; itemNameEs = fr.nameEs; itemColor = fr.color; }
      } else if (itemId.startsWith('title_')) {
        itemType = 'title';
        const ti = SPIRITUAL_TITLES[itemId];
        if (ti) { itemName = ti.name; itemNameEs = ti.nameEs; }
      } else if (itemId.startsWith('theme_')) {
        itemType = 'theme';
        const th = PURCHASABLE_THEMES[itemId];
        if (th) { itemName = th.name; itemNameEs = th.nameEs; itemColor = th.colors.primary; }
      }

      rewardInfo = {
        type: 'item',
        itemId,
        itemType,
        itemName,
        itemNameEs,
        itemEmoji,
        itemColor,
        rarity: reward.rarity,
      };
      updateUser({ purchasedItems: [...purchasedItems, itemId], lastWeeklyChestClaimed: currentWeekId });
    }

    setChestReward(rewardInfo);
    setShowChestModal(true);
  }, [userId, points, purchasedItems, updateUser, chestReward]);

  // Check item ownership and equipped status
  const getItemStatus = useCallback((itemId: string, type: string, price: number) => {
    // Check if item is chest-only (cannot be purchased, only from weekly chests)
    let isChestOnly = false;
    if (type === 'theme') isChestOnly = Boolean(PURCHASABLE_THEMES[itemId]?.chestOnly);
    if (type === 'frame') isChestOnly = Boolean(AVATAR_FRAMES[itemId]?.chestOnly);
    if (type === 'title') isChestOnly = Boolean(SPIRITUAL_TITLES[itemId]?.chestOnly);
    if (type === 'avatar') {
      const av = DEFAULT_AVATARS.find(a => a.id === itemId);
      isChestOnly = Boolean(av && (av as { chestOnly?: boolean }).chestOnly);
    }

    // Chest-only items are owned only if explicitly in purchasedItems (granted by chest)
    // Regular items are owned if in purchasedItems OR if price is 0
    let isOwned = purchasedItems.includes(itemId) || (!isChestOnly && price === 0);
    if (type === 'avatar') {
      const avatar = DEFAULT_AVATARS.find(a => a.id === itemId);
      isOwned = isOwned || Boolean(avatar && !('price' in avatar) && !isChestOnly);
    }

    let isEquipped = false;
    if (type === 'theme') isEquipped = user?.themeId === itemId;
    if (type === 'frame') isEquipped = user?.frameId === itemId;
    if (type === 'title') isEquipped = user?.titleId === itemId;
    if (type === 'avatar') isEquipped = user?.avatar === itemId;

    const canAfford = isChestOnly ? false : points >= price;

    return { isOwned, isEquipped, canAfford };
  }, [purchasedItems, user, points]);

  // Render category content
  const renderCategoryContent = () => {
    const screenWidth = Dimensions.get('window').width;

    switch (activeCategory) {
      case 'themes': {
        const allThemes = Object.values(PURCHASABLE_THEMES);
        const filteredThemes = showV2Only
          ? allThemes.filter(t => t.id.includes('_v2_') || t.id.includes('amanecer_dorado') || t.id.includes('noche_profunda') || t.id.includes('bosque_sereno') || t.id.includes('desierto_suave') || t.id.includes('promesa_violeta') || t.id.includes('cielo_gloria') || t.id.includes('mar_misericordia') || t.id.includes('fuego_espiritu') || t.id.includes('jardin_gracia') || t.id.includes('olivo_paz') || t.id.includes('trono_azul') || t.id.includes('lampara_encendida') || t.id.includes('pergamino_antiguo') || t.id.includes('luz_celestial'))
          : allThemes;

        return (
          <View>
            {/* V2 filter row */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12, gap: 8 }}>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); setShowV2Only(false); }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 7,
                  borderRadius: 99,
                  backgroundColor: !showV2Only ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: !showV2Only ? colors.primary : colors.textMuted + '30',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: !showV2Only ? '#FFFFFF' : colors.textMuted }}>
                  {language === 'es' ? 'Todos' : 'All'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); setShowV2Only(true); }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 7,
                  borderRadius: 99,
                  backgroundColor: showV2Only ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: showV2Only ? colors.primary : colors.textMuted + '30',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: showV2Only ? '#FFFFFF' : colors.textMuted }}>
                  V2 Premium
                </Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'flex-start' }}>
              {filteredThemes.map((theme, index) => {
                const { isOwned, isEquipped, canAfford } = getItemStatus(theme.id, 'theme', theme.price ?? 0);

                return (
                  <Animated.View
                    key={theme.id}
                    entering={FadeInRight.delay(index * 50).duration(300)}
                    style={{ width: '48%' }}
                  >
                    <PremiumThemeCard
                      themeData={theme}
                      isOwned={isOwned}
                      isEquipped={isEquipped}
                      canAfford={canAfford}
                      colors={colors}
                      language={language}
                      isHighlighted={pendingNavTarget?.itemId === theme.id}
                      viewRef={(ref) => {
                        if (ref) itemViewRefs.current.set(theme.id, ref as unknown as View);
                      }}
                      onPress={() => handleItemPress({
                        id: theme.id,
                        type: 'theme',
                        name: theme.name,
                        nameEs: theme.nameEs,
                        description: theme.description,
                        descriptionEs: theme.descriptionEs,
                        price: theme.price ?? 0,
                        rarity: theme.rarity,
                        colors: theme.colors,
                        chestOnly: theme.chestOnly,
                      })}
                    />
                  </Animated.View>
                );
              })}
            </View>
          </View>
        );
      }

      case 'frames': {
        const horizontalPadding = 40;
        const gap = 12;
        const numColumns = 3;
        const itemWidth = (screenWidth - horizontalPadding - (gap * (numColumns - 1))) / numColumns;

        const allFrames = Object.values(AVATAR_FRAMES);
        const filteredFrames = showV2Only
          ? allFrames.filter(f => 'isV2' in f && (f as any).isV2 === true || f.id.includes('_v2_'))
          : allFrames;

        return (
          <View>
            {/* V2 filter row */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12, gap: 8 }}>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); setShowV2Only(false); }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 7,
                  borderRadius: 99,
                  backgroundColor: !showV2Only ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: !showV2Only ? colors.primary : colors.textMuted + '30',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: !showV2Only ? '#FFFFFF' : colors.textMuted }}>
                  {language === 'es' ? 'Todos' : 'All'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); setShowV2Only(true); }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 7,
                  borderRadius: 99,
                  backgroundColor: showV2Only ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: showV2Only ? colors.primary : colors.textMuted + '30',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: showV2Only ? '#FFFFFF' : colors.textMuted }}>
                  V2 Premium
                </Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: gap, alignItems: 'flex-start' }}>
              {filteredFrames.map((frame, index) => {
                const { isOwned, isEquipped, canAfford } = getItemStatus(frame.id, 'frame', frame.price ?? 0);

                return (
                  <Animated.View
                    key={frame.id}
                    entering={FadeInRight.delay(index * 40).duration(300)}
                    style={{ width: itemWidth }}
                  >
                    <PremiumFrameCard
                      frameData={frame}
                      isOwned={isOwned}
                      isEquipped={isEquipped}
                      canAfford={canAfford}
                      colors={colors}
                      language={language}
                      isHighlighted={pendingNavTarget?.itemId === frame.id}
                      viewRef={(ref) => {
                        if (ref) itemViewRefs.current.set(frame.id, ref as unknown as View);
                      }}
                      onPress={() => handleItemPress({
                        id: frame.id,
                        type: 'frame',
                        name: frame.name,
                        nameEs: frame.nameEs,
                        description: frame.description,
                        descriptionEs: frame.descriptionEs,
                        price: frame.price ?? 0,
                        rarity: frame.rarity,
                        color: frame.color,
                        chestOnly: frame.chestOnly,
                      })}
                    />
                  </Animated.View>
                );
              })}
            </View>
          </View>
        );
      }

      case 'titles':
        return (
          <View className="px-5">
            {Object.values(SPIRITUAL_TITLES).map((title, index) => {
              const { isOwned, isEquipped, canAfford } = getItemStatus(title.id, 'title', title.price ?? 0);

              return (
                <Animated.View
                  key={title.id}
                  entering={FadeInDown.delay(index * 40).duration(300)}
                >
                  <PremiumTitleCard
                    titleData={title}
                    isOwned={isOwned}
                    isEquipped={isEquipped}
                    canAfford={canAfford}
                    colors={colors}
                    language={language}
                    isHighlighted={pendingNavTarget?.itemId === title.id}
                    viewRef={(ref) => {
                      if (ref) itemViewRefs.current.set(title.id, ref as unknown as View);
                    }}
                    onPress={() => handleItemPress({
                      id: title.id,
                      type: 'title',
                      name: title.name,
                      nameEs: title.nameEs,
                      description: title.description,
                      descriptionEs: title.descriptionEs,
                      price: title.price ?? 0,
                      rarity: title.rarity,
                      chestOnly: title.chestOnly,
                    })}
                  />
                </Animated.View>
              );
            })}
          </View>
        );

      case 'avatars': {
        const horizontalPadding = 40;
        const gap = 12;
        const numColumns = 3;
        const itemWidth = (screenWidth - horizontalPadding - (gap * (numColumns - 1))) / numColumns;

        return (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: gap, alignItems: 'flex-start' }}>
            {DEFAULT_AVATARS.map((avatar, index) => {
              const hasCost = 'price' in avatar && (avatar as { price: number }).price > 0;
              const price = hasCost ? (avatar as { price: number }).price : 0;
              const { isOwned, isEquipped, canAfford } = getItemStatus(avatar.id, 'avatar', price);

              return (
                <Animated.View
                  key={avatar.id}
                  entering={FadeInRight.delay(index * 35).duration(300)}
                  style={{ width: itemWidth }}
                >
                  <PremiumAvatarCard
                    avatar={avatar}
                    isOwned={isOwned}
                    isEquipped={isEquipped}
                    canAfford={canAfford}
                    colors={colors}
                    language={language}
                    isHighlighted={pendingNavTarget?.itemId === avatar.id}
                    viewRef={(ref) => {
                      if (ref) itemViewRefs.current.set(avatar.id, ref as unknown as View);
                    }}
                    onPress={() => handleItemPress({
                      id: avatar.id,
                      type: 'avatar',
                      name: avatar.name,
                      nameEs: avatar.nameEs,
                      description: avatar.description,
                      descriptionEs: avatar.descriptionEs,
                      price: price,
                      rarity: avatar.rarity,
                      emoji: avatar.emoji,
                      chestOnly: (avatar as { chestOnly?: boolean }).chestOnly,
                      meaning: (avatar as { meaning?: string }).meaning,
                      meaningEn: (avatar as { meaningEn?: string }).meaningEn,
                      unlockType: (avatar as { unlockType?: 'streak' | 'devotionals' | 'share' | 'store' }).unlockType,
                      unlockValue: (avatar as { unlockValue?: number }).unlockValue,
                    })}
                  />
                </Animated.View>
              );
            })}
          </View>
        );
      }

      case 'bundles':
        return (
          <View className="px-5">
            {Object.values(STORE_BUNDLES).map((bundle, index) => (
              <Animated.View
                key={bundle.id}
                entering={FadeInDown.delay(index * 60).duration(400)}
              >
                <BundleCard
                  bundle={bundle}
                  purchasedItems={purchasedItems}
                  points={points}
                  colors={colors}
                  language={language}
                  onPress={() => handleBundlePurchase(bundle)}
                  isPurchasing={bundlePurchaseMutation.isPending}
                />
              </Animated.View>
            ))}
          </View>
        );

      case 'collections':
        return (
          <View className="px-5">
            {/* ── Chapter Collections (Spiritual Paths) ── */}
            {Object.values(CHAPTER_COLLECTIONS).map((chCol, index) => (
              <Animated.View
                key={chCol.collectionId}
                entering={FadeInDown.delay(index * 60).duration(400)}
              >
                <ChapterCollectionCard
                  collection={chCol}
                  purchasedItems={purchasedItems}
                  colors={colors}
                  language={language}
                  claimedChapterIds={claimedChapterIds}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedChapterCollection(chCol);
                    setShowChapterCollectionModal(true);
                  }}
                />
              </Animated.View>
            ))}

            {/* Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8, marginBottom: 16 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.textMuted + '20' }} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, paddingHorizontal: 12, letterSpacing: 0.5 }}>
                {language === 'es' ? 'COLECCIONES LIBRES' : 'FREE COLLECTIONS'}
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.textMuted + '20' }} />
            </View>

            {/* ── Standard Collections ── */}
            {Object.values(ITEM_COLLECTIONS).map((collection, index) => (
              <Animated.View
                key={collection.id}
                entering={FadeInDown.delay((index + Object.values(CHAPTER_COLLECTIONS).length) * 60).duration(400)}
              >
                <CollectionCard
                  collection={collection}
                  purchasedItems={purchasedItems}
                  colors={colors}
                  language={language}
                  isClaimed={claimedCollectionIds.has(collection.id)}
                  isClaiming={claimCollectionMutation.isPending && claimCollectionMutation.variables?.collectionId === collection.id}
                  isNew={newClaimableIds.has(collection.id)}
                  onClaim={(ownedItemIds) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    claimCollectionMutation.mutate({
                      collectionId: collection.id,
                      rewardPoints: collection.rewardPoints,
                      ownedItemIds,
                    });
                  }}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedCollection(collection);
                    setShowCollectionDetailModal(true);
                  }}
                />
              </Animated.View>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  // Get modal item status
  const modalItemStatus = useMemo(() => {
    if (!selectedDetailItem) return { isOwned: false, isEquipped: false, canAfford: false };
    return getItemStatus(selectedDetailItem.id, selectedDetailItem.type, selectedDetailItem.price);
  }, [selectedDetailItem, getItemStatus]);

  // Navigate to the right category AND focus the exact item
  const handleNavigateToCollectionItem = useCallback((itemId: string, itemType: 'avatar' | 'frame' | 'title' | 'theme') => {
    // Close both collection modals
    setShowCollectionDetailModal(false);
    setSelectedCollection(null);
    setShowChapterCollectionModal(false);
    setSelectedChapterCollection(null);

    const categoryMap: Record<string, CategoryType> = {
      avatar: 'avatars',
      frame: 'frames',
      title: 'titles',
      theme: 'themes',
    };
    const targetCategory = categoryMap[itemType] ?? 'avatars';

    // V2-filter: disable it so the target item is always visible
    setShowV2Only(false);
    setActiveCategory(targetCategory);
    setPendingNavTarget({ itemId, itemType });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.debug('[Navigation] Targeting item', itemId, 'in', targetCategory);
  }, []);

  // Effect: once pendingNavTarget is set and the grid has rendered, scroll to the item
  // and auto-open its detail modal
  useEffect(() => {
    if (!pendingNavTarget) return;

    const { itemId, itemType } = pendingNavTarget;

    // Wait for the category grid to mount/render (two frames)
    const timer = setTimeout(() => {
      const itemView = itemViewRefs.current.get(itemId);

      if (!itemView) {
        // Fallback: item not found in rendered list — show friendly toast
        console.log('[Navigation] Item not found in rendered list:', itemId);
        setToastMessage(
          language === 'es'
            ? 'Te dejé en la sección correcta 😊'
            : 'Left you in the right section 😊'
        );
        setToastAmount(0);
        setToastPositive(true);
        setShowPointsToast(true);
        setPendingNavTarget(null);
        return;
      }

      // Use measureInWindow to get the item's screen-absolute position,
      // then convert to scroll offset using the tracked scrollView pageY and current offset.
      itemView.measureInWindow((_x, screenY) => {
        // scrollViewPageY is the screen Y of the ScrollView's top edge
        // scrollOffsetY.current is how far we've already scrolled
        const itemScrollY = screenY - scrollViewPageY.current + scrollOffsetY.current;
        const targetY = Math.max(0, itemScrollY - 140); // 140px breathing room above
        mainScrollViewRef.current?.scrollTo({ y: targetY, animated: true });
        console.log('[Navigation] Scrolled to item', itemId, 'at y=', targetY);

        // Auto-open item detail modal after scroll settles
        const detail = buildDetailFromId(itemId, itemType);
        if (detail) {
          setTimeout(() => {
            setSelectedDetailItem(detail);
            setShowDetailModal(true);
          }, 320);
        }

        // Clear target after highlight animation completes
        setTimeout(() => setPendingNavTarget(null), 1800);
      });
    }, 380);

    return () => clearTimeout(timer);
  }, [pendingNavTarget, language]);

  // Build a detail item object from an itemId + itemType (used for auto-open)
  const buildDetailFromId = useCallback((
    itemId: string,
    itemType: 'avatar' | 'frame' | 'title' | 'theme'
  ) => {
    if (itemType === 'theme') {
      const th = PURCHASABLE_THEMES[itemId];
      if (!th) return null;
      return {
        id: th.id, type: 'theme' as const,
        name: th.name, nameEs: th.nameEs,
        description: th.description, descriptionEs: th.descriptionEs,
        price: th.price ?? 0, rarity: th.rarity,
        colors: th.colors, chestOnly: th.chestOnly,
      };
    }
    if (itemType === 'frame') {
      const fr = AVATAR_FRAMES[itemId];
      if (!fr) return null;
      return {
        id: fr.id, type: 'frame' as const,
        name: fr.name, nameEs: fr.nameEs,
        description: fr.description, descriptionEs: fr.descriptionEs,
        price: fr.price ?? 0, rarity: fr.rarity,
        color: fr.color, chestOnly: fr.chestOnly,
      };
    }
    if (itemType === 'title') {
      const ti = SPIRITUAL_TITLES[itemId];
      if (!ti) return null;
      return {
        id: ti.id, type: 'title' as const,
        name: ti.name, nameEs: ti.nameEs,
        description: ti.description, descriptionEs: ti.descriptionEs,
        price: ti.price ?? 0, rarity: ti.rarity,
        chestOnly: ti.chestOnly,
      };
    }
    if (itemType === 'avatar') {
      const av = DEFAULT_AVATARS.find(a => a.id === itemId);
      if (!av) return null;
      const price = 'price' in av ? (av as { price: number }).price : 0;
      return {
        id: av.id, type: 'avatar' as const,
        name: av.name, nameEs: av.nameEs,
        description: av.description, descriptionEs: av.descriptionEs,
        price, rarity: av.rarity,
        emoji: av.emoji,
        chestOnly: (av as { chestOnly?: boolean }).chestOnly,
        meaning: (av as { meaning?: string }).meaning,
        meaningEn: (av as { meaningEn?: string }).meaningEn,
        unlockType: (av as { unlockType?: 'streak' | 'devotionals' | 'share' | 'store' }).unlockType,
        unlockValue: (av as { unlockValue?: number }).unlockValue,
      };
    }
    return null;
  }, []);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <PointsToast
        amount={toastAmount}
        visible={showPointsToast}
        onHide={() => { setShowPointsToast(false); setToastMessage(undefined); }}
        isPositive={toastPositive}
        message={toastMessage}
      />

      <ScrollView
        ref={mainScrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        scrollEventThrottle={16}
        onScroll={(e) => { scrollOffsetY.current = e.nativeEvent.contentOffset.y; }}
        onLayout={() => {
          // Capture the ScrollView's screen-Y once it's laid out
          (mainScrollViewRef.current as any)?.measureInWindow(
            (_x: number, y: number) => { scrollViewPageY.current = y; }
          );
        }}
      >
        {/* Header */}
        <View className="px-5 pb-4" style={{ paddingTop: insets.top + 16 }}>
          <Text
            className="text-3xl font-bold"
            style={{ color: colors.text }}
          >
            {t.store}
          </Text>
        </View>

        {/* Profile Header */}
        <ProfileHeader
          colors={colors}
          user={user}
          points={points}
          language={language}
        />

        {/* Weekly Chest */}
        {effectiveUserId && (
          <WeeklyChestCard
            colors={colors}
            language={language}
            userId={effectiveUserId}
            allChallengesComplete={allChallengesComplete}
            onClaim={handleChestClaim}
          />
        )}

        {/* Weekly Challenges */}
        {effectiveUserId && (
          <WeeklyChallengesCard
            colors={colors}
            language={language}
            userId={effectiveUserId}
            onAllComplete={setAllChallengesComplete}
          />
        )}

        {/* Promo Code Redemption */}
        {effectiveUserId && (
          <PromoCodeCard
            colors={colors}
            language={language}
            userId={effectiveUserId}
            onSuccess={(pointsAwarded) => {
              updateUser({ points: points + pointsAwarded });
              addLedgerEntry({
                delta: pointsAwarded,
                kind: 'promo_code',
                title: language === 'es' ? 'Código promocional' : 'Promo code',
                detail: '',
              });
              setToastAmount(pointsAwarded);
              setToastPositive(true);
              setShowPointsToast(true);
            }}
          />
        )}

        {/* Category Tabs */}
        <View className="mb-5">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            style={{ flexGrow: 0 }}
          >
            {CATEGORIES.map((category) => (
              <CategoryTab
                key={category.key}
                category={category}
                isActive={activeCategory === category.key}
                colors={colors}
                language={language}
                badgeCount={category.key === 'collections' ? pendingClaimsCount + chapterPendingCount : 0}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveCategory(category.key);
                  setShowV2Only(false);
                  if (category.key === 'collections') {
                    markClaimablesSeen();
                  }
                }}
              />
            ))}
          </ScrollView>
        </View>

        {/* Category Content */}
        {renderCategoryContent()}
      </ScrollView>

      {/* Item Detail Modal */}
      <ItemDetailModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        item={selectedDetailItem}
        colors={colors}
        language={language}
        isOwned={modalItemStatus.isOwned}
        isEquipped={modalItemStatus.isEquipped}
        canAfford={modalItemStatus.canAfford}
        onPurchase={handlePurchase}
        onEquip={handleEquip}
        isPurchasing={purchaseMutation.isPending}
      />

      {/* Chest Reward Modal */}
      <ChestRewardModal
        visible={showChestModal}
        reward={chestReward}
        language={language}
        colors={colors}
        onClose={() => setShowChestModal(false)}
      />

      {/* Collection Detail Modal */}
      <CollectionDetailModal
        visible={showCollectionDetailModal}
        collection={selectedCollection}
        purchasedItems={purchasedItems}
        colors={colors}
        language={language}
        isClaimed={selectedCollection ? claimedCollectionIds.has(selectedCollection.id) : false}
        isClaiming={
          claimCollectionMutation.isPending &&
          claimCollectionMutation.variables?.collectionId === selectedCollection?.id
        }
        onClaim={(ownedItemIds) => {
          if (!selectedCollection) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          claimCollectionMutation.mutate({
            collectionId: selectedCollection.id,
            rewardPoints: selectedCollection.rewardPoints,
            ownedItemIds,
          });
        }}
        onClose={() => {
          setShowCollectionDetailModal(false);
          setSelectedCollection(null);
        }}
        onNavigateToItem={handleNavigateToCollectionItem}
      />

      {/* Chapter Collection Modal */}
      <ChapterCollectionModal
        visible={showChapterCollectionModal}
        collection={selectedChapterCollection}
        purchasedItems={purchasedItems}
        colors={colors}
        language={language}
        claimedChapterIds={claimedChapterIds}
        onClaimChapter={async (chapterId, points) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await claimChapter(chapterId, selectedChapterCollection?.collectionId ?? '');
          updateUser({ points: (user?.points ?? 0) + points });
          addLedgerEntry({
            delta: points,
            kind: 'claim',
            title: language === 'es' ? 'Capítulo completado' : 'Chapter completed',
            detail: selectedChapterCollection
              ? (language === 'es' ? selectedChapterCollection.nameEs : selectedChapterCollection.nameEn)
              : '',
          });
          setToastAmount(points);
          setToastPositive(true);
          setToastMessage(language === 'es' ? '¡Capítulo completado! Has avanzado en tu camino espiritual.' : 'Chapter completed! You have advanced on your spiritual path.');
          setShowPointsToast(true);
        }}
        onClose={() => {
          setShowChapterCollectionModal(false);
          setSelectedChapterCollection(null);
        }}
        onNavigateToItem={handleNavigateToCollectionItem}
      />
    </View>
  );
}
