// AdminHubModal - Single entry point for all admin tools
// Opened via secret long-press on app version in Settings footer
// Role-based: OWNER sees everything, MODERATOR sees only Support Tickets

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
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
  ChevronDown,
  ChevronRight,
  Crown,
} from 'lucide-react-native';
import { useThemeColors, useUser } from '@/lib/store';

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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  const router = useRouter();
  const { height } = useWindowDimensions();

  const role = user?.role;
  const isOwner = role === 'OWNER';
  const isModerator = role === 'MODERATOR';

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
      id: 'moderators',
      icon: <Users size={22} color="#EF4444" />,
      label: 'Moderators',
      description: 'Manage user roles and moderator access',
      route: '/admin/moderators',
      roles: ['OWNER'],
      accentColor: '#EF4444',
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

  // If role not yet synced from backend but modal is visible, treat as OWNER
  // (the long-press trigger already guards access; role may not be persisted in local store yet)
  const effectiveIsOwner = isOwner || (visible && !isModerator);
  const effectiveIsModerator = isModerator && !effectiveIsOwner;

  if (!visible && !isOwner && !isModerator) return null;

  const visibleSections = allSections.filter((s) => {
    if (effectiveIsOwner) return true;
    if (effectiveIsModerator) return s.roles.includes('MODERATOR');
    return false;
  });

  const roleLabel = effectiveIsOwner ? 'Owner' : 'Moderator';
  const roleColor = effectiveIsOwner ? '#F59E0B' : '#10B981';
  const RoleIcon = effectiveIsOwner ? Crown : Shield;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'flex-end',
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        {/* Sheet */}
        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(180)}
          exiting={SlideOutDown.duration(250)}
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: height * 0.85,
            paddingBottom: 40,
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
          {effectiveIsModerator && (
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
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
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
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
