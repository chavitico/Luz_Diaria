import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react-native';
import { useThemeColors } from '@/lib/store';
import { TRANSLATIONS } from '@/lib/constants';
import { gamificationApi } from '@/lib/gamification-api';

// Daily Prayer of the Day Section (from community requests)
function DailyPrayerSection({
  colors,
  language,
}: {
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
}) {
  const t = TRANSLATIONS[language];

  const { data: dailyPrayer, isLoading } = useQuery({
    queryKey: ['daily-prayer-today'],
    queryFn: () => gamificationApi.getTodayDailyPrayer(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  if (isLoading) {
    return (
      <View className="mt-6 p-4 rounded-2xl" style={{ backgroundColor: colors.surface }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!dailyPrayer) {
    return null;
  }

  const title = language === 'es' ? dailyPrayer.titleEs : dailyPrayer.title;
  const prayerText = language === 'es' ? dailyPrayer.prayerTextEs : dailyPrayer.prayerText;

  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(400)}
      className="mt-6 rounded-2xl overflow-hidden"
      style={{
        backgroundColor: colors.primary + '08',
        borderWidth: 1,
        borderColor: colors.primary + '20',
      }}
    >
      {/* Header */}
      <View
        className="px-4 py-3 flex-row items-center"
        style={{ backgroundColor: colors.primary + '15' }}
      >
        <Heart size={18} color={colors.primary} />
        <Text className="text-base font-semibold ml-2" style={{ color: colors.primary }}>
          {t.prayer_of_the_day}
        </Text>
        {dailyPrayer.totalRequests > 0 && (
          <View
            className="ml-auto px-2 py-1 rounded-full"
            style={{ backgroundColor: colors.primary + '20' }}
          >
            <Text className="text-xs font-medium" style={{ color: colors.primary }}>
              {dailyPrayer.totalRequests} {language === 'es' ? 'peticiones' : 'requests'}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View className="p-4">
        <Text className="text-lg font-semibold mb-3" style={{ color: colors.text }}>
          {title}
        </Text>
        <Text
          className="text-base leading-7"
          style={{ color: colors.text, fontStyle: 'italic' }}
        >
          {prayerText}
        </Text>
      </View>
    </Animated.View>
  );
}

export default DailyPrayerSection;
