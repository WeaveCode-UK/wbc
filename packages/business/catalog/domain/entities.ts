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

// ACH-028 seguranca: 8 chars from Math.random gave ~41 bits of entropy
// from a non-CSPRNG, and catalog.getPublicShowcase exposed cross-tenant
// catalog data behind that token. randomBytes(16) → 128 bits via the
// platform CSPRNG; base64url keeps URL-safe characters and yields a
// 22-character token.
import { randomBytes } from "crypto";

export function generateShareLink(): string {
  return randomBytes(16).toString("base64url");
}
