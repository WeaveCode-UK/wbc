export type Plan = 'ESSENTIAL' | 'PRO';
export type Role = 'CONSULTANT' | 'LEADER' | 'DIRECTOR' | 'ADMIN';
export type SubStatus = 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED';

export interface TenantContext {
  tenantId: string;
  userId: string;
  plan: Plan;
  role: Role;
  locale: string;
  timezone: string;
  currency: string;
}
