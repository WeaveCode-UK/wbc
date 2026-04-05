import { describe, it, expect, vi } from 'vitest';
import { logSecurityEvent } from '../security-logger';

describe('Security Logger', () => {
  it('logs success events with console.log', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logSecurityEvent({ event: 'auth.login.success', userId: 'u1', success: true });
    expect(spy).toHaveBeenCalledOnce();
    const logged = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(logged.event).toBe('auth.login.success');
    expect(logged.success).toBe(true);
    expect(logged.userId).toBe('u1');
    spy.mockRestore();
  });

  it('logs failure events with console.warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logSecurityEvent({ event: 'rbac.forbidden', userId: 'u2', success: false, detail: 'no perms' });
    expect(spy).toHaveBeenCalledOnce();
    const logged = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(logged.event).toBe('rbac.forbidden');
    expect(logged.success).toBe(false);
    expect(logged.detail).toBe('no perms');
    spy.mockRestore();
  });

  it('includes timestamp in ISO format', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logSecurityEvent({ event: 'otp.send', success: true });
    const logged = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(logged.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    spy.mockRestore();
  });
});
