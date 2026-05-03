// T-coverage — quick-replies CRUD
//
// Quick replies are tenant-scoped templates the consultant pastes into
// WhatsApp. Use-case is a thin pass-through; we assert each call routes
// to the repo with the right (tenantId, ...) tuple.
import { describe, it, expect, vi } from "vitest";
import {
  listQuickReplies,
  createQuickReply,
  deleteQuickReply,
} from "../quick-replies";
import type { QuickReplyRepository } from "../../ports/messaging-repository";

function repoMock(
  overrides: Partial<QuickReplyRepository> = {},
): QuickReplyRepository {
  return {
    list: vi.fn().mockResolvedValue([]),
    create: vi
      .fn()
      .mockImplementation((tenantId, label, text) =>
        Promise.resolve({ id: "qr-1", tenantId, label, text }),
      ),
    delete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("listQuickReplies", () => {
  it("forwards tenantId verbatim", async () => {
    const repo = repoMock();
    await listQuickReplies("t1", repo);
    expect(repo.list).toHaveBeenCalledWith("t1");
  });

  it("returns the repo payload as-is", async () => {
    const repo = repoMock({
      list: vi.fn().mockResolvedValue([{ id: "qr-1", label: "Hi" }]),
    });
    const out = await listQuickReplies("t1", repo);
    expect(out).toHaveLength(1);
  });
});

describe("createQuickReply", () => {
  it("forwards tenantId + label + text verbatim", async () => {
    const repo = repoMock();
    await createQuickReply("t1", "Greeting", "Olá!", repo);
    expect(repo.create).toHaveBeenCalledWith("t1", "Greeting", "Olá!");
  });
});

describe("deleteQuickReply", () => {
  it("forwards (tenantId, id) verbatim — no return value (void)", async () => {
    const repo = repoMock();
    await deleteQuickReply("t1", "qr-1", repo);
    expect(repo.delete).toHaveBeenCalledWith("t1", "qr-1");
  });
});
