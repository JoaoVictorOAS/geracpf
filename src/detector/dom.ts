/**
 * DOM utility helper functions for field detection.
 */

// Check if element is visible and interactive
export function isElementEditable(element: HTMLInputElement): boolean {
  if (!element || element.tagName !== 'INPUT') return false;

  // Exclude hidden types
  const type = (element.type || '').toLowerCase();
  if (['hidden', 'submit', 'button', 'reset', 'checkbox', 'radio', 'file', 'image', 'color', 'date', 'range'].includes(type)) {
    return false;
  }

  // Exclude disabled or readonly
  if (element.disabled || element.readOnly) return false;

  // Check CSS visibility
  if (element.offsetParent === null && element.offsetWidth === 0 && element.offsetHeight === 0) {
    // Check computed style if offsetParent is null (could be position: fixed)
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
  }

  return true;
}

// Find label text associated with the input element
export function getAssociatedLabelText(element: HTMLInputElement): string {
  const labelsText: string[] = [];

  // 1. Explicit <label for="element_id">
  if (element.id) {
    const explicitLabels = document.querySelectorAll(`label[for="${element.id}"]`);
    explicitLabels.forEach((lbl) => {
      if (lbl.textContent) labelsText.push(lbl.textContent.trim());
    });
  }

  // 2. Parent wrapping <label>
  let parent = element.parentElement;
  while (parent && parent !== document.body) {
    if (parent.tagName === 'LABEL') {
      if (parent.textContent) labelsText.push(parent.textContent.trim());
      break;
    }
    parent = parent.parentElement;
  }

  // 3. Preceding sibling label or container label
  if (element.previousElementSibling && element.previousElementSibling.tagName === 'LABEL') {
    if (element.previousElementSibling.textContent) {
      labelsText.push(element.previousElementSibling.textContent.trim());
    }
  }

  // 4. Closest label within parent container (e.g. div.form-group)
  const container = element.closest('.form-group, .form-field, .field, .input-group, div, section');
  if (container) {
    const innerLabel = container.querySelector('label');
    if (innerLabel && innerLabel.textContent) {
      labelsText.push(innerLabel.textContent.trim());
    }
  }

  return labelsText.join(' ').toLowerCase();
}
