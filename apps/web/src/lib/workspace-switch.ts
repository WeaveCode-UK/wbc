import type { QueryClient } from '@tanstack/react-query';

interface SwitchWorkspaceOptions {
  trpcUtils: { auth: { switchWorkspace: { mutate: (input: { tenantId: string }) => Promise<{ tenantId: string; memberId: string; role: string; plan: string }> } } };
  queryClient: QueryClient;
  updateSession: (data: Record<string, unknown>) => Promise<unknown>;
  tenantId: string;
  router: { push: (path: string) => void };
}

export async function switchWorkspace({
  trpcUtils,
  queryClient,
  updateSession,
  tenantId,
  router,
}: SwitchWorkspaceOptions): Promise<void> {
  // 1. Call backend to validate workspace access and get new JWT claims
  const result = await trpcUtils.auth.switchWorkspace.mutate({ tenantId });

  // 2. Clear all React Query cache
  queryClient.clear();

  // 3. Update Auth.js session with new tenantId
  await updateSession({ tenantId: result.tenantId });

  // 4. Redirect to dashboard
  router.push('/dashboard');
}
