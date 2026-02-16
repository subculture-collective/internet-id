import type { Metadata, Viewport } from "next";
import "./globals.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { WebVitals } from "./web-vitals";
import Footer from "./components/Footer";
import CookieConsent from "./components/CookieConsent";
import GoogleAnalytics from "./components/GoogleAnalytics";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import LanguageSwitcher from "./components/LanguageSwitcher";
import { locales } from '../i18n';
import { getLocaleFromHeaders } from '../lib/locale';
import { getNonce } from '../lib/csp';

const siteUrl = process.env.NEXT_PUBLIC_SITE_BASE || "https://internet-id.io";

// Organization structured data - defined outside component to avoid recreation on every render
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Internet-ID",
  description:
    "Blockchain-based content verification and authentication platform",
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  sameAs: [
    "https://github.com/subculture-collective/internet-id",
    "https://twitter.com/subcultureio",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Technical Support",
    email: "support@subculture.io",
  },
};

// Website structured data - defined outside component to avoid recreation on every render
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Internet-ID",
  url: siteUrl,
  description:
    "Anchor and verify human-created content on blockchain with cryptographic proof",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/verify?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export const metadata: Metadata = {
  title: {
    default: "Internet-ID - Verify Human-Created Content On-Chain",
    template: "%s | Internet-ID",
  },
  description:
    "Anchor and verify human-created content on blockchain. Protect your original work with cryptographic proof of authenticity and ownership.",
  keywords: [
    "content verification",
    "blockchain authentication",
    "digital provenance",
    "content authenticity",
    "creator verification",
    "on-chain content",
    "IPFS",
    "Web3",
    "content protection",
    "human-created content",
  ],
  authors: [{ name: "Subculture Collective" }],
  creator: "Subculture Collective",
  publisher: "Subculture Collective",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Internet-ID",
    title: "Internet-ID - Verify Human-Created Content On-Chain",
    description:
      "Anchor and verify human-created content on blockchain. Protect your original work with cryptographic proof of authenticity and ownership.",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Internet-ID - Content Verification Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Internet-ID - Verify Human-Created Content On-Chain",
    description:
      "Anchor and verify human-created content on blockchain. Protect your original work with cryptographic proof of authenticity.",
    images: [`${siteUrl}/twitter-image.png`],
    creator: "@subcultureio",
    site: "@subcultureio",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Internet-ID",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#000000",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocaleFromHeaders();
  const messages = await getMessages();
  const nonce = await getNonce();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://ipfs.io" />
        <link rel="dns-prefetch" href="https://ipfs.io" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        
        {/* Add hreflang tags for SEO */}
        {locales.map((loc) => (
          <link
            key={loc}
            rel="alternate"
            hrefLang={loc}
            href={siteUrl}
          />
        ))}
        <link rel="alternate" hrefLang="x-default" href={siteUrl} />
      </head>
      <body suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          {/* Skip to main content link for keyboard navigation */}
          <a 
            href="#main-content" 
            className="skip-to-content"
            aria-label="Skip to main content"
          >
            Skip to main content
          </a>
          
          {/* Language Switcher */}
          <div className="language-switcher-wrapper">
            <LanguageSwitcher />
          </div>
          
          <WebVitals />
          <GoogleAnalytics nonce={nonce} />
          <ErrorBoundary>
            {children}
            <Footer />
          </ErrorBoundary>
          <CookieConsent />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
