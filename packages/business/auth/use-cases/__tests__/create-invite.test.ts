// CreateInvite — admin issues a tenant invite link
//
// Invariants:
//   - Token is randomly generated (32 hex bytes via randomBytes).
//   - Email is normalised to lowercase + trimmed before persistence.
//   - Expiry is ~7 days from now.
//   - Email is sent via EmailSender; the URL contains the URL-encoded token.
//   - tenantName is admin-controlled — it MUST be HTML-escaped before
//     interpolation to defeat ACH-053 phishing in the recipient's inbox.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CreateInvite } from "../create-invite.use-case";
import type {
  InviteRepository,
  InviteData,
} from "../../ports/invite.repository";
import type { EmailSender } from "../../ports/email-sender.port";

function makeInviteData(): InviteData {
  return {
    id: "inv-1",
    tenantId: "tenant-1",
    email: "user@example.com",
    role: "CONSULTANT",
    invitedBy: "admin",
    token: "ignored",
    status: "PENDING",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    acceptedAt: null,
    createdAt: new Date("2026-01-01"),
  };
}

function mockInviteRepo(): InviteRepository {
  return {
    findById: vi.fn(),
    findByToken: vi.fn(),
    findByTenantId: vi.fn(),
    create: vi.fn().mockResolvedValue(makeInviteData()),
    updateStatus: vi.fn(),
    expirePending: vi.fn(),
  };
}

function mockEmailSender(): EmailSender {
  return { send: vi.fn().mockResolvedValue(undefined) };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXTAUTH_URL = "https://app.example.com";
});

afterEach(() => {
  delete process.env.NEXTAUTH_URL;
});

describe("CreateInvite", () => {
  it("persists invite with normalised email + ~7-day expiry", async () => {
    const repo = mockInviteRepo();
    const useCase = new CreateInvite(repo, mockEmailSender());

    const before = Date.now();
    await useCase.execute({
      tenantId: "tenant-1",
      email: "  USER@Example.COM ",
      role: "LEADER",
      invitedBy: "admin",
      tenantName: "My Studio",
    });
    const after = Date.now();

    expect(repo.create).toHaveBeenCalledOnce();
    const arg = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(arg.email).toBe("user@example.com");
    expect(arg.tenantId).toBe("tenant-1");
    expect(arg.role).toBe("LEADER");
    expect(arg.invitedBy).toBe("admin");
    // ~7 days TTL within a generous tolerance.
    const expiry = (arg.expiresAt as Date).getTime();
    expect(expiry).toBeGreaterThanOrEqual(
      before + 7 * 24 * 60 * 60 * 1000 - 1000,
    );
    expect(expiry).toBeLessThanOrEqual(after + 7 * 24 * 60 * 60 * 1000 + 1000);
  });

  it("returns the plaintext token + invite id to the caller", async () => {
    const useCase = new CreateInvite(mockInviteRepo(), mockEmailSender());

    const result = await useCase.execute({
      tenantId: "tenant-1",
      email: "u@x.com",
      role: "CONSULTANT",
      invitedBy: "admin",
      tenantName: "Studio",
    });

    expect(result.inviteId).toBe("inv-1");
    // 32 random bytes hex-encoded → 64 chars.
    expect(result.token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("dispatches the invite email containing the URL-encoded token", async () => {
    const email = mockEmailSender();
    const useCase = new CreateInvite(mockInviteRepo(), email);

    await useCase.execute({
      tenantId: "tenant-1",
      email: "u@x.com",
      role: "CONSULTANT",
      invitedBy: "admin",
      tenantName: "Studio",
    });

    const sent = (email.send as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(sent.to).toBe("u@x.com");
    expect(sent.subject).toContain("Studio");
    expect(sent.html).toContain("https://app.example.com/invite?token=");
  });

  it("HTML-escapes the admin-supplied tenantName (ACH-053)", async () => {
    const email = mockEmailSender();
    const useCase = new CreateInvite(mockInviteRepo(), email);

    await useCase.execute({
      tenantId: "tenant-1",
      email: "u@x.com",
      role: "CONSULTANT",
      invitedBy: "admin",
      // Crafted to escape `<strong>...</strong>` and inject script.
      tenantName: "</strong><script>alert(1)</script>",
    });

    const html = (email.send as ReturnType<typeof vi.fn>).mock.calls[0]![0]
      .html as string;
    // Raw script tag must NOT appear unescaped.
    expect(html).not.toContain("<script>alert(1)</script>");
    // Escaped form must be present (e.g. &lt;script&gt;).
    expect(html).toContain("&lt;script&gt;");
  });

  it("issues a different token on each call (randomness)", async () => {
    const useCase = new CreateInvite(mockInviteRepo(), mockEmailSender());
    const a = await useCase.execute({
      tenantId: "t",
      email: "u@x.com",
      role: "CONSULTANT",
      invitedBy: "admin",
      tenantName: "S",
    });
    const b = await useCase.execute({
      tenantId: "t",
      email: "u@x.com",
      role: "CONSULTANT",
      invitedBy: "admin",
      tenantName: "S",
    });
    expect(a.token).not.toBe(b.token);
  });
});
