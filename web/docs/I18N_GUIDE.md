# Internationalization (i18n) Guide

## Overview

Internet-ID now supports multiple languages to expand its reach to non-English speaking users globally. The implementation uses `next-intl` for Next.js 15 App Router.

## Supported Languages

- **English (en)** - Default language
- **Spanish (es)** - Spanish (Latin America + Spain)
- **Simplified Chinese (zh)** - 简体中文
- **Japanese (ja)** - 日本語
- **French (fr)** - Français
- **German (de)** - Deutsch

## Architecture

### Translation Files

Translation files are located in `web/messages/` directory:
```
web/messages/
├── en.json    # English (default)
├── es.json    # Spanish
├── zh.json    # Simplified Chinese
├── ja.json    # Japanese
├── fr.json    # French
└── de.json    # German
```

Each translation file contains key-value pairs organized by namespace:
```json
{
  "common": {
    "copy": "Copy",
    "loading": "Loading..."
  },
  "nav": {
    "upload": "Upload",
    "dashboard": "Dashboard"
  }
}
```

### Configuration

- **`i18n.ts`** - Main configuration file defining supported locales
- **`middleware.ts`** - Detects user locale from Accept-Language header and cookies
- **`lib/locale.ts`** - Helper functions for server-side locale detection

### Locale Detection

The system detects the user's preferred language in this order:

1. **Cookie** - `NEXT_LOCALE` cookie (persisted after user selection)
2. **Accept-Language header** - Browser's language preference
3. **Default** - English (en)

### Language Switcher

The LanguageSwitcher component (`app/components/LanguageSwitcher.tsx`) allows users to manually change the language. It:
- Displays current language with globe icon
- Shows dropdown with all available languages
- Persists selection in cookie
- Refreshes page to apply new locale

## Usage in Components

### Server Components

```tsx
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('namespace');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

### Client Components

Client components work the same way, but must be wrapped in `NextIntlClientProvider` (already done in root layout):

```tsx
'use client';

import { useTranslations } from 'next-intl';

export default function MyClientComponent() {
  const t = useTranslations('namespace');
  
  return <button>{t('submit')}</button>;
}
```

### Accessing Current Locale

```tsx
import { useLocale } from 'next-intl';

export default function MyComponent() {
  const locale = useLocale();
  
  return <div>Current language: {locale}</div>;
}
```

## SEO Support

The implementation includes SEO optimizations:

### Hreflang Tags

Automatically added in the root layout for all supported languages:
```html
<link rel="alternate" hreflang="en" href="https://internet-id.io" />
<link rel="alternate" hreflang="es" href="https://internet-id.io/es" />
<link rel="alternate" hreflang="zh" href="https://internet-id.io/zh" />
<!-- ... -->
<link rel="alternate" hreflang="x-default" href="https://internet-id.io" />
```

### Language-Specific Metadata

Metadata (titles, descriptions) can be localized using `getTranslations`:

```tsx
export async function generateMetadata({ params }: { params: { locale: Locale } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'metadata' });
  
  return {
    title: t('title'),
    description: t('description'),
  };
}
```

## Date and Number Formatting

### Dates

Use the built-in Intl API with the current locale:

```tsx
import { useLocale } from 'next-intl';

export default function MyComponent() {
  const locale = useLocale();
  const date = new Date();
  
  const formatted = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
  
  return <div>{formatted}</div>;
}
```

### Numbers

```tsx
import { useLocale } from 'next-intl';

export default function MyComponent() {
  const locale = useLocale();
  const number = 1234.56;
  
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
  }).format(number);
  
  return <div>{formatted}</div>;
}
```

## Adding New Translations

### 1. Add to Translation Files

Add the new key-value pair to all translation files:

**en.json:**
```json
{
  "myNamespace": {
    "newKey": "English text"
  }
}
```

**es.json:**
```json
{
  "myNamespace": {
    "newKey": "Texto en español"
  }
}
```

Repeat for all language files (zh, ja, fr, de).

### 2. Use in Component

```tsx
const t = useTranslations('myNamespace');
return <div>{t('newKey')}</div>;
```

## Adding a New Language

### 1. Add Locale to Configuration

Edit `i18n.ts`:
```typescript
export const locales = ['en', 'es', 'zh', 'ja', 'fr', 'de', 'pt'] as const;

export const localeLabels: Record<Locale, string> = {
  // ... existing languages
  pt: 'Português',
};
```

### 2. Create Translation File

Create `web/messages/pt.json` with all translation keys translated to Portuguese.

### 3. Test

Build and test the application to ensure the new language works correctly.

## Best Practices

### 1. Namespace Organization

Group related translations together:
```json
{
  "auth": { /* authentication strings */ },
  "dashboard": { /* dashboard strings */ },
  "errors": { /* error messages */ }
}
```

### 2. Avoid Hardcoded Strings

Always use translation keys for user-facing text:
```tsx
// ❌ Bad
<button>Submit</button>

// ✅ Good
<button>{t('common.submit')}</button>
```

### 3. Provide Context

Use descriptive keys that provide context:
```json
{
  "form": {
    "submitButton": "Submit",
    "cancelButton": "Cancel",
    "saveButton": "Save Changes"
  }
}
```

### 4. Keep Translations Consistent

Use the same translations for repeated concepts across the application.

### 5. Test with Native Speakers

Before launching, have native speakers review translations for accuracy and cultural appropriateness.

## Troubleshooting

### Translations Not Showing

1. Check that the translation key exists in all language files
2. Verify the namespace is correct in `useTranslations('namespace')`
3. Ensure the component is wrapped in `NextIntlClientProvider`
4. Check browser console for errors

### Language Not Switching

1. Verify cookie is being set (check browser DevTools > Application > Cookies)
2. Check middleware is running (add console.log in middleware.ts)
3. Ensure locale is in the `locales` array in `i18n.ts`

### Build Errors

1. Ensure all translation files have the same structure
2. Check for missing or extra keys between language files
3. Verify imports are correct

## Performance Considerations

- Translation files are loaded on-demand based on the user's locale
- Messages are tree-shaken in production builds
- Static pages are pre-rendered for the default locale (en)
- Dynamic pages render with the user's selected locale

## Future Enhancements

Potential improvements for future versions:

1. **RTL Support** - Add support for right-to-left languages (Arabic, Hebrew)
2. **Dynamic Loading** - Load translations from a CMS or API
3. **Translation Management** - Use a service like Crowdin or Lokalise
4. **Pluralization** - Add support for pluralization rules
5. **Variables** - Support for variables in translations
6. **Nested Translations** - Support for nested namespace access

## Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Next.js Internationalization](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [MDN Intl API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
