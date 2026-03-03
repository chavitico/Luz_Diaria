// Admin Users Screen — full user management table
// Replaces the old Moderators screen; accessible from Admin Hub

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Clipboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import {
  X,
  Search,
  Shield,
  ShieldOff,
  Users,
  Copy,
  Check,
  Flame,
  BookOpen,
  Coins,
  Wrench,
  Gift,
  Filter,
  Clock,
  TriangleAlert,
  Crown,
  Pencil,
  Plus,
  Save,
  RotateCcw,
} from 'lucide-react-native';
import { useThemeColors, useUser } from '@/lib/store';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';
const IS_DEV = process.env.EXPO_PUBLIC_APP_ENV === 'development' || __DEV__;

// ─── Types ────────────────────────────────────────────────────────────────────
interface BadgeInfo {
  id: string;
  nameEs: string;
  nameEn: string;
  unknown: boolean;
}

interface BadgeCatalogItem {
  id: string;
  code: string;
  displayNameEs: string;
  displayNameEn: string;
  rarity: string;
}

interface DetailBadge {
  id: string;
  code: string;
  displayNameEs: string;
  displayNameEn: string;
  unknown: boolean;
}

interface AdminUserDetail {
  id: string;
  nickname: string;
  role: string;
  countryCode: string | null;
  streakCurrent: number;
  streakBest: number;
  devotionalsCompleted: number;
  completionsLast7Days: number;
  points: number;
  lastActiveAt: string | null;
  activeBadgeId: string | null;
  badges: DetailBadge[];
  createdAt: string;
}

interface AdminUserRow {
  id: string;
  nickname: string;
  role: string;
  countryCode: string | null;
  streakCurrent: number;
  streakBest: number;
  devotionalsCompleted: number;
  completionsLast7Days: number;
  points: number;
  lastActiveAt: string | null;
  activeBadgeId: string | null;
  badges: BadgeInfo[];
  hasIssues: boolean;
  createdAt: string;
}

interface StoreItemSimple {
  id: string;
  nameEs: string;
  nameEn: string;
  type: string;
  rarity: string;
  pricePoints: number;
}

type RoleFilter = '' | 'USER' | 'MODERATOR' | 'OWNER';

// ─── Rarity colours ───────────────────────────────────────────────────────────
const RARITY_COLOR: Record<string, string> = {
  unique: '#F59E0B',
  epic:   '#8B5CF6',
  rare:   '#3B82F6',
  common: '#6B7280',
};

// ─── Role chip ────────────────────────────────────────────────────────────────
function RoleChip({ role }: { role: string }) {
  const color =
    role === 'OWNER'     ? '#F59E0B' :
    role === 'MODERATOR' ? '#3B82F6' :
                           '#6B7280';
  const label =
    role === 'OWNER'     ? 'Owner' :
    role === 'MODERATOR' ? 'Mod' :
                           'User';
  return (
    <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: color + '20' }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color, letterSpacing: 0.4 }}>{label}</Text>
    </View>
  );
}

// ─── Country flag helper ──────────────────────────────────────────────────────
function countryFlag(code: string): string {
  return code.toUpperCase().split('').map(c => String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))).join('');
}

