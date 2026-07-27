import { getSettings } from '../storage';
import { MessagePayload } from '../types';

// Handle extension lifecycle events
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
      console.log('[CPF/CNPJ Extension] Extension installed successfully.');
      await getSettings(); // Ensure defaults are written to storage
    }
  });

  // Message listener relay
  chrome.runtime.onMessage.addListener((message: MessagePayload, _sender, sendResponse) => {
    if (message.action === 'SETTINGS_UPDATED') {
      // Notify active tabs about settings change
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'SETTINGS_UPDATED' }).catch(() => {
            // Ignore error if tab doesn't have content script injected
          });
        }
      });
      sendResponse({ status: 'notified' });
    }
    return true;
  });
}
