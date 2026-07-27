import { getSettings } from '../storage';
import { MessagePayload } from '../types';

function createContextMenuItems() {
  if (typeof chrome === 'undefined' || !chrome.contextMenus) return;

  chrome.contextMenus.removeAll(() => {
    // Parent Context Menu
    chrome.contextMenus.create({
      id: 'gerar_cpf_cnpj_root',
      title: 'Gerar / Preencher CPF/CNPJ',
      contexts: ['editable', 'page']
    });

    // Submenu Items
    chrome.contextMenus.create({
      id: 'fill_generated_cpf',
      parentId: 'gerar_cpf_cnpj_root',
      title: '👤 Gerar e Preencher CPF Válido',
      contexts: ['editable', 'page']
    });

    chrome.contextMenus.create({
      id: 'fill_generated_cnpj',
      parentId: 'gerar_cpf_cnpj_root',
      title: '🏢 Gerar e Preencher CNPJ Válido',
      contexts: ['editable', 'page']
    });

    chrome.contextMenus.create({
      id: 'fill_saved_data',
      parentId: 'gerar_cpf_cnpj_root',
      title: '⚡ Preencher com Dados Salvos',
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
      title: '📋 Gerar e Copiar CPF',
      contexts: ['editable', 'page']
    });

    chrome.contextMenus.create({
      id: 'copy_generated_cnpj',
      parentId: 'gerar_cpf_cnpj_root',
      title: '📋 Gerar e Copiar CNPJ',
      contexts: ['editable', 'page']
    });
  });
}

// Handle extension lifecycle events
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onInstalled.addListener(async () => {
    console.log('[CPF/CNPJ Extension] Extension installed / updated.');
    await getSettings(); // Ensure defaults are written to storage
    createContextMenuItems();
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
        chrome.tabs.sendMessage(tab.id, {
          action: 'CONTEXT_MENU_ACTION',
          command: info.menuItemId
        }).catch((err) => {
          console.warn('[CPF/CNPJ Extension] Could not send message to tab:', err);
        });
      }
    });
  }

  // Message listener relay
  chrome.runtime.onMessage.addListener((message: MessagePayload, _sender, sendResponse) => {
    if (message.action === 'SETTINGS_UPDATED') {
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

