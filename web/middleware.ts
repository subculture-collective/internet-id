import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/signin",
  },
});

export const config = {
  // Protect most pages by default, excluding public/auth and Next.js internals.
  // Unauthenticated users will be redirected to pages.signIn ("/signin").
  matcher: [
    // All app routes except: api/*, next internals, static files, and public auth pages

    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|signin|register).*)",

    // Additionally, enforce auth on specific API endpoints that should not be public
    "/api/app/bind",
    "/api/app/bind-many",
    "/api/app/one-shot",
  ],
};
