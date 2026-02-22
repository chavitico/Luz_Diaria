import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================
// THEMES (6 items - Original)
// ============================================
const THEMES = [
  {
    id: 'theme_amanecer',
    type: 'theme',
    nameEn: 'Sunrise',
    nameEs: 'Amanecer',
    descriptionEn: 'Warm light tones for a peaceful morning',
    descriptionEs: 'Tonos calidos de luz para una manana pacifica',
    pricePoints: 0,
    rarity: 'common',
    assetRef: 'amanecer',
    metadata: JSON.stringify({
      primary: '#E8A87C',
      secondary: '#C38D9E',
      accent: '#41B3A3',
      background: '#FDF6E3',
      backgroundDark: '#1A1A2E',
      surface: '#FFFFFF',
      surfaceDark: '#252542',
    }),
  },
  {
    id: 'theme_noche_paz',
    type: 'theme',
    nameEn: 'Peaceful Night',
    nameEs: 'Noche de Paz',
    descriptionEn: 'Deep blue tones for evening reflection',
    descriptionEs: 'Tonos azul profundo para reflexion nocturna',
    pricePoints: 400,
    rarity: 'rare',
    assetRef: 'noche_paz',
    metadata: JSON.stringify({
      primary: '#5C6BC0',
      secondary: '#7986CB',
      accent: '#9FA8DA',
      background: '#0D1B2A',
      backgroundDark: '#0D1B2A',
      surface: '#1B263B',
      surfaceDark: '#1B263B',
    }),
  },
  {
    id: 'theme_bosque',
    type: 'theme',
    nameEn: 'Forest',
    nameEs: 'Bosque',
    descriptionEn: 'Soft green nature vibes',
    descriptionEs: 'Suaves vibraciones verdes de la naturaleza',
    pricePoints: 300,
    rarity: 'common',
    assetRef: 'bosque',
    metadata: JSON.stringify({
      primary: '#2D6A4F',
      secondary: '#40916C',
      accent: '#95D5B2',
      background: '#F7FDF9',
      backgroundDark: '#0D1F17',
      surface: '#FFFFFF',
      surfaceDark: '#1A3328',
    }),
  },
  {
    id: 'theme_desierto',
    type: 'theme',
    nameEn: 'Desert',
    nameEs: 'Desierto',
    descriptionEn: 'Warm sand tones of the wilderness',
    descriptionEs: 'Calidos tonos arena del desierto',
    pricePoints: 350,
    rarity: 'common',
    assetRef: 'desierto',
    metadata: JSON.stringify({
      primary: '#D4A373',
      secondary: '#CCD5AE',
      accent: '#E9EDC9',
      background: '#FEFAE0',
      backgroundDark: '#2C2416',
      surface: '#FFFFFF',
      surfaceDark: '#3D3426',
    }),
  },
  {
    id: 'theme_promesa',
    type: 'theme',
    nameEn: 'Promise',
    nameEs: 'Promesa',
    descriptionEn: 'Royal violet for divine promises',
    descriptionEs: 'Violeta real para promesas divinas',
    pricePoints: 600,
    rarity: 'rare',
    assetRef: 'promesa',
    metadata: JSON.stringify({
      primary: '#7B2CBF',
      secondary: '#9D4EDD',
      accent: '#C77DFF',
      background: '#F8F4FC',
      backgroundDark: '#1A0A2E',
      surface: '#FFFFFF',
      surfaceDark: '#2D1B4E',
    }),
  },
  {
    id: 'theme_minimal',
    type: 'theme',
    nameEn: 'Minimal Light',
    nameEs: 'Minimal Claro',
    descriptionEn: 'Clean white and gray minimalist design',
    descriptionEs: 'Diseno minimalista blanco y gris',
    pricePoints: 200,
    rarity: 'common',
    assetRef: 'minimal',
    metadata: JSON.stringify({
      primary: '#374151',
      secondary: '#6B7280',
      accent: '#9CA3AF',
      background: '#F9FAFB',
      backgroundDark: '#111827',
      surface: '#FFFFFF',
      surfaceDark: '#1F2937',
    }),
  },
];

