// Coverage push — gift-suggestor CRUD (#29 in the spec).
import { describe, it, expect, vi } from "vitest";
import {
  listGiftSuggestors,
  addGiftSuggestor,
  removeGiftSuggestor,
  type GiftSuggestorRepository,
} from "../manage-gift-suggestors";

function repo(): GiftSuggestorRepository {
  return {
    list: vi.fn().mockResolvedValue([]),
    add: vi
      .fn()
      .mockImplementation(async (tenantId, clientId, name, phone) => ({
        id: "g-1",
        clientId,
        suggestorName: name,
        suggestorPhone: phone,
      })),
    remove: vi.fn().mockResolvedValue(undefined),
  };
}

describe("listGiftSuggestors", () => {
  it("forwards (tenantId, clientId)", async () => {
    const r = repo();
    await listGiftSuggestors("t1", "c1", r);
    expect(r.list).toHaveBeenCalledWith("t1", "c1");
  });
});

describe("addGiftSuggestor", () => {
  it("returns the persisted entity from the repo", async () => {
    const r = repo();
    const out = await addGiftSuggestor(
      "t1",
      "c1",
      "Marido",
      "+5511999999999",
      r,
    );
    expect(out.suggestorName).toBe("Marido");
    expect(r.add).toHaveBeenCalledWith("t1", "c1", "Marido", "+5511999999999");
  });
});

describe("removeGiftSuggestor", () => {
  it("forwards (tenantId, id)", async () => {
    const r = repo();
    await removeGiftSuggestor("t1", "g-1", r);
    expect(r.remove).toHaveBeenCalledWith("t1", "g-1");
  });
});
