// Biblical Cards - Phase 1: 3 cards
// Phase 2 will add trading system for duplicates.
// imageUrl is optional — when present, the card renders remote artwork instead of local fallback.

export interface BiblicalCard {
  id: string;
  nameEs: string;
  nameEn: string;
  category: 'Personajes' | 'Objetos' | 'Lugares';
  descriptionEs: string;
  descriptionEn: string;
  verseRef: string;
  verseTextEs: string;
  visualHints: string[];
  // Gradient colors for the card face
  gradientColors: [string, string, string];
  accentColor: string;
  // Optional remote artwork. When present, rendered as the main illustration.
  // When absent, the local fallback visual (symbols + emoji) is used.
  imageUrl?: string;
  // Per-card decorative motif used by the local fallback renderer
  motif: {
    topSymbol: string;
    subtitleEs: string;
    subtitleEn: string;
    artEmoji: string;
    decorSymbols: [string, string, string];
    sheenColors: [string, string];
    // Corner ornament character
    cornerGlyph: string;
  };
}

export const BIBLICAL_CARDS: Record<string, BiblicalCard> = {
  david: {
    id: 'david',
    nameEs: 'David',
    nameEn: 'David',
    category: 'Personajes',
    descriptionEs: 'Pastor, músico y rey de Israel. Dios dijo que era un hombre conforme a Su corazón.',
    descriptionEn: 'Shepherd, musician and king of Israel. God said he was a man after His own heart.',
    verseRef: 'Hechos 13:22',
    verseTextEs: 'He hallado a David hijo de Isaí, varón conforme a mi corazón.',
    visualHints: ['harp', 'sling', 'shepherd'],
    gradientColors: ['#0D1B4F', '#1A2E6B', '#1A5276'],
    accentColor: '#D4AF37',
    motif: {
      topSymbol: '✦',
      subtitleEs: 'Rey de Israel',
      subtitleEn: 'King of Israel',
      artEmoji: '🎵',
      decorSymbols: ['𝄞', '✦', '⚜'],
      sheenColors: ['rgba(212,175,55,0.18)', 'rgba(212,175,55,0.04)'],
      cornerGlyph: '♜',
    },
  },
  moses: {
    id: 'moses',
    nameEs: 'Moisés',
    nameEn: 'Moses',
    category: 'Personajes',
    descriptionEs: 'Dios lo usó para liberar a Israel de Egipto y entregar los Diez Mandamientos.',
    descriptionEn: 'God used him to free Israel from Egypt and deliver the Ten Commandments.',
    verseRef: 'Éxodo 3:10',
    verseTextEs: 'Ven, y te enviaré a Faraón, para que saques de Egipto a mi pueblo.',
    visualHints: ['staff', 'mount sinai', 'tablets'],
    gradientColors: ['#2C1654', '#4A1880', '#6B2FA0'],
    accentColor: '#C9A227',
    motif: {
      topSymbol: '☩',
      subtitleEs: 'Profeta de Dios',
      subtitleEn: 'Prophet of God',
      artEmoji: '📜',
      decorSymbols: ['⚡', '✦', '🗿'],
      sheenColors: ['rgba(201,162,39,0.18)', 'rgba(180,100,220,0.06)'],
      cornerGlyph: '✡',
    },
  },
  ark: {
    id: 'ark',
    nameEs: 'Arca de Noé',
    nameEn: "Noah's Ark",
    category: 'Objetos',
    descriptionEs: 'El arca salvó a Noé y su familia del diluvio. Señal del pacto eterno de Dios.',
    descriptionEn: 'The ark saved Noah and his family from the flood — a sign of God\'s eternal covenant.',
    verseRef: 'Génesis 6:14',
    verseTextEs: 'Hazte un arca de madera de ciprés; harás aposentos en el arca.',
    visualHints: ['ark', 'rainbow', 'animals'],
    gradientColors: ['#0B3D2E', '#165A40', '#1E7A52'],
    accentColor: '#4DD9AC',
    motif: {
      topSymbol: '🌈',
      subtitleEs: 'Pacto Eterno',
      subtitleEn: 'Eternal Covenant',
      artEmoji: '⛵',
      decorSymbols: ['〰', '✦', '〰'],
      sheenColors: ['rgba(77,217,172,0.18)', 'rgba(56,142,60,0.06)'],
      cornerGlyph: '🕊',
    },
  },
};

export const ALL_CARD_IDS = Object.keys(BIBLICAL_CARDS);

export function getCard(id: string): BiblicalCard | undefined {
  return BIBLICAL_CARDS[id];
}
