// F11 follow-up: thin Mercado Pago REST wrapper. Plain fetch instead of
// the SDK because (a) we use ~5 endpoints, (b) the SDK pulls a wide
// dependency tree we don't otherwise need, (c) keeping the surface
// flat lets us mock it easily in tests.
//
// All methods require MERCADOPAGO_ACCESS_TOKEN. When missing they
// throw MercadoPagoNotConfiguredError so the caller can surface the
// "configure your access token" message instead of a generic 500.

const BASE_URL = "https://api.mercadopago.com";

export class MercadoPagoNotConfiguredError extends Error {
  constructor() {
    super("MERCADOPAGO_ACCESS_TOKEN not configured");
    this.name = "MercadoPagoNotConfiguredError";
  }
}

export class MercadoPagoApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "MercadoPagoApiError";
  }
}

export interface MpPixPayment {
  id: string;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "cancelled"
    | "refunded"
    | "in_process";
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string;
  expiresAt: string;
}

interface CreatePixInput {
  amount: number;
  description: string;
  txid: string;
  payerEmail?: string;
  payerName?: string;
  /** Hours until the QR expires. Defaults to 24h. */
  expiresInHours?: number;
}

function getToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new MercadoPagoNotConfiguredError();
  }
  return token;
}

async function request<T>(
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");
  if (init.idempotencyKey) {
    headers.set("X-Idempotency-Key", init.idempotencyKey);
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const message =
      typeof body === "object" && body && "message" in body
        ? String((body as { message: unknown }).message)
        : `HTTP ${res.status}`;
    throw new MercadoPagoApiError(res.status, message, body);
  }
  return body as T;
}

/**
 * Create a dynamic PIX charge. Returns the gateway's id (we persist
 * as `Payment.mercadopagoId`) and the QR payload + image. The webhook
 * fires when the customer pays — see sync-mp-payment use-case.
 */
export async function createMpPixPayment(
  input: CreatePixInput,
): Promise<MpPixPayment> {
  const expiresInHours = input.expiresInHours ?? 24;
  const expiresAt = new Date(
    Date.now() + expiresInHours * 60 * 60 * 1000,
  ).toISOString();

  const response = await request<{
    id: number | string;
    status: MpPixPayment["status"];
    point_of_interaction?: {
      transaction_data?: {
        qr_code?: string;
        qr_code_base64?: string;
        ticket_url?: string;
      };
    };
    date_of_expiration?: string;
  }>("/v1/payments", {
    method: "POST",
    idempotencyKey: input.txid,
    body: JSON.stringify({
      transaction_amount: Number(input.amount.toFixed(2)),
      description: input.description,
      payment_method_id: "pix",
      external_reference: input.txid,
      date_of_expiration: expiresAt,
      payer: {
        email: input.payerEmail ?? "no-reply@wbc.weavecode.co.uk",
        first_name: input.payerName ?? "Cliente",
      },
    }),
  });

  const tx = response.point_of_interaction?.transaction_data;
  return {
    id: String(response.id),
    status: response.status,
    qrCode: tx?.qr_code ?? "",
    qrCodeBase64: tx?.qr_code_base64 ?? "",
    ticketUrl: tx?.ticket_url ?? "",
    expiresAt: response.date_of_expiration ?? expiresAt,
  };
}

export async function getMpPayment(id: string): Promise<{
  id: string;
  status: MpPixPayment["status"];
  externalReference: string | null;
  amount: number;
}> {
  const response = await request<{
    id: number | string;
    status: MpPixPayment["status"];
    external_reference?: string | null;
    transaction_amount?: number;
  }>(`/v1/payments/${encodeURIComponent(id)}`, { method: "GET" });
  return {
    id: String(response.id),
    status: response.status,
    externalReference: response.external_reference ?? null,
    amount: Number(response.transaction_amount ?? 0),
  };
}
