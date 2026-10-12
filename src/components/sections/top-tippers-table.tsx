/**
 * Top Tippers Table
 * Lists a creator's top supporters sorted by total tip amount.
 */

import type { TopTipper } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';

export interface TopTippersTableProps {
  data: TopTipper[];
}

export function TopTippersTable({ data }: TopTippersTableProps): JSX.Element {
  const safeData = Array.isArray(data)
    ? data.filter((item): item is TopTipper => Boolean(item && typeof item === 'object'))
    : [];

  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No tippers for this period
      </div>
    );
  }

  const sorted = [...safeData].sort((a, b) => (b.totalAmount ?? 0) - (a.totalAmount ?? 0));

  return (
    <div className="border rounded-lg overflow-x-auto w-full" data-testid="top-tippers-table">
      <table className="w-full text-sm min-w-full divide-y divide-border">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th scope="col" className="px-3 py-3 text-left font-semibold text-xs sm:text-sm w-12">
              Rank
            </th>
            <th scope="col" className="px-3 py-3 text-left font-semibold text-xs sm:text-sm">
              Tipper
            </th>
            <th scope="col" className="px-3 py-3 text-left font-semibold text-xs sm:text-sm whitespace-nowrap">
              Total Tipped
            </th>
            <th scope="col" className="hidden md:table-cell px-3 py-3 text-left font-semibold text-xs sm:text-sm">
              Tips
            </th>
            <th scope="col" className="hidden md:table-cell px-3 py-3 text-left font-semibold text-xs sm:text-sm">
              Last Tip
            </th>
            <th scope="col" className="hidden md:table-cell px-3 py-3 text-left font-semibold text-xs sm:text-sm">
              Latest Message
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((tipper, index) => (
            <tr key={tipper.id || String(index)} className="hover:bg-muted/30 transition">
              <td className="px-3 py-3 text-muted-foreground text-xs sm:text-sm font-medium w-12">
                #{index + 1}
              </td>
              <td className="px-3 py-3 font-medium text-xs sm:text-sm">
                {tipper.name ?? 'Anonymous Tipper'}
              </td>
              <td className="px-3 py-3 text-xs sm:text-sm">
                <span className="font-semibold text-primary">{formatCurrency(tipper.totalAmount ?? 0)}</span>
                {/* Mobile stacked secondary details (< 768px viewports) */}
                <div className="md:hidden text-[11px] text-muted-foreground mt-0.5 space-x-1">
                  <span>{tipper.tipCount ?? 0} tips</span>
                  {tipper.lastTipAt && (
                    <span>• {formatDate(tipper.lastTipAt)}</span>
                  )}
                </div>
                {tipper.latestMessage && (
                  <div className="md:hidden text-[11px] text-muted-foreground italic truncate max-w-[160px] mt-0.5">
                    &ldquo;{tipper.latestMessage}&rdquo;
                  </div>
                )}
              </td>
              <td className="hidden md:table-cell px-3 py-3 text-xs sm:text-sm">
                {tipper.tipCount ?? 0}
              </td>
              <td className="hidden md:table-cell px-3 py-3 text-muted-foreground text-xs sm:text-sm">
                {tipper.lastTipAt ? formatDate(tipper.lastTipAt) : 'N/A'}
              </td>
              <td className="hidden md:table-cell px-3 py-3 text-sm text-muted-foreground max-w-xs truncate">
                {tipper.latestMessage ? tipper.latestMessage : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
