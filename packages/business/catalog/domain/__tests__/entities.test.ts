import { describe, it, expect } from 'vitest';
import { generateShareLink } from '../entities';

describe('Catalog Domain', () => {
  it('generates 8-char share links', () => {
    const link = generateShareLink();
    expect(link).toHaveLength(8);
    expect(link).toMatch(/^[a-z0-9]+$/);
  });

  it('generates unique share links', () => {
    const links = new Set<string>();
    for (let i = 0; i < 100; i++) {
      links.add(generateShareLink());
    }
    expect(links.size).toBeGreaterThan(90); // statistically should all be unique
  });
});
