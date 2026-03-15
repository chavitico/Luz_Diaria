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
  Image,
  Animated as RNAnimated,
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
  Key,
  Share2,
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
  useRequestConfirmPurchase,
} from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import { ActionButton } from '@/components/ui/ActionButton';
import { GiftSendModal, type GiftSendItem } from '@/components/GiftSendModal';
import { CardRevealModal } from '@/components/CardRevealModal';
import { PackOpeningModal } from '@/components/PackOpeningModal';
import { TradeInboxModal } from '@/components/TradeInboxModal';
import { BadgeChip } from '@/components/BadgeChip';
import { useFocusEffect } from '@react-navigation/native';
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
  BADGES,
  type ChapterCollection,
  type CollectionChapter,
} from '@/lib/constants';
import { cn } from '@/lib/cn';
import { addLedgerEntry } from '@/lib/points-ledger';

import {
  gamificationApi,
  StoreItem,
  Season,
} from '@/lib/gamification-api';
import {
  CategoryType,
  CategoryIconComponent,
  CATEGORIES,
  IconTemas,
  IconMarcos,
  IconTitulos,
  IconAvatares,
  IconPaquetes,
  IconColecciones,
  IconAventuras,
  IconTokens,
} from '@/components/store/CategoryIcons';
import { sortBundlesForUser, resolveCollectionItem } from '@/lib/store-utils';
import { RarityIcon, RarityBadge } from '@/components/store/RarityBadge';
import { ConfettiParticle } from '@/components/store/ConfettiParticle';
import { WeeklyChestUnlockedModal } from '@/components/store/modals/WeeklyChestUnlockedModal';
import { ChestRewardModal } from '@/components/store/modals/ChestRewardModal';
import { useCollectionClaimBadges } from '@/hooks/useCollectionClaimBadges';
import { useNewItemsState, computeNewAvatarIds, computeNewStoreItemIds } from '@/hooks/useNewItemsState';
import { ItemDetailModal } from '@/components/store/modals/ItemDetailModal';
import { PremiumThemeCard } from '@/components/store/cards/PremiumThemeCard';
import { PremiumFrameCard } from '@/components/store/cards/PremiumFrameCard';
import { PremiumTitleCard } from '@/components/store/cards/PremiumTitleCard';
import { PremiumAvatarCard } from '@/components/store/cards/PremiumAvatarCard';
import { BundleCard } from '@/components/store/cards/BundleCard';
import { useChapterCollectionProgress } from '@/hooks/useChapterCollectionProgress';
import { ChapterCollectionModal } from '@/components/store/modals/ChapterCollectionModal';
import { CollectionDetailModal } from '@/components/store/modals/CollectionDetailModal';
import { BiblicalPackCard } from '@/components/store/cards/BiblicalPackCard';
import { EasterPackCard } from '@/components/store/cards/EasterPackCard';
import { MilagrosPackCard } from '@/components/store/cards/MilagrosPackCard';
import { TokenItemCard } from '@/components/store/cards/TokenItemCard';


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

// ─── Cromos Bíblicos Card ─────────────────────────────────────────────────────
// ─── Collection Ticker — scrolling marquee for CromosCard ─────────────────────
const COLLECTION_TICKER_SPEED = 36; // px per second

function CollectionTicker({ text, accentColor }: { text: string; accentColor: string }) {
  const tickerX = useRef(new RNAnimated.Value(0)).current;
  const tickerW = useRef(0);
  const anim = useRef<RNAnimated.CompositeAnimation | null>(null);

  const startScroll = useCallback((width: number) => {
    if (width <= 0) return;
    tickerX.setValue(0);
    anim.current?.stop();
    const duration = (width / COLLECTION_TICKER_SPEED) * 1000;
    const loop = RNAnimated.loop(
      RNAnimated.timing(tickerX, {
        toValue: -width / 2,
        duration,
        easing: (t) => t,
        useNativeDriver: true,
      })
    );
    anim.current = loop;
    loop.start();
  }, []);

  useEffect(() => {
    return () => { anim.current?.stop(); };
  }, []);

  return (
    <View style={{ height: 20, overflow: 'hidden', justifyContent: 'center' }}>
      <RNAnimated.Text
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w !== tickerW.current) {
            tickerW.current = w;
            startScroll(w);
          }
        }}
        style={{
          transform: [{ translateX: tickerX }],
          fontSize: 10,
          fontWeight: '800',
          color: accentColor,
          letterSpacing: 1.0,
          whiteSpace: 'nowrap',
        } as any}
        numberOfLines={1}
      >
        {text}
      </RNAnimated.Text>
    </View>
  );
}

