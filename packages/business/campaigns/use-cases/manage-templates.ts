import type { TemplateRepository } from '../ports/template-repository';

export async function listTemplates(tenantId: string, category: string | undefined, repo: TemplateRepository) {
  return repo.list(tenantId, category);
}

export async function createTemplate(tenantId: string, name: string, category: string, text: string, repo: TemplateRepository) {
  return repo.create(tenantId, name, category, text);
}

export async function updateTemplate(tenantId: string, id: string, text: string, repo: TemplateRepository) {
  return repo.update(tenantId, id, text);
}

export async function deleteTemplate(tenantId: string, id: string, repo: TemplateRepository) {
  await repo.delete(tenantId, id);
}

export async function listCommunityTemplates(filters: { topic?: string; sort?: string; page: number; limit: number }, repo: TemplateRepository) {
  return repo.listCommunity(filters);
}

export async function likeCommunityTemplate(id: string, repo: TemplateRepository) {
  return repo.likeCommunity(id);
}

export async function shareToFeed(tenantId: string, text: string, topic: string | undefined, repo: TemplateRepository) {
  return repo.shareToFeed(tenantId, text, topic);
}
