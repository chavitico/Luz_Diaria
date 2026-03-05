// Background Music Provider - Instrumental Christian music for devotional reading

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Audio, AVPlaybackStatus, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { useUserSettings, useAppStore } from '@/lib/store';

// Music tracks - Local instrumental Christian music files
const MUSIC_TRACKS = [
  {
    id: 'christian_piano',
    name: 'Christian Piano',
    nameEs: 'Piano Cristiano',
    source: require('../../assets/audio/christian-piano.mp3'),
  },
  {
    id: 'the_mountain',
    name: 'The Mountain',
    nameEs: 'La Montaña',
    source: require('../../assets/audio/the-mountain.mp3'),
  },
  {
    id: 'guitar_worship',
    name: 'Guitar Worship',
    nameEs: 'Guitarra de Adoración',
    source: require('../../assets/audio/guitar-worship.mp3'),
  },
  {
    id: 'faith_song',
    name: 'Faith Song',
    nameEs: 'Canción de Fe',
    source: require('../../assets/audio/faith-song.mp3'),
  },
  {
    id: 'genesis',
    name: 'Genesis',
    nameEs: 'Génesis',
    source: require('../../assets/audio/genesis.mp3'),
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

const noopAsync = async () => {};

const FALLBACK_CONTEXT: MusicContextType = {
  isPlaying: false,
  currentTrack: '',
  volume: 0.5,
  isLoading: false,
  play: noopAsync,
  pause: noopAsync,
  stop: noopAsync,
  setTrack: noopAsync,
  setVolume: noopAsync,
  togglePlayback: noopAsync,
};

export function useMusicPlayer() {
  const context = useContext(MusicContext);
  return context ?? FALLBACK_CONTEXT;
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
  // Mutex: prevents concurrent play/load/toggle operations from stomping on each other
  const operationInProgressRef = useRef(false);

  // Initialize audio mode
  useEffect(() => {
    const initAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          // Allow mixing with other audio (like TTS)
          interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        });
        if (__DEV__) console.log('Audio mode initialized successfully');
      } catch (error) {
        if (__DEV__) console.log('Error initializing audio mode:', error);
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
      if (__DEV__) console.log('Track not found or no source:', trackId);
      return false;
    }

    try {
      setIsLoading(true);
      if (__DEV__) console.log('Loading track:', trackId);

      // Unload current sound if exists
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Load new sound from local asset with a gentle fade-in via initial volume 0
      const { sound } = await Audio.Sound.createAsync(
        track.source,
        {
          shouldPlay: false,
          isLooping: true,
          volume: 0,  // start silent, fade in after play starts
        },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setCurrentTrack(trackId);
      setIsLoading(false);
      if (__DEV__) console.log('Track loaded successfully:', trackId);
      return true;
    } catch (error) {
      if (__DEV__) console.log('Error loading track:', error);
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
    // Mutex: ignore if another operation is already in progress
    if (operationInProgressRef.current) {
      if (__DEV__) console.log('Play ignored — operation already in progress');
      return;
    }
    operationInProgressRef.current = true;

    try {
      if (__DEV__) console.log('Play called, soundRef.current:', !!soundRef.current);
      if (!soundRef.current) {
        const loaded = await loadTrack(currentTrack);
        if (!loaded) {
          if (__DEV__) console.log('Failed to load track for playback');
          return;
        }
      }

      if (__DEV__) console.log('Starting playback...');
      await soundRef.current?.playAsync();
      setIsPlaying(true);
      updateSettings({ musicEnabled: true });

      // Fade in: ramp volume from 0 → target over ~800ms
      const target = volume;
      const steps = 16;
      const stepMs = 50;
      for (let i = 1; i <= steps; i++) {
        await new Promise<void>((r) => setTimeout(r, stepMs));
        const v = (target * i) / steps;
        try { await soundRef.current?.setVolumeAsync(v); } catch {}
      }
      if (__DEV__) console.log('Playback started successfully');
    } catch (error) {
      if (__DEV__) console.log('Error playing:', error);
    } finally {
      operationInProgressRef.current = false;
    }
  }, [currentTrack, loadTrack, updateSettings, volume]);

  const pause = useCallback(async () => {
    if (operationInProgressRef.current) {
      if (__DEV__) console.log('Pause ignored — operation already in progress');
      return;
    }
    operationInProgressRef.current = true;

    try {
      // Fade out before pausing
      const current = volume;
      const steps = 10;
      const stepMs = 40;
      for (let i = steps - 1; i >= 0; i--) {
        await new Promise<void>((r) => setTimeout(r, stepMs));
        const v = (current * i) / steps;
        try { await soundRef.current?.setVolumeAsync(v); } catch {}
      }
      await soundRef.current?.pauseAsync();
      setIsPlaying(false);
    } catch (error) {
      if (__DEV__) console.log('Error pausing:', error);
    } finally {
      operationInProgressRef.current = false;
    }
  }, [volume]);

  const stop = useCallback(async () => {
    try {
      // Fade out before stopping
      const current = volume;
      const steps = 10;
      for (let i = steps - 1; i >= 0; i--) {
        await new Promise<void>((r) => setTimeout(r, 40));
        try { await soundRef.current?.setVolumeAsync((current * i) / steps); } catch {}
      }
      await soundRef.current?.stopAsync();
      await soundRef.current?.setPositionAsync(0);
      setIsPlaying(false);
    } catch (error) {
      if (__DEV__) console.log('Error stopping:', error);
    }
  }, [volume]);

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
      if (__DEV__) console.log('Error setting volume:', error);
    }
  }, [updateSettings]);

  const togglePlayback = useCallback(async () => {
    // Mutex check at toggle level too — debounces rapid taps
    if (operationInProgressRef.current) {
      if (__DEV__) console.log('Toggle ignored — operation already in progress');
      return;
    }
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
