import { scanDocumentForFields } from '../detector/scoring';
import { fillField } from './filler';
import { getSettings, updateStats } from '../storage';
import { setupDOMObserver, stopDOMObserver } from './observer';
import { MessagePayload } from '../types';

let isScanning = false;

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

// Listen to runtime messages from Popup / Service Worker
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message: MessagePayload, _sender, sendResponse) => {
    if (message.action === 'TRIGGER_SCAN') {
      runAutoFillProcess().then(() => {
        sendResponse({ success: true });
      });
      return true; // Keep message channel open for async response
    }
    if (message.action === 'SETTINGS_UPDATED') {
      runAutoFillProcess().then(() => {
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
