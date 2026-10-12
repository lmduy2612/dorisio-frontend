/**
 * useTransactionHistory Hook
 * Wrapper around SDK's useTransactionHistory hook with exponential backoff retry support.
 */

import { useCallback, useState } from 'react';
import { useTransactionHistory as sdkUseTransactionHistory } from 'dorisio-sdk/react';
import { withRetry, type RetryOptions } from '../utils/retry';

export interface Transaction {
  id: string;
  creatorId?: string;
  senderId?: string;
  senderUsername?: string;
  amount: number;
  message?: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
  transactionHash?: string;
}

interface SDKTransaction {
  id: string;
  creatorId?: string;
  senderId?: string;
  senderUsername?: string;
  amount: number;
  message?: string | null;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
  transactionHash?: string;
}

export interface UseTransactionHistoryOptions extends RetryOptions {
  autoRetry?: boolean;
}

export function useTransactionHistory(
  creatorId: string | null | undefined,
  initialPage = 1,
  initialPageSize = 10,
  options?: UseTransactionHistoryOptions
) {
  const {
    transactions: sdkTransactions,
    total,
    page,
    pageSize,
    loading: sdkLoading,
    error: sdkError,
    fetchHistory: sdkFetchHistory,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    refetch: sdkRefetch,
    reset: sdkReset,
  } = sdkUseTransactionHistory({ page: initialPage, pageSize: initialPageSize });

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  // Map SDK transactions to frontend format
  const transactions: Transaction[] = (sdkTransactions || []).map((t: SDKTransaction) => ({
    id: t.id,
    creatorId: t.creatorId,
    senderId: t.senderId,
    senderUsername: t.senderUsername,
    amount: t.amount,
    message: t.message || undefined,
    status: t.status,
    createdAt: t.createdAt,
    transactionHash: t.transactionHash,
  }));

  const fetchTransactionsWithRetry = useCallback(async () => {
    setIsRetrying(true);
    setRetryError(null);
    try {
      const result = await withRetry(
        () => sdkFetchHistory(),
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
      const errMsg = err?.message || 'Failed to fetch transactions';
      setRetryError(errMsg);
      throw err;
    }
  }, [sdkFetchHistory, options]);

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
        const errMsg = err?.message || 'Failed to refetch transactions';
        setRetryError(errMsg);
        throw err;
      }
    } else {
      return fetchTransactionsWithRetry();
    }
  }, [sdkRefetch, fetchTransactionsWithRetry, options]);

  const reset = useCallback(() => {
    setRetryError(null);
    setIsRetrying(false);
    sdkReset?.();
  }, [sdkReset]);

  return {
    transactions,
    total,
    page,
    pageSize,
    loading: sdkLoading || isRetrying,
    error: retryError ?? sdkError,
    fetchTransactions: fetchTransactionsWithRetry,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    refetch: retry,
    retry,
    reset,
  };
}
