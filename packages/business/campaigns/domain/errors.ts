export class CampaignNotFoundError extends Error {
  constructor(id?: string) { super(id ? `Campaign not found: ${id}` : 'Campaign not found'); this.name = 'CampaignNotFoundError'; }
}
export class InvalidCampaignStatusError extends Error {
  constructor(current: string, target: string) { super(`Cannot transition from ${current} to ${target}`); this.name = 'InvalidCampaignStatusError'; }
}
