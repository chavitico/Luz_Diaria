// Admin: Manage Moderators Screen
// Access: OWNER only — tap "Moderadores" in Settings footer

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Search, Shield, ShieldOff, Users, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useThemeColors, useUser } from '@/lib/store';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

interface AdminUser {
  id: string;
  nickname: string;
  role: string;
  avatarId: string;
  createdAt: string;
}

interface ConfirmModal {
  visible: boolean;
  user: AdminUser | null;
  targetRole: 'USER' | 'MODERATOR';
}

export default function AdminModeratorsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const currentUser = useUser();
  const userId = currentUser?.id ?? '';

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmModal>({ visible: false, user: null, targetRole: 'MODERATOR' });
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (q: string) => {
    if (!userId) return;
    setLoading(true);
    try {
      const params = q.trim() ? `?search=${encodeURIComponent(q.trim())}` : '';
      const res = await fetch(`${BACKEND_URL}/api/admin/users${params}`, {
        headers: { 'X-User-Id': userId },
      });
      if (res.status === 403) {
        Alert.alert('No autorizado', 'Solo el propietario puede gestionar moderadores.');
        router.back();
        return;
      }
      const data = await res.json() as { users: AdminUser[] };
      setUsers(data.users ?? []);
    } catch {
      Alert.alert('Error', 'No se pudo cargar la lista de usuarios.');
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }, [userId]);

  // Load on mount
  React.useEffect(() => {
    fetchUsers('');
  }, [fetchUsers]);

  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchUsers(text), 400);
  };

  const requestToggle = (user: AdminUser) => {
    if (user.role === 'OWNER') return; // cannot touch OWNER
    const targetRole = user.role === 'MODERATOR' ? 'USER' : 'MODERATOR';
    setConfirm({ visible: true, user, targetRole });
  };

  const executeToggle = async () => {
    const { user, targetRole } = confirm;
    if (!user) return;

    setConfirm(c => ({ ...c, visible: false }));
    setTogglingId(user.id);

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({ role: targetRole }),
      });

      const data = await res.json() as { success?: boolean; error?: string; user?: AdminUser };

      if (!res.ok || !data.success) {
        Alert.alert('Error', data.error ?? 'No se pudo cambiar el rol.');
        return;
      }

      // Update local list
      setUsers(prev =>
        prev.map(u => (u.id === user.id ? { ...u, role: targetRole } : u))
      );
    } catch {
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
    } finally {
      setTogglingId(null);
    }
  };

  const renderItem = ({ item, index }: { item: AdminUser; index: number }) => {
    const isMod = item.role === 'MODERATOR';
    const isOwner = item.role === 'OWNER';
    const isToggling = togglingId === item.id;
    const isSelf = item.id === userId;

    return (
      <Animated.View entering={FadeInDown.delay(index * 30).duration(250)}>
        <Pressable
          onPress={() => !isSelf && !isOwner && requestToggle(item)}
          disabled={isToggling || isSelf || isOwner}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: pressed ? colors.surface + 'CC' : colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.textMuted + '15',
            opacity: isOwner ? 0.6 : 1,
          })}
        >
          {/* Avatar placeholder */}
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isMod ? colors.primary + '25' : colors.textMuted + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 18 }}>
              {isMod ? '🛡️' : isOwner ? '👑' : '👤'}
            </Text>
          </View>

          {/* Name + role */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: colors.text,
                }}
                numberOfLines={1}
              >
                {item.nickname}
              </Text>
              {isSelf && (
                <Text style={{ fontSize: 11, color: colors.textMuted + '80', fontWeight: '500' }}>
                  (tú)
                </Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <View
                style={{
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 6,
                  backgroundColor: isOwner
                    ? '#F59E0B20'
                    : isMod
                    ? colors.primary + '20'
                    : colors.textMuted + '15',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: isOwner ? '#F59E0B' : isMod ? colors.primary : colors.textMuted,
                  }}
                >
                  {isOwner ? 'OWNER' : isMod ? 'MODERATOR' : 'USUARIO'}
                </Text>
              </View>
            </View>
          </View>

          {/* Toggle or loader */}
          {isToggling ? (
            <ActivityIndicator color={colors.primary} size="small" style={{ marginLeft: 8 }} />
          ) : !isOwner && !isSelf ? (
            <View
              style={{
                width: 48,
                height: 26,
                borderRadius: 13,
                backgroundColor: isMod ? colors.primary : colors.textMuted + '40',
                justifyContent: 'center',
                paddingHorizontal: 3,
                alignItems: isMod ? 'flex-end' : 'flex-start',
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              />
            </View>
          ) : null}
        </Pressable>
      </Animated.View>
    );
  };

  const moderatorCount = users.filter(u => u.role === 'MODERATOR').length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 12,
          paddingHorizontal: 20,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.textMuted + '20',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Shield size={22} color={colors.primary} />
          <View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
              Moderadores
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>
              {moderatorCount} activo{moderatorCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: colors.textMuted + '15',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Info banner */}
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={{
          marginHorizontal: 16,
          marginTop: 12,
          marginBottom: 8,
          padding: 12,
          borderRadius: 12,
          backgroundColor: colors.primary + '12',
          borderWidth: 1,
          borderColor: colors.primary + '30',
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        <ShieldOff size={16} color={colors.primary} style={{ marginTop: 1 }} />
        <Text style={{ flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 18 }}>
          Los <Text style={{ fontWeight: '700', color: colors.text }}>MODERADORES</Text> pueden
          ver tickets de soporte. No tienen acceso a Branding ni Drops.
        </Text>
      </Animated.View>

      {/* Search bar */}
      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.textMuted + '20',
          paddingHorizontal: 12,
          height: 42,
          gap: 8,
        }}
      >
        <Search size={16} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={handleSearchChange}
          placeholder="Buscar por nickname…"
          placeholderTextColor={colors.textMuted + '70'}
          style={{ flex: 1, fontSize: 14, color: colors.text }}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        {loading && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      {/* List */}
      {!initialLoaded ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : users.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <Users size={48} color={colors.textMuted + '40'} />
          <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14, textAlign: 'center' }}>
            {search ? 'No se encontraron usuarios con ese nickname.' : 'No hay usuarios todavía.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={u => u.id}
          renderItem={renderItem}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Confirmation Modal */}
      <Modal
        visible={confirm.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirm(c => ({ ...c, visible: false }))}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }}
          onPress={() => setConfirm(c => ({ ...c, visible: false }))}
        >
          <Animated.View
            entering={FadeIn.duration(200)}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 24,
              width: '100%',
              maxWidth: 360,
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              {confirm.targetRole === 'MODERATOR' ? (
                <Shield size={40} color={colors.primary} />
              ) : (
                <ShieldOff size={40} color="#EF4444" />
              )}
            </View>

            <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 10 }}>
              {confirm.targetRole === 'MODERATOR'
                ? 'Otorgar MODERATOR'
                : 'Revocar MODERATOR'}
            </Text>

            <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
              {confirm.targetRole === 'MODERATOR'
                ? `¿Deseas otorgar permisos de MODERATOR a ${confirm.user?.nickname}? Podrá ver y gestionar tickets de soporte.`
                : `¿Deseas revocar los permisos de ${confirm.user?.nickname}? Volverá a ser un usuario normal.`}
            </Text>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => setConfirm(c => ({ ...c, visible: false }))}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: colors.textMuted + '20',
                }}
              >
                <Text style={{ color: colors.textMuted, fontWeight: '600', fontSize: 15 }}>
                  Cancelar
                </Text>
              </Pressable>
              <Pressable
                onPress={executeToggle}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: confirm.targetRole === 'MODERATOR' ? colors.primary : '#EF4444',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
                  {confirm.targetRole === 'MODERATOR' ? 'Otorgar' : 'Revocar'}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}
