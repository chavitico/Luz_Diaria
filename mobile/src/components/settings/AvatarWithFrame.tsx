import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/lib/store';
import { AVATAR_FRAMES } from '@/lib/constants';

// Avatar with Frame component
function AvatarWithFrame({
  emoji,
  frameId,
  size = 64
}: {
  emoji: string;
  frameId?: string | null;
  size?: number
}) {
  const colors = useThemeColors();
  const frameColor = frameId ? AVATAR_FRAMES[frameId]?.color : null;

  return (
    <View
      className="items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        borderWidth: frameColor ? 3 : 0,
        borderColor: frameColor || 'transparent',
        backgroundColor: colors.primary + '15',
      }}
    >
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
  );
}

export default AvatarWithFrame;
