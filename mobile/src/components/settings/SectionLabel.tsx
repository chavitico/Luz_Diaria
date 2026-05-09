import React from 'react';
import { Text } from 'react-native';
import { useThemeColors } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';

/** Muted section label */
function SectionLabel({ label, colors }: { label: string; colors: ReturnType<typeof useThemeColors> }) {
  const { sFont } = useScaledFont();
  return (
    <Text
      style={{
        fontSize: sFont(11),
        fontWeight: '700',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: colors.textMuted,
        marginBottom: 8,
        marginLeft: 4,
        marginTop: 20,
      }}
    >
      {label}
    </Text>
  );
}

export default SectionLabel;
