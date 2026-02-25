// Onboarding Screen — Spiritual intro + Nickname + Avatar Selection
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Sun, ArrowRight, Check, AlertCircle, X, Heart, Users, BookOpen, MapPin } from 'lucide-react-native';
import { useAppStore } from '@/lib/store';
import { firestoreService } from '@/lib/firestore';
import { gamificationApi } from '@/lib/gamification-api';
import { DEFAULT_AVATARS, APP_BRANDING } from '@/lib/constants';
import { CountryPickerModal, getCountryByCode, type Country } from '@/components/CountryPicker';

type Step = 'welcome' | 'expect' | 'invite' | 'nickname' | 'avatar' | 'country';

interface OnboardingScreenProps {
  onComplete: () => void;
}

// ── Soft background gradient per slide ───────────────────────────────────────
const SLIDE_GRADIENTS: Record<string, [string, string, string]> = {
  welcome: ['#FDF6E3', '#F5E6D3', '#EDD9C8'],
  expect:  ['#F0EAF8', '#E8DFF5', '#DDD4EE'],
  invite:  ['#E8F4F0', '#DCF0E8', '#CFE8DF'],
  nickname: ['#FDF6E3', '#F5E6D3', '#E8D5C4'],
  avatar:   ['#FDF6E3', '#F5E6D3', '#E8D5C4'],
  country:  ['#EAF4F8', '#DCE8F0', '#CFD5E8'],
};

