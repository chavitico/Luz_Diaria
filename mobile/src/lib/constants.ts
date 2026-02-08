// App constants and theme configuration

export const APP_CONFIG = {
  name: 'Daily Light',
  company: 'ChaViTico Games',
  splashDuration: 2000,
} as const;

export const THEMES = {
  dawn: {
    name: 'Dawn',
    nameEs: 'Amanecer',
    primary: '#E8A87C',
    secondary: '#C38D9E',
    accent: '#41B3A3',
    background: '#FDF6E3',
    backgroundDark: '#1A1A2E',
    surface: '#FFFFFF',
    surfaceDark: '#252542',
    text: '#2D2D2D',
    textDark: '#F5F5F5',
    textMuted: '#6B6B6B',
    textMutedDark: '#A0A0A0',
  },
  dusk: {
    name: 'Dusk',
    nameEs: 'Atardecer',
    primary: '#9B5DE5',
    secondary: '#F15BB5',
    accent: '#00BBF9',
    background: '#0F0E17',
    backgroundDark: '#0F0E17',
    surface: '#1E1E2F',
    surfaceDark: '#1E1E2F',
    text: '#FFFFFE',
    textDark: '#FFFFFE',
    textMuted: '#A7A9BE',
    textMutedDark: '#A7A9BE',
  },
  ocean: {
    name: 'Ocean',
    nameEs: 'Oceano',
    primary: '#0077B6',
    secondary: '#00B4D8',
    accent: '#90E0EF',
    background: '#F8FBFD',
    backgroundDark: '#0A1628',
    surface: '#FFFFFF',
    surfaceDark: '#152238',
    text: '#1B263B',
    textDark: '#E8F4F8',
    textMuted: '#577590',
    textMutedDark: '#8DB3C7',
  },
  forest: {
    name: 'Forest',
    nameEs: 'Bosque',
    primary: '#2D6A4F',
    secondary: '#40916C',
    accent: '#95D5B2',
    background: '#F7FDF9',
    backgroundDark: '#0D1F17',
    surface: '#FFFFFF',
    surfaceDark: '#1A3328',
    text: '#1B4332',
    textDark: '#D8F3DC',
    textMuted: '#52796F',
    textMutedDark: '#74C69D',
  },
  rose: {
    name: 'Rose',
    nameEs: 'Rosa',
    primary: '#C9184A',
    secondary: '#FF758F',
    accent: '#FFB3C1',
    background: '#FFF5F7',
    backgroundDark: '#1A0A10',
    surface: '#FFFFFF',
    surfaceDark: '#2D1520',
    text: '#590D22',
    textDark: '#FFE5EC',
    textMuted: '#A4133C',
    textMutedDark: '#FF8FA3',
  },
} as const;

export const DEFAULT_AVATARS = [
  { id: 'avatar_dove', name: 'Dove', emoji: '🕊️', unlocked: true },
  { id: 'avatar_sun', name: 'Sun', emoji: '☀️', unlocked: true },
  { id: 'avatar_star', name: 'Star', emoji: '⭐', unlocked: true },
  { id: 'avatar_heart', name: 'Heart', emoji: '❤️', unlocked: true },
  { id: 'avatar_cross', name: 'Cross', emoji: '✝️', unlocked: true },
  { id: 'avatar_candle', name: 'Candle', emoji: '🕯️', unlocked: true },
  { id: 'avatar_book', name: 'Book', emoji: '📖', unlocked: true },
  { id: 'avatar_praying', name: 'Praying', emoji: '🙏', unlocked: true },
  { id: 'avatar_rainbow', name: 'Rainbow', emoji: '🌈', price: 200 },
  { id: 'avatar_crown', name: 'Crown', emoji: '👑', price: 500 },
  { id: 'avatar_angel', name: 'Angel', emoji: '😇', price: 300 },
  { id: 'avatar_olive', name: 'Olive Branch', emoji: '🫒', price: 250 },
  { id: 'avatar_lamb', name: 'Lamb', emoji: '🐑', price: 400 },
  { id: 'avatar_fish', name: 'Fish', emoji: '🐟', price: 150 },
] as const;

