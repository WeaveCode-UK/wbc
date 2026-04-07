import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      accountId?: string;
      tenantId?: string;
      memberId?: string;
      role?: string;
      plan?: string;
      needsOnboarding?: boolean;
      needsWorkspaceSelection?: boolean;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub?: string;
    tid?: string;
    mid?: string;
    role?: string;
    plan?: string;
    needsOnboarding?: boolean;
    needsWorkspaceSelection?: boolean;
  }
}
