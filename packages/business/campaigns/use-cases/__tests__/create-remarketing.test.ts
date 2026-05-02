import { describe, it, expect, vi } from "vitest";
import { createRemarketingCampaign } from "../create-remarketing";
import type { CampaignRepository } from "../../ports/campaign-repository";

function repoMock(
  overrides: Partial<CampaignRepository> = {},
): CampaignRepository {
  return {
    findById: vi.fn().mockResolvedValue({
      id: "c1",
      tenantId: "t1",
      name: "Black Friday",
      message: "Não perca!",
      status: "SENT",
      audioUrl: null,
      attachments: null,
      scheduledAt: null,
      createdAt: new Date(),
    }),
    list: vi.fn(),
    create: vi
      .fn()
      .mockImplementation((data) =>
        Promise.resolve({ id: "c-new", ...data, status: "DRAFT" }),
      ),
    updateStatus: vi.fn(),
    getRecipients: vi.fn().mockResolvedValue([
      { id: "r1", clientId: "client-a", status: "RECEIVED" },
      { id: "r2", clientId: "client-b", status: "RECEIVED" },
    ]),
    delete: vi.fn(),
    ...overrides,
  };
}

describe("createRemarketingCampaign", () => {
  it("clones the source campaign with NO_VIEW recipients", async () => {
    const repo = repoMock();
    const result = await createRemarketingCampaign(
      {
        tenantId: "t1",
        sourceCampaignId: "c1",
        segment: "NO_VIEW",
      },
      repo,
    );
    expect(repo.getRecipients).toHaveBeenCalledWith("t1", "c1", "RECEIVED");
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "t1",
        recipientIds: ["client-a", "client-b"],
        message: "Não perca!",
      }),
    );
    expect(result.id).toBe("c-new");
  });

  it("merges recipients across multiple statuses for NO_RECEIVE segment", async () => {
    const repo = repoMock({
      getRecipients: vi
        .fn()
        .mockResolvedValueOnce([
          { id: "r1", clientId: "client-a", status: "PENDING" },
        ])
        .mockResolvedValueOnce([
          { id: "r2", clientId: "client-b", status: "FAILED" },
        ]),
    });
    await createRemarketingCampaign(
      { tenantId: "t1", sourceCampaignId: "c1", segment: "NO_RECEIVE" },
      repo,
    );
    expect(repo.getRecipients).toHaveBeenCalledTimes(2);
  });

  it("dedups recipients that appear in multiple status buckets", async () => {
    const repo = repoMock({
      getRecipients: vi
        .fn()
        .mockResolvedValueOnce([
          { id: "r1", clientId: "client-a", status: "PENDING" },
        ])
        .mockResolvedValueOnce([
          { id: "r2", clientId: "client-a", status: "FAILED" },
        ]),
    });
    await createRemarketingCampaign(
      { tenantId: "t1", sourceCampaignId: "c1", segment: "NO_RECEIVE" },
      repo,
    );
    const passedRecipients = (repo.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0].recipientIds as string[];
    expect(passedRecipients).toEqual(["client-a"]);
  });

  it("throws when the source campaign is not found", async () => {
    const repo = repoMock({ findById: vi.fn().mockResolvedValue(null) });
    await expect(
      createRemarketingCampaign(
        { tenantId: "t1", sourceCampaignId: "missing", segment: "NO_VIEW" },
        repo,
      ),
    ).rejects.toThrow();
  });

  it("throws when the segment yields zero recipients", async () => {
    const repo = repoMock({
      getRecipients: vi.fn().mockResolvedValue([]),
    });
    await expect(
      createRemarketingCampaign(
        { tenantId: "t1", sourceCampaignId: "c1", segment: "NO_RESPONSE" },
        repo,
      ),
    ).rejects.toThrow(/no recipients/i);
  });

  it("respects newName and newMessage overrides", async () => {
    const repo = repoMock();
    await createRemarketingCampaign(
      {
        tenantId: "t1",
        sourceCampaignId: "c1",
        segment: "NO_VIEW",
        newName: "BF Reminder",
        newMessage: "última chance!",
      },
      repo,
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "BF Reminder",
        message: "última chance!",
      }),
    );
  });
});
