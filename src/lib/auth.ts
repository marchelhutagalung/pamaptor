import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyTurnstile } from "@/lib/turnstile";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 day — user must re-login after 24 hours
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, populate token from user object
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.selfieUrl = (user as { selfieUrl?: string }).selfieUrl;
        token.lastFetched = Date.now();
      }

      // Re-fetch from DB only when token data is stale (>5 min old).
      // Keeps name / selfieUrl / role in sync while avoiding a DB hit on
      // every authenticated request — critical at high traffic (5K+ users).
      const FIVE_MINUTES = 5 * 60 * 1000;
      const isStale =
        !token.lastFetched ||
        Date.now() - (token.lastFetched as number) > FIVE_MINUTES;

      if (token.id && isStale) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { selfieUrl: true, name: true, role: true },
        });
        if (dbUser) {
          token.selfieUrl = dbUser.selfieUrl ?? undefined;
          token.name = dbUser.name;
          token.role = dbUser.role;
          token.lastFetched = Date.now();
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "ADMIN";
        session.user.selfieUrl = token.selfieUrl as string | undefined;
      }
      return session;
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
        captchaToken: { label: "Captcha Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        // Verify CAPTCHA before checking credentials
        const captchaValid = await verifyTurnstile(credentials.captchaToken ?? "");
        if (!captchaValid) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.emailVerified) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) return null;

        // Validate selected role matches actual user role
        if (credentials.role && credentials.role !== user.role) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          selfieUrl: user.selfieUrl ?? undefined,
        };
      },
    }),
  ],
};
