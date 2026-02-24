// ShareOptionsSheet — unified single-card share experience
// Shows only the DevotionalShareCard (same as Home), no multi-option selector.
// The "long" and "sections" options have been removed for consistency.

import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
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
  PREVIEW_HEIGHT,
} from './DevotionalShareCard';

export type ShareOption = 'short';

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

export function ShareOptionsSheet({
  visible,
  onClose,
  devotional,
  language,
  colors,
  onShareComplete,
}: ShareOptionsSheetProps) {
  const insets = useSafeAreaInsets();
  const [isGenerating, setIsGenerating] = useState(false);

  // Offscreen high-res card ref for capture
  const captureCardRef = useRef<View>(null);

  const handleShare = useCallback(async () => {
    if (!devotional) return;
    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (!captureCardRef.current) throw new Error('Card ref not available');

      const uri = await captureRef(captureCardRef, {
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
          language === 'es' ? 'Compartir no está disponible' : 'Sharing is not available'
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
      onShareComplete?.('short');
      onClose();
    } catch (error) {
      console.error('[ShareOptionsSheet] Error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error',
        language === 'es' ? 'No se pudo compartir' : 'Could not share'
      );
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
            paddingTop: insets.top + 10,
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

        {/* Preview */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center' }}
        >
          <Text
            style={{
              color: 'rgba(255,255,255,0.60)',
              fontSize: 13,
              marginBottom: 16,
              alignSelf: 'flex-start',
            }}
          >
            {language === 'es' ? 'Vista previa:' : 'Preview:'}
          </Text>

          {/* Visible preview card */}
          <DevotionalShareCard
            devotional={devotional}
            language={language}
            displayWidth={PREVIEW_WIDTH}
          />

          {/* Offscreen full-res card for capture */}
          <View style={{ position: 'absolute', opacity: 0, left: -9999, top: 0 }}>
            <DevotionalShareCard
              ref={captureCardRef}
              devotional={devotional}
              language={language}
              displayWidth={CARD_WIDTH}
            />
          </View>

          <Text
            style={{
              color: 'rgba(255,255,255,0.40)',
              fontSize: 12,
              textAlign: 'center',
              marginTop: 12,
              fontStyle: 'italic',
            }}
          >
            {language === 'es'
              ? 'Se compartirá en alta resolución (1080×1350)'
              : 'Will share in high resolution (1080×1350)'}
          </Text>
        </ScrollView>

        {/* Share button */}
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
                  {language === 'es' ? 'Generando...' : 'Generating...'}
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
