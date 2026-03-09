// CollectionCompleteModal
// Shown once when a user finishes a card collection.
// Grants: secret legendary card + 1000 bonus points.
// One-time per user per collection — idempotent on backend.

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Star, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import { BIBLICAL_CARDS, RARITY_CONFIG } from '@/lib/biblical-cards';
import { CollectibleCardVisual } from '@/components/CardRevealModal';

interface CollectionCompleteModalProps {
  visible: boolean;
  collectionName: string;       // e.g. "Historia de Pascua"
  secretCardId: string;         // e.g. "jesus_resucitado"
  bonusPoints: number;          // e.g. 1000
  onClose: () => void;
  onViewAlbum?: () => void;
}

export function CollectionCompleteModal({
  visible,
  collectionName,
  secretCardId,
  bonusPoints,
  onClose,
  onViewAlbum,
}: CollectionCompleteModalProps) {
  const language = useLanguage();
  const { sFont } = useScaledFont();

  const secretCard = BIBLICAL_CARDS[secretCardId];
  const rarityConfig = secretCard ? RARITY_CONFIG[secretCard.rarity] : null;

  // Entrance animation — glow pulse on the card
  const glowAnim = useRef(new Animated.Value(0.6)).current;
  const scaleAnim = useRef(new Animated.Value(0.82)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    // Haptic burst on open
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 180);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 400);

    // Animate in
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();

    // Continuous glow pulse
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.55, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => {
      pulse.stop();
      scaleAnim.setValue(0.82);
      fadeAnim.setValue(0);
      glowAnim.setValue(0.6);
    };
  }, [visible]);

  if (!secretCard || !rarityConfig) return null;

  const GOLD = '#D4AF37';
  const GOLD_DIM = 'rgba(212,175,55,0.20)';
  const GOLD_MID = 'rgba(212,175,55,0.45)';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.88)',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: fadeAnim,
        }}
      >
        {/* Outer radial glow behind card */}
        <Animated.View
          style={{
            position: 'absolute',
            width: 320,
            height: 320,
            borderRadius: 160,
            backgroundColor: 'rgba(212,175,55,0.08)',
            opacity: glowAnim,
            shadowColor: GOLD,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 80,
          }}
        />

        <Animated.View
          style={{
            width: '92%',
            maxWidth: 400,
            transform: [{ scale: scaleAnim }],
          }}
        >
          {/* Gradient border wrapper */}
          <LinearGradient
            colors={[GOLD, '#FFE066', GOLD, '#B8860B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 28, padding: 2 }}
          >
            <LinearGradient
              colors={['#1A1200', '#0E0C00', '#0A0800']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 27, overflow: 'hidden' }}
            >
              {/* Shimmer line at top */}
              <View style={{
                position: 'absolute', top: 0, left: 32, right: 32, height: 1.5,
                backgroundColor: 'rgba(255,230,100,0.35)', borderRadius: 99,
              }} />

              <ScrollView
                contentContainerStyle={{ padding: 24, alignItems: 'center' }}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {/* Header badge */}
                <LinearGradient
                  colors={[GOLD_DIM, 'rgba(212,175,55,0.08)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderRadius: 99,
                    borderWidth: 1,
                    borderColor: GOLD_MID,
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    marginBottom: 20,
                    gap: 6,
                  }}
                >
                  <Sparkles size={14} color={GOLD} />
                  <Text style={{ fontSize: sFont(11), fontWeight: '800', color: GOLD, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                    {language === 'es' ? 'Colección Completada' : 'Collection Complete'}
                  </Text>
                  <Sparkles size={14} color={GOLD} />
                </LinearGradient>

                {/* Collection name */}
                <Text style={{
                  fontSize: sFont(22),
                  fontWeight: '800',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  letterSpacing: -0.3,
                  marginBottom: 4,
                  textShadowColor: 'rgba(212,175,55,0.4)',
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 8,
                }}>
                  {collectionName}
                </Text>
                <Text style={{
                  fontSize: sFont(13),
                  color: 'rgba(255,255,255,0.55)',
                  textAlign: 'center',
                  marginBottom: 28,
                }}>
                  {language === 'es'
                    ? 'Has obtenido una carta secreta legendaria'
                    : 'You have unlocked a secret legendary card'}
                </Text>

                {/* Secret card visual */}
                <Animated.View style={{
                  opacity: glowAnim,
                  shadowColor: rarityConfig.glow,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                  shadowRadius: 24,
                  marginBottom: 24,
                }}>
                  <CollectibleCardVisual
                    card={secretCard}
                    wasNew={true}
                    language={language}
                    sFont={sFont}
                    size="reveal"
                  />
                </Animated.View>

                {/* Card name + rarity */}
                <Text style={{
                  fontSize: sFont(20),
                  fontWeight: '800',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  letterSpacing: -0.2,
                  marginBottom: 4,
                }}>
                  {language === 'es' ? secretCard.nameEs : secretCard.nameEn}
                </Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 24,
                }}>
                  <View style={{
                    backgroundColor: rarityConfig.bg,
                    borderWidth: 1,
                    borderColor: rarityConfig.color + '80',
                    borderRadius: 99,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                  }}>
                    <Text style={{ fontSize: sFont(11), fontWeight: '800', color: rarityConfig.color, letterSpacing: 0.6 }}>
                      ✦ {language === 'es' ? rarityConfig.labelEs : rarityConfig.labelEn}
                    </Text>
                  </View>
                  <View style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    borderRadius: 99,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}>
                    <Text style={{ fontSize: sFont(11), fontWeight: '600', color: 'rgba(255,255,255,0.5)' }}>
                      {language === 'es' ? 'Colección Especial' : 'Special Collection'}
                    </Text>
                  </View>
                </View>

                {/* Bonus points chip */}
                <LinearGradient
                  colors={[GOLD_DIM, 'rgba(212,175,55,0.06)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: GOLD_MID,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    marginBottom: 28,
                    gap: 10,
                  }}
                >
                  <Star size={18} color={GOLD} fill={GOLD} />
                  <Text style={{ fontSize: sFont(20), fontWeight: '800', color: GOLD }}>
                    +{bonusPoints}
                  </Text>
                  <Text style={{ fontSize: sFont(13), fontWeight: '600', color: 'rgba(212,175,55,0.75)' }}>
                    {language === 'es' ? 'puntos bonus' : 'bonus points'}
                  </Text>
                </LinearGradient>

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', width: '100%', marginBottom: 20 }} />

                {/* CTA buttons */}
                {onViewAlbum && (
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onViewAlbum(); }}
                    style={{ width: '100%', marginBottom: 10 }}
                  >
                    <LinearGradient
                      colors={[GOLD, '#B8860B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 16,
                        paddingVertical: 14,
                        gap: 6,
                      }}
                    >
                      <Text style={{ fontSize: sFont(15), fontWeight: '800', color: '#1A1200' }}>
                        {language === 'es' ? 'Ver mi álbum' : 'View my album'}
                      </Text>
                      <ChevronRight size={16} color="#1A1200" strokeWidth={3} />
                    </LinearGradient>
                  </Pressable>
                )}

                <Pressable
                  onPress={() => { Haptics.selectionAsync(); onClose(); }}
                  style={{
                    width: '100%',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                  }}
                >
                  <Text style={{ fontSize: sFont(14), fontWeight: '600', color: 'rgba(255,255,255,0.55)' }}>
                    {language === 'es' ? 'Cerrar' : 'Close'}
                  </Text>
                </Pressable>
              </ScrollView>
            </LinearGradient>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
