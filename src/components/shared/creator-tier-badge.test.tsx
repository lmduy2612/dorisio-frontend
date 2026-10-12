import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CreatorTierBadge } from './creator-tier-badge';

describe('CreatorTierBadge', () => {
  it('renders bronze tier badge with status role and icon', () => {
    render(<CreatorTierBadge tier="bronze" />);
    const badge = screen.getByRole('status', { name: 'Bronze creator tier' });
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('data-creator-tier', 'bronze');
    expect(screen.getByText('Bronze Tier')).toBeInTheDocument();
  });

  it('renders silver, gold, and platinum badges correctly', () => {
    const { rerender } = render(<CreatorTierBadge tier="silver" />);
    expect(screen.getByRole('status', { name: 'Silver creator tier' })).toBeInTheDocument();

    rerender(<CreatorTierBadge tier="gold" />);
    expect(screen.getByRole('status', { name: 'Gold creator tier' })).toBeInTheDocument();

    rerender(<CreatorTierBadge tier="platinum" />);
    expect(screen.getByRole('status', { name: 'Platinum creator tier' })).toBeInTheDocument();
  });

  it('hides text label when showLabel is false', () => {
    render(<CreatorTierBadge tier="gold" showLabel={false} />);
    expect(screen.queryByText('Gold Tier')).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Gold creator tier' })).toBeInTheDocument();
  });
});
