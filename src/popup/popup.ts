import { getSettings, saveSettings, getStats } from '../storage';
import { formatCPF, formatCNPJ, generateValidCPF, generateValidCNPJ } from '../utils/cpf-cnpj';
import { ExtensionSettings } from '../types';

document.addEventListener('DOMContentLoaded', async () => {
  const enabledToggle = document.getElementById('enabledToggle') as HTMLInputElement;
  const runScanBtn = document.getElementById('runScanBtn') as HTMLButtonElement;
  const fieldsFound = document.getElementById('fieldsFound') as HTMLElement;
  const fieldsFilled = document.getElementById('fieldsFilled') as HTMLElement;

  const cpfInput = document.getElementById('cpfInput') as HTMLInputElement;
  const cnpjInput = document.getElementById('cnpjInput') as HTMLInputElement;
  const genCpfBtn = document.getElementById('genCpfBtn') as HTMLButtonElement;
  const genCnpjBtn = document.getElementById('genCnpjBtn') as HTMLButtonElement;

  const overwriteToggle = document.getElementById('overwriteToggle') as HTMLInputElement;
  const detectNewToggle = document.getElementById('detectNewToggle') as HTMLInputElement;
  const applyMaskToggle = document.getElementById('applyMaskToggle') as HTMLInputElement;

  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
  const openOptionsBtn = document.getElementById('openOptionsBtn') as HTMLButtonElement;
  const status = document.getElementById('status') as HTMLElement;

  const settings = await getSettings();
  const stats = await getStats();

  enabledToggle.checked = settings.enabled;

  cpfInput.value = settings.cpf ? formatCPF(settings.cpf) : '';
  cnpjInput.value = settings.cnpj ? formatCNPJ(settings.cnpj) : '';

  overwriteToggle.checked = settings.overwriteExisting;
  detectNewToggle.checked = settings.detectNewElements;
  applyMaskToggle.checked = settings.applyMask;

  fieldsFound.textContent = stats.fieldsFound.toString();
  fieldsFilled.textContent = stats.fieldsFilled.toString();

  cpfInput.addEventListener('input', () => {
    cpfInput.value = formatCPF(cpfInput.value);
  });

  cnpjInput.addEventListener('input', () => {
    cnpjInput.value = formatCNPJ(cnpjInput.value);
  });

  genCpfBtn.addEventListener('click', () => {
    cpfInput.value = formatCPF(generateValidCPF());
    showStatus('CPF gerado.');
  });

  genCnpjBtn.addEventListener('click', () => {
    cnpjInput.value = formatCNPJ(generateValidCNPJ());
    showStatus('CNPJ gerado.');
  });

  saveBtn.addEventListener('click', async () => {
    const newSettings: Partial<ExtensionSettings> = {
      enabled: enabledToggle.checked,
      cpf: cpfInput.value.replace(/\D/g, ''),
      cnpj: cnpjInput.value.replace(/\D/g, ''),
      overwriteExisting: overwriteToggle.checked,
      detectNewElements: detectNewToggle.checked,
      applyMask: applyMaskToggle.checked
    };

    await saveSettings(newSettings);

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'SETTINGS_UPDATED' });
    }

    showStatus('Configurações salvas.');
  });

  runScanBtn.addEventListener('click', async () => {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      showStatus('Indisponível fora do Chrome.');
      return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;

    if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:'))) {
      showStatus('Página do sistema não suportada.');
      return;
    }

    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'TRIGGER_SCAN' });
      showStatus('Varredura executada.');
    } catch {
      // Content script not present in active tab, attempt dynamic injection
      try {
        if (!chrome.scripting) throw new Error('scripting indisponível');
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/index.js']
        });
        await chrome.tabs.sendMessage(tab.id, { action: 'TRIGGER_SCAN' });
        showStatus('Varredura executada.');
      } catch {
        showStatus('Recarregue a página para ativar.');
      }
    }

    setTimeout(async () => {
      const updatedStats = await getStats();
      fieldsFound.textContent = updatedStats.fieldsFound.toString();
      fieldsFilled.textContent = updatedStats.fieldsFilled.toString();
    }, 300);
  });

  openOptionsBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('../options/options.html', '_blank');
    }
  });

  function showStatus(msg: string) {
    status.textContent = msg;
    setTimeout(() => {
      if (status.textContent === msg) {
        status.textContent = '';
      }
    }, 2500);
  }
});
