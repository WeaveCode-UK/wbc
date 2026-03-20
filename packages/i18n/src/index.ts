// Locale exports for next-intl and i18next
export const locales = ['pt-BR', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pt-BR';

export const namespaces = [
  'common', 'auth', 'clients', 'sales', 'campaigns', 'messaging',
  'finance', 'inventory', 'schedule', 'team', 'analytics', 'logistics',
  'landing', 'platform', 'ai', 'errors',
] as const;
export type Namespace = (typeof namespaces)[number];
