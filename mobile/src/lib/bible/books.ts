// Complete 66-book Bible catalogue
// Mirrors the BibleVersionRegistry pattern from bible_reader_core

import type { BibleBook } from './types';

export const BIBLE_BOOKS: BibleBook[] = [
  // ── Old Testament ──────────────────────────────────────────
  { id: 'GEN', name: 'Génesis',          nameEn: 'Genesis',          chapters: 50,  testament: 'OT' },
  { id: 'EXO', name: 'Éxodo',            nameEn: 'Exodus',           chapters: 40,  testament: 'OT' },
  { id: 'LEV', name: 'Levítico',         nameEn: 'Leviticus',        chapters: 27,  testament: 'OT' },
  { id: 'NUM', name: 'Números',          nameEn: 'Numbers',          chapters: 36,  testament: 'OT' },
  { id: 'DEU', name: 'Deuteronomio',     nameEn: 'Deuteronomy',      chapters: 34,  testament: 'OT' },
  { id: 'JOS', name: 'Josué',            nameEn: 'Joshua',           chapters: 24,  testament: 'OT' },
  { id: 'JDG', name: 'Jueces',           nameEn: 'Judges',           chapters: 21,  testament: 'OT' },
  { id: 'RUT', name: 'Rut',              nameEn: 'Ruth',             chapters: 4,   testament: 'OT' },
  { id: '1SA', name: '1 Samuel',         nameEn: '1 Samuel',         chapters: 31,  testament: 'OT' },
  { id: '2SA', name: '2 Samuel',         nameEn: '2 Samuel',         chapters: 24,  testament: 'OT' },
  { id: '1KI', name: '1 Reyes',          nameEn: '1 Kings',          chapters: 22,  testament: 'OT' },
  { id: '2KI', name: '2 Reyes',          nameEn: '2 Kings',          chapters: 25,  testament: 'OT' },
  { id: '1CH', name: '1 Crónicas',       nameEn: '1 Chronicles',     chapters: 29,  testament: 'OT' },
  { id: '2CH', name: '2 Crónicas',       nameEn: '2 Chronicles',     chapters: 36,  testament: 'OT' },
  { id: 'EZR', name: 'Esdras',           nameEn: 'Ezra',             chapters: 10,  testament: 'OT' },
  { id: 'NEH', name: 'Nehemías',         nameEn: 'Nehemiah',         chapters: 13,  testament: 'OT' },
  { id: 'EST', name: 'Ester',            nameEn: 'Esther',           chapters: 10,  testament: 'OT' },
  { id: 'JOB', name: 'Job',              nameEn: 'Job',              chapters: 42,  testament: 'OT' },
  { id: 'PSA', name: 'Salmos',           nameEn: 'Psalms',           chapters: 150, testament: 'OT' },
  { id: 'PRO', name: 'Proverbios',       nameEn: 'Proverbs',         chapters: 31,  testament: 'OT' },
  { id: 'ECC', name: 'Eclesiastés',      nameEn: 'Ecclesiastes',     chapters: 12,  testament: 'OT' },
  { id: 'SNG', name: 'Cantares',         nameEn: 'Song of Solomon',  chapters: 8,   testament: 'OT' },
  { id: 'ISA', name: 'Isaías',           nameEn: 'Isaiah',           chapters: 66,  testament: 'OT' },
  { id: 'JER', name: 'Jeremías',         nameEn: 'Jeremiah',         chapters: 52,  testament: 'OT' },
  { id: 'LAM', name: 'Lamentaciones',    nameEn: 'Lamentations',     chapters: 5,   testament: 'OT' },
  { id: 'EZK', name: 'Ezequiel',         nameEn: 'Ezekiel',          chapters: 48,  testament: 'OT' },
  { id: 'DAN', name: 'Daniel',           nameEn: 'Daniel',           chapters: 12,  testament: 'OT' },
  { id: 'HOS', name: 'Oseas',            nameEn: 'Hosea',            chapters: 14,  testament: 'OT' },
  { id: 'JOL', name: 'Joel',             nameEn: 'Joel',             chapters: 3,   testament: 'OT' },
  { id: 'AMO', name: 'Amós',             nameEn: 'Amos',             chapters: 9,   testament: 'OT' },
  { id: 'OBA', name: 'Abdías',           nameEn: 'Obadiah',          chapters: 1,   testament: 'OT' },
  { id: 'JON', name: 'Jonás',            nameEn: 'Jonah',            chapters: 4,   testament: 'OT' },
  { id: 'MIC', name: 'Miqueas',          nameEn: 'Micah',            chapters: 7,   testament: 'OT' },
  { id: 'NAM', name: 'Nahúm',            nameEn: 'Nahum',            chapters: 3,   testament: 'OT' },
  { id: 'HAB', name: 'Habacuc',          nameEn: 'Habakkuk',         chapters: 3,   testament: 'OT' },
  { id: 'ZEP', name: 'Sofonías',         nameEn: 'Zephaniah',        chapters: 3,   testament: 'OT' },
  { id: 'HAG', name: 'Hageo',            nameEn: 'Haggai',           chapters: 2,   testament: 'OT' },
  { id: 'ZEC', name: 'Zacarías',         nameEn: 'Zechariah',        chapters: 14,  testament: 'OT' },
  { id: 'MAL', name: 'Malaquías',        nameEn: 'Malachi',          chapters: 4,   testament: 'OT' },
  // ── New Testament ─────────────────────────────────────────
  { id: 'MAT', name: 'Mateo',            nameEn: 'Matthew',          chapters: 28,  testament: 'NT' },
  { id: 'MRK', name: 'Marcos',           nameEn: 'Mark',             chapters: 16,  testament: 'NT' },
  { id: 'LUK', name: 'Lucas',            nameEn: 'Luke',             chapters: 24,  testament: 'NT' },
  { id: 'JHN', name: 'Juan',             nameEn: 'John',             chapters: 21,  testament: 'NT' },
  { id: 'ACT', name: 'Hechos',           nameEn: 'Acts',             chapters: 28,  testament: 'NT' },
  { id: 'ROM', name: 'Romanos',          nameEn: 'Romans',           chapters: 16,  testament: 'NT' },
  { id: '1CO', name: '1 Corintios',      nameEn: '1 Corinthians',    chapters: 16,  testament: 'NT' },
  { id: '2CO', name: '2 Corintios',      nameEn: '2 Corinthians',    chapters: 13,  testament: 'NT' },
  { id: 'GAL', name: 'Gálatas',          nameEn: 'Galatians',        chapters: 6,   testament: 'NT' },
  { id: 'EPH', name: 'Efesios',          nameEn: 'Ephesians',        chapters: 6,   testament: 'NT' },
  { id: 'PHP', name: 'Filipenses',       nameEn: 'Philippians',      chapters: 4,   testament: 'NT' },
  { id: 'COL', name: 'Colosenses',       nameEn: 'Colossians',       chapters: 4,   testament: 'NT' },
  { id: '1TH', name: '1 Tesalonicenses', nameEn: '1 Thessalonians',  chapters: 5,   testament: 'NT' },
  { id: '2TH', name: '2 Tesalonicenses', nameEn: '2 Thessalonians',  chapters: 3,   testament: 'NT' },
  { id: '1TI', name: '1 Timoteo',        nameEn: '1 Timothy',        chapters: 6,   testament: 'NT' },
  { id: '2TI', name: '2 Timoteo',        nameEn: '2 Timothy',        chapters: 4,   testament: 'NT' },
  { id: 'TIT', name: 'Tito',             nameEn: 'Titus',            chapters: 3,   testament: 'NT' },
  { id: 'PHM', name: 'Filemón',          nameEn: 'Philemon',         chapters: 1,   testament: 'NT' },
  { id: 'HEB', name: 'Hebreos',          nameEn: 'Hebrews',          chapters: 13,  testament: 'NT' },
  { id: 'JAS', name: 'Santiago',         nameEn: 'James',            chapters: 5,   testament: 'NT' },
  { id: '1PE', name: '1 Pedro',          nameEn: '1 Peter',          chapters: 5,   testament: 'NT' },
  { id: '2PE', name: '2 Pedro',          nameEn: '2 Peter',          chapters: 3,   testament: 'NT' },
  { id: '1JN', name: '1 Juan',           nameEn: '1 John',           chapters: 5,   testament: 'NT' },
  { id: '2JN', name: '2 Juan',           nameEn: '2 John',           chapters: 1,   testament: 'NT' },
  { id: '3JN', name: '3 Juan',           nameEn: '3 John',           chapters: 1,   testament: 'NT' },
  { id: 'JUD', name: 'Judas',            nameEn: 'Jude',             chapters: 1,   testament: 'NT' },
  { id: 'REV', name: 'Apocalipsis',      nameEn: 'Revelation',       chapters: 22,  testament: 'NT' },
];

export const OT_BOOKS = BIBLE_BOOKS.filter(b => b.testament === 'OT');
export const NT_BOOKS = BIBLE_BOOKS.filter(b => b.testament === 'NT');

export function getBookById(id: string): BibleBook | undefined {
  return BIBLE_BOOKS.find(b => b.id === id);
}
