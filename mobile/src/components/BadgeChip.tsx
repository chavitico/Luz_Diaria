// BadgeChip — spiritual medal/insignia with per-badge SVG art
// Each badge is a unique symbol: no faces, no characters, pure symbolic iconography
import React from 'react';
import { View, Text } from 'react-native';
import Svg, {
  Circle, Path, Ellipse, Line, Polygon, Rect, G,
  Defs, RadialGradient, LinearGradient, Stop,
} from 'react-native-svg';
import { BADGES } from '@/lib/constants';
import { useThemeColors } from '@/lib/store';

// ─── Per-badge SVG symbols ───────────────────────────────────────────────────
// Each function receives size (viewBox 24×24) and the badge's primary color.
// Returns the interior symbol paths only (no outer ring — that's drawn by the wrapper).

interface SymbolProps { size: number; color: string; }

// 1. Fundador — llama dorada dentro de un escudo / círculo honor
function FounderSymbol({ size, color }: SymbolProps) {
  const s = size / 24;
  return (
    <G>
      {/* Outer glow halo */}
      <Circle cx={12 * s} cy={12 * s} r={7 * s} fill={color + '18'} />
      {/* Flame body */}
      <Path
        d={`M${12 * s} ${5.5 * s}
            C${10.5 * s} ${7 * s} ${8.5 * s} ${9 * s} ${9 * s} ${11.5 * s}
            C${9.3 * s} ${13 * s} ${10.2 * s} ${13.8 * s} ${11 * s} ${14.5 * s}
            C${10.8 * s} ${13.2 * s} ${11.5 * s} ${12.2 * s} ${12 * s} ${12 * s}
            C${12.5 * s} ${12.2 * s} ${13.2 * s} ${13.2 * s} ${13 * s} ${14.5 * s}
            C${13.8 * s} ${13.8 * s} ${14.7 * s} ${13 * s} ${15 * s} ${11.5 * s}
            C${15.5 * s} ${9 * s} ${13.5 * s} ${7 * s} ${12 * s} ${5.5 * s}Z`}
        fill={color}
        opacity={0.95}
      />
      {/* Inner flame highlight */}
      <Path
        d={`M${12 * s} ${8 * s}
            C${11.2 * s} ${9.2 * s} ${10.8 * s} ${10.5 * s} ${11.2 * s} ${11.8 * s}
            C${11.5 * s} ${12.8 * s} ${12 * s} ${12.5 * s} ${12.8 * s} ${11.8 * s}
            C${13.2 * s} ${10.5 * s} ${12.8 * s} ${9.2 * s} ${12 * s} ${8 * s}Z`}
        fill="#FFFFFF"
        opacity={0.45}
      />
      {/* Base glow line */}
      <Ellipse cx={12 * s} cy={15 * s} rx={3 * s} ry={0.7 * s} fill={color} opacity={0.25} />
    </G>
  );
}

// 2. Primeros Pasos — brote brotando del suelo
function SproutSymbol({ size, color }: SymbolProps) {
  const s = size / 24;
  return (
    <G>
      {/* Soil base */}
      <Ellipse cx={12 * s} cy={16.5 * s} rx={4.5 * s} ry={1 * s} fill={color} opacity={0.18} />
      {/* Stem */}
      <Path
        d={`M${12 * s} ${16 * s} L${12 * s} ${10 * s}`}
        stroke={color}
        strokeWidth={1.3 * s}
        strokeLinecap="round"
      />
      {/* Left leaf */}
      <Path
        d={`M${12 * s} ${12.5 * s}
            C${10 * s} ${12 * s} ${9 * s} ${10.5 * s} ${9.5 * s} ${9 * s}
            C${10.5 * s} ${9.5 * s} ${11.5 * s} ${10.5 * s} ${12 * s} ${12.5 * s}Z`}
        fill={color}
        opacity={0.9}
      />
      {/* Right leaf */}
      <Path
        d={`M${12 * s} ${11 * s}
            C${14 * s} ${10.5 * s} ${15.5 * s} ${9 * s} ${15 * s} ${7.5 * s}
            C${13.5 * s} ${8 * s} ${12.5 * s} ${9 * s} ${12 * s} ${11 * s}Z`}
        fill={color}
        opacity={0.75}
      />
      {/* Tiny bud tip */}
      <Circle cx={12 * s} cy={9.5 * s} r={1 * s} fill={color} opacity={0.95} />
    </G>
  );
}

