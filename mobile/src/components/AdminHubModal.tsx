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
} from 'lucide-react-native';
import { useThemeColors, useUser, useAppStore } from '@/lib/store';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

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

  // Every time the modal opens, verify role directly from backend
  useEffect(() => {
    if (!visible || !user?.id) return;

    setVerifiedRole(null);
    setChecking(true);

    fetch(`${BACKEND_URL}/api/gamification/user/${user.id}`)
      .then(r => r.ok ? r.json() : null)
      .then((profile: { role?: string } | null) => {
        const role = (profile?.role ?? 'USER') as 'OWNER' | 'MODERATOR' | 'USER';
        setVerifiedRole(role);
        // Sync role into local store so it's available next time
        if (profile?.role && profile.role !== user.role) {
          updateUser({ role: profile.role as 'USER' | 'MODERATOR' | 'OWNER' });
        }
      })
      .catch(() => {
        // Fallback to local store role if network fails
        setVerifiedRole((user?.role as 'OWNER' | 'MODERATOR' | 'USER') ?? 'USER');
      })
      .finally(() => setChecking(false));
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
            {checking ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 13 }}>
                  Verificando acceso…
                </Text>
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
              </View>
            ) : (
              <>
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
                        const res = await fetch(`${BACKEND_URL}/api/admin/snapshots/generate`, {
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
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
