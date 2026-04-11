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
  Alert,
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
import { Sun, ArrowRight, Check, AlertCircle, X, Heart, Users, BookOpen, MapPin, RefreshCw } from 'lucide-react-native';
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
  welcome: ['#FBF0E4', '#F5E4D0', '#EDD6C0'],
  expect:  ['#F2EBF8', '#EBE2F4', '#E2D6EE'],
  invite:  ['#E6F2EE', '#D8EDE6', '#CCE5DA'],
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
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    const animate = () => {
      glowOpacity.value = withSpring(0.8, { duration: 2000 });
      setTimeout(() => { glowOpacity.value = withSpring(0.4, { duration: 2000 }); }, 2000);
    };
    animate();
    const interval = setInterval(animate, 4000);
    return () => clearInterval(interval);
  }, []);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  return (
    <View style={{ flex: 1, paddingHorizontal: 32, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 36 }}>
      {/* Decorative glow halo behind sun */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={[glowStyle, {
            position: 'absolute',
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: 'rgba(232,168,124,0.18)',
          }]}
        />
        <Animated.View
          style={[glowStyle, {
            position: 'absolute',
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: 'rgba(232,168,124,0.22)',
          }]}
        />

        <Animated.View entering={FadeInDown.delay(200).duration(900)} style={{ alignItems: 'center' }}>
          <Sun size={72} color="#D4884A" strokeWidth={1.1} style={{ marginBottom: 36 }} />

          <Text
            style={{
              fontSize: 38,
              fontWeight: '800',
              color: '#2A1F1A',
              textAlign: 'center',
              letterSpacing: -1,
              lineHeight: 46,
              marginBottom: 20,
            }}
          >
            Luz Diaria
          </Text>

          <View style={{ width: 40, height: 2, backgroundColor: '#D4884A', borderRadius: 1, marginBottom: 24, opacity: 0.6 }} />

          <Animated.View entering={FadeInDown.delay(450).duration(700)}>
            <Text
              style={{
                fontSize: 17,
                color: '#5C4A3E',
                textAlign: 'center',
                lineHeight: 27,
                fontStyle: 'italic',
                fontWeight: '400',
              }}
            >
              Un espacio para encontrarte{'\n'}con Dios, cada día.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(650).duration(600)} style={{ marginTop: 18 }}>
            <Text
              style={{
                fontSize: 13,
                color: '#9C8070',
                textAlign: 'center',
                lineHeight: 20,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
              }}
            >
              No es prisa · Es un encuentro
            </Text>
          </Animated.View>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.delay(800).duration(600)} style={buttonStyle}>
        <Pressable
          onPressIn={() => { buttonScale.value = withSpring(0.96); }}
          onPressOut={() => { buttonScale.value = withSpring(1); }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onNext();
          }}
          style={{
            backgroundColor: '#D4884A',
            borderRadius: 16,
            paddingVertical: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.3 }}>
            Comenzar
          </Text>
          <ArrowRight size={17} color="#fff" strokeWidth={2.5} />
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
    { icon: <BookOpen size={18} color="#D4884A" strokeWidth={1.8} />, label: 'Devocional', text: 'Un texto corto cada mañana para empezar el día con propósito.' },
    { icon: <Heart size={18} color="#B87090" strokeWidth={1.8} />, label: 'Oración', text: 'Un momento tuyo, tranquilo y personal, para hablar con Dios.' },
    { icon: <Users size={18} color="#41B3A3" strokeWidth={1.8} />, label: 'Comunidad', text: 'Personas reales que oran y crecen a tu lado cada día.' },
  ];

  return (
    <View style={{ flex: 1, paddingHorizontal: 32, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 36 }}>
      <Animated.View entering={FadeInDown.delay(100).duration(600)} style={{ marginBottom: 44 }}>
        <Text
          style={{
            fontSize: 13,
            color: '#B09480',
            letterSpacing: 1.8,
            textTransform: 'uppercase',
            textAlign: 'center',
            marginBottom: 14,
          }}
        >
          Cada día encontrarás
        </Text>
        <Text
          style={{
            fontSize: 32,
            fontWeight: '800',
            color: '#2A1F1A',
            textAlign: 'center',
            letterSpacing: -0.8,
            lineHeight: 40,
          }}
        >
          Una luz{'\n'}para tu camino
        </Text>
      </Animated.View>

      {/* Informational rows — no card border, pure text */}
      <View style={{ gap: 32, flex: 1 }}>
        {items.map((item, i) => (
          <Animated.View
            key={i}
            entering={FadeInDown.delay(250 + i * 130).duration(550)}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 18 }}
          >
            {/* Accent dot + icon */}
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: 'rgba(255,255,255,0.55)',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 2,
            }}>
              {item.icon}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '700',
                color: '#2A1F1A',
                marginBottom: 4,
                letterSpacing: -0.2,
              }}>
                {item.label}
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#6B5548',
                lineHeight: 21,
                fontWeight: '400',
              }}>
                {item.text}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeInUp.delay(700).duration(500)} style={buttonStyle}>
        <Pressable
          onPressIn={() => { buttonScale.value = withSpring(0.96); }}
          onPressOut={() => { buttonScale.value = withSpring(1); }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onNext();
          }}
          style={{
            backgroundColor: '#7B6AAE',
            borderRadius: 16,
            paddingVertical: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.3 }}>
            Continuar
          </Text>
          <ArrowRight size={17} color="#fff" strokeWidth={2.5} />
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
    <View style={{ flex: 1, paddingHorizontal: 32, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 36 }}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Animated.View entering={FadeInDown.delay(100).duration(800)} style={{ alignItems: 'center', marginBottom: 52 }}>
          <Text style={{ fontSize: 64, marginBottom: 32 }}>🌿</Text>

          <Text
            style={{
              fontSize: 13,
              color: '#5A8A78',
              letterSpacing: 2,
              textTransform: 'uppercase',
              textAlign: 'center',
              marginBottom: 18,
            }}
          >
            Una última cosa
          </Text>

          <Text
            style={{
              fontSize: 33,
              fontWeight: '800',
              color: '#1A3628',
              textAlign: 'center',
              letterSpacing: -0.8,
              lineHeight: 42,
              marginBottom: 24,
            }}
          >
            Solo necesitas{'\n'}unos minutos.
          </Text>

          <Text
            style={{
              fontSize: 16,
              color: '#3D6856',
              textAlign: 'center',
              lineHeight: 26,
              fontStyle: 'italic',
            }}
          >
            Aparta ese momento cada día.{'\n'}Dios se encargará del resto.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={{ alignItems: 'center' }}>
          <View style={{
            paddingVertical: 18,
            paddingHorizontal: 24,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: 'rgba(65,179,163,0.2)',
          }}>
            <Text
              style={{
                fontSize: 14,
                color: '#4A7060',
                textAlign: 'center',
                lineHeight: 22,
                fontStyle: 'italic',
                letterSpacing: 0.1,
              }}
            >
              "Detente. Respira.{'\n'}Dios quiere hablarte hoy."
            </Text>
          </View>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.delay(700).duration(550)} style={buttonStyle}>
        <Pressable
          onPressIn={() => { buttonScale.value = withSpring(0.96); }}
          onPressOut={() => { buttonScale.value = withSpring(1); }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onNext();
          }}
          style={{
            backgroundColor: '#2D8E80',
            borderRadius: 16,
            paddingVertical: 18,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.2 }}>
            Crear mi perfil
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ── Progress dots ────────────────────────────────────────────────────────────
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, paddingTop: 14, paddingBottom: 4 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 18 : 5,
            height: 4,
            borderRadius: 2,
            backgroundColor: i === current ? '#C47840' : 'rgba(196,120,64,0.22)',
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
  const [isRecovering, setIsRecovering] = useState(false);
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

  const handleRecoverAccount = useCallback(async () => {
    const trimmed = nickname.trim();
    if (trimmed.length < 3) return;
    setIsRecovering(true);
    setError(null);
    try {
      const profile = await gamificationApi.recoverByNickname(trimmed);
      setUser({
        id: profile.id,
        nickname: profile.nickname,
        avatar: profile.avatarId ?? 'avatar_dove',
        role: profile.role as any,
        points: profile.points ?? 0,
        streakCurrent: profile.streakCurrent ?? 0,
        streakBest: 0,
        totalTime: 0,
        totalShares: 0,
        devotionalsCompleted: 0,
        favorites: [],
        createdAt: Date.now(),
        lastActiveDate: new Date().toISOString().slice(0, 10),
        purchasedItems: [],
        settings: {
          theme: 'dawn',
          language: 'en',
          musicEnabled: false,
          musicVolume: 0.18,
          notificationsEnabled: true,
          streakReminders: true,
          ttsVoice: 'default',
          ttsSpeed: 1.0,
          ttsVolume: 1.0,
          textScale: 1.0,
          sfxEnabled: true,
        },
      });
      setOnboarded(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(onComplete, 200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'NOT_FOUND') {
        setError('No se encontró esa cuenta en el servidor.');
      } else {
        setError('Error de conexión. Inténtalo de nuevo.');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsRecovering(false);
    }
  }, [nickname, setUser, setOnboarded, onComplete]);

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