// ============================================
// THEMES V2 (14 items - Premium Palettes)
// ============================================
const THEMES_V2 = [
  {
    id: 'theme_amanecer_dorado',
    type: 'theme',
    nameEn: 'Golden Dawn',
    nameEs: 'Amanecer Dorado',
    descriptionEn: 'Radiant gold hues of a new beginning',
    descriptionEs: 'Tonos dorados radiantes de un nuevo comienzo',
    pricePoints: 500,
    rarity: 'rare',
    assetRef: 'amanecer_dorado',
    metadata: JSON.stringify({
      primary: '#D97706', secondary: '#F59E0B', accent: '#FCD34D',
      background: '#FFFBEB', backgroundDark: '#1C1917',
      surface: '#FFFFFF', surfaceDark: '#292524',
    }),
  },
  {
    id: 'theme_noche_profunda',
    type: 'theme',
    nameEn: 'Deep Night Peace',
    nameEs: 'Noche de Paz Profunda',
    descriptionEn: 'Serene darkness with celestial stars',
    descriptionEs: 'Oscuridad serena con estrellas celestiales',
    pricePoints: 550,
    rarity: 'rare',
    assetRef: 'noche_profunda',
    metadata: JSON.stringify({
      primary: '#4338CA', secondary: '#6366F1', accent: '#A5B4FC',
      background: '#0F0D1A', backgroundDark: '#0F0D1A',
      surface: '#1E1B2E', surfaceDark: '#1E1B2E',
    }),
  },
  {
    id: 'theme_bosque_sereno',
    type: 'theme',
    nameEn: 'Serene Forest',
    nameEs: 'Bosque Sereno',
    descriptionEn: 'Peaceful green sanctuary of nature',
    descriptionEs: 'Santuario verde y pacifico de la naturaleza',
    pricePoints: 300,
    rarity: 'common',
    assetRef: 'bosque_sereno',
    metadata: JSON.stringify({
      primary: '#059669', secondary: '#10B981', accent: '#6EE7B7',
      background: '#ECFDF5', backgroundDark: '#022C22',
      surface: '#FFFFFF', surfaceDark: '#064E3B',
    }),
  },
  {
    id: 'theme_desierto_suave',
    type: 'theme',
    nameEn: 'Soft Desert',
    nameEs: 'Desierto Suave',
    descriptionEn: 'Warm sand tones of contemplation',
    descriptionEs: 'Tonos arena calidos de contemplacion',
    pricePoints: 280,
    rarity: 'common',
    assetRef: 'desierto_suave',
    metadata: JSON.stringify({
      primary: '#C2410C', secondary: '#EA580C', accent: '#FED7AA',
      background: '#FFF7ED', backgroundDark: '#1C1410',
      surface: '#FFFFFF', surfaceDark: '#292018',
    }),
  },
  {
    id: 'theme_promesa_violeta',
    type: 'theme',
    nameEn: 'Violet Promise',
    nameEs: 'Promesa Violeta',
    descriptionEn: 'Royal purple of divine covenant',
    descriptionEs: 'Purpura real del pacto divino',
    pricePoints: 650,
    rarity: 'rare',
    assetRef: 'promesa_violeta',
    metadata: JSON.stringify({
      primary: '#7C3AED', secondary: '#8B5CF6', accent: '#C4B5FD',
      background: '#F5F3FF', backgroundDark: '#1E1033',
      surface: '#FFFFFF', surfaceDark: '#2E1B4B',
    }),
  },
  {
    id: 'theme_cielo_gloria',
    type: 'theme',
    nameEn: 'Sky of Glory',
    nameEs: 'Cielo de Gloria',
    descriptionEn: 'Majestic sky blue of heavenly realms',
    descriptionEs: 'Azul cielo majestuoso de reinos celestiales',
    pricePoints: 550,
    rarity: 'rare',
    assetRef: 'cielo_gloria',
    metadata: JSON.stringify({
      primary: '#0284C7', secondary: '#0EA5E9', accent: '#7DD3FC',
      background: '#F0F9FF', backgroundDark: '#082F49',
      surface: '#FFFFFF', surfaceDark: '#0C4A6E',
    }),
  },
  {
    id: 'theme_mar_misericordia',
    type: 'theme',
    nameEn: 'Sea of Mercy',
    nameEs: 'Mar de Misericordia',
    descriptionEn: 'Teal depths of endless grace',
    descriptionEs: 'Profundidades aguamarina de gracia infinita',
    pricePoints: 320,
    rarity: 'common',
    assetRef: 'mar_misericordia',
    metadata: JSON.stringify({
      primary: '#0D9488', secondary: '#14B8A6', accent: '#5EEAD4',
      background: '#F0FDFA', backgroundDark: '#042F2E',
      surface: '#FFFFFF', surfaceDark: '#134E4A',
    }),
  },
  {
    id: 'theme_fuego_espiritu',
    type: 'theme',
    nameEn: 'Fire of the Spirit',
    nameEs: 'Fuego del Espiritu',
    descriptionEn: 'Holy flames of divine presence',
    descriptionEs: 'Llamas santas de la presencia divina',
    pricePoints: 1500,
    rarity: 'epic',
    assetRef: 'fuego_espiritu',
    metadata: JSON.stringify({
      primary: '#DC2626', secondary: '#F97316', accent: '#FDE68A',
      background: '#FEF2F2', backgroundDark: '#1C1410',
      surface: '#FFFFFF', surfaceDark: '#2A1810',
    }),
  },
  {
    id: 'theme_jardin_gracia',
    type: 'theme',
    nameEn: 'Garden of Grace',
    nameEs: 'Jardin de Gracia',
    descriptionEn: 'Blooming garden of divine favor',
    descriptionEs: 'Jardin florido del favor divino',
    pricePoints: 380,
    rarity: 'common',
    assetRef: 'jardin_gracia',
    metadata: JSON.stringify({
      primary: '#DB2777', secondary: '#EC4899', accent: '#FBCFE8',
      background: '#FDF2F8', backgroundDark: '#1A0D14',
      surface: '#FFFFFF', surfaceDark: '#2D1520',
    }),
  },
  {
    id: 'theme_olivo_paz',
    type: 'theme',
    nameEn: 'Olive and Peace',
    nameEs: 'Olivo y Paz',
    descriptionEn: 'Ancient olive hues of harmony',
    descriptionEs: 'Tonos antiguos de olivo y armonia',
    pricePoints: 300,
    rarity: 'common',
    assetRef: 'olivo_paz',
    metadata: JSON.stringify({
      primary: '#65A30D', secondary: '#84CC16', accent: '#BEF264',
      background: '#F7FEE7', backgroundDark: '#1A2E05',
      surface: '#FFFFFF', surfaceDark: '#3F6212',
    }),
  },
  {
    id: 'theme_trono_azul',
    type: 'theme',
    nameEn: 'Blue Throne',
    nameEs: 'Trono Azul',
    descriptionEn: 'Royal blue of the heavenly throne',
    descriptionEs: 'Azul real del trono celestial',
    pricePoints: 600,
    rarity: 'rare',
    assetRef: 'trono_azul',
    metadata: JSON.stringify({
      primary: '#1D4ED8', secondary: '#3B82F6', accent: '#93C5FD',
      background: '#EFF6FF', backgroundDark: '#0F172A',
      surface: '#FFFFFF', surfaceDark: '#1E3A5F',
    }),
  },
  {
    id: 'theme_lampara_encendida',
    type: 'theme',
    nameEn: 'Burning Lamp',
    nameEs: 'Lampara Encendida',
    descriptionEn: 'Warm glow of the ever-burning lamp',
    descriptionEs: 'Resplandor calido de la lampara ardiente',
    pricePoints: 520,
    rarity: 'rare',
    assetRef: 'lampara_encendida',
    metadata: JSON.stringify({
      primary: '#B45309', secondary: '#D97706', accent: '#FDE68A',
      background: '#FFFBEB', backgroundDark: '#1C1712',
      surface: '#FFFFFF', surfaceDark: '#292418',
    }),
  },
  {
    id: 'theme_pergamino_antiguo',
    type: 'theme',
    nameEn: 'Ancient Parchment',
    nameEs: 'Pergamino Antiguo',
    descriptionEn: 'Timeless sepia of sacred scrolls',
    descriptionEs: 'Sepia atemporal de pergaminos sagrados',
    pricePoints: 350,
    rarity: 'common',
    assetRef: 'pergamino_antiguo',
    metadata: JSON.stringify({
      primary: '#A16207', secondary: '#CA8A04', accent: '#FEF08A',
      background: '#FEFCE8', backgroundDark: '#1A1608',
      surface: '#FFFFFF', surfaceDark: '#2E2810',
    }),
  },
  {
    id: 'theme_luz_celestial',
    type: 'theme',
    nameEn: 'Celestial Light',
    nameEs: 'Luz Celestial',
    descriptionEn: 'Ethereal glow from heavenly realms',
    descriptionEs: 'Resplandor etereo de los cielos',
    pricePoints: 1800,
    rarity: 'epic',
    assetRef: 'luz_celestial',
    metadata: JSON.stringify({
      primary: '#7C3AED', secondary: '#60A5FA', accent: '#FDE68A',
      background: '#FAFAFA', backgroundDark: '#0F0A1A',
      surface: '#FFFFFF', surfaceDark: '#1A1028',
    }),
  },
];

