import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * O content script é injetado como script clássico (não módulo), então não pode
 * conter `import` — o Chrome lança "Cannot use import statement outside a module".
 *
 * Por isso ele é buildado separado das demais entradas: com uma única entrada e
 * formato IIFE, o Rollup não extrai chunks compartilhados e gera um arquivo
 * autocontido. Roda depois do build principal, com emptyOutDir desligado.
 */
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, 'src/content/index.ts'),
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'content/index.js'
      }
    }
  }
});
