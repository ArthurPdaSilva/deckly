# Deckly — Diretrizes do Repositório

Este repositório tem dois aplicativos independentes que compartilham o mesmo domínio e o mesmo formato de dados:

- `mobile/` — app React Native/Expo. Regras em [`mobile/AGENTS.md`](mobile/AGENTS.md).
- `web/` — app web (Vite + React + Tailwind + Dexie). Regras em [`web/AGENTS.md`](web/AGENTS.md).

Ao trabalhar numa pasta, leia e siga o `AGENTS.md` dela. Rode os comandos de verificação **dentro da pasta do app alterado**.

## Regras que valem para os dois apps

- **Paridade:** a web deve ter tudo o que o mobile tem. Ao criar ou mudar uma funcionalidade num app, avalie e aplique no outro (ou registre a diferença no README).
- **Formato de dados compartilhado:** o JSON `format: "deckly"`, `version: 1` (exportação/importação, merge por ID, áudio em `frontAudioData`/`frontAudioFile`) é um contrato. Mudanças nele exigem atualizar os dois apps, os testes e a documentação.
- **Agendamento:** SM-2 e FSRS (v6) com os mesmos parâmetros nos dois apps — avaliações De novo=2, Difícil=3, Bom=4, Fácil=5; cartões com próxima revisão em até 20 min voltam à fila da sessão; retenção FSRS entre 70% e 97% (padrão 90%).
- **Privacidade e offline:** sem backend nem rede no fluxo de estudo; não registrar conteúdo de cartões em logs.
- **Idioma:** interface em português brasileiro, com inglês disponível; código, identificadores e commits em inglês.
- **Testes:** toda funcionalidade nova inclui testes automatizados, determinísticos (relógio e IDs injetados).
- **Dados do usuário:** nunca apagar ou reescrever dados locais sem migration versionada e testes de compatibilidade.

## Verificação obrigatória

```bash
# mobile/
npm run typecheck && npm run lint && npm test -- --runInBand --coverage

# web/
npm run typecheck && npm run biome:check && npm test && npm run build
```

O CI executa as mesmas verificações em pull requests e pushes para `main`. Atualize o `README.md` do app (e este, se a estrutura mudar) quando a mudança afetar escopo, arquitetura, comandos ou roadmap.

## Arquivos de importação (`deckly-*.json`)

Ficam na raiz e seguem o formato documentado em `mobile/README.md` ("Formato do JSON de importação"). Valide-os com `mobile/src/features/dataTransfer/format.ts` ou `web/src/features/dataTransfer/format.ts` (as regras são iguais).
