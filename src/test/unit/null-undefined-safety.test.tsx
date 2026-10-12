/**
 * Unit Tests for Null / Undefined Safety in Component Rendering (#169)
 *
 * Verifies defensive handling of missing, null, undefined, and malformed
 * API response payloads across data-rendering components:
 * 1. CreatorPortfolio
 * 2. EarningsTrendChart
 * 3. TopTippersTable
 * 4. ActivityFeed
 * 5. CreatorLiveStreamSection
 * 6. SupporterLeaderboard
 * 7. TipSourceBreakdown
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CreatorPortfolio } from '@/components/sections/creator-portfolio';
import { EarningsTrendChart } from '@/components/sections/earnings-trend-chart';
import { TopTippersTable } from '@/components/sections/top-tippers-table';
import { ActivityFeed } from '@/components/sections/activity-feed';
import { CreatorLiveStreamSection } from '@/components/sections/creator-live-stream';
import { SupporterLeaderboard } from '@/components/sections/supporter-leaderboard';
import { TipSourceBreakdown } from '@/components/sections/tip-source-breakdown';

describe('Null/Undefined Safety in Component Rendering (#169)', () => {
  describe('CreatorPortfolio', () => {
    it('handles undefined and null mediaItems and externalLinks gracefully', () => {
      // @ts-expect-error Testing undefined/null API responses
      const { container } = render(<CreatorPortfolio mediaItems={null} externalLinks={undefined} />);
      expect(container).toBeInTheDocument();
      expect(screen.getByText('No portfolio items yet')).toBeInTheDocument();
    });

    it('handles incomplete or malformed media and link items with fallbacks', () => {
      const incompleteMedia = [
        // @ts-expect-error Incomplete media payload
        { id: 'm1', type: 'image', url: null, title: undefined },
        // @ts-expect-error Incomplete link payload
        { id: 'm2', type: 'link', url: '', title: null, description: null },
      ];
      const incompleteLinks = [
        // @ts-expect-error Incomplete external link
        { id: 'l1', url: null, title: undefined },
      ];

      render(
        <CreatorPortfolio
          // @ts-expect-error testing defensive rendering
          mediaItems={incompleteMedia}
          // @ts-expect-error testing defensive rendering
          externalLinks={incompleteLinks}
        />
      );

      // Should render without throwing errors and use appropriate fallback text
      expect(screen.getByText('Portfolio')).toBeInTheDocument();
      expect(screen.getByText('Links')).toBeInTheDocument();
      expect(screen.getByText('External Link')).toBeInTheDocument();
      expect(screen.getByText('Link')).toBeInTheDocument();
    });
  });

  describe('EarningsTrendChart', () => {
    it('handles null, undefined, or empty data array with fallback UI', () => {
      // @ts-expect-error Testing null API payload
      const { rerender } = render(<EarningsTrendChart data={null} />);
      expect(screen.getByText('No earnings data for this period')).toBeInTheDocument();

      // @ts-expect-error Testing undefined API payload
      rerender(<EarningsTrendChart data={undefined} />);
      expect(screen.getByText('No earnings data for this period')).toBeInTheDocument();

      rerender(<EarningsTrendChart data={[]} />);
      expect(screen.getByText('No earnings data for this period')).toBeInTheDocument();
    });

    it('handles array containing null/undefined or incomplete point items without crashing', () => {
      const incompletePoints = [
        // @ts-expect-error Incomplete data point
        { date: null, amount: undefined },
        // @ts-expect-error Partial data point
        { date: '2026-10-01', amount: null },
      ];

      // @ts-expect-error Testing defensive mapping
      const { container } = render(<EarningsTrendChart data={incompletePoints} />);
      expect(container).toBeInTheDocument();
      expect(screen.getByTestId('earnings-trend-chart')).toBeInTheDocument();
    });
  });

  describe('TopTippersTable', () => {
    it('handles null and undefined data props with fallback UI', () => {
      // @ts-expect-error Testing null prop
      const { rerender } = render(<TopTippersTable data={null} />);
      expect(screen.getByText('No tippers for this period')).toBeInTheDocument();

      // @ts-expect-error Testing undefined prop
      rerender(<TopTippersTable data={undefined} />);
      expect(screen.getByText('No tippers for this period')).toBeInTheDocument();
    });

    it('renders fallback placeholders for missing tipper fields instead of undefined', () => {
      const incompleteTippers = [
        // @ts-expect-error Incomplete tipper
        {
          id: 't-1',
          name: undefined,
          totalAmount: null,
          tipCount: undefined,
          lastTipAt: null,
          latestMessage: undefined,
        },
      ];

      // @ts-expect-error Testing defensive rendering
      render(<TopTippersTable data={incompleteTippers} />);

      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('Anonymous Tipper')).toBeInTheDocument();
      expect(screen.getByText('$0.00')).toBeInTheDocument();
      expect(screen.getByText('N/A')).toBeInTheDocument();
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('ActivityFeed', () => {
    it('handles null or undefined items array gracefully', () => {
      // @ts-expect-error Testing null items
      const { rerender } = render(<ActivityFeed items={null} />);
      expect(screen.getByText('No recent activity')).toBeInTheDocument();

      // @ts-expect-error Testing undefined items
      rerender(<ActivityFeed items={undefined} />);
      expect(screen.getByText('No recent activity')).toBeInTheDocument();
    });

    it('safely renders items with missing titles, creator names, or unexpected types', () => {
      const incompleteItems = [
        // @ts-expect-error Incomplete activity item
        {
          id: 'item-1',
          type: 'unknown-type',
          creatorName: null,
          title: undefined,
          amount: null,
          createdAt: null,
        },
      ];

      // @ts-expect-error Testing defensive rendering
      render(<ActivityFeed items={incompleteItems} />);

      expect(screen.getByText('Unknown Creator')).toBeInTheDocument();
      expect(screen.getByText('Activity update')).toBeInTheDocument();
      expect(screen.getAllByText('N/A')).toHaveLength(2);
    });
  });

  describe('CreatorLiveStreamSection', () => {
    it('handles null or undefined stream object with fallback UI', () => {
      // @ts-expect-error Testing null stream prop
      const { rerender } = render(<CreatorLiveStreamSection stream={null} />);
      expect(screen.getByText('No live stream information available.')).toBeInTheDocument();

      // @ts-expect-error Testing undefined stream prop
      rerender(<CreatorLiveStreamSection stream={undefined} />);
      expect(screen.getByText('No live stream information available.')).toBeInTheDocument();
    });

    it('handles incomplete stream details without crashing or displaying invalid URLs', () => {
      // @ts-expect-error Incomplete stream payload
      const incompleteStream = {
        platform: 'twitch',
        channelUrl: null,
        isLive: false,
        viewerCount: null,
      };

      // @ts-expect-error Testing defensive rendering
      render(<CreatorLiveStreamSection stream={incompleteStream} />);

      expect(screen.getByText('OFFLINE')).toBeInTheDocument();
      expect(screen.getByText('This creator is not streaming right now.')).toBeInTheDocument();
    });
  });

  describe('SupporterLeaderboard', () => {
    it('handles null or undefined entries array gracefully', () => {
      // @ts-expect-error Testing null entries
      const { rerender } = render(<SupporterLeaderboard entries={null} />);
      expect(screen.getByText('No supporters to rank yet')).toBeInTheDocument();

      // @ts-expect-error Testing undefined entries
      rerender(<SupporterLeaderboard entries={undefined} />);
      expect(screen.getByText('No supporters to rank yet')).toBeInTheDocument();
    });

    it('renders fallback values when supporter names and amounts are missing', () => {
      const incompleteEntries = [
        // @ts-expect-error Incomplete entry
        {
          id: 'supp-1',
          name: null,
          totalAmount: undefined,
          tipCount: null,
        },
      ];

      // @ts-expect-error Testing defensive rendering
      render(<SupporterLeaderboard entries={incompleteEntries} />);

      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('Anonymous Supporter')).toBeInTheDocument();
      expect(screen.getByText('0 tips')).toBeInTheDocument();
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });
  });

  describe('TipSourceBreakdown', () => {
    it('handles null, undefined, or empty data array with fallback UI', () => {
      // @ts-expect-error Testing null data
      const { rerender } = render(<TipSourceBreakdown data={null} />);
      expect(screen.getByText('No tips for this period')).toBeInTheDocument();

      // @ts-expect-error Testing undefined data
      rerender(<TipSourceBreakdown data={undefined} />);
      expect(screen.getByText('No tips for this period')).toBeInTheDocument();
    });

    it('handles entries with missing source labels or invalid amounts', () => {
      const incompleteEntries = [
        // @ts-expect-error Incomplete entry
        { source: null, amount: 25 },
        // @ts-expect-error Entry with NaN or null amount
        { source: 'Direct', amount: null },
      ];

      // @ts-expect-error Testing defensive rendering
      const { container } = render(<TipSourceBreakdown data={incompleteEntries} />);
      expect(container).toBeInTheDocument();
      expect(screen.getByTestId('tip-source-breakdown-chart')).toBeInTheDocument();
    });
  });
});