// ─── Compact user card ────────────────────────────────────────────────────────
function UserCard({
  user, isOwner, currentUserId,
  onToggleMod, onViewDetail, onCompensate, onFixBadges, togglingId, colors,
}: {
  user: AdminUserRow;
  isOwner: boolean;
  currentUserId: string;
  onToggleMod: (u: AdminUserRow) => void;
  onViewDetail: (u: AdminUserRow) => void;
  onCompensate: (u: AdminUserRow) => void;
  onFixBadges: (u: AdminUserRow) => void;
  togglingId: string | null;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const [copied, setCopied] = useState(false);
  const isSelf  = user.id === currentUserId;
  const shortId = user.id.slice(-8);

  const handleCopy = () => {
    Clipboard.setString(user.id);
    setCopied(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setCopied(false), 1500);
  };

  const visibleBadges = user.badges.slice(0, 2);
  const extraBadges   = user.badges.length - 2;

  const lastActive = user.lastActiveAt
    ? (() => {
        const diff = Date.now() - new Date(user.lastActiveAt).getTime();
        const days = Math.floor(diff / 86400000);
        if (days === 0) return 'Hoy';
        if (days === 1) return 'Ayer';
        return `Hace ${days}d`;
      })()
    : '—';

  return (
    <Animated.View entering={FadeInDown.duration(220)}>
      <View style={{
        marginHorizontal: 12, marginBottom: 8, borderRadius: 16,
        backgroundColor: colors.surface,
        borderWidth: user.hasIssues ? 1 : 0,
        borderColor: user.hasIssues ? '#F59E0B50' : 'transparent',
        overflow: 'hidden',
      }}>
        <Pressable onPress={() => onViewDetail(user)} style={{ padding: 12, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <View style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: user.role === 'OWNER' ? '#F59E0B18' : user.role === 'MODERATOR' ? '#3B82F618' : colors.background,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 18 }}>
                {user.role === 'OWNER' ? '👑' : user.role === 'MODERATOR' ? '🛡️' : '👤'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }} numberOfLines={1}>{user.nickname}</Text>
                {isSelf && <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '500' }}>(tú)</Text>}
                {user.hasIssues && <TriangleAlert size={13} color="#F59E0B" />}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Text style={{ fontSize: 11, color: colors.textMuted, fontFamily: 'monospace' }}>…{shortId}</Text>
                <Pressable onPress={handleCopy} hitSlop={6}>
                  {copied ? <Check size={11} color="#22C55E" /> : <Copy size={11} color={colors.textMuted + '90'} />}
                </Pressable>
              </View>
            </View>
            <RoleChip role={user.role} />
          </View>

          <View style={{ flexDirection: 'row', gap: 14, marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Flame size={12} color="#F97316" />
              <Text style={{ fontSize: 12, color: colors.text, fontWeight: '600' }}>{user.streakCurrent}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <BookOpen size={12} color="#6366F1" />
              <Text style={{ fontSize: 12, color: colors.text, fontWeight: '600' }}>{user.devotionalsCompleted}</Text>
              {user.completionsLast7Days > 0 && (
                <Text style={{ fontSize: 10, color: '#22C55E' }}>(+{user.completionsLast7Days} 7d)</Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Coins size={12} color="#F59E0B" />
              <Text style={{ fontSize: 12, color: colors.text, fontWeight: '600' }}>
                {user.points >= 1000 ? `${(user.points / 1000).toFixed(1)}k` : user.points}
              </Text>
            </View>
            {user.countryCode && <Text style={{ fontSize: 12 }}>{countryFlag(user.countryCode)}</Text>}
            <View style={{ flex: 1, alignItems: 'flex-end', flexDirection: 'row', gap: 3, justifyContent: 'flex-end' }}>
              <Clock size={11} color={colors.textMuted} />
              <Text style={{ fontSize: 11, color: colors.textMuted }}>{lastActive}</Text>
            </View>
          </View>

          {user.badges.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {visibleBadges.map(b => (
                <View key={b.id} style={{
                  paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
                  backgroundColor: b.unknown ? '#F59E0B18' : colors.background,
                  borderWidth: b.unknown ? 1 : 0, borderColor: b.unknown ? '#F59E0B60' : 'transparent',
                }}>
                  <Text style={{ fontSize: 10, color: b.unknown ? '#F59E0B' : colors.textMuted, fontWeight: '500' }}>
                    {b.unknown ? `⚠ ${b.nameEs}` : b.nameEs}
                  </Text>
                </View>
              ))}
              {extraBadges > 0 && (
                <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: colors.background }}>
                  <Text style={{ fontSize: 10, color: colors.textMuted }}>+{extraBadges}</Text>
                </View>
              )}
            </View>
          )}
        </Pressable>

        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.background }}>
          {isOwner && !isSelf && user.role !== 'OWNER' && (
            <Pressable
              onPress={() => onToggleMod(user)}
              disabled={togglingId === user.id}
              style={({ pressed }) => ({
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 4, paddingVertical: 9,
                backgroundColor: pressed ? (user.role === 'MODERATOR' ? '#EF444410' : '#3B82F610') : 'transparent',
                borderRightWidth: 1, borderRightColor: colors.background,
              })}
            >
              {togglingId === user.id
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <>
                    {user.role === 'MODERATOR' ? <ShieldOff size={14} color="#EF4444" /> : <Shield size={14} color="#3B82F6" />}
                    <Text style={{ fontSize: 11, fontWeight: '600', color: user.role === 'MODERATOR' ? '#EF4444' : '#3B82F6' }}>
                      {user.role === 'MODERATOR' ? 'Quitar Mod' : 'Hacer Mod'}
                    </Text>
                  </>}
            </Pressable>
          )}
          {isOwner && (
            <Pressable
              onPress={() => onCompensate(user)}
              style={({ pressed }) => ({
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 4, paddingVertical: 9,
                backgroundColor: pressed ? '#8B5CF610' : 'transparent',
                borderRightWidth: 1, borderRightColor: colors.background,
              })}
            >
              <Gift size={14} color="#8B5CF6" />
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#8B5CF6' }}>Compensar</Text>
            </Pressable>
          )}
          {isOwner && user.hasIssues && (
            <Pressable
              onPress={() => onFixBadges(user)}
              style={({ pressed }) => ({
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 4, paddingVertical: 9,
                backgroundColor: pressed ? '#F59E0B10' : 'transparent',
                borderRightWidth: 1, borderRightColor: colors.background,
              })}
            >
              <Wrench size={14} color="#F59E0B" />
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#F59E0B' }}>Fix Badges</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => onViewDetail(user)}
            style={({ pressed }) => ({
              flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 4, paddingVertical: 9,
              backgroundColor: pressed ? colors.primary + '10' : 'transparent',
            })}
          >
            <Users size={14} color={colors.primary} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.primary }}>Ver</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── User Detail / Edit Modal ─────────────────────────────────────────────────