// ============================================
// AVATAR FRAMES (10 items)
// ============================================
const FRAMES = [
  { id: 'frame_dorado', type: 'frame', nameEn: 'Golden', nameEs: 'Dorado', descriptionEn: 'A prestigious golden frame', descriptionEs: 'Un prestigioso marco dorado', pricePoints: 300, rarity: 'rare', assetRef: '#FFD700' },
  { id: 'frame_plata', type: 'frame', nameEn: 'Silver', nameEs: 'Plata', descriptionEn: 'A classic silver frame', descriptionEs: 'Un clasico marco plateado', pricePoints: 200, rarity: 'common', assetRef: '#C0C0C0' },
  { id: 'frame_azul', type: 'frame', nameEn: 'Blue Hope', nameEs: 'Azul Esperanza', descriptionEn: 'A frame filled with hope', descriptionEs: 'Un marco lleno de esperanza', pricePoints: 250, rarity: 'common', assetRef: '#4A90D9' },
  { id: 'frame_verde', type: 'frame', nameEn: 'Green Life', nameEs: 'Verde Vida', descriptionEn: 'A vibrant green frame', descriptionEs: 'Un vibrante marco verde', pricePoints: 250, rarity: 'common', assetRef: '#4CAF50' },
  { id: 'frame_luz', type: 'frame', nameEn: 'Soft Light', nameEs: 'Luz Suave', descriptionEn: 'A gentle illuminating frame', descriptionEs: 'Un marco de luz suave', pricePoints: 350, rarity: 'rare', assetRef: '#FFF8DC' },
  { id: 'frame_corona', type: 'frame', nameEn: 'Leaf Crown', nameEs: 'Corona Hojas', descriptionEn: 'A natural crown of leaves', descriptionEs: 'Una corona natural de hojas', pricePoints: 400, rarity: 'rare', assetRef: '#228B22' },
  { id: 'frame_estrellas', type: 'frame', nameEn: 'Stars', nameEs: 'Estrellas', descriptionEn: 'A celestial frame of stars', descriptionEs: 'Un marco celestial de estrellas', pricePoints: 500, rarity: 'epic', assetRef: '#E6E6FA' },
  { id: 'frame_pergamino', type: 'frame', nameEn: 'Parchment', nameEs: 'Pergamino', descriptionEn: 'An ancient parchment frame', descriptionEs: 'Un marco de pergamino antiguo', pricePoints: 300, rarity: 'common', assetRef: '#D4B896' },
  { id: 'frame_fuego', type: 'frame', nameEn: 'Soft Fire', nameEs: 'Fuego Suave', descriptionEn: 'A warm flame frame', descriptionEs: 'Un marco de llama calida', pricePoints: 450, rarity: 'rare', assetRef: '#FF6B35' },
  { id: 'frame_cielo', type: 'frame', nameEn: 'Heaven', nameEs: 'Cielo', descriptionEn: 'A heavenly sky frame', descriptionEs: 'Un marco del cielo celestial', pricePoints: 600, rarity: 'epic', assetRef: '#87CEEB' },
];

// ============================================
// MUSIC TRACKS (13 items: 5 free + 8 premium)
// ============================================
const MUSIC_TRACKS = [
  // Free tracks
  { id: 'music_free_1', type: 'music', nameEn: 'Peaceful Piano', nameEs: 'Piano Tranquilo', descriptionEn: 'Calm piano melodies', descriptionEs: 'Melodias tranquilas de piano', pricePoints: 0, rarity: 'common', assetRef: 'peaceful_piano' },
  { id: 'music_free_2', type: 'music', nameEn: 'Gentle Stream', nameEs: 'Arroyo Suave', descriptionEn: 'Flowing water sounds', descriptionEs: 'Sonidos de agua fluyendo', pricePoints: 0, rarity: 'common', assetRef: 'gentle_stream' },
  { id: 'music_free_3', type: 'music', nameEn: 'Morning Birds', nameEs: 'Aves de la Manana', descriptionEn: 'Birdsong at dawn', descriptionEs: 'Canto de aves al amanecer', pricePoints: 0, rarity: 'common', assetRef: 'morning_birds' },
  { id: 'music_free_4', type: 'music', nameEn: 'Soft Strings', nameEs: 'Cuerdas Suaves', descriptionEn: 'Gentle string instruments', descriptionEs: 'Suaves instrumentos de cuerda', pricePoints: 0, rarity: 'common', assetRef: 'soft_strings' },
  { id: 'music_free_5', type: 'music', nameEn: 'Meditation', nameEs: 'Meditacion', descriptionEn: 'Deep meditation ambience', descriptionEs: 'Ambiente de meditacion profunda', pricePoints: 0, rarity: 'common', assetRef: 'meditation' },
  // Premium tracks
  { id: 'music_gratitud', type: 'music', nameEn: 'Gratitude Piano', nameEs: 'Piano Gratitud', descriptionEn: 'Piano for grateful hearts', descriptionEs: 'Piano para corazones agradecidos', pricePoints: 400, rarity: 'rare', assetRef: 'gratitude_piano' },
  { id: 'music_arpa_paz', type: 'music', nameEn: 'Peaceful Harp', nameEs: 'Arpa Paz', descriptionEn: 'Peaceful harp melodies', descriptionEs: 'Melodias pacificas de arpa', pricePoints: 500, rarity: 'rare', assetRef: 'peaceful_harp' },
  { id: 'music_cuerdas_esperanza', type: 'music', nameEn: 'Hope Strings', nameEs: 'Cuerdas Esperanza', descriptionEn: 'Hopeful string ensemble', descriptionEs: 'Ensamble de cuerdas esperanzador', pricePoints: 600, rarity: 'rare', assetRef: 'hope_strings' },
  { id: 'music_ambient_silencio', type: 'music', nameEn: 'Ambient Silence', nameEs: 'Ambient Silencio', descriptionEn: 'Peaceful ambient sounds', descriptionEs: 'Sonidos ambientales pacificos', pricePoints: 450, rarity: 'common', assetRef: 'ambient_silence' },
  { id: 'music_piano_amanecer', type: 'music', nameEn: 'Sunrise Piano', nameEs: 'Piano Amanecer', descriptionEn: 'Morning piano melodies', descriptionEs: 'Melodias de piano matutinas', pricePoints: 550, rarity: 'rare', assetRef: 'sunrise_piano' },
  { id: 'music_arpa_lluvia', type: 'music', nameEn: 'Rain Harp', nameEs: 'Arpa Lluvia Suave', descriptionEn: 'Harp with gentle rain', descriptionEs: 'Arpa con lluvia suave', pricePoints: 700, rarity: 'epic', assetRef: 'rain_harp' },
  { id: 'music_cuerdas_promesa', type: 'music', nameEn: 'Promise Strings', nameEs: 'Cuerdas Promesa', descriptionEn: 'Strings of divine promise', descriptionEs: 'Cuerdas de promesa divina', pricePoints: 800, rarity: 'epic', assetRef: 'promise_strings' },
  { id: 'music_ambient_noche', type: 'music', nameEn: 'Night Ambient', nameEs: 'Ambient Noche', descriptionEn: 'Peaceful night ambience', descriptionEs: 'Ambiente nocturno pacifico', pricePoints: 1200, rarity: 'epic', assetRef: 'night_ambient' },
];

