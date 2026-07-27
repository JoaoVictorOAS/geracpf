import { scanDocumentForFields } from '../src/detector/scoring';
import { fillField } from '../src/content/filler';
import { getSettings } from '../src/storage';

document.addEventListener('DOMContentLoaded', () => {
  const manualScanBtn = document.getElementById('manualScanBtn') as HTMLButtonElement;
  const clearInputsBtn = document.getElementById('clearInputsBtn') as HTMLButtonElement;
  const injectSpaFormBtn = document.getElementById('injectSpaFormBtn') as HTMLButtonElement;
  const spaContainer = document.getElementById('spaContainer') as HTMLElement;
  const logConsole = document.getElementById('logConsole') as HTMLElement;

  function appendLog(msg: string, type: 'info' | 'event' | 'fill' = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    entry.textContent = `[${timestamp}] ${msg}`;
    logConsole.appendChild(entry);
    logConsole.scrollTop = logConsole.scrollHeight;
  }

  // Attach event monitoring to all inputs
  function attachEventLoggers(inputs: NodeListOf<HTMLInputElement> | HTMLInputElement[]) {
    inputs.forEach((input) => {
      if ((input as any)._hasLogger) return;
      (input as any)._hasLogger = true;

      ['input', 'change', 'blur'].forEach((eventType) => {
        input.addEventListener(eventType, () => {
          appendLog(`Evento [${eventType}] disparado em #${input.id || input.name || 'input'} | Valor: "${input.value}"`, 'event');
        });
      });
    });
  }

  // Monitor existing inputs
  attachEventLoggers(document.querySelectorAll('input'));

  // Manual Scan Execution
  manualScanBtn.addEventListener('click', async () => {
    appendLog('Iniciando varredura local de teste...', 'info');
    const settings = await getSettings();
    const detections = scanDocumentForFields(settings.scoreThreshold);

    appendLog(`Encontrados ${detections.length} campos elegíveis.`, 'info');

    let filledCount = 0;
    for (const det of detections) {
      appendLog(`Campo identificado: #${det.element.id || det.element.name} -> Tipo: ${det.type.toUpperCase()} | Score: ${det.score}`, 'info');
      const ok = fillField(det, settings);
      if (ok) {
        filledCount++;
        appendLog(`✓ Preenchido #${det.element.id || det.element.name} com sucesso!`, 'fill');
      }
    }

    appendLog(`Varredura concluída. Total de campos preenchidos: ${filledCount}`, 'fill');
  });

  // Clear Inputs
  clearInputsBtn.addEventListener('click', () => {
    document.querySelectorAll('input').forEach((input) => {
      if (!input.disabled && !input.readOnly) {
        input.value = '';
      }
    });
    appendLog('Todos os campos editáveis foram limpos.', 'info');
  });

  // Inject SPA Dynamic Form Component
  let dynamicIdCounter = 1;
  injectSpaFormBtn.addEventListener('click', () => {
    const card = document.createElement('div');
    card.className = 'dynamic-modal-card';
    const fieldId = `cpfDynamic_${dynamicIdCounter++}`;

    card.innerHTML = `
      <h3>Modal Dinâmico Injetado (React Simulado)</h3>
      <div class="field-group">
        <label for="${fieldId}">CPF de Verificação Dinâmica:</label>
        <input type="text" id="${fieldId}" name="cpf_dinamico" placeholder="000.000.000-00">
      </div>
    `;

    spaContainer.appendChild(card);
    const newInputs = card.querySelectorAll<HTMLInputElement>('input');
    attachEventLoggers(newInputs);

    appendLog(`Novo componente SPA injetado no DOM (id: #${fieldId}).`, 'info');
  });
});
