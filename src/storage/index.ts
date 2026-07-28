import { ExtensionSettings, ScanStats } from '../types';
import { generateValidCPF, generateValidCNPJ } from '../utils/cpf-cnpj';

const SETTINGS_KEY = 'cpf_cnpj_extension_settings';
const STATS_KEY = 'cpf_cnpj_extension_stats';

const DEFAULT_SETTINGS: ExtensionSettings = {
  cpf: generateValidCPF(),
  cnpj: generateValidCNPJ(),
  enabled: true,
  overwriteExisting: false,
  detectNewElements: true,
  applyMask: true,
  cnpjAlphanumeric: false,
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

/**
 * chrome.runtime.id fica indefinido quando o contexto da extensão é invalidado
 * (ex.: a extensão é recarregada e content scripts antigos continuam rodando em
 * abas já abertas). A partir daí qualquer chamada chrome.* lança exceção.
 */
function chromeStorageAvailable(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    !!chrome.runtime &&
    !!chrome.runtime.id &&
    !!chrome.storage
  );
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return { ...fallback, ...JSON.parse(stored) };
    }
  } catch {
    // localStorage lança em páginas sandboxed ou com cookies bloqueados
  }
  return fallback;
}

function writeLocal(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // idem
  }
}

export async function getSettings(): Promise<ExtensionSettings> {
  if (!chromeStorageAvailable() || !chrome.storage.sync) {
    return readLocal(SETTINGS_KEY, DEFAULT_SETTINGS);
  }

  return new Promise((resolve) => {
    try {
      chrome.storage.sync.get(['settings'], (result) => {
        if (chrome.runtime.lastError) {
          resolve(DEFAULT_SETTINGS);
          return;
        }
        if (result && result.settings) {
          resolve({ ...DEFAULT_SETTINGS, ...result.settings });
        } else {
          chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
          resolve(DEFAULT_SETTINGS);
        }
      });
    } catch {
      resolve(DEFAULT_SETTINGS);
    }
  });
}

export async function saveSettings(newSettings: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
  const current = await getSettings();
  const updated = { ...current, ...newSettings };

  if (!chromeStorageAvailable() || !chrome.storage.sync) {
    writeLocal(SETTINGS_KEY, updated);
    return updated;
  }

  return new Promise((resolve) => {
    try {
      chrome.storage.sync.set({ settings: updated }, () => {
        void chrome.runtime.lastError;
        resolve(updated);
      });
    } catch {
      resolve(updated);
    }
  });
}

export async function getStats(): Promise<ScanStats> {
  if (!chromeStorageAvailable() || !chrome.storage.local) {
    return readLocal(STATS_KEY, DEFAULT_STATS);
  }

  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(['stats'], (result) => {
        if (chrome.runtime.lastError) {
          resolve(DEFAULT_STATS);
          return;
        }
        resolve(result.stats || DEFAULT_STATS);
      });
    } catch {
      resolve(DEFAULT_STATS);
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

  if (!chromeStorageAvailable() || !chrome.storage.local) {
    writeLocal(STATS_KEY, stats);
    return stats;
  }

  return new Promise((resolve) => {
    try {
      chrome.storage.local.set({ stats }, () => {
        void chrome.runtime.lastError;
        resolve(stats);
      });
    } catch {
      resolve(stats);
    }
  });
}
