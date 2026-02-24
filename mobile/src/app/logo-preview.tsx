/**
 * LogoPreview Screen
 * Shows all logo variants: color, white, icon-only
 * Access: navigate to /logo-preview (for admin/design review only)
 * v2: llama espiritual + sendero asimétrico + cruz negativa
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
// Core flame path helpers (scaled to viewBox 140×140)
// Flame base at y=86, tip at y≈17
// ─────────────────────────────────────────────

/** Color icon (llama espiritual + sendero asimétrico) */
function LuzDiariaIcon({ size = 140 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 140 140">
      <Defs>
        {/* Background */}
        <SvgLinearGradient id="bgG2" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#EAF3EE" />
          <Stop offset="1" stopColor="#F7F4EE" />
        </SvgLinearGradient>
        {/* Path gradient */}
        <SvgLinearGradient id="pgG2" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#4A7D5E" />
          <Stop offset="1" stopColor="#7BAE8A" />
        </SvgLinearGradient>
        {/* Flame gradient — amber base → bright tip */}
        <SvgLinearGradient id="flameG2" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#E8A020" stopOpacity={1} />
          <Stop offset="0.4" stopColor="#F5C842" stopOpacity={1} />
          <Stop offset="0.75" stopColor="#FFF0A0" stopOpacity={0.95} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.65} />
        </SvgLinearGradient>
        {/* Flame core gradient */}
        <SvgLinearGradient id="flameCoreG2" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#FFD84A" />
          <Stop offset="0.55" stopColor="#FFFBE0" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.9} />
        </SvgLinearGradient>
        {/* Flame outer glow radial */}
        <RadialGradient id="flameGlowG2" cx="50%" cy="70%" rx="50%" ry="50%">
          <Stop offset="0" stopColor="#F5D77A" stopOpacity={0.85} />
          <Stop offset="1" stopColor="#E8B84B" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* Background rounded square */}
      <Rect x={0} y={0} width={140} height={140} rx={30} ry={30} fill="url(#bgG2)" />

      {/* Sky atmosphere */}
      <Rect x={0} y={0} width={140} height={86} rx={0} fill="#D6EDE0" fillOpacity={0.22} />

      {/* Horizon */}
      <Line x1={12} y1={86} x2={128} y2={86} stroke="#C8DDD0" strokeWidth={1} opacity={0.6} />

      {/* Ground */}
      <Path
        d="M 12 86 Q 70 80 128 86 L 128 134 L 12 134 Z"
        fill="#C8E0CE"
        fillOpacity={0.20}
      />

      {/* Outer flame glow halo */}
      <Ellipse cx={70} cy={72} rx={22} ry={26} fill="url(#flameGlowG2)" fillOpacity={0.55} />

      {/* PATH fill (between edges) */}
      <Path
        d="M 14 136 C 26 122 42 106 69 86 C 96 106 112 122 124 136 Z"
        fill="#5A8F6F"
        fillOpacity={0.11}
      />

      {/* Left path edge — asymmetric start (x=14) */}
      <Path
        d="M 14 136 C 26 122 42 106 69 86"
        fill="none"
        stroke="url(#pgG2)"
        strokeWidth={5}
        strokeLinecap="round"
      />

      {/* Right path edge — slight asymmetry (x=124, converges at x=71) */}
      <Path
        d="M 124 136 C 112 122 96 106 71 86"
        fill="none"
        stroke="url(#pgG2)"
        strokeWidth={5}
        strokeLinecap="round"
      />

      {/* FLAME — outer shape */}
      <Path
        d="M 70 86
           C 59 80 53 68 54 57
           C 55 46 61 39 65 31
           C 67 26 69 21 70 17
           C 71 21 73 26 75 31
           C 79 39 84 47 84 58
           C 84 69 78 80 70 86 Z"
        fill="url(#flameG2)"
        fillOpacity={0.72}
      />

      {/* FLAME — inner bright core */}
      <Path
        d="M 70 84
           C 63 78 59 68 60 58
           C 61 49 65 43 68 36
           C 69 33 70 30 70 28
           C 71 30 72 33 73 36
           C 76 43 79 49 79 58
           C 79 67 76 77 70 84 Z"
        fill="url(#flameCoreG2)"
        fillOpacity={0.92}
      />

      {/* NEGATIVE-SPACE CROSS — vertical sliver */}
      <Rect
        x={69.5} y={32} width={1.5} height={36}
        rx={0.75}
        fill="#FFFBE8"
        fillOpacity={0.60}
      />
      {/* NEGATIVE-SPACE CROSS — horizontal sliver */}
      <Rect
        x={62} y={52} width={16} height={1.8}
        rx={0.9}
        fill="#FFFBE8"
        fillOpacity={0.55}
      />

      {/* Flame base glow */}
      <Ellipse cx={70} cy={86} rx={8} ry={3} fill="#F5D77A" fillOpacity={0.88} />

      {/* Flame tip sparkle */}
      <Circle cx={70} cy={20} r={1.8} fill="#FFFFFF" fillOpacity={0.85} />
    </Svg>
  );
}

