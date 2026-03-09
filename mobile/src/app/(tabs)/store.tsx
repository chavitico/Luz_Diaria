// Store Screen - Premium Gamification Hub with Collections, Bundles & Weekly Chest

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  InteractionManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withRepeat,
  withDelay,
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
  ChevronLeft,
  Sparkles,
  Star,
  Gem,
  ShoppingBag,
  Ticket,
  Info,
  BookOpen,
} from 'lucide-react-native';
import { TextInput } from 'react-native';
import { BIBLICAL_CARDS } from '@/lib/biblical-cards';
import { preloadCardImages } from '@/lib/card-image-preload';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  useThemeColors,
  useLanguage,
  useUserPoints,
  useUser,
  useAppStore,
  useRequestPackReveal,
} from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import { ActionButton } from '@/components/ui/ActionButton';
import { GiftSendModal, type GiftSendItem } from '@/components/GiftSendModal';
import { CardRevealModal } from '@/components/CardRevealModal';
import { PackOpeningModal } from '@/components/PackOpeningModal';
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
  const { sFont } = useScaledFont();
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
        <Text style={{ fontSize: sFont(6), color: active ? '#fff' : color, opacity: opacity }}>★</Text>
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
  Season,
} from '@/lib/gamification-api';

type CategoryType = 'themes' | 'frames' | 'titles' | 'avatars' | 'bundles' | 'collections' | 'adventures' | 'tokens';

type CategoryIconComponent = (props: { color: string; active: boolean }) => React.ReactElement;

function IconAventuras({ color, active }: { color: string; active: boolean }) {
  const opacity = active ? 1 : 0.75;
  return (
    <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center', opacity }}>
      <BookOpen size={20} color={active ? '#fff' : color} />
    </View>
  );
}

function IconTokens({ color, active }: { color: string; active: boolean }) {
  const { sFont } = useScaledFont();
  const opacity = active ? 1 : 0.75;
  return (
    <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center', opacity }}>
      <Text style={{ fontSize: sFont(18), opacity }}>🖌️</Text>
    </View>
  );
}

const CATEGORIES: { key: CategoryType; IconComponent: CategoryIconComponent; label: string; labelEs: string; desc: string; descEs: string }[] = [
  { key: 'adventures', IconComponent: IconAventuras, label: 'Biblical Adventures', labelEs: 'Aventuras Bíblicas', desc: 'Collect rewards from biblical stories', descEs: 'Colecciona recompensas de historias bíblicas' },
  { key: 'collections', IconComponent: IconColecciones, label: 'Collections', labelEs: 'Colecciones', desc: 'Spiritual adventures that unlock step by step', descEs: 'Aventuras espirituales que se desbloquean paso a paso' },
  { key: 'themes', IconComponent: IconTemas, label: 'Themes', labelEs: 'Temas', desc: 'Change the visual appearance of the app', descEs: 'Cambia la apariencia visual de la app' },
  { key: 'avatars', IconComponent: IconAvatares, label: 'Avatars', labelEs: 'Avatares', desc: 'Customize your profile', descEs: 'Personaliza tu perfil' },
  { key: 'titles', IconComponent: IconTitulos, label: 'Titles', labelEs: 'Títulos', desc: 'Badges that show your progress', descEs: 'Insignias que muestran tu progreso' },
  { key: 'frames', IconComponent: IconMarcos, label: 'Frames', labelEs: 'Marcos', desc: 'Decorations for your devotionals', descEs: 'Decoraciones para tus devocionales' },
  { key: 'bundles', IconComponent: IconPaquetes, label: 'Bundles', labelEs: 'Paquetes', desc: 'Special content and rewards', descEs: 'Contenido especial y recompensas' },
  { key: 'tokens', IconComponent: IconTokens, label: 'Special Objects', labelEs: 'Objetos Especiales', desc: 'Special one-time use items', descEs: 'Ítems especiales de uso único' },
];

