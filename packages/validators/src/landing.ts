import { z } from 'zod';

export const updateLandingSchema = z.object({ bio: z.string().optional(), philosophy: z.string().optional(), photoUrl: z.string().optional(), whatsappLink: z.string().optional() });
export const toggleLandingActiveSchema = z.object({ isActive: z.boolean() });
export const getPublicLandingSchema = z.object({ slug: z.string() });
