import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry, isTransientError } from './retry';

describe('retry utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('isTransientError', () => {
    it('identifies 5xx server errors and network timeouts as transient', () => {
      expect(isTransientError(new Error('Network timeout'))).toBe(true);
      expect(isTransientError({ status: 500, message: 'Internal Server Error' })).toBe(true);
      expect(isTransientError({ status: 502, message: 'Bad Gateway' })).toBe(true);
      expect(isTransientError({ status: 503, message: 'Service Unavailable' })).toBe(true);
      expect(isTransientError({ message: 'Failed to fetch' })).toBe(true);
    });

    it('identifies 4xx and validation errors as non-transient (permanent)', () => {
      expect(isTransientError({ status: 400, message: 'Bad Request' })).toBe(false);
      expect(isTransientError({ status: 401, message: 'Unauthorized' })).toBe(false);
      expect(isTransientError({ status: 403, message: 'Forbidden' })).toBe(false);
      expect(isTransientError({ status: 404, message: 'Creator not found' })).toBe(false);
      expect(isTransientError(new Error('Validation error: invalid wallet address'))).toBe(false);
    });
  });

  describe('withRetry', () => {
    it('returns result immediately on first successful attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const promise = withRetry(fn);

      await expect(promise).resolves.toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries transient failures up to maxRetries times with exponential backoff', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network timeout 1'))
        .mockRejectedValueOnce(new Error('Network timeout 2'))
        .mockResolvedValue('recovered');

      const onRetry = vi.fn();
      const promise = withRetry(fn, {
        initialDelayMs: 1000,
        backoffFactor: 2,
        onRetry,
      });

      // Advance through first retry (1000ms)
      await vi.advanceTimersByTimeAsync(1000);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error), 1000);

      // Advance through second retry (2000ms)
      await vi.advanceTimersByTimeAsync(2000);
      expect(onRetry).toHaveBeenCalledWith(2, expect.any(Error), 2000);

      const result = await promise;
      expect(result).toBe('recovered');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('fails after exceeding maxRetries (3 attempts)', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Persistent 500 server error'));
      const promise = withRetry(fn, {
        maxRetries: 3,
        initialDelayMs: 1000,
      });

      // Attach catch handler to prevent unhandled rejection during fake timer advance
      let caughtError: Error | null = null;
      promise.catch((err) => {
        caughtError = err;
      });

      // 1st retry: 1000ms
      await vi.advanceTimersByTimeAsync(1000);
      // 2nd retry: 2000ms
      await vi.advanceTimersByTimeAsync(2000);
      // 3rd retry: 4000ms
      await vi.advanceTimersByTimeAsync(4000);

      await expect(promise).rejects.toThrow('Persistent 500 server error');
      expect(fn).toHaveBeenCalledTimes(4); // initial + 3 retries
    });

    it('does NOT retry client errors (4xx or validation failure)', async () => {
      const fn = vi.fn().mockRejectedValue({
        status: 404,
        message: 'Creator not found',
      });

      await expect(withRetry(fn)).rejects.toEqual({
        status: 404,
        message: 'Creator not found',
      });

      expect(fn).toHaveBeenCalledTimes(1); // No retries
    });
  });
});