// ─── Cromos Bíblicos Card ──────────────────────────────────────────────────────
function CromosCard({
  language,
  colors,
  onPress,
  onPackImagePress,
  showNewBadge,
  badgeCount,
  dailyPackStatus,
}: {
  language: 'en' | 'es';
  colors: ReturnType<typeof useThemeColors>;
  onPress: () => void;
  onPackImagePress?: () => void;
  showNewBadge?: boolean;
  badgeCount?: number;
  dailyPackStatus?: { canClaim: boolean; nextAvailableMs: number | null } | null;
}) {
  const { sFont } = useScaledFont();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const newBadgeOpacity = useSharedValue(1);

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

  const newBadgeStyle = useAnimatedStyle(() => ({ opacity: newBadgeOpacity.value }));

  const ACCENT = '#60A5FA';
  const G1 = '#0D1E3D';
  const G2 = '#071526';

  // Latest pack — update name/image here when a new collection is added
  const LATEST_PACK_NAME_ES = 'Los Milagros de Jesús';
  const LATEST_PACK_NAME_EN = 'The Miracles of Jesus';
  const latestPackImage = require('../../../assets/packs/pack_milagros_pack.png');

  // Ticker text — repeated so it scrolls seamlessly
  const tickerUnit = language === 'es'
    ? `  🃏  Nueva Colección · ${LATEST_PACK_NAME_ES}  ✦ `
    : `  🃏  New Collection · ${LATEST_PACK_NAME_EN}  ✦ `;
  const TICKER_TEXT = tickerUnit.repeat(6);

  // Daily pack countdown label
  const dailyPackLabel = React.useMemo(() => {
    if (!dailyPackStatus) return null;
    if (dailyPackStatus.canClaim) {
      return language === 'es' ? '🎁 Sobre diario disponible' : '🎁 Daily pack available';
    }
    if (dailyPackStatus.nextAvailableMs && dailyPackStatus.nextAvailableMs > 0) {
      const diffMs = dailyPackStatus.nextAvailableMs - Date.now();
      if (diffMs > 0) {
        const h = Math.floor(diffMs / 3_600_000);
        const m = Math.floor((diffMs % 3_600_000) / 60_000);
        const countdown = h > 0 ? `${h}h ${m}m` : `${m}m`;
        return language === 'es'
          ? `⏱ Próximo sobre gratis en ${countdown}`
          : `⏱ Next free pack in ${countdown}`;
      }
    }
    return null;
  }, [dailyPackStatus, language]);

  const dailyPackAvailable = dailyPackStatus?.canClaim === true;

  return (
    <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPressIn={() => { scale.value = withSpring(0.98); }}
          onPressOut={() => { scale.value = withSpring(1); }}
          onPress={onPress}
        >
          <LinearGradient
            colors={[ACCENT + 'DD', '#93C5FDCC', '#BFDBFEAA', '#93C5FDCC', ACCENT + 'DD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 2,
              shadowColor: ACCENT,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.65,
              shadowRadius: 18,
              elevation: 10,
            }}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.14)', 'transparent', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 23, padding: 1 }}
            >
              {/* Banner container */}
              <View style={{ borderRadius: 22, overflow: 'hidden', minHeight: 182 }}>
                {/* Background gradient base */}
                <LinearGradient
                  colors={[G1, G2, '#030C18']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />

                {/* Overlay scrim — left side darker so text is readable */}
                <LinearGradient
                  colors={['rgba(7,21,38,0.95)', 'rgba(7,21,38,0.60)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />

                {/* Shimmer highlight */}
                <View style={{
                  position: 'absolute',
                  top: 0,
                  left: 24,
                  right: 24,
                  height: 1.5,
                  backgroundColor: 'rgba(255,255,255,0.22)',
                  borderRadius: 99,
                }} />

                {/* Pack image — tappable, larger and higher */}
                <Pressable
                  onPress={() => { if (onPackImagePress) onPackImagePress(); }}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 12,
                    width: 116,
                    height: 160,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  hitSlop={8}
                >
                  <Image
                    source={latestPackImage}
                    style={{ width: 116, height: 160, opacity: 0.95 }}
                    resizeMode="contain"
                  />
                </Pressable>

                {/* Content — left side */}
                <View style={{ padding: 20, paddingRight: 136 }}>
                  {/* Top row: NOVEDAD + daily pack alert — same line */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6, flexWrap: 'wrap' }}>
                    {showNewBadge && (
                      <Animated.View style={[{
                        backgroundColor: '#FF3B30',
                        borderRadius: 6,
                        paddingHorizontal: 7,
                        paddingVertical: 3,
                      }, newBadgeStyle]}>
                        <Text style={{ fontSize: sFont(9), fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.8 }}>NOVEDAD</Text>
                      </Animated.View>
                    )}
                    {badgeCount !== undefined && badgeCount > 0 && (
                      <View style={{
                        backgroundColor: '#FF3B30',
                        borderRadius: 99,
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                      }}>
                        <Text style={{ fontSize: sFont(9), fontWeight: '900', color: '#FFFFFF' }}>
                          {badgeCount > 9 ? '9+' : String(badgeCount)} {language === 'es' ? 'trueques' : 'trades'}
                        </Text>
                      </View>
                    )}
                    {dailyPackLabel && (
                      <View style={{
                        backgroundColor: dailyPackAvailable ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.07)',
                        borderWidth: 1,
                        borderColor: dailyPackAvailable ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.12)',
                        borderRadius: 6,
                        paddingHorizontal: 7,
                        paddingVertical: 3,
                      }}>
                        <Text style={{
                          fontSize: sFont(9),
                          fontWeight: '700',
                          color: dailyPackAvailable ? '#4ADE80' : 'rgba(255,255,255,0.45)',
                          letterSpacing: 0.3,
                        }}>
                          {dailyPackLabel}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Collection chip — static, wraps up to 2 lines */}
                  <View style={{
                    backgroundColor: ACCENT + '22',
                    borderWidth: 1,
                    borderColor: ACCENT + '55',
                    borderRadius: 12,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    marginBottom: 10,
                    alignSelf: 'flex-start',
                    flexShrink: 1,
                    maxWidth: '100%',
                  }}>
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: 10,
                        fontWeight: '800',
                        color: ACCENT,
                        letterSpacing: 0.8,
                        flexShrink: 1,
                      }}
                    >
                      {'🃏  ' + (language === 'es' ? `Nueva Colección · ${LATEST_PACK_NAME_ES}` : `New Collection · ${LATEST_PACK_NAME_EN}`)}
                    </Text>
                  </View>

                  {/* Title */}
                  <Text style={{
                    fontSize: sFont(24),
                    fontWeight: '900',
                    color: '#FFFFFF',
                    letterSpacing: -0.5,
                    marginBottom: 5,
                    textShadowColor: 'rgba(0,0,0,0.5)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 6,
                  }}>
                    {language === 'es' ? 'Cromos Bíblicos' : 'Biblical Cards'}
                  </Text>

                  {/* Subtitle */}
                  <Text style={{ fontSize: sFont(12), color: 'rgba(255,255,255,0.55)', marginBottom: 18, fontWeight: '500' }}>
                    {language === 'es' ? 'Sobres · Álbum · Trueques' : 'Packs · Album · Trades'}
                  </Text>

                  {/* CTA */}
                  <View style={{
                    backgroundColor: ACCENT + 'EE',
                    borderRadius: 99,
                    paddingHorizontal: 18,
                    paddingVertical: 9,
                    alignSelf: 'flex-start',
                  }}>
                    <Text style={{ fontSize: sFont(13), fontWeight: '700', color: '#0D1E3D' }}>
                      {language === 'es' ? 'Abrir Sobres' : 'Open Packs'}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
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
        {/* Outer glow border ring */}
        <LinearGradient
          colors={[borderColor, borderColor, borderColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 22,
            padding: 2,
            shadowColor: borderColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.70,
            shadowRadius: 14,
            elevation: 8,
          }}
        >
          {/* Inner sheen ring */}
          <LinearGradient
            colors={['rgba(255,255,255,0.14)', 'transparent', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 21, padding: 1 }}
          >
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 20, padding: 20, overflow: 'hidden' }}
            >
              {/* Shimmer top highlight */}
              <View style={{
                position: 'absolute',
                top: 0,
                left: 24,
                right: 24,
                height: 1.5,
                backgroundColor: 'rgba(255,255,255,0.22)',
                borderRadius: 99,
              }} />
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
          </LinearGradient>
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
              colors={[G1, G2, '#030F07']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 22, overflow: 'hidden', padding: 20 }}
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


