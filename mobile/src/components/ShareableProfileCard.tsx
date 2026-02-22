// ShareableProfileCard — multi-layout profile sharing card
// Supports 3 layouts (Clásico, Historia, Minimal) × 3 size presets
// Captured offscreen via react-native-view-shot, shared via expo-sharing

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Share2, Copy, Check } from 'lucide-react-native';
import { IllustratedAvatar } from './IllustratedAvatar';
import { useBranding } from '@/lib/branding-service';
import { useThemeColors, useLanguage, useUser, useIsDarkMode, useAppStore } from '@/lib/store';
import { AVATAR_FRAMES, SPIRITUAL_TITLES, DEFAULT_AVATARS, PURCHASABLE_THEMES } from '@/lib/constants';

// ── Types ────────────────────────────────────────────────────────────────────
export type CardLayout = 'clasico' | 'historia' | 'minimal';
export type SizePreset = 'portrait' | 'square' | 'story';

const SIZE_DIMS: Record<SizePreset, { w: number; h: number }> = {
  portrait: { w: 1080, h: 1350 },
  square: { w: 1080, h: 1080 },
  story: { w: 1080, h: 1920 },
};

// ── Shared sub-components ─────────────────────────────────────────────────────

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
      }}
    >
      <IllustratedAvatar avatarId={avatarId} emoji={emoji} size={size} />
    </View>
  );
}

function StatPill({
  emoji,
  value,
  label,
  accentColor,
  compact = false,
}: {
  emoji: string;
  value: string | number;
  label: string;
  accentColor: string;
  compact?: boolean;
}) {
  const pad = compact ? 32 : 48;
  const valSize = compact ? 52 : 64;
  const lblSize = compact ? 24 : 28;
  const emojiSize = compact ? 40 : 52;

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        paddingVertical: pad,
        marginHorizontal: 10,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
      }}
    >
      <Text style={{ fontSize: emojiSize }}>{emoji}</Text>
      <Text
        style={{
          fontSize: valSize,
          fontWeight: '800',
          color: '#FFFFFF',
          marginTop: 10,
          letterSpacing: -2,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: lblSize,
          color: 'rgba(255,255,255,0.65)',
          marginTop: 6,
          fontWeight: '500',
          textAlign: 'center',
          paddingHorizontal: 12,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function StatRow({
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 48,
        marginVertical: 10,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        width: '100%',
      }}
    >
      <Text style={{ fontSize: 44, marginRight: 28 }}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 56,
            fontWeight: '800',
            color: '#FFFFFF',
            letterSpacing: -1,
          }}
        >
          {value}
        </Text>
        <Text style={{ fontSize: 26, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
          {label}
        </Text>
      </View>
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: accentColor,
          opacity: 0.8,
        }}
      />
    </View>
  );
}

function AppBadge({ appName, size = 'md' }: { appName: string; size?: 'sm' | 'md' }) {
  const fontSize = size === 'sm' ? 26 : 34;
  const emojiSize = size === 'sm' ? 26 : 32;
  const px = size === 'sm' ? 28 : 40;
  const py = size === 'sm' ? 12 : 16;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 60,
        paddingHorizontal: px,
        paddingVertical: py,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
      }}
    >
      <Text style={{ fontSize: emojiSize, marginRight: 10 }}>✨</Text>
      <Text
        style={{
          color: 'rgba(255,255,255,0.92)',
          fontSize,
          fontWeight: '700',
          letterSpacing: 2,
        }}
      >
        {appName.toUpperCase()}
      </Text>
    </View>
  );
}

// ── LAYOUT: Clásico ──────────────────────────────────────────────────────────
interface CanvasProps {
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
  showTagline: boolean;
  showFooter: boolean;
  w: number;
  h: number;
}

