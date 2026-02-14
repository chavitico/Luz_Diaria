import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================
// THEMES (6 items)
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
// PREMIUM AVATARS (6 items - the ones with price)
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
// TYPE DEFINITIONS
// ============================================
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

  // Seed themes
  console.log('Seeding themes...');
  for (const theme of THEMES) {
    await upsertItem(theme, sortOrder++);
  }
  console.log(`  Themes: ${THEMES.length} processed`);

  // Seed frames
  console.log('Seeding avatar frames...');
  for (const frame of FRAMES) {
    await upsertItem(frame, sortOrder++);
  }
  console.log(`  Avatar frames: ${FRAMES.length} processed`);

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

  // Seed avatars
  console.log('Seeding premium avatars...');
  for (const avatar of AVATARS) {
    await upsertItem(avatar, sortOrder++);
  }
  console.log(`  Premium avatars: ${AVATARS.length} processed`);

  // Summary
  const totalItems = THEMES.length + FRAMES.length + MUSIC_TRACKS.length + TITLES.length + AVATARS.length;
  console.log('\n========================================');
  console.log('Store items seed completed!');
  console.log('========================================');
  console.log(`Total items processed: ${totalItems}`);
  console.log(`  - Themes: ${THEMES.length}`);
  console.log(`  - Avatar frames: ${FRAMES.length}`);
  console.log(`  - Music tracks: ${MUSIC_TRACKS.length}`);
  console.log(`  - Spiritual titles: ${TITLES.length}`);
  console.log(`  - Premium avatars: ${AVATARS.length}`);
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
