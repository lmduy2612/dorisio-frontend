/**
 * Zustand Store Utilities & Shared Patterns
 *
 * Provides shared utilities for:
 * - LocalStorage persistence configuration
 * - Initial state and reset pattern management
 * - Immutable dictionary / record operations (recordSet, recordDelete)
 * - Array collection helpers (updateItemInList, removeItemFromList, addRecentItem)
 * - Number list sanitization & sorting
 */

import type { PersistOptions } from 'zustand/middleware';

/**
 * Creates standardized persistence configuration with consistent naming and error resilience.
 */
export function createPersistConfig<T>(
  name: string,
  options?: Partial<PersistOptions<T>>
): PersistOptions<T> {
  return {
    name,
    ...options,
  };
}

/**
 * Immutably sets a key-value pair in a record.
 */
export function recordSet<T>(record: Record<string, T>, key: string, value: T): Record<string, T> {
  return {
    ...record,
    [key]: value,
  };
}

/**
 * Immutably removes a key from a record.
 */
export function recordDelete<T>(record: Record<string, T>, key: string): Record<string, T> {
  const next = { ...record };
  delete next[key];
  return next;
}

/**
 * Immutably updates an item by its id in an array.
 */
export function updateItemInList<T extends { id: string }>(
  list: T[],
  id: string,
  updates: Partial<T> | ((item: T) => Partial<T>)
): T[] {
  return list.map((item) => {
    if (item.id !== id) return item;
    const partial = typeof updates === 'function' ? updates(item) : updates;
    return { ...item, ...partial };
  });
}

/**
 * Immutably removes an item by its id from an array.
 */
export function removeItemFromList<T extends { id: string }>(list: T[], id: string): T[] {
  return list.filter((item) => item.id !== id);
}

/**
 * Adds an item to a most-recently-used list (LIFO, deduplicated, capped to maxItems).
 */
export function addRecentItem<T>(list: T[] = [], item: T, maxItems = 3): T[] {
  const filtered = list.filter((existing) => existing !== item);
  return [item, ...filtered].slice(0, maxItems);
}

/**
 * Sanitizes an array of numbers: filters finite positive numbers (> 0),
 * removes duplicates, and sorts them ascending.
 */
export function sanitizeAndSortPositiveNumbers(numbers: number[]): number[] {
  return Array.from(
    new Set(numbers.filter((n) => typeof n === 'number' && Number.isFinite(n) && n > 0))
  ).sort((a, b) => a - b);
}

/**
 * Merges and deduplicates array items preserving uniqueness.
 */
export function mergeUnique<T>(existing: T[] = [], incoming: T[] = []): T[] {
  return Array.from(new Set([...existing, ...incoming]));
}
