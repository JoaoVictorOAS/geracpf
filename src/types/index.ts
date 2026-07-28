export interface ExtensionSettings {
  cpf: string; // Stored as digits only
  cnpj: string; // Stored as digits only
  enabled: boolean;
  overwriteExisting: boolean;
  detectNewElements: boolean;
  applyMask: boolean; // Format as 999.999.999-99 or fill raw 99999999999
  cnpjAlphanumeric: boolean; // Generate CNPJ in the new alphanumeric format (Receita Federal, a partir de 2026)
  scoreThreshold: number; // Minimum score to consider an input as target field (default: 7)
  allowedDomains: string[]; // Whitelist domains (empty = all)
  blockedDomains: string[]; // Blacklist domains
}

export type DocumentType = 'cpf' | 'cnpj' | 'cpf_or_cnpj';

export interface ScoreDetail {
  rule: string;
  points: number;
}

export interface DetectionResult {
  element: HTMLInputElement;
  type: DocumentType;
  score: number;
  scoreDetails: ScoreDetail[];
  reasons: string[];
}

export interface ScanStats {
  fieldsFound: number;
  fieldsFilled: number;
  lastScannedUrl: string;
  lastScannedTime: string;
}

export interface MessagePayload {
  action: 'TRIGGER_SCAN' | 'GET_SETTINGS' | 'SETTINGS_UPDATED' | 'UPDATE_STATS' | 'GET_STATS' | 'CONTEXT_MENU_ACTION';
  command?: string;
  data?: any;
}