// ============================================
// SPIRITUAL TITLES (12 items)
// ============================================
const TITLES = [
  { id: 'title_buscador', type: 'title', nameEn: 'Seeker of Light', nameEs: 'Buscador de Luz', descriptionEn: 'One who seeks divine light', descriptionEs: 'Aquel que busca la luz divina', pricePoints: 200, rarity: 'common', assetRef: '' },
  { id: 'title_corazon', type: 'title', nameEn: 'Grateful Heart', nameEs: 'Corazon Agradecido', descriptionEn: 'A heart full of gratitude', descriptionEs: 'Un corazon lleno de gratitud', pricePoints: 250, rarity: 'common', assetRef: '' },
  { id: 'title_caminando', type: 'title', nameEn: 'Walking in Faith', nameEs: 'Caminando en Fe', descriptionEn: 'Walking the path of faith', descriptionEs: 'Caminando el sendero de la fe', pricePoints: 300, rarity: 'common', assetRef: '' },
  { id: 'title_siervo', type: 'title', nameEn: 'Faithful Servant', nameEs: 'Siervo Fiel', descriptionEn: 'A devoted servant', descriptionEs: 'Un siervo devoto', pricePoints: 400, rarity: 'rare', assetRef: '' },
  { id: 'title_portador', type: 'title', nameEn: 'Hope Bearer', nameEs: 'Portador de Esperanza', descriptionEn: 'Carrier of hope', descriptionEs: 'Portador de esperanza', pricePoints: 350, rarity: 'rare', assetRef: '' },
  { id: 'title_amigo', type: 'title', nameEn: 'Friend of the Master', nameEs: 'Amigo del Maestro', descriptionEn: 'Close friend of the Master', descriptionEs: 'Amigo cercano del Maestro', pricePoints: 500, rarity: 'rare', assetRef: '' },
  { id: 'title_valiente', type: 'title', nameEn: 'Kingdom Warrior', nameEs: 'Valiente del Reino', descriptionEn: 'Brave warrior of the Kingdom', descriptionEs: 'Valiente guerrero del Reino', pricePoints: 600, rarity: 'epic', assetRef: '' },
  { id: 'title_sembrador', type: 'title', nameEn: 'Peace Sower', nameEs: 'Sembrador de Paz', descriptionEn: 'Sower of peace', descriptionEs: 'Sembrador de paz', pricePoints: 450, rarity: 'rare', assetRef: '' },
  { id: 'title_luz', type: 'title', nameEn: 'Light in the Storm', nameEs: 'Luz en la Tormenta', descriptionEn: 'Light during dark times', descriptionEs: 'Luz en tiempos oscuros', pricePoints: 550, rarity: 'rare', assetRef: '' },
  { id: 'title_guardian', type: 'title', nameEn: 'Guardian of the Word', nameEs: 'Guardian de la Palabra', descriptionEn: 'Protector of the Word', descriptionEs: 'Protector de la Palabra', pricePoints: 700, rarity: 'epic', assetRef: '' },
  { id: 'title_constructor', type: 'title', nameEn: 'Altar Builder', nameEs: 'Constructor de Altar', descriptionEn: 'Builder of spiritual altars', descriptionEs: 'Constructor de altares espirituales', pricePoints: 500, rarity: 'rare', assetRef: '' },
  { id: 'title_peregrino', type: 'title', nameEn: 'Pilgrim of Grace', nameEs: 'Peregrino de Gracia', descriptionEn: 'Pilgrim walking in grace', descriptionEs: 'Peregrino caminando en gracia', pricePoints: 400, rarity: 'rare', assetRef: '' },
];

// ============================================
// PREMIUM AVATARS (6 items - Original with price)
// ============================================
const AVATARS = [
  { id: 'avatar_rainbow', type: 'avatar', nameEn: 'Rainbow', nameEs: 'Arcoiris', descriptionEn: 'Promise of God', descriptionEs: 'Promesa de Dios', pricePoints: 200, rarity: 'rare', assetRef: '🌈' },
  { id: 'avatar_crown', type: 'avatar', nameEn: 'Crown', nameEs: 'Corona', descriptionEn: 'Crown of glory', descriptionEs: 'Corona de gloria', pricePoints: 500, rarity: 'epic', assetRef: '👑' },
  { id: 'avatar_angel', type: 'avatar', nameEn: 'Angel', nameEs: 'Angel', descriptionEn: 'Heavenly messenger', descriptionEs: 'Mensajero celestial', pricePoints: 300, rarity: 'rare', assetRef: '😇' },
  { id: 'avatar_olive', type: 'avatar', nameEn: 'Olive Branch', nameEs: 'Rama de Olivo', descriptionEn: 'Sign of peace', descriptionEs: 'Signo de paz', pricePoints: 250, rarity: 'rare', assetRef: '🫒' },
  { id: 'avatar_lamb', type: 'avatar', nameEn: 'Lamb', nameEs: 'Cordero', descriptionEn: 'Gentle and pure', descriptionEs: 'Gentil y puro', pricePoints: 400, rarity: 'rare', assetRef: '🐑' },
  { id: 'avatar_fish', type: 'avatar', nameEn: 'Fish', nameEs: 'Pez', descriptionEn: 'Early Christian symbol', descriptionEs: 'Simbolo cristiano primitivo', pricePoints: 150, rarity: 'common', assetRef: '🐟' },
];

