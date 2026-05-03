import { describe, it, expect } from "vitest";
import { LandingPageNotFoundError, SlugAlreadyTakenError } from "../errors";

describe("LandingPageNotFoundError", () => {
  it("includes the tenantId in the message", () => {
    const e = new LandingPageNotFoundError("t-1");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("LandingPageNotFoundError");
    expect(e.message).toBe("Landing page not found for tenant: t-1");
  });
});

describe("SlugAlreadyTakenError", () => {
  it("includes the slug in the message", () => {
    const e = new SlugAlreadyTakenError("ana-makeup");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("SlugAlreadyTakenError");
    expect(e.message).toBe("Slug already taken: ana-makeup");
  });
});
