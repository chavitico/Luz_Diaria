// CardRevealModal — STATIC version (Phase A stability fix)
// All Reanimated animations removed to eliminate freeze after purchase.
// This is a clean, readable static modal that shows card + info immediately.
// Phase B visual upgrade: richer card composition, imageUrl support for future remote artwork.

import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Sparkles } from 'lucide-react-native';
import { useLanguage } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import { BIBLICAL_CARDS } from '@/lib/biblical-cards';
import type { BiblicalCard } from '@/lib/biblical-cards';

interface CardRevealModalProps {
  visible: boolean;
  drawnCard: { cardId: string; wasNew: boolean } | null;
  onClose: () => void;
}

// ─────────────────────────────────────────────
// Shared reusable card visual — used here AND in album
// Supports imageUrl (remote art) with local fallback.
// ─────────────────────────────────────────────
export function CollectibleCardVisual({
  card,
  wasNew,
  language,
  sFont,
  size = 'reveal',
}: {
  card: BiblicalCard;
  wasNew?: boolean;
  language: 'es' | 'en';
  sFont: (size: number) => number;
  size?: 'reveal' | 'detail';
}) {
  const cardName = language === 'es' ? card.nameEs : card.nameEn;
  const subtitle = language === 'es' ? card.motif.subtitleEs : card.motif.subtitleEn;
  const W = size === 'detail' ? 210 : 195;
  const H = size === 'detail' ? 292 : 270;

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Card */}
      <LinearGradient
        colors={[card.gradientColors[0], card.gradientColors[1], card.gradientColors[2], card.accentColor + '1A'] as [string, string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: W,
          height: H,
          borderRadius: 20,
          borderWidth: 2.5,
          borderColor: card.accentColor + 'CC',
          shadowColor: card.accentColor,
          shadowOpacity: 0.75,
          shadowRadius: 30,
          shadowOffset: { width: 0, height: 8 },
          elevation: 26,
          overflow: 'hidden',
        }}
      >
        {/* Foil shimmer */}
        <LinearGradient
          colors={[card.motif.sheenColors[0], 'transparent', card.motif.sheenColors[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />
        {/* Diagonal gloss stripe */}
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.06)', 'transparent']}
          start={{ x: 0, y: 0.25 }}
          end={{ x: 1, y: 0.75 }}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />

        {/* ── TOP HEADER BAR ── */}
        <LinearGradient
          colors={[card.accentColor + '55', card.accentColor + '18']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 7,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Category chip */}
          <View style={{
            backgroundColor: card.accentColor + '28',
            borderWidth: 1,
            borderColor: card.accentColor + '70',
            borderRadius: 99,
            paddingHorizontal: 8,
            paddingVertical: 2,
          }}>
            <Text style={{ fontSize: 7.5, fontWeight: '900', color: card.accentColor, letterSpacing: 1.3, textTransform: 'uppercase' }}>
              {card.category}
            </Text>
          </View>
          {/* Corner glyph */}
          <Text style={{ fontSize: 13, color: card.accentColor, opacity: 0.8 }}>{card.motif.cornerGlyph}</Text>
        </LinearGradient>

        {/* Gold rule */}
        <View style={{ height: 1, backgroundColor: card.accentColor + '50', marginHorizontal: 8 }} />

        {/* ── ILLUSTRATION AREA ── */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 }}>
          {/* Background pattern: subtle diagonal lines */}
          <View style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.035 }}>
            {[0, 1, 2, 3, 4, 5].map(row => (
              <View key={row} style={{ flexDirection: 'row', gap: 16, marginBottom: 12, paddingLeft: row % 2 === 0 ? 0 : 8 }}>
                {[0, 1, 2, 3, 4, 5].map(col => (
                  <View key={col} style={{ width: 2, height: 2, borderRadius: 99, backgroundColor: card.accentColor }} />
                ))}
              </View>
            ))}
          </View>

          {/* Decor symbols row */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10, opacity: 0.55 }}>
            {card.motif.decorSymbols.map((s, i) => (
              <Text key={i} style={{ fontSize: 12, color: card.accentColor }}>{s}</Text>
            ))}
          </View>

          {/* Main artwork — imageUrl OR local emoji fallback */}
          {card.imageUrl ? (
            <Image
              source={{ uri: card.imageUrl }}
              style={{
                width: W * 0.52,
                height: W * 0.52,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: card.accentColor + '60',
                marginBottom: 8,
              }}
              resizeMode="cover"
            />
          ) : (
            <View style={{
              width: W * 0.44,
              height: W * 0.44,
              borderRadius: (W * 0.44) / 2,
              backgroundColor: card.accentColor + '15',
              borderWidth: 2.5,
              borderColor: card.accentColor + '55',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
              // Inner ring
              shadowColor: card.accentColor,
              shadowOpacity: 0.35,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 0 },
            }}>
              {/* Inner thin ring */}
              <View style={{
                position: 'absolute',
                width: W * 0.44 - 10,
                height: W * 0.44 - 10,
                borderRadius: (W * 0.44 - 10) / 2,
                borderWidth: 0.5,
                borderColor: card.accentColor + '35',
              }} />
              <Text style={{ fontSize: W * 0.21 }}>{card.motif.artEmoji}</Text>
            </View>
          )}

          {/* Subtitle deco */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 18, height: 0.5, backgroundColor: card.accentColor + '55' }} />
            <Text style={{ fontSize: 7.5, color: card.accentColor, opacity: 0.65, letterSpacing: 1.0, textTransform: 'uppercase' }}>
              {subtitle}
            </Text>
            <View style={{ width: 18, height: 0.5, backgroundColor: card.accentColor + '55' }} />
          </View>
        </View>

        {/* Gold rule */}
        <View style={{ height: 1, backgroundColor: card.accentColor + '50', marginHorizontal: 8 }} />

        {/* ── FOOTER ── */}
        <LinearGradient
          colors={[card.accentColor + '18', card.accentColor + '55']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 12, paddingVertical: 9, alignItems: 'center' }}
        >
          <Text style={{
            fontSize: 15.5,
            fontWeight: '900',
            color: '#FFFFFF',
            letterSpacing: -0.2,
            textAlign: 'center',
            marginBottom: 2,
          }}>
            {cardName}
          </Text>
          <Text style={{
            fontSize: 8.5,
            fontWeight: '700',
            color: card.accentColor,
            letterSpacing: 0.8,
            opacity: 0.9,
          }}>
            {card.verseRef}
          </Text>
        </LinearGradient>

        {/* Top symbol watermark */}
        <Text style={{
          position: 'absolute',
          top: 8,
          alignSelf: 'center',
          fontSize: 9,
          color: card.accentColor,
          opacity: 0.25,
          letterSpacing: 3,
        }}>
          {card.motif.topSymbol}
        </Text>
      </LinearGradient>

      {/* New / Duplicate chip — only shown when wasNew is defined (reveal context) */}
      {wasNew !== undefined && (
        <View style={{
          marginTop: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          backgroundColor: wasNew ? card.accentColor + '22' : 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          borderColor: wasNew ? card.accentColor + '55' : 'rgba(255,255,255,0.15)',
          borderRadius: 99,
          paddingHorizontal: 14,
          paddingVertical: 5,
        }}>
          {wasNew && <Sparkles size={12} color={card.accentColor} />}
          <Text style={{
            fontSize: sFont(12),
            fontWeight: '700',
            color: wasNew ? card.accentColor : 'rgba(255,255,255,0.5)',
          }}>
            {wasNew
              ? (language === 'es' ? '¡Carta nueva!' : 'New card!')
              : (language === 'es' ? 'Duplicado guardado' : 'Duplicate saved')}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// Main Modal — fully static, zero Reanimated
// ─────────────────────────────────────────────
export function CardRevealModal({ visible, drawnCard, onClose }: CardRevealModalProps) {
  const language = useLanguage();
  const { sFont } = useScaledFont();
  const router = useRouter();

  const card = drawnCard ? BIBLICAL_CARDS[drawnCard.cardId] : null;
  const isNew = drawnCard?.wasNew ?? true;

  // Guard: don't render if no card data
  if (!card) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.92)',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Close button — always accessible, always on top */}
        <Pressable
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{
            position: 'absolute',
            top: 56,
            right: 24,
            zIndex: 20,
            padding: 9,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.12)',
          }}
        >
          <X size={22} color="#FFFFFF" />
        </Pressable>

        <ScrollView
          contentContainerStyle={{ alignItems: 'center', paddingVertical: 80, paddingHorizontal: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <Text style={{ fontSize: sFont(11), color: 'rgba(255,255,255,0.45)', letterSpacing: 2.8, textTransform: 'uppercase', marginBottom: 5 }}>
              {language === 'es' ? 'Sobre Bíblico' : 'Biblical Pack'}
            </Text>
            <Text style={{ fontSize: sFont(24), fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 }}>
              {language === 'es' ? '¡Carta obtenida!' : 'Card Revealed!'}
            </Text>
          </View>

          {/* Card */}
          <CollectibleCardVisual
            card={card}
            wasNew={isNew}
            language={language}
            sFont={sFont}
            size="reveal"
          />

          {/* Description */}
          <View style={{ marginTop: 28, alignItems: 'center', paddingHorizontal: 16, maxWidth: 340 }}>
            <Text style={{
              fontSize: sFont(13),
              color: 'rgba(255,255,255,0.65)',
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: 4,
            }}>
              {language === 'es' ? card.descriptionEs : card.descriptionEn}
            </Text>
            <Text style={{
              fontSize: sFont(11),
              color: 'rgba(255,255,255,0.35)',
              fontStyle: 'italic',
              textAlign: 'center',
            }}>
              {card.verseRef}
            </Text>
          </View>

          {/* CTA buttons */}
          <View style={{ marginTop: 28, gap: 10, alignItems: 'center', width: '100%' }}>
            <Pressable
              onPress={() => {
                onClose();
                setTimeout(() => router.push('/biblical-cards-album'), 300);
              }}
              style={{
                backgroundColor: card.accentColor,
                paddingHorizontal: 44,
                paddingVertical: 14,
                borderRadius: 99,
                width: '100%',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: sFont(15), fontWeight: '800', color: '#000000' }}>
                {language === 'es' ? 'Ver mi álbum' : 'View album'}
              </Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              style={{ paddingHorizontal: 28, paddingVertical: 10 }}
            >
              <Text style={{ fontSize: sFont(13), fontWeight: '600', color: 'rgba(255,255,255,0.45)' }}>
                {language === 'es' ? 'Cerrar' : 'Close'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
