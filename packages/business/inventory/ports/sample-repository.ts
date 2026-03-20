import type { Sample } from '../domain/entities';

export interface SampleRepository {
  list(tenantId: string, page: number, limit: number): Promise<{ data: Sample[]; total: number }>;
  create(data: { tenantId: string; productId: string; clientId?: string; quantity: number; cost: number }): Promise<Sample>;
  markConverted(tenantId: string, id: string): Promise<Sample>;
  getROI(tenantId: string): Promise<{ totalCost: number; convertedCount: number; totalSamples: number }>;
}
