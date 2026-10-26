import { test, expect } from "@playwright/test";

/**
 * Reproduces the failed UI-gate drive (Testing tab bug c92f41df):
 * submitting the property inquiry form with an empty name must render
 * the inline error "Please enter your name." — plus the same guard on
 * the contact and sell forms.
 */

const NAME_ERROR = "Please enter your name.";

test("property inquiry form shows name error on empty submit", async ({ page }) => {
  await page.goto("/property/palatial-5bhk-villa-with-private-pool-1");
  await expect(page.getByTestId("pd-inquiry")).toBeVisible();

  // The failed drive stopped here: submit with an empty name.
  await page.getByRole("button", { name: "Send Inquiry" }).click();

  const err = page.locator("#inq-name-err");
  await expect(err).toBeVisible();
  await expect(err).toHaveText(NAME_ERROR);

  // Fill the name and the error clears.
  await page.fill("#inq-name", "Test User");
  await expect(err).toHaveCount(0);
});

test("contact form shows name error on empty submit", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator("#contact-name-error")).toHaveText(NAME_ERROR);
});

test("sell form shows name error on empty submit", async ({ page }) => {
  await page.goto("/sell");
  await page.getByRole("button", { name: "Request a valuation" }).click();
  await expect(page.getByText(NAME_ERROR).first()).toBeVisible();
});

test("Schedule a Visit surfaces the name error on an empty form", async ({ page }) => {
  await page.goto("/property/palatial-5bhk-villa-with-private-pool-1");
  await expect(page.getByTestId("pd-inquiry")).toBeVisible();
  await page.getByRole("button", { name: "Schedule a Visit" }).click();
  const err = page.locator("#inq-name-err");
  await expect(err).toBeVisible();
  await expect(err).toHaveText(NAME_ERROR);
});

test("details page renders the required blocks", async ({ page }) => {
  await page.goto("/property/palatial-5bhk-villa-with-private-pool-1");
  await expect(page.getByTestId("pd-gallery")).toBeVisible();
  await expect(page.getByTestId("pd-specs")).toBeVisible();
  await expect(page.getByTestId("pd-amenities")).toBeVisible();
  await expect(page.getByTestId("pd-nearby")).toBeVisible();
  await expect(page.getByTestId("pd-agent")).toBeVisible();
  await expect(page.getByTestId("pd-inquiry")).toBeVisible();
  await expect(page.getByText(/Ref LX-/).first()).toBeVisible();
});
