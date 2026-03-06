// Biblical Cards — Phase 1: 6 cards
// Phase 2 will add trading system for duplicates.
// imageUrl is optional — when present, the card renders remote artwork instead of local fallback.

export interface BiblicalCard {
  id: string;
  nameEs: string;
  nameEn: string;
  category: 'Personajes' | 'Objetos' | 'Eventos';
  descriptionEs: string;
  descriptionEn: string;
  verseRef: string;
  verseTextEs: string;
  // New enriched lore fields
  datoDestacadoEs: string;
  significadoBiblicoEs: string;
  visualHints: string[];
  // Gradient colors for the card face
  gradientColors: [string, string, string];
  accentColor: string;
  // Optional remote artwork. When present, rendered as the main illustration.
  imageUrl?: string;
  // Per-card decorative motif used by the local fallback renderer
  motif: {
    topSymbol: string;
    subtitleEs: string;
    subtitleEn: string;
    artEmoji: string;
    decorSymbols: [string, string, string];
    sheenColors: [string, string];
    cornerGlyph: string;
  };
}

export const BIBLICAL_CARDS: Record<string, BiblicalCard> = {
  david: {
    id: 'david',
    nameEs: 'David',
    nameEn: 'David',
    category: 'Personajes',
    descriptionEs: 'Pastor, músico, guerrero y rey. David venció a Goliat y fue llamado un hombre conforme al corazón de Dios.',
    descriptionEn: 'Shepherd, musician, warrior and king. David defeated Goliath and was called a man after God\'s own heart.',
    verseRef: 'Hechos 13:22',
    verseTextEs: 'He hallado a David hijo de Isaí, varón conforme a mi corazón.',
    datoDestacadoEs: 'Escribió muchos de los Salmos más conocidos de la Biblia.',
    significadoBiblicoEs: 'Representa adoración, valentía, arrepentimiento genuino y liderazgo guiado por Dios.',
    visualHints: ['harp', 'sling', 'shepherd', 'crown'],
    gradientColors: ['#0C1850', '#162E82', '#1C3D9E'],
    accentColor: '#D4AF37',
    // Custom illustration — David card artwork
    imageUrl: 'https://images.composerapi.com/019c33a9-4a45-71bd-8908-f785cc52f6a1/assets/images/image_1772839374_1772839382183_019cc576-2ca7-734e-b019-1c199427b8f0.png',
    motif: {
      topSymbol: '✦',
      subtitleEs: 'Rey de Israel',
      subtitleEn: 'King of Israel',
      artEmoji: '🎵',
      decorSymbols: ['𝄞', '✦', '⚜'],
      sheenColors: ['rgba(212,175,55,0.28)', 'rgba(212,175,55,0.06)'],
      cornerGlyph: '♜',
    },
  },
  moses: {
    id: 'moses',
    nameEs: 'Moisés',
    nameEn: 'Moses',
    category: 'Personajes',
    descriptionEs: 'Dios lo llamó desde la zarza ardiente para sacar a Israel de Egipto y guiarlo hacia la libertad.',
    descriptionEn: 'God called him from the burning bush to lead Israel out of Egypt toward freedom.',
    verseRef: 'Éxodo 3:10',
    verseTextEs: 'Ven, y te enviaré a Faraón, para que saques de Egipto a mi pueblo.',
    datoDestacadoEs: 'Recibió la Ley en el monte Sinaí y fue uno de los líderes más importantes del Antiguo Testamento.',
    significadoBiblicoEs: 'Representa obediencia al llamado de Dios, liberación y dirección divina.',
    visualHints: ['staff', 'mount sinai', 'tablets', 'burning bush'],
    gradientColors: ['#2C1654', '#4A1880', '#6B2FA0'],
    accentColor: '#C9A227',
    // Moses near burning bush — desert with glowing divine fire
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=85&fit=crop',
    motif: {
      topSymbol: '☩',
      subtitleEs: 'Profeta de Dios',
      subtitleEn: 'Prophet of God',
      artEmoji: '📜',
      decorSymbols: ['⚡', '✦', '🗿'],
      sheenColors: ['rgba(201,162,39,0.28)', 'rgba(180,100,220,0.08)'],
      cornerGlyph: '✡',
    },
  },
  ark: {
    id: 'ark',
    nameEs: 'Arca de Noé',
    nameEn: "Noah's Ark",
    category: 'Objetos',
    descriptionEs: 'El arca preservó a Noé, su familia y la vida animal durante el diluvio.',
    descriptionEn: 'The ark preserved Noah, his family and animal life through the flood.',
    verseRef: 'Génesis 6:14',
    verseTextEs: 'Hazte un arca de madera de ciprés; harás aposentos en el arca.',
    datoDestacadoEs: 'Fue construida por obediencia a Dios, aun antes de que la lluvia comenzara.',
    significadoBiblicoEs: 'Representa salvación, pacto, refugio y fe obediente.',
    visualHints: ['ark', 'rainbow', 'animals', 'dove'],
    gradientColors: ['#0B3D2E', '#165A40', '#1E7A52'],
    accentColor: '#4DD9AC',
    motif: {
      topSymbol: '🌈',
      subtitleEs: 'Pacto Eterno',
      subtitleEn: 'Eternal Covenant',
      artEmoji: '⛵',
      decorSymbols: ['〰', '✦', '〰'],
      sheenColors: ['rgba(77,217,172,0.28)', 'rgba(56,142,60,0.08)'],
      cornerGlyph: '🕊',
    },
  },
  espada_espiritu: {
    id: 'espada_espiritu',
    nameEs: 'Espada del Espíritu',
    nameEn: 'Sword of the Spirit',
    category: 'Objetos',
    descriptionEs: 'La Palabra de Dios es llamada la espada del Espíritu, un arma espiritual para la verdad y la victoria.',
    descriptionEn: 'The Word of God is called the sword of the Spirit — a spiritual weapon for truth and victory.',
    verseRef: 'Efesios 6:17',
    verseTextEs: 'Tomad el yelmo de la salvación, y la espada del Espíritu, que es la palabra de Dios.',
    datoDestacadoEs: 'Forma parte de la armadura de Dios descrita por Pablo.',
    significadoBiblicoEs: 'Representa verdad, autoridad espiritual y defensa contra el engaño.',
    visualHints: ['sword', 'light', 'armor', 'scripture'],
    gradientColors: ['#0A1828', '#0E2A50', '#162E6A'],
    accentColor: '#A8C8F0',
    // Epic raised sword with divine light — dramatic dark background, silver + blue palette
    imageUrl: 'https://images.unsplash.com/photo-1531251445707-1f000e1e87d0?w=600&q=85&fit=crop',
    motif: {
      topSymbol: '⚔',
      subtitleEs: 'Armadura de Dios',
      subtitleEn: 'Armor of God',
      artEmoji: '⚔️',
      decorSymbols: ['✦', '⚔', '✦'],
      sheenColors: ['rgba(168,200,240,0.30)', 'rgba(100,160,220,0.08)'],
      cornerGlyph: '🛡',
    },
  },
  arpa_david: {
    id: 'arpa_david',
    nameEs: 'Arpa de David',
    nameEn: "David's Harp",
    category: 'Objetos',
    descriptionEs: 'David tocaba el arpa y Saúl hallaba alivio. Su música ministraba paz en tiempos de tormento.',
    descriptionEn: "David played the harp and Saul found relief. His music ministered peace in times of torment.",
    verseRef: '1 Samuel 16:23',
    verseTextEs: 'Tomaba David el arpa, y tocaba con su mano; y Saúl tenía alivio y estaba mejor.',
    datoDestacadoEs: 'La adoración de David no era solo arte; era una expresión espiritual poderosa.',
    significadoBiblicoEs: 'Representa adoración, consuelo y sensibilidad a la presencia de Dios.',
    visualHints: ['harp', 'golden strings', 'music', 'worship'],
    gradientColors: ['#3B1A08', '#6B3510', '#8B4A18'],
    accentColor: '#F4C56A',
    motif: {
      topSymbol: '𝄞',
      subtitleEs: 'Adoración Real',
      subtitleEn: 'Royal Worship',
      artEmoji: '🎶',
      decorSymbols: ['♪', '✦', '♫'],
      sheenColors: ['rgba(244,197,106,0.30)', 'rgba(220,160,50,0.08)'],
      cornerGlyph: '♪',
    },
  },
  zarza_ardiente: {
    id: 'zarza_ardiente',
    nameEs: 'Zarza Ardiente',
    nameEn: 'Burning Bush',
    category: 'Eventos',
    descriptionEs: 'Dios se manifestó a Moisés en una zarza que ardía sin consumirse.',
    descriptionEn: 'God revealed Himself to Moses in a bush that burned without being consumed.',
    verseRef: 'Éxodo 3:2',
    verseTextEs: 'Y se le apareció el ángel de Jehová en una llama de fuego en medio de una zarza.',
    datoDestacadoEs: 'Allí comenzó el llamado que cambiaría la historia de Israel.',
    significadoBiblicoEs: 'Representa llamado divino, santidad y revelación de Dios.',
    visualHints: ['burning bush', 'flame', 'desert', 'divine light'],
    gradientColors: ['#2A0E00', '#5C1F00', '#8B3300'],
    accentColor: '#FF7A2A',
    motif: {
      topSymbol: '🔥',
      subtitleEs: 'Llamado Divino',
      subtitleEn: 'Divine Calling',
      artEmoji: '🔥',
      decorSymbols: ['✦', '🔥', '✦'],
      sheenColors: ['rgba(255,122,42,0.30)', 'rgba(220,80,20,0.08)'],
      cornerGlyph: '✡',
    },
  },
};

export const ALL_CARD_IDS = Object.keys(BIBLICAL_CARDS);

export function getCard(id: string): BiblicalCard | undefined {
  return BIBLICAL_CARDS[id];
}
