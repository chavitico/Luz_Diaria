// Support Screen — Multi-category issue reporter

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  LifeBuoy,
  Flame,
  BookOpen,
  Volume2,
  Bell,
  Gift,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  ChevronRight,
} from 'lucide-react-native';
import { useThemeColors, useLanguage, useUser } from '@/lib/store';
import { getNotificationSettings } from '@/lib/notifications';
import { pickBestVoice } from '@/lib/voice-picker';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';
const LAST_TICKET_KEY = '@support_last_ticket_v2';

type Category =
  | 'streak_missing'
  | 'devotional_not_counted'
  | 'audio_tts'
  | 'notification'
  | 'reward_drop';

interface SavedTicket {
  id: string;
  type: Category;
  status: 'open' | 'auto_fixed' | 'needs_human' | 'closed';
  resolutionNote: string | null;
  autoFixed: boolean;
  createdAt: string;
}

// ─── Category definitions ─────────────────────────────────────────────────────

interface CategoryDef {
  type: Category;
  renderIcon: (color: string) => React.ReactNode;
  titleEs: string;
  titleEn: string;
  subtitleEs: string;
  subtitleEn: string;
  color: string;
}

function useCategoryDefs(colors: ReturnType<typeof useThemeColors>): CategoryDef[] {
  return [
    {
      type: 'streak_missing',
      renderIcon: (c) => <Flame size={20} color={c} />,
      titleEs: 'Perdí mi racha',
      titleEn: 'Lost my streak',
      subtitleEs: 'Completé el devocional pero mi racha se reinició',
      subtitleEn: 'I completed the devotional but my streak was reset',
      color: '#F97316',
    },
    {
      type: 'devotional_not_counted',
      renderIcon: (c) => <BookOpen size={20} color={c} />,
      titleEs: 'Devocional no contado',
      titleEn: 'Devotional not counted',
      subtitleEs: 'Leí el devocional pero no aparece como completado',
      subtitleEn: 'I read the devotional but it shows as incomplete',
      color: '#8B5CF6',
    },
    {
      type: 'audio_tts',
      renderIcon: (c) => <Volume2 size={20} color={c} />,
      titleEs: 'Problema de audio / TTS',
      titleEn: 'Audio / TTS issue',
      subtitleEs: 'Sin sonido, se repite, se corta o cambió la voz',
      subtitleEn: 'No sound, repeats, cuts off, or voice changed',
      color: '#0EA5E9',
    },
    {
      type: 'notification',
      renderIcon: (c) => <Bell size={20} color={c} />,
      titleEs: 'Problema con notificaciones',
      titleEn: 'Notification issue',
      subtitleEs: 'No recibo notificaciones, llegan tarde o duplicadas',
      subtitleEn: 'Not receiving, late, or duplicate notifications',
      color: '#EAB308',
    },
    {
      type: 'reward_drop',
      renderIcon: (c) => <Gift size={20} color={c} />,
      titleEs: 'Regalo / Cofre no recibido',
      titleEn: 'Gift / Drop not received',
      subtitleEs: 'No recibí el regalo o el cofre no abre',
      subtitleEn: "Didn't receive the gift or chest won't open",
      color: '#22C55E',
    },
  ];
}

// ─── Sub-option selectors ──────────────────────────────────────────────────────

interface SubOption {
  value: string;
  labelEs: string;
  labelEn: string;
}

const AUDIO_ISSUES: SubOption[] = [
  { value: 'no_sound',      labelEs: 'Sin sonido',                labelEn: 'No sound' },
  { value: 'repeats',       labelEs: 'Se repite constantemente',  labelEn: 'Keeps repeating' },
  { value: 'cuts',          labelEs: 'Se corta o se interrumpe',  labelEn: 'Cuts off / interrupted' },
  { value: 'voice_changed', labelEs: 'Cambió la voz',             labelEn: 'Voice changed' },
  { value: 'voz_rara',      labelEs: 'Voz rara / robótica',       labelEn: 'Weird / robotic voice' },
];

const NOTIFICATION_ISSUES: SubOption[] = [
  { value: 'not_received', labelEs: 'No las recibo',          labelEn: 'Not receiving them' },
  { value: 'late',         labelEs: 'Llegan tarde',           labelEn: 'Arriving late' },
  { value: 'duplicate',    labelEs: 'Recibo duplicadas',      labelEn: 'Getting duplicates' },
];

const DROP_ISSUES: SubOption[] = [
  { value: 'not_received', labelEs: 'No recibí el regalo',    labelEn: "Didn't receive gift" },
  { value: 'open_failed',  labelEs: 'El cofre no abre',       labelEn: "Chest won't open" },
];

