import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { CreatorDiscoveryPageContent } from './page';
import { useCreatorInfiniteScroll } from '@/hooks/use-creator-infinite-scroll';
import type { Creator } from '@/types';

vi.mock('@/hooks/use-creator-infinite-scroll', () => ({
  useCreatorInfiniteScroll: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/components/sections/dorisio-button', () => ({
  default: ({ creatorId, className }: { creatorId: string; className?: string }) => (
    <button
      type="button"
      data-creator-id={creatorId}
      aria-label={`Send tip to creator ${creatorId}`}
      className={className}
    >
      Tip
    </button>
  ),
}));

const mockCreators: Creator[] = [
  {
    id: 'creator-1',
    userId: 'user-1',
    username: 'alice',
    displayName: 'Alice Cooper',
    bio: 'Digital artist & illustrator',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    verified: true,
    verificationStatus: 'verified',
    isPublic: true,
    totalEarnings: 2450.5,
    pendingBalance: 120,
    createdAt: '2026-01-01T00:00:00.000Z',
    category: 'Art',
  },
  {
    id: 'creator-2',
    userId: 'user-2',
    username: 'bob',
    displayName: 'Bob Builder',
    bio: 'Software engineer building web3 tools',
    avatar: '',
    verified: false,
    isPublic: true,
    totalEarnings: 1800,
    pendingBalance: 50,
    createdAt: '2026-01-05T00:00:00.000Z',
    category: 'Tech',
  },
];