// ============================================
// AVATARS V2 - Premium Illustrated Collection (24 items)
// ============================================
const AVATARS_V2 = [
  // Collection 1: Simbolos de Fe (8 items)
  { id: 'avatar_v2_paloma_paz', type: 'avatar', nameEn: 'Dove of Peace', nameEs: 'Paloma de Paz', descriptionEn: 'Premium illustrated dove with olive branch', descriptionEs: 'Paloma ilustrada premium con rama de olivo', pricePoints: 450, rarity: 'rare', assetRef: '🕊️', metadata: JSON.stringify({ collectionId: 'collection_v2_simbolos_fe', isV2: true }) },
  { id: 'avatar_v2_cruz_radiante', type: 'avatar', nameEn: 'Radiant Cross', nameEs: 'Cruz Radiante', descriptionEn: 'Glowing cross with divine rays', descriptionEs: 'Cruz resplandeciente con rayos divinos', pricePoints: 500, rarity: 'rare', assetRef: '✝️', metadata: JSON.stringify({ collectionId: 'collection_v2_simbolos_fe', isV2: true }) },
  { id: 'avatar_v2_lampara_aceite', type: 'avatar', nameEn: 'Oil Lamp', nameEs: 'Lampara de Aceite', descriptionEn: 'Ancient oil lamp burning bright', descriptionEs: 'Lampara de aceite antigua ardiendo brillante', pricePoints: 280, rarity: 'common', assetRef: '🪔', metadata: JSON.stringify({ collectionId: 'collection_v2_simbolos_fe', isV2: true }) },
  { id: 'avatar_v2_corona_vida', type: 'avatar', nameEn: 'Crown of Life', nameEs: 'Corona de Vida', descriptionEn: 'Majestic crown adorned with jewels', descriptionEs: 'Corona majestuosa adornada con joyas', pricePoints: 2500, rarity: 'epic', assetRef: '👑', metadata: JSON.stringify({ collectionId: 'collection_v2_simbolos_fe', isV2: true }) },
  { id: 'avatar_v2_biblia_abierta', type: 'avatar', nameEn: 'Open Bible', nameEs: 'Biblia Abierta', descriptionEn: 'Holy scriptures with radiant glow', descriptionEs: 'Escrituras santas con resplandor radiante', pricePoints: 320, rarity: 'common', assetRef: '📖', metadata: JSON.stringify({ collectionId: 'collection_v2_simbolos_fe', isV2: true }) },
  { id: 'avatar_v2_caliz', type: 'avatar', nameEn: 'Holy Chalice', nameEs: 'Caliz Sagrado', descriptionEn: 'Sacred cup of communion', descriptionEs: 'Copa sagrada de la comunion', pricePoints: 550, rarity: 'rare', assetRef: '🏆', metadata: JSON.stringify({ collectionId: 'collection_v2_simbolos_fe', isV2: true }) },
  { id: 'avatar_v2_ancla_esperanza', type: 'avatar', nameEn: 'Anchor of Hope', nameEs: 'Ancla de Esperanza', descriptionEn: 'Steadfast anchor representing hope', descriptionEs: 'Ancla firme representando esperanza', pricePoints: 480, rarity: 'rare', assetRef: '⚓', metadata: JSON.stringify({ collectionId: 'collection_v2_simbolos_fe', isV2: true }) },
  { id: 'avatar_v2_pan_uvas', type: 'avatar', nameEn: 'Bread and Grapes', nameEs: 'Pan y Uvas', descriptionEn: 'Communion bread with grapes', descriptionEs: 'Pan de comunion con uvas', pricePoints: 350, rarity: 'common', assetRef: '🍇', metadata: JSON.stringify({ collectionId: 'collection_v2_simbolos_fe', isV2: true }) },
  // Collection 2: Naturaleza Biblica (6 items)
  { id: 'avatar_v2_rama_olivo', type: 'avatar', nameEn: 'Olive Branch', nameEs: 'Rama de Olivo', descriptionEn: 'Lush olive branch of peace', descriptionEs: 'Exuberante rama de olivo de paz', pricePoints: 260, rarity: 'common', assetRef: '🌿', metadata: JSON.stringify({ collectionId: 'collection_v2_naturaleza', isV2: true }) },
  { id: 'avatar_v2_pez_ichthys', type: 'avatar', nameEn: 'Ichthys Fish', nameEs: 'Pez Ichthys', descriptionEn: 'Ornate Christian fish symbol', descriptionEs: 'Simbolo del pez cristiano ornamentado', pricePoints: 300, rarity: 'common', assetRef: '🐠', metadata: JSON.stringify({ collectionId: 'collection_v2_naturaleza', isV2: true }) },
  { id: 'avatar_v2_cordero', type: 'avatar', nameEn: 'Lamb of God', nameEs: 'Cordero de Dios', descriptionEn: 'Pure white lamb with halo', descriptionEs: 'Cordero blanco puro con aureola', pricePoints: 600, rarity: 'rare', assetRef: '🐑', metadata: JSON.stringify({ collectionId: 'collection_v2_naturaleza', isV2: true }) },
  { id: 'avatar_v2_leon', type: 'avatar', nameEn: 'Lion of Judah', nameEs: 'Leon de Juda', descriptionEn: 'Majestic lion with golden mane', descriptionEs: 'Leon majestuoso con melena dorada', pricePoints: 3500, rarity: 'epic', assetRef: '🦁', metadata: JSON.stringify({ collectionId: 'collection_v2_naturaleza', isV2: true }) },
  { id: 'avatar_v2_semilla_mostaza', type: 'avatar', nameEn: 'Mustard Seed', nameEs: 'Semilla de Mostaza', descriptionEn: 'Tiny seed growing into faith', descriptionEs: 'Pequena semilla creciendo en fe', pricePoints: 520, rarity: 'rare', assetRef: '🌱', metadata: JSON.stringify({ collectionId: 'collection_v2_naturaleza', isV2: true }) },
  { id: 'avatar_v2_vid_racimos', type: 'avatar', nameEn: 'Vine and Grapes', nameEs: 'Vid y Racimos', descriptionEn: 'Abundant vine with clusters', descriptionEs: 'Vid abundante con racimos', pricePoints: 340, rarity: 'common', assetRef: '🍇', metadata: JSON.stringify({ collectionId: 'collection_v2_naturaleza', isV2: true }) },
  // Collection 3: Virtudes (6 items)
  { id: 'avatar_v2_gratitud', type: 'avatar', nameEn: 'Gratitude', nameEs: 'Gratitud', descriptionEn: 'Heart radiating thankful light', descriptionEs: 'Corazon irradiando luz de agradecimiento', pricePoints: 320, rarity: 'common', assetRef: '💖', metadata: JSON.stringify({ collectionId: 'collection_v2_virtudes', isV2: true }) },
  { id: 'avatar_v2_fe', type: 'avatar', nameEn: 'Faith', nameEs: 'Fe', descriptionEn: 'Shield of unwavering faith', descriptionEs: 'Escudo de fe inquebrantable', pricePoints: 580, rarity: 'rare', assetRef: '🛡️', metadata: JSON.stringify({ collectionId: 'collection_v2_virtudes', isV2: true }) },
  { id: 'avatar_v2_amor', type: 'avatar', nameEn: 'Love', nameEs: 'Amor', descriptionEn: 'Hands reaching with compassion', descriptionEs: 'Manos extendidas con compasion', pricePoints: 550, rarity: 'rare', assetRef: '🤲', metadata: JSON.stringify({ collectionId: 'collection_v2_virtudes', isV2: true }) },
  { id: 'avatar_v2_paz', type: 'avatar', nameEn: 'Peace', nameEs: 'Paz', descriptionEn: 'Dove with olive in serene sky', descriptionEs: 'Paloma con olivo en cielo sereno', pricePoints: 500, rarity: 'rare', assetRef: '☮️', metadata: JSON.stringify({ collectionId: 'collection_v2_virtudes', isV2: true }) },
  { id: 'avatar_v2_gozo', type: 'avatar', nameEn: 'Joy', nameEs: 'Gozo', descriptionEn: 'Radiant sun with sparkles', descriptionEs: 'Sol radiante con destellos', pricePoints: 350, rarity: 'common', assetRef: '✨', metadata: JSON.stringify({ collectionId: 'collection_v2_virtudes', isV2: true }) },
  { id: 'avatar_v2_valentia', type: 'avatar', nameEn: 'Courage', nameEs: 'Valentia', descriptionEn: 'Sword of light conquering darkness', descriptionEs: 'Espada de luz conquistando oscuridad', pricePoints: 1800, rarity: 'epic', assetRef: '⚔️', metadata: JSON.stringify({ collectionId: 'collection_v2_virtudes', isV2: true }) },
  // Collection 4: Kids Friendly (4 items)
  { id: 'avatar_v2_estrellita', type: 'avatar', nameEn: 'Little Star', nameEs: 'Estrellita', descriptionEn: 'Cute twinkling star with smile', descriptionEs: 'Linda estrella parpadeante con sonrisa', pricePoints: 200, rarity: 'common', assetRef: '🌟', metadata: JSON.stringify({ collectionId: 'collection_v2_kids', isV2: true }) },
  { id: 'avatar_v2_arcoiris', type: 'avatar', nameEn: 'Soft Rainbow', nameEs: 'Arcoiris Suave', descriptionEn: 'Gentle pastel rainbow arc', descriptionEs: 'Suave arco iris en tonos pastel', pricePoints: 240, rarity: 'common', assetRef: '🌈', metadata: JSON.stringify({ collectionId: 'collection_v2_kids', isV2: true }) },
  { id: 'avatar_v2_nube', type: 'avatar', nameEn: 'Happy Cloud', nameEs: 'Nube Feliz', descriptionEn: 'Fluffy cloud with happy face', descriptionEs: 'Nube esponjosa con cara feliz', pricePoints: 450, rarity: 'rare', assetRef: '☁️', metadata: JSON.stringify({ collectionId: 'collection_v2_kids', isV2: true }) },
  { id: 'avatar_v2_angelito', type: 'avatar', nameEn: 'Little Angel', nameEs: 'Angelito', descriptionEn: 'Adorable cherub with wings', descriptionEs: 'Adorable querubin con alas', pricePoints: 550, rarity: 'rare', assetRef: '👼', metadata: JSON.stringify({ collectionId: 'collection_v2_kids', isV2: true }) },
];

