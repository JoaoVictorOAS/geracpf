import { getSettings, saveSettings } from '../storage';

document.addEventListener('DOMContentLoaded', async () => {
  const scoreThresholdInput = document.getElementById('scoreThresholdInput') as HTMLInputElement;
  const scoreThresholdVal = document.getElementById('scoreThresholdVal') as HTMLElement;
  const allowedDomainsInput = document.getElementById('allowedDomainsInput') as HTMLInputElement;
  const blockedDomainsInput = document.getElementById('blockedDomainsInput') as HTMLInputElement;
  const saveOptionsBtn = document.getElementById('saveOptionsBtn') as HTMLButtonElement;
  const saveStatus = document.getElementById('saveStatus') as HTMLElement;

  const settings = await getSettings();
  scoreThresholdInput.value = settings.scoreThreshold.toString();
  scoreThresholdVal.textContent = settings.scoreThreshold.toString();
  allowedDomainsInput.value = (settings.allowedDomains || []).join(', ');
  blockedDomainsInput.value = (settings.blockedDomains || []).join(', ');

  scoreThresholdInput.addEventListener('input', () => {
    scoreThresholdVal.textContent = scoreThresholdInput.value;
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

    saveStatus.textContent = 'Configurações salvas.';
    setTimeout(() => {
      saveStatus.textContent = '';
    }, 3000);
  });
});
