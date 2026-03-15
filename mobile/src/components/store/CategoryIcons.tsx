import React from 'react';
import { View, Text } from 'react-native';
import { BookOpen } from 'lucide-react-native';
import { useScaledFont } from '@/lib/textScale';

// ─── Premium Category Icons ───────────────────────────────────────────────────
// Each icon is a 28×28 React Native component using View + LinearGradient shapes.
// They adapt color via props (active = bright, inactive = muted).

export function IconTemas({ color, active }: { color: string; active: boolean }) {
  const opacity = active ? 1 : 0.75;
  return (
    <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
      {/* Stacked palette layers */}
      <View style={{ position: 'absolute', bottom: 0, left: 1, width: 22, height: 14, borderRadius: 5, backgroundColor: color, opacity: opacity * 0.25 }} />
      <View style={{ position: 'absolute', bottom: 3, left: 3, width: 20, height: 13, borderRadius: 4, backgroundColor: color, opacity: opacity * 0.45 }} />
      <View style={{ position: 'absolute', bottom: 6, left: 2, width: 22, height: 12, borderRadius: 5, backgroundColor: color, opacity: opacity * 0.75 }} />
      {/* Light ray */}
      {active && (
        <View style={{ position: 'absolute', top: 0, left: 11, width: 2, height: 8, borderRadius: 1, backgroundColor: color, opacity: 0.9 }} />
      )}
      {/* Dot accents */}
      <View style={{ position: 'absolute', bottom: 8, left: 5, width: 4, height: 4, borderRadius: 2, backgroundColor: active ? '#fff' : color, opacity: opacity }} />
      <View style={{ position: 'absolute', bottom: 8, left: 11, width: 4, height: 4, borderRadius: 2, backgroundColor: active ? '#fff' : color, opacity: opacity * 0.7 }} />
      <View style={{ position: 'absolute', bottom: 8, right: 5, width: 4, height: 4, borderRadius: 2, backgroundColor: active ? '#fff' : color, opacity: opacity * 0.5 }} />
    </View>
  );
}

export function IconMarcos({ color, active }: { color: string; active: boolean }) {
  const opacity = active ? 1 : 0.75;
  return (
    <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer ring */}
      <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2.5, borderColor: color, opacity: opacity }} />
      {/* Inner ring */}
      <View style={{ position: 'absolute', width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: color, opacity: opacity * 0.5 }} />
      {/* Center dot */}
      <View style={{ position: 'absolute', width: 5, height: 5, borderRadius: 2.5, backgroundColor: color, opacity: opacity }} />
      {/* Glow ring when active */}
      {active && (
        <View style={{ position: 'absolute', width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: color, opacity: 0.3 }} />
      )}
    </View>
  );
}

export function IconTitulos({ color, active }: { color: string; active: boolean }) {
  const { sFont } = useScaledFont();
  const opacity = active ? 1 : 0.75;
  return (
    <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
      {/* Medal circle */}
      <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: color, opacity: opacity, position: 'absolute', bottom: 0 }} />
      {/* Medal ribbon left */}
      <View style={{
        position: 'absolute', top: 2, left: 5,
        width: 3, height: 11, borderRadius: 1.5,
        backgroundColor: color, opacity: opacity * 0.7,
        transform: [{ rotate: '-15deg' }],
      }} />
      {/* Medal ribbon right */}
      <View style={{
        position: 'absolute', top: 2, right: 5,
        width: 3, height: 11, borderRadius: 1.5,
        backgroundColor: color, opacity: opacity * 0.7,
        transform: [{ rotate: '15deg' }],
      }} />
      {/* Star in medal */}
      <View style={{ position: 'absolute', bottom: 4, width: 6, height: 6, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: sFont(6), color: active ? '#fff' : color, opacity: opacity }}>★</Text>
      </View>
    </View>
  );
}

export function IconAvatares({ color, active }: { color: string; active: boolean }) {
  const opacity = active ? 1 : 0.75;
  return (
    <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
      {/* Aura ring */}
      <View style={{ position: 'absolute', width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: color, opacity: opacity * 0.3 }} />
      {/* Head */}
      <View style={{ position: 'absolute', top: 3, width: 10, height: 10, borderRadius: 5, backgroundColor: color, opacity: opacity }} />
      {/* Shoulders */}
      <View style={{
        position: 'absolute', bottom: 2,
        width: 18, height: 9, borderRadius: 9,
        backgroundColor: color, opacity: opacity * 0.75,
      }} />
      {/* Halo when active */}
      {active && (
        <View style={{ position: 'absolute', top: 0, width: 12, height: 4, borderRadius: 2, borderWidth: 1.5, borderColor: color, opacity: 0.8 }} />
      )}
    </View>
  );
}

