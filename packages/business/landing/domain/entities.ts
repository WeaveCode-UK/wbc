export interface LandingPageEntity {
  id: string;
  tenantId: string;
  slug: string;
  name: string;
  bio: string | null;
  philosophy: string | null;
  photoUrl: string | null;
  whatsappPhone: string;
  brands: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
