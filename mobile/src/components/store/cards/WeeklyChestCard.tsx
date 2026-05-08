import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Gift, Info, Check, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useUser } from '@/lib/store';
import type { useThemeColors } from '@/lib/store';

function WeeklyChestCard({
  colors,
  language,
  userId,
  allChallengesComplete,
  onClaim,
}: {
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  userId: string;
  allChallengesComplete: boolean;
  onClaim: () => void;
}) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const user = useUser();
  const lastChestClaimed = user?.lastWeeklyChestClaimed;

  // Get current week ID — matches backend format (zero-padded, e.g. "2026-W09")
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  const currentWeekId = `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;

  const alreadyClaimed = lastChestClaimed === currentWeekId;
  const canClaim = allChallengesComplete && !alreadyClaimed;

  if (!allChallengesComplete && !alreadyClaimed) return null;

  return (
    <>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowInfo(true);
        }}
      >
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          className="mx-5 mb-5 rounded-2xl overflow-hidden"
          style={{
            shadowColor: '#A855F7',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: canClaim ? 0.3 : 0.1,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80' }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.32 }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={canClaim ? ['#1E0B3ACC', '#2D1952C0', '#16082ECC'] : ['rgba(10,5,20,0.90)', 'rgba(10,5,20,0.90)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 20 }}
          >
            <View className="flex-row items-center">
              <View
                className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                style={{ backgroundColor: canClaim ? '#A855F7' + '20' : colors.textMuted + '15' }}
              >
                <Gift size={28} color={canClaim ? '#A855F7' : colors.textMuted} />
              </View>

              <View className="flex-1">
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Text
                    className="text-base font-bold"
                    style={{ color: colors.text }}
                  >
                    {language === 'es' ? 'Cofre Semanal' : 'Weekly Chest'}
                  </Text>
                  <Info size={14} color={colors.textMuted} />
                </View>
                <Text
                  className="text-xs mt-1"
                  style={{ color: colors.textMuted }}
                >
                  {alreadyClaimed
                    ? language === 'es' ? 'Reclamado esta semana' : 'Claimed this week'
                    : language === 'es' ? 'Completa todos los desafios' : 'Complete all challenges'
                  }
                </Text>
              </View>

              {canClaim && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    setIsClaiming(true);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    onClaim();
                    setTimeout(() => setIsClaiming(false), 500);
                  }}
                  disabled={isClaiming}
                  className="px-4 py-2.5 rounded-xl"
                  style={{ backgroundColor: '#A855F7' }}
                >
                  {isClaiming ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-sm font-semibold text-white">
                      {language === 'es' ? 'Abrir' : 'Open'}
                    </Text>
                  )}
                </Pressable>
              )}

              {alreadyClaimed && (
                <View className="flex-row items-center px-3 py-2 rounded-xl" style={{ backgroundColor: '#22C55E20' }}>
                  <Check size={14} color="#22C55E" strokeWidth={3} />
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>
      </Pressable>

      {/* Chest Info Modal */}
      <Modal
        visible={showInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfo(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 }}
          onPress={() => setShowInfo(false)}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 24,
              width: '100%',
              maxWidth: 360,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.18,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            {/* Header */}
            <View className="flex-row items-start justify-between mb-4">
              <View
                className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: '#A855F7' + '20' }}
              >
                <Gift size={22} color="#A855F7" />
              </View>
              <View className="flex-1 mr-2">
                <Text className="text-base font-bold mb-0.5" style={{ color: colors.text }}>
                  {language === 'es' ? 'Cofre Semanal' : 'Weekly Chest'}
                </Text>
                <Text className="text-xs" style={{ color: colors.textMuted }}>
                  {language === 'es' ? 'Recompensa especial' : 'Special reward'}
                </Text>
              </View>
              <Pressable
                onPress={() => setShowInfo(false)}
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.textMuted + '18' }}
              >
                <X size={16} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Description */}
            <View className="mb-4 p-3 rounded-xl" style={{ backgroundColor: colors.background }}>
              <Text className="text-sm leading-5" style={{ color: colors.text }}>
                {language === 'es'
                  ? 'El Cofre Semanal es una recompensa especial que puedes abrir una vez por semana. Contiene puntos o artículos exclusivos que no se consiguen de otra forma.'
                  : 'The Weekly Chest is a special reward you can open once per week. It contains points or exclusive items that cannot be obtained any other way.'}
              </Text>
            </View>

            {/* How to get it */}
            <View className="p-3 rounded-xl" style={{ backgroundColor: '#A855F7' + '12' }}>
              <Text className="text-xs font-semibold mb-1" style={{ color: '#A855F7' }}>
                {language === 'es' ? '¿Cómo conseguirlo?' : 'How to get it?'}
              </Text>
              <Text className="text-xs leading-5" style={{ color: colors.text }}>
                {language === 'es'
                  ? 'Completa los 2 desafíos semanales para desbloquear el cofre. Una vez ambos estén reclamados, el cofre aparecerá listo para abrirse.'
                  : 'Complete both weekly challenges to unlock the chest. Once both are claimed, the chest will appear ready to open.'}
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default WeeklyChestCard;
