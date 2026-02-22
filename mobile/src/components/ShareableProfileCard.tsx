// ShareableProfileCard — offscreen canvas for profile sharing
// Aspect ratio: 4:5 (1080x1350) — WhatsApp-optimized portrait
// Renders fully off-screen, captured with react-native-view-shot

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Share2 } from 'lucide-react-native';
import { IllustratedAvatar } from './IllustratedAvatar';
import { useBranding } from '@/lib/branding-service';
import { useThemeColors, useLanguage, useUser, useIsDarkMode, useAppStore } from '@/lib/store';
import { AVATAR_FRAMES, SPIRITUAL_TITLES, DEFAULT_AVATARS, PURCHASABLE_THEMES } from '@/lib/constants';

// ── Canvas dimensions ─────────────────────────────────────────────────────────
const CARD_W = 1080;
const CARD_H = 1350;

// ── Stat block ────────────────────────────────────────────────────────────────
function StatBlock({
  emoji,
  value,
  label,
  accentColor,
}: {
  emoji: string;
  value: string | number;
  label: string;
  accentColor: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        paddingVertical: 48,
        marginHorizontal: 12,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
      }}
    >
      <Text style={{ fontSize: 52 }}>{emoji}</Text>
      <Text
        style={{
          fontSize: 64,
          fontWeight: '800',
          color: '#FFFFFF',
          marginTop: 12,
          letterSpacing: -2,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 28,
          color: 'rgba(255,255,255,0.65)',
          marginTop: 8,
          fontWeight: '500',
          textAlign: 'center',
          paddingHorizontal: 16,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ── Profile avatar with frame ring ───────────────────────────────────────────
function ProfileAvatarCanvas({
  avatarId,
  emoji,
  frameColor,
  size,
}: {
  avatarId: string;
  emoji: string;
  frameColor: string | null;
  size: number;
}) {
  const ringSize = frameColor ? size + 20 : size;

  return (
    <View
      style={{
        width: ringSize,
        height: ringSize,
        borderRadius: ringSize / 2,
        borderWidth: frameColor ? 10 : 0,
        borderColor: frameColor ?? 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: frameColor ?? 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: frameColor ? 0.9 : 0,
        shadowRadius: 30,
      }}
    >
      <IllustratedAvatar avatarId={avatarId} emoji={emoji} size={size} />
    </View>
  );
}

// ── Offscreen card canvas ─────────────────────────────────────────────────────
interface ProfileCardCanvasProps {
  nickname: string;
  titleLabel: string | null;
  streakCurrent: number;
  devotionalsCompleted: number;
  avatarId: string;
  avatarEmoji: string;
  frameColor: string | null;
  gradientStart: string;
  gradientEnd: string;
  accentColor: string;
  appName: string;
  tagline: string;
  language: 'en' | 'es';
}

function ProfileCardCanvas({
  nickname,
  titleLabel,
  streakCurrent,
  devotionalsCompleted,
  avatarId,
  avatarEmoji,
  frameColor,
  gradientStart,
  gradientEnd,
  accentColor,
  appName,
  tagline,
  language,
}: ProfileCardCanvasProps) {
  const avatarSize = 280;

  return (
    <View
      style={{ width: CARD_W, height: CARD_H, overflow: 'hidden' }}
      collapsable={false}
    >
      {/* Background gradient */}
      <LinearGradient
        colors={[gradientStart, gradientEnd, '#0A0A1A']}
        locations={[0, 0.55, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={{ position: 'absolute', width: CARD_W, height: CARD_H }}
      />

      {/* Decorative top arc glow */}
      <View
        style={{
          position: 'absolute',
          top: -200,
          left: CARD_W / 2 - 400,
          width: 800,
          height: 800,
          borderRadius: 400,
          backgroundColor: accentColor + '18',
        }}
      />

      {/* Decorative bottom glow */}
      <View
        style={{
          position: 'absolute',
          bottom: -120,
          left: CARD_W / 2 - 300,
          width: 600,
          height: 600,
          borderRadius: 300,
          backgroundColor: accentColor + '10',
        }}
      />

      {/* Main content */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 80,
          paddingTop: 100,
          paddingBottom: 80,
        }}
      >
        {/* ── App header ── */}
        <View style={{ alignItems: 'center', width: '100%' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 60,
              paddingHorizontal: 40,
              paddingVertical: 16,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.15)',
            }}
          >
            <Text style={{ fontSize: 32, marginRight: 12 }}>✨</Text>
            <Text
              style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: 34,
                fontWeight: '700',
                letterSpacing: 2,
              }}
            >
              {appName.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* ── Avatar + identity ── */}
        <View style={{ alignItems: 'center' }}>
          {/* Glow ring behind avatar */}
          <View
            style={{
              position: 'absolute',
              width: avatarSize + 120,
              height: avatarSize + 120,
              borderRadius: (avatarSize + 120) / 2,
              backgroundColor: accentColor + '20',
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: avatarSize + 60,
              height: avatarSize + 60,
              borderRadius: (avatarSize + 60) / 2,
              backgroundColor: accentColor + '15',
            }}
          />

          <ProfileAvatarCanvas
            avatarId={avatarId}
            emoji={avatarEmoji}
            frameColor={frameColor}
            size={avatarSize}
          />

          {/* Nickname */}
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 72,
              fontWeight: '800',
              marginTop: 40,
              letterSpacing: -1,
              textAlign: 'center',
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {nickname}
          </Text>

          {/* Title badge */}
          {titleLabel && (
            <View
              style={{
                backgroundColor: accentColor + '30',
                borderRadius: 40,
                paddingHorizontal: 48,
                paddingVertical: 18,
                marginTop: 20,
                borderWidth: 1,
                borderColor: accentColor + '60',
              }}
            >
              <Text
                style={{
                  color: accentColor,
                  fontSize: 34,
                  fontWeight: '700',
                  letterSpacing: 1,
                }}
              >
                {titleLabel}
              </Text>
            </View>
          )}
        </View>

        {/* ── Stats row ── */}
        <View style={{ flexDirection: 'row', width: '100%', marginVertical: 20 }}>
          <StatBlock
            emoji="🔥"
            value={streakCurrent}
            label={language === 'es' ? 'Racha actual' : 'Current streak'}
            accentColor={accentColor}
          />
          <StatBlock
            emoji="📖"
            value={devotionalsCompleted}
            label={language === 'es' ? 'Devocionales' : 'Devotionals'}
            accentColor={accentColor}
          />
        </View>

        {/* ── Divider ── */}
        <View
          style={{
            width: '70%',
            height: 1,
            backgroundColor: 'rgba(255,255,255,0.12)',
          }}
        />

        {/* ── Footer ── */}
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: 28,
              letterSpacing: 1,
              textAlign: 'center',
            }}
          >
            Compartiendo luz cada día
          </Text>
          <Text
            style={{
              color: 'rgba(255,255,255,0.25)',
              fontSize: 22,
              marginTop: 10,
              letterSpacing: 2,
            }}
          >
            {tagline}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Public ref handle ─────────────────────────────────────────────────────────