// Profile Header Component
function ProfileHeader({
  colors,
  user,
  points,
  language,
  hasRenameToken,
  onRenamePress,
  activeBadgeId,
  devotionalsCompleted,
  totalShares,
}: {
  colors: ReturnType<typeof useThemeColors>;
  user: ReturnType<typeof useUser>;
  points: number;
  language: 'en' | 'es';
  hasRenameToken: boolean;
  onRenamePress: () => void;
  activeBadgeId: string | null;
  devotionalsCompleted: number;
  totalShares: number;
}) {
  const { sFont } = useScaledFont();

  const frameColor = user?.frameId && AVATAR_FRAMES[user.frameId]
    ? AVATAR_FRAMES[user.frameId].color
    : colors.textMuted;

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
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              {/* Avatar with elevated ring */}
              <View style={{ marginRight: 14 }}>
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

              {/* Name + Points + Badge */}
              <View style={{ flex: 1 }}>
                {/* Row 1: username + lock/key icon button */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Text style={{
                    fontSize: sFont(20),
                    fontWeight: '800',
                    color: '#FFFFFF',
                    letterSpacing: -0.3,
                    flexShrink: 1,
                  }} numberOfLines={1}>
                    {user?.nickname || 'Pilgrim'}
                  </Text>
                  <Pressable
                    onPress={onRenamePress}
                    style={{
                      backgroundColor: hasRenameToken ? colors.primary + '20' : 'rgba(255,255,255,0.08)',
                      borderWidth: 1,
                      borderColor: hasRenameToken ? colors.primary + '40' : 'rgba(255,255,255,0.15)',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    {hasRenameToken
                      ? <Key size={14} color={colors.primary} />
                      : <Lock size={14} color="rgba(255,255,255,0.45)" />
                    }
                  </Pressable>
                </View>
                {/* Row 2: Points display */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                  <Coins size={14} color={colors.primary} />
                  <Text style={{ fontSize: sFont(15), fontWeight: '700', color: colors.primary }}>
                    {points} pts
                  </Text>
                </View>
                {/* Badge — icon + title + description */}
                {activeBadgeId && (() => {
                  const badgeData = BADGES[activeBadgeId];
                  if (!badgeData) return null;
                  return (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 8,
                      marginTop: 2,
                      paddingVertical: 8,
                      paddingHorizontal: 10,
                      borderRadius: 12,
                      backgroundColor: badgeData.color + '12',
                      borderWidth: 1,
                      borderColor: badgeData.color + '30',
                    }}>
                      <BadgeChip badgeId={activeBadgeId} variant="community" />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: sFont(13), fontWeight: '700', color: badgeData.color, marginBottom: 2 }} numberOfLines={1}>
                          {badgeData.nameEs}
                        </Text>
                        <Text style={{ fontSize: sFont(11), fontWeight: '400', color: 'rgba(255,255,255,0.55)', lineHeight: 15 }} numberOfLines={2} ellipsizeMode="tail">
                          {badgeData.profileCardEs}
                        </Text>
                      </View>
                    </View>
                  );
                })()}
              </View>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 14 }} />

            {/* Stats chips row — 3 chips, vertical layout: number + label */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {/* Devotionals chip */}
              <LinearGradient
                colors={['#22C55E25', '#22C55E08']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 6,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#22C55E35',
                }}
              >
                <BookOpen size={14} color="#22C55E" style={{ marginBottom: 4 }} />
                <Text style={{ fontSize: sFont(18), fontWeight: '800', color: '#22C55E', marginBottom: 3 }}>
                  {devotionalsCompleted}
                </Text>
                <Text style={{ fontSize: sFont(10), fontWeight: '500', color: '#22C55E99', textAlign: 'center', lineHeight: 13 }}>
                  {language === 'es' ? 'Devocionales\ncompletados' : 'Devotionals\ncompleted'}
                </Text>
              </LinearGradient>

              {/* Streak chip */}
              <LinearGradient
                colors={['#F9731625', '#F9731608']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 6,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#F9731635',
                }}
              >
                <Flame size={14} color="#F97316" style={{ marginBottom: 4 }} />
                <Text style={{ fontSize: sFont(18), fontWeight: '800', color: '#F97316', marginBottom: 3 }}>
                  {user?.streakCurrent || 0}
                </Text>
                <Text style={{ fontSize: sFont(10), fontWeight: '500', color: '#F9731699', textAlign: 'center', lineHeight: 13 }}>
                  {language === 'es' ? 'Racha\nmáxima' : 'Current\nstreak'}
                </Text>
              </LinearGradient>

              {/* Shares chip */}
              <LinearGradient
                colors={['#60A5FA25', '#60A5FA08']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 6,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#60A5FA35',
                }}
              >
                <Share2 size={14} color="#60A5FA" style={{ marginBottom: 4 }} />
                <Text style={{ fontSize: sFont(18), fontWeight: '800', color: '#60A5FA', marginBottom: 3 }}>
                  {totalShares}
                </Text>
                <Text style={{ fontSize: sFont(10), fontWeight: '500', color: '#60A5FA99', textAlign: 'center', lineHeight: 13 }}>
                  {language === 'es' ? 'Compartidos' : 'Shared'}
                </Text>
              </LinearGradient>
            </View>
          </View>
        </LinearGradient>
      </LinearGradient>
    </Animated.View>
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
          marginBottom: 16,
        }}
      >
        {/* Compact card — reduced shadow/border prominence */}
        <View style={{
          borderRadius: 18,
          borderWidth: 1,
          borderColor: 'rgba(249,115,22,0.20)',
          backgroundColor: '#120D05',
          overflow: 'hidden',
          shadowColor: '#F97316',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.18,
          shadowRadius: 8,
          elevation: 4,
        }}>
          {/* Subtle inner glow */}
          <LinearGradient
            colors={['#F9731610', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* Compact content */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
            {/* Header row — smaller */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: '#F9731620',
                borderWidth: 1,
                borderColor: '#F9731630',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}>
                <Gift size={16} color="#F97316" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2 }}>
                  {t.weekly_challenges}
                </Text>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: '500', marginTop: 1 }}>
                  {language === 'es' ? 'Completa y reclama recompensas' : 'Complete and claim rewards'}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 12 }} />

            {challenges.slice(0, 3).map((challenge, index) => {
              const progress = progressData.find(p => p.challengeId === challenge.id);
              const currentCount = progress?.currentCount || 0;
              const progressPercent = Math.min((currentCount / challenge.goalCount) * 100, 100);
              const isComplete = progress?.completed || false;
              const isClaimed = progress?.claimed || false;
              const title = language === 'es' ? challenge.titleEs : challenge.titleEn;
              const description = language === 'es' ? challenge.descriptionEs : challenge.descriptionEn;

              return (
                <View key={challenge.id} style={index > 0 ? { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' } : {}}>
                  {/* Title row — compact */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedChallenge({ title, description, type: challenge.type });
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8, gap: 5 }}
                    >
                      <Text
                        style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)', flex: 1 }}
                        numberOfLines={1}
                      >
                        {title}
                      </Text>
                      <Info size={11} color="rgba(255,255,255,0.25)" />
                    </Pressable>
                    <View style={{
                      backgroundColor: isComplete ? '#22C55E20' : 'rgba(255,255,255,0.07)',
                      borderRadius: 99,
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: isComplete ? '#22C55E' : 'rgba(255,255,255,0.45)' }}>
                        {currentCount}/{challenge.goalCount}
                      </Text>
                    </View>
                  </View>

                  {/* Progress bar — thinner */}
                  <View style={{ height: 4, borderRadius: 99, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 5 }}>
                    <LinearGradient
                      colors={isComplete ? ['#22C55E', '#16A34A'] : [colors.primary, colors.primary + 'AA']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ height: '100%', width: `${progressPercent}%`, borderRadius: 99 }}
                    />
                  </View>

                  {/* Bottom row: points + action — compact */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Coins size={11} color={colors.primary} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                        +{challenge.rewardPoints}
                      </Text>
                    </View>

                    {isComplete && !isClaimed && (
                      <Pressable
                        onPress={() => claimMutation.mutate({ challengeId: challenge.id })}
                        disabled={claimMutation.isPending}
                        style={{
                          backgroundColor: '#22C55E',
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 4,
                        }}
                      >
                        {claimMutation.isPending ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>
                            {t.claim_reward}
                          </Text>
                        )}
                      </Pressable>
                    )}

                    {isClaimed && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#22C55E12', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, gap: 3 }}>
                        <Check size={10} color="#22C55E" strokeWidth={3} />
                        <Text style={{ fontSize: 11, fontWeight: '600', color: '#22C55E' }}>
                          {t.reward_claimed}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
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
  onClaimPress,
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
  onClaim: (packType: 'sobre_biblico' | 'pack_pascua' | 'pack_milagros') => void;
  onClaimPress?: () => void;
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

  return (
    <Animated.View style={[animStyle, { marginBottom: 12, opacity: disabled ? 0.5 : 1 }]}>
      <Pressable
        onPressIn={() => { if (canClaim && !disabled) scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={() => {
          if (!canClaim || disabled) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          if (onClaimPress) onClaimPress();
        }}
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
  const [showChestUnlockedModal, setShowChestUnlockedModal] = useState(false);
  const [showCollectionDetailModal, setShowCollectionDetailModal] = useState(false);
  const [showChapterCollectionModal, setShowChapterCollectionModal] = useState(false);
  const [selectedChapterCollection, setSelectedChapterCollection] = useState<ChapterCollection | null>(null);
  const [showStoreSectionModal, setShowStoreSectionModal] = useState(false);
  const [storeSectionModalCategory, setStoreSectionModalCategory] = useState<CategoryType | null>(null);
  // Sub-menu modal: 'personalizacion' | 'colecciones' | null
  const [showSubMenuModal, setShowSubMenuModal] = useState(false);
  const [subMenuType, setSubMenuType] = useState<'personalizacion' | 'colecciones' | 'cromos' | null>(null);
  // Track if StoreSectionModal was opened from submenu, so Back returns to submenu
  const storeSectionFromSubmenu = useRef<'personalizacion' | 'colecciones' | null>(null);
  const [pincelMagicoSource, setPincelMagicoSource] = useState<'store' | 'used' | null>(null);
  const [showTradeInbox, setShowTradeInbox] = useState(false);
  const [showPackStore, setShowPackStore] = useState(false);
  const [showDailyPackPicker, setShowDailyPackPicker] = useState(false);
  const [showCardRevealModal, setShowCardRevealModal] = useState(false);
  const [revealedCard, setRevealedCard] = useState<{ cardId: string; wasNew: boolean } | null>(null);
  // isPackTransactionActive: true = purchase in flight or reveal showing → disables all pack buttons
  const [isPackTransactionActive, setIsPackTransactionActive] = useState(false);
  const isDailyPackClaiming = useRef(false);
  // Inner dedup ref — zero re-render overhead, checked before setting state
  const isTokenPurchasing = useRef(false);
  // Failsafe timeout handle — clears stuck transaction state after 2s
  const packFailsafeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rename nickname modal state
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [hasRenameToken, setHasRenameToken] = useState(false);
  const [activeBadgeId, setActiveBadgeId] = useState<string | null>(null);

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
    drawnCards: Array<{ cardId: string; wasNew: boolean }>;
    packType: 'sobre_biblico' | 'pack_pascua' | 'pack_milagros';
  } | null>(null);
  const requestPackReveal = useRequestPackReveal();
  const requestConfirmPurchase = useRequestConfirmPurchase();

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

  // Load profile data (badge, rename token)
  const loadProfileData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const profile = await gamificationApi.getUser(user.id);
      setActiveBadgeId(profile.activeBadgeId ?? null);
      const pincelInv = profile.inventory.find((inv) => inv.itemId === 'pincel_magico');
      setHasRenameToken(!!pincelInv && pincelInv.source !== 'used');
      // Sync pincelMagicoSource from backend — authoritative
      if (pincelInv) {
        setPincelMagicoSource(pincelInv.source as 'store' | 'used');
      } else {
        setPincelMagicoSource(null);
        // Also clean up local purchasedItems if backend doesn't have it
        const localPurchased = useAppStore.getState().user?.purchasedItems ?? [];
        if (localPurchased.includes('pincel_magico')) {
          console.log('[Store] loadProfileData: pincel not in backend, removing from local');
          useAppStore.getState().updateUser({ purchasedItems: localPurchased.filter(id => id !== 'pincel_magico') });
        }
      }
    } catch {}
  }, [user?.id]);

  useFocusEffect(useCallback(() => { loadProfileData(); }, [loadProfileData]));

  // Handle rename
  const handleRename = async () => {
    if (!user?.id) return;
    const trimmed = renameInput.trim();
    if (!trimmed) return;
    setIsRenaming(true);
    setRenameError(null);
    try {
      const result = await gamificationApi.renameNickname(user.id, trimmed);
      if (!result.success) {
        setRenameError(result.error ?? 'Error al cambiar el nickname.');
        return;
      }
      updateUser({ nickname: trimmed });
      setHasRenameToken(false);
      setShowRenameModal(false);
      setRenameInput('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setRenameError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsRenaming(false);
    }
  };

  // Handle rename or navigate to tokens section
  const handleRenameOrPurchase = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (hasRenameToken) {
      setRenameInput('');
      setRenameError(null);
      setShowRenameModal(true);
    } else {
      setStoreSectionModalCategory('tokens');
      setShowStoreSectionModal(true);
      setHighlightPincel(true);
      setTimeout(() => setHighlightPincel(false), 3000);
    }
  };

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

      // Sync purchasedItems from real backend inventory — overrides stale local state
      if (backendUser.inventory) {
        const backendItemIds = backendUser.inventory.map((inv: { itemId: string }) => inv.itemId);
        const localPurchased = useAppStore.getState().user?.purchasedItems ?? [];
        // Merge: keep anything local has (optimistic) + add everything backend has
        const merged = Array.from(new Set([...backendItemIds, ...localPurchased]));
        // If backend says pincel_magico is NOT there, trust the backend and remove it locally
        const pincelInBackend = backendItemIds.includes('pincel_magico');
        const pincelInLocal = localPurchased.includes('pincel_magico');
        if (!pincelInBackend && pincelInLocal) {
          console.log('[Store] pincel_magico not in backend inventory — removing from local purchasedItems');
          updateUser({ purchasedItems: merged.filter(id => id !== 'pincel_magico') });
        } else if (merged.length !== localPurchased.length || merged.some(id => !localPurchased.includes(id))) {
          updateUser({ purchasedItems: merged });
        }
      }
    }
  }, [backendUser?.id, backendUser?.points, backendUser?.streakCurrent, backendUser?.devotionalsCompleted, backendUser?.inventory]);

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
    const bundleName = language === 'es' ? bundle.nameEs : bundle.name;
    requestConfirmPurchase({ itemName: bundleName, cost: bundle.bundlePrice, onConfirm: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      bundlePurchaseMutate({
        bundleId: bundle.id,
        itemIds: bundle.items,
        bundlePrice: bundle.bundlePrice,
      });
    } });
  }, [bundlePurchaseMutate, bundlePurchaseMutation.isPending, language, requestConfirmPurchase]);

  // Handle purchase from modal
  const handlePurchase = useCallback(() => {
    if (!selectedDetailItem) return;
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
  const executeTokenPurchase = async (itemId: string, price: number) => {
    console.log('[Store][Lock] executeTokenPurchase called', { itemId, price, isTokenPurchasing: isTokenPurchasing.current, isPackTransactionActive, points, userId });
    if (!userId || points < price) return;
    if (isTokenPurchasing.current) {
      console.log('[Store][Lock] BLOCKED — purchase already in flight');
      return;
    }

    // Arm both the ref (inner, zero-render) and the state (outer, disables buttons)
    isTokenPurchasing.current = true;
    setIsPackTransactionActive(true);
    console.log('[Store][Lock] acquired — isPackTransactionActive=true');

    // Failsafe: forcibly unlock after 5s in case anything gets truly stuck (network hang, etc.)
    if (packFailsafeTimeout.current) clearTimeout(packFailsafeTimeout.current);
    packFailsafeTimeout.current = setTimeout(() => {
      console.log('[Store][Failsafe] 5s timeout fired — unlocking store');
      isTokenPurchasing.current = false;
      setIsPackTransactionActive(false);
      setToastMessage(language === 'es' ? 'Algo salió mal. Intenta de nuevo.' : 'Something went wrong. Try again.');
    }, 5000);

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
        } else if (itemId === 'sobre_biblico' || itemId === 'pack_pascua' || itemId === 'pack_milagros') {
          const drawn = res.drawnCards?.length ? res.drawnCards : (res.drawnCard ? [res.drawnCard] : null);
          console.log('[Store][Card] drawn cards', drawn);
          if (drawn) {
            // Queue the reveal to fire AFTER the Store sheet fully closes.
            // The useEffect below dispatches it to the root-level overlay layer.
            console.log('[Store][Reveal] queuing reveal, closing sheet');
            setPendingPackReveal({
              drawnCards: drawn,
              packType: itemId as 'sobre_biblico' | 'pack_pascua' | 'pack_milagros',
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
        if (itemId === 'sobre_biblico' || itemId === 'pack_pascua' || itemId === 'pack_milagros') {
          queryClient.invalidateQueries({ queryKey: ['biblical-cards'] });
        }
      } else {
        // Purchase failed — show error feedback and release haptics
        console.log('[Store][Error] purchase returned success:false');
        const errorMsg = language === 'es'
          ? 'No se pudo completar la compra. Intenta de nuevo.'
          : 'Purchase could not be completed. Try again.';
        setToastMessage(errorMsg);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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

  // Confirmation wrapper for token purchases — shows modal before executing
  const handleTokenPurchase = (itemId: string, price: number) => {
    const TOKEN_NAMES: Record<string, { es: string; en: string }> = {
      sobre_biblico:  { es: 'Sobre Bíblico',  en: 'Biblical Pack' },
      pack_pascua:    { es: 'Pack de Pascua',  en: 'Easter Pack' },
      pack_milagros:  { es: 'Pack de Milagros', en: 'Miracles Pack' },
      pincel_magico:  { es: 'Pincel Mágico',   en: 'Magic Paintbrush' },
    };
    const names = TOKEN_NAMES[itemId] ?? { es: itemId, en: itemId };
    const itemName = language === 'es' ? names.es : names.en;
    requestConfirmPurchase({ itemName, cost: price, onConfirm: () => executeTokenPurchase(itemId, price) });
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

  // Pending trades count — for Cromos Bíblicos badge
  const { data: tradesData } = useQuery({
    queryKey: ['trades', userId],
    queryFn: () => gamificationApi.getTrades(userId!),
    enabled: !!userId,
    staleTime: 20_000,
    refetchInterval: 30_000,
  });
  const pendingTradesCount = (tradesData?.trades ?? []).filter(
    (t: { toUserId: string; status: string }) => t.toUserId === userId && t.status === 'pending'
  ).length;

  const handleClaimDailyPack = useCallback(async (packType: 'sobre_biblico' | 'pack_pascua' | 'pack_milagros') => {
    if (!userId || isDailyPackClaiming.current) return;
    if (!dailyPackStatus?.canClaim) return;
    isDailyPackClaiming.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    try {
      const res = await gamificationApi.claimDailyPack(userId, packType);
      console.log('[Store][DailyPack] claimed', res);
      const cards = res.drawnCards && res.drawnCards.length > 0
        ? res.drawnCards
        : res.drawnCard ? [res.drawnCard] : [];
      if (res.success && cards.length > 0) {
        refetchDailyPack();
        queryClient.invalidateQueries({ queryKey: ['biblical-cards'] });
        queryClient.invalidateQueries({ queryKey: ['backendUser'] });
        console.log('[Store][DailyPack] queuing reveal, closing sheet');
        setPendingPackReveal({
          drawnCards: cards,
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
          { key: 'collections', labelEs: 'Colecciones', label: 'Collections' },
          { key: 'colecciones2', labelEs: 'Colecciones 2', label: 'Collections 2' },
          ...(seasonalBundles.length > 0 ? [{ key: 'season', labelEs: '✝ Temporada', label: '✝ Season' }] : []),
        ];
        const allBundlesRaw = Object.values(STORE_BUNDLES);

        // Sort: season-active first → incomplete/not-owned → newest → stable
        const allBundles = sortBundlesForUser(allBundlesRaw, purchasedItems, activeSeasonIds, true);

        const filteredBundles = activeSubcategory === 'adventures'
          ? allBundles.filter(b => (b as any).isAdventure === true)
          : activeSubcategory === 'collections'
          ? allBundles.filter(b => !(b as any).isAdventure)
          : activeSubcategory === 'colecciones2' || activeSubcategory === 'season'
          ? [] // colecciones2 shows navigation card below; season shows DB seasonal only
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
              {/* Colecciones 2 — navigates to Aventuras Bíblicas screen */}
              {activeSubcategory === 'colecciones2' && (
                <View style={{ paddingTop: 8 }}>
                  <Pressable
                    onPress={() => {
                      setShowStoreSectionModal(false);
                      setTimeout(() => router.push('/collections/adventures'), 350);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }}
                  >
                    <LinearGradient
                      colors={['#1A2A0D', '#0F1A07', '#080F03']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={{ borderRadius: 18, padding: 20, borderWidth: 1, borderColor: 'rgba(134,239,172,0.30)', marginBottom: 12 }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                        <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(134,239,172,0.12)', borderWidth: 1, borderColor: 'rgba(134,239,172,0.30)', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 24 }}>🗺️</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: sFont(17), fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2, marginBottom: 3 }}>
                            {language === 'es' ? 'Aventuras Bíblicas' : 'Biblical Adventures'}
                          </Text>
                          <Text style={{ fontSize: sFont(12), color: 'rgba(134,239,172,0.65)', lineHeight: 17 }}>
                            {language === 'es' ? 'Jonás, David, Ester y más aventuras' : 'Jonah, David, Esther & more'}
                          </Text>
                        </View>
                        <ChevronRight size={20} color="rgba(255,255,255,0.35)" />
                      </View>
                    </LinearGradient>
                  </Pressable>
                </View>
              )}
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
        const canAffordMilagros = points >= 1000;
        // Set to false when the Pascua 2026 event ends
        const EASTER_EVENT_ACTIVE = true;

        const TOKEN_SUBCATS = [
          { key: 'tokens', labelEs: 'Tokens', label: 'Tokens' },
          { key: 'insignias', labelEs: 'Insignias', label: 'Badges' },
          { key: 'canjear', labelEs: 'Canjear Código', label: 'Redeem Code' },
        ];
        const activeSubcat = activeSubcategory === 'all' ? 'tokens' : activeSubcategory;

        return (
          <View className="px-5">
            {/* Info banner */}
            <View style={{ marginBottom: 16, padding: 14, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.textMuted + '18' }}>
              <Text style={{ fontSize: sFont(13), color: colors.textMuted, lineHeight: 19 }}>
                {language === 'es'
                  ? 'Tokens especiales e insignias que desbloquean funciones únicas.'
                  : 'Special tokens and badges that unlock unique features.'}
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
                    setShowStoreSectionModal(false);
                    setTimeout(() => handleTokenPurchase('pincel_magico', 15000), 350);
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

            {/* Canjear Código subcategory */}
            {activeSubcat === 'canjear' && (
              <PromoCodeCard
                colors={colors}
                language={language}
                userId={userId ?? ''}
                onSuccess={(pts) => {
                  setToastAmount(pts);
                  setToastPositive(true);
                  setShowPointsToast(true);
                }}
              />
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
          hasRenameToken={hasRenameToken}
          onRenamePress={handleRenameOrPurchase}
          activeBadgeId={activeBadgeId}
          devotionalsCompleted={user?.devotionalsCompleted ?? 0}
          totalShares={user?.totalShares ?? 0}
        />

        {/* 1. CROMOS BÍBLICOS — hero banner */}
        <CromosCard
          language={language}
          colors={colors}
          showNewBadge
          badgeCount={pendingTradesCount > 0 ? pendingTradesCount : undefined}
          dailyPackStatus={dailyPackStatus ?? null}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setSubMenuType('cromos');
            setShowSubMenuModal(true);
          }}
          onPackImagePress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowPackStore(true);
          }}
        />

        {/* 2. CAMINO DEL CRECIMIENTO — season banner */}
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

        {/* 3. DESAFÍOS SEMANALES — compact informational */}
        {effectiveUserId && (
          <WeeklyChallengesCard
            colors={colors}
            language={language}
            userId={effectiveUserId}
            onAllComplete={setAllChallengesComplete}
          />
        )}

        {/* Weekly Chest — shown after challenges */}
        {effectiveUserId && (
          <WeeklyChestCard
            colors={colors}
            language={language}
            userId={effectiveUserId}
            allChallengesComplete={allChallengesComplete}
            onClaim={() => setShowChestUnlockedModal(true)}
          />
        )}

        {/* 4. EXPLORAR — separator + grid */}
        <View style={{ marginHorizontal: 20, marginBottom: 16, marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.textMuted + '28' }} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {language === 'es' ? 'Explorar' : 'Explore'}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.textMuted + '28' }} />
          </View>
        </View>

        {/* Feature Cards Grid — Explorar section */}
        <View
          style={{ paddingHorizontal: 20, marginBottom: 28 }}
          pointerEvents={isLoadingBackendUser ? 'none' : 'auto'}
        >
          {isLoadingBackendUser && (
            <View style={{ position: 'absolute', top: 0, left: 20, right: 20, bottom: 0, zIndex: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: 'transparent' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}

          {/* Top row: Objetos Especiales + Personalización — 50/50 */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            {/* OBJETOS ESPECIALES */}
            <Pressable
              style={{ flex: 1 }}
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
            >
              <LinearGradient
                colors={['#2A1F00', '#1A1200', '#0E0900']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 18,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(212,175,55,0.22)',
                  minHeight: 110,
                  justifyContent: 'space-between',
                }}
              >
                <View style={{
                  width: 38, height: 38, borderRadius: 11,
                  backgroundColor: 'rgba(212,175,55,0.12)',
                  borderWidth: 1, borderColor: 'rgba(212,175,55,0.28)',
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 10,
                }}>
                  <Text style={{ fontSize: 18 }}>✨</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2, marginBottom: 2 }} numberOfLines={1}>
                    {language === 'es' ? 'Objetos' : 'Items'}
                  </Text>
                  <Text style={{ fontSize: 11, color: 'rgba(212,175,55,0.65)', fontWeight: '500' }} numberOfLines={1}>
                    {language === 'es' ? 'Tokens especiales' : 'Special tokens'}
                  </Text>
                </View>
                {dailyPackStatus?.canClaim && (
                  <View style={{
                    position: 'absolute', top: 10, right: 10,
                    width: 8, height: 8, borderRadius: 4,
                    backgroundColor: '#FF3B30',
                  }} />
                )}
              </LinearGradient>
            </Pressable>

            {/* PERSONALIZACIÓN */}
            <Pressable
              style={{ flex: 1 }}
              onPress={() => {
                const now = Date.now();
                if (now - lastCategoryTapAt.current < 500) return;
                lastCategoryTapAt.current = now;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSubMenuType('personalizacion');
                setShowSubMenuModal(true);
              }}
            >
              <LinearGradient
                colors={['#0D2A2A', '#071A1A', '#030F0F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 18,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(45,212,191,0.22)',
                  minHeight: 110,
                  justifyContent: 'space-between',
                }}
              >
                <View style={{
                  width: 38, height: 38, borderRadius: 11,
                  backgroundColor: 'rgba(45,212,191,0.12)',
                  borderWidth: 1, borderColor: 'rgba(45,212,191,0.28)',
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 10,
                }}>
                  <Text style={{ fontSize: 18 }}>🎨</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2, marginBottom: 2 }} numberOfLines={1}>
                    {language === 'es' ? 'Personalizar' : 'Customize'}
                  </Text>
                  <Text style={{ fontSize: 11, color: 'rgba(45,212,191,0.65)', fontWeight: '500' }} numberOfLines={1}>
                    {language === 'es' ? 'Temas y marcos' : 'Themes & frames'}
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Bottom row: Paquetes — full width */}
          <Pressable
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
          >
            <LinearGradient
              colors={['#2A1400', '#1A0D00', '#0E0800']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 18,
                padding: 16,
                borderWidth: 1,
                borderColor: 'rgba(251,146,60,0.22)',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <View style={{
                width: 44, height: 44, borderRadius: 13,
                backgroundColor: 'rgba(251,146,60,0.12)',
                borderWidth: 1, borderColor: 'rgba(251,146,60,0.28)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 20 }}>🎁</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2, marginBottom: 2 }}>
                  {language === 'es' ? 'Paquetes' : 'Bundles'}
                </Text>
                <Text style={{ fontSize: 12, color: 'rgba(251,146,60,0.65)', fontWeight: '500' }}>
                  {language === 'es' ? 'Aventuras, colecciones y más' : 'Adventures, collections & more'}
                </Text>
              </View>
              <ChevronRight size={18} color="rgba(255,255,255,0.30)" />
            </LinearGradient>
          </Pressable>

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
                : subMenuType === 'cromos'
                ? (language === 'es' ? 'Cromos Bíblicos' : 'Biblical Cards')
                : (language === 'es' ? 'Personalización' : 'Personalization')}
            </Text>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} showsVerticalScrollIndicator={false}>
            {subMenuType === 'cromos' ? (
              <>
                {/* Tienda de Sobres */}
                <Pressable
                  onPress={() => {
                    setShowSubMenuModal(false);
                    setTimeout(() => setShowPackStore(true), 350);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <LinearGradient
                    colors={['#1A0A2A', '#0F0518', '#08020F']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(192,132,252,0.25)' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(192,132,252,0.12)', borderWidth: 1, borderColor: 'rgba(192,132,252,0.30)', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 22 }}>📦</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: sFont(16), fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2, marginBottom: 2 }}>
                          {language === 'es' ? 'Tienda de Sobres' : 'Pack Store'}
                        </Text>
                        <Text style={{ fontSize: sFont(12), color: 'rgba(192,132,252,0.70)' }}>
                          {language === 'es' ? 'Abre sobres de cartas' : 'Open card packs'}
                        </Text>
                      </View>
                      <ChevronRight size={18} color="rgba(255,255,255,0.30)" />
                    </View>
                  </LinearGradient>
                </Pressable>

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
                          {language === 'es' ? 'Tu colección de cartas' : 'Your card collection'}
                        </Text>
                      </View>
                      <ChevronRight size={18} color="rgba(255,255,255,0.30)" />
                    </View>
                  </LinearGradient>
                </Pressable>

                {/* Trueques */}
                <Pressable
                  onPress={() => {
                    setShowSubMenuModal(false);
                    setTimeout(() => setShowTradeInbox(true), 350);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <LinearGradient
                    colors={['#0A2A1A', '#051A0F', '#020F07']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(52,211,153,0.10)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.28)', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 22 }}>🔄</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: sFont(16), fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2, marginBottom: 2 }}>
                          {language === 'es' ? 'Trueques' : 'Trades'}
                        </Text>
                        <Text style={{ fontSize: sFont(12), color: 'rgba(52,211,153,0.65)' }}>
                          {language === 'es' ? 'Intercambia cartas con otros' : 'Trade cards with others'}
                        </Text>
                      </View>
                      <ChevronRight size={18} color="rgba(255,255,255,0.30)" />
                    </View>
                  </LinearGradient>
                </Pressable>
              </>
            ) : subMenuType === 'colecciones' ? (
              <>
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

                {/* Colecciones */}
                <Pressable
                  onPress={() => {
                    storeSectionFromSubmenu.current = 'colecciones';
                    setShowSubMenuModal(false);
                    setTimeout(() => {
                      setActiveSubcategory('all');
                      setStoreSectionModalCategory('collections');
                      setShowStoreSectionModal(true);
                    }, 350);
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
                        <Text style={{ fontSize: 22 }}>📚</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: sFont(16), fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2, marginBottom: 2 }}>
                          {language === 'es' ? 'Colecciones' : 'Collections'}
                        </Text>
                        <Text style={{ fontSize: sFont(12), color: 'rgba(96,165,250,0.70)' }}>
                          {language === 'es' ? 'Ester, Jonás y más' : 'Esther, Jonah & more'}
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

      {/* Weekly Chest Unlocked Modal — intro step before prize reveal */}
      <WeeklyChestUnlockedModal
        visible={showChestUnlockedModal}
        language={language}
        onOpen={() => {
          setShowChestUnlockedModal(false);
          handleChestClaim();
        }}
        onClose={() => setShowChestUnlockedModal(false)}
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

      {/* Trade Inbox Modal — accessible from Cromos Bíblicos */}
      <TradeInboxModal
        visible={showTradeInbox}
        onClose={() => setShowTradeInbox(false)}
      />

      {/* Daily Pack Picker — shown when user taps Reclamar on DailyPackBanner */}
      <Modal
        visible={showDailyPackPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDailyPackPicker(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}
          onPress={() => setShowDailyPackPicker(false)}
        >
          <Pressable onPress={() => {}} style={{ backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 40 }}>
            {/* Handle */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.textMuted + '40' }} />
            </View>
            {/* Title */}
            <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 }}>
              <Text style={{ fontSize: sFont(22), fontWeight: '900', color: colors.text, marginBottom: 4 }}>
                {language === 'es' ? '¿Qué sobre quieres?' : 'Which pack do you want?'}
              </Text>
              <Text style={{ fontSize: sFont(14), color: colors.textMuted }}>
                {language === 'es' ? 'Elige uno — es gratis hoy 🎁' : "Pick one — it's free today 🎁"}
              </Text>
            </View>
            {/* Pack options */}
            <View style={{ paddingHorizontal: 20, gap: 10 }}>
              {([
                { id: 'sobre_biblico' as const, nameEs: 'Sobre Bíblico', nameEn: 'Biblical Pack', image: require('../../../assets/packs/sobre_biblico_pack.png'), gradientColors: ['#1C1205', '#0E0A02'] as [string,string], borderColor: 'rgba(212,175,55,0.35)' },
                { id: 'pack_pascua' as const,   nameEs: 'Sobre de Pascua', nameEn: 'Easter Pack', image: require('../../../assets/packs/pack_pascua_pack.png'), gradientColors: ['#1C0808', '#0E0404'] as [string,string], borderColor: 'rgba(212,80,74,0.35)' },
                { id: 'pack_milagros' as const, nameEs: 'Sobre de Milagros', nameEn: 'Miracles Pack', image: require('../../../assets/packs/pack_milagros_pack.png'), gradientColors: ['#071A1A', '#030F0F'] as [string,string], borderColor: 'rgba(45,212,191,0.35)' },
              ]).map((pack) => (
                <Pressable
                  key={pack.id}
                  onPress={() => {
                    setShowDailyPackPicker(false);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setTimeout(() => handleClaimDailyPack(pack.id), 300);
                  }}
                >
                  <LinearGradient
                    colors={pack.gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 18, borderWidth: 1, borderColor: pack.borderColor, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 }}
                  >
                    <Image source={pack.image} style={{ width: 52, height: 72 }} resizeMode="contain" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: sFont(16), fontWeight: '800', color: '#FFFFFF', marginBottom: 6 }}>
                        {language === 'es' ? pack.nameEs : pack.nameEn}
                      </Text>
                      <View style={{ backgroundColor: 'rgba(34,197,94,0.18)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.35)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' }}>
                        <Text style={{ fontSize: sFont(11), fontWeight: '700', color: '#4ADE80' }}>
                          {language === 'es' ? '¡Gratis hoy!' : 'Free today!'}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color="rgba(255,255,255,0.30)" />
                  </LinearGradient>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Pack Store Modal — exclusive card packs store from Cromos Bíblicos */}
      <Modal
        visible={showPackStore}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPackStore(false)}
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
            <Pressable onPress={() => setShowPackStore(false)} style={{ marginRight: 12, padding: 4 }}>
              <ChevronLeft size={24} color={colors.text} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: sFont(20), fontWeight: '800', color: colors.text }}>
                {language === 'es' ? 'Tienda de Sobres' : 'Pack Store'}
              </Text>
              <Text style={{ fontSize: sFont(12), color: colors.textMuted }}>
                {language === 'es' ? 'Abre sobres y amplía tu colección' : 'Open packs & grow your collection'}
              </Text>
            </View>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
          >
            <DailyPackBanner
              status={dailyPackStatus ?? null}
              language={language}
              isEventActive={true}
              disabled={isPackTransactionActive}
              onClaim={handleClaimDailyPack}
              onClaimPress={() => {
                setShowPackStore(false);
                setTimeout(() => setShowDailyPackPicker(true), 350);
              }}
            />
            <BiblicalPackCard
              canAfford={points >= 500}
              disabled={isPackTransactionActive}
              language={language}
              onPress={() => {
                if (points >= 500 && !isPackTransactionActive) {
                  setShowPackStore(false);
                  setTimeout(() => handleTokenPurchase('sobre_biblico', 500), 300);
                }
              }}
            />
            <EasterPackCard
              canAfford={points >= 500}
              disabled={isPackTransactionActive}
              isEventActive={true}
              language={language}
              onPress={() => {
                if (points >= 500 && !isPackTransactionActive) {
                  setShowPackStore(false);
                  setTimeout(() => handleTokenPurchase('pack_pascua', 500), 300);
                }
              }}
            />
            <MilagrosPackCard
              canAfford={points >= 1000}
              disabled={isPackTransactionActive}
              language={language}
              onPress={() => {
                if (points >= 1000 && !isPackTransactionActive) {
                  setShowPackStore(false);
                  setTimeout(() => handleTokenPurchase('pack_milagros', 1000), 300);
                }
              }}
            />
            {/* Link to album */}
            <Pressable
              onPress={() => {
                setShowPackStore(false);
                setTimeout(() => router.push('/biblical-cards-album'), 350);
              }}
              style={{
                marginTop: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.textMuted + '25',
              }}
            >
              <Text style={{ fontSize: sFont(14), fontWeight: '700', color: colors.primary }}>
                {language === 'es' ? '📖 Ver mi álbum bíblico' : '📖 View my biblical album'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      {/* Pack Opening Animation Modal — disabled (stability bypass) */}
      {/* PackOpeningModal will be re-enabled once the animation state machine is stable */}

      {/* Rename Nickname Modal */}
      <Modal
        visible={showRenameModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isRenaming && setShowRenameModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <Animated.View
            entering={FadeInDown.duration(250)}
            style={{ width: '100%', borderRadius: 24, padding: 24, backgroundColor: colors.surface }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary + '20' }}>
                  <Key size={18} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
                  {language === 'es' ? 'Cambiar nickname' : 'Change nickname'}
                </Text>
              </View>
              <Pressable onPress={() => { if (!isRenaming) setShowRenameModal(false); }}>
                <X size={22} color={colors.textMuted} />
              </Pressable>
            </View>
            <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 16 }}>
              {language === 'es'
                ? 'Escribe tu nuevo nickname. Recuerda: este cambio consume tu Token de Cambio de Nombre.'
                : 'Enter your new nickname. Note: this will consume your Nickname Change Token.'}
            </Text>
            <TextInput
              value={renameInput}
              onChangeText={(t) => { setRenameInput(t); setRenameError(null); }}
              placeholder={language === 'es' ? 'Nuevo nickname' : 'New nickname'}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              style={{ borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 4, backgroundColor: colors.background, color: colors.text, borderWidth: 1, borderColor: renameError ? '#ef4444' : colors.textMuted + '30' }}
              editable={!isRenaming}
            />
            <Text style={{ fontSize: 14, marginBottom: 16, marginLeft: 4, color: colors.textMuted }}>
              {renameInput.length}/20
            </Text>
            {renameError && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, padding: 12, borderRadius: 12, backgroundColor: '#ef444420' }}>
                <X size={14} color="#ef4444" />
                <Text style={{ fontSize: 14, flex: 1, color: '#ef4444' }}>{renameError}</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => { if (!isRenaming) setShowRenameModal(false); }}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', backgroundColor: colors.textMuted + '20' }}
              >
                <Text style={{ fontWeight: '600', color: colors.textMuted }}>
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleRename}
                disabled={isRenaming || renameInput.trim().length < 3}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', backgroundColor: renameInput.trim().length >= 3 ? colors.primary : colors.primary + '50' }}
              >
                {isRenaming
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={{ fontWeight: '700', color: '#fff' }}>{language === 'es' ? 'Confirmar' : 'Confirm'}</Text>}
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
