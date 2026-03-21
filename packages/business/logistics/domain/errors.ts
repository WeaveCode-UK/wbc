export class DeliveryNotFoundError extends Error {
  constructor(id: string) { super(`Delivery not found: ${id}`); this.name = 'DeliveryNotFoundError'; }
}
export class InvalidStatusTransitionError extends Error {
  constructor(from: string, to: string) { super(`Cannot transition delivery from ${from} to ${to}`); this.name = 'InvalidStatusTransitionError'; }
}
