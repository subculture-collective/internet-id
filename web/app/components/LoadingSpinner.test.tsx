import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('renders with a custom message', () => {
    render(<LoadingSpinner message="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
    expect(screen.getByLabelText('Please wait...')).toBeInTheDocument();
  });

  it('renders as inline when inline prop is true', () => {
    render(<LoadingSpinner inline message="Loading data" />);
    const status = screen.getByRole('status');
    expect(status.tagName).toBe('SPAN');
    expect(screen.getByText('Loading data')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<LoadingSpinner size="md" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<LoadingSpinner size="lg" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    render(<LoadingSpinner message="Loading content" />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-label', 'Loading content');
  });
});
