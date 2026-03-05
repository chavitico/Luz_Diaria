import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ChevronLeft, Lock, Check, BookOpen, Clock, ShoppingBag, Zap, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useThemeColors, useLanguage, useUser, useAppStore } from '@/lib/store';
import {
  STORE_BUNDLES,
  AVATAR_FRAMES,
  SPIRITUAL_TITLES,
  DEFAULT_AVATARS,
  PURCHASABLE_THEMES,
} from '@/lib/constants';
import { gamificationApi } from '@/lib/gamification-api';
import { addLedgerEntry } from '@/lib/points-ledger';

// ─── Adventure bundle IDs in display order ───────────────────────────────────
const ADVENTURE_BUNDLE_IDS = [
  'bundle_adv_jonas',
  'bundle_adv_david',
  'bundle_adv_esther',
  'bundle_adv_daniel',
  'bundle_adv_moses',
  'bundle_adv_noah',
];

// ─── Story emojis ─────────────────────────────────────────────────────────────
const BUNDLE_EMOJIS: Record<string, string> = {
  bundle_adv_jonas:  '🐋',
  bundle_adv_david:  '⚔️',
  bundle_adv_esther: '👑',
  bundle_adv_daniel: '🦁',
  bundle_adv_moses:  '🌊',
  bundle_adv_noah:   '🕊️',
};

// ─── Accent gradients ─────────────────────────────────────────────────────────
const BUNDLE_ACCENTS: Record<string, [string, string]> = {
  bundle_adv_jonas:  ['#0B3A5C', '#1A6B8A'],
  bundle_adv_david:  ['#5C1B0B', '#8A3A1A'],
  bundle_adv_esther: ['#3B1B5C', '#7A3A8A'],
  bundle_adv_daniel: ['#1B3A1A', '#3A6B38'],
  bundle_adv_moses:  ['#0B2E5C', '#1A5A8A'],
  bundle_adv_noah:   ['#1B3A38', '#2A6B68'],
};

type BundleStatus = 'completed' | 'available' | 'comingSoon';

function getStatus(bundleId: string, purchasedItems: string[], comingSoon?: boolean): BundleStatus {
  if (comingSoon) return 'comingSoon';
  const bundle = STORE_BUNDLES[bundleId];
  if (!bundle) return 'comingSoon';
  const items = bundle.items ?? [];
  const allOwned = items.length > 0 && items.every(id => purchasedItems.includes(id));
  return allOwned ? 'completed' : 'available';
}

function sortBundles(ids: string[], purchasedItems: string[]): string[] {
  return [...ids].sort((a, b) => {
    const bA = STORE_BUNDLES[a];
    const bB = STORE_BUNDLES[b];
    const sA = getStatus(a, purchasedItems, bA?.comingSoon);
    const sB = getStatus(b, purchasedItems, bB?.comingSoon);
    if (sA === 'completed' && sB !== 'completed') return 1;
    if (sB === 'completed' && sA !== 'completed') return -1;
    if (sA !== sB) {
      if (sA === 'available') return -1;
      if (sB === 'available') return 1;
    }
    const relA = (bA as any)?.releasedAt ? new Date((bA as any).releasedAt).getTime() : 0;
    const relB = (bB as any)?.releasedAt ? new Date((bB as any).releasedAt).getTime() : 0;
    if (relA !== relB) return relB - relA;
    return (bA?.adventureNumber ?? 99) - (bB?.adventureNumber ?? 99);
  });
}

// ─── Resolve item display info ─────────────────────────────────────────────────
function resolveItem(itemId: string): { name: string; nameEs: string; emoji?: string; color?: string; type: string } {
  if (itemId.startsWith('avatar_')) {
    const av = DEFAULT_AVATARS.find(a => a.id === itemId);
    if (av) return { name: av.name, nameEs: av.nameEs, emoji: av.emoji, type: 'avatar' };
  }
  if (itemId.startsWith('frame_')) {
    const fr = AVATAR_FRAMES[itemId];
    if (fr) return { name: fr.name, nameEs: fr.nameEs, color: fr.color, type: 'frame' };
  }
  if (itemId.startsWith('title_')) {
    const ti = SPIRITUAL_TITLES[itemId];
    if (ti) return { name: ti.name, nameEs: ti.nameEs, emoji: '✨', type: 'title' };
  }
  if (itemId.startsWith('theme_')) {
    const th = PURCHASABLE_THEMES[itemId];
    if (th) return { name: th.name, nameEs: th.nameEs, type: 'theme' };
  }
  return { name: itemId, nameEs: itemId, type: 'item' };
}

