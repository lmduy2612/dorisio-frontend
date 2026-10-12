import { describe, it, expect } from 'vitest';
import {
  resolveCreatorTier,
  getCreatorTierInfo,
  CREATOR_TIER_DEFINITIONS,
} from './creator-tier';

describe('creator-tier system', () => {
  describe('resolveCreatorTier', () => {
    it('returns bronze for 0 or null inputs', () => {
      expect(resolveCreatorTier(null)).toBe('bronze');
      expect(resolveCreatorTier(undefined)).toBe('bronze');
      expect(resolveCreatorTier(0)).toBe('bronze');
      expect(resolveCreatorTier({ totalEarnings: 0 })).toBe('bronze');
    });

    it('resolves tier based on earnings thresholds', () => {
      expect(resolveCreatorTier(25)).toBe('bronze');
      expect(resolveCreatorTier(50)).toBe('silver');
      expect(resolveCreatorTier(499)).toBe('silver');
      expect(resolveCreatorTier(500)).toBe('gold');
      expect(resolveCreatorTier(1999)).toBe('gold');
      expect(resolveCreatorTier(2000)).toBe('platinum');
      expect(resolveCreatorTier(50000)).toBe('platinum');
    });

    it('respects explicit tier property on creator object if valid', () => {
      expect(resolveCreatorTier({ totalEarnings: 10, tier: 'gold' })).toBe('gold');
      expect(resolveCreatorTier({ totalEarnings: 5000, tier: 'silver' })).toBe('silver');
    });

    it('falls back to earnings if explicit tier is invalid', () => {
      expect(resolveCreatorTier({ totalEarnings: 600, tier: 'diamond' })).toBe('gold');
    });
  });

  describe('getCreatorTierInfo', () => {
    it('returns full tier information and benefits for bronze', () => {
      const info = getCreatorTierInfo(20);
      expect(info.tier).toBe('bronze');
      expect(info.label).toBe('Bronze');
      expect(info.benefits).toEqual(CREATOR_TIER_DEFINITIONS.bronze.benefits);
      expect(info.nextTier).toBe('silver');
      expect(info.nextTierLabel).toBe('Silver');
      expect(info.nextTierThreshold).toBe(50);
      expect(info.amountToNext).toBe(30);
      expect(info.progressPercent).toBe(40);
      expect(info.nextTierBenefits).toEqual(CREATOR_TIER_DEFINITIONS.silver.benefits);
    });

    it('returns upgrade info for gold approaching platinum', () => {
      const info = getCreatorTierInfo(1250);
      expect(info.tier).toBe('gold');
      expect(info.nextTier).toBe('platinum');
      expect(info.nextTierThreshold).toBe(2000);
      expect(info.amountToNext).toBe(750);
      expect(info.progressPercent).toBe(50);
    });

    it('handles max tier (platinum) with no next tier', () => {
      const info = getCreatorTierInfo(3000);
      expect(info.tier).toBe('platinum');
      expect(info.nextTier).toBeNull();
      expect(info.nextTierLabel).toBeNull();
      expect(info.nextTierThreshold).toBeNull();
      expect(info.amountToNext).toBe(0);
      expect(info.progressPercent).toBe(100);
      expect(info.nextTierBenefits).toEqual([]);
    });

    it('updates dynamically when creator changes tier', () => {
      const initial = getCreatorTierInfo({ totalEarnings: 20, tier: 'bronze' });
      expect(initial.tier).toBe('bronze');

      const upgraded = getCreatorTierInfo({ totalEarnings: 20, tier: 'silver' });
      expect(upgraded.tier).toBe('silver');
      expect(upgraded.nextTier).toBe('gold');
    });
  });
});
