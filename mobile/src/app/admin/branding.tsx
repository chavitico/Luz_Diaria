// Admin: Branding Settings Screen
// Access: long-press app name in settings 5x, or __DEV__ build

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Palette, Save, RefreshCw, Check } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useBrandingStore, DEFAULT_BRANDING, type AppBranding, type WatermarkPosition } from '@/lib/branding-service';
import { useThemeColors } from '@/lib/store';

const WATERMARK_POSITIONS: { value: WatermarkPosition; label: string }[] = [
  { value: 'bottom-left', label: 'Abajo Izq.' },
  { value: 'bottom-right', label: 'Abajo Der.' },
  { value: 'top-left', label: 'Arriba Izq.' },
  { value: 'top-right', label: 'Arriba Der.' },
];

export default function BrandingAdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const branding = useBrandingStore(s => s.branding);
  const updateBranding = useBrandingStore(s => s.updateBranding);
  const fetchBranding = useBrandingStore(s => s.fetchBranding);

  const [appName, setAppName] = useState(branding.appName);
  const [taglineEs, setTaglineEs] = useState(branding.taglineEs);
  const [taglineEn, setTaglineEn] = useState(branding.taglineEn);
  const [watermarkEnabled, setWatermarkEnabled] = useState(branding.shareWatermarkEnabled);
  const [watermarkPos, setWatermarkPos] = useState<WatermarkPosition>(branding.shareWatermarkPosition);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchBranding();
  }, []);

  useEffect(() => {
    setAppName(branding.appName);
    setTaglineEs(branding.taglineEs);
    setTaglineEn(branding.taglineEn);
    setWatermarkEnabled(branding.shareWatermarkEnabled);
    setWatermarkPos(branding.shareWatermarkPosition);
  }, [branding]);

  const isDirty =
    appName !== branding.appName ||
    taglineEs !== branding.taglineEs ||
    taglineEn !== branding.taglineEn ||
    watermarkEnabled !== branding.shareWatermarkEnabled ||
    watermarkPos !== branding.shareWatermarkPosition;

  const handleSave = async () => {
    if (!appName.trim()) {
      Alert.alert('Error', 'El nombre de la app no puede estar vacío.');
      return;
    }
    setSaving(true);
    const ok = await updateBranding({
      appName: appName.trim(),
      taglineEs: taglineEs.trim(),
      taglineEn: taglineEn.trim(),
      shareWatermarkEnabled: watermarkEnabled,
      shareWatermarkPosition: watermarkPos,
    });
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      Alert.alert('Error', 'No se pudo guardar. Verifica la conexión.');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Restaurar defaults',
      '¿Restaurar los valores predeterminados de la marca?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: () => {
            setAppName(DEFAULT_BRANDING.appName);
            setTaglineEs(DEFAULT_BRANDING.taglineEs);
            setTaglineEn(DEFAULT_BRANDING.taglineEn);
            setWatermarkEnabled(DEFAULT_BRANDING.shareWatermarkEnabled);
            setWatermarkPos(DEFAULT_BRANDING.shareWatermarkPosition);
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: '#0A0A0F',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.08)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Palette size={22} color="#FFD700" />
          <View>
            <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>Branding</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Admin — solo uso interno</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Pressable
            onPress={handleReset}
            style={{ padding: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)' }}
          >
            <RefreshCw size={18} color="rgba(255,255,255,0.5)" />
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            style={{ padding: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)' }}
          >
            <X size={18} color="rgba(255,255,255,0.5)" />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* App Name */}
          <Animated.View entering={FadeInDown.delay(50).duration(400)}>
            <FieldLabel>Nombre de la App</FieldLabel>
            <FieldHint>Fijo, no se traduce. Aparece en todos los idiomas.</FieldHint>
            <StyledInput value={appName} onChangeText={setAppName} placeholder="Luz Diaria" />
          </Animated.View>

          {/* Tagline ES */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ marginTop: 24 }}>
            <FieldLabel>Tagline — Español</FieldLabel>
            <StyledInput
              value={taglineEs}
              onChangeText={setTaglineEs}
              placeholder="Un devocional para cada día"
            />
          </Animated.View>

          {/* Tagline EN */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={{ marginTop: 24 }}>
            <FieldLabel>Tagline — English</FieldLabel>
            <StyledInput
              value={taglineEn}
              onChangeText={setTaglineEn}
              placeholder="A devotional for every day"
            />
          </Animated.View>

          {/* Watermark toggle */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ marginTop: 28 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: 14,
                padding: 16,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <View>
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
                  Marca de agua en imágenes
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>
                  Mostrar nombre en imágenes compartidas
                </Text>
              </View>
              <Switch
                value={watermarkEnabled}
                onValueChange={setWatermarkEnabled}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#FFD700' }}
                thumbColor={watermarkEnabled ? '#fff' : '#888'}
              />
            </View>
          </Animated.View>

          {/* Watermark position */}
          {watermarkEnabled && (
            <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 16 }}>
              <FieldLabel>Posición de la marca de agua</FieldLabel>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {WATERMARK_POSITIONS.map(p => (
                  <Pressable
                    key={p.value}
                    onPress={() => setWatermarkPos(p.value)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: watermarkPos === p.value ? '#FFD700' : 'rgba(255,255,255,0.07)',
                      borderWidth: 1,
                      borderColor: watermarkPos === p.value ? '#FFD700' : 'rgba(255,255,255,0.12)',
                    }}
                  >
                    <Text
                      style={{
                        color: watermarkPos === p.value ? '#000' : 'rgba(255,255,255,0.7)',
                        fontSize: 13,
                        fontWeight: '600',
                      }}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Preview */}
          <Animated.View entering={FadeInDown.delay(250).duration(400)} style={{ marginTop: 28 }}>
            <FieldLabel>Vista previa</FieldLabel>
            <View
              style={{
                backgroundColor: '#1A1A2E',
                borderRadius: 14,
                padding: 20,
                marginTop: 8,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 20, fontWeight: '800', letterSpacing: 2 }}>
                {appName || '—'}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>
                {taglineEs || '—'}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }}>
                {taglineEn || '—'}
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save button */}
      <View
        style={{
          position: 'absolute',
          bottom: insets.bottom + 16,
          left: 20,
          right: 20,
        }}
      >
        <Pressable
          onPress={handleSave}
          disabled={saving || !isDirty}
          style={{
            backgroundColor: saved ? '#22c55e' : isDirty ? '#FFD700' : 'rgba(255,255,255,0.12)',
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? (
            <ActivityIndicator color="#000" size="small" />
          ) : saved ? (
            <Check size={18} color="#fff" />
          ) : (
            <Save size={18} color={isDirty ? '#000' : 'rgba(255,255,255,0.3)'} />
          )}
          <Text
            style={{
              color: saved ? '#fff' : isDirty ? '#000' : 'rgba(255,255,255,0.3)',
              fontSize: 16,
              fontWeight: '700',
            }}
          >
            {saving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar cambios'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
      {children}
    </Text>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 8, marginTop: -2 }}>
      {children}
    </Text>
  );
}

function StyledInput({ value, onChangeText, placeholder }: { value: string; onChangeText: (t: string) => void; placeholder?: string }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="rgba(255,255,255,0.2)"
      style={{
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: '#FFFFFF',
        fontSize: 15,
      }}
    />
  );
}