// ─── Bundle Detail Bottom Sheet ───────────────────────────────────────────────
function BundleDetailSheet({
  bundleId,
  visible,
  onClose,
  purchasedItems,
  userPoints,
  userId,
  language,
}: {
  bundleId: string | null;
  visible: boolean;
  onClose: () => void;
  purchasedItems: string[];
  userPoints: number;
  userId: string;
  language: 'en' | 'es';
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const updateUser = useAppStore(s => s.updateUser);
  // addLedgerEntry is imported directly from points-ledger

  const translateY = useSharedValue(700);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 220 });
      translateY.value = withSpring(0, { damping: 22, stiffness: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(700, { duration: 220 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  const bundlePurchaseMutation = useMutation({
    mutationFn: ({ bundleId, itemIds, bundlePrice }: { bundleId: string; itemIds: string[]; bundlePrice: number }) =>
      gamificationApi.purchaseBundle(userId, bundleId, itemIds, bundlePrice),
    onSuccess: (data) => {
      if (data.success && data.newPoints !== undefined) {
        const bundle = STORE_BUNDLES[bundleId!];
        updateUser({
          points: data.newPoints,
          purchasedItems: [...purchasedItems, ...(bundle?.items ?? [])],
        });
        addLedgerEntry({
          delta: -(bundle?.bundlePrice ?? 0),
          kind: 'purchase',
          title: language === 'es' ? 'Compra de Paquete' : 'Bundle Purchase',
          detail: language === 'es' ? bundle?.nameEs : bundle?.name,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: ['backendUser'] });
        onClose();
      }
    },
  });

  if (!bundleId) return null;
  const bundle = STORE_BUNDLES[bundleId];
  if (!bundle) return null;

  const status = getStatus(bundleId, purchasedItems, bundle.comingSoon);
  const allOwned = status === 'completed';
  const canAfford = userPoints >= bundle.bundlePrice;
  const [c1] = BUNDLE_ACCENTS[bundleId] ?? ['#1A1A1A', '#2A2A2A'];
  const emoji = BUNDLE_EMOJIS[bundleId] ?? '📖';
  const savings = bundle.originalPrice - bundle.bundlePrice;
  const isPurchasing = bundlePurchaseMutation.isPending;

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
            maxHeight: '88%',
          },
          sheetStyle,
        ]}
      >
        {/* Drag handle */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.textMuted + '40' }} />
        </View>

        {/* Header gradient */}
        <LinearGradient
          colors={[c1 + 'CC', colors.surface]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ margin: 16, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}
        >
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 28 }}>{emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>
              {language === 'es' ? `Aventura ${bundle.adventureNumber ?? ''}` : `Adventure ${bundle.adventureNumber ?? ''}`}
            </Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 }}>
              {language === 'es' ? bundle.nameEs : bundle.name}
            </Text>
            {allOwned && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Check size={12} color="#22C55E" />
                <Text style={{ fontSize: 11, color: '#22C55E', fontWeight: '600' }}>
                  {language === 'es' ? 'Completada' : 'Completed'}
                </Text>
              </View>
            )}
          </View>
          <Pressable onPress={onClose} style={{ padding: 6 }}>
            <X size={18} color="rgba(255,255,255,0.5)" />
          </Pressable>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}>
          {/* Description */}
          <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20, marginBottom: 20, opacity: 0.8 }}>
            {language === 'es' ? bundle.descriptionEs ?? bundle.description : bundle.description}
          </Text>

          {/* Items list */}
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
            {language === 'es' ? 'Contenido del paquete' : 'Bundle contents'} · {bundle.items.length} {language === 'es' ? 'ítems' : 'items'}
          </Text>
          {bundle.items.map((itemId) => {
            const meta = resolveItem(itemId);
            const isOwned = purchasedItems.includes(itemId);
            const typeLabels: Record<string, [string, string]> = {
              avatar: ['Avatar', 'Avatar'],
              frame: ['Frame', 'Marco'],
              title: ['Title', 'Título'],
              theme: ['Theme', 'Tema'],
            };
            const typeLabel = typeLabels[meta.type]?.[language === 'es' ? 1 : 0] ?? meta.type;

            return (
              <View
                key={itemId}
                style={{
                  flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
                  paddingHorizontal: 12, marginBottom: 6, borderRadius: 12,
                  backgroundColor: isOwned ? colors.textMuted + '08' : colors.primary + '0C',
                  borderWidth: 1,
                  borderColor: isOwned ? colors.textMuted + '20' : colors.primary + '25',
                }}
              >
                <View style={{
                  width: 36, height: 36, borderRadius: 10, marginRight: 12,
                  backgroundColor: isOwned ? colors.textMuted + '15' : colors.primary + '20',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {meta.emoji ? (
                    <Text style={{ fontSize: 18 }}>{meta.emoji}</Text>
                  ) : meta.color ? (
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: meta.color, borderWidth: 2, borderColor: '#fff8' }} />
                  ) : (
                    <Text style={{ fontSize: 16 }}>✨</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: isOwned ? colors.textMuted : colors.text }}>
                    {language === 'es' ? meta.nameEs : meta.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>{typeLabel}</Text>
                </View>
                {isOwned ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Check size={13} color="#22C55E" strokeWidth={2.5} />
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#22C55E' }}>
                      {language === 'es' ? 'Adquirido' : 'Owned'}
                    </Text>
                  </View>
                ) : (
                  <Lock size={13} color={colors.textMuted} />
                )}
              </View>
            );
          })}

          {/* Collection bonus */}
          {(bundle as any).collectionBonus > 0 && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 20,
              backgroundColor: '#F5C84215', borderRadius: 12, padding: 12,
              borderWidth: 1, borderColor: '#F5C84230',
            }}>
              <Zap size={14} color="#F5C842" />
              <Text style={{ fontSize: 12, color: '#F5C842', fontWeight: '600' }}>
                {language === 'es'
                  ? `+${(bundle as any).collectionBonus} puntos al completar`
                  : `+${(bundle as any).collectionBonus} pts when completed`}
              </Text>
            </View>
          )}

          {/* Pricing & CTA */}
          {!allOwned && !bundle.comingSoon && (
            <View style={{ marginTop: 8 }}>
              {/* Price row */}
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 6, justifyContent: 'center' }}>
                <Text style={{ fontSize: 26, fontWeight: '900', color: canAfford ? colors.primary : '#EF4444' }}>
                  {bundle.bundlePrice.toLocaleString()} ✦
                </Text>
                {savings > 0 && (
                  <View style={{ backgroundColor: '#22C55E20', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#22C55E' }}>
                      -{savings} {language === 'es' ? 'de descuento' : 'off'}
                    </Text>
                  </View>
                )}
              </View>
              {!canAfford && (
                <Text style={{ fontSize: 12, color: '#EF4444', textAlign: 'center', marginBottom: 10 }}>
                  {language === 'es'
                    ? `Necesitas ${(bundle.bundlePrice - userPoints).toLocaleString()} puntos más`
                    : `You need ${(bundle.bundlePrice - userPoints).toLocaleString()} more points`}
                </Text>
              )}
              <Pressable
                onPress={() => {
                  if (!canAfford || isPurchasing) return;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  bundlePurchaseMutation.mutate({
                    bundleId,
                    itemIds: bundle.items,
                    bundlePrice: bundle.bundlePrice,
                  });
                }}
                style={{
                  backgroundColor: canAfford ? colors.primary : colors.textMuted + '40',
                  borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'row', gap: 8,
                  opacity: canAfford ? 1 : 0.6,
                }}
              >
                {isPurchasing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <ShoppingBag size={18} color="#fff" />
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>
                      {canAfford
                        ? (language === 'es' ? 'Adquirir paquete' : 'Get bundle')
                        : (language === 'es' ? 'Puntos insuficientes' : 'Not enough points')}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          )}

          {allOwned && (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#22C55E20', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Check size={28} color="#22C55E" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#22C55E' }}>
                {language === 'es' ? '¡Aventura completada!' : 'Adventure completed!'}
              </Text>
            </View>
          )}

          {bundle.comingSoon && (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Clock size={32} color={colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textMuted }}>
                {language === 'es' ? 'Próximamente' : 'Coming Soon'}
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ─── Single adventure card ────────────────────────────────────────────────────
function AdventureCard({
  bundleId,
  purchasedItems,
  language,
  isHighlighted,
  index,
  onPress,
}: {
  bundleId: string;
  purchasedItems: string[];
  language: 'en' | 'es';
  isHighlighted: boolean;
  index: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const bundle = STORE_BUNDLES[bundleId];
  if (!bundle) return null;

  const status = getStatus(bundleId, purchasedItems, bundle.comingSoon);
  const emoji = BUNDLE_EMOJIS[bundleId] ?? '📖';
  const [c1, c2] = BUNDLE_ACCENTS[bundleId] ?? ['#1A1A1A', '#2A2A2A'];
  const title = language === 'es' ? bundle.nameEs : bundle.name;
  const itemCount = bundle.items?.length ?? 0;
  const ownedCount = bundle.items?.filter(id => purchasedItems.includes(id)).length ?? 0;

  const highlightStyle = isHighlighted
    ? { borderWidth: 2, borderColor: '#F5C842' }
    : { borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' };

  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(380)} style={animatedStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
      >
        <LinearGradient
          colors={[c1, c2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[{ borderRadius: 20, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14 }, highlightStyle]}
        >
          {/* Emoji badge */}
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 26 }}>{emoji}</Text>
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.45)', letterSpacing: 1, textTransform: 'uppercase' }}>
                {language === 'es' ? `Aventura ${bundle.adventureNumber ?? ''}` : `Adventure ${bundle.adventureNumber ?? ''}`}
              </Text>
              {isHighlighted && (
                <View style={{ backgroundColor: '#F5C84233', borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1, borderWidth: 1, borderColor: '#F5C84266' }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#F5C842' }}>
                    {language === 'es' ? 'SELECCIONADO' : 'SELECTED'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2, marginBottom: 4 }}>
              {title}
            </Text>
            {/* Progress bar */}
            {status !== 'comingSoon' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${(ownedCount / Math.max(itemCount, 1)) * 100}%`, backgroundColor: status === 'completed' ? '#22C55E' : '#F5C842', borderRadius: 2 }} />
                </View>
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>{ownedCount}/{itemCount}</Text>
              </View>
            )}
            {status === 'comingSoon' && (
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                {language === 'es' ? 'Próximamente' : 'Coming soon'}
              </Text>
            )}
          </View>

          {/* Status icon */}
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            {status === 'completed' ? (
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#22C55E33', borderWidth: 1.5, borderColor: '#22C55E88', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={18} color="#22C55E" />
              </View>
            ) : status === 'comingSoon' ? (
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={16} color="rgba(255,255,255,0.4)" />
              </View>
            ) : (
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5C84222', borderWidth: 1.5, borderColor: '#F5C84266', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={16} color="#F5C842" />
              </View>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AdventuresCollectionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const language = useLanguage();
  const user = useUser();
  const userId = useAppStore(s => s.user?.id ?? '');
  const purchasedItems = user?.purchasedItems ?? [];
  const userPoints = user?.points ?? 0;

  const { bundleId: highlightId } = useLocalSearchParams<{ bundleId?: string }>();

  const scrollRef = useRef<ScrollView>(null);
  const cardOffsetsRef = useRef<Record<string, number>>({});

  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [activeFilter, setActiveFilter] = useState<BundleStatus | 'all'>('all');

  const sortedIds = sortBundles(ADVENTURE_BUNDLE_IDS, purchasedItems).filter(id => {
    if (activeFilter === 'all') return true;
    const b = STORE_BUNDLES[id];
    return getStatus(id, purchasedItems, b?.comingSoon) === activeFilter;
  });

  // Auto-scroll to highlighted card
  useEffect(() => {
    if (!highlightId) return;
    const timer = setTimeout(() => {
      const offset = cardOffsetsRef.current[highlightId];
      if (offset !== undefined && scrollRef.current) {
        scrollRef.current.scrollTo({ y: Math.max(0, offset - 80), animated: true });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [highlightId]);

  const openBundle = useCallback((id: string) => {
    setSelectedBundleId(id);
    setShowDetail(true);
  }, []);

  // Completion stats
  const completedCount = ADVENTURE_BUNDLE_IDS.filter(id => {
    const b = STORE_BUNDLES[id];
    return b && !b.comingSoon && b.items.every(itemId => purchasedItems.includes(itemId));
  }).length;
  const availableCount = ADVENTURE_BUNDLE_IDS.filter(id => {
    const b = STORE_BUNDLES[id];
    return b && !b.comingSoon;
  }).length;

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      {/* Header */}
      <LinearGradient
        colors={['#0A0E1A', '#0F1525']}
        style={{
          paddingTop: insets.top + 8, paddingBottom: 16, paddingHorizontal: 20,
          flexDirection: 'row', alignItems: 'center', gap: 12,
          borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
          style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={20} color="#FFFFFF" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 }}>
            {language === 'es' ? 'Aventuras Bíblicas' : 'Biblical Adventures'}
          </Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
            {completedCount}/{availableCount} {language === 'es' ? 'completadas' : 'completed'}
          </Text>
        </View>
      </LinearGradient>

      {/* Filter tabs */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
        {([
          { filter: 'all' as const, label: language === 'es' ? 'Todas' : 'All', icon: null, activeColor: '#FFFFFF', bg: 'rgba(255,255,255,0.12)' },
          { filter: 'completed' as const, icon: <Check size={11} color="#22C55E" />, label: language === 'es' ? 'Completada' : 'Completed', activeColor: '#22C55E', bg: '#22C55E22' },
          { filter: 'available' as const, icon: <BookOpen size={11} color="#F5C842" />, label: language === 'es' ? 'Disponible' : 'Available', activeColor: '#F5C842', bg: '#F5C84222' },
          { filter: 'comingSoon' as const, icon: <Clock size={11} color="rgba(255,255,255,0.4)" />, label: language === 'es' ? 'Próximamente' : 'Coming Soon', activeColor: 'rgba(255,255,255,0.6)', bg: 'rgba(255,255,255,0.08)' },
        ] as Array<{ filter: BundleStatus | 'all'; label: string; icon: React.ReactNode | null; activeColor: string; bg: string }>).map((item) => {
          const isActive = activeFilter === item.filter;
          return (
            <Pressable
              key={item.filter}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter(item.filter);
              }}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 5,
                paddingHorizontal: 10, paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: isActive ? (item.filter === 'all' ? 'rgba(255,255,255,0.15)' : item.bg.replace('22', '44')) : 'rgba(255,255,255,0.05)',
                borderWidth: 1,
                borderColor: isActive ? (item.filter === 'all' ? 'rgba(255,255,255,0.3)' : item.activeColor + '66') : 'transparent',
              }}
            >
              {item.icon && (
                <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: isActive ? item.bg : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {item.icon}
                </View>
              )}
              <Text style={{ fontSize: 11, fontWeight: isActive ? '700' : '400', color: isActive ? item.activeColor : 'rgba(255,255,255,0.4)' }}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Card list */}
      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        {sortedIds.map((id, index) => (
          <View key={id} onLayout={(e) => { cardOffsetsRef.current[id] = e.nativeEvent.layout.y; }}>
            <AdventureCard
              bundleId={id}
              purchasedItems={purchasedItems}
              language={language}
              isHighlighted={id === highlightId}
              index={index}
              onPress={() => openBundle(id)}
            />
          </View>
        ))}
        {sortedIds.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 8 }}>
            <Text style={{ fontSize: 32 }}>✦</Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
              {language === 'es' ? 'Sin aventuras en esta categoría' : 'No adventures in this category'}
            </Text>
          </View>
        )}
        <Text style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8, lineHeight: 18 }}>
          {language === 'es' ? 'Más aventuras bíblicas próximamente' : 'More biblical adventures coming soon'}
        </Text>
      </ScrollView>

      {/* Bundle Detail Sheet */}
      <BundleDetailSheet
        bundleId={selectedBundleId}
        visible={showDetail}
        onClose={() => setShowDetail(false)}
        purchasedItems={purchasedItems}
        userPoints={userPoints}
        userId={userId}
        language={language}
      />
    </View>
  );
}
