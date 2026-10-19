export interface SeedDatabase {
  execAsync(sql: string): Promise<void>;
}

export const SEED_GROUPS = [
  {
    id: "seed-group-languages",
    name: "Idiomas",
    createdAt: "2026-01-01T09:00:00.000Z",
    updatedAt: "2026-01-01T09:00:00.000Z",
    sortOrder: 0,
  },
  {
    id: "seed-group-engineering",
    name: "Engenharia de software",
    createdAt: "2026-01-01T09:05:00.000Z",
    updatedAt: "2026-01-01T09:05:00.000Z",
    sortOrder: 1,
  },
  {
    id: "seed-group-knowledge",
    name: "Conhecimentos gerais",
    createdAt: "2026-01-01T09:10:00.000Z",
    updatedAt: "2026-01-01T09:10:00.000Z",
    sortOrder: 2,
  },
] as const;

export const SEED_DECKS = [
  {
    id: "seed-english",
    name: "Inglês essencial",
    description: "Vocabulário para revisar todos os dias.",
    groupId: "seed-group-languages",
    sortOrder: 0,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
  },
  {
    id: "seed-learning",
    name: "Aprendizagem",
    description: "Conceitos sobre estudo e memória.",
    groupId: "seed-group-knowledge",
    sortOrder: 0,
    createdAt: "2026-01-02T10:00:00.000Z",
    updatedAt: "2026-01-02T10:00:00.000Z",
  },
  {
    id: "seed-programming",
    name: "Programação",
    description: "Fundamentos para revisar enquanto pratica.",
    groupId: "seed-group-engineering",
    sortOrder: 0,
    createdAt: "2026-01-03T10:00:00.000Z",
    updatedAt: "2026-01-03T10:00:00.000Z",
  },
  {
    id: "seed-spanish",
    name: "Espanhol para viagens",
    description: "Frases úteis para sair falando.",
    groupId: "seed-group-languages",
    sortOrder: 1,
    createdAt: "2026-01-04T10:00:00.000Z",
    updatedAt: "2026-01-04T10:00:00.000Z",
  },
  {
    id: "seed-science",
    name: "Ciência e curiosidades",
    description: "Perguntas rápidas para manter a curiosidade viva.",
    groupId: "seed-group-knowledge",
    sortOrder: 1,
    createdAt: "2026-01-05T10:00:00.000Z",
    updatedAt: "2026-01-05T10:00:00.000Z",
  },
  {
    id: "seed-interviews",
    name: "Entrevistas técnicas",
    description: "Revisão prática para conversas de tecnologia.",
    groupId: "seed-group-engineering",
    sortOrder: 1,
    createdAt: "2026-01-06T10:00:00.000Z",
    updatedAt: "2026-01-06T10:00:00.000Z",
  },
  {
    id: "seed-french",
    name: "Francês básico",
    description: "Vocabulário inicial para viagens.",
    groupId: "seed-group-languages",
    sortOrder: 2,
    createdAt: "2026-01-07T10:00:00.000Z",
    updatedAt: "2026-01-07T10:00:00.000Z",
  },
  {
    id: "seed-databases",
    name: "Bancos de dados",
    description: "SQL, modelagem e persistência.",
    groupId: "seed-group-engineering",
    sortOrder: 2,
    createdAt: "2026-01-08T10:00:00.000Z",
    updatedAt: "2026-01-08T10:00:00.000Z",
  },
  {
    id: "seed-product",
    name: "Produto e design",
    description: "Conceitos para construir produtos melhores.",
    groupId: null,
    sortOrder: 0,
    createdAt: "2026-01-09T10:00:00.000Z",
    updatedAt: "2026-01-09T10:00:00.000Z",
  },
] as const;

