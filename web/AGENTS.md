# Deckly Web — Diretrizes do Projeto

## Visão geral

Deckly Web é a versão para navegador do Deckly: flashcards com repetição espaçada (SM-2 e FSRS). Ela é **local-first**: os dados ficam no IndexedDB do navegador, sem conta, backend ou dependência de rede no fluxo de estudo. Deve ter tudo o que o app mobile (`../mobile`) tem e ler/escrever o mesmo arquivo JSON de exportação.

## Regras fundamentais

- Interface em português brasileiro, com inglês disponível em Configurações. Todo texto visível passa por `src/i18n/translations.ts`, com as mesmas chaves nos dois idiomas (há teste que garante isso). Código, identificadores e commits em inglês.
- Modo claro e escuro desde o início, via tokens CSS; a preferência é persistida no `localStorage`.
- Tailwind CSS v4 com tokens semânticos definidos em `src/index.css` (`@theme`). Não espalhar cores hexadecimais pelos componentes; usar `bg-primary`, `text-fg-secondary`, `border-line` etc.
- Não acoplar interface, banco ou casos de uso a um algoritmo de repetição: tudo passa pelo contrato `Scheduler` (`src/features/review/domain.ts`).
- Nada de backend ou chamada de rede no fluxo principal. Cartões e histórico são dados privados; não enviar nem registrar seu conteúdo em logs.
- Toda funcionalidade nova inclui testes automatizados.
- Não apagar nem reescrever dados locais sem uma migration versionada do Dexie e testes de compatibilidade.
- O formato de importação/exportação (`format: "deckly"`, `version: 1`) é compartilhado com o mobile e **não pode quebrar**. Mudanças exigem atualizar os dois apps.

## Stack

Vite, React 19, TypeScript estrito, Tailwind CSS v4, React Router, Dexie (IndexedDB), React Hook Form + Zod, `@dnd-kit` (reordenação de grupos e baralhos), Sonner (toasts), `ts-fsrs`, Vitest + Testing Library + `fake-indexeddb`, Playwright e Biome. Gerenciador de pacotes: npm.

## Arquitetura

```text
src/
  app/            App (rotas), serviços (injeção), NotFoundPage
  components/     UI genérica: Layout, ConfirmDialog, ItemActionsMenu, SortableList, fields, ui
  config/         flags de ambiente
  db/             DecklyDatabase (Dexie, versões/migrations) e seed de desenvolvimento
  features/       módulos por domínio: home, decks (grupos e baralhos), cards, review,
                  statistics, dataTransfer, backup, settings
  i18n/           catálogos pt-BR/en e LanguageProvider
  lib/            utilitários sem regra de domínio (ids, base64, arquivos, download, useAsyncData)
  test/           setup e helpers dos testes
  theme/          ThemeProvider
e2e/              testes Playwright
```

- **Repositories** (`features/*/repository.ts`) encapsulam o Dexie. Telas e componentes **nunca** importam `db` nem chamam tabelas diretamente; recebem repositórios por `useServices()`.
- **Serviços/casos de uso** (`deckService.ts`, `cardService.ts`, `session.ts`) guardam as regras de negócio e são testáveis sem renderizar componentes.
- `createServices()` monta os repositórios sobre um banco; os testes criam um banco isolado com relógio e IDs previsíveis (`src/test/helpers.tsx`).
- Telas ficam em `features/<domínio>/*Page.tsx`; formulários usam React Hook Form + Zod com **chaves de tradução** como mensagens de erro.
- Toasts só pelo wrapper `components/notifications.ts`; nunca importar `sonner` direto numa tela.
- Confirmação de exclusão sempre por `ConfirmDialog`.

## Backup

- A página Backup (`features/backup`) é o único lugar de exportar/importar. Regras de negócio em `features/dataTransfer/backupService.ts` (nome do arquivo, lembrete de 7 dias, restaurar mesclando ou substituindo); o Dexie fica em `dataTransfer/repository.ts`.
- O arquivo segue o formato `deckly` v1, com `settings` opcional (só a web escreve; o mobile ignora). Não torne esse campo obrigatório.
- A data do último backup fica na tabela `settings` (chave `lastBackupAt`).

## Dados e migrations

- Tabelas: `groups`, `decks`, `cards`, `reviews` (histórico), `settings` (chave/valor) e `audios`.
- Mudou o schema? Crie `this.version(n + 1).stores(...)` com `.upgrade(...)` quando precisar transformar dados. Nunca edite uma versão já publicada.
- O áudio é guardado como `ArrayBuffer` (não `Blob`) por compatibilidade do IndexedDB entre navegadores.
- Excluir baralho/cartão remove em cascata cartões, áudios e histórico (dentro de uma transação). Excluir grupo mantém os baralhos, que ficam sem grupo.
- O histórico é separado do estado do cartão e é preservado ao trocar de algoritmo ou reiniciar o agendamento.

## Agendamento de revisões

- `Scheduler.schedule(state, rating, reviewedAt)` devolve o novo estado e o registro da revisão. SM-2 (`sm2Scheduler.ts`) e FSRS (`fsrsScheduler.ts`) são intercambiáveis via `createScheduler`.
- Avaliações dos botões: De novo = 2, Difícil = 3, Bom = 4, Fácil = 5.
- Cartões com próxima revisão em até 20 minutos (`REQUEUE_WINDOW_MS`) voltam ao fim da fila da mesma sessão, desde que haja outros cartões.
- Retenção desejada do FSRS: 70%–97%, padrão 90%.
- Datas são sempre ISO 8601 em UTC; "hoje" nas estatísticas usa o dia local.

## Convenções de código

- TypeScript `strict`; named exports; PascalCase para componentes e tipos; camelCase para funções e variáveis.
- Interfaces de props seguem `ComponentNameProps` quando houver mais de uma prop não trivial.
- Testes ao lado do código (`*.test.ts(x)`), determinísticos: relógio e IDs injetados, sem rede e sem estado compartilhado entre testes.
- Acessibilidade: elementos semânticos, rótulos em todos os campos, foco visível, diálogo com `role="dialog"`, e alternativa por teclado ao arrastar (alça de reordenação do dnd-kit).
- Evitar abstrações prematuras e dependências sem necessidade concreta.

## Workflow obrigatório

Depois de qualquer alteração de código, na pasta `web/`:

```bash
npm run biome:fix
npm run typecheck
npm run biome:check
npm test
npm run build
```

Antes de integrar mudanças de fluxo, rode também `npm run test:e2e`. O CI (`.github/workflows/ci.yml`) executa as mesmas verificações em pull requests e pushes para `main`.

Toda mudança de comportamento atualiza o `README.md` quando afetar escopo, arquitetura, comandos ou roadmap.

## Paridade com o mobile

A web deve manter paridade com o app mobile: grupos, baralhos e cartões (criar, editar, excluir, mover, reordenar), revisão com virar carta e áudio, SM-2/FSRS com retenção, progresso, tema, idioma, importar/exportar JSON (com áudio), apagar tudo e dados de teste em desenvolvimento. Ao adicionar algo num app, avalie se o outro precisa do mesmo.
