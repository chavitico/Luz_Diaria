// Mock Firestore service - simulates Firebase Firestore operations
// In production, replace with actual Firebase SDK calls

import type { Devotional, User, UserProgress } from './types';

// Generate a unique user ID
export function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// Get today's date in YYYY-MM-DD format
export function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Mock devotional data - in production this would come from Firestore
const MOCK_DEVOTIONALS: Record<string, Devotional> = {
  '2026-02-06': {
    date: '2026-02-06',
    title: 'Walking in Faith',
    titleEs: 'Caminando en Fe',
    imageUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&q=80',
    bibleVerse: '"For we walk by faith, not by sight."',
    bibleVerseEs: '"Porque por fe andamos, no por vista."',
    bibleReference: '2 Corinthians 5:7',
    reflection: 'Faith is not the absence of doubt, but the courage to move forward despite uncertainty. When we cannot see the path ahead, we trust in the One who lights our way. Every step taken in faith brings us closer to understanding God\'s perfect plan for our lives.',
    reflectionEs: 'La fe no es la ausencia de duda, sino el coraje de avanzar a pesar de la incertidumbre. Cuando no podemos ver el camino por delante, confiamos en Aquel que ilumina nuestro camino. Cada paso dado con fe nos acerca más a comprender el plan perfecto de Dios para nuestras vidas.',
    story: 'A young woman named Sarah faced a crossroads in her life. She had been offered a job in a distant city, far from her family and everything she knew. The salary was modest, but she felt a calling to serve in that community. Her friends advised against it, pointing out the risks. But Sarah remembered how Abraham left his homeland, not knowing where he was going, trusting only in God\'s promise. She took the leap of faith. Years later, that decision led her to her life\'s purpose - founding a shelter that has helped hundreds of families in need.',
    storyEs: 'Una joven llamada Sara enfrentaba una encrucijada en su vida. Le habían ofrecido un trabajo en una ciudad distante, lejos de su familia y todo lo que conocía. El salario era modesto, pero sentía un llamado a servir en esa comunidad. Sus amigos le aconsejaron en contra, señalando los riesgos. Pero Sara recordó cómo Abraham dejó su tierra natal, sin saber a dónde iba, confiando solo en la promesa de Dios. Dio el salto de fe. Años después, esa decisión la llevó al propósito de su vida: fundar un refugio que ha ayudado a cientos de familias necesitadas.',
    biblicalCharacter: 'Abraham is known as the father of faith. When God called him to leave his homeland and go to a place he had never seen, Abraham obeyed without hesitation. He believed God\'s promise that he would become the father of many nations, even when circumstances seemed impossible. His unwavering trust in God, despite years of waiting, shows us what true faith looks like - not perfect understanding, but perfect trust.',
    biblicalCharacterEs: 'Abraham es conocido como el padre de la fe. Cuando Dios lo llamó a dejar su tierra natal e ir a un lugar que nunca había visto, Abraham obedeció sin dudar. Creyó en la promesa de Dios de que se convertiría en padre de muchas naciones, incluso cuando las circunstancias parecían imposibles. Su confianza inquebrantable en Dios, a pesar de años de espera, nos muestra cómo es la verdadera fe: no un entendimiento perfecto, sino una confianza perfecta.',
    application: 'Today, identify one area of your life where you\'ve been hesitating to move forward because you can\'t see the outcome. It might be a relationship that needs reconciliation, a career change you\'ve been considering, or a habit you need to break. Write it down, pray about it, and take one small step of faith today. Remember, God doesn\'t ask us to see the whole staircase - just to take the first step.',
    applicationEs: 'Hoy, identifica un área de tu vida donde has estado dudando en avanzar porque no puedes ver el resultado. Puede ser una relación que necesita reconciliación, un cambio de carrera que has estado considerando, o un hábito que necesitas romper. Escríbelo, ora por ello y da un pequeño paso de fe hoy. Recuerda, Dios no nos pide que veamos toda la escalera, solo que demos el primer paso.',
    prayer: 'Heavenly Father, thank You for being a God who guides our steps even when we cannot see the path. Give me the courage to walk by faith today, trusting that You hold my future in Your loving hands. Help me release my need for control and certainty, and instead rest in Your perfect wisdom. When doubts arise, remind me of Your faithfulness throughout history and in my own life. I choose to trust You today, not because I understand, but because I know You are good. In Jesus\' name, Amen.',
    prayerEs: 'Padre Celestial, gracias por ser un Dios que guía nuestros pasos incluso cuando no podemos ver el camino. Dame el coraje de caminar por fe hoy, confiando en que tienes mi futuro en Tus manos amorosas. Ayúdame a soltar mi necesidad de control y certeza, y en su lugar descansar en Tu perfecta sabiduría. Cuando surjan dudas, recuérdame Tu fidelidad a lo largo de la historia y en mi propia vida. Elijo confiar en Ti hoy, no porque entiendo, sino porque sé que eres bueno. En el nombre de Jesús, Amén.',
    topic: 'Faith',
    topicEs: 'Fe',
  },
};

