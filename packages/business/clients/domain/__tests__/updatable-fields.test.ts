// Coverage push — ACH-008 system-managed-field guard. Generic
// update() should never let a caller flip id, tenantId, classification,
// engagementScore, etc. We assert the allowlist + the picker drops
// anything outside it.
import { describe, it, expect } from "vitest";
import {
  CLIENT_UPDATABLE_FIELDS,
  pickClientUpdatable,
} from "../updatable-fields";

describe("CLIENT_UPDATABLE_FIELDS", () => {
  it("contains exactly the safe-to-mutate fields", () => {
    expect([...CLIENT_UPDATABLE_FIELDS].sort()).toEqual(
      [
        "email",
        "isActive",
        "isLead",
        "name",
        "notes",
        "phone",
        "version",
      ].sort(),
    );
  });
});

describe("pickClientUpdatable", () => {
  it("keeps only allowlisted fields", () => {
    const out = pickClientUpdatable({
      name: "Maria",
      email: "m@x.com",
      phone: "+5511999999999",
      isLead: true,
    });
    expect(out).toEqual({
      name: "Maria",
      email: "m@x.com",
      phone: "+5511999999999",
      isLead: true,
    });
  });

  it("drops every system-managed field even when supplied (ACH-008)", () => {
    const out = pickClientUpdatable({
      name: "Maria",
      // Sneaky: caller tries to flip system fields.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...({
        id: "evil",
        tenantId: "evil-t",
        classification: "A",
        engagementScore: 999,
        firstPurchaseAt: new Date(),
        deletedAt: null,
        createdAt: new Date(),
      } as any),
    });
    expect(out).toEqual({ name: "Maria" });
    expect((out as Record<string, unknown>).id).toBeUndefined();
    expect((out as Record<string, unknown>).tenantId).toBeUndefined();
    expect((out as Record<string, unknown>).classification).toBeUndefined();
  });

  it("drops undefined entries (idempotent on partial input)", () => {
    const out = pickClientUpdatable({
      name: "Maria",
      email: undefined,
      phone: undefined,
    });
    expect(out).toEqual({ name: "Maria" });
  });

  it("returns an empty object when input has no allowlisted keys", () => {
    expect(pickClientUpdatable({})).toEqual({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(pickClientUpdatable({ id: "x" } as any)).toEqual({});
  });
});