function ClasicoCanvas(props: CanvasProps) {
  const { w, h, gradientStart, gradientEnd, accentColor, avatarId, avatarEmoji,
    frameColor, nickname, titleLabel, streakCurrent, devotionalsCompleted,
    appName, tagline, language, showTagline, showFooter } = props;

  const avatarSize = Math.round(w * 0.26);
  const isSquare = h === w;

  return (
    <View style={{ width: w, height: h, overflow: 'hidden' }} collapsable={false}>
      <LinearGradient
        colors={[gradientStart, gradientEnd, '#080818']}
        locations={[0, 0.55, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={{ position: 'absolute', width: w, height: h }}
      />
      {/* Glow circles */}
      <View style={{ position: 'absolute', top: -w * 0.2, left: w * 0.5 - w * 0.38, width: w * 0.76, height: w * 0.76, borderRadius: w * 0.38, backgroundColor: accentColor + '15' }} />
      <View style={{ position: 'absolute', bottom: -w * 0.1, left: w * 0.5 - w * 0.28, width: w * 0.56, height: w * 0.56, borderRadius: w * 0.28, backgroundColor: accentColor + '10' }} />

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: w * 0.075, paddingTop: isSquare ? h * 0.06 : h * 0.07, paddingBottom: h * 0.06 }}>
        {/* Header */}
        <AppBadge appName={appName} />

        {/* Avatar + identity */}
        <View style={{ alignItems: 'center' }}>
          <View style={{ position: 'absolute', width: avatarSize + w * 0.11, height: avatarSize + w * 0.11, borderRadius: (avatarSize + w * 0.11) / 2, backgroundColor: accentColor + '22' }} />
          <View style={{ position: 'absolute', width: avatarSize + w * 0.055, height: avatarSize + w * 0.055, borderRadius: (avatarSize + w * 0.055) / 2, backgroundColor: accentColor + '16' }} />
          <ProfileAvatarCanvas avatarId={avatarId} emoji={avatarEmoji} frameColor={frameColor} size={avatarSize} />
          <Text
            style={{ color: '#FFFFFF', fontSize: w * 0.067, fontWeight: '800', marginTop: w * 0.037, letterSpacing: -1, textAlign: 'center' }}
            numberOfLines={1} adjustsFontSizeToFit
          >
            {nickname}
          </Text>
          {titleLabel && (
            <View style={{ backgroundColor: accentColor + '2E', borderRadius: 40, paddingHorizontal: w * 0.044, paddingVertical: w * 0.015, marginTop: w * 0.018, borderWidth: 1, borderColor: accentColor + '55' }}>
              <Text style={{ color: accentColor, fontSize: w * 0.031, fontWeight: '700', letterSpacing: 1 }}>{titleLabel}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', width: '100%' }}>
          <StatPill emoji="🔥" value={streakCurrent} label={language === 'es' ? 'Racha actual' : 'Streak'} accentColor={accentColor} compact={isSquare} />
          <StatPill emoji="📖" value={devotionalsCompleted} label={language === 'es' ? 'Devocionales' : 'Devotionals'} accentColor={accentColor} compact={isSquare} />
        </View>

        {/* Footer */}
        {(showFooter || showTagline) && (
          <View style={{ alignItems: 'center' }}>
            {showFooter && (
              <Text style={{ color: 'rgba(255,255,255,0.42)', fontSize: w * 0.026, letterSpacing: 1, textAlign: 'center' }}>
                Compartiendo luz cada día
              </Text>
            )}
            {showTagline && (
              <Text style={{ color: 'rgba(255,255,255,0.22)', fontSize: w * 0.02, marginTop: 8, letterSpacing: 2, textAlign: 'center' }}>
                {tagline}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// ── LAYOUT: Historia ─────────────────────────────────────────────────────────
function HistoriaCanvas(props: CanvasProps) {
  const { w, h, gradientStart, gradientEnd, accentColor, avatarId, avatarEmoji,
    frameColor, nickname, titleLabel, streakCurrent, devotionalsCompleted,
    appName, tagline, language, showTagline, showFooter } = props;

  const avatarSize = Math.round(w * 0.32);

  return (
    <View style={{ width: w, height: h, overflow: 'hidden' }} collapsable={false}>
      <LinearGradient
        colors={[gradientStart + 'FF', gradientEnd + 'EE', '#05050F']}
        locations={[0, 0.45, 1]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={{ position: 'absolute', width: w, height: h }}
      />

      {/* Large ambient glow top-center */}
      <View style={{ position: 'absolute', top: -h * 0.08, left: w * 0.5 - w * 0.52, width: w * 1.04, height: w * 1.04, borderRadius: w * 0.52, backgroundColor: accentColor + '18' }} />
      {/* Bottom secondary glow */}
      <View style={{ position: 'absolute', bottom: h * 0.08, left: w * 0.5 - w * 0.4, width: w * 0.8, height: w * 0.8, borderRadius: w * 0.4, backgroundColor: gradientEnd + '20' }} />

      {/* Dotted texture lines */}
      {[0.28, 0.36, 0.44].map((pos, i) => (
        <View key={i} style={{ position: 'absolute', top: h * pos, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.04)' }} />
      ))}

      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: w * 0.08 }}>
        {/* Top bar */}
        <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center', paddingTop: h * 0.06 }}>
          <AppBadge appName={appName} />
        </View>

        {/* Hero avatar — large, center */}
        <View style={{ alignItems: 'center', marginTop: h * 0.065 }}>
          {/* Multi-ring glow */}
          {[1.55, 1.3, 1.1].map((mult, i) => (
            <View key={i} style={{
              position: 'absolute',
              width: avatarSize * mult,
              height: avatarSize * mult,
              borderRadius: (avatarSize * mult) / 2,
              backgroundColor: accentColor + (i === 0 ? '10' : i === 1 ? '16' : '1A'),
            }} />
          ))}
          <ProfileAvatarCanvas avatarId={avatarId} emoji={avatarEmoji} frameColor={frameColor} size={avatarSize} />
        </View>

        {/* Identity block */}
        <View style={{ alignItems: 'center', marginTop: h * 0.05 }}>
          <Text
            style={{ color: '#FFFFFF', fontSize: w * 0.08, fontWeight: '800', letterSpacing: -1, textAlign: 'center' }}
            numberOfLines={1} adjustsFontSizeToFit
          >
            {nickname}
          </Text>
          {titleLabel && (
            <View style={{ backgroundColor: accentColor + '28', borderRadius: 50, paddingHorizontal: w * 0.05, paddingVertical: w * 0.016, marginTop: w * 0.018, borderWidth: 1, borderColor: accentColor + '50' }}>
              <Text style={{ color: accentColor, fontSize: w * 0.034, fontWeight: '700', letterSpacing: 1 }}>✦ {titleLabel} ✦</Text>
            </View>
          )}
        </View>

        {/* Stats — vertical stack */}
        <View style={{ width: '100%', marginTop: h * 0.055 }}>
          <StatRow emoji="🔥" value={streakCurrent} label={language === 'es' ? 'Racha actual' : 'Current streak'} accentColor={accentColor} />
          <StatRow emoji="📖" value={devotionalsCompleted} label={language === 'es' ? 'Devocionales completados' : 'Devotionals completed'} accentColor={accentColor} />
        </View>

        {/* Footer area */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: h * 0.055 }}>
          <View style={{ width: w * 0.5, height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: h * 0.025 }} />
          {showFooter && (
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: w * 0.028, letterSpacing: 1, textAlign: 'center' }}>
              Compartiendo luz cada día
            </Text>
          )}
          {showTagline && (
            <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: w * 0.022, marginTop: 10, letterSpacing: 2, textAlign: 'center' }}>
              {tagline}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

// ── LAYOUT: Minimal ──────────────────────────────────────────────────────────
function MinimalCanvas(props: CanvasProps) {
  const { w, h, gradientStart, gradientEnd, accentColor, avatarId, avatarEmoji,
    frameColor, nickname, titleLabel, streakCurrent, devotionalsCompleted,
    appName, tagline, language, showTagline, showFooter } = props;

  const avatarSize = Math.round(w * 0.22);
  const isSquare = h === w;

  // Minimal uses a softer, lighter gradient
  const bgLight = gradientStart + 'F5';
  const bgMid = gradientEnd + 'E0';

  return (
    <View style={{ width: w, height: h, overflow: 'hidden' }} collapsable={false}>
      <LinearGradient
        colors={[bgLight, bgMid, '#0C0C18']}
        locations={[0, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', width: w, height: h }}
      />

      {/* Subtle geometric accent */}
      <View style={{ position: 'absolute', top: h * 0.1, right: -w * 0.12, width: w * 0.42, height: w * 0.42, borderRadius: 32, borderWidth: 1, borderColor: accentColor + '20', transform: [{ rotate: '15deg' }] }} />
      <View style={{ position: 'absolute', bottom: h * 0.12, left: -w * 0.1, width: w * 0.36, height: w * 0.36, borderRadius: 24, borderWidth: 1, borderColor: accentColor + '15', transform: [{ rotate: '-10deg' }] }} />

      <View style={{ flex: 1, paddingHorizontal: w * 0.1, paddingTop: isSquare ? h * 0.09 : h * 0.1, paddingBottom: h * 0.07 }}>

        {/* Top: small branding */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: h * 0.045 }}>
          <Text style={{ color: accentColor, fontSize: w * 0.026, fontWeight: '700', letterSpacing: 3, opacity: 0.8 }}>
            {appName.toUpperCase()}
          </Text>
          <View style={{ flex: 1 }} />
          <View style={{ width: w * 0.055, height: 2, backgroundColor: accentColor, opacity: 0.5, borderRadius: 1 }} />
        </View>

        {/* Avatar row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: h * 0.045 }}>
          <ProfileAvatarCanvas avatarId={avatarId} emoji={avatarEmoji} frameColor={frameColor} size={avatarSize} />
          <View style={{ marginLeft: w * 0.045, flex: 1 }}>
            <Text
              style={{ color: '#FFFFFF', fontSize: w * 0.055, fontWeight: '800', letterSpacing: -0.5 }}
              numberOfLines={1} adjustsFontSizeToFit
            >
              {nickname}
            </Text>
            {titleLabel && (
              <Text style={{ color: accentColor, fontSize: w * 0.028, fontWeight: '600', marginTop: 6, opacity: 0.9 }}>
                {titleLabel}
              </Text>
            )}
          </View>
        </View>

        {/* Divider */}
        <View style={{ width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: h * 0.04 }} />

        {/* Stats as clean rows */}
        <View style={{ gap: h * 0.025 }}>
          {[
            { emoji: '🔥', value: streakCurrent, label: language === 'es' ? 'Racha actual' : 'Current streak' },
            { emoji: '📖', value: devotionalsCompleted, label: language === 'es' ? 'Devocionales' : 'Devotionals' },
          ].map(({ emoji, value, label }) => (
            <View key={label} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: h * 0.025, paddingHorizontal: w * 0.05, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
              <Text style={{ fontSize: w * 0.038, marginRight: w * 0.035 }}>{emoji}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: w * 0.026, flex: 1 }}>{label}</Text>
              <Text style={{ color: '#FFFFFF', fontSize: w * 0.05, fontWeight: '800', letterSpacing: -1 }}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        {/* Footer */}
        {(showFooter || showTagline) && (
          <View>
            {showFooter && (
              <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: w * 0.024, letterSpacing: 0.5, textAlign: 'left' }}>
                Compartiendo luz cada día
              </Text>
            )}
            {showTagline && (
              <Text style={{ color: 'rgba(255,255,255,0.18)', fontSize: w * 0.019, marginTop: 8, letterSpacing: 1 }}>
                {tagline}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// ── Canvas router ─────────────────────────────────────────────────────────────
function ProfileCardCanvas(props: CanvasProps & { layout: CardLayout }) {
  const { layout, ...rest } = props;
  if (layout === 'historia') return <HistoriaCanvas {...rest} />;
  if (layout === 'minimal') return <MinimalCanvas {...rest} />;
  return <ClasicoCanvas {...rest} />;
}

// ── Caption builder ───────────────────────────────────────────────────────────
function buildCaption(language: 'en' | 'es', streak: number, devotionals: number): string {
  if (language === 'es') {
    return `Estoy creciendo con Luz Diaria 🙏\nRacha: ${streak} 🔥 | Devocionales: ${devotionals} 📖\n\nÚnete y compartamos luz cada día.`;
  }
  return `I'm growing with Luz Diaria 🙏\nStreak: ${streak} 🔥 | Devotionals: ${devotionals} 📖\n\nJoin me and share light every day.`;
}

// ── Segmented control ─────────────────────────────────────────────────────────
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accentColor,
  surfaceColor,
  textColor,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  accentColor: string;
  surfaceColor: string;
  textColor: string;
}) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: surfaceColor, borderRadius: 12, padding: 3, gap: 2 }}>
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => { Haptics.selectionAsync(); onChange(opt.value); }}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 9,
              backgroundColor: active ? accentColor : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: active ? '700' : '500', color: active ? '#FFFFFF' : textColor }}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Toggle({ value, onChange, label, textColor, accentColor }: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
  textColor: string;
  accentColor: string;
}) {
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); onChange(!value); }}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}
    >
      <Text style={{ color: textColor, fontSize: 14, flex: 1 }}>{label}</Text>
      <View style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        backgroundColor: value ? accentColor : textColor + '30',
        justifyContent: 'center',
        paddingHorizontal: 3,
      }}>
        <View style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: '#FFFFFF',
          alignSelf: value ? 'flex-end' : 'flex-start',
        }} />
      </View>
    </Pressable>
  );
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

  // State
  const [layout, setLayout] = useState<CardLayout>('clasico');
  const [sizePreset, setSizePreset] = useState<SizePreset>('portrait');
  const [showTagline, setShowTagline] = useState(false);
  const [showFooter, setShowFooter] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // Resolve theme colors
  const themeEntry = PURCHASABLE_THEMES[equippedThemeId] ?? PURCHASABLE_THEMES['theme_amanecer'];
  const themeData = themeEntry.colors;
  const gradientStart = isDarkMode ? themeData.backgroundDark : themeData.primary;
  const gradientEnd = isDarkMode ? themeData.surfaceDark : themeData.secondary;
  const accentColor = themeData.accent;
  const tagline = language === 'es' ? branding.taglineEs : branding.taglineEn;

  const { w, h } = SIZE_DIMS[sizePreset];

  const cardProps: CanvasProps = {
    nickname: user.nickname,
    titleLabel,
    streakCurrent: user.streakCurrent,
    devotionalsCompleted: user.devotionalsCompleted,
    avatarId: user.avatar,
    avatarEmoji,
    frameColor,
    gradientStart,
    gradientEnd,
    accentColor,
    appName: branding.appName,
    tagline,
    language,
    showTagline,
    showFooter,
    w,
    h,
  };

  // Preview dimensions
  const PREVIEW_H_MAX = 240;
  const PREVIEW_W = Math.round(PREVIEW_H_MAX * (w / h));
  const PREVIEW_H = PREVIEW_H_MAX;
  const previewScale = PREVIEW_W / w;

  const handleShare = async () => {
    if (!cardRef.current) return;
    setIsSharing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        width: w,
        height: h,
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

  const handleCopyCaption = async () => {
    const caption = buildCaption(language, user.streakCurrent, user.devotionalsCompleted);
    await Clipboard.setStringAsync(caption);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const layoutOptions: { value: CardLayout; label: string }[] = [
    { value: 'clasico', label: language === 'es' ? 'Clásico' : 'Classic' },
    { value: 'historia', label: language === 'es' ? 'Historia' : 'Story' },
    { value: 'minimal', label: 'Minimal' },
  ];

  const sizeOptions: { value: SizePreset; label: string }[] = [
    { value: 'portrait', label: '4:5' },
    { value: 'square', label: '1:1' },
    { value: 'story', label: '9:16' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 12,
            paddingBottom: insets.bottom + 20,
          }}
        >
          {/* Handle bar */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.textMuted + '40', alignSelf: 'center', marginBottom: 16 }} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
            bounces={false}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
                {language === 'es' ? 'Compartir progreso' : 'Share progress'}
              </Text>
              <Pressable
                onPress={onClose}
                style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={17} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Preview */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View
                style={{
                  width: PREVIEW_W,
                  height: PREVIEW_H,
                  overflow: 'hidden',
                  borderRadius: 14,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 16,
                  elevation: 10,
                }}
              >
                <View style={{ transform: [{ scale: previewScale }], transformOrigin: 'top left' as any }}>
                  <ProfileCardCanvas {...cardProps} layout={layout} />
                </View>
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 8, letterSpacing: 0.5 }}>
                {w}×{h}
              </Text>
            </View>

            {/* Layout selector */}
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
              {language === 'es' ? 'Estilo' : 'Style'}
            </Text>
            <SegmentedControl
              options={layoutOptions}
              value={layout}
              onChange={setLayout}
              accentColor={colors.primary}
              surfaceColor={colors.background}
              textColor={colors.textMuted}
            />

            {/* Size selector */}
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 8, marginTop: 16, textTransform: 'uppercase' }}>
              {language === 'es' ? 'Tamaño' : 'Size'}
            </Text>
            <SegmentedControl
              options={sizeOptions}
              value={sizePreset}
              onChange={setSizePreset}
              accentColor={colors.primary}
              surfaceColor={colors.background}
              textColor={colors.textMuted}
            />

            {/* Toggles */}
            <View style={{ marginTop: 16, paddingHorizontal: 4 }}>
              <Toggle
                value={showFooter}
                onChange={setShowFooter}
                label={language === 'es' ? 'Mostrar footer "Compartiendo luz"' : 'Show "Sharing light" footer'}
                textColor={colors.text}
                accentColor={colors.primary}
              />
              <Toggle
                value={showTagline}
                onChange={setShowTagline}
                label={language === 'es' ? 'Mostrar tagline del app' : 'Show app tagline'}
                textColor={colors.text}
                accentColor={colors.primary}
              />
            </View>

            {/* Action buttons */}
            <View style={{ marginTop: 20, gap: 10 }}>
              {/* Primary: share image */}
              <Pressable
                onPress={handleShare}
                disabled={isSharing}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colors.primary + 'CC' : colors.primary,
                  borderRadius: 14,
                  paddingVertical: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isSharing ? 0.7 : 1,
                })}
              >
                {isSharing
                  ? <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 8 }} />
                  : <Share2 size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                }
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                  {isSharing
                    ? (language === 'es' ? 'Preparando...' : 'Preparing...')
                    : (language === 'es' ? 'Compartir imagen' : 'Share image')}
                </Text>
              </Pressable>

              {/* Secondary: copy caption */}
              <Pressable
                onPress={handleCopyCaption}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colors.primary + '22' : colors.background,
                  borderRadius: 14,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: copied ? colors.primary + '60' : colors.primary + '30',
                })}
              >
                {copied
                  ? <Check size={17} color={colors.primary} style={{ marginRight: 8 }} />
                  : <Copy size={17} color={colors.primary} style={{ marginRight: 8 }} />
                }
                <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '600' }}>
                  {copied
                    ? (language === 'es' ? '¡Copiado!' : 'Copied!')
                    : (language === 'es' ? 'Copiar mensaje' : 'Copy caption')}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Offscreen full-res canvas for capture */}
      <View style={{ position: 'absolute', opacity: 0, left: -9999, top: -9999, pointerEvents: 'none' }}>
        <View ref={cardRef} collapsable={false}>
          <ProfileCardCanvas {...cardProps} layout={layout} />
        </View>
      </View>
    </Modal>
  );
}

export default ShareableProfileCard;
