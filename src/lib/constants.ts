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
    nameEs: 'Océano',
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
    welcome_subtitle: 'Tu compañero diario de fe, esperanza y amor',
    choose_nickname: 'Elige Tu Apodo',
    nickname_placeholder: 'Ingresa un apodo único',
    nickname_taken: 'Este apodo ya está en uso',
    nickname_invalid: 'El apodo debe tener 3-15 caracteres',
    choose_avatar: 'Elige Tu Avatar',
    get_started: 'Comenzar',

    // Home
    todays_devotional: 'Devocional de Hoy',
    bible_verse: 'Versículo Bíblico',
    reflection: 'Reflexión',
    story: 'Historia',
    biblical_character: 'Personaje Bíblico',
    application: 'Aplicación',
    prayer: 'Oración',
    mark_complete: 'Marcar Completo',
    completed: 'Completado',
    time_remaining: 'Lee por {time} más',
    scroll_to_complete: 'Desplázate hasta abajo para completar',

    // TTS
    play: 'Reproducir',
    pause: 'Pausar',
    stop: 'Detener',
    tts_speed: 'Velocidad de Lectura',
    tts_voice: 'Voz',

    // Music
    background_music: 'Música de Fondo',
    volume: 'Volumen',

    // Library
    library: 'Biblioteca',
    all_devotionals: 'Todos',
    favorites: 'Favoritos',
    no_favorites: 'Sin favoritos aún',

    // Store
    store: 'Tienda',
    points: 'Puntos',
    purchase: 'Comprar',
    purchased: 'Adquirido',
    not_enough_points: 'Puntos insuficientes',
    purchase_success: '¡Compra exitosa!',

    // Settings
    settings: 'Ajustes',
    theme: 'Tema',
    language: 'Idioma',
    notifications: 'Notificaciones',
    streak_reminders: 'Recordatorios de Racha',
    music_settings: 'Música',
    tts_settings: 'Texto a Voz',

    // Stats
    stats: 'Tu Camino',
    current_streak: 'Racha Actual',
    best_streak: 'Mejor Racha',
    total_completed: 'Devocionales Leídos',
    total_time: 'Tiempo en Oración',
    days: 'días',
    hours: 'horas',
    minutes: 'min',
  },
} as const;
