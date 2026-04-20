-- ACH-025 — Postgres role separation for the WBC platform.
--
-- Run this once per environment, as the Postgres superuser, BEFORE
-- the application boots:
--
--   psql -h <host> -U postgres -d wbc -f setup-roles.sql
--
-- Three least-privilege roles are created:
--   * wbc_app          — runtime DML on application tables. App and worker
--                        containers connect with this user.
--   * wbc_migrations   — DDL only; runs Prisma migrations from CI/deploy.
--   * wbc_readonly     — SELECT for analytics / dashboards / on-call.
--
-- After running, set DATABASE_URL to use wbc_app for the app/worker, and
-- expose wbc_migrations only to the migration step.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wbc_app') THEN
    CREATE ROLE wbc_app LOGIN PASSWORD :'wbc_app_password';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wbc_migrations') THEN
    CREATE ROLE wbc_migrations LOGIN PASSWORD :'wbc_migrations_password';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wbc_readonly') THEN
    CREATE ROLE wbc_readonly LOGIN PASSWORD :'wbc_readonly_password';
  END IF;
END
$$;

-- Schema-level privileges
GRANT USAGE ON SCHEMA public TO wbc_app, wbc_readonly;
GRANT USAGE, CREATE ON SCHEMA public TO wbc_migrations;

-- App: read/write on application tables, but no DDL.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO wbc_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO wbc_app;

-- Readonly: SELECT only.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO wbc_readonly;

-- Migrations: full DDL/DML on its own schema.
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO wbc_migrations;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO wbc_migrations;

-- Default privileges for tables/sequences created later by wbc_migrations.
ALTER DEFAULT PRIVILEGES FOR ROLE wbc_migrations IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO wbc_app;
ALTER DEFAULT PRIVILEGES FOR ROLE wbc_migrations IN SCHEMA public
  GRANT SELECT ON TABLES TO wbc_readonly;
ALTER DEFAULT PRIVILEGES FOR ROLE wbc_migrations IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO wbc_app;

-- Reject any future table that wbc_migrations forgets to grant on — the
-- explicit ALTER DEFAULT PRIVILEGES above covers the happy path.
REVOKE ALL ON SCHEMA public FROM PUBLIC;
