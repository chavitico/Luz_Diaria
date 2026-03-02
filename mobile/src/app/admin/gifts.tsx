// Admin: Gift Drops Management Screen
// Access: tap footer 7 times in settings

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  X,
  Gift,
  Plus,
  Send,
  ChevronDown,
  Users,
  User,
  RefreshCw,
  Check,
  Package,
  Trash2,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeColors, useUser } from '@/lib/store';
import { gamificationApi } from '@/lib/gamification-api';

type RewardType = 'CHEST' | 'THEME' | 'TITLE' | 'AVATAR' | 'ITEM';
type AudienceType = 'ALL_USERS' | 'USER_IDS';

interface GiftDrop {
  id: string;
  title: string;
  message: string;
  rewardType: string;
  rewardId: string;
  audienceType: string;
  audienceUserIds: string[];
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
  totalRecipients: number;
}

interface StoreItemOption {
  id: string;
  type: string;
  nameEs: string;
  nameEn: string;
  rarity: string;
}

const REWARD_TYPES: { value: RewardType; label: string }[] = [
  { value: 'CHEST', label: 'Cofre' },
  { value: 'THEME', label: 'Tema' },
  { value: 'TITLE', label: 'Título' },
  { value: 'AVATAR', label: 'Avatar' },
  { value: 'ITEM', label: 'Item' },
];

const REWARD_TYPE_ICONS: Record<RewardType, string> = {
  CHEST: '📦',
  THEME: '🎨',
  TITLE: '🏷️',
  AVATAR: '👤',
  ITEM: '⭐',
};

const RARITY_COLORS: Record<string, string> = {
  common: '#6B7280',
  rare: '#3B82F6',
  epic: '#8B5CF6',
};

