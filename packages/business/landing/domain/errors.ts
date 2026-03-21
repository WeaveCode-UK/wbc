export class LandingPageNotFoundError extends Error {
  constructor(tenantId: string) { super(`Landing page not found for tenant: ${tenantId}`); this.name = 'LandingPageNotFoundError'; }
}
export class SlugAlreadyTakenError extends Error {
  constructor(slug: string) { super(`Slug already taken: ${slug}`); this.name = 'SlugAlreadyTakenError'; }
}
