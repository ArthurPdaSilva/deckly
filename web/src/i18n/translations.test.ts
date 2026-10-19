import { describe, expect, it } from "vitest";
import { translate, translateError, translations } from "./translations";

describe("translations", () => {
  it("tem exatamente as mesmas chaves em português e inglês", () => {
    expect(Object.keys(translations.en).sort()).toEqual(
      Object.keys(translations["pt-BR"]).sort(),
    );
  });

  it("interpola valores e mantém o marcador quando falta o valor", () => {
    expect(translate("pt-BR", "pendingCards", { count: 3 })).toBe(
      "3 cartões pendentes",
    );
    expect(translate("en", "cardProgress", { current: 1 })).toBe(
      "Card 1 of {total}",
    );
  });

  it("devolve a própria chave quando ela não existe", () => {
    expect(translate("en", "chaveInexistente")).toBe("chaveInexistente");
  });

  it("traduz as mensagens de erro de domínio", () => {
    expect(translateError("en", "O nome do baralho não pode ficar vazio")).toBe(
      "The deck name cannot be empty",
    );
    expect(translateError("en", "Erro desconhecido")).toBe("Erro desconhecido");
  });
});