// 3. Compañero de Oración — dos líneas convergentes que forman manos
function PrayerSymbol({ size, color }: SymbolProps) {
  const s = size / 24;
  return (
    <G>
      {/* Glow center */}
      <Circle cx={12 * s} cy={12 * s} r={4 * s} fill={color + '15'} />
      {/* Left hand arc */}
      <Path
        d={`M${7 * s} ${16 * s}
            C${8 * s} ${14 * s} ${10 * s} ${12 * s} ${12 * s} ${10 * s}
            C${12 * s} ${8 * s} ${11.5 * s} ${7 * s} ${11 * s} ${7 * s}`}
        stroke={color}
        strokeWidth={1.4 * s}
        strokeLinecap="round"
        fill="none"
        opacity={0.95}
      />
      {/* Right hand arc */}
      <Path
        d={`M${17 * s} ${16 * s}
            C${16 * s} ${14 * s} ${14 * s} ${12 * s} ${12 * s} ${10 * s}
            C${12 * s} ${8 * s} ${12.5 * s} ${7 * s} ${13 * s} ${7 * s}`}
        stroke={color}
        strokeWidth={1.4 * s}
        strokeLinecap="round"
        fill="none"
        opacity={0.95}
      />
      {/* Center meeting point glow */}
      <Circle cx={12 * s} cy={10 * s} r={1.2 * s} fill={color} opacity={0.6} />
      {/* Base horizontal line */}
      <Path
        d={`M${7 * s} ${16 * s} L${17 * s} ${16 * s}`}
        stroke={color}
        strokeWidth={1 * s}
        strokeLinecap="round"
        opacity={0.35}
      />
    </G>
  );
}

// 4. Guardián de la Palabra — libro abierto con rayo de luz ascendente
function GuardianSymbol({ size, color }: SymbolProps) {
  const s = size / 24;
  return (
    <G>
      {/* Light beam from center of book */}
      <Path
        d={`M${12 * s} ${10 * s} L${10 * s} ${6 * s} M${12 * s} ${10 * s} L${12 * s} ${6.5 * s} M${12 * s} ${10 * s} L${14 * s} ${6 * s}`}
        stroke={color}
        strokeWidth={0.9 * s}
        strokeLinecap="round"
        opacity={0.5}
      />
      {/* Book left page */}
      <Path
        d={`M${8 * s} ${10 * s}
            C${8 * s} ${10 * s} ${9 * s} ${9.5 * s} ${12 * s} ${10 * s}
            L${12 * s} ${17 * s}
            C${9 * s} ${16.5 * s} ${8 * s} ${17 * s} ${8 * s} ${17 * s}Z`}
        fill={color}
        opacity={0.85}
      />
      {/* Book right page */}
      <Path
        d={`M${16 * s} ${10 * s}
            C${16 * s} ${10 * s} ${15 * s} ${9.5 * s} ${12 * s} ${10 * s}
            L${12 * s} ${17 * s}
            C${15 * s} ${16.5 * s} ${16 * s} ${17 * s} ${16 * s} ${17 * s}Z`}
        fill={color}
        opacity={0.65}
      />
      {/* Spine */}
      <Line
        x1={12 * s} y1={10 * s}
        x2={12 * s} y2={17 * s}
        stroke={color}
        strokeWidth={0.8 * s}
        opacity={0.4}
      />
      {/* Light star at top */}
      <Circle cx={12 * s} cy={7 * s} r={1.3 * s} fill={color} opacity={0.9} />
    </G>
  );
}

// 5. Caminando en Fe — sendero de puntos hacia una luz en el horizonte
function FaithPathSymbol({ size, color }: SymbolProps) {
  const s = size / 24;
  return (
    <G>
      {/* Horizon glow */}
      <Ellipse cx={12 * s} cy={9 * s} rx={3.5 * s} ry={1.5 * s} fill={color} opacity={0.18} />
      {/* Light orb */}
      <Circle cx={12 * s} cy={8.5 * s} r={2 * s} fill={color} opacity={0.85} />
      <Circle cx={12 * s} cy={8.5 * s} r={1.1 * s} fill="#FFFFFF" opacity={0.5} />
      {/* Path — converging lines going toward light */}
      <Path
        d={`M${7 * s} ${18 * s} L${12 * s} ${11 * s}`}
        stroke={color}
        strokeWidth={1.2 * s}
        strokeLinecap="round"
        opacity={0.8}
      />
      <Path
        d={`M${17 * s} ${18 * s} L${12 * s} ${11 * s}`}
        stroke={color}
        strokeWidth={1.2 * s}
        strokeLinecap="round"
        opacity={0.5}
      />
      {/* Step dots on left path */}
      <Circle cx={9 * s} cy={15 * s} r={0.8 * s} fill={color} opacity={0.7} />
      <Circle cx={10.3 * s} cy={13 * s} r={0.6 * s} fill={color} opacity={0.5} />
    </G>
  );
}

