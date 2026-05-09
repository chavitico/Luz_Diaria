import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/lib/store';

/** Premium section card — matches Mi Espacio card aesthetic */
function SectionCard({
  children,
  colors,
}: {
  children: React.ReactNode;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View
      style={{
        borderRadius: 20,
        marginBottom: 10,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <LinearGradient
        colors={[colors.primary + '18', colors.primary + '05', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20, padding: 1 }}
      >
        <View
          style={{
            borderRadius: 19,
            backgroundColor: colors.surface,
            paddingHorizontal: 16,
            paddingVertical: 8,
            overflow: 'hidden',
          }}
        >
          {children}
        </View>
      </LinearGradient>
    </View>
  );
}

export default SectionCard;
