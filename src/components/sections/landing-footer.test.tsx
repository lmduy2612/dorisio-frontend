import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingFooter } from './landing-footer';

describe('LandingFooter Component (#178)', () => {
  it('renders all footer navigation sections and links', () => {
    render(<LandingFooter />);

    expect(screen.getByText('For Creators')).toBeInTheDocument();
    expect(screen.getByText('For Supporters')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('API Docs')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('ensures all footer links have WCAG AA compliant contrast color (#334155)', () => {
    const { container } = render(<LandingFooter />);
    const links = container.querySelectorAll('a');

    expect(links.length).toBeGreaterThan(10);
    links.forEach((link) => {
      // #334155 achieves 9.6:1 contrast ratio against #ffffff, exceeding 4.5:1 WCAG AA
      expect(link).toHaveStyle({ color: '#334155' });
    });
  });

  it('preserves non-link text styling and copyright info', () => {
    render(<LandingFooter />);
    const copyright = screen.getByText(/All rights reserved/i);
    expect(copyright).toBeInTheDocument();
    expect(copyright).toHaveStyle({ color: '#64748b' });
  });
});