export interface ShareableProfileCardRef {
  captureAndShare: () => Promise<void>;
}

// ── Main exported component ───────────────────────────────────────────────────
export interface ShareableProfileCardProps {
  visible: boolean;
  onClose: () => void;
}

export function ShareableProfileCard({ visible, onClose }: ShareableProfileCardProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const language = useLanguage();
  const user = useUser();
  const isDarkMode = useIsDarkMode();
  const branding = useBranding();
  const equippedThemeId = useAppStore(s => s.equippedTheme);

  const cardRef = useRef<View>(null);
  const [isSharing, setIsSharing] = React.useState(false);

  if (!user) return null;

  // Resolve avatar
  const currentAvatar = DEFAULT_AVATARS.find(a => a.id === user.avatar);
  const avatarEmoji = currentAvatar?.emoji ?? '🕊️';

  // Resolve frame
  const frameData = user.frameId ? AVATAR_FRAMES[user.frameId] : null;
  const frameColor = frameData?.color ?? null;

  // Resolve title
  const titleData = user.titleId ? SPIRITUAL_TITLES[user.titleId] : null;
  const titleLabel = titleData
    ? (language === 'es' ? titleData.nameEs : titleData.name)
    : null;

  // Resolve gradient from equipped theme (PURCHASABLE_THEMES has nested .colors)
  const themeEntry = PURCHASABLE_THEMES[equippedThemeId] ?? PURCHASABLE_THEMES['theme_amanecer'];
  const themeData = themeEntry.colors;
  const gradientStart = isDarkMode ? themeData.backgroundDark : themeData.primary;
  const gradientEnd = isDarkMode ? themeData.surfaceDark : themeData.secondary;
  const accentColor = themeData.accent;

  const tagline = language === 'es' ? branding.taglineEs : branding.taglineEn;

  const handleShare = async () => {
    if (!cardRef.current) return;
    setIsSharing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        width: CARD_W,
        height: CARD_H,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert(
          language === 'es' ? 'No se puede compartir' : 'Sharing unavailable',
          language === 'es' ? 'Tu dispositivo no soporta compartir.' : 'Your device does not support sharing.'
        );
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: language === 'es' ? 'Compartir mi progreso' : 'Share my progress',
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (err: any) {
      if (!err?.message?.includes('cancelled') && !err?.message?.includes('dismiss')) {
        Alert.alert(
          language === 'es' ? 'Error al compartir' : 'Share failed',
          language === 'es' ? 'Intenta de nuevo.' : 'Please try again.'
        );
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.75)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 20,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 24,
          }}
        >
          {/* Handle bar */}
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.textMuted + '40',
              alignSelf: 'center',
              marginBottom: 20,
            }}
          />

          {/* Header row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>
              {language === 'es' ? 'Compartir mi progreso' : 'Share my progress'}
            </Text>
            <Pressable
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.background,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Card preview — scaled down from 1080×1350 to display size */}
          {(() => {
            const DISPLAY_W = 260;
            const DISPLAY_H = Math.round(DISPLAY_W * (CARD_H / CARD_W));
            const scale = DISPLAY_W / CARD_W;
            return (
              <View style={{ alignItems: 'center', marginBottom: 28 }}>
                <View
                  style={{
                    width: DISPLAY_W,
                    height: DISPLAY_H,
                    overflow: 'hidden',
                    borderRadius: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 20,
                  }}
                >
                  <View
                    style={{
                      transform: [{ scale }],
                      transformOrigin: 'top left' as any,
                    }}
                  >
                    <ProfileCardCanvas
                      nickname={user.nickname}
                      titleLabel={titleLabel}
                      streakCurrent={user.streakCurrent}
                      devotionalsCompleted={user.devotionalsCompleted}
                      avatarId={user.avatar}
                      avatarEmoji={avatarEmoji}
                      frameColor={frameColor}
                      gradientStart={gradientStart}
                      gradientEnd={gradientEnd}
                      accentColor={accentColor}
                      appName={branding.appName}
                      tagline={tagline}
                      language={language}
                    />
                  </View>
                </View>
              </View>
            );
          })()}

          {/* Description */}
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 14,
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 20,
            }}
          >
            {language === 'es'
              ? 'Comparte tu jornada espiritual con tus seres queridos'
              : 'Share your spiritual journey with your loved ones'}
          </Text>

          {/* Share button */}
          <Pressable
            onPress={handleShare}
            disabled={isSharing}
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.primary + 'CC' : colors.primary,
              borderRadius: 16,
              paddingVertical: 18,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isSharing ? 0.7 : 1,
            })}
          >
            {isSharing ? (
              <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 10 }} />
            ) : (
              <Share2 size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
            )}
            <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>
              {isSharing
                ? (language === 'es' ? 'Preparando imagen...' : 'Preparing image...')
                : (language === 'es' ? 'Compartir imagen' : 'Share image')}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Offscreen full-res canvas for capture */}
      <View style={{ position: 'absolute', opacity: 0, left: -9999, top: -9999, pointerEvents: 'none' }}>
        <View ref={cardRef} collapsable={false}>
          <ProfileCardCanvas
            nickname={user.nickname}
            titleLabel={titleLabel}
            streakCurrent={user.streakCurrent}
            devotionalsCompleted={user.devotionalsCompleted}
            avatarId={user.avatar}
            avatarEmoji={avatarEmoji}
            frameColor={frameColor}
            gradientStart={gradientStart}
            gradientEnd={gradientEnd}
            accentColor={accentColor}
            appName={branding.appName}
            tagline={tagline}
            language={language}
          />
        </View>
      </View>
    </Modal>
  );
}

export default ShareableProfileCard;
