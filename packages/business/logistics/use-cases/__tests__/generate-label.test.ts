import { describe, it, expect } from 'vitest';
import { generateShippingLabel } from '../generate-label';
import type { DeliveryEntity } from '../../domain/entities';

describe('generateShippingLabel', () => {
  it('generates label with all fields', () => {
    const delivery: DeliveryEntity = {
      id: 'd1', tenantId: 't1', saleId: 's1', clientId: 'c1',
      clientName: 'Maria Silva', clientPhone: '+5511999999999',
      method: 'SHIPPING', status: 'CONFIRMED',
      address: 'Rua ABC 123', trackingCode: 'TR123', notes: 'Frágil',
      estimatedDate: null, deliveredAt: null,
      createdAt: new Date(), updatedAt: new Date(),
    };

    const label = generateShippingLabel(delivery);
    expect(label.recipientName).toBe('Maria Silva');
    expect(label.recipientPhone).toBe('+5511999999999');
    expect(label.address).toBe('Rua ABC 123');
    expect(label.trackingCode).toBe('TR123');
    expect(label.method).toBe('SHIPPING');
    expect(label.notes).toBe('Frágil');
  });

  it('defaults address for pickup', () => {
    const delivery: DeliveryEntity = {
      id: 'd1', tenantId: 't1', saleId: 's1', clientId: 'c1',
      clientName: 'Ana', clientPhone: '+5511888888888',
      method: 'PICKUP', status: 'CONFIRMED',
      address: null, trackingCode: null, notes: null,
      estimatedDate: null, deliveredAt: null,
      createdAt: new Date(), updatedAt: new Date(),
    };

    const label = generateShippingLabel(delivery);
    expect(label.address).toBe('Retirada no local');
    expect(label.trackingCode).toBeNull();
  });
});
