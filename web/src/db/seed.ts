import type { Flashcard } from "../features/cards/domain";
import type { Deck, DeckGroup } from "../features/decks/domain";
import type { DecklyDatabase } from "./database";

export const SEED_GROUPS: DeckGroup[] = [
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
];

type DeckDefinition = [
  id: string,
  name: string,
  description: string,
  groupId: string | null,
  sortOrder: number,
];

const deckDefinitions: DeckDefinition[] = [
  [
    "seed-english",
    "Inglês essencial",
    "Vocabulário para revisar todos os dias.",
    "seed-group-languages",
    0,
  ],
  [
    "seed-learning",
    "Aprendizagem",
    "Conceitos sobre estudo e memória.",
    "seed-group-knowledge",
    0,
  ],
  [
    "seed-programming",
    "Programação",
    "Fundamentos para revisar enquanto pratica.",
    "seed-group-engineering",
    0,
  ],
  [
    "seed-spanish",
    "Espanhol para viagens",
    "Frases úteis para sair falando.",
    "seed-group-languages",
    1,
  ],
  [
    "seed-science",
    "Ciência e curiosidades",
    "Perguntas rápidas para manter a curiosidade viva.",
    "seed-group-knowledge",
    1,
  ],
  [
    "seed-interviews",
    "Entrevistas técnicas",
    "Revisão prática para conversas de tecnologia.",
    "seed-group-engineering",
    1,
  ],
  [
    "seed-french",
    "Francês básico",
    "Vocabulário inicial para viagens.",
    "seed-group-languages",
    2,
  ],
  [
    "seed-databases",
    "Bancos de dados",
    "SQL, modelagem e persistência.",
    "seed-group-engineering",
    2,
  ],
  [
    "seed-product",
    "Produto e design",
    "Conceitos para construir produtos melhores.",
    null,
    0,
  ],
];

export const SEED_DECKS: Deck[] = deckDefinitions.map(
  ([id, name, description, groupId, sortOrder], index) => {
    const timestamp = `2026-01-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`;
    return {
      id,
      name,
      description,
      groupId,
      sortOrder,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  },
);

const cardDefinitions: [deckId: string, front: string, back: string][] = [
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
];

/** Os cartões da seed vencem sempre a partir de `now`, para haver o que revisar. */
export function buildSeedCards(now: Date): Flashcard[] {
  return cardDefinitions.map(([deckId, front, back], index) => {
    const timestamp = `2026-08-${String((index % 28) + 1).padStart(2, "0")}T10:00:00.000Z`;
    const intervalDays = index % 3 === 0 ? 0 : index % 3 === 1 ? 3 : 12;
    const dueOffsetDays = index % 4 === 0 ? -2 : index % 4 === 1 ? -1 : 2;
    const dueAt = new Date(now.getTime() + dueOffsetDays * 86_400_000);

    return {
      id: `seed-card-${index + 1}`,
      deckId,
      front,
      back,
      frontAudioUri: null,
      dueAt: dueAt.toISOString(),
      intervalDays,
      intervalMinutes: intervalDays * 1440,
      easeFactor: index % 4 === 0 ? 2.3 : index % 4 === 1 ? 2.5 : 2.8,
      repetitions: intervalDays === 0 ? 0 : index % 5,
      schedulerAlgorithm: "sm-2",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });
}

export async function resetAndSeedDatabase(
  db: DecklyDatabase,
  now: Date = new Date(),
): Promise<void> {
  await db.transaction(
    "rw",
    [db.reviews, db.audios, db.cards, db.decks, db.groups],
    async () => {
      await Promise.all([
        db.reviews.clear(),
        db.audios.clear(),
        db.cards.clear(),
        db.decks.clear(),
        db.groups.clear(),
      ]);
      await db.groups.bulkAdd(SEED_GROUPS);
      await db.decks.bulkAdd(SEED_DECKS);
      await db.cards.bulkAdd(buildSeedCards(now));
    },
  );
}
