import { getSettings, saveSettings } from '../storage';
import { isValidCPF, isValidCNPJ, formatCPF, formatCNPJ } from '../utils/cpf-cnpj';

document.addEventListener('DOMContentLoaded', async () => {
  const scoreThresholdInput = document.getElementById('scoreThresholdInput') as HTMLInputElement;
  const scoreThresholdVal = document.getElementById('scoreThresholdVal') as HTMLElement;
  const allowedDomainsInput = document.getElementById('allowedDomainsInput') as HTMLInputElement;
  const blockedDomainsInput = document.getElementById('blockedDomainsInput') as HTMLInputElement;
  const saveOptionsBtn = document.getElementById('saveOptionsBtn') as HTMLButtonElement;
  const saveStatus = document.getElementById('saveStatus') as HTMLElement;
  const openTestBtn = document.getElementById('openTestBtn') as HTMLButtonElement;

  const testCpfInput = document.getElementById('testCpfInput') as HTMLInputElement;
  const validateCpfBtn = document.getElementById('validateCpfBtn') as HTMLButtonElement;
  const cpfValResult = document.getElementById('cpfValResult') as HTMLElement;

  const testCnpjInput = document.getElementById('testCnpjInput') as HTMLInputElement;
  const validateCnpjBtn = document.getElementById('validateCnpjBtn') as HTMLButtonElement;
  const cnpjValResult = document.getElementById('cnpjValResult') as HTMLElement;

  // Load Settings
  const settings = await getSettings();
  scoreThresholdInput.value = settings.scoreThreshold.toString();
  scoreThresholdVal.textContent = `${settings.scoreThreshold} pontos`;
  allowedDomainsInput.value = (settings.allowedDomains || []).join(', ');
  blockedDomainsInput.value = (settings.blockedDomains || []).join(', ');

  scoreThresholdInput.addEventListener('input', () => {
    scoreThresholdVal.textContent = `${scoreThresholdInput.value} pontos`;
  });

  saveOptionsBtn.addEventListener('click', async () => {
    const allowed = allowedDomainsInput.value.split(',').map((s) => s.trim()).filter(Boolean);
    const blocked = blockedDomainsInput.value.split(',').map((s) => s.trim()).filter(Boolean);

    await saveSettings({
      scoreThreshold: parseInt(scoreThresholdInput.value, 10),
      allowedDomains: allowed,
      blockedDomains: blocked
    });

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'SETTINGS_UPDATED' });
    }

    saveStatus.textContent = 'Configurações salvas com sucesso!';
    setTimeout(() => {
      saveStatus.textContent = '';
    }, 3000);
  });

  openTestBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('test/test-page.html') });
    } else {
      window.open('../test/test-page.html', '_blank');
    }
  });

  // Validator sandbox
  validateCpfBtn.addEventListener('click', () => {
    const val = testCpfInput.value;
    if (isValidCPF(val)) {
      cpfValResult.textContent = `✓ CPF Válido (${formatCPF(val)})`;
      cpfValResult.className = 'val-result valid';
    } else {
      cpfValResult.textContent = '✗ CPF Inválido!';
      cpfValResult.className = 'val-result invalid';
    }
  });

  validateCnpjBtn.addEventListener('click', () => {
    const val = testCnpjInput.value;
    if (isValidCNPJ(val)) {
      cnpjValResult.textContent = `✓ CNPJ Válido (${formatCNPJ(val)})`;
      cnpjValResult.className = 'val-result valid';
    } else {
      cnpjValResult.textContent = '✗ CNPJ Inválido!';
      cnpjValResult.className = 'val-result invalid';
    }
  });
});
