import { describe, it, expect } from 'vitest';
import { hasPermission, requirePermission, canPromoteTo } from '../permission.guard';

describe('Permission Guard', () => {
  describe('hasPermission', () => {
    it('ADMIN has all permissions', () => {
      expect(hasPermission('ADMIN', 'team:view')).toBe(true);
      expect(hasPermission('ADMIN', 'tenant:manage')).toBe(true);
      expect(hasPermission('ADMIN', 'tenant:billing')).toBe(true);
      expect(hasPermission('ADMIN', 'tenant:export')).toBe(true);
    });

    it('CONSULTANT has no permissions', () => {
      expect(hasPermission('CONSULTANT', 'team:view')).toBe(false);
      expect(hasPermission('CONSULTANT', 'tenant:manage')).toBe(false);
    });

    it('LEADER can view team and invite', () => {
      expect(hasPermission('LEADER', 'team:view')).toBe(true);
      expect(hasPermission('LEADER', 'team:invite')).toBe(true);
    });

    it('LEADER cannot manage tenant', () => {
      expect(hasPermission('LEADER', 'tenant:manage')).toBe(false);
      expect(hasPermission('LEADER', 'tenant:billing')).toBe(false);
    });

    it('DIRECTOR has multi-view but not tenant manage', () => {
      expect(hasPermission('DIRECTOR', 'team:multi-view')).toBe(true);
      expect(hasPermission('DIRECTOR', 'tenant:manage')).toBe(false);
    });
  });

  describe('requirePermission', () => {
    it('does not throw for allowed permission', () => {
      expect(() => requirePermission('ADMIN', 'tenant:manage')).not.toThrow();
    });

    it('throws for disallowed permission', () => {
      expect(() => requirePermission('CONSULTANT', 'team:view')).toThrow();
    });
  });

  describe('canPromoteTo', () => {
    it('ADMIN can promote to DIRECTOR', () => {
      expect(canPromoteTo('ADMIN', 'DIRECTOR')).toBe(true);
    });

    it('ADMIN can promote to LEADER', () => {
      expect(canPromoteTo('ADMIN', 'LEADER')).toBe(true);
    });

    it('ADMIN cannot promote to ADMIN', () => {
      expect(canPromoteTo('ADMIN', 'ADMIN')).toBe(false);
    });

    it('LEADER can promote to CONSULTANT', () => {
      expect(canPromoteTo('LEADER', 'CONSULTANT')).toBe(true);
    });

    it('LEADER cannot promote to LEADER', () => {
      expect(canPromoteTo('LEADER', 'LEADER')).toBe(false);
    });

    it('CONSULTANT cannot promote anyone', () => {
      expect(canPromoteTo('CONSULTANT', 'CONSULTANT')).toBe(false);
    });
  });
});
