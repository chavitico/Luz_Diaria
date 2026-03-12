// Admin: Testimonies Moderator
// Review pending testimonies and approve or reject them (MODERATOR/OWNER only)

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Check,
  X,
  Trash2,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquareHeart,
} from 'lucide-react-native';
import { useThemeColors, useUser } from '@/lib/store';
import { DEFAULT_AVATARS } from '@/lib/constants';
import { fetchWithTimeout } from '@/lib/fetch';

const BACKEND_URL =
  process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

type TabKey = 'PENDING' | 'APPROVED' | 'REJECTED';

interface TestimonyItem {
  id: string;
  text: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  user: { id: string; nickname: string; avatarId: string };
}

function getAvatarEmoji(avatarId: string): string {
  const found = DEFAULT_AVATARS.find((a) => a.id === avatarId);
  return found?.emoji ?? '🙏';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
}

function TabButton({
  label,
  icon,
  count,
  active,
  color,
  onPress,
  colors,
}: {
  label: string;
  icon: React.ReactNode;
  count: number;
  active: boolean;
  color: string;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderBottomWidth: 2.5,
        borderBottomColor: active ? color : 'transparent',
        gap: 3,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        {icon}
        <Text
          style={{
            fontSize: 12,
            fontWeight: active ? '800' : '500',
            color: active ? color : colors.textMuted,
            letterSpacing: 0.2,
          }}
        >
          {label}
        </Text>
      </View>
      {count > 0 && (
        <View
          style={{
            backgroundColor: active ? color + '25' : colors.textMuted + '15',
            paddingHorizontal: 7,
            paddingVertical: 2,
            borderRadius: 20,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: active ? color : colors.textMuted,
            }}
          >
            {count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function PendingCard({
  item,
  reviewing,
  onApprove,
  onReject,
  colors,
  index,
}: {
  item: TestimonyItem;
  reviewing: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  colors: ReturnType<typeof useThemeColors>;
  index: number;
}) {
  const isBusy = reviewing === item.id;

  return (
    <Animated.View
      entering={FadeInDown.duration(250).delay(index * 50)}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.textMuted + '18',
        overflow: 'hidden',
      }}
    >
      {/* Accent stripe */}
      <View style={{ height: 3, backgroundColor: '#F59E0B' }} />

      <View style={{ padding: 14, gap: 10 }}>
        {/* User row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: '#F59E0B' + '18',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 20 }}>{getAvatarEmoji(item.user.avatarId)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
              {item.user.nickname}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Clock size={10} color={colors.textMuted} />
              <Text style={{ fontSize: 11, color: colors.textMuted }}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>
          <View
            style={{
              backgroundColor: '#F59E0B' + '20',
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 20,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#F59E0B' }}>Pendiente</Text>
          </View>
        </View>

        {/* Testimony text */}
        <View
          style={{
            backgroundColor: colors.background,
            borderRadius: 10,
            padding: 12,
            borderLeftWidth: 3,
            borderLeftColor: '#F59E0B' + '60',
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: colors.text,
              lineHeight: 20,
              fontStyle: 'italic',
            }}
          >
            "{item.text}"
          </Text>
        </View>

        {/* Action buttons */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
          <Pressable
            onPress={() => onReject(item.id)}
            disabled={isBusy}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 11,
              borderRadius: 11,
              backgroundColor: isBusy ? '#EF444410' : '#EF444415',
              borderWidth: 1,
              borderColor: '#EF444430',
            }}
          >
            {isBusy ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <>
                <X size={14} color="#EF4444" strokeWidth={2.5} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#EF4444' }}>
                  Rechazar
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={() => onApprove(item.id)}
            disabled={isBusy}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 11,
              borderRadius: 11,
              backgroundColor: isBusy ? '#22C55E10' : '#22C55E18',
              borderWidth: 1,
              borderColor: '#22C55E35',
            }}
          >
            {isBusy ? (
              <ActivityIndicator size="small" color="#22C55E" />
            ) : (
              <>
                <Check size={14} color="#22C55E" strokeWidth={2.5} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#22C55E' }}>
                  Aprobar
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

function ReviewedCard({
  item,
  deleting,
  onDelete,
  colors,
  index,
  accentColor,
}: {
  item: TestimonyItem;
  deleting: string | null;
  onDelete: (id: string) => void;
  colors: ReturnType<typeof useThemeColors>;
  index: number;
  accentColor: string;
}) {
  const isBusy = deleting === item.id;

  return (
    <Animated.View
      entering={FadeInDown.duration(250).delay(index * 50)}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.textMuted + '15',
        overflow: 'hidden',
      }}
    >
      {/* Accent stripe */}
      <View style={{ height: 3, backgroundColor: accentColor }} />

      <View style={{ padding: 14, gap: 10 }}>
        {/* User + delete row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              backgroundColor: accentColor + '18',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 19 }}>{getAvatarEmoji(item.user.avatarId)}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
              {item.user.nickname}
            </Text>
            {item.reviewedAt && (
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
                Revisado {formatDate(item.reviewedAt)}
              </Text>
            )}
          </View>

          <Pressable
            onPress={() => onDelete(item.id)}
            disabled={isBusy}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              backgroundColor: '#EF444412',
              borderWidth: 1,
              borderColor: '#EF444428',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isBusy ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Trash2 size={14} color="#EF4444" />
            )}
          </Pressable>
        </View>

        {/* Testimony text */}
        <View
          style={{
            backgroundColor: colors.background,
            borderRadius: 10,
            padding: 12,
            borderLeftWidth: 3,
            borderLeftColor: accentColor + '50',
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: colors.text,
              lineHeight: 19,
              fontStyle: 'italic',
              opacity: 0.85,
            }}
          >
            "{item.text}"
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

function EmptyState({
  tab,
  colors,
}: {
  tab: TabKey;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const config = {
    PENDING: {
      icon: <Clock size={44} color={colors.textMuted + '50'} />,
      title: 'Sin testimonios pendientes',
      subtitle: 'Cuando los usuarios envíen testimonios aparecerán aquí',
    },
    APPROVED: {
      icon: <CheckCircle size={44} color={colors.textMuted + '50'} />,
      title: 'No hay testimonios aprobados',
      subtitle: 'Los testimonios que apruebes aparecerán aquí',
    },
    REJECTED: {
      icon: <XCircle size={44} color={colors.textMuted + '50'} />,
      title: 'No hay testimonios rechazados',
      subtitle: 'Los testimonios rechazados quedan registrados aquí',
    },
  }[tab];

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={{ alignItems: 'center', marginTop: 64, paddingHorizontal: 32 }}
    >
      {config.icon}
      <Text
        style={{
          fontSize: 16,
          fontWeight: '700',
          color: colors.text,
          marginTop: 14,
          textAlign: 'center',
        }}
      >
        {config.title}
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: colors.textMuted,
          marginTop: 6,
          textAlign: 'center',
          lineHeight: 18,
        }}
      >
        {config.subtitle}
      </Text>
    </Animated.View>
  );
}

export default function AdminTestimoniesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const user = useUser();
  const userId = user?.id ?? '';

  const [activeTab, setActiveTab] = useState<TabKey>('PENDING');
  const [testimonies, setTestimonies] = useState<Record<TabKey, TestimonyItem[]>>({
    PENDING: [],
    APPROVED: [],
    REJECTED: [],
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const isAuthorized =
    user?.role === 'MODERATOR' || user?.role === 'OWNER';

  const fetchTab = useCallback(
    async (tab: TabKey, silent = false) => {
      if (!userId) return;
      if (!silent) setLoading(true);
      try {
        const res = await fetchWithTimeout(
          `${BACKEND_URL}/api/testimonies/admin/all?status=${tab}`,
          { headers: { 'x-user-id': userId } }
        );
        if (res.status === 403) {
          Alert.alert('Sin acceso', 'No tienes permisos para ver esta sección.');
          router.back();
          return;
        }
        const data = (await res.json()) as { testimonies: TestimonyItem[] };
        setTestimonies((prev) => ({ ...prev, [tab]: data.testimonies ?? [] }));
      } catch {
        if (!silent) Alert.alert('Error', 'No se pudo cargar los testimonios.');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [userId, router]
  );

  useEffect(() => {
    if (isAuthorized) {
      fetchTab(activeTab);
    }
  }, [activeTab, isAuthorized, fetchTab]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTab(activeTab, true);
    setRefreshing(false);
  }, [activeTab, fetchTab]);

  const handleTabPress = (tab: TabKey) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  };

  const handleApprove = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setReviewing(id);
    try {
      const res = await fetchWithTimeout(
        `${BACKEND_URL}/api/testimonies/admin/${id}/review`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
          body: JSON.stringify({ status: 'APPROVED' }),
        }
      );
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        Alert.alert('Error', data.error ?? 'No se pudo aprobar.');
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Remove from pending list
      setTestimonies((prev) => ({
        ...prev,
        PENDING: prev.PENDING.filter((t) => t.id !== id),
        // Reset approved so next visit refetches fresh
        APPROVED: [],
      }));
    } catch {
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
    } finally {
      setReviewing(null);
    }
  };

  const handleReject = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setReviewing(id);
    try {
      const res = await fetchWithTimeout(
        `${BACKEND_URL}/api/testimonies/admin/${id}/review`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
          body: JSON.stringify({ status: 'REJECTED' }),
        }
      );
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        Alert.alert('Error', data.error ?? 'No se pudo rechazar.');
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTestimonies((prev) => ({
        ...prev,
        PENDING: prev.PENDING.filter((t) => t.id !== id),
        REJECTED: [],
      }));
    } catch {
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
    } finally {
      setReviewing(null);
    }
  };

  const handleDelete = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Eliminar testimonio',
      'Esta accion es permanente y no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeleting(id);
            try {
              const res = await fetchWithTimeout(
                `${BACKEND_URL}/api/testimonies/admin/${id}`,
                {
                  method: 'DELETE',
                  headers: { 'x-user-id': userId },
                }
              );
              if (!res.ok) {
                const data = (await res.json()) as { error?: string };
                Alert.alert('Error', data.error ?? 'No se pudo eliminar.');
                return;
              }
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setTestimonies((prev) => ({
                ...prev,
                [activeTab]: prev[activeTab].filter((t) => t.id !== id),
              }));
            } catch {
              Alert.alert('Error', 'No se pudo conectar con el servidor.');
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  };

  // Access guard
  if (!isAuthorized) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <XCircle size={52} color="#EF4444" />
        <Text
          style={{
            fontSize: 20,
            fontWeight: '800',
            color: colors.text,
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          Acceso denegado
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.textMuted,
            marginTop: 8,
            textAlign: 'center',
            lineHeight: 20,
          }}
        >
          Solo moderadores y administradores pueden gestionar testimonios.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 28,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: colors.primary,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF' }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const currentList = testimonies[activeTab];
  const pendingCount = testimonies.PENDING.length;
  const approvedCount = testimonies.APPROVED.length;
  const rejectedCount = testimonies.REJECTED.length;

  const tabColor = activeTab === 'PENDING'
    ? '#F59E0B'
    : activeTab === 'APPROVED'
    ? '#22C55E'
    : '#EF4444';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 12,
          paddingHorizontal: 16,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.textMuted + '15',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: colors.background,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={18} color={colors.text} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <MessageSquareHeart size={17} color={colors.primary} />
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '800',
                  color: colors.text,
                  letterSpacing: -0.3,
                }}
              >
                Testimonios
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
              {pendingCount > 0
                ? `${pendingCount} pendiente${pendingCount !== 1 ? 's' : ''} de revision`
                : 'Moderacion de testimonios'}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View
          style={{
            flexDirection: 'row',
            marginTop: 14,
            borderTopWidth: 1,
            borderTopColor: colors.background,
          }}
        >
          <TabButton
            label="Pendientes"
            icon={<Clock size={12} color={activeTab === 'PENDING' ? '#F59E0B' : colors.textMuted} />}
            count={pendingCount}
            active={activeTab === 'PENDING'}
            color="#F59E0B"
            onPress={() => handleTabPress('PENDING')}
            colors={colors}
          />
          <TabButton
            label="Aprobados"
            icon={<CheckCircle size={12} color={activeTab === 'APPROVED' ? '#22C55E' : colors.textMuted} />}
            count={approvedCount}
            active={activeTab === 'APPROVED'}
            color="#22C55E"
            onPress={() => handleTabPress('APPROVED')}
            colors={colors}
          />
          <TabButton
            label="Rechazados"
            icon={<XCircle size={12} color={activeTab === 'REJECTED' ? '#EF4444' : colors.textMuted} />}
            count={rejectedCount}
            active={activeTab === 'REJECTED'}
            color="#EF4444"
            onPress={() => handleTabPress('REJECTED')}
            colors={colors}
          />
        </View>
      </View>

      {/* Content */}
      {loading && currentList.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={tabColor} />
          <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 10 }}>
            Cargando testimonios...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 40,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={tabColor}
              colors={[tabColor]}
            />
          }
        >
          {/* Active tab label */}
          {currentList.length > 0 && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                marginBottom: 14,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: tabColor,
                }}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: colors.textMuted,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                {activeTab === 'PENDING'
                  ? `${currentList.length} para revisar`
                  : activeTab === 'APPROVED'
                  ? `${currentList.length} aprobado${currentList.length !== 1 ? 's' : ''}`
                  : `${currentList.length} rechazado${currentList.length !== 1 ? 's' : ''}`}
              </Text>
            </Animated.View>
          )}

          {currentList.length === 0 ? (
            <EmptyState tab={activeTab} colors={colors} />
          ) : activeTab === 'PENDING' ? (
            currentList.map((item, i) => (
              <PendingCard
                key={item.id}
                item={item}
                reviewing={reviewing}
                onApprove={handleApprove}
                onReject={handleReject}
                colors={colors}
                index={i}
              />
            ))
          ) : (
            currentList.map((item, i) => (
              <ReviewedCard
                key={item.id}
                item={item}
                deleting={deleting}
                onDelete={handleDelete}
                colors={colors}
                index={i}
                accentColor={activeTab === 'APPROVED' ? '#22C55E' : '#EF4444'}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
