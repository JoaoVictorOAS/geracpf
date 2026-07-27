import { ExtensionSettings, ScanStats } from '../types';
import { generateValidCPF, generateValidCNPJ } from '../utils/cpf-cnpj';

const DEFAULT_SETTINGS: ExtensionSettings = {
  cpf: generateValidCPF(),
  cnpj: generateValidCNPJ(),
  enabled: true,
  overwriteExisting: false,
  detectNewElements: true,
  applyMask: true,
  scoreThreshold: 7,
  allowedDomains: [],
  blockedDomains: []
};

const DEFAULT_STATS: ScanStats = {
  fieldsFound: 0,
  fieldsFilled: 0,
  lastScannedUrl: '',
  lastScannedTime: ''
};

export async function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(['settings'], (result) => {
        if (result && result.settings) {
          resolve({ ...DEFAULT_SETTINGS, ...result.settings });
        } else {
          // Initialize defaults
          chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
          resolve(DEFAULT_SETTINGS);
        }
      });
    } else {
      // Fallback for local testing/dev
      const stored = localStorage.getItem('cpf_cnpj_extension_settings');
      if (stored) {
        try {
          resolve({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
        } catch {
          resolve(DEFAULT_SETTINGS);
        }
      } else {
        localStorage.setItem('cpf_cnpj_extension_settings', JSON.stringify(DEFAULT_SETTINGS));
        resolve(DEFAULT_SETTINGS);
      }
    }
  });
}

export async function saveSettings(newSettings: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
  const current = await getSettings();
  const updated = { ...current, ...newSettings };

  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ settings: updated }, () => {
        resolve(updated);
      });
    } else {
      localStorage.setItem('cpf_cnpj_extension_settings', JSON.stringify(updated));
      resolve(updated);
    }
  });
}

export async function getStats(): Promise<ScanStats> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['stats'], (result) => {
        resolve(result.stats || DEFAULT_STATS);
      });
    } else {
      const stored = localStorage.getItem('cpf_cnpj_extension_stats');
      resolve(stored ? JSON.parse(stored) : DEFAULT_STATS);
    }
  });
}

export async function updateStats(found: number, filled: number, url: string): Promise<ScanStats> {
  const stats: ScanStats = {
    fieldsFound: found,
    fieldsFilled: filled,
    lastScannedUrl: url,
    lastScannedTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };

  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ stats }, () => {
        resolve(stats);
      });
    } else {
      localStorage.setItem('cpf_cnpj_extension_stats', JSON.stringify(stats));
      resolve(stats);
    }
  });
}
