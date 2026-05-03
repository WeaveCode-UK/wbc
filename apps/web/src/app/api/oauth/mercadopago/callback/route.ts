import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  connectMercadoPago,
  MercadoPagoOAuthNotConfiguredError,
} from "@wbc/business/finance/use-cases/connect-mercadopago";
import { withTenant } from "@wbc/shared";

// Bloco 10 do plano: Mercado Pago OAuth callback. MP redireciona aqui
// com `?code=AUTH_CODE` (e opcionalmente `?error=...`). Validamos a
// session, trocamos code por access_token via use-case, e redirecionamos
// pra /settings/pix com flag de status na query.

export const dynamic = "force-dynamic";

function buildRedirectUri(req: Request): string {
  // Reconstrói exatamente o que mandamos no `state` original — MP exige
  // que `redirect_uri` no token-exchange seja idêntico ao do authorize.
  const url = new URL(req.url);
  return `${url.origin}/api/oauth/mercadopago/callback`;
}

function statusRedirect(origin: string, status: string): NextResponse {
  return NextResponse.redirect(`${origin}/settings/pix?mp=${status}`);
}

export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return statusRedirect(
      url.origin,
      `error&detail=${encodeURIComponent(error)}`,
    );
  }
  if (!code) {
    return statusRedirect(url.origin, "missing_code");
  }

  const session = await auth();
  const tenantId = (session?.user as { tenantId?: string } | undefined)
    ?.tenantId;
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!tenantId) {
    return statusRedirect(url.origin, "unauthenticated");
  }
  if (role !== "ADMIN") {
    return statusRedirect(url.origin, "forbidden");
  }

  try {
    await withTenant(tenantId, async () => {
      await connectMercadoPago(tenantId, code, buildRedirectUri(req));
    });
    return statusRedirect(url.origin, "connected");
  } catch (err) {
    if (err instanceof MercadoPagoOAuthNotConfiguredError) {
      return statusRedirect(url.origin, "not_configured");
    }
    return statusRedirect(
      url.origin,
      `error&detail=${encodeURIComponent(
        err instanceof Error ? err.message : String(err),
      )}`,
    );
  }
}
