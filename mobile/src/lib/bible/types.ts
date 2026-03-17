// Bible data models — adapted from bible_reader_core architecture
// Data structure mirrors the BibleDbService pattern (book → chapter → verse)

export interface BibleBook {
  id: string;       // API key: GEN, EXO, MAT, etc.
  name: string;     // Spanish display name
  nameEn: string;   // English display name
  chapters: number; // Total chapter count
  testament: 'OT' | 'NT';
}

export interface BibleVerse {
  number: number;
  text: string;
}

export interface BibleChapterData {
  bookId: string;
  bookName: string;
  chapter: number;
  verses: BibleVerse[];
  lang: 'en' | 'es';
}

export type BibleNavView = 'books' | 'chapters' | 'verses';
