// registerTenant — DEPRECATED legacy onboarding, kept compiling
//
// Even though this use-case is replaced by complete-onboarding.use-case,
// it still ships in the bundle. We pin the behaviour so a refactor doesn't
// silently change the slug algorithm or the default plan ("ESSENTIAL").
//
// Slug rules:
//   - lowercase
//   - strip diacritics (NFD + combining marks)
//   - collapse non-alphanumerics to "-"
//   - trim leading/trailing "-"
import { describe, it, expect, vi } from "vitest";
import { registerTenant, type TenantRepository } from "../register-tenant";

function mockRepo(opts: { existing?: boolean } = {}): TenantRepository {
  return {
    findBySlug: vi
      .fn()
      .mockResolvedValue(opts.existing ? { id: "existing" } : null),
    create: vi.fn().mockImplementation(async (data) => ({
      id: "tenant-1",
      name: data.name,
      slug: data.slug,
      locale: "pt-BR",
      timezone: "America/Sao_Paulo",
      currency: "BRL",
    })),
    createSubscription: vi.fn().mockResolvedValue(undefined),
  };
}

describe("registerTenant (deprecated)", () => {
  it("creates a tenant with a slugified name", async () => {
    const repo = mockRepo();
    const out = await registerTenant({ name: "My Studio" }, repo);

    expect(out.slug).toBe("my-studio");
    expect(out.tenantId).toBe("tenant-1");
    expect(repo.create).toHaveBeenCalledWith({
      name: "My Studio",
      slug: "my-studio",
    });
  });

  it("normalises diacritics in the slug (Café → cafe)", async () => {
    const repo = mockRepo();
    await registerTenant({ name: "Café São Paulo" }, repo);

    const arg = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(arg.slug).toBe("cafe-sao-paulo");
  });

  it("trims trailing dashes and collapses runs of non-alphanumerics", async () => {
    const repo = mockRepo();
    await registerTenant({ name: "   !!Hello   World!!   " }, repo);
    const arg = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(arg.slug).toBe("hello-world");
  });

  it("rejects a name whose slug already exists", async () => {
    const repo = mockRepo({ existing: true });
    await expect(registerTenant({ name: "Taken" }, repo)).rejects.toThrow(
      /already in use/i,
    );
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("opens a subscription on the default ESSENTIAL plan after create", async () => {
    const repo = mockRepo();
    await registerTenant({ name: "X" }, repo);
    expect(repo.createSubscription).toHaveBeenCalledWith(
      "tenant-1",
      "ESSENTIAL",
    );
  });
});
