export interface Brand {
  id: string;
  name: string;
  logo: string | null;
  isSystem: boolean;
}

export interface Product {
  id: string;
  tenantId: string;
  brandId: string;
  name: string;
  description: string | null;
  price: number;
  costPrice: number | null;
  photoUrl: string | null;
  category: string | null;
  isCustom: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Showcase {
  id: string;
  tenantId: string;
  clientId: string | null;
  name: string;
  shareLink: string;
  isActive: boolean;
  createdAt: Date;
}

export interface ShowcaseProduct {
  id: string;
  showcaseId: string;
  productId: string;
  sortOrder: number;
}

export function generateShareLink(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
