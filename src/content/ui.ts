/**
 * UI Utilities for Content Script: Toasts, Floating Generator Suggestions (Native-like)
 */

let activeToast: HTMLElement | null = null;
let activeFloatingMenu: HTMLElement | null = null;
let currentTargetInput: HTMLInputElement | null = null;

export function showToastNotification(message: string, type: 'success' | 'info' | 'warning' = 'success'): void {
  if (activeToast) {
    activeToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `cpf-cnpj-toast cpf-cnpj-toast-${type}`;
  
  const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';

  toast.innerHTML = `
    <span class="cpf-cnpj-toast-icon">${icon}</span>
    <span class="cpf-cnpj-toast-text">${message}</span>
  `;

  // Inject styles if not already present
  ensureUIStyles();

  document.body.appendChild(toast);
  activeToast = toast;

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });

  setTimeout(() => {
    if (toast === activeToast) {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }
  }, 3200);
}

export function hideFloatingMenu(): void {
  if (activeFloatingMenu) {
    activeFloatingMenu.remove();
    activeFloatingMenu = null;
  }
}

export function showFloatingGeneratorMenu(
  target: HTMLInputElement,
  onSelect: (type: 'cpf' | 'cnpj') => void,
  position?: { x: number; y: number }
): void {
  hideFloatingMenu();
  currentTargetInput = target;

  ensureUIStyles();

  const menu = document.createElement('div');
  menu.className = 'cpf-cnpj-floating-menu';
  
  menu.innerHTML = `
    <div class="cpf-cnpj-menu-header">
      <span class="cpf-cnpj-badge-icon">⚡</span>
      <span>Gerar Documento</span>
    </div>
    <div class="cpf-cnpj-menu-options">
      <button type="button" class="cpf-cnpj-menu-btn" data-type="cpf">
        <span class="btn-icon">👤</span> Gerar e Preencher CPF
      </button>
      <button type="button" class="cpf-cnpj-menu-btn" data-type="cnpj">
        <span class="btn-icon">🏢</span> Gerar e Preencher CNPJ
      </button>
    </div>
  `;

  const rect = target.getBoundingClientRect();
  const topPos = position ? position.y : rect.bottom + window.scrollY + 6;
  const leftPos = position ? position.x : Math.max(8, rect.left + window.scrollX);

  menu.style.top = `${topPos}px`;
  menu.style.left = `${leftPos}px`;

  menu.addEventListener('mousedown', (e) => {
    e.preventDefault(); // Prevent blurring target input
  });

  menu.querySelectorAll('.cpf-cnpj-menu-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const docType = (btn as HTMLElement).dataset.type as 'cpf' | 'cnpj';
      onSelect(docType);
      hideFloatingMenu();
    });
  });

  document.body.appendChild(menu);
  activeFloatingMenu = menu;

  // Auto-close on click outside
  const clickOutsideHandler = (e: MouseEvent) => {
    if (activeFloatingMenu && !activeFloatingMenu.contains(e.target as Node) && e.target !== target) {
      hideFloatingMenu();
      document.removeEventListener('mousedown', clickOutsideHandler);
    }
  };
  setTimeout(() => {
    document.addEventListener('mousedown', clickOutsideHandler);
  }, 10);
}

function ensureUIStyles(): void {
  if (document.getElementById('cpf-cnpj-ui-styles')) return;

  const style = document.createElement('style');
  style.id = 'cpf-cnpj-ui-styles';
  style.textContent = `
    .cpf-cnpj-toast {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 18px;
      border-radius: 10px;
      background: #1e293b;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
      opacity: 0;
      transform: translateY(-12px) scale(0.96);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
    }
    .cpf-cnpj-toast.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    .cpf-cnpj-toast-success {
      border-left: 4px solid #10b981;
    }
    .cpf-cnpj-toast-info {
      border-left: 4px solid #6366f1;
    }
    .cpf-cnpj-toast-warning {
      border-left: 4px solid #f59e0b;
    }

    .cpf-cnpj-floating-menu {
      position: absolute;
      z-index: 999999;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 10px;
      box-shadow: 0 12px 30px -4px rgba(0, 0, 0, 0.45);
      padding: 6px;
      width: 220px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      animation: cpfCnpjFadeIn 0.18s ease-out;
    }
    @keyframes cpfCnpjFadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .cpf-cnpj-menu-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px 8px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      border-bottom: 1px solid #1e293b;
      margin-bottom: 4px;
    }
    .cpf-cnpj-menu-options {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .cpf-cnpj-menu-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 10px;
      background: transparent;
      border: none;
      border-radius: 6px;
      color: #f1f5f9;
      font-size: 13px;
      font-weight: 500;
      text-align: left;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .cpf-cnpj-menu-btn:hover {
      background: #1e293b;
      color: #6366f1;
    }
    .cpf-cnpj-menu-btn .btn-icon {
      font-size: 14px;
    }
  `;

  document.head.appendChild(style);
}
