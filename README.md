# Deckly

Aplicativo mobile de flashcards com repetição espaçada, inspirado na metodologia do Anki. O Deckly será construído inicialmente como um app **offline-first**, permitindo estudar sem conta, servidor ou conexão com a internet.

## Deckly in English

Deckly is a mobile flashcard application based on spaced repetition and inspired by Anki. The first version will be **offline-first**, so users can study without an account, a server connection, or an internet connection.

## Objetivo

O Deckly deve transformar revisões curtas e consistentes em um hábito de aprendizagem. A primeira versão prioriza uma experiência simples:

- criar e organizar baralhos;
- criar, editar e excluir flashcards;
- revisar cartões em sessões diárias;
- avaliar a dificuldade de cada resposta;
- agendar a próxima revisão localmente;
- acompanhar progresso e desempenho;
- preservar os dados no dispositivo.

O projeto não pretende reproduzir visualmente o Anki. A interface terá identidade própria, com foco em leitura, concentração e baixo atrito durante a revisão.

## Princípios

- **Offline por padrão:** os dados principais não dependem de rede, autenticação ou backend.
- **Privacidade local:** cartões, revisões e progresso permanecem no dispositivo na primeira versão.
- **Algoritmo substituível:** o domínio não ficará acoplado a um algoritmo específico de repetição espaçada.
- **Interface acessível:** tipografia legível, estados claros, bom contraste e suporte a modo claro e escuro.
- **Evolução incremental:** cada funcionalidade deve ser pequena, testada e compatível com futuras sincronização e internacionalização.

## Repetição espaçada

O agendador será definido por um contrato independente da interface e do armazenamento. A primeira implementação poderá usar uma versão baseada no SM-2, algoritmo clássico de repetição espaçada, mas o restante do sistema não deve depender dele.

Uma futura implementação de FSRS ou outro algoritmo deverá poder substituir o agendador sem reescrever telas, banco de dados ou fluxo de revisão.

O domínio deverá separar, no mínimo:

- estado atual do cartão;
- histórico de revisões;
- avaliação dada pelo usuário;
- cálculo do próximo intervalo;
- persistência do agendamento.

## Tecnologia e decisões iniciais

- React Native com Expo.
- Expo SDK 57.
- TypeScript.
- Biome para formatação e lint.
- `expo-sqlite` para persistência local e migrations versionadas.
- `StyleSheet` nativo do React Native.
- Design system próprio baseado em tokens semânticos.
- Toasts globais com configuração visual própria para feedback de ações.
- Movimento funcional com entradas suaves de tela e feedback de pressão nos controles.
- Testes automatizados desde a primeira funcionalidade.
- Desenvolvimento orientado a testes (TDD): teste primeiro, implementação depois e refatoração por último.
- GitHub Actions para CI/CD desde o início do desenvolvimento.

Não será utilizado Material UI, pois ele é direcionado principalmente ao React para web. NativeWind/Tailwind também não será adotado inicialmente: o Deckly usará componentes próprios e tokens para preservar controle visual e reduzir dependências.

## Tema visual

O modo claro e o modo escuro existirão desde a primeira versão. Componentes não devem definir cores diretamente; devem consumir tokens do tema atual.

A identidade visual evita o padrão azul e branco de aplicativos utilitários. O claro usa papel quente, ameixa e violeta elétrico com acentos de damasco; o escuro usa uma base noturna de ameixa, superfícies elevadas e os mesmos acentos com maior luminosidade. O ícone do app representa cartas sobrepostas e um marcador de memória.

Exemplos de tokens semânticos:

- `background`;
- `surface`;
- `surfaceElevated`;
- `text`;
- `textSecondary`;
- `textMuted`;
- `primary`;
- `primaryMuted`;
- `accent`;
- `onPrimary`;
- `border`;
- `danger`;
- `success`.

O tema pode ser alternado entre claro e escuro pelas telas inicial e de progresso. A preferência ainda não é persistida localmente; enquanto o app estiver aberto, o provider mantém a escolha do usuário. A estrutura também permite seguir a preferência do sistema por padrão.

## Internacionalização

O idioma inicial da interface será português brasileiro. A arquitetura deve evitar textos espalhados em regras de negócio e componentes, deixando a internacionalização preparada para português brasileiro e inglês em uma etapa posterior.

A troca de idioma pelo usuário não faz parte da primeira versão.

## Estrutura planejada