// ─── Seasonal Items Section Banner ────────────────────────────────────────────
function SeasonalItemsSection({
  items,
  season,
  purchasedItems,
  points,
  colors,
  language,
  onPress,
}: {
  items: StoreItem[];
  season: Season;
  purchasedItems: string[];
  points: number;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: (item: StoreItem) => void;
}) {
  const { sFont } = useScaledFont();
  if (items.length === 0) return null;
  const accent = season.accentColor || '#7A1F1F';

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={{ marginBottom: 12 }}>
      {/* Section header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingHorizontal: 20, gap: 8 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: accent + '40' }} />
        <Text style={{ fontSize: sFont(10), fontWeight: '800', color: accent, letterSpacing: 0.7 }}>
          {language === 'es' ? `✝ ${season.name.toUpperCase()}` : `✝ ${season.name.toUpperCase()}`}
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: accent + '40' }} />
      </View>

      {/* Items horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 10, flexDirection: 'row', paddingBottom: 4 }}
      >
        {items.map((item) => {
          const isOwned = purchasedItems.includes(item.id);
          const canAfford = item.pricePoints === 0 || points >= item.pricePoints;
          const meta = (() => { try { return JSON.parse(item.metadata); } catch { return {}; } })();
          const emoji = meta?.emoji || (item.type === 'frame' ? '🪟' : item.type === 'title' ? '📜' : '✝️');

          return (
            <Pressable
              key={item.id}
              onPress={() => onPress(item)}
              style={{
                width: 90,
                borderRadius: 16,
                overflow: 'hidden',
                borderWidth: 1.5,
                borderColor: isOwned ? '#4CAF50' : accent + '80',
              }}
            >
              <LinearGradient
                colors={[accent + '33', '#0D0500']}
                style={{ padding: 10, alignItems: 'center', gap: 4 }}
              >
                <Text style={{ fontSize: sFont(28) }}>{emoji}</Text>
                <Text style={{ fontSize: sFont(10), fontWeight: '700', color: '#FFFFFF', textAlign: 'center', lineHeight: 13 }} numberOfLines={2}>
                  {language === 'es' ? item.nameEs : item.nameEn}
                </Text>
                {item.badge && (
                  <Text style={{ fontSize: sFont(8), color: accent, fontWeight: '700' }}>{item.badge}</Text>
                )}
                {isOwned ? (
                  <View style={{ backgroundColor: '#4CAF5033', borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontSize: sFont(8), fontWeight: '700', color: '#4CAF50' }}>
                      {language === 'es' ? 'Tuyo' : 'Owned'}
                    </Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Coins size={9} color={canAfford ? '#FFD700' : '#888'} />
                    <Text style={{ fontSize: sFont(9), color: canAfford ? '#FFD700' : '#888', fontWeight: '600' }}>
                      {item.pricePoints === 0 ? (language === 'es' ? 'Bundle' : 'Bundle') : item.pricePoints.toLocaleString()}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </Pressable>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({
  emoji,
  title,
  subtitle,
  gradientColors,
  borderColor,
  accentGlowColor,
  onPress,
  badgeCount,
  showNewBadge,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  gradientColors: [string, string, string];
  borderColor: string;
  accentGlowColor: string;
  onPress: () => void;
  badgeCount?: number;
  showNewBadge?: boolean;
}) {
  const { sFont } = useScaledFont();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const badgePulse = useSharedValue(1);
  const newBadgeOpacity = useSharedValue(1);

  React.useEffect(() => {
    if (badgeCount && badgeCount > 0) {
      badgePulse.value = withRepeat(
        withSequence(
          withSpring(1.2, { damping: 4, stiffness: 200 }),
          withSpring(1, { damping: 6, stiffness: 180 }),
        ),
        -1,
        false,
      );
    } else {
      badgePulse.value = 1;
    }
  }, [badgeCount]);

  React.useEffect(() => {
    if (showNewBadge) {
      newBadgeOpacity.value = withRepeat(
        withSequence(
          withTiming(0.2, { duration: 600 }),
          withTiming(1, { duration: 600 }),
        ),
        -1,
        false,
      );
    } else {
      newBadgeOpacity.value = 1;
    }
  }, [showNewBadge]);

  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badgePulse.value }] }));
  const newBadgeStyle = useAnimatedStyle(() => ({ opacity: newBadgeOpacity.value }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, padding: 20, borderWidth: 1, borderColor, overflow: 'hidden' }}
        >
          <LinearGradient
            colors={[accentGlowColor, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ position: 'relative' }}>
              <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: accentGlowColor, borderWidth: 1, borderColor, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 26 }}>{emoji}</Text>
              </View>
              {badgeCount !== undefined && badgeCount > 0 && (
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      minWidth: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: '#FF3B30',
                      borderWidth: 2,
                      borderColor: '#0E0900',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 4,
                    },
                    badgeStyle,
                  ]}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF', lineHeight: 14 }}>
                    {badgeCount > 9 ? '9+' : String(badgeCount)}
                  </Text>
                </Animated.View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <Text style={{ fontSize: sFont(18), fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 }}>
                  {title}
                </Text>
                {showNewBadge && (
                  <Animated.View
                    style={[
                      {
                        backgroundColor: '#FF3B30',
                        borderRadius: 6,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                      },
                      newBadgeStyle,
                    ]}
                  >
                    <Text style={{ fontSize: 9, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.8 }}>
                      NOVEDAD
                    </Text>
                  </Animated.View>
                )}
              </View>
              <Text style={{ fontSize: sFont(13), color: 'rgba(255,255,255,0.60)', fontWeight: '500' }}>
                {subtitle}
              </Text>
            </View>
            <ChevronRight size={20} color="rgba(255,255,255,0.35)" />
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ─── Season Banner Component ──────────────────────────────────────────────────
function SeasonBanner({ season, language, onPress }: { season: Season; language: 'en' | 'es'; onPress?: () => void }) {
  const { sFont } = useScaledFont();
  const accent = season.accentColor || '#7A1F1F';
  const accentLight = accent + 'CC';
  const accentDim = accent + '33';

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        entering={FadeInDown.duration(500)}
        style={{ marginHorizontal: 20, marginBottom: 16 }}
      >
        {/* Special luminous outer border — gradient glow ring */}
        <LinearGradient
          colors={[accent, accentLight, '#FFD700CC', accentLight, accent + '88']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 22,
            padding: 2,
            shadowColor: accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 18,
            elevation: 10,
          }}
        >
          {/* Inner faint sheen ring */}
          <LinearGradient
            colors={['rgba(255,255,255,0.18)', 'transparent', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 21, padding: 1 }}
          >
            <LinearGradient
              colors={[accent, '#1A0A0A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 18, borderRadius: 20, overflow: 'hidden' }}
            >
              {/* Bright shimmer highlight at top edge */}
              <View style={{
                position: 'absolute',
                top: 0,
                left: 24,
                right: 24,
                height: 1.5,
                backgroundColor: 'rgba(255,255,255,0.35)',
                borderRadius: 99,
              }} />

              {/* Top: event type label */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 }}>
                <View style={{
                  backgroundColor: accentDim,
                  borderWidth: 1,
                  borderColor: accentLight,
                  borderRadius: 99,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                }}>
                  <Text style={{ fontSize: sFont(10), fontWeight: '800', color: '#FFFFFF', letterSpacing: 1, textTransform: 'uppercase' }}>
                    {language === 'es' ? '✝ Evento de Temporada' : '✝ Season Event'}
                  </Text>
                </View>
              </View>

              {/* Main title */}
              <Text style={{
                fontSize: sFont(22),
                fontWeight: '800',
                color: '#FFFFFF',
                letterSpacing: -0.3,
                marginBottom: 4,
                textShadowColor: 'rgba(0,0,0,0.5)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
              }}>
                {season.bannerTitle}
              </Text>

              {/* Description */}
              <Text style={{ fontSize: sFont(13), color: 'rgba(255,255,255,0.80)', lineHeight: 18, fontWeight: '400', marginBottom: 12 }}>
                {season.bannerDescription}
              </Text>

              {/* Bottom: dates */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FFFFFF', opacity: 0.7 }} />
                <Text style={{ fontSize: sFont(11), color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>
                  {new Date(season.startDate).toLocaleDateString(language === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric' })}
                  {' — '}
                  {new Date(season.endDate).toLocaleDateString(language === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </LinearGradient>
          </LinearGradient>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

// ─── Launch Event Banner ──────────────────────────────────────────────────────
// Shown permanently when NO active season is present.
function LaunchEventBanner({
  language,
  colors,
  onPress,
}: {
  language: 'en' | 'es';
  colors: ReturnType<typeof useThemeColors>;
  onPress: () => void;
}) {
  const { sFont } = useScaledFont();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // Deep forest-green gradient — distinct from red season banner
  const G1 = '#1B3A2B';
  const G2 = '#0D1F17';
  const ACCENT = '#4A7D5E';

  return (
    <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
      <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        {/* Special luminous event border */}
        <LinearGradient
          colors={['#4A7D5EDD', '#7EC8A0CC', '#FFD700AA', '#7EC8A0CC', '#4A7D5EDD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 24,
            padding: 2,
            shadowColor: '#4A7D5E',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.75,
            shadowRadius: 18,
            elevation: 10,
          }}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.15)', 'transparent', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 23, padding: 1 }}
          >
            <LinearGradient
              colors={[G1, G2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 22, padding: 20, overflow: 'hidden' }}
            >
              {/* Shimmer highlight */}
              <View style={{
                position: 'absolute',
                top: 0,
                left: 24,
                right: 24,
                height: 1.5,
                backgroundColor: 'rgba(255,255,255,0.28)',
                borderRadius: 99,
              }} />

              {/* Badge */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                <View style={{
                  backgroundColor: ACCENT + '33',
                  borderWidth: 1,
                  borderColor: ACCENT + 'AA',
                  borderRadius: 99,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                }}>
                  <Text style={{ fontSize: sFont(10), fontWeight: '800', color: '#FFFFFF', letterSpacing: 1, textTransform: 'uppercase' }}>
                    ✨ {language === 'es' ? 'Evento de Lanzamiento' : 'Launch Event'}
                  </Text>
                </View>
              </View>

              {/* Title */}
              <Text style={{
                fontSize: sFont(22),
                fontWeight: '800',
                color: '#FFFFFF',
                letterSpacing: -0.3,
                marginBottom: 6,
                textShadowColor: 'rgba(0,0,0,0.4)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
              }}>
                {language === 'es' ? 'Camino del Crecimiento' : 'Growth Path'}
              </Text>

              {/* Description */}
              <Text style={{ fontSize: sFont(13), color: 'rgba(255,255,255,0.75)', lineHeight: 18, marginBottom: 16 }}>
                {language === 'es'
                  ? 'La fe que siembras hoy dará fruto mañana.'
                  : 'The faith you plant today will bear fruit tomorrow.'}
              </Text>

              {/* Items preview: emojis */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                {['🌱', '🍇', '🌿', '👑', '🕊️'].map((emoji, i) => (
                  <View key={i} style={{
                    width: 32, height: 32, borderRadius: 16,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: sFont(16) }}>{emoji}</Text>
                  </View>
                ))}
                <Text style={{ fontSize: sFont(11), color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>
                  5 {language === 'es' ? 'recompensas' : 'rewards'}
                </Text>
              </View>

              {/* CTA */}
              <View style={{
                backgroundColor: ACCENT,
                borderRadius: 99,
                paddingHorizontal: 20,
                paddingVertical: 10,
                alignSelf: 'flex-start',
              }}>
                <Text style={{ fontSize: sFont(14), fontWeight: '700', color: '#FFFFFF' }}>
                  {language === 'es' ? 'Ver paquetes' : 'View packages'}
                </Text>
              </View>
            </LinearGradient>
          </LinearGradient>
        </LinearGradient>
      </Pressable>
    </Animated.View>
    </View>
  );
}

// ─── Seasonal Adventure Card ──────────────────────────────────────────────────
function SeasonalAdventureCard({
  item,
  season,
  purchasedItems,
  points,
  colors,
  language,
  onPress,
}: {
  item: StoreItem;
  season: Season;
  purchasedItems: string[];
  points: number;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
}) {
  const { sFont } = useScaledFont();
  const scale = useSharedValue(1);
  const accent = season.accentColor || '#7A1F1F';
  const canAfford = points >= item.pricePoints;
  const meta = (() => {
    try { return JSON.parse(item.metadata); } catch { return {}; }
  })();
  const rewardCount = Array.isArray(meta?.rewards) ? meta.rewards.length : 3;
  const isOwned = purchasedItems.includes(item.id);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={{ marginBottom: 16 }}>
      <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        <LinearGradient
          colors={[accent + 'EE', '#1A0A0A', '#0D0500']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, padding: 20, overflow: 'hidden' }}
        >
          {/* Season badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.25)',
              borderRadius: 99,
              paddingHorizontal: 10,
              paddingVertical: 3,
            }}>
              <Text style={{ fontSize: sFont(10), fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                {item.badge || '✝ ' + season.name}
              </Text>
            </View>
            {item.isNew && (
              <View style={{
                backgroundColor: '#FFD70033',
                borderWidth: 1,
                borderColor: '#FFD700',
                borderRadius: 99,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}>
                <Text style={{ fontSize: sFont(9), fontWeight: '800', color: '#FFD700', letterSpacing: 0.5 }}>NUEVO</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={{
            fontSize: sFont(24),
            fontWeight: '800',
            color: '#FFFFFF',
            marginBottom: 6,
            letterSpacing: -0.5,
          }}>
            {language === 'es' ? item.nameEs : item.nameEn}
          </Text>

          {/* Description */}
          <Text style={{
            fontSize: sFont(13),
            color: 'rgba(255,255,255,0.75)',
            lineHeight: 18,
            marginBottom: 16,
          }}>
            {language === 'es' ? item.descriptionEs : item.descriptionEn}
          </Text>

          {/* Rewards indicator */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <Gift size={14} color="rgba(255,255,255,0.6)" />
            <Text style={{ fontSize: sFont(12), color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>
              {rewardCount} {language === 'es' ? 'recompensas incluidas' : 'rewards included'}
            </Text>
          </View>

          {/* CTA row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Coins size={18} color={isOwned ? '#4CAF50' : canAfford ? '#FFD700' : '#888'} />
              {isOwned ? (
                <Text style={{ fontSize: sFont(16), fontWeight: '800', color: '#4CAF50' }}>
                  {language === 'es' ? 'Adquirido' : 'Owned'}
                </Text>
              ) : (
                <Text style={{ fontSize: sFont(18), fontWeight: '800', color: canAfford ? '#FFD700' : '#888' }}>
                  {item.pricePoints.toLocaleString()}
                </Text>
              )}
            </View>
            {!isOwned && (
              <View style={{
                backgroundColor: canAfford ? accent : '#333',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 99,
              }}>
                <Text style={{ fontSize: sFont(14), fontWeight: '700', color: '#FFFFFF' }}>
                  {canAfford
                    ? (language === 'es' ? 'Obtener' : 'Get')
                    : (language === 'es' ? 'Sin puntos' : 'Need points')}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
    </View>
  );
}

// ─── Bundle Sort Utility ─────────────────────────────────────────────────────
// Sorting rules for STORE_BUNDLES entries:
//   1. Season-active bundles (seasonId in activeSeasonIds) — first
//   2. Incomplete/not-owned bundles — before completed
//   3. Within each group: newest releasedAt DESC, then id ASC (stable)
//   4. comingSoon is treated same as incomplete (shows UI blocked)

function sortBundlesForUser(
  bundles: typeof STORE_BUNDLES[string][],
  ownedItemIds: string[],
  activeSeasonIds: string[],
  devLog = false
): typeof STORE_BUNDLES[string][] {
  type Scored = {
    bundle: typeof STORE_BUNDLES[string];
    isSeasonActive: boolean;
    isLaunch: boolean;
    isIncomplete: boolean;
    releasedMs: number;
  };

  const scored: Scored[] = bundles.map((b) => {
    const meta = (() => { try { return JSON.parse((b as any).metadata ?? '{}'); } catch { return {}; } })();
    const bundleSeasonId: string | undefined = (b as any).seasonId ?? meta?.seasonId;
    const isSeasonActive = bundleSeasonId ? activeSeasonIds.includes(bundleSeasonId) : false;
    const isLaunch = !!(b as any).isLaunchEvent;

    // A bundle is "incomplete" if the user doesn't own ALL items
    const allItems: string[] = b.items ?? [];
    const ownsAll = allItems.length > 0 && allItems.every((id) => ownedItemIds.includes(id));
    const isIncomplete = !ownsAll || (b as any).comingSoon === true;

    // releasedAt: from meta or item field or fallback to 0 (oldest)
    const releasedMs =
      (b as any).releasedAt instanceof Date
        ? ((b as any).releasedAt as Date).getTime()
        : typeof (b as any).releasedAt === 'string'
        ? new Date((b as any).releasedAt).getTime()
        : 0;

    return { bundle: b, isSeasonActive, isLaunch, isIncomplete, releasedMs };
  });

  scored.sort((a, b) => {
    // 1. Season-active bundles first
    if (a.isSeasonActive !== b.isSeasonActive) return a.isSeasonActive ? -1 : 1;
    // 2. Launch event bundle second (permanent featured)
    if (a.isLaunch !== b.isLaunch) return a.isLaunch ? -1 : 1;
    // 3. Incomplete/not-owned before completed
    if (a.isIncomplete !== b.isIncomplete) return a.isIncomplete ? -1 : 1;
    // 4. Newest releasedAt first within same group
    if (b.releasedMs !== a.releasedMs) return b.releasedMs - a.releasedMs;
    // 5. Stable tie-break by id
    return a.bundle.id < b.bundle.id ? -1 : 1;
  });

  if (__DEV__ && devLog) {
    const activeCount = scored.filter((s) => s.isSeasonActive).length;
    const launchCount = scored.filter((s) => s.isLaunch).length;
    const incompleteCount = scored.filter((s) => s.isIncomplete).length;
    const top5 = scored.slice(0, 5).map((s) => ({
      id: s.bundle.id,
      seasonActive: s.isSeasonActive,
      launch: s.isLaunch,
      incomplete: s.isIncomplete,
      releasedAt: s.releasedMs ? new Date(s.releasedMs).toISOString().slice(0, 10) : 'none',
    }));
    console.log(
      `[BundleSort] total=${scored.length} seasonActive=${activeCount} launch=${launchCount} incomplete=${incompleteCount}`,
      '\n[BundleSort] top5:', JSON.stringify(top5)
    );
  }

  return scored.map((s) => s.bundle);
}

// Get rarity icon
function RarityIcon({ rarity, size = 12 }: { rarity: string; size?: number }) {
  const color = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  if (rarity === 'epic') return <Gem size={size} color={color} />;
  if (rarity === 'rare') return <Star size={size} color={color} />;
  return null;
}

// Rarity Badge Component
function RarityBadge({ rarity, language }: { rarity: string; language: 'en' | 'es' }) {
  const { sFont } = useScaledFont();
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
      <Text style={{ fontSize: sFont(10), fontWeight: '600', color, textTransform: 'capitalize' }}>
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
  const { sFont } = useScaledFont();
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
      style={{
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 24,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
        elevation: 8,
      }}
    >
      {/* Outer glow border */}
      <LinearGradient
        colors={[colors.primary + '55', colors.primary + '11', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 1.5 }}
      >
        <LinearGradient
          colors={['#1C1008', '#120B04', '#0E0700']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 23, overflow: 'hidden' }}
        >
          {/* Inner accent glow */}
          <LinearGradient
            colors={[colors.primary + '22', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          <View style={{ padding: 20 }}>
            {/* Identity row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              {/* Avatar with elevated ring */}
              <View style={{ marginRight: 14 }}>
                {/* Outer ring glow */}
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: frameColor + '22',
                  shadowColor: frameColor,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.6,
                  shadowRadius: 12,
                }}>
                  <View style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#1A0F05',
                    borderWidth: 2.5,
                    borderColor: frameColor,
                  }}>
                    <Text style={{ fontSize: sFont(34) }}>{avatarEmoji}</Text>
                  </View>
                </View>
              </View>

              {/* Name + Title */}
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: sFont(20),
                  fontWeight: '800',
                  color: '#FFFFFF',
                  letterSpacing: -0.3,
                  marginBottom: 3,
                }}>
                  {user?.nickname || 'Pilgrim'}
                </Text>
                <View style={{
                  alignSelf: 'flex-start',
                  backgroundColor: colors.primary + '20',
                  borderWidth: 1,
                  borderColor: colors.primary + '50',
                  borderRadius: 99,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                }}>
                  <Text style={{
                    fontSize: sFont(11),
                    fontWeight: '600',
                    color: colors.primary,
                    fontStyle: 'italic',
                  }} numberOfLines={1}>
                    {equippedTitle}
                  </Text>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 16 }} />

            {/* Stats chips row */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {/* Points chip */}
              <LinearGradient
                colors={[colors.primary + '30', colors.primary + '10']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 10,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.primary + '35',
                  gap: 6,
                }}
              >
                <Coins size={16} color={colors.primary} />
                <Text style={{ fontSize: sFont(17), fontWeight: '800', color: colors.primary }}>
                  {points}
                </Text>
                <Text style={{ fontSize: sFont(11), fontWeight: '500', color: colors.primary + 'AA' }}>
                  {language === 'es' ? 'pts' : 'pts'}
                </Text>
              </LinearGradient>

              {/* Streak chip */}
              <LinearGradient
                colors={['#F9731625', '#F9731608']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 10,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#F9731635',
                  gap: 6,
                }}
              >
                <Flame size={16} color="#F97316" />
                <Text style={{ fontSize: sFont(17), fontWeight: '800', color: '#F97316' }}>
                  {user?.streakCurrent || 0}
                </Text>
                <Text style={{ fontSize: sFont(11), fontWeight: '500', color: '#F9731680' }}>
                  {language === 'es' ? 'días' : 'days'}
                </Text>
              </LinearGradient>
            </View>
          </View>
        </LinearGradient>
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
  const { sFont } = useScaledFont();
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
                <Text style={{ color: rarityColor, fontSize: sFont(11), fontWeight: '700', letterSpacing: 1.5 }}>
                  {language === 'es' ? '✦ EXCLUSIVO DEL COFRE ✦' : '✦ CHEST EXCLUSIVE ✦'}
                </Text>
              </View>
            )}

            {/* Chest icon */}
            <Animated.View style={[{ marginBottom: 20 }, chestStyle]}>
              <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: rarityColor + '25', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: rarityColor + '60' }}>
                <Text style={{ fontSize: sFont(52) }}>🎁</Text>
              </View>
            </Animated.View>

            {/* Prize */}
            {reward?.type === 'item' ? (
              <>
                {/* Item type label */}
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: sFont(11), fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>
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
                  <Text style={{ fontSize: sFont(56), marginBottom: 12 }}>{reward.itemEmoji}</Text>
                ) : reward.itemColor ? (
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: reward.itemColor, marginBottom: 12, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' }} />
                ) : null}
                <Text style={{ color: '#FFFFFF', fontSize: sFont(22), fontWeight: '800', textAlign: 'center', marginBottom: 6 }}>
                  {displayName}
                </Text>
                <View style={{ backgroundColor: rarityColor + '30', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 4 }}>
                  <Text style={{ color: rarityColor, fontSize: sFont(12), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {reward.rarity}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: sFont(13), marginBottom: 8 }}>
                  {language === 'es' ? 'Has ganado' : 'You earned'}
                </Text>
                <Text style={{ color: '#FCD34D', fontSize: sFont(52), fontWeight: '900', marginBottom: 8 }}>
                  +{reward?.value}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: sFont(18), fontWeight: '600' }}>
                  {language === 'es' ? 'puntos' : 'points'}
                </Text>
              </>
            )}

            {/* Close button */}
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onClose(); }}
              style={{ marginTop: 28, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, paddingHorizontal: 40, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: sFont(16), fontWeight: '700' }}>
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
  const [showInfo, setShowInfo] = useState(false);
  const user = useUser();
  const lastChestClaimed = user?.lastWeeklyChestClaimed;

  // Get current week ID — matches backend format (zero-padded, e.g. "2026-W09")
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  const currentWeekId = `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;

  const alreadyClaimed = lastChestClaimed === currentWeekId;
  const canClaim = allChallengesComplete && !alreadyClaimed;

  if (!allChallengesComplete && !alreadyClaimed) return null;

  return (
    <>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowInfo(true);
        }}
      >
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
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Text
                    className="text-base font-bold"
                    style={{ color: colors.text }}
                  >
                    {language === 'es' ? 'Cofre Semanal' : 'Weekly Chest'}
                  </Text>
                  <Info size={14} color={colors.textMuted} />
                </View>
                <Text
                  className="text-xs mt-1"
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
                  onPress={(e) => {
                    e.stopPropagation?.();
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
      </Pressable>

      {/* Chest Info Modal */}
      <Modal
        visible={showInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfo(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 }}
          onPress={() => setShowInfo(false)}
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
                style={{ backgroundColor: '#A855F7' + '20' }}
              >
                <Gift size={22} color="#A855F7" />
              </View>
              <View className="flex-1 mr-2">
                <Text className="text-base font-bold mb-0.5" style={{ color: colors.text }}>
                  {language === 'es' ? 'Cofre Semanal' : 'Weekly Chest'}
                </Text>
                <Text className="text-xs" style={{ color: colors.textMuted }}>
                  {language === 'es' ? 'Recompensa especial' : 'Special reward'}
                </Text>
              </View>
              <Pressable
                onPress={() => setShowInfo(false)}
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.textMuted + '18' }}
              >
                <X size={16} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Description */}
            <View className="mb-4 p-3 rounded-xl" style={{ backgroundColor: colors.background }}>
              <Text className="text-sm leading-5" style={{ color: colors.text }}>
                {language === 'es'
                  ? 'El Cofre Semanal es una recompensa especial que puedes abrir una vez por semana. Contiene puntos o artículos exclusivos que no se consiguen de otra forma.'
                  : 'The Weekly Chest is a special reward you can open once per week. It contains points or exclusive items that cannot be obtained any other way.'}
              </Text>
            </View>

            {/* How to get it */}
            <View className="p-3 rounded-xl" style={{ backgroundColor: '#A855F7' + '12' }}>
              <Text className="text-xs font-semibold mb-1" style={{ color: '#A855F7' }}>
                {language === 'es' ? '¿Cómo conseguirlo?' : 'How to get it?'}
              </Text>
              <Text className="text-xs leading-5" style={{ color: colors.text }}>
                {language === 'es'
                  ? 'Completa los 2 desafíos semanales para desbloquear el cofre. Una vez ambos estén reclamados, el cofre aparecerá listo para abrirse.'
                  : 'Complete both weekly challenges to unlock the chest. Once both are claimed, the chest will appear ready to open.'}
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
    retry: 1,
  });

  const { data: progressData = [] } = useQuery({
    queryKey: ['challengeProgress', userId],
    queryFn: () => gamificationApi.getChallengeProgress(userId),
    enabled: !!userId,
    staleTime: 60 * 1000,
    retry: 1,
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
        style={{
          marginHorizontal: 20,
          marginBottom: 20,
          borderRadius: 24,
          shadowColor: '#F97316',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 14,
          elevation: 6,
        }}
      >
        <LinearGradient
          colors={['#F9731618', '#F9731608', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, padding: 1.5 }}
        >
          <LinearGradient
            colors={['#1C1208', '#120D05', '#0E0900']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 23, overflow: 'hidden', padding: 20 }}
          >
            {/* Inner accent glow */}
            <LinearGradient
              colors={['#F9731612', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />

            {/* Header row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
              <LinearGradient
                colors={['#F9731630', '#F9731615']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  borderWidth: 1,
                  borderColor: '#F9731635',
                }}
              >
                <Gift size={20} color="#F97316" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2 }}>
                  {t.weekly_challenges}
                </Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: '500', marginTop: 1 }}>
                  {language === 'es' ? 'Completa y reclama tus recompensas' : 'Complete and claim your rewards'}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 16 }} />

            {challenges.slice(0, 3).map((challenge, index) => {
              const progress = progressData.find(p => p.challengeId === challenge.id);
              const currentCount = progress?.currentCount || 0;
              const progressPercent = Math.min((currentCount / challenge.goalCount) * 100, 100);
              const isComplete = progress?.completed || false;
              const isClaimed = progress?.claimed || false;
              const title = language === 'es' ? challenge.titleEs : challenge.titleEn;
              const description = language === 'es' ? challenge.descriptionEs : challenge.descriptionEn;

              return (
                <View key={challenge.id} style={index > 0 ? { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' } : {}}>
                  {/* Title row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedChallenge({ title, description, type: challenge.type });
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8, gap: 6 }}
                    >
                      <Text
                        style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.88)', flex: 1 }}
                        numberOfLines={1}
                      >
                        {title}
                      </Text>
                      <Info size={13} color="rgba(255,255,255,0.30)" />
                    </Pressable>
                    <View style={{
                      backgroundColor: isComplete ? '#22C55E20' : 'rgba(255,255,255,0.08)',
                      borderRadius: 99,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderWidth: 1,
                      borderColor: isComplete ? '#22C55E40' : 'rgba(255,255,255,0.10)',
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: isComplete ? '#22C55E' : 'rgba(255,255,255,0.50)' }}>
                        {currentCount}/{challenge.goalCount}
                      </Text>
                    </View>
                  </View>

                  {/* Progress bar */}
                  <View style={{ height: 6, borderRadius: 99, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 8 }}>
                    <LinearGradient
                      colors={isComplete ? ['#22C55E', '#16A34A'] : [colors.primary, colors.primary + 'AA']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ height: '100%', width: `${progressPercent}%`, borderRadius: 99 }}
                    />
                  </View>

                  {/* Bottom row: points + action */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Coins size={13} color={colors.primary} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                        +{challenge.rewardPoints}
                      </Text>
                    </View>

                    {isComplete && !isClaimed && (
                      <Pressable
                        onPress={() => claimMutation.mutate({ challengeId: challenge.id })}
                        disabled={claimMutation.isPending}
                        style={{
                          backgroundColor: '#22C55E',
                          borderRadius: 10,
                          paddingHorizontal: 14,
                          paddingVertical: 6,
                        }}
                      >
                        {claimMutation.isPending ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                            {t.claim_reward}
                          </Text>
                        )}
                      </Pressable>
                    )}

                    {isClaimed && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#22C55E15', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, gap: 4 }}>
                        <Check size={12} color="#22C55E" strokeWidth={3} />
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#22C55E' }}>
                          {t.reward_claimed}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </LinearGradient>
        </LinearGradient>
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
  const { sFont } = useScaledFont();
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
      style={{
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 24,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
        elevation: 5,
      }}
    >
      <LinearGradient
        colors={[colors.primary + '25', colors.primary + '08', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 1.5 }}
      >
        <LinearGradient
          colors={['#1C1208', '#120D05', '#0E0900']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 23, overflow: 'hidden' }}
        >
          {/* Inner accent glow */}
          <LinearGradient
            colors={[colors.primary + '14', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setIsExpanded(!isExpanded);
              setMessage(null);
            }}
            style={{ padding: 20 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Icon chip */}
              <LinearGradient
                colors={[colors.primary + '30', colors.primary + '12']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                  borderWidth: 1,
                  borderColor: colors.primary + '40',
                }}
              >
                <Ticket size={22} color={colors.primary} />
              </LinearGradient>

              {/* Text */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2, marginBottom: 2 }}>
                  {language === 'es' ? 'Canjear Código' : 'Redeem Code'}
                </Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: '500' }}>
                  {language === 'es' ? 'Ingresa tu código promocional' : 'Enter your promo code'}
                </Text>
              </View>

              {/* Arrow */}
              <View style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}>
                <ChevronRight size={20} color="rgba(255,255,255,0.30)" />
              </View>
            </View>
          </Pressable>

          {isExpanded && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={{ paddingHorizontal: 20, paddingBottom: 20 }}
            >
              {/* Subtle separator */}
              <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 16 }} />

              {/* Input Field */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 14,
                  overflow: 'hidden',
                  marginBottom: 10,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.10)',
                }}
              >
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder={language === 'es' ? 'Código...' : 'Code...'}
                  placeholderTextColor="rgba(255,255,255,0.30)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    flex: 1,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: sFont(15),
                    color: '#FFFFFF',
                    fontWeight: '700',
                    letterSpacing: 1,
                  }}
                  editable={!isRedeeming}
                />
                <Pressable
                  onPress={handleRedeem}
                  disabled={!code.trim() || isRedeeming}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    backgroundColor: code.trim() && !isRedeeming ? colors.primary : 'rgba(255,255,255,0.08)',
                  }}
                >
                  {isRedeeming ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text
                      style={{
                        color: code.trim() ? '#FFFFFF' : 'rgba(255,255,255,0.30)',
                        fontWeight: '700',
                        fontSize: sFont(14),
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
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    backgroundColor: message.type === 'success' ? '#22C55E18' : '#EF444418',
                    borderWidth: 1,
                    borderColor: message.type === 'success' ? '#22C55E30' : '#EF444430',
                    gap: 8,
                  }}
                >
                  {message.type === 'success' ? (
                    <Check size={15} color="#22C55E" strokeWidth={3} />
                  ) : (
                    <X size={15} color="#EF4444" strokeWidth={3} />
                  )}
                  <Text
                    style={{ fontSize: 13, fontWeight: '600', flex: 1, color: message.type === 'success' ? '#22C55E' : '#EF4444' }}
                  >
                    {message.text}
                  </Text>
                </Animated.View>
              )}
            </Animated.View>
          )}
        </LinearGradient>
      </LinearGradient>
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

function CategoryCard({
  category,
  isActive,
  colors,
  language,
  onPress,
  badgeCount = 0,
  hasNew = false,
  progress,
}: {
  category: typeof CATEGORIES[0];
  isActive: boolean;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
  badgeCount?: number;
  hasNew?: boolean;
  progress?: { owned: number; total: number };
}) {
  const { sFont } = useScaledFont();
  const { IconComponent } = category;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const label = language === 'es' ? category.labelEs : category.label;
  const desc = language === 'es' ? category.descEs : category.desc;

  return (
    <Animated.View style={[animatedStyle, { flex: 1 }]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={{
          flex: 1,
          minHeight: 72,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 18,
          backgroundColor: isActive ? colors.primary : colors.surface,
          shadowColor: isActive ? colors.primary : '#000',
          shadowOffset: { width: 0, height: isActive ? 6 : 2 },
          shadowOpacity: isActive ? 0.32 : 0.06,
          shadowRadius: isActive ? 12 : 5,
          elevation: isActive ? 6 : 2,
          borderWidth: isActive ? 0 : 1,
          borderColor: colors.textMuted + '18',
        }}
      >
        {/* Icon container */}
        <View style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isActive ? 'rgba(255,255,255,0.18)' : colors.primary + '18',
          flexShrink: 0,
        }}>
          <IconComponent
            color={isActive ? '#FFFFFF' : colors.primary}
            active={isActive}
          />
          {badgeCount > 0 && (
            <View style={{
              position: 'absolute',
              top: -5,
              right: -5,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: '#EF4444',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 4,
              borderWidth: 2,
              borderColor: isActive ? colors.primary : colors.background,
            }}>
              <Text style={{ color: '#fff', fontSize: sFont(10), fontWeight: '800', lineHeight: 14 }}>
                {badgeCount > 9 ? '9+' : String(badgeCount)}
              </Text>
            </View>
          )}
        </View>

        {/* Text */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{
              fontSize: sFont(15),
              fontWeight: '700',
              color: isActive ? '#fff' : colors.text,
              marginBottom: 2,
              letterSpacing: -0.2,
            }}>
              {label}
            </Text>
            {hasNew && (
              <View style={{
                backgroundColor: '#22C55E',
                borderRadius: 99,
                paddingHorizontal: 6,
                paddingVertical: 2,
                marginBottom: 2,
              }}>
                <Text style={{ color: '#fff', fontSize: sFont(9), fontWeight: '800', letterSpacing: 0.5 }}>NUEVO</Text>
              </View>
            )}
          </View>
          <Text
            numberOfLines={1}
            style={{
              fontSize: sFont(12),
              color: isActive ? 'rgba(255,255,255,0.75)' : colors.textMuted,
              lineHeight: 16,
            }}
          >
            {desc}
          </Text>
          {progress && progress.total > 0 && (
            <View style={{ marginTop: 5 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : colors.textMuted + '20', overflow: 'hidden' }}>
                  <View style={{
                    height: 3, borderRadius: 2,
                    width: `${Math.min(100, Math.round((progress.owned / progress.total) * 100))}%` as any,
                    backgroundColor: isActive ? 'rgba(255,255,255,0.9)' : colors.primary,
                  }} />
                </View>
                <Text style={{ fontSize: sFont(10), fontWeight: '600', color: isActive ? 'rgba(255,255,255,0.75)' : colors.textMuted }}>
                  {progress.owned}/{progress.total}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Active chevron */}
        {isActive && (
          <View style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: 'rgba(255,255,255,0.7)',
            flexShrink: 0,
          }} />
        )}
      </Pressable>
    </Animated.View>
  );
}

// Item Detail Modal
// ─── NEW Items State Hook ─────────────────────────────────────────────────────
// Stores { [itemId]: true } in AsyncStorage. Computed in-memory, zero backend queries.
const NEW_ITEMS_SEEN_KEY = 'store_new_items_seen_v1';

function useNewItemsState() {
  const [seenMap, setSeenMap] = useState<Record<string, boolean>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(NEW_ITEMS_SEEN_KEY)
      .then(raw => {
        if (raw) setSeenMap(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  const markSeen = useCallback(async (itemId: string) => {
    setSeenMap(prev => {
      if (prev[itemId]) return prev; // already seen, no change
      const next = { ...prev, [itemId]: true };
      // Persist async, fire and forget
      AsyncStorage.setItem(NEW_ITEMS_SEEN_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
    console.log('[NewItems] Marked seen:', itemId);
  }, []);

  return { seenMap, markSeen, isLoaded };
}

// Compute which avatar IDs are "NEW" (isNewEligible && not seen)
function computeNewAvatarIds(seenMap: Record<string, boolean>): Set<string> {
  const result = new Set<string>();
  for (const av of DEFAULT_AVATARS as readonly (typeof DEFAULT_AVATARS[0])[]) {
    const isNewEligible = (av as { isNewEligible?: boolean }).isNewEligible;
    if (isNewEligible && !seenMap[av.id]) {
      result.add(av.id);
    }
  }
  return result;
}

// 14-day window for releasedAt-based "new" detection
const NEW_ITEM_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

function computeNewStoreItemIds(storeItems: StoreItem[], seenMap: Record<string, boolean>): Set<string> {
  const result = new Set<string>();
  const now = Date.now();
  for (const item of storeItems) {
    if (seenMap[item.id]) continue;
    // Item is new if: explicit isNew flag OR released in last 14 days
    const isNewFlag = (item as any).isNew === true;
    const releasedAt = item.releasedAt ? new Date(item.releasedAt).getTime() : null;
    const isRecentRelease = releasedAt !== null && (now - releasedAt) < NEW_ITEM_WINDOW_MS;
    if (isNewFlag || isRecentRelease) {
      result.add(item.id);
    }
  }
  return result;
}

// ─── End NEW Items State Hook ─────────────────────────────────────────────────

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
  onGift,
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
  onGift?: () => void;
}) {
  const { sFont } = useScaledFont();
  const t = TRANSLATIONS[language];
  if (!item) return null;

  const rarityColor = RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const displayName = language === 'es' ? item.nameEs : item.name;
  const displayDesc = language === 'es' ? item.descriptionEs : item.description;

  // Render preview based on type
  const renderPreview = () => {
    if (item.type === 'avatar' && item.emoji) {
      const isV2 = item.id.startsWith('avatar_v2_') || item.id.startsWith('avatar_l2_') || item.id.startsWith('avatar_adv_');
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
          <Text style={{ fontSize: sFont(56) }}>{item.emoji}</Text>
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
            <Text style={{ fontSize: sFont(44) }}>🕊️</Text>
          </View>
          {/* Hex color label */}
          <Text style={{
            marginTop: 10,
            fontSize: sFont(11),
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
                  <Text style={{ fontSize: sFont(11), fontWeight: '700', color: rarityColor, marginBottom: 3, letterSpacing: 0.5 }}>
                    {language === 'es' ? 'SIGNIFICADO' : 'MEANING'}
                  </Text>
                  <Text style={{ fontSize: sFont(12), color: colors.text, lineHeight: 18, fontStyle: 'italic' }}>
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
                  <Text style={{ fontSize: sFont(13) }}>
                    {item.unlockType === 'streak' ? '🔥' : item.unlockType === 'devotionals' ? '📖' : item.unlockType === 'share' ? '💌' : '🏪'}
                  </Text>
                  <Text style={{ fontSize: sFont(12), fontWeight: '600', color: colors.textMuted }}>
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
                      fontSize: sFont(11),
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
                <ActionButton
                  onPress={onEquip}
                  label={t.equip}
                  size="md"
                />
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
                <ActionButton
                  onPress={onPurchase}
                  disabled={isPurchasing}
                  loading={isPurchasing}
                  label={language === 'es' ? 'Reclamar Gratis' : 'Claim Free'}
                  fillColor="#22C55E"
                  size="md"
                />
              ) : canAfford ? (
                <ActionButton
                  onPress={onPurchase}
                  disabled={isPurchasing}
                  loading={isPurchasing}
                  label={`${item.price} ${language === 'es' ? 'puntos' : 'points'}`}
                  icon={(color, size) => <Coins size={size} color={color} />}
                  size="md"
                />
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

            {/* Gift button — visible when item is purchasable (price > 0, not chest-only) */}
            {!item.chestOnly && item.price > 0 && onGift && (
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onGift(); }}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                  marginTop: 8, paddingVertical: 10,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Gift size={15} color={colors.textMuted} />
                <Text style={{ fontSize: sFont(13), color: colors.textMuted, fontWeight: '600' }}>
                  {language === 'es' ? 'Regalar a un amigo' : 'Gift to a friend'}
                </Text>
              </Pressable>
            )}
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
  isNewGift = false,
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
  isNewGift?: boolean;
  viewRef?: (ref: View | null) => void;
})
 {
  const { sFont } = useScaledFont();
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
                fontSize: sFont(15),
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
                <Text style={{ fontSize: sFont(8), fontWeight: '700', color: '#FFFFFF' }}>V2</Text>
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

        {/* NEW gift badge — top-left corner */}
        {isNewGift && (
          <View style={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
            <View style={{
              backgroundColor: '#EF4444',
              borderRadius: 99,
              paddingHorizontal: 7,
              paddingVertical: 3,
            }}>
              <Text style={{ fontSize: sFont(9), fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 }}>
                {language === 'es' ? 'NUEVO' : 'NEW'}
              </Text>
            </View>
          </View>
        )}

        <View style={{ padding: 12 }}>
          {/* Name: up to 2 lines, fixed minHeight so all cards align in the grid */}
          <View style={{ minHeight: 40, justifyContent: 'flex-start', marginBottom: 6 }}>
            <Text
              style={{ fontSize: sFont(13), fontWeight: '700', color: colors.text, lineHeight: 19 }}
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
              <Text style={{ fontSize: sFont(12), fontWeight: '600', color: '#22C55E', marginLeft: 4 }}>
                {t.equipped}
              </Text>
            </View>
          ) : isOwned ? (
            <Text style={{ fontSize: sFont(12), fontWeight: '600', color: colors.primary }}>
              {t.equip}
            </Text>
          ) : themeData.chestOnly ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Gift size={11} color="#F59E0B" />
              <Text style={{ fontSize: sFont(10), fontWeight: '700', marginLeft: 3, color: '#F59E0B' }}>
                {language === 'es' ? 'Solo Cofre' : 'Chest Only'}
              </Text>
            </View>
          ) : themeData.price === 0 ? (
            <Text style={{ fontSize: sFont(12), fontWeight: '600', color: '#22C55E' }}>
              {language === 'es' ? 'Gratis' : 'Free'}
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Coins size={13} color={canAfford ? colors.primary : colors.textMuted} />
              <Text
                style={{ fontSize: sFont(12), fontWeight: '700', marginLeft: 4, color: canAfford ? colors.primary : colors.textMuted }}
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
  isNewGift = false,
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
  isNewGift?: boolean;
  viewRef?: (ref: View | null) => void;
}) {
  const { sFont } = useScaledFont();
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
              <Text style={{ fontSize: sFont(8), fontWeight: '800', color: frameData.color, letterSpacing: 0.5 }}>V2</Text>
            </View>
          )}

          {/* NEW gift badge */}
          {isNewGift && (
            <View style={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
              <View style={{
                backgroundColor: '#EF4444',
                borderRadius: 99,
                paddingHorizontal: 7,
                paddingVertical: 3,
              }}>
                <Text style={{ fontSize: sFont(9), fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 }}>
                  {language === 'es' ? 'NUEVO' : 'NEW'}
                </Text>
              </View>
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
              style={{ fontSize: sFont(12), fontWeight: '700', color: colors.text, maxWidth: isV2Frame ? 80 : 70 }}
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
              style={{ fontSize: sFont(9), color: colors.textMuted, textAlign: 'center', marginBottom: 4, maxWidth: 80 }}
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
              <Text style={{ fontSize: sFont(10), fontWeight: '600', color: '#22C55E', marginLeft: 2 }}>
                {t.equipped}
              </Text>
            </View>
          ) : isOwned ? (
            <Text style={{ fontSize: sFont(11), fontWeight: '600', color: colors.primary }}>
              {t.equip}
            </Text>
          ) : frameData.chestOnly ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Gift size={10} color="#F59E0B" />
              <Text style={{ fontSize: sFont(9), fontWeight: '700', marginLeft: 2, color: '#F59E0B' }}>
                {language === 'es' ? 'Solo Cofre' : 'Chest Only'}
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Coins size={11} color={canAfford ? colors.primary : colors.textMuted} />
              <Text
                style={{ fontSize: sFont(11), fontWeight: '700', marginLeft: 3, color: canAfford ? colors.primary : colors.textMuted }}
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
  isNewGift = false,
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
  isNewGift?: boolean;
  viewRef?: (ref: View | null) => void;
}) {
  const { sFont } = useScaledFont();
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
              {isNewGift && (
                <View style={{
                  marginLeft: 6,
                  backgroundColor: '#EF4444',
                  borderRadius: 99,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                }}>
                  <Text style={{ fontSize: sFont(9), fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 }}>
                    {language === 'es' ? 'NUEVO' : 'NEW'}
                  </Text>
                </View>
              )}
            </View>
            <Text
              className="text-xs"
              style={{ color: colors.textMuted }}
              numberOfLines={1}
            >
              {language === 'es' ? titleData.descriptionEs : titleData.description}
            </Text>
            {titleData.bibleRef && (
              <Text
                className="text-xs font-medium mt-0.5"
                style={{ color: rarityColor, opacity: 0.85 }}
                numberOfLines={1}
              >
                {titleData.bibleRef}
              </Text>
            )}
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
  isNewGift = false,
  isNew = false,
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
  isNewGift?: boolean;
  isNew?: boolean;
  viewRef?: (ref: View | null) => void;
}) {
  const { sFont } = useScaledFont();
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
              <Text style={{ fontSize: sFont(8), fontWeight: '700', color: rarityColor }}>V2</Text>
            </View>
          )}

          {/* NEW gift badge (red — from gifts) or NEW item badge (green — catalog) */}
          {isNewGift && (
            <View style={{ position: 'absolute', top: 6, left: 6, zIndex: 10 }}>
              <View style={{
                backgroundColor: '#EF4444',
                borderRadius: 99,
                paddingHorizontal: 7,
                paddingVertical: 3,
              }}>
                <Text style={{ fontSize: sFont(9), fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 }}>
                  {language === 'es' ? 'NUEVO' : 'NEW'}
                </Text>
              </View>
            </View>
          )}
          {!isNewGift && isNew && !isOwned && (
            <View style={{ position: 'absolute', top: 6, left: 6, zIndex: 10 }}>
              <View style={{
                backgroundColor: '#22C55E',
                borderRadius: 99,
                paddingHorizontal: 7,
                paddingVertical: 3,
                shadowColor: '#22C55E',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 4,
              }}>
                <Text style={{ fontSize: sFont(9), fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 }}>
                  {language === 'es' ? 'NUEVO' : 'NEW'}
                </Text>
              </View>
            </View>
          )}

          {/* Adventure badge - shows bundle number if known */}
          {(avatar as { isAdventure?: boolean }).isAdventure && (() => {
            // Find which adventure bundle this avatar belongs to
            const bundle = Object.values(STORE_BUNDLES).find(b =>
              (b as any).isAdventure && b.items.includes(avatar.id)
            );
            const num = bundle ? (bundle as any).adventureNumber : undefined;
            return (
              <View style={{ position: 'absolute', bottom: 6, left: 0, right: 0, alignItems: 'center', zIndex: 10 }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#C89B3C',
                  borderRadius: 99,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  gap: 3,
                }}>
                  <Star size={7} color="#FFF" fill="#FFF" />
                  <Text style={{ fontSize: sFont(8), fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 }}>
                    {num ? `Av. #${num}` : (language === 'es' ? 'Aventura' : 'Adventure')}
                  </Text>
                </View>
              </View>
            );
          })()}

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
                <Text style={{ fontSize: sFont(32) }}>{avatar.emoji}</Text>
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
            style={{ fontSize: sFont(11), fontWeight: isV2Avatar ? '700' : '600', color: colors.text, textAlign: 'center', marginBottom: 4 }}
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
            <Text style={{ fontSize: sFont(10), color: colors.primary, fontWeight: '600' }}>
              {language === 'es' ? 'Equipar' : 'Equip'}
            </Text>
          ) : (avatar as { chestOnly?: boolean }).chestOnly ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Gift size={10} color="#F59E0B" />
              <Text style={{ fontSize: sFont(9), fontWeight: '700', marginLeft: 2, color: '#F59E0B' }}>
                {language === 'es' ? 'Solo Cofre' : 'Chest Only'}
              </Text>
            </View>
          ) : !hasCost || isOwned ? (
            <Text style={{ fontSize: sFont(10), color: '#22C55E', fontWeight: '600' }}>
              {language === 'es' ? 'Gratis' : 'Free'}
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Coins size={10} color={canAfford ? colors.primary : colors.textMuted} />
              <Text
                style={{ fontSize: sFont(10), fontWeight: '700', marginLeft: 3, color: canAfford ? colors.primary : colors.textMuted }}
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
  onViewAdventure,
}: {
  bundle: typeof STORE_BUNDLES[string];
  purchasedItems: string[];
  points: number;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
  isPurchasing?: boolean;
  onViewAdventure?: (targetType: string, targetId: string) => void;
}) {
  const { sFont } = useScaledFont();
  const scale = useSharedValue(1);
  const rarityColor = RARITY_COLORS[bundle.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const canAfford = points >= bundle.bundlePrice;
  const savings = bundle.originalPrice - bundle.bundlePrice;
  const isV2Bundle = 'isV2' in bundle && bundle.isV2 === true;
  const isAdventureBundle = 'isAdventure' in bundle && bundle.isAdventure === true;
  const isComingSoon = 'comingSoon' in bundle && bundle.comingSoon === true;
  const adventureNumber = 'adventureNumber' in bundle ? (bundle as { adventureNumber?: number }).adventureNumber : undefined;
  const collectionBonus = 'collectionBonus' in bundle ? (bundle as { collectionBonus?: number }).collectionBonus : undefined;
  const storyId = 'storyId' in bundle ? (bundle as { storyId?: string }).storyId : undefined;

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

  // ─── ADVENTURE BUNDLE — Premium Card ─────────────────────────────────────────
  if (isAdventureBundle) {
    const GOLD_GRADIENT: [string, string, string] = isComingSoon
      ? ['#2A2210', '#1A1500', '#0D0B00']
      : ['#3D2B00', '#1A1200', '#0A0800'];
    const GOLD_ACCENT = isComingSoon ? '#6B5A2A' : '#C89B3C';
    const GOLD_LIGHT = isComingSoon ? '#8B7A4A' : '#F5D06A';

    const getItemTypeLabel = (itemId: string) => {
      if (itemId.startsWith('avatar_')) return language === 'es' ? 'Avatar' : 'Avatar';
      if (itemId.startsWith('frame_')) return language === 'es' ? 'Marco' : 'Frame';
      if (itemId.startsWith('title_')) return language === 'es' ? 'Título' : 'Title';
      return '';
    };

    return (
      <Animated.View style={[animatedStyle, { marginBottom: 16 }]}>
        <Pressable
          onPressIn={() => { scale.value = withSpring(0.98); }}
          onPressOut={() => { scale.value = withSpring(1); }}
          onPress={onPress}
          disabled={isPurchasing}
          style={{
            borderRadius: 20,
            overflow: 'hidden',
            shadowColor: isComingSoon ? '#000' : '#C89B3C',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isComingSoon ? 0.3 : 0.5,
            shadowRadius: 16,
            elevation: 8,
            opacity: isComingSoon ? 0.8 : 1,
          }}
        >
          {/* Hero gradient background */}
          <LinearGradient
            colors={GOLD_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 0 }}
          >
            {/* Top banner */}
            <LinearGradient
              colors={isComingSoon ? ['#6B5A2A88', '#4A3D1A88'] : ['#C89B3C', '#8B6914']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Star size={12} color="#FFF8E0" fill="#FFF8E0" />
                <Text style={{ fontSize: sFont(11), fontWeight: '900', color: '#FFF8E0', letterSpacing: 1.5 }}>
                  {(language === 'es' ? 'AVENTURA BÍBLICA' : 'BIBLICAL ADVENTURE')}
                  {adventureNumber ? ` #${adventureNumber}` : ''}
                </Text>
              </View>
              {isComingSoon ? (
                <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}>
                  <Text style={{ fontSize: sFont(9), fontWeight: '800', color: '#FFF', letterSpacing: 0.8 }}>
                    {language === 'es' ? 'PRÓXIMAMENTE' : 'COMING SOON'}
                  </Text>
                </View>
              ) : allOwned ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(34,197,94,0.25)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}>
                  <Check size={10} color="#22C55E" strokeWidth={3} />
                  <Text style={{ fontSize: sFont(9), fontWeight: '800', color: '#22C55E' }}>
                    {language === 'es' ? 'COMPRADA' : 'OWNED'}
                  </Text>
                </View>
              ) : null}
            </LinearGradient>

            {/* Body */}
            <View style={{ padding: 16, gap: 14 }}>
              {/* Title row */}
              <View>
                <Text style={{ fontSize: sFont(19), fontWeight: '900', color: GOLD_LIGHT, letterSpacing: -0.3 }}>
                  {language === 'es' ? bundle.nameEs : bundle.name}
                </Text>
                <Text style={{ fontSize: sFont(12), color: GOLD_ACCENT, marginTop: 2, fontWeight: '500' }}>
                  {language === 'es' ? bundle.descriptionEs : bundle.description}
                </Text>
              </View>

              {/* Reward tiles row */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {bundle.items.slice(0, 3).map((itemId) => {
                  const preview = getItemPreview(itemId);
                  const isItemOwned = purchasedItems.includes(itemId);
                  const typeLabel = getItemTypeLabel(itemId);

                  return (
                    <View key={itemId} style={{ flex: 1, alignItems: 'center', gap: 5 }}>
                      {/* Tile */}
                      <View style={{
                        width: '100%',
                        aspectRatio: 1,
                        borderRadius: 12,
                        backgroundColor: isItemOwned ? '#22C55E15' : GOLD_ACCENT + '18',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1.5,
                        borderColor: isItemOwned ? '#22C55E60' : GOLD_ACCENT + '50',
                        position: 'relative',
                      }}>
                        {isItemOwned && (
                          <View style={{ position: 'absolute', top: -5, right: -5, zIndex: 1, backgroundColor: '#22C55E', borderRadius: 99, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={9} color="#fff" strokeWidth={3} />
                          </View>
                        )}
                        {preview?.type === 'avatar' && preview.emoji && (
                          <Text style={{ fontSize: sFont(26) }}>{preview.emoji}</Text>
                        )}
                        {preview?.type === 'frame' && preview.color && (
                          <View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 4, borderColor: preview.color }} />
                        )}
                        {preview?.type === 'title' && (
                          <Award size={24} color={GOLD_ACCENT} />
                        )}
                      </View>
                      {/* Label */}
                      <Text style={{ fontSize: sFont(10), fontWeight: '700', color: GOLD_ACCENT, letterSpacing: 0.3 }}>
                        {typeLabel.toUpperCase()}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Bonus + price row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                {collectionBonus && !allOwned ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Sparkles size={12} color={GOLD_ACCENT} />
                    <Text style={{ fontSize: sFont(11), fontWeight: '700', color: GOLD_ACCENT }}>
                      {language === 'es'
                        ? `Incluye 3 recompensas + bono +${collectionBonus} pts`
                        : `3 rewards + collection bonus +${collectionBonus} pts`}
                    </Text>
                  </View>
                ) : allOwned ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Check size={12} color="#22C55E" strokeWidth={2.5} />
                    <Text style={{ fontSize: sFont(11), fontWeight: '700', color: '#22C55E' }}>
                      {language === 'es' ? 'Todas las recompensas obtenidas' : 'All rewards acquired'}
                    </Text>
                  </View>
                ) : (
                  <View />
                )}

                {/* Price pill */}
                {!allOwned && !isComingSoon && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: GOLD_ACCENT + '25', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: GOLD_ACCENT + '60' }}>
                    <Coins size={12} color={GOLD_LIGHT} />
                    <Text style={{ fontSize: sFont(13), fontWeight: '900', color: GOLD_LIGHT }}>{bundle.bundlePrice.toLocaleString()}</Text>
                  </View>
                )}
              </View>

              {/* CTA Button */}
              {!isComingSoon && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    if (allOwned && onViewAdventure) {
                      const targetType = (bundle as any).targetType as string | undefined;
                      const targetId = (bundle as any).targetId as string | undefined;
                      onViewAdventure(targetType ?? 'story', targetId ?? bundle.id);
                    } else {
                      onPress();
                    }
                  }}
                  style={{
                    borderRadius: 14,
                    overflow: 'hidden',
                    marginTop: 2,
                    opacity: !allOwned && !canAfford ? 0.5 : 1,
                  }}
                >
                  <LinearGradient
                    colors={allOwned ? ['#166534', '#15803D'] : canAfford ? ['#C89B3C', '#8B6914'] : ['#444', '#333']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ paddingVertical: 13, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                  >
                    {isPurchasing ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : allOwned ? (
                      <>
                        <BookOpen size={16} color="#FFF" />
                        <Text style={{ fontSize: sFont(14), fontWeight: '800', color: '#FFF', letterSpacing: 0.3 }}>
                          {language === 'es' ? 'Ver aventura' : 'View Adventure'}
                        </Text>
                      </>
                    ) : canAfford ? (
                      <>
                        <Sparkles size={16} color="#FFF8E0" />
                        <Text style={{ fontSize: sFont(14), fontWeight: '800', color: '#FFF8E0', letterSpacing: 0.3 }}>
                          {language === 'es' ? 'Comprar aventura' : 'Buy Adventure'}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Lock size={14} color="#999" />
                        <Text style={{ fontSize: sFont(14), fontWeight: '700', color: '#999' }}>
                          {language === 'es' ? 'Puntos insuficientes' : 'Not enough points'}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              )}
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  // ─── REGULAR BUNDLE CARD ──────────────────────────────────────────────────────
  return (
    <Animated.View style={animatedStyle} className="mb-4">
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        disabled={allOwned || isPurchasing || !canAfford || isComingSoon}
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: colors.surface,
          shadowColor: rarityColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isComingSoon ? 0.1 : 0.2,
          shadowRadius: 12,
          elevation: 4,
          opacity: allOwned ? 0.6 : isComingSoon ? 0.75 : 1,
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
                    <Text style={{ fontSize: sFont(9), fontWeight: '700', color: rarityColor }}>V2</Text>
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
                    <Text style={{ fontSize: sFont(22) }}>{preview.emoji}</Text>
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
            ) : isComingSoon ? (
              <View className="flex-row items-center px-3 py-2 rounded-xl" style={{ backgroundColor: '#C89B3C20' }}>
                <Lock size={12} color="#C89B3C" />
                <Text className="text-xs font-semibold ml-1" style={{ color: '#C89B3C' }}>
                  {language === 'es' ? 'Próximamente' : 'Soon'}
                </Text>
              </View>
            ) : canAfford ? (
              <View style={{ paddingHorizontal: 4 }}>
                <ActionButton
                  disabled={isPurchasing}
                  loading={isPurchasing}
                  label={language === 'es' ? 'Comprar' : 'Buy'}
                  size="sm"
                  fullWidth={false}
                  style={{ paddingHorizontal: 16, paddingVertical: 8 }}
                />
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
  const { sFont } = useScaledFont();
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
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: sFont(16), letterSpacing: 0.3 }}>
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
  const { sFont } = useScaledFont();
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
                <Text style={{ fontSize: sFont(40) }}>{collection.icon}</Text>
              </View>
              <Text style={{ fontSize: sFont(22), fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 6 }}>
                {language === 'es' ? collection.nameEs : collection.nameEn}
              </Text>
              <Text style={{ fontSize: sFont(13), color: colors.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 8 }}>
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
                      fontSize: sFont(9), fontWeight: '600', textAlign: 'center',
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
                <Text style={{ fontSize: sFont(32), marginBottom: 6 }}>🏆</Text>
                <Text style={{ fontSize: sFont(16), fontWeight: '800', color: '#22C55E', marginBottom: 4 }}>
                  {language === 'es' ? '¡Camino completado!' : 'Path completed!'}
                </Text>
                <Text style={{ fontSize: sFont(12), color: colors.textMuted, textAlign: 'center', lineHeight: 18 }}>
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
                          ? <Text style={{ fontSize: sFont(14), fontWeight: '800', color: colors.primary }}>{chapter.number}</Text>
                          : <Lock size={14} color={colors.textMuted} />
                        }
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                          <Text style={{ fontSize: sFont(9), fontWeight: '700', color: isCompleted ? '#22C55E' : isActive ? colors.primary : colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                            {language === 'es' ? `Capítulo ${chapter.number}` : `Chapter ${chapter.number}`}
                          </Text>
                          {isActive && !isCompleted && (
                            <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, backgroundColor: colors.primary + '20' }}>
                              <Text style={{ fontSize: sFont(8), fontWeight: '800', color: colors.primary, letterSpacing: 0.5 }}>
                                {language === 'es' ? 'ACTIVO' : 'ACTIVE'}
                              </Text>
                            </View>
                          )}
                          {isCompleted && (
                            <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, backgroundColor: '#22C55E20' }}>
                              <Text style={{ fontSize: sFont(8), fontWeight: '800', color: '#22C55E', letterSpacing: 0.5 }}>
                                {language === 'es' ? 'COMPLETADO' : 'COMPLETED'}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: sFont(16), fontWeight: '800', color: isLocked ? colors.textMuted : colors.text }}>
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
                        <Text style={{ fontSize: sFont(12), fontWeight: '700', color: isCompleted ? '#22C55E' : isActive ? colors.primary : colors.textMuted }}>
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
                        <Text style={{ flex: 1, fontSize: sFont(13), color: colors.textMuted, lineHeight: 18 }}>
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
                            <Text style={{ fontSize: sFont(18) }}>✨</Text>
                            <Text style={{ flex: 1, fontSize: sFont(13), color: colors.primary, fontWeight: '600', lineHeight: 18 }}>
                              {language === 'es'
                                ? 'Ahora es tiempo de crecer y fortalecerte.'
                                : 'Now is the time to grow and strengthen yourself.'}
                            </Text>
                          </Animated.View>
                        )}

                        {/* Verse reference */}
                        {chapter.verseEn && (
                          <Text style={{ fontSize: sFont(10), fontWeight: '700', color: colors.primary, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>
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
                          <Text style={{ fontSize: sFont(13), lineHeight: 21, color: colors.text + 'DD', fontStyle: 'italic' }}>
                            {language === 'es' ? chapter.spiritualTextEs : chapter.spiritualTextEn}
                          </Text>
                        </View>

                        {/* Items progress header */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
                          <Text style={{ fontSize: sFont(10), fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, flex: 1 }}>
                            {language === 'es' ? 'Ítems requeridos' : 'Required items'}
                          </Text>
                          <Text style={{ fontSize: sFont(11), fontWeight: '700', color: chapterComplete ? '#22C55E' : colors.primary }}>
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
                                  ? <Text style={{ fontSize: sFont(19) }}>{meta.emoji}</Text>
                                  : meta.color
                                  ? <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: meta.color }} />
                                  : <Text style={{ fontSize: sFont(17) }}>{collection.icon}</Text>
                                }
                              </View>

                              {/* Info */}
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: sFont(13), fontWeight: '700', color: owned ? colors.textMuted : colors.text }}>
                                  {language === 'es' ? meta.nameEs : meta.name}
                                </Text>
                                <Text style={{ fontSize: sFont(10), color: colors.textMuted }}>
                                  {typeLabel(ci.itemType)}
                                </Text>
                              </View>

                              {/* Status */}
                              {owned ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <Check size={14} color="#22C55E" strokeWidth={2.5} />
                                  <Text style={{ fontSize: sFont(11), fontWeight: '700', color: '#22C55E' }}>
                                    {language === 'es' ? 'Adquirido' : 'Acquired'}
                                  </Text>
                                </View>
                              ) : isActive ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: colors.primary + '15' }}>
                                  <Text style={{ fontSize: sFont(11), fontWeight: '700', color: colors.primary }}>
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
                              <Text style={{ color: colors.text, fontSize: sFont(13), fontWeight: '700' }}>
                                {language === 'es'
                                  ? `${pendingCount} ítem${pendingCount !== 1 ? 's' : ''} pendiente${pendingCount !== 1 ? 's' : ''}`
                                  : `${pendingCount} item${pendingCount !== 1 ? 's' : ''} remaining`}
                              </Text>
                              <Text style={{ color: colors.textMuted, fontSize: sFont(11), textAlign: 'center', lineHeight: 17 }}>
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
                            <Text style={{ fontSize: sFont(12), fontWeight: '700', color: '#22C55E' }}>
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
                        <Text style={{ fontSize: sFont(12), color: colors.primary, fontWeight: '600', textAlign: 'center', lineHeight: 18 }}>
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
  const { sFont } = useScaledFont();
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
                <Text style={{ fontSize: sFont(36) }}>{collection.icon}</Text>
              </View>

              <Text style={{ fontSize: sFont(20), fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 4 }}>
                {language === 'es' ? collection.nameEs : collection.name}
              </Text>
              <Text style={{ fontSize: sFont(13), color: colors.textMuted, textAlign: 'center', fontStyle: 'italic' }}>
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
              <Text style={{ fontSize: sFont(12), lineHeight: 20, color: colors.text + 'CC', fontStyle: 'italic' }}>
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
                <Text style={{ fontSize: sFont(11), fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {language === 'es' ? 'Progreso' : 'Progress'}
                </Text>
                <Text style={{ fontSize: sFont(13), fontWeight: '700', color: isComplete ? '#22C55E' : colors.primary }}>
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
              <Text style={{ fontSize: sFont(12), color: colors.textMuted }}>
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
                <Text style={{ fontSize: sFont(28), marginBottom: 6 }}>🏆</Text>
                <Text style={{ fontSize: sFont(15), fontWeight: '800', color: '#22C55E', marginBottom: 4 }}>
                  {language === 'es' ? 'Coleccion completada' : 'Collection completed'}
                </Text>
                <Text style={{ fontSize: sFont(12), color: colors.textMuted, textAlign: 'center' }}>
                  {language === 'es'
                    ? 'Has completado este reto. Gracias por avanzar con fidelidad.'
                    : 'You completed this challenge. Thank you for advancing with faithfulness.'}
                </Text>
              </View>
            )}

            {/* ── Items list ───────────────────────────────── */}
            <Text style={{ fontSize: sFont(11), fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
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
                        <Text style={{ fontSize: sFont(20) }}>{meta.emoji}</Text>
                      ) : meta.color ? (
                        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: meta.color, borderWidth: 2, borderColor: '#fff' + '80' }} />
                      ) : (
                        <Text style={{ fontSize: sFont(18) }}>{collection.icon}</Text>
                      )}
                    </View>

                    {/* Item info */}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: sFont(13), fontWeight: '700', color: isOwned ? colors.textMuted : colors.text }}>
                        {language === 'es' ? meta.nameEs : meta.name}
                      </Text>
                      <Text style={{ fontSize: sFont(11), color: colors.textMuted, marginTop: 1 }}>
                        {typeLabel(meta.type)}
                      </Text>
                    </View>

                    {/* Status */}
                    {isOwned ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Check size={14} color="#22C55E" strokeWidth={2.5} />
                        <Text style={{ fontSize: sFont(11), fontWeight: '600', color: '#22C55E' }}>
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
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: sFont(15) }}>
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
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: sFont(13) }}>
                      {language === 'es'
                        ? `Faltan ${totalCount - ownedCount} elemento${totalCount - ownedCount !== 1 ? 's' : ''} para completar`
                        : `${totalCount - ownedCount} item${totalCount - ownedCount !== 1 ? 's' : ''} remaining to complete`}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: sFont(11), marginTop: 2 }}>
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
  const { sFont } = useScaledFont();
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
          <Text style={{ fontSize: sFont(10), fontWeight: '700', color: allDone ? '#22C55E' : colors.primary, letterSpacing: 0.5 }}>
            {language === 'es' ? '✦ CAMINO ESPIRITUAL' : '✦ SPIRITUAL PATH'}
          </Text>
          <View style={{ flex: 1 }} />
          {activeChapterReady && !allDone ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
              <Text style={{ fontSize: sFont(10), fontWeight: '800', color: '#fff' }}>
                🎁 {language === 'es' ? '¡Listo!' : 'Ready!'}
              </Text>
            </View>
          ) : (
            <Text style={{ fontSize: sFont(10), fontWeight: '600', color: allDone ? '#22C55E' : colors.textMuted }}>
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
              <Text style={{ fontSize: sFont(26) }}>{collection.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: sFont(15), fontWeight: '800', color: colors.text, marginBottom: 2 }}>
                {language === 'es' ? collection.nameEs : collection.nameEn}
              </Text>
              {activeChapter && !allDone ? (
                <Text style={{ fontSize: sFont(11), color: colors.primary, fontWeight: '600' }}>
                  {language === 'es' ? `Capítulo ${activeChapter.number}: ` : `Chapter ${activeChapter.number}: `}
                  <Text style={{ fontWeight: '400', color: colors.textMuted }}>
                    {language === 'es' ? activeChapter.titleEs : activeChapter.titleEn}
                  </Text>
                </Text>
              ) : (
                <Text style={{ fontSize: sFont(11), color: '#22C55E', fontWeight: '600' }}>
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
                  <Text style={{ fontSize: sFont(9), fontWeight: '600', color: done ? '#22C55E' : active ? colors.primary : colors.textMuted + '80', textAlign: 'center' }}>
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
              <Text style={{ fontSize: sFont(11), color: colors.textMuted, flex: 1 }}>
                {activeChapterOwnedCount}/{activeChapter.items.length} {language === 'es' ? 'ítems del capítulo activo' : 'items in active chapter'}
              </Text>
              {activeChapterReady ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.primary }}>
                  <Gift size={12} color="#fff" />
                  <Text style={{ fontSize: sFont(11), fontWeight: '800', color: '#fff' }}>
                    {language === 'es' ? 'Listo' : 'Ready'}
                  </Text>
                </View>
              ) : (
                <Text style={{ fontSize: sFont(11), fontWeight: '600', color: colors.primary }}>
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
  const { sFont } = useScaledFont();
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
              <Text style={{ fontSize: sFont(24) }}>{collection.icon}</Text>
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
                    <Text style={{ fontSize: sFont(9), fontWeight: '700', color: colors.primary }}>V2</Text>
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
                    <Text style={{ fontSize: sFont(9), fontWeight: '800', color: '#fff' }}>
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
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: sFont(12) }}>
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
  const { sFont } = useScaledFont();
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
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: sFont(15) }}>
            {amount === 0 && message ? message : `${isPositive ? '+' : '-'}${amount} pts`}
          </Text>
        </View>
        {message && amount !== 0 ? (
          <Text style={{ color: '#ffffffCC', fontSize: sFont(12), fontWeight: '500', textAlign: 'center' }}>
            {message}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Daily Pack Banner — shows daily free pack availability / countdown
// ─────────────────────────────────────────────────────────────────────────────
function DailyPackBanner({
  status,
  language,
  isEventActive,
  disabled,
  onClaim,
}: {
  status: {
    canClaim: boolean;
    remaining: number;
    dailyLimit: number;
    isPremium: boolean;
    nextAvailableMs: number | null;
    claimedToday: number;
  } | null;
  language: 'en' | 'es';
  isEventActive: boolean;
  disabled?: boolean;
  onClaim: (packType: 'sobre_biblico' | 'pack_pascua') => void;
}) {
  const { sFont } = useScaledFont();
  const colors = useThemeColors();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // Compute countdown string
  const [countdown, setCountdown] = React.useState('');
  React.useEffect(() => {
    if (!status || status.canClaim || !status.nextAvailableMs) {
      setCountdown('');
      return;
    }
    const update = () => {
      const diffMs = status.nextAvailableMs! - Date.now();
      if (diffMs <= 0) { setCountdown(''); return; }
      const h = Math.floor(diffMs / 3_600_000);
      const m = Math.floor((diffMs % 3_600_000) / 60_000);
      setCountdown(`${h}h ${m}m`);
    };
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, [status]);

  const canClaim = status?.canClaim ?? false;
  const isPremium = status?.isPremium ?? false;
  const dailyLimit = status?.dailyLimit ?? 1;

  const labelActive = isPremium
    ? (language === 'es' ? `🎁 ${dailyLimit} sobres diarios (Premium)` : `🎁 ${dailyLimit} daily packs (Premium)`)
    : (language === 'es' ? '🎁 Sobre diario disponible' : '🎁 Daily pack available');

  const labelWaiting = countdown
    ? (language === 'es' ? `⏳ Próximo sobre en ${countdown}` : `⏳ Next pack in ${countdown}`)
    : (language === 'es' ? '⏳ Sobre diario reclamado' : '⏳ Daily pack claimed');

  const packTypeToUse: 'sobre_biblico' | 'pack_pascua' = isEventActive ? 'pack_pascua' : 'sobre_biblico';

  return (
    <Animated.View style={[animStyle, { marginBottom: 12, opacity: disabled ? 0.5 : 1 }]}>
      <Pressable
        onPressIn={() => { if (canClaim && !disabled) scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={() => { if (canClaim && !disabled) onClaim(packTypeToUse); }}
        disabled={!canClaim || disabled}
      >
        <LinearGradient
          colors={canClaim
            ? (isPremium ? ['#2D1B5E', '#1A0F3A'] : ['#0F2A1A', '#061510'])
            : ['rgba(30,30,30,0.6)', 'rgba(20,20,20,0.6)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: canClaim
              ? (isPremium ? '#7C3AED' : '#22C55E')
              : 'rgba(255,255,255,0.08)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <Text style={{
            fontSize: sFont(15),
            fontWeight: '700',
            color: canClaim
              ? (isPremium ? '#C4B5FD' : '#86EFAC')
              : 'rgba(255,255,255,0.35)',
            flex: 1,
          }}>
            {canClaim ? labelActive : labelWaiting}
          </Text>
          {canClaim && (
            <LinearGradient
              colors={isPremium ? ['#7C3AED', '#5B21B6'] : ['#16A34A', '#15803D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 99 }}
            >
              <View style={{ paddingHorizontal: 18, paddingVertical: 9 }}>
                <Text style={{ fontSize: sFont(13), fontWeight: '800', color: '#FFF' }}>
                  {language === 'es' ? 'Reclamar' : 'Claim'}
                </Text>
              </View>
            </LinearGradient>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Biblical Pack Card — PREMIUM collectible booster pack visual
// Full metallic foil, glowing border, layered emblem, sacred ornaments
// ─────────────────────────────────────────────────────────────────────────────
function BiblicalPackCard({
  canAfford,
  disabled,
  language,
  onPress,
}: {
  canAfford: boolean;
  disabled?: boolean;
  language: 'en' | 'es';
  onPress: () => void;
}) {
  const { sFont } = useScaledFont();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={{ marginBottom: 12, opacity: disabled ? 0.5 : 1 }}>
      <Animated.View style={animStyle}>
        <Pressable
          onPressIn={() => { if (!disabled) scale.value = withSpring(0.97); }}
          onPressOut={() => { scale.value = withSpring(1); }}
          onPress={onPress}
          disabled={disabled}
        >
          {/* Outer card shell */}
          <LinearGradient
            colors={['#07090F', '#0D1120', '#070910']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 18,
              borderWidth: 1.5,
              borderColor: '#C8A52A',
              shadowColor: '#D4AF37',
              shadowOpacity: 0.28,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 4 },
              elevation: 14,
              overflow: 'hidden',
            }}
          >
            {/* Subtle outer sweep */}
            <LinearGradient
              colors={['rgba(212,175,55,0.06)', 'transparent', 'rgba(100,80,180,0.06)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
            />

            {/* Top ornament line */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#D4AF37' }} />
            {/* Bottom ornament line */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: '#D4AF37' }} />

            {/* Top rarity badge row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                backgroundColor: 'rgba(212,175,55,0.14)',
                borderWidth: 1,
                borderColor: 'rgba(212,175,55,0.45)',
                borderRadius: 99,
                paddingHorizontal: 11,
                paddingVertical: 4,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}>
                <Sparkles size={9} color="#D4AF37" />
                <Text style={{ fontSize: sFont(9), fontWeight: '800', color: '#D4AF37', letterSpacing: 1.1, textTransform: 'uppercase' }}>
                  {language === 'es' ? 'Coleccionable · Raro' : 'Collectible · Rare'}
                </Text>
              </View>
              <Text style={{ fontSize: sFont(10), color: 'rgba(212,175,55,0.45)', fontWeight: '700', letterSpacing: 3 }}>✦✦✦</Text>
            </View>

            {/* Pack illustration + info row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 16 }}>

              {/* ── THE PACK VISUAL ── */}
              <View style={{
                shadowColor: '#D4AF37',
                shadowOpacity: 0.70,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 0 },
                elevation: 18,
              }}>
                <LinearGradient
                  colors={['#1C2B8A', '#0E1B5E', '#091240', '#0A1830']}
                  start={{ x: 0.15, y: 0 }}
                  end={{ x: 0.85, y: 1 }}
                  style={{
                    width: 84,
                    height: 116,
                    borderRadius: 12,
                    borderWidth: 2.5,
                    borderColor: '#D4AF37',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {/* Primary foil sweep */}
                  <LinearGradient
                    colors={['rgba(212,175,55,0.30)', 'transparent', 'rgba(212,175,55,0.14)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                  />
                  {/* Diagonal gloss streak */}
                  <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.12)', 'transparent']}
                    start={{ x: 0, y: 0.2 }}
                    end={{ x: 1, y: 0.8 }}
                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                  />
                  {/* Counter-diagonal sweep */}
                  <LinearGradient
                    colors={['transparent', 'rgba(120,100,200,0.10)', 'transparent']}
                    start={{ x: 1, y: 0.1 }}
                    end={{ x: 0, y: 0.9 }}
                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                  />

                  {/* Top gold border */}
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#D4AF37' }} />
                  {/* Bottom gold border */}
                  <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: '#D4AF37' }} />
                  {/* Left side thin gold */}
                  <View style={{ position: 'absolute', top: 12, left: 0, width: 1, bottom: 12, backgroundColor: 'rgba(212,175,55,0.50)' }} />
                  {/* Right side thin gold */}
                  <View style={{ position: 'absolute', top: 12, right: 0, width: 1, bottom: 12, backgroundColor: 'rgba(212,175,55,0.50)' }} />

                  {/* Inner frame */}
                  <View style={{
                    position: 'absolute',
                    top: 5,
                    left: 5,
                    right: 5,
                    bottom: 5,
                    borderRadius: 7,
                    borderWidth: 0.75,
                    borderColor: 'rgba(212,175,55,0.35)',
                  }} />

                  {/* Corner ornaments */}
                  <Text style={{ position: 'absolute', top: 6, left: 6, fontSize: 8, color: '#D4AF37', opacity: 0.85 }}>✦</Text>
                  <Text style={{ position: 'absolute', top: 6, right: 6, fontSize: 8, color: '#D4AF37', opacity: 0.85 }}>✦</Text>
                  <Text style={{ position: 'absolute', bottom: 6, left: 6, fontSize: 8, color: '#D4AF37', opacity: 0.85 }}>✦</Text>
                  <Text style={{ position: 'absolute', bottom: 6, right: 6, fontSize: 8, color: '#D4AF37', opacity: 0.85 }}>✦</Text>

                  {/* Center emblem — layered */}
                  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    {/* Outer aura */}
                    <View style={{
                      position: 'absolute',
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: 'rgba(212,175,55,0.10)',
                      borderWidth: 1,
                      borderColor: 'rgba(212,175,55,0.25)',
                    }} />
                    {/* Inner aura */}
                    <View style={{
                      position: 'absolute',
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: 'rgba(212,175,55,0.08)',
                    }} />
                    {/* Cross emblem */}
                    <Text style={{
                      fontSize: 28,
                      color: '#D4AF37',
                      textShadowColor: 'rgba(212,175,55,0.60)',
                      textShadowRadius: 12,
                      textShadowOffset: { width: 0, height: 0 },
                      marginBottom: 2,
                    }}>✝</Text>
                  </View>

                  {/* Decorative ray lines */}
                  <Text style={{ position: 'absolute', top: 22, fontSize: 6, color: 'rgba(212,175,55,0.30)', letterSpacing: 6 }}>— — —</Text>

                  {/* Pack label */}
                  <View style={{ position: 'absolute', bottom: 12, alignItems: 'center' }}>
                    <Text style={{
                      fontSize: sFont(6),
                      fontWeight: '900',
                      color: '#D4AF37',
                      letterSpacing: 1.4,
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      lineHeight: 9,
                    }}>
                      SOBRE{'\n'}BÍBLICO
                    </Text>
                    <Text style={{ fontSize: sFont(5), color: 'rgba(212,175,55,0.60)', letterSpacing: 0.5, marginTop: 2.5 }}>
                      1 carta aleatoria
                    </Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Text block */}
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: sFont(20),
                  fontWeight: '900',
                  color: '#FFFFFF',
                  letterSpacing: -0.5,
                  marginBottom: 4,
                }}>
                  {language === 'es' ? 'Sobre Bíblico' : 'Biblical Pack'}
                </Text>
                <Text style={{
                  fontSize: sFont(12),
                  color: 'rgba(255,255,255,0.58)',
                  lineHeight: 18,
                  marginBottom: 8,
                }}>
                  {language === 'es'
                    ? '1 carta aleatoria de personajes, objetos y eventos bíblicos'
                    : '1 random biblical character, object or event card'}
                </Text>
                {/* Category chips */}
                <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Personajes', color: '#D4AF37' },
                    { label: 'Objetos', color: '#A8C8F0' },
                    { label: 'Eventos', color: '#FF7A2A' },
                  ].map(cat => (
                    <View key={cat.label} style={{
                      backgroundColor: cat.color + '15',
                      borderWidth: 0.75,
                      borderColor: cat.color + '45',
                      borderRadius: 99,
                      paddingHorizontal: 7,
                      paddingVertical: 2.5,
                    }}>
                      <Text style={{ fontSize: sFont(8), fontWeight: '700', color: cat.color, letterSpacing: 0.4 }}>
                        {cat.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Info strip */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              padding: 11,
              borderRadius: 12,
              marginBottom: 16,
              backgroundColor: 'rgba(212,175,55,0.07)',
              borderWidth: 1,
              borderColor: 'rgba(212,175,55,0.20)',
            }}>
              <Sparkles size={12} color="#D4AF37" />
              <Text style={{ flex: 1, fontSize: sFont(11), color: 'rgba(212,175,55,0.80)', lineHeight: 16 }}>
                {language === 'es'
                  ? 'Carta aleatoria · 6 cartas disponibles · Los duplicados se guardan para intercambios.'
                  : 'Random card · 6 cards available · Duplicates saved for future trading.'}
              </Text>
            </View>

            {/* Footer — price + CTA */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Coins size={17} color={canAfford ? '#D4AF37' : '#555'} />
                <Text style={{ fontSize: sFont(22), fontWeight: '900', color: canAfford ? '#D4AF37' : '#555' }}>
                  500
                </Text>
              </View>
              <LinearGradient
                colors={canAfford ? ['#D4AF37', '#B8962E'] : ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.06)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 99 }}
              >
                <Pressable
                  onPress={onPress}
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 99,
                  }}
                >
                  <Text style={{
                    fontSize: sFont(14),
                    fontWeight: '800',
                    color: canAfford ? '#07090F' : 'rgba(255,255,255,0.30)',
                  }}>
                    {canAfford
                      ? (language === 'es' ? 'Obtener' : 'Open Pack')
                      : (language === 'es' ? 'Sin puntos' : 'Need points')}
                  </Text>
                </Pressable>
              </LinearGradient>
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Easter Pack Card — Event booster pack visual (Pascua 2026)
// Tomb / empty cross / resurrection theme — crimson and gold
// ─────────────────────────────────────────────────────────────────────────────
function EasterPackCard({
  canAfford,
  disabled,
  isEventActive,
  language,
  onPress,
}: {
  canAfford: boolean;
  disabled?: boolean;
  isEventActive: boolean;
  language: 'en' | 'es';
  onPress: () => void;
}) {
  const { sFont } = useScaledFont();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={{ marginBottom: 12 }}>
      <Animated.View style={animStyle}>
        <Pressable
          onPressIn={() => { if (isEventActive && canAfford && !disabled) scale.value = withSpring(0.97); }}
          onPressOut={() => { scale.value = withSpring(1); }}
          onPress={onPress}
          disabled={disabled}
          style={{ opacity: disabled ? 0.5 : isEventActive ? 1 : 0.65 }}
        >
          {/* Outer card shell — deep crimson night */}
          <LinearGradient
            colors={['#0F0508', '#1A080B', '#0F0508']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 18,
              borderWidth: 1.5,
              borderColor: '#B22A2A',
              shadowColor: '#FF4444',
              shadowOpacity: 0.25,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 4 },
              elevation: 14,
              overflow: 'hidden',
            }}
          >
            {/* Subtle outer sweep */}
            <LinearGradient
              colors={['rgba(178,42,42,0.07)', 'transparent', 'rgba(212,175,55,0.06)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
            />

            {/* Top crimson ornament line */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#B22A2A' }} />
            {/* Bottom gold ornament line */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: '#D4AF37' }} />

            {/* Top rarity badge row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                backgroundColor: 'rgba(178,42,42,0.18)',
                borderWidth: 1,
                borderColor: 'rgba(178,42,42,0.55)',
                borderRadius: 99,
                paddingHorizontal: 11,
                paddingVertical: 4,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}>
                <Sparkles size={9} color="#D4584A" />
                <Text style={{ fontSize: sFont(9), fontWeight: '800', color: '#D4584A', letterSpacing: 1.1, textTransform: 'uppercase' }}>
                  {language === 'es' ? 'Evento · Épico' : 'Event · Epic'}
                </Text>
              </View>
              {isEventActive ? (
                <Text style={{ fontSize: sFont(10), color: 'rgba(212,175,55,0.50)', fontWeight: '700', letterSpacing: 3 }}>✝✦✝</Text>
              ) : (
                <View style={{ backgroundColor: 'rgba(80,80,80,0.35)', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 }}>
                  <Text style={{ fontSize: sFont(9), fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5 }}>
                    {language === 'es' ? 'Evento finalizado' : 'Event ended'}
                  </Text>
                </View>
              )}
            </View>

            {/* Pack illustration + info row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 16 }}>

              {/* ── THE PACK VISUAL — Resurrection theme ── */}
              <View style={{
                shadowColor: '#FF4444',
                shadowOpacity: 0.55,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 0 },
                elevation: 16,
              }}>
                <LinearGradient
                  colors={['#3D0A0A', '#200508', '#140308', '#0F0205']}
                  start={{ x: 0.15, y: 0 }}
                  end={{ x: 0.85, y: 1 }}
                  style={{
                    width: 84,
                    height: 116,
                    borderRadius: 12,
                    borderWidth: 2.5,
                    borderColor: '#B22A2A',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {/* Foil sweep */}
                  <LinearGradient
                    colors={['rgba(178,42,42,0.25)', 'transparent', 'rgba(212,175,55,0.10)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                  />
                  {/* Gloss streak */}
                  <LinearGradient
                    colors={['transparent', 'rgba(255,200,200,0.08)', 'transparent']}
                    start={{ x: 0, y: 0.2 }}
                    end={{ x: 1, y: 0.8 }}
                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                  />

                  {/* Top crimson border */}
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#B22A2A' }} />
                  {/* Bottom gold border */}
                  <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: '#D4AF37' }} />

                  {/* Inner frame */}
                  <View style={{
                    position: 'absolute',
                    top: 5, left: 5, right: 5, bottom: 5,
                    borderRadius: 7,
                    borderWidth: 0.75,
                    borderColor: 'rgba(178,42,42,0.40)',
                  }} />

                  {/* Corner ornaments */}
                  <Text style={{ position: 'absolute', top: 6, left: 6, fontSize: 7, color: '#D4AF37', opacity: 0.80 }}>✦</Text>
                  <Text style={{ position: 'absolute', top: 6, right: 6, fontSize: 7, color: '#D4AF37', opacity: 0.80 }}>✦</Text>
                  <Text style={{ position: 'absolute', bottom: 6, left: 6, fontSize: 7, color: '#D4AF37', opacity: 0.80 }}>✦</Text>
                  <Text style={{ position: 'absolute', bottom: 6, right: 6, fontSize: 7, color: '#D4AF37', opacity: 0.80 }}>✦</Text>

                  {/* Center emblem — empty tomb / resurrection light */}
                  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    {/* Glow aura */}
                    <View style={{
                      position: 'absolute',
                      width: 56, height: 56,
                      borderRadius: 28,
                      backgroundColor: 'rgba(255,180,80,0.08)',
                      borderWidth: 1,
                      borderColor: 'rgba(212,175,55,0.20)',
                    }} />
                    {/* Radiance rays */}
                    <Text style={{ position: 'absolute', fontSize: 38, color: 'rgba(212,175,55,0.08)', letterSpacing: 0 }}>✴</Text>
                    {/* Cross with light */}
                    <Text style={{
                      fontSize: 26,
                      color: '#D4AF37',
                      textShadowColor: 'rgba(255,200,80,0.70)',
                      textShadowRadius: 14,
                      textShadowOffset: { width: 0, height: 0 },
                      marginBottom: 2,
                    }}>✝</Text>
                  </View>

                  {/* Decorative ray lines */}
                  <Text style={{ position: 'absolute', top: 22, fontSize: 5, color: 'rgba(178,42,42,0.35)', letterSpacing: 5 }}>— — —</Text>

                  {/* Pack label */}
                  <View style={{ position: 'absolute', bottom: 11, alignItems: 'center' }}>
                    <Text style={{
                      fontSize: sFont(6),
                      fontWeight: '900',
                      color: '#D4AF37',
                      letterSpacing: 1.2,
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      lineHeight: 9,
                    }}>
                      SOBRE{'\n'}PASCUA
                    </Text>
                    <Text style={{ fontSize: sFont(5), color: 'rgba(212,175,55,0.55)', letterSpacing: 0.5, marginTop: 2.5 }}>
                      1 carta evento
                    </Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Text block */}
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: sFont(20),
                  fontWeight: '900',
                  color: '#FFFFFF',
                  letterSpacing: -0.5,
                  marginBottom: 4,
                }}>
                  {language === 'es' ? 'Sobre de Pascua' : 'Easter Pack'}
                </Text>
                <Text style={{
                  fontSize: sFont(12),
                  color: 'rgba(255,255,255,0.58)',
                  lineHeight: 18,
                  marginBottom: 8,
                }}>
                  {language === 'es'
                    ? 'La historia de la Pasión y Resurrección de Jesús'
                    : 'The story of the Passion and Resurrection of Jesus'}
                </Text>
                {/* Event chips */}
                <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Pascua 2026', color: '#D4584A' },
                    { label: '14 cartas', color: '#D4AF37' },
                  ].map(cat => (
                    <View key={cat.label} style={{
                      backgroundColor: cat.color + '15',
                      borderWidth: 0.75,
                      borderColor: cat.color + '50',
                      borderRadius: 99,
                      paddingHorizontal: 7,
                      paddingVertical: 2.5,
                    }}>
                      <Text style={{ fontSize: sFont(8), fontWeight: '700', color: cat.color, letterSpacing: 0.4 }}>
                        {cat.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Info strip */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              padding: 11,
              borderRadius: 12,
              marginBottom: 16,
              backgroundColor: 'rgba(178,42,42,0.07)',
              borderWidth: 1,
              borderColor: 'rgba(178,42,42,0.22)',
            }}>
              <Sparkles size={12} color="#D4584A" />
              <Text style={{ flex: 1, fontSize: sFont(11), color: 'rgba(212,120,100,0.85)', lineHeight: 16 }}>
                {language === 'es'
                  ? 'Carta aleatoria del evento · 14 cartas disponibles · Duplicados guardados.'
                  : 'Random event card · 14 cards available · Duplicates saved.'}
              </Text>
            </View>

            {/* Footer — price + CTA */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Coins size={17} color={isEventActive && canAfford ? '#D4AF37' : '#555'} />
                <Text style={{ fontSize: sFont(22), fontWeight: '900', color: isEventActive && canAfford ? '#D4AF37' : '#555' }}>
                  500
                </Text>
              </View>
              {isEventActive ? (
                <LinearGradient
                  colors={canAfford ? ['#B22A2A', '#8A1A1A'] : ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.06)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 99 }}
                >
                  <Pressable
                    onPress={onPress}
                    style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 99 }}
                  >
                    <Text style={{
                      fontSize: sFont(14),
                      fontWeight: '800',
                      color: canAfford ? '#FFFFFF' : 'rgba(255,255,255,0.30)',
                    }}>
                      {canAfford
                        ? (language === 'es' ? 'Obtener' : 'Open Pack')
                        : (language === 'es' ? 'Sin puntos' : 'Need points')}
                    </Text>
                  </Pressable>
                </LinearGradient>
              ) : (
                <View style={{
                  backgroundColor: 'rgba(80,80,80,0.30)',
                  borderRadius: 99,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                }}>
                  <Text style={{ fontSize: sFont(13), fontWeight: '700', color: 'rgba(255,255,255,0.28)' }}>
                    {language === 'es' ? 'Evento finalizado' : 'Event ended'}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// Token Item Card Component
function TokenItemCard({
  id, emoji, name, nameEs, description, descriptionEs, warning, warningEs,
  price, rarity, isOwned, isUsed, canAfford, colors, language, onPress, isHighlighted,
}: {
  id: string;
  emoji: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  warning: string;
  warningEs: string;
  price: number;
  rarity: string;
  isOwned: boolean;
  isUsed: boolean;
  canAfford: boolean;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
  isHighlighted?: boolean;
}) {
  const { sFont } = useScaledFont();
  const rarityColor = rarity === 'legendary' ? '#F59E0B' : RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const displayName = language === 'es' ? nameEs : name;
  const displayDesc = language === 'es' ? descriptionEs : description;
  const displayWarning = language === 'es' ? warningEs : warning;
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    shadowOpacity: glow.value * 0.8,
  }));

  React.useEffect(() => {
    if (isHighlighted) {
      glow.value = withSequence(
        withTiming(1, { duration: 300 }),
        withRepeat(withSequence(withTiming(0.3, { duration: 600 }), withTiming(1, { duration: 600 })), 3),
        withTiming(0, { duration: 400 }),
      );
      scale.value = withSequence(withSpring(1.02), withDelay(2400, withSpring(1)));
    }
  }, [isHighlighted]);

  return (
    // Phase D fix: split entering= and useAnimatedStyle onto separate elements.
    // Outer plain View has no animation; inner Animated.View has only useAnimatedStyle (no entering=).
    // This eliminates the "Property transform may be overwritten by layout animation" Reanimated warning.
    <View style={{ marginBottom: 12 }}>
      <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => { if (!isOwned) scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        <LinearGradient
          colors={isOwned ? [colors.surface, colors.surface] : ['#1A0A00', '#2D1500', '#1A0A00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 20,
            padding: 20,
            borderWidth: 1.5,
            borderColor: isHighlighted ? rarityColor : (isOwned ? colors.textMuted + '30' : rarityColor + '60'),
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 14 }}>
            <View style={{
              width: 64, height: 64, borderRadius: 20,
              backgroundColor: isOwned ? colors.background : rarityColor + '20',
              borderWidth: 2, borderColor: isOwned ? colors.textMuted + '30' : rarityColor + '50',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: sFont(32) }}>{emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              {/* Rarity badge */}
              <View style={{
                backgroundColor: rarityColor + '20', borderWidth: 1, borderColor: rarityColor + '50',
                borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4,
              }}>
                <Text style={{ fontSize: sFont(9), fontWeight: '800', color: rarityColor, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  {language === 'es' ? 'Legendario' : 'Legendary'} · {language === 'es' ? 'Único' : 'One-time'}
                </Text>
              </View>
              <Text style={{
                fontSize: sFont(18), fontWeight: '800', letterSpacing: -0.3,
                color: isOwned ? colors.textMuted : '#FFFFFF',
                marginBottom: 2,
              }}>
                {displayName}
              </Text>
              <Text style={{ fontSize: sFont(12), color: isOwned ? colors.textMuted : 'rgba(255,255,255,0.65)', lineHeight: 17 }}>
                {displayDesc}
              </Text>
            </View>
          </View>

          {/* Warning */}
          <View style={{
            flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 10, marginBottom: 14,
            backgroundColor: isOwned ? colors.textMuted + '10' : '#F59E0B10',
            borderWidth: 1, borderColor: isOwned ? colors.textMuted + '20' : '#F59E0B30',
          }}>
            <Text style={{ fontSize: sFont(13) }}>⚠️</Text>
            <Text style={{ flex: 1, fontSize: sFont(11), color: isOwned ? colors.textMuted : '#F59E0B', lineHeight: 16 }}>
              {displayWarning}
            </Text>
          </View>

          {/* Footer */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Coins size={16} color={isOwned ? colors.textMuted : canAfford ? '#F59E0B' : '#888'} />
              <Text style={{ fontSize: sFont(18), fontWeight: '800', color: isOwned ? colors.textMuted : canAfford ? '#F59E0B' : '#888' }}>
                {price.toLocaleString()}
              </Text>
            </View>
            {isOwned ? (
              <View style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99,
                backgroundColor: isUsed ? colors.textMuted + '20' : '#22C55E20',
                borderWidth: 1, borderColor: isUsed ? colors.textMuted + '30' : '#22C55E40',
                flexDirection: 'row', alignItems: 'center', gap: 5,
              }}>
                {isUsed
                  ? <Text style={{ fontSize: sFont(12), fontWeight: '700', color: colors.textMuted }}>{language === 'es' ? 'Ya utilizado' : 'Already used'}</Text>
                  : <>
                      <Check size={12} color="#22C55E" strokeWidth={3} />
                      <Text style={{ fontSize: sFont(12), fontWeight: '700', color: '#22C55E' }}>{language === 'es' ? 'Adquirido' : 'Owned'}</Text>
                    </>
                }
              </View>
            ) : (
              <View style={{
                paddingHorizontal: 20, paddingVertical: 10, borderRadius: 99,
                backgroundColor: canAfford ? '#F59E0B' : colors.textMuted + '30',
              }}>
                <Text style={{ fontSize: sFont(14), fontWeight: '700', color: canAfford ? '#000000' : colors.textMuted }}>
                  {canAfford
                    ? (language === 'es' ? 'Obtener' : 'Get')
                    : (language === 'es' ? 'Sin puntos' : 'Need points')}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
    </View>
  );
}

// Main Store Screen
export default function StoreScreen() {
  const { sFont } = useScaledFont();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const language = useLanguage();
  const points = useUserPoints();
  const user = useUser();
  const router = useRouter();
  const { openCategory, t: openCategoryT } = useLocalSearchParams<{ openCategory?: string; t?: string }>();
  const updateUser = useAppStore((s) => s.updateUser);
  const newGiftItemIds = useAppStore((s) => s.newGiftItemIds);
  const clearNewGiftItem = useAppStore((s) => s.clearNewGiftItem);
  const resumeTick = useAppStore((s) => s.resumeTick);
  const t = TRANSLATIONS[language];
  const queryClient = useQueryClient();

  const [activeCategory, setActiveCategory] = useState<CategoryType | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string>('all');
  const [highlightPincel, setHighlightPincel] = useState(false);
  const [showPointsToast, setShowPointsToast] = useState(false);
  const [toastAmount, setToastAmount] = useState(0);
  const [toastPositive, setToastPositive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | undefined>(undefined);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorToastMessage, setErrorToastMessage] = useState<string>('');
  const [allChallengesComplete, setAllChallengesComplete] = useState(false);
  const [showChestModal, setShowChestModal] = useState(false);
  const [showCollectionDetailModal, setShowCollectionDetailModal] = useState(false);
  const [showChapterCollectionModal, setShowChapterCollectionModal] = useState(false);
  const [selectedChapterCollection, setSelectedChapterCollection] = useState<ChapterCollection | null>(null);
  const [showStoreSectionModal, setShowStoreSectionModal] = useState(false);
  const [storeSectionModalCategory, setStoreSectionModalCategory] = useState<CategoryType | null>(null);
  // Sub-menu modal: 'personalizacion' | 'colecciones' | null
  const [showSubMenuModal, setShowSubMenuModal] = useState(false);
  const [subMenuType, setSubMenuType] = useState<'personalizacion' | 'colecciones' | null>(null);
  // Track if StoreSectionModal was opened from submenu, so Back returns to submenu
  const storeSectionFromSubmenu = useRef<'personalizacion' | 'colecciones' | null>(null);
  const [pincelMagicoSource, setPincelMagicoSource] = useState<'store' | 'used' | null>(null);
  const [showCardRevealModal, setShowCardRevealModal] = useState(false);
  const [revealedCard, setRevealedCard] = useState<{ cardId: string; wasNew: boolean } | null>(null);
  // isPackTransactionActive: true = purchase in flight or reveal showing → disables all pack buttons
  const [isPackTransactionActive, setIsPackTransactionActive] = useState(false);
  const isDailyPackClaiming = useRef(false);
  // Inner dedup ref — zero re-render overhead, checked before setting state
  const isTokenPurchasing = useRef(false);
  // Failsafe timeout handle — clears stuck transaction state after 2s
  const packFailsafeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset transaction locks when app returns to foreground (resumeTick bumped by _layout.tsx)
  // This fixes the bug where minimizing mid-purchase leaves locks stuck and pack buttons disabled.
  useEffect(() => {
    if (resumeTick === 0) return; // Skip initial mount
    if (packFailsafeTimeout.current) {
      clearTimeout(packFailsafeTimeout.current);
      packFailsafeTimeout.current = null;
    }
    isTokenPurchasing.current = false;
    isDailyPackClaiming.current = false;
    setIsPackTransactionActive(false);
  }, [resumeTick]);

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

  // Gift send modal state
  const [showGiftSendModal, setShowGiftSendModal] = useState(false);
  const [giftSendItem, setGiftSendItem] = useState<GiftSendItem | null>(null);

  // Pending navigation target: set when user taps "Ir →" from a collection modal
  const [pendingNavTarget, setPendingNavTarget] = useState<{
    itemId: string;
    itemType: 'avatar' | 'frame' | 'title' | 'theme';
  } | null>(null);

  // Pending adventure route: set when "Ver aventura" closes StoreSectionModal
  const [pendingAdventureNav, setPendingAdventureNav] = useState<string | null>(null);

  // Pending pack reveal: set on purchase success, dispatched to root layer after sheet fully closes
  const [pendingPackReveal, setPendingPackReveal] = useState<{
    drawnCard: { cardId: string; wasNew: boolean };
    packType: 'sobre_biblico' | 'pack_pascua';
  } | null>(null);
  const requestPackReveal = useRequestPackReveal();

  // ScrollView ref for programmatic scrolling
  const mainScrollViewRef = useRef<ScrollView>(null);
  // Track current scroll offset so we can compute absolute item positions
  const scrollOffsetY = useRef(0);
  // Track the ScrollView's on-screen Y position (for measureInWindow math)
  const scrollViewPageY = useRef(0);
  // Map of itemId → View ref for highlight + scroll-to
  const itemViewRefs = useRef<Map<string, View>>(new Map());
  // Anti-freeze guards: prevent double modal opens and rapid tap queuing
  const isOpeningModal = useRef(false);
  const lastCategoryTapAt = useRef(0);
  const isOpeningItem = useRef(false);

  // Close StoreSectionModal: if it was opened from a submenu, return to that submenu
  const closeStoreSectionModal = useCallback(() => {
    setShowStoreSectionModal(false);
    const src = storeSectionFromSubmenu.current;
    if (src) {
      storeSectionFromSubmenu.current = null;
      setTimeout(() => {
        setSubMenuType(src);
        setShowSubMenuModal(true);
      }, 350);
    }
  }, []);

  const userId = user?.id || '';
  const purchasedItems = user?.purchasedItems ?? [];

  // State for synced backend user ID (might be different from local if user was created offline)
  const [syncedBackendUserId, setSyncedBackendUserId] = useState<string | null>(null);
  const effectiveUserId = syncedBackendUserId || userId;

  // Chapter collection progress (AsyncStorage + backend sync)
  const { claimedChapterIds, claimChapter } = useChapterCollectionProgress(effectiveUserId);

  // NEW items state — tracks which catalog items the user hasn't seen yet
  const { seenMap: newItemsSeenMap, markSeen: markNewItemSeen } = useNewItemsState();
  const newAvatarIds = useMemo(() => computeNewAvatarIds(newItemsSeenMap), [newItemsSeenMap]);

  // Fetch all DB store items to power the isNew badge system
  const { data: allDbStoreItems = [] } = useQuery({
    queryKey: ['allStoreItems'],
    queryFn: async () => {
      const res = await gamificationApi.getStoreItems();
      return res.items;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
  // Compute set of new (unseen) DB item IDs
  const newDbItemIds = useMemo(
    () => computeNewStoreItemIds(allDbStoreItems, newItemsSeenMap),
    [allDbStoreItems, newItemsSeenMap]
  );
  // Per-category "has new" flags
  const categoryHasNew = useMemo(() => ({
    themes: allDbStoreItems.some(i => i.type === 'theme' && newDbItemIds.has(i.id)),
    frames: allDbStoreItems.some(i => i.type === 'frame' && newDbItemIds.has(i.id)),
    titles: allDbStoreItems.some(i => i.type === 'title' && newDbItemIds.has(i.id)),
    avatars: newAvatarIds.size > 0 || allDbStoreItems.some(i => i.type === 'avatar' && newDbItemIds.has(i.id)),
    bundles: allDbStoreItems.some(i => i.type === 'bundle' && newDbItemIds.has(i.id)),
    collections: false,
    adventures: false,
  }), [allDbStoreItems, newDbItemIds, newAvatarIds]);

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
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
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
    retry: 1,
  });

  // Active seasons — drive banner + seasonal content visibility
  const { data: activeSeasons = [] } = useQuery({
    queryKey: ['activeSeasons'],
    queryFn: () => gamificationApi.getActiveSeasons(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const primarySeason = activeSeasons[0] ?? null;
  const activeSeasonIds = useMemo(() => activeSeasons.map((s) => s.id), [activeSeasons]);

  // Seasonal store items (bundles only) — DB-driven
  const { data: seasonalItemsData } = useQuery({
    queryKey: ['seasonalItems', primarySeason?.id],
    queryFn: async () => {
      const res = await gamificationApi.getStoreItems();
      const seasonal = res.items.filter(
        (item) => item.seasonId && activeSeasons.some((s) => s.id === item.seasonId)
      );
      return seasonal;
    },
    enabled: activeSeasons.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const seasonalBundles: StoreItem[] = (seasonalItemsData ?? []).filter(i => i.type === 'bundle');
  const seasonalAvatars: StoreItem[] = (seasonalItemsData ?? []).filter(i => i.type === 'avatar');
  const seasonalFrames: StoreItem[] = (seasonalItemsData ?? []).filter(i => i.type === 'frame');
  const seasonalTitles: StoreItem[] = (seasonalItemsData ?? []).filter(i => i.type === 'title');
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
      } else if (!data.success) {
        const msg = data.error ?? (language === 'es' ? 'Error al comprar' : 'Purchase failed');
        console.warn('[Store] Purchase failed:', msg);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setErrorToastMessage(msg);
        setShowErrorToast(true);
      }
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : '';
      console.error('[Store] Purchase network error:', msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorToastMessage(language === 'es' ? 'Error al conectar con el servidor' : 'Could not connect to server');
      setShowErrorToast(true);
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
      // Invalidate community so the new title/frame/avatar shows up for others
      queryClient.invalidateQueries({ queryKey: ['community-members'] });
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
        // Close the section modal so the toast (which is outside it) becomes visible
        setShowStoreSectionModal(false);
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
      // Close the collection modal and section modal so the toast is visible
      setShowCollectionDetailModal(false);
      setSelectedCollection(null);
      setShowStoreSectionModal(false);
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
    // Guard: ignore duplicate rapid taps on the same item
    if (isOpeningItem.current) return;
    isOpeningItem.current = true;
    setTimeout(() => { isOpeningItem.current = false; }, 500);
    setSelectedDetailItem(item);
    setShowDetailModal(true);
    Haptics.selectionAsync();
    // Clear new-gift badge when user opens the item
    if (item.id) clearNewGiftItem(item.id);
    // Mark catalog NEW item as seen
    if (item.id) markNewItemSeen(item.id);
  }, [clearNewGiftItem, markNewItemSeen]);

  // Destructure mutation functions for stable references (eslint requirement)
  const { mutate: purchaseMutate } = purchaseMutation;
  const { mutate: equipMutate } = equipMutation;
  const { mutate: bundlePurchaseMutate } = bundlePurchaseMutation;

  // Handle bundle purchase
  const handleBundlePurchase = useCallback((bundle: typeof STORE_BUNDLES[string]) => {
    if (bundlePurchaseMutation.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    bundlePurchaseMutate({
      bundleId: bundle.id,
      itemIds: bundle.items,
      bundlePrice: bundle.bundlePrice,
    });
  }, [bundlePurchaseMutate, bundlePurchaseMutation.isPending]);

  // Handle purchase from modal
  const handlePurchase = useCallback(() => {
    if (!selectedDetailItem) return;
    // Guard: prevent double-tap purchase while already processing
    if (purchaseMutation.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    markNewItemSeen(selectedDetailItem.id);
    purchaseMutate({ itemId: selectedDetailItem.id });
  }, [selectedDetailItem, purchaseMutate, markNewItemSeen, purchaseMutation.isPending]);

  // Handle equip from modal
  const handleEquip = useCallback(() => {
    if (!selectedDetailItem) return;
    markNewItemSeen(selectedDetailItem.id);
    equipMutate({
      type: selectedDetailItem.type as 'theme' | 'frame' | 'title' | 'music' | 'avatar',
      itemId: selectedDetailItem.id,
    });
  }, [selectedDetailItem, equipMutate, markNewItemSeen]);

  // Handle weekly chest claim
  const handleChestClaim = useCallback(() => {
    // Deterministic reward based on week + userId
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    const currentWeekId = `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;

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

  // Fetch pincel_magico inventory state when tokens tab is active.
  // Also kick off card image preload so artwork is cached before the user taps "Ver álbum".
  useEffect(() => {
    if ((activeCategory === 'tokens' || storeSectionModalCategory === 'tokens') && userId) {
      // Warm image cache as soon as the user opens Objetos Especiales
      preloadCardImages();
      gamificationApi.getUser(userId).then(profile => {
        const pincelInv = profile.inventory.find(inv => inv.itemId === 'pincel_magico');
        if (pincelInv) {
          setPincelMagicoSource(pincelInv.source as 'store' | 'used');
        } else {
          setPincelMagicoSource(null);
        }
      }).catch(() => {});
    }
  }, [activeCategory, storeSectionModalCategory, userId]);

  // Handle token purchases (pincel_magico, sobre_biblico, pack_pascua)
  // STABILITY-FIRST: close sheet first, dispatch reveal to root layer after sheet dismisses.
  // isPackTransactionActive (state) disables all pack buttons during the flow.
  const handleTokenPurchase = async (itemId: string, price: number) => {
    console.log('[Store][Lock] handleTokenPurchase pressed', { itemId, price, isTokenPurchasing: isTokenPurchasing.current, isPackTransactionActive });
    if (!userId || points < price) return;
    if (isTokenPurchasing.current) {
      console.log('[Store][Lock] BLOCKED — purchase already in flight');
      return;
    }

    // Arm both the ref (inner, zero-render) and the state (outer, disables buttons)
    isTokenPurchasing.current = true;
    setIsPackTransactionActive(true);
    console.log('[Store][Lock] acquired — isPackTransactionActive=true');

    // Failsafe: forcibly unlock after 2s in case anything gets stuck
    if (packFailsafeTimeout.current) clearTimeout(packFailsafeTimeout.current);
    packFailsafeTimeout.current = setTimeout(() => {
      console.log('[Store][Failsafe] 2s timeout fired — unlocking store');
      isTokenPurchasing.current = false;
      setIsPackTransactionActive(false);
      setToastMessage(language === 'es' ? 'Carta obtenida. Revisa tu Álbum Bíblico.' : 'Card obtained. Check your Biblical Album.');
    }, 2000);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      console.log('[Store][API] purchaseItem started', { itemId });
      const res = await gamificationApi.purchaseItem(userId, itemId);
      console.log('[Store][API] purchaseItem response', { success: res.success, newPoints: res.newPoints, drawnCard: res.drawnCard });

      if (res.success) {
        updateUser({ points: res.newPoints, purchasedItems: [...purchasedItems, itemId] });
        console.log('[Store][Inventory] user points updated to', res.newPoints);

        if (itemId === 'pincel_magico') {
          setPincelMagicoSource('store');
          setToastMessage(language === 'es' ? '¡Pincel Mágico adquirido!' : 'Magic Paintbrush acquired!');
        } else if (itemId === 'sobre_biblico' || itemId === 'pack_pascua') {
          const drawn = res.drawnCard ?? null;
          console.log('[Store][Card] drawn card', drawn);
          if (drawn) {
            // Queue the reveal to fire AFTER the Store sheet fully closes.
            // The useEffect below dispatches it to the root-level overlay layer.
            console.log('[Store][Reveal] queuing reveal, closing sheet');
            setPendingPackReveal({
              drawnCard: drawn,
              packType: itemId as 'sobre_biblico' | 'pack_pascua',
            });
            setShowStoreSectionModal(false);
          } else {
            console.log('[Store][Card] no drawn card returned — toast only');
          }
        }
        setToastAmount(price);
        setToastPositive(false);
        setShowPointsToast(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: ['allStoreItems'] });
        queryClient.invalidateQueries({ queryKey: ['backendUser'] });
        // If a card was drawn, invalidate the album inventory so it appears immediately
        if (itemId === 'sobre_biblico' || itemId === 'pack_pascua') {
          queryClient.invalidateQueries({ queryKey: ['biblical-cards'] });
        }
      }
    } catch (err) {
      console.log('[Store][Error] purchaseItem failed', err);
    } finally {
      // Always release lock — reveal is now handled by the root overlay, not this modal
      if (packFailsafeTimeout.current) {
        clearTimeout(packFailsafeTimeout.current);
        packFailsafeTimeout.current = null;
      }
      isTokenPurchasing.current = false;
      setIsPackTransactionActive(false);
      console.log('[Store][Lock] released — isPackTransactionActive=false');
    }
  };

  // ── Daily free pack ──
  const { data: dailyPackStatus, refetch: refetchDailyPack } = useQuery({
    queryKey: ['dailyPackStatus', userId],
    queryFn: () => userId ? gamificationApi.getDailyPackStatus(userId) : null,
    enabled: !!userId,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60_000,
  });

  const handleClaimDailyPack = useCallback(async (packType: 'sobre_biblico' | 'pack_pascua') => {
    if (!userId || isDailyPackClaiming.current) return;
    if (!dailyPackStatus?.canClaim) return;
    isDailyPackClaiming.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    try {
      const res = await gamificationApi.claimDailyPack(userId, packType);
      console.log('[Store][DailyPack] claimed', res);
      if (res.success && res.drawnCard) {
        refetchDailyPack();
        queryClient.invalidateQueries({ queryKey: ['biblical-cards'] });
        queryClient.invalidateQueries({ queryKey: ['backendUser'] });
        console.log('[Store][DailyPack] queuing reveal, closing sheet');
        setPendingPackReveal({
          drawnCard: res.drawnCard,
          packType,
        });
        setShowStoreSectionModal(false);
      }
    } catch (err) {
      console.log('[Store][DailyPack] claim error', err);
    } finally {
      isDailyPackClaiming.current = false;
    }
  }, [userId, dailyPackStatus]);

  // Handle openCategory navigation param (e.g. from settings lock button)
  useEffect(() => {
    if (openCategory === 'tokens') {
      setActiveSubcategory('tokens');
      setStoreSectionModalCategory('tokens');
      setShowStoreSectionModal(true);
      setHighlightPincel(true);
      setTimeout(() => setHighlightPincel(false), 3000);
    }
  }, [openCategory, openCategoryT]);

  // Render category content
  const renderCategoryContent = (overrideCategory?: CategoryType, disableAnimations?: boolean) => {
    const currentCategory = overrideCategory ?? activeCategory;
    const screenWidth = Dimensions.get('window').width;

    switch (currentCategory) {
      case 'themes': {
        const allThemes = Object.values(PURCHASABLE_THEMES);
        const filteredThemes = activeSubcategory === 'v2'
          ? allThemes.filter(t => t.id.includes('_v2_') || t.id.includes('amanecer_dorado') || t.id.includes('cielo_gloria') || t.id.includes('noche_profunda') || t.id.includes('bosque_sereno') || t.id.includes('promesa') || t.id.includes('jardin') || t.id.includes('horizonte') || t.id.includes('sanctum') || t.id.includes('fuego_sagrado_t') || t.id.includes('noche_santa') || t.id.includes('rio_vida') || t.id.includes('pastor') || t.id.includes('capilla') || t.id.includes('tierra_prometida') || t.id.includes('voz_silencio'))
          : allThemes;

        const THEME_SUBCATS = [
          { key: 'all', labelEs: 'Todos', label: 'All' },
          { key: 'v2', labelEs: 'V2 Premium', label: 'V2 Premium' },
        ];

        return (
          <View>
            {/* Subcategory filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 8, flexDirection: 'row' }}
            >
              {THEME_SUBCATS.map(sc => (
                <Pressable
                  key={sc.key}
                  onPress={() => { Haptics.selectionAsync(); setActiveSubcategory(sc.key); }}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 99,
                    backgroundColor: activeSubcategory === sc.key ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: activeSubcategory === sc.key ? colors.primary : colors.textMuted + '30',
                  }}
                >
                  <Text style={{ fontSize: sFont(13), fontWeight: '600', color: activeSubcategory === sc.key ? '#FFFFFF' : colors.textMuted }}>
                    {language === 'es' ? sc.labelEs : sc.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'flex-start' }}>
              {filteredThemes.map((theme, index) => {
                const { isOwned, isEquipped, canAfford } = getItemStatus(theme.id, 'theme', theme.price ?? 0);
                return (
                  <Animated.View key={theme.id} entering={disableAnimations ? undefined : FadeInRight.delay(index * 50).duration(300)} style={{ width: '48%' }}>
                    <PremiumThemeCard
                      themeData={theme}
                      isOwned={isOwned}
                      isEquipped={isEquipped}
                      canAfford={canAfford}
                      colors={colors}
                      language={language}
                      isHighlighted={pendingNavTarget?.itemId === theme.id}
                      isNewGift={newGiftItemIds.includes(theme.id) || newDbItemIds.has(theme.id)}
                      viewRef={(ref) => { if (ref) itemViewRefs.current.set(theme.id, ref as unknown as View); }}
                      onPress={() => handleItemPress({
                        id: theme.id, type: 'theme', name: theme.name, nameEs: theme.nameEs,
                        description: theme.description, descriptionEs: theme.descriptionEs,
                        price: theme.price ?? 0, rarity: theme.rarity, colors: theme.colors, chestOnly: theme.chestOnly,
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
        const filteredFrames = activeSubcategory === 'v2'
          ? allFrames.filter(f => 'isV2' in f && (f as any).isV2 === true || f.id.includes('_v2_'))
          : activeSubcategory === 'v1'
          ? allFrames.filter(f => !('isV2' in f) || !(f as any).isV2)
          : allFrames;

        const FRAME_SUBCATS = [
          { key: 'all', labelEs: 'Todos', label: 'All' },
          { key: 'v1', labelEs: 'V1 Básico', label: 'V1 Basic' },
          { key: 'v2', labelEs: 'V2 Ilustrado', label: 'V2 Illustrated' },
        ];

        return (
          <View>
            {/* Seasonal frames section */}
            {seasonalFrames.length > 0 && primarySeason && (
              <SeasonalItemsSection
                items={seasonalFrames}
                season={primarySeason}
                purchasedItems={purchasedItems}
                points={points}
                colors={colors}
                language={language}
                onPress={(item) => handleItemPress({
                  id: item.id, type: 'frame',
                  name: item.nameEn, nameEs: item.nameEs,
                  description: item.descriptionEn, descriptionEs: item.descriptionEs,
                  price: item.pricePoints, rarity: item.rarity,
                })}
              />
            )}
            {/* Subcategory filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 8, flexDirection: 'row' }}
            >
              {FRAME_SUBCATS.map(sc => (
                <Pressable
                  key={sc.key}
                  onPress={() => { Haptics.selectionAsync(); setActiveSubcategory(sc.key); }}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 99,
                    backgroundColor: activeSubcategory === sc.key ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: activeSubcategory === sc.key ? colors.primary : colors.textMuted + '30',
                  }}
                >
                  <Text style={{ fontSize: sFont(13), fontWeight: '600', color: activeSubcategory === sc.key ? '#FFFFFF' : colors.textMuted }}>
                    {language === 'es' ? sc.labelEs : sc.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: gap, alignItems: 'flex-start' }}>
              {filteredFrames.map((frame, index) => {
                const { isOwned, isEquipped, canAfford } = getItemStatus(frame.id, 'frame', frame.price ?? 0);

                return (
                  <Animated.View
                    key={frame.id}
                    entering={disableAnimations ? undefined : FadeInRight.delay(index * 40).duration(300)}
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
                      isNewGift={newGiftItemIds.includes(frame.id) || newDbItemIds.has(frame.id)}
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

      case 'titles': {
        const TITLE_SUBCATS = [
          { key: 'all', labelEs: 'Todos', label: 'All' },
          { key: 'v1', labelEs: 'V1 Básico', label: 'V1 Basic' },
          { key: 'v2_citas', labelEs: 'V2 Citas Bíblicas', label: 'V2 Bible Quotes' },
        ];
        const allTitles = Object.values(SPIRITUAL_TITLES);
        const filteredTitles = activeSubcategory === 'v1'
          ? allTitles.filter(t => !t.chestOnly && !t.isV2)
          : activeSubcategory === 'v2_citas'
          ? allTitles.filter(t => t.isV2 && t.bibleRef)
          : allTitles;

        return (
          <View>
            {/* Seasonal titles section */}
            {seasonalTitles.length > 0 && primarySeason && (
              <SeasonalItemsSection
                items={seasonalTitles}
                season={primarySeason}
                purchasedItems={purchasedItems}
                points={points}
                colors={colors}
                language={language}
                onPress={(item) => handleItemPress({
                  id: item.id, type: 'title',
                  name: item.nameEn, nameEs: item.nameEs,
                  description: item.descriptionEn, descriptionEs: item.descriptionEs,
                  price: item.pricePoints, rarity: item.rarity,
                })}
              />
            )}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 8, flexDirection: 'row' }}
            >
              {TITLE_SUBCATS.map(sc => (
                <Pressable
                  key={sc.key}
                  onPress={() => { Haptics.selectionAsync(); setActiveSubcategory(sc.key); }}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 99,
                    backgroundColor: activeSubcategory === sc.key ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: activeSubcategory === sc.key ? colors.primary : colors.textMuted + '30',
                  }}
                >
                  <Text style={{ fontSize: sFont(13), fontWeight: '600', color: activeSubcategory === sc.key ? '#FFFFFF' : colors.textMuted }}>
                    {language === 'es' ? sc.labelEs : sc.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <View className="px-5">
              {filteredTitles.map((title, index) => {
                const { isOwned, isEquipped, canAfford } = getItemStatus(title.id, 'title', title.price ?? 0);

                return (
                  <Animated.View
                    key={title.id}
                    entering={disableAnimations ? undefined : FadeInDown.delay(index * 40).duration(300)}
                  >
                    <PremiumTitleCard
                      titleData={title}
                      isOwned={isOwned}
                      isEquipped={isEquipped}
                      canAfford={canAfford}
                      colors={colors}
                      language={language}
                      isHighlighted={pendingNavTarget?.itemId === title.id}
                      isNewGift={newGiftItemIds.includes(title.id) || newDbItemIds.has(title.id)}
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
          </View>
        );
      }

      case 'avatars': {
        const horizontalPadding = 40;
        const gap = 12;
        const numColumns = 3;
        const itemWidth = (screenWidth - horizontalPadding - (gap * (numColumns - 1))) / numColumns;

        const AVATAR_SUBCATS = [
          { key: 'all', labelEs: 'Todos', label: 'All' },
          { key: 'v1', labelEs: 'V1 Básico', label: 'V1 Basic' },
          { key: 'v2', labelEs: 'V2 Ilustrado', label: 'V2 Illustrated' },
          { key: 'v3_premium', labelEs: '✨ V3 Premium', label: '✨ V3 Premium', isNew: true },
          { key: 'adventures', labelEs: '⭐ Aventuras', label: '⭐ Adventures' },
        ];
        const allAvatarsList = DEFAULT_AVATARS as readonly (typeof DEFAULT_AVATARS[0])[];
        const filteredAvatars = activeSubcategory === 'v1'
          ? allAvatarsList.filter(a => !('isV2' in a) || !(a as any).isV2)
          : activeSubcategory === 'v2'
          ? allAvatarsList.filter(a => (a as any).isV2 === true && a.id.startsWith('avatar_v2_'))
          : activeSubcategory === 'v3_premium'
          ? allAvatarsList.filter(a => (a as any).isV3 === true)
          : activeSubcategory === 'adventures'
          ? allAvatarsList.filter(a => (a as any).isAdventure === true)
          : allAvatarsList;

        return (
          <View>
            {/* Seasonal avatars section */}
            {seasonalAvatars.length > 0 && primarySeason && (activeSubcategory === 'all' || activeSubcategory === 'adventures' || activeSubcategory === 'v3_premium') && (
              <SeasonalItemsSection
                items={seasonalAvatars}
                season={primarySeason}
                purchasedItems={purchasedItems}
                points={points}
                colors={colors}
                language={language}
                onPress={(item) => handleItemPress({
                  id: item.id, type: 'avatar',
                  name: item.nameEn, nameEs: item.nameEs,
                  description: item.descriptionEn, descriptionEs: item.descriptionEs,
                  price: item.pricePoints, rarity: item.rarity,
                })}
              />
            )}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 8, flexDirection: 'row' }}
            >
              {AVATAR_SUBCATS.map(sc => {
                const subcatHasNew = (sc as any).isNew && newAvatarIds.size > 0;
                return (
                <Pressable
                  key={sc.key}
                  onPress={() => { Haptics.selectionAsync(); setActiveSubcategory(sc.key); }}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 99,
                    backgroundColor: activeSubcategory === sc.key ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: activeSubcategory === sc.key ? colors.primary : (subcatHasNew ? '#22C55E' : colors.textMuted + '30'),
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Text style={{ fontSize: sFont(13), fontWeight: '600', color: activeSubcategory === sc.key ? '#FFFFFF' : colors.textMuted }}>
                    {language === 'es' ? sc.labelEs : sc.label}
                  </Text>
                  {subcatHasNew && activeSubcategory !== sc.key && (
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E' }} />
                  )}
                </Pressable>
              );})}
            </ScrollView>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: gap, alignItems: 'flex-start' }}>
              {filteredAvatars.map((avatar, index) => {
                const hasCost = 'price' in avatar && (avatar as { price: number }).price > 0;
                const price = hasCost ? (avatar as { price: number }).price : 0;
                const { isOwned, isEquipped, canAfford } = getItemStatus(avatar.id, 'avatar', price);
                const isNewItem = newAvatarIds.has(avatar.id);

                return (
                  <Animated.View
                    key={avatar.id}
                    entering={disableAnimations ? undefined : FadeInRight.delay(index * 35).duration(300)}
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
                      isNewGift={newGiftItemIds.includes(avatar.id) || newDbItemIds.has(avatar.id)}
                      isNew={isNewItem}
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
          </View>
        );
      }

      case 'bundles': {
        const BUNDLE_SUBCATS = [
          { key: 'all', labelEs: 'Todos', label: 'All' },
          { key: 'adventures', labelEs: 'Aventuras Bíblicas', label: 'Biblical Adventures' },
          ...(seasonalBundles.length > 0 ? [{ key: 'season', labelEs: '✝ Temporada', label: '✝ Season' }] : []),
        ];
        const allBundlesRaw = Object.values(STORE_BUNDLES);

        // Sort: season-active first → incomplete/not-owned → newest → stable
        const allBundles = sortBundlesForUser(allBundlesRaw, purchasedItems, activeSeasonIds, true);

        const filteredBundles = activeSubcategory === 'adventures'
          ? allBundles.filter(b => (b as any).isAdventure === true)
          : activeSubcategory === 'season'
          ? [] // Only seasonal DB bundles shown below
          : allBundles;

        // Seasonal bundles shown when: 'all' or 'season' tab is active
        const showSeasonalBundles =
          (activeSubcategory === 'all' || activeSubcategory === 'season') &&
          seasonalBundles.length > 0;

        return (
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 8, flexDirection: 'row' }}
            >
              {BUNDLE_SUBCATS.map(sc => (
                <Pressable
                  key={sc.key}
                  onPress={() => { Haptics.selectionAsync(); setActiveSubcategory(sc.key); }}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 99,
                    backgroundColor: activeSubcategory === sc.key ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: activeSubcategory === sc.key ? colors.primary : colors.textMuted + '30',
                  }}
                >
                  <Text style={{ fontSize: sFont(13), fontWeight: '600', color: activeSubcategory === sc.key ? '#FFFFFF' : colors.textMuted }}>
                    {language === 'es' ? sc.labelEs : sc.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <View className="px-5">
              {/* ── Seasonal bundles first ─────────────────────── */}
              {showSeasonalBundles && primarySeason && (
                <>
                  {/* Season section header */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: (primarySeason.accentColor || '#7A1F1F') + '40' }} />
                    <Text style={{ fontSize: sFont(11), fontWeight: '700', color: primarySeason.accentColor || '#7A1F1F', letterSpacing: 0.5 }}>
                      {language === 'es' ? primarySeason.name.toUpperCase() : primarySeason.name.toUpperCase()}
                    </Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: (primarySeason.accentColor || '#7A1F1F') + '40' }} />
                  </View>
                  {seasonalBundles.map((item) => (
                    <SeasonalAdventureCard
                      key={item.id}
                      item={item}
                      season={primarySeason}
                      purchasedItems={purchasedItems}
                      points={points}
                      colors={colors}
                      language={language}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        bundlePurchaseMutation.mutate({
                          bundleId: item.id,
                          itemIds: (() => {
                            try { return JSON.parse(item.metadata)?.rewards ?? []; } catch { return []; }
                          })(),
                          bundlePrice: item.pricePoints,
                        });
                      }}
                    />
                  ))}
                  {/* Divider before static bundles */}
                  {filteredBundles.length > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 4, gap: 8 }}>
                      <View style={{ flex: 1, height: 1, backgroundColor: colors.textMuted + '20' }} />
                      <Text style={{ fontSize: sFont(10), fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 }}>
                        {language === 'es' ? 'OTROS PAQUETES' : 'OTHER BUNDLES'}
                      </Text>
                      <View style={{ flex: 1, height: 1, backgroundColor: colors.textMuted + '20' }} />
                    </View>
                  )}
                </>
              )}
              {/* ── Regular bundles ────────────────────────────── */}
              {filteredBundles.map((bundle, index) => (
                <Animated.View
                  key={bundle.id}
                  entering={disableAnimations ? undefined : FadeInDown.delay(index * 60).duration(400)}
                >
                  <BundleCard
                    bundle={bundle}
                    purchasedItems={purchasedItems}
                    points={points}
                    colors={colors}
                    language={language}
                    onPress={() => handleBundlePurchase(bundle)}
                    isPurchasing={bundlePurchaseMutation.isPending}
                    onViewAdventure={(targetType, targetId) => {
                      if (isOpeningModal.current) return;
                      isOpeningModal.current = true;
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      if (targetType === 'collection') {
                        // Resolve targetId — 'collection_growth_path' maps to the Naturaleza Bíblica collection
                        const resolvedId = targetId === 'collection_growth_path' ? 'collection_v2_naturaleza' : targetId;
                        const stdCol = Object.values(ITEM_COLLECTIONS).find(c => c.id === resolvedId);
                        if (stdCol) {
                          setSelectedCollection(stdCol as any);
                          setShowCollectionDetailModal(true);
                          isOpeningModal.current = false;
                        }
                      } else {
                        const route = `/collections/adventures?bundleId=${bundle.id}`;
                        setPendingAdventureNav(route);
                        setShowStoreSectionModal(false);
                        // Failsafe: release lock if useEffect never fires
                        setTimeout(() => {
                          isOpeningModal.current = false;
                        }, 1500);
                      }
                    }}
                  />
                </Animated.View>
              ))}
            </View>
          </View>
        );
      }

      case 'collections':
        return (
          <View className="px-5">
            {/* ── Chapter Collections (Spiritual Paths) ── */}
            {Object.values(CHAPTER_COLLECTIONS).map((chCol, index) => (
              <Animated.View
                key={chCol.collectionId}
                entering={disableAnimations ? undefined : FadeInDown.delay(index * 60).duration(400)}
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
              <Text style={{ fontSize: sFont(10), fontWeight: '700', color: colors.textMuted, paddingHorizontal: 12, letterSpacing: 0.5 }}>
                {language === 'es' ? 'COLECCIONES LIBRES' : 'FREE COLLECTIONS'}
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.textMuted + '20' }} />
            </View>

            {/* ── Standard Collections ── */}
            {Object.values(ITEM_COLLECTIONS).map((collection, index) => (
              <Animated.View
                key={collection.id}
                entering={disableAnimations ? undefined : FadeInDown.delay((index + Object.values(CHAPTER_COLLECTIONS).length) * 60).duration(400)}
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

      case 'tokens': {
        const hasPincel = purchasedItems.includes('pincel_magico') || pincelMagicoSource !== null;
        const isUsed = pincelMagicoSource === 'used';
        const canAffordPincel = points >= 15000;
        const canAffordSobre = points >= 500;
        const canAffordEaster = points >= 500;
        // Set to false when the Pascua 2026 event ends
        const EASTER_EVENT_ACTIVE = true;

        const TOKEN_SUBCATS = [
          { key: 'cartas', labelEs: 'Cartas Bíblicas', label: 'Biblical Cards' },
          { key: 'tokens', labelEs: 'Tokens', label: 'Tokens' },
          { key: 'insignias', labelEs: 'Insignias', label: 'Badges' },
        ];
        const activeSubcat = activeSubcategory === 'all' ? 'cartas' : activeSubcategory;

        return (
          <View className="px-5">
            {/* Info banner */}
            <View style={{ marginBottom: 16, padding: 14, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.textMuted + '18' }}>
              <Text style={{ fontSize: sFont(13), color: colors.textMuted, lineHeight: 19 }}>
                {language === 'es'
                  ? 'Objetos especiales que desbloquean funciones únicas o amplían tu colección.'
                  : 'Special objects that unlock unique features or expand your collection.'}
              </Text>
            </View>

            {/* Subcategory tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
              {TOKEN_SUBCATS.map(sc => (
                <Pressable
                  key={sc.key}
                  onPress={() => { Haptics.selectionAsync(); setActiveSubcategory(sc.key); }}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 99,
                    backgroundColor: activeSubcat === sc.key ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: activeSubcat === sc.key ? colors.primary : colors.textMuted + '30',
                  }}
                >
                  <Text style={{ fontSize: sFont(13), fontWeight: '600', color: activeSubcat === sc.key ? '#FFFFFF' : colors.textMuted }}>
                    {language === 'es' ? sc.labelEs : sc.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Cartas Bíblicas subcategory */}
            {activeSubcat === 'cartas' && (
              <View>
                {/* Daily free pack banner */}
                <DailyPackBanner
                  status={dailyPackStatus ?? null}
                  language={language}
                  isEventActive={EASTER_EVENT_ACTIVE}
                  disabled={isPackTransactionActive}
                  onClaim={handleClaimDailyPack}
                />
                <BiblicalPackCard
                  canAfford={canAffordSobre}
                  disabled={isPackTransactionActive}
                  language={language}
                  onPress={() => {
                    if (canAffordSobre && !isPackTransactionActive) {
                      handleTokenPurchase('sobre_biblico', 500);
                    }
                  }}
                />
                <EasterPackCard
                  canAfford={canAffordEaster}
                  disabled={isPackTransactionActive}
                  isEventActive={EASTER_EVENT_ACTIVE}
                  language={language}
                  onPress={() => {
                    if (EASTER_EVENT_ACTIVE && canAffordEaster && !isPackTransactionActive) {
                      handleTokenPurchase('pack_pascua', 500);
                    }
                  }}
                />
                {/* Link to album */}
                <Pressable
                  onPress={() => {
                    setShowStoreSectionModal(false);
                    setTimeout(() => router.push('/biblical-cards-album'), 350);
                  }}
                  style={{
                    marginTop: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.textMuted + '25',
                  }}
                >
                  <Text style={{ fontSize: sFont(13), fontWeight: '700', color: colors.primary }}>
                    {language === 'es' ? '📖 Ver mi álbum bíblico' : '📖 View my biblical album'}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Tokens subcategory */}
            {activeSubcat === 'tokens' && (
              <TokenItemCard
                id="pincel_magico"
                emoji="🖌️"
                name="Magic Paintbrush"
                nameEs="Pincel Mágico"
                description="Allows you to change your nickname once."
                descriptionEs="Permite cambiar tu nickname una vez."
                warning="Use wisely — this is a one-time item per account. Once used, it cannot be purchased again."
                warningEs="Úsalo con cabeza — es un ítem único por cuenta. Una vez usado, no podrá comprarse de nuevo."
                price={15000}
                rarity="legendary"
                isOwned={hasPincel}
                isUsed={isUsed}
                canAfford={canAffordPincel}
                colors={colors}
                language={language}
                isHighlighted={highlightPincel}
                onPress={() => {
                  if (!hasPincel && canAffordPincel) {
                    handleTokenPurchase('pincel_magico', 15000);
                  }
                }}
              />
            )}

            {/* Insignias subcategory */}
            {activeSubcat === 'insignias' && (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Text style={{ fontSize: sFont(32), marginBottom: 12 }}>🏅</Text>
                <Text style={{ fontSize: sFont(16), fontWeight: '700', color: colors.text, marginBottom: 6 }}>
                  {language === 'es' ? 'Próximamente' : 'Coming Soon'}
                </Text>
                <Text style={{ fontSize: sFont(13), color: colors.textMuted, textAlign: 'center', lineHeight: 19 }}>
                  {language === 'es' ? 'Las insignias llegarán en una futura actualización.' : 'Badges are coming in a future update.'}
                </Text>
              </View>
            )}
          </View>
        );
      }

      case 'adventures':
        return null; // Navigation happens on press; content is the adventure hub screen

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

    // Reset subcategory so the item is always visible
    setActiveSubcategory('all');

    // Open the StoreSectionModal for the target category
    setStoreSectionModalCategory(targetCategory);
    setShowStoreSectionModal(true);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Auto-open the item detail modal after modal has rendered
    // Build detail inline to avoid forward-reference issue
    let detail: typeof selectedDetailItem = null;
    if (itemType === 'theme') {
      const th = PURCHASABLE_THEMES[itemId];
      if (th) detail = { id: th.id, type: 'theme', name: th.name, nameEs: th.nameEs, description: th.description, descriptionEs: th.descriptionEs, price: th.price ?? 0, rarity: th.rarity, colors: th.colors, chestOnly: th.chestOnly };
    } else if (itemType === 'frame') {
      const fr = AVATAR_FRAMES[itemId];
      if (fr) detail = { id: fr.id, type: 'frame', name: fr.name, nameEs: fr.nameEs, description: fr.description, descriptionEs: fr.descriptionEs, price: fr.price ?? 0, rarity: fr.rarity, color: fr.color, chestOnly: fr.chestOnly };
    } else if (itemType === 'title') {
      const ti = SPIRITUAL_TITLES[itemId];
      if (ti) detail = { id: ti.id, type: 'title', name: ti.name, nameEs: ti.nameEs, description: ti.description, descriptionEs: ti.descriptionEs, price: ti.price ?? 0, rarity: ti.rarity, chestOnly: ti.chestOnly };
    } else if (itemType === 'avatar') {
      const av = DEFAULT_AVATARS.find(a => a.id === itemId);
      if (av) detail = { id: av.id, type: 'avatar', name: av.name, nameEs: av.nameEs, description: av.description, descriptionEs: av.descriptionEs, price: (av as any).price ?? 0, rarity: av.rarity, emoji: av.emoji };
    }
    if (detail) {
      setTimeout(() => {
        setSelectedDetailItem(detail);
        setShowDetailModal(true);
      }, 450);
    }
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

  // Navigate to adventure when StoreSectionModal fully closes
  // Tied to state transition so it fires even if onDismiss doesn't (Android, edge cases)
  useEffect(() => {
    if (showStoreSectionModal) return;

    const route = pendingAdventureNav;
    if (!route) {
      isOpeningModal.current = false;
      return;
    }

    setPendingAdventureNav(null);

    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        router.push(route as any);
        isOpeningModal.current = false;
      });
    });
  }, [showStoreSectionModal, pendingAdventureNav]);

  // Dispatch pack reveal to root layer after StoreSectionModal fully closes.
  // This guarantees the reveal renders ABOVE the pageSheet, not inside it.
  useEffect(() => {
    if (showStoreSectionModal) return;
    if (!pendingPackReveal) return;

    const req = pendingPackReveal;
    setPendingPackReveal(null);

    console.log('[Store][Reveal] sheet closed — dispatching reveal to root layer', req);

    // Give the sheet dismiss animation one frame to finish before mounting the overlay
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        console.log('[Store][Reveal] requestPackReveal fired');
        requestPackReveal(req);
      });
    });
  }, [showStoreSectionModal, pendingPackReveal]);

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

  const catProgress = useMemo(() => {
    const purchasableAvatarIds = DEFAULT_AVATARS.filter(a => 'price' in a && (a as { price?: number }).price! > 0).map(a => a.id);
    const allThemeIds = Object.keys(PURCHASABLE_THEMES);
    const allFrameIds = Object.keys(AVATAR_FRAMES);
    const allTitleIds = Object.keys(SPIRITUAL_TITLES);
    const allBundleIds = Object.keys(STORE_BUNDLES);
    const owned = (ids: string[]) => ids.filter(id => purchasedItems.includes(id)).length;
    const adventureBundleIds = Object.values(STORE_BUNDLES).filter(b => b.isAdventure).map(b => b.id);
    const completedAdventures = adventureBundleIds.filter(id => {
      const b = STORE_BUNDLES[id];
      return b?.items?.length > 0 && b.items.every(itemId => purchasedItems.includes(itemId));
    }).length;
    return {
      themes: { owned: owned(allThemeIds), total: allThemeIds.length },
      frames: { owned: owned(allFrameIds), total: allFrameIds.length },
      titles: { owned: owned(allTitleIds), total: allTitleIds.length },
      avatars: { owned: owned(purchasableAvatarIds), total: purchasableAvatarIds.length },
      bundles: { owned: owned(allBundleIds), total: allBundleIds.length },
      collections: { owned: claimedCollectionIds.size, total: Object.keys(ITEM_COLLECTIONS).length + Object.keys(CHAPTER_COLLECTIONS).length },
      adventures: { owned: completedAdventures, total: adventureBundleIds.filter(id => !STORE_BUNDLES[id]?.comingSoon).length },
    } as Record<string, { owned: number; total: number }>;
  }, [purchasedItems, claimedCollectionIds]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <PointsToast
        amount={toastAmount}
        visible={showPointsToast}
        onHide={() => { setShowPointsToast(false); setToastMessage(undefined); }}
        isPositive={toastPositive}
        message={toastMessage}
      />
      <PointsToast
        amount={0}
        visible={showErrorToast}
        onHide={() => setShowErrorToast(false)}
        isPositive={false}
        message={errorToastMessage}
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

        {/* Season Banner — shown when active season; Launch Event Banner shown otherwise */}
        {primarySeason ? (
          <SeasonBanner
            season={primarySeason}
            language={language}
            onPress={() => {
              if (isOpeningModal.current) return;
              isOpeningModal.current = true;
              setTimeout(() => { isOpeningModal.current = false; }, 600);
              setActiveSubcategory('all');
              setStoreSectionModalCategory('bundles');
              setShowStoreSectionModal(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          />
        ) : (
          <LaunchEventBanner
            language={language}
            colors={colors}
            onPress={() => {
              if (isOpeningModal.current) return;
              isOpeningModal.current = true;
              setTimeout(() => { isOpeningModal.current = false; }, 600);
              setActiveSubcategory('all');
              setStoreSectionModalCategory('bundles');
              setShowStoreSectionModal(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          />
        )}

        {/* Feature Cards — new large card layout */}
        <View
          style={{ paddingHorizontal: 20, marginBottom: 28, gap: 16 }}
          pointerEvents={isLoadingBackendUser ? 'none' : 'auto'}
        >
          {isLoadingBackendUser && (
            <View style={{ position: 'absolute', top: 0, left: 20, right: 20, bottom: 0, zIndex: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: 'transparent' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}

          {/* 1. OBJETOS ESPECIALES */}
          <FeatureCard
            emoji="✨"
            title={language === 'es' ? 'Objetos Especiales' : 'Special Items'}
            subtitle={language === 'es' ? 'Cartas, tokens e insignias' : 'Cards, tokens & badges'}
            gradientColors={['#2A1F00', '#1A1200', '#0E0900']}
            borderColor="rgba(212,175,55,0.25)"
            accentGlowColor="rgba(212,175,55,0.08)"
            badgeCount={dailyPackStatus?.canClaim ? (dailyPackStatus.remaining ?? 1) : undefined}
            showNewBadge
            onPress={() => {
              const now = Date.now();
              if (now - lastCategoryTapAt.current < 500) return;
              lastCategoryTapAt.current = now;
              if (isOpeningModal.current) return;
              isOpeningModal.current = true;
              setTimeout(() => { isOpeningModal.current = false; }, 600);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setActiveSubcategory('all');
              setStoreSectionModalCategory('tokens');
              setShowStoreSectionModal(true);
            }}
          />

          {/* 2. COLECCIONES */}
          <FeatureCard
            emoji="📚"
            title={language === 'es' ? 'Colecciones' : 'Collections'}
            subtitle={language === 'es' ? 'Álbum bíblico y aventuras' : 'Biblical album & adventures'}
            gradientColors={['#0D1E3D', '#071526', '#030C18']}
            borderColor="rgba(96,165,250,0.25)"
            accentGlowColor="rgba(96,165,250,0.08)"
            onPress={() => {
              const now = Date.now();
              if (now - lastCategoryTapAt.current < 500) return;
              lastCategoryTapAt.current = now;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setSubMenuType('colecciones');
              setShowSubMenuModal(true);
            }}
          />

          {/* 3. PERSONALIZACIÓN */}
          <FeatureCard
            emoji="🎨"
            title={language === 'es' ? 'Personalización' : 'Personalization'}
            subtitle={language === 'es' ? 'Temas, marcos, avatar y títulos' : 'Themes, frames, avatar & titles'}
            gradientColors={['#0D2A2A', '#071A1A', '#030F0F']}
            borderColor="rgba(45,212,191,0.25)"
            accentGlowColor="rgba(45,212,191,0.08)"
            onPress={() => {
              const now = Date.now();
              if (now - lastCategoryTapAt.current < 500) return;
              lastCategoryTapAt.current = now;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setSubMenuType('personalizacion');
              setShowSubMenuModal(true);
            }}
          />

          {/* 4. PAQUETES */}
          <FeatureCard
            emoji="🎁"
            title={language === 'es' ? 'Paquetes' : 'Bundles'}
            subtitle={language === 'es' ? 'Bundles especiales' : 'Special bundles'}
            gradientColors={['#2A1400', '#1A0D00', '#0E0800']}
            borderColor="rgba(251,146,60,0.25)"
            accentGlowColor="rgba(251,146,60,0.08)"
            onPress={() => {
              const now = Date.now();
              if (now - lastCategoryTapAt.current < 500) return;
              lastCategoryTapAt.current = now;
              if (isOpeningModal.current) return;
              isOpeningModal.current = true;
              setTimeout(() => { isOpeningModal.current = false; }, 600);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setActiveSubcategory('all');
              setStoreSectionModalCategory('bundles');
              setShowStoreSectionModal(true);
            }}
          />

        </View>

      </ScrollView>

      {/* Sub-Menu Modal — Colecciones / Personalización */}
      <Modal
        visible={showSubMenuModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSubMenuModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: insets.top + 16,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.textMuted + '20',
          }}>
            <Pressable onPress={() => setShowSubMenuModal(false)} style={{ marginRight: 12, padding: 4 }}>
              <ChevronLeft size={24} color={colors.text} />
            </Pressable>
            <Text style={{ fontSize: sFont(20), fontWeight: '800', color: colors.text }}>
              {subMenuType === 'colecciones'
                ? (language === 'es' ? 'Colecciones' : 'Collections')
                : (language === 'es' ? 'Personalización' : 'Personalization')}
            </Text>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} showsVerticalScrollIndicator={false}>
            {subMenuType === 'colecciones' ? (
              <>
                {/* Álbum Bíblico */}
                <Pressable
                  onPress={() => {
                    setShowSubMenuModal(false);
                    setTimeout(() => router.push('/biblical-cards-album'), 350);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <LinearGradient
                    colors={['#0D1E3D', '#071526', '#030C18']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(96,165,250,0.25)' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(96,165,250,0.12)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.30)', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 22 }}>📖</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: sFont(16), fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2, marginBottom: 2 }}>
                          {language === 'es' ? 'Álbum Bíblico' : 'Biblical Album'}
                        </Text>
                        <Text style={{ fontSize: sFont(12), color: 'rgba(96,165,250,0.70)' }}>
                          {language === 'es' ? 'Cartas coleccionables' : 'Collectible cards'}
                        </Text>
                      </View>
                      <ChevronRight size={18} color="rgba(255,255,255,0.30)" />
                    </View>
                  </LinearGradient>
                </Pressable>

                {/* Aventuras */}
                <Pressable
                  onPress={() => {
                    setShowSubMenuModal(false);
                    setTimeout(() => router.push('/collections/adventures'), 350);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <LinearGradient
                    colors={['#1A2A0D', '#0F1A07', '#080F03']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(134,239,172,0.25)' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(134,239,172,0.10)', borderWidth: 1, borderColor: 'rgba(134,239,172,0.28)', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 22 }}>🗺️</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: sFont(16), fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2, marginBottom: 2 }}>
                          {language === 'es' ? 'Aventuras' : 'Adventures'}
                        </Text>
                        <Text style={{ fontSize: sFont(12), color: 'rgba(134,239,172,0.65)' }}>
                          {language === 'es' ? 'Progreso de historia y logros' : 'Story progress & achievements'}
                        </Text>
                      </View>
                      <ChevronRight size={18} color="rgba(255,255,255,0.30)" />
                    </View>
                  </LinearGradient>
                </Pressable>
              </>
            ) : (
              <>
                {/* Temas */}
                <Pressable
                  onPress={() => {
                    storeSectionFromSubmenu.current = 'personalizacion';
                    setShowSubMenuModal(false);
                    setTimeout(() => {
                      setActiveSubcategory('all');
                      setStoreSectionModalCategory('themes');
                      setShowStoreSectionModal(true);
                    }, 350);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <LinearGradient
                    colors={['#1A0D2A', '#0F0718', '#08030F']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(192,132,252,0.25)' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(192,132,252,0.10)', borderWidth: 1, borderColor: 'rgba(192,132,252,0.28)', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 22 }}>🎨</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: sFont(16), fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2, marginBottom: 2 }}>
                          {language === 'es' ? 'Temas' : 'Themes'}
                        </Text>
                        <Text style={{ fontSize: sFont(12), color: 'rgba(192,132,252,0.65)' }}>
                          {language === 'es' ? 'Cambia la apariencia de la app' : 'Change the app appearance'}
                        </Text>
                      </View>
                      <ChevronRight size={18} color="rgba(255,255,255,0.30)" />
                    </View>
                  </LinearGradient>
                </Pressable>

                {/* Marcos */}
                <Pressable
                  onPress={() => {
                    storeSectionFromSubmenu.current = 'personalizacion';
                    setShowSubMenuModal(false);
                    setTimeout(() => {
                      setActiveSubcategory('all');
                      setStoreSectionModalCategory('frames');
                      setShowStoreSectionModal(true);
                    }, 350);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <LinearGradient
                    colors={['#0A1F2A', '#051218', '#02090F']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(56,189,248,0.25)' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(56,189,248,0.10)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.28)', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 22 }}>🖼️</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: sFont(16), fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2, marginBottom: 2 }}>
                          {language === 'es' ? 'Marcos' : 'Frames'}
                        </Text>
                        <Text style={{ fontSize: sFont(12), color: 'rgba(56,189,248,0.65)' }}>
                          {language === 'es' ? 'Marcos para tus cartas' : 'Frames for your cards'}
                        </Text>
                      </View>
                      <ChevronRight size={18} color="rgba(255,255,255,0.30)" />
                    </View>
                  </LinearGradient>
                </Pressable>

                {/* Avatares */}
                <Pressable
                  onPress={() => {
                    storeSectionFromSubmenu.current = 'personalizacion';
                    setShowSubMenuModal(false);
                    setTimeout(() => {
                      setActiveSubcategory('all');
                      setStoreSectionModalCategory('avatars');
                      setShowStoreSectionModal(true);
                    }, 350);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <LinearGradient
                    colors={['#1A1A0A', '#101008', '#080805']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(250,204,21,0.25)' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(250,204,21,0.10)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.28)', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 22 }}>🧑‍🎨</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: sFont(16), fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2, marginBottom: 2 }}>
                          {language === 'es' ? 'Avatares' : 'Avatars'}
                        </Text>
                        <Text style={{ fontSize: sFont(12), color: 'rgba(250,204,21,0.65)' }}>
                          {language === 'es' ? 'Imagen de perfil' : 'Profile picture'}
                        </Text>
                      </View>
                      <ChevronRight size={18} color="rgba(255,255,255,0.30)" />
                    </View>
                  </LinearGradient>
                </Pressable>

                {/* Títulos */}
                <Pressable
                  onPress={() => {
                    storeSectionFromSubmenu.current = 'personalizacion';
                    setShowSubMenuModal(false);
                    setTimeout(() => {
                      setActiveSubcategory('all');
                      setStoreSectionModalCategory('titles');
                      setShowStoreSectionModal(true);
                    }, 350);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <LinearGradient
                    colors={['#1A0A0A', '#100505', '#080202']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(252,165,165,0.25)' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(252,165,165,0.10)', borderWidth: 1, borderColor: 'rgba(252,165,165,0.28)', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 22 }}>🏅</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: sFont(16), fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2, marginBottom: 2 }}>
                          {language === 'es' ? 'Títulos' : 'Titles'}
                        </Text>
                        <Text style={{ fontSize: sFont(12), color: 'rgba(252,165,165,0.65)' }}>
                          {language === 'es' ? 'Distintivos para tu perfil' : 'Badges for your profile'}
                        </Text>
                      </View>
                      <ChevronRight size={18} color="rgba(255,255,255,0.30)" />
                    </View>
                  </LinearGradient>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Store Section Modal — opened when tapping a category card */}
      <Modal
        visible={showStoreSectionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeStoreSectionModal}
        onDismiss={() => {
          // Lock released here as failsafe
          isOpeningModal.current = false;
          // If dismissed via swipe-down (not the back button), also return to submenu
          const src = storeSectionFromSubmenu.current;
          if (src) {
            storeSectionFromSubmenu.current = null;
            setTimeout(() => {
              setSubMenuType(src);
              setShowSubMenuModal(true);
            }, 100);
          }
        }}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: insets.top + 16,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.textMuted + '20',
          }}>
            <Pressable
              onPress={closeStoreSectionModal}
              style={{ marginRight: 12, padding: 4 }}
            >
              <ChevronLeft size={24} color={colors.text} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: sFont(20), fontWeight: '800', color: colors.text }}>
                {storeSectionModalCategory ? (language === 'es'
                  ? CATEGORIES.find(c => c.key === storeSectionModalCategory)?.labelEs
                  : CATEGORIES.find(c => c.key === storeSectionModalCategory)?.label) : ''}
              </Text>
              {storeSectionModalCategory && (() => {
                const prog = catProgress[storeSectionModalCategory];
                if (!prog) return null;
                return (
                  <Text style={{ fontSize: sFont(12), color: colors.textMuted }}>
                    {prog.owned}/{prog.total} {language === 'es' ? 'obtenidos' : 'obtained'}
                  </Text>
                );
              })()}
            </View>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }} nestedScrollEnabled>
            {storeSectionModalCategory && renderCategoryContent(storeSectionModalCategory, true)}
          </ScrollView>

          {/* Item Detail Modal rendered INSIDE the section modal so iOS stacks it correctly */}
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
            onGift={selectedDetailItem && selectedDetailItem.price > 0 && !selectedDetailItem.chestOnly ? () => {
              setGiftSendItem({
                id: selectedDetailItem.id,
                nameEs: selectedDetailItem.nameEs,
                nameEn: selectedDetailItem.name,
                price: selectedDetailItem.price,
                rarity: selectedDetailItem.rarity,
              });
              setShowDetailModal(false);
              setTimeout(() => setShowGiftSendModal(true), 350);
            } : undefined}
          />

          {/* Collection modals also inside so they stack above the section modal on iOS */}
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

          <ChapterCollectionModal
            visible={showChapterCollectionModal}
            collection={selectedChapterCollection}
            purchasedItems={purchasedItems}
            colors={colors}
            language={language}
            claimedChapterIds={claimedChapterIds}
            onClaimChapter={async (chapterId, pts) => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await claimChapter(chapterId, selectedChapterCollection?.collectionId ?? '');
              updateUser({ points: (user?.points ?? 0) + pts });
              addLedgerEntry({
                delta: pts,
                kind: 'claim',
                title: language === 'es' ? 'Capítulo completado' : 'Chapter completed',
                detail: selectedChapterCollection
                  ? (language === 'es' ? selectedChapterCollection.nameEs : selectedChapterCollection.nameEn)
                  : '',
              });
              setToastAmount(pts);
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

          {/* Toast overlays inside the modal so they appear above it */}
          <PointsToast
            amount={toastAmount}
            visible={showPointsToast && showStoreSectionModal}
            onHide={() => { setShowPointsToast(false); setToastMessage(undefined); }}
            isPositive={toastPositive}
            message={toastMessage}
          />
          <PointsToast
            amount={0}
            visible={showErrorToast && showStoreSectionModal}
            onHide={() => setShowErrorToast(false)}
            isPositive={false}
            message={errorToastMessage}
          />
        </View>
      </Modal>

      {/* Item Detail Modal — also shown standalone when StoreSectionModal is closed */}
      {!showStoreSectionModal && (
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
          onGift={selectedDetailItem && selectedDetailItem.price > 0 && !selectedDetailItem.chestOnly ? () => {
            setGiftSendItem({
              id: selectedDetailItem.id,
              nameEs: selectedDetailItem.nameEs,
              nameEn: selectedDetailItem.name,
              price: selectedDetailItem.price,
              rarity: selectedDetailItem.rarity,
            });
            setShowDetailModal(false);
            setTimeout(() => setShowGiftSendModal(true), 350);
          } : undefined}
        />
      )}

      {/* Gift Send Modal */}
      <GiftSendModal
        visible={showGiftSendModal}
        onClose={() => setShowGiftSendModal(false)}
        item={giftSendItem}
      />

      {/* Chest Reward Modal */}
      <ChestRewardModal
        visible={showChestModal}
        reward={chestReward}
        language={language}
        colors={colors}
        onClose={() => setShowChestModal(false)}
      />

      {/* Card Reveal Modal (legacy, kept for other uses) */}
      <CardRevealModal
        visible={showCardRevealModal}
        drawnCard={revealedCard}
        onClose={() => {
          console.log('[Store] reveal modal closed — store is now interactive');
          setShowCardRevealModal(false);
          setRevealedCard(null);
        }}
      />

      {/* Pack Opening Animation Modal — disabled (stability bypass) */}
      {/* PackOpeningModal will be re-enabled once the animation state machine is stable */}
    </View>
  );
}
