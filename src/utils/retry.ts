/**
 * Retry Utility with Exponential Backoff
 * Handles transient failures (network timeouts, 5xx server errors)
 * while bypassing client errors (4xx, validation failures).
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
}

export function isTransientError(error: unknown): boolean {
  if (!error) return false;

  // Check HTTP status code
  const status =
    (error as any)?.status ||
    (error as any)?.statusCode ||
    (error as any)?.response?.status;

  if (typeof status === 'number') {
    // 4xx errors (client errors/validation) are permanent failures - DO NOT RETRY
    if (status >= 400 && status < 500) {
      return false;
    }
    // 5xx errors (server errors) are transient - RETRY
    if (status >= 500) {
      return true;
    }
  }

  const message = (error as any)?.message?.toLowerCase?.() || String(error).toLowerCase();
  const code = (error as any)?.code?.toLowerCase?.() || '';

  // Specific permanent failure checks: 4xx, validation, invalid input, unauthorized
  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('not found') ||
    message.includes('bad request') ||
    message.includes('400') ||
    message.includes('401') ||
    message.includes('403') ||
    message.includes('404') ||
    message.includes('422') ||
    code.includes('validation') ||
    code.includes('auth') ||
    code === 'err_bad_request'
  ) {
    return false;
  }

  // Transient failure indicators: network error, timeout, server 5xx
  if (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('failed to fetch') ||
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504') ||
    message.includes('server error') ||
    code.includes('timeout') ||
    code.includes('network') ||
    code === 'econnreset'
  ) {
    return true;
  }

  // Generic errors without 4xx signatures are assumed transient in network environments
  return true;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 1000;
  const backoffFactor = options.backoffFactor ?? 2;
  const shouldRetry = options.shouldRetry ?? isTransientError;

  let attempt = 0;
  let delay = initialDelayMs;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt > maxRetries || !shouldRetry(error)) {
        throw error;
      }
      options.onRetry?.(attempt, error, delay);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= backoffFactor;
    }
  }
}
