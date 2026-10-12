/**
 * Integration Tests for Tip Creation Flow (#171)
 *
 * Exercises the end-to-end tip creation lifecycle spanning:
 * - User input (preset selection, custom amount input, tip message, validation)
 * - Wallet selection (wallet selector dropdown, balance presentation, preferred wallet auto-selection)
 * - Submission & confirmation with real DorisioProvider and TanStack QueryClient
 * - Error scenarios: insufficient balance, rejected transaction / signature, network timeout
 * - State updates: notifications, wallet preferences, custom tip tiers, request deduplication
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DorisioProvider } from 'dorisio-sdk/react';
import DorisioButton from '@/components/sections/dorisio-button';
import { NotificationProvider } from '@/components/notification-provider';
import { useCreateTip } from '@/hooks/use-create-tip';
import { useWallet } from '@/hooks/use-wallet';
import { useAppStore } from '@/stores/app-store';
import { useWalletPreferenceStore } from '@/stores/wallet-preference-store';
import { useTipTierStore } from '@/stores/tip-tier-store';
import { clearDedupedRequests } from '@/lib/request-deduplicator';

// Mock monitoring events
const mockCaptureFeatureEvent = vi.fn();
vi.mock('@/lib/feature-flags', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/feature-flags')>();
  return {
    ...actual,
    captureFeatureEvent: (...args: unknown[]) => mockCaptureFeatureEvent(...args),
  };
});

interface MockWallet {
  id: string;
  userId: string;
  publicKey: string;
  name: string;
  verified: boolean;
  createdAt: string;
}

const MOCK_WALLETS: MockWallet[] = [
  {
    id: 'wallet-main',
    userId: 'user-bob',
    publicKey: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
    name: 'Main Stellar Wallet',
    verified: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'wallet-secondary',
    userId: 'user-bob',
    publicKey: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS6XY4O',
    name: 'Secondary Hot Wallet',
    verified: true,
    createdAt: '2026-01-05T00:00:00.000Z',
  },
];

function createMockSdkClient() {
  return {
    listWallets: vi.fn().mockResolvedValue(MOCK_WALLETS),
    getBalance: vi.fn().mockImplementation(async (walletId: string) => {
      if (walletId === 'wallet-main') {
        return { available: 250.0, pending: 0, total: 250.0 };
      }
      return { available: 15.0, pending: 0, total: 15.0 };
    }),
    createTip: vi.fn().mockImplementation(async (req: { creatorId: string; amount: number; message?: string }) => ({
      id: 'tip-tx-1001',
      creatorId: req.creatorId,
      amount: req.amount,
      message: req.message,
      status: 'confirmed',
      stellarTxHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      createdAt: new Date().toISOString(),
    })),
    buildPaymentTransaction: vi.fn().mockResolvedValue({
      envelope: 'AAAAAGBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H...',
      hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      tipId: 'tip-tx-1001',
    }),
    submitPaymentTransaction: vi.fn().mockResolvedValue({
      id: 'sub-tx-1001',
      status: 'confirmed',
      hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      tipId: 'tip-tx-1001',
    }),
    checkTransactionConfirmation: vi.fn().mockResolvedValue({
      id: 'tip-tx-1001',
      status: 'confirmed',
      stellarTxHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    }),
    setToken: vi.fn(),
    clearToken: vi.fn(),
    request: vi.fn().mockImplementation(async (method: string, path: string) => {
      if (path.includes('/api/v1/wallet/list')) {
        return {
          success: true,
          data: {
            wallets: MOCK_WALLETS,
          },
        };
      }
      if (path.includes('/balance')) {
        return {
          success: true,
          data: {
            available: 250.0,
            pending: 0,
            total: 250.0,
          },
        };
      }
      return { success: true, data: {} };
    }),
  };
}

function createTestWrapper(client: ReturnType<typeof createMockSdkClient>, queryClient?: QueryClient) {
  const qc = queryClient ?? new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <DorisioProvider client={client as any} config={{} as any}>
          <NotificationProvider />
          {children}
        </DorisioProvider>
      </QueryClientProvider>
    );
  };
}

describe('Tip Creation Flow Integration Tests (#171)', () => {
  let mockClient: ReturnType<typeof createMockSdkClient>;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    clearDedupedRequests();
    useAppStore.setState({ notifications: [] });
    useWalletPreferenceStore.setState({ lastUsedWalletByCreator: {}, defaultWalletId: null });
    useTipTierStore.setState({ tiersByCreator: {}, recentCustomAmounts: [] });

    mockClient = createMockSdkClient();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  // =========================================================================
  // 1. Happy-path tip creation tested end-to-end
  // =========================================================================
  describe('Happy-Path End-to-End Tip Creation Flow', () => {
    it('executes full flow: opens modal -> selects preset tier -> fills message -> submits -> receives blockchain confirmation -> updates state', async () => {
      const user = userEvent.setup();
      const Wrapper = createTestWrapper(mockClient, queryClient);

      render(
        <Wrapper>
          <DorisioButton creatorId="creator_stellar_dev" creatorName="Stellar Dev" />
        </Wrapper>
      );

      // 1. Open tip modal dialog
      const openButton = screen.getByRole('button', { name: /Send a Tip/i });
      await user.click(openButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Send a Tip')).toBeInTheDocument();
      expect(screen.getByText(/Creator ID: creator_stellar_dev/)).toBeInTheDocument();

      // 2. Wallet auto-selected from list
      await waitFor(() => {
        expect(screen.getByText('Main Stellar Wallet')).toBeInTheDocument();
      });

      // 3. User selects a preset amount ($10)
      const tier10Button = screen.getByRole('button', { name: '$10' });
      await user.click(tier10Button);
      expect(tier10Button).toHaveAttribute('aria-pressed', 'true');

      // 4. User inputs an optional supportive tip message
      const messageInput = screen.getByPlaceholderText(/Add a note to brighten their day/i);
      await user.type(messageInput, 'Keep up the stellar work! 🚀');

      // 5. Submit the tip using Continue button
      const submitButton = screen.getByRole('button', { name: 'Continue' });
      expect(submitButton).not.toBeDisabled();
      await user.click(submitButton);

      // 6. Verify SDK createTip was called with sanitized payload
      await waitFor(() => {
        expect(mockClient.createTip).toHaveBeenCalledWith(
          expect.objectContaining({
            creatorId: 'creator_stellar_dev',
            amount: 10,
            message: 'Keep up the stellar work! 🚀',
          }),
          expect.anything()
        );
      });

      // 7. Verify confirmation toast notification is displayed on screen
      await waitFor(() => {
        expect(screen.getByText('Tip of $10 confirmed!')).toBeInTheDocument();
      });

      // 8. Verify modal closes on success
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // 9. Verify state updates:
      // - Wallet preference recorded
      await waitFor(() => {
        expect(
          useWalletPreferenceStore.getState().lastUsedWalletByCreator['creator_stellar_dev']
        ).toBe('wallet-main');
      });

      // - Analytics event captured
      expect(mockCaptureFeatureEvent).toHaveBeenCalledWith('tip_succeeded', {
        amount: 10,
        scheduled: false,
      });
    });

    it('supports custom tip amounts with validation and adds to recent custom tiers upon success', async () => {
      const user = userEvent.setup();
      const Wrapper = createTestWrapper(mockClient, queryClient);

      render(
        <Wrapper>
          <DorisioButton creatorId="creator_alice" creatorName="Alice" />
        </Wrapper>
      );

      await user.click(screen.getByRole('button', { name: /Send a Tip/i }));

      // Wait for wallet auto-selection
      await waitFor(() => {
        expect(screen.getByText('Main Stellar Wallet')).toBeInTheDocument();
      });

      // Switch to Custom amount
      const customToggle = screen.getByRole('button', { name: 'Custom' });
      await user.click(customToggle);

      const customInput = screen.getByLabelText(/Custom tip amount/i);
      expect(customInput).toBeInTheDocument();

      // Test validation: negative or 0 amount triggers error
      await user.type(customInput, '0');
      expect(screen.getByRole('alert')).toHaveTextContent(/Please enter an amount greater than \$0/i);
      expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();

      // Enter valid custom amount $37.50
      await user.clear(customInput);
      await user.type(customInput, '37.50');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      // Submit custom tip
      const submitBtn = screen.getByRole('button', { name: 'Continue' });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockClient.createTip).toHaveBeenCalledWith(
          expect.objectContaining({
            creatorId: 'creator_alice',
            amount: 37.5,
          }),
          expect.anything()
        );
      });

      // Verify custom amount is recorded in recent custom amounts
      expect(useTipTierStore.getState().recentCustomAmounts).toContain(37.5);
    });

    it('allows changing wallet destination from wallet selector dropdown', async () => {
      const user = userEvent.setup();
      const Wrapper = createTestWrapper(mockClient, queryClient);

      render(
        <Wrapper>
          <DorisioButton creatorId="creator_bob" />
        </Wrapper>
      );

      await user.click(screen.getByRole('button', { name: /Send a Tip/i }));

      // Wait for wallet selector to load
      await waitFor(() => {
        expect(screen.getByLabelText('Select wallet to tip from')).toBeInTheDocument();
      });

      // Open wallet dropdown
      const walletSelector = screen.getByLabelText('Select wallet to tip from');
      await user.click(walletSelector);

      // Select secondary wallet option
      const secondaryWalletOption = screen.getByRole('button', { name: /Secondary Hot Wallet/i });
      await user.click(secondaryWalletOption);

      // Verify selected wallet switched
      expect(screen.getByText('Secondary Hot Wallet')).toBeInTheDocument();

      // Pick amount and submit
      await user.click(screen.getByRole('button', { name: '$5' }));
      await user.click(screen.getByRole('button', { name: 'Continue' }));

      await waitFor(() => {
        expect(mockClient.createTip).toHaveBeenCalledTimes(1);
      });

      // Verify last used wallet preference saved the secondary wallet
      await waitFor(() => {
        expect(
          useWalletPreferenceStore.getState().lastUsedWalletByCreator['creator_bob']
        ).toBe('wallet-secondary');
      });
    });
  });

  // =========================================================================
  // 2. Error Scenarios (insufficient balance, rejected transaction, timeout)
  // =========================================================================
  describe('Error Scenarios & Resilience', () => {
    it('handles insufficient balance error cleanly and keeps modal open for user correction', async () => {
      const user = userEvent.setup();
      const balanceErr = new Error(
        'Insufficient balance in wallet GBRPYHIL2...: Available 2.50 XLM, required 100.00 XLM'
      );
      (balanceErr as any).statusCode = 400;
      mockClient.createTip.mockRejectedValue(balanceErr);

      const Wrapper = createTestWrapper(mockClient, queryClient);

      render(
        <Wrapper>
          <DorisioButton creatorId="creator_charlie" />
        </Wrapper>
      );

      await user.click(screen.getByRole('button', { name: /Send a Tip/i }));

      await waitFor(() => {
        expect(screen.getByText('Main Stellar Wallet')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: '$25' }));

      const submitBtn = screen.getByRole('button', { name: 'Continue' });
      await user.click(submitBtn);

      // Verify error toast appears with specific failure message
      await waitFor(() => {
        expect(
          screen.getByText(/Insufficient balance in wallet/i)
        ).toBeInTheDocument();
      });

      // Feature event failure recorded
      expect(mockCaptureFeatureEvent).toHaveBeenCalledWith('tip_failed', {
        amount: 25,
      });

      // Modal stays open so user can select lower tier or different wallet
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(submitBtn).not.toBeDisabled();
    });

    it('handles rejected transaction / signature cancellation from wallet extension', async () => {
      const user = userEvent.setup();
      const rejectErr = new Error('User rejected the transaction signing request in Freighter.');
      (rejectErr as any).statusCode = 400;
      mockClient.createTip.mockRejectedValue(rejectErr);

      const Wrapper = createTestWrapper(mockClient, queryClient);

      render(
        <Wrapper>
          <DorisioButton creatorId="creator_david" />
        </Wrapper>
      );

      await user.click(screen.getByRole('button', { name: /Send a Tip/i }));

      await waitFor(() => {
        expect(screen.getByText('Main Stellar Wallet')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: '$1' }));
      await user.click(screen.getByRole('button', { name: 'Continue' }));

      await waitFor(() => {
        expect(
          screen.getByText(/User rejected the transaction signing request/i)
        ).toBeInTheDocument();
      });

      expect(mockCaptureFeatureEvent).toHaveBeenCalledWith('tip_failed', {
        amount: 1,
      });
    });

    it('handles network timeout and clears deduplication guard so user can retry', async () => {
      const user = userEvent.setup();
      const timeoutErr = new Error('Network request timed out after 30000ms. Please check your connection.');
      (timeoutErr as any).statusCode = 408;
      mockClient.createTip.mockRejectedValue(timeoutErr);

      const Wrapper = createTestWrapper(mockClient, queryClient);

      render(
        <Wrapper>
          <DorisioButton creatorId="creator_eva" />
        </Wrapper>
      );

      await user.click(screen.getByRole('button', { name: /Send a Tip/i }));

      await waitFor(() => {
        expect(screen.getByText('Main Stellar Wallet')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: '$5' }));

      const submitBtn = screen.getByRole('button', { name: 'Continue' });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Network request timed out/i)).toBeInTheDocument();
      });

      // Clear deduplication and let retry succeed
      clearDedupedRequests();
      mockClient.createTip.mockImplementation(async (req: { creatorId: string; amount: number }) => ({
        id: 'tip-retry-success',
        creatorId: req.creatorId,
        status: 'confirmed',
        amount: req.amount,
        stellarTxHash: 'retry-tx-hash-789',
      }));

      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Tip of $5 confirmed!')).toBeInTheDocument();
      });
    });

    it('handles failed blockchain status response from SDK gracefully', async () => {
      const user = userEvent.setup();
      mockClient.createTip.mockResolvedValue({
        id: 'tip-fail',
        status: 'failed',
        amount: 10,
        error: 'Transaction failed on Stellar ledger: tx_bad_seq',
      });

      const Wrapper = createTestWrapper(mockClient, queryClient);

      render(
        <Wrapper>
          <DorisioButton creatorId="creator_frank" />
        </Wrapper>
      );

      await user.click(screen.getByRole('button', { name: /Send a Tip/i }));

      await waitFor(() => {
        expect(screen.getByText('Main Stellar Wallet')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: '$10' }));
      await user.click(screen.getByRole('button', { name: 'Continue' }));

      await waitFor(() => {
        expect(
          screen.getByText('The payment could not be completed. Please try again.')
        ).toBeInTheDocument();
      });

      expect(mockCaptureFeatureEvent).toHaveBeenCalledWith('tip_failed', {
        amount: 10,
        scheduled: false,
      });
    });
  });

  // =========================================================================
  // 3. State updates and hook lifecycle verification
  // =========================================================================
  describe('useCreateTip Hook Multi-Step Lifecycle and State Updates', () => {
    it('manages lifecycle state from idle to creating, submitting, and confirmed with real SDK hook wrapper', async () => {
      const Wrapper = createTestWrapper(mockClient, queryClient);

      const { result } = renderHook(() => useCreateTip(), {
        wrapper: Wrapper,
      });

      // Initial state
      expect(result.current.loading).toBe(false);
      expect(result.current.step).toBe('idle');
      expect(result.current.tip).toBeNull();
      expect(result.current.error).toBeUndefined();

      // Execute createTip
      let tipResult: any;
      await act(async () => {
        tipResult = await result.current.createTip({
          creatorId: 'creator_grace',
          amount: 25,
          message: 'Integration test message',
        });
      });

      expect(tipResult).toEqual({
        id: 'tip-tx-1001',
        amount: 25,
        status: 'confirmed',
        transactionHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });

      // State updated on hook
      expect(result.current.loading).toBe(false);
      expect(result.current.tip).toEqual({
        id: 'tip-tx-1001',
        amount: 25,
        status: 'confirmed',
        transactionHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });

      // Reset restores initial state
      act(() => {
        result.current.reset();
      });

      expect(result.current.tip).toBeNull();
      expect(result.current.step).toBe('idle');
      expect(result.current.loading).toBe(false);
    });

    it('updates transaction status properly through multi-stage blockchain pipeline', async () => {
      const Wrapper = createTestWrapper(mockClient, queryClient);

      const { result } = renderHook(() => useCreateTip(), {
        wrapper: Wrapper,
      });

      // Step 1: Build transaction
      let buildRes: any;
      await act(async () => {
        buildRes = await result.current.buildTransaction('tip-100', {
          senderPublicKey: MOCK_WALLETS[0].publicKey,
        });
      });
      expect(buildRes.envelope).toBeDefined();

      // Step 2: Submit transaction
      let submitRes: any;
      await act(async () => {
        submitRes = await result.current.submitTransaction('tip-100', buildRes.envelope);
      });
      expect(submitRes.status).toBe('confirmed');

      // Step 3: Confirm transaction
      let confirmRes: any;
      await act(async () => {
        confirmRes = await result.current.confirmTransaction('tip-100');
      });
      expect(confirmRes.stellarTxHash).toBeDefined();
    });
  });
});
