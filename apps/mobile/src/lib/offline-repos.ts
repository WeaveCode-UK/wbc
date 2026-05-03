import { getDb } from "./offline-db";

// F11.E27: typed read/upsert helpers over the SQLite tables in
// offline-db.ts. Screens read from these on mount; the network sync
// path (sync.ts) writes new server snapshots back through the upsert
// helpers so subsequent renders are warm.

export interface OfflineClient {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string | null;
  classification: "A" | "B" | "C" | null;
  isLead: number;
  isActive: number;
  updatedAt: number;
  syncedAt: number | null;
}

export interface OfflineSale {
  id: string;
  tenantId: string;
  clientId: string;
  total: number;
  status: string;
  paymentMethod: string | null;
  createdAt: number;
  updatedAt: number;
  syncedAt: number | null;
}

export interface OfflineAppointment {
  id: string;
  tenantId: string;
  title: string;
  type: string;
  startsAt: number;
  address: string | null;
  updatedAt: number;
  syncedAt: number | null;
}

export async function listClients(tenantId: string): Promise<OfflineClient[]> {
  const db = await getDb();
  return db.getAllAsync<OfflineClient>(
    "SELECT * FROM clients WHERE tenantId = ? ORDER BY name ASC",
    [tenantId],
  );
}

export async function getClient(
  tenantId: string,
  id: string,
): Promise<OfflineClient | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<OfflineClient>(
    "SELECT * FROM clients WHERE tenantId = ? AND id = ?",
    [tenantId, id],
  );
  return row ?? null;
}

export async function upsertClient(client: OfflineClient): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO clients (id, tenantId, name, phone, email, classification, isLead, isActive, updatedAt, syncedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       phone = excluded.phone,
       email = excluded.email,
       classification = excluded.classification,
       isLead = excluded.isLead,
       isActive = excluded.isActive,
       updatedAt = excluded.updatedAt,
       syncedAt = excluded.syncedAt`,
    [
      client.id,
      client.tenantId,
      client.name,
      client.phone,
      client.email,
      client.classification,
      client.isLead,
      client.isActive,
      client.updatedAt,
      client.syncedAt,
    ],
  );
}

export async function listSales(tenantId: string): Promise<OfflineSale[]> {
  const db = await getDb();
  return db.getAllAsync<OfflineSale>(
    "SELECT * FROM sales WHERE tenantId = ? ORDER BY createdAt DESC",
    [tenantId],
  );
}

export async function listSalesForClient(
  tenantId: string,
  clientId: string,
): Promise<OfflineSale[]> {
  const db = await getDb();
  return db.getAllAsync<OfflineSale>(
    "SELECT * FROM sales WHERE tenantId = ? AND clientId = ? ORDER BY createdAt DESC",
    [tenantId, clientId],
  );
}

export async function upsertSale(sale: OfflineSale): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sales (id, tenantId, clientId, total, status, paymentMethod, createdAt, updatedAt, syncedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       total = excluded.total,
       status = excluded.status,
       paymentMethod = excluded.paymentMethod,
       updatedAt = excluded.updatedAt,
       syncedAt = excluded.syncedAt`,
    [
      sale.id,
      sale.tenantId,
      sale.clientId,
      sale.total,
      sale.status,
      sale.paymentMethod,
      sale.createdAt,
      sale.updatedAt,
      sale.syncedAt,
    ],
  );
}

export async function listAppointments(
  tenantId: string,
): Promise<OfflineAppointment[]> {
  const db = await getDb();
  return db.getAllAsync<OfflineAppointment>(
    "SELECT * FROM appointments WHERE tenantId = ? ORDER BY startsAt ASC",
    [tenantId],
  );
}

export async function listAppointmentsForDay(
  tenantId: string,
  startMs: number,
  endMs: number,
): Promise<OfflineAppointment[]> {
  const db = await getDb();
  return db.getAllAsync<OfflineAppointment>(
    "SELECT * FROM appointments WHERE tenantId = ? AND startsAt >= ? AND startsAt < ? ORDER BY startsAt ASC",
    [tenantId, startMs, endMs],
  );
}

export async function upsertAppointment(
  appt: OfflineAppointment,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO appointments (id, tenantId, title, type, startsAt, address, updatedAt, syncedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       type = excluded.type,
       startsAt = excluded.startsAt,
       address = excluded.address,
       updatedAt = excluded.updatedAt,
       syncedAt = excluded.syncedAt`,
    [
      appt.id,
      appt.tenantId,
      appt.title,
      appt.type,
      appt.startsAt,
      appt.address,
      appt.updatedAt,
      appt.syncedAt,
    ],
  );
}