function SubOptionPicker({
  options,
  selected,
  onSelect,
  es,
  colors,
}: {
  options: SubOption[];
  selected: string | null;
  onSelect: (v: string) => void;
  es: boolean;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={{ gap: 8, marginTop: 16 }}>
      <Text style={{
        fontSize: 12, fontWeight: '700', color: colors.textMuted,
        letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 4,
      }}>
        {es ? '¿Qué ocurre?' : 'What happened?'}
      </Text>
      {options.map(opt => (
        <Pressable
          key={opt.value}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelect(opt.value);
          }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 13,
            paddingHorizontal: 16,
            borderRadius: 14,
            backgroundColor: selected === opt.value ? colors.primary + '15' : colors.surface,
            borderWidth: 1.5,
            borderColor: selected === opt.value ? colors.primary + '80' : 'transparent',
            opacity: pressed ? 0.8 : 1,
            gap: 12,
          })}
        >
          <View style={{
            width: 18, height: 18, borderRadius: 9,
            borderWidth: 2,
            borderColor: selected === opt.value ? colors.primary : colors.textMuted + '50',
            backgroundColor: selected === opt.value ? colors.primary : 'transparent',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {selected === opt.value && (
              <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#FFF' }} />
            )}
          </View>
          <Text style={{
            fontSize: 14, fontWeight: selected === opt.value ? '700' : '500',
            color: selected === opt.value ? colors.primary : colors.text,
            flex: 1,
          }}>
            {es ? opt.labelEs : opt.labelEn}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getTodayDate(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Costa_Rica',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0]!;
  }
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const language = useLanguage();
  const user = useUser();
  const es = language === 'es';

  const categories = useCategoryDefs(colors);

  const [step, setStep] = useState<'category' | 'detail'>('category');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [subIssue, setSubIssue] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastTicket, setLastTicket] = useState<SavedTicket | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState<{ title: string; message: string; isSuccess: boolean } | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(LAST_TICKET_KEY).then(raw => {
      if (raw) { try { setLastTicket(JSON.parse(raw) as SavedTicket); } catch {} }
    });
  }, []);

  const handleSelectCategory = (cat: Category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(cat);
    setSubIssue(null);
    // streak/devotional don't need a sub-option step
    if (cat === 'streak_missing' || cat === 'devotional_not_counted') {
      setStep('detail');
    } else {
      setStep('detail');
    }
  };

  const getSubOptions = (cat: Category): SubOption[] => {
    if (cat === 'audio_tts') return AUDIO_ISSUES;
    if (cat === 'notification') return NOTIFICATION_ISSUES;
    if (cat === 'reward_drop') return DROP_ISSUES;
    return [];
  };

  const needsSubIssue = (cat: Category) =>
    cat === 'audio_tts' || cat === 'notification' || cat === 'reward_drop';

  const canSubmit = selectedCategory !== null
    && (!needsSubIssue(selectedCategory) || subIssue !== null);

  const handleSubmit = useCallback(async () => {
    if (!selectedCategory || !user?.id || isSubmitting) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);

    try {
      // Build clientClaim based on type
      let clientClaim: Record<string, unknown> = {};
      if (selectedCategory === 'streak_missing') {
        clientClaim = { claimedStreak: user.streakCurrent ?? 0 };
      } else if (selectedCategory === 'devotional_not_counted') {
        clientClaim = { date: getTodayDate(), issue: 'not_counted' };
      } else if (selectedCategory === 'audio_tts') {
        // Gather TTS diagnostics to help debugging
        let ttsVoiceIdentifier = '';
        let ttsVoiceName = '';
        let ttsLanguage = '';
        let ttsPreferredVoiceFound = false;
        let ttsIsEloquence = false;
        let ttsNeedsUserAction = false;
        let ttsVoiceScore = 0;
        try {
          const langCode = (language === 'es' ? 'es' : 'en') as 'en' | 'es';
          const picked = await pickBestVoice(langCode);
          ttsVoiceIdentifier = picked.voiceIdentifier;
          ttsVoiceName = picked.name;
          ttsLanguage = picked.language;
          ttsPreferredVoiceFound = picked.preferredVoiceFound;
          ttsIsEloquence = picked.isEloquence;
          ttsNeedsUserAction = picked.needsUserAction;
          ttsVoiceScore = picked.score;
        } catch (_) {}
        clientClaim = {
          issue: subIssue,
          os: Platform.OS,
          ttsVoiceIdentifier,
          ttsVoiceName,
          ttsLanguage,
          ttsPreferredVoiceFound,
          ttsIsEloquence,
          ttsNeedsUserAction,
          ttsVoiceScore,
        };
      } else if (selectedCategory === 'notification') {
        // Grab notification settings from local storage
        const notifSettings = await getNotificationSettings();
        clientClaim = {
          issue: subIssue,
          scheduledHour: notifSettings?.hour,
          enabled: notifSettings?.enabled,
        };
      } else if (selectedCategory === 'reward_drop') {
        clientClaim = { issue: subIssue };
      }

      const body = {
        userId: user.id,
        type: selectedCategory,
        claimedStreak: user.streakCurrent ?? 0,
        claimedDate: getTodayDate(),
        clientClaim,
      };

      const res = await fetch(`${BACKEND_URL}/api/support/ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json() as {
        success: boolean;
        error?: string;
        ticket?: { id: string; status: string; resolutionNote: string | null; autoFixed: boolean };
      };

      if (!data.success || !data.ticket) throw new Error(data.error ?? 'Error desconocido');

      const { ticket } = data;

      const saved: SavedTicket = {
        id: ticket.id,
        type: selectedCategory,
        status: ticket.status as SavedTicket['status'],
        resolutionNote: ticket.resolutionNote,
        autoFixed: ticket.autoFixed,
        createdAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(LAST_TICKET_KEY, JSON.stringify(saved));
      setLastTicket(saved);

      if (ticket.autoFixed) {
        setModalData({
          isSuccess: true,
          title: es ? '¡Listo!' : 'Fixed!',
          message: es
            ? 'Detectamos una diferencia y la corregimos automáticamente. Tu racha está protegida.'
            : 'We detected a discrepancy and corrected it automatically. Your streak is safe.',
        });
      } else {
        setModalData({
          isSuccess: false,
          title: es ? 'Recibido' : 'Received',
          message: es
            ? 'Recibimos tu solicitud. Si aplica, el sistema intentará corregirlo automáticamente. De lo contrario quedará para revisión.'
            : 'We received your request. If applicable, the system will try to fix it automatically, otherwise it will be queued for review.',
        });
      }

      setModalVisible(true);
      setStep('category');
      setSelectedCategory(null);
      setSubIssue(null);
    } catch (err) {
      setModalData({
        isSuccess: false,
        title: 'Error',
        message: es
          ? 'No pudimos enviar tu reporte. Intenta de nuevo más tarde.'
          : 'We could not send your report. Please try again later.',
      });
      setModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedCategory, subIssue, user, isSubmitting, es]);

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

  const catDef = categories.find(c => c.type === selectedCategory);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: 20,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.textMuted + '18',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}>
        <Pressable
          onPress={() => {
            if (step === 'detail') {
              setStep('category');
              setSubIssue(null);
            } else {
              router.back();
            }
          }}
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
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'category' ? (
          <>
            {/* Intro */}
            <Animated.View entering={FadeInDown.delay(40).duration(400)}>
              <View style={{
                backgroundColor: colors.primary + '12',
                borderRadius: 16,
                padding: 16,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: colors.primary + '25',
              }}>
                <Text style={{ fontSize: 14, color: colors.text, lineHeight: 21 }}>
                  {es
                    ? 'Selecciona la categoría que mejor describe tu problema. El sistema intentará resolverlo de forma automática cuando sea posible.'
                    : 'Select the category that best describes your issue. The system will try to resolve it automatically when possible.'}
                </Text>
              </View>
            </Animated.View>

            {/* Category Selector */}
            <Animated.View entering={FadeInDown.delay(80).duration(400)}>
              <Text style={{
                fontSize: 12, fontWeight: '700', color: colors.textMuted,
                letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14,
              }}>
                {es ? 'Categoría' : 'Category'}
              </Text>

              <View style={{ gap: 10 }}>
                {categories.map((cat, i) => (
                  <Animated.View key={cat.type} entering={FadeInDown.delay(100 + i * 40).duration(350)}>
                    <Pressable
                      onPress={() => handleSelectCategory(cat.type)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 16,
                        borderRadius: 18,
                        backgroundColor: colors.surface,
                        opacity: pressed ? 0.85 : 1,
                        gap: 14,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.04,
                        shadowRadius: 4,
                        elevation: 1,
                      })}
                    >
                      {/* Icon */}
                      <View style={{
                        width: 44, height: 44, borderRadius: 22,
                        backgroundColor: cat.color + '18',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {cat.renderIcon(cat.color)}
                      </View>

                      {/* Text */}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 }}>
                          {es ? cat.titleEs : cat.titleEn}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 17 }}>
                          {es ? cat.subtitleEs : cat.subtitleEn}
                        </Text>
                      </View>

                      <ChevronRight size={16} color={colors.textMuted} />
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>

            {/* Last ticket */}
            {lastTicket && (
              <Animated.View entering={FadeInDown.delay(320).duration(400)} style={{ marginTop: 32 }}>
                <Text style={{
                  fontSize: 12, fontWeight: '700', color: colors.textMuted,
                  letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12,
                }}>
                  {es ? 'Último reporte' : 'Last report'}
                </Text>
                <View style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 16,
                  borderLeftWidth: 3,
                  borderLeftColor: statusColor(lastTicket.status),
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    {lastTicket.status === 'auto_fixed' || lastTicket.status === 'closed'
                      ? <CheckCircle size={14} color="#22C55E" />
                      : lastTicket.status === 'needs_human'
                        ? <Clock size={14} color="#F59E0B" />
                        : <AlertCircle size={14} color={colors.textMuted} />
                    }
                    <Text style={{ fontSize: 14, fontWeight: '700', color: statusColor(lastTicket.status) }}>
                      {statusLabel(lastTicket.status)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 4 }}>
                    {categories.find(c => c.type === lastTicket.type)?.[es ? 'titleEs' : 'titleEn'] ?? lastTicket.type}
                  </Text>
                  {lastTicket.resolutionNote && (
                    <Text style={{ fontSize: 12, color: colors.text + 'CC', lineHeight: 18, marginTop: 4 }}>
                      {lastTicket.resolutionNote}
                    </Text>
                  )}
                  <Text style={{ fontSize: 11, color: colors.textMuted + '80', marginTop: 8 }}>
                    {new Date(lastTicket.createdAt).toLocaleDateString(es ? 'es-CR' : 'en-US', {
                      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </View>
              </Animated.View>
            )}
          </>
        ) : (
          /* Detail / Sub-issue step */
          <>
            {catDef && (
              <Animated.View entering={FadeIn.duration(300)}>
                {/* Category header */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  backgroundColor: colors.surface,
                  borderRadius: 18,
                  padding: 16,
                  marginBottom: 24,
                  borderLeftWidth: 3.5,
                  borderLeftColor: catDef.color,
                }}>
                  <View style={{
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: catDef.color + '18',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {catDef.renderIcon(catDef.color)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                      {es ? catDef.titleEs : catDef.titleEn}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                      {es ? catDef.subtitleEs : catDef.subtitleEn}
                    </Text>
                  </View>
                </View>

                {/* Sub-options if needed */}
                {needsSubIssue(selectedCategory!) && (
                  <SubOptionPicker
                    options={getSubOptions(selectedCategory!)}
                    selected={subIssue}
                    onSelect={setSubIssue}
                    es={es}
                    colors={colors}
                  />
                )}

                {/* Info for streak/devotional */}
                {!needsSubIssue(selectedCategory!) && (
                  <View style={{
                    backgroundColor: catDef.color + '10',
                    borderRadius: 14,
                    padding: 16,
                    marginTop: 8,
                    borderWidth: 1,
                    borderColor: catDef.color + '25',
                  }}>
                    <Text style={{ fontSize: 14, color: colors.text, lineHeight: 21 }}>
                      {selectedCategory === 'streak_missing'
                        ? (es
                            ? 'El sistema verificará tu racha usando el historial del servidor. Si la diferencia es pequeña, se corregirá de forma automática.'
                            : 'The system will verify your streak using server history. If the difference is small, it will be corrected automatically.')
                        : (es
                            ? 'El sistema verificará si el devocional de hoy fue registrado correctamente.'
                            : "The system will check if today's devotional was correctly registered.")
                      }
                    </Text>
                  </View>
                )}

                {/* Submit Button */}
                <Pressable
                  onPress={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  style={({ pressed }) => ({
                    backgroundColor: canSubmit && !isSubmitting ? colors.primary : colors.primary + '40',
                    borderRadius: 16,
                    paddingVertical: 17,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 28,
                    opacity: pressed ? 0.88 : 1,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: canSubmit && !isSubmitting ? 0.3 : 0,
                    shadowRadius: 10,
                    elevation: canSubmit && !isSubmitting ? 6 : 0,
                  })}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={colors.primaryText} />
                  ) : (
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primaryText, letterSpacing: 0.3 }}>
                      {es ? 'Enviar reporte' : 'Submit report'}
                    </Text>
                  )}
                </Pressable>

                {/* Note */}
                <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18, marginTop: 16 }}>
                  {es
                    ? 'Tu reporte queda registrado. Si no puede resolverse automáticamente, quedará guardado para revisión.'
                    : 'Your report is saved. If it cannot be resolved automatically, it will be kept for review.'}
                </Text>
              </Animated.View>
            )}
          </>
        )}
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
            <Pressable
              onPress={() => setModalVisible(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={({ pressed }) => ({
                position: 'absolute', top: 16, right: 16,
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: colors.textMuted + '20',
                alignItems: 'center', justifyContent: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <X size={16} color={colors.textMuted} />
            </Pressable>

            <View style={{
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: modalData?.isSuccess ? '#22C55E18' : '#F59E0B18',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 16, marginTop: 8,
            }}>
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
              onPress={() => setModalVisible(false)}
              style={({ pressed }) => ({
                backgroundColor: colors.primary,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 40,
                opacity: pressed ? 0.88 : 1,
              })}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.primaryText }}>OK</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
