// Unified Share Options Sheet Component
// Shows 3 share options: Paginated pages, Short Card (recommended), 5 Section Images

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
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import {
  X,
  Image as ImageIcon,
  Square,
  LayoutGrid,
  Share2,
  Star,
} from 'lucide-react-native';
import type { Devotional } from '@/lib/types';
import { WhatsAppShareCard, WHATSAPP_CARD_SIZE, PREVIEW_SIZE } from './WhatsAppShareCard';
import { ShareableDevotionalImage, type ShareableDevotionalImageRef } from './ShareableDevotionalImage';
import { ShareSectionImages } from './ShareSectionImages';

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

function ShareOptionButton({
  icon,
  title,
  description,
  badge,
  isSelected,
  onPress,
  colors,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  isSelected: boolean;
  onPress: () => void;
  colors: ShareOptionsSheetProps['colors'];
}) {
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
          width: 48, height: 48, borderRadius: 12,
          backgroundColor: isSelected ? colors.primary + '20' : colors.textMuted + '15',
          alignItems: 'center', justifyContent: 'center', marginRight: 14,
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: isSelected ? colors.primary : colors.text, marginRight: 8 }}>
            {title}
          </Text>
          {badge && (
            <View style={{ backgroundColor: '#25D366', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 13, color: colors.textMuted }} numberOfLines={2}>
          {description}
        </Text>
      </View>
      {isSelected && (
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
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

  // Refs
  const longImageRef = useRef<ShareableDevotionalImageRef>(null);
  const shortCardRef = useRef<View>(null);
  const sectionImagesRef = useRef<{ captureAll: () => Promise<string[]> }>(null);

  const shareOptions = [
    {
      id: 'short' as ShareOption,
      icon: <Square size={24} color={selectedOption === 'short' ? colors.primary : colors.textMuted} />,
      title: language === 'es' ? 'Tarjeta versículo' : 'Verse card',
      badge: language === 'es' ? '★ Recomendado' : '★ Recommended',
      description: language === 'es'
        ? 'Tarjeta cuadrada con versículo — perfecta para WhatsApp'
        : 'Square card with verse — perfect for WhatsApp',
    },
    {
      id: 'long' as ShareOption,
      icon: <ImageIcon size={24} color={selectedOption === 'long' ? colors.primary : colors.textMuted} />,
      title: language === 'es' ? 'Completo (paginado)' : 'Full (paginated)',
      badge: undefined,
      description: language === 'es'
        ? 'Todo el devocional en páginas 1080×1350 sin pixelado'
        : 'Full devotional as 1080×1350 pages without pixelation',
    },
    {
      id: 'sections' as ShareOption,
      icon: <LayoutGrid size={24} color={selectedOption === 'sections' ? colors.primary : colors.textMuted} />,
      title: language === 'es' ? '5 imágenes (secciones)' : '5 images (sections)',
      badge: undefined,
      description: language === 'es'
        ? '5 imágenes, una por sección — texto siempre completo'
        : '5 images, one per section — text always complete',
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
        setCurrentStep(language === 'es' ? 'Generando páginas...' : 'Generating pages...');
        if (!longImageRef.current) throw new Error('Long image ref not available');
        imagesToShare = await longImageRef.current.captureAll();

      } else if (selectedOption === 'short') {
        setCurrentStep(language === 'es' ? 'Generando tarjeta...' : 'Generating card...');
        if (!shortCardRef.current) throw new Error('Short card ref not available');
        const uri = await captureRef(shortCardRef, {
          format: 'png', quality: 1, result: 'tmpfile',
          width: WHATSAPP_CARD_SIZE, height: WHATSAPP_CARD_SIZE,
        });
        imagesToShare = [uri];

      } else if (selectedOption === 'sections') {
        setCurrentStep(language === 'es' ? 'Generando 5 imágenes...' : 'Generating 5 images...');
        if (!sectionImagesRef.current) throw new Error('Section images ref not available');
        imagesToShare = await sectionImagesRef.current.captureAll();
      }

      if (imagesToShare.length === 0) throw new Error('No images generated');

      setCurrentStep(language === 'es' ? 'Compartiendo...' : 'Sharing...');

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', language === 'es' ? 'Compartir no está disponible' : 'Sharing is not available');
        setIsGenerating(false);
        return;
      }

      // For 'short' option, share image (text available via generateWhatsAppText for manual paste)
      if (selectedOption === 'short') {
        await Sharing.shareAsync(imagesToShare[0], {
          mimeType: 'image/png',
          dialogTitle: language === 'es' ? 'Compartir Devocional' : 'Share Devotional',
          UTI: 'public.image',
        });
      } else if (imagesToShare.length === 1) {
        await Sharing.shareAsync(imagesToShare[0], {
          mimeType: 'image/png',
          dialogTitle: language === 'es' ? 'Compartir Devocional' : 'Share Devotional',
        });
      } else {
        // Multiple images — share sequentially
        for (let i = 0; i < imagesToShare.length; i++) {
          await Sharing.shareAsync(imagesToShare[i], {
            mimeType: 'image/png',
            dialogTitle: language === 'es'
              ? `Compartir Devocional (${i + 1}/${imagesToShare.length})`
              : `Share Devotional (${i + 1}/${imagesToShare.length})`,
          });
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onShareComplete?.(selectedOption);
      onClose();

    } catch (error) {
      console.error('[Share] Error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', language === 'es' ? 'No se pudo compartir' : 'Could not share');
    } finally {
      setIsGenerating(false);
      setCurrentStep('');
    }
  }, [devotional, selectedOption, language, onShareComplete, onClose]);

  if (!devotional) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)' }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: 16,
        }}>
          <Pressable onPress={onClose} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
            <X size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>
            {language === 'es' ? 'Compartir Devocional' : 'Share Devotional'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Options + Preview */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 16 }}>
            {language === 'es' ? 'Selecciona el formato para compartir:' : 'Select the format to share:'}
          </Text>

          {shareOptions.map((option) => (
            <ShareOptionButton
              key={option.id}
              icon={option.icon}
              title={option.title}
              description={option.description}
              badge={option.badge}
              isSelected={selectedOption === option.id}
              onPress={() => handleSelectOption(option.id)}
              colors={colors}
            />
          ))}

          {/* WhatsApp tip for short option */}
          {selectedOption === 'short' && (
            <View style={{ backgroundColor: '#25D36620', borderRadius: 12, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
              <Star size={14} color="#25D366" />
              <Text style={{ color: '#25D366', fontSize: 12, fontWeight: '600', marginLeft: 8, flex: 1 }}>
                {language === 'es'
                  ? 'También se copiará el texto del devocional para pegar en WhatsApp'
                  : 'The devotional text will also be ready to paste in WhatsApp'}
              </Text>
            </View>
          )}

          {/* Preview */}
          <View style={{ marginTop: 4 }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 12 }}>
              {language === 'es' ? 'Vista previa:' : 'Preview:'}
            </Text>

            <View style={{ alignItems: 'center' }}>
              {/* Offscreen captures — always mounted */}
              <View style={{ position: 'absolute', opacity: 0, left: -9999 }}>
                {/* Paginated long image (offscreen) */}
                <ShareableDevotionalImage
                  ref={longImageRef}
                  devotional={devotional}
                  language={language}
                  colors={colors}
                  translations={translations}
                />
                {/* Sections offscreen (when not in preview mode) */}
                {selectedOption !== 'sections' && (
                  <ShareSectionImages
                    ref={sectionImagesRef}
                    devotional={devotional}
                    language={language}
                    colors={colors}
                    translations={translations}
                  />
                )}
              </View>

              {/* Short card preview */}
              {selectedOption === 'short' && (
                <WhatsAppShareCard
                  ref={shortCardRef as any}
                  devotional={devotional}
                  language={language}
                  size={PREVIEW_SIZE}
                />
              )}

              {/* Paginated preview */}
              {selectedOption === 'long' && (
                <ShareableDevotionalImage
                  devotional={devotional}
                  language={language}
                  colors={colors}
                  translations={translations}
                  previewMode
                />
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

            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', marginTop: 12 }}>
              {selectedOption === 'long'
                ? (language === 'es' ? `Se compartirán ${1 + Math.ceil(5 / 2)} páginas en alta resolución` : `Will share pages in high resolution`)
                : (language === 'es' ? 'Se compartirá en alta calidad' : 'Will share in high quality')}
            </Text>
          </View>
        </ScrollView>

        {/* Share Button */}
        <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 20, paddingTop: 16, backgroundColor: 'rgba(0,0,0,0.9)' }}>
          <Pressable
            onPress={handleShare}
            disabled={isGenerating}
            style={{
              backgroundColor: '#25D366', borderRadius: 16, paddingVertical: 16,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              opacity: isGenerating ? 0.7 : 1,
            }}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 10 }}>{currentStep}</Text>
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
