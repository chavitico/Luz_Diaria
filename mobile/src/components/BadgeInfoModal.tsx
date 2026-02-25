// BadgeInfoModal — tapping a badge shows its spiritual meaning
// variant='community'  → meaning only (no how-to-earn)
// variant='settings'   → meaning + how-to-earn section
import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Path, Ellipse, Line, Rect, G } from 'react-native-svg';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BADGES } from '@/lib/constants';
import { useThemeColors } from '@/lib/store';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Re-use the same SVG symbol components from BadgeChip ──────────────────────
interface SymbolProps { size: number; color: string; }

function FounderSymbol({ size, color }: SymbolProps) {
  const s = size / 24;
  return (
    <G>
      <Circle cx={12*s} cy={12*s} r={7*s} fill={color+'18'} />
      <Path d={`M${12*s} ${5.5*s} C${10.5*s} ${7*s} ${8.5*s} ${9*s} ${9*s} ${11.5*s} C${9.3*s} ${13*s} ${10.2*s} ${13.8*s} ${11*s} ${14.5*s} C${10.8*s} ${13.2*s} ${11.5*s} ${12.2*s} ${12*s} ${12*s} C${12.5*s} ${12.2*s} ${13.2*s} ${13.2*s} ${13*s} ${14.5*s} C${13.8*s} ${13.8*s} ${14.7*s} ${13*s} ${15*s} ${11.5*s} C${15.5*s} ${9*s} ${13.5*s} ${7*s} ${12*s} ${5.5*s}Z`} fill={color} opacity={0.95} />
      <Path d={`M${12*s} ${8*s} C${11.2*s} ${9.2*s} ${10.8*s} ${10.5*s} ${11.2*s} ${11.8*s} C${11.5*s} ${12.8*s} ${12*s} ${12.5*s} ${12.8*s} ${11.8*s} C${13.2*s} ${10.5*s} ${12.8*s} ${9.2*s} ${12*s} ${8*s}Z`} fill="#FFFFFF" opacity={0.45} />
      <Ellipse cx={12*s} cy={15*s} rx={3*s} ry={0.7*s} fill={color} opacity={0.25} />
    </G>
  );
}
function SproutSymbol({ size, color }: SymbolProps) {
  const s = size / 24;
  return (
    <G>
      <Ellipse cx={12*s} cy={16.5*s} rx={4.5*s} ry={1*s} fill={color} opacity={0.18} />
      <Path d={`M${12*s} ${16*s} L${12*s} ${10*s}`} stroke={color} strokeWidth={1.3*s} strokeLinecap="round" />
      <Path d={`M${12*s} ${12.5*s} C${10*s} ${12*s} ${9*s} ${10.5*s} ${9.5*s} ${9*s} C${10.5*s} ${9.5*s} ${11.5*s} ${10.5*s} ${12*s} ${12.5*s}Z`} fill={color} opacity={0.9} />
      <Path d={`M${12*s} ${11*s} C${14*s} ${10.5*s} ${15.5*s} ${9*s} ${15*s} ${7.5*s} C${13.5*s} ${8*s} ${12.5*s} ${9*s} ${12*s} ${11*s}Z`} fill={color} opacity={0.75} />
      <Circle cx={12*s} cy={9.5*s} r={1*s} fill={color} opacity={0.95} />
    </G>
  );
}
function PrayerSymbol({ size, color }: SymbolProps) {
  const s = size / 24;
  return (
    <G>
      <Circle cx={12*s} cy={12*s} r={4*s} fill={color+'15'} />
      <Path d={`M${7*s} ${16*s} C${8*s} ${14*s} ${10*s} ${12*s} ${12*s} ${10*s} C${12*s} ${8*s} ${11.5*s} ${7*s} ${11*s} ${7*s}`} stroke={color} strokeWidth={1.4*s} strokeLinecap="round" fill="none" opacity={0.95} />
      <Path d={`M${17*s} ${16*s} C${16*s} ${14*s} ${14*s} ${12*s} ${12*s} ${10*s} C${12*s} ${8*s} ${12.5*s} ${7*s} ${13*s} ${7*s}`} stroke={color} strokeWidth={1.4*s} strokeLinecap="round" fill="none" opacity={0.95} />
      <Circle cx={12*s} cy={10*s} r={1.2*s} fill={color} opacity={0.6} />
      <Path d={`M${7*s} ${16*s} L${17*s} ${16*s}`} stroke={color} strokeWidth={1*s} strokeLinecap="round" opacity={0.35} />
    </G>
  );
}
function GuardianSymbol({ size, color }: SymbolProps) {
  const s = size / 24;
  return (
    <G>
      <Path d={`M${12*s} ${10*s} L${10*s} ${6*s} M${12*s} ${10*s} L${12*s} ${6.5*s} M${12*s} ${10*s} L${14*s} ${6*s}`} stroke={color} strokeWidth={0.9*s} strokeLinecap="round" opacity={0.5} />
      <Path d={`M${8*s} ${10*s} C${8*s} ${10*s} ${9*s} ${9.5*s} ${12*s} ${10*s} L${12*s} ${17*s} C${9*s} ${16.5*s} ${8*s} ${17*s} ${8*s} ${17*s}Z`} fill={color} opacity={0.85} />
      <Path d={`M${16*s} ${10*s} C${16*s} ${10*s} ${15*s} ${9.5*s} ${12*s} ${10*s} L${12*s} ${17*s} C${15*s} ${16.5*s} ${16*s} ${17*s} ${16*s} ${17*s}Z`} fill={color} opacity={0.65} />
      <Line x1={12*s} y1={10*s} x2={12*s} y2={17*s} stroke={color} strokeWidth={0.8*s} opacity={0.4} />
      <Circle cx={12*s} cy={7*s} r={1.3*s} fill={color} opacity={0.9} />
    </G>
  );
}
function FaithPathSymbol({ size, color }: SymbolProps) {
  const s = size / 24;
  return (
    <G>
      <Ellipse cx={12*s} cy={9*s} rx={3.5*s} ry={1.5*s} fill={color} opacity={0.18} />
      <Circle cx={12*s} cy={8.5*s} r={2*s} fill={color} opacity={0.85} />
      <Circle cx={12*s} cy={8.5*s} r={1.1*s} fill="#FFFFFF" opacity={0.5} />
      <Path d={`M${7*s} ${18*s} L${12*s} ${11*s}`} stroke={color} strokeWidth={1.2*s} strokeLinecap="round" opacity={0.8} />
      <Path d={`M${17*s} ${18*s} L${12*s} ${11*s}`} stroke={color} strokeWidth={1.2*s} strokeLinecap="round" opacity={0.5} />
      <Circle cx={9*s} cy={15*s} r={0.8*s} fill={color} opacity={0.7} />
      <Circle cx={10.3*s} cy={13*s} r={0.6*s} fill={color} opacity={0.5} />
    </G>
  );
}
function HopeSymbol({ size, color }: SymbolProps) {
  const s = size / 24;
  return (
    <G>
      <Ellipse cx={12*s} cy={16*s} rx={4*s} ry={1*s} fill={color} opacity={0.15} />
      <Path d={`M${12*s} ${12*s} C${10*s} ${10.5*s} ${7.5*s} ${10*s} ${7*s} ${12*s} C${8.5*s} ${11.5*s} ${10.5*s} ${12*s} ${12*s} ${14*s}Z`} fill={color} opacity={0.9} />
      <Path d={`M${12*s} ${12*s} C${14*s} ${10.5*s} ${16.5*s} ${10*s} ${17*s} ${12*s} C${15.5*s} ${11.5*s} ${13.5*s} ${12*s} ${12*s} ${14*s}Z`} fill={color} opacity={0.65} />
      <Ellipse cx={12*s} cy={13.5*s} rx={1.3*s} ry={2*s} fill={color} opacity={0.95} />
      <Circle cx={12*s} cy={10.5*s} r={1.5*s} fill={color} opacity={0.95} />
      <Path d={`M${13.3*s} ${10.2*s} L${14.5*s} ${9.8*s} L${13.3*s} ${10.7*s}Z`} fill={color} opacity={0.7} />
    </G>
  );
}
function PeaceSymbol({ size, color }: SymbolProps) {
  const s = size / 24;
  return (
    <G>
      <Path d={`M${8*s} ${17*s} C${9*s} ${14*s} ${11*s} ${12*s} ${14*s} ${8*s}`} stroke={color} strokeWidth={1.3*s} strokeLinecap="round" fill="none" opacity={0.9} />
      <Path d={`M${10*s} ${14.5*s} C${8.5*s} ${13.5*s} ${8*s} ${12*s} ${9*s} ${11.5*s} C${10*s} ${11*s} ${10.5*s} ${13*s} ${10*s} ${14.5*s}Z`} fill={color} opacity={0.85} />
      <Path d={`M${12*s} ${11.5*s} C${13*s} ${10*s} ${14.5*s} ${9.5*s} ${15*s} ${10.5*s} C${14.5*s} ${11.5*s} ${13*s} ${12*s} ${12*s} ${11.5*s}Z`} fill={color} opacity={0.7} />
      <Circle cx={8.5*s} cy={9*s} r={0.9*s} fill={color} opacity={0.75} />
      <Circle cx={11*s} cy={7.5*s} r={0.7*s} fill={color} opacity={0.6} />
      <Circle cx={14*s} cy={6.5*s} r={0.8*s} fill={color} opacity={0.5} />
      <Ellipse cx={11*s} cy={8*s} rx={3.5*s} ry={2*s} fill={color} opacity={0.08} />
    </G>
  );
}
function PillarSymbol({ size, color }: SymbolProps) {
  const s = size / 24;
  return (
    <G>
      <Rect x={7*s} y={17*s} width={10*s} height={1.5*s} rx={0.5*s} fill={color} opacity={0.9} />
      <Rect x={7*s} y={7*s} width={10*s} height={1.5*s} rx={0.5*s} fill={color} opacity={0.9} />
      <Rect x={8.5*s} y={8.5*s} width={2.5*s} height={8.5*s} rx={1*s} fill={color} opacity={0.8} />
      <Rect x={13*s} y={8.5*s} width={2.5*s} height={8.5*s} rx={1*s} fill={color} opacity={0.6} />
      <Rect x={11.2*s} y={8.5*s} width={1.5*s} height={8.5*s} rx={0.7*s} fill={color} opacity={0.35} />
    </G>
  );
}
function ShieldSymbol({ size, color }: SymbolProps) {
  const s = size / 24;
  return (
    <G>
      <Path d={`M${12*s} ${6*s} L${17*s} ${8*s} L${17*s} ${13*s} C${17*s} ${16*s} ${12*s} ${18*s} ${12*s} ${18*s} C${12*s} ${18*s} ${7*s} ${16*s} ${7*s} ${13*s} L${7*s} ${8*s}Z`} fill={color} opacity={0.85} />
      <Path d={`M${12*s} ${8*s} L${15.5*s} ${9.5*s} L${15.5*s} ${13*s} C${15.5*s} ${15*s} ${12*s} ${16.5*s} ${12*s} ${16.5*s}Z`} fill="#FFFFFF" opacity={0.15} />
      <Line x1={12*s} y1={10*s} x2={12*s} y2={15*s} stroke="#FFFFFF" strokeWidth={1.3*s} strokeLinecap="round" opacity={0.7} />
      <Line x1={9.5*s} y1={12.5*s} x2={14.5*s} y2={12.5*s} stroke="#FFFFFF" strokeWidth={1.3*s} strokeLinecap="round" opacity={0.7} />
    </G>
  );
}

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

