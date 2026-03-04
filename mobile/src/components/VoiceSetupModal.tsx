/**
 * VoiceSetupModal — shown ONCE when the device doesn't have a quality Spanish voice.
 * Tells the user how to install Paulina (iOS) or a better TTS pack (Android).
 * Never blocks playback — just informs and remembers dismissal.
 *
 * Storage key: tts_voice_setup_shown_v1
 */

import React, { useEffect } from 'react';
import { View, Text, Modal, Pressable, Platform, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Volume2, ChevronRight, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const VOICE_SETUP_SHOWN_KEY = 'tts_voice_setup_shown_v1';

interface VoiceSetupModalProps {
  visible: boolean;
  language: 'en' | 'es';
  voiceName?: string;         // name of the fallback voice currently in use
  onDismiss: () => void;
  colors: {
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    primary: string;
  };
}

const IOS_STEPS_ES = [
  'Abre Ajustes en tu iPhone',
  'Ve a Accesibilidad',
  'Toca "Contenido hablado"',
  'Selecciona "Voces"',
  'Elige "Español (México)"',
  'Descarga "Paulina" o cualquier voz mejorada',
];

const ANDROID_STEPS_ES = [
  'Abre Ajustes',
  'Ve a "Gestión general" → "Idioma y entrada"',
  'Toca "Texto a voz"',
  'Descarga el motor de Google TTS con español',
  'Selecciona español como idioma preferido',
];

const IOS_STEPS_EN = [
  'Open Settings on your iPhone',
  'Go to Accessibility',
  'Tap "Spoken Content"',
  'Select "Voices"',
  'Choose "English (US)"',
  'Download "Samantha (Enhanced)" or similar',
];

const ANDROID_STEPS_EN = [
  'Open Settings',
  'Go to "General Management" → "Language & Input"',
  'Tap "Text-to-speech"',
  'Download Google TTS engine with English',
  'Set English as preferred language',
];

export function VoiceSetupModal({
  visible,
  language,
  voiceName,
  onDismiss,
  colors,
}: VoiceSetupModalProps) {
  const scale = useSharedValue(0.92);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });
      scale.value = withSpring(1, { damping: 18, stiffness: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 180 });
      scale.value = withTiming(0.95, { duration: 180 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const es = language === 'es';
  const isIOS = Platform.OS === 'ios';
  const steps = es
    ? (isIOS ? IOS_STEPS_ES : ANDROID_STEPS_ES)
    : (isIOS ? IOS_STEPS_EN : ANDROID_STEPS_EN);

  const title = es ? 'Mejorar voz de narración' : 'Improve narration voice';
  const preferredVoice = es
    ? (isIOS ? 'Paulina (español México)' : 'Google TTS español')
    : (isIOS ? 'Samantha Enhanced' : 'Google TTS English');

  const currentVoiceNote = voiceName
    ? (es
        ? `Tu dispositivo usa ahora "${voiceName}". Para una experiencia más natural, instala una voz mejorada:`
        : `Your device is using "${voiceName}". For a more natural experience, install an enhanced voice:`)
    : (es
        ? 'Tu dispositivo no tiene instalada una voz natural en español. Para mejorarla:'
        : 'Your device doesn\'t have a quality voice installed. To improve:');

  const buttonLabel = es ? 'Entendido' : 'Got it';
  const installLabel = es ? `Instalar: ${preferredVoice}` : `Install: ${preferredVoice}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
          },
          backdropStyle,
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={onDismiss} />
      </Animated.View>

      {/* Card */}
      <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 32, paddingHorizontal: 16 }}>
        <Animated.View
          style={[
            {
              backgroundColor: colors.background,
              borderRadius: 24,
              overflow: 'hidden',
              maxHeight: '80%',
            },
            cardStyle,
          ]}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.textMuted + '25',
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primary + '18',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Volume2 size={20} color={colors.primary} />
            </View>
            <Text
              style={{
                flex: 1,
                fontSize: 17,
                fontWeight: '700',
                color: colors.text,
                letterSpacing: -0.3,
              }}
            >
              {title}
            </Text>
            <Pressable onPress={onDismiss} hitSlop={12} style={{ padding: 4 }}>
              <X size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            style={{ paddingHorizontal: 20 }}
            contentContainerStyle={{ paddingBottom: 20, paddingTop: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Context message */}
            <Text
              style={{
                fontSize: 14,
                lineHeight: 21,
                color: colors.textMuted,
                marginBottom: 20,
              }}
            >
              {currentVoiceNote}
            </Text>

            {/* Preferred voice chip */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.primary + '12',
                borderRadius: 12,
                padding: 12,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: colors.primary + '30',
              }}
            >
              <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600', flex: 1 }}>
                {installLabel}
              </Text>
              <ChevronRight size={16} color={colors.primary} />
            </View>

            {/* Step-by-step instructions */}
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: colors.textMuted,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              {es ? 'Cómo instalarla' : 'How to install'}
            </Text>

            {steps.map((step, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginBottom: 10,
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: colors.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                    marginTop: 1,
                    flexShrink: 0,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: colors.primary,
                    }}
                  >
                    {i + 1}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    lineHeight: 20,
                    color: colors.text,
                    flex: 1,
                  }}
                >
                  {step}
                </Text>
              </View>
            ))}

            {/* Note: audio still works */}
            <Text
              style={{
                fontSize: 12,
                lineHeight: 18,
                color: colors.textMuted,
                marginTop: 12,
                fontStyle: 'italic',
              }}
            >
              {es
                ? 'La narración seguirá funcionando mientras tanto.'
                : 'Narration will continue working in the meantime.'}
            </Text>
          </ScrollView>

          {/* CTA button */}
          <View
            style={{
              padding: 16,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: colors.textMuted + '25',
            }}
          >
            <Pressable
              onPress={onDismiss}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.primary + 'CC' : colors.primary,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
              })}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                {buttonLabel}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
