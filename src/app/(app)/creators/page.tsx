/**
 * Creator Discovery Page
 * Browse and search creators with infinite scroll
 */

'use client';

import { Suspense } from 'react';
import { useCreatorInfiniteScroll } from '@/hooks/use-creator-infinite-scroll';
import { CreatorSearchBar } from '@/components/sections/creator-search-bar';
import { CreatorFacetSidebar } from '@/components/sections/creator-facet-sidebar';
import { CreatorVerificationBadge } from '@/components/shared/creator-verification-badge';
import { CreatorBio } from '@/components/sections/creator-bio';
import DorisioButton from '@/components/sections/dorisio-button';
import { formatCurrency } from '@/utils/formatters';
import Link from 'next/link';

export default function CreatorDiscoveryPage() {
  return (
    <Suspense fallback={null}>
      <CreatorDiscoveryPageContent />
    </Suspense>
  );
}

export function CreatorDiscoveryPageContent() {
  const {
    filters,
    setFilter,
    resetFilters,
    creators,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    fetchNextPage,
  } = useCreatorInfiniteScroll();

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">Discover Creators</h1>
          <p className="text-xl text-muted-foreground">Support your favorite creators with tips</p>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <section aria-label="Search and filter section" className="mb-6">
          <CreatorSearchBar filters={filters as any} onChange={setFilter as any} onReset={resetFilters} />
        </section>
        <div className="mb-8 flex flex-col gap-6 lg:flex-row">
          <CreatorFacetSidebar
            filters={filters}
            categories={[
              ...new Set(
                creators
                  .map((creator) => creator.category)
                  .filter((category): category is string => Boolean(category))
              ),
            ]}
            resultCount={creators.length}
            onChange={setFilter}
            onReset={resetFilters}
          />
          <section aria-label="Creator list" className="min-w-0 flex-1">
            <h2 className="sr-only">Creator Results</h2>

            {/* Results Count */}
            {creators.length > 0 && (
              <p className="text-muted-foreground mb-6" aria-live="polite">
                Showing {creators.length} creator{creators.length !== 1 ? 's' : ''}
              </p>
            )}

            {/* Error State */}
            {error && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg mb-6"
              >
                <p className="font-medium">{error.message || 'Failed to load creators'}</p>
              </div>
            )}

            {/* Creators Grid */}
            {!isLoading && !error && creators.length > 0 && (
              <div
                role="region"
                aria-label="Creators grid"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {creators.map((creator) => (
                  <article
                    key={creator.id}
                    className="border rounded-lg overflow-hidden hover:shadow-lg transition h-full bg-card flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header Banner */}
                      <div
                        className="h-24 bg-gradient-to-r from-primary/20 to-secondary/20"
                        aria-hidden="true"
                      />

                      {/* Card Content */}
                      <div className="p-6 -mt-8 relative">
                        <Link
                          href={`/creators/${creator.username}`}
                          aria-label={`View ${creator.displayName}'s profile`}
                          className="block group rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        >
                          {/* Avatar */}
                          <div className="mb-4">
                            {creator.avatar ? (
                              <img
                                src={creator.avatar}
                                alt={`${creator.displayName}'s avatar`}
                                className="w-16 h-16 rounded-full object-cover border-4 border-background"
                              />
                            ) : (
                              <div
                                className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-4 border-background"
                                aria-hidden="true"
                              >
                                <span className="text-xl font-bold text-primary">
                                  {creator.displayName?.charAt(0) || '?'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Name and Verification */}
                          <div className="mb-2">
                            <div className="flex flex-wrap items-center gap-2 mb-1 min-w-0">
                              <h3 className="font-bold text-lg min-w-0 break-words group-hover:text-primary transition">
                                {creator.displayName}
                              </h3>
                              <CreatorVerificationBadge
                                verified={creator.verified}
                                status={creator.verificationStatus}
                                verifiedAt={creator.verifiedAt}
                                verificationType={creator.verificationType}
                                verificationReason={creator.verificationReason}
                                compact
                              />
                            </div>
                            <p className="text-sm text-muted-foreground">@{creator.username}</p>
                          </div>
                        </Link>

                        {/* Bio */}
                        {creator.bio && (
                          <CreatorBio
                            value={creator.bio}
                            className="mb-4 line-clamp-2 text-sm text-muted-foreground"
                          />
                        )}

                        {/* Stats */}
                        <div className="bg-muted rounded-lg p-3 mb-4 text-sm">
                          <p className="text-muted-foreground">Total Earnings</p>
                          <p className="font-bold">{formatCurrency(creator.totalEarnings)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Tip Button */}
                    <div className="px-6 pb-6">
                      <DorisioButton
                        creatorId={creator.id}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      />
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Pagination / Infinite Scroll Loading */}
            {!isLoading && !error && hasNextPage && (
              <nav aria-label="Pagination" className="flex items-center justify-center gap-2 mt-8">
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  aria-label="Load more creators"
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-muted transition"
                >
                  {isFetchingNextPage ? 'Loading more creators...' : 'Load more creators'}
                </button>
              </nav>
            )}

            {/* No Results */}
            {!isLoading && !error && creators.length === 0 && (
              <div className="text-center py-12" role="status">
                <p className="text-muted-foreground mb-4">No creators found</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-primary hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
