import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, locales, type Locale } from './i18n';

// Simple middleware that handles both auth and locale detection
export default withAuth(
  function middleware(req: NextRequest) {
    // Get locale from cookie or Accept-Language header
    const cookieLocale = req.cookies.get('NEXT_LOCALE')?.value;
    const acceptLanguage = req.headers.get('accept-language');
    
    let locale: Locale = defaultLocale;
    
    if (cookieLocale && locales.includes(cookieLocale as any)) {
      locale = cookieLocale as Locale;
    } else if (acceptLanguage) {
      // Parse Accept-Language header to find best match
      const languages = acceptLanguage
        .split(',')
        .map((lang) => {
          const [code] = lang.trim().split(';');
          return code.split('-')[0]; // Get language code without region
        });
      
      const matchedLocale = languages.find((lang) => locales.includes(lang as any));
      if (matchedLocale) {
        locale = matchedLocale as Locale;
      }
    }
    
    // Set locale in request headers for next-intl
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-next-intl-locale', locale);
    
    // Create response with updated headers
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
    // Set locale cookie if not already set
    if (!cookieLocale || cookieLocale !== locale) {
      response.cookies.set('NEXT_LOCALE', locale, {
        path: '/',
        maxAge: 31536000, // 1 year
        sameSite: 'lax',
      });
    }
    
    return response;
  },
  {
    pages: {
      signIn: "/signin",
    },
  }
);

export const config = {
  // Protect most pages by default, excluding public/auth and Next.js internals.
  matcher: [
    // All app routes except: api/*, next internals, static files, public auth pages, verify page, and dashboard
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|signin|register|verify|dashboard).*)",

    // Additionally, enforce auth on specific API endpoints that should not be public
    "/api/app/bind",
    "/api/app/bind-many",
    "/api/app/one-shot",
  ],
};
