import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

// Supported locales
export const locales = ['en', 'es', 'zh', 'ja', 'fr', 'de'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'en';

// Locale labels for display
export const localeLabels: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  zh: '简体中文',
  ja: '日本語',
  fr: 'Français',
  de: 'Deutsch',
};

export default getRequestConfig(async () => {
  // Get locale from cookie or use default
  const cookieStore = await cookies();
  const locale = (cookieStore.get('NEXT_LOCALE')?.value as Locale) || defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
