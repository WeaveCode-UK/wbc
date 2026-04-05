import { describe, it, expect } from 'vitest';
import { generateDeepLink, personalizeMessage, formatPhoneForWhatsApp } from '../whatsapp';

describe('WhatsApp Domain', () => {
  describe('generateDeepLink', () => {
    it('generates wa.me link with clean phone', () => {
      const link = generateDeepLink('+5511999999999', 'Olá Maria');
      expect(link).toBe('https://wa.me/5511999999999?text=Ol%C3%A1%20Maria');
    });

    it('strips non-digit chars from phone', () => {
      const link = generateDeepLink('+55 (11) 99999-9999', 'Teste');
      expect(link).toContain('wa.me/5511999999999');
    });

    it('encodes special characters in message', () => {
      const link = generateDeepLink('5511999999999', 'Olá, como vai?');
      expect(link).toContain('Ol%C3%A1');
      expect(link).toContain('como%20vai');
    });
  });

  describe('personalizeMessage', () => {
    it('replaces {{nome}} with client name', () => {
      expect(personalizeMessage('Olá {{nome}}, tudo bem?', 'Maria')).toBe('Olá Maria, tudo bem?');
    });

    it('replaces multiple occurrences', () => {
      expect(personalizeMessage('{{nome}}, olá {{nome}}', 'Ana')).toBe('Ana, olá Ana');
    });

    it('returns template unchanged if no placeholder', () => {
      expect(personalizeMessage('Mensagem fixa', 'João')).toBe('Mensagem fixa');
    });
  });

  describe('formatPhoneForWhatsApp', () => {
    it('removes non-digit chars', () => {
      expect(formatPhoneForWhatsApp('+55 (11) 99999-9999')).toBe('5511999999999');
    });

    it('returns digits-only phone unchanged', () => {
      expect(formatPhoneForWhatsApp('5511999999999')).toBe('5511999999999');
    });
  });
});
