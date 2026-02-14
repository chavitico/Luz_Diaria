// Bible Passage Modal - Shows Bible passage text when reference is tapped
// Centered modal design for better visibility

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
  ZoomIn,
  ZoomOut,
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

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const [fontSize, setFontSize] = useState(15);
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
    setFontSize((prev) => Math.max(12, Math.min(22, prev + delta)));
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
        exiting={FadeOut.duration(150)}
        className="flex-1 bg-black/50 items-center justify-center"
        style={{ paddingHorizontal: 20, paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <Pressable
          className="absolute inset-0"
          onPress={handleClose}
        />

        {/* Centered Card */}
        <Animated.View
          entering={ZoomIn.duration(250).springify()}
          exiting={ZoomOut.duration(150)}
          className="w-full rounded-2xl overflow-hidden"
          style={{
            backgroundColor: colors.surface,
            maxHeight: SCREEN_HEIGHT * 0.65,
            maxWidth: SCREEN_WIDTH - 40,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          {/* Header */}
          <View
            className="flex-row items-center justify-between px-4 py-3"
            style={{ backgroundColor: colors.primary + '10' }}
          >
            <View className="flex-row items-center flex-1 mr-2">
              <View
                className="w-8 h-8 rounded-lg items-center justify-center mr-2"
                style={{ backgroundColor: colors.primary + '20' }}
              >
                <BookOpen size={16} color={colors.primary} />
              </View>
              <Text
                className="text-base font-bold flex-1"
                style={{ color: colors.text }}
                numberOfLines={1}
              >
                {passage?.referenceDisplay || reference}
              </Text>
            </View>

            <Pressable
              onPress={handleClose}
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.textMuted + '20' }}
            >
              <X size={16} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Content */}
          <View className="px-4 py-3">
            {loading && (
              <View className="items-center justify-center py-8">
                <ActivityIndicator size="small" color={colors.primary} />
                <Text className="mt-3 text-sm" style={{ color: colors.textMuted }}>
                  {language === 'es' ? 'Cargando pasaje...' : 'Loading passage...'}
                </Text>
              </View>
            )}

            {error && !loading && (
              <View className="items-center justify-center py-6">
                <Text
                  className="text-sm text-center mb-3"
                  style={{ color: colors.textMuted }}
                >
                  {error}
                </Text>
                <Pressable
                  onPress={handleRetry}
                  className="flex-row items-center px-4 py-2 rounded-lg"
                  style={{ backgroundColor: colors.primary }}
                >
                  <RefreshCw size={14} color="#FFFFFF" />
                  <Text className="ml-2 font-medium text-white text-sm">
                    {language === 'es' ? 'Reintentar' : 'Retry'}
                  </Text>
                </Pressable>
              </View>
            )}

            {passage && !loading && (
              <>
                {/* Font size controls - compact */}
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs" style={{ color: colors.textMuted }}>
                    {language === 'es' ? 'Tamaño de texto' : 'Text size'}
                  </Text>
                  <View className="flex-row items-center">
                    <Pressable
                      onPress={() => handleFontSizeChange(-1)}
                      className="w-7 h-7 rounded-md items-center justify-center"
                      style={{ backgroundColor: colors.textMuted + '15' }}
                    >
                      <Minus size={14} color={colors.textMuted} />
                    </Pressable>
                    <Text className="mx-2 text-xs w-6 text-center" style={{ color: colors.textMuted }}>
                      {fontSize}
                    </Text>
                    <Pressable
                      onPress={() => handleFontSizeChange(1)}
                      className="w-7 h-7 rounded-md items-center justify-center"
                      style={{ backgroundColor: colors.textMuted + '15' }}
                    >
                      <Plus size={14} color={colors.textMuted} />
                    </Pressable>
                  </View>
                </View>

                {/* Passage text */}
                <ScrollView
                  showsVerticalScrollIndicator={true}
                  style={{ maxHeight: SCREEN_HEIGHT * 0.35 }}
                  className="rounded-lg p-3 mb-3"
                  contentContainerStyle={{ paddingBottom: 8 }}
                >
                  <View
                    className="rounded-lg p-3"
                    style={{ backgroundColor: colors.background }}
                  >
                    <Text
                      style={{
                        color: colors.text,
                        fontSize,
                        lineHeight: fontSize * 1.5,
                      }}
                    >
                      {formatPassageText(passage.text)}
                    </Text>
                  </View>
                </ScrollView>

                {/* Action buttons - compact */}
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={handleCopy}
                    className="flex-1 flex-row items-center justify-center py-2.5 rounded-lg"
                    style={{ backgroundColor: copied ? colors.accent + '20' : colors.textMuted + '12' }}
                  >
                    <Copy size={14} color={copied ? colors.accent : colors.text} />
                    <Text
                      className="ml-1.5 font-medium text-sm"
                      style={{ color: copied ? colors.accent : colors.text }}
                    >
                      {copied
                        ? (language === 'es' ? 'Copiado' : 'Copied')
                        : (language === 'es' ? 'Copiar' : 'Copy')}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleShare}
                    className="flex-1 flex-row items-center justify-center py-2.5 rounded-lg"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <ShareIcon size={14} color="#FFFFFF" />
                    <Text className="ml-1.5 font-medium text-white text-sm">
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
  // Format verse numbers: [25] -> bold number with space
  return text
    .replace(/\[(\d+)\]/g, '$1 ') // Just the number with space
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}
