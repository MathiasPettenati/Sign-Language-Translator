import { expect, test } from "@playwright/test";

test("loads translator and vocabulary routes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Sign language, heard clearly.")).toBeVisible();

  await page.getByRole("button", { name: "Enter Handspeak translator" }).click();

  await expect(page.getByText("Live Sign Translator")).toBeVisible();
  await expect(page.getByText("Live sign translation")).toBeVisible();

  await page.getByRole("button", { name: "Words" }).click();
  await expect(page.getByText("Translation vocabulary")).toBeVisible();
  await expect(page.getByText("Signs the translator can speak")).toBeVisible();
});
