import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/lib/store';

export interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  colors: ReturnType<typeof useThemeColors>;
}

function StatCard({ icon, value, label, colors }: StatCardProps) {
  return (
    <View
      className="flex-1 p-4 rounded-2xl items-center"
      style={{ backgroundColor: colors.surface }}
    >
      {icon}
      <Text className="text-2xl font-bold mt-2" style={{ color: colors.text }}>
        {value}
      </Text>
      <Text className="text-xs mt-1" style={{ color: colors.textMuted }}>
        {label}
      </Text>
    </View>
  );
}

export default StatCard;
