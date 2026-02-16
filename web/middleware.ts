import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, locales, type Locale } from "./i18n";
import { getToken } from "next-auth/jwt";

// Build CSP directives
function buildCSP(nonce?: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  
  // In development, allow unsafe-eval and unsafe-inline for HMR
  // In production, use nonce-based CSP
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com"
    : nonce
    ? `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com`
    : "script-src 'self' https://www.googletagmanager.com";

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://ipfs.io https://*.ipfs.io https://gateway.pinata.cloud https://*.mypinata.cloud https://cloudflare-ipfs.com https://dweb.link https://www.googletagmanager.com",
    "font-src 'self' data:",
    "connect-src 'self' https://*.infura.io https://*.alchemy.com https://*.quicknode.pro https://rpc.ankr.com https://cloudflare-eth.com https://polygon-rpc.com https://rpc-mainnet.matic.network https://rpc-mainnet.maticvigil.com https://mainnet.base.org https://base.llamarpc.com https://arb1.arbitrum.io https://arbitrum.llamarpc.com https://mainnet.optimism.io https://optimism.llamarpc.com https://ipfs.io https://gateway.pinata.cloud https://www.google-analytics.com https://stats.g.doubleclick.net",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ].join('; ');
}

// List of paths that require authentication
const protectedPaths = [
  '/profile',
  // API endpoints that should not be public
  '/api/app/bind',
  '/api/app/bind-many',
  '/api/app/one-shot',
];

function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some(path => pathname.startsWith(path));
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
  // Check if authentication is required
  if (isProtectedPath(pathname)) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const signInUrl = new URL('/signin', req.url);
      signInUrl.searchParams.set('callbackUrl', req.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Get locale from cookie or Accept-Language header
  const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value;
  const acceptLanguage = req.headers.get("accept-language");

  let locale: Locale = defaultLocale;

  // Type-safe locale validation
  const isValidLocale = (value: string): value is Locale => {
    return locales.includes(value as Locale);
  };

  if (cookieLocale && isValidLocale(cookieLocale)) {
    locale = cookieLocale;
  } else if (acceptLanguage) {
    // Parse Accept-Language header to find best match
    const languages = acceptLanguage.split(",").map((lang) => {
      const [code] = lang.trim().split(";");
      return code.split("-")[0]; // Get language code without region
    });

    const matchedLocale = languages.find((lang) => isValidLocale(lang));
    if (matchedLocale) {
      locale = matchedLocale;
    }
  }

  // Set locale in request headers for next-intl
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-next-intl-locale", locale);

  // Generate CSP nonce for production
  const isDev = process.env.NODE_ENV === 'development';
  let nonce = '';
  
  if (!isDev) {
    // Generate a unique nonce for this request
    nonce = Buffer.from(crypto.randomUUID()).toString('base64');
    requestHeaders.set('x-nonce', nonce);
  }

  // Create response with updated headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Set locale cookie if not already set
  if (!cookieLocale || cookieLocale !== locale) {
    response.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 31536000, // 1 year
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  // Set CSP header with nonce
  const csp = buildCSP(nonce || undefined);
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  // Run middleware on all pages for CSP and locale detection
  matcher: [
    // All routes except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)",
  ],
};
