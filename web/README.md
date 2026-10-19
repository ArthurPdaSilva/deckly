# Deckly Web

Versão para navegador do **Deckly**, o app de flashcards com repetição espaçada. Funciona **local-first**: tudo fica no IndexedDB do seu navegador, sem conta, servidor ou internet para estudar. Tem as mesmas funções do app mobile (`../mobile`) e usa o mesmo arquivo JSON de importação/exportação, então dá para levar seus baralhos de um para o outro.

## Deckly Web in English

Browser version of Deckly, a spaced-repetition flashcard app. It is **local-first**: your data lives in the browser's IndexedDB, with no account or backend. It has the same features as the mobile app and reads/writes the same JSON export format.

## Funcionalidades

- Grupos, baralhos e cartões: criar, editar, excluir (com confirmação) e reordenar grupos e baralhos arrastando (ou pelo teclado).
- Mover cartões entre baralhos preservando agendamento e histórico; mover baralhos entre grupos pelo formulário.
- Áudio na pergunta do cartão, tocado durante a revisão.
- Sessão de revisão com **virar carta**, barra de progresso, tempo estimado, prévia do próximo intervalo em cada botão e atalhos `1`–`4` para avaliar.
- Revisar tudo, um baralho ou um grupo.
- Agendamento **SM-2** ou **FSRS** (v6), com retenção desejada ajustável (70%–97%) e opção de reiniciar o agendamento sem perder o histórico.
- Progresso: cartões, vencidos, média das avaliações, revisões de hoje e distribuição das notas.
- Tema claro/escuro e idioma Português (Brasil)/English, ambos lembrados no navegador.
- **Backup e restauração** (página Backup): baixa um `.json` datado com grupos, baralhos, cartões, agendamento, histórico, áudios e o algoritmo escolhido; restaura mesclando por ID ou substituindo tudo (com confirmação); mostra a data do último backup, lembra na Home depois de 7 dias e pede ao navegador para proteger os dados contra limpeza automática. Serve para trocar de navegador ou computador e lê também os arquivos do app mobile.
- Layout responsivo: menu lateral fixo em telas grandes e barra no topo no celular.
- Apagar todos os dados e, em desenvolvimento, carregar dados de teste.

## Tecnologia

Vite, React 19, TypeScript, Tailwind CSS v4 (tokens CSS), React Router, Dexie/IndexedDB, React Hook Form + Zod, `@dnd-kit`, Sonner, `ts-fsrs`, Vitest + Testing Library, Playwright e Biome. Gerenciador de pacotes: npm. Requer Node 22 ou superior.

## Como rodar

```bash
cd web
cp .env.example .env     # opcional
npm install
npm run dev              # http://localhost:5173
```

| Comando | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | verifica os tipos e gera `dist/` |
| `npm run preview` | serve o build de produção |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run biome:check` | formatação e lint (Biome) |
| `npm run biome:fix` | corrige formatação e imports automaticamente |
| `npm test` | testes unitários e de tela (Vitest) |
| `npm run test:e2e` | testes de ponta a ponta (Playwright) |

Na primeira vez com Playwright: `npx playwright install chromium`.

### Dados de teste

Com `VITE_DEV_MODE=true` em `.env` e rodando `npm run dev`, **Configurações → Carregar dados de teste** apaga os dados locais e cria 3 grupos, 9 baralhos e 33 cartões com estados variados. O botão não aparece em builds de produção.

## Estrutura

```text
src/
  app/            rotas, injeção de serviços e página 404
  components/     Layout, ConfirmDialog, ItemActionsMenu, SortableList, campos de formulário
  db/             banco Dexie (versões/migrations) e seed
  features/       home, decks (grupos e baralhos), cards, review, statistics, dataTransfer, backup, settings
  i18n/           traduções pt-BR/en
  lib/            utilitários
  theme/          tema claro/escuro
e2e/              testes Playwright
```

Repositories encapsulam o Dexie e os serviços guardam as regras; as telas só falam com eles por `useServices()`. Veja `AGENTS.md` para as regras do projeto.

## Persistência local

O banco `deckly` (IndexedDB) tem as tabelas `groups`, `decks`, `cards`, `reviews`, `settings` e `audios`. Novas versões de schema entram como `this.version(n)` em `src/db/database.ts`. Os dados ficam só neste navegador e neste perfil: limpar os dados do site apaga tudo, então **exporte um backup** de vez em quando em Configurações.

## Formato do JSON de importação

Idêntico ao do mobile (`format: "deckly"`, `version: 1`); o esqueleto completo está em [`../mobile/README.md`](../mobile/README.md), seção "Formato do JSON de importação". A validação está em `src/features/dataTransfer/format.ts`.

- Exportar embute o áudio de cada cartão em base64 (`frontAudioData`) e grava o nome esperado em `frontAudioFile`.
- Importar mescla por ID (`INSERT OR IGNORE`): registros que já existem são mantidos como estão.
- O backup da web acrescenta o campo opcional `settings` (`algorithm` e `desiredRetention`); o mobile o ignora. "Substituir tudo" troca os dados em uma única transação.
- Cartões com `frontAudioFile` sem `frontAudioData` abrem, após a importação, um painel para escolher os arquivos de áudio, vinculados pelo nome (sem diferenciar maiúsculas).

## Deploy

O build é estático (`dist/`). `vercel.json` já reescreve todas as rotas para `index.html`; em outras hospedagens configure o mesmo fallback de SPA.

## Qualidade e CI

O workflow `.github/workflows/ci.yml` (na raiz do repositório) roda, para a web: `npm ci`, `typecheck`, `biome:check`, `test`, `build` e os testes Playwright.

## Roadmap

- [x] Paridade de funcionalidades com o app mobile.
- [ ] Instalável como PWA e uso totalmente offline do aplicativo (cache dos arquivos).
- [x] Backup manual com lembrete e restauração.
- [ ] Backup automático em uma pasta (File System Access API).
- [ ] Sincronização opcional entre web e mobile, sem comprometer o núcleo local.
