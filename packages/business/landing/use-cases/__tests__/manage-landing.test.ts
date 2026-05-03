// T2.30 — landing use-cases (get / update / toggle / public)
//
// The use-cases are thin orchestrators over LandingRepository. We lock:
//   - getLandingPage / getPublicLandingPage are read-only forwards.
//   - updateLandingPage builds an upsert payload that:
//       · always sets tenantId from the caller (not from `data`).
//       · derives a deterministic slug from tenantId (the first 8
//         chars), so two updates for the same tenant target the same
//         page row — uniqueness comes from this derivation, not from
//         random IDs.
//       · defaults missing optional fields to null (bio/philosophy/
//         photoUrl) and whatsappPhone to "" (NOT null — the field is
//         required in the entity).
//       · always sets isActive=true on update — re-enables a page
//         that was previously toggled off.
//   - toggleLandingActive forwards (tenantId, isActive). When isActive
//     is false, the public page must "disappear" — we model that by
//     letting the repo return a row with isActive=false; the public
//     getter is a separate findBySlug call (callers must check the
//     flag — this test asserts the repo update is correctly invoked).

import { describe, it, expect, vi } from "vitest";
import {
  getLandingPage,
  updateLandingPage,
  toggleLandingActive,
  getPublicLandingPage,
} from "../manage-landing";
import type { LandingRepository } from "../../ports/landing-repository";
import type { LandingPageEntity } from "../../domain/entities";

function basePage(
  overrides: Partial<LandingPageEntity> = {},
): LandingPageEntity {
  return {
    id: "lp-1",
    tenantId: "tenant-12345678-aaaa",
    slug: "landing-tenant-1",
    name: "",
    bio: null,
    philosophy: null,
    photoUrl: null,
    whatsappPhone: "",
    brands: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function repoMock(
  overrides: Partial<LandingRepository> = {},
): LandingRepository {
  return {
    findByTenantId: vi.fn().mockResolvedValue(null),
    findBySlug: vi.fn().mockResolvedValue(null),
    upsert: vi.fn().mockImplementation((tenantId, data) =>
      Promise.resolve(
        basePage({
          tenantId,
          slug: data.slug,
          bio: data.bio ?? null,
          philosophy: data.philosophy ?? null,
          photoUrl: data.photoUrl ?? null,
          whatsappPhone: data.whatsappPhone,
          isActive: data.isActive,
        }),
      ),
    ),
    toggleActive: vi
      .fn()
      .mockImplementation((tenantId, isActive) =>
        Promise.resolve(basePage({ tenantId, isActive })),
      ),
    ...overrides,
  };
}

describe("getLandingPage", () => {
  it("forwards tenantId to findByTenantId", async () => {
    const repo = repoMock();
    await getLandingPage("tenant-X", repo);
    expect(repo.findByTenantId).toHaveBeenCalledWith("tenant-X");
  });

  it("returns null when no page exists for the tenant", async () => {
    const repo = repoMock();
    const r = await getLandingPage("tenant-X", repo);
    expect(r).toBeNull();
  });
});

describe("updateLandingPage — upsert payload contract", () => {
  it("derives a deterministic slug from the first 8 chars of tenantId", async () => {
    const repo = repoMock();
    await updateLandingPage(
      "abcd1234-5678-aaaa-bbbb-cccccccccccc",
      { bio: "olá" },
      repo,
    );
    const call = (repo.upsert as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call?.[1].slug).toBe("landing-abcd1234");
  });

  it("two updates for the same tenant target the same slug (uniqueness per tenant)", async () => {
    const repo = repoMock();
    await updateLandingPage("tenant-AAAA-1111", { bio: "first" }, repo);
    await updateLandingPage("tenant-AAAA-1111", { bio: "second" }, repo);
    const calls = (repo.upsert as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0]?.[1].slug).toBe(calls[1]?.[1].slug);
  });

  it("different tenants yield different slugs (no cross-tenant collision)", async () => {
    const repo = repoMock();
    await updateLandingPage("tenant-AAAA-1111", { bio: "x" }, repo);
    await updateLandingPage("tenant-BBBB-2222", { bio: "y" }, repo);
    const calls = (repo.upsert as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0]?.[1].slug).not.toBe(calls[1]?.[1].slug);
  });

  it("defaults missing optional fields: bio/philosophy/photoUrl → null, whatsappPhone → ''", async () => {
    const repo = repoMock();
    await updateLandingPage("tenant-1", {}, repo);
    const data = (repo.upsert as ReturnType<typeof vi.fn>).mock.calls[0]?.[1];
    expect(data.bio).toBeNull();
    expect(data.philosophy).toBeNull();
    expect(data.photoUrl).toBeNull();
    // Why: whatsappPhone is non-null in the entity, so the use-case
    // forces "" instead of null when caller omits it.
    expect(data.whatsappPhone).toBe("");
  });

  it("forwards every provided field verbatim", async () => {
    const repo = repoMock();
    await updateLandingPage(
      "tenant-1",
      {
        bio: "Sou consultora",
        philosophy: "Beleza é cuidado",
        photoUrl: "https://x.test/p.jpg",
        whatsappLink: "+5511999998888",
      },
      repo,
    );
    const data = (repo.upsert as ReturnType<typeof vi.fn>).mock.calls[0]?.[1];
    expect(data.bio).toBe("Sou consultora");
    expect(data.philosophy).toBe("Beleza é cuidado");
    expect(data.photoUrl).toBe("https://x.test/p.jpg");
    expect(data.whatsappPhone).toBe("+5511999998888");
  });

  it("always sets isActive=true on update (re-enables a toggled-off page)", async () => {
    const repo = repoMock();
    await updateLandingPage("tenant-1", { bio: "x" }, repo);
    const data = (repo.upsert as ReturnType<typeof vi.fn>).mock.calls[0]?.[1];
    expect(data.isActive).toBe(true);
  });

  it("upsert receives tenantId both as first arg and inside the payload", async () => {
    const repo = repoMock();
    await updateLandingPage("tenant-X", { bio: "x" }, repo);
    const call = (repo.upsert as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call?.[0]).toBe("tenant-X");
    expect(call?.[1].tenantId).toBe("tenant-X");
  });
});

describe("toggleLandingActive — public visibility", () => {
  it("forwards (tenantId, isActive=false) — page disappears from public", async () => {
    const repo = repoMock();
    await toggleLandingActive("tenant-X", false, repo);
    expect(repo.toggleActive).toHaveBeenCalledWith("tenant-X", false);
  });

  it("forwards (tenantId, isActive=true) — page re-published", async () => {
    const repo = repoMock();
    await toggleLandingActive("tenant-X", true, repo);
    expect(repo.toggleActive).toHaveBeenCalledWith("tenant-X", true);
  });
});

describe("getPublicLandingPage", () => {
  it("looks up by slug only (no tenant context — public-facing)", async () => {
    const repo = repoMock({
      findBySlug: vi.fn().mockResolvedValue(basePage({ slug: "landing-x" })),
    });
    const r = await getPublicLandingPage("landing-x", repo);
    expect(repo.findBySlug).toHaveBeenCalledWith("landing-x");
    expect(r?.slug).toBe("landing-x");
  });

  it("returns null when slug doesn't exist", async () => {
    const repo = repoMock();
    const r = await getPublicLandingPage("does-not-exist", repo);
    expect(r).toBeNull();
  });
});
