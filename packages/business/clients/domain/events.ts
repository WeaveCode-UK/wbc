export interface ClientCreatedPayload {
  tenantId: string;
  clientId: string;
  source: string;
}

export interface ClientUpdatedPayload {
  tenantId: string;
  clientId: string;
  changes: string[];
}

export interface ClientTaggedPayload {
  tenantId: string;
  clientId: string;
  tagId: string;
}

export interface ClientGoingInactivePayload {
  tenantId: string;
  clientId: string;
  daysSinceLastPurchase: number;
}

export interface ClientImportedPayload {
  tenantId: string;
  count: number;
}

export interface ClientClassificationChangedPayload {
  tenantId: string;
  clientId: string;
  oldClassification: string;
  newClassification: string;
}
