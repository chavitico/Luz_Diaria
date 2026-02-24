/**
 * LogoPreview Screen
 * Shows all logo variants: color, white, icon-only
 * Access: navigate to /logo-preview (for admin/design review only)
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import Svg, {
  Rect,
  Circle,
  Ellipse,
  Path,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Stop,
  G,
  Filter,
  FeGaussianBlur,
  FeMerge,
  FeMergeNode,
} from 'react-native-svg';

// ─────────────────────────────────────────────
// Sub-components: the actual logo shapes
// ─────────────────────────────────────────────

/** Color icon (sendero + luz dorada) */
function LuzDiariaIcon({ size = 140 }: { size?: number }) {
  const s = size / 140; // scale factor
  return (
    <Svg width={size} height={size} viewBox="0 0 140 140">
      <Defs>
        {/* Background */}
        <SvgLinearGradient id="bgG" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#EAF3EE" />
          <Stop offset="1" stopColor="#F7F4EE" />
        </SvgLinearGradient>
        {/* Path gradient */}
        <SvgLinearGradient id="pgG" x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor="#4A7D5E" />
          <Stop offset="1" stopColor="#7BAE8A" />
        </SvgLinearGradient>
        {/* Golden burst */}
        <RadialGradient id="gbG" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor="#FFF4C2" stopOpacity={1} />
          <Stop offset="0.4" stopColor="#F5D77A" stopOpacity={0.9} />
          <Stop offset="1" stopColor="#E8B84B" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* Background rounded square */}
      <Rect x={0} y={0} width={140} height={140} rx={30} ry={30} fill="url(#bgG)" />

      {/* Sky atmosphere */}
      <Rect x={0} y={0} width={140} height={84} rx={0} fill="#D6EDE0" fillOpacity={0.25} />

      {/* Horizon */}
      <Line x1={12} y1={84} x2={128} y2={84} stroke="#C8DDD0" strokeWidth={1} opacity={0.7} />

      {/* Ground */}
      <Path
        d="M 12 84 Q 70 78 128 84 L 128 132 L 12 132 Z"
        fill="#C8E0CE"
        fillOpacity={0.25}
      />

      {/* Light burst (golden radial) */}
      <Ellipse cx={70} cy={84} rx={36} ry={18} fill="url(#gbG)" fillOpacity={0.7} />
      <Ellipse cx={70} cy={84} rx={14} ry={7} fill="#F5D77A" fillOpacity={0.6} />

      {/* Rays */}
      <G opacity={0.3} stroke="#E8B84B" strokeWidth={1} strokeLinecap="round">
        <Line x1={70} y1={84} x2={70} y2={48} />
        <Line x1={70} y1={84} x2={88} y2={52} />
        <Line x1={70} y1={84} x2={52} y2={52} />
        <Line x1={70} y1={84} x2={104} y2={62} />
        <Line x1={70} y1={84} x2={36} y2={62} />
      </G>

      {/* Path (road) fill */}
      <Path
        d="M 16 134 C 28 118 44 102 70 84 C 96 102 112 118 124 134 Z"
        fill="#5A8F6F"
        fillOpacity={0.12}
      />

      {/* Left edge */}
      <Path
        d="M 16 134 C 28 118 44 102 70 84"
        fill="none"
        stroke="url(#pgG)"
        strokeWidth={5}
        strokeLinecap="round"
      />

      {/* Right edge */}
      <Path
        d="M 124 134 C 112 118 96 102 70 84"
        fill="none"
        stroke="url(#pgG)"
        strokeWidth={5}
        strokeLinecap="round"
      />

      {/* Core light */}
      <Circle cx={70} cy={84} r={7} fill="#F5D77A" fillOpacity={0.7} />
      <Circle cx={70} cy={84} r={4} fill="#F5D77A" />
      <Circle cx={70} cy={84} r={2} fill="#FFFBE0" />
      <Circle cx={68} cy={82} r={1} fill="#FFFFFF" fillOpacity={0.9} />
    </Svg>
  );
}

