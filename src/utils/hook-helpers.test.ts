import { describe, it, expect } from 'vitest';
import {
  normalizeErrorMessage,
  extractErrorCode,
  mapApiError,
  createActionError,
} from './hook-helpers';

describe('hook-helpers', () => {
  describe('normalizeErrorMessage', () => {
    it('returns message from an Error instance', () => {
      expect(normalizeErrorMessage(new Error('Something failed'))).toBe('Something failed');
    });

    it('returns message property from an object', () => {
      expect(normalizeErrorMessage({ message: 'Object error' })).toBe('Object error');
    });

    it('returns string error directly', () => {
      expect(normalizeErrorMessage('Direct string error')).toBe('Direct string error');
    });

    it('falls back to default message when null/undefined/empty', () => {
      expect(normalizeErrorMessage(null)).toBe('An unexpected error occurred. Please try again.');
      expect(normalizeErrorMessage(undefined, 'Custom fallback')).toBe('Custom fallback');
      expect(normalizeErrorMessage('')).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('extractErrorCode', () => {
    it('extracts code property', () => {
      expect(extractErrorCode({ code: 'rate_limited' })).toBe('RATE_LIMITED');
    });

    it('extracts status property as string', () => {
      expect(extractErrorCode({ status: 404 })).toBe('404');
    });

    it('extracts nested response status', () => {
      expect(extractErrorCode({ response: { status: 503 } })).toBe('503');
    });

    it('returns empty string if no code or non-object', () => {
      expect(extractErrorCode('plain error')).toBe('');
      expect(extractErrorCode(null)).toBe('');
    });
  });

  describe('mapApiError', () => {
    it('maps 401 / unauthorized errors', () => {
      expect(mapApiError({ status: 401 })).toBe('Your session has expired. Please log in again.');
      expect(mapApiError(new Error('User unauthorized'))).toBe(
        'Your session has expired. Please log in again.'
      );
    });

    it('maps 403 / forbidden errors', () => {
      expect(mapApiError({ code: 'FORBIDDEN' })).toBe(
        'You do not have permission to perform this action.'
      );
    });

    it('maps 404 / not found errors', () => {
      expect(mapApiError({ status: 404 })).toBe('The requested resource was not found.');
    });

    it('maps 429 / rate limited errors', () => {
      expect(mapApiError({ code: 'RATE_LIMITED' })).toBe(
        'Too many requests. Please wait a moment and try again.'
      );
    });

    it('maps network & timeout errors', () => {
      expect(mapApiError(new Error('Network request failed'))).toBe(
        'Network error. Please check your connection and try again.'
      );
      expect(mapApiError({ code: 'ETIMEDOUT' })).toBe('The request timed out. Please try again.');
    });

    it('maps 503 service unavailable', () => {
      expect(mapApiError({ status: 503 })).toBe(
        'Service temporarily unavailable. Please try again shortly.'
      );
    });

    it('preserves specific raw error message if no code matched', () => {
      expect(mapApiError(new Error('Insufficient token balance'))).toBe(
        'Insufficient token balance'
      );
    });
  });

  describe('createActionError', () => {
    it('creates an action error object with targetId and message', () => {
      const err = createActionError('wallet-123', new Error('Failed to unlink'));
      expect(err).toEqual({
        targetId: 'wallet-123',
        message: 'Failed to unlink',
      });
    });

    it('uses fallback message when error is missing', () => {
      const err = createActionError('wallet-123', null, 'Failed to disconnect');
      expect(err).toEqual({
        targetId: 'wallet-123',
        message: 'Failed to disconnect',
      });
    });
  });
});
