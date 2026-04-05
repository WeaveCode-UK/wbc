import { z } from 'zod';

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
});

const webEnvSchema = baseEnvSchema.extend({
  AUTH_SECRET: z.string().min(16),
  AUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

const apiEnvSchema = baseEnvSchema.extend({
  SENTRY_DSN: z.string().optional(),
});

const workerEnvSchema = baseEnvSchema;

export type BaseEnv = z.infer<typeof baseEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;
export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WorkerEnv = z.infer<typeof workerEnvSchema>;

export function validateEnv(app: 'web' | 'api' | 'worker'): void {
  const schema = app === 'web' ? webEnvSchema : app === 'api' ? apiEnvSchema : workerEnvSchema;
  const result = schema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Missing or invalid environment variables (${app}):\n${errors}`);
  }
}
