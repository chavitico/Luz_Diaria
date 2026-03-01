// Support Screen — Streak & Devotional Issue Reporter

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ChevronLeft, LifeBuoy, Flame, BookOpen, CheckCircle, Clock, AlertCircle, X } from 'lucide-react-native';
import { useThemeColors, useLanguage, useUser } from '@/lib/store';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';
const LAST_TICKET_KEY = '@support_last_ticket';

type IssueType = 'streak_missing' | 'devotional_not_counted';

interface SavedTicket {
  id: string;
  type: IssueType;
  status: 'open' | 'auto_fixed' | 'needs_human' | 'closed';
  resolutionNote: string | null;
  autoFixed: boolean;
  createdAt: string;
}

function getTodayDate(): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Costa_Rica',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(now);
  } catch {
    return new Date().toISOString().split('T')[0]!;
  }
}

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const language = useLanguage();
  const user = useUser();

  const [issueType, setIssueType] = useState<IssueType | null>(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastTicket, setLastTicket] = useState<SavedTicket | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState<{ title: string; message: string; isSuccess: boolean } | null>(null);

  const es = language === 'es';

  // Load last ticket from storage
  useEffect(() => {
    AsyncStorage.getItem(LAST_TICKET_KEY).then((raw) => {
      if (raw) {
        try { setLastTicket(JSON.parse(raw) as SavedTicket); } catch {}
      }
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!issueType || !user?.id || isSubmitting) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);

    try {
      const body = {
        userId: user.id,
        type: issueType,
        claimedStreak: user.streakCurrent ?? 0,
        claimedDate: getTodayDate(),
      };

      const res = await fetch(`${BACKEND_URL}/api/support/ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json() as {
        success: boolean;
        error?: string;
        ticket?: {
          id: string;
          status: string;
          resolutionNote: string | null;
          autoFixed: boolean;
        };
      };

      if (!data.success || !data.ticket) {
        throw new Error(data.error ?? 'Error desconocido');
      }

      const { ticket } = data;

      // Save to local storage
      const saved: SavedTicket = {
        id: ticket.id,
        type: issueType,
        status: ticket.status as SavedTicket['status'],
        resolutionNote: ticket.resolutionNote,
        autoFixed: ticket.autoFixed,
        createdAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(LAST_TICKET_KEY, JSON.stringify(saved));
      setLastTicket(saved);

      // Show result modal
      if (ticket.autoFixed) {
        setModalData({
          isSuccess: true,
          title: es ? '¡Listo!' : 'Fixed!',
          message: es
            ? 'Detectamos una diferencia pequeña y la corregimos automáticamente. Tu racha no disminuirá.'
            : 'We detected a small discrepancy and corrected it automatically. Your streak is protected.',
        });
      } else {
        setModalData({
          isSuccess: false,
          title: es ? 'Recibido' : 'Received',
          message: es
            ? 'Tu caso necesita revisión. Guardamos tu reporte. Gracias por reportarlo.'
            : 'Your case needs review. We saved your report. Thank you for letting us know.',
        });
      }

      setModalVisible(true);
      setIssueType(null);
      setDetails('');
    } catch (err) {
      setModalData({
        isSuccess: false,
        title: es ? 'Error' : 'Error',
        message: es
          ? 'No pudimos enviar tu reporte. Intenta de nuevo más tarde.'
          : 'We could not send your report. Please try again later.',
      });
      setModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [issueType, user, isSubmitting, es]);

  const statusColor = (status: SavedTicket['status']) => {
    if (status === 'auto_fixed' || status === 'closed') return '#22C55E';
    if (status === 'needs_human') return '#F59E0B';
    return colors.textMuted;
  };

  const statusLabel = (status: SavedTicket['status']) => {
    if (status === 'auto_fixed') return es ? 'Corregido automáticamente' : 'Auto-fixed';
    if (status === 'closed') return es ? 'Cerrado' : 'Closed';
    if (status === 'needs_human') return es ? 'En revisión' : 'Under review';
    return es ? 'Pendiente' : 'Pending';
  };

  const StatusIcon = ({ status }: { status: SavedTicket['status'] }) => {
    if (status === 'auto_fixed' || status === 'closed') return <CheckCircle size={14} color="#22C55E" />;
    if (status === 'needs_human') return <Clock size={14} color="#F59E0B" />;
    return <AlertCircle size={14} color={colors.textMuted} />;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 20,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.textMuted + '18',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <LifeBuoy size={20} color={colors.primary} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, flex: 1 }}>
          {es ? 'Soporte' : 'Support'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Intro */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <View
            style={{
              backgroundColor: colors.primary + '12',
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: colors.primary + '25',
            }}
          >
            <Text style={{ fontSize: 14, color: colors.text, lineHeight: 21 }}>
              {es
                ? 'Si tu racha o tu devocional no se actualizó correctamente, crea un reporte y el sistema intentará corregirlo de forma automática.'
                : 'If your streak or devotional did not update correctly, submit a report and the system will try to fix it automatically.'}
            </Text>
          </View>
        </Animated.View>

        {/* Issue Type Selector */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: colors.textMuted,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            {es ? 'Tipo de problema' : 'Issue type'}
          </Text>

          <View style={{ gap: 10, marginBottom: 24 }}>
            {/* Option: streak */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIssueType('streak_missing');
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderRadius: 16,
                backgroundColor: issueType === 'streak_missing'
                  ? colors.primary + '18'
                  : colors.surface,
                borderWidth: 2,
                borderColor: issueType === 'streak_missing'
                  ? colors.primary
                  : 'transparent',
                opacity: pressed ? 0.85 : 1,
                gap: 14,
              })}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: issueType === 'streak_missing'
                    ? colors.primary + '25'
                    : colors.textMuted + '18',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Flame size={20} color={issueType === 'streak_missing' ? colors.primary : colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: issueType === 'streak_missing' ? colors.primary : colors.text,
                  marginBottom: 2,
                }}>
                  {es ? 'Perdí mi racha' : 'Lost my streak'}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 18 }}>
                  {es
                    ? 'Completé el devocional pero mi racha se reinició'
                    : 'I completed the devotional but my streak was reset'}
                </Text>
              </View>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: issueType === 'streak_missing' ? colors.primary : colors.textMuted + '50',
                  backgroundColor: issueType === 'streak_missing' ? colors.primary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {issueType === 'streak_missing' && (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' }} />
                )}
              </View>
            </Pressable>

            {/* Option: devotional not counted */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIssueType('devotional_not_counted');
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderRadius: 16,
                backgroundColor: issueType === 'devotional_not_counted'
                  ? colors.primary + '18'
                  : colors.surface,
                borderWidth: 2,
                borderColor: issueType === 'devotional_not_counted'
                  ? colors.primary
                  : 'transparent',
                opacity: pressed ? 0.85 : 1,
                gap: 14,
              })}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: issueType === 'devotional_not_counted'
                    ? colors.primary + '25'
                    : colors.textMuted + '18',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookOpen size={20} color={issueType === 'devotional_not_counted' ? colors.primary : colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: issueType === 'devotional_not_counted' ? colors.primary : colors.text,
                  marginBottom: 2,
                }}>
                  {es ? 'No me contó el devocional' : 'Devotional not counted'}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 18 }}>
                  {es
                    ? 'Leí el devocional pero no aparece como completado'
                    : 'I read the devotional but it shows as incomplete'}
                </Text>
              </View>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: issueType === 'devotional_not_counted' ? colors.primary : colors.textMuted + '50',
                  backgroundColor: issueType === 'devotional_not_counted' ? colors.primary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {issueType === 'devotional_not_counted' && (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' }} />
                )}
              </View>
            </Pressable>
          </View>
        </Animated.View>

        {/* Submit Button */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Pressable
            onPress={handleSubmit}
            disabled={!issueType || isSubmitting}
            style={({ pressed }) => ({
              backgroundColor: (!issueType || isSubmitting)
                ? colors.primary + '40'
                : colors.primary,
              borderRadius: 16,
              paddingVertical: 17,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.88 : 1,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: (!issueType || isSubmitting) ? 0 : 0.3,
              shadowRadius: 10,
              elevation: (!issueType || isSubmitting) ? 0 : 6,
            })}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 }}>
                {es ? 'Enviar reporte' : 'Submit report'}
              </Text>
            )}
          </Pressable>
        </Animated.View>

        {/* Last ticket */}
        {lastTicket && (
          <Animated.View entering={FadeInDown.delay(280).duration(400)} style={{ marginTop: 28 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.textMuted,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              {es ? 'Último reporte' : 'Last report'}
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                borderLeftWidth: 3,
                borderLeftColor: statusColor(lastTicket.status),
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <StatusIcon status={lastTicket.status} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: statusColor(lastTicket.status) }}>
                  {statusLabel(lastTicket.status)}
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 4 }}>
                {lastTicket.type === 'streak_missing'
                  ? (es ? 'Racha perdida' : 'Lost streak')
                  : (es ? 'Devocional no contado' : 'Devotional not counted')}
              </Text>
              {lastTicket.resolutionNote && (
                <Text style={{ fontSize: 12, color: colors.text + 'CC', lineHeight: 18, marginTop: 6 }}>
                  {lastTicket.resolutionNote}
                </Text>
              )}
              <Text style={{ fontSize: 11, color: colors.textMuted + '80', marginTop: 8 }}>
                {new Date(lastTicket.createdAt).toLocaleDateString(language === 'es' ? 'es-CR' : 'en-US', {
                  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Note */}
        <Animated.View entering={FadeInDown.delay(320).duration(400)} style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 }}>
            {es
              ? 'Tu reporte queda registrado. Si no puede resolverse automáticamente, quedará guardado para revisión.'
              : 'Your report is saved. If it cannot be resolved automatically, it will be kept for review.'}
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Result Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.55)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              padding: 28,
              width: '100%',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 12,
            }}
          >
            {/* X close button */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setModalVisible(false);
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={({ pressed }) => ({
                position: 'absolute',
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.textMuted + '20',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <X size={16} color={colors.textMuted} />
            </Pressable>

            {/* Icon */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: modalData?.isSuccess ? '#22C55E18' : '#F59E0B18',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                marginTop: 8,
              }}
            >
              {modalData?.isSuccess
                ? <CheckCircle size={32} color="#22C55E" />
                : <Clock size={32} color="#F59E0B" />
              }
            </View>

            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 10, textAlign: 'center' }}>
              {modalData?.title}
            </Text>
            <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21, marginBottom: 24 }}>
              {modalData?.message}
            </Text>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setModalVisible(false);
              }}
              style={({ pressed }) => ({
                backgroundColor: colors.primary,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 40,
                opacity: pressed ? 0.88 : 1,
              })}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
                OK
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
