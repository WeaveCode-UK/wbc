export class ProductNotFoundError extends Error {
  constructor(id?: string) { super(id ? `Product not found: ${id}` : 'Product not found'); this.name = 'ProductNotFoundError'; }
}
export class BrandNotFoundError extends Error {
  constructor(id?: string) { super(id ? `Brand not found: ${id}` : 'Brand not found'); this.name = 'BrandNotFoundError'; }
}
export class ShowcaseNotFoundError extends Error {
  constructor(id?: string) { super(id ? `Showcase not found: ${id}` : 'Showcase not found'); this.name = 'ShowcaseNotFoundError'; }
}
