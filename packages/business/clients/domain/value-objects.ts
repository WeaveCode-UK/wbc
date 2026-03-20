export type SkinType = 'OILY' | 'DRY' | 'COMBINATION' | 'NORMAL' | 'SENSITIVE';
export type HairType = 'STRAIGHT' | 'WAVY' | 'CURLY' | 'COILY';
export type Classification = 'A' | 'B' | 'C';
export type ClientSource = 'MANUAL' | 'QRCODE' | 'IMPORT' | 'AUTOCADASTRO' | 'WHATSAPP' | 'SPREADSHEET' | 'REFERRAL';
export type Sex = 'MALE' | 'FEMALE' | 'OTHER';

export function validatePhone(phone: string): boolean {
  return /^\+?[1-9]\d{1,14}$/.test(phone);
}

export function formatPhoneE164(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('55') && cleaned.length >= 12) {
    return `+${cleaned}`;
  }
  if (cleaned.length === 11 || cleaned.length === 10) {
    return `+55${cleaned}`;
  }
  return `+${cleaned}`;
}
