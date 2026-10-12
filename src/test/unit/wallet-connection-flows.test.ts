/**
 * Comprehensive Unit Tests for Wallet Connection & Disconnection Flows (#165)
 *
 * Requirements:
 * 1. Test successful wallet connection with challenge-response verification pipeline.
 * 2. Test wallet disconnection, optimistic removal, and state cleanup.
 * 3. Test connection error handling, specific SDK error codes, rollback, and inline UI alerts.
 * 4. Test multiple wallet management (switching active wallet, setting defaults, per-creator preference).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWallet, mapWalletError, type WalletInfo } from '@/hooks/use-wallet';
import { useWalletPreferenceStore } from '@/stores/wallet-preference-store';
import { useWallet as sdkUseWallet } from 'dorisio-sdk/react';

vi.mock('dorisio-sdk/react', () => ({
  useWallet: vi.fn(),
}));

interface SDKMockWallet {
  id: string;
  publicKey: string;
  name?: string | null;
  verified?: boolean;
}

function createSDKMock(overrides: Record<string, unknown> = {}) {
  const defaultWallets: SDKMockWallet[] = [
    {
      id: 'wallet-primary',
      publicKey: 'GAAAPRIMARY1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF',
      name: 'Primary Ledger',
      verified: true,
    },
    {
      id: 'wallet-secondary',
      publicKey: 'GBBBSECONDARY1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF',
      name: 'Secondary Hot Wallet',
      verified: false,
    },
  ];

  return {
    wallets: defaultWallets,
    selectedWallet: defaultWallets[0],
    loading: false,
    error: null,
    generateNonce: vi.fn().mockResolvedValue('test-nonce-12345'),
    getChallenge: vi.fn().mockResolvedValue('Sign this Dorisio verification message: challenge_98765'),
    verifyWallet: vi.fn().mockResolvedValue({
      id: 'wallet-new',
      publicKey: 'GCCCNEW1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF',
      name: 'New Hardware Wallet',
      verified: true,
    }),
    listWallets: vi.fn().mockResolvedValue(defaultWallets),
    selectWallet: vi.fn(),
    unlinkWallet: vi.fn().mockResolvedValue(undefined),
    renameWallet: vi.fn().mockResolvedValue({
      id: 'wallet-primary',
      publicKey: 'GAAAPRIMARY1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF',
      name: 'Renamed Vault',
      verified: true,
    }),
    getBalance: vi.fn().mockResolvedValue({ available: 1500, pending: 0, total: 1500 }),
    reset: vi.fn(),
    ...overrides,
  };
}

describe('Wallet Connection and Disconnection Flows (#165)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWalletPreferenceStore.setState({
      defaultWalletId: null,
      lastUsedWalletByCreator: {},
    });
  });

  // =========================================================================
  // 1. Successful Connection & Verification Flow
  // =========================================================================
  describe('Connection & Verification Flow', () => {
    it('executes full verification pipeline: nonce -> challenge -> signature verification', async () => {
      const mockSDK = createSDKMock();
      vi.mocked(sdkUseWallet).mockReturnValue(mockSDK);

      const { result } = renderHook(() => useWallet());

      // Step 1: Generate cryptographic nonce
      const nonce = await result.current.generateNonce();
      expect(nonce).toBe('test-nonce-12345');
      expect(mockSDK.generateNonce).toHaveBeenCalledTimes(1);

      // Step 2: Request signing challenge from backend
      const challenge = await result.current.getChallenge('GCCCNEW12345');
      expect(challenge).toContain('challenge_98765');
      expect(mockSDK.getChallenge).toHaveBeenCalledWith('GCCCNEW12345');

      // Step 3: Verify signed payload with public key and nonce
      const verificationResult = await result.current.verifyWallet(
        'GCCCNEW12345',
        'sig_valid_test_signature',
        nonce
      );
      expect(verificationResult.verified).toBe(true);
      expect(verificationResult.id).toBe('wallet-new');
      expect(mockSDK.verifyWallet).toHaveBeenCalledWith(
        'GCCCNEW12345',
        'sig_valid_test_signature',
        nonce
      );
    });

    it('refreshes the wallet list via fetchWallets after linking new wallet', async () => {
      const mockSDK = createSDKMock();
      vi.mocked(sdkUseWallet).mockReturnValue(mockSDK);

      const { result } = renderHook(() => useWallet());

      await act(async () => {
        await result.current.fetchWallets();
      });

      expect(mockSDK.listWallets).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // 2. Disconnection Flow & State Cleanup
  // =========================================================================
  describe('Disconnection Flow & State Cleanup', () => {
    it('optimistically hides wallet immediately upon disconnect call and calls SDK unlinkWallet', async () => {
      let resolveUnlink!: () => void;
      const unlinkPromise = new Promise<void>((res) => {
        resolveUnlink = res;
      });
      const unlinkWallet = vi.fn().mockReturnValue(unlinkPromise);
      const mockSDK = createSDKMock({ unlinkWallet });
      vi.mocked(sdkUseWallet).mockReturnValue(mockSDK);

      const { result } = renderHook(() => useWallet());
      expect(result.current.wallets).toHaveLength(2);

      let disconnectActionPromise!: Promise<void>;
      act(() => {
        disconnectActionPromise = result.current.disconnectWallet('wallet-primary');
      });

      // Wallet is immediately removed from list optimistically
      expect(result.current.wallets).toHaveLength(1);
      expect(result.current.wallets[0].id).toBe('wallet-secondary');
      expect(result.current.isPending('wallet-primary')).toBe(true);

      // Server confirms disconnect
      resolveUnlink();
      await act(async () => {
        await disconnectActionPromise;
      });

      expect(result.current.isPending('wallet-primary')).toBe(false);
      expect(unlinkWallet).toHaveBeenCalledWith('wallet-primary');
      expect(result.current.actionError).toBeNull();
    });

    it('rolls back optimistic disconnection when unlinkWallet fails and records action error', async () => {
      const unlinkWallet = vi.fn().mockRejectedValue(new Error('Stellar RPC node timeout'));
      const mockSDK = createSDKMock({ unlinkWallet });
      vi.mocked(sdkUseWallet).mockReturnValue(mockSDK);

      const { result } = renderHook(() => useWallet());
      expect(result.current.wallets).toHaveLength(2);

      await act(async () => {
        await expect(result.current.disconnectWallet('wallet-primary')).rejects.toThrow(
          'Stellar RPC node timeout'
        );
      });

      // Rolled back: wallet-primary is back in the list
      expect(result.current.wallets).toHaveLength(2);
      expect(result.current.isPending('wallet-primary')).toBe(false);
      expect(result.current.actionError).toEqual({
        walletId: 'wallet-primary',
        message: 'Stellar RPC node timeout',
      });
    });

    it('allows clearing actionError explicitly via clearActionError', async () => {
      const unlinkWallet = vi.fn().mockRejectedValue(new Error('Network error'));
      const mockSDK = createSDKMock({ unlinkWallet });
      vi.mocked(sdkUseWallet).mockReturnValue(mockSDK);

      const { result } = renderHook(() => useWallet());

      await act(async () => {
        await expect(result.current.disconnectWallet('wallet-primary')).rejects.toThrow();
      });
      expect(result.current.actionError).not.toBeNull();

      act(() => {
        result.current.clearActionError();
      });
      expect(result.current.actionError).toBeNull();
    });
  });

  // =========================================================================
  // 3. Error Mapping & Granular Error Codes
  // =========================================================================
  describe('Error Mapping & SDK Error Codes', () => {
    it('correctly maps specific SDK error codes to user-friendly messages', () => {
      const makeCodeError = (code: string) => Object.assign(new Error(), { code });

      expect(mapWalletError(makeCodeError('WALLET_NOT_FOUND'))).toBe(
        'Wallet not found. It may have already been removed.'
      );
      expect(mapWalletError(makeCodeError('WALLET_ALREADY_LINKED'))).toBe(
        'This wallet is already linked to your account.'
      );
      expect(mapWalletError(makeCodeError('INVALID_SIGNATURE'))).toBe(
        'Wallet verification failed: the signature is invalid. Please try again.'
      );
      expect(mapWalletError(makeCodeError('CHALLENGE_EXPIRED'))).toBe(
        'Verification challenge expired. Please start the verification process again.'
      );
      expect(mapWalletError(makeCodeError('UNAUTHORIZED'))).toBe(
        'Your session has expired. Please log in again.'
      );
      expect(mapWalletError(makeCodeError('RATE_LIMITED'))).toBe(
        'Too many requests. Please wait a moment and try again.'
      );
      expect(mapWalletError(makeCodeError('NETWORK_ERROR'))).toBe(
        'Network error. Please check your connection and try again.'
      );
      expect(mapWalletError(makeCodeError('TIMEOUT'))).toBe(
        'The request timed out. Please try again.'
      );
      expect(mapWalletError(makeCodeError('BLOCKCHAIN_TIMEOUT'))).toBe(
        'Blockchain confirmation timed out. The transaction may still complete — check back shortly.'
      );
    });

    it('maps network and signature errors based on error message text', () => {
      expect(mapWalletError(new Error('failed network connection'))).toBe(
        'Network error. Please check your connection and try again.'
      );
      expect(mapWalletError(new Error('signature verification failed'))).toBe(
        'Wallet verification failed: the signature is invalid. Please try again.'
      );
      expect(mapWalletError(new Error('invalid wallet key provided'))).toBe(
        'Invalid wallet address. Please ensure the wallet is correct.'
      );
      expect(mapWalletError('non-error object')).toBe(
        'An unexpected error occurred. Please try again.'
      );
    });
  });

  // =========================================================================
  // 4. Multiple Wallet Management
  // =========================================================================
  describe('Multiple Wallet Management', () => {
    it('switches the active selected wallet via selectWallet', () => {
      const mockSDK = createSDKMock();
      vi.mocked(sdkUseWallet).mockReturnValue(mockSDK);

      const { result } = renderHook(() => useWallet());
      const secondaryWallet: WalletInfo = {
        id: 'wallet-secondary',
        publicKey: 'GBBBSECONDARY',
        name: 'Secondary Hot Wallet',
        verified: false,
      };

      act(() => {
        result.current.selectWallet(secondaryWallet);
      });

      expect(mockSDK.selectWallet).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'wallet-secondary' })
      );
    });

    it('persists and resolves default wallet across different creators', () => {
      const mockSDK = createSDKMock();
      vi.mocked(sdkUseWallet).mockReturnValue(mockSDK);

      const { result } = renderHook(() => useWallet());

      // Set global default wallet
      act(() => {
        result.current.setDefaultWalletId('wallet-primary');
      });

      expect(result.current.preferredWallet?.id).toBe('wallet-primary');
      expect(result.current.getPreferredWalletId('creator-1')).toBe('wallet-primary');

      // Set specific wallet preference for creator-2
      act(() => {
        result.current.setLastUsedWallet('creator-2', 'wallet-secondary');
      });

      expect(result.current.getPreferredWalletId('creator-2')).toBe('wallet-secondary');
      // creator-1 still falls back to default
      expect(result.current.getPreferredWalletId('creator-1')).toBe('wallet-primary');
    });

    it('supports renaming a wallet with optimistic update and rollback recovery', async () => {
      const sdkRenameWallet = vi
        .fn()
        .mockRejectedValueOnce(new Error('Rename conflict'))
        .mockResolvedValueOnce({
          id: 'wallet-primary',
          publicKey: 'GAAA',
          name: 'Cold Storage Vault',
          verified: true,
        });
      const mockSDK = createSDKMock({ renameWallet: sdkRenameWallet });
      vi.mocked(sdkUseWallet).mockReturnValue(mockSDK);

      const { result } = renderHook(() => useWallet());

      // First attempt fails: name rolls back
      await act(async () => {
        await expect(
          result.current.renameWallet('wallet-primary', 'Cold Storage Vault')
        ).rejects.toThrow('Rename conflict');
      });

      expect(result.current.wallets.find((w) => w.id === 'wallet-primary')?.name).toBe(
        'Primary Ledger'
      );
      expect(result.current.actionError?.message).toBe('Rename conflict');

      // Retry attempt succeeds via retryAction
      await act(async () => {
        await result.current.retryAction('wallet-primary', 'Cold Storage Vault');
      });

      expect(result.current.actionError).toBeNull();
      expect(sdkRenameWallet).toHaveBeenCalledTimes(2);
    });
  });
});
