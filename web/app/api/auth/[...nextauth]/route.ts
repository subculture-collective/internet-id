import NextAuth, { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
// Providers – start with GitHub and add more as needed. Twitter/X OAuth 2 requires
// elevated access; placeholder shown for structure.
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
// import Twitter from "next-auth/providers/twitter";

const prisma = new PrismaClient();

// Diagnostics: surface common misconfig quickly during local dev
if (process.env.NODE_ENV !== "production") {
  const missing: string[] = [];
  if (!process.env.NEXTAUTH_URL) missing.push("NEXTAUTH_URL");
  if (!process.env.NEXTAUTH_SECRET && !process.env.AUTH_SECRET)
    missing.push("NEXTAUTH_SECRET|AUTH_SECRET");
  if (!(process.env.GOOGLE_ID || process.env.GOOGLE_CLIENT_ID))
    missing.push("GOOGLE_ID|GOOGLE_CLIENT_ID");
  if (!(process.env.GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET))
    missing.push("GOOGLE_SECRET|GOOGLE_CLIENT_SECRET");
  if (missing.length) {
    console.warn("[next-auth] Missing env:", missing.join(", "));
  } else {
    console.log("[next-auth] Env OK: google + core secrets present");
  }
}

// Build providers conditionally so misconfigured providers don't cause redirects
const providers: any[] = [];
const GITHUB_ID = process.env.GITHUB_ID || process.env.GITHUB_CLIENT_ID;
const GITHUB_SECRET =
  process.env.GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET;
if (GITHUB_ID && GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: GITHUB_ID,
      clientSecret: GITHUB_SECRET,
    })
  );
} else {
  console.warn(
    "[next-auth] GitHub provider not configured (GITHUB_ID/SECRET missing)"
  );
}
const GOOGLE_ID = process.env.GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const GOOGLE_SECRET =
  process.env.GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
if (GOOGLE_ID && GOOGLE_SECRET) {
  const scopes =
    process.env.GOOGLE_SCOPES ||
    "openid email profile https://www.googleapis.com/auth/youtube.readonly";
  providers.push(
    Google({
      clientId: GOOGLE_ID,
      clientSecret: GOOGLE_SECRET,
      authorization: {
        params: {
          scope: scopes,
          // Request refresh token for server-side YouTube API usage
          access_type: "offline",
          prompt: "consent",
        },
      },
    })
  );
} else {
  console.warn(
    "[next-auth] Google provider not configured (GOOGLE_ID/SECRET missing)"
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "database" },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV !== "production",
  providers,
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allow relative callback URLs
      if (url.startsWith("/")) {
        // If redirecting back to signin/register/home, send to profile instead
        if (
          url === "/" ||
          url.startsWith("/signin") ||
          url.startsWith("/register")
        ) {
          return `${baseUrl}/profile`;
        }
        return `${baseUrl}${url}`;
      }
      // Allow same-origin absolute URLs
      if (url.startsWith(baseUrl)) {
        try {
          const u = new URL(url);
          if (["", "/", "/signin", "/register"].includes(u.pathname)) {
            return `${baseUrl}/profile`;
          }
        } catch {}
        return url;
      }
      // Fallback to profile page
      return `${baseUrl}/profile`;
    },
    async session({ session, user }) {
      if (session?.user) {
        (session.user as any).id = user.id;
      }
      return session;
    },
    async signIn({ account, profile }) {
      // Optionally capture platform username/url on Account model for later matching
      // (requires adding those fields – already present in schema)
      return true;
    },
  },
  logger: {
    error(code, metadata) {
      console.error("[next-auth] error:", code, metadata);
    },
    warn(code) {
      console.warn("[next-auth] warn:", code);
    },
    debug(code, metadata) {
      // Useful during local debugging
      if (process.env.NODE_ENV !== "production") {
        console.log("[next-auth] debug:", code, metadata);
      }
    },
  },
  events: {
    async linkAccount({ user, account, profile }: any) {
      // Enrich Account with username/url where providers expose them
      try {
        if (!account?.provider || !account?.providerAccountId) return;
        const data: any = {};
        if (account.provider === "github" && profile) {
          if (profile.login) data.username = profile.login;
          if (profile.html_url) data.url = profile.html_url;
        }
        // For Google, generic profile lacks channel info; leave blank
        if (Object.keys(data).length > 0) {
          await prisma.account.update({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            data,
          });
        }
      } catch (e) {
        console.error("linkAccount enrichment failed", e);
      }
    },
  },
  pages: {
    signIn: "/signin",
    // Send new users to profile to avoid looping back to register
    newUser: "/profile",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
