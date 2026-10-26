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

/* The platform drive's exact path: navigate from the home page by card
 * TEXT, click the ACTIONS-BAR "Schedule a Visit" (not the form submit),
 * and assert the inline error — guards against the port/pointing drift
 * that once had these checks driving another app on :3000. */
test("drive path: home card -> actions-bar Schedule a Visit -> name error", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Palatial 5BHK Villa with Private Pool").first().click();
  await page.getByTestId("pd-inquiry").waitFor({ state: "attached" });
  await page.getByRole("button", { name: "Schedule a Visit" }).click();
  await expect(page.locator("#inq-name-err")).toHaveText(NAME_ERROR);
});

/* Clicks by TEXT exactly as the platform drive does (its step is
 * clickText, not a role selector) — the variant the harness may be
 * dispatching differently. */
test("drive path (text click): card text -> Schedule a Visit text -> name error", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Palatial 5BHK Villa with Private Pool").first().click();
  await page.getByTestId("pd-inquiry").waitFor({ state: "attached" });
  await page.getByText("Schedule a Visit").first().click();
  await expect(page.locator("#inq-name-err")).toHaveText(NAME_ERROR);
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