// ============================================
// AVATARS LEVEL 2 — Identity & Calling (18 items)
// ============================================
const AVATARS_L2 = [
  // Collection A: Virtudes del Reino (6)
  { id: 'avatar_l2_corazon_agradecido', type: 'avatar', nameEn: 'Grateful Heart', nameEs: 'Corazon Agradecido', descriptionEn: 'A heart overflowing with gratitude toward God.', descriptionEs: 'Un corazon que desborda gratitud hacia Dios.', pricePoints: 480, rarity: 'rare', assetRef: '🫀', metadata: JSON.stringify({ collectionId: 'collection_l2_virtudes_reino', isV2: true, meaning: 'Representa una vida marcada por el agradecimiento constante a Dios en cada circunstancia.', meaningEn: 'Represents a life marked by constant thankfulness to God in every circumstance.' }) },
  { id: 'avatar_l2_espiritu_humilde', type: 'avatar', nameEn: 'Humble Spirit', nameEs: 'Espiritu Humilde', descriptionEn: 'Bowing low before God and others.', descriptionEs: 'Inclinandose ante Dios y los demas.', pricePoints: 420, rarity: 'rare', assetRef: '🌾', metadata: JSON.stringify({ collectionId: 'collection_l2_virtudes_reino', isV2: true, meaning: 'Representa la humildad del que sirve en silencio, sin buscar reconocimiento.', meaningEn: 'Represents the humility of one who serves quietly, without seeking recognition.' }) },
  { id: 'avatar_l2_gozo_constante', type: 'avatar', nameEn: 'Constant Joy', nameEs: 'Gozo Constante', descriptionEn: 'Joy that endures through every season.', descriptionEs: 'Gozo que persiste en toda temporada.', pricePoints: 350, rarity: 'common', assetRef: '☀️', metadata: JSON.stringify({ collectionId: 'collection_l2_virtudes_reino', isV2: true, meaning: "Representa el gozo profundo que no depende de las circunstancias sino de la presencia de Dios.", meaningEn: "Represents the deep joy that does not depend on circumstances but on God's presence." }) },
  { id: 'avatar_l2_fe_inquebrantable', type: 'avatar', nameEn: 'Unshakeable Faith', nameEs: 'Fe Inquebrantable', descriptionEn: 'Faith that stands firm like a mountain.', descriptionEs: 'Fe que se mantiene firme como una montana.', pricePoints: 1200, rarity: 'epic', assetRef: '⛰️', metadata: JSON.stringify({ collectionId: 'collection_l2_virtudes_reino', isV2: true, meaning: 'Representa una fe solida, probada en la tormenta y firme ante cualquier desafio.', meaningEn: 'Represents a solid faith, tested in the storm and firm before any challenge.' }) },
  { id: 'avatar_l2_amor_sacrificial', type: 'avatar', nameEn: 'Sacrificial Love', nameEs: 'Amor Sacrificial', descriptionEn: 'Love that gives without counting the cost.', descriptionEs: 'Amor que da sin contar el costo.', pricePoints: 650, rarity: 'rare', assetRef: '🔥', metadata: JSON.stringify({ collectionId: 'collection_l2_virtudes_reino', isV2: true, meaning: 'Representa el amor que se entrega por completo, siguiendo el ejemplo de Cristo.', meaningEn: 'Represents love that gives itself completely, following the example of Christ.' }) },
  { id: 'avatar_l2_paz_permanece', type: 'avatar', nameEn: 'Peace That Remains', nameEs: 'Paz que Permanece', descriptionEn: "Still waters amid life's storms.", descriptionEs: 'Aguas tranquilas en medio de las tormentas.', pricePoints: 520, rarity: 'rare', assetRef: '🌊', metadata: JSON.stringify({ collectionId: 'collection_l2_virtudes_reino', isV2: true, meaning: 'Representa la paz sobrenatural que guarda el corazon en medio de toda adversidad.', meaningEn: 'Represents the supernatural peace that guards the heart amid all adversity.' }) },
  // Collection B: Los Llamados (6)
  { id: 'avatar_l2_siervo_fiel', type: 'avatar', nameEn: 'Faithful Servant', nameEs: 'Siervo Fiel', descriptionEn: 'One who tends faithfully what God has entrusted.', descriptionEs: 'Quien cuida fielmente lo que Dios ha confiado.', pricePoints: 400, rarity: 'rare', assetRef: '🪴', metadata: JSON.stringify({ collectionId: 'collection_l2_llamados', isV2: true, unlockType: 'streak', unlockValue: 7, meaning: 'Representa al creyente que sirve con fidelidad, sin importar si es visto o reconocido.', meaningEn: 'Represents the believer who serves faithfully, regardless of whether seen or recognized.' }) },
  { id: 'avatar_l2_guerrero_oracion', type: 'avatar', nameEn: 'Prayer Warrior', nameEs: 'Guerrero de Oracion', descriptionEn: 'One who intercedes fiercely on behalf of others.', descriptionEs: 'Quien intercede fervientemente por los demas.', pricePoints: 800, rarity: 'epic', assetRef: '🛡️', metadata: JSON.stringify({ collectionId: 'collection_l2_llamados', isV2: true, unlockType: 'streak', unlockValue: 14, meaning: 'Representa la vida de intercesion que mueve el corazon de Dios y cambia la realidad.', meaningEn: 'Represents the life of intercession that moves the heart of God and changes reality.' }) },
  { id: 'avatar_l2_portador_luz', type: 'avatar', nameEn: 'Light Bearer', nameEs: 'Portador de Luz', descriptionEn: 'One who carries the light into dark places.', descriptionEs: 'Quien lleva la luz a los lugares oscuros.', pricePoints: 580, rarity: 'rare', assetRef: '🕯️', metadata: JSON.stringify({ collectionId: 'collection_l2_llamados', isV2: true, unlockType: 'devotionals', unlockValue: 30, meaning: 'Representa la mision de ser luz en el mundo, reflejo de la gloria de Dios.', meaningEn: "Represents the mission of being light in the world, a reflection of God's glory." }) },
  { id: 'avatar_l2_atalaya', type: 'avatar', nameEn: 'Watchman', nameEs: 'Atalaya', descriptionEn: 'One who watches, prays, and stands guard.', descriptionEs: 'Quien vigila, ora y monta guardia.', pricePoints: 1500, rarity: 'epic', assetRef: '🔭', metadata: JSON.stringify({ collectionId: 'collection_l2_llamados', isV2: true, unlockType: 'devotionals', unlockValue: 50, meaning: 'Representa al creyente llamado a la oracion de guardia, protegiendo con su intercesion.', meaningEn: 'Represents the believer called to watchful prayer, protecting through intercession.' }) },
  { id: 'avatar_l2_sembrador', type: 'avatar', nameEn: 'Sower', nameEs: 'Sembrador', descriptionEn: 'One who plants seeds of faith and hope.', descriptionEs: 'Quien siembra semillas de fe y esperanza.', pricePoints: 450, rarity: 'rare', assetRef: '🌱', metadata: JSON.stringify({ collectionId: 'collection_l2_llamados', isV2: true, unlockType: 'share', unlockValue: 5, meaning: 'Representa la vocacion de sembrar la Palabra con paciencia, confiando en la cosecha de Dios.', meaningEn: "Represents the calling to sow the Word patiently, trusting in God's harvest." }) },
  { id: 'avatar_l2_testigo', type: 'avatar', nameEn: 'Witness', nameEs: 'Testigo', descriptionEn: 'One who declares what they have seen and heard.', descriptionEs: 'Quien declara lo que ha visto y oido.', pricePoints: 600, rarity: 'rare', assetRef: '📣', metadata: JSON.stringify({ collectionId: 'collection_l2_llamados', isV2: true, unlockType: 'share', unlockValue: 10, meaning: "Representa la identidad del creyente como testigo fiel de la gracia de Dios en su vida.", meaningEn: "Represents the believer's identity as faithful witness to God's grace in their life." }) },
  // Collection C: Simbolos Profundos (6)
  { id: 'avatar_l2_lampara_encendida', type: 'avatar', nameEn: 'Lit Lamp', nameEs: 'Lampara Encendida', descriptionEn: 'The lamp that never goes out.', descriptionEs: 'La lampara que nunca se apaga.', pricePoints: 380, rarity: 'common', assetRef: '🔦', metadata: JSON.stringify({ collectionId: 'collection_l2_simbolos_profundos', isV2: true, meaning: "Representa la Palabra de Dios como lampara a los pies y lumbrera al camino del creyente.", meaningEn: "Represents God's Word as a lamp to the believer's feet and a light to their path." }) },
  { id: 'avatar_l2_corona_vida', type: 'avatar', nameEn: 'Crown of Life', nameEs: 'Corona de Vida', descriptionEn: 'The reward promised to those who endure.', descriptionEs: 'La recompensa prometida a quienes perseveran.', pricePoints: 2800, rarity: 'epic', assetRef: '👑', metadata: JSON.stringify({ collectionId: 'collection_l2_simbolos_profundos', isV2: true, unlockType: 'streak', unlockValue: 30, meaning: 'Representa la corona prometida al fiel que persevera hasta el fin con amor a Dios.', meaningEn: 'Represents the crown promised to the faithful who persevere to the end with love for God.' }) },
  { id: 'avatar_l2_espada_espiritu', type: 'avatar', nameEn: 'Sword of the Spirit', nameEs: 'Espada del Espiritu', descriptionEn: 'The Word of God as a living, active weapon.', descriptionEs: 'La Palabra de Dios como arma viva y activa.', pricePoints: 1800, rarity: 'epic', assetRef: '⚡', metadata: JSON.stringify({ collectionId: 'collection_l2_simbolos_profundos', isV2: true, meaning: 'Representa la Palabra de Dios que es viva, eficaz y mas cortante que toda espada.', meaningEn: 'Represents the Word of God that is living, active, and sharper than any double-edged sword.' }) },
  { id: 'avatar_l2_ancla_alma', type: 'avatar', nameEn: 'Soul Anchor', nameEs: 'Ancla del Alma', descriptionEn: 'Hope as an anchor for the soul.', descriptionEs: 'La esperanza como ancla del alma.', pricePoints: 700, rarity: 'rare', assetRef: '⚓', metadata: JSON.stringify({ collectionId: 'collection_l2_simbolos_profundos', isV2: true, meaning: 'Representa la esperanza en Cristo como ancla firme que sostiene el alma en toda tormenta.', meaningEn: 'Represents hope in Christ as a firm anchor that holds the soul through every storm.' }) },
  { id: 'avatar_l2_pergamino_vivo', type: 'avatar', nameEn: 'Living Scroll', nameEs: 'Pergamino Vivo', descriptionEn: "A life written by God's own hand.", descriptionEs: 'Una vida escrita por la propia mano de Dios.', pricePoints: 560, rarity: 'rare', assetRef: '📜', metadata: JSON.stringify({ collectionId: 'collection_l2_simbolos_profundos', isV2: true, unlockType: 'devotionals', unlockValue: 21, meaning: 'Representa al creyente como carta viva de Cristo, escrita no con tinta sino con el Espiritu.', meaningEn: 'Represents the believer as a living letter from Christ, written not with ink but with the Spirit.' }) },
  { id: 'avatar_l2_fuente_agua', type: 'avatar', nameEn: 'Living Water', nameEs: 'Fuente de Agua Viva', descriptionEn: 'The spring of living water that never runs dry.', descriptionEs: 'El manantial de agua viva que nunca se agota.', pricePoints: 900, rarity: 'epic', assetRef: '💧', metadata: JSON.stringify({ collectionId: 'collection_l2_simbolos_profundos', isV2: true, meaning: "Representa a Cristo como la unica fuente de agua viva que sacia la sed del alma para siempre.", meaningEn: "Represents Christ as the only source of living water that forever satisfies the soul's thirst." }) },
];

