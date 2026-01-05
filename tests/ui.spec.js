import { test, expect } from '@playwright/test';

test.describe('UI Interactions', () => {

  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');

    // Check key elements
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[type="text"]').first()).toBeVisible(); // Search input
  });

  test('search input shows focused state with overlay', async ({ page }) => {
    await page.goto('/');

    // Find and click the search input
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.click();

    // Verify overlay appears
    await expect(page.locator('[data-testid="search-cancel-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-submit-button"]')).toBeVisible();
  });

  test('search autocomplete shows suggestions', async ({ page }) => {
    await page.goto('/');

    // Type in search input
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('electrical');

    // Wait for autocomplete results
    await page.waitForTimeout(500); // Give time for debouncing

    // Verify suggestions appear (services or subcategories)
    const suggestions = page.locator('[role="option"], button:has-text("Electrical")');
    await expect(suggestions.first()).toBeVisible({ timeout: 3000 });
  });

  test('clicking Cancel closes search overlay', async ({ page }) => {
    await page.goto('/');

    // Open search
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.click();

    // Verify overlay is open
    await expect(page.locator('text=Cancel')).toBeVisible();

    // Click Cancel
    await page.click('text=Cancel');

    // Verify overlay is closed (Cancel button should not be visible)
    await expect(page.locator('text=Cancel')).not.toBeVisible({ timeout: 2000 });
  });

  test('selecting a service filters the business list', async ({ page }) => {
    await page.goto('/');

    // Type in search and select a service
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('electrical');
    await page.waitForTimeout(500);

    // Click on a suggestion
    const firstSuggestion = page.locator('button:has-text("Electrical")').first();
    await firstSuggestion.click();

    // Verify filter badge appears
    await expect(page.locator('text=Clear filters')).toBeVisible({ timeout: 3000 });
  });

  test('clear filters button removes active filters', async ({ page }) => {
    await page.goto('/');

    // Apply a filter
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('electrical');
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Electrical")').first().click();

    // Verify filter is active
    await expect(page.locator('text=Clear filters')).toBeVisible();

    // Click clear filters
    await page.click('text=Clear filters');

    // Verify filter is removed
    await expect(page.locator('text=Clear filters')).not.toBeVisible({ timeout: 2000 });
  });

  test('navigation to business detail page works', async ({ page }) => {
    await page.goto('/');

    // Wait for business cards to load
    await page.waitForTimeout(1000);

    // Find and click a business card (if any exist)
    const businessCard = page.locator('article, [role="article"], div:has(h3)').first();
    const cardCount = await businessCard.count();

    if (cardCount > 0) {
      await businessCard.click();

      // Verify navigation occurred
      await expect(page).toHaveURL(/\/business\//);
    }
  });

  test('header shows correct branding', async ({ page }) => {
    await page.goto('/');

    // Check that header contains "Collective" branding
    await expect(page.locator('text=/.*Collective/')).toBeVisible();
  });

  test('mobile menu works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Find and click mobile menu button (hamburger)
    const menuButton = page.locator('button:has(svg)').filter({ hasText: '' }).first();
    await menuButton.click();

    // Verify mobile menu opens
    await expect(page.locator('text=Browse Professionals')).toBeVisible();
  });

  test('search persists text when overlay is opened and closed', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.locator('[data-testid="search-input"]');

    // Type something
    await searchInput.fill('plumber');

    // Open overlay by clicking
    await searchInput.click();

    // Verify overlay is open
    await expect(page.locator('[data-testid="search-cancel-button"]')).toBeVisible();

    // Close overlay
    await page.click('[data-testid="search-cancel-button"]');

    // Verify text is still there
    await expect(searchInput).toHaveValue('plumber');
  });
});
