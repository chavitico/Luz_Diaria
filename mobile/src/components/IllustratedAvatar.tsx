// IllustratedAvatar - renders visually rich V2 avatar art
// Uses React Native primitives + LinearGradient for illustrated look.
// Non-V2 avatars fall back to plain emoji.

import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface IllustratedAvatarProps {
  avatarId: string;
  size?: number;
  /** The emoji string (from DEFAULT_AVATARS) */
  emoji?: string;
}

interface V2Style {
  gradientColors: [string, string, ...string[]];
  glowColor: string;
  accentShape?: 'rays' | 'stars' | 'dots' | 'rings' | 'cross' | 'waves' | 'crown' | 'flame' | 'scroll' | 'none';
  accentColor?: string;
  emojiSize: number;
}

const V2_STYLES: Record<string, V2Style> = {
  // ─── Simbolos de Fe ───────────────────────────────────────────────────────
  avatar_v2_paloma_paz: {
    gradientColors: ['#E0F4FF', '#B3DFFF', '#7EC8E3'],
    glowColor: '#7EC8E3',
    accentShape: 'rays',
    accentColor: '#B3DFFF',
    emojiSize: 0.5,
  },
  avatar_v2_cruz_radiante: {
    gradientColors: ['#FFF8E1', '#FFE082', '#FFB300'],
    glowColor: '#FFB300',
    accentShape: 'rays',
    accentColor: '#FFF8E1',
    emojiSize: 0.48,
  },
  avatar_v2_lampara_aceite: {
    gradientColors: ['#FFF3E0', '#FFCC80', '#FF8F00'],
    glowColor: '#FF8F00',
    accentShape: 'dots',
    accentColor: '#FFE0B2',
    emojiSize: 0.5,
  },
  avatar_v2_corona_vida: {
    gradientColors: ['#FFF9C4', '#FDD835', '#F9A825'],
    glowColor: '#F9A825',
    accentShape: 'crown',
    accentColor: '#FFF9C4',
    emojiSize: 0.5,
  },
  avatar_v2_biblia_abierta: {
    gradientColors: ['#E8F5E9', '#A5D6A7', '#43A047'],
    glowColor: '#43A047',
    accentShape: 'stars',
    accentColor: '#C8E6C9',
    emojiSize: 0.5,
  },
  avatar_v2_caliz: {
    gradientColors: ['#FCE4EC', '#F48FB1', '#C2185B'],
    glowColor: '#C2185B',
    accentShape: 'rings',
    accentColor: '#F8BBD0',
    emojiSize: 0.5,
  },
  avatar_v2_ancla_esperanza: {
    gradientColors: ['#E3F2FD', '#90CAF9', '#1565C0'],
    glowColor: '#1565C0',
    accentShape: 'waves',
    accentColor: '#BBDEFB',
    emojiSize: 0.5,
  },
  avatar_v2_pan_uvas: {
    gradientColors: ['#EDE7F6', '#CE93D8', '#7B1FA2'],
    glowColor: '#7B1FA2',
    accentShape: 'dots',
    accentColor: '#D1C4E9',
    emojiSize: 0.5,
  },

  // ─── Naturaleza Sagrada ───────────────────────────────────────────────────
  avatar_v2_rama_olivo: {
    gradientColors: ['#F1F8E9', '#AED581', '#558B2F'],
    glowColor: '#558B2F',
    accentShape: 'dots',
    accentColor: '#DCEDC8',
    emojiSize: 0.5,
  },
  avatar_v2_pez_ichthys: {
    gradientColors: ['#E0F7FA', '#80DEEA', '#00838F'],
    glowColor: '#00838F',
    accentShape: 'waves',
    accentColor: '#B2EBF2',
    emojiSize: 0.5,
  },
  avatar_v2_cordero: {
    gradientColors: ['#FAFAFA', '#E0E0E0', '#9E9E9E'],
    glowColor: '#BDBDBD',
    accentShape: 'rings',
    accentColor: '#F5F5F5',
    emojiSize: 0.5,
  },
  avatar_v2_leon: {
    gradientColors: ['#FFF8E1', '#FFD54F', '#E65100'],
    glowColor: '#E65100',
    accentShape: 'rays',
    accentColor: '#FFE0B2',
    emojiSize: 0.52,
  },
  avatar_v2_semilla_mostaza: {
    gradientColors: ['#F9FBE7', '#DCE775', '#827717'],
    glowColor: '#827717',
    accentShape: 'stars',
    accentColor: '#F0F4C3',
    emojiSize: 0.46,
  },
  avatar_v2_vid_racimos: {
    gradientColors: ['#EDE7F6', '#B39DDB', '#4527A0'],
    glowColor: '#4527A0',
    accentShape: 'dots',
    accentColor: '#D1C4E9',
    emojiSize: 0.5,
  },

  // ─── Virtudes ─────────────────────────────────────────────────────────────
  avatar_v2_gratitud: {
    gradientColors: ['#FCE4EC', '#F48FB1', '#AD1457'],
    glowColor: '#AD1457',
    accentShape: 'stars',
    accentColor: '#F8BBD0',
    emojiSize: 0.5,
  },
  avatar_v2_fe: {
    gradientColors: ['#E8EAF6', '#9FA8DA', '#283593'],
    glowColor: '#283593',
    accentShape: 'cross',
    accentColor: '#C5CAE9',
    emojiSize: 0.5,
  },
  avatar_v2_amor: {
    gradientColors: ['#FFF3E0', '#FFCC80', '#E65100'],
    glowColor: '#E65100',
    accentShape: 'rays',
    accentColor: '#FFE0B2',
    emojiSize: 0.5,
  },
  avatar_v2_paz: {
    gradientColors: ['#E0F4FF', '#80DEEA', '#006064'],
    glowColor: '#006064',
    accentShape: 'waves',
    accentColor: '#B2EBF2',
    emojiSize: 0.5,
  },
  avatar_v2_gozo: {
    gradientColors: ['#FFFDE7', '#FFF176', '#F57F17'],
    glowColor: '#F57F17',
    accentShape: 'rays',
    accentColor: '#FFF9C4',
    emojiSize: 0.52,
  },
  avatar_v2_valentia: {
    gradientColors: ['#F3E5F5', '#CE93D8', '#4A148C'],
    glowColor: '#4A148C',
    accentShape: 'cross',
    accentColor: '#E1BEE7',
    emojiSize: 0.5,
  },

  // ─── Kids ─────────────────────────────────────────────────────────────────
  avatar_v2_estrellita: {
    gradientColors: ['#FFFDE7', '#FFF176', '#FFD600'],
    glowColor: '#FFD600',
    accentShape: 'stars',
    accentColor: '#FFF9C4',
    emojiSize: 0.52,
  },
  avatar_v2_arcoiris: {
    gradientColors: ['#E3F2FD', '#BBDEFB', '#E8F5E9'],
    glowColor: '#90CAF9',
    accentShape: 'none',
    emojiSize: 0.52,
  },
  avatar_v2_nube: {
    gradientColors: ['#F5F5F5', '#E0E0E0', '#BDBDBD'],
    glowColor: '#90CAF9',
    accentShape: 'dots',
    accentColor: '#E3F2FD',
    emojiSize: 0.52,
  },
  avatar_v2_angelito: {
    gradientColors: ['#FFF8E1', '#FFE082', '#FFF3E0'],
    glowColor: '#FFD54F',
    accentShape: 'rays',
    accentColor: '#FFFDE7',
    emojiSize: 0.52,
  },

  // ─── Level 2: Virtudes del Reino ─────────────────────────────────────────
  avatar_l2_corazon_agradecido: {
    gradientColors: ['#FFF0F5', '#FFB3C8', '#E91E63'],
    glowColor: '#E91E63',
    accentShape: 'rays',
    accentColor: '#FFD6E3',
    emojiSize: 0.5,
  },
  avatar_l2_espiritu_humilde: {
    gradientColors: ['#F5F0E8', '#D4C5A9', '#8D7B68'],
    glowColor: '#8D7B68',
    accentShape: 'dots',
    accentColor: '#EDE3D4',
    emojiSize: 0.5,
  },
  avatar_l2_gozo_constante: {
    gradientColors: ['#FFFDE7', '#FFE57F', '#FF6F00'],
    glowColor: '#FF6F00',
    accentShape: 'rays',
    accentColor: '#FFF9C4',
    emojiSize: 0.52,
  },
  avatar_l2_fe_inquebrantable: {
    gradientColors: ['#ECEFF1', '#90A4AE', '#263238'],
    glowColor: '#455A64',
    accentShape: 'rings',
    accentColor: '#B0BEC5',
    emojiSize: 0.48,
  },
  avatar_l2_amor_sacrificial: {
    gradientColors: ['#FFF3E0', '#FF8A65', '#BF360C'],
    glowColor: '#BF360C',
    accentShape: 'flame',
    accentColor: '#FFCCBC',
    emojiSize: 0.5,
  },
  avatar_l2_paz_permanece: {
    gradientColors: ['#E0F7FA', '#4DD0E1', '#006064'],
    glowColor: '#006064',
    accentShape: 'waves',
    accentColor: '#B2EBF2',
    emojiSize: 0.5,
  },

  // ─── Level 2: Los Llamados ────────────────────────────────────────────────
  avatar_l2_siervo_fiel: {
    gradientColors: ['#E8F5E9', '#81C784', '#2E7D32'],
    glowColor: '#2E7D32',
    accentShape: 'dots',
    accentColor: '#C8E6C9',
    emojiSize: 0.5,
  },
  avatar_l2_guerrero_oracion: {
    gradientColors: ['#EDE7F6', '#9575CD', '#311B92'],
    glowColor: '#311B92',
    accentShape: 'cross',
    accentColor: '#D1C4E9',
    emojiSize: 0.5,
  },
  avatar_l2_portador_luz: {
    gradientColors: ['#FFFDE7', '#FFF176', '#F9A825'],
    glowColor: '#F9A825',
    accentShape: 'rays',
    accentColor: '#FFF9C4',
    emojiSize: 0.5,
  },
  avatar_l2_atalaya: {
    gradientColors: ['#E3F2FD', '#64B5F6', '#0D47A1'],
    glowColor: '#0D47A1',
    accentShape: 'rings',
    accentColor: '#BBDEFB',
    emojiSize: 0.48,
  },
  avatar_l2_sembrador: {
    gradientColors: ['#F1F8E9', '#AED581', '#33691E'],
    glowColor: '#33691E',
    accentShape: 'stars',
    accentColor: '#DCEDC8',
    emojiSize: 0.5,
  },
  avatar_l2_testigo: {
    gradientColors: ['#FCE4EC', '#EF9A9A', '#B71C1C'],
    glowColor: '#B71C1C',
    accentShape: 'rays',
    accentColor: '#FFCDD2',
    emojiSize: 0.5,
  },

  // ─── Level 2: Simbolos Profundos ─────────────────────────────────────────
  avatar_l2_lampara_encendida: {
    gradientColors: ['#FFF8E1', '#FFD54F', '#E65100'],
    glowColor: '#E65100',
    accentShape: 'flame',
    accentColor: '#FFE0B2',
    emojiSize: 0.5,
  },
  avatar_l2_corona_vida: {
    gradientColors: ['#FFF9C4', '#FFEE58', '#F57F17'],
    glowColor: '#F57F17',
    accentShape: 'crown',
    accentColor: '#FFF9C4',
    emojiSize: 0.5,
  },
  avatar_l2_espada_espiritu: {
    gradientColors: ['#E8EAF6', '#7986CB', '#1A237E'],
    glowColor: '#3949AB',
    accentShape: 'cross',
    accentColor: '#C5CAE9',
    emojiSize: 0.52,
  },
  avatar_l2_ancla_alma: {
    gradientColors: ['#E3F2FD', '#42A5F5', '#0D47A1'],
    glowColor: '#1565C0',
    accentShape: 'waves',
    accentColor: '#BBDEFB',
    emojiSize: 0.5,
  },
  avatar_l2_pergamino_vivo: {
    gradientColors: ['#FDF6E3', '#DEB887', '#8B6914'],
    glowColor: '#8B6914',
    accentShape: 'scroll',
    accentColor: '#F5E6C8',
    emojiSize: 0.5,
  },
  avatar_l2_fuente_agua: {
    gradientColors: ['#E0F4FF', '#29B6F6', '#01579B'],
    glowColor: '#0277BD',
    accentShape: 'waves',
    accentColor: '#B3E5FC',
    emojiSize: 0.5,
  },
  // ─── Aventuras Bíblicas ───────────────────────────────────────────────────
  avatar_adv_jonah_whale: {
    gradientColors: ['#0D2B52', '#1A4A7A', '#0A1A3A'],
    glowColor: '#1E88E5',
    accentShape: 'waves',
    accentColor: '#1565C0',
    emojiSize: 0.56,
  },
};

