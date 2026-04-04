import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const publicPaths = ['/login', '/register', '/reset-password', '/verify-email', '/invite', '/api/auth'];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files and API routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const token = req.auth;

  // Not authenticated -> redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const user = token.user as Record<string, unknown> | undefined;

  // Needs onboarding -> redirect to onboarding
  if (user?.needsOnboarding && pathname !== '/onboarding') {
    return NextResponse.redirect(new URL('/onboarding', req.url));
  }

  // Needs workspace selection -> redirect to workspace selector
  if (user?.needsWorkspaceSelection && pathname !== '/workspace') {
    return NextResponse.redirect(new URL('/workspace', req.url));
  }

  // On auth pages while authenticated -> redirect to dashboard
  if (pathname === '/login' || pathname === '/register') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
