/**
 * MutationObserver watcher for dynamic SPA page updates.
 */

let observer: MutationObserver | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function setupDOMObserver(onMutationDetected: () => void, debounceMs = 400) {
  if (observer) {
    observer.disconnect();
  }

  // document.body pode não existir (documentos não-HTML, body removido por script)
  const root = document.body || document.documentElement;
  if (!root) {
    observer = null;
    return;
  }

  observer = new MutationObserver((mutations) => {
    let shouldScan = false;

    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (el.tagName === 'INPUT' || el.querySelector('input')) {
              shouldScan = true;
              break;
            }
          }
        }
      }
      if (shouldScan) break;
    }

    if (shouldScan) {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        onMutationDetected();
      }, debounceMs);
    }
  });

  observer.observe(root, {
    childList: true,
    subtree: true
  });
}

export function stopDOMObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}
