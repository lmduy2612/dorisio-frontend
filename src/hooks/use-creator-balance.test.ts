import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCreatorBalance } from './use-creator-balance';
import { useCreatorBalance as useCreatorBalanceSdk } from 'dorisio-sdk/react';

// Mock useQuery from react-query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn((options) => {
    // Simulate successful query
    if (options.enabled !== false) {
      return {
        data: {
          totalEarnings: 1000,
          availableBalance: 500,
          pendingBalance: 500,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      };
    }
    return {
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    };
  }),
}));

// Mock the Dorisio SDK
vi.mock('dorisio-sdk/react', () => ({
  useCreatorBalance: vi.fn((creatorId?: string) => ({
    balance: creatorId ? { totalEarnings: 1000, pendingBalance: 500 } : undefined,
    loading: false,
    error: undefined,
    fetchBalance: vi.fn(),
    refetch: vi.fn(),
    reset: vi.fn(),
  })),
  useDorisio: vi.fn(() => ({
    client: {
      getCreatorBalance: vi.fn(),
    },
  })),
}));

describe('useCreatorBalance Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns balance data when creator ID is provided', () => {
    const { result } = renderHook(() => useCreatorBalance('creator-123'));

    expect(result.current.balance).toBeDefined();
    expect(result.current.balance?.totalEarnings).toBe(1000);
    expect(result.current.balance?.availableBalance).toBe(500);
    expect(result.current.balance?.pendingBalance).toBe(500);
  });

  it('returns null balance when creator ID is not provided', () => {
    const { result } = renderHook(() => useCreatorBalance(undefined));

    expect(result.current.balance).toBeNull();
  });

  it('provides loading state', () => {
    const { result } = renderHook(() => useCreatorBalance('creator-123'));

    expect(typeof result.current.loading).toBe('boolean');
  });

  it('provides error state', () => {
    const { result } = renderHook(() => useCreatorBalance('creator-123'));

    expect(result.current.error === undefined || typeof result.current.error === 'string').toBe(
      true
    );
  });

  it('provides refetch and retry functions', () => {
    const { result } = renderHook(() => useCreatorBalance('creator-123'));

    expect(typeof result.current.refetch).toBe('function');
    expect(typeof result.current.retry).toBe('function');
  });

  it('retries transient failures on manual retry or fetchBalance', async () => {
    const mockFetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('503 Service Unavailable'))
      .mockResolvedValueOnce({ totalEarnings: 2000, pendingBalance: 100 });

    vi.mocked(useCreatorBalanceSdk).mockReturnValue({
      balance: undefined,
      loading: false,
      error: undefined,
      fetchBalance: mockFetch,
      refetch: vi.fn(),
      reset: vi.fn(),
    });

    const { result } = renderHook(() =>
      useCreatorBalance('creator-123', { initialDelayMs: 1, maxRetries: 2 })
    );

    const balance = await result.current.fetchBalance();
    expect(balance.totalEarnings).toBe(2000);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('does not retry 4xx client errors', async () => {
    const mockFetch = vi.fn().mockRejectedValue({ status: 404, message: 'Creator not found' });

    vi.mocked(useCreatorBalanceSdk).mockReturnValue({
      balance: undefined,
      loading: false,
      error: undefined,
      fetchBalance: mockFetch,
      refetch: vi.fn(),
      reset: vi.fn(),
    });

    const { result } = renderHook(() =>
      useCreatorBalance('creator-123', { initialDelayMs: 1, maxRetries: 3 })
    );

    await expect(result.current.fetchBalance()).rejects.toEqual({
      status: 404,
      message: 'Creator not found',
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