const seedCardDefinitions = [
  ["seed-english", "Hello", "Olá"],
  ["seed-english", "Good morning", "Bom dia"],
  ["seed-english", "Thank you", "Obrigado(a)"],
  ["seed-english", "How are you?", "Como você está?"],
  [
    "seed-learning",
    "O que é repetição espaçada?",
    "Revisões em intervalos crescentes.",
  ],
  [
    "seed-learning",
    "O que é recuperação ativa?",
    "Tentar lembrar antes de consultar a resposta.",
  ],
  [
    "seed-learning",
    "Para que servem flashcards?",
    "Para praticar lembrança ativa em pequenas sessões.",
  ],
  [
    "seed-learning",
    "O que significa aprender por associação?",
    "Conectar uma ideia nova a algo já conhecido.",
  ],
  [
    "seed-programming",
    "O que é uma função pura?",
    "Uma função sem efeitos colaterais que retorna o mesmo resultado para a mesma entrada.",
  ],
  [
    "seed-programming",
    "O que é uma migration?",
    "Uma alteração versionada e controlada no schema do banco.",
  ],
  [
    "seed-programming",
    "O que significa TDD?",
    "Desenvolvimento orientado a testes.",
  ],
  [
    "seed-programming",
    "O que é uma API?",
    "Uma interface para comunicação entre sistemas.",
  ],
  ["seed-spanish", "Hola", "Olá"],
  ["seed-spanish", "¿Cuánto cuesta?", "Quanto custa?"],
  ["seed-spanish", "¿Dónde está el baño?", "Onde fica o banheiro?"],
  ["seed-spanish", "La cuenta, por favor", "A conta, por favor."],
  ["seed-science", "Qual é o planeta vermelho?", "Marte."],
  [
    "seed-science",
    "O que as plantas fazem na fotossíntese?",
    "Transformam luz em energia química.",
  ],
  ["seed-science", "Qual é a unidade básica da vida?", "A célula."],
  ["seed-science", "O que mede um termômetro?", "Temperatura."],
  [
    "seed-interviews",
    "O que é complexidade O(n)?",
    "Crescimento linear em relação ao tamanho da entrada.",
  ],
  [
    "seed-interviews",
    "O que é uma transação?",
    "Uma operação atômica que confirma tudo ou desfaz tudo.",
  ],
  [
    "seed-interviews",
    "Como explicar um bug?",
    "Descrever contexto, reprodução, comportamento esperado e impacto.",
  ],
  [
    "seed-interviews",
    "O que é desacoplamento?",
    "Reduzir dependências diretas entre partes do sistema.",
  ],
  ["seed-french", "Bonjour", "Olá"],
  ["seed-french", "Merci", "Obrigado(a)"],
  ["seed-french", "Où est la gare?", "Onde fica a estação?"],
  [
    "seed-databases",
    "O que é uma chave primária?",
    "Um identificador único de uma linha.",
  ],
  [
    "seed-databases",
    "O que é um índice?",
    "Uma estrutura que acelera consultas.",
  ],
  [
    "seed-databases",
    "O que é normalização?",
    "Organizar dados para reduzir redundância.",
  ],
  [
    "seed-product",
    "O que é uma hipótese de produto?",
    "Uma suposição testável sobre usuário e valor.",
  ],
  [
    "seed-product",
    "O que é acessibilidade?",
    "Projetar para pessoas com diferentes capacidades.",
  ],
  [
    "seed-product",
    "O que é um MVP?",
    "A menor versão que testa uma hipótese relevante.",
  ],
] as const;

export const SEED_CARDS = seedCardDefinitions.map(
  ([deckId, front, back], index) => {
    const timestamp = `2026-08-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`;
    const intervalDays = index % 3 === 0 ? 0 : index % 3 === 1 ? 3 : 12;

    return {
      id: `seed-card-${index + 1}`,
      deckId,
      front,
      back,
      dueAt:
        index % 4 === 0
          ? "2026-09-24T10:00:00.000Z"
          : index % 4 === 1
            ? "2026-09-25T10:00:00.000Z"
            : "2026-09-28T10:00:00.000Z",
      intervalDays,
      easeFactor: index % 4 === 0 ? 2.3 : index % 4 === 1 ? 2.5 : 2.8,
      repetitions: intervalDays === 0 ? 0 : index % 5,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  },
);

function quote(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function insertGroup(group: (typeof SEED_GROUPS)[number]): string {
  return `INSERT INTO deck_groups (
    id, name, created_at, updated_at, sort_order
  ) VALUES (
    ${quote(group.id)}, ${quote(group.name)}, ${quote(group.createdAt)},
    ${quote(group.updatedAt)}, ${group.sortOrder}
  )`;
}

function insertDeck(deck: (typeof SEED_DECKS)[number]): string {
  return `INSERT INTO decks (
    id, name, description, group_id, sort_order, created_at, updated_at
  ) VALUES (
    ${quote(deck.id)}, ${quote(deck.name)}, ${quote(deck.description)},
    ${deck.groupId ? quote(deck.groupId) : "NULL"}, ${deck.sortOrder},
    ${quote(deck.createdAt)}, ${quote(deck.updatedAt)}
  )`;
}

function insertCard(card: (typeof SEED_CARDS)[number]): string {
  return `INSERT INTO cards (
    id, deck_id, front, back, due_at, interval_days,
    ease_factor, repetitions, created_at, updated_at
  ) VALUES (
    ${quote(card.id)}, ${quote(card.deckId)}, ${quote(card.front)},
    ${quote(card.back)}, ${quote(card.dueAt)}, ${card.intervalDays},
    ${card.easeFactor}, ${card.repetitions}, ${quote(card.createdAt)},
    ${quote(card.updatedAt)}
  )`;
}

export async function resetAndSeedDatabase(
  database: SeedDatabase,
): Promise<void> {
  await database.execAsync("BEGIN");

  try {
    await database.execAsync("DELETE FROM review_history");
    await database.execAsync("DELETE FROM cards");
    await database.execAsync("DELETE FROM decks");
    await database.execAsync("DELETE FROM deck_groups");

    for (const group of SEED_GROUPS) {
      await database.execAsync(insertGroup(group));
    }
    for (const deck of SEED_DECKS) {
      await database.execAsync(insertDeck(deck));
    }
    for (const card of SEED_CARDS) {
      await database.execAsync(insertCard(card));
    }

    await database.execAsync("COMMIT");
  } catch (error) {
    await database.execAsync("ROLLBACK");
    throw error;
  }
}