function UserDetailModal({
  userId,
  onClose,
  amOwner,
  myId,
  colors,
  insets,
  onRefreshList,
}: {
  userId: string | null;
  onClose: () => void;
  amOwner: boolean;
  myId: string;
  colors: ReturnType<typeof useThemeColors>;
  insets: ReturnType<typeof useSafeAreaInsets>;
  onRefreshList: () => void;
}) {
  const [detail,       setDetail]       = useState<AdminUserDetail | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [editMode,     setEditMode]     = useState(false);
  const [saving,       setSaving]       = useState(false);

  // Edit form state
  const [editPoints,   setEditPoints]   = useState('');
  const [editCountry,  setEditCountry]  = useState('');
  const [editStreak,   setEditStreak]   = useState('');
  const [editRole,     setEditRole]     = useState<'USER' | 'MODERATOR' | ''>('');

  // Badge edit state
  const [editBadges,   setEditBadges]   = useState<DetailBadge[]>([]);
  const [badgeCatalog, setBadgeCatalog] = useState<BadgeCatalogItem[]>([]);
  const [badgeSearch,  setBadgeSearch]  = useState('');
  const [showBadgePicker, setShowBadgePicker] = useState(false);

  // Streak-decrease confirmation
  const [streakConfirmText, setStreakConfirmText] = useState('');
  const [showStreakConfirm, setShowStreakConfirm] = useState(false);
  const pendingSaveRef = useRef<(() => Promise<void>) | null>(null);

  // ── Fetch detail ────────────────────────────────────────────────────────────
  const fetchDetail = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}`, {
        headers: { 'X-User-Id': myId },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as AdminUserDetail;
      setDetail(data);
      // Reset edit form from fresh data
      setEditPoints(String(data.points));
      setEditCountry(data.countryCode ?? '');
      setEditStreak(String(data.streakCurrent));
      setEditRole('');
      setEditBadges(data.badges);
    } catch (e) {
      Alert.alert('Error', `No se pudo cargar el usuario. ${String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [userId, myId]);

  const fetchBadgeCatalog = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/badges`, { headers: { 'X-User-Id': myId } });
      if (res.ok) {
        const data = await res.json() as { badges: BadgeCatalogItem[] };
        setBadgeCatalog(data.badges ?? []);
      }
    } catch { /* non-critical */ }
  }, [myId]);

  useEffect(() => {
    if (userId) {
      setEditMode(false);
      setDetail(null);
      fetchDetail();
      fetchBadgeCatalog();
    }
  }, [userId, fetchDetail, fetchBadgeCatalog]);

  // ── Toggle edit mode ────────────────────────────────────────────────────────
  const handleToggleEdit = () => {
    if (editMode) {
      // Cancel — reset to current detail
      if (detail) {
        setEditPoints(String(detail.points));
        setEditCountry(detail.countryCode ?? '');
        setEditStreak(String(detail.streakCurrent));
        setEditRole('');
        setEditBadges(detail.badges);
      }
    }
    setEditMode(v => !v);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // ── Save changes ────────────────────────────────────────────────────────────
  const doSave = useCallback(async (force = false) => {
    if (!detail) return;
    setSaving(true);

    try {
      const newPoints  = parseInt(editPoints, 10);
      const newStreak  = parseInt(editStreak, 10);
      const newCountry = editCountry.trim().toUpperCase().slice(0, 2) || null;

      if (isNaN(newPoints) || newPoints < 0) {
        Alert.alert('Error', 'Puntos inválidos (debe ser ≥ 0).');
        return;
      }
      if (isNaN(newStreak) || newStreak < 0) {
        Alert.alert('Error', 'Racha inválida (debe ser ≥ 0).');
        return;
      }

      // Check streak decrease without force
      if (newStreak < detail.streakCurrent && !force) {
        pendingSaveRef.current = () => doSave(true);
        setStreakConfirmText('');
        setShowStreakConfirm(true);
        return;
      }

      // --- PATCH user fields ---
      const patchBody: Record<string, unknown> = {};
      if (newPoints  !== detail.points)        patchBody.points        = newPoints;
      if (newStreak  !== detail.streakCurrent) { patchBody.streakCurrent = newStreak; patchBody.forceStreakDecrease = force; }
      if (newCountry !== detail.countryCode)   patchBody.countryCode   = newCountry ?? '';
      if (editRole && editRole !== detail.role) patchBody.role         = editRole;

      if (Object.keys(patchBody).length > 0) {
        const res = await fetch(`${BACKEND_URL}/api/admin/users/${detail.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': myId },
          body: JSON.stringify(patchBody),
        });
        const data = await res.json() as { success?: boolean; error?: string };
        if (!res.ok || !data.success) {
          const msg = data.error ?? `HTTP ${res.status}`;
          Alert.alert('Error al guardar', msg);
          console.error('[AdminEdit] PATCH failed:', res.status, data);
          return;
        }
      }

      // --- Badge diff ---
      const originalIds = new Set(detail.badges.map(b => b.id));
      const newIds      = new Set(editBadges.map(b => b.id));
      const toAdd       = editBadges.filter(b => !originalIds.has(b.id)).map(b => b.id);
      const toRemove    = detail.badges.filter(b => !newIds.has(b.id)).map(b => b.id);

      if (toAdd.length > 0 || toRemove.length > 0) {
        const res = await fetch(`${BACKEND_URL}/api/admin/users/${detail.id}/badges`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': myId },
          body: JSON.stringify({ add: toAdd, remove: toRemove }),
        });
        const data = await res.json() as { success?: boolean; error?: string };
        if (!res.ok || !data.success) {
          const msg = data.error ?? `HTTP ${res.status}`;
          Alert.alert('Error con insignias', msg);
          console.error('[AdminEdit] badges PUT failed:', res.status, data);
          return;
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditMode(false);
      await fetchDetail();
      onRefreshList();
    } catch (e) {
      Alert.alert('Error', `Fallo inesperado: ${String(e)}`);
      console.error('[AdminEdit] save error:', e);
    } finally {
      setSaving(false);
    }
  }, [detail, editPoints, editStreak, editCountry, editRole, editBadges, myId, fetchDetail, onRefreshList]);

  // ── Badge picker helpers ────────────────────────────────────────────────────
  const filteredCatalog = badgeCatalog.filter(b => {
    const q = badgeSearch.toLowerCase();
    const already = editBadges.some(eb => eb.id === b.id);
    if (already) return false;
    return b.displayNameEs.toLowerCase().includes(q) || b.id.toLowerCase().includes(q);
  });

  const addBadge = (b: BadgeCatalogItem) => {
    setEditBadges(prev => [...prev, {
      id: b.id, code: b.code,
      displayNameEs: b.displayNameEs, displayNameEn: b.displayNameEn,
      unknown: false,
    }]);
    setShowBadgePicker(false);
    setBadgeSearch('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeBadge = (id: string) => {
    setEditBadges(prev => prev.filter(b => b.id !== id));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (!userId) return null;

  const isSelf = detail?.id === myId;

  return (
    <>
      <Modal visible={!!userId} transparent animationType="none" onRequestClose={onClose}>
        <Animated.View
          entering={FadeIn.duration(150)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
        >
          <Pressable style={{ flex: 1 }} onPress={editMode ? undefined : onClose} />

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Animated.View
              entering={SlideInDown.springify().damping(22).stiffness(200)}
              style={{
                backgroundColor: colors.background,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                height: '88%',
                maxHeight: 700,
              }}
            >
              {/* Handle */}
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.textMuted + '40', alignSelf: 'center', marginTop: 12 }} />

              {/* Header */}
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 10,
                paddingHorizontal: 20, paddingVertical: 14,
                borderBottomWidth: 1, borderBottomColor: colors.surface,
              }}>
                <View style={{ flex: 1 }}>
                  {loading || !detail ? (
                    <View style={{ width: 120, height: 18, borderRadius: 6, backgroundColor: colors.surface }} />
                  ) : (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                          {detail.nickname}
                        </Text>
                        <RoleChip role={detail.role} />
                        {IS_DEV && editMode && (
                          <View style={{ paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, backgroundColor: '#EF444420', borderWidth: 1, borderColor: '#EF4444' }}>
                            <Text style={{ fontSize: 9, fontWeight: '800', color: '#EF4444' }}>EDIT MODE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 11, color: colors.textMuted, fontFamily: 'monospace', marginTop: 1 }}>
                        {detail.id}
                      </Text>
                    </>
                  )}
                </View>

                {/* Edit toggle — OWNER only */}
                {amOwner && detail && (
                  <Pressable
                    onPress={handleToggleEdit}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 5,
                      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
                      backgroundColor: editMode ? '#EF444415' : colors.primary + '15',
                      borderWidth: 1, borderColor: editMode ? '#EF444440' : colors.primary + '40',
                    }}
                  >
                    {editMode
                      ? <><RotateCcw size={13} color="#EF4444" /><Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444' }}>Cancelar</Text></>
                      : <><Pencil size={13} color={colors.primary} /><Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>Editar</Text></>
                    }
                  </Pressable>
                )}

                <Pressable
                  onPress={onClose}
                  style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={16} color={colors.textMuted} />
                </Pressable>
              </View>

              {/* Content */}
              {loading || !detail ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator color={colors.primary} size="large" />
                </View>
              ) : (
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: insets.bottom + 32 }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* ── Stats section ── */}
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
                    Estadísticas
                  </Text>

                  <View style={{ backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
                    {/* Points */}
                    <FieldRow
                      label="Puntos"
                      editMode={editMode}
                      colors={colors}
                      readValue={detail.points.toLocaleString()}
                      input={
                        <TextInput
                          value={editPoints}
                          onChangeText={setEditPoints}
                          keyboardType="number-pad"
                          style={{ flex: 1, textAlign: 'right', fontSize: 14, color: colors.text, fontWeight: '600' }}
                        />
                      }
                    />
                    {/* Streak */}
                    <FieldRow
                      label="Racha actual"
                      editMode={editMode}
                      colors={colors}
                      readValue={`${detail.streakCurrent} días`}
                      input={
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <TextInput
                            value={editStreak}
                            onChangeText={setEditStreak}
                            keyboardType="number-pad"
                            style={{ flex: 1, textAlign: 'right', fontSize: 14, color: colors.text, fontWeight: '600' }}
                          />
                          <Text style={{ fontSize: 13, color: colors.textMuted }}>días</Text>
                        </View>
                      }
                    />
                    {/* Best streak — always read-only */}
                    <FieldRow label="Mejor racha" editMode={false} colors={colors} readValue={`${detail.streakBest} días`} input={null} />
                    {/* Country */}
                    <FieldRow
                      label="País (código)"
                      editMode={editMode}
                      colors={colors}
                      readValue={detail.countryCode ? `${countryFlag(detail.countryCode)} ${detail.countryCode}` : '—'}
                      input={
                        <TextInput
                          value={editCountry}
                          onChangeText={t => setEditCountry(t.toUpperCase().slice(0, 2))}
                          placeholder="CR"
                          maxLength={2}
                          autoCapitalize="characters"
                          style={{ flex: 1, textAlign: 'right', fontSize: 14, color: colors.text, fontWeight: '600' }}
                        />
                      }
                    />
                    {/* Role — only if OWNER editing non-self non-owner */}
                    {editMode && amOwner && !isSelf && detail.role !== 'OWNER' && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: colors.background }}>
                        <Text style={{ fontSize: 13, color: colors.textMuted }}>Rol</Text>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          {(['', 'USER', 'MODERATOR'] as const).map(r => (
                            <Pressable
                              key={r}
                              onPress={() => setEditRole(r as 'USER' | 'MODERATOR' | '')}
                              style={{
                                paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
                                backgroundColor: (editRole === r || (editRole === '' && detail.role === r)) ? colors.primary : colors.background,
                                borderWidth: 1, borderColor: (editRole === r || (editRole === '' && detail.role === r)) ? colors.primary : colors.textMuted + '30',
                              }}
                            >
                              <Text style={{ fontSize: 11, fontWeight: '700', color: (editRole === r || (editRole === '' && detail.role === r)) ? '#FFF' : colors.textMuted }}>
                                {r === '' ? detail.role : r}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}
                    {/* Read-only derived fields */}
                    <FieldRow label="Devocionales" editMode={false} colors={colors} readValue={`${detail.devotionalsCompleted} totales`} input={null} />
                    <FieldRow label="Últimos 7 días" editMode={false} colors={colors} readValue={`${detail.completionsLast7Days} devocionales`} input={null} />
                    <FieldRow label="Creado" editMode={false} colors={colors} readValue={new Date(detail.createdAt).toLocaleDateString('es')} input={null} />
                    <FieldRow label="Último activo" editMode={false} colors={colors}
                      readValue={detail.lastActiveAt ? new Date(detail.lastActiveAt).toLocaleDateString('es') : '—'} input={null} isLast />
                  </View>

                  {/* ── Badges section ── */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>
                      Insignias ({editBadges.length})
                    </Text>
                    {editMode && (
                      <Pressable
                        onPress={() => setShowBadgePicker(true)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: colors.primary + '18', borderWidth: 1, borderColor: colors.primary + '40' }}
                      >
                        <Plus size={13} color={colors.primary} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>Agregar insignia</Text>
                      </Pressable>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                    {editBadges.length === 0 && (
                      <Text style={{ fontSize: 13, color: colors.textMuted, fontStyle: 'italic' }}>Sin insignias</Text>
                    )}
                    {editBadges.map(b => {
                      const rarityColor = RARITY_COLOR[b.unknown ? 'common' : (badgeCatalog.find(c => c.id === b.id)?.rarity ?? 'common')] ?? '#6B7280';
                      return (
                        <View
                          key={b.id}
                          style={{
                            flexDirection: 'row', alignItems: 'center', gap: 5,
                            paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
                            backgroundColor: b.unknown ? '#F59E0B12' : rarityColor + '15',
                            borderWidth: 1, borderColor: b.unknown ? '#F59E0B50' : rarityColor + '40',
                          }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '600', color: b.unknown ? '#F59E0B' : rarityColor }}>
                            {b.unknown ? `⚠ ${b.displayNameEs}` : b.displayNameEs}
                          </Text>
                          {editMode && (
                            <Pressable onPress={() => removeBadge(b.id)} hitSlop={6}>
                              <X size={12} color={b.unknown ? '#F59E0B' : rarityColor} />
                            </Pressable>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {/* ── Save button ── */}
                  {editMode && (
                    <Pressable
                      onPress={() => doSave(false)}
                      disabled={saving}
                      style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                        gap: 8, paddingVertical: 15, borderRadius: 14,
                        backgroundColor: saving ? colors.textMuted + '40' : colors.primary,
                      }}
                    >
                      {saving
                        ? <ActivityIndicator size="small" color="#FFF" />
                        : <><Save size={16} color="#FFF" /><Text style={{ color: '#FFF', fontWeight: '800', fontSize: 15 }}>Guardar cambios</Text></>}
                    </Pressable>
                  )}
                </ScrollView>
              )}
            </Animated.View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>

      {/* ── Streak decrease confirmation ── */}
      <Modal visible={showStreakConfirm} transparent animationType="fade" onRequestClose={() => setShowStreakConfirm(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 }} onPress={() => setShowStreakConfirm(false)}>
          <Pressable onPress={e => e.stopPropagation()}>
            <Animated.View entering={FadeIn.duration(200)} style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 24 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#EF4444', marginBottom: 8 }}>⚠ Bajar racha</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 19, marginBottom: 16 }}>
                Estás bajando la racha de <Text style={{ fontWeight: '700', color: colors.text }}>{detail?.streakCurrent}</Text> a <Text style={{ fontWeight: '700', color: '#EF4444' }}>{editStreak}</Text> días.{'\n\n'}Escribe <Text style={{ fontWeight: '800', color: colors.text }}>CONFIRMAR</Text> para continuar.
              </Text>
              <TextInput
                value={streakConfirmText}
                onChangeText={setStreakConfirmText}
                placeholder="CONFIRMAR"
                autoCapitalize="characters"
                style={{ backgroundColor: colors.background, borderRadius: 10, padding: 12, fontSize: 15, color: colors.text, marginBottom: 16, letterSpacing: 1 }}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable onPress={() => setShowStreakConfirm(false)} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center' }}>
                  <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (streakConfirmText.trim() !== 'CONFIRMAR') {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                      return;
                    }
                    setShowStreakConfirm(false);
                    pendingSaveRef.current?.();
                  }}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: streakConfirmText.trim() === 'CONFIRMAR' ? '#EF4444' : colors.textMuted + '40', alignItems: 'center' }}
                >
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>Confirmar</Text>
                </Pressable>
              </View>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Badge picker ── */}
      <Modal visible={showBadgePicker} transparent animationType="none" onRequestClose={() => setShowBadgePicker(false)}>
        <Animated.View entering={FadeIn.duration(150)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowBadgePicker(false)} />
          <Animated.View
            entering={SlideInDown.springify().damping(22).stiffness(200)}
            style={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '60%', paddingBottom: insets.bottom + 16 }}
          >
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.textMuted + '40', alignSelf: 'center', marginTop: 12, marginBottom: 14 }} />
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text, paddingHorizontal: 20, marginBottom: 12 }}>Agregar insignia</Text>

            <View style={{ marginHorizontal: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 10, height: 38, gap: 6, borderWidth: 1, borderColor: colors.textMuted + '20' }}>
              <Search size={14} color={colors.textMuted} />
              <TextInput
                value={badgeSearch}
                onChangeText={setBadgeSearch}
                placeholder="Buscar insignia…"
                placeholderTextColor={colors.textMuted + '70'}
                style={{ flex: 1, fontSize: 13, color: colors.text }}
                autoFocus
              />
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
              {filteredCatalog.length === 0 && (
                <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 20 }}>
                  {badgeSearch ? 'No encontrado' : 'Todas las insignias ya asignadas'}
                </Text>
              )}
              {filteredCatalog.map(b => {
                const rc = RARITY_COLOR[b.rarity] ?? '#6B7280';
                return (
                  <Pressable
                    key={b.id}
                    onPress={() => addBadge(b)}
                    style={({ pressed }) => ({
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      paddingVertical: 11, paddingHorizontal: 12, borderRadius: 12, marginBottom: 6,
                      backgroundColor: pressed ? colors.surface : colors.surface + 'CC',
                      borderWidth: 1, borderColor: colors.textMuted + '15',
                    })}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{b.displayNameEs}</Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>{b.id}</Text>
                    </View>
                    <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: rc + '20' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: rc }}>{b.rarity}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}

// ─── FieldRow: read-only or editable row ──────────────────────────────────────
function FieldRow({ label, editMode, readValue, input, colors, isLast }: {
  label: string;
  editMode: boolean;
  readValue: string;
  input: React.ReactNode;
  colors: ReturnType<typeof useThemeColors>;
  isLast?: boolean;
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 12, paddingHorizontal: 14,
      borderTopWidth: 1, borderTopColor: colors.background,
    }}>
      <Text style={{ fontSize: 13, color: colors.textMuted, flex: 1 }}>{label}</Text>
      {editMode && input
        ? <View style={{ flex: 1, alignItems: 'flex-end' }}>{input}</View>
        : <Text style={{ fontSize: 13, color: colors.text, fontWeight: '600' }}>{readValue}</Text>}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AdminUsersScreen() {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const colors  = useThemeColors();
  const me      = useUser();
  const myId    = me?.id ?? '';
  const amOwner = me?.role === 'OWNER';

  const [users,         setUsers]         = useState<AdminUserRow[]>([]);
  const [storeItems,    setStoreItems]    = useState<StoreItemSimple[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [loaded,        setLoaded]        = useState(false);
  const [togglingId,    setTogglingId]    = useState<string | null>(null);

  const [search,        setSearch]        = useState('');
  const [roleFilter,    setRoleFilter]    = useState<RoleFilter>('');
  const [activeOnly,    setActiveOnly]    = useState(false);
  const [issuesOnly,    setIssuesOnly]    = useState(false);
  const [showFilters,   setShowFilters]   = useState(false);

  // Detail modal uses userId string (not the row object) so it fetches fresh
  const [detailUserId,   setDetailUserId]   = useState<string | null>(null);
  const [compensateUser, setCompensateUser] = useState<AdminUserRow | null>(null);
  const [confirmToggle,  setConfirmToggle]  = useState<{ user: AdminUserRow; target: 'USER' | 'MODERATOR' } | null>(null);

  const [compType,      setCompType]      = useState<'points' | 'item'>('points');
  const [compPoints,    setCompPoints]    = useState('');
  const [compItemId,    setCompItemId]    = useState('');
  const [compReason,    setCompReason]    = useState('');
  const [compLoading,   setCompLoading]   = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (q: string, opts?: { role?: RoleFilter; active?: boolean; issues?: boolean }) => {
    if (!myId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim())     params.set('search',     q.trim());
      if (opts?.role)   params.set('role',       opts.role);
      if (opts?.active) params.set('activeOnly', 'true');
      if (opts?.issues) params.set('hasIssues',  'true');
      const qs = params.toString();
      const res = await fetch(`${BACKEND_URL}/api/admin/users${qs ? '?' + qs : ''}`, { headers: { 'X-User-Id': myId } });
      if (res.status === 403) { Alert.alert('Sin acceso', 'No tienes permisos.'); router.back(); return; }
      const data = await res.json() as { users: AdminUserRow[] };
      setUsers(data.users ?? []);
    } catch {
      Alert.alert('Error', 'No se pudo cargar la lista de usuarios.');
    } finally { setLoading(false); setLoaded(true); }
  }, [myId, router]);

  const fetchStoreItems = useCallback(async () => {
    if (!myId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/store-items`, { headers: { 'X-User-Id': myId } });
      if (res.ok) { const data = await res.json() as { items: StoreItemSimple[] }; setStoreItems(data.items ?? []); }
    } catch { /* non-critical */ }
  }, [myId]);

  useEffect(() => { fetchUsers(''); fetchStoreItems(); }, [fetchUsers, fetchStoreItems]);

  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchUsers(text, { role: roleFilter, active: activeOnly, issues: issuesOnly }), 350);
  };

  const applyFilters = (r: RoleFilter, a: boolean, i: boolean) => {
    setRoleFilter(r); setActiveOnly(a); setIssuesOnly(i);
    fetchUsers(search, { role: r, active: a, issues: i });
    setShowFilters(false);
  };

  // ── Role toggle ─────────────────────────────────────────────────────────────
  const handleToggleMod = (u: AdminUserRow) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConfirmToggle({ user: u, target: u.role === 'MODERATOR' ? 'USER' : 'MODERATOR' });
  };

  const executeToggle = async () => {
    if (!confirmToggle) return;
    const { user, target } = confirmToggle;
    setConfirmToggle(null);
    setTogglingId(user.id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': myId },
        body: JSON.stringify({ role: target }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) { Alert.alert('Error', data.error ?? 'No se pudo cambiar el rol.'); return; }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setUsers(prev => prev.map(u2 => u2.id === user.id ? { ...u2, role: target } : u2));
    } catch { Alert.alert('Error', 'No se pudo conectar con el servidor.'); }
    finally { setTogglingId(null); }
  };

  // ── Fix badges ──────────────────────────────────────────────────────────────
  const handleFixBadges = async (u: AdminUserRow) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${u.id}/fix-badges`, { method: 'POST', headers: { 'X-User-Id': myId } });
      const data = await res.json() as { success?: boolean; message?: string; error?: string };
      if (!res.ok || !data.success) { Alert.alert('Error', data.error ?? 'Fix badges falló.'); return; }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Fix Badges', data.message ?? 'Listo.');
      fetchUsers(search, { role: roleFilter, active: activeOnly, issues: issuesOnly });
    } catch { Alert.alert('Error', 'No se pudo conectar.'); }
  };

  // ── Compensate ──────────────────────────────────────────────────────────────
  const handleCompensateSubmit = async () => {
    if (!compensateUser) return;
    setCompLoading(true);
    try {
      const body: Record<string, unknown> = { type: compType, reason: compReason || undefined };
      if (compType === 'points') {
        const pts = parseInt(compPoints, 10);
        if (isNaN(pts) || pts < 1) { Alert.alert('Error', 'Cantidad inválida.'); return; }
        body.points = pts;
      } else {
        if (!compItemId) { Alert.alert('Error', 'Selecciona un ítem.'); return; }
        body.itemId = compItemId;
      }
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${compensateUser.id}/compensate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-Id': myId }, body: JSON.stringify(body),
      });
      const data = await res.json() as { success?: boolean; message?: string; error?: string };
      if (!res.ok || !data.success) { Alert.alert('Error', data.error ?? 'Compensación falló.'); return; }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Enviado', data.message ?? 'Listo.');
      setCompensateUser(null); setCompPoints(''); setCompItemId(''); setCompReason('');
      fetchUsers(search, { role: roleFilter, active: activeOnly, issues: issuesOnly });
    } catch { Alert.alert('Error', 'No se pudo conectar.'); }
    finally { setCompLoading(false); }
  };

  const activeFilterCount = [roleFilter !== '', activeOnly, issuesOnly].filter(Boolean).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>

      {/* Header */}
      <View style={{
        paddingTop: insets.top + 12, paddingBottom: 10, paddingHorizontal: 16,
        backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.textMuted + '18',
        flexDirection: 'row', alignItems: 'center', gap: 10,
      }}>
        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#3B82F618', alignItems: 'center', justifyContent: 'center' }}>
          <Users size={20} color="#3B82F6" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.3 }}>Usuarios</Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>
            {loaded ? `${users.length} encontrados` : 'Cargando…'}
          </Text>
        </View>
        <Pressable onPress={() => router.back()} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.textMuted + '15', alignItems: 'center', justifyContent: 'center' }}>
          <X size={17} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Search + filter */}
      <View style={{ paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 10, height: 40, gap: 6, borderWidth: 1, borderColor: colors.textMuted + '20' }}>
          <Search size={15} color={colors.textMuted} />
          <TextInput value={search} onChangeText={handleSearchChange} placeholder="Buscar nickname…" placeholderTextColor={colors.textMuted + '70'} style={{ flex: 1, fontSize: 14, color: colors.text }} autoCorrect={false} autoCapitalize="none" clearButtonMode="while-editing" />
          {loading && <ActivityIndicator size="small" color={colors.primary} />}
        </View>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowFilters(true); }}
          style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: activeFilterCount > 0 ? colors.primary : colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: activeFilterCount > 0 ? colors.primary : colors.textMuted + '20' }}
        >
          <Filter size={16} color={activeFilterCount > 0 ? '#FFF' : colors.textMuted} />
          {activeFilterCount > 0 && (
            <View style={{ position: 'absolute', top: -3, right: -3, width: 14, height: 14, borderRadius: 7, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: '#FFF' }}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Filter chips */}
      {activeFilterCount > 0 && (
        <View style={{ paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {roleFilter !== '' && (
            <Pressable onPress={() => applyFilters('', activeOnly, issuesOnly)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.primary + '20' }}>
              <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600' }}>{roleFilter}</Text>
              <X size={10} color={colors.primary} />
            </Pressable>
          )}
          {activeOnly && (
            <Pressable onPress={() => applyFilters(roleFilter, false, issuesOnly)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#22C55E20' }}>
              <Text style={{ fontSize: 11, color: '#22C55E', fontWeight: '600' }}>Activos 7d</Text>
              <X size={10} color="#22C55E" />
            </Pressable>
          )}
          {issuesOnly && (
            <Pressable onPress={() => applyFilters(roleFilter, activeOnly, false)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F59E0B20' }}>
              <Text style={{ fontSize: 11, color: '#F59E0B', fontWeight: '600' }}>Con problemas</Text>
              <X size={10} color="#F59E0B" />
            </Pressable>
          )}
        </View>
      )}

      {/* List */}
      {!loaded ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : users.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <Users size={48} color={colors.textMuted + '40'} />
          <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14, textAlign: 'center' }}>
            {search || activeFilterCount > 0 ? 'Sin resultados para estos filtros.' : 'No hay usuarios todavía.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={u => u.id}
          renderItem={({ item }) => (
            <UserCard
              user={item}
              isOwner={amOwner}
              currentUserId={myId}
              onToggleMod={handleToggleMod}
              onViewDetail={u => setDetailUserId(u.id)}
              onCompensate={u => { setCompensateUser(u); setCompType('points'); setCompPoints(''); setCompItemId(''); setCompReason(''); }}
              onFixBadges={handleFixBadges}
              togglingId={togglingId}
              colors={colors}
            />
          )}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── User Detail Modal (with edit mode) ── */}
      <UserDetailModal
        userId={detailUserId}
        onClose={() => setDetailUserId(null)}
        amOwner={amOwner}
        myId={myId}
        colors={colors}
        insets={insets}
        onRefreshList={() => fetchUsers(search, { role: roleFilter, active: activeOnly, issues: issuesOnly })}
      />

      {/* ── Filter Sheet ── */}
      <Modal visible={showFilters} transparent animationType="none" onRequestClose={() => setShowFilters(false)}>
        <Animated.View entering={FadeIn.duration(150)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowFilters(false)} />
          <Animated.View
            entering={SlideInDown.springify().damping(22).stiffness(200)}
            exiting={SlideOutDown.duration(200)}
            style={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
          >
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.textMuted + '40', alignSelf: 'center', marginTop: 12, marginBottom: 20 }} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 16 }}>Filtros</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Rol</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {(['', 'USER', 'MODERATOR', 'OWNER'] as RoleFilter[]).map(r => (
                <Pressable key={r} onPress={() => setRoleFilter(r)}
                  style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: roleFilter === r ? colors.primary : colors.surface, borderWidth: 1, borderColor: roleFilter === r ? colors.primary : colors.textMuted + '25' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: roleFilter === r ? '#FFF' : colors.textMuted }}>{r === '' ? 'Todos' : r}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ gap: 10, marginBottom: 24 }}>
              {[
                { label: 'Activos últimos 7 días', value: activeOnly, set: setActiveOnly, color: '#22C55E' },
                { label: 'Solo con problemas',     value: issuesOnly, set: setIssuesOnly, color: '#F59E0B' },
              ].map(f => (
                <Pressable key={f.label} onPress={() => f.set(!f.value)}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, backgroundColor: colors.surface }}>
                  <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>{f.label}</Text>
                  <View style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: f.value ? f.color : colors.textMuted + '30', justifyContent: 'center', paddingHorizontal: 2, alignItems: f.value ? 'flex-end' : 'flex-start' }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF' }} />
                  </View>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => applyFilters(roleFilter, activeOnly, issuesOnly)} style={{ paddingVertical: 14, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFF' }}>Aplicar filtros</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* ── Compensate Modal ── */}
      <Modal visible={!!compensateUser} transparent animationType="fade" onRequestClose={() => setCompensateUser(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 20 }} onPress={() => setCompensateUser(null)}>
          <Pressable onPress={e => e.stopPropagation()}>
            {compensateUser && (
              <Animated.View entering={FadeIn.duration(200)} style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 4 }}>Compensar a {compensateUser.nickname}</Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16 }}>Concede puntos o un ítem de la tienda.</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  {(['points', 'item'] as const).map(t => (
                    <Pressable key={t} onPress={() => setCompType(t)} style={{ flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', backgroundColor: compType === t ? colors.primary : colors.background, borderWidth: 1, borderColor: compType === t ? colors.primary : colors.textMuted + '25' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: compType === t ? '#FFF' : colors.textMuted }}>{t === 'points' ? 'Puntos' : 'Ítem'}</Text>
                    </Pressable>
                  ))}
                </View>
                {compType === 'points' ? (
                  <TextInput value={compPoints} onChangeText={setCompPoints} placeholder="Cantidad de puntos (ej: 500)" placeholderTextColor={colors.textMuted + '70'} keyboardType="number-pad" style={{ backgroundColor: colors.background, borderRadius: 10, padding: 12, fontSize: 15, color: colors.text, marginBottom: 12 }} />
                ) : (
                  <ScrollView style={{ maxHeight: 160, marginBottom: 12 }} nestedScrollEnabled>
                    {storeItems.map(item => (
                      <Pressable key={item.id} onPress={() => setCompItemId(item.id)}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, marginBottom: 4, backgroundColor: compItemId === item.id ? colors.primary + '18' : colors.background, borderWidth: 1, borderColor: compItemId === item.id ? colors.primary + '50' : 'transparent' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, color: colors.text, fontWeight: '500' }}>{item.nameEs}</Text>
                          <Text style={{ fontSize: 10, color: colors.textMuted }}>{item.type} · {item.rarity}</Text>
                        </View>
                        {compItemId === item.id && <Check size={14} color={colors.primary} />}
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
                <TextInput value={compReason} onChangeText={setCompReason} placeholder="Razón (opcional)" placeholderTextColor={colors.textMuted + '70'} style={{ backgroundColor: colors.background, borderRadius: 10, padding: 12, fontSize: 14, color: colors.text, marginBottom: 16 }} />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable onPress={() => setCompensateUser(null)} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center' }}>
                    <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Cancelar</Text>
                  </Pressable>
                  <Pressable onPress={handleCompensateSubmit} disabled={compLoading} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: compLoading ? colors.textMuted + '40' : '#8B5CF6', alignItems: 'center' }}>
                    {compLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '700' }}>Enviar</Text>}
                  </Pressable>
                </View>
              </Animated.View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Confirm Toggle Modal ── */}
      <Modal visible={!!confirmToggle} transparent animationType="fade" onRequestClose={() => setConfirmToggle(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }} onPress={() => setConfirmToggle(null)}>
          {confirmToggle && (
            <Animated.View entering={FadeIn.duration(200)} style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 }}>
              <View style={{ alignItems: 'center', marginBottom: 14 }}>
                {confirmToggle.target === 'MODERATOR' ? <Shield size={40} color="#3B82F6" /> : <ShieldOff size={40} color="#EF4444" />}
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
                {confirmToggle.target === 'MODERATOR' ? 'Otorgar MODERATOR' : 'Revocar MODERATOR'}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19, marginBottom: 20 }}>
                {confirmToggle.target === 'MODERATOR' ? `¿Otorgar permisos de moderador a ${confirmToggle.user.nickname}?` : `¿Revocar permisos de ${confirmToggle.user.nickname}? Volverá a ser usuario normal.`}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable onPress={() => setConfirmToggle(null)} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center' }}>
                  <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Cancelar</Text>
                </Pressable>
                <Pressable onPress={executeToggle} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: confirmToggle.target === 'MODERATOR' ? '#3B82F6' : '#EF4444', alignItems: 'center' }}>
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>{confirmToggle.target === 'MODERATOR' ? 'Otorgar' : 'Revocar'}</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}
        </Pressable>
      </Modal>

    </View>
  );
}
