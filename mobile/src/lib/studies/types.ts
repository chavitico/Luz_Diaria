export interface StudyKeyVerse {
  reference: string;
  text: string;
}

export interface StudyVerse {
  number: number;
  text: string;
}

export interface StudyContextVerse {
  reference: string;
  text: string;
}

export interface StudyScripturePassage {
  reference: string;
  verses: StudyVerse[];
  context_verses: StudyContextVerse[];
}

export interface StudyGreekWord {
  word: string;
  transliteration: string;
  strong: string;
  meaning: string;
  revelation: string;
}

export interface StudyDiscoveryQuestion {
  category: string;
  question: string;
}

export interface StudyPrayer {
  title: string;
  content: string;
}

export interface StudyScriptureConnection {
  reference: string;
  text: string;
}

export interface StudyCard {
  order: number;
  type:
    | 'opening_parallel'
    | 'greek_exegesis'
    | 'theological_depth'
    | 'identity_transformation'
    | 'discovery_activation';
  icon: string;
  title: string;
  subtitle?: string;
  content?: string;
  revelation_key?: string;
  identity_statement?: string;
  greek_words?: StudyGreekWord[];
  scripture_connections?: StudyScriptureConnection[];
  discovery_questions?: StudyDiscoveryQuestion[];
  prayer?: StudyPrayer;
}

export interface Study {
  id: string;
  type: string;
  date: string;
  title: string;
  subtitle: string;
  language: string;
  version: string;
  estimated_reading_minutes: number;
  key_verse: StudyKeyVerse;
  scripture_passage: StudyScripturePassage;
  cards: StudyCard[];
  tags: string[];
  metadata: {
    total_word_count: number;
    greek_words_count: number;
    scripture_references_count: number;
    difficulty_level: string;
    themes: string[];
    emotional_intensity: string;
    application_focus: string;
  };
}

export interface StudyCatalogEntry {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  estimated_reading_minutes: number;
  imageUrl: string;
  dataFile: () => Study;
  title_en?: string;
  subtitle_en?: string;
  estimated_reading_minutes_en?: number;
  dataFileEn?: () => Study;
}
