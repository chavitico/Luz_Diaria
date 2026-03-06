// CardRevealModal — Premium Reveal Flow
// Fixes:
//   1. Reanimated conflict: layout animation and transform are separated
//      (wrapper gets no animation, inner Animated.View gets transform/opacity only)
//   2. Clean phase sequence: pack glow → pack lift/fade → card reveal
//   3. No entering= prop on any Animated.View that also has useAnimatedStyle with transform
//
// Architecture:
//   <View wrapper>           ← static wrapper, no animation
//     <Animated.View>        ← opacity + translateY only (pack)
//       <PackVisual />
//     </Animated.View>
//     <Animated.View>        ← opacity + scale only (card)
//       <CardVisual />
//     </Animated.View>
//   </View>
//
// entering= (FadeIn/FadeInDown) is only used on plain <Animated.View> elements
// that have NO useAnimatedStyle. This avoids the Reanimated warning.

import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, Pressable, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { X, Sparkles, Star } from 'lucide-react-native';
import { useThemeColors, useLanguage } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import { BIBLICAL_CARDS } from '@/lib/biblical-cards';

const { width: SCREEN_W } = Dimensions.get('window');

interface CardRevealModalProps {
  visible: boolean;
  drawnCard: { cardId: string; wasNew: boolean } | null;
  onClose: () => void;
}

// ─────────────────────────────────────────────
// Premium Pack Visual — metallic foil booster pack
// ─────────────────────────────────────────────
function PremiumPackVisual({ accentColor }: { accentColor: string }) {
  const { sFont } = useScaledFont();
  return (
    <View style={{ width: 160, height: 220, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer foil border */}
      <LinearGradient
        colors={['#C9A84C', '#F0D060', '#B8902A', '#E8C84A', '#A07820']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 158,
          height: 218,
          borderRadius: 20,
          padding: 2.5,
          shadowColor: '#FFD700',
          shadowOpacity: 0.9,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 0 },
          elevation: 20,
        }}
      >
        {/* Inner pack body */}
        <LinearGradient
          colors={['#0A1628', '#0E2060', '#162878', '#0A1628']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Diagonal sheen stripe */}
          <LinearGradient
            colors={['transparent', 'rgba(255,220,80,0.08)', 'rgba(255,220,80,0.15)', 'rgba(255,220,80,0.06)', 'transparent']}
            start={{ x: 0, y: 0.2 }}
            end={{ x: 1, y: 0.8 }}
            style={{
              position: 'absolute',
              width: '200%',
              height: '200%',
              top: -50,
              left: -60,
            }}
          />

          {/* Top accent line */}
          <LinearGradient
            colors={['transparent', '#FFD700', '#FFA500', '#FFD700', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ position: 'absolute', top: 28, left: 12, right: 12, height: 1.5, borderRadius: 99 }}
          />
          {/* Bottom accent line */}
          <LinearGradient
            colors={['transparent', '#FFD700', '#FFA500', '#FFD700', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ position: 'absolute', bottom: 40, left: 12, right: 12, height: 1.5, borderRadius: 99 }}
          />

          {/* Cross emblem */}
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            {/* Vertical bar */}
            <View style={{ width: 6, height: 36, backgroundColor: '#FFD700', borderRadius: 3, opacity: 0.9 }} />
            {/* Horizontal bar */}
            <View style={{ width: 22, height: 6, backgroundColor: '#FFD700', borderRadius: 3, position: 'absolute', top: 10, opacity: 0.9 }} />
          </View>

          {/* Star row */}
          <View style={{ flexDirection: 'row', gap: 5, marginBottom: 10, marginTop: 8 }}>
            {[0, 1, 2].map(i => (
              <Star key={i} size={9} color="#FFD700" fill="#FFD700" opacity={0.85} />
            ))}
          </View>

          {/* Title */}
          <Text style={{
            fontSize: 11,
            fontWeight: '900',
            color: '#FFD700',
            letterSpacing: 2.5,
            textTransform: 'uppercase',
            textAlign: 'center',
            marginBottom: 3,
          }}>
            SOBRE
          </Text>
          <Text style={{
            fontSize: 11,
            fontWeight: '900',
            color: '#FFD700',
            letterSpacing: 2.5,
            textTransform: 'uppercase',
            textAlign: 'center',
            marginBottom: 10,
          }}>
            BÍBLICO
          </Text>

          {/* Subtitle */}
          <Text style={{
            fontSize: 8.5,
            fontWeight: '600',
            color: 'rgba(255,220,100,0.65)',
            letterSpacing: 1,
            textAlign: 'center',
            marginBottom: 2,
          }}>
            1 carta aleatoria
          </Text>
          <Text style={{
            fontSize: 7.5,
            fontWeight: '500',
            color: 'rgba(255,220,100,0.4)',
            letterSpacing: 0.5,
            textAlign: 'center',
            paddingHorizontal: 10,
          }}>
            Personajes y objetos bíblicos
          </Text>
        </LinearGradient>
      </LinearGradient>
    </View>
  );
}

