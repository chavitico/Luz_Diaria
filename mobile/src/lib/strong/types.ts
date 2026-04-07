// Strong's Concordance — Type definitions
// MVP: core models for StrongEntry and VerseWordLink
// TODO: Connect to real Strong's dataset (see service.ts)

export type StrongTestament = 'OT' | 'NT';
export type StrongLanguage = 'Hebrew' | 'Greek';

/** A single entry in Strong's Concordance */
export interface StrongEntry {
  /** Unique identifier, e.g. "H7760" (Hebrew) or "G25" (Greek) */
  id: string;
  /** Which testament this entry belongs to */
  testament: StrongTestament;
  /** Original language word (Hebrew or Greek) */
  lemmaOriginal: string;
  /** Romanized transliteration */
  transliteration: string;
  /** Language of the entry */
  language: StrongLanguage;
  /** Part of speech / grammatical category (e.g. "Verb", "Noun - masculine") */
  grammarCategory: string;
  /** Short one-line definition */
  shortDefinition: string;
  /** Full expanded definition */
  longDefinition: string;
  /** How many times this word appears in the Bible */
  occurrencesCount: number;
  /** Related verse references as strings, e.g. ["Génesis 1:1", "Juan 1:1"] */
  relatedVerses: string[];
  /** Whether the user has saved this entry as a favorite */
  isFavorite?: boolean;
}

/** Links a specific word in a verse to a Strong entry */
export interface VerseWordLink {
  /** Composite key: "{bookId}_{chapter}_{verse}", e.g. "GEN_1_1" */
  verseId: string;
  /** 0-based index of the word within the verse text array */
  wordIndex: number;
  /** The word as displayed in the Bible text */
  displayedWord: string;
  /** The Strong ID this word maps to */
  strongId: string;
  /** Optional morphological data (future use) */
  optionalMorphology?: string;
}

/** Map of verseId → array of word links for quick lookup */
export type VerseStrongMap = Record<string, VerseWordLink[]>;

/** One entry in the "all appearances" list for a Strong ID */
export interface VerseAppearance {
  /** Full verse key, e.g. "GEN_1_1" */
  verseId: string;
  /** Book code, e.g. "GEN" */
  bookId: string;
  /** Chapter number (1-based) */
  chapter: number;
  /** Verse number (1-based) */
  verse: number;
  /** The Spanish word in the verse that carries this Strong tag */
  displayedWord: string;
  /** 0-based index of the word within the verse token array */
  wordIndex: number;
}

/** A word token within a verse, enriched with Strong link data */
export interface VerseToken {
  /** The word text as it appears */
  word: string;
  /** True if followed by a space (for rendering) */
  hasSpace: boolean;
  /** If set, this word is linked to a Strong entry */
  strongId?: string;
  /** 0-based index within the token array */
  index: number;
}
