import type { Sample } from '../domain/entities';
import type { SampleRepository } from '../ports/sample-repository';

export async function listSamples(tenantId: string, page: number, limit: number, sampleRepo: SampleRepository) {
  return sampleRepo.list(tenantId, page, limit);
}

export async function createSample(
  tenantId: string,
  productId: string,
  clientId: string | undefined,
  quantity: number,
  cost: number,
  sampleRepo: SampleRepository,
): Promise<Sample> {
  return sampleRepo.create({ tenantId, productId, clientId, quantity, cost });
}

export async function markSampleConverted(tenantId: string, id: string, sampleRepo: SampleRepository): Promise<Sample> {
  return sampleRepo.markConverted(tenantId, id);
}

export async function getSampleROI(tenantId: string, sampleRepo: SampleRepository) {
  return sampleRepo.getROI(tenantId);
}