describe('Creator Discovery Page Accessibility (a11y)', () => {
  const mockSetFilter = vi.fn();
  const mockResetFilters = vi.fn();
  const mockFetchNextPage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCreatorInfiniteScroll).mockReturnValue({
      filters: {
        category: '',
        search: '',
        verifiedOnly: false,
        minEarnings: '',
        maxEarnings: '',
        sort: 'trending',
      },
      setFilter: mockSetFilter,
      resetFilters: mockResetFilters,
      creators: mockCreators,
      hasNextPage: true,
      isFetchingNextPage: false,
      isLoading: false,
      error: null,
      fetchNextPage: mockFetchNextPage,
    });
  });

  describe('WCAG AA / Axe automated scan', () => {
    it('passes axe accessibility scan with no violations', async () => {
      const { container } = render(<CreatorDiscoveryPageContent />);

      const results = await axe.run(container, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
        },
        rules: {
          // Color contrast is verified in browser/playwright as JSDOM/HappyDOM lacks layout engine
          'color-contrast': { enabled: false },
        },
      });

      expect(results.violations).toEqual([]);
    });
  });

  describe('Keyboard navigation end-to-end', () => {
    it('allows sequential keyboard tab navigation through search, filters, creators, and pagination', async () => {
      const user = userEvent.setup();
      render(<CreatorDiscoveryPageContent />);

      // Search input should be focusable
      const searchInput = screen.getByLabelText('Search creators');
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);

      // Tab to Verified Only checkbox
      await user.tab();
      expect(document.activeElement).toBe(screen.getByRole('checkbox', { name: /verified only/i }));

      // Tab to Min earnings input in search bar
      await user.tab();
      expect(document.activeElement).toBe(screen.getAllByLabelText('Min earnings')[0]);

      // Tab to Max earnings input in search bar
      await user.tab();
      expect(document.activeElement).toBe(screen.getAllByLabelText('Max earnings')[0]);

      // Tab to Sort by in search bar
      await user.tab();
      expect(document.activeElement).toBe(screen.getAllByLabelText('Sort by')[0]);

      // Tab to Reset button in search bar
      await user.tab();
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Reset' }));

      // Tab into CreatorFacetSidebar controls
      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText('Category'));

      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText('Verified creators only'));

      await user.tab();
      expect(document.activeElement).toBe(screen.getAllByLabelText('Min earnings')[1]);

      await user.tab();
      expect(document.activeElement).toBe(screen.getAllByLabelText('Max earnings')[1]);

      await user.tab();
      expect(document.activeElement).toBe(screen.getAllByLabelText('Sort by')[1]);

      await user.tab();
      expect(document.activeElement).toBe(screen.getByRole('button', { name: /clear filters/i }));

      // Tab into creator cards: Profile Link then Verification Badge (if verified) then Tip button
      await user.tab();
      expect(document.activeElement).toBe(
        screen.getByRole('link', { name: "View Alice Cooper's profile" })
      );

      // Tab to Alice's verification badge (accessible tooltip trigger)
      await user.tab();
      expect(document.activeElement).toHaveAttribute('aria-label', 'Verified status');

      // Tab to Alice tip button
      await user.tab();
      expect(document.activeElement).toHaveAttribute('data-creator-id', 'creator-1');

      // Tab to Bob: Profile Link then Tip button (unverified creator has no badge tabstop)
      await user.tab();
      expect(document.activeElement).toBe(
        screen.getByRole('link', { name: "View Bob Builder's profile" })
      );

      await user.tab();
      expect(document.activeElement).toHaveAttribute('data-creator-id', 'creator-2');

      // Tab to pagination
      await user.tab();
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Load more creators' })
      );
    });
  });

  describe('Screen reader compatibility', () => {
    it('announces page title, landmark structure, and creator card semantics', () => {
      render(<CreatorDiscoveryPageContent />);

      // Main landmark and heading
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1, name: 'Discover Creators' })).toBeInTheDocument();

      // Search section landmark
      expect(screen.getByRole('region', { name: 'Search and filter section' })).toBeInTheDocument();

      // Filter sidebar landmark
      expect(screen.getByRole('complementary', { name: 'Creator filters' })).toBeInTheDocument();

      // Creator list section landmark
      expect(screen.getByRole('region', { name: 'Creator list' })).toBeInTheDocument();

      // Screen reader announcements for creator counts
      const resultCounter = screen.getByText('Showing 2 creators');
      expect(resultCounter).toHaveAttribute('aria-live', 'polite');

      // Creator names are proper headings inside article tags
      expect(screen.getByRole('heading', { level: 3, name: 'Alice Cooper' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'Bob Builder' })).toBeInTheDocument();

      // Profile links provide accessible labels with names
      expect(screen.getByLabelText("View Alice Cooper's profile")).toBeInTheDocument();
      expect(screen.getByLabelText("View Bob Builder's profile")).toBeInTheDocument();

      // Avatars have proper alt texts
      expect(screen.getByAltText("Alice Cooper's avatar")).toBeInTheDocument();
    });

    it('provides accessible labels for pagination and loading status', () => {
      render(<CreatorDiscoveryPageContent />);

      const paginationNav = screen.getByRole('navigation', { name: 'Pagination' });
      expect(paginationNav).toBeInTheDocument();

      const loadMoreBtn = screen.getByRole('button', { name: 'Load more creators' });
      expect(loadMoreBtn).toBeInTheDocument();
      expect(loadMoreBtn).toBeEnabled();
    });

    it('announces accessible empty state with clear filters action', () => {
      vi.mocked(useCreatorInfiniteScroll).mockReturnValue({
        filters: {
          category: '',
          search: 'nonexistent',
          verifiedOnly: false,
          minEarnings: '',
          maxEarnings: '',
          sort: 'trending',
        },
        setFilter: mockSetFilter,
        resetFilters: mockResetFilters,
        creators: [],
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
        error: null,
        fetchNextPage: mockFetchNextPage,
      });

      render(<CreatorDiscoveryPageContent />);

      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toBeInTheDocument();
      expect(screen.getByText('No creators found')).toBeInTheDocument();
      const clearButtons = screen.getAllByRole('button', { name: 'Clear filters' });
      expect(clearButtons.length).toBeGreaterThan(0);
    });

    it('announces error state with alert role', () => {
      vi.mocked(useCreatorInfiniteScroll).mockReturnValue({
        filters: {
          category: '',
          search: '',
          verifiedOnly: false,
          minEarnings: '',
          maxEarnings: '',
          sort: 'trending',
        },
        setFilter: mockSetFilter,
        resetFilters: mockResetFilters,
        creators: [],
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
        error: new Error('Network failure loading creators'),
        fetchNextPage: mockFetchNextPage,
      });

      render(<CreatorDiscoveryPageContent />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText('Network failure loading creators')).toBeInTheDocument();
    });
  });
});
