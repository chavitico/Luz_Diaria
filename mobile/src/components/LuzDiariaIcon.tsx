/**
 * LuzDiariaIcon — Shared SVG icon components
 * v3: Camino + libro abierto + llama con cruz sutil
 * ViewBox 140×140 — NO background rect (fully transparent)
 *
 * Usage:
 *   <LuzDiariaIcon size={40} />          — color version (for light/neutral backgrounds)
 *   <LuzDiariaIconWhite size={40} />     — white version (for dark/photo backgrounds)
 */

import React from 'react';
import Svg, {
  Circle,
  Ellipse,
  Path,
  Line,
  Rect,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Stop,
  G,
} from 'react-native-svg';

// ─── Color icon (transparent background) ────────────────────────────────────

export function LuzDiariaIcon({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 140 140">
      <Defs>
        <SvgLinearGradient id="ldi_road" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#4A7D5E" stopOpacity={0.9} />
          <Stop offset="0.6" stopColor="#5A9070" stopOpacity={0.85} />
          <Stop offset="1" stopColor="#7BAE8A" stopOpacity={0.6} />
        </SvgLinearGradient>
        <SvgLinearGradient id="ldi_book" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#4A7D5E" />
          <Stop offset="1" stopColor="#2D5440" />
        </SvgLinearGradient>
        <SvgLinearGradient id="ldi_pages" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FDF8EE" />
          <Stop offset="1" stopColor="#F0EAD8" />
        </SvgLinearGradient>
        <SvgLinearGradient id="ldi_flame" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#E8A020" stopOpacity={1} />
          <Stop offset="0.45" stopColor="#F5C842" stopOpacity={1} />
          <Stop offset="0.8" stopColor="#FFF0A0" stopOpacity={0.95} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.7} />
        </SvgLinearGradient>
        <SvgLinearGradient id="ldi_flamecore" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#FFD84A" />
          <Stop offset="0.6" stopColor="#FFFBE0" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.85} />
        </SvgLinearGradient>
        <RadialGradient id="ldi_glow" cx="50%" cy="80%" rx="50%" ry="50%">
          <Stop offset="0" stopColor="#F5D77A" stopOpacity={0.9} />
          <Stop offset="0.5" stopColor="#F5C842" stopOpacity={0.3} />
          <Stop offset="1" stopColor="#E8B84B" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="ldi_glowbig" cx="50%" cy="60%" rx="50%" ry="55%">
          <Stop offset="0" stopColor="#FFF4C2" stopOpacity={0.85} />
          <Stop offset="1" stopColor="#FFF4C2" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* BIG GLOW behind flame */}
      <Ellipse cx={70} cy={52} rx={38} ry={42} fill="url(#ldi_glowbig)" />

      {/* ROAD — wide V from bottom into book spine */}
      <Path
        d="M 50 138 C 50 130 54 120 58 110 C 61 102 64 97 66 93
           L 74 93 C 76 97 79 102 82 110 C 86 120 90 130 90 138 Z"
        fill="url(#ldi_road)"
        fillOpacity={0.85}
      />
      <Path
        d="M 68 138 C 68 130 69 118 70 105 C 71 118 72 130 72 138 Z"
        fill="#FFFFFF"
        fillOpacity={0.15}
      />

      {/* OPEN BOOK — Left cover */}
      <Path
        d="M 70 93 C 62 91 50 90 36 92 C 30 93 26 95 24 97
           C 22 99 22 102 24 104 C 26 106 30 108 36 109
           C 50 111 62 110 70 108 Z"
        fill="url(#ldi_book)"
      />
      {/* Right cover */}
      <Path
        d="M 70 93 C 78 91 90 90 104 92 C 110 93 114 95 116 97
           C 118 99 118 102 116 104 C 114 106 110 108 104 109
           C 90 111 78 110 70 108 Z"
        fill="url(#ldi_book)"
      />
      {/* Left pages */}
      <Path
        d="M 70 94 C 63 92 52 92 38 94 C 32 95 28 97 27 99
           C 26 101 27 103 29 105 C 31 106.5 36 107.5 42 108
           C 53 109 63 109 70 107 Z"
        fill="url(#ldi_pages)"
      />
      {/* Right pages */}
      <Path
        d="M 70 94 C 77 92 88 92 102 94 C 108 95 112 97 113 99
           C 114 101 113 103 111 105 C 109 106.5 104 107.5 98 108
           C 87 109 77 109 70 107 Z"
        fill="url(#ldi_pages)"
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
      {/* Book spine */}
      <Path
        d="M 68.5 93 C 69 107 69 108 70 108 C 71 108 71 107 71.5 93 Z"
        fill="#2D5440"
        fillOpacity={0.6}
      />

      {/* Upper road connecting book spine to flame base */}
      <Path
        d="M 66 93 C 66.5 86 67.5 78 68.5 72 L 71.5 72
           C 72.5 78 73.5 86 74 93 Z"
        fill="url(#ldi_road)"
        fillOpacity={0.6}
      />

      {/* GOLDEN GLOW */}
      <Ellipse cx={70} cy={56} rx={20} ry={22} fill="url(#ldi_glow)" />

      {/* FLAME — outer */}
      <Path
        d="M 70 72 C 62 68 56 60 57 50 C 58 42 63 36 66 29
           C 67.5 25 69 21 70 18 C 71 21 72.5 25 74 29
           C 77 36 82 42 83 50 C 84 60 78 68 70 72 Z"
        fill="url(#ldi_flame)"
        fillOpacity={0.75}
      />
      {/* FLAME — inner core */}
      <Path
        d="M 70 70 C 64 66 60 58 61 50 C 62 43 65.5 38 68 32
           C 69 29 70 26 70 24 C 71 26 72 29 72 32
           C 74.5 38 78 43 79 50 C 80 58 76 66 70 70 Z"
        fill="url(#ldi_flamecore)"
        fillOpacity={0.9}
      />

      {/* Subtle cross — vertical */}
      <Rect x={69.4} y={28} width={1.2} height={32} rx={0.6} fill="#FFFBE8" fillOpacity={0.55} />
      {/* Subtle cross — horizontal */}
      <Rect x={63} y={46} width={14} height={1.5} rx={0.75} fill="#FFFBE8" fillOpacity={0.50} />

      {/* Flame base glow */}
      <Ellipse cx={70} cy={72} rx={7} ry={2.5} fill="#F5D77A" fillOpacity={0.85} />

      {/* Light rays */}
      <G opacity={0.35} stroke="#F5D77A" strokeWidth={0.8} strokeLinecap="round">
        <Line x1={70} y1={17} x2={70} y2={13} />
        <Line x1={60} y1={28} x2={57} y2={25} />
        <Line x1={80} y1={28} x2={83} y2={25} />
        <Line x1={56} y1={45} x2={52} y2={44} />
        <Line x1={84} y1={45} x2={88} y2={44} />
      </G>

      {/* Flame tip sparkle */}
      <Circle cx={70} cy={20} r={1.5} fill="#FFFFFF" fillOpacity={0.9} />
    </Svg>
  );
}

