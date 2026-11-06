import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/enums";
import { generatedAvatarUrl } from "@/lib/generated-avatar";
import { isSessionVersionStale } from "@/lib/session-revocation";
import bcrypt from "bcrypt";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  // Trust the request host (and x-forwarded-*) so the app works behind a
  // proxy/tunnel as well as on localhost and Vercel. Needed because an empty
  // AUTH_URL ("") is not nullish and would otherwise flip this to false.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Credentials sign-up stores emails lower-cased, so normalize here too
        // (otherwise "Pepe@Mail.com " would never match an existing account).
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.username,
          email: user.email,
          image: user.image ?? generatedAvatarUrl(user.username ?? user.email),
          role: user.role,
          emailConfirmed: Boolean(user.emailVerified),
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.username = user.name;
        token.picture =
          user.image ?? generatedAvatarUrl(user.name ?? user.email);
        // Cached for UI hints only — authorization always re-reads the role
        // from the database so a promotion takes effect without re-login.
        token.role = user.role;
        token.emailConfirmed = Boolean(user.emailConfirmed);
        token.sessionVersion = user.sessionVersion ?? 0;
      }

      const userId = (token.id ?? token.sub) as string | undefined;
      if (!userId) return token;

      // One primary-key read per request. It covers both the identity refresh
      // that Settings triggers through useSession().update() and session
      // revocation: a password change/reset bumps User.sessionVersion, so any
      // JWT minted before it (stolen or from another device) is rejected and
      // Auth.js clears the cookie when this callback returns null.
      const fresh = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          username: true,
          email: true,
          image: true,
          role: true,
          emailVerified: true,
          sessionVersion: true,
        },
      });
      if (!fresh) return null;

      if (user) {
        // Sign-in through an adapter may not carry the custom field; adopt the
        // version currently in the database instead of trusting the default.
        token.sessionVersion = fresh.sessionVersion;
      } else if (
        isSessionVersionStale(
          token.sessionVersion as number | undefined,
          fresh.sessionVersion,
        )
      ) {
        return null;
      }

      // Re-read identity fields so the cached session never points at a stale
      // /u/<old-handle>. Normal requests keep only the version check above.
      if (trigger === "update") {
        token.id = userId;
        token.username = fresh.username;
        token.email = fresh.email;
        token.picture =
          fresh.image ?? generatedAvatarUrl(fresh.username ?? userId);
        token.role = fresh.role;
        token.emailConfirmed = Boolean(fresh.emailVerified);
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id ?? token.sub) as string;
        session.user.image = token.picture as string | undefined;
        session.user.name =
          (token.username as string | undefined) ?? session.user.name;
        session.user.role = (token.role as Role | undefined) ?? "USER";
        session.user.emailConfirmed = Boolean(token.emailConfirmed);
      }
      return session;
    },
  },
});