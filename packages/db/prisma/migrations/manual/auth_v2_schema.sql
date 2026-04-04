-- Auth 2.0 Schema Migration
-- Run this after starting the database with: psql $DATABASE_URL -f this_file.sql
-- Or use: npx prisma db push (recommended for this project)

-- 1. Create accounts table
CREATE TABLE IF NOT EXISTS "accounts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "emailVerified" TIMESTAMP(3),
  "passwordHash" TEXT,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_email_key" ON "accounts"("email");

-- 2. Create oauth_accounts table
CREATE TABLE IF NOT EXISTS "oauth_accounts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "accountId" UUID NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "expiresAt" INTEGER,
  "tokenType" TEXT,
  "scope" TEXT,
  "idToken" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "oauth_accounts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "oauth_accounts_provider_providerAccountId_key" ON "oauth_accounts"("provider", "providerAccountId");
CREATE INDEX IF NOT EXISTS "oauth_accounts_accountId_idx" ON "oauth_accounts"("accountId");

-- 3. Create tenant_members table
CREATE TABLE IF NOT EXISTS "tenant_members" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "accountId" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'CONSULTANT',
  "phone" TEXT,
  "displayName" TEXT,
  "avatar" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "deletedAt" TIMESTAMP(3),
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tenant_members_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tenant_members_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "tenant_members_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_members_accountId_tenantId_key" ON "tenant_members"("accountId", "tenantId");
CREATE INDEX IF NOT EXISTS "tenant_members_tenantId_idx" ON "tenant_members"("tenantId");
CREATE INDEX IF NOT EXISTS "tenant_members_accountId_idx" ON "tenant_members"("accountId");

-- 4. Create sessions table
CREATE TABLE IF NOT EXISTS "sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "accountId" UUID NOT NULL,
  "tenantId" UUID,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "userAgent" TEXT,
  "ipAddress" TEXT,
  "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sessions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_tokenHash_key" ON "sessions"("tokenHash");
CREATE INDEX IF NOT EXISTS "sessions_accountId_idx" ON "sessions"("accountId");
CREATE INDEX IF NOT EXISTS "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- 5. Create invites table
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

CREATE TABLE IF NOT EXISTS "invites" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'CONSULTANT',
  "invitedBy" UUID NOT NULL,
  "token" TEXT NOT NULL,
  "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invites_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "invites_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "invites_token_key" ON "invites"("token");
CREATE INDEX IF NOT EXISTS "invites_email_idx" ON "invites"("email");
CREATE INDEX IF NOT EXISTS "invites_tenantId_idx" ON "invites"("tenantId");

-- 6. Create OtpPurpose enum
CREATE TYPE "OtpPurpose" AS ENUM ('TWO_FACTOR', 'EMAIL_VERIFICATION');

-- 7. Alter tenants table — remove identity fields
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "phone";
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "email";
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "avatar";
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "role";
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "plan";

-- 8. Alter otp_codes table — switch from phone to accountId
ALTER TABLE "otp_codes" ADD COLUMN IF NOT EXISTS "accountId" UUID;
ALTER TABLE "otp_codes" ADD COLUMN IF NOT EXISTS "purpose" "OtpPurpose" NOT NULL DEFAULT 'TWO_FACTOR';
ALTER TABLE "otp_codes" DROP COLUMN IF EXISTS "phone";
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "otp_codes_accountId_code_idx" ON "otp_codes"("accountId", "code");
CREATE INDEX IF NOT EXISTS "otp_codes_accountId_idx" ON "otp_codes"("accountId");