const RARITY_LABEL: Record<string, string> = {
  unique:  'Única',
  epic:    'Épica',
  rare:    'Especial',
  common:  'Común',
};

// ─── Component ───────────────────────────────────────────────────────────────
interface BadgeInfoModalProps {
  badgeId: string | null;
  visible: boolean;
  /** 'community' → meaning only; 'settings' → meaning + how-to-earn */
  variant?: 'community' | 'settings';
  onClose: () => void;
}

export function BadgeInfoModal({ badgeId, visible, variant = 'community', onClose }: BadgeInfoModalProps) {
  const colors = useThemeColors();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 22,
          stiffness: 180,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Animate out first, then tell parent to unmount
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      // Reset for next open
      slideAnim.setValue(SCREEN_HEIGHT);
      backdropAnim.setValue(0);
    });
  };

  if (!badgeId) return null;
  const badge = BADGES[badgeId];
  if (!badge) return null;

  const SymbolComponent = SYMBOL_MAP[badgeId] ?? FounderSymbol;
  const badgeColor = badge.color;
  const isUnique = badge.rarity === 'unique';
  const isEpic   = badge.rarity === 'epic';

  const medalSize = 80;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        style={{
          ...{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
          backgroundColor: 'rgba(0,0,0,0.45)',
          opacity: backdropAnim,
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={handleClose} />
      </Animated.View>

      {/* Bottom sheet */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingBottom: 40,
            // subtle top border matching badge color
            borderTopWidth: 2,
            borderTopColor: badgeColor + '40',
          }}
        >
          {/* Pull handle */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.textMuted + '40' }} />
          </View>

          {/* Close button */}
          <Pressable
            onPress={handleClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.textMuted + '18',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} color={colors.textMuted} />
          </Pressable>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 12 }}
          >
            {/* Large medal */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              {/* Outer glow ring */}
              <View
                style={{
                  width: medalSize + 16,
                  height: medalSize + 16,
                  borderRadius: (medalSize + 16) / 2,
                  backgroundColor: badgeColor + '0C',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: -8,
                }}
              />
              <View
                style={{
                  width: medalSize,
                  height: medalSize,
                  borderRadius: medalSize / 2,
                  backgroundColor: badgeColor + (isUnique ? '28' : '1A'),
                  borderWidth: isUnique ? 2.5 : isEpic ? 2 : 1.5,
                  borderColor: isUnique ? badgeColor : isEpic ? badgeColor + 'CC' : badgeColor + '90',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: badgeColor,
                  shadowOpacity: isUnique ? 0.55 : isEpic ? 0.4 : 0.22,
                  shadowRadius: isUnique ? 18 : isEpic ? 12 : 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: isUnique ? 8 : isEpic ? 5 : 3,
                }}
              >
                {/* Inner double ring */}
                <View
                  style={{
                    position: 'absolute',
                    width: medalSize - 8,
                    height: medalSize - 8,
                    borderRadius: (medalSize - 8) / 2,
                    borderWidth: 0.5,
                    borderColor: badgeColor + '50',
                  }}
                />
                <Svg width={medalSize * 0.65} height={medalSize * 0.65} viewBox="0 0 24 24">
                  <SymbolComponent size={24} color={badgeColor} />
                </Svg>
              </View>

              {/* Rarity pill */}
              <View
                style={{
                  marginTop: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 20,
                  backgroundColor: badgeColor + '20',
                  borderWidth: 1,
                  borderColor: badgeColor + '40',
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: badgeColor, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  {RARITY_LABEL[badge.rarity] ?? badge.rarity}
                </Text>
              </View>
            </View>

            {/* Badge name */}
            <Text
              style={{
                fontSize: 22,
                fontWeight: '800',
                color: colors.text,
                textAlign: 'center',
                letterSpacing: -0.3,
                marginBottom: 10,
              }}
            >
              {badge.nameEs}
            </Text>

            {/* Meaning */}
            <Text
              style={{
                fontSize: 15,
                lineHeight: 23,
                color: colors.textMuted,
                textAlign: 'center',
                fontStyle: 'italic',
                paddingHorizontal: 4,
                marginBottom: 4,
              }}
            >
              {badge.meaningEs}
            </Text>

            {/* Settings variant: how-to-earn */}
            {variant === 'settings' && (
              <>
                {/* Divider */}
                <View
                  style={{
                    marginTop: 22,
                    marginBottom: 18,
                    height: 1,
                    backgroundColor: colors.textMuted + '20',
                    marginHorizontal: 16,
                  }}
                />

                {/* How-to-earn */}
                <View
                  style={{
                    backgroundColor: badgeColor + '0D',
                    borderRadius: 14,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: badgeColor + '25',
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: badgeColor,
                      letterSpacing: 0.8,
                      textTransform: 'uppercase',
                      marginBottom: 8,
                    }}
                  >
                    ¿Cómo se obtiene?
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      lineHeight: 21,
                      color: colors.text,
                    }}
                  >
                    {badge.howToEarnEs}
                  </Text>
                </View>
              </>
            )}

            {/* Community hint (community variant only) */}
            {variant === 'community' && (
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textMuted,
                  textAlign: 'center',
                  marginTop: 16,
                  opacity: 0.7,
                }}
              >
                Puedes elegir esta insignia en Ajustes.
              </Text>
            )}

            <View style={{ height: 12 }} />
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
}
