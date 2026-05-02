import type { ClientRepository } from "../ports/client-repository";
import { formatPhoneE164, validatePhone } from "../domain/value-objects";

// F11.E07: bulk import for xlsx/csv flow. The web app parses the
// spreadsheet client-side (so server stays free of file-format code) and
// hands a JSON array of rows here. We validate each row independently —
// one bad phone shouldn't tank the whole batch — and dedup by phone
// against existing clients in the same tenant.
//
// Returns the count of rows imported plus a list of rows that were
// skipped with a short reason. Never throws on partial failure; the
// caller renders the report.

export interface ImportClientRow {
  name: string;
  phone: string;
  email?: string;
  birthday?: string | Date;
  notes?: string;
}

export interface ImportClientsInput {
  tenantId: string;
  rows: ImportClientRow[];
}

export interface ImportClientsReport {
  total: number;
  imported: number;
  skipped: Array<{ row: number; phone?: string; reason: string }>;
}

const MAX_ROWS = 5000;

export async function importClients(
  input: ImportClientsInput,
  clientRepository: ClientRepository,
): Promise<ImportClientsReport> {
  const rows = input.rows.slice(0, MAX_ROWS);
  const skipped: ImportClientsReport["skipped"] = [];
  let imported = 0;
  // Dedup against same-batch duplicates too: a spreadsheet often has the
  // same person twice. We track the phones we've already inserted in this
  // batch so the second occurrence reports a clear "duplicate within
  // import" reason, not a generic conflict from the database.
  const seenPhones = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const rowIndex = i + 1;

    if (!row.name || row.name.trim().length === 0) {
      skipped.push({ row: rowIndex, reason: "missing_name" });
      continue;
    }
    if (!row.phone || !validatePhone(row.phone)) {
      skipped.push({ row: rowIndex, reason: "invalid_phone" });
      continue;
    }
    const phone = formatPhoneE164(row.phone);
    if (seenPhones.has(phone)) {
      skipped.push({ row: rowIndex, phone, reason: "duplicate_in_batch" });
      continue;
    }

    const existing = await clientRepository.findByPhone(input.tenantId, phone);
    if (existing) {
      skipped.push({ row: rowIndex, phone, reason: "duplicate_in_db" });
      continue;
    }

    const birthday =
      row.birthday instanceof Date
        ? row.birthday
        : row.birthday
          ? new Date(row.birthday)
          : null;

    try {
      await clientRepository.create({
        tenantId: input.tenantId,
        name: row.name.trim(),
        phone,
        email: row.email ?? null,
        sex: null,
        birthday:
          birthday && !Number.isNaN(birthday.getTime()) ? birthday : null,
        profession: null,
        skinType: null,
        hairType: null,
        allergies: null,
        makeupTones: null,
        preferences: null,
        notes: row.notes ?? null,
        source: "IMPORT",
        isLead: false,
        isActive: true,
        version: 0,
      });
      imported += 1;
      seenPhones.add(phone);
    } catch (error) {
      skipped.push({
        row: rowIndex,
        phone,
        reason: error instanceof Error ? error.message : "create_failed",
      });
    }
  }

  return { total: rows.length, imported, skipped };
}
