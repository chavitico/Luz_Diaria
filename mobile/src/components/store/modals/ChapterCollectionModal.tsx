import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
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
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import { useThemeColors } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import { DEFAULT_AVATARS, type ChapterCollection, type CollectionChapter } from '@/lib/constants';
import { resolveCollectionItem } from '@/lib/store-utils';

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

export function ChapterCollectionModal({
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

export default ChapterCollectionModal;
