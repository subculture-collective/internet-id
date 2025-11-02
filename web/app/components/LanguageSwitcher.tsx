"use client";

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { locales, localeLabels, type Locale } from '../../i18n';
import { useState, useTransition } from 'react';

export default function LanguageSwitcher() {
  const t = useTranslations('languageSwitcher');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  function handleLanguageChange(newLocale: Locale) {
    setIsOpen(false);
    
    startTransition(() => {
      // Set cookie for locale persistence
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      
      // Refresh the page to apply the new locale
      router.refresh();
    });
  }

  return (
    <div className="language-switcher" style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="language-button"
        aria-label={t('selectLanguage')}
        aria-expanded={isOpen}
        aria-haspopup="true"
        disabled={isPending}
        style={{
          padding: '8px 16px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          background: 'white',
          cursor: isPending ? 'wait' : 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span role="img" aria-label="Globe">🌐</span>
        <span>{localeLabels[locale]}</span>
        <span style={{ fontSize: '10px' }}>{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div
          className="language-dropdown"
          role="menu"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            minWidth: '150px',
            zIndex: 1000,
          }}
        >
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleLanguageChange(loc)}
              className={`language-option ${loc === locale ? 'active' : ''}`}
              role="menuitem"
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 16px',
                border: 'none',
                background: loc === locale ? '#f0f0f0' : 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: loc === locale ? 'bold' : 'normal',
              }}
              onMouseEnter={(e) => {
                if (loc !== locale) {
                  e.currentTarget.style.background = '#f8f8f8';
                }
              }}
              onMouseLeave={(e) => {
                if (loc !== locale) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {localeLabels[loc]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
