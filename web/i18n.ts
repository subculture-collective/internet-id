import { getRequestConfig } from 'next-intl/server';

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

export default getRequestConfig(async ({ requestLocale }) => {
  // Use the locale from the request (set by middleware) or default
  let locale = await requestLocale;

  // Ensure we have a valid locale
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
