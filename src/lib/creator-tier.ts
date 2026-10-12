/**
 * Creator Tier System
 *
 * Provides tier definitions, benefit mappings, next-tier upgrade incentives,
 * and calculations for creators based on their tier setting and earnings.
 */

export type CreatorTierLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface CreatorTierDefinition {
  tier: CreatorTierLevel;
  label: string;
  minEarnings: number;
  benefits: string[];
}

export const CREATOR_TIER_DEFINITIONS: Record<CreatorTierLevel, CreatorTierDefinition> = {
  bronze: {
    tier: 'bronze',
    label: 'Bronze',
    minEarnings: 0,
    benefits: [
      'Standard tipping and payment processing',
      'Public creator discovery profile',
      'Basic earnings & transaction history',
    ],
  },
  silver: {
    tier: 'silver',
    label: 'Silver',
    minEarnings: 50,
    benefits: [
      'Custom tip preset amounts',
      'Exclusive tier-locked content for supporters',
      'Top-supporter loyalty leaderboard',
      'Supporter badge configuration',
    ],
  },
  gold: {
    tier: 'gold',
    label: 'Gold',
    minEarnings: 500,
    benefits: [
      'Priority discovery placement in creator search',
      'Custom supporter commission requests',
      'Reduced platform processing fee',
      'Live stream preview integration',
    ],
  },
  platinum: {
    tier: 'platinum',
    label: 'Platinum',
    minEarnings: 2000,
    benefits: [
      '0% platform commission fee bonus',
      'Featured creator badge & homepage spotlight',
      'VIP priority partner support',
      'Early access to new platform monetization features',
    ],
  },
};

export const CREATOR_TIER_ORDER: CreatorTierLevel[] = ['bronze', 'silver', 'gold', 'platinum'];

export interface CreatorTierInfo {
  tier: CreatorTierLevel;
  label: string;
  minEarnings: number;
  benefits: string[];
  nextTier: CreatorTierLevel | null;
  nextTierLabel: string | null;
  nextTierThreshold: number | null;
  nextTierBenefits: string[];
  amountToNext: number;
  progressPercent: number;
}

export function resolveCreatorTier(creatorOrEarnings?: { totalEarnings?: number; tier?: string } | number | null): CreatorTierLevel {
  if (creatorOrEarnings == null) return 'bronze';

  if (typeof creatorOrEarnings === 'object') {
    if (creatorOrEarnings.tier) {
      const explicit = creatorOrEarnings.tier.toLowerCase() as CreatorTierLevel;
      if (CREATOR_TIER_ORDER.includes(explicit)) return explicit;
    }
  }

  const earnings = typeof creatorOrEarnings === 'number'
    ? creatorOrEarnings
    : (creatorOrEarnings.totalEarnings || 0);

  if (earnings >= 2000) return 'platinum';
  if (earnings >= 500) return 'gold';
  if (earnings >= 50) return 'silver';
  return 'bronze';
}

export function getCreatorTierInfo(creatorOrEarnings?: { totalEarnings?: number; tier?: string } | number | null): CreatorTierInfo {
  const currentTier = resolveCreatorTier(creatorOrEarnings);
  const currentDef = CREATOR_TIER_DEFINITIONS[currentTier];

  const earnings = typeof creatorOrEarnings === 'number'
    ? creatorOrEarnings
    : typeof creatorOrEarnings === 'object' && creatorOrEarnings != null
    ? creatorOrEarnings.totalEarnings || 0
    : 0;

  const currentIndex = CREATOR_TIER_ORDER.indexOf(currentTier);
  const hasNext = currentIndex < CREATOR_TIER_ORDER.length - 1;
  const nextTier = hasNext ? CREATOR_TIER_ORDER[currentIndex + 1] : null;
  const nextDef = nextTier ? CREATOR_TIER_DEFINITIONS[nextTier] : null;

  let amountToNext = 0;
  let progressPercent = 100;
  let nextTierThreshold: number | null = null;

  if (nextDef) {
    nextTierThreshold = nextDef.minEarnings;
    const currentFloor = currentDef.minEarnings;
    const span = Math.max(1, nextDef.minEarnings - currentFloor);
    const progress = Math.max(0, earnings - currentFloor);
    progressPercent = Math.min(100, Math.max(0, Math.round((progress / span) * 100)));
    amountToNext = Math.max(0, nextDef.minEarnings - earnings);
  }

  return {
    tier: currentTier,
    label: currentDef.label,
    minEarnings: currentDef.minEarnings,
    benefits: currentDef.benefits,
    nextTier,
    nextTierLabel: nextDef ? nextDef.label : null,
    nextTierThreshold,
    nextTierBenefits: nextDef ? nextDef.benefits : [],
    amountToNext,
    progressPercent,
  };
}
