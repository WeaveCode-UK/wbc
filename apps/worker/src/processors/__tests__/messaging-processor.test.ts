// Coverage gap: messaging-processor is the consumer for `wbc:messaging`
// — it routes outbound text/audio to either N2 (Meta Cloud) or N1
// (Notification + deep link). The branches that matter:
//   - missing client → log warn + ack (no retry — phantom job)
//   - empty payload (no message and no audioUrl) → log + ack
//   - channel=N2 + N2 succeeds → no N1 fallback
//   - channel=N2 + N2 throws → falls back to N1 (createPushableNotification)
//   - channel=N1 from the outset → directly creates notification
//
// We mock the WhatsApp N2 adapter, the N1 fallback (createPushableNotification),
// the channel selector, prisma client lookup, and bullmq.

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Job } from "bullmq";

const {
  sendTextMock,
  sendAudioMock,
  selectChannelMock,
  createNotificationMock,
  generateDeepLinkMock,
  findClientMock,
} = vi.hoisted(() => ({
  sendTextMock: vi.fn(),
  sendAudioMock: vi.fn(),
  selectChannelMock: vi.fn(),
  createNotificationMock: vi.fn().mockResolvedValue(undefined),
  generateDeepLinkMock: vi.fn(
    (phone: string, msg: string) =>
      `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
  ),
  findClientMock: vi.fn(),
}));

vi.mock("@wbc/business/messaging/adapters/whatsapp-n2-adapter", () => ({
  WhatsAppN2Adapter: class {
    sendText = sendTextMock;
    sendAudio = sendAudioMock;
    sendImage = vi.fn();
  },
}));

vi.mock("@wbc/business/messaging/domain/whatsapp", () => ({
  generateDeepLink: generateDeepLinkMock,
}));

vi.mock("@wbc/business/schedule/use-cases/notification-fanout", () => ({
  createPushableNotification: createNotificationMock,
}));

vi.mock("../../lib/select-whatsapp-channel", () => ({
  selectWhatsAppChannel: selectChannelMock,
}));

vi.mock("@wbc/db", () => ({
  prisma: {
    client: { findFirst: findClientMock },
  },
}));

vi.mock("../../lib/redis", () => ({ connection: { __fake: true } }));

interface MessagingJobData {
  type: "SEND_TEXT" | "SEND_AUDIO" | "SEND_SCHEDULED";
  tenantId: string;
  clientId: string;
  message?: string;
  audioUrl?: string;
}

const captured: { fn?: (job: Job<MessagingJobData>) => Promise<void> } = {};

vi.mock("bullmq", () => ({
  Worker: class {
    on = vi.fn();
    constructor(
      _name: string,
      processor: (job: Job<MessagingJobData>) => Promise<void>,
    ) {
      captured.fn = processor;
    }
  },
}));

beforeEach(async () => {
  sendTextMock.mockReset();
  sendAudioMock.mockReset();
  selectChannelMock.mockReset();
  createNotificationMock.mockReset().mockResolvedValue(undefined);
  generateDeepLinkMock.mockClear();
  findClientMock.mockReset();
  captured.fn = undefined;
  vi.resetModules();
  const fresh = await import("../messaging-processor");
  fresh.startMessagingWorker();
});

function makeJob(data: MessagingJobData): Job<MessagingJobData> {
  return { id: "j-1", name: "send", data } as unknown as Job<MessagingJobData>;
}

describe("messaging-processor — early returns", () => {
  it("ack-and-warn when neither message nor audioUrl is present", async () => {
    await captured.fn!(
      makeJob({ type: "SEND_TEXT", tenantId: "t", clientId: "c" }),
    );
    expect(findClientMock).not.toHaveBeenCalled();
    expect(sendTextMock).not.toHaveBeenCalled();
    expect(createNotificationMock).not.toHaveBeenCalled();
  });

  it("ack-and-warn when client is not found (phantom job)", async () => {
    findClientMock.mockResolvedValue(null);
    await captured.fn!(
      makeJob({
        type: "SEND_TEXT",
        tenantId: "t",
        clientId: "c-missing",
        message: "hi",
      }),
    );
    expect(sendTextMock).not.toHaveBeenCalled();
    expect(createNotificationMock).not.toHaveBeenCalled();
  });
});

describe("messaging-processor — N2 happy path", () => {
  beforeEach(() => {
    findClientMock.mockResolvedValue({
      name: "Alice",
      phone: "+5511999990000",
    });
    selectChannelMock.mockResolvedValue("N2");
  });

  it("sends a text via N2 with the idempotency key derived from job.id", async () => {
    sendTextMock.mockResolvedValue({ success: true, messageId: "wamid.X" });

    await captured.fn!(
      makeJob({
        type: "SEND_TEXT",
        tenantId: "t",
        clientId: "c",
        message: "Olá Alice",
      }),
    );

    expect(sendTextMock).toHaveBeenCalledOnce();
    const [phone, msg, opts] = sendTextMock.mock.calls[0] as [
      string,
      string,
      { idempotencyKey: string },
    ];
    expect(phone).toBe("+5511999990000");
    expect(msg).toBe("Olá Alice");
    expect(opts.idempotencyKey).toBe("msg:j-1");
    expect(createNotificationMock).not.toHaveBeenCalled();
  });

  it("routes to sendAudio when audioUrl is set", async () => {
    sendAudioMock.mockResolvedValue({ success: true, messageId: "wamid.A" });

    await captured.fn!(
      makeJob({
        type: "SEND_AUDIO",
        tenantId: "t",
        clientId: "c",
        audioUrl: "https://cdn.test/a.mp3",
      }),
    );

    expect(sendAudioMock).toHaveBeenCalledOnce();
    expect(sendTextMock).not.toHaveBeenCalled();
    const [phone, audio] = sendAudioMock.mock.calls[0] as [string, string];
    expect(audio).toBe("https://cdn.test/a.mp3");
    expect(phone).toBe("+5511999990000");
  });
});

describe("messaging-processor — N2 fails → N1 fallback", () => {
  it("creates a pushable notification with a wa.me deep link when N2 throws", async () => {
    findClientMock.mockResolvedValue({
      name: "Alice",
      phone: "+5511999990000",
    });
    selectChannelMock.mockResolvedValue("N2");
    sendTextMock.mockRejectedValue(new Error("N2 down"));

    await captured.fn!(
      makeJob({
        type: "SEND_TEXT",
        tenantId: "t",
        clientId: "c",
        message: "Olá",
      }),
    );

    expect(createNotificationMock).toHaveBeenCalledOnce();
    const arg = createNotificationMock.mock.calls[0]![0] as {
      tenantId: string;
      title: string;
      body: string;
    };
    expect(arg.tenantId).toBe("t");
    expect(arg.title).toContain("Alice");
    expect(arg.body).toContain("https://wa.me/+5511999990000");
  });
});

describe("messaging-processor — N1 channel direct", () => {
  it("creates a notification without calling the N2 adapter", async () => {
    findClientMock.mockResolvedValue({
      name: "Alice",
      phone: "+5511999990000",
    });
    selectChannelMock.mockResolvedValue("N1");

    await captured.fn!(
      makeJob({
        type: "SEND_TEXT",
        tenantId: "t",
        clientId: "c",
        message: "Olá",
      }),
    );

    expect(sendTextMock).not.toHaveBeenCalled();
    expect(createNotificationMock).toHaveBeenCalledOnce();
  });
});
