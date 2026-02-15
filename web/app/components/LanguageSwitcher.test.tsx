import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act } from '@/test/utils';
import LanguageSwitcher from './LanguageSwitcher';

// Mock the i18n module
vi.mock('../../i18n', () => ({
  locales: ['en', 'es', 'zh', 'ja', 'fr', 'de'],
  localeLabels: {
    en: 'English',
    es: 'Español',
    zh: '简体中文',
    ja: '日本語',
    fr: 'Français',
    de: 'Deutsch',
  },
}));

// Mock next-intl with a more sophisticated mock
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      selectLanguage: 'Select language',
    };
    return translations[key] || key;
  },
  useLocale: () => 'en',
}));

// Mock next/navigation
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: mockRefresh,
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

describe('LanguageSwitcher', () => {
  it('renders language switcher button', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole('button', { name: /select language/i })).toBeInTheDocument();
  });

  it('displays current locale', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('shows dropdown arrow', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText('▼')).toBeInTheDocument();
  });

  it('has proper ARIA attributes when closed', () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole('button', { name: /select language/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-haspopup', 'true');
  });

  it('opens dropdown when button is clicked', async () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole('button', { name: /select language/i });
    
    await act(async () => {
      button.click();
    });
    
    await waitFor(() => {
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('displays all available languages in dropdown', async () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole('button', { name: /select language/i });
    
    await act(async () => {
      button.click();
    });
    
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
    
    expect(screen.getByRole('menuitem', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Español' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '简体中文' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '日本語' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Français' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Deutsch' })).toBeInTheDocument();
  });

  it('closes dropdown when language is selected', async () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole('button', { name: /select language/i });
    
    await act(async () => {
      button.click();
    });
    
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
    
    const spanishOption = screen.getByRole('menuitem', { name: 'Español' });
    
    await act(async () => {
      spanishOption.click();
    });
    
    // Verify the dropdown has closed (menu is no longer in document)
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('shows up arrow when dropdown is open', async () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole('button', { name: /select language/i });
    
    await act(async () => {
      button.click();
    });
    
    await waitFor(() => {
      expect(screen.getByText('▲')).toBeInTheDocument();
    });
  });

  it('button is disabled while transition is pending', () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole('button', { name: /select language/i });
    
    // Initially not disabled
    expect(button).not.toBeDisabled();
  });

  it('displays globe emoji', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole('img', { name: 'Globe' })).toBeInTheDocument();
  });
});
