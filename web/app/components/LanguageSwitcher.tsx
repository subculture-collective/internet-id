"use client";

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { locales, localeLabels, type Locale } from '../../i18n';
import { useState, useTransition } from 'react';
import styles from './LanguageSwitcher.module.css';

export default function LanguageSwitcher() {
  const t = useTranslations('languageSwitcher');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  function handleLanguageChange(newLocale: Locale) {
    setIsOpen(false);
    
    startTransition(() => {
      // Set cookie for locale persistence (secure flag added in production via middleware)
      const cookieString = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      document.cookie = process.env.NODE_ENV === 'production' 
        ? `${cookieString}; Secure` 
        : cookieString;
      
      // Refresh the page to apply the new locale
      router.refresh();
    });
  }

  return (
    <div className={styles.container}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.button}
        aria-label={t('selectLanguage')}
        aria-expanded={isOpen}
        aria-haspopup="true"
        disabled={isPending}
      >
        <span role="img" aria-label="Globe">🌐</span>
        <span>{localeLabels[locale]}</span>
        <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div className={styles.dropdown} role="menu">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleLanguageChange(loc)}
              className={`${styles.option} ${loc === locale ? styles.active : ''}`}
              role="menuitem"
            >
              {localeLabels[loc]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
