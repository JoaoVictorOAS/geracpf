import { getSettings } from '../storage';
import { MessagePayload } from '../types';

function createContextMenuItems() {
  if (typeof chrome === 'undefined' || !chrome.contextMenus) return;

  chrome.contextMenus.removeAll(() => {
    // Parent Context Menu
    chrome.contextMenus.create({
      id: 'gerar_cpf_cnpj_root',
      title: 'CPF / CNPJ',
      contexts: ['editable', 'page']
    });

    // Submenu Items
    chrome.contextMenus.create({
      id: 'fill_generated_cpf',
      parentId: 'gerar_cpf_cnpj_root',
      title: 'Gerar e preencher CPF',
      contexts: ['editable', 'page']
    });

    chrome.contextMenus.create({
      id: 'fill_generated_cnpj',
      parentId: 'gerar_cpf_cnpj_root',
      title: 'Gerar e preencher CNPJ',
      contexts: ['editable', 'page']
    });

    chrome.contextMenus.create({
      id: 'fill_generated_cnpj_alphanumeric',
      parentId: 'gerar_cpf_cnpj_root',
      title: 'Gerar e preencher CNPJ alfanumérico',
      contexts: ['editable', 'page']
    });

    chrome.contextMenus.create({
      id: 'fill_saved_data',
      parentId: 'gerar_cpf_cnpj_root',
      title: 'Preencher com dados salvos',
      contexts: ['editable', 'page']
    });

    chrome.contextMenus.create({
      id: 'sep_1',
      parentId: 'gerar_cpf_cnpj_root',
      type: 'separator',
      contexts: ['editable', 'page']
    });

    chrome.contextMenus.create({
      id: 'copy_generated_cpf',
      parentId: 'gerar_cpf_cnpj_root',
      title: 'Gerar e copiar CPF',
      contexts: ['editable', 'page']
    });

    chrome.contextMenus.create({
      id: 'copy_generated_cnpj',
      parentId: 'gerar_cpf_cnpj_root',
      title: 'Gerar e copiar CNPJ',
      contexts: ['editable', 'page']
    });

    chrome.contextMenus.create({
      id: 'copy_generated_cnpj_alphanumeric',
      parentId: 'gerar_cpf_cnpj_root',
      title: 'Gerar e copiar CNPJ alfanumérico',
      contexts: ['editable', 'page']
    });
  });
}

/**
 * Safely send message to a tab, dynamically injecting content script if missing on eligible tabs.
 */
async function sendMessageToTab(tabId: number, tabUrl: string | undefined, message: MessagePayload): Promise<void> {
  if (tabUrl && (tabUrl.startsWith('chrome://') || tabUrl.startsWith('chrome-extension://') || tabUrl.startsWith('edge://') || tabUrl.startsWith('about:'))) {
    return;
  }

  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch (err) {
    // Receiving end does not exist - attempt dynamic injection of content script
    try {
      if (chrome.scripting) {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content/index.js']
        });
        await chrome.tabs.sendMessage(tabId, message);
      }
    } catch (injectErr) {
      console.debug('[CPF/CNPJ Extension] Could not send message or inject script into tab:', tabId, injectErr);
    }
  }
}

// Handle extension lifecycle events
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onInstalled.addListener(async () => {
    console.log('[CPF/CNPJ Extension] Extension installed / updated.');
    await getSettings(); // Ensure defaults are written to storage
    createContextMenuItems();

    // Inject content script into already open web tabs upon installation/reload
    try {
      const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });
      for (const tab of tabs) {
        if (tab.id) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content/index.js']
          }).catch(() => {
            // Ignore restricted or unscriptable tabs
          });
        }
      }
    } catch (err) {
      console.debug('[CPF/CNPJ Extension] Could not auto-inject into open tabs:', err);
    }
  });

  if (chrome.runtime.onStartup) {
    chrome.runtime.onStartup.addListener(() => {
      createContextMenuItems();
    });
  }

  // Listener for Context Menu Clicks
  if (chrome.contextMenus && chrome.contextMenus.onClicked) {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (tab?.id) {
        sendMessageToTab(tab.id, tab.url, {
          action: 'CONTEXT_MENU_ACTION',
          command: String(info.menuItemId)
        });
      }
    });
  }

  // Message listener relay
  chrome.runtime.onMessage.addListener((message: MessagePayload, _sender, sendResponse) => {
    if (message.action === 'SETTINGS_UPDATED') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
          sendMessageToTab(tabs[0].id, tabs[0].url, { action: 'SETTINGS_UPDATED' });
        }
      });
      sendResponse({ status: 'notified' });
    }
    return true;
  });
}


