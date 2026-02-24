// ShareSheet — single-image devotional share
// One card, zero options, zero risk of text cutting.

import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { X, Share2 } from 'lucide-react-native';
import type { Devotional } from '@/lib/types';
import {
  DevotionalShareCard,
  CARD_WIDTH,
  CARD_HEIGHT,
  PREVIEW_WIDTH,
} from './DevotionalShareCard';

interface ShareSheetProps {
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
  onShareComplete?: () => void;
}

export function ShareSheet({
  visible,
  onClose,
  devotional,
  language,
  colors,
  onShareComplete,
}: ShareSheetProps) {
  const insets = useSafeAreaInsets();
  const cardRef = useRef<View>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleShare = useCallback(async () => {
    if (!devotional || !cardRef.current) return;

    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Capture at full 1080×1350 resolution
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          'Error',
          language === 'es' ? 'Compartir no disponible en este dispositivo' : 'Sharing is not available on this device'
        );
        setIsGenerating(false);
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: language === 'es' ? 'Compartir Devocional' : 'Share Devotional',
        UTI: 'public.image',
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onShareComplete?.();
      onClose();
    } catch (error) {
      console.error('[ShareSheet] Error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', language === 'es' ? 'No se pudo generar la imagen' : 'Could not generate image');
    } finally {
      setIsGenerating(false);
    }
  }, [devotional, language, onShareComplete, onClose]);

  if (!devotional) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.88)' }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: insets.top + 12,
            paddingHorizontal: 20,
            paddingBottom: 16,
          }}
        >
          <Pressable
            onPress={onClose}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>
            {language === 'es' ? 'Compartir' : 'Share'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Card preview — centered */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          {/* Offscreen capture target at full resolution */}
          <View style={{ position: 'absolute', left: -9999, top: -9999 }}>
            <DevotionalShareCard
              ref={cardRef}
              devotional={devotional}
              language={language}
              displayWidth={CARD_WIDTH}
            />
          </View>

          {/* Visible preview */}
          <DevotionalShareCard
            devotional={devotional}
            language={language}
            displayWidth={PREVIEW_WIDTH}
          />

          <Text
            style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: 12,
              marginTop: 14,
              textAlign: 'center',
            }}
          >
            {language === 'es'
              ? 'Se guardará en alta resolución (1080×1350)'
              : 'Saved at full resolution (1080×1350)'}
          </Text>
        </View>

        {/* Share button */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: insets.bottom + 24,
            backgroundColor: 'rgba(0,0,0,0.92)',
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
                  {language === 'es' ? 'Generando...' : 'Generating...'}
                </Text>
              </>
            ) : (
              <>
                <Share2 size={20} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 10 }}>
                  {language === 'es' ? 'Compartir imagen' : 'Share image'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
