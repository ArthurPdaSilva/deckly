export interface SeedDatabase {
  execAsync(sql: string): Promise<void>;
}

export const SEED_DECKS = [
  {
    id: "seed-english",
    name: "Inglês essencial",
    description: "Vocabulário para revisar todos os dias.",
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
  },
  {
    id: "seed-learning",
    name: "Aprendizagem",
    description: "Conceitos sobre estudo e memória.",
    createdAt: "2026-01-02T10:00:00.000Z",
    updatedAt: "2026-01-02T10:00:00.000Z",
  },
  {
    id: "seed-programming",
    name: "Programação",
    description: "Fundamentos para revisar enquanto pratica.",
    createdAt: "2026-01-03T10:00:00.000Z",
    updatedAt: "2026-01-03T10:00:00.000Z",
  },
  {
    id: "seed-spanish",
    name: "Espanhol para viagens",
    description: "Frases úteis para sair falando.",
    createdAt: "2026-01-04T10:00:00.000Z",
    updatedAt: "2026-01-04T10:00:00.000Z",
  },
  {
    id: "seed-science",
    name: "Ciência e curiosidades",
    description: "Perguntas rápidas para manter a curiosidade viva.",
    createdAt: "2026-01-05T10:00:00.000Z",
    updatedAt: "2026-01-05T10:00:00.000Z",
  },
  {
    id: "seed-interviews",
    name: "Entrevistas técnicas",
    description: "Revisão prática para conversas de tecnologia.",
    createdAt: "2026-01-06T10:00:00.000Z",
    updatedAt: "2026-01-06T10:00:00.000Z",
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

function insertDeck(deck: (typeof SEED_DECKS)[number]): string {
  return `INSERT INTO decks (
    id, name, description, created_at, updated_at
  ) VALUES (
    ${quote(deck.id)}, ${quote(deck.name)}, ${quote(deck.description)},
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
