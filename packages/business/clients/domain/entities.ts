import type { SkinType, HairType, Classification, ClientSource, Sex } from './value-objects';

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string | null;
  sex: Sex | null;
  birthday: Date | null;
  profession: string | null;
  skinType: SkinType | null;
  hairType: HairType | null;
  allergies: string | null;
  makeupTones: string | null;
  preferences: string | null;
  notes: string | null;
  source: ClientSource;
  classification: Classification;
  engagementScore: number;
  firstPurchaseAt: Date | null;
  isLead: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  tenantId: string;
  name: string;
  autoRule: string | null;
  color: string | null;
  createdAt: Date;
}

export interface ClientTag {
  id: string;
  clientId: string;
  tagId: string;
}

export interface ClientWishlistItem {
  id: string;
  tenantId: string;
  clientId: string;
  productId: string;
  createdAt: Date;
}

export interface GiftSuggestor {
  id: string;
  tenantId: string;
  clientId: string;
  suggestorName: string;
  suggestorPhone: string;
}

export function isClientInactive(client: Client, daysSinceLastPurchase: number): boolean {
  return daysSinceLastPurchase > 90;
}

export function calculateClassification(totalPurchases: number, totalSpent: number): Classification {
  if (totalPurchases >= 5 && totalSpent >= 500) return 'A';
  if (totalPurchases >= 2 && totalSpent >= 100) return 'B';
  return 'C';
}
