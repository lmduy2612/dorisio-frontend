import { describe, it, expect } from 'vitest';
import {
  createPersistConfig,
  recordSet,
  recordDelete,
  updateItemInList,
  removeItemFromList,
  addRecentItem,
  sanitizeAndSortPositiveNumbers,
  mergeUnique,
} from './store-utils';

describe('store-utils', () => {
  describe('createPersistConfig', () => {
    it('creates persist options with name and merged properties', () => {
      const config = createPersistConfig('test-store', {
        version: 2,
      });
      expect(config.name).toBe('test-store');
      expect(config.version).toBe(2);
    });
  });

  describe('recordSet & recordDelete', () => {
    it('sets a key immutably without mutating original record', () => {
      const orig = { a: 1, b: 2 };
      const next = recordSet(orig, 'c', 3);
      expect(next).toEqual({ a: 1, b: 2, c: 3 });
      expect(orig).toEqual({ a: 1, b: 2 });
    });

    it('deletes a key immutably without mutating original record', () => {
      const orig = { a: 1, b: 2, c: 3 };
      const next = recordDelete(orig, 'b');
      expect(next).toEqual({ a: 1, c: 3 });
      expect(orig).toEqual({ a: 1, b: 2, c: 3 });
    });
  });

  describe('updateItemInList & removeItemFromList', () => {
    interface Item {
      id: string;
      name: string;
      active?: boolean;
    }

    const items: Item[] = [
      { id: '1', name: 'First' },
      { id: '2', name: 'Second' },
      { id: '3', name: 'Third' },
    ];

    it('updates item by id using partial object', () => {
      const updated = updateItemInList(items, '2', { name: 'Updated Second', active: true });
      expect(updated[1]).toEqual({ id: '2', name: 'Updated Second', active: true });
      expect(updated[0]).toEqual(items[0]);
      expect(updated[2]).toEqual(items[2]);
    });

    it('updates item by id using updater function', () => {
      const updated = updateItemInList(items, '1', (item) => ({
        name: `${item.name}!`,
      }));
      expect(updated[0].name).toBe('First!');
    });

    it('removes item by id immutably', () => {
      const result = removeItemFromList(items, '2');
      expect(result).toHaveLength(2);
      expect(result.find((i) => i.id === '2')).toBeUndefined();
      expect(items).toHaveLength(3);
    });
  });

  describe('addRecentItem', () => {
    it('prepends item and removes duplicate from later position', () => {
      const list = [10, 20, 30];
      const result = addRecentItem(list, 20, 3);
      expect(result).toEqual([20, 10, 30]);
    });

    it('caps list length to maxItems', () => {
      const list = [1, 2, 3];
      const result = addRecentItem(list, 4, 3);
      expect(result).toEqual([4, 1, 2]);
    });
  });

  describe('sanitizeAndSortPositiveNumbers', () => {
    it('filters out non-positive, non-finite values and sorts ascending', () => {
      const input = [25, -5, 0, 10, 1, 10, NaN, Infinity, 5];
      const result = sanitizeAndSortPositiveNumbers(input);
      expect(result).toEqual([1, 5, 10, 25]);
    });
  });

  describe('mergeUnique', () => {
    it('merges arrays without duplicates', () => {
      const result = mergeUnique(['a', 'b'], ['b', 'c', 'd']);
      expect(result).toEqual(['a', 'b', 'c', 'd']);
    });
  });
});
