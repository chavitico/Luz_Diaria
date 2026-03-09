// Biblical Cards — Phase 1: 6 standard cards + 1 special legendary + Pascua 2026 event set
// Phase 2 will add trading system for duplicates.
// imageUrl is optional — when present, the card renders remote artwork instead of local fallback.

export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface BiblicalCard {
  id: string;
  nameEs: string;
  nameEn: string;
  /** Category: what type of biblical subject this is */
  category: 'Personajes' | 'Objetos' | 'Eventos';
  /** Rarity tier — drives UI treatment and drop rates */
  rarity: CardRarity;
  /**
   * Whether this card is included in the standard random pack draw pool.
   * Set to false for special / event / legendary-only cards.
   */
  inStandardPool: boolean;
  /**
   * Album grouping — determines which collection tab the card appears in.
   *   'starter'       → Colección Inicial
   *   'pascua_2026'   → Historia de Pascua
   *   'secret_rewards'→ Cartas Secretas (reward-only, not in any pack)
   */
  albumGroup: 'starter' | 'pascua_2026' | 'secret_rewards';
  // ── Event metadata (optional) ────────────────────────────────────────────
  /** Slug for the event this card belongs to, e.g. "pascua" */
  event?: string;
  /** Versioned event set identifier, e.g. "pascua_2026" */
  eventSet?: string;
  /** Chronological order within the event set (1-based) */
  eventOrder?: number;
  // ─────────────────────────────────────────────────────────────────────────
  descriptionEs: string;
  descriptionEn: string;
  verseRef: string;
  verseTextEs: string;
  // Enriched lore fields
  datoDestacadoEs: string;
  significadoBiblicoEs: string;
  visualHints: string[];
  // Gradient colors for the card face
  gradientColors: [string, string, string];
  accentColor: string;
  // Optional remote artwork. When present, rendered as the main illustration.
  imageUrl?: string;
  /**
   * Focal point for the illustration crop (0–1 range).
   * 0.5 / 0.5 = centered (default).
   *
   * ARTWORK GENERATION GUIDELINES
   * ─────────────────────────────────────────────────────────────────────────
   * • Compose for a vertical trading-card crop (roughly 2:3 portrait ratio).
   * • Keep the main subject(s) inside a central safe zone:
   *     horizontal: 15%–85% of image width
   *     vertical:   10%–85% of image height
   * • Do NOT place faces, heads, or key action areas near the frame edge.
   * • Leave visual breathing room at top and bottom (≥ 10% padding).
   * • If the scene has multiple subjects, anchor the focal point between them.
   * • After generating, set imageFocusX / imageFocusY so the renderer centres
   *   the crop on the most important part of the scene.
   * ─────────────────────────────────────────────────────────────────────────
   */
  imageFocusX?: number;
  imageFocusY?: number;
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

// ─── Rarity display config ────────────────────────────────────────────────────
export const RARITY_CONFIG: Record<CardRarity, {
  labelEs: string;
  labelEn: string;
  color: string;       // text + border
  bg: string;          // chip background
  glow: string;        // shadow/glow color
}> = {
  common:    { labelEs: 'Común',     labelEn: 'Common',    color: '#9CA3AF', bg: 'rgba(156,163,175,0.18)', glow: 'rgba(156,163,175,0.30)' },
  rare:      { labelEs: 'Rara',      labelEn: 'Rare',      color: '#60A5FA', bg: 'rgba(96,165,250,0.18)',  glow: 'rgba(96,165,250,0.40)'  },
  epic:      { labelEs: 'Épica',     labelEn: 'Epic',      color: '#C084FC', bg: 'rgba(192,132,252,0.18)', glow: 'rgba(192,132,252,0.45)' },
  legendary: { labelEs: 'Legendaria',labelEn: 'Legendary', color: '#D4AF37', bg: 'rgba(212,175,55,0.20)',  glow: 'rgba(212,175,55,0.55)'  },
};

// ─────────────────────────────────────────────────────────────────────────────

export const BIBLICAL_CARDS: Record<string, BiblicalCard> = {
  david: {
    id: 'david',
    nameEs: 'David',
    nameEn: 'David',
    category: 'Personajes',
    rarity: 'rare',
    inStandardPool: true,
    albumGroup: 'starter',
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
    // Focus: shift slightly left + up to keep both David and Goliath's upper
    // bodies / heads in frame and keep the sling-and-rock action visible.
    imageFocusX: 0.5,
    imageFocusY: 0.28,
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
    rarity: 'rare',
    inStandardPool: true,
    albumGroup: 'starter',
    descriptionEs: 'Dios lo llamó desde la zarza ardiente para sacar a Israel de Egipto y guiarlo hacia la libertad.',
    descriptionEn: 'God called him from the burning bush to lead Israel out of Egypt toward freedom.',
    verseRef: 'Éxodo 3:10',
    verseTextEs: 'Ven, y te enviaré a Faraón, para que saques de Egipto a mi pueblo.',
    datoDestacadoEs: 'Recibió la Ley en el monte Sinaí y fue uno de los líderes más importantes del Antiguo Testamento.',
    significadoBiblicoEs: 'Representa obediencia al llamado de Dios, liberación y dirección divina.',
    visualHints: ['staff', 'mount sinai', 'tablets', 'burning bush'],
    gradientColors: ['#2C1654', '#4A1880', '#6B2FA0'],
    accentColor: '#C9A227',
    imageUrl: 'https://images.composerapi.com/019c33a9-4a45-71bd-8908-f785cc52f6a1/assets/images/image_1772851308_1772851309624_019cc62c-2c38-757b-b0b6-0a683b8ce07a.png',
    imageFocusX: 0.5,
    imageFocusY: 0.32,
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
    rarity: 'rare',
    inStandardPool: true,
    albumGroup: 'starter',
    descriptionEs: 'El arca preservó a Noé, su familia y la vida animal durante el diluvio.',
    descriptionEn: 'The ark preserved Noah, his family and animal life through the flood.',
    verseRef: 'Génesis 6:14',
    verseTextEs: 'Hazte un arca de madera de ciprés; harás aposentos en el arca.',
    datoDestacadoEs: 'Fue construida por obediencia a Dios, aun antes de que la lluvia comenzara.',
    significadoBiblicoEs: 'Representa salvación, pacto, refugio y fe obediente.',
    visualHints: ['ark', 'rainbow', 'animals', 'dove'],
    gradientColors: ['#0B3D2E', '#165A40', '#1E7A52'],
    accentColor: '#4DD9AC',
    imageUrl: 'https://images.composerapi.com/019c33a9-4a45-71bd-8908-f785cc52f6a1/assets/images/image_1772851341_1772851343433_019cc62c-b049-758a-bf0e-463f60d82391.png',
    imageFocusX: 0.5,
    imageFocusY: 0.35,
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
    rarity: 'epic',
    inStandardPool: true,
    albumGroup: 'starter',
    descriptionEs: 'La Palabra de Dios es llamada la espada del Espíritu, un arma espiritual para la verdad y la victoria.',
    descriptionEn: 'The Word of God is called the sword of the Spirit — a spiritual weapon for truth and victory.',
    verseRef: 'Efesios 6:17',
    verseTextEs: 'Tomad el yelmo de la salvación, y la espada del Espíritu, que es la palabra de Dios.',
    datoDestacadoEs: 'Forma parte de la armadura de Dios descrita por Pablo.',
    significadoBiblicoEs: 'Representa verdad, autoridad espiritual y defensa contra el engaño.',
    visualHints: ['sword', 'light', 'armor', 'scripture'],
    gradientColors: ['#0A1828', '#0E2A50', '#162E6A'],
    accentColor: '#A8C8F0',
    imageUrl: 'https://images.composerapi.com/019c33a9-4a45-71bd-8908-f785cc52f6a1/assets/images/image_1772851359_1772851360307_019cc62c-f233-71bb-a736-cd4af8414c87.png',
    imageFocusX: 0.5,
    imageFocusY: 0.35,
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
    rarity: 'rare',
    inStandardPool: true,
    albumGroup: 'starter',
    descriptionEs: 'David tocaba el arpa y Saúl hallaba alivio. Su música ministraba paz en tiempos de tormento.',
    descriptionEn: "David played the harp and Saul found relief. His music ministered peace in times of torment.",
    verseRef: '1 Samuel 16:23',
    verseTextEs: 'Tomaba David el arpa, y tocaba con su mano; y Saúl tenía alivio y estaba mejor.',
    datoDestacadoEs: 'La adoración de David no era solo arte; era una expresión espiritual poderosa.',
    significadoBiblicoEs: 'Representa adoración, consuelo y sensibilidad a la presencia de Dios.',
    visualHints: ['harp', 'golden strings', 'music', 'worship'],
    gradientColors: ['#3B1A08', '#6B3510', '#8B4A18'],
    accentColor: '#F4C56A',
    imageUrl: 'https://images.composerapi.com/019c33a9-4a45-71bd-8908-f785cc52f6a1/assets/images/image_1772851381_1772851383826_019cc62d-4e12-764c-81c5-e5e189b760b0.png',
    imageFocusX: 0.5,
    imageFocusY: 0.35,
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
    rarity: 'epic',
    inStandardPool: true,
    albumGroup: 'starter',
    descriptionEs: 'Dios se manifestó a Moisés en una zarza que ardía sin consumirse.',
    descriptionEn: 'God revealed Himself to Moses in a bush that burned without being consumed.',
    verseRef: 'Éxodo 3:2',
    verseTextEs: 'Y se le apareció el ángel de Jehová en una llama de fuego en medio de una zarza.',
    datoDestacadoEs: 'Allí comenzó el llamado que cambiaría la historia de Israel.',
    significadoBiblicoEs: 'Representa llamado divino, santidad y revelación de Dios.',
    visualHints: ['burning bush', 'flame', 'desert', 'divine light'],
    gradientColors: ['#2A0E00', '#5C1F00', '#8B3300'],
    accentColor: '#FF7A2A',
    imageUrl: 'https://images.composerapi.com/019c33a9-4a45-71bd-8908-f785cc52f6a1/assets/images/image_1772851416_1772851418326_019cc62d-d4d6-721b-9001-dcf88cc0fe1e.png',
    imageFocusX: 0.5,
    imageFocusY: 0.35,
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

  // ─── SPECIAL / UNRELEASED CARDS ─────────────────────────────────────────────
  // inStandardPool: false → never drawn from a normal sobre_biblico pack.
  // Will be distributed via special events or future mechanics.

  jesus_rey_reyes: {
    id: 'jesus_rey_reyes',
    nameEs: 'Jesús',
    nameEn: 'Jesus',
    category: 'Personajes',
    rarity: 'legendary',
    inStandardPool: false,
    albumGroup: 'starter',
    descriptionEs: 'Jesús es el Hijo de Dios, Salvador y Rey de Reyes. En Él hay vida, redención y victoria eterna.',
    descriptionEn: 'Jesus is the Son of God, Savior and King of Kings. In Him there is life, redemption, and eternal victory.',
    verseRef: 'Apocalipsis 19:16',
    verseTextEs: 'Y en su vestidura y en su muslo tiene escrito este nombre: REY DE REYES Y SEÑOR DE SEÑORES.',
    datoDestacadoEs: 'Su vida, muerte y resurrección transformaron la historia para siempre.',
    significadoBiblicoEs: 'Representa salvación, gracia, autoridad suprema y esperanza eterna.',
    visualHints: ['crown of thorns', 'white robe', 'divine light', 'resurrection', 'cross'],
    gradientColors: ['#1A1200', '#3D2B00', '#5C3F00'],
    accentColor: '#F5E27A',
    motif: {
      topSymbol: '✟',
      subtitleEs: 'Rey de Reyes',
      subtitleEn: 'King of Kings',
      artEmoji: '✝️',
      decorSymbols: ['✟', '✦', '✟'],
      sheenColors: ['rgba(245,226,122,0.40)', 'rgba(255,255,220,0.12)'],
      cornerGlyph: '♔',
    },
  },

  // ─── PASCUA 2026 EVENT SET ────────────────────────────────────────────────────
  // event: "pascua" | eventSet: "pascua_2026" | inStandardPool: false
  // Cards are sorted by eventOrder (1–14) in getEventSetCards().

  entrada_jerusalen: {
    id: 'entrada_jerusalen',
    nameEs: 'Entrada Triunfal',
    nameEn: 'Triumphal Entry',
    category: 'Eventos',
    rarity: 'rare',
    inStandardPool: false,
    albumGroup: 'pascua_2026',
    event: 'pascua',
    eventSet: 'pascua_2026',
    eventOrder: 1,
    imageUrl: 'https://images.composerapi.com/019c33a9-4a45-71bd-8908-f785cc52f6a1/assets/images/image_1772844070_1772844072869_019cc5bd-bfa5-70c7-a3ad-6047237ae38f.png',
    imageFocusX: 0.5,
    imageFocusY: 0.38,
    descriptionEs: 'Jesús entra en Jerusalén montado en un burrito mientras la multitud lo recibe como Rey.',
    descriptionEn: 'Jesus enters Jerusalem on a donkey as the crowd receives him as King.',
    verseRef: 'Mateo 21:9',
    verseTextEs: '¡Hosanna al Hijo de David! ¡Bendito el que viene en el nombre del Señor!',
    datoDestacadoEs: 'La multitud extendía mantos y ramas en el camino.',
    significadoBiblicoEs: 'Representa el cumplimiento de las profecías sobre el Mesías.',
    visualHints: ['donkey', 'palm branches', 'crowd', 'Jerusalem gate'],
    gradientColors: ['#1A2E0A', '#2D4F12', '#3D6618'],
    accentColor: '#7EC850',
    motif: {
      topSymbol: '✦',
      subtitleEs: 'Domingo de Ramos',
      subtitleEn: 'Palm Sunday',
      artEmoji: '🌿',
      decorSymbols: ['🌿', '✦', '🌿'],
      sheenColors: ['rgba(126,200,80,0.28)', 'rgba(80,160,40,0.08)'],
      cornerGlyph: '✦',
    },
  },

  burrito: {
    id: 'burrito',
    nameEs: 'El Burrito',
    nameEn: "The Donkey",
    category: 'Objetos',
    rarity: 'common',
    inStandardPool: false,
    albumGroup: 'pascua_2026',
    event: 'pascua',
    eventSet: 'pascua_2026',
    eventOrder: 2,
    imageUrl: 'https://images.composerapi.com/019c33a9-4a45-71bd-8908-f785cc52f6a1/assets/images/image_1772844100_1772844101916_019cc5be-311c-7077-929b-6080e0935e60.png',
    imageFocusX: 0.5,
    imageFocusY: 0.35,
    descriptionEs: 'El humilde animal que llevó a Jesús durante su entrada triunfal en Jerusalén.',
    descriptionEn: 'The humble animal that carried Jesus during his triumphal entry into Jerusalem.',
    verseRef: 'Lucas 19:30',
    verseTextEs: 'Id a la aldea de enfrente, en la cual entrareis y hallaréis un pollino atado.',
    datoDestacadoEs: 'Jesús eligió un burrito en lugar de un caballo de guerra.',
    significadoBiblicoEs: 'Simboliza humildad y paz.',
    visualHints: ['donkey', 'palm road', 'humble', 'Jerusalem'],
    gradientColors: ['#2A1F0E', '#4A3618', '#5E4520'],
    accentColor: '#C4975A',
    motif: {
      topSymbol: '🫏',
      subtitleEs: 'Humildad',
      subtitleEn: 'Humility',
      artEmoji: '🫏',
      decorSymbols: ['✦', '🫏', '✦'],
      sheenColors: ['rgba(196,151,90,0.28)', 'rgba(150,100,50,0.08)'],
      cornerGlyph: '✦',
    },
  },

  ultima_cena: {
    id: 'ultima_cena',
    nameEs: 'La Última Cena',
    nameEn: 'The Last Supper',
    category: 'Eventos',
    rarity: 'epic',
    inStandardPool: false,
    albumGroup: 'pascua_2026',
    event: 'pascua',
    eventSet: 'pascua_2026',
    eventOrder: 3,
    imageUrl: 'https://images.composerapi.com/019c33a9-4a45-71bd-8908-f785cc52f6a1/assets/images/image_1772846114_1772846116331_019cc5dc-edeb-7055-8af6-0475517658b4.png',
    imageFocusX: 0.5,
    imageFocusY: 0.4,
    descriptionEs: 'Jesús comparte el pan y el vino con sus discípulos antes de su arresto.',
    descriptionEn: 'Jesus shares bread and wine with his disciples before his arrest.',
    verseRef: 'Lucas 22:19',
    verseTextEs: 'Esto es mi cuerpo, que por vosotros es dado; haced esto en memoria de mí.',
    datoDestacadoEs: '"Haced esto en memoria de mí."',
    significadoBiblicoEs: 'Institución de la Santa Cena.',
    visualHints: ['bread', 'wine', 'table', 'twelve disciples', 'candlelight'],
    gradientColors: ['#1E0E00', '#3D1E00', '#5C2D00'],
    accentColor: '#E07B30',
    motif: {
      topSymbol: '✟',
      subtitleEs: 'Santa Cena',
      subtitleEn: 'Holy Communion',
      artEmoji: '🍞',
      decorSymbols: ['🍞', '✟', '🍷'],
      sheenColors: ['rgba(224,123,48,0.30)', 'rgba(180,80,20,0.08)'],
      cornerGlyph: '✟',
    },
  },

  getsemani: {
    id: 'getsemani',
    nameEs: 'Oración en Getsemaní',
    nameEn: 'Prayer at Gethsemane',
    category: 'Eventos',
    rarity: 'epic',
    inStandardPool: false,
    albumGroup: 'pascua_2026',
    event: 'pascua',
    eventSet: 'pascua_2026',
    eventOrder: 4,
    imageUrl: 'https://images.composerapi.com/019c33a9-4a45-71bd-8908-f785cc52f6a1/assets/images/image_1772847059_1772847060427_019cc5eb-55cb-7552-91e7-acfbfd98cba8.png',
    imageFocusX: 0.5,
    imageFocusY: 0.4,
    descriptionEs: 'Jesús ora con profunda angustia antes de su arresto.',
    descriptionEn: 'Jesus prays in deep anguish before his arrest.',
    verseRef: 'Mateo 26:39',
    verseTextEs: 'No sea como yo quiero, sino como tú.',
    datoDestacadoEs: '"No sea como yo quiero, sino como tú."',
    significadoBiblicoEs: 'Muestra obediencia total al Padre.',
    visualHints: ['olive garden', 'kneeling', 'moonlight', 'anguish', 'prayer'],
    gradientColors: ['#050E1A', '#0A1E36', '#102848'],
    accentColor: '#5B8DD9',
    motif: {
      topSymbol: '☩',
      subtitleEs: 'Obediencia',
      subtitleEn: 'Obedience',
      artEmoji: '🌙',
      decorSymbols: ['☩', '✦', '☩'],
      sheenColors: ['rgba(91,141,217,0.28)', 'rgba(50,90,160,0.08)'],
      cornerGlyph: '☩',
    },
  },

  judas: {
    id: 'judas',
    nameEs: 'La Traición de Judas',
    nameEn: 'The Betrayal of Judas',
    category: 'Personajes',
    rarity: 'rare',
    inStandardPool: false,
    albumGroup: 'pascua_2026',
    event: 'pascua',
    eventSet: 'pascua_2026',
    eventOrder: 5,
    imageUrl: 'https://images.composerapi.com/019c33a9-4a45-71bd-8908-f785cc52f6a1/assets/images/image_1772847082_1772847084638_019cc5eb-b45e-7628-9b4a-1d8bc27f254a.png',
    imageFocusX: 0.5,
    imageFocusY: 0.38,
    descriptionEs: 'Judas identifica a Jesús con un beso para entregarlo a los soldados.',
    descriptionEn: 'Judas identifies Jesus with a kiss to hand him over to the soldiers.',
    verseRef: 'Mateo 26:49',
    verseTextEs: '¡Salve, Maestro! Y le besó.',
    datoDestacadoEs: 'El beso de traición.',
    significadoBiblicoEs: 'Cumplimiento de las profecías.',
    visualHints: ['kiss', 'betrayal', 'soldiers', 'torchlight', 'thirty silver coins'],
    gradientColors: ['#1A0A00', '#360F00', '#501500'],
    accentColor: '#C0392B',
    motif: {
      topSymbol: '✦',
      subtitleEs: 'Traición',
      subtitleEn: 'Betrayal',
      artEmoji: '💋',
      decorSymbols: ['💰', '✦', '💔'],
      sheenColors: ['rgba(192,57,43,0.28)', 'rgba(140,30,20,0.08)'],
      cornerGlyph: '✦',
    },
  },

  arresto: {
    id: 'arresto',
    nameEs: 'Arresto de Jesús',
    nameEn: 'Arrest of Jesus',
    category: 'Eventos',
    rarity: 'common',
    inStandardPool: false,
    albumGroup: 'pascua_2026',
    event: 'pascua',
    eventSet: 'pascua_2026',
    eventOrder: 6,
    imageUrl: 'https://images.composerapi.com/019c33a9-4a45-71bd-8908-f785cc52f6a1/assets/images/image_1772847155_1772847156414_019cc5ec-ccbe-728c-91fa-b9136f10e227.png',
    imageFocusX: 0.5,
    imageFocusY: 0.4,
    descriptionEs: 'Jesús es arrestado por los soldados y llevado ante las autoridades.',
    descriptionEn: 'Jesus is arrested by soldiers and brought before the authorities.',
    verseRef: 'Juan 18:12',
    verseTextEs: 'La compañía de soldados prendió a Jesús y le ató.',
    datoDestacadoEs: 'Los discípulos se dispersan.',
    significadoBiblicoEs: 'Inicio del juicio injusto.',
    visualHints: ['soldiers', 'torches', 'bound hands', 'night', 'garden'],
    gradientColors: ['#0A0A14', '#141422', '#1E1E30'],
    accentColor: '#8888CC',
    motif: {
      topSymbol: '⛓',
      subtitleEs: 'Captura',
      subtitleEn: 'Captured',
      artEmoji: '⛓️',
      decorSymbols: ['⛓', '✦', '⛓'],
      sheenColors: ['rgba(136,136,204,0.24)', 'rgba(80,80,160,0.08)'],
      cornerGlyph: '⛓',
    },
  },

  poncio_pilato: {
    id: 'poncio_pilato',
    nameEs: 'Poncio Pilato',
    nameEn: 'Pontius Pilate',
    category: 'Personajes',
    rarity: 'rare',
    inStandardPool: false,
    albumGroup: 'pascua_2026',
    event: 'pascua',
    eventSet: 'pascua_2026',
    eventOrder: 7,
    imageUrl: 'https://images.composerapi.com/019c33a9-4a45-71bd-8908-f785cc52f6a1/assets/images/image_1772847174_1772847175747_019cc5ed-1843-737b-ac97-936acde40b79.png',
    imageFocusX: 0.5,
    imageFocusY: 0.38,
    descriptionEs: 'Gobernador romano que autorizó la crucifixión de Jesús.',
    descriptionEn: 'Roman governor who authorized the crucifixion of Jesus.',
    verseRef: 'Mateo 27:24',
    verseTextEs: 'Tomó agua y se lavó las manos delante de la multitud, diciendo: Inocente soy yo de la sangre de este justo.',
    datoDestacadoEs: 'Pilato se lava las manos ante la multitud.',
    significadoBiblicoEs: 'Representa la presión política frente a la verdad.',
    visualHints: ['Roman robes', 'stone basin', 'water', 'crowd', 'Jerusalem courtyard'],
    gradientColors: ['#1A1208', '#2E2010', '#3E2C14'],
    accentColor: '#C8A84B',
    motif: {
      topSymbol: '⚖',
      subtitleEs: 'Juicio',
      subtitleEn: 'Judgment',
      artEmoji: '⚖️',
      decorSymbols: ['⚖', '✦', '🏛'],
      sheenColors: ['rgba(200,168,75,0.28)', 'rgba(160,120,40,0.08)'],
      cornerGlyph: '⚖',
    },
  },

  barrabas: {
    id: 'barrabas',
    nameEs: 'Barrabás',
    nameEn: 'Barabbas',
    category: 'Personajes',
    rarity: 'common',
    inStandardPool: false,
    albumGroup: 'pascua_2026',
    event: 'pascua',
    eventSet: 'pascua_2026',
    eventOrder: 8,
    imageUrl: 'https://images.composerapi.com/019c33a9-4a45-71bd-8908-f785cc52f6a1/assets/images/image_1772847201_1772847205482_019cc5ed-8c6a-75ae-8a7e-e912b2918299.png',
    imageFocusX: 0.5,
    imageFocusY: 0.4,
    descriptionEs: 'Criminal liberado por la multitud en lugar de Jesús.',
    descriptionEn: 'Criminal released by the crowd instead of Jesus.',
    verseRef: 'Mateo 27:26',
    verseTextEs: 'Entonces les soltó a Barrabás; y habiendo azotado a Jesús, le entregó para ser crucificado.',
    datoDestacadoEs: 'El pueblo pidió la libertad de Barrabás.',
    significadoBiblicoEs: 'Imagen simbólica del pecador liberado mientras Cristo toma su lugar.',
    visualHints: ['prisoner', 'chains broken', 'crowd', 'freedom'],
    gradientColors: ['#140A0A', '#280F0F', '#3A1414'],
    accentColor: '#AA4444',
    motif: {
      topSymbol: '⛓',
      subtitleEs: 'El Libre',
      subtitleEn: 'The Freed',
      artEmoji: '🔓',
      decorSymbols: ['🔓', '✦', '⛓'],
      sheenColors: ['rgba(170,68,68,0.28)', 'rgba(120,40,40,0.08)'],
      cornerGlyph: '✦',
    },
  },

  camino_calvario: {
    id: 'camino_calvario',
    nameEs: 'Camino al Calvario',
    nameEn: 'Way of the Cross',
    category: 'Eventos',
    rarity: 'common',
    inStandardPool: false,
    albumGroup: 'pascua_2026',
    event: 'pascua',
    eventSet: 'pascua_2026',
    eventOrder: 9,
    imageUrl: 'https://images.composerapi.com/019c33a9-4a45-71bd-8908-f785cc52f6a1/assets/images/image_1772847222_1772847223507_019cc5ed-d2d3-760e-a7cf-97fdfd1fdaf7.png',
    imageFocusX: 0.5,
    imageFocusY: 0.4,
    descriptionEs: 'Jesús carga la cruz rumbo al lugar de la crucifixión.',
    descriptionEn: 'Jesus carries the cross toward the place of crucifixion.',
    verseRef: 'Lucas 23:26',
    verseTextEs: 'Y llevándole, tomaron a cierto Simón de Cirene que venía del campo, y le pusieron encima la cruz para que la llevase tras Jesús.',
    datoDestacadoEs: 'Simón de Cirene ayuda a llevar la cruz.',
    significadoBiblicoEs: 'Camino de sacrificio y redención.',
    visualHints: ['cross', 'cobblestone road', 'crowd watching', 'Simon of Cyrene', 'Jerusalem street'],
    gradientColors: ['#1A1008', '#301E0C', '#452810'],
    accentColor: '#B07840',
    motif: {
      topSymbol: '✟',
      subtitleEs: 'Vía Crucis',
      subtitleEn: 'Via Crucis',
      artEmoji: '✝️',
      decorSymbols: ['✟', '✦', '✟'],
      sheenColors: ['rgba(176,120,64,0.28)', 'rgba(130,80,30,0.08)'],
      cornerGlyph: '✟',
    },
  },

  crucifixion: {
    id: 'crucifixion',
    nameEs: 'Jesús en la Cruz',
    nameEn: 'Jesus on the Cross',
    category: 'Eventos',
    rarity: 'legendary',
    inStandardPool: false,
    albumGroup: 'pascua_2026',
    event: 'pascua',
    eventSet: 'pascua_2026',
    eventOrder: 10,
    imageUrl: 'https://images.composerapi.com/019c33a9-4a45-71bd-8908-f785cc52f6a1/assets/images/image_1772847253_1772847254831_019cc5ee-4d2f-774e-be0a-6d55d6497ea8.png',
    imageFocusX: 0.5,
    imageFocusY: 0.35,
    descriptionEs: 'Jesús entrega su vida en la cruz por la salvación del mundo.',
    descriptionEn: 'Jesus gives his life on the cross for the salvation of the world.',
    verseRef: 'Lucas 23:46',
    verseTextEs: 'Padre, en tus manos encomiendo mi espíritu.',
    datoDestacadoEs: '"Padre, en tus manos encomiendo mi espíritu."',
    significadoBiblicoEs: 'El sacrificio central de la fe cristiana.',
    visualHints: ['cross', 'Golgotha', 'dark sky', 'crown of thorns', 'divine light'],
    gradientColors: ['#1A0000', '#380000', '#500000'],
    accentColor: '#CC3333',
    motif: {
      topSymbol: '✟',
      subtitleEs: 'Sacrificio Eterno',
      subtitleEn: 'Eternal Sacrifice',
      artEmoji: '✝️',
      decorSymbols: ['✟', '✦', '✟'],
      sheenColors: ['rgba(204,51,51,0.35)', 'rgba(160,20,20,0.10)'],
      cornerGlyph: '✟',
    },
  },

  velo_rasgado: {
    id: 'velo_rasgado',
    nameEs: 'El Velo Rasgado',
    nameEn: 'The Torn Veil',
    category: 'Eventos',
    rarity: 'epic',
    inStandardPool: false,
    albumGroup: 'pascua_2026',
    event: 'pascua',
    eventSet: 'pascua_2026',
    eventOrder: 11,
    imageUrl: 'https://images.composerapi.com/019c33a9-4a45-71bd-8908-f785cc52f6a1/assets/images/image_1772847502_1772847503900_019cc5f2-1a1c-718f-b977-2d8665f41d56.png',
    imageFocusX: 0.5,
    imageFocusY: 0.4,
    descriptionEs: 'El velo del templo se rasga cuando Jesús muere.',
    descriptionEn: 'The temple veil tears in two when Jesus dies.',
    verseRef: 'Mateo 27:51',
    verseTextEs: 'El velo del templo se rasgó en dos, de arriba abajo.',
    datoDestacadoEs: 'El acceso directo a Dios queda abierto.',
    significadoBiblicoEs: 'Fin de la separación entre Dios y la humanidad.',
    visualHints: ['temple veil', 'tearing', 'divine light', 'holy of holies', 'earthquake'],
    gradientColors: ['#1A1200', '#342400', '#4A3300'],
    accentColor: '#D4A030',
    motif: {
      topSymbol: '✟',
      subtitleEs: 'Acceso a Dios',
      subtitleEn: 'Access to God',
      artEmoji: '⚡',
      decorSymbols: ['✟', '⚡', '✟'],
      sheenColors: ['rgba(212,160,48,0.32)', 'rgba(170,110,20,0.08)'],
      cornerGlyph: '✟',
    },
  },

  tumba_sellada: {
    id: 'tumba_sellada',
    nameEs: 'La Tumba Sellada',
    nameEn: 'The Sealed Tomb',
    category: 'Eventos',
    rarity: 'rare',
    inStandardPool: false,
    albumGroup: 'pascua_2026',
    event: 'pascua',
    eventSet: 'pascua_2026',
    eventOrder: 12,
    imageUrl: 'https://images.composerapi.com/019c33a9-4a45-71bd-8908-f785cc52f6a1/assets/images/image_1772847524_1772847525704_019cc5f2-6f48-7032-bd58-132509c80ffe.png',
    imageFocusX: 0.5,
    imageFocusY: 0.4,
    descriptionEs: 'La tumba de Jesús es sellada y vigilada por soldados.',
    descriptionEn: 'The tomb of Jesus is sealed and guarded by soldiers.',
    verseRef: 'Mateo 27:66',
    verseTextEs: 'Fueron y aseguraron el sepulcro, sellando la piedra y poniendo la guardia.',
    datoDestacadoEs: 'La piedra es colocada en la entrada.',
    significadoBiblicoEs: 'Preparación para el milagro de la resurrección.',
    visualHints: ['stone tomb', 'sealed stone', 'Roman soldiers', 'dawn', 'garden'],
    gradientColors: ['#0A0A0A', '#161616', '#222222'],
    accentColor: '#888888',
    motif: {
      topSymbol: '⛰',
      subtitleEs: 'Silencio',
      subtitleEn: 'Silence',
      artEmoji: '🪨',
      decorSymbols: ['🪨', '✦', '🪨'],
      sheenColors: ['rgba(136,136,136,0.24)', 'rgba(90,90,90,0.08)'],
      cornerGlyph: '⛰',
    },
  },

  resurreccion: {
    id: 'resurreccion',
    nameEs: 'La Resurrección',
    nameEn: 'The Resurrection',
    category: 'Eventos',
    rarity: 'legendary',
    inStandardPool: false,
    albumGroup: 'pascua_2026',
    event: 'pascua',
    eventSet: 'pascua_2026',
    eventOrder: 13,
    imageUrl: 'https://images.composerapi.com/019c33a9-4a45-71bd-8908-f785cc52f6a1/assets/images/image_1772847551_1772847552311_019cc5f2-d737-7233-86a0-b987c26ddc07.png',
    imageFocusX: 0.5,
    imageFocusY: 0.35,
    descriptionEs: 'Jesús resucita al tercer día venciendo la muerte.',
    descriptionEn: 'Jesus rises on the third day, conquering death.',
    verseRef: 'Mateo 28:6',
    verseTextEs: 'No está aquí, pues ha resucitado, como dijo. Venid, ved el lugar donde fue puesto el Señor.',
    datoDestacadoEs: '"No está aquí, pues ha resucitado."',
    significadoBiblicoEs: 'La victoria definitiva sobre el pecado y la muerte.',
    visualHints: ['empty tomb', 'open stone', 'blazing light', 'angel', 'white linen'],
    gradientColors: ['#1A1400', '#3D3200', '#604E00'],
    accentColor: '#F5D060',
    motif: {
      topSymbol: '✟',
      subtitleEs: '¡Resucitó!',
      subtitleEn: 'He is Risen!',
      artEmoji: '☀️',
      decorSymbols: ['✟', '☀️', '✟'],
      sheenColors: ['rgba(245,208,96,0.40)', 'rgba(220,170,40,0.12)'],
      cornerGlyph: '☀',
    },
  },

  // ─── SECRET COLLECTION REWARD CARD ─────────────────────────────────────────
  // This card is NOT in any pack pool. It can only be obtained by completing
  // the Historia de Pascua collection (all 14 event cards).
  jesus_resucitado: {
    id: 'jesus_resucitado',
    nameEs: 'Jesús Resucitado',
    nameEn: 'The Risen Christ',
    category: 'Personajes',
    rarity: 'legendary',
    inStandardPool: false,
    albumGroup: 'secret_rewards',
    // Not part of the event set pool (reward-only)
    descriptionEs: 'Jesús venció a la muerte y se apareció a sus discípulos glorificado. Su resurrección es el fundamento de la fe cristiana.',
    descriptionEn: 'Jesus conquered death and appeared to His disciples in glory. His resurrection is the foundation of the Christian faith.',
    verseRef: 'Juan 20:17',
    verseTextEs: 'Sube a mi Padre y a vuestro Padre, a mi Dios y a vuestro Dios.',
    datoDestacadoEs: 'Carta secreta — obtenida completando la colección "Historia de Pascua".',
    significadoBiblicoEs: 'La resurrección es la victoria definitiva sobre el pecado y la muerte. Cristo vive, y en Él, vivimos.',
    visualHints: ['risen Christ', 'radiant light', 'empty tomb', 'glory', 'wounds of light'],
    gradientColors: ['#3A1800', '#6B3000', '#FFAA00'],
    accentColor: '#FFD700',
    motif: {
      topSymbol: '✦',
      subtitleEs: 'Colección Especial',
      subtitleEn: 'Special Collection',
      artEmoji: '☀️',
      decorSymbols: ['✝', '☀️', '✦'],
      sheenColors: ['rgba(255,215,0,0.38)', 'rgba(255,140,0,0.12)'],
      cornerGlyph: '✦',
    },
  },
  // ────────────────────────────────────────────────────────────────────────────

  tomas: {
    id: 'tomas',
    nameEs: 'Tomás el Incrédulo',
    nameEn: 'Doubting Thomas',
    category: 'Personajes',
    rarity: 'rare',
    inStandardPool: false,
    albumGroup: 'pascua_2026',
    event: 'pascua',
    eventSet: 'pascua_2026',
    eventOrder: 14,
    imageUrl: 'https://images.composerapi.com/019c33a9-4a45-71bd-8908-f785cc52f6a1/assets/images/image_1772847569_1772847570281_019cc5f3-1d69-7112-9e0f-d5e391048e95.png',
    imageFocusX: 0.5,
    imageFocusY: 0.4,
    descriptionEs: 'Tomás duda de la resurrección hasta ver a Jesús resucitado.',
    descriptionEn: 'Thomas doubts the resurrection until he sees the risen Jesus.',
    verseRef: 'Juan 20:27',
    verseTextEs: 'Pon aquí tu dedo, y mira mis manos; y acerca tu mano, y métela en mi costado.',
    datoDestacadoEs: '"Señor mío y Dios mío."',
    significadoBiblicoEs: 'La fe que nace después de la duda.',
    visualHints: ['hands', 'wounds', 'doubt', 'faith', 'risen Jesus'],
    gradientColors: ['#0A1020', '#121C38', '#1A2850'],
    accentColor: '#6090D0',
    motif: {
      topSymbol: '✦',
      subtitleEs: 'Fe y Duda',
      subtitleEn: 'Faith & Doubt',
      artEmoji: '🙏',
      decorSymbols: ['🙏', '✦', '✝'],
      sheenColors: ['rgba(96,144,208,0.28)', 'rgba(60,100,160,0.08)'],
      cornerGlyph: '✦',
    },
  },
};

export const ALL_CARD_IDS = Object.keys(BIBLICAL_CARDS);

/** Card IDs eligible for standard random pack draws */
export const STANDARD_POOL_IDS = Object.values(BIBLICAL_CARDS)
  .filter((c) => c.inStandardPool)
  .map((c) => c.id);

/** Card IDs belonging to the Pascua 2026 event set */
export const PASCUA_2026_POOL_IDS = Object.values(BIBLICAL_CARDS)
  .filter((c) => c.eventSet === 'pascua_2026')
  .map((c) => c.id);

/**
 * Returns all cards belonging to a given eventSet, sorted by eventOrder.
 * Used by the album to render event sections in chronological order.
 */
export function getEventSetCards(eventSet: string): BiblicalCard[] {
  return Object.values(BIBLICAL_CARDS)
    .filter((c) => c.eventSet === eventSet)
    .sort((a, b) => (a.eventOrder ?? 0) - (b.eventOrder ?? 0));
}

export function getCard(id: string): BiblicalCard | undefined {
  return BIBLICAL_CARDS[id];
}

/** Cards that live in the Cartas Secretas album group */
export const SECRET_REWARD_IDS = Object.values(BIBLICAL_CARDS)
  .filter((c) => c.albumGroup === 'secret_rewards')
  .map((c) => c.id);

/** Returns all cards for a given albumGroup */
export function getAlbumGroupCards(group: BiblicalCard['albumGroup']): BiblicalCard[] {
  return Object.values(BIBLICAL_CARDS).filter((c) => c.albumGroup === group);
}
