import { getSettings, saveSettings, getStats } from '../storage';
import { formatCPF, formatCNPJ, generateValidCPF, generateValidCNPJ } from '../utils/cpf-cnpj';
import { ExtensionSettings } from '../types';

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const mainToggle = document.getElementById('mainToggle') as HTMLInputElement;
  const statusBadge = document.getElementById('statusBadge') as HTMLElement;
  const statusText = document.getElementById('statusText') as HTMLElement;
  const runScanBtn = document.getElementById('runScanBtn') as HTMLButtonElement;
  const fieldsFound = document.getElementById('fieldsFound') as HTMLElement;
  const fieldsFilled = document.getElementById('fieldsFilled') as HTMLElement;

  const cpfInput = document.getElementById('cpfInput') as HTMLInputElement;
  const cnpjInput = document.getElementById('cnpjInput') as HTMLInputElement;
  const genCpfBtn = document.getElementById('genCpfBtn') as HTMLButtonElement;
  const genCnpjBtn = document.getElementById('genCnpjBtn') as HTMLButtonElement;

  const autoFillToggle = document.getElementById('autoFillToggle') as HTMLInputElement;
  const overwriteToggle = document.getElementById('overwriteToggle') as HTMLInputElement;
  const detectNewToggle = document.getElementById('detectNewToggle') as HTMLInputElement;
  const applyMaskToggle = document.getElementById('applyMaskToggle') as HTMLInputElement;

  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
  const openTestPageBtn = document.getElementById('openTestPageBtn') as HTMLButtonElement;
  const openOptionsBtn = document.getElementById('openOptionsBtn') as HTMLButtonElement;
  const toast = document.getElementById('toast') as HTMLElement;

  // Load Initial Settings & Stats
  const settings = await getSettings();
  const stats = await getStats();

  // Populate UI
  mainToggle.checked = settings.enabled;
  updateStatusUI(settings.enabled);

  cpfInput.value = settings.cpf ? formatCPF(settings.cpf) : '';
  cnpjInput.value = settings.cnpj ? formatCNPJ(settings.cnpj) : '';

  autoFillToggle.checked = settings.enabled;
  overwriteToggle.checked = settings.overwriteExisting;
  detectNewToggle.checked = settings.detectNewElements;
  applyMaskToggle.checked = settings.applyMask;

  fieldsFound.textContent = stats.fieldsFound.toString();
  fieldsFilled.textContent = stats.fieldsFilled.toString();

  // Formatter input mask listeners
  cpfInput.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value;
    cpfInput.value = formatCPF(val);
  });

  cnpjInput.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value;
    cnpjInput.value = formatCNPJ(val);
  });

  // Generator Buttons
  genCpfBtn.addEventListener('click', () => {
    const raw = generateValidCPF();
    cpfInput.value = formatCPF(raw);
    showToast('CPF válido gerado!');
  });

  genCnpjBtn.addEventListener('click', () => {
    const raw = generateValidCNPJ();
    cnpjInput.value = formatCNPJ(raw);
    showToast('CNPJ válido gerado!');
  });

  // Main Enable Toggle
  mainToggle.addEventListener('change', () => {
    const enabled = mainToggle.checked;
    autoFillToggle.checked = enabled;
    updateStatusUI(enabled);
  });

  autoFillToggle.addEventListener('change', () => {
    mainToggle.checked = autoFillToggle.checked;
    updateStatusUI(autoFillToggle.checked);
  });

  // Save Settings Action
  saveBtn.addEventListener('click', async () => {
    const newSettings: Partial<ExtensionSettings> = {
      enabled: mainToggle.checked,
      cpf: cpfInput.value.replace(/\D/g, ''),
      cnpj: cnpjInput.value.replace(/\D/g, ''),
      overwriteExisting: overwriteToggle.checked,
      detectNewElements: detectNewToggle.checked,
      applyMask: applyMaskToggle.checked
    };

    await saveSettings(newSettings);

    // Notify active tabs
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'SETTINGS_UPDATED' });
    }

    showToast('Configurações salvas!');
  });

  // Manual Trigger Scan Button
  runScanBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'TRIGGER_SCAN' }, async () => {
            showToast('Varredura executada!');
            setTimeout(async () => {
              const updatedStats = await getStats();
              fieldsFound.textContent = updatedStats.fieldsFound.toString();
              fieldsFilled.textContent = updatedStats.fieldsFilled.toString();
            }, 300);
          });
        }
      });
    } else {
      showToast('Modo de demonstração');
    }
  });

  // Navigation Links
  openTestPageBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('test/test-page.html') });
    } else {
      window.open('../test/test-page.html', '_blank');
    }
  });

  openOptionsBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('../options/options.html', '_blank');
    }
  });

  function updateStatusUI(enabled: boolean) {
    if (enabled) {
      statusBadge.classList.remove('disabled');
      statusText.textContent = 'Extensão Ativa';
    } else {
      statusBadge.classList.add('disabled');
      statusText.textContent = 'Extensão Desativada';
    }
  }

  function showToast(msg: string) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }
});