export const STORE_ITEMS = [
  {
    id: 'nickname_change',
    type: 'nickname_change' as const,
    name: 'Nickname Change',
    nameEs: 'Cambio de Apodo',
    description: 'Change your nickname once',
    descriptionEs: 'Cambia tu apodo una vez',
    imageUrl: '',
    price: 500,
    category: 'special',
  },
  ...DEFAULT_AVATARS.filter(a => 'price' in a).map(a => ({
    id: a.id,
    type: 'avatar' as const,
    name: a.name,
    nameEs: a.name,
    description: `Unlock the ${a.name} avatar`,
    descriptionEs: `Desbloquea el avatar ${a.name}`,
    imageUrl: '',
    price: (a as { price: number }).price,
    category: 'avatars',
  })),
];

// Purchasable Themes (from store - these are the metadata parsed)
export const PURCHASABLE_THEMES: Record<string, {
  id: string;
  name: string;
  nameEs: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    backgroundDark: string;
    surface: string;
    surfaceDark: string;
    text: string;
    textDark: string;
    textMuted: string;
    textMutedDark: string;
  };
  price: number;
  rarity: string;
}> = {
  theme_amanecer: {
    id: 'theme_amanecer',
    name: 'Sunrise',
    nameEs: 'Amanecer',
    colors: {
      primary: '#E8A87C',
      secondary: '#C38D9E',
      accent: '#41B3A3',
      background: '#FDF6E3',
      backgroundDark: '#1A1A2E',
      surface: '#FFFFFF',
      surfaceDark: '#252542',
      text: '#2D2D2D',
      textDark: '#F5F5F5',
      textMuted: '#6B6B6B',
      textMutedDark: '#A0A0A0',
    },
    price: 0,
    rarity: 'common',
  },
  theme_noche_paz: {
    id: 'theme_noche_paz',
    name: 'Peaceful Night',
    nameEs: 'Noche de Paz',
    colors: {
      primary: '#5C6BC0',
      secondary: '#7986CB',
      accent: '#9FA8DA',
      background: '#0D1B2A',
      backgroundDark: '#0D1B2A',
      surface: '#1B263B',
      surfaceDark: '#1B263B',
      text: '#E8F4F8',
      textDark: '#E8F4F8',
      textMuted: '#8DB3C7',
      textMutedDark: '#8DB3C7',
    },
    price: 400,
    rarity: 'rare',
  },
  theme_bosque: {
    id: 'theme_bosque',
    name: 'Forest',
    nameEs: 'Bosque',
    colors: {
      primary: '#2D6A4F',
      secondary: '#40916C',
      accent: '#95D5B2',
      background: '#F7FDF9',
      backgroundDark: '#0D1F17',
      surface: '#FFFFFF',
      surfaceDark: '#1A3328',
      text: '#1B4332',
      textDark: '#D8F3DC',
      textMuted: '#52796F',
      textMutedDark: '#74C69D',
    },
    price: 300,
    rarity: 'common',
  },
  theme_desierto: {
    id: 'theme_desierto',
    name: 'Desert',
    nameEs: 'Desierto',
    colors: {
      primary: '#D4A373',
      secondary: '#CCD5AE',
      accent: '#E9EDC9',
      background: '#FEFAE0',
      backgroundDark: '#2C2416',
      surface: '#FFFFFF',
      surfaceDark: '#3D3426',
      text: '#5C4B37',
      textDark: '#F5E6D3',
      textMuted: '#8B7355',
      textMutedDark: '#C4A77D',
    },
    price: 350,
    rarity: 'common',
  },
  theme_promesa: {
    id: 'theme_promesa',
    name: 'Promise',
    nameEs: 'Promesa',
    colors: {
      primary: '#7B2CBF',
      secondary: '#9D4EDD',
      accent: '#C77DFF',
      background: '#F8F4FC',
      backgroundDark: '#1A0A2E',
      surface: '#FFFFFF',
      surfaceDark: '#2D1B4E',
      text: '#3C096C',
      textDark: '#E0AAFF',
      textMuted: '#7B2CBF',
      textMutedDark: '#C77DFF',
    },
    price: 600,
    rarity: 'rare',
  },
  theme_minimal: {
    id: 'theme_minimal',
    name: 'Minimal Light',
    nameEs: 'Minimal Claro',
    colors: {
      primary: '#374151',
      secondary: '#6B7280',
      accent: '#9CA3AF',
      background: '#F9FAFB',
      backgroundDark: '#111827',
      surface: '#FFFFFF',
      surfaceDark: '#1F2937',
      text: '#111827',
      textDark: '#F9FAFB',
      textMuted: '#6B7280',
      textMutedDark: '#9CA3AF',
    },
    price: 200,
    rarity: 'common',
  },
};

