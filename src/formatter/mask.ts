import { cleanAlphanumeric, cleanDigits, formatCNPJ, formatCNPJAlphanumeric, formatCPF } from '../utils/cpf-cnpj';
import { DocumentType } from '../types';

export function getFormattedValue(rawValue: string, targetType: DocumentType, applyMask: boolean): string {
  // O CNPJ alfanumérico (Receita Federal, a partir de 2026) mistura letras e números,
  // então usa uma limpeza que preserva letras em vez de descartá-las como \D.
  if (targetType === 'cnpj' && /[A-Za-z]/.test(rawValue)) {
    const chars = cleanAlphanumeric(rawValue);
    if (!chars) return '';
    return applyMask ? formatCNPJAlphanumeric(chars) : chars.slice(0, 14);
  }

  const digits = cleanDigits(rawValue);
  if (!digits) return '';

  if (!applyMask) {
    if (targetType === 'cpf') return digits.slice(0, 11);
    if (targetType === 'cnpj') return digits.slice(0, 14);
    return digits;
  }

  if (targetType === 'cpf') {
    return formatCPF(digits);
  }

  if (targetType === 'cnpj') {
    return formatCNPJ(digits);
  }

  // Combined CPF/CNPJ: check length
  if (digits.length > 11) {
    return formatCNPJ(digits);
  }
  return formatCPF(digits);
}

/**
 * Checks if an input element enforces a specific mask format (e.g., placeholder or maxlength)
 */
export function detectElementMaskRequirement(element: HTMLInputElement): { prefersMask: boolean; maxLen?: number } {
  const placeholder = element.placeholder || '';
  const maxlength = element.maxLength;

  const hasFormattedPlaceholder = /\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/.test(placeholder);

  return {
    prefersMask: hasFormattedPlaceholder || maxlength === 14 || maxlength === 18,
    maxLen: maxlength > 0 ? maxlength : undefined
  };
}
