import React from 'react';
import { View, Text, Pressable, Modal, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useScaledFont } from '@/lib/textScale';
import { useThemeColors } from '@/lib/store';
import { DEVOTIONAL_HIGHLIGHT_COLORS, HighlightColor } from '@/lib/devotional-highlights';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  visible: boolean;
  currentColor: HighlightColor | undefined;
  onSelect: (color: HighlightColor) => void;
  onRemove: () => void;
  onClose: () => void;
  language?: 'es' | 'en';
}

export function HighlightColorPicker({ visible, currentColor, onSelect, onRemove, onClose, language = 'es' }: Props) {
  const { sFont } = useScaledFont();
  const colors = useThemeColors();

  const colCount = 5;
  const colorSize = Math.floor((SCREEN_WIDTH - 48 - (colCount - 1) * 10) / colCount);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        {/* Inner Pressable stops propagation to dismiss */}
        <Pressable>
          <View style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            paddingTop: 10, paddingBottom: 44, paddingHorizontal: 24,
          }}>
            {/* Drag handle */}
            <View style={{
              width: 36, height: 4, borderRadius: 2,
              backgroundColor: colors.textMuted + '50',
              alignSelf: 'center', marginBottom: 20,
            }} />

            <Text style={{
              color: colors.textMuted,
              fontSize: sFont(11), fontWeight: '700',
              letterSpacing: 1.2, textTransform: 'uppercase',
              marginBottom: 18,
            }}>
              {language === 'es' ? 'Color de resaltado' : 'Highlight color'}
            </Text>

            {/* 5×2 color grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              {DEVOTIONAL_HIGHLIGHT_COLORS.map(h => (
                <Pressable
                  key={h.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSelect(h.key);
                  }}
                  style={{
                    width: colorSize, height: colorSize,
                    borderRadius: 14, backgroundColor: h.bg,
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: currentColor === h.key ? 2.5 : 0,
                    borderColor: '#1C1917',
                    shadowColor: h.bg,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.6, shadowRadius: 6, elevation: 3,
                  }}
                >
                  {currentColor === h.key && (
                    <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: '#1C1917' }} />
                  )}
                </Pressable>
              ))}
            </View>

            {/* Remove — only shown when a color is active */}
            {currentColor && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onRemove();
                }}
                style={{
                  paddingVertical: 14, borderRadius: 14,
                  backgroundColor: colors.textMuted + '18',
                  alignItems: 'center', marginTop: 4,
                }}
              >
                <Text style={{ color: colors.text, fontSize: sFont(14), fontWeight: '500' }}>
                  {language === 'es' ? 'Quitar resaltado' : 'Remove highlight'}
                </Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
