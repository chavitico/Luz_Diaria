// CountryPicker — compact modal country selector (ISO 3166-1 alpha-2 + flag emoji)
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, X, Check } from 'lucide-react-native';
import { useThemeColors } from '@/lib/store';

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  flag: string; // emoji
}

// Converts ISO 3166-1 alpha-2 code to flag emoji
export function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}

export const COUNTRIES: Country[] = [
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'CA', name: 'Canadá', flag: '🇨🇦' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
  { code: 'DO', name: 'República Dominicana', flag: '🇩🇴' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'PA', name: 'Panamá', flag: '🇵🇦' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'BE', name: 'Bélgica', flag: '🇧🇪' },
  { code: 'FR', name: 'Francia', flag: '🇫🇷' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'CH', name: 'Suiza', flag: '🇨🇭' },
];

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

interface CountryPickerProps {
  visible: boolean;
  selectedCode: string | null;
  onSelect: (country: Country) => void;
  onClose: () => void;
}

export function CountryPickerModal({ visible, selectedCode, onSelect, onClose }: CountryPickerProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [search]);

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  const handleSelect = (country: Country) => {
    setSearch('');
    onSelect(country);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: insets.bottom + 8,
            maxHeight: '80%',
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.primary + '15',
            }}
          >
            <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: colors.text }}>
              Selecciona tu país
            </Text>
            <Pressable
              onPress={handleClose}
              hitSlop={10}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.textMuted + '20',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Search */}
          <View
            style={{
              marginHorizontal: 16,
              marginVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.primary + '10',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: Platform.OS === 'ios' ? 10 : 4,
            }}
          >
            <Search size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar país..."
              placeholderTextColor={colors.textMuted}
              style={{ flex: 1, fontSize: 15, color: colors.text }}
              autoCorrect={false}
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = item.code === selectedCode;
              return (
                <Pressable
                  onPress={() => handleSelect(item)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 13,
                    backgroundColor: pressed
                      ? colors.primary + '10'
                      : isSelected
                      ? colors.primary + '08'
                      : 'transparent',
                  })}
                >
                  <Text style={{ fontSize: 22, marginRight: 14 }}>{item.flag}</Text>
                  <Text style={{ flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' }}>
                    {item.name}
                  </Text>
                  {isSelected && <Check size={18} color={colors.primary} strokeWidth={2.5} />}
                </Pressable>
              );
            }}
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: colors.primary + '08', marginHorizontal: 20 }} />
            )}
          />
        </View>
      </View>
    </Modal>
  );
}
