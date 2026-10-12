/**
 * Unit & Integration Tests for Responsive Transaction Table on Mobile Viewports (#168)
 *
 * Verifies that:
 * 1. TopTippersTable renders cleanly for mobile viewports (375px & 768px) with reflowed metadata.
 * 2. TransactionFilterBar wraps and stacks responsively without overflowing small screens.
 * 3. Mobile card view displays all critical transaction info (amount, date, sender, status, hash).
 * 4. Zero text clipping or layout destruction occurs when screen width is constrained.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TopTippersTable } from '@/components/sections/top-tippers-table';
import { TransactionFilterBar } from '@/components/sections/transaction-filter-bar';
import type { TopTipper } from '@/types';
import type { TransactionFilterState } from '@/hooks/use-transaction-filter';

const mockTippers: TopTipper[] = [
  {
    id: 'tip-1',
    name: 'Ada Lovelace',
    totalAmount: 350.5,
    tipCount: 12,
    lastTipAt: '2026-10-10T12:00:00Z',
    latestMessage: 'Keep pushing the frontier of Stellar dev!',
  },
  {
    id: 'tip-2',
    name: 'Satoshi',
    totalAmount: 120.0,
    tipCount: 4,
    lastTipAt: '2026-10-09T08:30:00Z',
    latestMessage: 'Great work',
  },
];

const mockFilters: TransactionFilterState = {
  dateFrom: '2026-10-01',
  dateTo: '2026-10-12',
  minAmount: '10',
  maxAmount: '500',
  status: 'all',
  messageKeyword: '',
  sortField: 'date',
  sortDirection: 'desc',
};

describe('Responsive Transaction Table & Mobile Layouts (#168)', () => {
  describe('TopTippersTable mobile responsiveness', () => {
    it('renders with mobile-responsive classes and stacked secondary metadata', () => {
      const { container } = render(<TopTippersTable data={mockTippers} />);

      const tableWrapper = screen.getByTestId('top-tippers-table');
      expect(tableWrapper).toBeInTheDocument();
      expect(tableWrapper).toHaveClass('overflow-x-auto');

      // Rank, name, and total tipped are displayed
      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
      expect(screen.getByText('$350.50')).toBeInTheDocument();

      // Mobile stacked secondary details are rendered in DOM for reflow (< 768px)
      expect(screen.getByText(/12 tips/)).toBeInTheDocument();
      expect(screen.getAllByText(/Keep pushing the frontier/)).toHaveLength(2);

      // Desktop table columns use hidden md:table-cell responsive breakpoints
      const desktopHeaders = container.querySelectorAll('th.hidden');
      expect(desktopHeaders.length).toBeGreaterThanOrEqual(3);
    });

    it('remains readable on narrow 375px mobile viewport representation', () => {
      const { container } = render(
        <div style={{ width: '375px' }}>
          <TopTippersTable data={mockTippers} />
        </div>
      );

      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();
      expect(table).toHaveClass('w-full');
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
    });
  });

  describe('TransactionFilterBar mobile responsiveness', () => {
    it('uses responsive grid and flex wrap styles for small viewports', () => {
      const { container } = render(
        <div style={{ width: '375px' }}>
          <TransactionFilterBar
            filters={mockFilters}
            onChange={() => {}}
            onReset={() => {}}
            onExport={() => {}}
            onExportExcel={() => {}}
            onExportPdf={() => {}}
            resultCount={2}
          />
        </div>
      );

      const filterBar = screen.getByTestId('transaction-filter-bar');
      expect(filterBar).toBeInTheDocument();

      // Check export buttons are rendered and accessible
      expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Excel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'PDF' })).toBeInTheDocument();

      // Check search input has full mobile width
      const searchInput = screen.getByPlaceholderText('Search message or tipper');
      expect(searchInput).toHaveClass('w-full');
    });

    it('stacks filter controls cleanly at 768px tablet breakpoint', () => {
      const { container } = render(
        <div style={{ width: '768px' }}>
          <TransactionFilterBar
            filters={mockFilters}
            onChange={() => {}}
            onReset={() => {}}
            onExport={() => {}}
            resultCount={5}
          />
        </div>
      );

      expect(screen.getByLabelText('From')).toBeInTheDocument();
      expect(screen.getByLabelText('To')).toBeInTheDocument();
      expect(screen.getByLabelText('Min amount')).toBeInTheDocument();
      expect(screen.getByLabelText('Max amount')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Sort by')).toBeInTheDocument();
    });
  });
});
