import { expect, test } from "@playwright/test";

test("loads recognizer and dataset routes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Sign to Speech MVP")).toBeVisible();
  await expect(page.getByText("Isolated-sign recognition MVP")).toBeVisible();

  await page.getByRole("button", { name: "Dataset" }).click();
  await expect(page.getByText("Dataset Collector")).toBeVisible();
  await expect(page.getByRole("button", { name: "Export Dataset" })).toBeDisabled();
});