export default function AdminGiftsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const user = useUser();
  const userId = user?.id ?? '';

  const [giftDrops, setGiftDrops] = useState<GiftDrop[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItemOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{
    title: string;
    message: string;
    rewardType: RewardType;
    rewardId: string;
    audienceType: AudienceType;
    audienceUserIds: string;
    isActive: boolean;
  }>({
    title: '',
    message: '',
    rewardType: 'ITEM',
    rewardId: '',
    audienceType: 'ALL_USERS',
    audienceUserIds: '',
    isActive: false,
  });
  const [showRewardTypePicker, setShowRewardTypePicker] = useState(false);
  const [showRewardIdPicker, setShowRewardIdPicker] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [drops, items] = await Promise.all([
        gamificationApi.adminListGiftDrops(userId),
        gamificationApi.adminGetStoreItems(userId),
      ]);
      setGiftDrops(drops);
      setStoreItems(items);
    } catch (e) {
      Alert.alert('Error', 'No se pudo cargar la lista.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredStoreItems = storeItems.filter((item) => {
    if (form.rewardType === 'CHEST') return false;
    if (form.rewardType === 'THEME') return item.type === 'theme';
    if (form.rewardType === 'TITLE') return item.type === 'title';
    if (form.rewardType === 'AVATAR') return item.type === 'avatar';
    return true; // ITEM shows all
  });

  const selectedItem = storeItems.find((i) => i.id === form.rewardId);

  const handleSave = async () => {
    if (!form.title.trim() || !form.message.trim() || !form.rewardId.trim()) {
      Alert.alert('Error', 'Completa todos los campos obligatorios.');
      return;
    }

    const audienceUserIds =
      form.audienceType === 'USER_IDS'
        ? form.audienceUserIds
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    setSaving(true);
    try {
      const { giftDrop } = await gamificationApi.adminCreateGiftDrop(userId, {
        title: form.title.trim(),
        message: form.message.trim(),
        rewardType: form.rewardType,
        rewardId: form.rewardId.trim(),
        audienceType: form.audienceType,
        audienceUserIds,
        isActive: form.isActive,
      });

      // If active, auto-publish to distribute UserGift records immediately
      if (form.isActive) {
        const result = await gamificationApi.adminPublishGiftDrop(userId, giftDrop.id);
        Alert.alert('Regalo creado y enviado', `Distribuido a ${result.created} usuario(s).`);
      }

      setForm({
        title: '',
        message: '',
        rewardType: 'ITEM',
        rewardId: '',
        audienceType: 'ALL_USERS',
        audienceUserIds: '',
        isActive: false,
      });
      setShowCreateForm(false);
      await load();
    } catch (e) {
      Alert.alert('Error', 'No se pudo crear el gift drop.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (giftDrop: GiftDrop) => {
    Alert.alert(
      'Publicar regalo',
      `Se enviará a: ${giftDrop.audienceType === 'ALL_USERS' ? 'todos los usuarios' : `${giftDrop.audienceUserIds.length} usuarios`}.\n\n¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Publicar',
          style: 'default',
          onPress: async () => {
            setPublishing(giftDrop.id);
            try {
              const result = await gamificationApi.adminPublishGiftDrop(userId, giftDrop.id);
              Alert.alert('Éxito', `Enviado a ${result.created} usuario(s) (de ${result.total} destinatarios).`);
              await load();
            } catch {
              Alert.alert('Error', 'No se pudo publicar el regalo.');
            } finally {
              setPublishing(null);
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (giftDrop: GiftDrop) => {
    setToggling(giftDrop.id);
    try {
      await gamificationApi.adminUpdateGiftDrop(userId, giftDrop.id, { isActive: !giftDrop.isActive });
      await load();
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el estado.');
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = (giftDrop: GiftDrop) => {
    Alert.alert(
      'Eliminar regalo',
      `¿Eliminar "${giftDrop.title}"? Esto también eliminará todos los registros de usuarios pendientes.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeleting(giftDrop.id);
            try {
              await gamificationApi.adminDeleteGiftDrop(userId, giftDrop.id);
              await load();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el regalo.');
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 16,
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
          <Gift size={22} color={colors.primary} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>
            Admin Regalos
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            onPress={load}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: colors.primary + '15',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RefreshCw size={16} color={colors.primary} />
          </Pressable>
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
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Create New Button */}
        {!showCreateForm && (
          <Pressable
            onPress={() => setShowCreateForm(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: colors.primary,
              borderRadius: 16,
              paddingVertical: 14,
              marginBottom: 20,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
              Crear nuevo regalo
            </Text>
          </Pressable>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <Animated.View
            entering={FadeInDown.duration(200)}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1.5,
              borderColor: colors.primary + '40',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
              Nuevo Gift Drop
            </Text>

            {/* Title */}
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 }}>
              Título *
            </Text>
            <TextInput
              value={form.title}
              onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
              placeholder="ej: ¡Gracias por probar Luz Diaria!"
              placeholderTextColor={colors.textMuted + '80'}
              style={{
                backgroundColor: colors.background,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                color: colors.text,
                fontSize: 14,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: colors.textMuted + '20',
              }}
            />

            {/* Message */}
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 }}>
              Mensaje *
            </Text>
            <TextInput
              value={form.message}
              onChangeText={(v) => setForm((f) => ({ ...f, message: v }))}
              placeholder="Mensaje de agradecimiento al usuario..."
              placeholderTextColor={colors.textMuted + '80'}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: colors.background,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                color: colors.text,
                fontSize: 14,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: colors.textMuted + '20',
                textAlignVertical: 'top',
                minHeight: 80,
              }}
            />

            {/* Reward Type */}
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 }}>
              Tipo de premio *
            </Text>
            <Pressable
              onPress={() => setShowRewardTypePicker((v) => !v)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: colors.background,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: colors.textMuted + '20',
              }}
            >
              <Text style={{ color: colors.text, fontSize: 14 }}>
                {REWARD_TYPE_ICONS[form.rewardType]} {REWARD_TYPES.find((r) => r.value === form.rewardType)?.label}
              </Text>
              <ChevronDown size={16} color={colors.textMuted} />
            </Pressable>

            {showRewardTypePicker && (
              <Animated.View entering={FadeInDown.duration(150)} style={{ marginBottom: 8 }}>
                {REWARD_TYPES.map((rt) => (
                  <Pressable
                    key={rt.value}
                    onPress={() => {
                      setForm((f) => ({ ...f, rewardType: rt.value, rewardId: '' }));
                      setShowRewardTypePicker(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      backgroundColor: form.rewardType === rt.value ? colors.primary + '15' : colors.background,
                      borderRadius: 10,
                      marginBottom: 4,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{REWARD_TYPE_ICONS[rt.value]}</Text>
                    <Text style={{ color: form.rewardType === rt.value ? colors.primary : colors.text, fontSize: 14, fontWeight: '500' }}>
                      {rt.label}
                    </Text>
                  </Pressable>
                ))}
              </Animated.View>
            )}

            {/* Reward ID */}
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6, marginTop: 6 }}>
              ID del premio *
            </Text>

            {form.rewardType === 'CHEST' ? (
              <TextInput
                value={form.rewardId}
                onChangeText={(v) => setForm((f) => ({ ...f, rewardId: v }))}
                placeholder="ID del cofre o cantidad de puntos"
                placeholderTextColor={colors.textMuted + '80'}
                style={{
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  color: colors.text,
                  fontSize: 14,
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: colors.textMuted + '20',
                }}
              />
            ) : (
              <>
                <Pressable
                  onPress={() => setShowRewardIdPicker((v) => !v)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: colors.background,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: colors.textMuted + '20',
                  }}
                >
                  <Text style={{ color: form.rewardId ? colors.text : colors.textMuted + '80', fontSize: 14 }}>
                    {selectedItem ? `${selectedItem.nameEs} (${selectedItem.id})` : 'Seleccionar item...'}
                  </Text>
                  <ChevronDown size={16} color={colors.textMuted} />
                </Pressable>

                {showRewardIdPicker && (
                  <Animated.View
                    entering={FadeInDown.duration(150)}
                    style={{
                      maxHeight: 200,
                      backgroundColor: colors.background,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.textMuted + '20',
                      marginBottom: 14,
                      overflow: 'hidden',
                    }}
                  >
                    <ScrollView nestedScrollEnabled>
                      {filteredStoreItems.length === 0 ? (
                        <Text style={{ padding: 14, color: colors.textMuted, fontSize: 13 }}>
                          No hay items disponibles para este tipo.
                        </Text>
                      ) : (
                        filteredStoreItems.map((item) => (
                          <Pressable
                            key={item.id}
                            onPress={() => {
                              setForm((f) => ({ ...f, rewardId: item.id }));
                              setShowRewardIdPicker(false);
                            }}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 8,
                              paddingHorizontal: 14,
                              paddingVertical: 10,
                              backgroundColor: form.rewardId === item.id ? colors.primary + '15' : 'transparent',
                              borderBottomWidth: 1,
                              borderBottomColor: colors.textMuted + '10',
                            }}
                          >
                            <View
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: RARITY_COLORS[item.rarity] || '#6B7280',
                              }}
                            />
                            <Text style={{ color: colors.text, fontSize: 13, flex: 1 }}>
                              {item.nameEs}
                            </Text>
                            <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                              {item.type}
                            </Text>
                            {form.rewardId === item.id && (
                              <Check size={14} color={colors.primary} />
                            )}
                          </Pressable>
                        ))
                      )}
                    </ScrollView>
                  </Animated.View>
                )}

                {/* Manual ID input fallback */}
                <TextInput
                  value={form.rewardId}
                  onChangeText={(v) => setForm((f) => ({ ...f, rewardId: v }))}
                  placeholder="O escribe el ID manualmente"
                  placeholderTextColor={colors.textMuted + '60'}
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    color: colors.text,
                    fontSize: 13,
                    marginBottom: 14,
                    borderWidth: 1,
                    borderColor: colors.textMuted + '15',
                  }}
                />
              </>
            )}

            {/* Audience Type */}
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 10 }}>
              Audiencia
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              {[
                { value: 'ALL_USERS' as AudienceType, label: 'Todos', icon: <Users size={14} color={form.audienceType === 'ALL_USERS' ? colors.primary : colors.textMuted} /> },
                { value: 'USER_IDS' as AudienceType, label: 'Específicos', icon: <User size={14} color={form.audienceType === 'USER_IDS' ? colors.primary : colors.textMuted} /> },
              ].map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setForm((f) => ({ ...f, audienceType: opt.value }))}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: form.audienceType === opt.value ? colors.primary + '15' : colors.background,
                    borderWidth: 1.5,
                    borderColor: form.audienceType === opt.value ? colors.primary : colors.textMuted + '20',
                  }}
                >
                  {opt.icon}
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: form.audienceType === opt.value ? colors.primary : colors.textMuted,
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {form.audienceType === 'USER_IDS' && (
              <TextInput
                value={form.audienceUserIds}
                onChangeText={(v) => setForm((f) => ({ ...f, audienceUserIds: v }))}
                placeholder="IDs separados por coma: uid1, uid2, uid3"
                placeholderTextColor={colors.textMuted + '80'}
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  color: colors.text,
                  fontSize: 13,
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: colors.textMuted + '20',
                  textAlignVertical: 'top',
                  minHeight: 70,
                  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                }}
              />
            )}

            {/* Active toggle */}
            <Pressable
              onPress={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 12,
                backgroundColor: form.isActive ? colors.primary + '15' : colors.textMuted + '10',
                borderWidth: 1.5,
                borderColor: form.isActive ? colors.primary + '60' : colors.textMuted + '20',
              }}
            >
              <Text style={{ color: form.isActive ? colors.primary : colors.text, fontSize: 14, fontWeight: '600' }}>
                Activar al guardar
              </Text>
              <View
                style={{
                  width: 48,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: form.isActive ? colors.primary : colors.textMuted + '40',
                  justifyContent: 'center',
                  paddingHorizontal: 3,
                  alignItems: form.isActive ? 'flex-end' : 'flex-start',
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
            </Pressable>

            {/* Action buttons */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => setShowCreateForm(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: colors.textMuted + '15',
                }}
              >
                <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={saving}
                style={{
                  flex: 2,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: colors.primary,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Guardar</Text>
                )}
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* Gift Drops List */}
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
          Gift Drops recientes
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : giftDrops.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Package size={48} color={colors.textMuted + '40'} />
            <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>
              No hay gift drops todavía
            </Text>
          </View>
        ) : (
          giftDrops.map((gd) => (
            <Animated.View
              key={gd.id}
              entering={FadeInDown.duration(200)}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 14,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: gd.isActive ? colors.primary + '40' : colors.textMuted + '15',
              }}
            >
              {/* Header row */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Text style={{ fontSize: 16 }}>{REWARD_TYPE_ICONS[gd.rewardType as RewardType] || '🎁'}</Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 }} numberOfLines={1}>
                      {gd.title}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, color: colors.textMuted }} numberOfLines={2}>
                    {gd.message}
                  </Text>
                </View>
                {/* Active toggle */}
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  {toggling === gd.id ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Switch
                      value={gd.isActive}
                      onValueChange={() => handleToggleActive(gd)}
                      trackColor={{ false: colors.textMuted + '40', true: colors.primary + '60' }}
                      thumbColor={gd.isActive ? colors.primary : '#FFFFFF'}
                    />
                  )}
                  <Text style={{ fontSize: 10, color: gd.isActive ? colors.primary : colors.textMuted, fontWeight: '600' }}>
                    {gd.isActive ? 'ACTIVO' : 'INACTIVO'}
                  </Text>
                </View>
              </View>

              {/* Meta info */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    backgroundColor: colors.primary + '15',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.primary }}>
                    {gd.rewardType}: {gd.rewardId}
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    backgroundColor: colors.textMuted + '15',
                  }}
                >
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {gd.audienceType === 'ALL_USERS' ? '👥 Todos' : `👤 ${gd.audienceUserIds.length} usuarios`}
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    backgroundColor: colors.textMuted + '15',
                  }}
                >
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {gd.totalRecipients} enviados
                  </Text>
                </View>
                {gd.totalRecipients === 0 && (
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 8,
                      backgroundColor: '#FEF3C7',
                      borderWidth: 1,
                      borderColor: '#F59E0B40',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706' }}>
                      ⚠ Pendiente publicar
                    </Text>
                  </View>
                )}
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    backgroundColor: colors.textMuted + '15',
                  }}
                >
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {formatDate(gd.createdAt)}
                  </Text>
                </View>
              </View>

              {/* Publish button */}
              <Pressable
                onPress={() => handlePublish(gd)}
                disabled={publishing === gd.id}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: pressed ? '#D97706' : '#F59E0B',
                  opacity: publishing === gd.id ? 0.6 : 1,
                })}
              >
                {publishing === gd.id ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Send size={14} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
                      Publicar / Enviar a destinatarios
                    </Text>
                  </>
                )}
              </Pressable>

              {/* Delete button */}
              <Pressable
                onPress={() => handleDelete(gd)}
                disabled={deleting === gd.id}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 9,
                  borderRadius: 12,
                  marginTop: 6,
                  backgroundColor: pressed ? '#FEE2E2' : 'transparent',
                  borderWidth: 1,
                  borderColor: '#FCA5A5',
                  opacity: deleting === gd.id ? 0.5 : 1,
                })}
              >
                {deleting === gd.id ? (
                  <ActivityIndicator color="#EF4444" size="small" />
                ) : (
                  <>
                    <Trash2 size={14} color="#EF4444" />
                    <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '600' }}>
                      Eliminar
                    </Text>
                  </>
                )}
              </Pressable>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
