# Extensão Chrome para Autopreenchimento Inteligente de CPF/CNPJ

Uma extensão desenvolvida para **Google Chrome (Manifest V3)** em **TypeScript** e **Vite**, projetada para identificar e preencher automaticamente campos de CPF e CNPJ em qualquer página web ou aplicação SPA (React, Vue, Angular, Svelte).

---

## 🚀 Funcionalidades Principais

* **Detecção por Algoritmo de Score Inteligente:** Analisa múltiplos atributos dos elementos de formulário (`name`, `id`, `placeholder`, `label` associado, `autocomplete`, `aria-label`, `maxlength` e `data-mask`).
* **Suporte a Campos Únicos (CPF/CNPJ):** Identifica e formata o documento correto com base no tamanho do campo e capacidade máxima (`maxlength`).
* **Compatibilidade com Frameworks Reativos (React / Vue / Angular):** Dispara `Object.getOwnPropertyDescriptor` do protótipo nativo de `HTMLInputElement` juntamente com eventos sintéticos (`input`, `change`, `blur`, `focus`).
* **Observador de DOM (MutationObserver):** Escaneia dinamicamente novos componentes, modais, etapas e wizards em SPAs com controle de debounce.
* **Respeito a Campos Preenchidos:** Evita sobrescrever dados existentes por padrão (configurável no painel).
* **Gerador Integrado de Documentos Válidos:** Gera instantaneamente CPFs e CNPJs válidos para ambientes de teste e homologação.
* **Interface Moderna Glassmorphic:** Popup e tela de Opções desenvolvidas com estética Dark Mode, transições suaves e feedback visual.
* **Página Interativa de Testes:** Suite de testes embutida com console de eventos em tempo real.

---

## 🛠️ Arquitetura do Projeto

```
chrome-extension/
├── src/
│   ├── background/      # Service Worker (Manifest V3)
│   ├── content/         # Content script, autopreenchimento e MutationObserver
│   ├── detector/        # Algoritmo de pontuação (scoring) e utilitários de DOM
│   ├── formatter/       # Máscaras e formatadores (999.999.999-99 e 99.999.999/9999-99)
│   ├── options/         # Tela de configurações avançadas e sandbox de validação
│   ├── popup/           # Interface do Popup da extensão
│   ├── storage/         # Abstração do chrome.storage.sync e local
│   ├── types/           # Interfaces TypeScript
│   └── utils/           # Algoritmos de checksum e geradores válidos de CPF/CNPJ
├── public/              # Manifest.json e ícones da extensão
├── test/                # Suite interativa de testes de formulários e SPAs
├── vite.config.ts       # Configuração de build do Vite para Manifest V3
└── package.json
```

---

## 📊 Regras de Pontuação do Detector

A extensão utiliza um sistema de pesos cumulativos para determinar se um elemento `<input>` representa um CPF ou CNPJ:

| Critério | Peso | Detalhes |
|---|---|---|
| `autocomplete` | **+10** | Atributos explicitando `cpf`, `cnpj` ou `tax-id` |
| `label` associado | **+5** | `<label>` explicitando CPF, CNPJ ou Documento |
| `placeholder` | **+5** | Padrões de máscara como `000.000.000-00` ou textos sugestivos |
| `name` / `id` | **+5** | Atributos contendo `cpf`, `cnpj`, `cnpj_empresa`, `doc` |
| `aria-label` / `data-mask` | **+4** | Atributos acessíveis ou `data-mask="cpf"` |
| `maxlength` | **+2** | Tamanhos típicos (11, 14, 18 caracteres) |

*Threshold Padrão:* **7 pontos** (ajustável no painel de opções).

---

## 🔧 Como Instalar no Google Chrome

1. **Faça o build do projeto:**
   ```bash
   npm run build
   ```
2. Abra o Google Chrome e navegue até `chrome://extensions/`.
3. Ative o **Modo do desenvolvedor** (canto superior direito).
4. Clique no botão **Carregar sem compactação** (*Load unpacked*).
5. Selecione a pasta `dist/` gerada no projeto.

---

## 🧪 Testando a Extensão

1. Abra a extensão no Chrome e clique no link **Página de Teste** (ou abra `dist/test/test-page.html`).
2. A página de testes inclui:
   * Formulários tradicionais com campos de CPF e CNPJ separados.
   * Campos combinados (CPF/CNPJ).
   * Campos desabilitados, readonly e preenchidos.
   * Botão para **Injetar Componentes Dinâmicos (SPA / React)**.
   * Console em tempo real registrando o disparo dos eventos sintéticos.
# geracpf
