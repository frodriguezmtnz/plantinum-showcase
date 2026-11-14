import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/enums";
import { generatedAvatarUrl } from "@/lib/generated-avatar";
import { isSessionVersionStale } from "@/lib/session-revocation";
import { verifyTwoFactorLogin } from "@/lib/two-factor";
import bcrypt from "bcrypt";

const googleOAuthConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

class TwoFactorRequiredError extends CredentialsSignin {
  code = "2fa_required";
}

class TwoFactorRateLimitedError extends CredentialsSignin {
  code = "2fa_rate_limited";
}

const credentialsProvider = Credentials({
  name: "credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
    otp: { label: "Authentication code", type: "text" },
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

    if (user.twoFactorEnabled) {
      const otp = (credentials?.otp as string | undefined)?.trim();
      if (!otp) throw new TwoFactorRequiredError();

      const result = await verifyTwoFactorLogin(
        user.id,
        user.twoFactorSecret,
        otp,
      );
      if (result === "rate-limited") throw new TwoFactorRateLimitedError();
      if (result !== "ok") throw new CredentialsSignin();
    }

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
});

const providers: Provider[] = [credentialsProvider];

if (googleOAuthConfigured) {
  providers.push(
    Google({
      // Existing password accounts are not linked by email automatically: the
      // user has to sign in with the password first (then connect Google from
      // Settings if desired). Linking by email would bypass their 2FA.
      allowDangerousEmailAccountLinking: false,
      authorization: { params: { prompt: "select_account" } },
    }),
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  // Trust the request host (and x-forwarded-*) so the app works behind a
  // proxy/tunnel as well as on localhost and Vercel. Needed because an empty
  // AUTH_URL ("") is not nullish and would otherwise flip this to false.
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
    // OAuth users are created without a handle: send them to the onboarding
    // page before they can use the rest of the app.
    newUser: "/welcome",
  },
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || account.provider !== "google") return true;

      const googleProfile = profile as
        | { email?: string | null; email_verified?: boolean }
        | undefined;

      // Google is authoritative for the address: never create a session for an
      // email it has not verified.
      if (googleProfile?.email_verified !== true) {
        return "/login?error=oauth_unverified";
      }

      const email = (googleProfile?.email ?? user?.email ?? "")
        .trim()
        .toLowerCase();

      // Look up both the already-linked account (user.id) and a password
      // account that shares the address. The latter is not linked
      // automatically; it is checked so 2FA cannot be bypassed through the
      // OAuth redirect.
      const or = [
        ...(user?.id ? [{ id: user.id }] : []),
        ...(email ? [{ email }] : []),
      ];
      if (or.length === 0) return true;

      const matches = await prisma.user.findMany({
        where: { OR: or },
        select: { twoFactorEnabled: true },
      });

      // TOTP is not implemented for the OAuth redirect flow yet. Blocking is
      // safer than creating a session that would skip the second factor.
      if (matches.some((match) => match.twoFactorEnabled)) {
        return "/login?error=oauth_2fa";
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
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

      // Always mirror the database identity. This is what makes the first
      // Google sign-in correct: the adapter creates the row with the Google
      // display name, and the handle only exists after /welcome. An incomplete
      // profile therefore has a null username (and a generated avatar) until
      // onboarding finishes.
      token.username = fresh.username;
      token.email = fresh.email;
      token.picture = fresh.username
        ? fresh.image ?? generatedAvatarUrl(fresh.username)
        : generatedAvatarUrl(userId);
      token.role = fresh.role;
      token.emailConfirmed = Boolean(fresh.emailVerified);

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id ?? token.sub) as string;
        session.user.image = token.picture as string | undefined;
        // Keep this nullish on purpose: the header and the onboarding gate use
        // a missing handle to send OAuth users to /welcome.
        session.user.name = (token.username as string | null | undefined) ?? null;
        session.user.role = (token.role as Role | undefined) ?? "USER";
        session.user.emailConfirmed = Boolean(token.emailConfirmed);
      }
      return session;
    },
  },
});