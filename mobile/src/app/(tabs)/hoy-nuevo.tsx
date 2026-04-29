// New devotional format — powered by develop4God/devocionales-json
// Experimental tab: compare with current HOY before replacing

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Share2, BookOpen, Heart, Flame, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ShareSheet } from '@/components/ShareSheet';
import { useThemeColors, useLanguage, useUser, useAppStore } from '@/lib/store';
import { gamificationApi } from '@/lib/gamification-api';
import { addLedgerEntry } from '@/lib/points-ledger';
import { usePointsToast, PointsToast } from '@/components/PointsToast';
import {
  SAMPLE_DEVOCIONAL,
  REPO_DEFAULT_IMAGE,
  repoToDevotional,
  parseVersiculo,
} from '@/lib/repo-devocional';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = 300;

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const months = [
    'enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre',
  ];
  return `${day} de ${months[month - 1]}, ${year}`;
}

function TagChip({ label }: { label: string }) {
  return (
    <View
      style={{
        backgroundColor: 'rgba(99,102,241,0.12)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 5,
        marginRight: 8,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: '600', color: '#6366f1' }}>{label}</Text>
    </View>
  );
}

export default function HoyNuevoScreen() {
  const colors = useThemeColors();
  const language = useLanguage();
  const user = useUser();
  const insets = useSafeAreaInsets();
  const { currentToast, showToast, hideToast } = usePointsToast();
  const addPoints = useAppStore((s) => s.addPoints);

  const [shareVisible, setShareVisible] = useState(false);

  const devocional = SAMPLE_DEVOCIONAL;
  const { reference, version, text: verseText } = parseVersiculo(devocional.versiculo);
  const mappedDevotional = repoToDevotional(devocional, REPO_DEFAULT_IMAGE);

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShareVisible(true);
  };

  const handleShareComplete = async () => {
    if (!user) return;
    try {
      const result = await gamificationApi.awardPoints(user.id, 'share');
      if (result?.success) {
        addPoints(result.pointsAwarded);
        addLedgerEntry({ delta: result.pointsAwarded, kind: 'devotional', title: language === 'es' ? 'Devocional compartido' : 'Devotional shared', detail: '' });
        showToast(result.pointsAwarded, language === 'es' ? 'puntos (Compartir)' : 'points (Share)');
      }
    } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
      >
        {/* ── Hero ── */}
        <View style={{ height: HERO_HEIGHT, position: 'relative' }}>
          <Image
            source={{ uri: REPO_DEFAULT_IMAGE }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.72)']}
            style={{ position: 'absolute', inset: 0 }}
          />

          {/* Top bar */}
          <View
            style={{
              position: 'absolute',
              top: insets.top + 12,
              left: 20,
              right: 20,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.3)',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 }}>
                {version}
              </Text>
            </View>

            <Pressable
              onPress={handleShare}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 22,
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.3)',
              }}
            >
              <Share2 size={18} color="#fff" />
            </Pressable>
          </View>

          {/* Bottom overlay: reference + date */}
          <View
            style={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              right: 20,
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: 22,
                fontWeight: '700',
                letterSpacing: 0.3,
                marginBottom: 4,
              }}
            >
              {reference}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
              {formatDate(devocional.date)}
            </Text>
          </View>
        </View>

        {/* ── Verse Card (floating, overlaps hero) ── */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: -28,
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 18,
              fontStyle: 'italic',
              lineHeight: 28,
              fontWeight: '400',
              letterSpacing: 0.2,
            }}
          >
            "{verseText}"
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 16,
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: colors.textMuted + '22',
            }}
          >
            <Text
              style={{
                color: colors.primary,
                fontSize: 14,
                fontWeight: '700',
                flex: 1,
              }}
            >
              {reference}
            </Text>
            <View
              style={{
                backgroundColor: colors.primary + '18',
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>
                {version}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Reflexión ── */}
        <View style={{ marginHorizontal: 20, marginTop: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <View
              style={{
                backgroundColor: colors.primary + '18',
                borderRadius: 10,
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              <BookOpen size={18} color={colors.primary} />
            </View>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
              Reflexión
            </Text>
          </View>
          <Text
            style={{
              color: colors.text,
              fontSize: 16,
              lineHeight: 26,
              fontWeight: '400',
              opacity: 0.88,
            }}
          >
            {devocional.reflexion}
          </Text>
        </View>

        {/* ── Para Meditar ── */}
        <View style={{ marginTop: 32 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginHorizontal: 20,
              marginBottom: 14,
            }}
          >
            <View
              style={{
                backgroundColor: '#f43f5e18',
                borderRadius: 10,
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              <Heart size={18} color="#f43f5e" />
            </View>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
              Para Meditar
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
            style={{ flexGrow: 0 }}
          >
            {devocional.para_meditar.map((v, i) => (
              <View
                key={i}
                style={{
                  width: width * 0.72,
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 18,
                  marginRight: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: '#f43f5e',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.07,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <Text
                  style={{
                    color: '#f43f5e',
                    fontSize: 13,
                    fontWeight: '700',
                    marginBottom: 8,
                    letterSpacing: 0.3,
                  }}
                >
                  {v.cita}
                </Text>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 14,
                    lineHeight: 22,
                    fontStyle: 'italic',
                    opacity: 0.85,
                  }}
                >
                  "{v.texto}"
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── Oración ── */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 28,
            backgroundColor: colors.primary + '0E',
            borderRadius: 20,
            padding: 22,
            borderWidth: 1,
            borderColor: colors.primary + '22',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <View
              style={{
                backgroundColor: colors.primary + '22',
                borderRadius: 10,
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              <Flame size={18} color={colors.primary} />
            </View>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
              Oración
            </Text>
          </View>
          <Text
            style={{
              color: colors.text,
              fontSize: 15,
              lineHeight: 25,
              fontStyle: 'italic',
              opacity: 0.9,
            }}
          >
            {devocional.oracion}
          </Text>
        </View>

        {/* ── Tags ── */}
        {devocional.tags.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginHorizontal: 20,
              marginTop: 20,
            }}
          >
            {devocional.tags.map((tag) => (
              <TagChip key={tag} label={tag} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Share Sheet */}
      <ShareSheet
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        devotional={mappedDevotional}
        language={language}
        colors={colors}
        onShareComplete={handleShareComplete}
        showDate
      />

      {/* Points Toast */}
      <PointsToast message={currentToast} onHide={hideToast} />
    </View>
  );
}
