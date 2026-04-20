import { z } from "zod";

const baseEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
});

// Auth secret rejects known weak/placeholder patterns to prevent dev secrets
// from accidentally being deployed (ACH-027).
const authSecretSchema = z
  .string()
  .min(
    32,
    "AUTH_SECRET must be at least 32 characters (use `openssl rand -base64 48`)",
  )
  .refine(
    (v) => !/(change|secret|wbc.?dev|placeholder|generate)/i.test(v),
    "AUTH_SECRET contains a known weak/placeholder pattern (change/secret/wbc-dev/placeholder/generate)",
  );

const webEnvSchema = baseEnvSchema.extend({
  AUTH_SECRET: authSecretSchema,
  AUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

// External integration credentials: optional at parse time so dev/test can run
// without configuring every external service, but required in production via
// `requireInProduction` below (ACH-012).
const apiEnvSchema = baseEnvSchema.extend({
  SENTRY_DSN: z.string().optional(),
  WHATSAPP_API_TOKEN: z.string().min(1).optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
  WHATSAPP_APP_SECRET: z.string().min(1).optional(),
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
});

const workerEnvSchema = baseEnvSchema.extend({
  DEEPSEEK_API_KEY: z.string().min(1).optional(),
  WHATSAPP_API_TOKEN: z.string().min(1).optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
  WHATSAPP_APP_SECRET: z.string().min(1).optional(),
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
});

export type BaseEnv = z.infer<typeof baseEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;
export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WorkerEnv = z.infer<typeof workerEnvSchema>;

const REQUIRED_IN_PRODUCTION: Record<"web" | "api" | "worker", string[]> = {
  web: ["AUTH_SECRET", "AUTH_URL"],
  api: [
    "WHATSAPP_API_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_APP_SECRET",
    "MERCADOPAGO_ACCESS_TOKEN",
    "RESEND_API_KEY",
  ],
  worker: [
    "DEEPSEEK_API_KEY",
    "WHATSAPP_API_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_APP_SECRET",
    "MERCADOPAGO_ACCESS_TOKEN",
    "RESEND_API_KEY",
  ],
};

export function validateEnv(app: "web" | "api" | "worker"): void {
  const schema =
    app === "web"
      ? webEnvSchema
      : app === "api"
        ? apiEnvSchema
        : workerEnvSchema;
  const result = schema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Missing or invalid environment variables (${app}):\n${errors}`,
    );
  }

  if (result.data.NODE_ENV === "production") {
    const env = result.data as Record<string, unknown>;
    const missing = REQUIRED_IN_PRODUCTION[app].filter(
      (key) =>
        !env[key] ||
        (typeof env[key] === "string" && (env[key] as string).trim() === ""),
    );
    if (missing.length > 0) {
      throw new Error(
        `Required environment variables missing in production (${app}):\n` +
          missing
            .map((k) => `  ${k}: must be set and non-empty in production`)
            .join("\n"),
      );
    }
  }
}

/**
 * Reads a required env var. Returns the value or throws with a clear message.
 * Use in adapters that need a credential at instantiation time, after the
 * application has called `validateEnv` at startup.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Required environment variable ${name} is missing or empty. ` +
        `If running in development, set it in .env. If running in production, ` +
        `validateEnv should have caught this at startup.`,
    );
  }
  return value;
}
