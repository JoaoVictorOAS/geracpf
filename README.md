# Extensão Chrome para Autopreenchimento de CPF/CNPJ

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

Extensão para **Google Chrome (Manifest V3)** em **TypeScript** e **Vite** que identifica e preenche
campos de CPF e CNPJ em páginas web e SPAs (React, Vue, Angular, Svelte).

## Sumário

* [Funcionalidades](#funcionalidades)
* [Estrutura do projeto](#estrutura-do-projeto)
* [Regras de pontuação do detector](#regras-de-pontuação-do-detector)
* [Instalação no Google Chrome](#instalação-no-google-chrome)
* [Contribuindo](#contribuindo)
* [Licença](#licença)

## Funcionalidades

* **Detecção por score:** analisa `name`, `id`, `placeholder`, `label` associado, `autocomplete`,
  `aria-label`, `maxlength` e `data-mask` para decidir se um campo é CPF ou CNPJ.
* **Campos combinados (CPF/CNPJ):** escolhe o documento com base no `maxlength` do campo.
* **Compatibilidade com frameworks reativos:** usa o setter nativo de `HTMLInputElement` e dispara
  os eventos `focus`, `input`, `change` e `blur`.
* **MutationObserver:** detecta campos criados dinamicamente (modais, wizards, etapas) com debounce.
* **Respeito a campos preenchidos:** não sobrescreve valores existentes por padrão.
* **Gerador de documentos válidos:** gera CPFs e CNPJs válidos para ambientes de teste.
* **CNPJ alfanumérico:** opção para gerar CNPJs no novo formato da Receita Federal (letras e números,
  válido a partir de julho de 2026), com o mesmo cálculo de dígitos verificadores (mód. 11).
* **Menu de contexto:** gerar e preencher, ou gerar e copiar, direto pelo botão direito.

## Estrutura do projeto

```
├── src/
│   ├── background/      # Service Worker (Manifest V3)
│   ├── content/         # Content script, autopreenchimento e MutationObserver
│   ├── detector/        # Algoritmo de pontuação (scoring) e utilitários de DOM
│   ├── formatter/       # Máscaras (999.999.999-99 e 99.999.999/9999-99)
│   ├── options/         # Tela de configurações avançadas
│   ├── popup/           # Popup da extensão
│   ├── storage/         # Abstração do chrome.storage.sync e local
│   ├── types/           # Interfaces TypeScript
│   └── utils/           # Checksum e geradores de CPF/CNPJ
├── public/              # manifest.json e ícones
├── vite.config.ts       # Build para Manifest V3
└── package.json
```

## Regras de pontuação do detector

| Critério | Peso | Detalhes |
|---|---|---|
| `autocomplete` | +10 | Atributos com `cpf`, `cnpj` ou `tax-id` |
| `label` associado | +5 | `<label>` com CPF, CNPJ ou Documento |
| `placeholder` | +5 | Máscaras como `000.000.000-00` ou textos sugestivos |
| `name` / `id` | +5 | Atributos contendo `cpf`, `cnpj`, `cnpj_empresa`, `doc` |
| `aria-label` / `data-mask` | +4 | Atributos acessíveis ou `data-mask="cpf"` |
| `maxlength` | +2 | Tamanhos típicos (11, 14, 18 caracteres) |

Threshold padrão: **7 pontos** (ajustável na tela de opções).

## Instalação no Google Chrome

1. Faça o build do projeto:
   ```bash
   npm run build
   ```
2. Acesse `chrome://extensions/`.
3. Ative o **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação**.
5. Selecione a pasta `dist/` gerada.

## Contribuindo

Contribuições são bem-vindas! Veja o guia em [CONTRIBUTING.md](CONTRIBUTING.md) para instruções de
setup, padrão de commits e como reportar bugs ou sugerir melhorias.

## Licença

Distribuído sob a licença [MIT](LICENSE).
