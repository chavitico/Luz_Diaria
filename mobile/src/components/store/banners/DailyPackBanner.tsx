import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';

function DailyPackBanner({
  status,
  language,
  isEventActive,
  disabled,
  onClaim,
  onClaimPress,
}: {
  status: {
    canClaim: boolean;
    remaining: number;
    dailyLimit: number;
    isPremium: boolean;
    nextAvailableMs: number | null;
    claimedToday: number;
  } | null;
  language: 'en' | 'es';
  isEventActive: boolean;
  disabled?: boolean;
  onClaim: (packType: 'sobre_biblico' | 'pack_pascua' | 'pack_milagros' | 'pack_heroes') => void;
  onClaimPress?: () => void;
}) {
  const { sFont } = useScaledFont();
  const colors = useThemeColors();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // Compute countdown string
  const [countdown, setCountdown] = React.useState('');
  React.useEffect(() => {
    if (!status || status.canClaim || !status.nextAvailableMs) {
      setCountdown('');
      return;
    }
    const update = () => {
      const diffMs = status.nextAvailableMs! - Date.now();
      if (diffMs <= 0) { setCountdown(''); return; }
      const h = Math.floor(diffMs / 3_600_000);
      const m = Math.floor((diffMs % 3_600_000) / 60_000);
      setCountdown(`${h}h ${m}m`);
    };
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, [status]);

  const canClaim = status?.canClaim ?? false;
  const isPremium = status?.isPremium ?? false;
  const dailyLimit = status?.dailyLimit ?? 1;

  const labelActive = isPremium
    ? (language === 'es' ? `🎁 ${dailyLimit} sobres diarios (Premium)` : `🎁 ${dailyLimit} daily packs (Premium)`)
    : (language === 'es' ? '🎁 Sobre diario disponible' : '🎁 Daily pack available');

  const labelWaiting = countdown
    ? (language === 'es' ? `⏳ Próximo sobre en ${countdown}` : `⏳ Next pack in ${countdown}`)
    : (language === 'es' ? '⏳ Sobre diario reclamado' : '⏳ Daily pack claimed');

  return (
    <Animated.View style={[animStyle, { marginBottom: 12, opacity: disabled ? 0.5 : 1 }]}>
      <Pressable
        onPressIn={() => { if (canClaim && !disabled) scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={() => {
          if (!canClaim || disabled) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          if (onClaimPress) onClaimPress();
        }}
        disabled={!canClaim || disabled}
      >
        <LinearGradient
          colors={canClaim
            ? (isPremium ? ['#2D1B5E', '#1A0F3A'] : ['#0F2A1A', '#061510'])
            : ['rgba(30,30,30,0.6)', 'rgba(20,20,20,0.6)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: canClaim
              ? (isPremium ? '#7C3AED' : '#22C55E')
              : 'rgba(255,255,255,0.08)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <Text style={{
            fontSize: sFont(15),
            fontWeight: '700',
            color: canClaim
              ? (isPremium ? '#C4B5FD' : '#86EFAC')
              : 'rgba(255,255,255,0.35)',
            flex: 1,
          }}>
            {canClaim ? labelActive : labelWaiting}
          </Text>
          {canClaim && (
            <LinearGradient
              colors={isPremium ? ['#7C3AED', '#5B21B6'] : ['#16A34A', '#15803D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 99 }}
            >
              <View style={{ paddingHorizontal: 18, paddingVertical: 9 }}>
                <Text style={{ fontSize: sFont(13), fontWeight: '800', color: '#FFF' }}>
                  {language === 'es' ? 'Reclamar' : 'Claim'}
                </Text>
              </View>
            </LinearGradient>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default DailyPackBanner;
