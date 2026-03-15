import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import { ConfettiParticle } from '@/components/store/ConfettiParticle';

export function ChestRewardModal({
  visible,
  reward,
  language,
  colors,
  onClose,
}: {
  visible: boolean;
  reward: {
    type: 'points' | 'item';
    value?: number;
    itemId?: string;
    itemType?: 'avatar' | 'frame' | 'title' | 'theme';
    itemName?: string;
    itemNameEs?: string;
    itemEmoji?: string;
    itemColor?: string;
    rarity: string;
  } | null;
  language: 'en' | 'es';
  colors: ReturnType<typeof useThemeColors>;
  onClose: () => void;
}) {
  const { sFont } = useScaledFont();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const chestScale = useSharedValue(1);

  // Fixed 20 shared values — always created, never in a loop
  const p0 = useSharedValue(0); const p1 = useSharedValue(0); const p2 = useSharedValue(0);
  const p3 = useSharedValue(0); const p4 = useSharedValue(0); const p5 = useSharedValue(0);
  const p6 = useSharedValue(0); const p7 = useSharedValue(0); const p8 = useSharedValue(0);
  const p9 = useSharedValue(0); const p10 = useSharedValue(0); const p11 = useSharedValue(0);
  const p12 = useSharedValue(0); const p13 = useSharedValue(0); const p14 = useSharedValue(0);
  const p15 = useSharedValue(0); const p16 = useSharedValue(0); const p17 = useSharedValue(0);
  const p18 = useSharedValue(0); const p19 = useSharedValue(0);
  const pValues = [p0,p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13,p14,p15,p16,p17,p18,p19];

  const confettiColors = ['#F59E0B', '#EF4444', '#8B5CF6', '#10B981', '#3B82F6', '#F97316', '#EC4899', '#FCD34D'];
  // Fixed particle positions (stable — no random on render)
  const particleData = React.useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    x: Math.cos((i / 20) * Math.PI * 2) * (80 + (i % 4) * 30),
    y: Math.sin((i / 20) * Math.PI * 2) * (80 + (i % 4) * 30),
    color: confettiColors[i % confettiColors.length],
    angle: (i / 20) * Math.PI * 2,
    size: 10 + (i % 4) * 4,
    borderRadius: i % 3 === 0 ? 99 : 2,
  })), []);

  const rarityGrad: [string, string] = reward?.rarity === 'epic'
    ? ['#4C1D95', '#7C3AED']
    : reward?.rarity === 'rare'
    ? ['#1E3A5F', '#2563EB']
    : ['#1A3A1A', '#15803D'];
  const rarityColor = reward?.rarity === 'epic' ? '#A855F7' : reward?.rarity === 'rare' ? '#3B82F6' : '#22C55E';

  // Count-up animation for points
  const countUpValue = useSharedValue(0);
  const [displayedPoints, setDisplayedPoints] = useState(0);
  const targetPoints = reward?.type === 'points' ? (reward.value ?? 0) : 0;

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSequence(
        withSpring(1.1, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 180 })
      );
      chestScale.value = withSequence(
        withTiming(1, { duration: 100 }),
        withSpring(1.3, { damping: 6, stiffness: 300 }),
        withSpring(1, { damping: 8, stiffness: 200 })
      );
      pValues.forEach((p, i) => {
        p.value = 0;
        p.value = withSequence(
          withTiming(0, { duration: i * 30 }),
          withSpring(1, { damping: 8, stiffness: 120 })
        );
      });
      // Start count-up for points
      if (reward?.type === 'points' && targetPoints > 0) {
        countUpValue.value = 0;
        setDisplayedPoints(0);
        countUpValue.value = withTiming(targetPoints, { duration: 1200 });
        // Drive JS state from animation (poll every frame approximation)
        let start = Date.now();
        const duration = 1200;
        const tick = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplayedPoints(Math.round(eased * targetPoints));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.8, { duration: 200 });
      pValues.forEach(p => { p.value = 0; });
      countUpValue.value = 0;
      setDisplayedPoints(0);
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const chestStyle = useAnimatedStyle(() => ({
    transform: [{ scale: chestScale.value }],
  }));

  const isExclusive = reward?.itemId?.includes('_chest_');
  const displayName = language === 'es' ? (reward?.itemNameEs ?? reward?.itemName ?? '') : (reward?.itemName ?? '');

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center' }}>
        {/* Confetti particles — each is its own component with its own hooks */}
        {particleData.map((pt, i) => (
          <ConfettiParticle
            key={i}
            pv={pValues[i] as SharedValue<number>}
            x={pt.x}
            y={pt.y}
            angle={pt.angle}
            size={pt.size}
            borderRadius={pt.borderRadius}
            color={pt.color}
          />
        ))}

        <Animated.View style={[{ width: 320, borderRadius: 28, overflow: 'hidden' }, containerStyle]}>
          <LinearGradient colors={rarityGrad} style={{ padding: 32, alignItems: 'center' }}>
            {/* Rarity badge */}
            {isExclusive && (
              <View style={{ backgroundColor: rarityColor + '30', borderWidth: 1, borderColor: rarityColor, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 16 }}>
                <Text style={{ color: rarityColor, fontSize: sFont(11), fontWeight: '700', letterSpacing: 1.5 }}>
                  {language === 'es' ? '✦ EXCLUSIVO DEL COFRE ✦' : '✦ CHEST EXCLUSIVE ✦'}
                </Text>
              </View>
            )}

            {/* Chest icon */}
            <Animated.View style={[{ marginBottom: 20 }, chestStyle]}>
              <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: rarityColor + '25', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: rarityColor + '60' }}>
                <Text style={{ fontSize: sFont(52) }}>🎁</Text>
              </View>
            </Animated.View>

            {/* Prize */}
            {reward?.type === 'item' ? (
              <>
                {/* Item type label */}
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: sFont(11), fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>
                  {language === 'es'
                    ? reward.itemType === 'avatar' ? 'Nuevo avatar desbloqueado'
                      : reward.itemType === 'frame' ? 'Nuevo marco desbloqueado'
                      : reward.itemType === 'title' ? 'Nuevo título desbloqueado'
                      : reward.itemType === 'theme' ? 'Nuevo tema desbloqueado'
                      : 'Has obtenido'
                    : reward.itemType === 'avatar' ? 'New avatar unlocked'
                      : reward.itemType === 'frame' ? 'New frame unlocked'
                      : reward.itemType === 'title' ? 'New title unlocked'
                      : reward.itemType === 'theme' ? 'New theme unlocked'
                      : 'You received'
                  }
                </Text>
                {reward.itemEmoji ? (
                  <Text style={{ fontSize: sFont(56), marginBottom: 12 }}>{reward.itemEmoji}</Text>
                ) : reward.itemColor ? (
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: reward.itemColor, marginBottom: 12, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' }} />
                ) : null}
                <Text style={{ color: '#FFFFFF', fontSize: sFont(22), fontWeight: '800', textAlign: 'center', marginBottom: 6 }}>
                  {displayName}
                </Text>
                <View style={{ backgroundColor: rarityColor + '30', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 4 }}>
                  <Text style={{ color: rarityColor, fontSize: sFont(12), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {reward.rarity}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: sFont(13), marginBottom: 8 }}>
                  {language === 'es' ? 'Has ganado' : 'You earned'}
                </Text>
                <Text style={{ color: '#FCD34D', fontSize: sFont(52), fontWeight: '900', marginBottom: 8 }}>
                  +{displayedPoints}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: sFont(18), fontWeight: '600' }}>
                  {language === 'es' ? 'puntos obtenidos' : 'points earned'}
                </Text>
              </>
            )}

            {/* Close button */}
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onClose(); }}
              style={{ marginTop: 28, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, paddingHorizontal: 40, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: sFont(16), fontWeight: '700' }}>
                {language === 'es' ? 'Continuar' : 'Continue'}
              </Text>
            </Pressable>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default ChestRewardModal;
