/**
 * Creator Tier Badge
 * Renders a creator's tier badge with visual indicators (Medal, Award, Trophy, Crown)
 */

import { Award, Crown, Medal, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreatorTierLevel } from '@/lib/creator-tier';
import { CREATOR_TIER_DEFINITIONS } from '@/lib/creator-tier';

export interface CreatorTierBadgeProps {
  tier: CreatorTierLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const ICON_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'gap-1 px-2 py-0.5 text-xs',
  md: 'gap-1.5 px-2.5 py-1 text-xs font-medium',
  lg: 'gap-2 px-3 py-1.5 text-sm font-semibold',
};

function getTierStyle(tier: CreatorTierLevel, size: 'sm' | 'md' | 'lg') {
  const iconClass = ICON_CLASSES[size];

  switch (tier) {
    case 'bronze':
      return {
        classes: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
        icon: <Medal className={iconClass} aria-hidden="true" />,
      };
    case 'silver':
      return {
        classes: 'border-slate-400/30 bg-slate-400/10 text-slate-700 dark:text-slate-300',
        icon: <Award className={iconClass} aria-hidden="true" />,
      };
    case 'gold':
      return {
        classes: 'border-yellow-500/40 bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
        icon: <Trophy className={iconClass} aria-hidden="true" />,
      };
    case 'platinum':
      return {
        classes: 'border-cyan-500/40 bg-cyan-500/15 text-cyan-600 dark:text-cyan-300',
        icon: <Crown className={iconClass} aria-hidden="true" />,
      };
  }
}

export function CreatorTierBadge({
  tier,
  size = 'md',
  showLabel = true,
  className,
}: CreatorTierBadgeProps): JSX.Element {
  const definition = CREATOR_TIER_DEFINITIONS[tier] || CREATOR_TIER_DEFINITIONS.bronze;
  const { classes, icon } = getTierStyle(tier, size);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border shadow-sm',
        classes,
        SIZE_CLASSES[size],
        className
      )}
      data-testid={`creator-tier-badge-${tier}`}
      data-creator-tier={tier}
      aria-label={`${definition.label} creator tier`}
      role="status"
    >
      {icon}
      {showLabel && <span>{definition.label} Tier</span>}
    </span>
  );
}