/** White icon (for dark backgrounds) */
function LuzDiariaIconWhite({ size = 140 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 140 140">
      <Defs>
        <RadialGradient id="wFlameGlow" cx="50%" cy="70%" rx="50%" ry="50%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* Horizon */}
      <Line x1={12} y1={86} x2={128} y2={86} stroke="#FFFFFF" strokeWidth={1} opacity={0.38} />

      {/* Flame outer glow */}
      <Ellipse cx={70} cy={70} rx={20} ry={24} fill="url(#wFlameGlow)" fillOpacity={0.28} />

      {/* PATH fill */}
      <Path
        d="M 14 136 C 26 122 42 106 69 86 C 96 106 112 122 124 136 Z"
        fill="#FFFFFF"
        fillOpacity={0.10}
      />

      {/* Left path edge */}
      <Path
        d="M 14 136 C 26 122 42 106 69 86"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={5}
        strokeLinecap="round"
        strokeOpacity={0.92}
      />

      {/* Right path edge */}
      <Path
        d="M 124 136 C 112 122 96 106 71 86"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={5}
        strokeLinecap="round"
        strokeOpacity={0.92}
      />

      {/* FLAME — outer */}
      <Path
        d="M 70 86
           C 59 80 53 68 54 57
           C 55 46 61 39 65 31
           C 67 26 69 21 70 17
           C 71 21 73 26 75 31
           C 79 39 84 47 84 58
           C 84 69 78 80 70 86 Z"
        fill="#FFFFFF"
        fillOpacity={0.52}
      />

      {/* FLAME — inner core */}
      <Path
        d="M 70 84
           C 63 78 59 68 60 58
           C 61 49 65 43 68 36
           C 69 33 70 30 70 28
           C 71 30 72 33 73 36
           C 76 43 79 49 79 58
           C 79 67 76 77 70 84 Z"
        fill="#FFFFFF"
        fillOpacity={0.92}
      />

      {/* NEGATIVE-SPACE CROSS — vertical */}
      <Rect
        x={69.5} y={32} width={1.5} height={36}
        rx={0.75}
        fill="#FFFFFF"
        fillOpacity={0.22}
      />
      {/* NEGATIVE-SPACE CROSS — horizontal */}
      <Rect
        x={62} y={52} width={16} height={1.8}
        rx={0.9}
        fill="#FFFFFF"
        fillOpacity={0.20}
      />

      {/* Flame base */}
      <Ellipse cx={70} cy={86} rx={8} ry={3} fill="#FFFFFF" fillOpacity={0.75} />

      {/* Flame tip sparkle */}
      <Circle cx={70} cy={20} r={1.8} fill="#FFFFFF" fillOpacity={0.80} />
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
          <Text style={{ fontSize: 12, color: '#7BAE8A', marginTop: 1 }}>Luz Diaria · v2</Text>
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