// ── Slide 1 — Bienvenida ─────────────────────────────────────────────────────
function WelcomeSlide({
  onNext,
  insets,
}: {
  onNext: () => void;
  insets: ReturnType<typeof useSafeAreaInsets>;
}) {
  const buttonScale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({ transform: [{ scale: buttonScale.value }] }));

  return (
    <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 }}>
      {/* Icon */}
      <Animated.View entering={FadeInDown.delay(100).duration(700)} style={{ alignItems: 'center', marginBottom: 48 }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: 'rgba(255,255,255,0.85)',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#E8A87C',
            shadowOpacity: 0.25,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
            marginBottom: 32,
          }}
        >
          <Sun size={42} color="#E8A87C" strokeWidth={1.4} />
        </View>

        <Animated.View entering={FadeInDown.delay(250).duration(600)} style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: '#2D2D2D',
              textAlign: 'center',
              letterSpacing: -0.5,
              marginBottom: 14,
              lineHeight: 36,
            }}
          >
            Bienvenido/a a{'\n'}Luz Diaria
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#6B5B4E',
              textAlign: 'center',
              lineHeight: 24,
              marginBottom: 10,
            }}
          >
            Un espacio para encontrarte con Dios, cada día.
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: '#9C8070',
              textAlign: 'center',
              lineHeight: 21,
              fontStyle: 'italic',
            }}
          >
            No es prisa. No es obligación.{'\n'}Es un encuentro.
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* CTA */}
      <Animated.View entering={FadeInUp.delay(500).duration(500)} style={buttonStyle}>
        <Pressable
          onPressIn={() => { buttonScale.value = withSpring(0.96); }}
          onPressOut={() => { buttonScale.value = withSpring(1); }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onNext();
          }}
          style={{ borderRadius: 18, overflow: 'hidden' }}
        >
          <LinearGradient
            colors={['#E8A87C', '#C38D9E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 18,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.2 }}>
              Continuar
            </Text>
            <ArrowRight size={18} color="#fff" />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ── Slide 2 — Qué esperar ────────────────────────────────────────────────────
function ExpectSlide({
  onNext,
  insets,
}: {
  onNext: () => void;
  insets: ReturnType<typeof useSafeAreaInsets>;
}) {
  const buttonScale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({ transform: [{ scale: buttonScale.value }] }));

  const items = [
    { icon: <BookOpen size={22} color="#E8A87C" />, text: 'Un devocional corto cada mañana' },
    { icon: <Heart size={22} color="#C38D9E" />, text: 'Un momento de oración personal' },
    { icon: <Users size={22} color="#41B3A3" />, text: 'Una comunidad que ora contigo' },
  ];

  return (
    <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 }}>
      <Animated.View entering={FadeInDown.delay(100).duration(600)}>
        <Text
          style={{
            fontSize: 26,
            fontWeight: '800',
            color: '#2D2D2D',
            textAlign: 'center',
            letterSpacing: -0.5,
            lineHeight: 34,
            marginBottom: 10,
          }}
        >
          Cada día, una luz{'\n'}para tu camino
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: '#9C8070',
            textAlign: 'center',
            lineHeight: 21,
            fontStyle: 'italic',
            marginBottom: 48,
          }}
        >
          Simple. Sincero. Sagrado.
        </Text>
      </Animated.View>

      {/* Feature items */}
      <View style={{ gap: 18, marginBottom: 40 }}>
        {items.map((item, i) => (
          <Animated.View
            key={i}
            entering={FadeInDown.delay(200 + i * 120).duration(500)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              backgroundColor: 'rgba(255,255,255,0.7)',
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 18,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(255,255,255,0.9)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {item.icon}
            </View>
            <Text style={{ fontSize: 15, color: '#3D3530', lineHeight: 22, flex: 1, fontWeight: '500' }}>
              {item.text}
            </Text>
          </Animated.View>
        ))}
      </View>

      <View style={{ flex: 1 }} />

      <Animated.View entering={FadeInUp.delay(600).duration(500)} style={buttonStyle}>
        <Pressable
          onPressIn={() => { buttonScale.value = withSpring(0.96); }}
          onPressOut={() => { buttonScale.value = withSpring(1); }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onNext();
          }}
          style={{ borderRadius: 18, overflow: 'hidden' }}
        >
          <LinearGradient
            colors={['#9B7DCA', '#6B5B9E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 18,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.2 }}>
              Continuar
            </Text>
            <ArrowRight size={18} color="#fff" />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ── Slide 3 — Invitación ─────────────────────────────────────────────────────
function InviteSlide({
  onNext,
  insets,
}: {
  onNext: () => void;
  insets: ReturnType<typeof useSafeAreaInsets>;
}) {
  const buttonScale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({ transform: [{ scale: buttonScale.value }] }));

  return (
    <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: insets.top + 56, paddingBottom: insets.bottom + 32 }}>
      <Animated.View entering={FadeInDown.delay(100).duration(700)} style={{ alignItems: 'center', marginBottom: 52 }}>
        {/* Dove / nature symbol */}
        <Text style={{ fontSize: 52, marginBottom: 28 }}>🌿</Text>

        <Text
          style={{
            fontSize: 27,
            fontWeight: '800',
            color: '#1E3A30',
            textAlign: 'center',
            letterSpacing: -0.5,
            lineHeight: 36,
            marginBottom: 16,
          }}
        >
          Aparta un momento{'\n'}cada día.
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: '#4A7060',
            textAlign: 'center',
            lineHeight: 25,
            fontStyle: 'italic',
          }}
        >
          Dios se encargará del resto.
        </Text>
      </Animated.View>

      <View style={{ flex: 1 }} />

      <Animated.View entering={FadeInUp.delay(400).duration(600)}>
        {/* Intro message preview */}
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.65)',
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 18,
            marginBottom: 22,
            borderWidth: 1,
            borderColor: 'rgba(65,179,163,0.25)',
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: '#4A7060',
              textAlign: 'center',
              lineHeight: 20,
              fontStyle: 'italic',
            }}
          >
            "Detente un momento. Respira.{'\n'}Dios quiere hablarte hoy."
          </Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(500).duration(500)} style={buttonStyle}>
        <Pressable
          onPressIn={() => { buttonScale.value = withSpring(0.96); }}
          onPressOut={() => { buttonScale.value = withSpring(1); }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onNext();
          }}
          style={{ borderRadius: 18, overflow: 'hidden' }}
        >
          <LinearGradient
            colors={['#41B3A3', '#2D8E80']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 18,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.2 }}>
              Comenzar mi primer devocional
            </Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ── Progress dots ────────────────────────────────────────────────────────────
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: 16 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 20 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i === current ? '#E8A87C' : 'rgba(232,168,124,0.3)',
          }}
        />
      ))}
    </View>
  );
}

