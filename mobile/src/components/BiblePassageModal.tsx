// Bible Passage Modal - Shows Bible passage text when reference is tapped
// Uses a bottom sheet style modal for mobile-friendly interaction

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Share,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import {
  X,
  Copy,
  Share as ShareIcon,
  BookOpen,
  RefreshCw,
  Minus,
  Plus,
} from 'lucide-react-native';
import { useThemeColors, useLanguage } from '@/lib/store';
import { fetchBiblePassage, type BiblePassage } from '@/lib/bible-service';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BiblePassageModalProps {
  visible: boolean;
  reference: string;
  onClose: () => void;
}

export function BiblePassageModal({ visible, reference, onClose }: BiblePassageModalProps) {
  const colors = useThemeColors();
  const language = useLanguage();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passage, setPassage] = useState<BiblePassage | null>(null);
  const [fontSize, setFontSize] = useState(16);
  const [copied, setCopied] = useState(false);

  // Fetch passage when modal opens with a new reference
  useEffect(() => {
    if (visible && reference) {
      loadPassage();
    }
  }, [visible, reference]);

  const loadPassage = async () => {
    setLoading(true);
    setError(null);
    setPassage(null);

    const result = await fetchBiblePassage(reference, language);

    setLoading(false);

    if (result.success && result.passage) {
      setPassage(result.passage);
    } else {
      setError(result.error || (language === 'es' ? 'Error desconocido' : 'Unknown error'));
    }
  };

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadPassage();
  };

  const handleCopy = async () => {
    if (!passage) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(`${passage.referenceDisplay}\n\n${passage.text}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!passage) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await Share.share({
        message: `${passage.referenceDisplay}\n\n${passage.text}\n\n— Daily Light App`,
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleFontSizeChange = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFontSize((prev) => Math.max(12, Math.min(24, prev + delta)));
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        className="flex-1 bg-black/60"
      >
        <Pressable className="flex-1" onPress={handleClose} />

        {/* Bottom Sheet */}
        <Animated.View
          entering={SlideInDown.duration(300).springify()}
          exiting={SlideOutDown.duration(200)}
          className="rounded-t-3xl"
          style={{
            backgroundColor: colors.surface,
            maxHeight: SCREEN_HEIGHT * 0.75,
            paddingBottom: insets.bottom + 16,
          }}
        >
          {/* Handle bar */}
          <View className="items-center pt-3 pb-2">
            <View
              className="w-10 h-1 rounded-full"
              style={{ backgroundColor: colors.textMuted + '40' }}
            />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pb-3">
            <View className="flex-row items-center flex-1">
              <View
                className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: colors.primary + '15' }}
              >
                <BookOpen size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-lg font-bold"
                  style={{ color: colors.text }}
                  numberOfLines={1}
                >
                  {passage?.referenceDisplay || reference}
                </Text>
                {passage?.book && (
                  <Text className="text-sm" style={{ color: colors.textMuted }}>
                    {passage.book}
                  </Text>
                )}
              </View>
            </View>

            <Pressable
              onPress={handleClose}
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.textMuted + '20' }}
            >
              <X size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Content */}
          <View className="flex-1 px-5">
            {loading && (
              <View className="flex-1 items-center justify-center py-12">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="mt-4 text-base" style={{ color: colors.textMuted }}>
                  {language === 'es' ? 'Cargando pasaje...' : 'Loading passage...'}
                </Text>
              </View>
            )}

            {error && !loading && (
              <View className="flex-1 items-center justify-center py-12">
                <Text
                  className="text-base text-center mb-4"
                  style={{ color: colors.textMuted }}
                >
                  {error}
                </Text>
                <Pressable
                  onPress={handleRetry}
                  className="flex-row items-center px-5 py-3 rounded-xl"
                  style={{ backgroundColor: colors.primary }}
                >
                  <RefreshCw size={18} color="#FFFFFF" />
                  <Text className="ml-2 font-semibold text-white">
                    {language === 'es' ? 'Reintentar' : 'Retry'}
                  </Text>
                </Pressable>
              </View>
            )}

            {passage && !loading && (
              <>
                {/* Font size controls */}
                <View className="flex-row items-center justify-end mb-3">
                  <Pressable
                    onPress={() => handleFontSizeChange(-2)}
                    className="w-8 h-8 rounded-lg items-center justify-center"
                    style={{ backgroundColor: colors.textMuted + '15' }}
                  >
                    <Minus size={16} color={colors.textMuted} />
                  </Pressable>
                  <Text className="mx-3 text-sm" style={{ color: colors.textMuted }}>
                    {fontSize}
                  </Text>
                  <Pressable
                    onPress={() => handleFontSizeChange(2)}
                    className="w-8 h-8 rounded-lg items-center justify-center"
                    style={{ backgroundColor: colors.textMuted + '15' }}
                  >
                    <Plus size={16} color={colors.textMuted} />
                  </Pressable>
                </View>

                {/* Passage text */}
                <ScrollView
                  className="flex-1"
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: SCREEN_HEIGHT * 0.4 }}
                >
                  <Text
                    className="leading-relaxed"
                    style={{
                      color: colors.text,
                      fontSize,
                      lineHeight: fontSize * 1.6,
                    }}
                  >
                    {formatPassageText(passage.text)}
                  </Text>
                </ScrollView>

                {/* Action buttons */}
                <View className="flex-row gap-3 mt-4 pt-4 border-t" style={{ borderTopColor: colors.textMuted + '20' }}>
                  <Pressable
                    onPress={handleCopy}
                    className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
                    style={{ backgroundColor: copied ? colors.accent + '20' : colors.textMuted + '15' }}
                  >
                    <Copy size={18} color={copied ? colors.accent : colors.text} />
                    <Text
                      className="ml-2 font-medium"
                      style={{ color: copied ? colors.accent : colors.text }}
                    >
                      {copied
                        ? (language === 'es' ? 'Copiado' : 'Copied')
                        : (language === 'es' ? 'Copiar' : 'Copy')}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleShare}
                    className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <ShareIcon size={18} color="#FFFFFF" />
                    <Text className="ml-2 font-medium text-white">
                      {language === 'es' ? 'Compartir' : 'Share'}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

/**
 * Format passage text for display
 * Handles verse numbers like [25] and formats them nicely
 */
function formatPassageText(text: string): string {
  // Format verse numbers: [25] -> superscript style indicator
  // Since React Native Text doesn't support true superscript easily,
  // we'll just clean up the brackets and add some spacing
  return text
    .replace(/\[(\d+)\]/g, '\n$1 ') // New line before each verse number
    .replace(/^\n/, '') // Remove leading newline
    .trim();
}
