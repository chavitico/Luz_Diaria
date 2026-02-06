// Onboarding Screen - Nickname and Avatar Selection

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Sun, ArrowRight, Check, AlertCircle } from 'lucide-react-native';
import { useAppStore } from '@/lib/store';
import { firestoreService } from '@/lib/firestore';
import { DEFAULT_AVATARS } from '@/lib/constants';
import { cn } from '@/lib/cn';

const { width } = Dimensions.get('window');

type Step = 'nickname' | 'avatar';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const setUser = useAppStore((s) => s.setUser);
  const setOnboarded = useAppStore((s) => s.setOnboarded);

  const [step, setStep] = useState<Step>('nickname');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nicknameValid, setNicknameValid] = useState(false);

  const buttonScale = useSharedValue(1);

  const handleCheckNickname = useCallback(async () => {
    const trimmed = nickname.trim();

    if (trimmed.length < 3 || trimmed.length > 15) {
      setError('Nickname must be 3-15 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError('Only letters, numbers, and underscore allowed');
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const available = await firestoreService.checkNicknameAvailable(trimmed);
      if (available) {
        setNicknameValid(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => setStep('avatar'), 300);
      } else {
        setError('This nickname is already taken');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setIsChecking(false);
    }
  }, [nickname]);

  const handleSelectAvatar = useCallback((avatarId: string) => {
    setSelectedAvatar(avatarId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleComplete = useCallback(async () => {
    if (!selectedAvatar) return;

    setIsCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const user = await firestoreService.createUser(nickname.trim(), selectedAvatar);
      setUser(user);
      setOnboarded(true);

      setTimeout(onComplete, 200);
    } catch {
      setError('Failed to create account. Please try again.');
      setIsCreating(false);
    }
  }, [nickname, selectedAvatar, setUser, setOnboarded, onComplete]);

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const unlockedAvatars = DEFAULT_AVATARS.filter((a) => 'unlocked' in a && a.unlocked);

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#FDF6E3', '#F5E6D3', '#E8D5C4']}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingTop: insets.top + 40,
              paddingBottom: insets.bottom + 20,
              paddingHorizontal: 24,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View
              entering={FadeInDown.duration(600)}
              className="items-center mb-12"
            >
              <View className="w-20 h-20 bg-white rounded-full items-center justify-center shadow-lg mb-6">
                <Sun size={40} color="#E8A87C" strokeWidth={1.5} />
              </View>
              <Text className="text-3xl font-bold text-gray-800 text-center">
                Welcome to Daily Light
              </Text>
              <Text className="text-base text-gray-500 mt-2 text-center">
                Your daily companion for faith, hope, and love
              </Text>
            </Animated.View>

            {step === 'nickname' ? (
              <Animated.View
                entering={FadeIn.duration(400)}
                className="flex-1"
              >
                {/* Nickname Input */}
                <View className="mb-8">
                  <Text className="text-lg font-semibold text-gray-700 mb-3">
                    Choose Your Nickname
                  </Text>
                  <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <TextInput
                      value={nickname}
                      onChangeText={(text) => {
                        setNickname(text);
                        setError(null);
                        setNicknameValid(false);
                      }}
                      placeholder="Enter a unique nickname"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={15}
                      className="px-5 py-4 text-lg text-gray-800"
                      style={{ fontSize: 18 }}
                    />
                  </View>

                  {/* Character count */}
                  <Text className="text-right text-gray-400 text-sm mt-2">
                    {nickname.length}/15 characters
                  </Text>

                  {/* Error message */}
                  {error && (
                    <Animated.View
                      entering={FadeIn.duration(200)}
                      className="flex-row items-center mt-3"
                    >
                      <AlertCircle size={16} color="#EF4444" />
                      <Text className="text-red-500 ml-2">{error}</Text>
                    </Animated.View>
                  )}
                </View>

                {/* Continue Button */}
                <Animated.View style={buttonAnimatedStyle}>
                  <Pressable
                    onPress={handleCheckNickname}
                    onPressIn={handleButtonPressIn}
                    onPressOut={handleButtonPressOut}
                    disabled={nickname.trim().length < 3 || isChecking}
                    className={cn(
                      'rounded-2xl overflow-hidden',
                      nickname.trim().length < 3 && 'opacity-50'
                    )}
                  >
                    <LinearGradient
                      colors={['#E8A87C', '#C38D9E']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        paddingVertical: 18,
                        paddingHorizontal: 32,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isChecking ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Text className="text-white text-lg font-semibold mr-2">
                            Continue
                          </Text>
                          <ArrowRight size={20} color="#FFFFFF" />
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
              </Animated.View>
            ) : (
              <Animated.View
                entering={FadeIn.duration(400)}
                className="flex-1"
              >
                {/* Avatar Selection */}
                <View className="mb-6">
                  <Text className="text-lg font-semibold text-gray-700 mb-1">
                    Choose Your Avatar
                  </Text>
                  <Text className="text-gray-500 mb-4">
                    Hello, {nickname}! Pick an avatar that represents you.
                  </Text>

                  <View className="flex-row flex-wrap justify-center gap-4">
                    {unlockedAvatars.map((avatar, index) => (
                      <Animated.View
                        key={avatar.id}
                        entering={FadeInUp.delay(index * 50).duration(300)}
                      >
                        <Pressable
                          onPress={() => handleSelectAvatar(avatar.id)}
                          className={cn(
                            'w-20 h-20 rounded-2xl items-center justify-center',
                            selectedAvatar === avatar.id
                              ? 'bg-amber-100 border-2 border-amber-400'
                              : 'bg-white border-2 border-transparent'
                          )}
                          style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: selectedAvatar === avatar.id ? 0.15 : 0.08,
                            shadowRadius: 8,
                            elevation: selectedAvatar === avatar.id ? 4 : 2,
                          }}
                        >
                          <Text style={{ fontSize: 36 }}>{avatar.emoji}</Text>
                          {selectedAvatar === avatar.id && (
                            <View className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full items-center justify-center">
                              <Check size={14} color="#FFFFFF" strokeWidth={3} />
                            </View>
                          )}
                        </Pressable>
                      </Animated.View>
                    ))}
                  </View>
                </View>

                {/* Get Started Button */}
                <View className="mt-auto pt-8">
                  <Animated.View style={buttonAnimatedStyle}>
                    <Pressable
                      onPress={handleComplete}
                      onPressIn={handleButtonPressIn}
                      onPressOut={handleButtonPressOut}
                      disabled={!selectedAvatar || isCreating}
                      className={cn(
                        'rounded-2xl overflow-hidden',
                        !selectedAvatar && 'opacity-50'
                      )}
                    >
                      <LinearGradient
                        colors={['#E8A87C', '#C38D9E']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          paddingVertical: 18,
                          paddingHorizontal: 32,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isCreating ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <>
                            <Text className="text-white text-lg font-semibold mr-2">
                              Get Started
                            </Text>
                            <ArrowRight size={20} color="#FFFFFF" />
                          </>
                        )}
                      </LinearGradient>
                    </Pressable>
                  </Animated.View>
                </View>
              </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
