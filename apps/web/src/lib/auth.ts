import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@wbc/db';
import { PrismaOtpRepository } from '../../../../packages/business/auth/adapters/prisma-otp-repository';
import { verifyOtp } from '../../../../packages/business/auth/use-cases/verify-otp';

const otpRepository = new PrismaOtpRepository();

export const { handlers, signIn, signOut, auth } = NextAuth({
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

        try {
          await verifyOtp({ phone, code }, otpRepository);
        } catch {
          return null;
        }

        const tenant = await prisma.tenant.findUnique({
          where: { phone },
          include: { subscription: true },
        });

        if (!tenant) return null;

        return {
          id: tenant.id,
          name: tenant.name,
          email: tenant.email,
          image: tenant.avatar,
        };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const tenant = await prisma.tenant.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            role: true,
            plan: true,
            locale: true,
            timezone: true,
            currency: true,
          },
        });
        if (tenant) {
          token.tid = tenant.id;
          token.role = tenant.role;
          token.plan = tenant.plan;
          token.locale = tenant.locale;
          token.timezone = tenant.timezone;
          token.currency = tenant.currency;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        (session as Record<string, unknown>).tenant = {
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
