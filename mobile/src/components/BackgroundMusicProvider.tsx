// Background Music Provider - Instrumental Christian music for devotional reading

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { useUserSettings, useAppStore } from '@/lib/store';

// Music tracks - Local instrumental Christian music files
const MUSIC_TRACKS = [
  {
    id: 'christian_piano',
    name: 'Christian Piano',
    nameEs: 'Piano Cristiano',
    source: require('@/assets/audio/christian-piano.mp3'),
  },
  {
    id: 'the_mountain',
    name: 'The Mountain',
    nameEs: 'La Montaña',
    source: require('@/assets/audio/the-mountain.mp3'),
  },
  {
    id: 'guitar_worship',
    name: 'Guitar Worship',
    nameEs: 'Guitarra de Adoración',
    source: require('@/assets/audio/guitar-worship.mp3'),
  },
  {
    id: 'faith_song',
    name: 'Faith Song',
    nameEs: 'Canción de Fe',
    source: require('@/assets/audio/faith-song.mp3'),
  },
  {
    id: 'genesis',
    name: 'Genesis',
    nameEs: 'Génesis',
    source: require('@/assets/audio/genesis.mp3'),
  },
];

export { MUSIC_TRACKS };

interface MusicContextType {
  isPlaying: boolean;
  currentTrack: string;
  volume: number;
  isLoading: boolean;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  setTrack: (trackId: string) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  togglePlayback: () => Promise<void>;
}

const MusicContext = createContext<MusicContextType | null>(null);

export function useMusicPlayer() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within BackgroundMusicProvider');
  }
  return context;
}

interface BackgroundMusicProviderProps {
  children: React.ReactNode;
}

export function BackgroundMusicProvider({ children }: BackgroundMusicProviderProps) {
  const settings = useUserSettings();
  const updateSettings = useAppStore((s) => s.updateSettings);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState('christian_piano');
  const [volume, setVolumeState] = useState(settings.musicVolume ?? 0.2);
  const [isLoading, setIsLoading] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);

  // Initialize audio mode
  useEffect(() => {
    const initAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.log('Error initializing audio mode:', error);
      }
    };

    initAudio();

    return () => {
      // Cleanup on unmount
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Sync with global settings
  useEffect(() => {
    setVolumeState(settings.musicVolume ?? 0.2);

    // Auto-play if music is enabled in settings
    if (settings.musicEnabled && !isPlaying && soundRef.current) {
      soundRef.current.playAsync();
    } else if (!settings.musicEnabled && isPlaying && soundRef.current) {
      soundRef.current.pauseAsync();
    }
  }, [settings.musicEnabled, settings.musicVolume]);

  // Update volume when it changes
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.setVolumeAsync(volume);
    }
  }, [volume]);

  const loadTrack = useCallback(async (trackId: string) => {
    const track = MUSIC_TRACKS.find((t) => t.id === trackId);
    if (!track || !track.source) {
      console.log('Track not found or no source:', trackId);
      return false;
    }

    try {
      setIsLoading(true);

      // Unload current sound if exists
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Load new sound from local asset
      const { sound } = await Audio.Sound.createAsync(
        track.source,
        {
          shouldPlay: false,
          isLooping: true,
          volume: volume,
        },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setCurrentTrack(trackId);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.log('Error loading track:', error);
      setIsLoading(false);
      return false;
    }
  }, [volume]);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
    }
  };

  const play = useCallback(async () => {
    if (!soundRef.current) {
      // Try to load the current track first
      const loaded = await loadTrack(currentTrack);
      if (!loaded) return;
    }

    try {
      await soundRef.current?.playAsync();
      setIsPlaying(true);
      updateSettings({ musicEnabled: true });
    } catch (error) {
      console.log('Error playing:', error);
    }
  }, [currentTrack, loadTrack, updateSettings]);

  const pause = useCallback(async () => {
    try {
      await soundRef.current?.pauseAsync();
      setIsPlaying(false);
    } catch (error) {
      console.log('Error pausing:', error);
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      await soundRef.current?.stopAsync();
      await soundRef.current?.setPositionAsync(0);
      setIsPlaying(false);
    } catch (error) {
      console.log('Error stopping:', error);
    }
  }, []);

  const setTrack = useCallback(async (trackId: string) => {
    const wasPlaying = isPlaying;
    await loadTrack(trackId);
    if (wasPlaying) {
      await play();
    }
  }, [isPlaying, loadTrack, play]);

  const setVolume = useCallback(async (newVolume: number) => {
    setVolumeState(newVolume);
    updateSettings({ musicVolume: newVolume });
    try {
      await soundRef.current?.setVolumeAsync(newVolume);
    } catch (error) {
      console.log('Error setting volume:', error);
    }
  }, [updateSettings]);

  const togglePlayback = useCallback(async () => {
    if (isPlaying) {
      await pause();
      updateSettings({ musicEnabled: false });
    } else {
      await play();
      updateSettings({ musicEnabled: true });
    }
  }, [isPlaying, pause, play, updateSettings]);

  const value: MusicContextType = {
    isPlaying,
    currentTrack,
    volume,
    isLoading,
    play,
    pause,
    stop,
    setTrack,
    setVolume,
    togglePlayback,
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
}
