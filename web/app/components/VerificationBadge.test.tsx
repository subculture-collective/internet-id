import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { VerificationBadge, useBadgeUrls } from './VerificationBadge';
import { renderHook } from '@testing-library/react';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('VerificationBadge', () => {
  const mockHash = '0x1234567890abcdef';

  it('renders badge image with default props', () => {
    render(<VerificationBadge hash={mockHash} />);
    const img = screen.getByAltText('Verified on Internet ID');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src');
  });

  it('renders as a link when clickable is true', () => {
    render(<VerificationBadge hash={mockHash} clickable={true} />);
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders without a link when clickable is false', () => {
    const { container } = render(<VerificationBadge hash={mockHash} clickable={false} />);
    const link = container.querySelector('a');
    expect(link).not.toBeInTheDocument();
  });

  it('uses custom alt text', () => {
    const customAlt = 'Custom verification badge';
    render(<VerificationBadge hash={mockHash} alt={customAlt} />);
    expect(screen.getByAltText(customAlt)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-badge-class';
    render(<VerificationBadge hash={mockHash} className={customClass} />);
    const img = screen.getByAltText('Verified on Internet ID');
    expect(img).toHaveClass(customClass);
  });

  it('builds correct badge URL with theme', () => {
    render(<VerificationBadge hash={mockHash} theme="blue" />);
    const img = screen.getByAltText('Verified on Internet ID');
    expect(img.getAttribute('src')).toContain('theme=blue');
  });

  it('builds correct badge URL with size', () => {
    render(<VerificationBadge hash={mockHash} size="large" />);
    const img = screen.getByAltText('Verified on Internet ID');
    expect(img.getAttribute('src')).toContain('size=large');
  });

  it('builds correct badge URL with style', () => {
    render(<VerificationBadge hash={mockHash} style="pill" />);
    const img = screen.getByAltText('Verified on Internet ID');
    expect(img.getAttribute('src')).toContain('style=pill');
  });

  it('includes showTimestamp in URL when enabled', () => {
    render(<VerificationBadge hash={mockHash} showTimestamp={true} />);
    const img = screen.getByAltText('Verified on Internet ID');
    expect(img.getAttribute('src')).toContain('showTimestamp=true');
  });

  it('includes showPlatform in URL when enabled', () => {
    render(<VerificationBadge hash={mockHash} showPlatform={true} />);
    const img = screen.getByAltText('Verified on Internet ID');
    expect(img.getAttribute('src')).toContain('showPlatform=true');
  });

  it('includes platform name in URL when provided', () => {
    render(<VerificationBadge hash={mockHash} platform="GitHub" />);
    const img = screen.getByAltText('Verified on Internet ID');
    expect(img.getAttribute('src')).toContain('platform=GitHub');
  });

  it('uses custom verify URL when provided', () => {
    const customUrl = 'https://custom.example.com/verify';
    render(<VerificationBadge hash={mockHash} verifyUrl={customUrl} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', customUrl);
  });
});

describe('useBadgeUrls', () => {
  const mockHash = '0x1234567890abcdef';

  it('returns badge URL with correct hash', () => {
    const { result } = renderHook(() => useBadgeUrls(mockHash));
    expect(result.current.badgeUrl).toContain(mockHash);
  });

  it('returns verify URL with correct hash', () => {
    const { result } = renderHook(() => useBadgeUrls(mockHash));
    expect(result.current.verifyUrl).toContain(mockHash);
  });

  it('returns HTML embed code', () => {
    const { result } = renderHook(() => useBadgeUrls(mockHash));
    expect(result.current.html).toContain('<a href=');
    expect(result.current.html).toContain('<img src=');
    expect(result.current.html).toContain(mockHash);
  });

  it('returns Markdown embed code', () => {
    const { result } = renderHook(() => useBadgeUrls(mockHash));
    expect(result.current.markdown).toContain('[![');
    expect(result.current.markdown).toContain('](');
    expect(result.current.markdown).toContain(mockHash);
  });

  it('respects theme option', () => {
    const { result } = renderHook(() => useBadgeUrls(mockHash, { theme: 'blue' }));
    expect(result.current.badgeUrl).toContain('theme=blue');
  });

  it('respects size option', () => {
    const { result } = renderHook(() => useBadgeUrls(mockHash, { size: 'large' }));
    expect(result.current.badgeUrl).toContain('size=large');
  });
});
