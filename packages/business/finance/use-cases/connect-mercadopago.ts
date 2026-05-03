import { prisma } from "@wbc/db";

// Bloco 10 do plano: feature #79 — conexão real com Mercado Pago.
// O fluxo OAuth do MP é authorization-code (servidor-a-servidor):
//
//   1. UI abre `auth.mercadopago.com.br/authorization?client_id=…&redirect_uri=…`
//      em outra aba. Usuária autoriza no MP.
//   2. MP redireciona pra nossa callback route com `?code=AUTH_CODE`.
//   3. Backend troca o code por access_token chamando
//      `POST https://api.mercadopago.com/oauth/token`.
//   4. Salvamos access_token + user_id no tenant.
//
// Erros (token invalido, app não autorizado, etc.) sobem como Error
// com mensagem em PT pra mostrar no toast da UI.

export class MercadoPagoOAuthNotConfiguredError extends Error {
  constructor() {
    super(
      "Mercado Pago OAuth não está configurado: defina MERCADOPAGO_CLIENT_ID e MERCADOPAGO_CLIENT_SECRET",
    );
    this.name = "MercadoPagoOAuthNotConfiguredError";
  }
}

interface MpTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token?: string;
  public_key?: string;
  live_mode?: boolean;
}

const MP_OAUTH_URL = "https://api.mercadopago.com/oauth/token";

export async function connectMercadoPago(
  tenantId: string,
  authCode: string,
  redirectUri: string,
): Promise<{ userId: string; connectedAt: Date }> {
  const clientId = process.env.MERCADOPAGO_CLIENT_ID;
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new MercadoPagoOAuthNotConfiguredError();
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code: authCode,
    redirect_uri: redirectUri,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  let resp: Response;
  try {
    resp = await fetch(MP_OAUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    throw new Error(
      `Falha na autorização Mercado Pago (HTTP ${resp.status}): ${detail || "sem detalhe"}`,
    );
  }

  const data = (await resp.json()) as MpTokenResponse;
  if (!data.access_token || !data.user_id) {
    throw new Error("Resposta do Mercado Pago sem access_token ou user_id");
  }

  const connectedAt = new Date();
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      mercadoPagoAccessToken: data.access_token,
      mercadoPagoUserId: String(data.user_id),
      mercadoPagoConnectedAt: connectedAt,
    },
  });

  return { userId: String(data.user_id), connectedAt };
}

export async function disconnectMercadoPago(tenantId: string): Promise<void> {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      mercadoPagoAccessToken: null,
      mercadoPagoUserId: null,
      mercadoPagoConnectedAt: null,
    },
  });
}

export async function getMercadoPagoStatus(tenantId: string): Promise<{
  connected: boolean;
  userId: string | null;
  connectedAt: Date | null;
}> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      mercadoPagoUserId: true,
      mercadoPagoConnectedAt: true,
      mercadoPagoAccessToken: true,
    },
  });
  return {
    connected: Boolean(tenant?.mercadoPagoAccessToken),
    userId: tenant?.mercadoPagoUserId ?? null,
    connectedAt: tenant?.mercadoPagoConnectedAt ?? null,
  };
}
