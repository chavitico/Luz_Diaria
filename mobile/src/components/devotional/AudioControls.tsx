import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Pause, Play, Volume2, VolumeX, Music } from 'lucide-react-native';
import { useThemeColors } from '@/lib/store';
import { MUSIC_TRACKS } from '@/components/BackgroundMusicProvider';

// Audio Controls Component — simplified: only Play/Pause TTS and Play/Pause Music
// Voices removed; speed fixed at 0.90x. Music track selector kept.
function AudioControls({
  colors,
  language,
  onMusicToggle,
  onMusicVolumeChange,
  musicEnabled,
  musicVolume,
  currentTrack,
  onTrackChange,
  onTTSPlay,
  onTTSPause,
  isTTSPlaying,
  musicIsLoading,
}: {
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onMusicToggle: () => void;
  onMusicVolumeChange: (value: number) => void;
  musicEnabled: boolean;
  musicVolume: number;
  currentTrack: string;
  onTrackChange: (trackId: string) => void;
  onTTSPlay: () => void;
  onTTSPause: () => void;
  isTTSPlaying: boolean;
  musicIsLoading: boolean;
}) {
  const [showMusicSettings, setShowMusicSettings] = useState(false);

  return (
    <View className="mb-6">
      <View
        className="flex-row items-center justify-between px-4 py-3 rounded-2xl"
        style={{ backgroundColor: colors.surface }}
      >
        {/* Left: TTS Play/Pause */}
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={isTTSPlaying ? onTTSPause : onTTSPlay}
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary }}
            onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            {isTTSPlaying ? (
              <Pause size={20} color={colors.primaryText} fill={colors.primaryText} />
            ) : (
              <Play size={20} color={colors.primaryText} fill={colors.primaryText} />
            )}
          </Pressable>
          <Text className="text-xs" style={{ color: colors.textMuted }}>
            {language === 'es' ? 'Narración' : 'Narration'}
          </Text>
        </View>

        {/* Right: Music Play/Pause + Music settings gear */}
        <View className="flex-row items-center gap-2">
          <Text className="text-xs" style={{ color: colors.textMuted }}>
            {language === 'es' ? 'Música' : 'Music'}
          </Text>
          <Pressable
            onPress={() => {
              if (musicIsLoading) return;
              onMusicToggle();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: musicEnabled ? colors.primary : colors.textMuted + '30', opacity: musicIsLoading ? 0.6 : 1 }}
          >
            {musicIsLoading ? (
              <ActivityIndicator size="small" color={musicEnabled ? colors.primaryText : colors.textMuted} />
            ) : musicEnabled ? (
              <Volume2 size={20} color={colors.primaryText} />
            ) : (
              <VolumeX size={20} color={colors.textMuted} />
            )}
          </Pressable>
          <Pressable
            onPress={() => {
              setShowMusicSettings((v) => !v);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{
              backgroundColor: showMusicSettings ? colors.primary + '30' : colors.textMuted + '20',
              borderWidth: 1,
              borderColor: showMusicSettings ? colors.primary + '60' : colors.textMuted + '30',
            }}
          >
            <Music size={16} color={showMusicSettings ? colors.primary : colors.textMuted} />
          </Pressable>
        </View>
      </View>

      {/* Music Settings Panel — track picker only */}
      {showMusicSettings && (
        <Animated.View
          entering={FadeIn.duration(200)}
          className="mt-3 p-4 rounded-2xl"
          style={{ backgroundColor: colors.surface }}
        >
          <Text className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
            {language === 'es' ? 'Pista de Música' : 'Music Track'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            {MUSIC_TRACKS.map((track) => (
              <Pressable
                key={track.id}
                onPress={() => {
                  onTrackChange(track.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                className="mr-2 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: currentTrack === track.id ? colors.primary : colors.textMuted + '20',
                }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{ color: currentTrack === track.id ? colors.primaryText : colors.text }}
                >
                  {language === 'es' ? track.nameEs : track.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

export default AudioControls;
