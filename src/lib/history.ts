'use client';

import { z } from 'zod';

const HistoryItemSchema = z.object({
  id: z.string(),
  type: z.enum(['prompt', 'structured', 'text', 'enhanced']),
  title: z.string(),
  data: z.any(),
  createdAt: z.string().datetime(),
});

export type HistoryItem = z.infer<typeof HistoryItemSchema>;

const HISTORY_KEY = 'synthetix-history';

export function getHistory(): HistoryItem[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const historyJson = localStorage.getItem(HISTORY_KEY);
    if (!historyJson) {
      return [];
    }
    const history = JSON.parse(historyJson);
    // Validate and filter out invalid items
    return history.map((item: any) => HistoryItemSchema.safeParse(item)).filter((p: any) => p.success).map((p: any) => p.data);
  } catch (error) {
    console.error("Failed to parse history from localStorage", error);
    return [];
  }
}

export function addToHistory(item: Omit<HistoryItem, 'id' | 'createdAt'>) {
  if (typeof window === 'undefined') {
    return;
  }
  const history = getHistory();
  const newItem: HistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const newHistory = [newItem, ...history];
  localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
}

export function clearHistory() {
    if (typeof window === 'undefined') {
        return;
    }
    localStorage.removeItem(HISTORY_KEY);
}
