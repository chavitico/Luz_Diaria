// Unified Share Options Sheet Component
// Shows 3 share options: Long Image, Short Card, 5 Section Images

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import {
  X,
  Image as ImageIcon,
  Square,
  LayoutGrid,
  Share2,
} from 'lucide-react-native';
import type { Devotional } from '@/lib/types';
import { WhatsAppShareCard, WHATSAPP_CARD_SIZE, PREVIEW_SIZE, generateWhatsAppText } from './WhatsAppShareCard';
import { ShareableDevotionalImage, CAPTURE_SCALE } from './ShareableDevotionalImage';
import { ShareSectionImages, SECTION_IMAGE_SIZE, SECTION_PREVIEW_SIZE } from './ShareSectionImages';

export type ShareOption = 'long' | 'short' | 'sections';

interface ShareOptionsSheetProps {
  visible: boolean;
  onClose: () => void;
  devotional: Devotional | null;
  language: 'en' | 'es';
  colors: {
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    primary: string;
    secondary: string;
    accent: string;
  };
  translations: {
    bible_verse: string;
    reflection: string;
    story: string;
    biblical_character: string;
    application: string;
    prayer: string;
  };
  onShareComplete?: (option: ShareOption) => void;
}

interface ShareOptionButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
  colors: ShareOptionsSheetProps['colors'];
}

function ShareOptionButton({
  icon,
  title,
  description,
  isSelected,
  onPress,
  colors,
}: ShareOptionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: isSelected ? colors.primary + '15' : colors.surface,
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? colors.primary : colors.textMuted + '30',
        marginBottom: 12,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: isSelected ? colors.primary + '20' : colors.textMuted + '15',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: isSelected ? colors.primary : colors.text,
            marginBottom: 2,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: colors.textMuted,
          }}
          numberOfLines={2}
        >
          {description}
        </Text>
      </View>
      {isSelected && (
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>✓</Text>
        </View>
      )}
    </Pressable>
  );
}

