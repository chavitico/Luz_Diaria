/**
 * ThemeStressScreen — DEV-only screen to visually verify ActionButton contrast
 * on a range of challenging backgrounds.
 *
 * Renders ActionButton over:
 *  - Light surface (white)
 *  - Dark surface (near-black)
 *  - Pastel primary (yellow)
 *  - Deep primary (navy)
 *  - Gradient background
 *
 * All cases must show a readable button with visible separation.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionButton } from '@/components/ui/ActionButton';
import { contrastRatio, deriveButtonColors } from '@/lib/contrast';
import { Star, Zap, Heart } from 'lucide-react-native';

const STRESS_CASES: Array<{
  label: string;
  surface: string;
  primary: string;
  isDark: boolean;
  bg: string;
}> = [
  { label: 'Superficie blanca (light)', surface: '#FFFFFF', primary: '#E8A87C', isDark: false, bg: '#FFFFFF' },
  { label: 'Superficie oscura (dark)', surface: '#1A1A2E', primary: '#E8A87C', isDark: true, bg: '#1A1A2E' },
  { label: 'Primary amarillo pastel (light)', surface: '#FFFDE7', primary: '#FFD54F', isDark: false, bg: '#FFFDE7' },
  { label: 'Primary azul marino (dark)', surface: '#0D1B2A', primary: '#1A3A5C', isDark: true, bg: '#0D1B2A' },
  { label: 'Primary blanco puro (light)', surface: '#F5F5F5', primary: '#FAFAFA', isDark: false, bg: '#F5F5F5' },
  { label: 'Primary verde bosque (dark)', surface: '#0D1F17', primary: '#2D6A4F', isDark: true, bg: '#0D1F17' },
  { label: 'Surface = primary (imposible)', surface: '#5C6BC0', primary: '#5C6BC0', isDark: true, bg: '#5C6BC0' },
];

function ContrastBadge({ a, b }: { a: string; b: string }) {
  const ratio = contrastRatio(a, b);
  const pass = ratio >= 3.0;
  return (
    <View style={{
      backgroundColor: pass ? '#22C55E20' : '#EF444420',
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: pass ? '#22C55E50' : '#EF444450',
    }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: pass ? '#22C55E' : '#EF4444' }}>
        {ratio.toFixed(1)}:1 {pass ? '✓' : '✗'}
      </Text>
    </View>
  );
}

export default function ThemeStressScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#111' }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, paddingHorizontal: 16, gap: 16 }}
    >
      <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '800', marginBottom: 4 }}>
        ActionButton Stress Test
      </Text>
      <Text style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>
        Verifica que el botón siempre sea legible sin importar el fondo.
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Text style={{ color: '#CCC', fontSize: 13 }}>Loading:</Text>
        <Switch value={loading} onValueChange={setLoading} />
        <Text style={{ color: '#CCC', fontSize: 13, marginLeft: 12 }}>Disabled:</Text>
        <Switch value={disabled} onValueChange={setDisabled} />
      </View>

      {STRESS_CASES.map((c) => {
        const { fill, textColor } = deriveButtonColors(c.primary, c.surface, c.isDark);
        const fillVsSurface = contrastRatio(fill, c.surface);
        const textVsFill = contrastRatio(textColor, fill);

        return (
          <View key={c.label} style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 4 }}>
            <View style={{ backgroundColor: c.bg, padding: 16, gap: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: c.isDark ? '#AAA' : '#555', letterSpacing: 0.5 }}>
                {c.label.toUpperCase()}
              </Text>

              {/* Contrast metrics */}
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 10, color: c.isDark ? '#888' : '#666' }}>Fill vs surface:</Text>
                <ContrastBadge a={fill} b={c.surface} />
                <Text style={{ fontSize: 10, color: c.isDark ? '#888' : '#666', marginLeft: 8 }}>Text vs fill:</Text>
                <ContrastBadge a={textColor} b={fill} />
              </View>

              {/* Primary variant */}
              <ActionButton
                label="Acción primaria"
                icon={(color, size) => <Star size={size} color={color} />}
                surfaceColor={c.surface}
                loading={loading}
                disabled={disabled}
                onPress={() => {}}
              />

              {/* Secondary variant */}
              <ActionButton
                label="Secundario"
                variant="secondary"
                surfaceColor={c.surface}
                disabled={disabled}
                onPress={() => {}}
              />

              {/* Danger variant */}
              <ActionButton
                label="Peligro / Confirmar"
                icon={(color, size) => <Zap size={size} color={color} />}
                variant="danger"
                surfaceColor={c.surface}
                disabled={disabled}
                onPress={() => {}}
              />

              {/* Ghost */}
              <ActionButton
                label="Ghost / Más tarde"
                icon={(color, size) => <Heart size={size} color={color} />}
                variant="ghost"
                surfaceColor={c.surface}
                disabled={disabled}
                onPress={() => {}}
              />
            </View>
          </View>
        );
      })}

      {/* Gradient background test */}
      <View style={{ borderRadius: 16, overflow: 'hidden' }}>
        <LinearGradient
          colors={['#F59E0B', '#EF4444']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 16, gap: 12 }}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFF', letterSpacing: 0.5 }}>
            FONDO GRADIENTE (AMARILLO → ROJO)
          </Text>
          <ActionButton
            label="Sobre gradiente"
            surfaceColor="#F59E0B"
            disabled={disabled}
            loading={loading}
            onPress={() => {}}
          />
        </LinearGradient>
      </View>
    </ScrollView>
  );
}
