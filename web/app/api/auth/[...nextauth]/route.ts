import NextAuth, { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
// Providers – start with GitHub and add more as needed. Twitter/X OAuth 2 requires
// elevated access; placeholder shown for structure.
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
// import Twitter from "next-auth/providers/twitter";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "database" },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    Google({
      clientId: process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_SECRET || "",
    }),
    // Twitter({
    //   clientId: process.env.TWITTER_CLIENT_ID || "",
    //   clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
    //   version: "2.0",
    // }),
  ],
  callbacks: {
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
    newUser: "/register",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
