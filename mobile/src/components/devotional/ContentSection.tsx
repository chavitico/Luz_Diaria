import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BibleReferenceText } from '@/components/BibleReferenceText';
import { useThemeColors } from '@/lib/store';

const { width } = Dimensions.get('window');
const IS_TABLET = width >= 768;
const ss = (mobile: number) => IS_TABLET ? mobile * 1.20 : mobile;
const bs = (mobile: number) => IS_TABLET ? mobile * 1.15 : mobile;

export interface ContentSectionProps {
  title: string;
  content: string;
  icon: React.ReactNode;
  colors: ReturnType<typeof useThemeColors>;
  isHighlighted?: boolean;
  sectionIndex: number;
  onPress?: () => void;
}

function ContentSection({ title, content, icon, colors, isHighlighted, sectionIndex, onPress }: ContentSectionProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(100 + sectionIndex * 50).duration(400)}
      style={{ marginBottom: IS_TABLET ? 16 : 24 }}
    >
      <View className="flex-row items-center mb-3">
        <TouchableOpacity
          onPress={() => {
            console.log(`[TTS][icon] index.tsx section tap index=${sectionIndex}`);
            onPress?.();
          }}
          activeOpacity={0.5}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primary + '25',
            marginRight: 12,
          }}
        >
          {icon}
        </TouchableOpacity>
        <Text
          style={{ color: colors.primary, fontSize: ss(18), fontWeight: 'bold' }}
        >
          {title}
        </Text>
      </View>

      <View
        style={{
          borderRadius: 16,
          padding: IS_TABLET ? 16 : 20,
          backgroundColor: isHighlighted ? colors.primary + '15' : colors.surface,
          borderWidth: isHighlighted ? 2 : 0,
          borderColor: isHighlighted ? colors.primary : 'transparent',
        }}
      >
        <BibleReferenceText
          style={{ color: colors.text, fontSize: bs(16), lineHeight: bs(28) }}
          onPress={onPress}
        >
          {content}
        </BibleReferenceText>
      </View>
    </Animated.View>
  );
}

export default ContentSection;
