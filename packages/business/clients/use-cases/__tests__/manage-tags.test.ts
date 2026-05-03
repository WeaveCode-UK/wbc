// T-coverage — tag CRUD + tagging operations
//
// Tags are tenant-scoped; we assert each guard:
//   - createTag throws DuplicateTagError when name already exists in tenant
//   - deleteTag throws TagNotFoundError when missing
//   - tagClient / untagClient / bulkTag forward args verbatim (the repo
//     enforces tenant scoping)
import { describe, it, expect, vi } from "vitest";
import {
  createTag,
  deleteTag,
  listTags,
  tagClient,
  untagClient,
  bulkTag,
} from "../manage-tags";
import { DuplicateTagError, TagNotFoundError } from "../../domain/errors";
import type { TagRepository } from "../../ports/tag-repository";

function repoMock(overrides: Partial<TagRepository> = {}): TagRepository {
  return {
    findById: vi.fn().mockResolvedValue({ id: "tag-1", tenantId: "t1" }),
    findByName: vi.fn().mockResolvedValue(null),
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockImplementation((data) =>
      Promise.resolve({
        id: "tag-new",
        ...data,
        autoRule: data.autoRule ?? null,
        color: data.color ?? null,
        createdAt: new Date(),
      }),
    ),
    delete: vi.fn().mockResolvedValue(undefined),
    tagClient: vi.fn().mockResolvedValue({
      id: "ct-1",
      clientId: "c1",
      tagId: "tag-1",
    }),
    untagClient: vi.fn().mockResolvedValue(undefined),
    bulkTag: vi.fn().mockResolvedValue(0),
    getClientTags: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe("createTag", () => {
  it("creates a new tag when no duplicate exists", async () => {
    const repo = repoMock();
    const tag = await createTag("t1", "VIP", "#ff0", undefined, repo);
    expect(repo.findByName).toHaveBeenCalledWith("t1", "VIP");
    expect(repo.create).toHaveBeenCalledWith({
      tenantId: "t1",
      name: "VIP",
      color: "#ff0",
      autoRule: undefined,
    });
    expect(tag.name).toBe("VIP");
  });

  it("throws DuplicateTagError when the tag name is already used in tenant", async () => {
    const repo = repoMock({
      findByName: vi
        .fn()
        .mockResolvedValue({ id: "tag-existing", name: "VIP" }),
    });
    await expect(
      createTag("t1", "VIP", undefined, undefined, repo),
    ).rejects.toThrow(DuplicateTagError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("forwards autoRule when provided", async () => {
    const repo = repoMock();
    await createTag("t1", "Gold", "#ff0", "purchase>500", repo);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ autoRule: "purchase>500" }),
    );
  });
});

describe("deleteTag", () => {
  it("deletes when the tag exists in the tenant", async () => {
    const repo = repoMock();
    await deleteTag("t1", "tag-1", repo);
    expect(repo.findById).toHaveBeenCalledWith("t1", "tag-1");
    expect(repo.delete).toHaveBeenCalledWith("t1", "tag-1");
  });

  it("throws TagNotFoundError when the tag doesn't exist", async () => {
    const repo = repoMock({ findById: vi.fn().mockResolvedValue(null) });
    await expect(deleteTag("t1", "ghost", repo)).rejects.toThrow(
      TagNotFoundError,
    );
    expect(repo.delete).not.toHaveBeenCalled();
  });
});

describe("listTags", () => {
  it("forwards tenantId verbatim", async () => {
    const repo = repoMock();
    await listTags("t1", repo);
    expect(repo.list).toHaveBeenCalledWith("t1");
  });
});

describe("tagClient / untagClient / bulkTag", () => {
  it("tagClient delegates to repo with full triple", async () => {
    const repo = repoMock();
    await tagClient("t1", "c1", "tag-1", repo);
    expect(repo.tagClient).toHaveBeenCalledWith("t1", "c1", "tag-1");
  });

  it("untagClient delegates to repo with full triple", async () => {
    const repo = repoMock();
    await untagClient("t1", "c1", "tag-1", repo);
    expect(repo.untagClient).toHaveBeenCalledWith("t1", "c1", "tag-1");
  });

  it("bulkTag forwards the list of clientIds + tagId", async () => {
    const repo = repoMock({ bulkTag: vi.fn().mockResolvedValue(3) });
    const count = await bulkTag("t1", ["c1", "c2", "c3"], "tag-1", repo);
    expect(repo.bulkTag).toHaveBeenCalledWith(
      "t1",
      ["c1", "c2", "c3"],
      "tag-1",
    );
    expect(count).toBe(3);
  });
});
