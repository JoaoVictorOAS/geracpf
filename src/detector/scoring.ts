import { DetectionResult, DocumentType, ScoreDetail } from '../types';
import { getAssociatedLabelText, isElementEditable } from './dom';

interface KeywordRule {
  pattern: RegExp;
  points: number;
  description: string;
  typeMatch?: DocumentType;
}

// Keyword patterns for CPF
const CPF_PATTERNS: KeywordRule[] = [
  { pattern: /\bcpf\b/i, points: 5, description: 'CPF exato' },
  { pattern: /cpf[_-]?(cliente|usuario|titular|pf|pessoa)/i, points: 4, description: 'CPF de usuário/cliente' },
  { pattern: /num[_-]?cpf/i, points: 4, description: 'Número do CPF' },
  { pattern: /\b9{3}\.9{3}\.9{3}-9{2}\b|\b0{3}\.0{3}\.0{3}-0{2}\b/, points: 5, description: 'Máscara de CPF' }
];

// Keyword patterns for CNPJ
const CNPJ_PATTERNS: KeywordRule[] = [
  { pattern: /\bcnpj\b/i, points: 5, description: 'CNPJ exato' },
  { pattern: /cnpj[_-]?(empresa|cliente|usuario|pj)/i, points: 4, description: 'CNPJ da empresa' },
  { pattern: /num[_-]?cnpj/i, points: 4, description: 'Número do CNPJ' },
  { pattern: /\b9{2}\.9{3}\.9{3}\/9{4}-9{2}\b|\b0{2}\.0{3}\.0{3}\/0{4}-0{2}\b/, points: 5, description: 'Máscara de CNPJ' }
];

// Keyword patterns for Combined CPF/CNPJ or Document
const COMBINED_PATTERNS: KeywordRule[] = [
  { pattern: /cpf[_\/\s-]*cnpj/i, points: 6, description: 'CPF/CNPJ combinado' },
  { pattern: /cnpj[_\/\s-]*cpf/i, points: 6, description: 'CNPJ/CPF combinado' },
  { pattern: /\bdocumento\b|\bdoc\b|\bdocument\b/i, points: 3, description: 'Documento genérico' }
];