// Avatar Frames
export const AVATAR_FRAMES: Record<string, {
  id: string;
  name: string;
  nameEs: string;
  color: string;
  price: number;
  rarity: string;
}> = {
  frame_dorado: { id: 'frame_dorado', name: 'Golden', nameEs: 'Dorado', color: '#FFD700', price: 300, rarity: 'rare' },
  frame_plata: { id: 'frame_plata', name: 'Silver', nameEs: 'Plata', color: '#C0C0C0', price: 200, rarity: 'common' },
  frame_azul: { id: 'frame_azul', name: 'Blue Hope', nameEs: 'Azul Esperanza', color: '#4A90D9', price: 250, rarity: 'common' },
  frame_verde: { id: 'frame_verde', name: 'Green Life', nameEs: 'Verde Vida', color: '#4CAF50', price: 250, rarity: 'common' },
  frame_luz: { id: 'frame_luz', name: 'Soft Light', nameEs: 'Luz Suave', color: '#FFF8DC', price: 350, rarity: 'rare' },
  frame_corona: { id: 'frame_corona', name: 'Leaf Crown', nameEs: 'Corona Hojas', color: '#228B22', price: 400, rarity: 'rare' },
  frame_estrellas: { id: 'frame_estrellas', name: 'Stars', nameEs: 'Estrellas', color: '#E6E6FA', price: 500, rarity: 'epic' },
  frame_pergamino: { id: 'frame_pergamino', name: 'Parchment', nameEs: 'Pergamino', color: '#D4B896', price: 300, rarity: 'common' },
  frame_fuego: { id: 'frame_fuego', name: 'Soft Fire', nameEs: 'Fuego Suave', color: '#FF6B35', price: 450, rarity: 'rare' },
  frame_cielo: { id: 'frame_cielo', name: 'Heaven', nameEs: 'Cielo', color: '#87CEEB', price: 600, rarity: 'epic' },
};

