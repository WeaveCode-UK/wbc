// T2.21 — campaigns.create / confirm / cancel
//
// The thin use-case (createCampaign) is mostly a pass-through to the
// CampaignRepository, but we still need to lock in:
//   - tenantId is always injected — caller never controls it
//   - scheduledAt is forwarded verbatim (no silent now() coercion)
//   - the recipient list reaches the repo intact (the fan-out into
//     CampaignRecipient rows happens inside the adapter, but the count
//     of N is preserved on the way down)
// confirmCampaign carries the real branching logic — DRAFT → SCHEDULED
// when scheduledAt is set, otherwise → SENDING; emits CAMPAIGN_DISPATCHED.
// cancelCampaign is a NO-OP if id missing. We stub `publish` from
// @wbc/shared so the test runs without a Redis bus.

import { describe, it, expect, vi, beforeEach } from "vitest";

const { publishMock } = vi.hoisted(() => ({
  publishMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@wbc/shared", async () => {
  const actual =
    await vi.importActual<typeof import("@wbc/shared")>("@wbc/shared");
  return {
    ...actual,
    publish: publishMock,
  };
});

import {
  createCampaign,
  confirmCampaign,
  cancelCampaign,
  listCampaigns,
  getRecipients,
} from "../manage-campaigns";
import type { CampaignRepository } from "../../ports/campaign-repository";
import {
  CampaignNotFoundError,
  InvalidCampaignStatusError,
} from "../../domain/errors";
import type { Campaign } from "../../domain/entities";

function baseCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: "c1",
    tenantId: "t1",
    name: "BF",
    message: "Olá {{nome}}!",
    audioUrl: null,
    attachments: null,
    status: "DRAFT",
    scheduledAt: null,
    statsReceived: 0,
    statsViewed: 0,
    statsReplied: 0,
    statsSales: 0,
    shareOnFeed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function repoMock(
  overrides: Partial<CampaignRepository> = {},
): CampaignRepository {
  return {
    findById: vi.fn(),
    list: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    create: vi
      .fn()
      .mockImplementation((data) =>
        Promise.resolve(baseCampaign({ id: "c-new", ...data })),
      ),
    updateStatus: vi
      .fn()
      .mockImplementation((tenantId, id, status) =>
        Promise.resolve(
          baseCampaign({ id, tenantId, status: status as Campaign["status"] }),
        ),
      ),
    getRecipients: vi.fn().mockResolvedValue([]),
    delete: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  publishMock.mockClear();
});

describe("createCampaign", () => {
  it("forwards tenantId + recipientIds intact (fan-out depends on N rows)", async () => {
    const repo = repoMock();
    const recipientIds = ["c-a", "c-b", "c-c", "c-d"];
    await createCampaign(
      "t1",
      {
        name: "BF",
        message: "Hi {{nome}}",
        recipientIds,
      },
      repo,
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "t1",
        recipientIds,
      }),
    );
  });

  it("preserves scheduledAt verbatim — no silent coercion to now()", async () => {
    const repo = repoMock();
    const future = new Date("2099-12-31T10:00:00Z");
    await createCampaign(
      "t1",
      {
        name: "x",
        message: "y",
        recipientIds: ["c1"],
        scheduledAt: future,
      },
      repo,
    );
    const call = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(call.scheduledAt).toBe(future);
  });

  it("forwards optional audioUrl + attachments", async () => {
    const repo = repoMock();
    const attachments = [{ url: "https://x.test/a.png", type: "image" }];
    await createCampaign(
      "t1",
      {
        name: "x",
        message: "y",
        recipientIds: ["c1"],
        audioUrl: "https://x.test/audio.m4a",
        attachments,
      },
      repo,
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        audioUrl: "https://x.test/audio.m4a",
        attachments,
      }),
    );
  });

  it("keeps the {{nome}} placeholder in the message untouched (renders later)", async () => {
    // Substitution happens in the dispatch worker, not in createCampaign.
    // We assert the placeholder survives the use-case so the worker has
    // something to render.
    const repo = repoMock();
    await createCampaign(
      "t1",
      {
        name: "x",
        message: "Olá {{nome}}, hoje 30% off",
        recipientIds: ["c1"],
      },
      repo,
    );
    expect(
      (repo.create as ReturnType<typeof vi.fn>).mock.calls[0]?.[0].message,
    ).toContain("{{nome}}");
  });
});