/** White icon (for dark backgrounds) */
function LuzDiariaIconWhite({ size = 140 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 140 140">
      <Defs>
        <RadialGradient id="wgG" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* Horizon */}
      <Line x1={12} y1={84} x2={128} y2={84} stroke="#FFFFFF" strokeWidth={1} opacity={0.45} />

      {/* Light halo */}
      <Ellipse cx={70} cy={84} rx={34} ry={17} fill="url(#wgG)" fillOpacity={0.55} />

      {/* Rays */}
      <G opacity={0.45} stroke="#FFFFFF" strokeWidth={1} strokeLinecap="round">
        <Line x1={70} y1={84} x2={70} y2={50} />
        <Line x1={70} y1={84} x2={88} y2={54} />
        <Line x1={70} y1={84} x2={52} y2={54} />
        <Line x1={70} y1={84} x2={104} y2={64} />
        <Line x1={70} y1={84} x2={36} y2={64} />
      </G>

      {/* Path fill */}
      <Path
        d="M 16 134 C 28 118 44 102 70 84 C 96 102 112 118 124 134 Z"
        fill="#FFFFFF"
        fillOpacity={0.1}
      />

      {/* Left edge */}
      <Path
        d="M 16 134 C 28 118 44 102 70 84"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={5}
        strokeLinecap="round"
        strokeOpacity={0.95}
      />

      {/* Right edge */}
      <Path
        d="M 124 134 C 112 118 96 102 70 84"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={5}
        strokeLinecap="round"
        strokeOpacity={0.95}
      />

      {/* Core light */}
      <Circle cx={70} cy={84} r={7} fill="#FFFFFF" fillOpacity={0.5} />
      <Circle cx={70} cy={84} r={4} fill="#FFFFFF" fillOpacity={0.95} />
      <Circle cx={70} cy={84} r={2} fill="#FFFFFF" />
    </Svg>
  );
}

/** Full color logotype (icon + text side by side) */
function LuzDiariaLogotype({ scale = 1 }: { scale?: number }) {
  const iconSize = Math.round(100 * scale);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 * scale }}>
      <LuzDiariaIcon size={iconSize} />
      <View>
        <Text
          style={{
            fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
            fontSize: 38 * scale,
            fontWeight: '600',
            color: '#2D4A38',
            letterSpacing: -1,
            lineHeight: 44 * scale,
          }}
        >
          Luz Diaria
        </Text>
        <Text
          style={{
            fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
            fontSize: 11 * scale,
            fontWeight: '400',
            color: '#7BAE8A',
            letterSpacing: 2.5 * scale,
            marginTop: 2 * scale,
          }}
        >
          UN DEVOCIONAL PARA CADA DÍA
        </Text>
      </View>
    </View>
  );
}

