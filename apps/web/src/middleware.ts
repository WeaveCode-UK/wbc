import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const publicPaths = ['/login', '/register', '/reset-password', '/verify-email', '/invite', '/api/auth'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (publicPaths.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) return NextResponse.next();

  const token = req.auth;
  if (!token) return NextResponse.redirect(new URL('/login', req.url));

  const user = token.user as Record<string, unknown> | undefined;
  if (user?.needsOnboarding && pathname !== '/onboarding') return NextResponse.redirect(new URL('/onboarding', req.url));
  if (user?.needsWorkspaceSelection && pathname !== '/workspace') return NextResponse.redirect(new URL('/workspace', req.url));
  if (pathname === '/login' || pathname === '/register') return NextResponse.redirect(new URL('/dashboard', req.url));

  return NextResponse.next();
});

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
