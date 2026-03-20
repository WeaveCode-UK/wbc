import { describe, it, expect } from 'vitest';
import { renderTemplate } from '../email';

describe('Email Domain', () => {
  it('renders template variables', () => {
    const result = renderTemplate('Hello {{name}}, your code is {{code}}', { name: 'Maria', code: '123456' });
    expect(result).toBe('Hello Maria, your code is 123456');
  });

  it('handles multiple occurrences', () => {
    const result = renderTemplate('{{name}} and {{name}} again', { name: 'Test' });
    expect(result).toBe('Test and Test again');
  });
});
