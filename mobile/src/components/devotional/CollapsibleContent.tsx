import React, { useState } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ChevronUp, ChevronDown } from 'lucide-react-native';
import { useThemeColors } from '@/lib/store';

const { height } = Dimensions.get('window');

// Collapsible content for overflow
function CollapsibleContent({
  children,
  colors,
  language,
}: {
  children: React.ReactNode;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [contentHeight, setContentHeight] = useState(0);
  const maxCollapsedHeight = height * 0.6;
  const needsCollapse = contentHeight > maxCollapsedHeight;

  return (
    <View>
      <View
        style={{
          maxHeight: isExpanded ? undefined : maxCollapsedHeight,
          overflow: isExpanded ? 'visible' : 'hidden',
        }}
        onLayout={(e) => {
          if (contentHeight === 0) {
            setContentHeight(e.nativeEvent.layout.height);
          }
        }}
      >
        {children}
      </View>

      {needsCollapse && (
        <>
          {!isExpanded && (
            <LinearGradient
              colors={['transparent', colors.background]}
              style={{
                position: 'absolute',
                bottom: 40,
                left: 0,
                right: 0,
                height: 80,
              }}
            />
          )}
          <Pressable
            onPress={() => {
              setIsExpanded(!isExpanded);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="flex-row items-center justify-center py-3 mt-2 rounded-xl"
            style={{ backgroundColor: colors.primary + '15' }}
          >
            {isExpanded ? (
              <>
                <ChevronUp size={18} color={colors.primary} />
                <Text className="ml-2 font-semibold" style={{ color: colors.primary }}>
                  {language === 'es' ? 'Ver menos' : 'Show less'}
                </Text>
              </>
            ) : (
              <>
                <ChevronDown size={18} color={colors.primary} />
                <Text className="ml-2 font-semibold" style={{ color: colors.primary }}>
                  {language === 'es' ? 'Ver mas' : 'Show more'}
                </Text>
              </>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}

export default CollapsibleContent;