function AccentShape({
  shape,
  color,
  size,
}: {
  shape: V2Style['accentShape'];
  color: string;
  size: number;
}) {
  if (!shape || shape === 'none') return null;

  const center = size / 2;
  const r = size * 0.45;

  if (shape === 'rays') {
    const rayCount = 8;
    const rayLen = size * 0.12;
    const innerR = size * 0.35;
    return (
      <View style={{ position: 'absolute', width: size, height: size }}>
        {Array.from({ length: rayCount }).map((_, i) => {
          const angle = (i * Math.PI * 2) / rayCount;
          const x = center + innerR * Math.cos(angle) - 1;
          const y = center + innerR * Math.sin(angle) - rayLen / 2;
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: 2,
                height: rayLen,
                borderRadius: 1,
                backgroundColor: color,
                transform: [{ rotate: `${(angle * 180) / Math.PI + 90}deg` }],
                opacity: 0.7,
              }}
            />
          );
        })}
      </View>
    );
  }

  if (shape === 'stars') {
    const positions: Array<{ top?: number; bottom?: number; left?: number; right?: number }> = [
      { top: size * 0.1, left: size * 0.15 },
      { top: size * 0.1, right: size * 0.15 },
      { bottom: size * 0.15, left: size * 0.2 },
      { bottom: size * 0.15, right: size * 0.2 },
    ];
    return (
      <View style={{ position: 'absolute', width: size, height: size }}>
        {positions.map((pos, i) => (
          <Text
            key={i}
            style={{
              position: 'absolute',
              fontSize: size * 0.1,
              opacity: 0.8,
              color,
              ...pos,
            }}
          >
            ✦
          </Text>
        ))}
      </View>
    );
  }

  if (shape === 'dots') {
    const dotCount = 6;
    return (
      <View style={{ position: 'absolute', width: size, height: size }}>
        {Array.from({ length: dotCount }).map((_, i) => {
          const angle = (i * Math.PI * 2) / dotCount;
          const x = center + r * Math.cos(angle) - 3;
          const y = center + r * Math.sin(angle) - 3;
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: color,
                opacity: 0.6,
              }}
            />
          );
        })}
      </View>
    );
  }

  if (shape === 'rings') {
    return (
      <View style={{ position: 'absolute', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: size * 0.88,
            height: size * 0.88,
            borderRadius: size * 0.44,
            borderWidth: 1,
            borderColor: color,
            opacity: 0.5,
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: size * 0.72,
            height: size * 0.72,
            borderRadius: size * 0.36,
            borderWidth: 1,
            borderColor: color,
            opacity: 0.3,
          }}
        />
      </View>
    );
  }

  if (shape === 'cross') {
    return (
      <View style={{ position: 'absolute', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {/* Horizontal bar */}
        <View style={{ position: 'absolute', width: size * 0.7, height: 2, backgroundColor: color, opacity: 0.3, borderRadius: 1 }} />
        {/* Vertical bar */}
        <View style={{ position: 'absolute', width: 2, height: size * 0.7, backgroundColor: color, opacity: 0.3, borderRadius: 1 }} />
      </View>
    );
  }

  if (shape === 'waves') {
    return (
      <View style={{ position: 'absolute', width: size, height: size }}>
        <View style={{
          position: 'absolute',
          bottom: size * 0.12,
          left: size * 0.1,
          right: size * 0.1,
          height: 2,
          borderRadius: 1,
          backgroundColor: color,
          opacity: 0.4,
        }} />
        <View style={{
          position: 'absolute',
          bottom: size * 0.2,
          left: size * 0.15,
          right: size * 0.15,
          height: 2,
          borderRadius: 1,
          backgroundColor: color,
          opacity: 0.25,
        }} />
      </View>
    );
  }

  if (shape === 'crown') {
    return (
      <View style={{ position: 'absolute', width: size, height: size, alignItems: 'center' }}>
        <View style={{ position: 'absolute', top: size * 0.08, flexDirection: 'row', gap: 3 }}>
          {[3, 5, 3].map((h, i) => (
            <View
              key={i}
              style={{
                width: 4,
                height: h,
                borderRadius: 2,
                backgroundColor: color,
                opacity: 0.6,
              }}
            />
          ))}
        </View>
      </View>
    );
  }

  if (shape === 'flame') {
    // Three rising vertical tapers at base — suggest a flame silhouette
    return (
      <View style={{ position: 'absolute', width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View style={{ flexDirection: 'row', gap: 3, position: 'absolute', bottom: size * 0.06 }}>
          {[size * 0.22, size * 0.32, size * 0.22].map((h, i) => (
            <View
              key={i}
              style={{
                width: 4,
                height: h,
                borderRadius: 3,
                backgroundColor: color,
                opacity: i === 1 ? 0.5 : 0.3,
              }}
            />
          ))}
        </View>
      </View>
    );
  }

  if (shape === 'scroll') {
    // Two horizontal lines suggesting a rolled parchment
    return (
      <View style={{ position: 'absolute', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', top: size * 0.14, width: size * 0.6, height: 3, borderRadius: 2, backgroundColor: color, opacity: 0.4 }} />
        <View style={{ position: 'absolute', bottom: size * 0.14, width: size * 0.6, height: 3, borderRadius: 2, backgroundColor: color, opacity: 0.4 }} />
        <View style={{ position: 'absolute', top: size * 0.22, width: size * 0.4, height: 2, borderRadius: 1, backgroundColor: color, opacity: 0.2 }} />
      </View>
    );
  }

  return null;
}

export function IllustratedAvatar({ avatarId, size = 64, emoji = '😊' }: IllustratedAvatarProps) {
  const style = V2_STYLES[avatarId];

  if (!style) {
    // Non-V2: plain emoji
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: size * 0.55 }}>{emoji}</Text>
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
      <LinearGradient
        colors={style.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      >
        <AccentShape shape={style.accentShape} color={style.accentColor ?? style.glowColor} size={size} />
        <Text style={{ fontSize: size * style.emojiSize, zIndex: 1 }}>{emoji}</Text>
      </LinearGradient>
    </View>
  );
}

export default IllustratedAvatar;
