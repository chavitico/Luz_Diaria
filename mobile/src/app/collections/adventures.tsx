import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Animated as RNAnimated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, Lock, Check, BookOpen, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useThemeColors, useLanguage, useUser } from '@/lib/store';
import { STORE_BUNDLES, RARITY_GRADIENTS } from '@/lib/constants';

// ─── Adventure bundle IDs in display order ───────────────────────────────────
const ADVENTURE_BUNDLE_IDS = [
  'bundle_adv_jonas',
  'bundle_adv_david',
  'bundle_adv_esther',
  'bundle_adv_daniel',
  'bundle_adv_moses',
  'bundle_adv_noah',
];

// ─── Story emojis for visual identity ────────────────────────────────────────
const BUNDLE_EMOJIS: Record<string, string> = {
  bundle_adv_jonas:  '🐋',
  bundle_adv_david:  '⚔️',
  bundle_adv_esther: '👑',
  bundle_adv_daniel: '🦁',
  bundle_adv_moses:  '🌊',
  bundle_adv_noah:   '🕊️',
};

// ─── Accent colors per adventure ─────────────────────────────────────────────
const BUNDLE_ACCENTS: Record<string, [string, string]> = {
  bundle_adv_jonas:  ['#0B3A5C', '#1A6B8A'],
  bundle_adv_david:  ['#5C1B0B', '#8A3A1A'],
  bundle_adv_esther: ['#3B1B5C', '#7A3A8A'],
  bundle_adv_daniel: ['#1B3A1A', '#3A6B38'],
  bundle_adv_moses:  ['#0B2E5C', '#1A5A8A'],
  bundle_adv_noah:   ['#1B3A38', '#2A6B68'],
};

type BundleStatus = 'completed' | 'available' | 'comingSoon';

function getStatus(
  bundleId: string,
  purchasedItems: string[],
  comingSoon?: boolean
): BundleStatus {
  if (comingSoon) return 'comingSoon';
  const bundle = STORE_BUNDLES[bundleId];
  if (!bundle) return 'comingSoon';
  const items = bundle.items ?? [];
  const allOwned = items.length > 0 && items.every(id => purchasedItems.includes(id));
  return allOwned ? 'completed' : 'available';
}

function sortBundles(
  ids: string[],
  purchasedItems: string[]
): string[] {
  return [...ids].sort((a, b) => {
    const bA = STORE_BUNDLES[a];
    const bB = STORE_BUNDLES[b];
    const sA = getStatus(a, purchasedItems, bA?.comingSoon);
    const sB = getStatus(b, purchasedItems, bB?.comingSoon);
    // Completed always last
    if (sA === 'completed' && sB !== 'completed') return 1;
    if (sB === 'completed' && sA !== 'completed') return -1;
    // Among non-completed: available before comingSoon
    if (sA !== sB) {
      if (sA === 'available') return -1;
      if (sB === 'available') return 1;
    }
    // Within same group: newest releasedAt first, then by adventureNumber
    const relA = (bA as any)?.releasedAt ? new Date((bA as any).releasedAt).getTime() : 0;
    const relB = (bB as any)?.releasedAt ? new Date((bB as any).releasedAt).getTime() : 0;
    if (relA !== relB) return relB - relA;
    return (bA?.adventureNumber ?? 99) - (bB?.adventureNumber ?? 99);
  });
}

