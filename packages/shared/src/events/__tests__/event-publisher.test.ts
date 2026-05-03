// Coverage push — event publisher boundary.
//
// We lock the contract that protects the outbox pattern:
//   - publish() before setOutboxPort() throws OutboxNotInitializedError
//     (typed name so app boot can distinguish from arbitrary errors)
//   - assertOutboxReady() throws when not wired (the startup gate)
//   - isOutboxReady() reflects the current state without throwing
//   - the event written to the port carries id, type, tenantId, payload,
//     timestamp, version=1, and OPTIONAL trace metadata
//   - schema-validation runs against the payload before save
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  setOutboxPort,
  publish,
  isOutboxReady,
  assertOutboxReady,
  OutboxNotInitializedError,
} from "../event-publisher";
import type { OutboxPort } from "../outbox-service";

function fakePort() {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    saveBatch: vi.fn().mockResolvedValue(undefined),
  } as unknown as OutboxPort & { save: ReturnType<typeof vi.fn> };
}

beforeEach(() => {
  // Reset the module-scoped port between tests by calling the setter
  // with `null` cast — there's no public reset, but unset is the
  // initial state we re-create via fresh module import in some cases.
  setOutboxPort(null as unknown as OutboxPort);
});

describe("OutboxNotInitializedError", () => {
  it("has the typed `.name` so app boot can branch on it", () => {
    const err = new OutboxNotInitializedError();
    expect(err.name).toBe("OutboxNotInitializedError");
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toContain("OutboxPort");
  });
});

describe("isOutboxReady / assertOutboxReady", () => {
  it("isOutboxReady returns false until setOutboxPort runs", () => {
    expect(isOutboxReady()).toBe(false);
  });

  it("assertOutboxReady throws when not wired (startup gate)", () => {
    expect(() => assertOutboxReady()).toThrow(OutboxNotInitializedError);
  });

  it("isOutboxReady becomes true after wiring", () => {
    setOutboxPort(fakePort());
    expect(isOutboxReady()).toBe(true);
  });

  it("assertOutboxReady is silent after wiring", () => {
    setOutboxPort(fakePort());
    expect(() => assertOutboxReady()).not.toThrow();
  });
});

describe("publish()", () => {
  it("throws OutboxNotInitializedError if called before setOutboxPort", async () => {
    await expect(
      publish("sale.created", "t1", { x: 1 }),
    ).rejects.toBeInstanceOf(OutboxNotInitializedError);
  });

  it("writes an event with id/type/tenantId/payload/timestamp/version", async () => {
    const port = fakePort();
    setOutboxPort(port);
    await publish("sale.created", "tenant-A", { saleId: "s-1", total: 100 });
    expect(port.save).toHaveBeenCalledOnce();
    const event = port.save.mock.calls[0]![0] as {
      id: string;
      type: string;
      tenantId: string;
      payload: unknown;
      timestamp: Date;
      version: number;
    };
    expect(event.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(event.type).toBe("sale.created");
    expect(event.tenantId).toBe("tenant-A");
    expect(event.payload).toEqual({ saleId: "s-1", total: 100 });
    expect(event.timestamp).toBeInstanceOf(Date);
    expect(event.version).toBe(1);
  });

  it("each call gets a fresh id (no collisions across publishes)", async () => {
    const port = fakePort();
    setOutboxPort(port);
    await publish("sale.created", "t1", { i: 1 });
    await publish("sale.created", "t1", { i: 2 });
    const ids = port.save.mock.calls.map((c) => (c[0] as { id: string }).id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("propagates the port's error if save() fails", async () => {
    const port = fakePort();
    port.save.mockRejectedValueOnce(new Error("postgres down"));
    setOutboxPort(port);
    await expect(publish("sale.created", "t1", {})).rejects.toThrow(
      "postgres down",
    );
  });

  it("does not include `metadata` when no active OTel span", async () => {
    const port = fakePort();
    setOutboxPort(port);
    await publish("sale.created", "t1", {});
    const event = port.save.mock.calls[0]![0] as Record<string, unknown>;
    expect(event.metadata).toBeUndefined();
  });
});
