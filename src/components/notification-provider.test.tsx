import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationProvider, useNotification } from './notification-provider';
import { useAppStore } from '@/stores/app-store';

describe('NotificationProvider Component (#175)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useAppStore.setState({ notifications: [] });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('auto-dismisses success and info notifications after 5 seconds', () => {
    render(<NotificationProvider />);

    act(() => {
      useAppStore.getState().addNotification({
        type: 'success',
        title: 'Operation successful',
        message: 'Your profile has been saved.',
      });
    });

    expect(screen.getByText('Operation successful')).toBeInTheDocument();

    // Advance 4.9 seconds - should still be visible
    act(() => {
      vi.advanceTimersByTime(4900);
    });
    expect(screen.getByText('Operation successful')).toBeInTheDocument();

    // Advance past 5 seconds - should be auto-dismissed
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByText('Operation successful')).not.toBeInTheDocument();
  });

  it('keeps error notifications visible indefinitely until user dismisses', async () => {
    render(<NotificationProvider />);

    act(() => {
      useAppStore.getState().addNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Could not connect to server.',
      });
    });

    expect(screen.getByText('Network Error')).toBeInTheDocument();

    // Advance 30 seconds - error should STILL be visible
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(screen.getByText('Network Error')).toBeInTheDocument();

    // User manually clicks dismiss button
    const dismissBtn = screen.getByLabelText('Dismiss notification');
    act(() => {
      dismissBtn.click();
    });

    expect(screen.queryByText('Network Error')).not.toBeInTheDocument();
  });

  it('allows custom duration override when specified', () => {
    render(<NotificationProvider />);

    act(() => {
      useAppStore.getState().addNotification({
        type: 'info',
        title: 'Quick note',
        message: 'Dismissing in 2s.',
        duration: 2000,
      });
    });

    expect(screen.getByText('Quick note')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(screen.queryByText('Quick note')).not.toBeInTheDocument();
  });

  it('dismiss button works across all notification types', () => {
    render(<NotificationProvider />);

    act(() => {
      useAppStore.getState().addNotification({
        type: 'warning',
        title: 'Warning Alert',
        message: 'Low balance.',
      });
    });

    expect(screen.getByText('Warning Alert')).toBeInTheDocument();
    const dismissBtn = screen.getByLabelText('Dismiss notification');
    act(() => {
      dismissBtn.click();
    });

    expect(screen.queryByText('Warning Alert')).not.toBeInTheDocument();
  });
});