// ============================================
// AVATAR FRAMES V2 (12 premium frames)
// ============================================
const FRAMES_V2 = [
  { id: 'frame_v2_hoja_oro', type: 'frame', nameEn: 'Gold Leaf', nameEs: 'Hoja de Oro', descriptionEn: 'Fine gold leaf edge with warm radiance', descriptionEs: 'Borde de hoja de oro fino con calidez', pricePoints: 450, rarity: 'rare', assetRef: '#D4A017', metadata: JSON.stringify({ isV2: true }) },
  { id: 'frame_v2_plata_brillo', type: 'frame', nameEn: 'Silver Glow', nameEs: 'Brillo de Plata', descriptionEn: 'Shimmering silver ring of purity', descriptionEs: 'Anillo de plata refulgente de pureza', pricePoints: 350, rarity: 'common', assetRef: '#B8C8D8', metadata: JSON.stringify({ isV2: true }) },
  { id: 'frame_v2_olivo', type: 'frame', nameEn: 'Olive Wreath', nameEs: 'Corona de Olivo', descriptionEn: 'Ancient olive branch wreath of peace', descriptionEs: 'Corona antigua de olivo de la paz', pricePoints: 400, rarity: 'rare', assetRef: '#6B8F47', metadata: JSON.stringify({ isV2: true }) },
  { id: 'frame_v2_amanecer', type: 'frame', nameEn: 'Sunrise Ring', nameEs: 'Anillo Amanecer', descriptionEn: 'Soft dawn gradient circling with hope', descriptionEs: 'Degradado suave del amanecer con esperanza', pricePoints: 380, rarity: 'common', assetRef: '#F4A261', metadata: JSON.stringify({ isV2: true }) },
  { id: 'frame_v2_pergamino', type: 'frame', nameEn: 'Parchment Edge', nameEs: 'Borde Pergamino', descriptionEn: 'Aged scripture scroll border', descriptionEs: 'Borde de pergamino de escrituras antiguas', pricePoints: 320, rarity: 'common', assetRef: '#C9A96E', metadata: JSON.stringify({ isV2: true }) },
  { id: 'frame_v2_halo_azul', type: 'frame', nameEn: 'Calm Blue Halo', nameEs: 'Halo Azul Sereno', descriptionEn: 'Tranquil blue celestial halo', descriptionEs: 'Halo celestial azul tranquilo', pricePoints: 420, rarity: 'rare', assetRef: '#4A90D9', metadata: JSON.stringify({ isV2: true }) },
  { id: 'frame_v2_fuego_sagrado', type: 'frame', nameEn: 'Sacred Fire', nameEs: 'Fuego Sagrado', descriptionEn: 'Holy Spirit fire ring of power', descriptionEs: 'Anillo de fuego del Espiritu Santo', pricePoints: 600, rarity: 'epic', assetRef: '#E85D04', metadata: JSON.stringify({ isV2: true }) },
  { id: 'frame_v2_luna_plata', type: 'frame', nameEn: 'Silver Moon', nameEs: 'Luna de Plata', descriptionEn: 'Moonlit silver glow for the night watchman', descriptionEs: 'Resplandor plateado lunar para el vigilante', pricePoints: 480, rarity: 'rare', assetRef: '#8EABD4', metadata: JSON.stringify({ isV2: true }) },
  { id: 'frame_v2_jade', type: 'frame', nameEn: 'Jade Garden', nameEs: 'Jardin Jade', descriptionEn: 'Deep green jade ring of life', descriptionEs: 'Anillo verde jade profundo de vida', pricePoints: 360, rarity: 'common', assetRef: '#00A878', metadata: JSON.stringify({ isV2: true }) },
  { id: 'frame_v2_zafiro', type: 'frame', nameEn: 'Sapphire Crown', nameEs: 'Corona Zafiro', descriptionEn: 'Royal sapphire crown frame', descriptionEs: 'Marco de corona de zafiro real', pricePoints: 750, rarity: 'epic', assetRef: '#1E6EBE', metadata: JSON.stringify({ isV2: true }) },
  { id: 'frame_v2_rosa_gracia', type: 'frame', nameEn: 'Rose of Grace', nameEs: 'Rosa de Gracia', descriptionEn: 'Blush rose petal frame of tender grace', descriptionEs: 'Marco de petalo de rosa del amor tierno', pricePoints: 420, rarity: 'rare', assetRef: '#E8829A', metadata: JSON.stringify({ isV2: true }) },
  { id: 'frame_v2_tierra_santa', type: 'frame', nameEn: 'Holy Land', nameEs: 'Tierra Santa', descriptionEn: 'Warm desert sand of ancient holy ground', descriptionEs: 'Arena calida del desierto de tierra santa', pricePoints: 340, rarity: 'common', assetRef: '#C8956C', metadata: JSON.stringify({ isV2: true }) },
];
interface StoreItemInput {
  id: string;
  type: string;
  nameEn: string;
  nameEs: string;
  descriptionEn: string;
  descriptionEs: string;
  pricePoints: number;
  rarity: string;
  assetRef: string;
  metadata?: string;
}

