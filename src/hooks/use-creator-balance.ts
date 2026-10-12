/**
 * useCreatorBalance Hook
 * Wrapper around SDK's useCreatorBalance hook with exponential backoff retry support.
 */

import { useCallback, useState } from 'react';
import { useCreatorBalance as sdkUseCreatorBalance } from 'dorisio-sdk/react';
import { withRetry, type RetryOptions } from '../utils/retry';

export interface CreatorBalance {
  totalEarnings: number;
  pendingBalance: number;
  availableBalance?: number;
}

export interface UseCreatorBalanceOptions extends RetryOptions {
  autoRetry?: boolean;
}

export function useCreatorBalance(
  creatorId: string | null | undefined,
  options?: UseCreatorBalanceOptions
) {
  const {
    balance: sdkBalance,
    loading: sdkLoading,
    error: sdkError,
    fetchBalance: sdkFetchBalance,
    refetch: sdkRefetch,
    reset: sdkReset,
  } = sdkUseCreatorBalance(creatorId || undefined);

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  // Map SDK balance to frontend format
  const balance: CreatorBalance | null = sdkBalance
    ? {
        totalEarnings: sdkBalance.totalEarnings || 0,
        pendingBalance: sdkBalance.pendingBalance || 0,
        availableBalance: (sdkBalance.totalEarnings || 0) - (sdkBalance.pendingBalance || 0),
      }
    : null;

  const fetchBalanceWithRetry = useCallback(
    async (id?: string) => {
      const targetId = id ?? creatorId ?? '';
      setIsRetrying(true);
      setRetryError(null);
      try {
        const result = await withRetry(
          () => sdkFetchBalance(targetId),
          {
            maxRetries: options?.maxRetries ?? 3,
            initialDelayMs: options?.initialDelayMs ?? 1000,
            backoffFactor: options?.backoffFactor ?? 2,
            shouldRetry: options?.shouldRetry,
            onRetry: options?.onRetry,
          }
        );
        setIsRetrying(false);
        return result;
      } catch (err: any) {
        setIsRetrying(false);
        const errMsg = err?.message || 'Failed to fetch creator balance';
        setRetryError(errMsg);
        throw err;
      }
    },
    [creatorId, sdkFetchBalance, options]
  );

  const retry = useCallback(async () => {
    if (sdkRefetch) {
      setIsRetrying(true);
      setRetryError(null);
      try {
        await withRetry(
          () => sdkRefetch(),
          {
            maxRetries: options?.maxRetries ?? 3,
            initialDelayMs: options?.initialDelayMs ?? 1000,
            backoffFactor: options?.backoffFactor ?? 2,
            shouldRetry: options?.shouldRetry,
            onRetry: options?.onRetry,
          }
        );
        setIsRetrying(false);
      } catch (err: any) {
        setIsRetrying(false);
        const errMsg = err?.message || 'Failed to refetch creator balance';
        setRetryError(errMsg);
        throw err;
      }
    } else {
      return fetchBalanceWithRetry();
    }
  }, [sdkRefetch, fetchBalanceWithRetry, options]);

  const reset = useCallback(() => {
    setRetryError(null);
    setIsRetrying(false);
    sdkReset?.();
  }, [sdkReset]);

  return {
    balance,
    loading: sdkLoading || isRetrying,
    error: retryError ?? sdkError,
    fetchBalance: fetchBalanceWithRetry,
    refetch: retry,
    retry,
    reset,
  };
}
