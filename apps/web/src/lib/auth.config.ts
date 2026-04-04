import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import type { NextAuthConfig } from 'next-auth';
import { PrismaAccountRepository } from '@wbc/business/auth/adapters/prisma-account.repository';
import { PrismaOAuthAccountRepository } from '@wbc/business/auth/adapters/prisma-oauth-account.repository';
import { PrismaTenantMemberRepository } from '@wbc/business/auth/adapters/prisma-tenant-member.repository';
import { BcryptPasswordHasher } from '@wbc/business/auth/adapters/bcrypt-password-hasher.adapter';
import { AuthenticateWithCredentials } from '@wbc/business/auth/use-cases/authenticate-with-credentials.use-case';
import { AuthenticateWithOAuth } from '@wbc/business/auth/use-cases/authenticate-with-oauth.use-case';

const accountRepo = new PrismaAccountRepository();
const oauthRepo = new PrismaOAuthAccountRepository();
const memberRepo = new PrismaTenantMemberRepository();
const passwordHasher = new BcryptPasswordHasher();
const authWithCredentials = new AuthenticateWithCredentials(accountRepo, passwordHasher);
const authWithOAuth = new AuthenticateWithOAuth(accountRepo, oauthRepo);

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const account = await authWithCredentials.execute({
            email: credentials.email as string,
            password: credentials.password as string,
          });
          return { id: account.id, email: account.email, name: account.name };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account: oauthAccount }) {
      if (oauthAccount?.provider === 'google' && user.email && user.name) {
        await authWithOAuth.execute({
          email: user.email,
          name: user.name,
          provider: oauthAccount.provider,
          providerAccountId: oauthAccount.providerAccountId,
          accessToken: oauthAccount.access_token ?? null,
          refreshToken: oauthAccount.refresh_token ?? null,
          expiresAt: oauthAccount.expires_at ?? null,
          tokenType: oauthAccount.token_type ?? null,
          scope: oauthAccount.scope ?? null,
          idToken: oauthAccount.id_token ?? null,
        });
      }
      return true;
    },
    async jwt({ token, user, trigger, session: updateSession }) {
      // On initial login — set accountId
      if (user) {
        const dbAccount = await accountRepo.findByEmail(user.email!);
        if (dbAccount) {
          token.sub = dbAccount.id;
        }
      }

      // Resolve workspace membership
      if (token.sub) {
        const members = await memberRepo.findActiveByAccountId(token.sub);

        if (members.length === 0) {
          token.needsOnboarding = true;
          delete token.tid;
          delete token.mid;
          delete token.role;
          delete token.plan;
        } else if (members.length === 1 && !token.tid) {
          // Auto-select single workspace
          const m = members[0]!;
          token.tid = m.tenantId;
          token.mid = m.id;
          token.role = m.role;
          token.plan = m.plan;
          delete token.needsOnboarding;
          delete token.needsWorkspaceSelection;
        } else if (members.length >= 2 && !token.tid) {
          token.needsWorkspaceSelection = true;
          delete token.needsOnboarding;
        }
      }

      // Handle workspace switch via session update
      if (trigger === 'update' && updateSession?.tenantId && token.sub) {
        const members = await memberRepo.findActiveByAccountId(token.sub);
        const target = members.find((m) => m.tenantId === updateSession.tenantId);
        if (target) {
          token.tid = target.tenantId;
          token.mid = target.id;
          token.role = target.role;
          token.plan = target.plan;
          delete token.needsOnboarding;
          delete token.needsWorkspaceSelection;
        }
      }

      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          accountId: token.sub,
          tenantId: token.tid as string | undefined,
          memberId: token.mid as string | undefined,
          role: token.role as string | undefined,
          plan: token.plan as string | undefined,
          needsOnboarding: token.needsOnboarding as boolean | undefined,
          needsWorkspaceSelection: token.needsWorkspaceSelection as boolean | undefined,
        },
      };
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 15 * 60, // Access token: 15 minutes
  },
  pages: {
    signIn: '/login',
    newUser: '/onboarding',
  },
} satisfies NextAuthConfig;
