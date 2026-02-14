// Bible Reference Text Component
// Renders text with tappable Bible references that open the passage modal

import React, { useState, useMemo, useCallback } from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/lib/store';
import { findReferencesInText } from '@/lib/bible-service';
import { BiblePassageModal } from './BiblePassageModal';

interface BibleReferenceTextProps {
  children: string;
  style?: StyleProp<TextStyle>;
  referenceStyle?: StyleProp<TextStyle>;
}

interface TextSegment {
  type: 'text' | 'reference';
  content: string;
  key: string;
}

// Animated reference text component with press state
function AnimatedReferenceText({
  content,
  style,
  onPress,
}: {
  content: string;
  style: TextStyle;
  onPress: () => void;
}) {
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handlePressIn = useCallback(() => {
    opacity.value = withTiming(0.6, { duration: 100 });
  }, []);

  const handlePressOut = useCallback(() => {
    opacity.value = withTiming(1, { duration: 150 });
  }, []);

  return (
    <Animated.Text
      style={[style, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      suppressHighlighting={false}
    >
      {content}
    </Animated.Text>
  );
}

/**
 * BibleReferenceText
 *
 * A Text component that automatically detects Bible references
 * and renders them as tappable links. When tapped, opens a modal
 * showing the full passage text.
 *
 * Usage:
 * <BibleReferenceText style={{ fontSize: 16 }}>
 *   In the parable of the Good Samaritan (Lucas 10:25-37), Jesus teaches us...
 * </BibleReferenceText>
 */
export function BibleReferenceText({
  children,
  style,
  referenceStyle,
}: BibleReferenceTextProps) {
  const colors = useThemeColors();
  const [selectedReference, setSelectedReference] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Parse the text and find all Bible references
  const segments = useMemo(() => {
    if (!children || typeof children !== 'string') {
      return [{ type: 'text' as const, content: children || '', key: '0' }];
    }

    const references = findReferencesInText(children);

    if (references.length === 0) {
      return [{ type: 'text' as const, content: children, key: '0' }];
    }

    const result: TextSegment[] = [];
    let lastIndex = 0;

    references.forEach((ref, index) => {
      // Add text before this reference
      if (ref.startIndex > lastIndex) {
        result.push({
          type: 'text',
          content: children.substring(lastIndex, ref.startIndex),
          key: `text-${index}`,
        });
      }

      // Add the reference
      result.push({
        type: 'reference',
        content: ref.reference,
        key: `ref-${index}`,
      });

      lastIndex = ref.endIndex;
    });

    // Add any remaining text after the last reference
    if (lastIndex < children.length) {
      result.push({
        type: 'text',
        content: children.substring(lastIndex),
        key: `text-final`,
      });
    }

    return result;
  }, [children]);

  const handleReferencePress = (reference: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Clean up the reference (remove parentheses)
    const cleanRef = reference.replace(/[()]/g, '').trim();
    setSelectedReference(cleanRef);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedReference(null);
  };

  // Enhanced reference styling - highly visible and interactive-looking
  const defaultReferenceStyle: TextStyle = {
    color: colors.secondary,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
    backgroundColor: colors.secondary + '12', // 12% opacity background pill
    borderRadius: 4,
    paddingHorizontal: 2,
  };

  return (
    <>
      <Text style={style}>
        {segments.map((segment) => {
          if (segment.type === 'reference') {
            return (
              <AnimatedReferenceText
                key={segment.key}
                content={segment.content}
                style={{ ...defaultReferenceStyle, ...(referenceStyle as TextStyle) }}
                onPress={() => handleReferencePress(segment.content)}
              />
            );
          }

          return (
            <Text key={segment.key}>
              {segment.content}
            </Text>
          );
        })}
      </Text>

      <BiblePassageModal
        visible={modalVisible}
        reference={selectedReference || ''}
        onClose={handleCloseModal}
      />
    </>
  );
}

/**
 * Higher-order component to wrap existing Text content
 * Useful when you want to add Bible reference support to existing text
 */
export function withBibleReferences(
  text: string,
  baseStyle?: StyleProp<TextStyle>
): React.ReactNode {
  return <BibleReferenceText style={baseStyle}>{text}</BibleReferenceText>;
}