// 6. Portador de Esperanza — paloma estilizada / silueta de vuelo
function HopeSymbol({ size, color }: SymbolProps) {
  const s = size / 24;
  return (
    <G>
      {/* Soft glow beneath */}
      <Ellipse cx={12 * s} cy={16 * s} rx={4 * s} ry={1 * s} fill={color} opacity={0.15} />
      {/* Wings — left */}
      <Path
        d={`M${12 * s} ${12 * s}
            C${10 * s} ${10.5 * s} ${7.5 * s} ${10 * s} ${7 * s} ${12 * s}
            C${8.5 * s} ${11.5 * s} ${10.5 * s} ${12 * s} ${12 * s} ${14 * s}Z`}
        fill={color}
        opacity={0.9}
      />
      {/* Wings — right */}
      <Path
        d={`M${12 * s} ${12 * s}
            C${14 * s} ${10.5 * s} ${16.5 * s} ${10 * s} ${17 * s} ${12 * s}
            C${15.5 * s} ${11.5 * s} ${13.5 * s} ${12 * s} ${12 * s} ${14 * s}Z`}
        fill={color}
        opacity={0.65}
      />
      {/* Body */}
      <Ellipse cx={12 * s} cy={13.5 * s} rx={1.3 * s} ry={2 * s} fill={color} opacity={0.95} />
      {/* Head */}
      <Circle cx={12 * s} cy={10.5 * s} r={1.5 * s} fill={color} opacity={0.95} />
      {/* Beak */}
      <Path
        d={`M${13.3 * s} ${10.2 * s} L${14.5 * s} ${9.8 * s} L${13.3 * s} ${10.7 * s}Z`}
        fill={color}
        opacity={0.7}
      />
    </G>
  );
}

// 7. Sembrador de Paz — mano abierta con tres semillas / rama de olivo
function PeaceSymbol({ size, color }: SymbolProps) {
  const s = size / 24;
  return (
    <G>
      {/* Branch stem */}
      <Path
        d={`M${8 * s} ${17 * s} C${9 * s} ${14 * s} ${11 * s} ${12 * s} ${14 * s} ${8 * s}`}
        stroke={color}
        strokeWidth={1.3 * s}
        strokeLinecap="round"
        fill="none"
        opacity={0.9}
      />
      {/* Leaves */}
      <Path
        d={`M${10 * s} ${14.5 * s}
            C${8.5 * s} ${13.5 * s} ${8 * s} ${12 * s} ${9 * s} ${11.5 * s}
            C${10 * s} ${11 * s} ${10.5 * s} ${13 * s} ${10 * s} ${14.5 * s}Z`}
        fill={color}
        opacity={0.85}
      />
      <Path
        d={`M${12 * s} ${11.5 * s}
            C${13 * s} ${10 * s} ${14.5 * s} ${9.5 * s} ${15 * s} ${10.5 * s}
            C${14.5 * s} ${11.5 * s} ${13 * s} ${12 * s} ${12 * s} ${11.5 * s}Z`}
        fill={color}
        opacity={0.7}
      />
      {/* Seeds / dots floating */}
      <Circle cx={8.5 * s} cy={9 * s} r={0.9 * s} fill={color} opacity={0.75} />
      <Circle cx={11 * s} cy={7.5 * s} r={0.7 * s} fill={color} opacity={0.6} />
      <Circle cx={14 * s} cy={6.5 * s} r={0.8 * s} fill={color} opacity={0.5} />
      {/* Soft glow */}
      <Ellipse cx={11 * s} cy={8 * s} rx={3.5 * s} ry={2 * s} fill={color} opacity={0.08} />
    </G>
  );
}

// 8. Columna de la Comunidad — columna clásica / pilar de piedra
function PillarSymbol({ size, color }: SymbolProps) {
  const s = size / 24;
  return (
    <G>
      {/* Base slab */}
      <Rect x={7 * s} y={17 * s} width={10 * s} height={1.5 * s} rx={0.5 * s} fill={color} opacity={0.9} />
      {/* Capital (top slab) */}
      <Rect x={7 * s} y={7 * s} width={10 * s} height={1.5 * s} rx={0.5 * s} fill={color} opacity={0.9} />
      {/* Left column shaft */}
      <Rect x={8.5 * s} y={8.5 * s} width={2.5 * s} height={8.5 * s} rx={1 * s} fill={color} opacity={0.8} />
      {/* Right column shaft */}
      <Rect x={13 * s} y={8.5 * s} width={2.5 * s} height={8.5 * s} rx={1 * s} fill={color} opacity={0.6} />
      {/* Center thin accent */}
      <Rect x={11.2 * s} y={8.5 * s} width={1.5 * s} height={8.5 * s} rx={0.7 * s} fill={color} opacity={0.35} />
    </G>
  );
}

