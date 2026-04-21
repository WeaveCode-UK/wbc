-- ACH-022 dados-persistencia: enable pg_stat_statements so
-- index/query decisions aren't made in the dark.
--
-- Wired into the Postgres container via
-- `docker-entrypoint-initdb.d/init.sql`. Only runs on a fresh cluster
-- — for an existing cluster, invoke it manually once with psql.

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- `shared_preload_libraries` has to include pg_stat_statements for
-- the extension to actually collect; that's a postgresql.conf or
-- `-c` flag change. docker-compose sets it via command args:
--
--   command: ["postgres",
--             "-c", "shared_preload_libraries=pg_stat_statements",
--             "-c", "pg_stat_statements.track=all"]
--
-- See docs/architecture/db-observability.md for the weekly query.
