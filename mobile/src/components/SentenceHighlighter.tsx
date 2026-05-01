import React, { useState, useCallback } from 'react';
import { Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useScaledFont } from '@/lib/textScale';
import { useThemeColors } from '@/lib/store';
import { HighlightColorPicker } from '@/components/HighlightColorPicker';
import {
  HighlightColor,
  SentenceHighlightMap,
  splitIntoSentences,
  getHighlightBg,
} from '@/lib/devotional-highlights';

interface Props {
  text: string;
  highlights: SentenceHighlightMap;
  onHighlightChange: (sentenceIndex: number, color: HighlightColor | null) => void;
  fontSize?: number;
  lineHeight?: number;
  textStyle?: object;
  language?: 'es' | 'en';
}

export function SentenceHighlighter({
  text,
  highlights,
  onHighlightChange,
  fontSize = 15,
  lineHeight = 25,
  textStyle,
  language = 'es',
}: Props) {
  const { sFont } = useScaledFont();
  const colors = useThemeColors();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const sentences = splitIntoSentences(text);
  const currentColor = selectedIdx !== null ? highlights[selectedIdx.toString()] : undefined;

  const handleLongPress = useCallback((idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedIdx(idx);
    setPickerVisible(true);
  }, []);

  const handleSelect = useCallback((color: HighlightColor) => {
    if (selectedIdx !== null) onHighlightChange(selectedIdx, color);
    setPickerVisible(false);
    setSelectedIdx(null);
  }, [selectedIdx, onHighlightChange]);

  const handleRemove = useCallback(() => {
    if (selectedIdx !== null) onHighlightChange(selectedIdx, null);
    setPickerVisible(false);
    setSelectedIdx(null);
  }, [selectedIdx, onHighlightChange]);

  return (
    <>
      <Text style={[{ color: colors.text, fontSize: sFont(fontSize), lineHeight: sFont(lineHeight) }, textStyle]}>
        {sentences.map((sentence, i) => {
          const color = highlights[i.toString()];
          const bg = color ? getHighlightBg(color) : undefined;
          return (
            <Text
              key={i}
              onLongPress={() => handleLongPress(i)}
              suppressHighlighting
              style={bg ? { backgroundColor: bg, color: '#1C1917' } : { color: colors.text }}
            >
              {sentence}{i < sentences.length - 1 ? ' ' : ''}
            </Text>
          );
        })}
      </Text>

      <HighlightColorPicker
        visible={pickerVisible}
        currentColor={currentColor}
        onSelect={handleSelect}
        onRemove={handleRemove}
        onClose={() => { setPickerVisible(false); setSelectedIdx(null); }}
        language={language}
      />
    </>
  );
}
