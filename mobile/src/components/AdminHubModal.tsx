// AdminHubModal - Single entry point for all admin tools
// Opened via secret long-press on app version in Settings footer
// Role-based: OWNER sees everything, MODERATOR sees only Support Tickets

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  X,
  Shield,
  Palette,
  Database,
  Gift,
  Ticket,
  Users,
  ChevronRight,
  Crown,
  Camera,
  Wifi,
  RefreshCw,
} from 'lucide-react-native';
import { useThemeColors, useUser, useAppStore } from '@/lib/store';
import {
  getCachedDates,
  getLastPrefetchTime,
  prefetchDevotionals,
  getCRToday,
} from '@/lib/devotional-cache';
import { fetchWithTimeout } from '@/lib/fetch';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

// ── EMERGENCY OVERRIDE ────────────────────────────────────────────────────────
// Hard bypass: any userId in this list gets OWNER unconditionally.
// No role check, no backend check, no cache gate.
const EMERGENCY_OWNER_IDS: string[] = [
  'cmml8uiit0000m2vluztbkjwf', // Vitigrecheer – original known production userId (preview backend)
  'cmm18uiit0000m2vluztbkjwf', // Hard bypass – user-confirmed production userId
  'cmmla4nvd000jpn5qgklfl7cm', // Vitigrecheer – confirmed production userId (unsealed-thirstily backend)
];
// ─────────────────────────────────────────────────────────────────────────────

interface AdminSection {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  route: string;
  roles: ('OWNER' | 'MODERATOR')[];
  accentColor: string;
}

interface AdminHubModalProps {
  visible: boolean;
  onClose: () => void;
}

