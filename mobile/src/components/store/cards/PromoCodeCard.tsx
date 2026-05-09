import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ticket, ChevronRight, Check, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useScaledFont } from '@/lib/textScale';
import type { useThemeColors } from '@/lib/store';
import { gamificationApi } from '@/lib/gamification-api';

function PromoCodeCard({
  colors,
  language,
  userId,
  onSuccess,
}: {
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  userId: string;
  onSuccess: (points: number) => void;
}) {
  const { sFont } = useScaledFont();
  const [code, setCode] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRedeem = async () => {
    if (!code.trim() || isRedeeming) return;

    setIsRedeeming(true);
    setMessage(null);

    try {
      const result = await gamificationApi.redeemPromoCode(userId, code.trim());

      if (result.success && result.pointsAwarded) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMessage({
          type: 'success',
          text: `${language === 'es' ? 'Codigo aplicado' : 'Code applied'}: +${result.pointsAwarded} ${language === 'es' ? 'puntos' : 'points'}`,
        });
        setCode('');
        onSuccess(result.pointsAwarded);
        // Close card after success
        setTimeout(() => {
          setIsExpanded(false);
          setMessage(null);
        }, 2000);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        let errorText = result.error || (language === 'es' ? 'Error al canjear' : 'Redemption error');
        setMessage({ type: 'error', text: errorText });
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setMessage({
        type: 'error',
        text: language === 'es' ? 'Error de conexion' : 'Connection error',
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(400)}
      style={{
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 24,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
        elevation: 5,
      }}
    >
      <LinearGradient
        colors={[colors.primary + '25', colors.primary + '08', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 1.5 }}
      >
        <LinearGradient
          colors={['#1C1208', '#120D05', '#0E0900']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 23, overflow: 'hidden' }}
        >
          {/* Inner accent glow */}
          <LinearGradient
            colors={[colors.primary + '14', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setIsExpanded(!isExpanded);
              setMessage(null);
            }}
            style={{ padding: 20 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Icon chip */}
              <LinearGradient
                colors={[colors.primary + '30', colors.primary + '12']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                  borderWidth: 1,
                  borderColor: colors.primary + '40',
                }}
              >
                <Ticket size={22} color={colors.primary} />
              </LinearGradient>

              {/* Text */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2, marginBottom: 2 }}>
                  {language === 'es' ? 'Canjear Código' : 'Redeem Code'}
                </Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: '500' }}>
                  {language === 'es' ? 'Ingresa tu código promocional' : 'Enter your promo code'}
                </Text>
              </View>

              {/* Arrow */}
              <View style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}>
                <ChevronRight size={20} color="rgba(255,255,255,0.30)" />
              </View>
            </View>
          </Pressable>

          {isExpanded && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={{ paddingHorizontal: 20, paddingBottom: 20 }}
            >
              {/* Subtle separator */}
              <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 16 }} />

              {/* Input Field */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 14,
                  overflow: 'hidden',
                  marginBottom: 10,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.10)',
                }}
              >
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder={language === 'es' ? 'Código...' : 'Code...'}
                  placeholderTextColor="rgba(255,255,255,0.30)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    flex: 1,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: sFont(15),
                    color: '#FFFFFF',
                    fontWeight: '700',
                    letterSpacing: 1,
                  }}
                  editable={!isRedeeming}
                />
                <Pressable
                  onPress={handleRedeem}
                  disabled={!code.trim() || isRedeeming}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    backgroundColor: code.trim() && !isRedeeming ? colors.primary : 'rgba(255,255,255,0.08)',
                  }}
                >
                  {isRedeeming ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text
                      style={{
                        color: code.trim() ? '#FFFFFF' : 'rgba(255,255,255,0.30)',
                        fontWeight: '700',
                        fontSize: sFont(14),
                      }}
                    >
                      {language === 'es' ? 'Canjear' : 'Redeem'}
                    </Text>
                  )}
                </Pressable>
              </View>

              {/* Message */}
              {message && (
                <Animated.View
                  entering={FadeIn.duration(150)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    backgroundColor: message.type === 'success' ? '#22C55E18' : '#EF444418',
                    borderWidth: 1,
                    borderColor: message.type === 'success' ? '#22C55E30' : '#EF444430',
                    gap: 8,
                  }}
                >
                  {message.type === 'success' ? (
                    <Check size={15} color="#22C55E" strokeWidth={3} />
                  ) : (
                    <X size={15} color="#EF4444" strokeWidth={3} />
                  )}
                  <Text
                    style={{ fontSize: 13, fontWeight: '600', flex: 1, color: message.type === 'success' ? '#22C55E' : '#EF4444' }}
                  >
                    {message.text}
                  </Text>
                </Animated.View>
              )}
            </Animated.View>
          )}
        </LinearGradient>
      </LinearGradient>
    </Animated.View>
  );
}

export default PromoCodeCard;
