import { scanDocumentForFields } from '../detector/scoring';
import { fillField, fillInputElement } from './filler';
import { getSettings, updateStats } from '../storage';
import { setupDOMObserver, stopDOMObserver } from './observer';
import { MessagePayload } from '../types';
import { generateValidCPF, generateValidCNPJ } from '../utils/cpf-cnpj';
import { getFormattedValue } from '../formatter/mask';
import { showToastNotification } from './ui';

let isScanning = false;
let lastRightClickedElement: HTMLInputElement | null = null;

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

// Track right-clicked element so the native context menu knows where to fill
document.addEventListener('contextmenu', (e: MouseEvent) => {
  const target = e.target as HTMLElement;

  if (target && target.tagName === 'INPUT') {
    const input = target as HTMLInputElement;
    if (!input.disabled && !input.readOnly) {
      lastRightClickedElement = input;
    }
  }
}, true);

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

function generateFormatted(docType: 'cpf' | 'cnpj', applyMask: boolean): string {
  const raw = docType === 'cpf' ? generateValidCPF() : generateValidCNPJ();
  return getFormattedValue(raw, docType, applyMask);
}

async function copyToClipboard(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value);
    showToastNotification(`${label} copiado: ${value}`);
  } catch {
    showToastNotification(`${label} gerado: ${value}`);
  }
}

async function runContextMenuCommand(command?: string) {
  const settings = await getSettings();

  switch (command) {
    case 'fill_generated_cpf':
    case 'fill_generated_cnpj': {
      const docType = command === 'fill_generated_cpf' ? 'cpf' : 'cnpj';
      const label = docType.toUpperCase();
      const val = generateFormatted(docType, settings.applyMask);
      const target = getTargetInput();

      if (target) {
        fillInputElement(target, val);
        showToastNotification(`${label} preenchido: ${val}`);
      } else {
        await copyToClipboard(label, val);
      }
      break;
    }
    case 'copy_generated_cpf':
    case 'copy_generated_cnpj': {
      const docType = command === 'copy_generated_cpf' ? 'cpf' : 'cnpj';
      const val = generateFormatted(docType, settings.applyMask);
      await copyToClipboard(docType.toUpperCase(), val);
      break;
    }
    case 'fill_saved_data': {
      await runAutoFillProcess();
      showToastNotification('Formulário preenchido com os dados salvos.');
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
