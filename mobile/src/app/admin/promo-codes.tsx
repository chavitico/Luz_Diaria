// Admin: Promo Codes Manager
// List, create, and toggle promo codes (OWNER only)

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Plus, Tag, Check, X, RefreshCw, Users } from 'lucide-react-native';
import { useThemeColors, useUser } from '@/lib/store';
import { fetchWithTimeout } from '@/lib/fetch';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

interface PromoRedemption {
  userId: string;
  redeemedAt: string;
}

interface PromoCode {
  id: string;
  displayCode: string;
  points: number;
  isActive: boolean;
  maxUses: number | null;
  totalUses: number;
  createdAt: string;
  redemptions: PromoRedemption[];
}

function CodeCard({
  code,
  onToggle,
  colors,
}: {
  code: PromoCode;
  onToggle: (id: string, active: boolean) => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: code.isActive ? colors.primary + '30' : colors.textMuted + '20',
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={() => setExpanded(v => !v)}
        style={{ padding: 14 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {/* Code badge */}
          <View style={{
            paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
            backgroundColor: code.isActive ? colors.primary + '18' : colors.textMuted + '15',
          }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: code.isActive ? colors.primary : colors.textMuted, letterSpacing: 1.5 }}>
              {code.displayCode}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
              {code.points.toLocaleString()} puntos
            </Text>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
              {code.totalUses} uso{code.totalUses !== 1 ? 's' : ''}{code.maxUses ? ` / ${code.maxUses} máx` : ' · sin límite'}
            </Text>
          </View>

          {/* Active indicator */}
          <View style={{
            paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
            backgroundColor: code.isActive ? '#22C55E20' : '#EF444420',
          }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: code.isActive ? '#22C55E' : '#EF4444' }}>
              {code.isActive ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
        </View>
      </Pressable>

      {expanded && (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.background, padding: 14, gap: 12 }}>
          {/* Redemptions list */}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <Users size={12} color={colors.textMuted} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Canjes recientes
              </Text>
            </View>
            {code.redemptions.length === 0 ? (
              <Text style={{ fontSize: 12, color: colors.textMuted, fontStyle: 'italic' }}>Nadie ha canjeado este código</Text>
            ) : (
              code.redemptions.slice(0, 5).map((r, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ fontSize: 12, color: colors.text, fontFamily: 'monospace' }} numberOfLines={1}>
                    {r.userId.slice(-12)}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {new Date(r.redeemedAt).toLocaleDateString('es')}
                  </Text>
                </View>
              ))
            )}
            {code.redemptions.length > 5 && (
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
                +{code.redemptions.length - 5} más
              </Text>
            )}
          </View>

          {/* Toggle button */}
          <Pressable
            onPress={() => onToggle(code.id, !code.isActive)}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
              paddingVertical: 10, borderRadius: 10,
              backgroundColor: code.isActive ? '#EF444415' : '#22C55E15',
              borderWidth: 1, borderColor: code.isActive ? '#EF444430' : '#22C55E30',
            }}
          >
            {code.isActive
              ? <><X size={14} color="#EF4444" /><Text style={{ fontSize: 13, fontWeight: '700', color: '#EF4444' }}>Desactivar código</Text></>
              : <><Check size={14} color="#22C55E" /><Text style={{ fontSize: 13, fontWeight: '700', color: '#22C55E' }}>Activar código</Text></>
            }
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}