/** Full white logotype (for dark/image backgrounds) */
function LuzDiariaLogotypeWhite({ scale = 1 }: { scale?: number }) {
  const iconSize = Math.round(100 * scale);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 * scale }}>
      <LuzDiariaIconWhite size={iconSize} />
      <View>
        <Text
          style={{
            fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
            fontSize: 38 * scale,
            fontWeight: '600',
            color: '#FFFFFF',
            letterSpacing: -1,
            lineHeight: 44 * scale,
          }}
        >
          Luz Diaria
        </Text>
        <Text
          style={{
            fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
            fontSize: 11 * scale,
            fontWeight: '400',
            color: 'rgba(255,255,255,0.72)',
            letterSpacing: 2.5 * scale,
            marginTop: 2 * scale,
          }}
        >
          UN DEVOCIONAL PARA CADA DÍA
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Section card component
// ─────────────────────────────────────────────
function Section({
  label,
  sublabel,
  children,
  bg,
}: {
  label: string;
  sublabel?: string;
  children: React.ReactNode;
  bg?: string;
}) {
  return (
    <View style={{ marginBottom: 28 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          color: '#8C9EAB',
          letterSpacing: 1.8,
          marginBottom: 4,
          marginLeft: 2,
        }}
      >
        {label}
      </Text>
      {sublabel && (
        <Text
          style={{
            fontSize: 12,
            color: '#ABBBC6',
            marginBottom: 10,
            marginLeft: 2,
          }}
        >
          {sublabel}
        </Text>
      )}
      <View
        style={{
          backgroundColor: bg ?? '#FFFFFF',
          borderRadius: 20,
          padding: 28,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        {children}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// App icon preview (rounded square like home screen)
// ─────────────────────────────────────────────
function AppIconPreview() {
  return (
    <View
      style={{
        width: 180,
        height: 180,
        borderRadius: 40,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 10,
      }}
    >
      <LuzDiariaIcon size={180} />
    </View>
  );
}

// ─────────────────────────────────────────────
// Color palette chip
// ─────────────────────────────────────────────
function ColorChip({ hex, name }: { hex: string; name: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: hex,
          shadowColor: hex,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 4,
        }}
      />
      <Text style={{ fontSize: 9, color: '#8A9BA8', letterSpacing: 0.3, textAlign: 'center' }}>
        {hex}
      </Text>
      <Text style={{ fontSize: 10, color: '#4A5568', fontWeight: '500', textAlign: 'center' }}>
        {name}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function LogoPreviewScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F7F5' }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: '#E8EDEA',
          backgroundColor: '#FFFFFF',
        }}
      >
        <View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1C2B22', letterSpacing: -0.4 }}>
            Identidad Visual
          </Text>
          <Text style={{ fontSize: 12, color: '#7BAE8A', marginTop: 1 }}>Luz Diaria</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#F0F4F2',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} color="#4A7D5E" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ─── 1. App Icon (full color) ─── */}
        <Section
          label="ÍCONO DE APP"
          sublabel="Versión color para App Store / Home Screen"
        >
          <AppIconPreview />
        </Section>

        {/* ─── 2. Logotipo a color (isotipo + logotipo) ─── */}
        <Section
          label="LOGOTIPO A COLOR"
          sublabel="Isotipo + tipografía sobre fondo claro"
        >
          <LuzDiariaLogotype scale={0.85} />
        </Section>

        {/* ─── 3. Versión blanca sobre fondo verde ─── */}
        <Section
          label="VERSIÓN BLANCA"
          sublabel="Para usar sobre imágenes, gradientes, fondos oscuros"
          bg="#2D4A38"
        >
          <LuzDiariaLogotypeWhite scale={0.85} />
        </Section>

        {/* ─── 4. Versión blanca sobre imagen de naturaleza (simulada con gradient) ─── */}
        <Section
          label="VERSIÓN BLANCA SOBRE IMAGEN"
          sublabel="Preview sobre fondo tipo devotional"
        >
          <View style={{ borderRadius: 14, overflow: 'hidden', width: '100%' }}>
            <LinearGradient
              colors={['#3D6B4F', '#5A8F6F', '#8AB89A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 32, alignItems: 'center' }}
            >
              <LuzDiariaLogotypeWhite scale={0.78} />
            </LinearGradient>
          </View>
        </Section>

        {/* ─── 5. Ícono solo en varios tamaños ─── */}
        <Section
          label="ÍCONO SOLO — MÚLTIPLES TAMAÑOS"
          sublabel="Legibilidad en diferentes resoluciones"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <View style={{ alignItems: 'center', gap: 8 }}>
              <LuzDiariaIcon size={88} />
              <Text style={{ fontSize: 10, color: '#9BB0A8' }}>88px</Text>
            </View>
            <View style={{ alignItems: 'center', gap: 8 }}>
              <LuzDiariaIcon size={60} />
              <Text style={{ fontSize: 10, color: '#9BB0A8' }}>60px</Text>
            </View>
            <View style={{ alignItems: 'center', gap: 8 }}>
              <LuzDiariaIcon size={44} />
              <Text style={{ fontSize: 10, color: '#9BB0A8' }}>44px</Text>
            </View>
            <View style={{ alignItems: 'center', gap: 8 }}>
              <LuzDiariaIcon size={32} />
              <Text style={{ fontSize: 10, color: '#9BB0A8' }}>32px</Text>
            </View>
          </View>
        </Section>

        {/* ─── 6. Paleta de colores ─── */}
        <Section
          label="PALETA DE COLORES"
          sublabel="Identidad cromática de la marca"
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
            <ColorChip hex="#2D4A38" name="Verde Oscuro" />
            <ColorChip hex="#4A7D5E" name="Verde Principal" />
            <ColorChip hex="#7BAE8A" name="Verde Claro" />
            <ColorChip hex="#C8E0CE" name="Verde Suave" />
            <ColorChip hex="#F5D77A" name="Dorado Cálido" />
            <ColorChip hex="#E8B84B" name="Ámbar" />
            <ColorChip hex="#EAF3EE" name="Fondo Claro" />
          </View>
        </Section>

        {/* ─── 7. Solo icono blanco (para uso en nav, share, splash) ─── */}
        <Section
          label="ÍCONO BLANCO"
          sublabel="Para navigation bars, splash screens, contenido compartido"
          bg="#4A7D5E"
        >
          <LuzDiariaIconWhite size={100} />
        </Section>

        {/* ─── 8. Splash preview (fullscreen simulation) ─── */}
        <View style={{ marginBottom: 28 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: '#8C9EAB',
              letterSpacing: 1.8,
              marginBottom: 4,
              marginLeft: 2,
            }}
          >
            SPLASH SCREEN (PREVIEW)
          </Text>
          <Text style={{ fontSize: 12, color: '#ABBBC6', marginBottom: 10, marginLeft: 2 }}>
            Simulación de pantalla de carga
          </Text>
          <View
            style={{
              borderRadius: 28,
              overflow: 'hidden',
              height: 340,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
              elevation: 6,
            }}
          >
            <LinearGradient
              colors={['#EAF3EE', '#F2EFE6', '#EDE3CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 24,
              }}
            >
              <LuzDiariaIcon size={120} />
              <View style={{ alignItems: 'center', gap: 6 }}>
                <Text
                  style={{
                    fontSize: 32,
                    fontWeight: '600',
                    color: '#2D4A38',
                    letterSpacing: -0.8,
                  }}
                >
                  Luz Diaria
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: '#7BAE8A',
                    letterSpacing: 2,
                    fontWeight: '400',
                  }}
                >
                  UN DEVOCIONAL PARA CADA DÍA
                </Text>
              </View>
            </LinearGradient>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
