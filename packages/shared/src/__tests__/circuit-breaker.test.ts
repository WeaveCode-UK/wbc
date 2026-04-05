import { describe, it, expect } from 'vitest';
import { CircuitBreaker } from '../circuit-breaker';

describe('CircuitBreaker', () => {
  it('starts in CLOSED state', () => {
    const cb = new CircuitBreaker('test');
    expect(cb.getState()).toBe('CLOSED');
  });

  it('executes function when CLOSED', async () => {
    const cb = new CircuitBreaker('test');
    const result = await cb.execute(async () => 42);
    expect(result).toBe(42);
  });

  it('opens after reaching failure threshold', async () => {
    const cb = new CircuitBreaker('test', { failureThreshold: 3, resetTimeoutMs: 10_000 });

    for (let i = 0; i < 3; i++) {
      await cb.execute(async () => { throw new Error('fail'); }, () => 'fallback');
    }

    expect(cb.getState()).toBe('OPEN');
  });

  it('returns fallback when OPEN', async () => {
    const cb = new CircuitBreaker('test', { failureThreshold: 2, resetTimeoutMs: 60_000 });

    for (let i = 0; i < 2; i++) {
      await cb.execute(async () => { throw new Error('fail'); }, () => 'fallback');
    }

    const result = await cb.execute(async () => 'real', () => 'fallback');
    expect(result).toBe('fallback');
  });

  it('throws when OPEN without fallback', async () => {
    const cb = new CircuitBreaker('test', { failureThreshold: 2, resetTimeoutMs: 60_000 });

    for (let i = 0; i < 2; i++) {
      try { await cb.execute(async () => { throw new Error('fail'); }); } catch { /* expected */ }
    }

    await expect(cb.execute(async () => 'real')).rejects.toThrow('OPEN');
  });

  it('transitions to HALF_OPEN after reset timeout', async () => {
    const cb = new CircuitBreaker('test', { failureThreshold: 1, resetTimeoutMs: 50 });

    await cb.execute(async () => { throw new Error('fail'); }, () => 'fallback');
    expect(cb.getState()).toBe('OPEN');

    await new Promise((r) => setTimeout(r, 60));
    expect(cb.getState()).toBe('HALF_OPEN');
  });

  it('closes again after successful HALF_OPEN call', async () => {
    const cb = new CircuitBreaker('test', { failureThreshold: 1, resetTimeoutMs: 50 });

    await cb.execute(async () => { throw new Error('fail'); }, () => 'fallback');
    await new Promise((r) => setTimeout(r, 60));

    await cb.execute(async () => 'success');
    expect(cb.getState()).toBe('CLOSED');
  });

  it('resets failure count on success', async () => {
    const cb = new CircuitBreaker('test', { failureThreshold: 3 });

    await cb.execute(async () => { throw new Error('fail'); }, () => null);
    await cb.execute(async () => { throw new Error('fail'); }, () => null);
    await cb.execute(async () => 'success');

    // Should still be CLOSED because success reset the counter
    expect(cb.getState()).toBe('CLOSED');
  });
});
