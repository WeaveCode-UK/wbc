// Coverage push — LGPD anonymisation (ACH-011 stub + placeholder builder).
//
// The use-case is a stub awaiting the repo seam, but we still lock:
//   - missing client → ClientNotFoundError (no leak)
//   - present client → throws "not implemented" with the doc reference
//     so ops sees clear text when the path is hit prematurely
//   - buildAnonymizedPlaceholder: deterministic, includes the
//     8-char prefix, nulls out free-text and health fields
import { describe, it, expect, vi } from "vitest";
import {
  anonymizeClient,
  buildAnonymizedPlaceholder,
} from "../anonymize-client";
import type { ClientRepository } from "../../ports/client-repository";
import { ClientNotFoundError } from "../../domain/errors";

function repo(found: boolean): ClientRepository {
  return {
    findById: vi
      .fn()
      .mockResolvedValue(
        found ? { id: "c-1", tenantId: "t1", name: "Maria" } : null,
      ),
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as ClientRepository;
}

describe("anonymizeClient (stub)", () => {
  it("throws ClientNotFoundError when the row is missing (no cross-tenant leak)", async () => {
    await expect(
      anonymizeClient("t1", "ghost", repo(false)),
    ).rejects.toBeInstanceOf(ClientNotFoundError);
  });

  it("throws 'not implemented' for present rows pointing at the policy doc", async () => {
    await expect(anonymizeClient("t1", "c-1", repo(true))).rejects.toThrow(
      /not implemented.*ANONYMIZATION-POLICY\.md.*ACH-011/,
    );
  });
});

describe("buildAnonymizedPlaceholder", () => {
  it("uses the first 8 chars of the id for stable uniqueness", () => {
    const p = buildAnonymizedPlaceholder(
      "abcdef12-3456-7890-abcd-ef1234567890",
    );
    expect(p.name).toBe("anon-abcdef12");
    expect(p.email).toBe("anon-abcdef12@anonymized.invalid");
  });

  it("nulls out free-text and health fields (LGPD art. 11)", () => {
    const p = buildAnonymizedPlaceholder("any-id");
    expect(p.notes).toBeNull();
    expect(p.preferences).toBeNull();
    expect(p.allergies).toBeNull();
  });

  it("clears phone (cannot be re-derived from the id)", () => {
    const p = buildAnonymizedPlaceholder("any-id");
    expect(p.phone).toBe("");
  });

  it("is deterministic — same id → same placeholder", () => {
    expect(buildAnonymizedPlaceholder("a-b-c-d")).toEqual(
      buildAnonymizedPlaceholder("a-b-c-d"),
    );
  });
});
