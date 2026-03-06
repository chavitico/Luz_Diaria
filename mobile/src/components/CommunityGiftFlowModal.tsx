/**
 * CommunityGiftFlowModal
 *
 * Multi-step gift flow launched from the community screen when the user
 * taps on another member's card.
 *
 * Steps:
 *  1. Category   — avatar | marco (frame) | título (title)
 *  2. Tier/Rarity — common | rare | epic  (filtered by category)
 *  3. Item select — list of items in that category + rarity (owned items greyed out)
 *  4. Confirm     — item card + cost + recipient → "Confirmar"
 *  5. Success     — animated confirmation
 *
 * The receiver's inventory is loaded once at open so owned items are shown
 * with a clear "Ya lo tiene" badge instead of being hidden.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Gift,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Coins,
  ShoppingCart,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors, useLanguage, useUser, useAppStore } from '@/lib/store';
import { ActionButton } from '@/components/ui/ActionButton';
import type { CommunityMember } from '@/lib/gamification-api';
import { RARITY_COLORS } from '@/lib/constants';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

// ─── Types ────────────────────────────────────────────────────────────────────

type GiftCategory = 'avatar' | 'frame' | 'title';
type GiftRarity = 'common' | 'rare' | 'epic';
type Step = 'category' | 'rarity' | 'item' | 'confirm' | 'success';

interface GiftableItem {
  id: string;
  type: string;
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  pricePoints: number;
  rarity: string;
  assetRef: string;
  receiverOwns: boolean;
}

interface CommunityGiftFlowModalProps {
  visible: boolean;
  recipient: CommunityMember | null;
  onClose: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RARITY_GRADIENTS: Record<GiftRarity, [string, string]> = {
  common: ['#F9FAFB', '#F3F4F6'],
  rare: ['#EFF6FF', '#DBEAFE'],
  epic: ['#FAF5FF', '#F3E8FF'],
};

const RARITY_GRADIENT_DARK: Record<GiftRarity, [string, string]> = {
  common: ['#374151', '#1F2937'],
  rare: ['#1E3A5F', '#1E3A5F'],
  epic: ['#3B1D5C', '#2D1248'],
};

// ─── Avatar emoji helper ──────────────────────────────────────────────────────
const AVATAR_EMOJI_MAP: Record<string, string> = {
  avatar_dove: '🕊️', avatar_cross: '✝️', avatar_fish: '🐟',
  avatar_star: '⭐', avatar_flame: '🕯️', avatar_leaf: '🌿',
  avatar_sun: '☀️', avatar_moon: '🌙',
};

function getItemEmoji(item: GiftableItem): string {
  if (item.type === 'avatar') return AVATAR_EMOJI_MAP[item.assetRef] ?? '🕊️';
  if (item.type === 'frame') return '🖼️';
  if (item.type === 'title') return '🏅';
  return '🎁';
}

// ─── Category selection card ──────────────────────────────────────────────────
function CategoryCard({
  emoji,
  label,
  count,
  selected,
  onPress,
  colors,
  primaryColor,
}: {
  emoji: string;
  label: string;
  count: number;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
  primaryColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: selected ? primaryColor + '18' : colors.background,
        borderRadius: 16,
        borderWidth: selected ? 2 : 1.5,
        borderColor: selected ? primaryColor : colors.textMuted + '25',
        padding: 16,
        alignItems: 'center',
        gap: 6,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ fontSize: 28 }}>{emoji}</Text>
      <Text style={{ fontSize: 13, fontWeight: '700', color: selected ? primaryColor : colors.text }}>
        {label}
      </Text>
      <Text style={{ fontSize: 11, color: colors.textMuted }}>
        {count} {count === 1 ? 'artículo' : 'artículos'}
      </Text>
    </Pressable>
  );
}

// ─── Rarity row ───────────────────────────────────────────────────────────────
function RarityRow({
  rarity,
  count,
  ownedCount,
  selected,
  onPress,
  colors,
  isDark,
}: {
  rarity: GiftRarity;
  count: number;
  ownedCount: number;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
  isDark: boolean;
}) {
  const rarityColor = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS];
  const gradients = isDark ? RARITY_GRADIENT_DARK[rarity] : RARITY_GRADIENTS[rarity];
  const rarityLabel: Record<GiftRarity, string> = { common: 'Común', rare: 'Raro', epic: 'Épico' };
  const available = count - ownedCount;

  return (
    <Pressable onPress={onPress} style={{ marginBottom: 8 }}>
      <LinearGradient
        colors={selected ? [rarityColor + '28', rarityColor + '14'] : gradients}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={{
          flexDirection: 'row', alignItems: 'center',
          borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16,
          borderWidth: selected ? 2 : 1,
          borderColor: selected ? rarityColor : rarityColor + '30',
        }}
      >
        <View style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: rarityColor + '20',
          alignItems: 'center', justifyContent: 'center', marginRight: 12,
        }}>
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: rarityColor }} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: rarityColor }}>
            {rarityLabel[rarity]}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
            {available} disponibles · {ownedCount} ya tiene
          </Text>
        </View>
        {selected ? (
          <Check size={20} color={rarityColor} />
        ) : (
          <ChevronRight size={18} color={colors.textMuted} />
        )}
      </LinearGradient>
    </Pressable>
  );
}

// ─── Item card ────────────────────────────────────────────────────────────────
function ItemCard({
  item,
  selected,
  onPress,
  colors,
  language,
  isDark,
}: {
  item: GiftableItem;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  isDark: boolean;
}) {
  const rarityColor = RARITY_COLORS[item.rarity as GiftRarity] ?? '#9CA3AF';
  const itemName = language === 'es' ? item.nameEs : item.nameEn;
  const emoji = getItemEmoji(item);

  return (
    <Pressable
      onPress={item.receiverOwns ? undefined : onPress}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: selected
          ? rarityColor + '18'
          : item.receiverOwns
          ? colors.background + 'AA'
          : colors.background,
        borderRadius: 14,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? rarityColor : colors.textMuted + '20',
        padding: 12,
        marginBottom: 8,
        opacity: item.receiverOwns ? 0.55 : pressed ? 0.85 : 1,
      })}
    >
      {/* Emoji icon */}
      <View style={{
        width: 42, height: 42, borderRadius: 12,
        backgroundColor: rarityColor + '15',
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
      }}>
        <Text style={{ fontSize: 22 }}>{emoji}</Text>
      </View>

      {/* Name + description */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }} numberOfLines={1}>
          {itemName}
        </Text>
        {item.receiverOwns ? (
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
            Ya lo tiene
          </Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
            <Coins size={11} color="#F59E0B" />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#F59E0B' }}>
              {item.pricePoints.toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {/* Already-owned badge or selection check */}
      {item.receiverOwns ? (
        <View style={{
          paddingHorizontal: 7, paddingVertical: 3,
          backgroundColor: colors.textMuted + '20', borderRadius: 8,
        }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted }}>Ya tiene</Text>
        </View>
      ) : selected ? (
        <View style={{
          width: 24, height: 24, borderRadius: 12,
          backgroundColor: rarityColor, alignItems: 'center', justifyContent: 'center',
        }}>
          <Check size={14} color="#FFF" strokeWidth={3} />
        </View>
      ) : (
        <ChevronRight size={16} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function CommunityGiftFlowModal({
  visible,
  recipient,
  onClose,
}: CommunityGiftFlowModalProps) {
  const colors = useThemeColors();
  const language = useLanguage();
  const user = useUser();
  const isDark = useAppStore(s => s.isDarkMode);
  const insets = useSafeAreaInsets();
  const es = language === 'es';

  const [step, setStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState<GiftCategory | null>(null);
  const [selectedRarity, setSelectedRarity] = useState<GiftRarity | null>(null);
  const [selectedItem, setSelectedItem] = useState<GiftableItem | null>(null);

  const [allItems, setAllItems] = useState<GiftableItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success animation
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Load giftable items when modal opens
  useEffect(() => {
    if (visible && recipient && user?.id) {
      loadItems();
    }
  }, [visible, recipient?.id]);

  useEffect(() => {
    if (!visible) {
      setTimeout(() => resetState(), 350);
    }
  }, [visible]);

  useEffect(() => {
    if (step === 'success') {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 12 }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0.4, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ])
        ),
      ]).start();
    } else {
      scaleAnim.setValue(0.7);
    }
  }, [step]);

  const resetState = () => {
    setStep('category');
    setSelectedCategory(null);
    setSelectedRarity(null);
    setSelectedItem(null);
    setError(null);
    setSending(false);
  };

  const loadItems = async () => {
    if (!user?.id || !recipient?.id) return;
    setLoadingItems(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/store/gift/giftable-items?receiverId=${recipient.id}`,
        { headers: { 'X-User-Id': user.id } }
      );
      if (res.ok) {
        const data = await res.json();
        setAllItems(data.items ?? []);
      }
    } catch { /* silent */ }
    finally { setLoadingItems(false); }
  };

  // Derived filtered lists
  const itemsByCategory = useCallback((cat: GiftCategory) =>
    allItems.filter(i => i.type === cat), [allItems]);

  const itemsByCategoryAndRarity = useCallback((cat: GiftCategory, rar: GiftRarity) =>
    allItems.filter(i => i.type === cat && i.rarity === rar), [allItems]);

  const rarityCountForCategory = useCallback((cat: GiftCategory, rar: GiftRarity) => {
    const items = itemsByCategoryAndRarity(cat, rar);
    return { total: items.length, owned: items.filter(i => i.receiverOwns).length };
  }, [itemsByCategoryAndRarity]);

  const handleSend = async () => {
    if (!user?.id || !recipient || !selectedItem) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/store/gift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderUserId: user.id,
          receiverUserId: recipient.id,
          itemId: selectedItem.id,
          message: '',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMap: Record<string, string> = {
          INSUFFICIENT_POINTS: es ? 'No tienes puntos suficientes' : 'Not enough points',
          DAILY_LIMIT_REACHED: es ? 'Límite diario de 3 regalos alcanzado' : 'Daily limit of 3 gifts reached',
          WEEKLY_LIMIT_REACHED: es ? 'Límite semanal de 20 regalos alcanzado' : 'Weekly limit of 20 gifts reached',
          RECEIVER_ALREADY_HAS_ITEM: es ? `@${recipient.nickname} ya tiene este artículo` : `@${recipient.nickname} already owns this item`,
          ITEM_NOT_GIFTABLE: es ? 'Este artículo no se puede regalar' : 'This item cannot be gifted',
        };
        setError(errMap[data.error] ?? (es ? 'Error al enviar. Inténtalo de nuevo.' : 'Failed to send. Try again.'));
        setSending(false);
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('success');
    } catch {
      setError(es ? 'Error de conexión.' : 'Connection error.');
      setSending(false);
    }
  };

  if (!recipient) return null;

  const categoryDefs: Array<{ key: GiftCategory; emoji: string; labelEs: string; labelEn: string }> = [
    { key: 'avatar', emoji: '🕊️', labelEs: 'Avatar', labelEn: 'Avatar' },
    { key: 'frame', emoji: '🖼️', labelEs: 'Marco', labelEn: 'Frame' },
    { key: 'title', emoji: '🏅', labelEs: 'Título', labelEn: 'Title' },
  ];

  const rarities: GiftRarity[] = ['common', 'rare', 'epic'];
  const rarityLabel: Record<GiftRarity, string> = { common: 'Común', rare: 'Raro', epic: 'Épico' };

  const stepTitle: Record<Step, string> = {
    category: es ? 'Elige categoría' : 'Choose category',
    rarity: es ? 'Elige nivel' : 'Choose tier',
    item: es ? 'Elige artículo' : 'Choose item',
    confirm: es ? 'Confirmar regalo' : 'Confirm gift',
    success: es ? '¡Enviado!' : 'Sent!',
  };

  const canGoBack = step === 'rarity' || step === 'item' || step === 'confirm';

  const handleBack = () => {
    if (step === 'rarity') { setSelectedCategory(null); setStep('category'); }
    else if (step === 'item') { setSelectedRarity(null); setStep('rarity'); }
    else if (step === 'confirm') { setSelectedItem(null); setStep('item'); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={step === 'success' ? onClose : undefined}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={step === 'success' ? onClose : undefined}
        >
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>

        <View style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          maxHeight: '90%',
          paddingBottom: insets.bottom + 16,
        }}>
          {/* Handle + Header */}
          <View style={{ alignItems: 'center', paddingTop: 10, marginBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.textMuted + '35' }} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 }}>
            {canGoBack ? (
              <Pressable onPress={handleBack} hitSlop={12} style={{ marginRight: 10 }}>
                <ChevronLeft size={24} color={colors.text} />
              </Pressable>
            ) : (
              <View style={{ width: 34 }} />
            )}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Gift size={16} color="#F59E0B" />
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                  {stepTitle[step]}
                </Text>
              </View>
              {step !== 'success' && (
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>
                  {es ? 'Para' : 'For'}{' '}
                  <Text style={{ fontWeight: '700', color: colors.primary }}>@{recipient.nickname}</Text>
                </Text>
              )}
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Step indicator dots */}
          {step !== 'success' && (
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, marginBottom: 16 }}>
              {(['category', 'rarity', 'item', 'confirm'] as Step[]).map((s) => {
                const steps = ['category', 'rarity', 'item', 'confirm'];
                const current = steps.indexOf(step);
                const idx = steps.indexOf(s);
                const active = idx === current;
                const done = idx < current;
                return (
                  <View key={s} style={{
                    width: active ? 20 : 7, height: 7, borderRadius: 3.5,
                    backgroundColor: done || active ? colors.primary : colors.textMuted + '30',
                    opacity: active ? 1 : done ? 0.5 : 1,
                  }} />
                );
              })}
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── LOADING ── */}
            {loadingItems && step === 'category' && (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 12 }}>
                  {es ? 'Cargando artículos…' : 'Loading items…'}
                </Text>
              </View>
            )}

            {/* ── STEP 1: CATEGORY ── */}
            {step === 'category' && !loadingItems && (
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: 4 }}>
                  {es
                    ? `¿Qué tipo de artículo quieres regalar a @${recipient.nickname}?`
                    : `What type of item do you want to gift @${recipient.nickname}?`}
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {categoryDefs.map((cat) => {
                    const items = itemsByCategory(cat.key);
                    return (
                      <CategoryCard
                        key={cat.key}
                        emoji={cat.emoji}
                        label={es ? cat.labelEs : cat.labelEn}
                        count={items.filter(i => !i.receiverOwns).length}
                        selected={selectedCategory === cat.key}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedCategory(cat.key);
                          setSelectedRarity(null);
                          setSelectedItem(null);
                          setStep('rarity');
                        }}
                        colors={colors}
                        primaryColor={colors.primary}
                      />
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── STEP 2: RARITY/TIER ── */}
            {step === 'rarity' && selectedCategory && (
              <View>
                {rarities.map((rar) => {
                  const { total, owned } = rarityCountForCategory(selectedCategory, rar);
                  if (total === 0) return null;
                  return (
                    <RarityRow
                      key={rar}
                      rarity={rar}
                      count={total}
                      ownedCount={owned}
                      selected={selectedRarity === rar}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedRarity(rar);
                        setSelectedItem(null);
                        setStep('item');
                      }}
                      colors={colors}
                      isDark={isDark}
                    />
                  );
                })}
              </View>
            )}

            {/* ── STEP 3: ITEM ── */}
            {step === 'item' && selectedCategory && selectedRarity && (
              <View>
                {itemsByCategoryAndRarity(selectedCategory, selectedRarity).map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    selected={selectedItem?.id === item.id}
                    onPress={() => {
                      if (item.receiverOwns) return;
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedItem(item);
                      setStep('confirm');
                    }}
                    colors={colors}
                    language={language}
                    isDark={isDark}
                  />
                ))}
              </View>
            )}

            {/* ── STEP 4: CONFIRM ── */}
            {step === 'confirm' && selectedItem && (
              <View style={{ gap: 14 }}>
                {/* Item preview card */}
                <View style={{
                  backgroundColor: colors.background,
                  borderRadius: 18, padding: 20,
                  borderWidth: 1.5,
                  borderColor: (RARITY_COLORS[selectedItem.rarity as GiftRarity] ?? '#9CA3AF') + '40',
                  alignItems: 'center', gap: 8,
                }}>
                  <Text style={{ fontSize: 44 }}>{getItemEmoji(selectedItem)}</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' }}>
                    {language === 'es' ? selectedItem.nameEs : selectedItem.nameEn}
                  </Text>
                  <View style={{
                    paddingHorizontal: 10, paddingVertical: 3,
                    backgroundColor: (RARITY_COLORS[selectedItem.rarity as GiftRarity] ?? '#9CA3AF') + '20',
                    borderRadius: 8,
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: RARITY_COLORS[selectedItem.rarity as GiftRarity] ?? '#9CA3AF' }}>
                      {selectedItem.rarity.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Summary row */}
                <View style={{
                  flexDirection: 'row', gap: 10,
                }}>
                  <View style={{
                    flex: 1, backgroundColor: colors.background,
                    borderRadius: 14, padding: 14, gap: 2,
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.6 }}>
                      {es ? 'PARA' : 'TO'}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }} numberOfLines={1}>
                      @{recipient.nickname}
                    </Text>
                  </View>
                  <View style={{
                    flex: 1, backgroundColor: '#FEF3C7',
                    borderRadius: 14, padding: 14, gap: 2,
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#92400E', letterSpacing: 0.6 }}>
                      {es ? 'COSTO' : 'COST'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Coins size={14} color="#F59E0B" />
                      <Text style={{ fontSize: 15, fontWeight: '800', color: '#92400E' }}>
                        {selectedItem.pricePoints.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Insufficient points hint */}
                {user?.points !== undefined && user.points < selectedItem.pricePoints && (
                  <Pressable
                    onPress={() => onClose()}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 8,
                      backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12,
                      borderWidth: 1, borderColor: '#F59E0B40',
                    }}
                  >
                    <ShoppingCart size={16} color="#F59E0B" />
                    <Text style={{ flex: 1, fontSize: 12, color: '#92400E', lineHeight: 17 }}>
                      {es
                        ? 'No tienes suficientes puntos. Completa devocionales para ganar más.'
                        : 'Not enough points. Complete devotionals to earn more.'}
                    </Text>
                  </Pressable>
                )}

                {error && (
                  <View style={{
                    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12,
                    borderWidth: 1, borderColor: '#FCA5A540',
                  }}>
                    <Text style={{ fontSize: 13, color: '#DC2626', textAlign: 'center', fontWeight: '600' }}>
                      {error}
                    </Text>
                  </View>
                )}

                <ActionButton
                  label={sending
                    ? (es ? 'Enviando regalo…' : 'Sending gift…')
                    : (es ? `Regalar a @${recipient.nickname}` : `Gift to @${recipient.nickname}`)}
                  icon={(color, size) => <Gift size={size} color={color} />}
                  fillColor="#F59E0B"
                  loading={sending}
                  disabled={sending || (user?.points !== undefined && user.points < selectedItem.pricePoints)}
                  onPress={handleSend}
                />
              </View>
            )}

            {/* ── STEP 5: SUCCESS ── */}
            {step === 'success' && (
              <View style={{ alignItems: 'center', paddingVertical: 20, gap: 14 }}>
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                  <Animated.View style={{
                    width: 100, height: 100, borderRadius: 30,
                    backgroundColor: '#FEF3C7',
                    borderWidth: 3, borderColor: '#F59E0B',
                    alignItems: 'center', justifyContent: 'center',
                    opacity: glowAnim,
                  }}>
                    <Text style={{ fontSize: 48 }}>🎁</Text>
                  </Animated.View>
                </Animated.View>

                <Text style={{ fontSize: 22, fontWeight: '900', color: colors.text, textAlign: 'center' }}>
                  {es ? '¡Regalo enviado!' : 'Gift sent!'}
                </Text>
                <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21 }}>
                  {es
                    ? `Enviaste ${selectedItem ? (es ? selectedItem.nameEs : selectedItem.nameEn) : ''} a @${recipient.nickname}.\nSe notificará cuando lo reciba.`
                    : `You sent ${selectedItem ? selectedItem.nameEn : ''} to @${recipient.nickname}.\nThey'll be notified.`}
                </Text>

                <ActionButton
                  label={es ? 'Cerrar' : 'Close'}
                  variant="secondary"
                  onPress={onClose}
                  style={{ marginTop: 8 }}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default CommunityGiftFlowModal;