// Spiritual Titles
export const SPIRITUAL_TITLES: Record<string, {
  id: string;
  name: string;
  nameEs: string;
  price: number;
  rarity: string;
}> = {
  title_buscador: { id: 'title_buscador', name: 'Seeker of Light', nameEs: 'Buscador de Luz', price: 200, rarity: 'common' },
  title_corazon: { id: 'title_corazon', name: 'Grateful Heart', nameEs: 'Corazon Agradecido', price: 250, rarity: 'common' },
  title_caminando: { id: 'title_caminando', name: 'Walking in Faith', nameEs: 'Caminando en Fe', price: 300, rarity: 'common' },
  title_siervo: { id: 'title_siervo', name: 'Faithful Servant', nameEs: 'Siervo Fiel', price: 400, rarity: 'rare' },
  title_portador: { id: 'title_portador', name: 'Hope Bearer', nameEs: 'Portador de Esperanza', price: 350, rarity: 'rare' },
  title_amigo: { id: 'title_amigo', name: 'Friend of the Master', nameEs: 'Amigo del Maestro', price: 500, rarity: 'rare' },
  title_valiente: { id: 'title_valiente', name: 'Kingdom Warrior', nameEs: 'Valiente del Reino', price: 600, rarity: 'epic' },
  title_sembrador: { id: 'title_sembrador', name: 'Peace Sower', nameEs: 'Sembrador de Paz', price: 450, rarity: 'rare' },
  title_luz: { id: 'title_luz', name: 'Light in the Storm', nameEs: 'Luz en la Tormenta', price: 550, rarity: 'rare' },
  title_guardian: { id: 'title_guardian', name: 'Guardian of the Word', nameEs: 'Guardian de la Palabra', price: 700, rarity: 'epic' },
  title_constructor: { id: 'title_constructor', name: 'Altar Builder', nameEs: 'Constructor de Altar', price: 500, rarity: 'rare' },
  title_peregrino: { id: 'title_peregrino', name: 'Pilgrim of Grace', nameEs: 'Peregrino de Gracia', price: 400, rarity: 'rare' },
};

// Rarity colors for UI
export const RARITY_COLORS = {
  common: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#A855F7',
} as const;

