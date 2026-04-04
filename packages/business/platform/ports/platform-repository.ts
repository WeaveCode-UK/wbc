export interface PlatformRepository {
  getReferralCode(tenantId: string): Promise<{ code: string; link: string; stats: { used: number } }>;
  getOnboarding(tenantId: string): Promise<unknown>;
  completeOnboardingStep(tenantId: string, stepId: string): Promise<unknown>;
  exportData(tenantId: string): Promise<{ clients: unknown[]; sales: unknown[]; expenses: unknown[]; format: string }>;
}
