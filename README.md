# Deckly

Flashcards com repetição espaçada (SM-2 e FSRS), inspirados na metodologia do Anki. O Deckly é **offline/local-first**: seus cartões e seu histórico ficam no seu dispositivo, sem conta nem servidor.

## Deckly in English

Spaced-repetition flashcards inspired by Anki. Deckly is **local-first**: your cards and review history stay on your device, with no account or server.

## Estrutura do repositório

| Pasta | O que é | Documentação |
| --- | --- | --- |
| [`mobile/`](mobile) | App React Native (Expo, SQLite) para Android e iOS | [README](mobile/README.md) · [AGENTS](mobile/AGENTS.md) |
| [`web/`](web) | App web (Vite, React, Tailwind, IndexedDB) com as mesmas funções do mobile | [README](web/README.md) · [AGENTS](web/AGENTS.md) |
| `deckly-*.json` | Baralhos prontos para importar nos dois apps | formato em [`mobile/README.md`](mobile/README.md) |

Os dois apps são independentes (cada um tem seu `package.json` e seus testes), mas **compartilham o formato do arquivo JSON de importação/exportação** (`format: "deckly"`, `version: 1`): um backup exportado num app pode ser importado no outro, inclusive com áudio.

## Começando

```bash
# mobile
cd mobile && npm install && npm start

# web
cd web && npm install && npm run dev
```

## Qualidade

O CI (`.github/workflows/ci.yml`) valida a documentação e roda, por app, typecheck, lint/formatação e testes (além do build e dos testes Playwright da web). Veja os comandos exatos no README de cada pasta.

## Licença

A licença do projeto ainda será definida.
