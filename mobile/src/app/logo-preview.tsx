/**
 * LogoPreview Screen
 * Shows all logo variants: color, white, icon-only
 * Access: navigate to /logo-preview (for admin/design review only)
 * v3: camino + libro abierto + llama con cruz sutil
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
} from 'react-native-svg';

// ─────────────────────────────────────────────
// LuzDiariaIcon — v3
// Camino sinuoso verde que viene desde abajo,
// pasa por libro abierto, asciende a llama dorada con cruz sutil
// ViewBox 140×140
// ─────────────────────────────────────────────

/** Color icon */
function LuzDiariaIcon({ size = 140 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 140 140">
      <Defs>
        {/* Background */}
        <SvgLinearGradient id="bg3" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F0F7F2" />
          <Stop offset="1" stopColor="#F7F4EE" />
        </SvgLinearGradient>

        {/* Path / road green gradient */}
        <SvgLinearGradient id="road3" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#4A7D5E" stopOpacity={0.9} />
          <Stop offset="0.6" stopColor="#5A9070" stopOpacity={0.85} />
          <Stop offset="1" stopColor="#7BAE8A" stopOpacity={0.6} />
        </SvgLinearGradient>

        {/* Book cover gradient */}
        <SvgLinearGradient id="book3" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#4A7D5E" />
          <Stop offset="1" stopColor="#2D5440" />
        </SvgLinearGradient>

        {/* Book pages — warm cream */}
        <SvgLinearGradient id="pages3" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FDF8EE" />
          <Stop offset="1" stopColor="#F0EAD8" />
        </SvgLinearGradient>

        {/* Flame gradient */}
        <SvgLinearGradient id="flame3" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#E8A020" stopOpacity={1} />
          <Stop offset="0.45" stopColor="#F5C842" stopOpacity={1} />
          <Stop offset="0.8" stopColor="#FFF0A0" stopOpacity={0.95} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.7} />
        </SvgLinearGradient>

        {/* Flame core */}
        <SvgLinearGradient id="flameCore3" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#FFD84A" />
          <Stop offset="0.6" stopColor="#FFFBE0" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.85} />
        </SvgLinearGradient>

        {/* Golden glow radial */}
        <RadialGradient id="glow3" cx="50%" cy="80%" rx="50%" ry="50%">
          <Stop offset="0" stopColor="#F5D77A" stopOpacity={0.9} />
          <Stop offset="0.5" stopColor="#F5C842" stopOpacity={0.3} />
          <Stop offset="1" stopColor="#E8B84B" stopOpacity={0} />
        </RadialGradient>

        {/* Glow behind flame */}
        <RadialGradient id="glowBig3" cx="50%" cy="60%" rx="50%" ry="55%">
          <Stop offset="0" stopColor="#FFF4C2" stopOpacity={0.85} />
          <Stop offset="1" stopColor="#FFF4C2" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* ── BACKGROUND ── */}
      <Rect x={0} y={0} width={140} height={140} rx={28} ry={28} fill="url(#bg3)" />

      {/* ── BIG GLOW behind flame ── */}
      <Ellipse cx={70} cy={52} rx={38} ry={42} fill="url(#glowBig3)" />

      {/* ── ROAD / CAMINO ──
          Starts at bottom center, widens as it approaches viewer,
          curves gently left then right (sinuous), narrows at book spine
      ── */}

      {/* Road fill — wide V from bottom into book spine */}
      <Path
        d="M 50 138
           C 50 130 54 120 58 110
           C 61 102 64 97 66 93
           L 74 93
           C 76 97 79 102 82 110
           C 86 120 90 130 90 138
           Z"
        fill="url(#road3)"
        fillOpacity={0.85}
      />

      {/* Road center line (dashed feel — just lighter strip) */}
      <Path
        d="M 68 138 C 68 130 69 118 70 105 C 71 118 72 130 72 138 Z"
        fill="#FFFFFF"
        fillOpacity={0.15}
      />

      {/* ── OPEN BOOK ──
          Centered at y≈93-110, book opens left & right like wings.
          Spine at center (x=70), pages fan out.
          Book sits flat, perspective tilt showing front face.
      ── */}

      {/* Left cover (green) */}
      <Path
        d="M 70 93
           C 62 91 50 90 36 92
           C 30 93 26 95 24 97
           C 22 99 22 102 24 104
           C 26 106 30 108 36 109
           C 50 111 62 110 70 108
           Z"
        fill="url(#book3)"
      />

      {/* Right cover (green) */}
      <Path
        d="M 70 93
           C 78 91 90 90 104 92
           C 110 93 114 95 116 97
           C 118 99 118 102 116 104
           C 114 106 110 108 104 109
           C 90 111 78 110 70 108
           Z"
        fill="url(#book3)"
      />

      {/* Left pages (cream) */}
      <Path
        d="M 70 94
           C 63 92 52 92 38 94
           C 32 95 28 97 27 99
           C 26 101 27 103 29 105
           C 31 106.5 36 107.5 42 108
           C 53 109 63 109 70 107
           Z"
        fill="url(#pages3)"
      />

      {/* Right pages (cream) */}
      <Path
        d="M 70 94
           C 77 92 88 92 102 94
           C 108 95 112 97 113 99
           C 114 101 113 103 111 105
           C 109 106.5 104 107.5 98 108
           C 87 109 77 109 70 107
           Z"
        fill="url(#pages3)"
      />

      {/* Page lines left */}
      <G opacity={0.18} stroke="#4A7D5E" strokeWidth={0.7} strokeLinecap="round">
        <Line x1={38} y1={97} x2={67} y2={96} />
        <Line x1={35} y1={100} x2={67} y2={99} />
        <Line x1={35} y1={103} x2={67} y2={102} />
        <Line x1={36} y1={106} x2={67} y2={105} />
      </G>

      {/* Page lines right */}
      <G opacity={0.18} stroke="#4A7D5E" strokeWidth={0.7} strokeLinecap="round">
        <Line x1={73} y1={96} x2={102} y2={97} />
        <Line x1={73} y1={99} x2={105} y2={100} />
        <Line x1={73} y1={102} x2={105} y2={103} />
        <Line x1={73} y1={105} x2={104} y2={106} />
      </G>

      {/* Book spine (dark green strip) */}
      <Path
        d="M 68.5 93 C 69 107 69 108 70 108 C 71 108 71 107 71.5 93 Z"
        fill="#2D5440"
        fillOpacity={0.6}
      />

      {/* ── ROAD OVER BOOK — connecting road to flame ── */}
      {/* Upper road segment — narrows from book spine upward to flame base */}
      <Path
        d="M 66 93
           C 66.5 86 67.5 78 68.5 72
           L 71.5 72
           C 72.5 78 73.5 86 74 93
           Z"
        fill="url(#road3)"
        fillOpacity={0.6}
      />

      {/* ── GOLDEN GLOW ── */}
      <Ellipse cx={70} cy={56} rx={20} ry={22} fill="url(#glow3)" />

      {/* ── FLAME ──
          Base at y=72, tip at y=20.
          Outer shape wider, inner core brighter.
      ── */}

      {/* Outer flame */}
      <Path
        d="M 70 72
           C 62 68 56 60 57 50
           C 58 42 63 36 66 29
           C 67.5 25 69 21 70 18
           C 71 21 72.5 25 74 29
           C 77 36 82 42 83 50
           C 84 60 78 68 70 72 Z"
        fill="url(#flame3)"
        fillOpacity={0.75}
      />

      {/* Inner flame core */}
      <Path
        d="M 70 70
           C 64 66 60 58 61 50
           C 62 43 65.5 38 68 32
           C 69 29 70 26 70 24
           C 71 26 72 29 72 32
           C 74.5 38 78 43 79 50
           C 80 58 76 66 70 70 Z"
        fill="url(#flameCore3)"
        fillOpacity={0.9}
      />

      {/* ── SUBTLE CROSS in flame (negative space) ──
          Two very thin lighter slivers within the flame body,
          not explicit — just enough to sense it.
      ── */}
      {/* Vertical */}
      <Rect
        x={69.4} y={28} width={1.2} height={32}
        rx={0.6}
        fill="#FFFBE8"
        fillOpacity={0.55}
      />
      {/* Horizontal */}
      <Rect
        x={63} y={46} width={14} height={1.5}
        rx={0.75}
        fill="#FFFBE8"
        fillOpacity={0.50}
      />

      {/* Flame base warm glow */}
      <Ellipse cx={70} cy={72} rx={7} ry={2.5} fill="#F5D77A" fillOpacity={0.85} />

      {/* Tiny sparkles / light rays around flame */}
      <G opacity={0.35} stroke="#F5D77A" strokeWidth={0.8} strokeLinecap="round">
        <Line x1={70} y1={17} x2={70} y2={13} />
        <Line x1={60} y1={28} x2={57} y2={25} />
        <Line x1={80} y1={28} x2={83} y2={25} />
        <Line x1={56} y1={45} x2={52} y2={44} />
        <Line x1={84} y1={45} x2={88} y2={44} />
      </G>

      {/* Flame tip bright dot */}
      <Circle cx={70} cy={20} r={1.5} fill="#FFFFFF" fillOpacity={0.9} />
    </Svg>
  );
}

