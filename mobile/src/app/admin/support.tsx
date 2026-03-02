// Admin Support Screen — Internal ticket viewer (hidden access via Settings)

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, CheckCircle, Clock, AlertCircle, LifeBuoy } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useThemeColors, useLanguage, useUser } from '@/lib/store';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

interface AdminTicket {
  id: string;
  userId: string;
  type: string;
  claimedStreak: number;
  claimedDate: string;
  status: 'open' | 'auto_fixed' | 'needs_human' | 'closed';
  resolutionNote: string | null;
  beforeState: string;
  afterState: string;
  createdAt: string;
}

function statusColor(status: AdminTicket['status']): string {
  if (status === 'auto_fixed' || status === 'closed') return '#22C55E';
  if (status === 'needs_human') return '#F59E0B';
  return '#94A3B8';
}

function StatusIcon({ status }: { status: AdminTicket['status'] }) {
  const color = statusColor(status);
  if (status === 'auto_fixed' || status === 'closed') return <CheckCircle size={13} color={color} />;
  if (status === 'needs_human') return <AlertCircle size={13} color={color} />;
  return <Clock size={13} color={color} />;
}

export default function AdminSupportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const language = useLanguage();
  const user = useUser();
  const userId = user?.id ?? '';

  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const es = language === 'es';

  const fetchTickets = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/support/admin/tickets?limit=50`, {
        headers: { 'X-User-Id': userId },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { tickets: AdminTicket[] };
      setTickets(data.tickets ?? []);
    } catch (e) {
      setError(`No se pudieron cargar los tickets: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const counts = {
    total: tickets.length,
    auto_fixed: tickets.filter(t => t.status === 'auto_fixed').length,
    needs_human: tickets.filter(t => t.status === 'needs_human').length,
    open: tickets.filter(t => t.status === 'open').length,
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
        <LifeBuoy size={20} color="#F59E0B" />
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, flex: 1 }}>
          Admin — Tickets
        </Text>
        <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '600' }}>
          {counts.total} total
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <AlertCircle size={40} color={colors.textMuted} />
          <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 16, textAlign: 'center', lineHeight: 21 }}>
            {error}
          </Text>
          <Pressable
            onPress={() => fetchTickets()}
            style={({ pressed }) => ({
              marginTop: 20,
              paddingVertical: 12,
              paddingHorizontal: 28,
              borderRadius: 12,
              backgroundColor: colors.primary,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>
              {es ? 'Reintentar' : 'Retry'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchTickets(true)}
              tintColor={colors.primary}
            />
          }
        >
          {/* Summary chips */}
          <Animated.View
            entering={FadeInDown.delay(50).duration(350)}
            style={{ flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}
          >
            {[
              { label: `${counts.auto_fixed} auto-fixed`, color: '#22C55E' },
              { label: `${counts.needs_human} needs_human`, color: '#F59E0B' },
              { label: `${counts.open} open`, color: colors.textMuted },
            ].map((chip) => (
              <View
                key={chip.label}
                style={{
                  paddingVertical: 5,
                  paddingHorizontal: 12,
                  borderRadius: 20,
                  backgroundColor: chip.color + '18',
                  borderWidth: 1,
                  borderColor: chip.color + '40',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: chip.color }}>
                  {chip.label}
                </Text>
              </View>
            ))}
          </Animated.View>

          {tickets.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <CheckCircle size={40} color={colors.textMuted + '60'} />
              <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 16 }}>
                {es ? 'Sin tickets aún' : 'No tickets yet'}
              </Text>
            </View>
          ) : (
            tickets.map((ticket, i) => {
              let before: Record<string, unknown> = {};
              let after: Record<string, unknown> = {};
              try { before = JSON.parse(ticket.beforeState); } catch {}
              try { after = JSON.parse(ticket.afterState); } catch {}

              const streakBefore = before.streakCurrent as number | undefined;
              const streakAfter = after.streakCurrent as number | undefined;

              return (
                <Animated.View
                  key={ticket.id}
                  entering={FadeInDown.delay(80 + i * 30).duration(350)}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 10,
                    borderLeftWidth: 3,
                    borderLeftColor: statusColor(ticket.status),
                  }}
                >
                  {/* Row 1: status + type */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <StatusIcon status={ticket.status} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: statusColor(ticket.status), flex: 1 }}>
                      {ticket.status}
                    </Text>
                    <Text style={{
                      fontSize: 11,
                      color: colors.textMuted,
                      backgroundColor: colors.textMuted + '18',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 8,
                    }}>
                      {ticket.type === 'streak_missing' ? '🔥 streak' : '📖 devotional'}
                    </Text>
                  </View>

                  {/* Row 2: userId + date */}
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      uid: <Text style={{ fontFamily: 'monospace' }}>{ticket.userId.slice(0, 10)}…</Text>
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      · {ticket.claimedDate}
                    </Text>
                  </View>

                  {/* Row 3: streak delta */}
                  {(streakBefore !== undefined || streakAfter !== undefined) && (
                    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>
                        claimed: <Text style={{ fontWeight: '700', color: colors.text }}>{ticket.claimedStreak}</Text>
                      </Text>
                      {streakBefore !== undefined && (
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>
                          · before: <Text style={{ fontWeight: '700', color: colors.text }}>{streakBefore}</Text>
                        </Text>
                      )}
                      {streakAfter !== undefined && streakAfter !== streakBefore && (
                        <Text style={{ fontSize: 11, color: '#22C55E' }}>
                          → after: <Text style={{ fontWeight: '700' }}>{streakAfter}</Text>
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Resolution note */}
                  {ticket.resolutionNote && (
                    <Text style={{ fontSize: 11, color: colors.text + 'AA', lineHeight: 17, marginTop: 4 }}>
                      {ticket.resolutionNote}
                    </Text>
                  )}

                  {/* Timestamp */}
                  <Text style={{ fontSize: 10, color: colors.textMuted + '70', marginTop: 6 }}>
                    {new Date(ticket.createdAt).toLocaleString(language === 'es' ? 'es-CR' : 'en-US')}
                  </Text>
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
