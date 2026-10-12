import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CreatorTierBenefitsCard } from './creator-tier-benefits-card';

describe('CreatorTierBenefitsCard', () => {
  it('renders current tier benefits and next tier incentives for bronze', () => {
    render(<CreatorTierBenefitsCard totalEarnings={20} />);

    expect(screen.getByText('Creator Tier & Benefits')).toBeInTheDocument();
    expect(screen.getByText('Bronze Tier')).toBeInTheDocument();
    expect(screen.getByText('Current Benefits (Bronze)')).toBeInTheDocument();
    expect(screen.getByText('Standard tipping and payment processing')).toBeInTheDocument();

    // Next tier preview
    expect(screen.getByText(/Next Tier: Silver/i)).toBeInTheDocument();
    expect(screen.getByText(/Incentives at Silver:/i)).toBeInTheDocument();
    expect(screen.getByText('Custom tip preset amounts')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('updates dynamically when creator changes tier or earnings', () => {
    const { rerender } = render(<CreatorTierBenefitsCard totalEarnings={20} tier="bronze" />);
    expect(screen.getByText('Bronze Tier')).toBeInTheDocument();

    rerender(<CreatorTierBenefitsCard totalEarnings={600} tier="gold" />);
    expect(screen.getByText('Gold Tier')).toBeInTheDocument();
    expect(screen.getByText('Current Benefits (Gold)')).toBeInTheDocument();
    expect(screen.getByText(/Next Tier: Platinum/i)).toBeInTheDocument();
    expect(screen.getByText('0% platform commission fee bonus')).toBeInTheDocument();
  });

  it('renders top tier state when creator reaches platinum', () => {
    render(<CreatorTierBenefitsCard totalEarnings={2500} tier="platinum" />);

    expect(screen.getByText('Platinum Tier')).toBeInTheDocument();
    expect(screen.getByText('Top Tier Achieved!')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
