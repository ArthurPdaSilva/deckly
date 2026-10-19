import { expect, test } from "@playwright/test";

test("cria grupo, baralho e cartão e conclui uma revisão", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Início" })).toBeVisible();

  await page.getByRole("link", { name: "Meus baralhos" }).first().click();
  await page.getByRole("link", { name: "Novo grupo" }).click();
  await page.getByLabel("Nome do grupo").fill("Informática");
  await page.getByRole("button", { name: "Criar grupo" }).click();

  await page.getByRole("link", { name: "Informática" }).click();
  await page.getByRole("link", { name: "Novo baralho" }).click();
  await page.getByLabel("Nome do baralho").fill("Redes");
  await page.getByRole("button", { name: "Criar baralho" }).click();

  await page.getByRole("link", { name: /Redes/ }).click();
  await page.getByRole("link", { name: "Novo cartão" }).click();
  await page.getByLabel("Frente do cartão").fill("O que é uma LAN?");
  await page.getByLabel("Verso do cartão").fill("Rede local.");
  await page.getByRole("button", { name: "Criar cartão" }).click();
  await expect(page.getByText("O que é uma LAN?")).toBeVisible();

  await page.getByRole("link", { name: "Revisar este baralho" }).click();
  await expect(page.getByText("Cartão 1 de 1")).toBeVisible();
  await page.getByRole("button", { name: "↻ Virar carta" }).click();
  await expect(page.getByText("Rede local.")).toBeVisible();
  await page.getByRole("button", { name: /^Bom/ }).click();

  await expect(page.getByText("Sessão concluída").first()).toBeVisible();
});

test("os dados continuam depois de recarregar a página", async ({ page }) => {
  await page.goto("/groups/new");
  await page.getByLabel("Nome do grupo").fill("Persistente");
  await page.getByRole("button", { name: "Criar grupo" }).click();
  await expect(page.getByRole("link", { name: "Persistente" })).toBeVisible();

  await page.reload();

  await expect(page.getByRole("link", { name: "Persistente" })).toBeVisible();
});

test("troca de tema e de idioma e lembra a escolha", async ({ page }) => {
  await page.goto("/settings");

  await page.getByRole("button", { name: "Usar tema escuro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  await page.reload();

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
});

test("a rota desconhecida mostra a página 404", async ({ page }) => {
  await page.goto("/nao-existe");

  await expect(page.getByText("404")).toBeVisible();
});

test("baixa um backup, apaga tudo e restaura o progresso", async ({ page }) => {
  await page.goto("/groups/new");
  await page.getByLabel("Nome do grupo").fill("Para o backup");
  await page.getByRole("button", { name: "Criar grupo" }).click();
  await expect(page.getByRole("link", { name: "Para o backup" })).toBeVisible();

  await page.goto("/backup");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar backup" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /^deckly-backup-\d{4}-\d{2}-\d{2}-\d{4}\.json$/,
  );
  const backupPath = await download.path();

  await page.goto("/settings");
  await page.getByRole("button", { name: "Apagar tudo" }).click();
  await page.getByRole("button", { name: "Sim, apagar tudo" }).click();
  await page.goto("/groups");
  await expect(page.getByRole("link", { name: "Para o backup" })).toHaveCount(
    0,
  );

  await page.goto("/backup");
  await page.getByTestId("import-input").setInputFiles(backupPath);
  await page.getByRole("button", { name: "Restaurar agora" }).click();

  await page.goto("/groups");
  await expect(page.getByRole("link", { name: "Para o backup" })).toBeVisible();
});
