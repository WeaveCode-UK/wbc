import { describe, it, expect } from 'vitest';
import { generateDeepLink, personalizeMessage, formatPhoneForWhatsApp } from '../whatsapp';

describe('WhatsApp Domain', () => {
  it('generates deep link with encoded message', () => {
    const link = generateDeepLink('+5511999999999', 'Olá Maria');
    expect(link).toBe('https://wa.me/5511999999999?text=Ol%C3%A1%20Maria');
  });

  it('personalizes message with name', () => {
    const result = personalizeMessage('Olá {{nome}}, tudo bem?', 'Maria');
    expect(result).toBe('Olá Maria, tudo bem?');
  });

  it('formats phone removing non-digits', () => {
    expect(formatPhoneForWhatsApp('+55 11 99999-9999')).toBe('5511999999999');
  });
});