function SectionRow({
  section,
  onPress,
  colors,
}: {
  section: AdminSection;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 16,
          marginBottom: 10,
          backgroundColor: pressed
            ? section.accentColor + '18'
            : colors.surface,
          borderWidth: 1,
          borderColor: pressed ? section.accentColor + '40' : colors.surface,
        },
      ]}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: section.accentColor + '20',
          marginRight: 14,
        }}
      >
        {section.icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 2,
          }}
        >
          {section.label}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: colors.textMuted,
            lineHeight: 16,
          }}
        >
          {section.description}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export function AdminHubModal({ visible, onClose }: AdminHubModalProps) {
  const colors = useThemeColors();
  const user = useUser();
  const updateUser = useAppStore((s) => s.updateUser);
  const router = useRouter();
  const { height } = useWindowDimensions();

  // Verified role fetched from backend — starts null (unknown), then resolves
  const [verifiedRole, setVerifiedRole] = useState<'OWNER' | 'MODERATOR' | 'USER' | null>(null);
  const [checking, setChecking] = useState(false);
  const [generatingSnapshots, setGeneratingSnapshots] = useState(false);

  // Debug state — tracks what each gate produced
  const [debugInfo, setDebugInfo] = useState<{
    localId: string;
    localRole: string;
    backendRole: string | null;
    isEmergencyOverride: boolean;
    finalRole: string | null;
    blockedBy: string | null;
    backendStatus: string | null;
  } | null>(null);

  // DevCache debug panel state (OWNER only)
  const [cachedDates, setCachedDates] = useState<string[]>([]);
  const [lastPrefetch, setLastPrefetch] = useState<number | null>(null);
  const [forcePrefetching, setForcePrefetching] = useState(false);
  const [devCacheExpanded, setDevCacheExpanded] = useState(false);

  const loadDevCacheInfo = useCallback(async () => {
    const [dates, ts] = await Promise.all([getCachedDates(), getLastPrefetchTime()]);
    setCachedDates(dates);
    setLastPrefetch(ts);
  }, []);

  // Every time the modal opens, verify role:
  // 1. Start in "checking" state — do NOT use cached role to gate access yet
  // 2. Hit the backend for the authoritative role
  // 3. Apply emergency override if userId matches
  // 4. Sync any changes back to local store
  useEffect(() => {
    if (!visible || !user?.id) return;

    const localId   = user.id;
    const localRole = (user?.role as 'OWNER' | 'MODERATOR' | 'USER') ?? 'USER';
    const isEmergencyOverride = EMERGENCY_OWNER_IDS.includes(localId);

    console.log('[AdminHub] ── open ──────────────────────────────────');
    console.log('[AdminHub] localUserId  :', localId);
    console.log('[AdminHub] localRole    :', localRole, '(from Zustand store)');
    console.log('[AdminHub] emergencyOverride:', isEmergencyOverride);
    console.log('[AdminHub] backendUrl   :', BACKEND_URL);

    // Reset debug
    setDebugInfo({
      localId,
      localRole,
      backendRole: null,
      isEmergencyOverride,
      finalRole: null,
      blockedBy: checking ? 'checking...' : null,
      backendStatus: null,
    });

    // Don't show stale "no-access" screen — wait for network first
    // But if we already know the user is an owner/mod, show it immediately
    if (localRole === 'OWNER' || localRole === 'MODERATOR' || isEmergencyOverride) {
      const immediateRole = isEmergencyOverride ? 'OWNER' : localRole;
      setVerifiedRole(immediateRole);
      if (immediateRole === 'OWNER') loadDevCacheInfo();
      console.log('[AdminHub] decision     : IMMEDIATE ACCESS (store role or override)');
    } else {
      // USER role from store — hold on "checking" until backend confirms
      setVerifiedRole(null);
      console.log('[AdminHub] decision     : holding for network — store shows USER');
    }

    setChecking(true);

    fetchWithTimeout(`${BACKEND_URL}/api/gamification/me`, {
      headers: {
        'X-User-Id': localId,
        ...(user.nickname ? { 'X-User-Nickname': user.nickname } : {}),
      },
    })
      .then(r => {
        console.log('[AdminHub] /me response status:', r.status);
        setDebugInfo(prev => prev ? { ...prev, backendStatus: String(r.status) } : null);
        return r.ok ? r.json() : null;
      })
      .then((profile: { id?: string; role?: string } | null) => {
        console.log('[AdminHub] /me payload  :', JSON.stringify(profile));

        if (!profile?.role && !isEmergencyOverride) {
          // Network failed — fall back to store role
          console.log('[AdminHub] /me failed — falling back to store role:', localRole);
          const blockedReason = !profile ? 'backend returned null — ID not found in DB' : 'no role in profile — check DB record';
          setDebugInfo(prev => prev ? { ...prev, backendRole: null, finalRole: localRole, blockedBy: localRole === 'USER' ? blockedReason : null } : null);
          setVerifiedRole(localRole);
          if (localRole === 'OWNER') loadDevCacheInfo();
          return;
        }

        const backendRole = (profile?.role as 'OWNER' | 'MODERATOR' | 'USER') ?? localRole;
        const finalRole   = isEmergencyOverride && backendRole !== 'OWNER'
          ? 'OWNER'  // emergency: force OWNER for debugging
          : backendRole;

        console.log('[AdminHub] backendRole  :', backendRole);
        console.log('[AdminHub] finalRole    :', finalRole, isEmergencyOverride ? '(emergency override applied)' : '');

        const blockedReason = finalRole === 'USER' ? `backend says USER — not in OWNER/MODERATOR. emergencyOverride=${isEmergencyOverride}` : null;
        setDebugInfo(prev => prev ? { ...prev, backendRole, finalRole, blockedBy: blockedReason } : null);

        setVerifiedRole(finalRole);

        const updates: Record<string, string> = {};
        if (backendRole !== localRole) {
          console.log('[AdminHub] role CHANGED — was:', localRole, 'now:', backendRole, '→ syncing store');
          updates.role = backendRole;
        }
        // If the backend returned a different ID (nickname fallback), sync it locally
        if (profile?.id && profile.id !== localId) {
          console.log('[AdminHub] ID mismatch — syncing local id from', localId, 'to', profile.id);
          updates.id = profile.id;
        }
        if (Object.keys(updates).length > 0) {
          updateUser(updates as Parameters<typeof updateUser>[0]);
        }
        if (finalRole === 'OWNER') loadDevCacheInfo();
      })
      .catch((err) => {
        console.log('[AdminHub] /me error    :', String(err));
        // Network failed — use store role or emergency override
        const fallback = isEmergencyOverride ? 'OWNER' : localRole;
        console.log('[AdminHub] fallback role:', fallback);
        setDebugInfo(prev => prev ? { ...prev, backendRole: null, finalRole: fallback, blockedBy: `network error: ${String(err)}` } : null);
        setVerifiedRole(fallback);
        if (fallback === 'OWNER') loadDevCacheInfo();
      })
      .finally(() => {
        console.log('[AdminHub] check complete');
        setChecking(false);
      });
  }, [visible, user?.id]);

  const role = verifiedRole;
  const isOwner = role === 'OWNER';
  const isModerator = role === 'MODERATOR';
  const isAdmin = isOwner || isModerator;

  // Sections definition — only admin roles see this modal, but filter by role
  const allSections: AdminSection[] = [
    {
      id: 'branding',
      icon: <Palette size={22} color="#F59E0B" />,
      label: 'Branding',
      description: 'App name, taglines, logo, watermark settings',
      route: '/admin/branding',
      roles: ['OWNER'],
      accentColor: '#F59E0B',
    },
    {
      id: 'backup',
      icon: <Database size={22} color="#3B82F6" />,
      label: 'Backups',
      description: 'Create, restore and manage database backups',
      route: '/admin/backup',
      roles: ['OWNER'],
      accentColor: '#3B82F6',
    },
    {
      id: 'gifts',
      icon: <Gift size={22} color="#8B5CF6" />,
      label: 'Drops / Gifts',
      description: 'Send reward drops and gifts to users',
      route: '/admin/gifts',
      roles: ['OWNER'],
      accentColor: '#8B5CF6',
    },
    {
      id: 'support',
      icon: <Ticket size={22} color="#10B981" />,
      label: 'Support Tickets',
      description: 'Review and resolve user support requests',
      route: '/admin/support',
      roles: ['OWNER', 'MODERATOR'],
      accentColor: '#10B981',
    },
    {
      id: 'users',
      icon: <Users size={22} color="#3B82F6" />,
      label: 'Usuarios',
      description: 'Gestión de usuarios, roles, insignias y compensaciones',
      route: '/admin/moderators',
      roles: ['OWNER'],
      accentColor: '#3B82F6',
    },
  ];

  const handleNavigate = useCallback(
    (route: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onClose();
      // Small delay so modal closes before new screen appears
      setTimeout(() => {
        router.push(route as Parameters<typeof router.push>[0]);
      }, 250);
    },
    [onClose, router]
  );

  const visibleSections = allSections.filter((s) => {
    if (isOwner) return true;
    if (isModerator) return s.roles.includes('MODERATOR');
    return false;
  });

  const roleLabel = isOwner ? 'Owner' : 'Moderator';
  const roleColor = isOwner ? '#F59E0B' : '#10B981';
  const RoleIcon  = isOwner ? Crown : Shield;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'flex-end',
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        {/* Sheet */}
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            height: height * 0.75,
            maxHeight: height * 0.88,
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
              marginTop: 12,
              marginBottom: 20,
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              marginBottom: 20,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: roleColor + '18',
                marginRight: 14,
              }}
            >
              <Shield size={24} color={roleColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: colors.text,
                  letterSpacing: -0.3,
                }}
              >
                Admin Hub
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                <RoleIcon size={12} color={roleColor} />
                <Text
                  style={{
                    fontSize: 12,
                    color: roleColor,
                    fontWeight: '600',
                    marginLeft: 4,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                  }}
                >
                  {roleLabel}
                </Text>
              </View>
            </View>

            {/* Close button */}
            <Pressable
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.textMuted + '18',
              }}
            >
              <X size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Role note for moderators */}
          {isModerator && (
            <View
              style={{
                marginHorizontal: 20,
                marginBottom: 16,
                padding: 12,
                borderRadius: 12,
                backgroundColor: '#10B981' + '12',
                borderWidth: 1,
                borderColor: '#10B981' + '30',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Shield size={14} color="#10B981" />
              <Text
                style={{
                  fontSize: 12,
                  color: '#10B981',
                  marginLeft: 8,
                  flex: 1,
                  lineHeight: 18,
                }}
              >
                Como Moderador tienes acceso a tickets de soporte. Branding, Drops y Backups son solo para el Owner.
              </Text>
            </View>
          )}

          {/* Sections list */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
            showsVerticalScrollIndicator={false}
          >
            {(checking && !isAdmin) ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 13 }}>
                  Verificando acceso…
                </Text>
                {debugInfo && (
                  <View style={{ marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: '#F59E0B18', borderWidth: 1, borderColor: '#F59E0B40', width: '100%' }}>
                    <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '700', marginBottom: 6 }}>DEBUG — checking</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 10, fontFamily: 'monospace' }}>id: {debugInfo.localId}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 10, fontFamily: 'monospace' }}>local role: {debugInfo.localRole}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 10, fontFamily: 'monospace' }}>emergency override: {String(debugInfo.isEmergencyOverride)}</Text>
                  </View>
                )}
              </View>
            ) : !isAdmin ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Text style={{ fontSize: 32, marginBottom: 12 }}>🔒</Text>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 6 }}>
                  Sin acceso
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
                  Tu cuenta no tiene permisos de administrador.
                </Text>
                {/* DEBUG: gate diagnostics */}
                {debugInfo && (
                  <View style={{ marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: '#EF444418', borderWidth: 1, borderColor: '#EF444440', width: '100%' }}>
                    <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '700', marginBottom: 6 }}>DEBUG — gate blocked</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 10, fontFamily: 'monospace' }}>id: {debugInfo.localId}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 10, fontFamily: 'monospace' }}>local role: {debugInfo.localRole}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 10, fontFamily: 'monospace' }}>backend role: {debugInfo.backendRole ?? 'null'}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 10, fontFamily: 'monospace' }}>backend status: {debugInfo.backendStatus ?? 'null'}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 10, fontFamily: 'monospace' }}>emergency override: {String(debugInfo.isEmergencyOverride)}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 10, fontFamily: 'monospace' }}>final role: {debugInfo.finalRole ?? 'null'}</Text>
                    <Text style={{ color: '#EF4444', fontSize: 10, fontFamily: 'monospace', marginTop: 4 }}>blocked by: {debugInfo.blockedBy ?? 'unknown'}</Text>
                  </View>
                )}
              </View>
            ) : (
              <>
                {/* DEBUG: access granted diagnostics */}
                {debugInfo && (
                  <View style={{ marginBottom: 12, padding: 10, borderRadius: 10, backgroundColor: '#10B98118', borderWidth: 1, borderColor: '#10B98130' }}>
                    <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '700', marginBottom: 4 }}>DEBUG — access granted</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 10, fontFamily: 'monospace' }}>id: {debugInfo.localId}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 10, fontFamily: 'monospace' }}>local: {debugInfo.localRole} | backend: {debugInfo.backendRole ?? '...'} | final: {debugInfo.finalRole ?? '...'}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 10, fontFamily: 'monospace' }}>emergency: {String(debugInfo.isEmergencyOverride)} | http: {debugInfo.backendStatus ?? '...'}</Text>
                  </View>
                )}
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: colors.textMuted,
                    letterSpacing: 1.2,
                    textTransform: 'uppercase',
                    marginBottom: 12,
                  }}
                >
                  Herramientas disponibles
                </Text>

                {visibleSections.map((section) => (
                  <SectionRow
                    key={section.id}
                    section={section}
                    onPress={() => handleNavigate(section.route)}
                    colors={colors}
                  />
                ))}

                {/* OWNER-only: Generate Snapshots now (for testing) */}
                {isOwner && (
                  <Pressable
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setGeneratingSnapshots(true);
                      try {
                        const res = await fetchWithTimeout(`${BACKEND_URL}/api/admin/snapshots/generate`, {
                          method: 'POST',
                          headers: { 'X-User-Id': user?.id ?? '' },
                        });
                        const data = await res.json() as { success: boolean; date?: string; processed?: number; created?: number; errors?: number };
                        if (data.success) {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          Alert.alert('Snapshots generados', `Fecha: ${data.date}\nProcesados: ${data.processed}\nCreados: ${data.created}\nErrores: ${data.errors}`);
                        } else {
                          Alert.alert('Error', 'No se pudieron generar snapshots');
                        }
                      } catch (e) {
                        Alert.alert('Error', String(e));
                      } finally {
                        setGeneratingSnapshots(false);
                      }
                    }}
                    disabled={generatingSnapshots}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: 16,
                      marginBottom: 10,
                      marginTop: 4,
                      backgroundColor: pressed ? '#0EA5E918' : colors.surface,
                      borderWidth: 1,
                      borderColor: pressed ? '#0EA5E940' : colors.surface,
                      opacity: generatingSnapshots ? 0.6 : 1,
                    })}
                  >
                    <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0EA5E920', marginRight: 14 }}>
                      {generatingSnapshots
                        ? <ActivityIndicator size="small" color="#0EA5E9" />
                        : <Camera size={22} color="#0EA5E9" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 }}>
                        Generar Snapshots
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 16 }}>
                        Forzar snapshot de todos los usuarios ahora
                      </Text>
                    </View>
                    {!generatingSnapshots && <ChevronRight size={18} color={colors.textMuted} />}
                  </Pressable>
                )}
                {/* OWNER-only: DevCache debug panel */}
                {isOwner && (
                  <View style={{ marginTop: 4 }}>
                    {/* Toggle header */}
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setDevCacheExpanded(p => !p);
                        if (!devCacheExpanded) loadDevCacheInfo();
                      }}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        borderRadius: 16,
                        marginBottom: devCacheExpanded ? 0 : 10,
                        backgroundColor: pressed ? '#10B98118' : colors.surface,
                        borderWidth: 1,
                        borderColor: pressed ? '#10B98140' : colors.surface,
                      })}
                    >
                      <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B98120', marginRight: 14 }}>
                        <Wifi size={22} color="#10B981" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 }}>
                          DevCache — Devocionales
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 16 }}>
                          {cachedDates.length} fechas cacheadas · {devCacheExpanded ? 'Cerrar' : 'Ver detalle'}
                        </Text>
                      </View>
                      <ChevronRight
                        size={18}
                        color={colors.textMuted}
                        style={{ transform: [{ rotate: devCacheExpanded ? '90deg' : '0deg' }] }}
                      />
                    </Pressable>

                    {devCacheExpanded && (
                      <View style={{
                        backgroundColor: colors.surface,
                        borderRadius: 16,
                        marginBottom: 10,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        gap: 8,
                      }}>
                        {/* Last prefetch */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.textMuted + '20' }}>
                          <Text style={{ fontSize: 12, color: colors.textMuted }}>Último prefetch</Text>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>
                            {lastPrefetch
                              ? new Date(lastPrefetch).toLocaleString('es-CR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                              : 'Nunca'}
                          </Text>
                        </View>

                        {/* todayCR */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, color: colors.textMuted }}>Hoy CR</Text>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: '#10B981' }}>{getCRToday()}</Text>
                        </View>

                        {/* Cached dates list */}
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4 }}>
                          Fechas cacheadas ({cachedDates.length})
                        </Text>
                        {cachedDates.length === 0 ? (
                          <Text style={{ fontSize: 12, color: colors.textMuted, fontStyle: 'italic' }}>Sin caché</Text>
                        ) : (
                          cachedDates.map(date => {
                            const isToday = date === getCRToday();
                            return (
                              <View key={date} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isToday ? '#10B981' : colors.textMuted + '60' }} />
                                <Text style={{ fontSize: 12, color: isToday ? '#10B981' : colors.text, fontWeight: isToday ? '700' : '400' }}>
                                  {date}{isToday ? ' ← hoy' : ''}
                                </Text>
                              </View>
                            );
                          })
                        )}

                        {/* Force prefetch button */}
                        <Pressable
                          onPress={async () => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setForcePrefetching(true);
                            try {
                              const result = await prefetchDevotionals(true);
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                              Alert.alert(
                                'Prefetch forzado',
                                `Descargados: ${result.fetched}/${result.total}\nFechas: ${result.dates.join(', ')}`
                              );
                              await loadDevCacheInfo();
                            } catch (e) {
                              Alert.alert('Error', String(e));
                            }
                            setForcePrefetching(false);
                          }}
                          disabled={forcePrefetching}
                          style={({ pressed }) => ({
                            marginTop: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            paddingVertical: 10,
                            borderRadius: 12,
                            backgroundColor: pressed ? '#10B98130' : '#10B98118',
                            borderWidth: 1,
                            borderColor: '#10B98140',
                            opacity: forcePrefetching ? 0.6 : 1,
                          })}
                        >
                          {forcePrefetching
                            ? <ActivityIndicator size="small" color="#10B981" />
                            : <RefreshCw size={14} color="#10B981" />
                          }
                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#10B981' }}>
                            {forcePrefetching ? 'Descargando…' : 'Forzar prefetch ahora'}
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
