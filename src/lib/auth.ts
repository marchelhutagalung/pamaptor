import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
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
      }

      // Always re-fetch from DB so selfieUrl / name / role stay in sync
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { selfieUrl: true, name: true, role: true },
        });
        if (dbUser) {
          token.selfieUrl = dbUser.selfieUrl ?? undefined;
          token.name = dbUser.name;
          token.role = dbUser.role;
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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

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
