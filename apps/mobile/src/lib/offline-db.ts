import * as SQLite from "expo-sqlite";

// F11.E18: offline-first SQLite layer for the mobile app.
// Mirrors the read tables the consultora needs to keep working when
// the network drops (clients list, sales list, agenda) plus a
// pending-mutations queue. The queue is drained back to apps/web
// (or apps/api directly) via the trpc client when connectivity
// returns; the sync worker lives in `sync.ts`.
//
// Schema design notes
// -------------------
// - Plain TEXT for ids — SQLite has no native UUID type.
// - `tenantId` is repeated on every row because the app is single-
//   tenant per session but the same SQLite file may be reused by
//   different consultoras during dev — easier to filter than to
//   drop the database.
// - `updatedAt` (epoch ms) drives last-write-wins on conflict.
// - `syncedAt` is null while a row is dirty (created/updated locally
//   and not yet acked by the server).

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync("wbc.db");
  await dbInstance.execAsync(SCHEMA_SQL);
  return dbInstance;
}

const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  tenantId TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  classification TEXT,
  isLead INTEGER NOT NULL DEFAULT 0,
  isActive INTEGER NOT NULL DEFAULT 1,
  updatedAt INTEGER NOT NULL,
  syncedAt INTEGER
);
CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenantId);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  tenantId TEXT NOT NULL,
  clientId TEXT NOT NULL,
  total REAL NOT NULL,
  status TEXT NOT NULL,
  paymentMethod TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  syncedAt INTEGER
);
CREATE INDEX IF NOT EXISTS idx_sales_tenant ON sales(tenantId);
CREATE INDEX IF NOT EXISTS idx_sales_client ON sales(clientId);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  tenantId TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  startsAt INTEGER NOT NULL,
  address TEXT,
  updatedAt INTEGER NOT NULL,
  syncedAt INTEGER
);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant ON appointments(tenantId);

-- F11.E18: pending-mutations queue. Each entry stores enough to
-- re-run the procedure on reconnect (operation = 'clients.create',
-- payload = JSON-encoded input). The worker pops in createdAt order
-- so writes go in the same sequence the user made them.
CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  tenantId TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload TEXT NOT NULL,
  attemptCount INTEGER NOT NULL DEFAULT 0,
  lastError TEXT,
  createdAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sync_queue_tenant ON sync_queue(tenantId, createdAt);
`;

export interface QueueEntry {
  id: string;
  tenantId: string;
  operation: string;
  payload: string;
  attemptCount: number;
  lastError: string | null;
  createdAt: number;
}

export async function enqueueMutation(
  tenantId: string,
  operation: string,
  payload: unknown,
): Promise<void> {
  const db = await getDb();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  await db.runAsync(
    "INSERT INTO sync_queue (id, tenantId, operation, payload, attemptCount, createdAt) VALUES (?, ?, ?, ?, 0, ?)",
    [id, tenantId, operation, JSON.stringify(payload), Date.now()],
  );
}

export async function listPendingMutations(
  tenantId: string,
): Promise<QueueEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<QueueEntry>(
    "SELECT * FROM sync_queue WHERE tenantId = ? ORDER BY createdAt ASC",
    [tenantId],
  );
  return rows;
}

export async function removeFromQueue(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM sync_queue WHERE id = ?", [id]);
}

export async function bumpQueueAttempt(
  id: string,
  error: string,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE sync_queue SET attemptCount = attemptCount + 1, lastError = ? WHERE id = ?",
    [error, id],
  );
}