/** White icon (for dark backgrounds) */
function LuzDiariaIconWhite({ size = 140 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 140 140">
      <Defs>
        <RadialGradient id="wGlow3" cx="50%" cy="60%" rx="50%" ry="55%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.5} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* ── ROAD (white) ── */}
      <Path
        d="M 50 138 C 50 130 54 120 58 110 C 61 102 64 97 66 93
           L 74 93 C 76 97 79 102 82 110 C 86 120 90 130 90 138 Z"
        fill="#FFFFFF"
        fillOpacity={0.78}
      />
      <Path
        d="M 66 93 C 66.5 86 67.5 78 68.5 72 L 71.5 72
           C 72.5 78 73.5 86 74 93 Z"
        fill="#FFFFFF"
        fillOpacity={0.55}
      />

      {/* ── OPEN BOOK (white) ── */}
      {/* Left cover */}
      <Path
        d="M 70 93 C 62 91 50 90 36 92 C 30 93 26 95 24 97
           C 22 99 22 102 24 104 C 26 106 30 108 36 109
           C 50 111 62 110 70 108 Z"
        fill="#FFFFFF"
        fillOpacity={0.65}
      />
      {/* Right cover */}
      <Path
        d="M 70 93 C 78 91 90 90 104 92 C 110 93 114 95 116 97
           C 118 99 118 102 116 104 C 114 106 110 108 104 109
           C 90 111 78 110 70 108 Z"
        fill="#FFFFFF"
        fillOpacity={0.65}
      />
      {/* Pages slight lighter shade */}
      <Path
        d="M 70 94 C 63 92 52 92 38 94 C 32 95 28 97 27 99
           C 26 101 27 103 29 105 C 31 106.5 36 107.5 42 108
           C 53 109 63 109 70 107 Z"
        fill="#FFFFFF"
        fillOpacity={0.85}
      />
      <Path
        d="M 70 94 C 77 92 88 92 102 94 C 108 95 112 97 113 99
           C 114 101 113 103 111 105 C 109 106.5 104 107.5 98 108
           C 87 109 77 109 70 107 Z"
        fill="#FFFFFF"
        fillOpacity={0.85}
      />

      {/* ── GLOW ── */}
      <Ellipse cx={70} cy={52} rx={36} ry={40} fill="url(#wGlow3)" />

      {/* ── FLAME (white) ── */}
      <Path
        d="M 70 72 C 62 68 56 60 57 50 C 58 42 63 36 66 29
           C 67.5 25 69 21 70 18 C 71 21 72.5 25 74 29
           C 77 36 82 42 83 50 C 84 60 78 68 70 72 Z"
        fill="#FFFFFF"
        fillOpacity={0.55}
      />
      <Path
        d="M 70 70 C 64 66 60 58 61 50 C 62 43 65.5 38 68 32
           C 69 29 70 26 70 24 C 71 26 72 29 72 32
           C 74.5 38 78 43 79 50 C 80 58 76 66 70 70 Z"
        fill="#FFFFFF"
        fillOpacity={0.92}
      />

      {/* Cross negative space */}
      <Rect x={69.4} y={28} width={1.2} height={32} rx={0.6} fill="#FFFFFF" fillOpacity={0.22} />
      <Rect x={63} y={46} width={14} height={1.5} rx={0.75} fill="#FFFFFF" fillOpacity={0.20} />

      {/* Flame base */}
      <Ellipse cx={70} cy={72} rx={7} ry={2.5} fill="#FFFFFF" fillOpacity={0.75} />
      <Circle cx={70} cy={20} r={1.5} fill="#FFFFFF" fillOpacity={0.85} />
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
      <Text style={{ fontSize: 11, fontWeight: '600', color: '#8C9EAB', letterSpacing: 1.8, marginBottom: 4, marginLeft: 2 }}>
        {label}
      </Text>
      {sublabel && (
        <Text style={{ fontSize: 12, color: '#ABBBC6', marginBottom: 10, marginLeft: 2 }}>
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
      <Text style={{ fontSize: 9, color: '#8A9BA8', letterSpacing: 0.3, textAlign: 'center' }}>{hex}</Text>
      <Text style={{ fontSize: 10, color: '#4A5568', fontWeight: '500', textAlign: 'center' }}>{name}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────
export default function LogoPreviewScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F7F5' }} edges={['top']}>
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
          <Text style={{ fontSize: 12, color: '#7BAE8A', marginTop: 1 }}>Luz Diaria · v3</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F4F2', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={18} color="#4A7D5E" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        <Section label="ÍCONO DE APP" sublabel="Versión color para App Store / Home Screen">
          <AppIconPreview />
        </Section>

        <Section label="LOGOTIPO A COLOR" sublabel="Isotipo + tipografía sobre fondo claro">
          <LuzDiariaLogotype scale={0.85} />
        </Section>

        <Section label="VERSIÓN BLANCA" sublabel="Para usar sobre imágenes, gradientes, fondos oscuros" bg="#2D4A38">
          <LuzDiariaLogotypeWhite scale={0.85} />
        </Section>

        <Section label="VERSIÓN BLANCA SOBRE IMAGEN" sublabel="Preview sobre fondo tipo devotional">
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

        <Section label="ÍCONO SOLO — MÚLTIPLES TAMAÑOS" sublabel="Legibilidad en diferentes resoluciones">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            {[88, 60, 44, 32].map((s) => (
              <View key={s} style={{ alignItems: 'center', gap: 8 }}>
                <LuzDiariaIcon size={s} />
                <Text style={{ fontSize: 10, color: '#9BB0A8' }}>{s}px</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section label="PALETA DE COLORES" sublabel="Identidad cromática de la marca">
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

        <Section label="ÍCONO BLANCO" sublabel="Para navigation bars, splash screens, contenido compartido" bg="#4A7D5E">
          <LuzDiariaIconWhite size={100} />
        </Section>

        {/* Splash preview */}
        <View style={{ marginBottom: 28 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#8C9EAB', letterSpacing: 1.8, marginBottom: 4, marginLeft: 2 }}>
            SPLASH SCREEN (PREVIEW)
          </Text>
          <Text style={{ fontSize: 12, color: '#ABBBC6', marginBottom: 10, marginLeft: 2 }}>
            Simulación de pantalla de carga
          </Text>
          <View style={{ borderRadius: 28, overflow: 'hidden', height: 340, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6 }}>
            <LinearGradient
              colors={['#EAF3EE', '#F2EFE6', '#EDE3CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 }}
            >
              <LuzDiariaIcon size={120} />
              <View style={{ alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 32, fontWeight: '600', color: '#2D4A38', letterSpacing: -0.8 }}>
                  Luz Diaria
                </Text>
                <Text style={{ fontSize: 13, color: '#7BAE8A', letterSpacing: 2, fontWeight: '400' }}>
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
