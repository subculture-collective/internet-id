import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import ErrorMessage from './ErrorMessage';

describe('ErrorMessage', () => {
  it('renders with a string error', () => {
    render(<ErrorMessage error="Something went wrong" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders with an Error object', () => {
    const error = new Error('Test error');
    render(<ErrorMessage error={error} />);
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders with a custom title', () => {
    render(<ErrorMessage error="Test error" title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('displays network error details', () => {
    render(<ErrorMessage error="Failed to fetch data" />);
    expect(screen.getByText('Network Error')).toBeInTheDocument();
    expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument();
  });

  it('displays transaction rejected error details', () => {
    render(<ErrorMessage error="User rejected transaction" />);
    expect(screen.getByText('Transaction Rejected')).toBeInTheDocument();
    expect(screen.getByText(/approve the transaction/i)).toBeInTheDocument();
  });

  it('displays insufficient funds error details', () => {
    render(<ErrorMessage error="Insufficient funds for transaction" />);
    expect(screen.getByText('Insufficient Funds')).toBeInTheDocument();
    expect(screen.getByText(/add funds to your wallet/i)).toBeInTheDocument();
  });

  it('displays unauthorized error details', () => {
    render(<ErrorMessage error="Unauthorized access - 401" />);
    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    expect(screen.getByText(/sign in or check your account permissions/i)).toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    render(<ErrorMessage error="Test error" onRetry={onRetry} />);
    const button = screen.getByRole('button', { name: /try again/i });
    expect(button).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorMessage error="Test error" onRetry={onRetry} />);
    
    const button = screen.getByRole('button', { name: /try again/i });
    await user.click(button);
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('has proper ARIA attributes', () => {
    render(<ErrorMessage error="Test error" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(alert).toHaveAttribute('aria-atomic', 'true');
  });

  it('handles unknown error types', () => {
    render(<ErrorMessage error={{ someField: 'value' }} />);
    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });
});