// ============================================
// SEED FUNCTION
// ============================================
async function upsertItem(item: StoreItemInput, sortOrder: number): Promise<void> {
  await prisma.storeItem.upsert({
    where: { id: item.id },
    update: {
      type: item.type,
      nameEn: item.nameEn,
      nameEs: item.nameEs,
      descriptionEn: item.descriptionEn,
      descriptionEs: item.descriptionEs,
      pricePoints: item.pricePoints,
      rarity: item.rarity,
      assetRef: item.assetRef,
      metadata: item.metadata ?? '{}',
      sortOrder,
    },
    create: {
      id: item.id,
      type: item.type,
      nameEn: item.nameEn,
      nameEs: item.nameEs,
      descriptionEn: item.descriptionEn,
      descriptionEs: item.descriptionEs,
      pricePoints: item.pricePoints,
      rarity: item.rarity,
      assetRef: item.assetRef,
      metadata: item.metadata ?? '{}',
      sortOrder,
    },
  });
}

async function seedStoreItems() {
  console.log('Starting store items seed...\n');

  let sortOrder = 0;

  // Seed themes (original)
  console.log('Seeding themes...');
  for (const theme of THEMES) {
    await upsertItem(theme, sortOrder++);
  }
  console.log(`  Themes: ${THEMES.length} processed`);

  // Seed themes V2 (premium)
  console.log('Seeding themes V2...');
  for (const theme of THEMES_V2) {
    await upsertItem(theme, sortOrder++);
  }
  console.log(`  Themes V2: ${THEMES_V2.length} processed`);

  // Seed frames
  console.log('Seeding avatar frames...');
  for (const frame of FRAMES) {
    await upsertItem(frame, sortOrder++);
  }
  console.log(`  Avatar frames: ${FRAMES.length} processed`);

  // Seed frames V2
  console.log('Seeding avatar frames V2...');
  for (const frame of FRAMES_V2) {
    await upsertItem(frame, sortOrder++);
  }
  console.log(`  Avatar frames V2: ${FRAMES_V2.length} processed`);

  // Seed music tracks
  console.log('Seeding music tracks...');
  for (const track of MUSIC_TRACKS) {
    await upsertItem(track, sortOrder++);
  }
  console.log(`  Music tracks: ${MUSIC_TRACKS.length} processed`);

  // Seed titles
  console.log('Seeding spiritual titles...');
  for (const title of TITLES) {
    await upsertItem(title, sortOrder++);
  }
  console.log(`  Spiritual titles: ${TITLES.length} processed`);

  // Seed avatars (original)
  console.log('Seeding premium avatars...');
  for (const avatar of AVATARS) {
    await upsertItem(avatar, sortOrder++);
  }
  console.log(`  Premium avatars: ${AVATARS.length} processed`);

  // Seed avatars V2 (premium illustrated)
  console.log('Seeding avatars V2...');
  for (const avatar of AVATARS_V2) {
    await upsertItem(avatar, sortOrder++);
  }
  console.log(`  Avatars V2: ${AVATARS_V2.length} processed`);

  // Seed avatars Level 2 (identity & calling)
  console.log('Seeding avatars Level 2...');
  for (const avatar of AVATARS_L2) {
    await upsertItem(avatar, sortOrder++);
  }
  console.log(`  Avatars L2: ${AVATARS_L2.length} processed`);

  // Summary
  const totalItems = THEMES.length + THEMES_V2.length + FRAMES.length + FRAMES_V2.length + MUSIC_TRACKS.length + TITLES.length + AVATARS.length + AVATARS_V2.length + AVATARS_L2.length;
  console.log('\n========================================');
  console.log('Store items seed completed!');
  console.log('========================================');
  console.log(`Total items processed: ${totalItems}`);
  console.log(`  - Themes (original): ${THEMES.length}`);
  console.log(`  - Themes V2: ${THEMES_V2.length}`);
  console.log(`  - Avatar frames: ${FRAMES.length}`);
  console.log(`  - Music tracks: ${MUSIC_TRACKS.length}`);
  console.log(`  - Spiritual titles: ${TITLES.length}`);
  console.log(`  - Premium avatars: ${AVATARS.length}`);
  console.log(`  - Avatars V2: ${AVATARS_V2.length}`);
  console.log(`  - Avatars L2: ${AVATARS_L2.length}`);
  console.log('----------------------------------------');

  // Verify counts in database
  const dbCounts = await prisma.storeItem.groupBy({
    by: ['type'],
    _count: { id: true },
  });

  console.log('\nDatabase verification:');
  for (const count of dbCounts) {
    console.log(`  - ${count.type}: ${count._count.id} items`);
  }

  const totalInDb = await prisma.storeItem.count();
  console.log(`\nTotal items in database: ${totalInDb}`);
}

// Run the seed
seedStoreItems()
  .then(() => {
    console.log('\nSeed completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding store items:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
