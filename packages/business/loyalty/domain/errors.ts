export class InsufficientLoyaltyBalanceError extends Error {
  constructor(
    public readonly available: number,
    public readonly requested: number,
  ) {
    super(
      `Insufficient balance: available ${available}, requested ${requested}`,
    );
    this.name = "InsufficientLoyaltyBalanceError";
  }
}

export class LoyaltyAccountNotFoundError extends Error {
  constructor(public readonly clientId: string) {
    super(`Loyalty account not found for client ${clientId}`);
    this.name = "LoyaltyAccountNotFoundError";
  }
}
