/**
 * Tip Tier Store
 * Manages creator tip preset tiers and remembers recent custom tip amounts
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  createPersistConfig,
  recordSet,
  recordDelete,
  addRecentItem,
  sanitizeAndSortPositiveNumbers,
} from './store-utils';

export const DEFAULT_TIP_TIERS: number[] = [1, 5, 10, 25];
export const MAX_RECENT_CUSTOM_AMOUNTS = 3;

export interface TipTierStore {
  /** Configured preset tip tiers per creator, keyed by creatorId. */
  tiersByCreator: Record<string, number[]>;
  /** Global last 3 used custom tip amounts. */
  recentCustomAmounts: number[];
  /** Per-creator last 3 used custom tip amounts, keyed by creatorId. */
  recentCustomAmountsByCreator: Record<string, number[]>;

  /** Get sorted (low to high) preset tiers for a creator. Falls back to optional initialTiers or DEFAULT_TIP_TIERS. */
  getTipTiers: (creatorId: string, initialTiers?: number[]) => number[];
  /** Set preset tiers for a creator. Automatically filters positive numbers and sorts ascending. */
  setTipTiers: (creatorId: string, tiers: number[]) => void;
  /** Reset preset tiers for a creator to DEFAULT_TIP_TIERS. */
  resetTipTiers: (creatorId: string) => void;

  /** Add a recent custom amount (remembered in both global and per-creator lists, up to 3). */
  addRecentCustomAmount: (amount: number, creatorId?: string) => void;
  /** Get recent custom amounts (last 3 used) for a creator, falling back to global recent amounts. */
  getRecentCustomAmounts: (creatorId?: string) => number[];
  /** Clear recent custom amounts. */
  clearRecentCustomAmounts: (creatorId?: string) => void;
}

export const useTipTierStore = create<TipTierStore>()(
  persist(
    (set, get) => ({
      tiersByCreator: {},
      recentCustomAmounts: [],
      recentCustomAmountsByCreator: {},

      getTipTiers: (creatorId: string, initialTiers?: number[]): number[] => {
        const state = get();
        const customTiers = state.tiersByCreator[creatorId];
        if (customTiers && customTiers.length > 0) {
          return [...customTiers].sort((a, b) => a - b);
        }
        if (initialTiers && initialTiers.length > 0) {
          return sanitizeAndSortPositiveNumbers(initialTiers);
        }
        return [...DEFAULT_TIP_TIERS];
      },

      setTipTiers: (creatorId: string, tiers: number[]): void => {
        const cleanTiers = sanitizeAndSortPositiveNumbers(tiers);

        set((state) => ({
          tiersByCreator: recordSet(state.tiersByCreator, creatorId, cleanTiers),
        }));
      },

      resetTipTiers: (creatorId: string): void => {
        set((state) => ({
          tiersByCreator: recordDelete(state.tiersByCreator, creatorId),
        }));
      },

      addRecentCustomAmount: (amount: number, creatorId?: string): void => {
        if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
          return;
        }

        set((state) => {
          const nextGlobal = addRecentItem(
            state.recentCustomAmounts,
            amount,
            MAX_RECENT_CUSTOM_AMOUNTS
          );

          if (!creatorId) {
            return { recentCustomAmounts: nextGlobal };
          }

          const existingCreator = state.recentCustomAmountsByCreator[creatorId] || [];
          const nextCreator = addRecentItem(existingCreator, amount, MAX_RECENT_CUSTOM_AMOUNTS);

          return {
            recentCustomAmounts: nextGlobal,
            recentCustomAmountsByCreator: recordSet(
              state.recentCustomAmountsByCreator,
              creatorId,
              nextCreator
            ),
          };
        });
      },

      getRecentCustomAmounts: (creatorId?: string): number[] => {
        const state = get();
        if (creatorId && state.recentCustomAmountsByCreator[creatorId]?.length) {
          return state.recentCustomAmountsByCreator[creatorId];
        }
        return state.recentCustomAmounts;
      },

      clearRecentCustomAmounts: (creatorId?: string): void => {
        set((state) => {
          if (!creatorId) {
            return {
              recentCustomAmounts: [],
              recentCustomAmountsByCreator: {},
            };
          }

          return {
            recentCustomAmountsByCreator: recordDelete(
              state.recentCustomAmountsByCreator,
              creatorId
            ),
          };
        });
      },
    }),
    createPersistConfig('dorisio-tip-tier-storage')
  )
);

