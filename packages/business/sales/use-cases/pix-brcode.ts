// F11 follow-up: PIX BR Code generator (the "copia e cola" payload
// every Brazilian bank app reads). Implements the EMV-derived TLV
// format defined by BACEN's Manual de Padrões para Iniciação do PIX
// — every field is a 2-digit ID, a 2-digit length and the value.
//
// Reference: https://www.bcb.gov.br/estabilidadefinanceira/spi
//
// We keep this dependency-free so it can run on the API server, the
// worker, or in tests without pulling in a heavier crypto library.

const PAYLOAD_FORMAT_INDICATOR = "01";
const MERCHANT_ACCOUNT_INFO_ID = "26";
const MERCHANT_CATEGORY_CODE = "0000";
const TRANSACTION_CURRENCY_BRL = "986";
const COUNTRY_BR = "BR";
const PIX_GUI = "br.gov.bcb.pix";

export interface PixBrCodeInput {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number; // BRL
  txid?: string; // <= 25 chars, alphanumeric. Defaults to "***".
  description?: string; // optional reference shown in the bank app
}

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

// Normalise text fields: ASCII-only, uppercase merchant name/city,
// trim to the BACEN-imposed max lengths. The bank app rejects entries
// outside ASCII so we fold accents to the closest equivalent.
function asciiFold(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
}

function crc16(payload: string): string {
  // CRC-16/CCITT-FALSE — polynomial 0x1021, init 0xFFFF, no reflect.
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc =
        (crc & 0x8000) !== 0
          ? ((crc << 1) ^ 0x1021) & 0xffff
          : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function buildPixBrCode(input: PixBrCodeInput): string {
  const merchantName = asciiFold(input.merchantName).slice(0, 25);
  const merchantCity = asciiFold(input.merchantCity).slice(0, 15);
  const txid = (input.txid ?? "***").slice(0, 25);
  const amount = input.amount.toFixed(2);

  const pixSubfields =
    tlv("00", PIX_GUI) +
    tlv("01", input.pixKey) +
    (input.description ? tlv("02", input.description.slice(0, 50)) : "");

  const merchantAccountInfo = tlv(MERCHANT_ACCOUNT_INFO_ID, pixSubfields);
  const additionalDataField = tlv("62", tlv("05", txid));

  const payloadWithoutCrc =
    tlv("00", PAYLOAD_FORMAT_INDICATOR) +
    merchantAccountInfo +
    tlv("52", MERCHANT_CATEGORY_CODE) +
    tlv("53", TRANSACTION_CURRENCY_BRL) +
    tlv("54", amount) +
    tlv("58", COUNTRY_BR) +
    tlv("59", merchantName || "RECEBEDOR") +
    tlv("60", merchantCity || "BRASIL") +
    additionalDataField +
    "6304"; // CRC tag + length, value computed below

  const crc = crc16(payloadWithoutCrc);
  return payloadWithoutCrc + crc;
}
