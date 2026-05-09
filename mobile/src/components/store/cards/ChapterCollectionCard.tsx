import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ChevronRight, Gift } from 'lucide-react-native';
import { useScaledFont } from '@/lib/textScale';
import { DEFAULT_AVATARS } from '@/lib/constants';
import type { useThemeColors } from '@/lib/store';
import type { ChapterCollection } from '@/lib/constants';

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

export default ChapterCollectionCard;
