import { describe, it, expect } from "vitest";
import { MessageSendFailedError, WhatsAppNotConnectedError } from "../errors";

describe("MessageSendFailedError", () => {
  it("uses the default message when no reason is provided", () => {
    const e = new MessageSendFailedError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("MessageSendFailedError");
    expect(e.message).toBe("Failed to send message");
  });

  it("forwards a caller-provided reason as the message", () => {
    const e = new MessageSendFailedError("rate limited by upstream");
    expect(e.message).toBe("rate limited by upstream");
  });
});

describe("WhatsAppNotConnectedError", () => {
  it("has the expected name and message", () => {
    const e = new WhatsAppNotConnectedError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("WhatsAppNotConnectedError");
    expect(e.message).toBe("WhatsApp N2 is not connected");
  });
});
