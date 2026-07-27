import { scanDocumentForFields } from '../detector/scoring';
import { fillField, fillInputElement } from './filler';
import { getSettings, updateStats } from '../storage';
import { setupDOMObserver, stopDOMObserver } from './observer';
import { MessagePayload } from '../types';
import { generateValidCPF, generateValidCNPJ } from '../utils/cpf-cnpj';
import { getFormattedValue } from '../formatter/mask';
import { showToastNotification, showFloatingGeneratorMenu, hideFloatingMenu } from './ui';

let isScanning = false;
let lastRightClickedElement: HTMLInputElement | null = null;
let lastRightClickPos = { x: 0, y: 0 };

function isDomainAllowed(hostname: string, allowed: string[], blocked: string[]): boolean {
  if (blocked && blocked.length > 0) {
    if (blocked.some((domain) => hostname.includes(domain.trim()))) {
      return false;
    }
  }
  if (allowed && allowed.length > 0) {
    return allowed.some((domain) => hostname.includes(domain.trim()));
  }
  return true;
}

// Track right-clicked element across the page
document.addEventListener('contextmenu', (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  lastRightClickPos = { x: e.pageX, y: e.pageY };

  if (target && target.tagName === 'INPUT') {
    const input = target as HTMLInputElement;
    if (!input.disabled && !input.readOnly) {
      lastRightClickedElement = input;

      // Show in-page floating generator menu on right click (like native password generator)
      getSettings().then((settings) => {
        if (settings.enabled) {
          showFloatingGeneratorMenu(
            input,
            (type) => handleManualFill(type, input),
            { x: e.pageX, y: e.pageY }
          );
        }
      });
    }
  } else {
    // If clicked inside an editable parent or nearby
    const closestInput = target?.closest?.('.field-group, form')?.querySelector('input') as HTMLInputElement;
    if (closestInput && !closestInput.disabled && !closestInput.readOnly) {
      lastRightClickedElement = closestInput;
    }
  }
}, true);

async function handleManualFill(docType: 'cpf' | 'cnpj', targetInput?: HTMLInputElement | null) {
  const settings = await getSettings();
  const input = targetInput || getTargetInput();

  const rawDigits = docType === 'cpf' ? generateValidCPF() : generateValidCNPJ();
  const formattedValue = getFormattedValue(rawDigits, docType, settings.applyMask);

  if (input) {
    fillInputElement(input, formattedValue);
    showToastNotification(`${docType.toUpperCase()} gerado e preenchido com sucesso!`, 'success');
  } else {
    // Fallback: Copy to clipboard if no input focused/clicked
    try {
      await navigator.clipboard.writeText(formattedValue);
      showToastNotification(`${docType.toUpperCase()} gerado e copiado: ${formattedValue}`, 'info');
    } catch {
      showToastNotification(`${docType.toUpperCase()} gerado: ${formattedValue}`, 'info');
    }
  }
}

function getTargetInput(): HTMLInputElement | null {
  if (lastRightClickedElement && document.contains(lastRightClickedElement)) {
    return lastRightClickedElement;
  }
  if (document.activeElement && document.activeElement.tagName === 'INPUT') {
    const active = document.activeElement as HTMLInputElement;
    if (!active.disabled && !active.readOnly) {
      return active;
    }
  }
  // Try finding first detected field on page
  const detections = scanDocumentForFields(5);
  if (detections.length > 0) {
    return detections[0].element;
  }
  return null;
}

async function runContextMenuCommand(command?: string) {
  const settings = await getSettings();
  const target = getTargetInput();

  switch (command) {
    case 'fill_generated_cpf': {
      const rawCpf = generateValidCPF();
      const val = getFormattedValue(rawCpf, 'cpf', settings.applyMask);
      if (target) {
        fillInputElement(target, val);
        showToastNotification(`CPF gerado e preenchido: ${val}`, 'success');
      } else {
        await navigator.clipboard.writeText(val);
        showToastNotification(`CPF copiado: ${val}`, 'info');
      }
      break;
    }
    case 'fill_generated_cnpj': {
      const rawCnpj = generateValidCNPJ();
      const val = getFormattedValue(rawCnpj, 'cnpj', settings.applyMask);
      if (target) {
        fillInputElement(target, val);
        showToastNotification(`CNPJ gerado e preenchido: ${val}`, 'success');
      } else {
        await navigator.clipboard.writeText(val);
        showToastNotification(`CNPJ copiado: ${val}`, 'info');
      }
      break;
    }
    case 'fill_saved_data': {
      runAutoFillProcess();
      showToastNotification('Formulário preenchido com dados salvos!', 'success');
      break;
    }
    case 'copy_generated_cpf': {
      const rawCpf = generateValidCPF();
      const val = getFormattedValue(rawCpf, 'cpf', settings.applyMask);
      try {
        await navigator.clipboard.writeText(val);
        showToastNotification(`CPF copiado para área de transferência: ${val}`, 'info');
      } catch {
        showToastNotification(`CPF gerado: ${val}`, 'info');
      }
      break;
    }
    case 'copy_generated_cnpj': {
      const rawCnpj = generateValidCNPJ();
      const val = getFormattedValue(rawCnpj, 'cnpj', settings.applyMask);
      try {
        await navigator.clipboard.writeText(val);
        showToastNotification(`CNPJ copiado para área de transferência: ${val}`, 'info');
      } catch {
        showToastNotification(`CNPJ gerado: ${val}`, 'info');
      }
      break;
    }
    default:
      break;
  }
}

async function runAutoFillProcess() {
  if (isScanning) return;
  isScanning = true;

  try {
    const settings = await getSettings();

    if (!settings.enabled) {
      stopDOMObserver();
      isScanning = false;
      return;
    }

    const hostname = window.location.hostname;
    if (!isDomainAllowed(hostname, settings.allowedDomains, settings.blockedDomains)) {
      console.log('[CPF/CNPJ Extension] Domain disabled by settings rule.');
      isScanning = false;
      return;
    }

    const detections = scanDocumentForFields(settings.scoreThreshold);
    let filledCount = 0;

    for (const detection of detections) {
      const filled = fillField(detection, settings);
      if (filled) {
        filledCount++;
      }
    }

    // Update extension stats
    await updateStats(detections.length, filledCount, window.location.href);

    // Setup MutationObserver if enabled
    if (settings.detectNewElements) {
      setupDOMObserver(() => {
        runAutoFillProcess();
      });
    } else {
      stopDOMObserver();
    }
  } catch (err) {
    console.error('[CPF/CNPJ Extension] Scan error:', err);
  } finally {
    isScanning = false;
  }
}

// Listen to runtime messages from Popup / Service Worker / Context Menu
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message: MessagePayload, _sender, sendResponse) => {
    if (message.action === 'TRIGGER_SCAN') {
      runAutoFillProcess().then(() => {
        sendResponse({ success: true });
      });
      return true;
    }
    if (message.action === 'SETTINGS_UPDATED') {
      runAutoFillProcess().then(() => {
        sendResponse({ success: true });
      });
      return true;
    }
    if (message.action === 'CONTEXT_MENU_ACTION') {
      runContextMenuCommand(message.command).then(() => {
        sendResponse({ success: true });
      });
      return true;
    }
  });
}

// Initial execution when document is idle
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  runAutoFillProcess();
} else {
  window.addEventListener('DOMContentLoaded', () => {
    runAutoFillProcess();
  });
}
