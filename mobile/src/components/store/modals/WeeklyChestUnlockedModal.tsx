import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useScaledFont } from '@/lib/textScale';

export function WeeklyChestUnlockedModal({
  visible,
  language,
  onOpen,
  onClose,
}: {
  visible: boolean;
  language: 'en' | 'es';
  onOpen: () => void;
  onClose: () => void;
}) {
  const { sFont } = useScaledFont();
  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.85);
  const cardOpacity = useSharedValue(0);
  const chestScale = useSharedValue(0);
  const chestRotate = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const isOpeningRef = useRef(false);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 300 });
      cardOpacity.value = withTiming(1, { duration: 350 });
      cardScale.value = withSpring(1, { damping: 14, stiffness: 180 });
      chestScale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withDelay(150, withSpring(1.15, { damping: 8, stiffness: 200 })),
        withSpring(1, { damping: 10, stiffness: 160 })
      );
      chestRotate.value = withSequence(
        withTiming(0, { duration: 0 }),
        withDelay(150, withSequence(
          withTiming(-8, { duration: 100 }),
          withTiming(8, { duration: 100 }),
          withTiming(-5, { duration: 80 }),
          withTiming(5, { duration: 80 }),
          withTiming(0, { duration: 60 })
        ))
      );
      glowOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    } else {
      backdropOpacity.value = withTiming(0, { duration: 250 });
      cardOpacity.value = withTiming(0, { duration: 200 });
      cardScale.value = withTiming(0.9, { duration: 200 });
      chestScale.value = withTiming(0, { duration: 150 });
      glowOpacity.value = withTiming(0, { duration: 150 });
      isOpeningRef.current = false;
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));
  const chestStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: chestScale.value },
      { rotate: `${chestRotate.value}deg` },
    ],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  const handleOpenPress = () => {
    if (isOpeningRef.current) return;
    isOpeningRef.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Bounce the chest
    chestScale.value = withSequence(
      withSpring(1.35, { damping: 5, stiffness: 300 }),
      withSpring(0.9, { damping: 8, stiffness: 250 }),
      withSpring(1.2, { damping: 8, stiffness: 200 }),
      withTiming(0, { duration: 250 })
    );
    chestRotate.value = withSequence(
      withTiming(-12, { duration: 80 }),
      withTiming(12, { duration: 80 }),
      withTiming(-8, { duration: 70 }),
      withTiming(8, { duration: 70 }),
      withTiming(0, { duration: 60 })
    );
    backdropOpacity.value = withDelay(400, withTiming(0, { duration: 200 }));
    cardOpacity.value = withDelay(400, withTiming(0, { duration: 200 }));
    cardScale.value = withDelay(400, withTiming(0.85, { duration: 200 }));
    // Trigger claim after animation
    setTimeout(() => {
      onOpen();
    }, 550);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={[
          { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
          backdropStyle,
        ]}
      >
        <Animated.View style={[{ width: '100%', maxWidth: 360 }, cardStyle]}>
          <LinearGradient
            colors={['#1a0533', '#2d1155', '#1a0533']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(168,85,247,0.35)' }}
          >
            {/* Top glow */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: -60,
                  alignSelf: 'center',
                  width: 200,
                  height: 200,
                  borderRadius: 100,
                  backgroundColor: '#A855F7',
                },
                glowStyle,
                { filter: undefined } as any,
              ]}
              pointerEvents="none"
            />

            <View style={{ padding: 32, alignItems: 'center' }}>
              {/* Unlocked badge */}
              <View style={{
                backgroundColor: 'rgba(168,85,247,0.18)',
                borderWidth: 1,
                borderColor: 'rgba(168,85,247,0.5)',
                borderRadius: 99,
                paddingHorizontal: 14,
                paddingVertical: 5,
                marginBottom: 24,
              }}>
                <Text style={{ color: '#D8B4FE', fontSize: sFont(11), fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase' }}>
                  ✦ {language === 'es' ? 'DESBLOQUEADO' : 'UNLOCKED'} ✦
                </Text>
              </View>

              {/* Chest icon with glow ring */}
              <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                <Animated.View style={[{
                  position: 'absolute',
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                  backgroundColor: 'rgba(168,85,247,0.15)',
                  borderWidth: 2,
                  borderColor: 'rgba(168,85,247,0.3)',
                }, glowStyle]} />
                <Animated.View style={[{
                  position: 'absolute',
                  width: 110,
                  height: 110,
                  borderRadius: 55,
                  backgroundColor: 'rgba(168,85,247,0.1)',
                }, glowStyle]} />
                <Animated.View style={[{ alignItems: 'center', justifyContent: 'center', width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(168,85,247,0.2)', borderWidth: 2, borderColor: 'rgba(168,85,247,0.5)' }, chestStyle]}>
                  <Text style={{ fontSize: sFont(50) }}>📦</Text>
                </Animated.View>
              </View>

              {/* Title */}
              <Text style={{ color: '#FFFFFF', fontSize: sFont(22), fontWeight: '800', textAlign: 'center', marginBottom: 8, letterSpacing: -0.3 }}>
                {language === 'es' ? '🎁 Cofre Semanal Desbloqueado' : '🎁 Weekly Chest Unlocked'}
              </Text>

              {/* Subtitle */}
              <Text style={{ color: 'rgba(216,180,254,0.75)', fontSize: sFont(14), textAlign: 'center', lineHeight: 20, marginBottom: 32 }}>
                {language === 'es'
                  ? 'Completaste todos los desafíos de la semana.'
                  : 'You completed all weekly challenges.'}
              </Text>

              {/* Open button */}
              <Pressable
                onPress={handleOpenPress}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? '#9333EA' : '#A855F7',
                  borderRadius: 18,
                  paddingHorizontal: 48,
                  paddingVertical: 16,
                  width: '100%',
                  alignItems: 'center',
                  shadowColor: '#A855F7',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.5,
                  shadowRadius: 16,
                  elevation: 8,
                  transform: [{ scale: 1 }],
                })}
              >
                <Text style={{ color: '#FFFFFF', fontSize: sFont(17), fontWeight: '800', letterSpacing: 0.2 }}>
                  {language === 'es' ? 'Abrir Cofre' : 'Open Chest'}
                </Text>
              </Pressable>

              {/* Skip */}
              <Pressable onPress={onClose} style={{ marginTop: 16, padding: 8 }}>
                <Text style={{ color: 'rgba(216,180,254,0.45)', fontSize: sFont(13) }}>
                  {language === 'es' ? 'Más tarde' : 'Later'}
                </Text>
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export default WeeklyChestUnlockedModal;