export function analyzeElement(element: HTMLInputElement, minThreshold: number = 7): DetectionResult | null {
  if (!isElementEditable(element)) return null;

  let cpfScore = 0;
  let cnpjScore = 0;
  const scoreDetails: ScoreDetail[] = [];
  const reasons: string[] = [];

  const name = element.name || '';
  const id = element.id || '';
  const placeholder = element.placeholder || '';
  const autocomplete = element.getAttribute('autocomplete') || '';
  const ariaLabel = element.getAttribute('aria-label') || '';
  const dataMask = element.getAttribute('data-mask') || element.getAttribute('data-type') || '';
  const labelText = getAssociatedLabelText(element);
  const maxlength = element.maxLength;

  // 1. Autocomplete attribute (Weight: Very High +10)
  if (/cpf/i.test(autocomplete)) {
    cpfScore += 10;
    scoreDetails.push({ rule: 'autocomplete: cpf', points: 10 });
  } else if (/cnpj/i.test(autocomplete)) {
    cnpjScore += 10;
    scoreDetails.push({ rule: 'autocomplete: cnpj', points: 10 });
  }

  // 2. ID attribute (Weight: Medium +4 to +5)
  if (id) {
    if (/\bcpf\b/i.test(id)) {
      cpfScore += 5;
      scoreDetails.push({ rule: `id (${id}): cpf`, points: 5 });
    }
    if (/\bcnpj\b/i.test(id)) {
      cnpjScore += 5;
      scoreDetails.push({ rule: `id (${id}): cnpj`, points: 5 });
    }
    if (/cpf[_\/\s-]*cnpj|cnpj[_\/\s-]*cpf/i.test(id)) {
      cpfScore += 4;
      cnpjScore += 4;
      scoreDetails.push({ rule: `id (${id}): combinado`, points: 4 });
    }
  }

  // 3. Name attribute (Weight: Medium +4 to +5)
  if (name) {
    if (/\bcpf\b/i.test(name)) {
      cpfScore += 5;
      scoreDetails.push({ rule: `name (${name}): cpf`, points: 5 });
    }
    if (/\bcnpj\b/i.test(name)) {
      cnpjScore += 5;
      scoreDetails.push({ rule: `name (${name}): cnpj`, points: 5 });
    }
    if (/cpf[_\/\s-]*cnpj|cnpj[_\/\s-]*cpf/i.test(name)) {
      cpfScore += 4;
      cnpjScore += 4;
      scoreDetails.push({ rule: `name (${name}): combinado`, points: 4 });
    }
  }

  // 4. Label text (Weight: High +5)
  if (labelText) {
    for (const rule of CPF_PATTERNS) {
      if (rule.pattern.test(labelText)) {
        cpfScore += rule.points;
        scoreDetails.push({ rule: `label: ${rule.description}`, points: rule.points });
        break;
      }
    }
    for (const rule of CNPJ_PATTERNS) {
      if (rule.pattern.test(labelText)) {
        cnpjScore += rule.points;
        scoreDetails.push({ rule: `label: ${rule.description}`, points: rule.points });
        break;
      }
    }
    for (const rule of COMBINED_PATTERNS) {
      if (rule.pattern.test(labelText)) {
        cpfScore += rule.points;
        cnpjScore += rule.points;
        scoreDetails.push({ rule: `label: ${rule.description}`, points: rule.points });
        break;
      }
    }
  }

  // 5. Placeholder (Weight: High +5)
  if (placeholder) {
    for (const rule of CPF_PATTERNS) {
      if (rule.pattern.test(placeholder)) {
        cpfScore += rule.points;
        scoreDetails.push({ rule: `placeholder: ${rule.description}`, points: rule.points });
        break;
      }
    }
    for (const rule of CNPJ_PATTERNS) {
      if (rule.pattern.test(placeholder)) {
        cnpjScore += rule.points;
        scoreDetails.push({ rule: `placeholder: ${rule.description}`, points: rule.points });
        break;
      }
    }
    for (const rule of COMBINED_PATTERNS) {
      if (rule.pattern.test(placeholder)) {
        cpfScore += rule.points;
        cnpjScore += rule.points;
        scoreDetails.push({ rule: `placeholder: ${rule.description}`, points: rule.points });
        break;
      }
    }
  }

  // 6. ARIA label & Data attributes (Weight: +4)
  const ariaAndData = `${ariaLabel} ${dataMask}`.toLowerCase();
  if (ariaAndData) {
    if (/cpf/.test(ariaAndData)) {
      cpfScore += 4;
      scoreDetails.push({ rule: 'aria/data-mask: cpf', points: 4 });
    }
    if (/cnpj/.test(ariaAndData)) {
      cnpjScore += 4;
      scoreDetails.push({ rule: 'aria/data-mask: cnpj', points: 4 });
    }
  }

  // 7. Maxlength complementary points
  if (maxlength === 11 || maxlength === 14) {
    cpfScore += 2;
    scoreDetails.push({ rule: `maxlength (${maxlength}): cpf bonus`, points: 2 });
  }
  if (maxlength === 14 || maxlength === 18) {
    cnpjScore += 2;
    scoreDetails.push({ rule: `maxlength (${maxlength}): cnpj bonus`, points: 2 });
  }

  // Determine classification
  let finalType: DocumentType | null = null;
  let finalScore = 0;

  const maxScore = Math.max(cpfScore, cnpjScore);

  if (maxScore < minThreshold) {
    return null; // Score too low, ignore element
  }

  if (cpfScore >= minThreshold && cnpjScore >= minThreshold && Math.abs(cpfScore - cnpjScore) <= 2) {
    finalType = 'cpf_or_cnpj';
    finalScore = maxScore;
    reasons.push(`Padrão detectado para CPF e CNPJ (score: ${maxScore})`);
  } else if (cpfScore > cnpjScore) {
    finalType = 'cpf';
    finalScore = cpfScore;
    reasons.push(`Score elevado para CPF (${cpfScore})`);
  } else {
    finalType = 'cnpj';
    finalScore = cnpjScore;
    reasons.push(`Score elevado para CNPJ (${cnpjScore})`);
  }

  return {
    element,
    type: finalType,
    score: finalScore,
    scoreDetails,
    reasons
  };
}

export function scanDocumentForFields(minThreshold: number = 7): DetectionResult[] {
  const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input'));
  const results: DetectionResult[] = [];

  for (const input of inputs) {
    const res = analyzeElement(input, minThreshold);
    if (res) {
      results.push(res);
    }
  }

  return results;
}
