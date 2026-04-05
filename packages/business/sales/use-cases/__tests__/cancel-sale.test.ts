import { describe, it, expect, vi } from 'vitest';
import { cancelSale } from '../cancel-sale';
import type { SaleRepository } from '../../ports/sale-repository';
import { SaleNotFoundError, InvalidSaleStatusError } from '../../domain/errors';

vi.mock('@wbc/shared', () => ({ publish: vi.fn(), EVENTS: { SALE_CANCELLED: 'SALE_CANCELLED' } }));

function mockSaleRepo(sale: Record<string, unknown> | null = null): SaleRepository {
  return {
    findById: vi.fn().mockResolvedValue(sale),
    list: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn().mockImplementation((_, id, status) => Promise.resolve({ ...sale, id, status })),
    delete: vi.fn(),
  } as unknown as SaleRepository;
}

describe('cancelSale use-case', () => {
  it('cancels a DRAFT sale', async () => {
    const repo = mockSaleRepo({ id: 's1', tenantId: 't1', status: 'DRAFT' });
    const result = await cancelSale('t1', 's1', repo);
    expect(result.status).toBe('CANCELLED');
    expect(repo.updateStatus).toHaveBeenCalledWith('t1', 's1', 'CANCELLED');
  });

  it('cancels a CONFIRMED sale', async () => {
    const repo = mockSaleRepo({ id: 's1', tenantId: 't1', status: 'CONFIRMED' });
    const result = await cancelSale('t1', 's1', repo);
    expect(result.status).toBe('CANCELLED');
  });

  it('throws SaleNotFoundError for missing sale', async () => {
    const repo = mockSaleRepo(null);
    await expect(cancelSale('t1', 's1', repo)).rejects.toThrow(SaleNotFoundError);
  });

  it('throws InvalidSaleStatusError for CANCELLED sale', async () => {
    const repo = mockSaleRepo({ id: 's1', tenantId: 't1', status: 'CANCELLED' });
    await expect(cancelSale('t1', 's1', repo)).rejects.toThrow(InvalidSaleStatusError);
  });

  it('throws InvalidSaleStatusError for DELIVERED sale', async () => {
    const repo = mockSaleRepo({ id: 's1', tenantId: 't1', status: 'DELIVERED' });
    await expect(cancelSale('t1', 's1', repo)).rejects.toThrow(InvalidSaleStatusError);
  });
});
