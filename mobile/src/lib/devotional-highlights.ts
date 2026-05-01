import AsyncStorage from '@react-native-async-storage/async-storage';

export type HighlightColor =
  | 'yellow' | 'green' | 'blue' | 'pink' | 'purple'
  | 'orange' | 'teal' | 'red' | 'lime' | 'sky';

export const DEVOTIONAL_HIGHLIGHT_COLORS: {
  key: HighlightColor; bg: string; label: string; labelEn: string;
}[] = [
  { key: 'yellow', bg: '#FEF08A', label: 'Amarillo', labelEn: 'Yellow' },
  { key: 'green',  bg: '#BBF7D0', label: 'Verde',    labelEn: 'Green'  },
  { key: 'blue',   bg: '#BFDBFE', label: 'Azul',     labelEn: 'Blue'   },
  { key: 'pink',   bg: '#FBCFE8', label: 'Rosa',     labelEn: 'Pink'   },
  { key: 'purple', bg: '#DDD6FE', label: 'Morado',   labelEn: 'Purple' },
  { key: 'orange', bg: '#FED7AA', label: 'Naranja',  labelEn: 'Orange' },
  { key: 'teal',   bg: '#99F6E4', label: 'Teal',     labelEn: 'Teal'   },
  { key: 'red',    bg: '#FECACA', label: 'Rojo',     labelEn: 'Red'    },
  { key: 'lime',   bg: '#D9F99D', label: 'Lima',     labelEn: 'Lime'   },
  { key: 'sky',    bg: '#BAE6FD', label: 'Celeste',  labelEn: 'Sky'    },
];

export function getHighlightBg(color: HighlightColor): string {
  return DEVOTIONAL_HIGHLIGHT_COLORS.find(h => h.key === color)?.bg ?? 'transparent';
}

// { sentenceIndex (as string) → HighlightColor }
export type SentenceHighlightMap = Record<string, HighlightColor>;

// sectionKey format: "${date}:${section}"  e.g. "2026-05-01:reflexion", "2026-05-01:meditar_0", "2026-05-01:prayer"
export type DevotionalHighlightStore = Record<string, SentenceHighlightMap>;

const STORAGE_KEY = 'devotional_highlights_v1';

export async function loadDevotionalHighlights(): Promise<DevotionalHighlightStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DevotionalHighlightStore) : {};
  } catch {
    return {};
  }
}

export async function saveDevotionalHighlights(store: DevotionalHighlightStore): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

// Split prose into sentences on . ! ? followed by space, newline, or end of string.
export function splitIntoSentences(text: string): string[] {
  if (!text?.trim()) return [];
  const sentences: string[] = [];
  let current = '';
  for (let i = 0; i < text.length; i++) {
    current += text[i];
    const ch = text[i];
    const next = text[i + 1];
    if ((ch === '.' || ch === '!' || ch === '?') && (!next || next === ' ' || next === '\n')) {
      const trimmed = current.trim();
      if (trimmed.length > 1) sentences.push(trimmed);
      current = '';
      if (next === ' ' || next === '\n') i++;
    }
  }
  const remaining = current.trim();
  if (remaining.length > 1) sentences.push(remaining);
  return sentences.length > 0 ? sentences : [text];
}
