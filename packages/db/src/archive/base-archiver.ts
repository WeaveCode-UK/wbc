// ACH-019 dados-persistencia: base class for per-entity archivers.
//
// Intentional stub — the shape lets the first archiver land with a
// clear contract, without committing to S3 client choice or encoding
// before the team picks those for the first real use. Subclasses
// override `serialise` and `upload` when the cold-store adapter
// lands.

export interface ArchiveResult {
  archived: number;
}

export interface PurgeResult {
  deleted: number;
}

export abstract class BaseArchiver<Row> {
  /** Human-readable name for logs. */
  abstract readonly name: string;

  /** Fetch rows older than `cutoff` that are eligible for archive. */
  protected abstract fetch(cutoff: Date, limit: number): Promise<Row[]>;

  /** Delete the fetched rows inside the same transaction as the upload. */
  protected abstract deleteBatch(rows: Row[]): Promise<number>;

  /**
   * Serialise a row to a cold-store-friendly format. Default: JSON.
   * Subclasses override when they need a different shape (e.g.
   * redacting PII) or a different format (parquet).
   */
  protected serialise(row: Row): string {
    return JSON.stringify(row);
  }

  /**
   * Push serialised rows to the cold store. Default no-op so the
   * stub compiles; subclasses implement once the adapter is chosen.
   */
  protected async upload(_payload: string[]): Promise<void> {
    // TODO(ACH-019 follow-up): S3 / GCS adapter.
  }

  async archive(olderThan: Date, batchSize = 1000): Promise<ArchiveResult> {
    let total = 0;
    for (;;) {
      const batch = await this.fetch(olderThan, batchSize);
      if (batch.length === 0) break;
      await this.upload(batch.map((r) => this.serialise(r)));
      total += await this.deleteBatch(batch);
      if (batch.length < batchSize) break;
    }
    return { archived: total };
  }

  /**
   * Delete without exporting. Used by entities whose retention policy
   * is "hot-only" (notifications, sent reminders).
   */
  async purge(_olderThan: Date, _batchSize = 1000): Promise<PurgeResult> {
    throw new Error(
      `${this.name}: purge() not implemented — override in subclass or call archive().`,
    );
  }
}
