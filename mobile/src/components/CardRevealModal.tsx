// CardRevealModal - Phase 1 envelope opening animation
// Phase 2: complex animations (TBD)

import React, { useEffect } from 'react';
import { View, Text, Modal, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { X, Sparkles } from 'lucide-react-native';
import { useThemeColors, useLanguage } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import { BIBLICAL_CARDS } from '@/lib/biblical-cards';

const { width: SCREEN_W } = Dimensions.get('window');

interface CardRevealModalProps {
  visible: boolean;
  drawnCard: { cardId: string; wasNew: boolean } | null;
  onClose: () => void;
}

export function CardRevealModal({ visible, drawnCard, onClose }: CardRevealModalProps) {
  const colors = useThemeColors();
  const language = useLanguage();
  const { sFont } = useScaledFont();

  // Animation values
  const envelopeScale = useSharedValue(0.6);
  const envelopeOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const envelopeY = useSharedValue(0);

  const card = drawnCard ? BIBLICAL_CARDS[drawnCard.cardId] : null;

  useEffect(() => {
    if (visible && card) {
      // Reset
      envelopeScale.value = 0.6;
      envelopeOpacity.value = 0;
      glowOpacity.value = 0;
      cardScale.value = 0;
      cardOpacity.value = 0;
      envelopeY.value = 0;

      // Step 1: Envelope appears
      envelopeOpacity.value = withTiming(1, { duration: 400 });
      envelopeScale.value = withSpring(1, { damping: 12, stiffness: 100 });

      // Step 2: Glow pulses
      glowOpacity.value = withDelay(500, withSequence(
        withTiming(0.8, { duration: 400 }),
        withTiming(0.3, { duration: 300 }),
        withTiming(0.9, { duration: 300 }),
        withTiming(0.4, { duration: 200 }),
      ));

      // Step 3: Envelope floats up and fades
      envelopeY.value = withDelay(900, withTiming(-80, { duration: 600, easing: Easing.out(Easing.cubic) }));
      envelopeOpacity.value = withDelay(900, withTiming(0, { duration: 600 }));

      // Step 4: Card reveals
      cardOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));
      cardScale.value = withDelay(1200, withSpring(1, { damping: 14, stiffness: 120 }));

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 1200);
    }
  }, [visible, card]);

  const envelopeStyle = useAnimatedStyle(() => ({
    opacity: envelopeOpacity.value,
    transform: [{ scale: envelopeScale.value }, { translateY: envelopeY.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const cardRevealStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  if (!card) return null;

  const cardName = language === 'es' ? card.nameEs : card.nameEn;
  const cardDesc = language === 'es' ? card.descriptionEs : card.descriptionEn;
  const isNew = drawnCard?.wasNew ?? true;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', alignItems: 'center', justifyContent: 'center' }}>

        {/* Close button */}
        <Pressable
          onPress={onClose}
          style={{ position: 'absolute', top: 56, right: 24, zIndex: 10, padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' }}
        >
          <X size={22} color="#FFFFFF" />
        </Pressable>

        {/* Title */}
        <Animated.View entering={FadeIn.duration(400)} style={{ marginBottom: 32, alignItems: 'center' }}>
          <Text style={{ fontSize: sFont(13), color: 'rgba(255,255,255,0.6)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
            {language === 'es' ? 'Sobre Bíblico' : 'Biblical Envelope'}
          </Text>
          <Text style={{ fontSize: sFont(22), fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 }}>
            {language === 'es' ? '¡Carta obtenida!' : 'Card Revealed!'}
          </Text>
        </Animated.View>

        {/* Envelope + Glow layer */}
        <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
          {/* Glow */}
          <Animated.View style={[glowStyle, {
            position: 'absolute',
            width: 200, height: 200, borderRadius: 100,
            backgroundColor: card.accentColor,
            shadowColor: card.accentColor,
            shadowOpacity: 1,
            shadowRadius: 60,
            shadowOffset: { width: 0, height: 0 },
          }]} />

          {/* Envelope emoji */}
          <Animated.View style={[envelopeStyle, { position: 'absolute' }]}>
            <Text style={{ fontSize: 96 }}>✉️</Text>
          </Animated.View>

          {/* Card reveal */}
          <Animated.View style={[cardRevealStyle, { position: 'absolute' }]}>
            <LinearGradient
              colors={card.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 160, height: 220, borderRadius: 18,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: card.accentColor + '80',
                shadowColor: card.accentColor,
                shadowOpacity: 0.6,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 4 },
                padding: 16,
              }}
            >
              {/* Category badge */}
              <View style={{ backgroundColor: card.accentColor + '25', borderWidth: 1, borderColor: card.accentColor + '50', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 10 }}>
                <Text style={{ fontSize: sFont(9), fontWeight: '800', color: card.accentColor, letterSpacing: 1, textTransform: 'uppercase' }}>
                  {card.category}
                </Text>
              </View>

              {/* Card emoji/visual */}
              <Text style={{ fontSize: 52, marginBottom: 8 }}>
                {card.id === 'david' ? '🎵' : card.id === 'moses' ? '📜' : '🚢'}
              </Text>

              {/* Name */}
              <Text style={{ fontSize: sFont(18), fontWeight: '900', color: '#FFFFFF', textAlign: 'center', letterSpacing: -0.3, marginBottom: 6 }}>
                {cardName}
              </Text>

              {/* Verse ref */}
              <Text style={{ fontSize: sFont(10), color: card.accentColor, fontWeight: '700', textAlign: 'center' }}>
                {card.verseRef}
              </Text>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Card info below */}
        <Animated.View entering={FadeInDown.delay(1400).duration(500)} style={{ marginTop: 40, alignItems: 'center', paddingHorizontal: 32, maxWidth: 340 }}>
          {/* Duplicate / new badge */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: isNew ? card.accentColor + '20' : 'rgba(255,255,255,0.1)',
            borderWidth: 1, borderColor: isNew ? card.accentColor + '50' : 'rgba(255,255,255,0.2)',
            borderRadius: 99, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 14,
          }}>
            {isNew && <Sparkles size={13} color={card.accentColor} />}
            <Text style={{ fontSize: sFont(12), fontWeight: '700', color: isNew ? card.accentColor : 'rgba(255,255,255,0.6)' }}>
              {isNew
                ? (language === 'es' ? '¡Carta nueva!' : 'New card!')
                : (language === 'es' ? 'Duplicado guardado' : 'Duplicate saved')}
            </Text>
          </View>

          <Text style={{ fontSize: sFont(14), color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 21, marginBottom: 6 }}>
            {cardDesc}
          </Text>
          <Text style={{ fontSize: sFont(12), color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', textAlign: 'center' }}>
            {card.verseRef}
          </Text>
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(1600).duration(400)} style={{ marginTop: 32 }}>
          <Pressable
            onPress={onClose}
            style={{
              backgroundColor: card.accentColor,
              paddingHorizontal: 40, paddingVertical: 14, borderRadius: 99,
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
