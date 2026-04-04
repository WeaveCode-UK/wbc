import type { QuickReplyRepository } from '../ports/messaging-repository';

export async function listQuickReplies(tenantId: string, repo: QuickReplyRepository) {
  return repo.list(tenantId);
}

export async function createQuickReply(tenantId: string, label: string, text: string, repo: QuickReplyRepository) {
  return repo.create(tenantId, label, text);
}

export async function deleteQuickReply(tenantId: string, id: string, repo: QuickReplyRepository) {
  await repo.delete(tenantId, id);
}