describe("confirmCampaign", () => {
  it("transitions DRAFT without scheduledAt → SENDING and publishes event", async () => {
    const repo = repoMock({
      findById: vi.fn().mockResolvedValue(baseCampaign({ status: "DRAFT" })),
    });
    await confirmCampaign("t1", "c1", repo);
    expect(repo.updateStatus).toHaveBeenCalledWith("t1", "c1", "SENDING");
    expect(publishMock).toHaveBeenCalledWith(
      "campaign.dispatched",
      "t1",
      expect.objectContaining({ tenantId: "t1", campaignId: "c1" }),
    );
  });

  it("transitions DRAFT with scheduledAt → SCHEDULED", async () => {
    const repo = repoMock({
      findById: vi.fn().mockResolvedValue(
        baseCampaign({
          status: "DRAFT",
          scheduledAt: new Date("2099-01-01"),
        }),
      ),
    });
    await confirmCampaign("t1", "c1", repo);
    expect(repo.updateStatus).toHaveBeenCalledWith("t1", "c1", "SCHEDULED");
  });

  it("rejects when the campaign already left DRAFT/SCHEDULED", async () => {
    const repo = repoMock({
      findById: vi.fn().mockResolvedValue(baseCampaign({ status: "SENDING" })),
    });
    await expect(confirmCampaign("t1", "c1", repo)).rejects.toThrow(
      InvalidCampaignStatusError,
    );
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it("throws CampaignNotFoundError when id is missing", async () => {
    const repo = repoMock({
      findById: vi.fn().mockResolvedValue(null),
    });
    await expect(confirmCampaign("t1", "ghost", repo)).rejects.toThrow(
      CampaignNotFoundError,
    );
  });
});

describe("cancelCampaign", () => {
  it("calls updateStatus with CANCELLED", async () => {
    const repo = repoMock({
      findById: vi.fn().mockResolvedValue(baseCampaign({ status: "DRAFT" })),
    });
    await cancelCampaign("t1", "c1", repo);
    expect(repo.updateStatus).toHaveBeenCalledWith("t1", "c1", "CANCELLED");
  });

  it("throws when the campaign does not exist", async () => {
    const repo = repoMock({
      findById: vi.fn().mockResolvedValue(null),
    });
    await expect(cancelCampaign("t1", "ghost", repo)).rejects.toThrow(
      CampaignNotFoundError,
    );
  });
});

describe("listCampaigns / getRecipients", () => {
  it("listCampaigns forwards filters to the repo", async () => {
    const repo = repoMock();
    await listCampaigns("t1", { status: "SENT", page: 2, limit: 50 }, repo);
    expect(repo.list).toHaveBeenCalledWith("t1", {
      status: "SENT",
      page: 2,
      limit: 50,
    });
  });

  it("getRecipients throws when campaign missing (no leaked rows)", async () => {
    const repo = repoMock({
      findById: vi.fn().mockResolvedValue(null),
    });
    await expect(getRecipients("t1", "ghost", undefined, repo)).rejects.toThrow(
      CampaignNotFoundError,
    );
    expect(repo.getRecipients).not.toHaveBeenCalled();
  });

  it("getRecipients forwards the status filter when present", async () => {
    const repo = repoMock({
      findById: vi.fn().mockResolvedValue(baseCampaign()),
    });
    await getRecipients("t1", "c1", "VIEWED", repo);
    expect(repo.getRecipients).toHaveBeenCalledWith("t1", "c1", "VIEWED");
  });
});