```text
src/
  components/       componentes reutilizáveis da interface
  database/         persistência local e migrations
  features/         módulos por domínio
    decks/           baralhos
    cards/           flashcards
    review/          sessão de revisão e agendamento
    statistics/      progresso e desempenho
  routes/            navegação
  services/          contratos e implementações externas
  styles/            tokens, temas e estilos compartilhados
  types/             tipos compartilhados
  utils/             utilitários sem regra de domínio
  __tests__/         testes espelhando a source
App.tsx              entrada do aplicativo Expo
```

As telas não devem executar SQL diretamente. Repositories ou serviços de persistência serão responsáveis pelo acesso ao banco local. O algoritmo de revisão ficará em um módulo de domínio independente da camada de UI.

## Persistência local

O banco local inicial é o `deckly.db`, aberto pelo `expo-sqlite`. O acesso passa por `src/database/client.ts`, enquanto as migrations ficam em `src/database/migrations.ts` e são executadas dentro de uma transação usando `PRAGMA user_version`.

O schema inicial contém baralhos, cartões, histórico de revisões e estado do aplicativo. O histórico é mantido separado do estado atual dos cartões para permitir a evolução do agendador sem perder dados anteriores.

### Dados de teste

Em desenvolvimento, a tela de baralhos exibe **Carregar dados de teste**. Após a confirmação, o Deckly apaga decks, cartões e histórico em uma transação e insere 6 decks temáticos com 24 cartões, incluindo cartões novos, vencidos e com diferentes estados de repetição. Essa ação não é exibida em builds de produção e não é executada automaticamente na abertura do app.

Os botões **Exportar dados** e **Importar dados** permitem transportar decks, cartões e histórico em um arquivo JSON local. A importação valida referências e faz merge por ID, sem apagar registros existentes.

Casos de uso e repositories não devem depender diretamente da classe do SQLite. Essa fronteira permite criar posteriormente outro adaptador de persistência, inclusive para um banco relacional remoto ou MongoDB, sem alterar a interface da sessão de estudo.

## Roadmap inicial

### Fundação

- [x] Criar o projeto React Native com Expo e TypeScript.
- [x] Configurar navegação, lint, formatação e testes.
- [x] Criar tokens de espaçamento, tipografia, cores e temas claro/escuro.
- [x] Persistir e restaurar a preferência de tema localmente.
- [x] Configurar persistência local e migrations.
- [x] Configurar CI no GitHub Actions.

### Primeiro fluxo funcional

- [x] Criar e listar baralhos.
- [x] Editar e excluir baralhos.
- [x] Feedback visual por toast em ações de sucesso e erro.
- [x] Seed manual de desenvolvimento para decks e cartões.
- [ ] Reordenar baralhos por drag and drop, persistindo a ordem localmente.
- [x] Criar e listar flashcards dentro de um baralho.
- [x] Editar e excluir flashcards.
- [x] Implementar sessão de revisão.
- [x] Implementar avaliação da resposta.
- [x] Exibir progresso da sessão e resumo ao concluir.
- [x] Implementar o primeiro agendador baseado em SM-2.
- [x] Salvar histórico e próxima revisão offline.

### Evolução

- [x] Dashboard de progresso offline com métricas de revisão.
- [x] Importação e exportação de dados em JSON.
- [ ] Backup local.
- [ ] Internacionalização da interface.
- [ ] Avaliação de FSRS como alternativa de agendamento.
- [ ] Sincronização opcional, sem comprometer o núcleo offline.

## Qualidade e CI/CD

Toda nova funcionalidade deve ser desenvolvida usando TDD, seguindo este ciclo:

1. Escrever um teste que descreva o comportamento esperado.
2. Executar o teste e confirmar que ele falha pelo motivo correto.
3. Implementar a menor mudança necessária para fazê-lo passar.
4. Refatorar mantendo todos os testes passando.

O teste deve ser criado antes do código de produção para cada item novo, incluindo regras de negócio, repositories, stores, componentes e fluxos de tela.

O pipeline deve validar, no mínimo:

```text
npm ci
npm run typecheck
npm run lint
npm test -- --runInBand --coverage
```

O GitHub Actions deverá executar essas verificações em pull requests e em pushes para `main`. Falhas de tipos, formatação, lint ou testes devem bloquear a integração.

O workflow inicial está em `.github/workflows/ci.yml` e valida a documentação e a qualidade do aplicativo. A etapa de distribuição será adicionada quando houver uma plataforma de build definida, como EAS para Android e iOS.

## Desenvolvimento

Com a fundação Expo configurada, o fluxo de desenvolvimento é:

```bash
npm install
npm start
npm run typecheck
npm run lint
npm test -- --runInBand
```

## Licença

A licença do projeto ainda será definida.
