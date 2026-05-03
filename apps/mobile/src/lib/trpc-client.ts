import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import * as SecureStore from "expo-secure-store";
import type { AppRouter } from "@wbc/api/src/trpc/router";

// F11 follow-up: vanilla tRPC v11 client for the mobile app. We use
// the *vanilla* (no react-query) form because the mobile screens
// already manage their own state via the offline-repos cache; the
// client is just an RPC transport for sync, push registration and
// the sign-in mutation.

const TOKEN_KEY = "wbc.session.token";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export async function getStoredToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function storeToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined);
}

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_BASE_URL}/api/trpc`,
      transformer: superjson,
      headers: async () => {
        const token = await getStoredToken();
        return token ? { authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});

// F11.E27 helper: real `send` for the offline sync queue. The
// generic shape `(operation, payload) => Promise<void>` matches the
// SendMutation contract in lib/sync.ts. Operation strings follow
// `<router>.<procedure>`; for now the queue only enqueues
// `sales.create` and `clients.create` so we route those explicitly
// — additions are a one-liner each.
type AnyRecord = Record<string, unknown>;

export const sendMutation = async (
  operation: string,
  payload: unknown,
): Promise<void> => {
  const data = (payload ?? {}) as AnyRecord;
  switch (operation) {
    case "clients.create":
      await trpc.clients.create.mutate(data as never);
      return;
    case "sales.create":
      await trpc.sales.create.mutate(data as never);
      return;
    default:
      throw new Error(`unsupported_operation:${operation}`);
  }
};
