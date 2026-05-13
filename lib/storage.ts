import { AnalysisResult } from './types';

const STORAGE_KEY = 'seo_analyzer_history';
const MAX_RECORDS = 50;

export function getHistory(): AnalysisResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(result: AnalysisResult): void {
  if (typeof window === 'undefined') return;
  const history = getHistory();
  const filtered = history.filter(r => r.url !== result.url);
  const updated = [result, ...filtered].slice(0, MAX_RECORDS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function deleteFromHistory(id: string): void {
  if (typeof window === 'undefined') return;
  const history = getHistory().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}