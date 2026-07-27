/**
 * Minimal in-page feedback for the content script.
 */

let activeToast: HTMLElement | null = null;
let hideTimer: number | undefined;

export function showToastNotification(message: string): void {
  ensureUIStyles();

  if (!activeToast) {
    activeToast = document.createElement('div');
    activeToast.className = 'cpf-cnpj-toast';
    document.body.appendChild(activeToast);
  }

  activeToast.textContent = message;

  clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    activeToast?.remove();
    activeToast = null;
  }, 3000);
}

function ensureUIStyles(): void {
  if (document.getElementById('cpf-cnpj-ui-styles')) return;

  const style = document.createElement('style');
  style.id = 'cpf-cnpj-ui-styles';
  style.textContent = `
    .cpf-cnpj-toast {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 999999;
      max-width: 320px;
      padding: 8px 12px;
      background: #222;
      color: #fff;
      border-radius: 4px;
      font-family: system-ui, sans-serif;
      font-size: 13px;
      pointer-events: none;
    }
  `;

  document.head.appendChild(style);
}
