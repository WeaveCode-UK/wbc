import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@wbc/db';

// Auth 2.0: This file will be completely replaced in F10.E02.
// Temporary minimal version to compile after Tenant schema refactor.

const nextAuth = NextAuth({
  providers: [
    Credentials({
      id: 'otp',
      name: 'OTP',
      credentials: {
        phone: { label: 'Phone', type: 'text' },
        code: { label: 'Code', type: 'text' },
      },
      async authorize(credentials) {
        const phone = credentials?.phone as string | undefined;
        const code = credentials?.code as string | undefined;

        if (!phone || !code) return null;

        // OTP verification will be replaced by Auth.js + Google/Credentials in F10.E02
        // For now, find tenant member by phone to keep compile working
        const member = await prisma.tenantMember.findFirst({
          where: { phone, isActive: true },
          include: { tenant: true, account: true },
        });

        if (!member) return null;

        return {
          id: member.account.id,
          name: member.account.name,
          email: member.account.email,
        };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Find tenant member for JWT claims
        const member = await prisma.tenantMember.findFirst({
          where: { accountId: user.id, isActive: true },
          include: { tenant: { include: { subscription: true } } },
        });
        if (member) {
          token.tid = member.tenantId;
          token.role = member.role;
          token.plan = member.tenant.subscription?.plan ?? 'ESSENTIAL';
          token.locale = member.tenant.locale;
          token.timezone = member.tenant.timezone;
          token.currency = member.tenant.currency;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        (session as unknown as Record<string, unknown>).tenant = {
          tenantId: token.tid,
          userId: token.sub,
          role: token.role,
          plan: token.plan,
          locale: token.locale,
          timezone: token.timezone,
          currency: token.currency,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.AUTH_SECRET,
});

export const handlers = nextAuth.handlers;
export const signIn = nextAuth.signIn;
export const signOut = nextAuth.signOut;
export const auth = nextAuth.auth;
