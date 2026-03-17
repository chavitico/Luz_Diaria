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

export type BibleNavView = 'home' | 'books' | 'chapters' | 'verses';

export type BibleVersion = 'RVR60' | 'NVI' | 'LA';

export interface BibleVersionInfo {
  id: BibleVersion;
  label: string;
  fullName: string;
  available: boolean;
}

export type HighlightColor = 'yellow' | 'green' | 'blue';
export type HighlightMap = Record<string, HighlightColor>; // key: `${bookId}_${chapter}_${verse}`

export interface BibleSearchResult {
  reference: string;       // e.g. "Juan 3:16"
  text: string;            // verse snippet
  bookId: string;          // e.g. "JHN"
  chapter: number;
  verse: number;
  source: 'devotional' | 'passage';
}

export interface BibleLastRead {
  bookId: string;
  bookName: string;
  chapter: number;
  lang: string;
  timestamp: number;
}
