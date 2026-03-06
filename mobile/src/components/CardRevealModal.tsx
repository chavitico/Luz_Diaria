// CardRevealModal — STATIC version (Phase A stability fix)
// All Reanimated animations removed to eliminate freeze after purchase.
// Phase C visual upgrade: premium collectible card aesthetic, richer lore sections,
// category color identity, deeper layering, luminous backgrounds.

import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Sparkles, Star, BookOpen } from 'lucide-react-native';
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
// Category identity system
// ─────────────────────────────────────────────
const CATEGORY_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  Personajes: { bg: 'rgba(212,175,55,0.22)', border: 'rgba(212,175,55,0.60)', text: '#D4AF37', label: 'PERSONAJES' },
  Objetos:    { bg: 'rgba(168,200,240,0.18)', border: 'rgba(168,200,240,0.55)', text: '#A8C8F0', label: 'OBJETOS' },
  Eventos:    { bg: 'rgba(255,122,42,0.18)', border: 'rgba(255,122,42,0.55)', text: '#FF7A2A', label: 'EVENTOS' },
};

function getCatStyle(category: BiblicalCard['category']) {
  return CATEGORY_STYLES[category] ?? CATEGORY_STYLES['Objetos'];
}

// ─────────────────────────────────────────────
// Shared reusable card visual — used here AND in album
// Premium: deeper gradients, layered foil, decorative frame lines, radiant center
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
  const W = size === 'detail' ? 218 : 200;
  const H = size === 'detail' ? 305 : 280;
  const catStyle = getCatStyle(card.category);

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Outer glow halo */}
      <View style={{
        position: 'absolute',
        width: W + 32,
        height: H + 32,
        borderRadius: 28,
        backgroundColor: card.accentColor + '12',
        top: -16,
        left: -16,
      }} />

      {/* Card shell */}
      <LinearGradient
        colors={[card.gradientColors[0], card.gradientColors[1], card.gradientColors[2], card.accentColor + '22'] as [string, string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: W,
          height: H,
          borderRadius: 22,
          borderWidth: 2,
          borderColor: card.accentColor + 'CC',
          shadowColor: card.accentColor,
          shadowOpacity: 0.85,
          shadowRadius: 36,
          shadowOffset: { width: 0, height: 8 },
          elevation: 28,
          overflow: 'hidden',
        }}
      >
        {/* Deep radiance background */}
        <LinearGradient
          colors={[card.motif.sheenColors[0], 'transparent', card.motif.sheenColors[1]]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />

        {/* Diagonal luminous sweep */}
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.09)', 'transparent']}
          start={{ x: 0, y: 0.15 }}
          end={{ x: 1, y: 0.85 }}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />

        {/* Secondary diagonal counter-sweep */}
        <LinearGradient
          colors={['transparent', card.accentColor + '08', 'transparent']}
          start={{ x: 1, y: 0.1 }}
          end={{ x: 0, y: 0.9 }}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />

        {/* Vertical center radiance */}
        <LinearGradient
          colors={['transparent', card.accentColor + '10', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />

        {/* ── ORNAMENTAL FRAME LINES ── */}
        {/* Top gold line */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, backgroundColor: card.accentColor }} />
        {/* Bottom gold line */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2.5, backgroundColor: card.accentColor }} />
        {/* Left side accent */}
        <View style={{ position: 'absolute', top: 20, left: 0, width: 1.5, bottom: 20, backgroundColor: card.accentColor + '44' }} />
        {/* Right side accent */}
        <View style={{ position: 'absolute', top: 20, right: 0, width: 1.5, bottom: 20, backgroundColor: card.accentColor + '44' }} />

        {/* Inner frame inset */}
        <View style={{
          position: 'absolute',
          top: 6,
          left: 6,
          right: 6,
          bottom: 6,
          borderRadius: 16,
          borderWidth: 0.75,
          borderColor: card.accentColor + '30',
        }} />

        {/* ── TOP HEADER BAR ── */}
        <LinearGradient
          colors={[card.accentColor + '60', card.accentColor + '20']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Category chip with identity color */}
          <View style={{
            backgroundColor: catStyle.bg,
            borderWidth: 1,
            borderColor: catStyle.border,
            borderRadius: 99,
            paddingHorizontal: 9,
            paddingVertical: 2.5,
          }}>
            <Text style={{ fontSize: 7, fontWeight: '900', color: catStyle.text, letterSpacing: 1.4, textTransform: 'uppercase' }}>
              {catStyle.label}
            </Text>
          </View>
          {/* Corner ornament */}
          <Text style={{ fontSize: 14, color: card.accentColor, opacity: 0.9 }}>{card.motif.cornerGlyph}</Text>
        </LinearGradient>

        {/* Separator */}
        <View style={{ height: 1, backgroundColor: card.accentColor + '60', marginHorizontal: 10 }} />

        {/* ── ILLUSTRATION AREA ── */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}>
          {/* Radial glow behind art */}
          <View style={{
            position: 'absolute',
            width: W * 0.72,
            height: W * 0.72,
            borderRadius: W * 0.36,
            backgroundColor: card.accentColor + '10',
            alignSelf: 'center',
          }} />

          {/* Dot grid pattern */}
          <View style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.04 }}>
            {[0, 1, 2, 3, 4, 5, 6].map(row => (
              <View key={row} style={{ flexDirection: 'row', gap: 14, marginBottom: 10, paddingLeft: row % 2 === 0 ? 0 : 7 }}>
                {[0, 1, 2, 3, 4, 5, 6].map(col => (
                  <View key={col} style={{ width: 2.5, height: 2.5, borderRadius: 99, backgroundColor: card.accentColor }} />
                ))}
              </View>
            ))}
          </View>

          {/* Decor symbols row */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12, opacity: 0.6 }}>
            {card.motif.decorSymbols.map((s, i) => (
              <Text key={i} style={{ fontSize: 13, color: card.accentColor }}>{s}</Text>
            ))}
          </View>

          {/* Main artwork — imageUrl OR local fallback */}
          {card.imageUrl ? (
            <Image
              source={{ uri: card.imageUrl }}
              style={{
                width: W * 0.52,
                height: W * 0.52,
                borderRadius: 14,
                borderWidth: 2,
                borderColor: card.accentColor + '70',
                marginBottom: 10,
              }}
              resizeMode="cover"
            />
          ) : (
            <View style={{
              width: W * 0.46,
              height: W * 0.46,
              borderRadius: (W * 0.46) / 2,
              backgroundColor: card.accentColor + '18',
              borderWidth: 3,
              borderColor: card.accentColor + '60',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
              shadowColor: card.accentColor,
              shadowOpacity: 0.55,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 0 },
            }}>
              {/* Inner ring */}
              <View style={{
                position: 'absolute',
                width: W * 0.46 - 12,
                height: W * 0.46 - 12,
                borderRadius: (W * 0.46 - 12) / 2,
                borderWidth: 1,
                borderColor: card.accentColor + '40',
              }} />
              {/* Outer aura ring */}
              <View style={{
                position: 'absolute',
                width: W * 0.46 + 10,
                height: W * 0.46 + 10,
                borderRadius: (W * 0.46 + 10) / 2,
                borderWidth: 1,
                borderColor: card.accentColor + '20',
              }} />
              <Text style={{ fontSize: W * 0.22 }}>{card.motif.artEmoji}</Text>
            </View>
          )}

          {/* Subtitle deco */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 22, height: 0.75, backgroundColor: card.accentColor + '60' }} />
            <Text style={{ fontSize: 7.5, color: card.accentColor, opacity: 0.75, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              {subtitle}
            </Text>
            <View style={{ width: 22, height: 0.75, backgroundColor: card.accentColor + '60' }} />
          </View>
        </View>

        {/* Separator */}
        <View style={{ height: 1, backgroundColor: card.accentColor + '60', marginHorizontal: 10 }} />

        {/* ── FOOTER ── */}
        <LinearGradient
          colors={[card.accentColor + '22', card.accentColor + '66']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center' }}
        >
          <Text style={{
            fontSize: 16.5,
            fontWeight: '900',
            color: '#FFFFFF',
            letterSpacing: -0.2,
            textAlign: 'center',
            marginBottom: 2.5,
            textShadowColor: card.accentColor + '80',
            textShadowRadius: 8,
            textShadowOffset: { width: 0, height: 1 },
          }}>
            {cardName}
          </Text>
          <Text style={{
            fontSize: 8.5,
            fontWeight: '700',
            color: card.accentColor,
            letterSpacing: 0.9,
            opacity: 0.95,
          }}>
            {card.verseRef}
          </Text>
        </LinearGradient>

        {/* Top symbol watermark */}
        <Text style={{
          position: 'absolute',
          top: 9,
          alignSelf: 'center',
          fontSize: 9,
          color: card.accentColor,
          opacity: 0.22,
          letterSpacing: 3.5,
        }}>
          {card.motif.topSymbol}
        </Text>
      </LinearGradient>

      {/* New / Duplicate chip */}
      {wasNew !== undefined && (
        <View style={{
          marginTop: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: wasNew ? card.accentColor + '28' : 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          borderColor: wasNew ? card.accentColor + '66' : 'rgba(255,255,255,0.18)',
          borderRadius: 99,
          paddingHorizontal: 16,
          paddingVertical: 6,
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
        backgroundColor: 'rgba(0,0,0,0.94)',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Ambient bg glow */}
        <View style={{
          position: 'absolute',
          top: '20%',
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: card.accentColor + '08',
          alignSelf: 'center',
        }} />

        {/* Close button */}
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
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Text style={{ fontSize: sFont(10), color: 'rgba(255,255,255,0.40)', letterSpacing: 3.0, textTransform: 'uppercase', marginBottom: 6 }}>
              {language === 'es' ? 'Sobre Bíblico' : 'Biblical Pack'}
            </Text>
            <Text style={{ fontSize: sFont(26), fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.6 }}>
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

          {/* Lore block */}
          <View style={{ marginTop: 32, width: '100%', maxWidth: 340 }}>
            {/* Description */}
            <Text style={{
              fontSize: sFont(14),
              color: 'rgba(255,255,255,0.80)',
              textAlign: 'center',
              lineHeight: 22,
              fontWeight: '500',
              marginBottom: 20,
            }}>
              {language === 'es' ? card.descriptionEs : card.descriptionEn}
            </Text>

            {/* Verse box */}
            <View style={{
              backgroundColor: card.accentColor + '12',
              borderRadius: 14,
              padding: 16,
              borderLeftWidth: 3,
              borderLeftColor: card.accentColor,
              marginBottom: 16,
            }}>
              <Text style={{ fontSize: sFont(10), fontWeight: '800', color: card.accentColor, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 7 }}>
                {card.verseRef}
              </Text>
              <Text style={{ fontSize: sFont(13), color: 'rgba(255,255,255,0.75)', lineHeight: 20, fontStyle: 'italic' }}>
                "{card.verseTextEs}"
              </Text>
            </View>

            {/* Dato destacado */}
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: 14,
              padding: 14,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.10)',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                <Star size={12} color={card.accentColor} />
                <Text style={{ fontSize: sFont(10), fontWeight: '800', color: card.accentColor, letterSpacing: 1.0, textTransform: 'uppercase' }}>
                  {language === 'es' ? 'Dato destacado' : 'Key Fact'}
                </Text>
              </View>
              <Text style={{ fontSize: sFont(13), color: 'rgba(255,255,255,0.70)', lineHeight: 20 }}>
                {card.datoDestacadoEs}
              </Text>
            </View>

            {/* Significado bíblico */}
            <View style={{
              backgroundColor: card.accentColor + '10',
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: card.accentColor + '25',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                <BookOpen size={12} color={card.accentColor} />
                <Text style={{ fontSize: sFont(10), fontWeight: '800', color: card.accentColor, letterSpacing: 1.0, textTransform: 'uppercase' }}>
                  {language === 'es' ? 'Significado bíblico' : 'Biblical Meaning'}
                </Text>
              </View>
              <Text style={{ fontSize: sFont(13), color: 'rgba(255,255,255,0.70)', lineHeight: 20 }}>
                {card.significadoBiblicoEs}
              </Text>
            </View>
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
                paddingVertical: 15,
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