// ─── White icon (transparent background, for dark/photo backgrounds) ─────────

export function LuzDiariaIconWhite({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 140 140">
      <Defs>
        <RadialGradient id="ldw_glow" cx="50%" cy="60%" rx="50%" ry="55%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.5} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* ROAD */}
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

      {/* OPEN BOOK — Left cover */}
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
      {/* Left pages */}
      <Path
        d="M 70 94 C 63 92 52 92 38 94 C 32 95 28 97 27 99
           C 26 101 27 103 29 105 C 31 106.5 36 107.5 42 108
           C 53 109 63 109 70 107 Z"
        fill="#FFFFFF"
        fillOpacity={0.85}
      />
      {/* Right pages */}
      <Path
        d="M 70 94 C 77 92 88 92 102 94 C 108 95 112 97 113 99
           C 114 101 113 103 111 105 C 109 106.5 104 107.5 98 108
           C 87 109 77 109 70 107 Z"
        fill="#FFFFFF"
        fillOpacity={0.85}
      />

      {/* Glow */}
      <Ellipse cx={70} cy={52} rx={36} ry={40} fill="url(#ldw_glow)" />

      {/* FLAME — outer */}
      <Path
        d="M 70 72 C 62 68 56 60 57 50 C 58 42 63 36 66 29
           C 67.5 25 69 21 70 18 C 71 21 72.5 25 74 29
           C 77 36 82 42 83 50 C 84 60 78 68 70 72 Z"
        fill="#FFFFFF"
        fillOpacity={0.55}
      />
      {/* FLAME — inner core */}
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
