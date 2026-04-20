/**
 * Composition root (ACH-003 codigo-manutenibilidade, run 2026-04-18_21-45-58).
 *
 * Single place where adapters are instantiated, so every router wires the
 * same repositories with the same Redis/Prisma clients. Previously each
 * tRPC router did `new PrismaXxxRepository()` in its own module scope —
 * which meant (a) swapping a repository required edits in N routers, (b)
 * unit-testing a router forced mocking each class import, and (c) cross-
 * cutting concerns (cache decorators, tracing wrappers) had to be applied
 * per-file.
 *
 * Today this file exposes a `getRepositories()` factory that routers call
 * at import time. Follow-up (ACH-006 parcial): rewrite the Prisma adapters
 * to accept `PrismaClient` via constructor so this factory can inject it
 * and tests can pass a fake — the groundwork (factory + export surface)
 * lives here.
 */

import { prisma, PrismaOutboxRepository } from "@wbc/db";
import { setOutboxPort, assertOutboxReady, type RedisLike } from "@wbc/shared";
import { getRedis } from "./lib/redis";

import { PrismaAccountRepository } from "@wbc/business/auth/adapters/prisma-account.repository";
import { PrismaOAuthAccountRepository } from "@wbc/business/auth/adapters/prisma-oauth-account.repository";
import { PrismaTenantMemberRepository } from "@wbc/business/auth/adapters/prisma-tenant-member.repository";
import { PrismaSessionRepository } from "@wbc/business/auth/adapters/prisma-session.repository";
import { PrismaInviteRepository } from "@wbc/business/auth/adapters/prisma-invite.repository";
import { PrismaSubscriptionRepository } from "@wbc/business/auth/adapters/prisma-subscription-repository";
import { PrismaClientRepository } from "@wbc/business/clients/adapters/prisma-client-repository";
import { PrismaTagRepository } from "@wbc/business/clients/adapters/prisma-tag-repository";
import { PrismaOtpRepository } from "@wbc/business/auth/adapters/prisma-otp-repository";
import { RedisAuthTokenStore } from "@wbc/business/auth/adapters/redis-auth-token-store.adapter";
import { RedisLoginAttemptTracker } from "@wbc/business/auth/adapters/redis-login-attempt-tracker.adapter";
import { BcryptPasswordHasher } from "@wbc/business/auth/adapters/bcrypt-password-hasher.adapter";
import { ResendEmailSender } from "@wbc/business/auth/adapters/resend-email-sender.adapter";

export interface Repositories {
  // Auth
  accountRepo: PrismaAccountRepository;
  oauthRepo: PrismaOAuthAccountRepository;
  memberRepo: PrismaTenantMemberRepository;
  sessionRepo: PrismaSessionRepository;
  inviteRepo: PrismaInviteRepository;
  subscriptionRepo: PrismaSubscriptionRepository;
  otpRepo: PrismaOtpRepository;
  // Clients
  clientRepo: PrismaClientRepository;
  tagRepo: PrismaTagRepository;
  // Services
  passwordHasher: BcryptPasswordHasher;
  emailSender: ResendEmailSender;
  authTokenStore: RedisAuthTokenStore;
  loginAttemptTracker: RedisLoginAttemptTracker;
}

let cached: Repositories | null = null;

export function getRepositories(): Repositories {
  if (cached) return cached;

  const redis = getRedis() as unknown as RedisLike;

  // prisma is intentionally the shared singleton from @wbc/db for now
  // (ACH-006 follow-up). Once adapters accept PrismaClient via constructor,
  // replace the `new PrismaXxxRepository()` calls with `new PrismaXxxRepository(prisma)`.
  void prisma; // keep the import tree-shaking-safe

  // ACH-017 apis-integracoes: wire the outbox port here so every API call
  // path that publishes an event has it, then assert so a missing wire
  // fails on startup instead of on the first mutation.
  setOutboxPort(new PrismaOutboxRepository());
  assertOutboxReady();

  cached = {
    accountRepo: new PrismaAccountRepository(),
    oauthRepo: new PrismaOAuthAccountRepository(),
    memberRepo: new PrismaTenantMemberRepository(),
    sessionRepo: new PrismaSessionRepository(),
    inviteRepo: new PrismaInviteRepository(),
    subscriptionRepo: new PrismaSubscriptionRepository(),
    otpRepo: new PrismaOtpRepository(redis),
    clientRepo: new PrismaClientRepository(),
    tagRepo: new PrismaTagRepository(),
    passwordHasher: new BcryptPasswordHasher(),
    emailSender: new ResendEmailSender(),
    authTokenStore: new RedisAuthTokenStore(redis),
    loginAttemptTracker: new RedisLoginAttemptTracker(redis),
  };

  return cached;
}

/** For tests — clears the singleton so a fresh factory can be built. */
export function resetCompositionRootForTesting(): void {
  cached = null;
}