// ── Main OnboardingScreen ─────────────────────────────────────────────────────
export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const setUser = useAppStore((s) => s.setUser);
  const setOnboarded = useAppStore((s) => s.setOnboarded);

  const [step, setStep] = useState<Step>('welcome');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nickname availability checking state
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  const buttonScale = useSharedValue(1);

  // Check nickname availability with the gamification API
  const checkNicknameAvailability = useCallback(async (nicknameToCheck: string) => {
    if (nicknameToCheck.length < 3) {
      setNicknameAvailable(null);
      setNicknameError(null);
      return;
    }

    setIsCheckingNickname(true);
    try {
      const result = await gamificationApi.checkNickname(nicknameToCheck);
      setNicknameAvailable(result.available);
      if (!result.available) {
        setNicknameError('Este nombre ya está en uso');
      } else {
        setNicknameError(null);
      }
    } catch (err) {
      setNicknameAvailable(true);
      setNicknameError(null);
    } finally {
      setIsCheckingNickname(false);
    }
  }, []);

  // Debounced nickname check effect
  useEffect(() => {
    const trimmed = nickname.trim();
    setNicknameAvailable(null);
    setNicknameError(null);
    if (trimmed.length < 3) return;
    const timer = setTimeout(() => {
      checkNicknameAvailability(trimmed);
    }, 500);
    return () => clearTimeout(timer);
  }, [nickname, checkNicknameAvailability]);

  const handleCheckNickname = useCallback(async () => {
    const trimmed = nickname.trim();
    if (trimmed.length < 3 || trimmed.length > 15) {
      setError('El nombre debe tener 3–15 caracteres');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError('Solo letras, números y guión bajo');
      return;
    }
    setIsChecking(true);
    setError(null);
    try {
      const available = await firestoreService.checkNicknameAvailable(trimmed);
      if (available) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => setStep('avatar'), 300);
      } else {
        setError('Este nombre ya está en uso');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
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
      let backendUserId: string | null = null;
      try {
        const backendUser = await gamificationApi.registerUser(nickname.trim(), selectedAvatar);
        backendUserId = backendUser.id;
        // Save country if selected
        if (backendUserId && selectedCountry) {
          await gamificationApi.updateCountry(backendUserId, {
            countryCode: selectedCountry.code,
            showCountry: true,
          }).catch(() => {/* non-critical */});
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Registration failed';
        if (errorMessage.includes('already taken') || errorMessage.includes('Nickname')) {
          setNicknameError('Este nombre ya está en uso');
          setNicknameAvailable(false);
          setStep('nickname');
          setIsCreating(false);
          return;
        }
      }
      const user = await firestoreService.createUser(nickname.trim(), selectedAvatar, backendUserId);
      setUser(user);
      setOnboarded(true);
      setTimeout(onComplete, 200);
    } catch {
      setError('No se pudo crear la cuenta. Inténtalo de nuevo.');
      setIsCreating(false);
    }
  }, [nickname, selectedAvatar, selectedCountry, setUser, setOnboarded, onComplete]);

  const handleButtonPressIn = () => { buttonScale.value = withSpring(0.95); };
  const handleButtonPressOut = () => { buttonScale.value = withSpring(1); };
  const buttonAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: buttonScale.value }] }));

  const unlockedAvatars = DEFAULT_AVATARS.filter((a) => 'unlocked' in a && a.unlocked);

  const gradientColors = SLIDE_GRADIENTS[step] ?? SLIDE_GRADIENTS['welcome'];

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
        {/* Spiritual slides */}
        {step === 'welcome' && (
          <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1 }}>
            <ProgressDots current={0} total={3} />
            <WelcomeSlide onNext={() => setStep('expect')} insets={insets} />
          </Animated.View>
        )}

        {step === 'expect' && (
          <Animated.View entering={FadeIn.duration(350)} style={{ flex: 1 }}>
            <ProgressDots current={1} total={3} />
            <ExpectSlide onNext={() => setStep('invite')} insets={insets} />
          </Animated.View>
        )}

        {step === 'invite' && (
          <Animated.View entering={FadeIn.duration(350)} style={{ flex: 1 }}>
            <ProgressDots current={2} total={3} />
            <InviteSlide onNext={() => setStep('nickname')} insets={insets} />
          </Animated.View>
        )}

        {/* Account setup steps */}
        {(step === 'nickname' || step === 'avatar') && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
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
              <Animated.View entering={FadeInDown.duration(600)} style={{ alignItems: 'center', marginBottom: 40 }}>
                <View
                  style={{
                    width: 72,
                    height: 72,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    borderRadius: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOpacity: 0.08,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 4,
                    marginBottom: 20,
                  }}
                >
                  <Sun size={34} color="#E8A87C" strokeWidth={1.5} />
                </View>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#2D2D2D', textAlign: 'center', letterSpacing: -0.3, marginBottom: 6 }}>
                  {APP_BRANDING.appName}
                </Text>
                <Text style={{ fontSize: 14, color: '#8C7B70', textAlign: 'center' }}>
                  {step === 'nickname'
                    ? 'Elige un nombre para la comunidad'
                    : `Hola, ${nickname}! Elige un avatar`}
                </Text>
              </Animated.View>

              {step === 'nickname' ? (
                <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1 }}>
                  <View style={{ marginBottom: 24 }}>
                    <View
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        borderRadius: 16,
                        overflow: 'hidden',
                        flexDirection: 'row',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOpacity: 0.06,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 2,
                      }}
                    >
                      <TextInput
                        value={nickname}
                        onChangeText={(text) => {
                          setNickname(text);
                          setError(null);
                        }}
                        placeholder="Tu nombre en la comunidad"
                        placeholderTextColor="#B0A098"
                        autoCapitalize="none"
                        autoCorrect={false}
                        maxLength={15}
                        style={{
                          paddingHorizontal: 18,
                          paddingVertical: 16,
                          fontSize: 17,
                          color: '#2D2D2D',
                          flex: 1,
                        }}
                      />
                      <View style={{ paddingRight: 14 }}>
                        {isCheckingNickname && <ActivityIndicator size="small" color="#B0A098" />}
                        {!isCheckingNickname && nicknameAvailable === true && nickname.trim().length >= 3 && (
                          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={13} color="#fff" strokeWidth={3} />
                          </View>
                        )}
                        {!isCheckingNickname && nicknameAvailable === false && nickname.trim().length >= 3 && (
                          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={13} color="#fff" strokeWidth={3} />
                          </View>
                        )}
                      </View>
                    </View>

                    <Text style={{ textAlign: 'right', color: '#B0A098', fontSize: 12, marginTop: 6 }}>
                      {nickname.length}/15
                    </Text>

                    {(error || nicknameError) && (
                      <Animated.View entering={FadeIn.duration(200)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 }}>
                        <AlertCircle size={15} color="#EF4444" />
                        <Text style={{ color: '#EF4444', fontSize: 13 }}>{error || nicknameError}</Text>
                      </Animated.View>
                    )}
                  </View>

                  <Animated.View style={buttonAnimatedStyle}>
                    <Pressable
                      onPress={handleCheckNickname}
                      onPressIn={handleButtonPressIn}
                      onPressOut={handleButtonPressOut}
                      disabled={nickname.trim().length < 3 || isChecking || isCheckingNickname || nicknameAvailable === false}
                      style={{
                        borderRadius: 16,
                        overflow: 'hidden',
                        opacity: (nickname.trim().length < 3 || isCheckingNickname || nicknameAvailable === false) ? 0.5 : 1,
                      }}
                    >
                      <LinearGradient
                        colors={['#E8A87C', '#C38D9E']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                      >
                        {isChecking ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <>
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Continuar</Text>
                            <ArrowRight size={18} color="#fff" />
                          </>
                        )}
                      </LinearGradient>
                    </Pressable>
                  </Animated.View>
                </Animated.View>
              ) : (
                <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginBottom: 32 }}>
                    {unlockedAvatars.map((avatar, index) => (
                      <Animated.View key={avatar.id} entering={FadeInUp.delay(index * 40).duration(300)}>
                        <Pressable
                          onPress={() => handleSelectAvatar(avatar.id)}
                          style={{
                            width: 76,
                            height: 76,
                            borderRadius: 20,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: selectedAvatar === avatar.id ? '#FEF3C7' : 'rgba(255,255,255,0.85)',
                            borderWidth: 2,
                            borderColor: selectedAvatar === avatar.id ? '#F59E0B' : 'transparent',
                            shadowColor: '#000',
                            shadowOpacity: selectedAvatar === avatar.id ? 0.12 : 0.06,
                            shadowRadius: 8,
                            shadowOffset: { width: 0, height: 2 },
                            elevation: selectedAvatar === avatar.id ? 4 : 2,
                          }}
                        >
                          <Text style={{ fontSize: 34 }}>{avatar.emoji}</Text>
                          {selectedAvatar === avatar.id && (
                            <View style={{
                              position: 'absolute', top: -5, right: -5,
                              width: 22, height: 22, borderRadius: 11,
                              backgroundColor: '#F59E0B',
                              alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Check size={12} color="#fff" strokeWidth={3} />
                            </View>
                          )}
                        </Pressable>
                      </Animated.View>
                    ))}
                  </View>

                  <View style={{ marginTop: 'auto' as any }}>
                    <Animated.View style={buttonAnimatedStyle}>
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setStep('country');
                        }}
                        onPressIn={handleButtonPressIn}
                        onPressOut={handleButtonPressOut}
                        disabled={!selectedAvatar}
                        style={{ borderRadius: 16, overflow: 'hidden', opacity: !selectedAvatar ? 0.5 : 1 }}
                      >
                        <LinearGradient
                          colors={['#E8A87C', '#C38D9E']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{ paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                        >
                          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Continuar</Text>
                          <ArrowRight size={18} color="#fff" />
                        </LinearGradient>
                      </Pressable>
                    </Animated.View>
                  </View>
                </Animated.View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {/* Country step */}
        {step === 'country' && (
          <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }}>
            <Animated.View entering={FadeInDown.duration(600)} style={{ alignItems: 'center', marginBottom: 40 }}>
              <View
                style={{
                  width: 72, height: 72,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  borderRadius: 36, alignItems: 'center', justifyContent: 'center',
                  shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10,
                  shadowOffset: { width: 0, height: 3 }, elevation: 4, marginBottom: 20,
                }}
              >
                <MapPin size={32} color="#6B9AC4" strokeWidth={1.5} />
              </View>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#2D2D2D', textAlign: 'center', letterSpacing: -0.3, marginBottom: 8 }}>
                ¿De dónde eres?
              </Text>
              <Text style={{ fontSize: 14, color: '#8C7B70', textAlign: 'center', lineHeight: 20 }}>
                Opcional · Puedes cambiarlo en cualquier momento
              </Text>
            </Animated.View>

            {/* Country selector button */}
            <Animated.View entering={FadeInDown.delay(150).duration(500)}>
              <Pressable
                onPress={() => setShowCountryPicker(true)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  borderRadius: 16,
                  paddingVertical: 16,
                  paddingHorizontal: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 }, elevation: 2,
                  marginBottom: 28,
                }}
              >
                {selectedCountry ? (
                  <>
                    <Text style={{ fontSize: 26, marginRight: 12 }}>{selectedCountry.flag}</Text>
                    <Text style={{ fontSize: 16, color: '#2D2D2D', fontWeight: '600', flex: 1 }}>{selectedCountry.name}</Text>
                    <Text style={{ fontSize: 12, color: '#B0A098' }}>Cambiar</Text>
                  </>
                ) : (
                  <>
                    <MapPin size={20} color="#B0A098" style={{ marginRight: 12 }} />
                    <Text style={{ fontSize: 16, color: '#B0A098', flex: 1 }}>Selecciona tu país</Text>
                    <ArrowRight size={16} color="#B0A098" />
                  </>
                )}
              </Pressable>
            </Animated.View>

            <View style={{ flex: 1 }} />

            {/* Finish button */}
            <Animated.View entering={FadeInUp.delay(300).duration(500)} style={buttonAnimatedStyle}>
              <Pressable
                onPress={handleComplete}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
                disabled={isCreating}
                style={{ borderRadius: 16, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={['#6B9AC4', '#5C8DB8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                >
                  {isCreating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Comenzar</Text>
                      <ArrowRight size={18} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* Skip */}
            {!isCreating && (
              <Pressable
                onPress={handleComplete}
                style={{ marginTop: 16, alignItems: 'center', paddingVertical: 8 }}
              >
                <Text style={{ fontSize: 14, color: '#B0A098' }}>Omitir por ahora</Text>
              </Pressable>
            )}

            <CountryPickerModal
              visible={showCountryPicker}
              selectedCode={selectedCountry?.code ?? null}
              onSelect={(c) => { setSelectedCountry(c); setShowCountryPicker(false); }}
              onClose={() => setShowCountryPicker(false)}
            />
          </View>
        )}
      </LinearGradient>
    </View>
  );
}
