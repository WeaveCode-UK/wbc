// T-coverage — showcase CRUD + share-link contract
//
// Showcases expose a public read surface keyed by `shareLink`. ACH-028
// hardened the link to 8 hex chars from a CSPRNG (was 8 chars from
// Math.random — ~41 bits, brute-forceable). The tests assert:
//   - createShowcase generates a fresh shareLink and forwards the rest
//   - shareLink format: 8 lowercase alphanumeric chars (matches the
//     F11.E19 contract used by the public route)
//   - deleteShowcase throws ShowcaseNotFoundError on missing rows
//   - getPublicShowcase looks up by shareLink (no tenantId — by design,
//     the link IS the auth surface for the public viewer)
import { describe, it, expect, vi } from "vitest";
import {
  listShowcases,
  createShowcase,
  deleteShowcase,
  getPublicShowcase,
} from "../manage-showcases";
import { ShowcaseNotFoundError } from "../../domain/errors";
import type { ShowcaseRepository } from "../../ports/showcase-repository";
import type { Showcase } from "../../domain/entities";

function fakeShowcase(overrides: Partial<Showcase> = {}): Showcase {
  return {
    id: "sc1",
    tenantId: "t1",
    clientId: null,
    name: "Spring Drop",
    shareLink: "abcdef12",
    isActive: true,
    createdAt: new Date(),
    ...overrides,
  };
}

function repoMock(
  overrides: Partial<ShowcaseRepository> = {},
): ShowcaseRepository {
  return {
    findById: vi.fn().mockResolvedValue(fakeShowcase()),
    findByShareLink: vi.fn().mockResolvedValue(fakeShowcase()),
    list: vi.fn().mockResolvedValue([]),
    create: vi
      .fn()
      .mockImplementation((data) => Promise.resolve(fakeShowcase(data))),
    update: vi.fn(),
    delete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("listShowcases", () => {
  it("forwards tenantId verbatim", async () => {
    const repo = repoMock();
    await listShowcases("t1", repo);
    expect(repo.list).toHaveBeenCalledWith("t1");
  });
});

describe("createShowcase", () => {
  it("generates an 8-char lowercase-hex shareLink and forwards the rest", async () => {
    const repo = repoMock();
    await createShowcase("t1", "Spring Drop", "c1", ["p1", "p2"], repo);
    const call = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(call.tenantId).toBe("t1");
    expect(call.name).toBe("Spring Drop");
    expect(call.clientId).toBe("c1");
    expect(call.productIds).toEqual(["p1", "p2"]);
    expect(call.shareLink).toMatch(/^[a-f0-9]{8}$/);
  });

  it("generates a fresh shareLink on each call (CSPRNG, not constant)", async () => {
    const repo = repoMock();
    await createShowcase("t1", "A", undefined, [], repo);
    await createShowcase("t1", "B", undefined, [], repo);
    const a = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]
      .shareLink;
    const b = (repo.create as ReturnType<typeof vi.fn>).mock.calls[1]?.[0]
      .shareLink;
    expect(a).not.toBe(b);
  });
});

describe("deleteShowcase", () => {
  it("deletes when the showcase exists in the tenant", async () => {
    const repo = repoMock();
    await deleteShowcase("t1", "sc1", repo);
    expect(repo.findById).toHaveBeenCalledWith("t1", "sc1");
    expect(repo.delete).toHaveBeenCalledWith("t1", "sc1");
  });

  it("throws ShowcaseNotFoundError when missing", async () => {
    const repo = repoMock({ findById: vi.fn().mockResolvedValue(null) });
    await expect(deleteShowcase("t1", "ghost", repo)).rejects.toThrow(
      ShowcaseNotFoundError,
    );
    expect(repo.delete).not.toHaveBeenCalled();
  });
});

describe("getPublicShowcase", () => {
  it("looks up by shareLink only (no tenantId — link is the auth)", async () => {
    const repo = repoMock();
    await getPublicShowcase("abcdef12", repo);
    expect(repo.findByShareLink).toHaveBeenCalledWith("abcdef12");
  });

  it("returns null when the link doesn't resolve to a showcase", async () => {
    const repo = repoMock({ findByShareLink: vi.fn().mockResolvedValue(null) });
    const out = await getPublicShowcase("bad-link", repo);
    expect(out).toBeNull();
  });
});
