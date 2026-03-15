import React from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Check,
  Lock,
  X,
  Gift,
  ChevronRight,
} from 'lucide-react-native';
import { useThemeColors } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import { DEFAULT_AVATARS, ITEM_COLLECTIONS } from '@/lib/constants';
import { resolveCollectionItem } from '@/lib/store-utils';

export function CollectionDetailModal({
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

export default CollectionDetailModal;
