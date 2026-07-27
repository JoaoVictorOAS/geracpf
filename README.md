# Extensão Chrome para Autopreenchimento de CPF/CNPJ

Extensão para **Google Chrome (Manifest V3)** em **TypeScript** e **Vite** que identifica e preenche
campos de CPF e CNPJ em páginas web e SPAs (React, Vue, Angular, Svelte).

## Funcionalidades

* **Detecção por score:** analisa `name`, `id`, `placeholder`, `label` associado, `autocomplete`,
  `aria-label`, `maxlength` e `data-mask` para decidir se um campo é CPF ou CNPJ.
* **Campos combinados (CPF/CNPJ):** escolhe o documento com base no `maxlength` do campo.
* **Compatibilidade com frameworks reativos:** usa o setter nativo de `HTMLInputElement` e dispara
  os eventos `focus`, `input`, `change` e `blur`.
* **MutationObserver:** detecta campos criados dinamicamente (modais, wizards, etapas) com debounce.
* **Respeito a campos preenchidos:** não sobrescreve valores existentes por padrão.
* **Gerador de documentos válidos:** gera CPFs e CNPJs válidos para ambientes de teste.
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
