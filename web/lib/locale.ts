import { headers } from 'next/headers';
import { locales, defaultLocale, type Locale } from '../i18n';

// Helper function to get locale from headers (set by middleware)
export async function getLocaleFromHeaders(): Promise<Locale> {
  const headersList = await headers();
  const locale = headersList.get('x-next-intl-locale');
  
  if (locale && locales.includes(locale as Locale)) {
    return locale as Locale;
  }
  
  return defaultLocale;
}
