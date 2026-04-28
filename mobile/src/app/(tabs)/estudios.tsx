import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/lib/store';
import { BookOpen } from 'lucide-react-native';

export default function EstudiosScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: insets.bottom + 56,
    }}>
      <BookOpen size={48} color={colors.textMuted} strokeWidth={1.5} />
      <Text style={{
        marginTop: 16,
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
      }}>
        Estudios Bíblicos
      </Text>
      <Text style={{
        marginTop: 8,
        fontSize: 15,
        color: colors.textMuted,
      }}>
        Próximamente
      </Text>
    </View>
  );
}
