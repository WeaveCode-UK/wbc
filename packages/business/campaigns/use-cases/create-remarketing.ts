import type { Campaign } from "../domain/entities";
import type { CampaignRepository } from "../ports/campaign-repository";

// F11.E11: clone an existing campaign filtering its recipients to the
// segment that didn't react. Three segments mirror the funnel:
// NO_RECEIVE — sent but never confirmed delivery (status PENDING/FAILED)
// NO_VIEW    — received but not viewed (status RECEIVED)
// NO_RESPONSE — viewed but not replied (status VIEWED)

export type RemarketingSegment = "NO_RECEIVE" | "NO_VIEW" | "NO_RESPONSE";

const SEGMENT_TO_RECIPIENT_STATUSES: Record<RemarketingSegment, string[]> = {
  NO_RECEIVE: ["PENDING", "FAILED"],
  NO_VIEW: ["RECEIVED"],
  NO_RESPONSE: ["VIEWED"],
};

export interface CreateRemarketingInput {
  tenantId: string;
  sourceCampaignId: string;
  segment: RemarketingSegment;
  newName?: string;
  newMessage?: string;
  scheduledAt?: Date;
}

export async function createRemarketingCampaign(
  input: CreateRemarketingInput,
  repo: CampaignRepository,
): Promise<Campaign> {
  const source = await repo.findById(input.tenantId, input.sourceCampaignId);
  if (!source) {
    throw new Error("Source campaign not found");
  }

  const targetStatuses = SEGMENT_TO_RECIPIENT_STATUSES[input.segment];
  // The repo doesn't accept multiple statuses in one call; fan out and
  // merge. We dedup via a Set because a recipient row can never appear
  // twice but the typed return is `CampaignRecipient[]`, not a Set.
  const allRecipients: Array<{ clientId: string }> = [];
  for (const status of targetStatuses) {
    const slice = await repo.getRecipients(
      input.tenantId,
      input.sourceCampaignId,
      status,
    );
    for (const r of slice) {
      allRecipients.push({ clientId: r.clientId });
    }
  }

  const recipientIds = Array.from(
    new Set(allRecipients.map((r) => r.clientId)),
  );
  if (recipientIds.length === 0) {
    throw new Error("No recipients match the selected segment");
  }

  return repo.create({
    tenantId: input.tenantId,
    name: input.newName ?? `Remarketing — ${source.name} (${input.segment})`,
    message: input.newMessage ?? source.message,
    recipientIds,
    scheduledAt: input.scheduledAt,
  });
}
