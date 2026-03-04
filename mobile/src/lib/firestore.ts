// Devotional service - connects to backend API
// User data is still managed locally with Zustand/AsyncStorage

import type { Devotional, User, UserProgress } from './types';
import {
  getCRToday,
  getDevotionalWithFallback,
  prefetchDevotionals,
  getCachedDevotional,
  cacheDevotional,
} from './devotional-cache';

export { getCRToday as getTodayDateCR, prefetchDevotionals } from './devotional-cache';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

// Generate a unique user ID
export function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// Get today's date in YYYY-MM-DD format using Costa Rica timezone
export function getTodayDate(): string {
  return getCRToday();
}

// Fallback devotional when API is unavailable
const FALLBACK_DEVOTIONAL: Devotional = {
  date: getTodayDate(),
  title: 'Walking in Faith',
  titleEs: 'Caminando en Fe',
  imageUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&q=80',
  bibleVerse: '"For we walk by faith, not by sight."',
  bibleVerseEs: '"Porque por fe andamos, no por vista."',
  bibleReference: '2 Corinthians 5:7',
  bibleReferenceEs: '2 Corintios 5:7',
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
};

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
  async createUser(nickname: string, avatar: string, backendUserId?: string | null): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user: User = {
      id: backendUserId || generateUserId(), // Use backend ID if available
      nickname,
      avatar,
      points: 100, // Welcome bonus
      streakCurrent: 0,
      streakBest: 0,
      totalTime: 0,
      totalShares: 0,
      devotionalsCompleted: 0,
      favorites: [],
      createdAt: Date.now(),
      lastActiveDate: getTodayDate(),
      purchasedItems: [],
      settings: {
        theme: 'dawn',
        language: 'en',
        musicEnabled: false,
        musicVolume: 0.18,
        notificationsEnabled: true,
        streakReminders: true,
        ttsVoice: 'default',
        ttsSpeed: 1.0,
        ttsVolume: 1.0,
      },
    };

    return user;
  },

  // Get today's devotional from backend API (with offline cache fallback)
  // Returns the full meta object so callers can show offline indicators.
  async getTodayDevotional(): Promise<{
    devotional: Devotional;
    fromCache: boolean;
    offline: boolean;
    cachedDate?: string;
  }> {
    const result = await getDevotionalWithFallback();
    if (result.devotional) {
      if (result.fromCache) {
        console.log(`[Firestore] Got devotional from cache (offline: ${result.offline}):`, result.devotional.title);
      } else {
        console.log('[Firestore] Got devotional from network:', result.devotional.title);
      }
      return result as { devotional: Devotional; fromCache: boolean; offline: boolean; cachedDate?: string };
    }
    console.warn('[Firestore] Completely offline with no cache — using fallback devotional');
    return { devotional: FALLBACK_DEVOTIONAL, fromCache: false, offline: true };
  },

  // Get devotional by date from backend API (cache-first for upcoming, network for past)
  async getDevotional(date: string): Promise<Devotional | null> {
    try {
      // Try network first
      const url = `${BACKEND_URL}/api/devotional?date=${date}`;
      const response = await fetch(url);
      if (response.ok) {
        const d = await response.json() as Devotional;
        if (d && d.date) {
          await cacheDevotional(d);
          return d;
        }
      } else if (response.status === 404) {
        return null;
      }
    } catch {}

    // Network failed — try cache
    return getCachedDevotional(date);
  },

  // Get all devotionals for library from backend API
  async getAllDevotionals(): Promise<Devotional[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/devotional/all`);

      if (!response.ok) {
        console.error('[Firestore] Failed to fetch all devotionals:', response.status);
        return [FALLBACK_DEVOTIONAL];
      }

      const devotionals = await response.json() as Devotional[];
      return devotionals;
    } catch (error) {
      console.error('[Firestore] Error fetching all devotionals:', error);
      return [FALLBACK_DEVOTIONAL];
    }
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