// 9. Valiente del Reino — escudo (legacy, no está en la lista del usuario pero existe en DB)
function ShieldSymbol({ size, color }: SymbolProps) {
  const s = size / 24;
  return (
    <G>
      <Path
        d={`M${12 * s} ${6 * s}
            L${17 * s} ${8 * s}
            L${17 * s} ${13 * s}
            C${17 * s} ${16 * s} ${12 * s} ${18 * s} ${12 * s} ${18 * s}
            C${12 * s} ${18 * s} ${7 * s} ${16 * s} ${7 * s} ${13 * s}
            L${7 * s} ${8 * s}Z`}
        fill={color}
        opacity={0.85}
      />
      {/* Inner shield highlight */}
      <Path
        d={`M${12 * s} ${8 * s}
            L${15.5 * s} ${9.5 * s}
            L${15.5 * s} ${13 * s}
            C${15.5 * s} ${15 * s} ${12 * s} ${16.5 * s} ${12 * s} ${16.5 * s}Z`}
        fill="#FFFFFF"
        opacity={0.15}
      />
      {/* Cross mark */}
      <Line x1={12 * s} y1={10 * s} x2={12 * s} y2={15 * s} stroke="#FFFFFF" strokeWidth={1.3 * s} strokeLinecap="round" opacity={0.7} />
      <Line x1={9.5 * s} y1={12.5 * s} x2={14.5 * s} y2={12.5 * s} stroke="#FFFFFF" strokeWidth={1.3 * s} strokeLinecap="round" opacity={0.7} />
    </G>
  );
}

// ─── Symbol registry ────────────────────────────────────────────────────────
const SYMBOL_MAP: Record<string, React.ComponentType<SymbolProps>> = {
  badge_fundador:           FounderSymbol,
  badge_primeros_pasos:     SproutSymbol,
  badge_companero_oracion:  PrayerSymbol,
  badge_guardian_palabra:   GuardianSymbol,
  badge_caminando_fe:       FaithPathSymbol,
  badge_portador_esperanza: HopeSymbol,
  badge_sembrador_paz:      PeaceSymbol,
  badge_columna_comunidad:  PillarSymbol,
  badge_valiente_reino:     ShieldSymbol,
};

// ─── Main component ─────────────────────────────────────────────────────────
interface BadgeChipProps {
  badgeId: string;
  /** 'community' = compact medal (26px, icon only)
   *  'profile'   = medal + name label */
  variant?: 'community' | 'profile';
}

export function BadgeChip({ badgeId, variant = 'community' }: BadgeChipProps) {
  const colors = useThemeColors();
  const badge = BADGES[badgeId];
  if (!badge) return null;

  const SymbolComponent = SYMBOL_MAP[badgeId] ?? FounderSymbol;
  const badgeColor = badge.color;
  const isUnique = badge.rarity === 'unique';
  const isEpic = badge.rarity === 'epic';

  // Medal size
  const medalSize = variant === 'community' ? 26 : 32;
  const svgSize = medalSize;

  const MedalView = (
    <View
      style={{
        width: medalSize,
        height: medalSize,
        borderRadius: medalSize / 2,
        // Outer ring — double-ring effect via background layers
        backgroundColor: badgeColor + (isUnique ? '28' : '18'),
        borderWidth: isUnique ? 2 : isEpic ? 1.5 : 1,
        borderColor: isUnique ? badgeColor : isEpic ? badgeColor + 'BB' : badgeColor + '80',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: badgeColor,
        shadowOpacity: isUnique ? 0.55 : isEpic ? 0.35 : 0.18,
        shadowRadius: isUnique ? 6 : isEpic ? 4 : 2.5,
        shadowOffset: { width: 0, height: 1 },
        elevation: isUnique ? 4 : isEpic ? 3 : 1,
      }}
    >
      {/* Inner ring (double-ring medal look) */}
      <View
        style={{
          position: 'absolute',
          width: medalSize - 5,
          height: medalSize - 5,
          borderRadius: (medalSize - 5) / 2,
          borderWidth: 0.5,
          borderColor: badgeColor + '40',
        }}
      />
      <Svg width={svgSize * 0.72} height={svgSize * 0.72} viewBox="0 0 24 24">
        <SymbolComponent size={24} color={badgeColor} />
      </Svg>
    </View>
  );

  if (variant === 'community') {
    return MedalView;
  }

  // Profile: medal + name
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 14,
        backgroundColor: badgeColor + '12',
        borderWidth: 1,
        borderColor: badgeColor + '35',
        gap: 8,
      }}
    >
      {MedalView}
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: colors.text,
          flexShrink: 1,
        }}
        numberOfLines={1}
      >
        {badge.nameEs}
      </Text>
    </View>
  );
}
