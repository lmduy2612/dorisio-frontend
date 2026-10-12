/**
 * Creator Tier Benefits Card
 * Displays current creator tier level, active benefits, and next-tier upgrade incentives.
 */

'use client';

import { CheckCircle2, ChevronRight, Sparkles, TrendingUp } from 'lucide-react';
import { CreatorTierBadge } from '@/components/shared/creator-tier-badge';
import { getCreatorTierInfo } from '@/lib/creator-tier';
import { formatCurrency } from '@/utils/formatters';

export interface CreatorTierBenefitsCardProps {
  totalEarnings?: number;
  tier?: string;
  className?: string;
}

export function CreatorTierBenefitsCard({
  totalEarnings = 0,
  tier,
  className = '',
}: CreatorTierBenefitsCardProps): JSX.Element {
  const info = getCreatorTierInfo({ totalEarnings, tier });

  return (
    <div
      className={`rounded-xl border bg-card p-6 shadow-sm ${className}`}
      data-testid="creator-tier-benefits-card"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">Creator Tier & Benefits</h3>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your creator tier unlocks enhanced platform perks and features.
          </p>
        </div>
        <CreatorTierBadge tier={info.tier} size="md" />
      </div>

      {/* Grid: Current Benefits vs Next Tier Upgrade Incentives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Current Active Benefits */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current Benefits ({info.label})
            </span>
          </div>
          <ul className="space-y-2 text-sm">
            {info.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2 text-foreground/90">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Next Tier Upgrade Incentives */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4">
          {info.nextTier ? (
            <>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Next Tier: {info.nextTierLabel}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {formatCurrency(totalEarnings)} / {formatCurrency(info.nextTierThreshold || 0)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${info.progressPercent}%` }}
                  role="progressbar"
                  aria-valuenow={info.progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Progress to next tier"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Earn <span className="font-semibold text-foreground">{formatCurrency(info.amountToNext)}</span> more to unlock {info.nextTierLabel} tier!
              </p>

              <div className="space-y-2 pt-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Incentives at {info.nextTierLabel}:
                </span>
                <ul className="space-y-1.5 text-xs text-foreground/80">
                  {info.nextTierBenefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-1.5">
                      <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Sparkles className="h-8 w-8 text-cyan-500 mb-2" />
              <h4 className="font-bold text-sm text-foreground">Top Tier Achieved!</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                You are at Platinum Tier. You have unlocked all exclusive creator privileges and 0% platform fee benefits.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
