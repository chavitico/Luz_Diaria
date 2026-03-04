// App constants and theme configuration

export const APP_CONFIG = {
  name: 'Luz Diaria',
  company: 'ChaViTico Games',
  splashDuration: 2000,
} as const;

// Centralized branding — single source of truth for all share images and UI.
// appName is FIXED and non-translatable. Only tagline is localized.
export const APP_BRANDING = {
  appName: 'Luz Diaria',
  tagline: {
    es: 'Un devocional para cada día',
    en: 'A devotional for every day',
  },
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
  { id: 'avatar_dove', name: 'Dove', nameEs: 'Paloma', emoji: '🕊️', description: 'Peace of the Spirit', descriptionEs: 'Paz del Espiritu', unlocked: true, rarity: 'common' },
  { id: 'avatar_sun', name: 'Sun', nameEs: 'Sol', emoji: '☀️', description: 'Light of the world', descriptionEs: 'Luz del mundo', unlocked: true, rarity: 'common' },
  { id: 'avatar_star', name: 'Star', nameEs: 'Estrella', emoji: '⭐', description: 'Guiding light', descriptionEs: 'Luz que guia', unlocked: true, rarity: 'common' },
  { id: 'avatar_heart', name: 'Heart', nameEs: 'Corazon', emoji: '❤️', description: 'Love without end', descriptionEs: 'Amor sin fin', unlocked: true, rarity: 'common' },
  { id: 'avatar_cross', name: 'Cross', nameEs: 'Cruz', emoji: '✝️', description: 'Symbol of salvation', descriptionEs: 'Simbolo de salvacion', unlocked: true, rarity: 'common' },
  { id: 'avatar_candle', name: 'Candle', nameEs: 'Vela', emoji: '🕯️', description: 'Illuminating faith', descriptionEs: 'Fe que ilumina', unlocked: true, rarity: 'common' },
  { id: 'avatar_book', name: 'Book', nameEs: 'Libro', emoji: '📖', description: 'The living Word', descriptionEs: 'La Palabra viva', unlocked: true, rarity: 'common' },
  { id: 'avatar_praying', name: 'Praying', nameEs: 'Orando', emoji: '🙏', description: 'Hands of devotion', descriptionEs: 'Manos de devocion', unlocked: true, rarity: 'common' },
  { id: 'avatar_rainbow', name: 'Rainbow', nameEs: 'Arcoiris', emoji: '🌈', description: 'Promise of God', descriptionEs: 'Promesa de Dios', price: 200, rarity: 'rare' },
  { id: 'avatar_crown', name: 'Crown', nameEs: 'Corona', emoji: '👑', description: 'Crown of glory', descriptionEs: 'Corona de gloria', price: 500, rarity: 'epic' },
  { id: 'avatar_angel', name: 'Angel', nameEs: 'Angel', emoji: '😇', description: 'Heavenly messenger', descriptionEs: 'Mensajero celestial', price: 300, rarity: 'rare' },
  { id: 'avatar_olive', name: 'Olive Branch', nameEs: 'Rama de Olivo', emoji: '🫒', description: 'Sign of peace', descriptionEs: 'Signo de paz', price: 250, rarity: 'rare' },
  { id: 'avatar_lamb', name: 'Lamb', nameEs: 'Cordero', emoji: '🐑', description: 'Gentle and pure', descriptionEs: 'Gentil y puro', price: 400, rarity: 'rare' },
  { id: 'avatar_fish', name: 'Fish', nameEs: 'Pez', emoji: '🐟', description: 'Early Christian symbol', descriptionEs: 'Simbolo cristiano primitivo', price: 150, rarity: 'common' },
  // ============================================
  // AVATARS V2 - Premium Illustrated Collection
  // Collection 1: Simbolos de Fe (Symbols of Faith)
  // ============================================
  { id: 'avatar_v2_paloma_paz', name: 'Dove of Peace', nameEs: 'Paloma de Paz', emoji: '🕊️', description: 'Premium illustrated dove with olive branch', descriptionEs: 'Paloma ilustrada premium con rama de olivo', price: 450, rarity: 'rare', collectionId: 'collection_v2_simbolos_fe', isV2: true },
  { id: 'avatar_v2_cruz_radiante', name: 'Radiant Cross', nameEs: 'Cruz Radiante', emoji: '✝️', description: 'Glowing cross with divine rays', descriptionEs: 'Cruz resplandeciente con rayos divinos', price: 500, rarity: 'rare', collectionId: 'collection_v2_simbolos_fe', isV2: true },
  { id: 'avatar_v2_lampara_aceite', name: 'Oil Lamp', nameEs: 'Lampara de Aceite', emoji: '🪔', description: 'Ancient oil lamp burning bright', descriptionEs: 'Lampara de aceite antigua ardiendo brillante', price: 280, rarity: 'common', collectionId: 'collection_v2_simbolos_fe', isV2: true },
  { id: 'avatar_v2_corona_vida', name: 'Crown of Life', nameEs: 'Corona de Vida', emoji: '👑', description: 'Majestic crown adorned with jewels', descriptionEs: 'Corona majestuosa adornada con joyas', price: 2500, rarity: 'epic', collectionId: 'collection_v2_simbolos_fe', isV2: true },
  { id: 'avatar_v2_biblia_abierta', name: 'Open Bible', nameEs: 'Biblia Abierta', emoji: '📖', description: 'Holy scriptures with radiant glow', descriptionEs: 'Escrituras santas con resplandor radiante', price: 320, rarity: 'common', collectionId: 'collection_v2_simbolos_fe', isV2: true },
  { id: 'avatar_v2_caliz', name: 'Holy Chalice', nameEs: 'Caliz Sagrado', emoji: '🏆', description: 'Sacred cup of communion', descriptionEs: 'Copa sagrada de la comunion', price: 550, rarity: 'rare', collectionId: 'collection_v2_simbolos_fe', isV2: true },
  { id: 'avatar_v2_ancla_esperanza', name: 'Anchor of Hope', nameEs: 'Ancla de Esperanza', emoji: '⚓', description: 'Steadfast anchor representing hope', descriptionEs: 'Ancla firme representando esperanza', price: 480, rarity: 'rare', collectionId: 'collection_v2_simbolos_fe', isV2: true },
  { id: 'avatar_v2_pan_uvas', name: 'Bread and Grapes', nameEs: 'Pan y Uvas', emoji: '🍇', description: 'Communion bread with grapes', descriptionEs: 'Pan de comunion con uvas', price: 350, rarity: 'common', collectionId: 'collection_v2_simbolos_fe', isV2: true },
  // ============================================
  // Collection 2: Naturaleza Biblica (Biblical Nature)
  // ============================================
  { id: 'avatar_v2_rama_olivo', name: 'Olive Branch', nameEs: 'Rama de Olivo', emoji: '🌿', description: 'Lush olive branch of peace', descriptionEs: 'Exuberante rama de olivo de paz', price: 260, rarity: 'common', collectionId: 'collection_v2_naturaleza', isV2: true },
  { id: 'avatar_v2_pez_ichthys', name: 'Ichthys Fish', nameEs: 'Pez Ichthys', emoji: '🐠', description: 'Ornate Christian fish symbol', descriptionEs: 'Simbolo del pez cristiano ornamentado', price: 300, rarity: 'common', collectionId: 'collection_v2_naturaleza', isV2: true },
  { id: 'avatar_v2_cordero', name: 'Lamb of God', nameEs: 'Cordero de Dios', emoji: '🐑', description: 'Pure white lamb with halo', descriptionEs: 'Cordero blanco puro con aureola', price: 600, rarity: 'rare', collectionId: 'collection_v2_naturaleza', isV2: true },
  { id: 'avatar_v2_leon', name: 'Lion of Judah', nameEs: 'Leon de Juda', emoji: '🦁', description: 'Majestic lion with golden mane', descriptionEs: 'Leon majestuoso con melena dorada', price: 3500, rarity: 'epic', collectionId: 'collection_v2_naturaleza', isV2: true },
  { id: 'avatar_v2_semilla_mostaza', name: 'Mustard Seed', nameEs: 'Semilla de Mostaza', emoji: '🌱', description: 'Tiny seed growing into faith', descriptionEs: 'Pequena semilla creciendo en fe', price: 520, rarity: 'rare', collectionId: 'collection_v2_naturaleza', isV2: true },
  { id: 'avatar_v2_vid_racimos', name: 'Vine and Grapes', nameEs: 'Vid y Racimos', emoji: '🍇', description: 'Abundant vine with clusters', descriptionEs: 'Vid abundante con racimos', price: 340, rarity: 'common', collectionId: 'collection_v2_naturaleza', isV2: true },
  // ============================================
  // Collection 3: Virtudes (Virtues)
  // ============================================
  { id: 'avatar_v2_gratitud', name: 'Gratitude', nameEs: 'Gratitud', emoji: '💖', description: 'Heart radiating thankful light', descriptionEs: 'Corazon irradiando luz de agradecimiento', price: 320, rarity: 'common', collectionId: 'collection_v2_virtudes', isV2: true },
  { id: 'avatar_v2_fe', name: 'Faith', nameEs: 'Fe', emoji: '🛡️', description: 'Shield of unwavering faith', descriptionEs: 'Escudo de fe inquebrantable', price: 580, rarity: 'rare', collectionId: 'collection_v2_virtudes', isV2: true },
  { id: 'avatar_v2_amor', name: 'Love', nameEs: 'Amor', emoji: '🤲', description: 'Hands reaching with compassion', descriptionEs: 'Manos extendidas con compasion', price: 550, rarity: 'rare', collectionId: 'collection_v2_virtudes', isV2: true },
  { id: 'avatar_v2_paz', name: 'Peace', nameEs: 'Paz', emoji: '☮️', description: 'Dove with olive in serene sky', descriptionEs: 'Paloma con olivo en cielo sereno', price: 500, rarity: 'rare', collectionId: 'collection_v2_virtudes', isV2: true },
  { id: 'avatar_v2_gozo', name: 'Joy', nameEs: 'Gozo', emoji: '✨', description: 'Radiant sun with sparkles', descriptionEs: 'Sol radiante con destellos', price: 350, rarity: 'common', collectionId: 'collection_v2_virtudes', isV2: true },
  { id: 'avatar_v2_valentia', name: 'Courage', nameEs: 'Valentia', emoji: '⚔️', description: 'Sword of light conquering darkness', descriptionEs: 'Espada de luz conquistando oscuridad', price: 1800, rarity: 'epic', collectionId: 'collection_v2_virtudes', isV2: true },
  // ============================================
  // Collection 4: Kids Friendly (Infantil)
  // ============================================
  { id: 'avatar_v2_estrellita', name: 'Little Star', nameEs: 'Estrellita', emoji: '🌟', description: 'Cute twinkling star with smile', descriptionEs: 'Linda estrella parpadeante con sonrisa', price: 200, rarity: 'common', collectionId: 'collection_v2_kids', isV2: true },
  { id: 'avatar_v2_arcoiris', name: 'Soft Rainbow', nameEs: 'Arcoiris Suave', emoji: '🌈', description: 'Gentle pastel rainbow arc', descriptionEs: 'Suave arco iris en tonos pastel', price: 240, rarity: 'common', collectionId: 'collection_v2_kids', isV2: true },
  { id: 'avatar_v2_nube', name: 'Happy Cloud', nameEs: 'Nube Feliz', emoji: '☁️', description: 'Fluffy cloud with happy face', descriptionEs: 'Nube esponjosa con cara feliz', price: 450, rarity: 'rare', collectionId: 'collection_v2_kids', isV2: true },
  { id: 'avatar_v2_angelito', name: 'Little Angel', nameEs: 'Angelito', emoji: '👼', description: 'Adorable cherub with wings', descriptionEs: 'Adorable querubin con alas', price: 550, rarity: 'rare', collectionId: 'collection_v2_kids', isV2: true },
  // ============================================
  // AVATARS V2 LEVEL 2 — Identity & Calling
  // Collection A: Virtudes del Reino (Kingdom Virtues)
  // ============================================
  { id: 'avatar_l2_corazon_agradecido', name: 'Grateful Heart', nameEs: 'Corazon Agradecido', emoji: '🫀', description: 'A heart overflowing with gratitude toward God.', descriptionEs: 'Un corazon que desborda gratitud hacia Dios.', price: 480, rarity: 'rare', collectionId: 'collection_l2_virtudes_reino', isV2: true, meaning: 'Representa una vida marcada por el agradecimiento constante a Dios en cada circunstancia.', meaningEn: 'Represents a life marked by constant thankfulness to God in every circumstance.' },
  { id: 'avatar_l2_espiritu_humilde', name: 'Humble Spirit', nameEs: 'Espiritu Humilde', emoji: '🌾', description: 'Bowing low before God and others.', descriptionEs: 'Inclinandose ante Dios y los demas.', price: 420, rarity: 'rare', collectionId: 'collection_l2_virtudes_reino', isV2: true, meaning: 'Representa la humildad del que sirve en silencio, sin buscar reconocimiento.', meaningEn: 'Represents the humility of one who serves quietly, without seeking recognition.' },
  { id: 'avatar_l2_gozo_constante', name: 'Constant Joy', nameEs: 'Gozo Constante', emoji: '☀️', description: 'Joy that endures through every season.', descriptionEs: 'Gozo que persiste en toda temporada.', price: 350, rarity: 'common', collectionId: 'collection_l2_virtudes_reino', isV2: true, meaning: 'Representa el gozo profundo que no depende de las circunstancias sino de la presencia de Dios.', meaningEn: 'Represents the deep joy that does not depend on circumstances but on God\'s presence.' },
  { id: 'avatar_l2_fe_inquebrantable', name: 'Unshakeable Faith', nameEs: 'Fe Inquebrantable', emoji: '⛰️', description: 'Faith that stands firm like a mountain.', descriptionEs: 'Fe que se mantiene firme como una montana.', price: 1200, rarity: 'epic', collectionId: 'collection_l2_virtudes_reino', isV2: true, meaning: 'Representa una fe solida, probada en la tormenta y firme ante cualquier desafio.', meaningEn: 'Represents a solid faith, tested in the storm and firm before any challenge.' },
  { id: 'avatar_l2_amor_sacrificial', name: 'Sacrificial Love', nameEs: 'Amor Sacrificial', emoji: '🔥', description: 'Love that gives without counting the cost.', descriptionEs: 'Amor que da sin contar el costo.', price: 650, rarity: 'rare', collectionId: 'collection_l2_virtudes_reino', isV2: true, meaning: 'Representa el amor que se entrega por completo, siguiendo el ejemplo de Cristo.', meaningEn: 'Represents love that gives itself completely, following the example of Christ.' },
  { id: 'avatar_l2_paz_permanece', name: 'Peace That Remains', nameEs: 'Paz que Permanece', emoji: '🌊', description: 'Still waters amid life\'s storms.', descriptionEs: 'Aguas tranquilas en medio de las tormentas.', price: 520, rarity: 'rare', collectionId: 'collection_l2_virtudes_reino', isV2: true, meaning: 'Representa la paz sobrenatural que guarda el corazon en medio de toda adversidad.', meaningEn: 'Represents the supernatural peace that guards the heart amid all adversity.' },
  // ============================================
  // Collection B: Llamados (Callings)
  // ============================================
  { id: 'avatar_l2_siervo_fiel', name: 'Faithful Servant', nameEs: 'Siervo Fiel', emoji: '🪴', description: 'One who tends faithfully what God has entrusted.', descriptionEs: 'Quien cuida fielmente lo que Dios ha confiado.', price: 400, rarity: 'rare', collectionId: 'collection_l2_llamados', isV2: true, meaning: 'Representa al creyente que sirve con fidelidad, sin importar si es visto o reconocido.', meaningEn: 'Represents the believer who serves faithfully, regardless of whether seen or recognized.', unlockType: 'streak', unlockValue: 7 },
  { id: 'avatar_l2_guerrero_oracion', name: 'Prayer Warrior', nameEs: 'Guerrero de Oracion', emoji: '🛡️', description: 'One who intercedes fiercely on behalf of others.', descriptionEs: 'Quien intercede fervientemente por los demas.', price: 800, rarity: 'epic', collectionId: 'collection_l2_llamados', isV2: true, meaning: 'Representa la vida de intercesion que mueve el corazon de Dios y cambia la realidad.', meaningEn: 'Represents the life of intercession that moves the heart of God and changes reality.', unlockType: 'streak', unlockValue: 14 },
  { id: 'avatar_l2_portador_luz', name: 'Light Bearer', nameEs: 'Portador de Luz', emoji: '🕯️', description: 'One who carries the light into dark places.', descriptionEs: 'Quien lleva la luz a los lugares oscuros.', price: 580, rarity: 'rare', collectionId: 'collection_l2_llamados', isV2: true, meaning: 'Representa la mision de ser luz en el mundo, reflejo de la gloria de Dios.', meaningEn: 'Represents the mission of being light in the world, a reflection of God\'s glory.', unlockType: 'devotionals', unlockValue: 30 },
  { id: 'avatar_l2_atalaya', name: 'Watchman', nameEs: 'Atalaya', emoji: '🔭', description: 'One who watches, prays, and stands guard.', descriptionEs: 'Quien vigila, ora y monta guardia.', price: 1500, rarity: 'epic', collectionId: 'collection_l2_llamados', isV2: true, meaning: 'Representa al creyente llamado a la oracion de guardia, protegiendo con su intercesion.', meaningEn: 'Represents the believer called to watchful prayer, protecting through intercession.', unlockType: 'devotionals', unlockValue: 50 },
  { id: 'avatar_l2_sembrador', name: 'Sower', nameEs: 'Sembrador', emoji: '🌱', description: 'One who plants seeds of faith and hope.', descriptionEs: 'Quien siembra semillas de fe y esperanza.', price: 450, rarity: 'rare', collectionId: 'collection_l2_llamados', isV2: true, meaning: 'Representa la vocacion de sembrar la Palabra con paciencia, confiando en la cosecha de Dios.', meaningEn: 'Represents the calling to sow the Word patiently, trusting in God\'s harvest.', unlockType: 'share', unlockValue: 5 },
  { id: 'avatar_l2_testigo', name: 'Witness', nameEs: 'Testigo', emoji: '📣', description: 'One who declares what they have seen and heard.', descriptionEs: 'Quien declara lo que ha visto y oido.', price: 600, rarity: 'rare', collectionId: 'collection_l2_llamados', isV2: true, meaning: 'Representa la identidad del creyente como testigo fiel de la gracia de Dios en su vida.', meaningEn: 'Represents the believer\'s identity as faithful witness to God\'s grace in their life.', unlockType: 'share', unlockValue: 10 },
  // ============================================
  // Collection C: Simbolos Profundos (Deep Symbols)
  // ============================================
  { id: 'avatar_l2_lampara_encendida', name: 'Lit Lamp', nameEs: 'Lampara Encendida', emoji: '🔦', description: 'The lamp that never goes out.', descriptionEs: 'La lampara que nunca se apaga.', price: 380, rarity: 'common', collectionId: 'collection_l2_simbolos_profundos', isV2: true, meaning: 'Representa la Palabra de Dios como lampara a los pies y lumbrera al camino del creyente.', meaningEn: 'Represents God\'s Word as a lamp to the believer\'s feet and a light to their path.' },
  { id: 'avatar_l2_corona_vida', name: 'Crown of Life', nameEs: 'Corona de Vida', emoji: '👑', description: 'The reward promised to those who endure.', descriptionEs: 'La recompensa prometida a quienes perseveran.', price: 2800, rarity: 'epic', collectionId: 'collection_l2_simbolos_profundos', isV2: true, meaning: 'Representa la corona prometida al fiel que persevera hasta el fin con amor a Dios.', meaningEn: 'Represents the crown promised to the faithful who persevere to the end with love for God.', unlockType: 'streak', unlockValue: 30 },
  { id: 'avatar_l2_espada_espiritu', name: 'Sword of the Spirit', nameEs: 'Espada del Espiritu', emoji: '⚡', description: 'The Word of God as a living, active weapon.', descriptionEs: 'La Palabra de Dios como arma viva y activa.', price: 1800, rarity: 'epic', collectionId: 'collection_l2_simbolos_profundos', isV2: true, meaning: 'Representa la Palabra de Dios que es viva, eficaz y mas cortante que toda espada.', meaningEn: 'Represents the Word of God that is living, active, and sharper than any double-edged sword.' },
  { id: 'avatar_l2_ancla_alma', name: 'Soul Anchor', nameEs: 'Ancla del Alma', emoji: '⚓', description: 'Hope as an anchor for the soul.', descriptionEs: 'La esperanza como ancla del alma.', price: 700, rarity: 'rare', collectionId: 'collection_l2_simbolos_profundos', isV2: true, meaning: 'Representa la esperanza en Cristo como ancla firme que sostiene el alma en toda tormenta.', meaningEn: 'Represents hope in Christ as a firm anchor that holds the soul through every storm.' },
  { id: 'avatar_l2_pergamino_vivo', name: 'Living Scroll', nameEs: 'Pergamino Vivo', emoji: '📜', description: 'A life written by God\'s own hand.', descriptionEs: 'Una vida escrita por la propia mano de Dios.', price: 560, rarity: 'rare', collectionId: 'collection_l2_simbolos_profundos', isV2: true, meaning: 'Representa al creyente como carta viva de Cristo, escrita no con tinta sino con el Espiritu.', meaningEn: 'Represents the believer as a living letter from Christ, written not with ink but with the Spirit.', unlockType: 'devotionals', unlockValue: 21 },
  { id: 'avatar_l2_fuente_agua', name: 'Living Water', nameEs: 'Fuente de Agua Viva', emoji: '💧', description: 'The spring of living water that never runs dry.', descriptionEs: 'El manantial de agua viva que nunca se agota.', price: 900, rarity: 'epic', collectionId: 'collection_l2_simbolos_profundos', isV2: true, meaning: 'Representa a Cristo como la unica fuente de agua viva que sacia la sed del alma para siempre.', meaningEn: 'Represents Christ as the only source of living water that forever satisfies the soul\'s thirst.' },
  // ============================================
  // AVENTURAS BÍBLICAS — Adventure Items
  // Aventura 1: Jonás | Aventura 2: David | Aventura 3: Ester | Aventura 4: Daniel
  // ============================================
  { id: 'avatar_adv_jonah_whale', name: 'Jonah\'s Whale', nameEs: 'Ballena de Jonás', emoji: '🐋', description: 'The great fish that carried Jonah', descriptionEs: 'El gran pez que cargo a Jonás', price: 0, rarity: 'epic', isV2: true, collectionId: 'adventure_jonas', chestOnly: true, isAdventure: true },
  { id: 'avatar_adv_david_sling', name: 'David with Sling', nameEs: 'David con Honda', emoji: '🪨', description: 'The shepherd who faced a giant with faith', descriptionEs: 'El pastorcillo que enfrentó a un gigante con fe', price: 0, rarity: 'epic', isV2: true, collectionId: 'adventure_david', chestOnly: true, isAdventure: true },
  { id: 'avatar_adv_queen_esther', name: 'Queen Esther', nameEs: 'Reina Ester', emoji: '👑', description: 'The queen who saved her people', descriptionEs: 'La reina que salvó a su pueblo', price: 0, rarity: 'epic', isV2: true, collectionId: 'adventure_esther', chestOnly: true, isAdventure: true },
  { id: 'avatar_adv_lion_faith', name: 'Lion of Faith', nameEs: 'León de la Fe', emoji: '🦁', description: 'Daniel standing firm before the lions', descriptionEs: 'Daniel firme ante los leones', price: 0, rarity: 'epic', isV2: true, collectionId: 'adventure_daniel', chestOnly: true, isAdventure: true },
  // ============================================
  // AVATARS V3 — Animated Adventure Avatars
  // animationReady: true indicates Lottie/Rive animation support prepared
  // ============================================
  { id: 'avatar_adv_moses_sea', name: 'Moses at the Sea', nameEs: 'Moisés en el Mar', emoji: '🌊', description: 'The sea parts before Moses', descriptionEs: 'El mar se abre ante Moisés', price: 0, rarity: 'epic', isV2: true, collectionId: 'adventure_moses', chestOnly: true, isAdventure: true, animationReady: true, animationType: 'subtle_loop' },
  { id: 'avatar_adv_noah_dove', name: 'Noah\'s Dove', nameEs: 'Paloma de Noé', emoji: '🕊️', description: 'The dove that carried the promise of peace', descriptionEs: 'La paloma que cargó la promesa de paz', price: 0, rarity: 'epic', isV2: true, collectionId: 'adventure_noah', chestOnly: true, isAdventure: true, animationReady: true, animationType: 'subtle_loop' },
  { id: 'avatar_adv_elijah_fire', name: 'Elijah\'s Fire', nameEs: 'Fuego de Elías', emoji: '🔥', description: 'Fire from heaven answering Elijah\'s prayer', descriptionEs: 'Fuego del cielo respondiendo la oración de Elías', price: 0, rarity: 'epic', isV2: true, collectionId: 'adventure_elijah', chestOnly: true, isAdventure: true, animationReady: true, animationType: 'subtle_loop' },
  { id: 'avatar_adv_joseph_dream', name: 'Joseph the Dreamer', nameEs: 'José el Soñador', emoji: '⭐', description: 'The dreamer whose visions came from God', descriptionEs: 'El soñador cuyas visiones venían de Dios', price: 0, rarity: 'epic', isV2: true, collectionId: 'adventure_joseph', chestOnly: true, isAdventure: true, animationReady: true, animationType: 'subtle_loop' },
  { id: 'avatar_adv_paul_scroll', name: 'Paul with Scroll', nameEs: 'Pablo con Pergamino', emoji: '📜', description: 'The apostle who wrote to the nations', descriptionEs: 'El apóstol que escribió a las naciones', price: 0, rarity: 'epic', isV2: true, collectionId: 'adventure_paul', chestOnly: true, isAdventure: true, animationReady: true, animationType: 'subtle_loop' },
  // ── V3 Animated upgrades for existing adventure avatars ──────────────────────
  // These are metadata-only markers — existing IDs keep their data unchanged above.
  // V3 animation hints are carried by the new adventure avatars listed above.
  // ============================================
  // Chapter Collection Avatars
  // ============================================
  { id: 'avatar_promise_scroll', name: 'Promise Scroll', nameEs: 'Pergamino de Promesa', emoji: '📜', description: 'Ancient scroll bearing divine promises', descriptionEs: 'Pergamino antiguo con promesas divinas', price: 350, rarity: 'rare' },
  { id: 'avatar_guiding_star', name: 'Guiding Star', nameEs: 'Estrella Guia', emoji: '🌟', description: 'Star that guides toward fulfillment', descriptionEs: 'Estrella que guia hacia el cumplimiento', price: 400, rarity: 'rare' },
  { id: 'avatar_joyful_heart', name: 'Joyful Heart', nameEs: 'Corazon Alegre', emoji: '💛', description: 'Heart overflowing with the fruit of joy', descriptionEs: 'Corazon desbordando el fruto del gozo', price: 300, rarity: 'common' },
  { id: 'avatar_serving_hands', name: 'Serving Hands', nameEs: 'Manos Serviciales', emoji: '🤲', description: 'Hands of goodness and service', descriptionEs: 'Manos de bondad en servicio', price: 350, rarity: 'rare' },
  { id: 'avatar_lamp_lit', name: 'Lamp of Truth', nameEs: 'Lampara de la Verdad', emoji: '🪔', description: 'Lamp of truth lighting the path', descriptionEs: 'Lampara de verdad iluminando el camino', price: 350, rarity: 'rare' },
  { id: 'avatar_sword_spirit', name: 'Sword of the Spirit', nameEs: 'Espada del Espiritu', emoji: '⚔️', description: 'Living Word as a spiritual weapon', descriptionEs: 'Palabra viva como arma espiritual', price: 500, rarity: 'epic' },
  // ============================================
  // EXCLUSIVE CHEST AVATARS - Solo del Cofre Semanal
  // ============================================
  { id: 'avatar_chest_serafin', name: 'Seraph', nameEs: 'Serafin', emoji: '🔥', description: 'Six-winged heavenly being of fire', descriptionEs: 'Ser celestial de fuego con seis alas', chestOnly: true, rarity: 'epic' },
  { id: 'avatar_chest_zarza', name: 'Burning Bush', nameEs: 'Zarza Ardiente', emoji: '🌳', description: 'The holy fire of divine encounter', descriptionEs: 'El fuego sagrado del encuentro divino', chestOnly: true, rarity: 'epic' },
  { id: 'avatar_chest_mana', name: 'Manna', nameEs: 'Mana del Cielo', emoji: '❄️', description: 'Bread from heaven, daily provision', descriptionEs: 'Pan del cielo, provision diaria', chestOnly: true, rarity: 'rare' },
  { id: 'avatar_chest_trompeta', name: 'Shofar', nameEs: 'Shofar', emoji: '📯', description: 'Horn of proclamation and glory', descriptionEs: 'Cuerno de proclamacion y gloria', chestOnly: true, rarity: 'epic' },
  { id: 'avatar_chest_palacio', name: 'Heavenly Gate', nameEs: 'Puerta Celestial', emoji: '🏛️', description: 'Gateway to the eternal kingdom', descriptionEs: 'Puerta al reino eterno', chestOnly: true, rarity: 'epic' },
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
  description: string;
  descriptionEs: string;
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
  price?: number;
  rarity: string;
  chestOnly?: boolean;
}> = {
  theme_amanecer: {
    id: 'theme_amanecer',
    name: 'Sunrise',
    nameEs: 'Amanecer',
    description: 'Warm tones of a new day',
    descriptionEs: 'Tonos calidos de un nuevo dia',
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
    description: 'Calm serenity under the stars',
    descriptionEs: 'Serenidad bajo las estrellas',
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
    description: 'Refreshing green sanctuary',
    descriptionEs: 'Santuario verde refrescante',
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
    description: 'Warm sands of contemplation',
    descriptionEs: 'Arenas calidas de contemplacion',
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
    description: 'Royal hues of divine covenant',
    descriptionEs: 'Tonos reales del pacto divino',
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
    description: 'Clean simplicity for focus',
    descriptionEs: 'Simplicidad limpia para el enfoque',
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
  // ============================================
  // THEMES V2 - Premium Palettes
  // ============================================
  theme_amanecer_dorado: {
    id: 'theme_amanecer_dorado',
    name: 'Golden Dawn',
    nameEs: 'Amanecer Dorado',
    description: 'Radiant gold hues of a new beginning',
    descriptionEs: 'Tonos dorados radiantes de un nuevo comienzo',
    colors: {
      primary: '#D97706',
      secondary: '#F59E0B',
      accent: '#FCD34D',
      background: '#FFFBEB',
      backgroundDark: '#1C1917',
      surface: '#FFFFFF',
      surfaceDark: '#292524',
      text: '#78350F',
      textDark: '#FEF3C7',
      textMuted: '#B45309',
      textMutedDark: '#FCD34D',
    },
    price: 500,
    rarity: 'rare',
  },
  theme_noche_profunda: {
    id: 'theme_noche_profunda',
    name: 'Deep Night Peace',
    nameEs: 'Noche de Paz Profunda',
    description: 'Serene darkness with celestial stars',
    descriptionEs: 'Oscuridad serena con estrellas celestiales',
    colors: {
      primary: '#4338CA',
      secondary: '#6366F1',
      accent: '#A5B4FC',
      background: '#0F0D1A',
      backgroundDark: '#0F0D1A',
      surface: '#1E1B2E',
      surfaceDark: '#1E1B2E',
      text: '#E0E7FF',
      textDark: '#E0E7FF',
      textMuted: '#818CF8',
      textMutedDark: '#818CF8',
    },
    price: 550,
    rarity: 'rare',
  },
  theme_bosque_sereno: {
    id: 'theme_bosque_sereno',
    name: 'Serene Forest',
    nameEs: 'Bosque Sereno',
    description: 'Peaceful green sanctuary of nature',
    descriptionEs: 'Santuario verde y pacifico de la naturaleza',
    colors: {
      primary: '#059669',
      secondary: '#10B981',
      accent: '#6EE7B7',
      background: '#ECFDF5',
      backgroundDark: '#022C22',
      surface: '#FFFFFF',
      surfaceDark: '#064E3B',
      text: '#064E3B',
      textDark: '#D1FAE5',
      textMuted: '#047857',
      textMutedDark: '#6EE7B7',
    },
    price: 300,
    rarity: 'common',
  },
  theme_desierto_suave: {
    id: 'theme_desierto_suave',
    name: 'Soft Desert',
    nameEs: 'Desierto Suave',
    description: 'Warm sand tones of contemplation',
    descriptionEs: 'Tonos arena calidos de contemplacion',
    colors: {
      primary: '#C2410C',
      secondary: '#EA580C',
      accent: '#FED7AA',
      background: '#FFF7ED',
      backgroundDark: '#1C1410',
      surface: '#FFFFFF',
      surfaceDark: '#292018',
      text: '#7C2D12',
      textDark: '#FFEDD5',
      textMuted: '#C2410C',
      textMutedDark: '#FDBA74',
    },
    price: 280,
    rarity: 'common',
  },
  theme_promesa_violeta: {
    id: 'theme_promesa_violeta',
    name: 'Violet Promise',
    nameEs: 'Promesa Violeta',
    description: 'Royal purple of divine covenant',
    descriptionEs: 'Purpura real del pacto divino',
    colors: {
      primary: '#7C3AED',
      secondary: '#8B5CF6',
      accent: '#C4B5FD',
      background: '#F5F3FF',
      backgroundDark: '#1E1033',
      surface: '#FFFFFF',
      surfaceDark: '#2E1B4B',
      text: '#4C1D95',
      textDark: '#EDE9FE',
      textMuted: '#7C3AED',
      textMutedDark: '#A78BFA',
    },
    price: 650,
    rarity: 'rare',
  },
  theme_cielo_gloria: {
    id: 'theme_cielo_gloria',
    name: 'Sky of Glory',
    nameEs: 'Cielo de Gloria',
    description: 'Majestic sky blue of heavenly realms',
    descriptionEs: 'Azul cielo majestuoso de reinos celestiales',
    colors: {
      primary: '#0284C7',
      secondary: '#0EA5E9',
      accent: '#7DD3FC',
      background: '#F0F9FF',
      backgroundDark: '#082F49',
      surface: '#FFFFFF',
      surfaceDark: '#0C4A6E',
      text: '#075985',
      textDark: '#E0F2FE',
      textMuted: '#0369A1',
      textMutedDark: '#38BDF8',
    },
    price: 550,
    rarity: 'rare',
  },
  theme_mar_misericordia: {
    id: 'theme_mar_misericordia',
    name: 'Sea of Mercy',
    nameEs: 'Mar de Misericordia',
    description: 'Teal depths of endless grace',
    descriptionEs: 'Profundidades aguamarina de gracia infinita',
    colors: {
      primary: '#0D9488',
      secondary: '#14B8A6',
      accent: '#5EEAD4',
      background: '#F0FDFA',
      backgroundDark: '#042F2E',
      surface: '#FFFFFF',
      surfaceDark: '#134E4A',
      text: '#115E59',
      textDark: '#CCFBF1',
      textMuted: '#0F766E',
      textMutedDark: '#2DD4BF',
    },
    price: 320,
    rarity: 'common',
  },
  theme_fuego_espiritu: {
    id: 'theme_fuego_espiritu',
    name: 'Fire of the Spirit',
    nameEs: 'Fuego del Espiritu',
    description: 'Holy flames of divine presence',
    descriptionEs: 'Llamas santas de la presencia divina',
    colors: {
      primary: '#DC2626',
      secondary: '#F97316',
      accent: '#FDE68A',
      background: '#FEF2F2',
      backgroundDark: '#1C1410',
      surface: '#FFFFFF',
      surfaceDark: '#2A1810',
      text: '#991B1B',
      textDark: '#FEE2E2',
      textMuted: '#DC2626',
      textMutedDark: '#FCA5A5',
    },
    price: 1500,
    rarity: 'epic',
  },
  theme_jardin_gracia: {
    id: 'theme_jardin_gracia',
    name: 'Garden of Grace',
    nameEs: 'Jardin de Gracia',
    description: 'Blooming garden of divine favor',
    descriptionEs: 'Jardin florido del favor divino',
    colors: {
      primary: '#DB2777',
      secondary: '#EC4899',
      accent: '#FBCFE8',
      background: '#FDF2F8',
      backgroundDark: '#1A0D14',
      surface: '#FFFFFF',
      surfaceDark: '#2D1520',
      text: '#831843',
      textDark: '#FCE7F3',
      textMuted: '#BE185D',
      textMutedDark: '#F472B6',
    },
    price: 380,
    rarity: 'common',
  },
  theme_olivo_paz: {
    id: 'theme_olivo_paz',
    name: 'Olive and Peace',
    nameEs: 'Olivo y Paz',
    description: 'Ancient olive hues of harmony',
    descriptionEs: 'Tonos antiguos de olivo y armonia',
    colors: {
      primary: '#65A30D',
      secondary: '#84CC16',
      accent: '#BEF264',
      background: '#F7FEE7',
      backgroundDark: '#1A2E05',
      surface: '#FFFFFF',
      surfaceDark: '#3F6212',
      text: '#365314',
      textDark: '#ECFCCB',
      textMuted: '#4D7C0F',
      textMutedDark: '#A3E635',
    },
    price: 300,
    rarity: 'common',
  },
  theme_trono_azul: {
    id: 'theme_trono_azul',
    name: 'Blue Throne',
    nameEs: 'Trono Azul',
    description: 'Royal blue of the heavenly throne',
    descriptionEs: 'Azul real del trono celestial',
    colors: {
      primary: '#1D4ED8',
      secondary: '#3B82F6',
      accent: '#93C5FD',
      background: '#EFF6FF',
      backgroundDark: '#0F172A',
      surface: '#FFFFFF',
      surfaceDark: '#1E3A5F',
      text: '#1E3A8A',
      textDark: '#DBEAFE',
      textMuted: '#2563EB',
      textMutedDark: '#60A5FA',
    },
    price: 600,
    rarity: 'rare',
  },
  theme_lampara_encendida: {
    id: 'theme_lampara_encendida',
    name: 'Burning Lamp',
    nameEs: 'Lampara Encendida',
    description: 'Warm glow of the ever-burning lamp',
    descriptionEs: 'Resplandor calido de la lampara ardiente',
    colors: {
      primary: '#B45309',
      secondary: '#D97706',
      accent: '#FDE68A',
      background: '#FFFBEB',
      backgroundDark: '#1C1712',
      surface: '#FFFFFF',
      surfaceDark: '#292418',
      text: '#78350F',
      textDark: '#FEF3C7',
      textMuted: '#D97706',
      textMutedDark: '#FBBF24',
    },
    price: 520,
    rarity: 'rare',
  },
  theme_pergamino_antiguo: {
    id: 'theme_pergamino_antiguo',
    name: 'Ancient Parchment',
    nameEs: 'Pergamino Antiguo',
    description: 'Timeless sepia of sacred scrolls',
    descriptionEs: 'Sepia atemporal de pergaminos sagrados',
    colors: {
      primary: '#A16207',
      secondary: '#CA8A04',
      accent: '#FEF08A',
      background: '#FEFCE8',
      backgroundDark: '#1A1608',
      surface: '#FFFFFF',
      surfaceDark: '#2E2810',
      text: '#713F12',
      textDark: '#FEF9C3',
      textMuted: '#A16207',
      textMutedDark: '#FACC15',
    },
    price: 350,
    rarity: 'common',
  },
  theme_luz_celestial: {
    id: 'theme_luz_celestial',
    name: 'Celestial Light',
    nameEs: 'Luz Celestial',
    description: 'Ethereal glow from heavenly realms',
    descriptionEs: 'Resplandor etereo de los cielos',
    colors: {
      primary: '#7C3AED',
      secondary: '#60A5FA',
      accent: '#FDE68A',
      background: '#FAFAFA',
      backgroundDark: '#0F0A1A',
      surface: '#FFFFFF',
      surfaceDark: '#1A1028',
      text: '#1F2937',
      textDark: '#F3F4F6',
      textMuted: '#6366F1',
      textMutedDark: '#A5B4FC',
    },
    price: 1800,
    rarity: 'epic',
  },
  // Exclusive chest-only themes
  theme_chest_gloria: {
    id: 'theme_chest_gloria',
    name: 'Glory',
    nameEs: 'Gloria',
    description: 'The overwhelming brightness of His presence',
    descriptionEs: 'El brillo abrumador de Su presencia',
    colors: {
      primary: '#F59E0B',
      secondary: '#FCD34D',
      accent: '#FBBF24',
      background: '#FFFBEB',
      backgroundDark: '#1C1400',
      surface: '#FFFFFF',
      surfaceDark: '#2D2000',
      text: '#1C1400',
      textDark: '#FEF3C7',
      textMuted: '#92400E',
      textMutedDark: '#FCD34D',
    },
    rarity: 'epic',
    chestOnly: true,
  },
  theme_chest_desierto: {
    id: 'theme_chest_desierto',
    name: 'Desert Wandering',
    nameEs: 'Desierto',
    description: 'Forty years in the wilderness, formed by God',
    descriptionEs: 'Cuarenta años en el desierto, formado por Dios',
    colors: {
      primary: '#B45309',
      secondary: '#D97706',
      accent: '#78350F',
      background: '#FDF4E7',
      backgroundDark: '#1A0F00',
      surface: '#FEF3C7',
      surfaceDark: '#2C1A00',
      text: '#1C0F00',
      textDark: '#FEF3C7',
      textMuted: '#92400E',
      textMutedDark: '#FCD34D',
    },
    rarity: 'rare',
    chestOnly: true,
  },
  theme_chest_trono: {
    id: 'theme_chest_trono',
    name: 'Throne Room',
    nameEs: 'Sala del Trono',
    description: 'Deep purple and sapphire — the courts of heaven',
    descriptionEs: 'Purpura profundo y zafiro — los atrios del cielo',
    colors: {
      primary: '#6D28D9',
      secondary: '#4C1D95',
      accent: '#7C3AED',
      background: '#0D0520',
      backgroundDark: '#0D0520',
      surface: '#1A0B38',
      surfaceDark: '#1A0B38',
      text: '#EDE9FE',
      textDark: '#EDE9FE',
      textMuted: '#A78BFA',
      textMutedDark: '#A78BFA',
    },
    rarity: 'epic',
    chestOnly: true,
  },
  theme_chest_lluvia: {
    id: 'theme_chest_lluvia',
    name: 'Latter Rain',
    nameEs: 'Lluvia Tardía',
    description: 'The refreshing latter rain of the Spirit',
    descriptionEs: 'La refrescante lluvia tardía del Espíritu',
    colors: {
      primary: '#0369A1',
      secondary: '#0284C7',
      accent: '#38BDF8',
      background: '#F0F9FF',
      backgroundDark: '#001824',
      surface: '#FFFFFF',
      surfaceDark: '#002233',
      text: '#0C1A20',
      textDark: '#E0F2FE',
      textMuted: '#0369A1',
      textMutedDark: '#7DD3FC',
    },
    rarity: 'rare',
    chestOnly: true,
  },
  theme_chest_mar_rojo: {
    id: 'theme_chest_mar_rojo',
    name: 'Red Sea',
    nameEs: 'Mar Rojo',
    description: 'The miraculous parting — impossible made possible',
    descriptionEs: 'La apertura milagrosa — lo imposible hecho posible',
    colors: {
      primary: '#BE123C',
      secondary: '#E11D48',
      accent: '#FB7185',
      background: '#FFF1F2',
      backgroundDark: '#1A0008',
      surface: '#FFFFFF',
      surfaceDark: '#2D0010',
      text: '#1A0008',
      textDark: '#FFE4E6',
      textMuted: '#9F1239',
      textMutedDark: '#FDA4AF',
    },
    rarity: 'epic',
    chestOnly: true,
  },
  // ── New items for Chapter Collections ───────────────────────────────────────
  theme_covenant_rainbow: {
    id: 'theme_covenant_rainbow',
    name: 'Covenant Rainbow',
    nameEs: 'Arcoíris del Pacto',
    description: 'A spectrum of promise across the sky',
    descriptionEs: 'Un espectro de promesas en el cielo',
    colors: {
      primary: '#7C4DFF',
      secondary: '#E040FB',
      accent: '#40C4FF',
      background: '#F8F4FF',
      backgroundDark: '#12001F',
      surface: '#FFFFFF',
      surfaceDark: '#1E0A30',
      text: '#1A0030',
      textDark: '#F3E8FF',
      textMuted: '#7B5EA7',
      textMutedDark: '#C4A0E8',
    },
    price: 350,
    rarity: 'rare',
  },
  theme_hope_dawn: {
    id: 'theme_hope_dawn',
    name: 'Hope Dawn',
    nameEs: 'Amanecer de Esperanza',
    description: 'Golden hour when promises are fulfilled',
    descriptionEs: 'La hora dorada cuando las promesas se cumplen',
    colors: {
      primary: '#F59E0B',
      secondary: '#FCD34D',
      accent: '#FDE68A',
      background: '#FFFBEB',
      backgroundDark: '#1C1500',
      surface: '#FFFFFF',
      surfaceDark: '#2D2200',
      text: '#1C1008',
      textDark: '#FEF3C7',
      textMuted: '#92680A',
      textMutedDark: '#FBD878',
    },
    price: 350,
    rarity: 'rare',
  },
  theme_calm_river: {
    id: 'theme_calm_river',
    name: 'Calm River',
    nameEs: 'Río en Calma',
    description: 'Still waters of peace and patience',
    descriptionEs: 'Aguas tranquilas de paz y paciencia',
    colors: {
      primary: '#0891B2',
      secondary: '#06B6D4',
      accent: '#67E8F9',
      background: '#F0FDFF',
      backgroundDark: '#001A1F',
      surface: '#FFFFFF',
      surfaceDark: '#002933',
      text: '#0C1A1F',
      textDark: '#CFFAFE',
      textMuted: '#0E7490',
      textMutedDark: '#67C6D0',
    },
    price: 350,
    rarity: 'rare',
  },
  theme_unshakable_rock: {
    id: 'theme_unshakable_rock',
    name: 'Unshakable Rock',
    nameEs: 'Roca Inconmovible',
    description: 'Solid foundation that cannot be moved',
    descriptionEs: 'Fundamento sólido que no puede ser movido',
    colors: {
      primary: '#78716C',
      secondary: '#A8A29E',
      accent: '#D6D3D1',
      background: '#FAFAF9',
      backgroundDark: '#1C1917',
      surface: '#FFFFFF',
      surfaceDark: '#292524',
      text: '#1C1917',
      textDark: '#F5F5F4',
      textMuted: '#78716C',
      textMutedDark: '#A8A29E',
    },
    price: 400,
    rarity: 'rare',
  },
};

// Avatar Frames
export const AVATAR_FRAMES: Record<string, {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  color: string;
  price?: number;
  rarity: string;
  chestOnly?: boolean;
  isV2?: boolean;
}> = {
  frame_dorado: { id: 'frame_dorado', name: 'Golden', nameEs: 'Dorado', description: 'Precious as refined gold', descriptionEs: 'Precioso como oro refinado', color: '#FFD700', price: 300, rarity: 'rare' },
  frame_plata: { id: 'frame_plata', name: 'Silver', nameEs: 'Plata', description: 'Pure and elegant', descriptionEs: 'Puro y elegante', color: '#C0C0C0', price: 200, rarity: 'common' },
  frame_azul: { id: 'frame_azul', name: 'Blue Hope', nameEs: 'Azul Esperanza', description: 'Color of heavenly hope', descriptionEs: 'Color de esperanza celestial', color: '#4A90D9', price: 250, rarity: 'common' },
  frame_verde: { id: 'frame_verde', name: 'Green Life', nameEs: 'Verde Vida', description: 'Growth and renewal', descriptionEs: 'Crecimiento y renovacion', color: '#4CAF50', price: 250, rarity: 'common' },
  frame_luz: { id: 'frame_luz', name: 'Soft Light', nameEs: 'Luz Suave', description: 'Gentle divine radiance', descriptionEs: 'Suave resplandor divino', color: '#FFF8DC', price: 350, rarity: 'rare' },
  frame_corona: { id: 'frame_corona', name: 'Leaf Crown', nameEs: 'Corona Hojas', description: 'Crown of righteousness', descriptionEs: 'Corona de justicia', color: '#228B22', price: 400, rarity: 'rare' },
  frame_estrellas: { id: 'frame_estrellas', name: 'Stars', nameEs: 'Estrellas', description: 'Like stars in the heavens', descriptionEs: 'Como estrellas en el cielo', color: '#E6E6FA', price: 500, rarity: 'epic' },
  frame_pergamino: { id: 'frame_pergamino', name: 'Parchment', nameEs: 'Pergamino', description: 'Ancient wisdom scroll', descriptionEs: 'Pergamino de sabiduria antigua', color: '#D4B896', price: 300, rarity: 'common' },
  frame_fuego: { id: 'frame_fuego', name: 'Soft Fire', nameEs: 'Fuego Suave', description: 'Holy Spirit flame', descriptionEs: 'Llama del Espiritu Santo', color: '#FF6B35', price: 450, rarity: 'rare' },
  frame_cielo: { id: 'frame_cielo', name: 'Heaven', nameEs: 'Cielo', description: 'Gateway to eternity', descriptionEs: 'Puerta a la eternidad', color: '#87CEEB', price: 600, rarity: 'epic' },
  // Exclusive chest-only frames
  frame_chest_celestial: { id: 'frame_chest_celestial', name: 'Celestial', nameEs: 'Celestial', description: 'Frame of heavenly light — chest exclusive', descriptionEs: 'Marco de luz celestial — exclusivo del cofre', color: '#C9B8FF', chestOnly: true, rarity: 'epic' },
  frame_chest_profecia: { id: 'frame_chest_profecia', name: 'Prophecy', nameEs: 'Profecia', description: 'Ancient words fulfilled — chest exclusive', descriptionEs: 'Palabras antiguas cumplidas — exclusivo del cofre', color: '#8B4513', chestOnly: true, rarity: 'epic' },
  frame_chest_zafiro: { id: 'frame_chest_zafiro', name: 'Sapphire Throne', nameEs: 'Trono de Zafiro', description: 'Like the sapphire pavement of God — chest exclusive', descriptionEs: 'Como el pavimento de zafiro de Dios — exclusivo del cofre', color: '#1E3A5F', chestOnly: true, rarity: 'rare' },
  frame_chest_santo: { id: 'frame_chest_santo', name: 'Holy of Holies', nameEs: 'Santo de los Santos', description: 'Reserved for the consecrated — chest exclusive', descriptionEs: 'Reservado para los consagrados — exclusivo del cofre', color: '#F5D78E', chestOnly: true, rarity: 'epic' },
  frame_chest_nuevo_dia: { id: 'frame_chest_nuevo_dia', name: 'New Dawn', nameEs: 'Nuevo Dia', description: 'His mercies are new every morning — chest exclusive', descriptionEs: 'Sus misericordias son nuevas cada manana — exclusivo del cofre', color: '#FF9A5C', chestOnly: true, rarity: 'rare' },
  // ── V2 Premium Frames ───────────────────────────────────────────────────────
  frame_v2_hoja_oro: { id: 'frame_v2_hoja_oro', name: 'Gold Leaf', nameEs: 'Hoja de Oro', description: 'Fine gold leaf edge with warm warmth', descriptionEs: 'Borde de hoja de oro fino con calidez', color: '#D4A017', price: 450, rarity: 'rare', isV2: true },
  frame_v2_plata_brillo: { id: 'frame_v2_plata_brillo', name: 'Silver Glow', nameEs: 'Brillo de Plata', description: 'Shimmering silver ring of purity', descriptionEs: 'Anillo de plata refulgente de pureza', color: '#B8C8D8', price: 350, rarity: 'common', isV2: true },
  frame_v2_olivo: { id: 'frame_v2_olivo', name: 'Olive Wreath', nameEs: 'Corona de Olivo', description: 'Ancient olive branch wreath of peace', descriptionEs: 'Corona antigua de olivo de la paz', color: '#6B8F47', price: 400, rarity: 'rare', isV2: true },
  frame_v2_amanecer: { id: 'frame_v2_amanecer', name: 'Sunrise Ring', nameEs: 'Anillo Amanecer', description: 'Soft dawn gradient circling with hope', descriptionEs: 'Degradado suave del amanecer rodeando con esperanza', color: '#F4A261', price: 380, rarity: 'common', isV2: true },
  frame_v2_pergamino: { id: 'frame_v2_pergamino', name: 'Parchment Edge', nameEs: 'Borde Pergamino', description: 'Aged scripture scroll border', descriptionEs: 'Borde de pergamino de escrituras antiguas', color: '#C9A96E', price: 320, rarity: 'common', isV2: true },
  frame_v2_halo_azul: { id: 'frame_v2_halo_azul', name: 'Calm Blue Halo', nameEs: 'Halo Azul Sereno', description: 'Tranquil blue celestial halo', descriptionEs: 'Halo celestial azul tranquilo', color: '#4A90D9', price: 420, rarity: 'rare', isV2: true },
  frame_v2_fuego_sagrado: { id: 'frame_v2_fuego_sagrado', name: 'Sacred Fire', nameEs: 'Fuego Sagrado', description: 'Holy Spirit fire ring of power', descriptionEs: 'Anillo de fuego del Espiritu Santo', color: '#E85D04', price: 600, rarity: 'epic', isV2: true },
  frame_v2_luna_plata: { id: 'frame_v2_luna_plata', name: 'Silver Moon', nameEs: 'Luna de Plata', description: 'Moonlit silver glow for the night watchman', descriptionEs: 'Resplandor plateado lunar para el vigilante nocturno', color: '#8EABD4', price: 480, rarity: 'rare', isV2: true },
  frame_v2_jade: { id: 'frame_v2_jade', name: 'Jade Garden', nameEs: 'Jardin Jade', description: 'Deep green jade ring of life', descriptionEs: 'Anillo verde jade profundo de vida', color: '#00A878', price: 360, rarity: 'common', isV2: true },
  frame_v2_zafiro: { id: 'frame_v2_zafiro', name: 'Sapphire Crown', nameEs: 'Corona Zafiro', description: 'Royal sapphire crown frame', descriptionEs: 'Marco de corona de zafiro real', color: '#1E6EBE', price: 750, rarity: 'epic', isV2: true },
  frame_v2_rosa_gracia: { id: 'frame_v2_rosa_gracia', name: 'Rose of Grace', nameEs: 'Rosa de Gracia', description: 'Blush rose petal frame of tender grace', descriptionEs: 'Marco de petalo de rosa del amor tierno', color: '#E8829A', price: 420, rarity: 'rare', isV2: true },
  frame_v2_tierra_santa: { id: 'frame_v2_tierra_santa', name: 'Holy Land', nameEs: 'Tierra Santa', description: 'Warm desert sand of ancient holy ground', descriptionEs: 'Arena calida del desierto de tierra santa antigua', color: '#C8956C', price: 340, rarity: 'common', isV2: true },
  frame_adv_ocean_deep: { id: 'frame_adv_ocean_deep', name: 'Deep Ocean', nameEs: 'Océano Profundo', description: 'Depths of the sea where Jonah was carried', descriptionEs: 'Las profundidades del mar donde fue llevado Jonás', color: '#1A4A7A', price: 0, rarity: 'epic', isV2: true, chestOnly: true },
  // ── Adventure Frames V2 (Adventures 3–4) ────────────────────────────────────
  frame_adv_royal_persia: { id: 'frame_adv_royal_persia', name: 'Royal Persia', nameEs: 'Persia Real', description: 'The golden halls of the Persian palace', descriptionEs: 'Los salones dorados del palacio persa', color: '#C8942A', price: 0, rarity: 'epic', isV2: true, chestOnly: true },
  frame_adv_lions_den: { id: 'frame_adv_lions_den', name: 'Lion\'s Den', nameEs: 'Fosa de los Leones', description: 'The den where faith conquered fear', descriptionEs: 'La fosa donde la fe venció al miedo', color: '#8B6914', price: 0, rarity: 'epic', isV2: true, chestOnly: true },
  frame_adv_valley_battle: { id: 'frame_adv_valley_battle', name: 'Valley of Battle', nameEs: 'Valle de Batalla', description: 'The valley where one stone changed history', descriptionEs: 'El valle donde una piedra cambió la historia', color: '#6B4F2A', price: 0, rarity: 'epic', isV2: true, chestOnly: true },
  // ── Adventure Frames V3 (Adventures 5–9) ────────────────────────────────────
  frame_adv_red_sea: { id: 'frame_adv_red_sea', name: 'Red Sea', nameEs: 'Mar Rojo', description: 'The parted sea — walls of water on both sides', descriptionEs: 'El mar abierto — muros de agua a ambos lados', color: '#1E6FA8', price: 0, rarity: 'epic', isV2: true, chestOnly: true },
  frame_adv_rainbow: { id: 'frame_adv_rainbow', name: 'Rainbow Covenant', nameEs: 'Arco del Pacto', description: 'The eternal rainbow of God\'s covenant with Noah', descriptionEs: 'El arco eterno del pacto de Dios con Noé', color: '#7C3AED', price: 0, rarity: 'epic', isV2: true, chestOnly: true },
  frame_adv_fire_heaven: { id: 'frame_adv_fire_heaven', name: 'Fire from Heaven', nameEs: 'Fuego del Cielo', description: 'The consuming fire that answered Elijah\'s prayer', descriptionEs: 'El fuego consumidor que respondió la oración de Elías', color: '#DC4E0A', price: 0, rarity: 'epic', isV2: true, chestOnly: true },
  frame_adv_dream_stars: { id: 'frame_adv_dream_stars', name: 'Dream of Stars', nameEs: 'Sueño de Estrellas', description: 'The starlit sky of Joseph\'s prophetic dreams', descriptionEs: 'El cielo estrellado de los sueños proféticos de José', color: '#1E3A8A', price: 0, rarity: 'epic', isV2: true, chestOnly: true },
  frame_adv_mission_world: { id: 'frame_adv_mission_world', name: 'World Mission', nameEs: 'Misión al Mundo', description: 'The wide horizon of Paul\'s apostolic mission', descriptionEs: 'El horizonte amplio de la misión apostólica de Pablo', color: '#064E3B', price: 0, rarity: 'epic', isV2: true, chestOnly: true },
  // ── New items for Chapter Collections ───────────────────────────────────────
  frame_faithful_seal: { id: 'frame_faithful_seal', name: 'Faithful Seal', nameEs: 'Sello Fiel', description: 'Sealed by the promise of the Faithful One', descriptionEs: 'Sellado por la promesa del Fiel', color: '#4F46E5', price: 350, rarity: 'rare' },
  frame_gentle_breeze: { id: 'frame_gentle_breeze', name: 'Gentle Breeze', nameEs: 'Brisa Suave', description: 'Soft breath of the Spirit', descriptionEs: 'Suave soplo del Espíritu', color: '#10B981', price: 300, rarity: 'common' },
  frame_serene_crown: { id: 'frame_serene_crown', name: 'Serene Crown', nameEs: 'Corona Serena', description: 'A crown of self-control and peace', descriptionEs: 'Una corona de dominio propio y paz', color: '#8B5CF6', price: 450, rarity: 'rare' },
  frame_shield_faith: { id: 'frame_shield_faith', name: 'Shield of Faith', nameEs: 'Escudo de Fe', description: 'Extinguishes the flaming arrows of the evil one', descriptionEs: 'Apaga los dardos encendidos del maligno', color: '#DC2626', price: 500, rarity: 'epic' },
};

// Spiritual Titles
export const SPIRITUAL_TITLES: Record<string, {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  price?: number;
  rarity: string;
  chestOnly?: boolean;
  /** Bible reference — used by V2 Biblical Citations subcategory */
  bibleRef?: string;
  isV2?: boolean;
}> = {
  title_buscador: { id: 'title_buscador', name: 'Seeker of Light', nameEs: 'Buscador de Luz', description: 'One who seeks divine truth', descriptionEs: 'Quien busca la verdad divina', price: 200, rarity: 'common' },
  title_corazon: { id: 'title_corazon', name: 'Grateful Heart', nameEs: 'Corazon Agradecido', description: 'Living in thankfulness', descriptionEs: 'Viviendo en gratitud', price: 250, rarity: 'common' },
  title_caminando: { id: 'title_caminando', name: 'Walking in Faith', nameEs: 'Caminando en Fe', description: 'Steps guided by trust', descriptionEs: 'Pasos guiados por confianza', price: 300, rarity: 'common' },
  title_siervo: { id: 'title_siervo', name: 'Faithful Servant', nameEs: 'Siervo Fiel', description: 'Devoted to the mission', descriptionEs: 'Dedicado a la mision', price: 400, rarity: 'rare' },
  title_portador: { id: 'title_portador', name: 'Hope Bearer', nameEs: 'Portador de Esperanza', description: 'Bringing light to darkness', descriptionEs: 'Trayendo luz a la oscuridad', price: 350, rarity: 'rare' },
  title_amigo: { id: 'title_amigo', name: 'Friend of the Master', nameEs: 'Amigo del Maestro', description: 'Walking closely with Him', descriptionEs: 'Caminando cerca de El', price: 500, rarity: 'rare' },
  title_valiente: { id: 'title_valiente', name: 'Kingdom Warrior', nameEs: 'Valiente del Reino', description: 'Fighting the good fight', descriptionEs: 'Peleando la buena batalla', price: 600, rarity: 'epic' },
  title_sembrador: { id: 'title_sembrador', name: 'Peace Sower', nameEs: 'Sembrador de Paz', description: 'Planting seeds of harmony', descriptionEs: 'Sembrando semillas de armonia', price: 450, rarity: 'rare' },
  title_luz: { id: 'title_luz', name: 'Light in the Storm', nameEs: 'Luz en la Tormenta', description: 'Steady through trials', descriptionEs: 'Firme en las pruebas', price: 550, rarity: 'rare' },
  title_guardian: { id: 'title_guardian', name: 'Guardian of the Word', nameEs: 'Guardian de la Palabra', description: 'Keeper of sacred truth', descriptionEs: 'Protector de la verdad sagrada', price: 700, rarity: 'epic' },
  title_constructor: { id: 'title_constructor', name: 'Altar Builder', nameEs: 'Constructor de Altar', description: 'Creating sacred spaces', descriptionEs: 'Creando espacios sagrados', price: 500, rarity: 'rare' },
  title_peregrino: { id: 'title_peregrino', name: 'Pilgrim of Grace', nameEs: 'Peregrino de Gracia', description: 'Journey of faith', descriptionEs: 'Viaje de fe', price: 400, rarity: 'rare' },
  // Exclusive chest-only titles
  title_chest_ungido: { id: 'title_chest_ungido', name: 'The Anointed', nameEs: 'El Ungido', description: 'Set apart by the Spirit — chest exclusive', descriptionEs: 'Apartado por el Espiritu — exclusivo del cofre', chestOnly: true, rarity: 'epic' },
  title_chest_columna: { id: 'title_chest_columna', name: 'Pillar of Fire', nameEs: 'Columna de Fuego', description: 'Guiding light through the wilderness — chest exclusive', descriptionEs: 'Luz guiadora en el desierto — exclusivo del cofre', chestOnly: true, rarity: 'epic' },
  title_chest_profeta: { id: 'title_chest_profeta', name: 'Voice of the Prophet', nameEs: 'Voz del Profeta', description: 'Speaks what heaven declares — chest exclusive', descriptionEs: 'Proclama lo que el cielo declara — exclusivo del cofre', chestOnly: true, rarity: 'epic' },
  title_chest_escogido: { id: 'title_chest_escogido', name: 'The Chosen', nameEs: 'El Escogido', description: 'Called before the foundation of the world — chest exclusive', descriptionEs: 'Llamado antes de la fundacion del mundo — exclusivo del cofre', chestOnly: true, rarity: 'rare' },
  title_chest_intercesor: { id: 'title_chest_intercesor', name: 'Intercessor', nameEs: 'Intercesor', description: 'Stands in the gap for others — chest exclusive', descriptionEs: 'Se para en la brecha por los demas — exclusivo del cofre', chestOnly: true, rarity: 'rare' },
  // ── New items for Chapter Collections ───────────────────────────────────────
  title_heir_promises: { id: 'title_heir_promises', name: 'Heir of Promises', nameEs: 'Herede@ de Promesas', description: 'Recipient of every divine promise', descriptionEs: 'Receptor de cada promesa divina', price: 450, rarity: 'rare' },
  title_patient_wait: { id: 'title_patient_wait', name: 'Patient in Waiting', nameEs: 'Paciente en la Espera', description: 'Enduring with joyful hope', descriptionEs: 'Perseverando con esperanza gozosa', price: 400, rarity: 'rare' },
  title_belt_truth: { id: 'title_belt_truth', name: 'Belt of Truth', nameEs: 'Cinturón de Verdad', description: 'Girded with the truth of God', descriptionEs: 'Ceñido con la verdad de Dios', price: 400, rarity: 'rare' },
  title_guard_word: { id: 'title_guard_word', name: 'Guard of the Word', nameEs: 'Guardia de la Palabra', description: 'Defender of sacred scripture', descriptionEs: 'Defensor de las sagradas escrituras', price: 500, rarity: 'epic' },
  title_mensajero_senor: { id: 'title_mensajero_senor', name: 'Messenger of the Lord', nameEs: 'Mensajero del Señor', description: 'Called and sent by God', descriptionEs: 'Llamado y enviado por Dios', price: 0, rarity: 'epic', chestOnly: true },
  // ── V2 — Citas Bíblicas (Biblical Citations) ─────────────────────────────────
  title_psalm_shepherd: { id: 'title_psalm_shepherd', name: 'The Lord is my Shepherd', nameEs: 'El Señor es mi Pastor', description: 'Guided and provided for by the Shepherd', descriptionEs: 'Guiado y provisto por el Pastor', price: 350, rarity: 'rare', isV2: true, bibleRef: 'Salmo 23:1' },
  title_all_through_christ: { id: 'title_all_through_christ', name: 'I can do all through Christ', nameEs: 'Todo lo puedo en Cristo', description: 'Strength found in Christ alone', descriptionEs: 'Fuerza hallada solo en Cristo', price: 300, rarity: 'rare', isV2: true, bibleRef: 'Filipenses 4:13' },
  title_more_than_conquerors: { id: 'title_more_than_conquerors', name: 'More than Conquerors', nameEs: 'Más que vencedores', description: 'Overcoming through His love', descriptionEs: 'Venciendo a través de su amor', price: 400, rarity: 'rare', isV2: true, bibleRef: 'Romanos 8:37' },
  title_lord_my_light: { id: 'title_lord_my_light', name: 'The Lord is my Light', nameEs: 'El Señor es mi luz', description: 'No darkness can overcome this light', descriptionEs: 'Ninguna oscuridad puede vencer esta luz', price: 350, rarity: 'rare', isV2: true, bibleRef: 'Salmo 27:1' },
  title_joy_is_strength: { id: 'title_joy_is_strength', name: 'Joy of the Lord is my Strength', nameEs: 'El gozo del Señor es mi fuerza', description: 'Sustained by unshakeable joy', descriptionEs: 'Sostenido por un gozo inquebrantable', price: 400, rarity: 'rare', isV2: true, bibleRef: 'Nehemías 8:10' },
  title_grace_is_enough: { id: 'title_grace_is_enough', name: 'My Grace is Sufficient', nameEs: 'Mi gracia es suficiente', description: 'His grace is enough in weakness', descriptionEs: 'Su gracia es suficiente en la debilidad', price: 450, rarity: 'rare', isV2: true, bibleRef: '2 Corintios 12:9' },
  title_walk_by_faith: { id: 'title_walk_by_faith', name: 'We Walk by Faith', nameEs: 'Andamos por fe', description: 'Not by sight but by trust in Him', descriptionEs: 'No por vista sino por confianza en Él', price: 300, rarity: 'common', isV2: true, bibleRef: '2 Corintios 5:7' },
  title_god_is_love: { id: 'title_god_is_love', name: 'God is Love', nameEs: 'Dios es amor', description: 'Living in the fullness of divine love', descriptionEs: 'Viviendo en la plenitud del amor divino', price: 350, rarity: 'rare', isV2: true, bibleRef: '1 Juan 4:8' },
  title_peace_of_christ: { id: 'title_peace_of_christ', name: 'Peace of Christ Rules', nameEs: 'La paz de Cristo gobierne', description: 'Peace ruling heart and mind', descriptionEs: 'La paz gobernando el corazón y la mente', price: 400, rarity: 'rare', isV2: true, bibleRef: 'Colosenses 3:15' },
  title_word_is_light: { id: 'title_word_is_light', name: 'Your Word is a Lamp', nameEs: 'Tu palabra es lámpara', description: 'Guided by the light of scripture', descriptionEs: 'Guiado por la luz de las escrituras', price: 350, rarity: 'rare', isV2: true, bibleRef: 'Salmo 119:105' },
  title_lord_my_refuge: { id: 'title_lord_my_refuge', name: 'The Lord is my Refuge', nameEs: 'El Señor es mi refugio', description: 'Safe in the shadow of the Almighty', descriptionEs: 'Seguro a la sombra del Todopoderoso', price: 400, rarity: 'rare', isV2: true, bibleRef: 'Salmo 91:2' },
  title_be_strong_courage: { id: 'title_be_strong_courage', name: 'Be Strong and Courageous', nameEs: 'Sé fuerte y valiente', description: 'Courage given by God himself', descriptionEs: 'Valentía dada por Dios mismo', price: 450, rarity: 'rare', isV2: true, bibleRef: 'Josué 1:9' },
  title_lord_fights: { id: 'title_lord_fights', name: 'The Lord Fights for You', nameEs: 'El Señor peleará por ustedes', description: 'Standing still while God battles', descriptionEs: 'Quieto mientras Dios pelea la batalla', price: 500, rarity: 'epic', isV2: true, bibleRef: 'Éxodo 14:14' },
  title_lord_is_good: { id: 'title_lord_is_good', name: 'The Lord is Good', nameEs: 'Bueno es el Señor', description: 'Declaring His goodness in every season', descriptionEs: 'Declarando su bondad en toda temporada', price: 300, rarity: 'common', isV2: true, bibleRef: 'Salmo 100:5' },
  title_god_with_us: { id: 'title_god_with_us', name: 'God With Us', nameEs: 'Dios con nosotros', description: 'Emmanuel, forever present', descriptionEs: 'Emmanuel, siempre presente', price: 400, rarity: 'rare', isV2: true, bibleRef: 'Mateo 1:23' },
  title_living_hope: { id: 'title_living_hope', name: 'Living Hope', nameEs: 'Esperanza viva', description: 'Reborn into a living hope through Christ', descriptionEs: 'Renacido a una esperanza viva por Cristo', price: 450, rarity: 'rare', isV2: true, bibleRef: '1 Pedro 1:3' },
  title_renewed_strength: { id: 'title_renewed_strength', name: 'They Will Renew Their Strength', nameEs: 'Renovarán sus fuerzas', description: 'Soaring on wings like eagles', descriptionEs: 'Remontando el vuelo como las águilas', price: 500, rarity: 'epic', isV2: true, bibleRef: 'Isaías 40:31' },
  title_light_world: { id: 'title_light_world', name: 'Light of the World', nameEs: 'Luz del mundo', description: 'Shining before all people', descriptionEs: 'Brillando ante todo el mundo', price: 550, rarity: 'epic', isV2: true, bibleRef: 'Mateo 5:14' },
  title_abide_in_me: { id: 'title_abide_in_me', name: 'Remain in Me', nameEs: 'Permanezcan en mí', description: 'Connected to the Vine, bearing fruit', descriptionEs: 'Conectado a la Vid, dando fruto', price: 450, rarity: 'rare', isV2: true, bibleRef: 'Juan 15:4' },
  title_love_never_fails: { id: 'title_love_never_fails', name: 'Love Never Fails', nameEs: 'El amor nunca falla', description: 'Walking in the love that endures forever', descriptionEs: 'Caminando en el amor que dura para siempre', price: 500, rarity: 'epic', isV2: true, bibleRef: '1 Corintios 13:8' },
  // ── Adventure Titles (Adventures 5–9) ───────────────────────────────────────
  title_camino_en_el_mar: { id: 'title_camino_en_el_mar', name: 'Path Through the Sea', nameEs: 'Camino en el Mar', description: 'God opens a way where there is none', descriptionEs: 'Dios abre camino donde no lo hay', price: 0, rarity: 'epic', chestOnly: true },
  title_guardian_del_pacto: { id: 'title_guardian_del_pacto', name: 'Guardian of the Covenant', nameEs: 'Guardián del Pacto', description: 'Keeper of God\'s eternal promises', descriptionEs: 'Guardián de las promesas eternas de Dios', price: 0, rarity: 'epic', chestOnly: true },
  title_profeta_de_fuego: { id: 'title_profeta_de_fuego', name: 'Prophet of Fire', nameEs: 'Profeta de Fuego', description: 'Burning with holy zeal for God', descriptionEs: 'Ardiendo con celo santo por Dios', price: 0, rarity: 'epic', chestOnly: true },
  title_sonador_de_dios: { id: 'title_sonador_de_dios', name: 'Dreamer of God', nameEs: 'Soñador de Dios', description: 'Carrying visions from the throne of God', descriptionEs: 'Portando visiones del trono de Dios', price: 0, rarity: 'epic', chestOnly: true },
  title_apostol_de_las_naciones: { id: 'title_apostol_de_las_naciones', name: 'Apostle to the Nations', nameEs: 'Apóstol de las Naciones', description: 'Sent to proclaim the gospel to every people', descriptionEs: 'Enviado a proclamar el evangelio a todo pueblo', price: 0, rarity: 'epic', chestOnly: true },
};

// ── Badges — achievement-based items auto-awarded by milestones ───────────────
// Each badge has a lucide icon name, short localized label, description, rarity,
// a color (hex), and a milestone condition (used for auto-awarding on the backend).
export const BADGES: Record<string, {
  id: string;
  icon: string;         // lucide-react-native icon name
  color: string;        // primary badge color (hex)
  name: string;         // EN display
  nameEs: string;       // ES display
  description: string;
  descriptionEs: string;
  /** Spiritual meaning shown in Community modal */
  meaningEs: string;
  /** How to earn — shown in Settings modal only */
  howToEarnEs: string;
  rarity: 'unique' | 'common' | 'rare' | 'epic';
  milestone: {          // condition for auto-award
    type: 'devotionals' | 'streak' | 'points' | 'days_active' | 'special';
    value: number;
  };
}> = {
  // ── Fundacionales ────────────────────────────────────────────────────────────
  badge_fundador: {
    id: 'badge_fundador',
    icon: 'Flame',
    color: '#D4A017',
    name: 'Founder',
    nameEs: 'Fundador',
    description: 'Started this community from the very beginning',
    descriptionEs: 'Inició esta comunidad desde el principio',
    meaningEs: 'Reconoce a quienes estuvieron desde el inicio sembrando esta obra con fe y entrega.',
    howToEarnEs: 'Disponible para quienes formaron parte de los primeros pasos de esta comunidad. Un honor reservado para los que confiaron desde el principio.',
    rarity: 'unique',
    milestone: { type: 'special', value: 0 },
  },
  badge_primeros_pasos: {
    id: 'badge_primeros_pasos',
    icon: 'Footprints',
    color: '#E8A040',
    name: 'Early Member',
    nameEs: 'Primeros Pasos',
    description: 'One of the first members of the community',
    descriptionEs: 'Uno de los primeros miembros de la comunidad',
    meaningEs: 'Para quienes se unieron cuando todo comenzaba, caminando con esperanza hacia lo que Dios estaba construyendo.',
    howToEarnEs: 'Se otorga a quienes se integraron a la comunidad en sus primeras etapas. Un símbolo de confianza y comienzo.',
    rarity: 'rare',
    milestone: { type: 'special', value: 1 },
  },
  // ── Camino espiritual ────────────────────────────────────────────────────────
  badge_sembrador_paz: {
    id: 'badge_sembrador_paz',
    icon: 'Leaf',
    color: '#6B8F5E',
    name: 'Peace Sower',
    nameEs: 'Sembrador de Paz',
    description: 'Planting seeds of harmony every day',
    descriptionEs: 'Sembrando semillas de paz cada día',
    meaningEs: 'Para quienes promueven la paz y la constancia en la comunidad, sembrando con paciencia y amor.',
    howToEarnEs: 'Se otorga al perseverar día a día en la lectura y reflexión de la Palabra. La constancia es la semilla.',
    rarity: 'rare',
    milestone: { type: 'devotionals', value: 30 },
  },
  badge_caminando_fe: {
    id: 'badge_caminando_fe',
    icon: 'MoveUpRight',
    color: '#5BA05B',
    name: 'Walking in Faith',
    nameEs: 'Caminando en Fe',
    description: 'Steps guided by trust in God',
    descriptionEs: 'Pasos guiados por confianza en Dios',
    meaningEs: 'Cada paso en fe, aunque pequeño, nos acerca más a Dios. Esta insignia celebra el caminar fiel.',
    howToEarnEs: 'Se obtiene al dar los primeros pasos firmes en la lectura devocional. No importa el ritmo, importa seguir adelante.',
    rarity: 'common',
    milestone: { type: 'devotionals', value: 7 },
  },
  badge_portador_esperanza: {
    id: 'badge_portador_esperanza',
    icon: 'Sun',
    color: '#3A8F8F',
    name: 'Hope Bearer',
    nameEs: 'Portador de Esperanza',
    description: 'Bringing light into dark places',
    descriptionEs: 'Llevando luz a los lugares oscuros',
    meaningEs: 'Quien lleva esperanza es una luz para quienes los rodean. Esta insignia honra a los que no se rinden.',
    howToEarnEs: 'Se alcanza al mantener una presencia constante en la reflexión espiritual. La esperanza se fortalece con la Palabra.',
    rarity: 'rare',
    milestone: { type: 'devotionals', value: 15 },
  },
  badge_guardian_palabra: {
    id: 'badge_guardian_palabra',
    icon: 'BookOpen',
    color: '#7B2D52',
    name: 'Guardian of the Word',
    nameEs: 'Guardián de la Palabra',
    description: 'Keeper of sacred truth',
    descriptionEs: 'Guardián de la verdad sagrada',
    meaningEs: 'Para quienes atesoran y honran la Palabra con fidelidad y profundidad, día tras día.',
    howToEarnEs: 'Un reconocimiento a la dedicación profunda en el estudio devocional. Quien cuida la Palabra, es guardado por ella.',
    rarity: 'epic',
    milestone: { type: 'devotionals', value: 100 },
  },
  badge_valiente_reino: {
    id: 'badge_valiente_reino',
    icon: 'Shield',
    color: '#8B2020',
    name: 'Kingdom Warrior',
    nameEs: 'Valiente del Reino',
    description: 'Fighting the good fight of faith',
    descriptionEs: 'Peleando la buena batalla de la fe',
    meaningEs: 'Esta insignia pertenece a quienes no abandonan su camino espiritual, aun en los días difíciles.',
    howToEarnEs: 'Se otorga a quienes mantienen una racha sostenida de reflexión y lectura. La perseverancia es valentía.',
    rarity: 'epic',
    milestone: { type: 'streak', value: 30 },
  },
  // ── Comunidad ────────────────────────────────────────────────────────────────
  badge_companero_oracion: {
    id: 'badge_companero_oracion',
    icon: 'HandHeart',
    color: '#7B68A8',
    name: 'Prayer Companion',
    nameEs: 'Compañero de Oración',
    description: 'Standing with others in prayer',
    descriptionEs: 'Acompañando a otros en oración',
    meaningEs: 'Al acompañar fielmente a otros hermanos en oración, se convierte en un apoyo espiritual real.',
    howToEarnEs: 'Se recibe al dar el primer paso en el camino devocional. Todo comienzo en fe es digno de celebrar.',
    rarity: 'common',
    milestone: { type: 'devotionals', value: 1 },
  },
  badge_columna_comunidad: {
    id: 'badge_columna_comunidad',
    icon: 'Columns2',
    color: '#8A9AAA',
    name: 'Community Pillar',
    nameEs: 'Columna de la Comunidad',
    description: 'A steady presence in the community',
    descriptionEs: 'Una presencia firme en la comunidad',
    meaningEs: 'Representa a quienes sostienen la comunidad con su presencia, constancia y generosidad de espíritu.',
    howToEarnEs: 'Se obtiene al alcanzar un nivel de contribución y participación significativa dentro de la comunidad.',
    rarity: 'rare',
    milestone: { type: 'points', value: 10000 },
  },
};

// Rarity colors for UI
export const RARITY_COLORS = {
  common: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#A855F7',
  unique: '#D4A017',
} as const;

// Rarity gradient backgrounds for premium card styling
export const RARITY_GRADIENTS = {
  common: ['#F3F4F6', '#E5E7EB'],
  rare: ['#EFF6FF', '#DBEAFE'],
  epic: ['#FAF5FF', '#F3E8FF'],
} as const;

// Item Collections - group related items for completion bonuses
export const ITEM_COLLECTIONS: Record<string, {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  subtitle: string;
  subtitleEs: string;
  inspiration: string;
  inspirationEs: string;
  icon: string;
  items: string[];
  rewardPoints: number;
  isV2?: boolean;
}> = {
  collection_simbolos_fe: {
    id: 'collection_simbolos_fe',
    name: 'Symbols of Faith',
    nameEs: 'Simbolos de Fe',
    description: 'Sacred symbols representing faith',
    descriptionEs: 'Simbolos sagrados de la fe',
    subtitle: 'Ancient signs of a living faith',
    subtitleEs: 'Senales antiguas de una fe viva',
    inspiration: 'Complete this collection by acquiring the sacred symbols that have represented faith across centuries. Each one is a reminder of the eternal promises that sustain us.',
    inspirationEs: 'Completa esta coleccion adquiriendo los simbolos sagrados que han representado la fe a traves de los siglos. Cada uno es un recordatorio de las promesas eternas que nos sostienen.',
    icon: '✝️',
    items: ['avatar_dove', 'avatar_cross', 'avatar_candle', 'avatar_crown'],
    rewardPoints: 400,
  },
  collection_naturaleza: {
    id: 'collection_naturaleza',
    name: 'Biblical Nature',
    nameEs: 'Naturaleza Biblica',
    description: 'Nature symbols from Scripture',
    descriptionEs: 'Simbolos de la naturaleza en las Escrituras',
    subtitle: 'Creation speaks of its Creator',
    subtitleEs: 'La creacion habla de su Creador',
    inspiration: 'God reveals himself through creation. Collect these nature symbols from Scripture and reflect on the spiritual truth hidden in each living thing He made.',
    inspirationEs: 'Dios se revela a traves de la creacion. Colecciona estos simbolos de la naturaleza biblica y reflexiona sobre la verdad espiritual oculta en cada ser vivo que El creo.',
    icon: '🌿',
    items: ['avatar_olive', 'avatar_fish', 'avatar_lamb', 'avatar_rainbow'],
    rewardPoints: 500,
  },
  collection_marcos_luz: {
    id: 'collection_marcos_luz',
    name: 'Frames of Light',
    nameEs: 'Marcos de Luz',
    description: 'Radiant frame collection',
    descriptionEs: 'Coleccion de marcos radiantes',
    subtitle: 'Surrounded by divine radiance',
    subtitleEs: 'Rodeado del resplandor divino',
    inspiration: 'Complete this collection by surrounding yourself with frames that reflect the glory of God. Each one evokes a distinct aspect of the light that guides our steps.',
    inspirationEs: 'Completa esta coleccion rodeandote de marcos que reflejan la gloria de Dios. Cada uno evoca un aspecto distinto de la luz que guia nuestros pasos.',
    icon: '✨',
    items: ['frame_dorado', 'frame_luz', 'frame_estrellas', 'frame_cielo'],
    rewardPoints: 550,
  },
  collection_titulos_servicio: {
    id: 'collection_titulos_servicio',
    name: 'Titles of Service',
    nameEs: 'Titulos de Servicio',
    description: 'Titles for faithful servants',
    descriptionEs: 'Titulos para siervos fieles',
    subtitle: 'A calling to serve with faithfulness',
    subtitleEs: 'Un llamado a servir con fidelidad',
    inspiration: 'Complete this collection acquiring the titles that represent a life of faithful and constant service. Each one reflects a virtue cultivated through perseverance.',
    inspirationEs: 'Completa esta coleccion adquiriendo los titulos que representan una vida de servicio fiel y constante. Cada uno refleja una virtud que se cultiva con perseverancia.',
    icon: '👑',
    items: ['title_siervo', 'title_portador', 'title_sembrador', 'title_guardian'],
    rewardPoints: 600,
  },
  // ============================================
  // V2 COLLECTIONS - Premium Avatar Collections
  // ============================================
  collection_v2_simbolos_fe: {
    id: 'collection_v2_simbolos_fe',
    name: 'Symbols of Faith V2',
    nameEs: 'Simbolos de Fe V2',
    description: 'Premium illustrated faith symbols',
    descriptionEs: 'Simbolos de fe ilustrados premium',
    subtitle: 'Deeper expressions of an eternal faith',
    subtitleEs: 'Expresiones profundas de una fe eterna',
    inspiration: 'This premium collection gathers the most powerful symbols of Christian faith, illustrated with care and reverence. Completing it is an act of devotion in itself.',
    inspirationEs: 'Esta coleccion premium reune los simbolos mas poderosos de la fe cristiana, ilustrados con cuidado y reverencia. Completarla es en si mismo un acto de devocion.',
    icon: '✝️',
    items: ['avatar_v2_paloma_paz', 'avatar_v2_cruz_radiante', 'avatar_v2_lampara_aceite', 'avatar_v2_corona_vida', 'avatar_v2_biblia_abierta', 'avatar_v2_caliz', 'avatar_v2_ancla_esperanza', 'avatar_v2_pan_uvas'],
    rewardPoints: 700,
    isV2: true,
  },
  collection_v2_naturaleza: {
    id: 'collection_v2_naturaleza',
    name: 'Biblical Nature V2',
    nameEs: 'Naturaleza Biblica V2',
    description: 'Premium nature-inspired avatars',
    descriptionEs: 'Avatares premium inspirados en la naturaleza',
    subtitle: 'The earth declares His glory',
    subtitleEs: 'La tierra proclama su gloria',
    inspiration: 'Nature has always been God\'s first language. These premium avatars capture the living creatures and plants that Scripture uses to unveil divine truths.',
    inspirationEs: 'La naturaleza siempre ha sido el primer lenguaje de Dios. Estos avatares premium capturan las criaturas y plantas que las Escrituras usan para revelar verdades divinas.',
    icon: '🌿',
    items: ['avatar_v2_rama_olivo', 'avatar_v2_pez_ichthys', 'avatar_v2_cordero', 'avatar_v2_leon', 'avatar_v2_semilla_mostaza', 'avatar_v2_vid_racimos'],
    rewardPoints: 700,
    isV2: true,
  },
  collection_v2_virtudes: {
    id: 'collection_v2_virtudes',
    name: 'Virtues Collection',
    nameEs: 'Coleccion de Virtudes',
    description: 'Spiritual virtues as avatars',
    descriptionEs: 'Virtudes espirituales como avatares',
    subtitle: 'The fruit of the Spirit, made visible',
    subtitleEs: 'El fruto del Espiritu, hecho visible',
    inspiration: 'Virtues are not earned overnight — they are grown through practice, prayer, and surrender. Collect these avatars as a testimony of the character you are building.',
    inspirationEs: 'Las virtudes no se ganan de la noche a la manana — se cultivan a traves de la practica, la oracion y la entrega. Colecciona estos avatares como testimonio del caracter que estas construyendo.',
    icon: '💖',
    items: ['avatar_v2_gratitud', 'avatar_v2_fe', 'avatar_v2_amor', 'avatar_v2_paz', 'avatar_v2_gozo', 'avatar_v2_valentia'],
    rewardPoints: 650,
    isV2: true,
  },
  collection_v2_kids: {
    id: 'collection_v2_kids',
    name: 'Kids Friendly',
    nameEs: 'Infantil Amigable',
    description: 'Cute avatars for young hearts',
    descriptionEs: 'Avatares lindos para corazones jovenes',
    subtitle: 'Faith with joy and wonder',
    subtitleEs: 'Fe con alegria y asombro',
    inspiration: 'Jesus said the kingdom of heaven belongs to those like children. These joyful avatars celebrate a faith that is simple, bright, and full of wonder.',
    inspirationEs: 'Jesus dijo que el reino de los cielos pertenece a los que son como ninos. Estos alegres avatares celebran una fe simple, luminosa y llena de asombro.',
    icon: '🌟',
    items: ['avatar_v2_estrellita', 'avatar_v2_arcoiris', 'avatar_v2_nube', 'avatar_v2_angelito'],
    rewardPoints: 400,
    isV2: true,
  },
  // ============================================
  // LEVEL 2 COLLECTIONS — Identity & Calling
  // ============================================
  collection_l2_virtudes_reino: {
    id: 'collection_l2_virtudes_reino',
    name: 'Kingdom Virtues',
    nameEs: 'Virtudes del Reino',
    description: 'Avatars representing deep spiritual virtues',
    descriptionEs: 'Avatares que representan virtudes espirituales profundas',
    subtitle: 'Rooted in eternity, lived today',
    subtitleEs: 'Arraigados en la eternidad, vividos hoy',
    inspiration: 'Kingdom virtues are not worldly values — they are transformative qualities that reshape how we see, speak and act. Complete this collection as a commitment to that transformation.',
    inspirationEs: 'Las virtudes del reino no son valores mundanos — son cualidades transformadoras que cambian como vemos, hablamos y actuamos. Completa esta coleccion como un compromiso con esa transformacion.',
    icon: '💛',
    items: ['avatar_l2_corazon_agradecido', 'avatar_l2_espiritu_humilde', 'avatar_l2_gozo_constante', 'avatar_l2_fe_inquebrantable', 'avatar_l2_amor_sacrificial', 'avatar_l2_paz_permanece'],
    rewardPoints: 800,
    isV2: true,
  },
  collection_l2_llamados: {
    id: 'collection_l2_llamados',
    name: 'The Called',
    nameEs: 'Los Llamados',
    description: 'Avatars for those walking in their calling',
    descriptionEs: 'Avatares para los que caminan en su llamado',
    subtitle: 'Chosen, sent, and walking forward',
    subtitleEs: 'Elegidos, enviados y caminando hacia adelante',
    inspiration: 'You were not called to spectate — you were called to act. This collection is for those who have said yes to their purpose and walk it out day by day with courage.',
    inspirationEs: 'No fuiste llamado a observar — fuiste llamado a actuar. Esta coleccion es para quienes han dicho si a su proposito y lo viven dia a dia con valentia.',
    icon: '📣',
    items: ['avatar_l2_siervo_fiel', 'avatar_l2_guerrero_oracion', 'avatar_l2_portador_luz', 'avatar_l2_atalaya', 'avatar_l2_sembrador', 'avatar_l2_testigo'],
    rewardPoints: 900,
    isV2: true,
  },
  collection_l2_simbolos_profundos: {
    id: 'collection_l2_simbolos_profundos',
    name: 'Deep Symbols',
    nameEs: 'Simbolos Profundos',
    description: 'Sacred symbols with rich theological meaning',
    descriptionEs: 'Simbolos sagrados con significado teologico profundo',
    subtitle: 'Ancient truths, living power',
    subtitleEs: 'Verdades antiguas, poder vivo',
    inspiration: 'These symbols carry centuries of theological depth. Each one points to a facet of God\'s nature and redemptive work. To complete this collection is to meditate on the fullness of the gospel.',
    inspirationEs: 'Estos simbolos llevan siglos de profundidad teologica. Cada uno apunta a una faceta de la naturaleza de Dios y su obra redentora. Completar esta coleccion es meditar en la plenitud del evangelio.',
    icon: '✨',
    items: ['avatar_l2_lampara_encendida', 'avatar_l2_corona_vida', 'avatar_l2_espada_espiritu', 'avatar_l2_ancla_alma', 'avatar_l2_pergamino_vivo', 'avatar_l2_fuente_agua'],
    rewardPoints: 1000,
    isV2: true,
  },
};

// Store Bundles - discounted item packages
export const STORE_BUNDLES: Record<string, {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  items: string[];
  originalPrice: number;
  bundlePrice: number;
  collectionBonus?: number;
  rarity: string;
  isV2?: boolean;
  isAdventure?: boolean;
  adventureId?: string;
  adventureNumber?: number;
  storyId?: string;
  storyDays?: number;
  comingSoon?: boolean;
}> = {
  bundle_gratitud: {
    id: 'bundle_gratitud',
    name: 'Gratitude Kit',
    nameEs: 'Kit Gratitud',
    description: 'Start your journey with thankfulness',
    descriptionEs: 'Comienza tu viaje con gratitud',
    items: ['theme_bosque', 'frame_verde', 'title_corazon'],
    originalPrice: 800,
    bundlePrice: 550,
    rarity: 'rare',
  },
  bundle_luz_divina: {
    id: 'bundle_luz_divina',
    name: 'Divine Light Bundle',
    nameEs: 'Paquete Luz Divina',
    description: 'Illuminate your spiritual path',
    descriptionEs: 'Ilumina tu camino espiritual',
    items: ['theme_noche_paz', 'frame_luz', 'title_buscador'],
    originalPrice: 950,
    bundlePrice: 650,
    rarity: 'rare',
  },
  bundle_peregrino: {
    id: 'bundle_peregrino',
    name: 'Pilgrim Collection',
    nameEs: 'Coleccion Peregrino',
    description: 'For those walking in faith',
    descriptionEs: 'Para quienes caminan en fe',
    items: ['theme_desierto', 'frame_pergamino', 'title_peregrino', 'avatar_lamb'],
    originalPrice: 1450,
    bundlePrice: 950,
    rarity: 'epic',
  },
  // ============================================
  // V2 BUNDLES - Premium Packages
  // ============================================
  bundle_v2_gratitud: {
    id: 'bundle_v2_gratitud',
    name: 'Gratitude V2 Kit',
    nameEs: 'Kit Gratitud V2',
    description: 'Premium gratitude collection with V2 items',
    descriptionEs: 'Coleccion premium de gratitud con items V2',
    items: ['theme_jardin_gracia', 'avatar_v2_gratitud', 'frame_dorado', 'title_corazon'],
    originalPrice: 1350,
    bundlePrice: 950,
    rarity: 'rare',
    isV2: true,
  },
  bundle_v2_paz: {
    id: 'bundle_v2_paz',
    name: 'Peace V2 Kit',
    nameEs: 'Kit Paz V2',
    description: 'Serenity and peace themed bundle',
    descriptionEs: 'Paquete tematico de serenidad y paz',
    items: ['theme_noche_profunda', 'avatar_v2_paloma_paz', 'avatar_v2_paz', 'title_sembrador'],
    originalPrice: 1950,
    bundlePrice: 1350,
    rarity: 'rare',
    isV2: true,
  },
  bundle_v2_fe: {
    id: 'bundle_v2_fe',
    name: 'Faith V2 Kit',
    nameEs: 'Kit Fe V2',
    description: 'Strengthen your faith with premium items',
    descriptionEs: 'Fortalece tu fe con items premium',
    items: ['theme_cielo_gloria', 'avatar_v2_fe', 'avatar_v2_cruz_radiante', 'frame_cielo', 'title_valiente'],
    originalPrice: 2330,
    bundlePrice: 1600,
    rarity: 'epic',
    isV2: true,
  },
  bundle_v2_promesa: {
    id: 'bundle_v2_promesa',
    name: 'Promise V2 Kit',
    nameEs: 'Kit Promesa V2',
    description: 'Divine promises collection',
    descriptionEs: 'Coleccion de promesas divinas',
    items: ['theme_promesa_violeta', 'avatar_v2_arcoiris', 'avatar_v2_ancla_esperanza', 'title_portador'],
    originalPrice: 1580,
    bundlePrice: 1100,
    rarity: 'rare',
    isV2: true,
  },
  bundle_v2_infantil: {
    id: 'bundle_v2_infantil',
    name: 'Kids Starter Kit',
    nameEs: 'Kit Infantil',
    description: 'Cute collection for young believers',
    descriptionEs: 'Coleccion linda para jovenes creyentes',
    items: ['avatar_v2_estrellita', 'avatar_v2_arcoiris', 'avatar_v2_nube', 'avatar_v2_angelito'],
    originalPrice: 1440,
    bundlePrice: 900,
    rarity: 'rare',
    isV2: true,
  },
  bundle_v2_naturaleza: {
    id: 'bundle_v2_naturaleza',
    name: 'Nature V2 Bundle',
    nameEs: 'Paquete Naturaleza V2',
    description: 'Biblical nature premium collection',
    descriptionEs: 'Coleccion premium de naturaleza biblica',
    items: ['theme_bosque_sereno', 'avatar_v2_rama_olivo', 'avatar_v2_vid_racimos', 'avatar_v2_semilla_mostaza', 'frame_corona'],
    originalPrice: 1720,
    bundlePrice: 1200,
    rarity: 'epic',
    isV2: true,
  },
  // ============================================
  // AVENTURAS BÍBLICAS — Biblical Adventures
  // ============================================
  // Aventura 1: Jonás
  bundle_adv_jonas: {
    id: 'bundle_adv_jonas',
    name: 'Jonah\'s Adventure',
    nameEs: 'Aventura de Jonás',
    description: 'Three exclusive items from Jonah\'s journey into the deep',
    descriptionEs: 'Tres items exclusivos del viaje de Jonás hacia las profundidades',
    items: ['avatar_adv_jonah_whale', 'frame_adv_ocean_deep', 'title_mensajero_senor'],
    originalPrice: 3500,
    bundlePrice: 2500,
    collectionBonus: 600,
    rarity: 'epic',
    isAdventure: true,
    adventureId: 'adv_jonah',
    adventureNumber: 1,
    storyId: 'story_adv_jonah',
    storyDays: 5,
  },
  // Aventura 2: David vs Goliat
  bundle_adv_david: {
    id: 'bundle_adv_david',
    name: 'David vs Goliath',
    nameEs: 'David vs Goliat',
    description: 'Three exclusive items from David\'s legendary battle of faith',
    descriptionEs: 'Tres items exclusivos de la legendaria batalla de fe de David',
    items: ['avatar_adv_david_sling', 'frame_adv_valley_battle', 'title_vencedor_gigantes'],
    originalPrice: 3500,
    bundlePrice: 2500,
    collectionBonus: 600,
    rarity: 'epic',
    isAdventure: true,
    adventureId: 'adv_david',
    adventureNumber: 2,
    storyId: 'story_adv_david',
    storyDays: 5,
  },
  // Aventura 3: Ester (Fase 1 - preparada)
  bundle_adv_esther: {
    id: 'bundle_adv_esther',
    name: 'Esther\'s Courage',
    nameEs: 'La Valentía de Ester',
    description: 'Exclusive items from Esther\'s story of divine courage',
    descriptionEs: 'Items exclusivos de la historia de valentía divina de Ester',
    items: ['avatar_adv_queen_esther', 'frame_adv_royal_persia', 'title_valiente_corazon'],
    originalPrice: 3500,
    bundlePrice: 2500,
    collectionBonus: 600,
    rarity: 'epic',
    isAdventure: true,
    adventureId: 'adv_esther',
    adventureNumber: 3,
    storyId: 'story_adv_esther',
    storyDays: 5,
    comingSoon: true,
  },
  // Aventura 4: Daniel (Fase 1 - preparada)
  bundle_adv_daniel: {
    id: 'bundle_adv_daniel',
    name: 'Daniel\'s Faith',
    nameEs: 'La Fe de Daniel',
    description: 'Exclusive items from Daniel\'s unshakeable faith in the lion\'s den',
    descriptionEs: 'Items exclusivos de la fe inquebrantable de Daniel en la fosa de los leones',
    items: ['avatar_adv_lion_faith', 'frame_adv_lions_den', 'title_fe_inquebrantable'],
    originalPrice: 3500,
    bundlePrice: 2500,
    collectionBonus: 600,
    rarity: 'epic',
    isAdventure: true,
    adventureId: 'adv_daniel',
    adventureNumber: 4,
    storyId: 'story_adv_daniel',
    storyDays: 5,
    comingSoon: true,
  },
  // Aventura 5: Moisés
  bundle_adv_moses: {
    id: 'bundle_adv_moses',
    name: 'Moses and the Red Sea',
    nameEs: 'Moisés y el Mar Rojo',
    description: 'Exclusive items from Moses\' miracle at the Red Sea',
    descriptionEs: 'Items exclusivos del milagro de Moisés en el Mar Rojo',
    items: ['avatar_adv_moses_sea', 'frame_adv_red_sea', 'title_camino_en_el_mar'],
    originalPrice: 3500,
    bundlePrice: 2500,
    collectionBonus: 600,
    rarity: 'epic',
    isAdventure: true,
    adventureId: 'adv_moses',
    adventureNumber: 5,
    storyId: 'story_adv_moses',
    storyDays: 5,
    comingSoon: true,
  },
  // Aventura 6: Noé
  bundle_adv_noah: {
    id: 'bundle_adv_noah',
    name: 'Noah and the Covenant',
    nameEs: 'Noé y el Pacto',
    description: 'Exclusive items from Noah\'s journey of faith and God\'s covenant',
    descriptionEs: 'Items exclusivos del viaje de fe de Noé y el pacto de Dios',
    items: ['avatar_adv_noah_dove', 'frame_adv_rainbow', 'title_guardian_del_pacto'],
    originalPrice: 3500,
    bundlePrice: 2500,
    collectionBonus: 600,
    rarity: 'epic',
    isAdventure: true,
    adventureId: 'adv_noah',
    adventureNumber: 6,
    storyId: 'story_adv_noah',
    storyDays: 5,
    comingSoon: true,
  },
  // Aventura 7: Elías
  bundle_adv_elijah: {
    id: 'bundle_adv_elijah',
    name: 'Elijah\'s Fire',
    nameEs: 'El Fuego de Elías',
    description: 'Exclusive items from Elijah\'s fiery encounter with God on Mount Carmel',
    descriptionEs: 'Items exclusivos del encuentro ardiente de Elías con Dios en el Monte Carmelo',
    items: ['avatar_adv_elijah_fire', 'frame_adv_fire_heaven', 'title_profeta_de_fuego'],
    originalPrice: 3500,
    bundlePrice: 2500,
    collectionBonus: 600,
    rarity: 'epic',
    isAdventure: true,
    adventureId: 'adv_elijah',
    adventureNumber: 7,
    storyId: 'story_adv_elijah',
    storyDays: 5,
    comingSoon: true,
  },
  // Aventura 8: José
  bundle_adv_joseph: {
    id: 'bundle_adv_joseph',
    name: 'Joseph the Dreamer',
    nameEs: 'José el Soñador',
    description: 'Exclusive items from Joseph\'s journey from pit to palace',
    descriptionEs: 'Items exclusivos del viaje de José del pozo al palacio',
    items: ['avatar_adv_joseph_dream', 'frame_adv_dream_stars', 'title_sonador_de_dios'],
    originalPrice: 3500,
    bundlePrice: 2500,
    collectionBonus: 600,
    rarity: 'epic',
    isAdventure: true,
    adventureId: 'adv_joseph',
    adventureNumber: 8,
    storyId: 'story_adv_joseph',
    storyDays: 5,
    comingSoon: true,
  },
  // Aventura 9: Pablo
  bundle_adv_paul: {
    id: 'bundle_adv_paul',
    name: 'Paul the Apostle',
    nameEs: 'Pablo el Apóstol',
    description: 'Exclusive items from Paul\'s mission to the nations',
    descriptionEs: 'Items exclusivos de la misión apostólica de Pablo a las naciones',
    items: ['avatar_adv_paul_scroll', 'frame_adv_mission_world', 'title_apostol_de_las_naciones'],
    originalPrice: 3500,
    bundlePrice: 2500,
    collectionBonus: 600,
    rarity: 'epic',
    isAdventure: true,
    adventureId: 'adv_paul',
    adventureNumber: 9,
    storyId: 'story_adv_paul',
    storyDays: 5,
    comingSoon: true,
  },
};

// ─── Chapter Collections ──────────────────────────────────────────────────────
// Two special collections with a chapter/path structure.
// Each chapter must be completed in order.
// Items map to existing store items.

export interface CollectionChapterItem {
  itemId: string;
  itemType: 'avatar' | 'frame' | 'title' | 'theme';
}

export interface CollectionChapter {
  chapterId: string;
  number: number;
  titleEn: string;
  titleEs: string;
  verseEn?: string;
  verseEs?: string;
  spiritualTextEn: string;
  spiritualTextEs: string;
  items: CollectionChapterItem[];
  rewardPoints: number;
}

export interface ChapterCollection {
  collectionId: string;
  nameEn: string;
  nameEs: string;
  descriptionEn: string;
  descriptionEs: string;
  icon: string;
  chapters: CollectionChapter[];
}

export const CHAPTER_COLLECTIONS: Record<string, ChapterCollection> = {
  chapter_naturaleza_biblica: {
    collectionId: 'chapter_naturaleza_biblica',
    nameEn: 'Biblical Nature',
    nameEs: 'Naturaleza Biblica',
    descriptionEn: 'Creation reflects the character of God. Each stage teaches us to grow, bear fruit, and remain.',
    descriptionEs: 'La creacion refleja el caracter de Dios. Cada etapa nos ensena a crecer, dar fruto y permanecer.',
    icon: '🌿',
    chapters: [
      {
        chapterId: 'chapter_naturaleza_biblica_1',
        number: 1,
        titleEn: 'The Seed',
        titleEs: 'La Semilla',
        verseEn: 'Mark 4:30–32',
        verseEs: 'Marcos 4:30–32',
        spiritualTextEn: 'Everything God does begins small, but full of life.',
        spiritualTextEs: 'Todo lo que Dios hace comienza pequeno, pero lleno de vida.',
        items: [
          { itemId: 'theme_bosque', itemType: 'theme' },
          { itemId: 'avatar_v2_semilla_mostaza', itemType: 'avatar' },
        ],
        rewardPoints: 100,
      },
      {
        chapterId: 'chapter_naturaleza_biblica_2',
        number: 2,
        titleEn: 'The Growth',
        titleEs: 'El Crecimiento',
        spiritualTextEn: 'Faith is strengthened when we remain in the process.',
        spiritualTextEs: 'La fe se fortalece cuando permanecemos en el proceso.',
        items: [
          { itemId: 'theme_promesa', itemType: 'theme' },
          { itemId: 'frame_verde', itemType: 'frame' },
        ],
        rewardPoints: 150,
      },
      {
        chapterId: 'chapter_naturaleza_biblica_3',
        number: 3,
        titleEn: 'The Fruit',
        titleEs: 'El Fruto',
        spiritualTextEn: 'A life rooted in God will always bear fruit.',
        spiritualTextEs: 'Una vida arraigada en Dios siempre dara fruto.',
        items: [
          { itemId: 'title_sembrador', itemType: 'title' },
        ],
        rewardPoints: 250,
      },
    ],
  },
  chapter_simbolos_fe: {
    collectionId: 'chapter_simbolos_fe',
    nameEn: 'Symbols of Faith',
    nameEs: 'Simbolos de Fe',
    descriptionEn: 'Symbols remind us of eternal truths that sustain our faith.',
    descriptionEs: 'Los simbolos nos recuerdan verdades eternas que sostienen nuestra fe.',
    icon: '✝️',
    chapters: [
      {
        chapterId: 'chapter_simbolos_fe_1',
        number: 1,
        titleEn: 'The Cross',
        titleEs: 'La Cruz',
        spiritualTextEn: 'In the cross we find forgiveness, love and hope.',
        spiritualTextEs: 'En la cruz encontramos perdon, amor y esperanza.',
        items: [
          { itemId: 'avatar_cross', itemType: 'avatar' },
          { itemId: 'frame_dorado', itemType: 'frame' },
        ],
        rewardPoints: 150,
      },
      {
        chapterId: 'chapter_simbolos_fe_2',
        number: 2,
        titleEn: 'The Spirit',
        titleEs: 'El Espiritu',
        spiritualTextEn: 'We do not walk alone. The Spirit guides us.',
        spiritualTextEs: 'No caminamos solos. El Espiritu nos guia.',
        items: [
          { itemId: 'theme_noche_paz', itemType: 'theme' },
          { itemId: 'avatar_dove', itemType: 'avatar' },
        ],
        rewardPoints: 200,
      },
      {
        chapterId: 'chapter_simbolos_fe_3',
        number: 3,
        titleEn: 'The Crown',
        titleEs: 'La Corona',
        spiritualTextEn: 'Perseverance has its reward.',
        spiritualTextEs: 'La perseverancia tiene recompensa.',
        items: [
          { itemId: 'title_guardian', itemType: 'title' },
        ],
        rewardPoints: 300,
      },
    ],
  },
  chapter_promesas_dios: {
    collectionId: 'chapter_promesas_dios',
    nameEn: "God's Promises",
    nameEs: 'Promesas de Dios',
    descriptionEn: 'Every promise of God is yes and amen in Christ. Discover the covenant, trust, and fulfillment.',
    descriptionEs: 'Todas las promesas de Dios son si y amen en Cristo. Descubre el pacto, la confianza y el cumplimiento.',
    icon: '🌈',
    chapters: [
      {
        chapterId: 'chapter_promesas_dios_1',
        number: 1,
        titleEn: 'The Covenant',
        titleEs: 'El Pacto',
        verseEn: 'Genesis 9:13',
        verseEs: 'Génesis 9:13',
        spiritualTextEn: 'God seals His promise with a sign visible to all.',
        spiritualTextEs: 'Dios sella su promesa con una señal visible para todos.',
        items: [
          { itemId: 'theme_covenant_rainbow', itemType: 'theme' },
          { itemId: 'avatar_promise_scroll', itemType: 'avatar' },
        ],
        rewardPoints: 120,
      },
      {
        chapterId: 'chapter_promesas_dios_2',
        number: 2,
        titleEn: 'The Trust',
        titleEs: 'La Confianza',
        verseEn: 'Proverbs 3:5',
        verseEs: 'Proverbios 3:5',
        spiritualTextEn: 'Trusting God means resting in what we cannot yet see.',
        spiritualTextEs: 'Confiar en Dios significa descansar en lo que aún no podemos ver.',
        items: [
          { itemId: 'frame_faithful_seal', itemType: 'frame' },
          { itemId: 'title_heir_promises', itemType: 'title' },
        ],
        rewardPoints: 160,
      },
      {
        chapterId: 'chapter_promesas_dios_3',
        number: 3,
        titleEn: 'The Fulfillment',
        titleEs: 'El Cumplimiento',
        verseEn: '2 Corinthians 1:20',
        verseEs: '2 Corintios 1:20',
        spiritualTextEn: 'What God promises, God fulfills — always at the right time.',
        spiritualTextEs: 'Lo que Dios promete, Dios lo cumple — siempre en el tiempo correcto.',
        items: [
          { itemId: 'avatar_guiding_star', itemType: 'avatar' },
          { itemId: 'title_patient_wait', itemType: 'title' },
        ],
        rewardPoints: 250,
      },
    ],
  },
  chapter_fruto_espiritu: {
    collectionId: 'chapter_fruto_espiritu',
    nameEn: 'Fruit of the Spirit',
    nameEs: 'Fruto del Espiritu',
    descriptionEn: 'The Spirit shapes us from within. Love, joy, peace — a harvest grown in surrender.',
    descriptionEs: 'El Espíritu nos forma desde adentro. Amor, gozo, paz — una cosecha cultivada en rendición.',
    icon: '🍇',
    chapters: [
      {
        chapterId: 'chapter_fruto_espiritu_1',
        number: 1,
        titleEn: 'Love & Joy',
        titleEs: 'Amor & Gozo',
        verseEn: 'Galatians 5:22',
        verseEs: 'Gálatas 5:22',
        spiritualTextEn: 'Love is the root; joy is the first flower that blooms.',
        spiritualTextEs: 'El amor es la raíz; el gozo es la primera flor que florece.',
        items: [
          { itemId: 'theme_hope_dawn', itemType: 'theme' },
          { itemId: 'avatar_joyful_heart', itemType: 'avatar' },
        ],
        rewardPoints: 120,
      },
      {
        chapterId: 'chapter_fruto_espiritu_2',
        number: 2,
        titleEn: 'Peace & Patience',
        titleEs: 'Paz & Paciencia',
        verseEn: 'Galatians 5:22–23',
        verseEs: 'Gálatas 5:22–23',
        spiritualTextEn: 'Peace that passes understanding, patience that endures the wait.',
        spiritualTextEs: 'Paz que sobrepasa el entendimiento, paciencia que soporta la espera.',
        items: [
          { itemId: 'theme_calm_river', itemType: 'theme' },
          { itemId: 'frame_gentle_breeze', itemType: 'frame' },
        ],
        rewardPoints: 160,
      },
      {
        chapterId: 'chapter_fruto_espiritu_3',
        number: 3,
        titleEn: 'Goodness & Self-Control',
        titleEs: 'Bondad & Dominio Propio',
        verseEn: 'Galatians 5:23',
        verseEs: 'Gálatas 5:23',
        spiritualTextEn: 'Goodness acts; self-control holds firm. Both are gifts of the Spirit.',
        spiritualTextEs: 'La bondad actúa; el dominio propio se mantiene firme. Ambos son dones del Espíritu.',
        items: [
          { itemId: 'avatar_serving_hands', itemType: 'avatar' },
          { itemId: 'frame_serene_crown', itemType: 'frame' },
        ],
        rewardPoints: 250,
      },
    ],
  },
  chapter_armadura_dios: {
    collectionId: 'chapter_armadura_dios',
    nameEn: 'Armor of God',
    nameEs: 'Armadura de Dios',
    descriptionEn: 'Put on the full armor of God. Truth, faith, salvation, and the Word are your weapons.',
    descriptionEs: 'Vestíos de toda la armadura de Dios. La verdad, la fe, la salvación y la Palabra son tus armas.',
    icon: '🛡️',
    chapters: [
      {
        chapterId: 'chapter_armadura_dios_1',
        number: 1,
        titleEn: 'The Truth',
        titleEs: 'La Verdad',
        verseEn: 'Ephesians 6:14',
        verseEs: 'Efesios 6:14',
        spiritualTextEn: 'Truth is the belt that holds everything else in place.',
        spiritualTextEs: 'La verdad es el cinturón que sostiene todo lo demás en su lugar.',
        items: [
          { itemId: 'theme_unshakable_rock', itemType: 'theme' },
          { itemId: 'avatar_lamp_lit', itemType: 'avatar' },
        ],
        rewardPoints: 120,
      },
      {
        chapterId: 'chapter_armadura_dios_2',
        number: 2,
        titleEn: 'Faith & Salvation',
        titleEs: 'Fe & Salvación',
        verseEn: 'Ephesians 6:16–17',
        verseEs: 'Efesios 6:16–17',
        spiritualTextEn: 'The shield of faith extinguishes every flaming arrow of doubt.',
        spiritualTextEs: 'El escudo de la fe apaga todo dardo de duda encendido.',
        items: [
          { itemId: 'frame_shield_faith', itemType: 'frame' },
          { itemId: 'title_belt_truth', itemType: 'title' },
        ],
        rewardPoints: 160,
      },
      {
        chapterId: 'chapter_armadura_dios_3',
        number: 3,
        titleEn: 'The Word',
        titleEs: 'La Palabra',
        verseEn: 'Ephesians 6:17',
        verseEs: 'Efesios 6:17',
        spiritualTextEn: 'The Word of God is the only offensive weapon — alive and sharper than any sword.',
        spiritualTextEs: 'La Palabra de Dios es la única arma ofensiva — viva y más cortante que cualquier espada.',
        items: [
          { itemId: 'avatar_sword_spirit', itemType: 'avatar' },
          { itemId: 'title_guard_word', itemType: 'title' },
        ],
        rewardPoints: 300,
      },
    ],
  },
};


export type ChestReward =
  | { type: 'points'; value: number; weight: number; rarity: string }
  | { type: 'item'; itemId: string; weight: number; rarity: string };

export const WEEKLY_CHEST_CONFIG: { possibleRewards: ChestReward[] } = {
  possibleRewards: [
    { type: 'points', value: 100, weight: 30, rarity: 'common' },
    { type: 'points', value: 200, weight: 20, rarity: 'rare' },
    { type: 'points', value: 350, weight: 10, rarity: 'epic' },
    { type: 'item', itemId: 'avatar_fish', weight: 10, rarity: 'common' },
    { type: 'item', itemId: 'frame_plata', weight: 6, rarity: 'common' },
    { type: 'item', itemId: 'title_buscador', weight: 4, rarity: 'common' },
    // Exclusive chest-only items
    { type: 'item', itemId: 'avatar_chest_serafin', weight: 8, rarity: 'epic' },
    { type: 'item', itemId: 'avatar_chest_zarza', weight: 6, rarity: 'epic' },
    { type: 'item', itemId: 'avatar_chest_mana', weight: 6, rarity: 'rare' },
    { type: 'item', itemId: 'avatar_chest_trompeta', weight: 5, rarity: 'epic' },
    { type: 'item', itemId: 'avatar_chest_palacio', weight: 5, rarity: 'epic' },
    { type: 'item', itemId: 'frame_chest_celestial', weight: 6, rarity: 'epic' },
    { type: 'item', itemId: 'frame_chest_profecia', weight: 5, rarity: 'epic' },
    { type: 'item', itemId: 'frame_chest_zafiro', weight: 5, rarity: 'rare' },
    { type: 'item', itemId: 'frame_chest_santo', weight: 4, rarity: 'epic' },
    { type: 'item', itemId: 'frame_chest_nuevo_dia', weight: 4, rarity: 'rare' },
    { type: 'item', itemId: 'title_chest_ungido', weight: 5, rarity: 'epic' },
    { type: 'item', itemId: 'title_chest_columna', weight: 4, rarity: 'epic' },
    { type: 'item', itemId: 'title_chest_profeta', weight: 4, rarity: 'epic' },
    { type: 'item', itemId: 'title_chest_escogido', weight: 6, rarity: 'rare' },
    { type: 'item', itemId: 'title_chest_intercesor', weight: 5, rarity: 'rare' },
    { type: 'item', itemId: 'theme_chest_gloria', weight: 4, rarity: 'epic' },
    { type: 'item', itemId: 'theme_chest_desierto', weight: 5, rarity: 'rare' },
    { type: 'item', itemId: 'theme_chest_trono', weight: 3, rarity: 'epic' },
    { type: 'item', itemId: 'theme_chest_lluvia', weight: 5, rarity: 'rare' },
    { type: 'item', itemId: 'theme_chest_mar_rojo', weight: 4, rarity: 'epic' },
  ],
};

// Prayer Request Categories
export const PRAYER_CATEGORIES = [
  { key: 'work', labelEn: 'Work / Provision', labelEs: 'Trabajo / Provisión', icon: 'Briefcase' },
  { key: 'health', labelEn: 'Health', labelEs: 'Salud', icon: 'Heart' },
  { key: 'family', labelEn: 'Family', labelEs: 'Familia', icon: 'Users' },
  { key: 'peace', labelEn: 'Peace / Anxiety', labelEs: 'Paz / Ansiedad', icon: 'Cloud' },
  { key: 'wisdom', labelEn: 'Wisdom / Direction', labelEs: 'Sabiduría / Dirección', icon: 'Compass' },
  { key: 'studies', labelEn: 'Studies', labelEs: 'Estudios', icon: 'BookOpen' },
  { key: 'restoration', labelEn: 'Restoration', labelEs: 'Restauración', icon: 'RefreshCw' },
  { key: 'gratitude', labelEn: 'Gratitude', labelEs: 'Gratitud', icon: 'Sparkles' },
  { key: 'salvation', labelEn: 'Salvation (for someone)', labelEs: 'Salvación (por alguien)', icon: 'HandHeart' },
  { key: 'strength', labelEn: 'Strength', labelEs: 'Fortaleza', icon: 'Shield' },
  { key: 'friend_strength', labelEn: 'Strength for a Friend', labelEs: 'Fortaleza para un amig@', icon: 'HeartHandshake' },
] as const;

export type PrayerCategoryKey = typeof PRAYER_CATEGORIES[number]['key'];

export const TRANSLATIONS = {
  en: {
    // General
    app_name: 'Luz Diaria',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    done: 'Done',
    back: 'Back',

    // Tabs
    tab_home: 'Today',
    tab_library: 'Library',
    tab_store: 'Customize',
    tab_community: 'Community',
    tab_settings: 'Settings',

    // Community
    community_title: 'Community',
    community_subtitle: 'We walk together',
    community_empty: 'No community members yet. Be the first to join!',
    community_you: 'You',
    community_devotionals: 'Devotionals',
    community_streak: 'Streak',
    community_opt_in: 'Show me in Community',
    community_opt_in_desc: 'Allow others to see your progress',
    community_walking_together: 'Walking together in faith',
    community_god_works: 'God works in His people',

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
    search_placeholder: 'Search devotionals...',
    filter_category: 'Category',
    all_categories: 'All Categories',
    no_results: 'No results found',

    // Store
    store: 'Customize',
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

    // Transfer Code
    account_transfer: 'Account Transfer',
    account_transfer_desc: 'Move your progress to another device',
    generate_code: 'Generate Transfer Code',
    enter_code: 'Enter Transfer Code',
    transfer_code: 'Transfer Code',
    code_expires_in: 'Code expires in {minutes} minutes',
    code_expired: 'Code expired',
    copy_code: 'Copy Code',
    code_copied: 'Code copied!',
    enter_code_placeholder: 'Enter 8-character code',
    restore: 'Restore',
    restoring: 'Restoring...',
    restore_success: 'Account restored successfully!',
    restore_success_desc: 'Your progress has been transferred to this device.',
    invalid_code: 'Invalid or expired code',
    transfer_warning: 'This code expires in 15 minutes. Enter it on your new device.',
    generating: 'Generating...',
    user_id: 'User ID',

    // Prayer Tab
    tab_prayer: 'Prayer',
    prayer_title: 'Prayer',
    prayer_subtitle: 'We lift up our community',
    prayer_my_request: 'My Request',
    prayer_select_category: 'Select a category',
    prayer_mode_daily: 'Today',
    prayer_mode_weekly: 'This Week',
    prayer_save: 'Save',
    prayer_current_request: 'Current request',
    prayer_expires: 'Expires',
    prayer_community_requests: 'Community Requests',
    prayer_community_empty: 'No prayer requests yet. Be the first!',
    prayer_summary: 'Summary',
    prayer_anonymous: 'A brother/sister',
    prayer_today_badge: 'Today',
    prayer_week_badge: 'Week',
    prayer_request_saved: 'Prayer request saved',
    prayer_already_submitted: 'Already submitted for this period',
    prayer_of_the_day: 'Prayer of the Day',
    prayer_of_the_day_empty: 'No prayer of the day yet',
    prayer_prayed_for_community: 'I prayed for the community',
    prayer_prayed_today: 'You already prayed today',
    prayer_display_opt_in: 'Show my nickname in prayers',
    prayer_display_opt_in_desc: 'If off, you appear as "A brother/sister"',
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
    tab_store: 'Personalizar',
    tab_community: 'Comunidad',
    tab_settings: 'Ajustes',

    // Community
    community_title: 'Comunidad',
    community_subtitle: 'Caminamos juntos',
    community_empty: 'Aun no hay usuarios en Comunidad. Se el primero en activarlo.',
    community_you: 'Tu',
    community_devotionals: 'Devocionales',
    community_streak: 'Racha',
    community_opt_in: 'Mostrarme en Comunidad',
    community_opt_in_desc: 'Permite que otros vean tu progreso',
    community_walking_together: 'Caminando juntos en fe',
    community_god_works: 'Dios obra en Su pueblo',

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
    search_placeholder: 'Buscar devocionales...',
    filter_category: 'Categoria',
    all_categories: 'Todas las Categorias',
    no_results: 'Sin resultados',

    // Store
    store: 'Personalizar',
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

    // Transfer Code
    account_transfer: 'Transferir Cuenta',
    account_transfer_desc: 'Mueve tu progreso a otro dispositivo',
    generate_code: 'Generar Codigo de Transferencia',
    enter_code: 'Ingresar Codigo de Transferencia',
    transfer_code: 'Codigo de Transferencia',
    code_expires_in: 'El codigo expira en {minutes} minutos',
    code_expired: 'Codigo expirado',
    copy_code: 'Copiar Codigo',
    code_copied: 'Codigo copiado!',
    enter_code_placeholder: 'Ingresa codigo de 8 caracteres',
    restore: 'Restaurar',
    restoring: 'Restaurando...',
    restore_success: 'Cuenta restaurada exitosamente!',
    restore_success_desc: 'Tu progreso ha sido transferido a este dispositivo.',
    invalid_code: 'Codigo invalido o expirado',
    transfer_warning: 'Este codigo expira en 15 minutos. Ingresalo en tu nuevo dispositivo.',
    generating: 'Generando...',
    user_id: 'ID de Usuario',

    // Prayer Tab
    tab_prayer: 'Oración',
    prayer_title: 'Oración',
    prayer_subtitle: 'Elevamos a nuestra comunidad',
    prayer_my_request: 'Mi Petición',
    prayer_select_category: 'Selecciona una categoría',
    prayer_mode_daily: 'Hoy',
    prayer_mode_weekly: 'Esta Semana',
    prayer_save: 'Guardar',
    prayer_current_request: 'Petición actual',
    prayer_expires: 'Expira',
    prayer_community_requests: 'Peticiones de la Comunidad',
    prayer_community_empty: 'Aún no hay peticiones. ¡Sé el primero!',
    prayer_summary: 'Resumen',
    prayer_anonymous: 'Un hermano/a',
    prayer_today_badge: 'Hoy',
    prayer_week_badge: 'Semana',
    prayer_request_saved: 'Petición guardada',
    prayer_already_submitted: 'Ya enviaste para este período',
    prayer_of_the_day: 'Oración del Día',
    prayer_of_the_day_empty: 'Aún no hay oración del día',
    prayer_prayed_for_community: 'Oré por la comunidad',
    prayer_prayed_today: 'Ya oraste hoy',
    prayer_display_opt_in: 'Mostrar mi nombre en oraciones',
    prayer_display_opt_in_desc: 'Si está desactivado, aparecerás como "Un hermano/a"',
  },
} as const;
