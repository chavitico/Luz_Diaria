import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Clock, BookOpen, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors, useLanguage } from '@/lib/store';
import { STUDIES_CATALOG } from '@/lib/studies/catalog';

type Filter = 'all' | 'pending' | 'completed';

export default function EstudiosScreen() {
  const colors = useThemeColors();
  const language = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>('all');

  // Load completion status for all studies on mount and when returning to screen
  useEffect(() => {
    let active = true;
    const load = async () => {
      const entries = await Promise.all(
        STUDIES_CATALOG.map((s) =>
          AsyncStorage.getItem(`study_complete:${s.id}`).then((v) => ({ id: s.id, done: !!v }))
        )
      );
      if (!active) return;
      setCompletedIds(new Set(entries.filter((e) => e.done).map((e) => e.id)));
    };
    load();
    return () => { active = false; };
  }, []);

  const filteredStudies = STUDIES_CATALOG.filter((s) => {
    if (filter === 'completed') return completedIds.has(s.id);
    if (filter === 'pending') return !completedIds.has(s.id);
    return true;
  });

  const filters: { key: Filter; label: string }[] = language === 'en'
    ? [
        { key: 'all', label: 'All' },
        { key: 'pending', label: 'Pending' },
        { key: 'completed', label: 'Completed' },
      ]
    : [
        { key: 'all', label: 'Todos' },
        { key: 'pending', label: 'Pendientes' },
        { key: 'completed', label: 'Completados' },
      ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + 16,
        paddingHorizontal: 20,
        paddingBottom: 12,
        backgroundColor: colors.background,
      }}>
        <Text style={{
          fontSize: 28,
          fontWeight: '800',
          color: colors.text,
          letterSpacing: -0.5,
        }}>
          {language === 'en' ? 'Biblical Studies' : 'Estudios Bíblicos'}
        </Text>
        <Text style={{
          fontSize: 14,
          color: colors.textMuted,
          marginTop: 4,
        }}>
          {language === 'en' ? 'Deep studies to grow in faith' : 'Estudios profundos para crecer en la fe'}
        </Text>

        {/* Filter chips */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          {filters.map(({ key, label }) => {
            const active = filter === key;
            return (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.8 : 1,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.textMuted + '30',
                })}
              >
                <Text style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: active ? '#fff' : colors.textMuted,
                }}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 72,
          paddingTop: 8,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {filteredStudies.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 48 }}>
            <Text style={{ fontSize: 15, color: colors.textMuted, textAlign: 'center' }}>
              {filter === 'completed'
                ? (language === 'en' ? "You haven't completed any studies yet." : 'Todavía no has completado ningún estudio.')
                : (language === 'en' ? 'No pending studies.' : 'No hay estudios pendientes.')}
            </Text>
          </View>
        )}

        {filteredStudies.map((study) => {
          const done = completedIds.has(study.id);
          return (
            <Pressable
              key={study.id}
              onPress={() => router.push({ pathname: '/study-reader', params: { id: study.id } } as any)}
              style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
            >
              <View style={{
                borderRadius: 20,
                minHeight: 200,
                overflow: 'hidden',
              }}>
                {/* Background image */}
                <Image
                  source={{ uri: study.imageUrl }}
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0.72,
                  }}
                  resizeMode="cover"
                />

                {/* Dark gradient overlay */}
                <LinearGradient
                  colors={['rgba(10,30,60,0.55)', 'rgba(5,15,40,0.85)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                  }}
                />

                {/* Content */}
                <View style={{ padding: 24, justifyContent: 'space-between', minHeight: 200 }}>
                  {/* Top row: emoji + chip */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 36 }}>{study.emoji}</Text>
                    {done ? (
                      <View style={{
                        backgroundColor: '#16A34A',
                        borderRadius: 20,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        <CheckCircle2 size={11} color="#fff" strokeWidth={2.5} />
                        <Text style={{
                          fontSize: 10,
                          fontWeight: '800',
                          color: '#fff',
                          letterSpacing: 0.8,
                          textTransform: 'uppercase',
                        }}>
                          Completado
                        </Text>
                      </View>
                    ) : (
                      <View style={{
                        backgroundColor: 'rgba(255,255,255,0.18)',
                        borderRadius: 20,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        <BookOpen size={11} color="#fff" strokeWidth={2.5} />
                        <Text style={{
                          fontSize: 10,
                          fontWeight: '800',
                          color: '#fff',
                          letterSpacing: 0.8,
                          textTransform: 'uppercase',
                        }}>
                          Estudio Bíblico
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Title + subtitle */}
                  <View style={{ marginTop: 12 }}>
                    <Text style={{
                      fontSize: 24,
                      fontWeight: '800',
                      color: '#fff',
                      lineHeight: 30,
                      letterSpacing: -0.3,
                    }}>
                      {language === 'en' ? (study.title_en ?? study.title) : study.title}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.80)',
                      marginTop: 6,
                      lineHeight: 20,
                    }}>
                      {language === 'en' ? (study.subtitle_en ?? study.subtitle) : study.subtitle}
                    </Text>
                  </View>

                  {/* Bottom row: time + arrow/completado */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 20,
                  }}>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      borderRadius: 12,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                    }}>
                      <Clock size={12} color="#fff" strokeWidth={2.5} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>
                        {study.estimated_reading_minutes} MIN
                      </Text>
                    </View>

                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>
                        {done
                          ? (language === 'en' ? 'Re-read' : 'Releer')
                          : (language === 'en' ? 'Begin' : 'Comenzar')}
                      </Text>
                      <ChevronRight size={16} color="#fff" strokeWidth={2.5} />
                    </View>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
