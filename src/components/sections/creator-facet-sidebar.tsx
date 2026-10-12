'use client';

import type { CreatorSearchFilters, CreatorSortOption } from '@/hooks/use-creator-infinite-scroll';

export interface CreatorFacetSidebarProps {
  filters: CreatorSearchFilters;
  categories: string[];
  resultCount: number;
  onChange: <K extends keyof CreatorSearchFilters>(key: K, value: CreatorSearchFilters[K]) => void;
  onReset: () => void;
}

export function CreatorFacetSidebar({
  filters,
  categories,
  resultCount,
  onChange,
  onReset,
}: CreatorFacetSidebarProps): JSX.Element {
  return (
    <aside aria-label="Creator filters" className="w-full space-y-4 rounded-lg border p-4 lg:w-64">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">Filter creators</h2>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {resultCount} results
        </span>
      </div>

      <div>
        <label htmlFor="sidebar-category" className="block text-xs font-medium text-muted-foreground">
          Category
        </label>
        <select
          id="sidebar-category"
          aria-label="Category"
          className="mt-1 w-full rounded border px-2 py-1.5 text-sm bg-background"
          value={(filters as CreatorSearchFilters & { category?: string }).category || ''}
          onChange={(event) => onChange('category', event.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            aria-label="Verified creators only"
            checked={filters.verifiedOnly}
            onChange={(event) => onChange('verifiedOnly', event.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          <span>Verified creators</span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="sidebar-min-earnings" className="text-xs font-medium text-muted-foreground">
            Min earnings
          </label>
          <input
            id="sidebar-min-earnings"
            aria-label="Min earnings"
            type="number"
            min="0"
            value={filters.minEarnings}
            onChange={(event) => onChange('minEarnings', event.target.value)}
            className="mt-1 w-full rounded border px-2 py-1.5 text-xs bg-background"
          />
        </div>
        <div>
          <label htmlFor="sidebar-max-earnings" className="text-xs font-medium text-muted-foreground">
            Max earnings
          </label>
          <input
            id="sidebar-max-earnings"
            aria-label="Max earnings"
            type="number"
            min="0"
            value={filters.maxEarnings}
            onChange={(event) => onChange('maxEarnings', event.target.value)}
            className="mt-1 w-full rounded border px-2 py-1.5 text-xs bg-background"
          />
        </div>
      </div>

      <div>
        <label htmlFor="sidebar-sort" className="block text-xs font-medium text-muted-foreground">
          Sort by
        </label>
        <select
          id="sidebar-sort"
          aria-label="Sort by"
          className="mt-1 w-full rounded border px-2 py-1.5 text-sm bg-background"
          value={filters.sort}
          onChange={(event) => onChange('sort', event.target.value as CreatorSortOption)}
        >
          <option value="trending">Trending</option>
          <option value="newest">Newest</option>
          <option value="alphabetical">Alphabetical</option>
          <option value="earnings">Earnings</option>
        </select>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="w-full rounded border px-3 py-2 text-sm hover:bg-muted transition"
      >
        Clear filters
      </button>
    </aside>
  );
}