// ─── Single adventure card ────────────────────────────────────────────────────
function AdventureCard({
  bundleId,
  purchasedItems,
  language,
  isHighlighted,
  index,
}: {
  bundleId: string;
  purchasedItems: string[];
  language: 'en' | 'es';
  isHighlighted: boolean;
  index: number;
}) {
  const colors = useThemeColors();
  const bundle = STORE_BUNDLES[bundleId];
  if (!bundle) return null;

  const status = getStatus(bundleId, purchasedItems, bundle.comingSoon);
  const emoji = BUNDLE_EMOJIS[bundleId] ?? '📖';
  const [c1, c2] = BUNDLE_ACCENTS[bundleId] ?? ['#1A1A1A', '#2A2A2A'];
  const title = language === 'es' ? bundle.nameEs : bundle.name;
  const itemCount = bundle.items?.length ?? 0;

  const highlightStyle = isHighlighted
    ? { borderWidth: 2, borderColor: '#F5C842' }
    : { borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' };

  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(380)}>
      <LinearGradient
        colors={[c1, c2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          {
            borderRadius: 20,
            padding: 18,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          },
          highlightStyle,
        ]}
      >
        {/* Emoji badge */}
        <View style={{
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: 'rgba(255,255,255,0.12)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 26 }}>{emoji}</Text>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {/* Number + status row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Text style={{
              fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.45)',
              letterSpacing: 1, textTransform: 'uppercase',
            }}>
              {language === 'es' ? `Aventura ${bundle.adventureNumber ?? ''}` : `Adventure ${bundle.adventureNumber ?? ''}`}
            </Text>
            {isHighlighted && (
              <View style={{
                backgroundColor: '#F5C84233', borderRadius: 99,
                paddingHorizontal: 6, paddingVertical: 1,
                borderWidth: 1, borderColor: '#F5C84266',
              }}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#F5C842' }}>
                  {language === 'es' ? 'SELECCIONADO' : 'SELECTED'}
                </Text>
              </View>
            )}
          </View>

          <Text style={{
            fontSize: 16, fontWeight: '800', color: '#FFFFFF',
            letterSpacing: -0.2, marginBottom: 4,
          }}>
            {title}
          </Text>

          {/* Items count */}
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
            {itemCount} {language === 'es' ? 'recompensas' : 'rewards'}
          </Text>
        </View>

        {/* Status icon */}
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          {status === 'completed' ? (
            <View style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: '#22C55E33',
              borderWidth: 1.5, borderColor: '#22C55E88',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Check size={18} color="#22C55E" />
            </View>
          ) : status === 'comingSoon' ? (
            <View style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Clock size={16} color="rgba(255,255,255,0.4)" />
            </View>
          ) : (
            <View style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: '#F5C84222',
              borderWidth: 1.5, borderColor: '#F5C84266',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <BookOpen size={16} color="#F5C842" />
            </View>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AdventuresCollectionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const language = useLanguage();
  const user = useUser();
  const purchasedItems = user?.purchasedItems ?? [];

  // bundleId passed from "Ver aventura" button (optional)
  const { bundleId: highlightId } = useLocalSearchParams<{ bundleId?: string }>();

  const scrollRef = useRef<ScrollView>(null);
  const cardOffsetsRef = useRef<Record<string, number>>({});

  const sortedIds = sortBundles(ADVENTURE_BUNDLE_IDS, purchasedItems);

  // Auto-scroll to highlighted card after layout
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

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      {/* Header */}
      <LinearGradient
        colors={['#0A0E1A', '#0F1525']}
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 16,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={{
            width: 38, height: 38, borderRadius: 19,
            backgroundColor: 'rgba(255,255,255,0.08)',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronLeft size={20} color="#FFFFFF" />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 18, fontWeight: '800', color: '#FFFFFF',
            letterSpacing: -0.3,
          }}>
            {language === 'es' ? 'Aventuras Bíblicas' : 'Biblical Adventures'}
          </Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
            {language === 'es'
              ? `${ADVENTURE_BUNDLE_IDS.length} aventuras · colecciona recompensas`
              : `${ADVENTURE_BUNDLE_IDS.length} adventures · collect rewards`}
          </Text>
        </View>
      </LinearGradient>

      {/* Legend */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 16,
        paddingHorizontal: 20, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
      }}>
        {[
          { icon: <Check size={12} color="#22C55E" />, label: language === 'es' ? 'Completada' : 'Completed', bg: '#22C55E22' },
          { icon: <BookOpen size={12} color="#F5C842" />, label: language === 'es' ? 'Disponible' : 'Available', bg: '#F5C84222' },
          { icon: <Clock size={12} color="rgba(255,255,255,0.4)" />, label: language === 'es' ? 'Próximamente' : 'Coming Soon', bg: 'rgba(255,255,255,0.08)' },
        ].map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{
              width: 22, height: 22, borderRadius: 11,
              backgroundColor: item.bg,
              alignItems: 'center', justifyContent: 'center',
            }}>
              {item.icon}
            </View>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Card list */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {sortedIds.map((id, index) => (
          <View
            key={id}
            onLayout={(e) => {
              cardOffsetsRef.current[id] = e.nativeEvent.layout.y;
            }}
          >
            <AdventureCard
              bundleId={id}
              purchasedItems={purchasedItems}
              language={language}
              isHighlighted={id === highlightId}
              index={index}
            />
          </View>
        ))}

        {/* Footer note */}
        <Text style={{
          textAlign: 'center',
          fontSize: 12,
          color: 'rgba(255,255,255,0.3)',
          marginTop: 8,
          lineHeight: 18,
        }}>
          {language === 'es'
            ? 'Más aventuras bíblicas próximamente'
            : 'More biblical adventures coming soon'}
        </Text>
      </ScrollView>
    </View>
  );
}
