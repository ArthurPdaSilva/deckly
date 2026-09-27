# Deckly — Diretrizes do Projeto

## Visão geral

Deckly é um aplicativo React Native para flashcards e repetição espaçada. A primeira versão é offline-first, com dados armazenados localmente e sem dependência de autenticação, backend ou conexão de rede.

## Regras fundamentais

- Interface inicial em português brasileiro; preparar a arquitetura para inglês sem implementar troca de idioma na primeira versão.
- Modo claro e modo escuro devem existir desde a primeira versão.
- Usar `StyleSheet` do React Native e tokens próprios; não adicionar Tailwind, NativeWind ou Material UI sem uma decisão explícita.
- Não acoplar a interface, o banco ou os casos de uso a um algoritmo específico de repetição espaçada.
- Toda funcionalidade nova deve incluir testes automatizados.
- Não adicionar dependência remota para o fluxo principal de estudo.
- Não apagar ou substituir dados locais sem migration explícita e testes de compatibilidade.
- A ordem manual dos baralhos deve ser persistida; drag and drop exige migration e testes antes de ser disponibilizado.

## Arquitetura

Organizar o código por domínio dentro de `src/features/`. Componentes genéricos ficam em `src/components/`; tokens e temas ficam em `src/styles/`; persistência fica em `src/database/` usando `expo-sqlite` na primeira versão.

As telas e stores não devem executar SQL diretamente. O acesso ao armazenamento deve passar por repositories ou serviços próprios. Regras de negócio devem permanecer testáveis sem renderizar componentes.

Migrations devem ser incrementais, transacionais e controladas por `PRAGMA user_version`. Não apagar ou substituir dados existentes sem uma migration explícita e testes de compatibilidade. A camada de domínio deve depender de contratos, não da implementação do SQLite, para permitir adaptadores relacionais ou documentais no futuro.

## Agendamento de revisões

O agendador deve expor um contrato independente da implementação. Uma implementação inicial baseada em SM-2 é aceitável, mas deve ser possível adicionar FSRS ou outro algoritmo sem reescrever a sessão de revisão.

O histórico deve ser preservado separadamente do estado atual do cartão. Uma revisão deve registrar, quando aplicável:

- cartão revisado;
- data e hora;
- avaliação do usuário;
- intervalo anterior;
- próximo intervalo;
- algoritmo ou versão usada.

Mudanças futuras no algoritmo não devem destruir o histórico existente.

## Estilos e temas

Componentes devem consumir tokens semânticos, nunca espalhar valores de cor, espaçamento ou tipografia sem justificativa. O tema deve ser selecionável por contexto ou provider e deve permitir persistir a preferência do usuário.

Exemplos de nomes permitidos:

- `colors.background`;
- `colors.surface`;
- `colors.text`;
- `spacing.md`;
- `typography.body`;

Evitar componentes visuais excessivamente genéricos. Criar componentes reutilizáveis quando houver comportamento ou linguagem visual compartilhados.

## Convenções de código

- TypeScript com `strict` habilitado.
- Preferir named exports.
- PascalCase para componentes, telas e tipos.
- camelCase para funções, variáveis e utilitários.
- SCREAMING_SNAKE_CASE somente para constantes realmente globais e imutáveis.
- Nomes de código em inglês; textos visíveis ao usuário em português brasileiro.
- Interfaces de props devem seguir o padrão `ComponentNameProps`.
- Evitar abstrações prematuras e dependências sem necessidade concreta.

## Testes

Os testes devem espelhar a estrutura da source em `src/__tests__/`. Priorizar testes para:

- regras do algoritmo de agendamento;
- repositories e migrations;
- stores e casos de uso;
- componentes interativos;
- sessão de revisão;
- persistência e restauração do estado offline.

Usar testes determinísticos para datas e horários. Não depender de rede, relógio real ou estado compartilhado entre testes.

Não considerar uma funcionalidade concluída sem teste automatizado correspondente. Os testes podem ser escritos durante ou logo após a implementação, sem exigir um ciclo TDD estrito.

## Workflow obrigatório

Após qualquer alteração de código:

```bash
npm run typecheck
npm run lint
npm test -- --runInBand --coverage
```

O CI executará as mesmas verificações em pull requests e pushes para `main`. Alterações que quebram tipos, lint, formatação ou testes não devem ser integradas.

Toda mudança de comportamento deve atualizar o `README.md` quando afetar escopo, arquitetura, comandos ou roadmap.

## Segurança e dados

- Considerar cartões e histórico como dados privados do usuário.
- Não enviar conteúdo para serviços externos na primeira versão.
- Não registrar conteúdo de cartões em logs de produção.
- Validar migrations com dados representativos antes de alterar o schema local.
