// Duel Anti-Repetition — tracks recently-used question IDs per user
// Stores the last N question IDs so they are avoided in the next duel.

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'duel_used_questions_v1';
const MAX_HISTORY = 60; // keep the last 60 used question IDs

export async function getDuelUsedQuestionIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export async function addDuelUsedQuestions(ids: string[]): Promise<void> {
  try {
    const existing = await getDuelUsedQuestionIds();
    // Append new IDs, deduplicate, cap at MAX_HISTORY (keep most recent)
    const merged = [...ids, ...existing];
    const deduped = Array.from(new Set(merged)).slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
  } catch {
    // Non-critical: silently fail
  }
}

export async function clearDuelUsedQuestions(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