export function IconPaquetes({ color, active }: { color: string; active: boolean }) {
  const opacity = active ? 1 : 0.75;
  return (
    <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
      {/* Box body */}
      <View style={{ position: 'absolute', bottom: 0, width: 20, height: 14, borderRadius: 3, borderWidth: 2, borderColor: color, opacity: opacity }} />
      {/* Box lid */}
      <View style={{ position: 'absolute', bottom: 12, width: 22, height: 5, borderRadius: 2, borderWidth: 2, borderColor: color, opacity: opacity }} />
      {/* Ribbon vertical */}
      <View style={{ position: 'absolute', bottom: 0, left: 12, width: 2, height: 17, backgroundColor: color, opacity: opacity * 0.6 }} />
      {/* Light rays from box */}
      {active && (
        <>
          <View style={{ position: 'absolute', top: 1, left: 11, width: 1.5, height: 5, borderRadius: 1, backgroundColor: color, opacity: 0.8 }} />
          <View style={{ position: 'absolute', top: 2, left: 6, width: 1.5, height: 4, borderRadius: 1, backgroundColor: color, opacity: 0.5, transform: [{ rotate: '-30deg' }] }} />
          <View style={{ position: 'absolute', top: 2, right: 6, width: 1.5, height: 4, borderRadius: 1, backgroundColor: color, opacity: 0.5, transform: [{ rotate: '30deg' }] }} />
        </>
      )}
    </View>
  );
}

export function IconColecciones({ color, active }: { color: string; active: boolean }) {
  const opacity = active ? 1 : 0.75;
  return (
    <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
      {/* Stacked scroll cards */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, width: 20, height: 14, borderRadius: 4, borderWidth: 1.5, borderColor: color, opacity: opacity * 0.35, transform: [{ rotate: '-6deg' }] }} />
      <View style={{ position: 'absolute', bottom: 2, left: 1, width: 20, height: 14, borderRadius: 4, borderWidth: 1.5, borderColor: color, opacity: opacity * 0.6, transform: [{ rotate: '-2deg' }] }} />
      <View style={{ position: 'absolute', bottom: 4, left: 3, width: 20, height: 14, borderRadius: 4, backgroundColor: color, opacity: opacity * 0.15 }} />
      <View style={{ position: 'absolute', bottom: 4, left: 3, width: 20, height: 14, borderRadius: 4, borderWidth: 2, borderColor: color, opacity: opacity }} />
      {/* Lines inside top card */}
      <View style={{ position: 'absolute', bottom: 12, left: 6, width: 12, height: 1.5, borderRadius: 1, backgroundColor: active ? '#fff' : color, opacity: opacity * 0.8 }} />
      <View style={{ position: 'absolute', bottom: 9, left: 6, width: 8, height: 1.5, borderRadius: 1, backgroundColor: active ? '#fff' : color, opacity: opacity * 0.5 }} />
    </View>
  );
}

export function IconAventuras({ color, active }: { color: string; active: boolean }) {
  const opacity = active ? 1 : 0.75;
  return (
    <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center', opacity }}>
      <BookOpen size={20} color={active ? '#fff' : color} />
    </View>
  );
}

export function IconTokens({ color, active }: { color: string; active: boolean }) {
  const { sFont } = useScaledFont();
  const opacity = active ? 1 : 0.75;
  return (
    <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center', opacity }}>
      <Text style={{ fontSize: sFont(18), opacity }}>🖌️</Text>
    </View>
  );
}

export type CategoryType = 'themes' | 'frames' | 'titles' | 'avatars' | 'bundles' | 'collections' | 'adventures' | 'tokens';

export type CategoryIconComponent = (props: { color: string; active: boolean }) => React.ReactElement;

export const CATEGORIES: { key: CategoryType; IconComponent: CategoryIconComponent; label: string; labelEs: string; desc: string; descEs: string }[] = [
  { key: 'adventures', IconComponent: IconAventuras, label: 'Biblical Adventures', labelEs: 'Aventuras Bíblicas', desc: 'Collect rewards from biblical stories', descEs: 'Colecciona recompensas de historias bíblicas' },
  { key: 'collections', IconComponent: IconColecciones, label: 'Collections', labelEs: 'Colecciones', desc: 'Spiritual adventures that unlock step by step', descEs: 'Aventuras espirituales que se desbloquean paso a paso' },
  { key: 'themes', IconComponent: IconTemas, label: 'Themes', labelEs: 'Temas', desc: 'Change the visual appearance of the app', descEs: 'Cambia la apariencia visual de la app' },
  { key: 'avatars', IconComponent: IconAvatares, label: 'Avatars', labelEs: 'Avatares', desc: 'Customize your profile', descEs: 'Personaliza tu perfil' },
  { key: 'titles', IconComponent: IconTitulos, label: 'Titles', labelEs: 'Títulos', desc: 'Badges that show your progress', descEs: 'Insignias que muestran tu progreso' },
  { key: 'frames', IconComponent: IconMarcos, label: 'Frames', labelEs: 'Marcos', desc: 'Decorations for your devotionals', descEs: 'Decoraciones para tus devocionales' },
  { key: 'bundles', IconComponent: IconPaquetes, label: 'Bundles', labelEs: 'Paquetes', desc: 'Special content and rewards', descEs: 'Contenido especial y recompensas' },
  { key: 'tokens', IconComponent: IconTokens, label: 'Special Objects', labelEs: 'Objetos Especiales', desc: 'Special one-time use items', descEs: 'Ítems especiales de uso único' },
];
