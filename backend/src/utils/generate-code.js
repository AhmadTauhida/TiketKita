import { randomBytes, randomInt } from 'node:crypto';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function randomCode(length) {
  let result = '';

  for (let index = 0; index < length; index += 1) {
    result += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }

  return result;
}

export function generateBookingCode(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `TK-${year}${month}${day}-${randomCode(6)}`;
}

export function generateTicketCode() {
  return `TKT-${randomCode(10)}`;
}

export function generateTransactionReference() {
  return `SIM-${randomCode(12)}`;
}

export function generateQrToken() {
  return randomBytes(32).toString('hex');
}