export default function PromoCodesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const me = useUser();
  const myId = me?.id ?? '';

  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newPoints, setNewPoints] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchCodes = useCallback(async () => {
    if (!myId) return;
    setLoading(true);
    try {
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/admin/promo-codes`, { headers: { 'X-User-Id': myId } });
      if (res.status === 403) { Alert.alert('Sin acceso', 'Solo OWNER puede ver códigos.'); router.back(); return; }
      const data = await res.json() as { codes: PromoCode[] };
      setCodes(data.codes ?? []);
    } catch {
      Alert.alert('Error', 'No se pudo cargar los códigos.');
    } finally { setLoading(false); }
  }, [myId, router]);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const handleToggle = async (id: string, isActive: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/admin/promo-codes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': myId },
        body: JSON.stringify({ isActive }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) { Alert.alert('Error', data.error ?? 'No se pudo actualizar.'); return; }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCodes(prev => prev.map(c => c.id === id ? { ...c, isActive } : c));
    } catch { Alert.alert('Error', 'No se pudo conectar.'); }
  };

  const handleCreate = async () => {
    const code = newCode.trim().toUpperCase();
    const pts = parseInt(newPoints, 10);
    const max = newMaxUses.trim() ? parseInt(newMaxUses, 10) : undefined;

    if (!code || code.length < 4) { Alert.alert('Error', 'Código debe tener al menos 4 caracteres.'); return; }
    if (isNaN(pts) || pts < 1) { Alert.alert('Error', 'Puntos inválidos.'); return; }
    if (max !== undefined && (isNaN(max) || max < 1)) { Alert.alert('Error', 'Máximo usos inválido.'); return; }

    setCreating(true);
    try {
      const body: Record<string, unknown> = { id: code, points: pts };
      if (max !== undefined) body.maxUses = max;

      const res = await fetchWithTimeout(`${BACKEND_URL}/api/admin/promo-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': myId },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) { Alert.alert('Error', data.error ?? 'No se pudo crear.'); return; }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNewCode(''); setNewPoints(''); setNewMaxUses('');
      setShowCreate(false);
      fetchCodes();
    } catch { Alert.alert('Error', 'No se pudo conectar.'); }
    finally { setCreating(false); }
  };

  const activeCodes   = codes.filter(c => c.isActive);
  const inactiveCodes = codes.filter(c => !c.isActive);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>

        {/* Header */}
        <View style={{
          paddingTop: insets.top + 12, paddingBottom: 10, paddingHorizontal: 16,
          backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.textMuted + '18',
          flexDirection: 'row', alignItems: 'center', gap: 12,
        }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={18} color={colors.text} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.3 }}>Códigos promo</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>
              {activeCodes.length} activo{activeCodes.length !== 1 ? 's' : ''} · {codes.length} total
            </Text>
          </View>

          <Pressable
            onPress={async () => { setRefreshing(true); await fetchCodes(); setRefreshing(false); }}
            style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}
          >
            {refreshing ? <ActivityIndicator size="small" color={colors.primary} /> : <RefreshCw size={16} color={colors.textMuted} />}
          </Pressable>

          <Pressable
            onPress={() => { setShowCreate(v => !v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
              backgroundColor: showCreate ? colors.textMuted + '20' : colors.primary,
            }}
          >
            {showCreate ? <X size={14} color={colors.textMuted} /> : <Plus size={14} color="#FFF" />}
            <Text style={{ fontSize: 13, fontWeight: '700', color: showCreate ? colors.textMuted : '#FFF' }}>
              {showCreate ? 'Cancelar' : 'Nuevo'}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Create form */}
          {showCreate && (
            <Animated.View
              entering={FadeInDown.duration(200)}
              style={{
                backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 20,
                borderWidth: 1, borderColor: colors.primary + '30',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, marginBottom: 14 }}>Crear nuevo código</Text>

              <View style={{ gap: 10 }}>
                <View>
                  <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600', marginBottom: 5 }}>CÓDIGO (solo letras/números)</Text>
                  <TextInput
                    value={newCode}
                    onChangeText={t => setNewCode(t.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                    placeholder="BIENVENIDO2026"
                    autoCapitalize="characters"
                    placeholderTextColor={colors.textMuted + '70'}
                    style={{ backgroundColor: colors.background, borderRadius: 10, padding: 12, fontSize: 15, color: colors.text, fontWeight: '700', letterSpacing: 1.5, borderWidth: 1, borderColor: colors.textMuted + '25' }}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600', marginBottom: 5 }}>PUNTOS</Text>
                    <TextInput
                      value={newPoints}
                      onChangeText={setNewPoints}
                      placeholder="100"
                      keyboardType="number-pad"
                      placeholderTextColor={colors.textMuted + '70'}
                      style={{ backgroundColor: colors.background, borderRadius: 10, padding: 12, fontSize: 15, color: colors.text, fontWeight: '600', borderWidth: 1, borderColor: colors.textMuted + '25' }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600', marginBottom: 5 }}>MÁX USOS (vacío = ilimitado)</Text>
                    <TextInput
                      value={newMaxUses}
                      onChangeText={setNewMaxUses}
                      placeholder="∞"
                      keyboardType="number-pad"
                      placeholderTextColor={colors.textMuted + '70'}
                      style={{ backgroundColor: colors.background, borderRadius: 10, padding: 12, fontSize: 15, color: colors.text, fontWeight: '600', borderWidth: 1, borderColor: colors.textMuted + '25' }}
                    />
                  </View>
                </View>

                <Pressable
                  onPress={handleCreate}
                  disabled={creating}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                    paddingVertical: 13, borderRadius: 12,
                    backgroundColor: creating ? colors.primary + '60' : colors.primary,
                    marginTop: 4,
                  }}
                >
                  {creating ? <ActivityIndicator size="small" color="#FFF" /> : <Tag size={15} color="#FFF" />}
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFF' }}>Crear código</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {loading && !codes.length ? (
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : codes.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Tag size={40} color={colors.textMuted + '60'} />
              <Text style={{ fontSize: 15, color: colors.textMuted, marginTop: 12 }}>Sin códigos promo</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted + '80', marginTop: 4 }}>Crea el primero con el botón "Nuevo"</Text>
            </View>
          ) : (
            <>
              {/* Active */}
              {activeCodes.length > 0 && (
                <>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
                    Activos ({activeCodes.length})
                  </Text>
                  {activeCodes.map(c => (
                    <CodeCard key={c.id} code={c} onToggle={handleToggle} colors={colors} />
                  ))}
                </>
              )}

              {/* Inactive */}
              {inactiveCodes.length > 0 && (
                <>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginTop: activeCodes.length > 0 ? 16 : 0 }}>
                    Inactivos ({inactiveCodes.length})
                  </Text>
                  {inactiveCodes.map(c => (
                    <CodeCard key={c.id} code={c} onToggle={handleToggle} colors={colors} />
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
