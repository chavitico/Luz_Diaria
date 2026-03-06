// CardRevealModal — STATIC version (Phase A stability fix)
// All Reanimated animations removed to eliminate freeze after purchase.
// This is a clean, readable static modal that shows card + info immediately.

import React from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
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
// Static Card Visual
// ─────────────────────────────────────────────
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
  const cardName = language === 'es' ? card.nameEs : card.nameEn;

  const motif = (() => {
    if (card.id === 'david') {
      return {
        topIcon: '♜',
        midSymbols: ['𝄞', '✦', '⊕'],
        bottomDeco: '— Rey de Israel —',
        sheen: ['rgba(255,215,0,0.12)', 'rgba(255,215,0,0.05)'] as [string, string],
        emoji: '🎵',
      };
    }
    if (card.id === 'moses') {
      return {
        topIcon: '☩',
        midSymbols: ['⚡', '✦', '📜'],
        bottomDeco: '— Profeta de Dios —',
        sheen: ['rgba(224,64,251,0.12)', 'rgba(180,40,220,0.05)'] as [string, string],
        emoji: '📜',
      };
    }
    return {
      topIcon: '🌈',
      midSymbols: ['〜', '✦', '〜'],
      bottomDeco: '— Pacto Eterno —',
      sheen: ['rgba(105,240,174,0.12)', 'rgba(56,142,60,0.05)'] as [string, string],
      emoji: '🚢',
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

        {/* Top bar */}
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

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: card.accentColor + '40', marginHorizontal: 10 }} />

        {/* Artwork area */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}>
          {/* Dot pattern */}
          <View style={{ position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', opacity: 0.05 }}>
            {[0, 1, 2, 3, 4].map(row => (
              <View key={row} style={{ flexDirection: 'row', gap: 18, marginBottom: 14 }}>
                {[0, 1, 2, 3, 4].map(col => (
                  <View key={col} style={{ width: 3, height: 3, borderRadius: 99, backgroundColor: card.accentColor }} />
                ))}
              </View>
            ))}
          </View>

          {/* Symbol row */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8, opacity: 0.6 }}>
            {motif.midSymbols.map((s, i) => (
              <Text key={i} style={{ fontSize: 11, color: card.accentColor }}>{s}</Text>
            ))}
          </View>

          {/* Art emoji */}
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
            <Text style={{ fontSize: 42 }}>{motif.emoji}</Text>
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

      {/* New / Duplicate chip */}
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
            <Text style={{ fontSize: sFont(12), color: 'rgba(255,255,255,0.5)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 5 }}>
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