// Generate devotionals for the past 30 days for library demo
function generateHistoricalDevotionals(): Record<string, Devotional> {
  const topics = [
    { en: 'Love', es: 'Amor' },
    { en: 'Hope', es: 'Esperanza' },
    { en: 'Peace', es: 'Paz' },
    { en: 'Joy', es: 'Gozo' },
    { en: 'Patience', es: 'Paciencia' },
    { en: 'Kindness', es: 'Bondad' },
    { en: 'Forgiveness', es: 'Perdón' },
    { en: 'Gratitude', es: 'Gratitud' },
    { en: 'Courage', es: 'Valentía' },
    { en: 'Trust', es: 'Confianza' },
  ];

  const images = [
    'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=80',
    'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800&q=80',
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&q=80',
    'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=800&q=80',
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&q=80',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80',
    'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80',
    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&q=80',
  ];

  const devotionals: Record<string, Devotional> = { ...MOCK_DEVOTIONALS };

  for (let i = 1; i <= 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    if (!devotionals[dateStr]) {
      const topic = topics[i % topics.length];
      const image = images[i % images.length];

      devotionals[dateStr] = {
        date: dateStr,
        title: `Finding ${topic.en} in Daily Life`,
        titleEs: `Encontrando ${topic.es} en la Vida Diaria`,
        imageUrl: image,
        bibleVerse: '"The Lord is my shepherd; I shall not want."',
        bibleVerseEs: '"El Señor es mi pastor; nada me faltará."',
        bibleReference: 'Psalm 23:1',
        reflection: `Today we explore the beautiful gift of ${topic.en.toLowerCase()} that God offers us freely. In a world that often feels chaotic and uncertain, this virtue becomes our anchor and our guide.`,
        reflectionEs: `Hoy exploramos el hermoso regalo de ${topic.es.toLowerCase()} que Dios nos ofrece gratuitamente. En un mundo que a menudo se siente caótico e incierto, esta virtud se convierte en nuestra ancla y nuestra guía.`,
        story: 'A brief story of hope and transformation...',
        storyEs: 'Una breve historia de esperanza y transformación...',
        biblicalCharacter: 'David, the shepherd who became king, exemplified this virtue throughout his life.',
        biblicalCharacterEs: 'David, el pastor que se convirtió en rey, ejemplificó esta virtud a lo largo de su vida.',
        application: 'Take a moment today to practice this virtue in a tangible way.',
        applicationEs: 'Tómate un momento hoy para practicar esta virtud de manera tangible.',
        prayer: 'Lord, fill my heart with Your presence today. Amen.',
        prayerEs: 'Señor, llena mi corazón con Tu presencia hoy. Amén.',
        topic: topic.en,
        topicEs: topic.es,
      };
    }
  }

  return devotionals;
}

const ALL_DEVOTIONALS = generateHistoricalDevotionals();

// Simulated Firestore operations
export const firestoreService = {
  // Check if nickname is available
  async checkNicknameAvailable(nickname: string): Promise<boolean> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    // In production, query Firestore users collection
    const takenNames = ['admin', 'test', 'user', 'guest'];
    return !takenNames.includes(nickname.toLowerCase());
  },

  // Create new user
  async createUser(nickname: string, avatar: string): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user: User = {
      id: generateUserId(),
      nickname,
      avatar,
      points: 100, // Welcome bonus
      streakCurrent: 0,
      streakBest: 0,
      totalTime: 0,
      devotionalsCompleted: 0,
      favorites: [],
      createdAt: Date.now(),
      lastActiveDate: getTodayDate(),
      purchasedItems: [],
      settings: {
        theme: 'dawn',
        language: 'en',
        musicEnabled: true,
        musicVolume: 0.5,
        notificationsEnabled: true,
        streakReminders: true,
        ttsVoice: 'default',
        ttsSpeed: 1.0,
      },
    };

    return user;
  },

  // Get today's devotional
  async getTodayDevotional(): Promise<Devotional> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const today = getTodayDate();
    return ALL_DEVOTIONALS[today] || ALL_DEVOTIONALS['2026-02-06'];
  },

  // Get devotional by date
  async getDevotional(date: string): Promise<Devotional | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return ALL_DEVOTIONALS[date] || null;
  },

  // Get all devotionals for library
  async getAllDevotionals(): Promise<Devotional[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return Object.values(ALL_DEVOTIONALS).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  // Save user progress
  async saveProgress(userId: string, progress: UserProgress): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    // In production, save to Firestore
    console.log('Progress saved:', userId, progress);
  },

  // Update user stats
  async updateUserStats(userId: string, updates: Partial<User>): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('User stats updated:', userId, updates);
  },
};
