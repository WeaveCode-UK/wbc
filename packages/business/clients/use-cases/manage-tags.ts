import type { Tag, ClientTag } from '../domain/entities';
import type { TagRepository } from '../ports/tag-repository';
import { DuplicateTagError, TagNotFoundError } from '../domain/errors';

export async function createTag(
  tenantId: string,
  name: string,
  color: string | undefined,
  autoRule: string | undefined,
  tagRepository: TagRepository,
): Promise<Tag> {
  const existing = await tagRepository.findByName(tenantId, name);
  if (existing) throw new DuplicateTagError(name);
  return tagRepository.create({ tenantId, name, color, autoRule });
}

export async function deleteTag(
  tenantId: string,
  id: string,
  tagRepository: TagRepository,
): Promise<void> {
  const tag = await tagRepository.findById(tenantId, id);
  if (!tag) throw new TagNotFoundError(id);
  await tagRepository.delete(tenantId, id);
}

export async function listTags(
  tenantId: string,
  tagRepository: TagRepository,
): Promise<Tag[]> {
  return tagRepository.list(tenantId);
}

export async function tagClient(
  clientId: string,
  tagId: string,
  tagRepository: TagRepository,
): Promise<ClientTag> {
  return tagRepository.tagClient(clientId, tagId);
}

export async function untagClient(
  clientId: string,
  tagId: string,
  tagRepository: TagRepository,
): Promise<void> {
  return tagRepository.untagClient(clientId, tagId);
}

export async function bulkTag(
  clientIds: string[],
  tagId: string,
  tagRepository: TagRepository,
): Promise<number> {
  return tagRepository.bulkTag(clientIds, tagId);
}
