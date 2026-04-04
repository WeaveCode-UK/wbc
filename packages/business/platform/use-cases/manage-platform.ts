import type { PlatformRepository } from '../ports/platform-repository';

export async function getReferralCode(tenantId: string, repo?: PlatformRepository) {
  if (!repo) return { code: '', link: '', stats: { used: 0 } };
  return repo.getReferralCode(tenantId);
}

export async function getOnboarding(tenantId: string, repo?: PlatformRepository) {
  if (!repo) return null;
  return repo.getOnboarding(tenantId);
}

export async function completeOnboardingStep(tenantId: string, stepId: string, repo?: PlatformRepository) {
  if (!repo) return null;
  return repo.completeOnboardingStep(tenantId, stepId);
}

export async function exportData(tenantId: string, repo?: PlatformRepository) {
  if (!repo) return { clients: [], sales: [], expenses: [], format: 'json' };
  return repo.exportData(tenantId);
}