export function ShareOptionsSheet({
  visible,
  onClose,
  devotional,
  language,
  colors,
  translations,
  onShareComplete,
}: ShareOptionsSheetProps) {
  const insets = useSafeAreaInsets();
  const [selectedOption, setSelectedOption] = useState<ShareOption>('short');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState('');

  // Refs for capturing images
  const longImageRef = useRef<View>(null);
  const shortCardRef = useRef<View>(null);
  const sectionImagesRef = useRef<{ captureAll: () => Promise<string[]> }>(null);

  const shareOptions = [
    {
      id: 'long' as ShareOption,
      icon: <ImageIcon size={24} color={selectedOption === 'long' ? colors.primary : colors.textMuted} />,
      title: language === 'es' ? 'Imagen completa (larga)' : 'Full image (long)',
      description: language === 'es'
        ? 'Exporta todo el devocional como una imagen larga'
        : 'Exports the full devotional as a long image',
    },
    {
      id: 'short' as ShareOption,
      icon: <Square size={24} color={selectedOption === 'short' ? colors.primary : colors.textMuted} />,
      title: language === 'es' ? 'Imagen corta (versículo)' : 'Short card (verse)',
      description: language === 'es'
        ? 'Una tarjeta cuadrada con versículo e idea del día'
        : 'A square card with verse and thought of the day',
    },
    {
      id: 'sections' as ShareOption,
      icon: <LayoutGrid size={24} color={selectedOption === 'sections' ? colors.primary : colors.textMuted} />,
      title: language === 'es' ? '5 imágenes (secciones)' : '5 images (sections)',
      description: language === 'es'
        ? 'Genera 5 imágenes, una por cada sección del devocional'
        : 'Generates 5 images, one for each devotional section',
    },
  ];

  const handleSelectOption = (option: ShareOption) => {
    setSelectedOption(option);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleShare = useCallback(async () => {
    if (!devotional) return;

    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let imagesToShare: string[] = [];

      if (selectedOption === 'long') {
        setCurrentStep(language === 'es' ? 'Generando imagen...' : 'Generating image...');

        if (!longImageRef.current) {
          throw new Error('Long image ref not available');
        }

        const uri = await captureRef(longImageRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });
        imagesToShare = [uri];

      } else if (selectedOption === 'short') {
        setCurrentStep(language === 'es' ? 'Generando tarjeta...' : 'Generating card...');

        if (!shortCardRef.current) {
          throw new Error('Short card ref not available');
        }

        const uri = await captureRef(shortCardRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
          width: WHATSAPP_CARD_SIZE,
          height: WHATSAPP_CARD_SIZE,
        });
        imagesToShare = [uri];

      } else if (selectedOption === 'sections') {
        setCurrentStep(language === 'es' ? 'Generando 5 imágenes...' : 'Generating 5 images...');

        if (!sectionImagesRef.current) {
          throw new Error('Section images ref not available');
        }

        imagesToShare = await sectionImagesRef.current.captureAll();
      }

      if (imagesToShare.length === 0) {
        throw new Error('No images generated');
      }

      setCurrentStep(language === 'es' ? 'Compartiendo...' : 'Sharing...');

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          language === 'es' ? 'Error' : 'Error',
          language === 'es' ? 'Compartir no está disponible' : 'Sharing is not available'
        );
        setIsGenerating(false);
        return;
      }

      // Share images
      if (imagesToShare.length === 1) {
        await Sharing.shareAsync(imagesToShare[0], {
          mimeType: 'image/png',
          dialogTitle: language === 'es' ? 'Compartir Devocional' : 'Share Devotional',
        });
      } else {
        // For multiple images, share them one by one or show alert
        // iOS/Android share sheets handle single images better
        // We'll share the first image and let user know about the rest
        await Sharing.shareAsync(imagesToShare[0], {
          mimeType: 'image/png',
          dialogTitle: language === 'es' ? 'Compartir Devocional (1/5)' : 'Share Devotional (1/5)',
        });

        // After first share, offer to share remaining images
        if (imagesToShare.length > 1) {
          for (let i = 1; i < imagesToShare.length; i++) {
            await Sharing.shareAsync(imagesToShare[i], {
              mimeType: 'image/png',
              dialogTitle: language === 'es'
                ? `Compartir Devocional (${i + 1}/${imagesToShare.length})`
                : `Share Devotional (${i + 1}/${imagesToShare.length})`,
            });
          }
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onShareComplete?.(selectedOption);
      onClose();

    } catch (error) {
      console.error('[Share] Error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es' ? 'No se pudo compartir' : 'Could not share'
      );
    } finally {
      setIsGenerating(false);
      setCurrentStep('');
    }
  }, [devotional, selectedOption, language, onShareComplete, onClose]);

  if (!devotional) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.85)',
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: insets.top + 10,
            paddingHorizontal: 20,
            paddingBottom: 16,
          }}
        >
          <Pressable
            onPress={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>
            {language === 'es' ? 'Compartir Devocional' : 'Share Devotional'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Options */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 20,
          }}
        >
          <Text
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            {language === 'es'
              ? 'Selecciona el formato para compartir:'
              : 'Select the format to share:'}
          </Text>

          {shareOptions.map((option) => (
            <ShareOptionButton
              key={option.id}
              icon={option.icon}
              title={option.title}
              description={option.description}
              isSelected={selectedOption === option.id}
              onPress={() => handleSelectOption(option.id)}
              colors={colors}
            />
          ))}

          {/* Preview area */}
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 14,
                marginBottom: 12,
              }}
            >
              {language === 'es' ? 'Vista previa:' : 'Preview:'}
            </Text>

            <View style={{ alignItems: 'center' }}>
              {/* Offscreen capture components */}
              <View style={{ position: 'absolute', opacity: 0, left: -9999 }}>
                {/* Long image (offscreen) */}
                <ViewShot ref={longImageRef as any}>
                  <ShareableDevotionalImage
                    devotional={devotional}
                    language={language}
                    colors={colors}
                    translations={translations}
                  />
                </ViewShot>
              </View>

              {/* Short card preview (visible when selected) */}
              {selectedOption === 'short' && (
                <ViewShot
                  ref={shortCardRef as any}
                  options={{
                    format: 'png',
                    quality: 1,
                    width: WHATSAPP_CARD_SIZE,
                    height: WHATSAPP_CARD_SIZE,
                  }}
                >
                  <WhatsAppShareCard
                    devotional={devotional}
                    language={language}
                    size={PREVIEW_SIZE}
                  />
                </ViewShot>
              )}

              {/* Long image preview */}
              {selectedOption === 'long' && (
                <ScrollView
                  style={{ maxHeight: 400 }}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={{ transform: [{ scale: 0.5 }], transformOrigin: 'top center' }}>
                    <ShareableDevotionalImage
                      devotional={devotional}
                      language={language}
                      colors={colors}
                      translations={translations}
                    />
                  </View>
                </ScrollView>
              )}

              {/* Section images preview */}
              {selectedOption === 'sections' && (
                <ShareSectionImages
                  ref={sectionImagesRef}
                  devotional={devotional}
                  language={language}
                  colors={colors}
                  translations={translations}
                  previewMode
                />
              )}
            </View>

            <Text
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 12,
                textAlign: 'center',
                marginTop: 12,
              }}
            >
              {language === 'es'
                ? 'Se compartirá en alta calidad'
                : 'Will share in high quality'}
            </Text>
          </View>
        </ScrollView>

        {/* Share Button */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 20,
            paddingTop: 16,
            backgroundColor: 'rgba(0,0,0,0.9)',
          }}
        >
          <Pressable
            onPress={handleShare}
            disabled={isGenerating}
            style={{
              backgroundColor: '#25D366',
              borderRadius: 16,
              paddingVertical: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isGenerating ? 0.7 : 1,
            }}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 10 }}>
                  {currentStep}
                </Text>
              </>
            ) : (
              <>
                <Share2 size={20} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 10 }}>
                  {language === 'es' ? 'Compartir' : 'Share'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
