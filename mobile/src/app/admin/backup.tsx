// Admin: Backup Management Screen (OWNER only)
// Access: settings screen admin panel

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Database, RefreshCw, RotateCcw, Shield, AlertTriangle, CheckCircle } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeColors, useUser } from '@/lib/store';
import { gamificationApi } from '@/lib/gamification-api';

const IS_DEV = process.env.EXPO_PUBLIC_APP_ENV === 'dev' || !process.env.EXPO_PUBLIC_APP_ENV;

interface BackupEntry {
  date: string;
  manifest: {
    counts: Record<string, number>;
    createdAt: string;
    appEnv: string;
  };
}

export default function AdminBackupScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useUser();

  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [isProd, setIsProd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadBackups = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const result = await gamificationApi.adminListBackups(user.id);
      setBackups(result.backups);
      setIsProd(result.isProd);
      setLoaded(true);
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar los backups.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const triggerBackup = useCallback(async () => {
    if (!user?.id) return;
    setTriggering(true);
    try {
      const result = await gamificationApi.adminTriggerBackup(user.id);
      Alert.alert('Backup completado', result.message || 'Backup creado exitosamente.');
      loadBackups();
    } catch (err) {
      Alert.alert('Error', 'Falló el backup.');
    } finally {
      setTriggering(false);
    }
  }, [user?.id, loadBackups]);

  const restoreBackup = useCallback((date: string) => {
    if (!user?.id) return;
    if (isProd) {
      Alert.alert(
        '⛔ Bloqueado en producción',
        'La restauración solo está disponible en DEV. Descarga el backup y restáuralo manualmente en producción.',
        [{ text: 'Entendido' }]
      );
      return;
    }
    Alert.alert(
      '⚠️ Restaurar backup',
      `¿Restaurar datos del ${date}?\n\nEsto SOBREESCRIBIRÁ datos actuales en DEV. Solo continúa si sabes lo que haces.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: async () => {
            setRestoring(date);
            try {
              const result = await gamificationApi.adminRestoreBackup(user.id, date);
              if (result.success) {
                const counts = result.restoredCounts ?? {};
                const summary = Object.entries(counts)
                  .map(([k, v]) => `  ${k}: ${v}`)
                  .join('\n');
                Alert.alert('Restauración completa ✅', `Datos restaurados:\n${summary}`);
              } else {
                Alert.alert('Error', result.error ?? 'Restauración fallida.');
              }
            } catch (err) {
              Alert.alert('Error', String(err));
            } finally {
              setRestoring(null);
            }
          },
        },
      ]
    );
  }, [user?.id, isProd]);

  // Load on first mount
  React.useEffect(() => {
    loadBackups();
  }, []);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('es-CR', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Database size={22} color={colors.primary} />
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
              Backups
            </Text>
          </View>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <X size={22} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Env Badge */}
        <View style={{
          marginTop: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: isProd ? '#DC262620' : '#D9770620',
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 6,
          alignSelf: 'flex-start',
        }}>
          {isProd
            ? <Shield size={14} color="#DC2626" />
            : <AlertTriangle size={14} color="#D97706" />
          }
          <Text style={{ fontSize: 12, fontWeight: '700', color: isProd ? '#DC2626' : '#D97706' }}>
            {isProd ? 'PRODUCCIÓN — Restore bloqueado' : 'DEV — Restore habilitado'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
          <Pressable
            onPress={triggerBackup}
            disabled={triggering}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingVertical: 12,
              opacity: triggering ? 0.6 : 1,
            }}
          >
            {triggering
              ? <ActivityIndicator size="small" color="#fff" />
              : <Database size={16} color="#fff" />
            }
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
              {triggering ? 'Creando...' : 'Crear backup ahora'}
            </Text>
          </Pressable>

          <Pressable
            onPress={loadBackups}
            disabled={loading}
            style={{
              width: 44,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.textMuted + '30',
            }}
          >
            {loading
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <RefreshCw size={18} color={colors.primary} />
            }
          </Pressable>
        </View>

        {/* Backup List */}
        {loaded && backups.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
            <Database size={36} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center' }}>
              No hay backups todavía.{'\n'}Crea el primero con el botón de arriba.
            </Text>
          </View>
        )}

        {backups.map((backup, i) => (
          <Animated.View
            key={backup.date}
            entering={FadeInDown.delay(i * 50).springify()}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.textMuted + '20',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={14} color="#16A34A" />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                    {backup.date}
                  </Text>
                  {i === 0 && (
                    <View style={{ backgroundColor: '#16A34A20', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#16A34A' }}>ÚLTIMO</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                  {formatDate(backup.manifest.createdAt)} · {backup.manifest.appEnv}
                </Text>

                {/* Counts */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {Object.entries(backup.manifest.counts).slice(0, 5).map(([k, v]) => (
                    <View key={k} style={{ backgroundColor: colors.primary + '15', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '600' }}>
                        {k}: {v}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Restore button — only in dev */}
              {!isProd && (
                <Pressable
                  onPress={() => restoreBackup(backup.date)}
                  disabled={restoring === backup.date}
                  style={{
                    marginLeft: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#DC262615',
                    borderRadius: 10,
                    padding: 10,
                    width: 40,
                    height: 40,
                  }}
                >
                  {restoring === backup.date
                    ? <ActivityIndicator size="small" color="#DC2626" />
                    : <RotateCcw size={16} color="#DC2626" />
                  }
                </Pressable>
              )}
            </View>
          </Animated.View>
        ))}

        {/* Info box */}
        <View style={{
          marginTop: 8,
          backgroundColor: colors.primary + '10',
          borderRadius: 12,
          padding: 14,
          gap: 4,
        }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
            Cómo funcionan los backups
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, lineHeight: 16 }}>
            • Se crean automáticamente cada día a las 4 AM (Costa Rica).{'\n'}
            • Se guardan hasta 7 backups diarios (rotación automática).{'\n'}
            • Incluyen: usuarios, devocionales, streaks, inventario, completadas, tickets.{'\n'}
            • En PROD: solo descarga — nunca restauración automática.{'\n'}
            • En DEV: restauración disponible con botón ↩.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
