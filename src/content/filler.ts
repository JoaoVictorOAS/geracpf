import { DetectionResult, ExtensionSettings } from '../types';
import { getFormattedValue } from '../formatter/mask';

/**
 * Safely sets value on HTMLInputElement supporting React, Vue, Angular synthetic state trackers.
 */
export function setNativeInputValue(element: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )?.set;

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else if (valueSetter) {
    valueSetter.call(element, value);
  } else {
    element.value = value;
  }

  // Trigger events for reactive frameworks (React, Vue, Angular, Svelte)
  element.dispatchEvent(new Event('focus', { bubbles: true }));
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));
}

/**
 * Marks a filled element with a brief outline so the user sees what changed.
 */
export function highlightFilledElement(element: HTMLInputElement) {
  const originalOutline = element.style.outline;
  element.style.outline = '2px solid #157347';

  setTimeout(() => {
    element.style.outline = originalOutline;
  }, 1000);
}

export function fillInputElement(element: HTMLInputElement, value: string): void {
  setNativeInputValue(element, value);
  highlightFilledElement(element);
}

export function fillField(detection: DetectionResult, settings: ExtensionSettings): boolean {
  const { element, type } = detection;

  // Check existing value
  if (element.value && element.value.trim() !== '' && !settings.overwriteExisting) {
    return false; // Skip already filled field
  }

  let valueToFill = '';

  if (type === 'cpf') {
    valueToFill = getFormattedValue(settings.cpf, 'cpf', settings.applyMask);
  } else if (type === 'cnpj') {
    valueToFill = getFormattedValue(settings.cnpj, 'cnpj', settings.applyMask);
  } else if (type === 'cpf_or_cnpj') {
    // Determine preference based on field capacity or settings
    const maxLen = element.maxLength;
    if (maxLen === 11 || maxLen === 14) {
      // High chance of CPF
      valueToFill = getFormattedValue(settings.cpf, 'cpf', settings.applyMask);
    } else if (maxLen === 18) {
      // High chance of formatted CNPJ
      valueToFill = getFormattedValue(settings.cnpj, 'cnpj', settings.applyMask);
    } else {
      // Default to CPF if available, otherwise CNPJ
      if (settings.cpf) {
        valueToFill = getFormattedValue(settings.cpf, 'cpf', settings.applyMask);
      } else {
        valueToFill = getFormattedValue(settings.cnpj, 'cnpj', settings.applyMask);
      }
    }
  }

  if (!valueToFill) {
    return false;
  }

  // Perform value injection
  setNativeInputValue(element, valueToFill);
  highlightFilledElement(element);
  return true;
}
