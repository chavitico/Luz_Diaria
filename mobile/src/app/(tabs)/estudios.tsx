import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Clock, BookOpen, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/lib/store';
import { STUDIES_CATALOG } from '@/lib/studies/catalog';

export default function EstudiosScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + 16,
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: colors.background,
      }}>
        <Text style={{
          fontSize: 28,
          fontWeight: '800',
          color: colors.text,
          letterSpacing: -0.5,
        }}>
          Estudios Bíblicos
        </Text>
        <Text style={{
          fontSize: 14,
          color: colors.textMuted,
          marginTop: 4,
        }}>
          Estudios profundos para crecer en la fe
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 72,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {STUDIES_CATALOG.map((study) => (
          <Pressable
            key={study.id}
            onPress={() => router.push({ pathname: '/study-reader', params: { id: study.id } } as any)}
            style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
          >
            <LinearGradient
              colors={['#1A6FD4', '#0EA5E9', '#38BDF8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 20,
                padding: 24,
                minHeight: 180,
                justifyContent: 'space-between',
                overflow: 'hidden',
              }}
            >
              {/* Top row: emoji + chip */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 36 }}>{study.emoji}</Text>
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.22)',
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
                  {study.title}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.85)',
                  marginTop: 6,
                  lineHeight: 20,
                }}>
                  {study.subtitle}
                </Text>
              </View>

              {/* Bottom row: time + arrow */}
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
                  backgroundColor: 'rgba(255,255,255,0.18)',
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
                    Comenzar
                  </Text>
                  <ChevronRight size={16} color="#fff" strokeWidth={2.5} />
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
