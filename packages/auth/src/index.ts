import type { DefaultSession } from "next-auth";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "@forevent/db";

export type { Session } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      createdAt: Date;
      emailVerified: boolean;
      passwordVerified: boolean;
    } & DefaultSession["user"];
  }
}

async function verifyPassword(hash: string, plaintext: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plaintext, hash);
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),

    CredentialsProvider({
      name: "credentials",
      type: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email",    placeholder: "example@example.com" },
        password: { label: "Password", type: "password" },
        internal: { label: "Internal", type: "checkbox", hidden: true },
      },
      async authorize({ email, password, internal }) {
        if (internal === true || internal === "true") {
          const internalUser = await prisma.internalUser.findUnique({
            where: { email: email as string, discharged: true },
            select: {
              id: true, createdAt: true, name: true, image: true,
              email: true, emailVerified: true, password: true, passwordVerified: true,
            },
          });
          if (!internalUser) return null;

          const ok = await verifyPassword(internalUser.password, password as string);
          if (!ok) return null;

          return {
            id: internalUser.id,
            createdAt: internalUser.createdAt,
            name: internalUser.name,
            image: internalUser.image,
            email: internalUser.email,
            emailVerified: internalUser.emailVerified,
            passwordVerified: internalUser.passwordVerified,
          };
        }

        const MAX_ATTEMPTS = 5;
        const LOCK_MS = 15 * 60 * 1000; // 15 min

        // Regular user — includes rate-limiting fields
        const user = await prisma.user.findUnique({
          where: { email: email as string, discharged: true },
          select: {
            id: true, createdAt: true, name: true, image: true,
            email: true, emailVerified: true, password: true, passwordVerified: true,
            loginAttempts: true, lockUntil: true,
          },
        });
        if (!user) return null;

        // Temporarily locked after too many failed attempts
        if (user.lockUntil && user.lockUntil > new Date()) {
          return null;
        }

        const ok = await verifyPassword(user.password, password as string);

        if (!ok) {
          const attempts = (user.loginAttempts ?? 0) + 1;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              loginAttempts: attempts,
              lockUntil: attempts >= MAX_ATTEMPTS
                ? new Date(Date.now() + LOCK_MS)
                : null,
            },
          });
          return null;
        }

        // Reset on successful login
        await prisma.user.update({
          where: { id: user.id },
          data: { loginAttempts: 0, lockUntil: null },
        });

        return {
          id: user.id,
          createdAt: user.createdAt,
          name: user.name,
          image: user.image,
          email: user.email,
          emailVerified: user.emailVerified,
          passwordVerified: user.passwordVerified,
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
    error:  "/login",
    newUser: "/register",
  },

  callbacks: {
    /**
     * Called on every sign-in. For Google, we upsert the user into our DB
     * so the rest of the app can reference them normally.
     */
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        const existing = await prisma.user.findUnique({
          where: { email: profile.email },
          select: { id: true },
        });

        if (!existing) {
          await prisma.user.create({
            data: {
              email: profile.email,
              name: profile.name ?? profile.email.split("@")[0]!,
              image: (profile as { picture?: string }).picture
                ?? "https://d1uydgebs34vim.cloudfront.net/static/default.jpg",
              password: "",        // Google users authenticate via OAuth, not password
              emailVerified: true, // email is verified by Google
              passwordVerified: false,
              locale: "es-AR",
              zoneinfo: "America/Argentina/Buenos_Aires",
            },
          });
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      // Credentials sign-in: user object has our custom fields
      if (user) {
        token.id            = user.id;
        token.createdAt     = (user as { createdAt?: Date }).createdAt;
        token.emailVerified = (user as { emailVerified?: boolean }).emailVerified ?? false;
        token.passwordVerified = (user as { passwordVerified?: boolean }).passwordVerified ?? false;
      }

      // Google sign-in: look up our DB user to get the id
      if (account?.provider === "google" && token.email && !token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, createdAt: true, emailVerified: true, passwordVerified: true },
        });
        if (dbUser) {
          token.id               = dbUser.id;
          token.createdAt        = dbUser.createdAt;
          token.emailVerified    = dbUser.emailVerified;
          token.passwordVerified = dbUser.passwordVerified;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token.id) {
        session.user.id            = token.id as string;
        session.user.createdAt     = token.createdAt as Date;
        session.user.emailVerified = token.emailVerified as boolean ?? false;
        session.user.passwordVerified = token.passwordVerified as boolean ?? false;
      }
      return session;
    },

    async authorized({ auth: session }) {
      return !!session?.user;
    },
  },

  session: { strategy: "jwt" },
});
