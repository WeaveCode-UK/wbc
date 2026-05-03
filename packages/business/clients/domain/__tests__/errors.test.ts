import { describe, it, expect } from "vitest";
import {
  ClientNotFoundError,
  DuplicatePhoneError,
  TagNotFoundError,
  DuplicateTagError,
  InvalidClientDataError,
} from "../errors";

describe("ClientNotFoundError", () => {
  it("uses the generic message when id is omitted", () => {
    const e = new ClientNotFoundError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("ClientNotFoundError");
    expect(e.message).toBe("Client not found");
  });

  it("includes the client id when provided", () => {
    const e = new ClientNotFoundError("c-1");
    expect(e.message).toBe("Client not found: c-1");
  });
});

describe("DuplicatePhoneError", () => {
  it("includes the offending phone in the message", () => {
    const e = new DuplicatePhoneError("+5511999999999");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("DuplicatePhoneError");
    expect(e.message).toContain("+5511999999999");
  });
});

describe("TagNotFoundError", () => {
  it("uses the generic message when id is omitted", () => {
    const e = new TagNotFoundError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("TagNotFoundError");
    expect(e.message).toBe("Tag not found");
  });

  it("includes the tag id when provided", () => {
    const e = new TagNotFoundError("tag-7");
    expect(e.message).toBe("Tag not found: tag-7");
  });
});

describe("DuplicateTagError", () => {
  it("includes the duplicated tag name in the message", () => {
    const e = new DuplicateTagError("VIP");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("DuplicateTagError");
    expect(e.message).toContain("VIP");
  });
});

describe("InvalidClientDataError", () => {
  it("forwards the caller-provided message verbatim", () => {
    const e = new InvalidClientDataError("birthday must be in the past");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("InvalidClientDataError");
    expect(e.message).toBe("birthday must be in the past");
  });
});