export const TRANSLATIONS = {
  en: {
    // General
    app_name: 'Daily Light',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    done: 'Done',
    back: 'Back',

    // Tabs
    tab_home: 'Today',
    tab_library: 'Library',
    tab_store: 'Store',
    tab_settings: 'Settings',

    // Onboarding
    welcome: 'Welcome to Daily Light',
    welcome_subtitle: 'Your daily companion for faith, hope, and love',
    choose_nickname: 'Choose Your Nickname',
    nickname_placeholder: 'Enter a unique nickname',
    nickname_taken: 'This nickname is already taken',
    nickname_invalid: 'Nickname must be 3-15 characters',
    choose_avatar: 'Choose Your Avatar',
    get_started: 'Get Started',

    // Home
    todays_devotional: "Today's Devotional",
    bible_verse: 'Bible Verse',
    reflection: 'Reflection',
    story: 'Story',
    biblical_character: 'Biblical Character',
    application: 'Apply It',
    prayer: 'Prayer',
    mark_complete: 'Mark as Complete',
    completed: 'Completed',
    time_remaining: 'Read for {time} more',
    scroll_to_complete: 'Scroll to bottom to complete',

    // TTS
    play: 'Play',
    pause: 'Pause',
    stop: 'Stop',
    tts_speed: 'Reading Speed',
    tts_voice: 'Voice',

    // Music
    background_music: 'Background Music',
    volume: 'Volume',

    // Library
    library: 'Library',
    all_devotionals: 'All',
    favorites: 'Favorites',
    no_favorites: 'No favorites yet',

    // Store
    store: 'Store',
    points: 'Points',
    purchase: 'Purchase',
    purchased: 'Owned',
    not_enough_points: 'Not enough points',
    purchase_success: 'Purchase successful!',

    // Settings
    settings: 'Settings',
    theme: 'Theme',
    language: 'Language',
    notifications: 'Notifications',
    streak_reminders: 'Streak Reminders',
    music_settings: 'Music',
    tts_settings: 'Text to Speech',

    // Stats
    stats: 'Your Journey',
    current_streak: 'Current Streak',
    best_streak: 'Best Streak',
    total_completed: 'Devotionals Read',
    total_time: 'Time in Prayer',
    days: 'days',
    hours: 'hours',
    minutes: 'min',

    // Gamification
    share_devotional: 'Share',
    prayer_confirm: 'I prayed today',
    points_earned: '+{points} points',
    daily_limit_reached: 'Daily limit reached',
    weekly_challenges: 'Weekly Challenges',
    challenge_progress: '{current}/{goal}',
    claim_reward: 'Claim Reward',
    reward_claimed: 'Reward Claimed',
    themes: 'Themes',
    frames: 'Frames',
    music_tracks: 'Music',
    titles: 'Titles',
    equip: 'Equip',
    equipped: 'Equipped',
    preview: 'Preview',
    unlock: 'Unlock',
    profile: 'Profile',
    your_title: 'Your Title',
    no_title: 'No title selected',
  },
  es: {
    // General
    app_name: 'Luz Diaria',
    loading: 'Cargando...',
    save: 'Guardar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    done: 'Listo',
    back: 'Volver',

    // Tabs
    tab_home: 'Hoy',
    tab_library: 'Biblioteca',
    tab_store: 'Tienda',
    tab_settings: 'Ajustes',

    // Onboarding
    welcome: 'Bienvenido a Luz Diaria',
    welcome_subtitle: 'Tu companero diario de fe, esperanza y amor',
    choose_nickname: 'Elige Tu Apodo',
    nickname_placeholder: 'Ingresa un apodo unico',
    nickname_taken: 'Este apodo ya esta en uso',
    nickname_invalid: 'El apodo debe tener 3-15 caracteres',
    choose_avatar: 'Elige Tu Avatar',
    get_started: 'Comenzar',

    // Home
    todays_devotional: 'Devocional de Hoy',
    bible_verse: 'Versiculo Biblico',
    reflection: 'Reflexion',
    story: 'Historia',
    biblical_character: 'Personaje Biblico',
    application: 'Aplicacion',
    prayer: 'Oracion',
    mark_complete: 'Marcar Completo',
    completed: 'Completado',
    time_remaining: 'Lee por {time} mas',
    scroll_to_complete: 'Desplazate hasta abajo para completar',

    // TTS
    play: 'Reproducir',
    pause: 'Pausar',
    stop: 'Detener',
    tts_speed: 'Velocidad de Lectura',
    tts_voice: 'Voz',

    // Music
    background_music: 'Musica de Fondo',
    volume: 'Volumen',

    // Library
    library: 'Biblioteca',
    all_devotionals: 'Todos',
    favorites: 'Favoritos',
    no_favorites: 'Sin favoritos aun',

    // Store
    store: 'Tienda',
    points: 'Puntos',
    purchase: 'Comprar',
    purchased: 'Adquirido',
    not_enough_points: 'Puntos insuficientes',
    purchase_success: 'Compra exitosa!',

    // Settings
    settings: 'Ajustes',
    theme: 'Tema',
    language: 'Idioma',
    notifications: 'Notificaciones',
    streak_reminders: 'Recordatorios de Racha',
    music_settings: 'Musica',
    tts_settings: 'Texto a Voz',

    // Stats
    stats: 'Tu Camino',
    current_streak: 'Racha Actual',
    best_streak: 'Mejor Racha',
    total_completed: 'Devocionales Leidos',
    total_time: 'Tiempo en Oracion',
    days: 'dias',
    hours: 'horas',
    minutes: 'min',

    // Gamification
    share_devotional: 'Compartir',
    prayer_confirm: 'Hoy hice mi oracion',
    points_earned: '+{points} puntos',
    daily_limit_reached: 'Limite diario alcanzado',
    weekly_challenges: 'Desafios Semanales',
    challenge_progress: '{current}/{goal}',
    claim_reward: 'Reclamar Premio',
    reward_claimed: 'Premio Reclamado',
    themes: 'Temas',
    frames: 'Marcos',
    music_tracks: 'Musica',
    titles: 'Titulos',
    equip: 'Equipar',
    equipped: 'Equipado',
    preview: 'Vista Previa',
    unlock: 'Desbloquear',
    profile: 'Perfil',
    your_title: 'Tu Titulo',
    no_title: 'Sin titulo seleccionado',
  },
} as const;
