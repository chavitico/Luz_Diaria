// Biblical Cards - Phase 1: 3 cards
// Phase 2 will add trading system for duplicates.

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
    gradientColors: ['#1A237E', '#283593', '#1565C0'],
    accentColor: '#FFD700',
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
    gradientColors: ['#4A148C', '#6A1B9A', '#7B1FA2'],
    accentColor: '#E040FB',
  },
  ark: {
    id: 'ark',
    nameEs: 'Arca de Noé',
    nameEn: "Noah's Ark",
    category: 'Objetos',
    descriptionEs: 'El arca salvó a Noé y su familia del diluvio.',
    descriptionEn: "The ark saved Noah and his family from the flood.",
    verseRef: 'Génesis 6:14',
    verseTextEs: 'Hazte un arca de madera de ciprés; harás aposentos en el arca.',
    visualHints: ['ark', 'rainbow', 'animals'],
    gradientColors: ['#1B5E20', '#2E7D32', '#388E3C'],
    accentColor: '#69F0AE',
  },
};

export const ALL_CARD_IDS = Object.keys(BIBLICAL_CARDS);

export function getCard(id: string): BiblicalCard | undefined {
  return BIBLICAL_CARDS[id];
}
