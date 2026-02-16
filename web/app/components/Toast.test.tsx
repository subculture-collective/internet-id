import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@/test/utils';
import { ToastContainer, ToastMessage } from './Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders toast messages', () => {
    const toasts: ToastMessage[] = [
      { id: '1', message: 'Success message', type: 'success' },
    ];
    const onRemove = vi.fn();

    render(<ToastContainer toasts={toasts} onRemove={onRemove} />);
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('renders multiple toast messages', () => {
    const toasts: ToastMessage[] = [
      { id: '1', message: 'First message', type: 'success' },
      { id: '2', message: 'Second message', type: 'error' },
    ];
    const onRemove = vi.fn();

    render(<ToastContainer toasts={toasts} onRemove={onRemove} />);
    expect(screen.getByText('First message')).toBeInTheDocument();
    expect(screen.getByText('Second message')).toBeInTheDocument();
  });

  it('auto-dismisses after duration', () => {
    const toasts: ToastMessage[] = [
      { id: '1', message: 'Test message', type: 'info', duration: 3000 },
    ];
    const onRemove = vi.fn();

    render(<ToastContainer toasts={toasts} onRemove={onRemove} />);
    
    // Fast-forward time
    vi.advanceTimersByTime(3000);
    
    expect(onRemove).toHaveBeenCalledWith('1');
  });

  it('can be manually closed', () => {
    const toasts: ToastMessage[] = [
      { id: '1', message: 'Test message', type: 'info' },
    ];
    const onRemove = vi.fn();

    render(<ToastContainer toasts={toasts} onRemove={onRemove} />);
    
    const closeButton = screen.getByRole('button', { name: /close notification/i });
    closeButton.click();
    
    expect(onRemove).toHaveBeenCalledWith('1');
  });

  it('can be closed with Escape key', () => {
    const toasts: ToastMessage[] = [
      { id: '1', message: 'First', type: 'info' },
      { id: '2', message: 'Second', type: 'info' },
    ];
    const onRemove = vi.fn();

    render(<ToastContainer toasts={toasts} onRemove={onRemove} />);
    
    // Simulate Escape key
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);
    
    // Should close the most recent toast (id: '2')
    expect(onRemove).toHaveBeenCalledWith('2');
  });

  it('renders different toast types with correct styling', () => {
    const toasts: ToastMessage[] = [
      { id: '1', message: 'Success', type: 'success' },
      { id: '2', message: 'Error', type: 'error' },
      { id: '3', message: 'Warning', type: 'warning' },
      { id: '4', message: 'Info', type: 'info' },
    ];
    const onRemove = vi.fn();

    render(<ToastContainer toasts={toasts} onRemove={onRemove} />);
    
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    const toasts: ToastMessage[] = [
      { id: '1', message: 'Test', type: 'error' },
    ];
    const onRemove = vi.fn();

    render(<ToastContainer toasts={toasts} onRemove={onRemove} />);
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive'); // error type
    expect(alert).toHaveAttribute('aria-atomic', 'true');
  });

  it('info toast has polite aria-live', () => {
    const toasts: ToastMessage[] = [
      { id: '1', message: 'Test', type: 'info' },
    ];
    const onRemove = vi.fn();

    render(<ToastContainer toasts={toasts} onRemove={onRemove} />);
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });
});