// ─────────────────────────────────────────────
// Premium Card Visual — full collectible card
// ─────────────────────────────────────────────
import type { BiblicalCard } from '@/lib/biblical-cards';

function CollectibleCardVisual({
  card,
  wasNew,
  language,
  sFont,
}: {
  card: BiblicalCard;
  wasNew: boolean;
  language: 'es' | 'en';
  sFont: (size: number) => number;
}) {
  if (!card) return null;

  const cardName = language === 'es' ? card.nameEs : card.nameEn;

  // Per-card unique visual motifs
  const motif = (() => {
    if (card.id === 'david') {
      return {
        topIcon: '♜',
        midSymbols: ['𝄞', '✦', '⊕'],
        bottomDeco: '— Rey de Israel —',
        sheen: ['rgba(255,215,0,0.12)', 'rgba(255,215,0,0.05)'] as [string, string],
      };
    }
    if (card.id === 'moses') {
      return {
        topIcon: '☩',
        midSymbols: ['⚡', '✦', '📜'],
        bottomDeco: '— Profeta de Dios —',
        sheen: ['rgba(224,64,251,0.12)', 'rgba(180,40,220,0.05)'] as [string, string],
      };
    }
    // ark
    return {
      topIcon: '🌈',
      midSymbols: ['〜', '✦', '〜'],
      bottomDeco: '— Pacto Eterno —',
      sheen: ['rgba(105,240,174,0.12)', 'rgba(56,142,60,0.05)'] as [string, string],
    };
  })();

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Card */}
      <LinearGradient
        colors={[card.gradientColors[0], card.gradientColors[1], card.gradientColors[2], card.accentColor + '22'] as [string, string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 195,
          height: 270,
          borderRadius: 20,
          borderWidth: 2.5,
          borderColor: card.accentColor + 'CC',
          shadowColor: card.accentColor,
          shadowOpacity: 0.8,
          shadowRadius: 28,
          shadowOffset: { width: 0, height: 6 },
          elevation: 24,
          overflow: 'hidden',
        }}
      >
        {/* Inner sheen */}
        <LinearGradient
          colors={[motif.sheen[0], 'transparent', motif.sheen[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />

        {/* Top bar with category + id */}
        <LinearGradient
          colors={[card.accentColor + '60', card.accentColor + '20']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 7,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{
            backgroundColor: card.accentColor + '30',
            borderWidth: 1,
            borderColor: card.accentColor + '70',
            borderRadius: 99,
            paddingHorizontal: 8,
            paddingVertical: 2,
          }}>
            <Text style={{ fontSize: 8, fontWeight: '900', color: card.accentColor, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              {card.category}
            </Text>
          </View>
          <Text style={{ fontSize: 13, opacity: 0.85 }}>{motif.topIcon}</Text>
        </LinearGradient>

        {/* Divider line */}
        <View style={{ height: 1, backgroundColor: card.accentColor + '40', marginHorizontal: 10 }} />

        {/* Artwork area */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}>
          {/* Background pattern dots */}
          <View style={{ position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', opacity: 0.05 }}>
            {[0, 1, 2, 3, 4].map(row => (
              <View key={row} style={{ flexDirection: 'row', gap: 18, marginBottom: 14 }}>
                {[0, 1, 2, 3, 4].map(col => (
                  <View key={col} style={{ width: 3, height: 3, borderRadius: 99, backgroundColor: card.accentColor }} />
                ))}
              </View>
            ))}
          </View>

          {/* Symbol row above art */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8, opacity: 0.6 }}>
            {motif.midSymbols.map((s, i) => (
              <Text key={i} style={{ fontSize: 11, color: card.accentColor }}>{s}</Text>
            ))}
          </View>

          {/* Main art emoji */}
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: card.accentColor + '18',
            borderWidth: 2,
            borderColor: card.accentColor + '50',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 6,
          }}>
            <Text style={{ fontSize: 42 }}>
              {card.id === 'david' ? '🎵' : card.id === 'moses' ? '📜' : '🚢'}
            </Text>
          </View>

          {/* Bottom deco */}
          <Text style={{ fontSize: 8, color: card.accentColor, opacity: 0.55, letterSpacing: 0.8, marginTop: 4 }}>
            {motif.bottomDeco}
          </Text>
        </View>

        {/* Bottom divider */}
        <View style={{ height: 1, backgroundColor: card.accentColor + '40', marginHorizontal: 10 }} />

        {/* Name + verse footer */}
        <LinearGradient
          colors={[card.accentColor + '20', card.accentColor + '60']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 12, paddingVertical: 9, alignItems: 'center' }}
        >
          <Text style={{
            fontSize: 15,
            fontWeight: '900',
            color: '#FFFFFF',
            letterSpacing: -0.3,
            textAlign: 'center',
            marginBottom: 2,
          }}>
            {cardName}
          </Text>
          <Text style={{
            fontSize: 9,
            fontWeight: '700',
            color: card.accentColor,
            letterSpacing: 0.6,
          }}>
            {card.verseRef}
          </Text>
        </LinearGradient>
      </LinearGradient>

      {/* New / Duplicate chip — below card, not inside it */}
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
    </View>
  );
}

// ─────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────
export function CardRevealModal({ visible, drawnCard, onClose }: CardRevealModalProps) {
  const language = useLanguage();
  const { sFont } = useScaledFont();

  const card = drawnCard ? BIBLICAL_CARDS[drawnCard.cardId] : null;

  // ── animation shared values ──
  // Pack: opacity + translateY only
  const packOpacity = useSharedValue(0);
  const packY = useSharedValue(0);

  // Glow: opacity only
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.5);

  // Card: opacity + scale only
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.5);

  // Info text: opacity only
  const infoOpacity = useSharedValue(0);

  // CTA: opacity only
  const ctaOpacity = useSharedValue(0);

  // Title: opacity only
  const titleOpacity = useSharedValue(0);

  const hapticsScheduled = useRef(false);

  useEffect(() => {
    if (visible && card) {
      hapticsScheduled.current = false;

      // Reset all
      packOpacity.value = 0;
      packY.value = 0;
      glowOpacity.value = 0;
      glowScale.value = 0.5;
      cardOpacity.value = 0;
      cardScale.value = 0.5;
      infoOpacity.value = 0;
      ctaOpacity.value = 0;
      titleOpacity.value = 0;

      // Phase 1 (0ms): title fades in
      titleOpacity.value = withTiming(1, { duration: 350 });

      // Phase 1 (100ms): pack appears
      packOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));

      // Phase 2 (500ms): glow pulses
      glowOpacity.value = withDelay(500, withSequence(
        withTiming(0.7, { duration: 300 }),
        withTiming(0.3, { duration: 200 }),
        withTiming(0.85, { duration: 250 }),
        withTiming(0.4, { duration: 200 }),
        withTiming(0.0, { duration: 300 }),
      ));
      glowScale.value = withDelay(500, withSequence(
        withTiming(1.1, { duration: 300 }),
        withTiming(0.95, { duration: 200 }),
        withTiming(1.15, { duration: 250 }),
        withTiming(1.0, { duration: 500 }),
      ));

      // Phase 3 (1100ms): pack lifts and fades
      packY.value = withDelay(1100, withTiming(-90, { duration: 550, easing: Easing.out(Easing.cubic) }));
      packOpacity.value = withDelay(1100, withTiming(0, { duration: 500 }));

      // Phase 4 (1400ms): card reveals
      cardOpacity.value = withDelay(1400, withTiming(1, { duration: 400 }));
      cardScale.value = withDelay(1400, withSpring(1, { damping: 14, stiffness: 120 }));

      // Phase 5 (1800ms): info + cta
      infoOpacity.value = withDelay(1800, withTiming(1, { duration: 400 }));
      ctaOpacity.value = withDelay(2000, withTiming(1, { duration: 400 }));

      // Haptics
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => {
        if (!hapticsScheduled.current) {
          hapticsScheduled.current = true;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }, 1400);
    }
  }, [visible, card?.id]);

  // ── animated styles ──
  // IMPORTANT: each Animated.View uses EITHER entering= OR useAnimatedStyle, never both.

  const packAnimStyle = useAnimatedStyle(() => ({
    opacity: packOpacity.value,
    transform: [{ translateY: packY.value }],
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const infoAnimStyle = useAnimatedStyle(() => ({
    opacity: infoOpacity.value,
  }));

  const ctaAnimStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
  }));

  const titleAnimStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  if (!card) return null;

  const cardName = language === 'es' ? card.nameEs : card.nameEn;
  const isNew = drawnCard?.wasNew ?? true;

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

        {/* Close button — always accessible */}
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

        {/* Title — uses titleAnimStyle, no entering= */}
        <Animated.View style={[titleAnimStyle, { marginBottom: 28, alignItems: 'center' }]}>
          <Text style={{ fontSize: sFont(12), color: 'rgba(255,255,255,0.5)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 5 }}>
            {language === 'es' ? 'Sobre Bíblico' : 'Biblical Pack'}
          </Text>
          <Text style={{ fontSize: sFont(24), fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 }}>
            {language === 'es' ? '¡Carta obtenida!' : 'Card Revealed!'}
          </Text>
        </Animated.View>

        {/* Reveal stage — fixed container, no animation on wrapper */}
        <View style={{ width: 220, height: 290, alignItems: 'center', justifyContent: 'center' }}>

          {/* Glow ring — opacity + scale only, no entering= */}
          <Animated.View style={[glowAnimStyle, {
            position: 'absolute',
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: card.accentColor,
            shadowColor: card.accentColor,
            shadowOpacity: 1,
            shadowRadius: 70,
            shadowOffset: { width: 0, height: 0 },
          }]} />

          {/* Pack — opacity + translateY only, no entering= */}
          <Animated.View style={[packAnimStyle, { position: 'absolute' }]}>
            <PremiumPackVisual accentColor={card.accentColor} />
          </Animated.View>

          {/* Card — opacity + scale only, no entering= */}
          <Animated.View style={[cardAnimStyle, { position: 'absolute' }]}>
            <CollectibleCardVisual
              card={card}
              wasNew={isNew}
              language={language}
              sFont={sFont}
            />
          </Animated.View>
        </View>

        {/* Description — opacity only, no entering= */}
        <Animated.View style={[infoAnimStyle, { marginTop: 36, alignItems: 'center', paddingHorizontal: 32, maxWidth: 340 }]}>
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
        </Animated.View>

        {/* CTA — opacity only, no entering= */}
        <Animated.View style={[ctaAnimStyle, { marginTop: 28 }]}>
          <Pressable
            onPress={onClose}
            style={{
              backgroundColor: card.accentColor,
              paddingHorizontal: 44,
              paddingVertical: 14,
              borderRadius: 99,
            }}
          >
            <Text style={{ fontSize: sFont(15), fontWeight: '800', color: '#000000' }}>
              {language === 'es' ? 'Ver mi álbum' : 'View album'}
            </Text>
          </Pressable>
        </Animated.View>

      </View>
    </Modal>
  );
}
