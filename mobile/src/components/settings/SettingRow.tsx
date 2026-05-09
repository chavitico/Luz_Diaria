import React from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';

export interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  colors: ReturnType<typeof useThemeColors>;
  /** When true, removes the individual row background — use inside SectionCard */
  inCard?: boolean;
  /** When true, shows a bottom separator line */
  separator?: boolean;
}

function SettingRow({ icon, title, subtitle, right, onPress, colors, inCard, separator }: SettingRowProps) {
  const { sFont } = useScaledFont();
  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      disabled={!onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: inCard ? 0 : 16,
        backgroundColor: inCard ? 'transparent' : colors.surface,
        borderRadius: inCard ? 0 : 16,
        marginBottom: inCard ? 0 : 2,
        borderBottomWidth: separator ? 0.5 : 0,
        borderBottomColor: colors.textMuted + '20',
      }}
    >
      <View
        style={{
          width: 38, height: 38, borderRadius: 12,
          alignItems: 'center', justifyContent: 'center',
          marginRight: 14,
          backgroundColor: colors.primary + '15',
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: sFont(15), fontWeight: '500', color: colors.text }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: sFont(12), marginTop: 1, color: colors.textMuted }}>
            {subtitle}
          </Text>
        )}
      </View>
      {right || (onPress && <ChevronRight size={18} color={colors.textMuted} />)}
    </Pressable>
  );
}

export default SettingRow;
