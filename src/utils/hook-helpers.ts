/**
 * Hook Helpers & Common Error Handling Utilities
 *
 * Provides shared error extraction, classification, and user-facing message mapping
 * across data-fetching and action hooks.
 */

/**
 * Safely extracts a readable error message from any caught error value.
 */
export function normalizeErrorMessage(
  err: unknown,
  fallbackMessage = 'An unexpected error occurred. Please try again.',
  strictInstance = false
): string {
  if (!err) return fallbackMessage;

  if (err instanceof Error && err.message) {
    return err.message;
  }

  if (strictInstance) {
    return fallbackMessage;
  }

  if (typeof err === 'object') {
    const msg = (err as any).message || (err as any).error;
    if (typeof msg === 'string' && msg.trim()) {
      return msg.trim();
    }
  }

  if (typeof err === 'string' && err.trim()) {
    return err.trim();
  }

  return fallbackMessage;
}

/**
 * Extracts error code or HTTP status code from an error object.
 */
export function extractErrorCode(err: unknown): string {
  if (!err || typeof err !== 'object') return '';

  const rawCode =
    (err as any).code ||
    (err as any).status ||
    (err as any).statusCode ||
    (err as any).response?.status ||
    '';

  return String(rawCode).toUpperCase().trim();
}

/**
 * Maps API / network / SDK error codes and patterns to user-friendly messages.
 */
export function mapApiError(
  err: unknown,
  fallbackMessage = 'An unexpected error occurred. Please try again.'
): string {
  if (!err) return fallbackMessage;

  const code = extractErrorCode(err);
  const rawMessage = normalizeErrorMessage(err, '');
  const lowerMsg = rawMessage.toLowerCase();

  // Common HTTP status codes & SDK codes
  if (code === 'UNAUTHORIZED' || code === '401' || lowerMsg.includes('unauthorized') || lowerMsg.includes('401')) {
    return 'Your session has expired. Please log in again.';
  }
  if (code === 'FORBIDDEN' || code === '403' || lowerMsg.includes('forbidden') || lowerMsg.includes('403')) {
    return 'You do not have permission to perform this action.';
  }
  if (code === 'NOT_FOUND' || code === '404' || lowerMsg.includes('not found') || lowerMsg.includes('404')) {
    return 'The requested resource was not found.';
  }
  if (code === 'RATE_LIMITED' || code === '429' || lowerMsg.includes('rate limit') || lowerMsg.includes('429') || lowerMsg.includes('too many requests')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  if (code === 'TIMEOUT' || code === 'REQUEST_TIMEOUT' || code === 'ETIMEDOUT' || lowerMsg.includes('timeout') || lowerMsg.includes('timed out')) {
    return 'The request timed out. Please try again.';
  }
  if (
    code === 'NETWORK_ERROR' ||
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    lowerMsg.includes('network') ||
    lowerMsg.includes('failed to fetch')
  ) {
    return 'Network error. Please check your connection and try again.';
  }
  if (code === 'SERVICE_UNAVAILABLE' || code === '503' || lowerMsg.includes('service unavailable') || lowerMsg.includes('503')) {
    return 'Service temporarily unavailable. Please try again shortly.';
  }
  if (code === '500' || code === 'INTERNAL_SERVER_ERROR' || lowerMsg.includes('500') || lowerMsg.includes('internal server error')) {
    return 'Server error. Please try again later.';
  }

  return rawMessage || fallbackMessage;
}

/**
 * Creates a structured action error object suitable for component state tracking.
 */
export function createActionError(
  targetId: string,
  err: unknown,
  fallbackMessage = 'Action failed'
): { targetId: string; message: string } {
  return {
    targetId,
    message: normalizeErrorMessage(err, fallbackMessage),
  };
}
