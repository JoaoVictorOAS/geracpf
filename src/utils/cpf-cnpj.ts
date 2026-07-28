/**
  * Utility functions for CPF and CNPJ validation, formatting, and generation.
  */

// Remove all non-numeric characters
export function cleanDigits(value: string): string {
  return (value || '').replace(/\D/g, '');
}

// Format raw 11-digit string to CPF format 999.999.999-99
export function formatCPF(value: string): string {
  const digits = cleanDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

// Format raw 14-digit string to CNPJ format 99.999.999/9999-99
export function formatCNPJ(value: string): string {
  const digits = cleanDigits(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

// Remove all characters except digits and uppercase letters (used for alphanumeric CNPJ)
export function cleanAlphanumeric(value: string): string {
  return (value || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
}

// Format raw 14-char alphanumeric string to CNPJ format AA.AAA.AAA/AAAA-99
export function formatCNPJAlphanumeric(value: string): string {
  const chars = cleanAlphanumeric(value).slice(0, 14);
  if (chars.length <= 2) return chars;
  if (chars.length <= 5) return `${chars.slice(0, 2)}.${chars.slice(2)}`;
  if (chars.length <= 8) return `${chars.slice(0, 2)}.${chars.slice(2, 5)}.${chars.slice(5)}`;
  if (chars.length <= 12) return `${chars.slice(0, 2)}.${chars.slice(2, 5)}.${chars.slice(5, 8)}/${chars.slice(8)}`;
  return `${chars.slice(0, 2)}.${chars.slice(2, 5)}.${chars.slice(5, 8)}/${chars.slice(8, 12)}-${chars.slice(12, 14)}`;
}

// Value of a CNPJ character (digit or uppercase letter) for check-digit math, per Receita Federal (ASCII code - 48)
function cnpjCharValue(char: string): number {
  return char.charCodeAt(0) - 48;
}

// Check standard CPF validity using mathematical checksum verification
export function isValidCPF(cpf: string): boolean {
  const digits = cleanDigits(cpf);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false; // Reject 111.111.111-11, etc.

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(digits.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(digits.charAt(10), 10)) return false;

  return true;
}

// Check standard CNPJ validity using mathematical checksum verification
export function isValidCNPJ(cnpj: string): boolean {
  const digits = cleanDigits(cnpj);
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits.charAt(i), 10) * weights1[i];
  }
  let rev = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (rev !== parseInt(digits.charAt(12), 10)) return false;

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits.charAt(i), 10) * weights2[i];
  }
  rev = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (rev !== parseInt(digits.charAt(13), 10)) return false;

  return true;
}

// Check alphanumeric CNPJ validity (base+order: 0-9/A-Z, check digits: always numeric)
export function isValidAlphanumericCNPJ(cnpj: string): boolean {
  const chars = cleanAlphanumeric(cnpj);
  if (chars.length !== 14) return false;
  if (!/^[0-9A-Z]{12}\d{2}$/.test(chars)) return false;
  if (/^(.)\1{13}$/.test(chars)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += cnpjCharValue(chars.charAt(i)) * weights1[i];
  }
  let rev = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (rev !== parseInt(chars.charAt(12), 10)) return false;

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += cnpjCharValue(chars.charAt(i)) * weights2[i];
  }
  rev = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (rev !== parseInt(chars.charAt(13), 10)) return false;

  return true;
}

// Generate a valid random CPF string for testing
export function generateValidCPF(): string {
  const rnd = (n: number) => Math.round(Math.random() * n);
  const n = Array.from({ length: 9 }, () => rnd(9));

  let d1 = n.reduce((total, number, index) => total + number * (10 - index), 0);
  d1 = 11 - (d1 % 11);
  if (d1 >= 10) d1 = 0;

  let d2 = n.reduce((total, number, index) => total + number * (11 - index), 0) + d1 * 2;
  d2 = 11 - (d2 % 11);
  if (d2 >= 10) d2 = 0;

  return `${n.join('')}${d1}${d2}`;
}

// Generate a valid random CNPJ string for testing
export function generateValidCNPJ(): string {
  const rnd = (n: number) => Math.round(Math.random() * n);
  const n = Array.from({ length: 8 }, () => rnd(9)).concat([0, 0, 0, 1]); // Base + branch 0001

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = n.reduce((total, number, index) => total + number * weights1[index], 0);
  let d1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const nWithD1 = [...n, d1];
  sum = nWithD1.reduce((total, number, index) => total + number * weights2[index], 0);
  let d2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  return `${n.join('')}${d1}${d2}`;
}

// Generate a valid random alphanumeric CNPJ (base+order: 0-9/A-Z, per Receita Federal's new format)
export function generateValidAlphanumericCNPJ(): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const rndChar = () => alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  const base = Array.from({ length: 8 }, rndChar).concat(['0', '0', '0', '1']); // Base + branch 0001

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = base.reduce((total, char, index) => total + cnpjCharValue(char) * weights1[index], 0);
  const d1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const baseWithD1 = [...base, String(d1)];
  sum = baseWithD1.reduce((total, char, index) => total + cnpjCharValue(char) * weights2[index], 0);
  const d2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  return `${base.join('')}${d1}${d2}`;
}
